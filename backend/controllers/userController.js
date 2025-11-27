const User = require('../models/user');
const Person = require('../models/person');
const Audit = require('../models/audit');
const Log = require('../models/Log');

// Configuración de permisos
const EDIT_PERMISSIONS = {
    user: ['direccion', 'celular', 'email'],
    admin: ['apellido1', 'apellido2', 'nombre1', 'nombre2', 'direccion', 'celular', 'email', 'grado', 'grupo', 'materias'],
    superadmin: ['*'] // Todos los campos editables
};

const IMMUTABLE_FIELDS = ['doc', 'tipoDoc', 'username', 'tipoPersona', '_id', 'id'];

// Función para verificar permisos de edición
const canEditField = (userRole, field, targetUserRole = null) => {
    // SuperAdmin puede editar todo excepto campos inmutables
    if (userRole === 'superadmin') {
        return !IMMUTABLE_FIELDS.includes(field);
    }
    
    // Admin no puede editar datos de otros admins o superadmins
    if (userRole === 'admin' && targetUserRole && ['admin', 'superadmin'].includes(targetUserRole)) {
        return false;
    }
    
    // Verificar si el campo está en los permisos del rol
    return EDIT_PERMISSIONS[userRole]?.includes(field) || EDIT_PERMISSIONS[userRole]?.includes('*');
};

// Función para verificar si un usuario puede editar a otro
const canEditUser = (editorRole, editorId, targetUserId, targetUserRole) => {
    // Usuarios pueden editarse a sí mismos (campos permitidos)
    if (editorId === targetUserId) {
        return true;
    }
    
    // Admin no puede editar otros admins o superadmins
    if (editorRole === 'admin' && ['admin', 'superadmin'].includes(targetUserRole)) {
        return false;
    }
    
    // SuperAdmin puede editar a todos
    if (editorRole === 'superadmin') {
        return true;
    }
    
    // Admin puede editar users
    if (editorRole === 'admin' && targetUserRole === 'user') {
        return true;
    }
    
    return false;
};

// @desc    Obtener todos los usuarios (con permisos)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        
        let query = { isActive: true };
        
        // Admin solo ve users, no otros admins ni superadmins
        if (userRole === 'admin') {
            query.role = 'user';
        }
        
        const users = await User.find(query)
            .populate('personRef')
            .select('-password')
            .sort({ username: 1 });
        
        // Esperar todas las promesas de getDetailedInfo en paralelo
        const usersWithPersonData = await Promise.all(
            users.map(async (user) => ({
                ...user.toObject(),
                person: user.personRef ? await user.personRef.getDetailedInfo() : null
            }))
        );
        
        // MOVER USUARIO LOGUEADO AL PRINCIPIO
        const loggedInUserIndex = usersWithPersonData.findIndex(user => user._id.toString() === userId);
        let orderedUsers = [...usersWithPersonData];
        
        if (loggedInUserIndex > 0) {
            const loggedInUser = orderedUsers.splice(loggedInUserIndex, 1)[0];
            orderedUsers.unshift(loggedInUser);
        }
        
        res.status(200).json({
            success: true,
            data: orderedUsers,
            count: orderedUsers.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// @desc    Obtener un usuario específico
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        const { id: targetUserId } = req.params;
        
        const targetUser = await User.findById(targetUserId)
            .populate('personRef')
            .select('-password');
            
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar permisos de visualización
        if (!canEditUser(userRole, userId, targetUserId, targetUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver este usuario'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                ...targetUser.toObject(),
                person: targetUser.personRef ? targetUser.personRef.getDetailedInfo() : null
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

// @desc    Actualizar datos de usuario/persona
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        const { id: targetUserId } = req.params;
        const updates = req.body;
        
        // Obtener usuario objetivo
        const targetUser = await User.findById(targetUserId).populate('personRef');
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar permisos generales
        if (!canEditUser(userRole, userId, targetUserId, targetUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para editar este usuario'
            });
        }
        
        // RESTRICCIÓN DE SEGURIDAD: Solo SuperAdmin Master puede editar a otros SuperAdmins Master
        if (targetUser.isMasterSuperAdmin && !req.user.isMasterSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Solo el SuperAdmin Master puede editar a otro SuperAdmin Master'
            });
        }
        
        // RESTRICCIÓN DE SEGURIDAD: Admins no pueden editar a SuperAdmins (incluido el Master)
        if (userRole === 'admin' && targetUser.role === 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Los administradores no pueden editar a SuperAdministradores'
            });
        }
        
        // Separar actualizaciones de User y Person
        const userUpdates = {};
        const personUpdates = {};
        const auditEntries = [];
        
        // Campos que van en el modelo User
        const userFields = ['role', 'isActive'];
        
        // Validar cada campo y permisos específicos
        for (const [field, newValue] of Object.entries(updates)) {
            // Verificar campos inmutables
            if (IMMUTABLE_FIELDS.includes(field)) {
                return res.status(400).json({
                    success: false,
                    message: `El campo '${field}' no puede ser modificado`
                });
            }
            
            // Verificar permisos específicos del campo
            if (!canEditField(userRole, field, targetUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: `No tienes permisos para editar el campo '${field}'`
                });
            }
            
            // Determinar si es campo de User o Person
            if (userFields.includes(field)) {
                const oldValue = targetUser[field];
                if (oldValue !== newValue) {
                    userUpdates[field] = newValue;
                    auditEntries.push({
                        field,
                        oldValue,
                        newValue,
                        action: 'UPDATE'
                    });
                }
            } else {
                // Campo de Person
                const oldValue = targetUser.personRef[field];
                if (oldValue !== newValue) {
                    personUpdates[field] = newValue;
                    auditEntries.push({
                        field,
                        oldValue,
                        newValue,
                        action: 'UPDATE'
                    });
                }
            }
        }
        
        // Validaciones especiales para grado/grupo
        if (personUpdates.grado || personUpdates.grupo) {
            if (targetUser.personRef.tipoPersona !== 'Estudiante') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo los estudiantes pueden tener grado y grupo'
                });
            }
        }
        
        // Realizar actualizaciones
        let updatedUser = targetUser;
        let updatedPerson = targetUser.personRef;
        
        if (Object.keys(userUpdates).length > 0) {
            updatedUser = await User.findByIdAndUpdate(
                targetUserId,
                userUpdates,
                { new: true, runValidators: true }
            );
        }
        
        if (Object.keys(personUpdates).length > 0) {
            updatedPerson = await Person.findByIdAndUpdate(
                targetUser.personRef._id,
                personUpdates,
                { new: true, runValidators: true }
            );
        }
        
        // Crear entradas de auditoría
        for (const auditData of auditEntries) {
            await Audit.createEntry({
                userId: userId,
                targetUserId: targetUserId,
                targetPersonId: targetUser.personRef._id,
                action: auditData.action,
                field: auditData.field,
                oldValue: auditData.oldValue,
                newValue: auditData.newValue,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                ...updatedUser.toObject(),
                person: updatedPerson ? updatedPerson.getDetailedInfo() : null
            },
            changesCount: auditEntries.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// @desc    Obtener historial de auditoría
// @route   GET /api/users/:id/audit
// @access  Private
const getUserAudit = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        const { id: targetUserId } = req.params;
        const { limit = 50 } = req.query;
        
        // Verificar permisos de auditoría
        if (userRole === 'user' && userId !== targetUserId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes ver tu propio historial'
            });
        }
        
        if (userRole === 'admin') {
            // Admin no puede ver auditoría de otros admins o superadmins
            const targetUser = await User.findById(targetUserId).select('role');
            if (targetUser && ['admin', 'superadmin'].includes(targetUser.role) && userId !== targetUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver este historial'
                });
            }
        }
        
        const auditHistory = await Audit.getByTargetUser(targetUserId, parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: auditHistory,
            count: auditHistory.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de auditoría',
            error: error.message
        });
    }
};

// @desc    Obtener auditoría completa del sistema (Solo SuperAdmin)
// @route   GET /api/users/audit/system
// @access  Private (SuperAdmin only)
const getSystemAudit = async (req, res) => {
    try {
        const { role: userRole } = req.user;
        const { limit = 100, startDate, endDate } = req.query;
        
        if (userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Solo el SuperAdministrador puede ver la auditoría completa'
            });
        }
        
        let auditHistory;
        
        if (startDate && endDate) {
            auditHistory = await Audit.getByDateRange(
                new Date(startDate),
                new Date(endDate)
            );
        } else {
            auditHistory = await Audit.getSystemAudit(parseInt(limit));
        }
        
        res.status(200).json({
            success: true,
            data: auditHistory,
            count: auditHistory.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener auditoría del sistema',
            error: error.message
        });
    }
};

const createUsersByGrade = async (req, res) => {
    try {
        const { role: userRole } = req.user;
        const { grado, tipoPersona = 'Estudiante', grupo } = req.body;

        // Solo SuperAdmin puede crear usuarios masivamente
        if (userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Solo el SuperAdministrador puede crear usuarios masivamente'
            });
        }

        if (!grado) {
            return res.status(400).json({
                success: false,
                message: 'El grado es requerido'
            });
        }

        // Construir consulta para buscar personas
        const query = {
            grado: grado,
            tipoPersona: tipoPersona,
            tieneCuenta: false,
            estado: { $ne: 'Vetado' },
            isActive: true
        };

        // Agregar filtro por grupo si se especifica
        if (grupo) {
            query.grupo = grupo;
        }

        // Silenciar debug en producción
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 [DEBUG] Consulta para buscar personas:', JSON.stringify(query, null, 2));
        }

        // Buscar personas del grado especificado que no tienen cuenta de usuario
        const personsWithoutAccount = await Person.find(query);

        // Silenciar debug en producción
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔍 [DEBUG] Personas encontradas sin cuenta: ${personsWithoutAccount.length}`);
        }

        if (personsWithoutAccount.length === 0) {
            const grupoText = grupo ? ` y grupo ${grupo}` : '';
            return res.status(200).json({
                success: true,
                message: `No hay personas del grado ${grado}${grupoText} (${tipoPersona}) sin cuenta de usuario`,
                createdCount: 0,
                skippedCount: 0,
                totalFound: 0
            });
        }

        // Debug: mostrar detalles de las primeras 3 personas encontradas
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 [DEBUG] Primeras 3 personas encontradas:');
            personsWithoutAccount.slice(0, 3).forEach((person, index) => {
                console.log(`  ${index + 1}. Doc: ${person.doc}, Nombre: ${person.nombre1} ${person.apellido1}, tieneCuenta: ${person.tieneCuenta}`);
            });
        }

        let createdCount = 0;
        let skippedCount = 0;
        const errors = [];
        const createdUsers = []; // Array para almacenar credenciales de usuarios creados

        // Crear usuarios para cada persona
        for (const person of personsWithoutAccount) {
            try {
                // Silenciar debug en producción
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`🔄 [DEBUG] Procesando persona: ${person.doc} - ${person.nombre1} ${person.apellido1}`);
                }

                // Verificar si ya existe un usuario con ese documento
                const existingUser = await User.findOne({
                    username: person.doc.toString()
                });

                if (existingUser) {
                    // Silenciar debug en producción
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`⏭️ [DEBUG] Usuario ya existe para documento ${person.doc}, omitiendo`);
                    }
                    skippedCount++;
                    continue;
                }

                // Silenciar debug en producción
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`✅ [DEBUG] Creando usuario para documento ${person.doc}`);
                }

                // Crear usuario con documento como username y contraseña por defecto
                const newUser = await User.create({
                    username: person.doc.toString(),
                    password: person.doc.toString(), // Contraseña por defecto es el documento
                    role: 'user',
                    personRef: person._id,
                    tipoPersona: person.tipoPersona,
                    grupo: person.grupo || null, // Copiar grupo de la persona
                    isActive: true,
                    mustChangePassword: true, // Obligar cambio en primer login
                    firstLogin: true,
                    createdBy: req.user.id
                });

                // Marcar la persona como que tiene cuenta
                await Person.findByIdAndUpdate(person._id, { tieneCuenta: true });

                // Registrar log de creación de usuario
                await Log.crear({
                    tipo: 'INFO',
                    categoria: 'USER',
                    accion: 'USER_CREATED',
                    descripcion: `Usuario creado para ${person.getNombreCompleto()} (${person.doc})`,
                    usuario: req.user.id,
                    usuarioNombre: req.user.username,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    datos: {
                        newUserId: newUser._id,
                        newUsername: newUser.username,
                        personId: person._id,
                        personName: person.getNombreCompleto(),
                        role: newUser.role,
                        grado: person.grado,
                        grupo: person.grupo
                    }
                });

                // Crear entrada de auditoría
                await Audit.createEntry({
                    userId: req.user.id,
                    targetUserId: newUser._id,
                    targetPersonId: person._id,
                    action: 'CREATE',
                    field: 'bulk_creation',
                    oldValue: null,
                    newValue: { grado, tipoPersona, grupo },
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                console.log(`✅ [DEBUG] Usuario creado exitosamente: ${newUser.username}`);
                createdCount++;

                // Guardar credenciales para mostrar al admin
                createdUsers.push({
                    nombre: `${person.nombre1} ${person.nombre2 || ''} ${person.apellido1} ${person.apellido2 || ''}`.trim(),
                    documento: person.doc.toString(),
                    username: person.doc.toString(),
                    password: person.doc.toString(), // Contraseña temporal
                    grupo: person.grupo || 'N/A',
                    tipoPersona: person.tipoPersona
                });

            } catch (error) {
                console.error(`❌ [DEBUG] Error creando usuario para persona ${person.doc}:`, error);
                errors.push({
                    personDoc: person.doc,
                    personName: `${person.nombre1} ${person.apellido1}`,
                    error: error.message
                });
                skippedCount++;
            }
        }

        // Si hubo errores de validación, devolver error
        if (errors.length > 0 && createdCount === 0) {
            const grupoText = grupo ? ` y grupo ${grupo}` : '';
            return res.status(400).json({
                success: false,
                message: `Error al crear usuarios. Todas las personas tuvieron errores de validación.`,
                errors: errors,
                totalFound: personsWithoutAccount.length,
                filters: { grado, tipoPersona, grupo }
            });
        }

        const grupoText = grupo ? ` y grupo ${grupo}` : '';
        
        // Silenciar debug en producción
        if (process.env.NODE_ENV !== 'production') {
            console.log(`📤 [DEBUG] Enviando respuesta con ${createdUsers.length} credenciales`);
            console.log(`📤 [DEBUG] Primeras 2 credenciales:`, createdUsers.slice(0, 2));
        }
        
        res.status(200).json({
            success: true,
            message: `Proceso completado. ${createdCount} usuarios creados, ${skippedCount} omitidos`,
            createdCount,
            skippedCount,
            createdUsers, // ⭐ Incluir credenciales de usuarios creados
            errors: errors.length > 0 ? errors : undefined,
            totalFound: personsWithoutAccount.length,
            filters: { grado, tipoPersona, grupo },
            debug: {
                query: query,
                personsFound: personsWithoutAccount.length,
                personsProcessed: createdCount + skippedCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear usuarios por grado',
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    updateUser,
    getUserAudit,
    getSystemAudit,
    createUsersByGrade
};
