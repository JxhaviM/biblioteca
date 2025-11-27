const mongoose = require('mongoose');

// Usar mongoose.models para acceder a modelos ya registrados
// Esto evita el error "Cannot overwrite model"
const User = mongoose.models.User || require('../models/User');
const Person = mongoose.models.Person || require('../models/Person');
const Log = mongoose.models.Log || require('../models/Log');
const Loan = mongoose.models.Loan || require('../models/Loan');
const Config = mongoose.models.Config || require('../models/Config');

// Crear backup de la base de datos
exports.createBackup = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        // Obtener todas las colecciones principales
        const [users, persons, logs, loans] = await Promise.all([
            User.find().populate('personRef').lean(),
            Person.find().lean(),
            Log.find().sort({ createdAt: -1 }).limit(10000).lean(), // Últimos 10000 logs
            Loan.find().populate('userId bookId').lean()
        ]);

        const backup = {
            metadata: {
                fecha: new Date().toISOString(),
                version: '1.0',
                generadoPor: user.username,
                totalRegistros: {
                    usuarios: users.length,
                    personas: persons.length,
                    logs: logs.length,
                    prestamos: loans.length
                }
            },
            data: {
                users,
                persons,
                logs,
                loans
            }
        };

        // Registrar en logs
        await Log.crear({
            tipo: 'INFO',
            categoria: 'BACKUP',
            accion: 'BACKUP_CREATED',
            descripcion: `Backup de base de datos creado por ${user.username}`,
            usuario: userId,
            usuarioNombre: user.username,
            ip: req.ip,
            datos: {
                totalRegistros: backup.metadata.totalRegistros
            }
        });

        res.json({
            success: true,
            backup
        });
    } catch (error) {
        console.error('Error al crear backup:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear backup de la base de datos',
            error: error.message
        });
    }
};

// Obtener logs del sistema
exports.getLogs = async (req, res) => {
    try {
        const {
            tipo,
            categoria,
            limite = 100,
            pagina = 1,
            buscar
        } = req.query;

        const query = {};
        
        if (tipo && tipo !== 'all') query.tipo = tipo;
        if (categoria && categoria !== 'all') query.categoria = categoria;
        if (buscar) {
            query.$or = [
                { accion: { $regex: buscar, $options: 'i' } },
                { descripcion: { $regex: buscar, $options: 'i' } },
                { usuarioNombre: { $regex: buscar, $options: 'i' } }
            ];
        }

        const skip = (parseInt(pagina) - 1) * parseInt(limite);

        const [logs, total] = await Promise.all([
            Log.find(query)
                .populate('usuario', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limite))
                .lean(),
            Log.countDocuments(query)
        ]);

        res.json({
            success: true,
            logs,
            pagination: {
                total,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil(total / parseInt(limite))
            }
        });
    } catch (error) {
        console.error('Error al obtener logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logs del sistema',
            error: error.message
        });
    }
};

// Obtener estadísticas de logs
exports.getLogStats = async (req, res) => {
    try {
        const [
            totalLogs,
            logsPorTipo,
            logsPorCategoria,
            logsRecientes
        ] = await Promise.all([
            Log.countDocuments(),
            Log.aggregate([
                { $group: { _id: '$tipo', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Log.aggregate([
                { $group: { _id: '$categoria', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Log.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('usuario', 'username')
                .lean()
        ]);

        res.json({
            success: true,
            stats: {
                total: totalLogs,
                porTipo: logsPorTipo,
                porCategoria: logsPorCategoria,
                recientes: logsRecientes
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// Obtener configuración global del sistema
exports.getConfig = async (req, res) => {
    try {
        // Obtener configuraciones desde la base de datos o usar valores por defecto
        const config = {
            sistema: {
                nombre: await Config.obtenerOCrear('sistema.nombre', 'Sistema de Biblioteca', 'Nombre del sistema', 'string'),
                version: '1.0.0', // Esto no se debe editar
                mantenimiento: await Config.obtenerOCrear('sistema.mantenimiento', false, 'Modo mantenimiento', 'boolean')
            },
            prestamos: {
                diasMaximo: await Config.obtenerOCrear('prestamos.diasMaximo', 15, 'Días máximo de préstamo', 'number'),
                multaDiaria: await Config.obtenerOCrear('prestamos.multaDiaria', 1000, 'Multa diaria por día de atraso', 'number'),
                maximoPorUsuario: await Config.obtenerOCrear('prestamos.maximoPorUsuario', 3, 'Máximo de préstamos simultáneos', 'number')
            },
            usuarios: {
                cambiarPasswordPrimeraVez: await Config.obtenerOCrear('usuarios.cambiarPasswordPrimeraVez', true, 'Obligar cambio de contraseña', 'boolean'),
                intentosMaximos: await Config.obtenerOCrear('usuarios.intentosMaximos', 5, 'Intentos máximos de login', 'number'),
                duracionSesion: await Config.obtenerOCrear('usuarios.duracionSesion', 24, 'Duración de sesión en horas', 'number')
            },
            personas: {
                itemsPorPagina: await Config.obtenerOCrear('personas.itemsPorPagina', 30, 'Items por página', 'number'),
                permitirDuplicados: await Config.obtenerOCrear('personas.permitirDuplicados', false, 'Permitir documentos duplicados', 'boolean')
            },
            email: {
                notificaciones: await Config.obtenerOCrear('email.notificaciones', true, 'Enviar notificaciones por email', 'boolean'),
                recordatorios: await Config.obtenerOCrear('email.recordatorios', true, 'Enviar recordatorios de préstamos', 'boolean')
            },
            footer: {
                logo: await Config.obtenerOCrear('footer.logo', '', 'Logo del footer (URL)', 'string'),
                desarrolladoPor: await Config.obtenerOCrear('footer.desarrolladoPor', '1102 PROM 2025', 'Texto del desarrollado por', 'string'),
                anio: await Config.obtenerOCrear('footer.anio', '2025', 'Año del copyright', 'string'),
                institucion: await Config.obtenerOCrear('footer.institucion', 'I.E. San Pedro Claver', 'Nombre de la institución', 'string'),
                mostrarLogo: await Config.obtenerOCrear('footer.mostrarLogo', true, 'Mostrar logo en footer', 'boolean')
            }
        };

        res.json({
            success: true,
            config
        });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración',
            error: error.message
        });
    }
};

// Obtener sesiones activas
exports.getActiveSessions = async (req, res) => {
    try {
        const {
            role,
            active = 'true',
            search,
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        
        // Construir query para usuarios con login reciente (últimas 24 horas)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        let userQuery = {
            lastLogin: { $gte: twentyFourHoursAgo },
            isActive: true
        };
        
        if (role && role !== 'all') {
            userQuery.role = role;
        }
        
        if (active !== 'all') {
            userQuery.isActive = active === 'true';
        }
        
        if (search) {
            userQuery.$or = [
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(userQuery)
                .populate('personRef', 'nombre1 apellido1 nombreCompleto')
                .sort({ lastLogin: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(userQuery)
        ]);

        // Formatear sesiones
        const sessions = users.map(user => {
            const isActive = (Date.now() - new Date(user.lastLogin).getTime()) < 30 * 60 * 1000; // Activo si actividad en últimos 30 min
            
            return {
                _id: user._id,
                userId: user._id,
                username: user.username,
                userRole: user.role,
                personName: user.personRef?.nombreCompleto || 'N/A',
                ip: '192.168.1.' + Math.floor(Math.random() * 200) + 100, // Simulación - en producción esto vendría de tracking real
                userAgent: 'Mozilla/5.0 (Simulated)', // Simulación
                loginTime: user.lastLogin,
                lastActivity: user.lastLogin,
                isActive: isActive,
                sessionId: `sess_${user._id.toString().slice(-6)}`,
                location: {
                    country: 'Colombia',
                    city: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'][Math.floor(Math.random() * 4)]
                }
            };
        });

        res.json({
            success: true,
            sessions,
            pagination: {
                total,
                pagina: parseInt(page),
                limite: parseInt(limit),
                totalPaginas: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error al obtener sesiones activas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesiones activas',
            error: error.message
        });
    }
};

// Obtener estadísticas de sesiones
exports.getSessionStats = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [
            totalSessions,
            activeSessions,
            superadminSessions,
            adminSessions,
            userSessions
        ] = await Promise.all([
            User.countDocuments({ lastLogin: { $gte: twentyFourHoursAgo } }),
            User.countDocuments({ 
                lastLogin: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
                isActive: true 
            }),
            User.countDocuments({ 
                role: 'superadmin',
                lastLogin: { $gte: twentyFourHoursAgo }
            }),
            User.countDocuments({ 
                role: 'admin',
                lastLogin: { $gte: twentyFourHoursAgo }
            }),
            User.countDocuments({ 
                role: 'user',
                lastLogin: { $gte: twentyFourHoursAgo }
            })
        ]);

        res.json({
            success: true,
            stats: {
                totalSessions,
                activeSessions,
                superadminSessions,
                adminSessions,
                userSessions
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de sesiones',
            error: error.message
        });
    }
};

// Terminar sesión de usuario
exports.terminateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Extraer userId del sessionId
        const userId = sessionId.replace('sess_', '');
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }

        // Desactivar usuario forzando logout
        user.isActive = false;
        await user.save();

        // Registrar log
        await Log.crear({
            tipo: 'SECURITY',
            categoria: 'AUTH',
            accion: 'SESSION_TERMINATED',
            descripcion: `Sesión terminada por administrador: ${user.username}`,
            usuario: user._id,
            usuarioNombre: user.username,
            ip: req.ip,
            datos: { 
                terminatedBy: req.user.username,
                sessionId: sessionId
            }
        });

        // Reactivar después de 5 segundos (forzar re-login)
        setTimeout(async () => {
            user.isActive = true;
            await user.save();
        }, 5000);

        res.json({
            success: true,
            message: 'Sesión terminada exitosamente'
        });
    } catch (error) {
        console.error('Error al terminar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al terminar sesión',
            error: error.message
        });
    }
};

// Obtener configuración del footer (pública)
exports.getFooterConfig = async (req, res) => {
    try {
        const footerConfig = {
            logo: await Config.obtenerOCrear('footer.logo', '', 'Logo del footer (URL)', 'string'),
            desarrolladoPor: await Config.obtenerOCrear('footer.desarrolladoPor', '1102 PROM 2025', 'Texto del desarrollado por', 'string'),
            anio: await Config.obtenerOCrear('footer.anio', '2025', 'Año del copyright', 'string'),
            institucion: await Config.obtenerOCrear('footer.institucion', 'I.E. San Pedro Claver', 'Nombre de la institución', 'string'),
            mostrarLogo: await Config.obtenerOCrear('footer.mostrarLogo', true, 'Mostrar logo en footer', 'boolean')
        };

        res.json({
            success: true,
            footer: footerConfig
        });
    } catch (error) {
        console.error('Error al obtener configuración del footer:', error);
        // En caso de error, devolver valores por defecto
        res.json({
            success: true,
            footer: {
                logo: '',
                desarrolladoPor: '1102 PROM 2025',
                anio: '2025',
                institucion: 'I.E. San Pedro Claver',
                mostrarLogo: true
            }
        });
    }
};

// Actualizar configuración global
exports.updateConfig = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        const { seccion, datos } = req.body;

        // Actualizar cada configuración en la base de datos
        const promesas = [];
        for (const [campo, valor] of Object.entries(datos)) {
            const clave = `${seccion}.${campo}`;
            promesas.push(Config.actualizar(clave, valor, userId));
        }

        await Promise.all(promesas);
        
        // Registrar en logs
        await Log.crear({
            tipo: 'INFO',
            categoria: 'CONFIG',
            accion: 'CONFIG_UPDATED',
            descripcion: `Configuración actualizada: ${seccion} por ${user.username}`,
            usuario: userId,
            usuarioNombre: user.username,
            ip: req.ip,
            datos: { seccion, cambios: datos }
        });

        res.json({
            success: true,
            message: 'Configuración actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración',
            error: error.message
        });
    }
};
