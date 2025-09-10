// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Person = require('../models/person');

// Función para generar el token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '24h', // Expira en 24 horas
    });
};

// @desc    Registrar un nuevo usuario (solo para admin/superadmin)
// @route   POST /api/auth/register
// @access  Private (Admin/SuperAdmin)
const registerUser = async (req, res) => {
    const { personId, role = 'user', customUsername = null } = req.body;

    // Validación básica
    if (!personId) {
        return res.status(400).json({ 
            success: false,
            message: 'El ID de la persona es requerido' 
        });
    }

    try {
        // Verificar que la persona existe y está activa
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).json({ 
                success: false,
                message: 'Persona no encontrada' 
            });
        }

        if (person.estado === 'Vetado') {
            return res.status(400).json({ 
                success: false,
                message: 'No se puede crear usuario para persona vetada' 
            });
        }

        // Verificar si la persona ya tiene un usuario
        const existingUser = await User.findOne({ personRef: personId });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Esta persona ya tiene un usuario asignado' 
            });
        }

        // Generar username único
        const baseUsername = customUsername || person.generateUsernameBase();
        const username = await User.generateUniqueUsername(baseUsername);

        // Generar contraseña aleatoria
        const password = User.generateRandomPassword();

        // Crear usuario
        const user = await User.create({ 
            username, 
            password,
            role,
            personRef: personId,
            tipoPersona: person.tipoPersona
        });

        // Actualizar person para indicar que tiene cuenta
        person.tieneCuenta = true;
        await person.save();

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: {
                    user: {
                        _id: user._id,
                        username: user.username,
                        role: user.role,
                        tipoPersona: user.tipoPersona,
                        isActive: user.isActive,
                        fechaCreacion: user.fechaCreacion
                    },
                    person: person.getBasicInfo(),
                    credentials: {
                        username: user.username,
                        password: password, // Contraseña sin hashear para mostrar al admin
                        role: user.role
                    }
                }
            });
        } else {
            res.status(400).json({ 
                success: false,
                message: 'Error al crear el usuario' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    }
};

// @desc    Autenticar un usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    console.log('🔐 LOGIN ATTEMPT - Request body:', req.body);
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
        console.log('❌ LOGIN - Missing credentials');
        return res.status(400).json({ 
            success: false,
            message: 'Username y contraseña son requeridos' 
        });
    }

    try {
        console.log('🔍 LOGIN - Searching for user:', username.toLowerCase());
        // Buscar usuario y poblar información de la persona
        const user = await User.findOne({ username: username.toLowerCase() })
            .populate('personRef');

        console.log('👤 LOGIN - User found:', user ? 'YES' : 'NO');
        if (!user) {
            console.log('❌ LOGIN - User not found');
            return res.status(401).json({ 
                success: false,
                message: 'Credenciales inválidas' 
            });
        }

        console.log('✅ LOGIN - User details:', {
            id: user._id,
            username: user.username,
            isActive: user.isActive,
            hasPersonRef: !!user.personRef,
            personEstado: user.personRef?.estado
        });

        // Verificar que el usuario esté activo
        if (!user.isActive) {
            console.log('❌ LOGIN - User not active');
            return res.status(401).json({ 
                success: false,
                message: 'Usuario desactivado' 
            });
        }

        // Verificar que la persona asociada esté activa
        if (!user.personRef || user.personRef.estado === 'Vetado') {
            console.log('❌ LOGIN - Person not active or vetoed');
            return res.status(401).json({ 
                success: false,
                message: 'Acceso denegado' 
            });
        }

        console.log('🔑 LOGIN - Checking password...');
        // Verificar contraseña
        if (await user.matchPassword(password)) {
            console.log('✅ LOGIN - Password correct, updating last login...');
            // Actualizar último login
            await user.updateLastLogin();

            console.log('✅ LOGIN - Success, generating response...');
            res.json({
                success: true,
                message: 'Login exitoso',
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.personRef.getNombreCompleto(),
                    email: user.username + '@biblioteca.edu', // Email ficticio basado en username
                    role: user.role,
                    tipoPersona: user.tipoPersona,
                    username: user.username,
                    personInfo: user.personRef.getBasicInfo()
                }
            });
        } else {
            console.log('❌ LOGIN - Incorrect password');
            res.status(401).json({ 
                success: false,
                message: 'Credenciales inválidas' 
            });
        }
    } catch (error) {
        console.error('💥 LOGIN ERROR:', error);
        console.error('💥 LOGIN ERROR STACK:', error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    }
};

// @desc    Resetear contraseña de usuario (solo admin/superadmin)
// @route   PUT /api/auth/reset-password/:userId
// @access  Private (Admin/SuperAdmin)
const resetPassword = async (req, res) => {
    try {
        const { userId } = req.params;

        const targetUser = await User.findById(userId).populate('personRef');
        if (!targetUser) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        // Validar permisos jerárquicos
        const currentUserRole = req.user.role;
        const targetUserRole = targetUser.role;
        const isMasterSuperAdmin = req.user.isMasterSuperAdmin;

        // Matriz de permisos
        const canResetPassword = () => {
            // MasterSuperAdmin puede resetear cualquier contraseña
            if (currentUserRole === 'superadmin' && isMasterSuperAdmin) {
                return true;
            }
            
            // SuperAdmin normal puede resetear Admin y User, pero NO otros SuperAdmins
            if (currentUserRole === 'superadmin' && !isMasterSuperAdmin) {
                return targetUserRole === 'admin' || targetUserRole === 'user';
            }
            
            // Admin solo puede resetear Users
            if (currentUserRole === 'admin') {
                return targetUserRole === 'user';
            }
            
            return false;
        };

        if (!canResetPassword()) {
            return res.status(403).json({
                success: false,
                message: `No tienes permisos para resetear la contraseña de un ${targetUserRole}`
            });
        }

        // Evitar que se resetee su propia contraseña por este método
        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Usa el panel de perfil para cambiar tu propia contraseña'
            });
        }

        // Generar nueva contraseña
        const newPassword = targetUser.resetPassword();
        await targetUser.save();

        // Crear registro de auditoría
        const Audit = require('../models/audit');
        await Audit.create({
            userId: req.user._id,
            targetUserId: targetUser._id,
            targetPersonId: targetUser.personRef._id,
            action: 'PASSWORD_RESET',
            field: 'password',
            oldValue: 'encrypted_password',
            newValue: 'new_encrypted_password',
            reason: `Reseteo de contraseña por ${currentUserRole}`,
            performedAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Contraseña reseteada exitosamente',
            data: {
                username: targetUser.username,
                newPassword: newPassword, // Contraseña sin hashear para mostrar al admin
                resetCount: targetUser.passwordResetCount,
                person: targetUser.personRef?.getNombreCompleto(),
                resetBy: req.user.username
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al resetear contraseña', 
            error: error.message 
        });
    }
};

// @desc    Cambiar contraseña propia
// @route   PUT /api/auth/change-password
// @access  Private (Usuario autenticado)
const changeOwnPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isCurrentPasswordValid = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Cambiar contraseña
        user.password = newPassword;
        await user.save();

        // Crear registro de auditoría
        const Audit = require('../models/audit');
        await Audit.create({
            userId: req.user._id,
            targetUserId: req.user._id,
            targetPersonId: req.user.personRef,
            action: 'PASSWORD_RESET',
            field: 'password',
            oldValue: 'encrypted_password',
            newValue: 'new_encrypted_password',
            reason: 'Cambio de contraseña propio',
            performedAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Contraseña cambiada exitosamente',
            data: {
                username: user.username,
                changedAt: new Date()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// @desc    Crear múltiples usuarios por grado
// @route   POST /api/auth/register-by-grade
// @access  Private (Admin/SuperAdmin)
const registerUsersByGrade = async (req, res) => {
    const { grado, grupo = null, role = 'user' } = req.body;

    if (!grado) {
        return res.status(400).json({ 
            success: false,
            message: 'El grado es requerido' 
        });
    }

    try {
        // Buscar personas del grado especificado que no tengan cuenta
        const query = { 
            tipoPersona: 'Estudiante', 
            grado: grado,
            estado: { $ne: 'Vetado' },
            tieneCuenta: false
        };
        
        if (grupo) {
            query.grupo = grupo;
        }

        const persons = await Person.find(query);

        if (persons.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: `No se encontraron estudiantes del grado ${grado}${grupo ? ` grupo ${grupo}` : ''} sin cuenta` 
            });
        }

        if (persons.length > 40) {
            return res.status(400).json({ 
                success: false,
                message: `Demasiados estudiantes encontrados (${persons.length}). Máximo permitido: 40` 
            });
        }

        const createdUsers = [];
        const errors = [];

        // Crear usuarios en lote
        for (const person of persons) {
            try {
                const baseUsername = person.generateUsernameBase();
                const username = await User.generateUniqueUsername(baseUsername);
                const password = User.generateRandomPassword();

                const user = await User.create({
                    username,
                    password,
                    role,
                    personRef: person._id,
                    tipoPersona: person.tipoPersona
                });

                // Actualizar person
                person.tieneCuenta = true;
                await person.save();

                createdUsers.push({
                    persona: person.getNombreCompleto(),
                    documento: person.doc,
                    username: username,
                    password: password, // Sin hashear para mostrar al admin
                    role: role,
                    grado: person.grado,
                    grupo: person.grupo
                });

            } catch (userError) {
                errors.push({
                    persona: person.getNombreCompleto(),
                    error: userError.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `${createdUsers.length} usuarios creados exitosamente`,
            data: {
                createdUsers,
                totalCreated: createdUsers.length,
                totalErrors: errors.length,
                errors: errors.length > 0 ? errors : undefined
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

// @desc    Crear primer superadmin del sistema
// @route   POST /api/auth/create-superadmin
// @access  Public (solo si no existe ningún superadmin)
const createSuperAdmin = async (req, res) => {
    try {
        const { email, password, personData } = req.body;

        // Validar datos requeridos
        if (!email || !password || !personData) {
            return res.status(400).json({
                success: false,
                message: 'Email, password y personData son requeridos'
            });
        }

        // Validar email para superadmin
        await validateAdminEmail('superadmin', email);

        // Verificar límite de SuperAdministradores (máximo 3: Rector, Coordinadora, Secretaria)
        const superAdminCount = await User.countDocuments({ 
            role: 'superadmin', 
            isActive: true 
        });
        
        const MAX_SUPERADMINS = 3;
        if (superAdminCount >= MAX_SUPERADMINS) {
            return res.status(400).json({
                success: false,
                message: `Máximo ${MAX_SUPERADMINS} SuperAdministradores permitidos en el sistema (Rector, Coordinadora Académica, Secretaria General)`
            });
        }

        // Si ya existe al menos un SuperAdmin, verificar permisos del usuario actual
        if (superAdminCount > 0 && (!req.user || req.user.role !== 'superadmin' || !req.user.isMasterSuperAdmin)) {
            return res.status(403).json({
                success: false,
                message: 'Solo el MasterSuperAdministrador puede crear otros SuperAdministradores'
            });
        }

        // Verificar que no exista una persona con ese documento
        const existingPerson = await Person.findByDoc(personData.doc);
        if (existingPerson) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una persona con ese número de documento'
            });
        }

        // Crear la persona con email incluido
        const person = await Person.create({
            ...personData,
            email, // Agregar email a los datos de persona
            tipoPersona: 'Colaborador', // Forzar tipo colaborador para superadmin
            estado: 'Activo',
            tieneCuenta: true
        });

        // Actualizar persona para indicar que tiene cuenta
        person.tieneCuenta = true;
        await person.save();

        // Generar username único para el superadmin
        const username = await User.generateUniqueUsername(person.generateUsernameBase());

        // Crear el usuario superadmin
        const user = await User.create({
            username,
            password, // Se hashea automáticamente en el modelo
            role: 'superadmin',
            personRef: person._id,
            tipoPersona: person.tipoPersona,
            isActive: true
        });

        // Generar token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'SuperAdministrador creado exitosamente',
            token,
            data: {
                user: {
                    id: user._id,
                    email: person.email, // Obtener email de person
                    username: user.username,
                    role: user.role,
                    isActive: user.isActive
                },
                person: {
                    id: person._id,
                    nombre: person.getNombreCompleto(),
                    doc: person.doc,
                    tipoPersona: person.tipoPersona,
                    estado: person.estado
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear SuperAdministrador',
            error: error.message
        });
    }
};

// @desc    Crear administrador con datos de persona (solo superadmin)
// @route   POST /api/auth/create-admin-with-person
// @access  Private (SuperAdmin only)
const createAdminWithPerson = async (req, res) => {
    try {
        const adminData = req.body;
        
        console.log('🔧 createAdminWithPerson - Datos recibidos:', adminData);

        // Validar datos requeridos
        if (!adminData.username || !adminData.password || !adminData.doc || !adminData.nombre1 || !adminData.apellido1) {
            console.log('🔧 createAdminWithPerson - Faltan datos requeridos:', {
                username: !!adminData.username,
                password: !!adminData.password,
                doc: !!adminData.doc,
                nombre1: !!adminData.nombre1,
                apellido1: !!adminData.apellido1
            });
            return res.status(400).json({
                success: false,
                message: 'Username, password, documento, nombre y apellido son requeridos'
            });
        }

        // Verificar que no exista una persona con ese documento
        console.log('🔧 createAdminWithPerson - Buscando persona con doc:', adminData.doc);
        const existingPerson = await Person.findByDoc(adminData.doc);
        if (existingPerson) {
            console.log('🔧 createAdminWithPerson - Ya existe persona con ese documento');
            return res.status(400).json({
                success: false,
                message: 'Ya existe una persona con ese número de documento'
            });
        }

        // Verificar que no exista un usuario con ese username
        console.log('🔧 createAdminWithPerson - Buscando usuario con username:', adminData.username);
        const existingUser = await User.findOne({ username: adminData.username.toLowerCase() });
        if (existingUser) {
            console.log('🔧 createAdminWithPerson - Ya existe usuario con ese username');
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con ese nombre de usuario'
            });
        }

        console.log('🔧 createAdminWithPerson - Creando persona...');

        console.log('🔧 createAdminWithPerson - Creando persona...');
        // Crear la persona
        const person = await Person.create({
            doc: adminData.doc,
            tipoDoc: adminData.tipoDoc || 'CC',
            apellido1: adminData.apellido1,
            apellido2: adminData.apellido2 || '',
            nombre1: adminData.nombre1,
            nombre2: adminData.nombre2 || '',
            genero: adminData.genero || 'M',
            tipoPersona: 'Colaborador', // Los admins son colaboradores
            estado: 'Activo',
            tieneCuenta: true,
            telefono: adminData.telefono || '',
            email: adminData.email || ''
        });
        
        console.log('🔧 createAdminWithPerson - Persona creada:', person._id);

        // Crear el usuario admin
        console.log('🔧 createAdminWithPerson - Creando usuario...');
        const user = await User.create({
            username: adminData.username.toLowerCase(),
            password: adminData.password,
            role: 'admin',
            personRef: person._id,
            tipoPersona: person.tipoPersona,
            isActive: true,
            tieneCuenta: true
        });
        
        console.log('🔧 createAdminWithPerson - Usuario creado:', user._id);

        res.status(201).json({
            success: true,
            message: 'Administrador creado exitosamente',
            data: {
                user: user.getUserInfo(),
                person: person.getBasicInfo()
            }
        });

    } catch (error) {
        console.error('🔧 createAdminWithPerson - Error capturado:', error);
        console.error('🔧 createAdminWithPerson - Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al crear administrador',
            error: error.message
        });
    }
};

// @desc    Crear administrador (solo superadmin)
// @route   POST /api/auth/create-admin
// @access  Private (SuperAdmin only)
const createAdmin = async (req, res) => {
    try {
        const { email, password, personId } = req.body;

        // Validar datos
        if (!email || !password || !personId) {
            return res.status(400).json({
                success: false,
                message: 'Email, password y personId son requeridos'
            });
        }

        // Verificar que la persona existe
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).json({
                success: false,
                message: 'Persona no encontrada'
            });
        }

        if (person.tieneCuenta) {
            return res.status(400).json({
                success: false,
                message: 'Esta persona ya tiene una cuenta de usuario'
            });
        }

        // Validar email para admin
        await validateAdminEmail('admin', email, personId);

        // Actualizar email en la persona si se proporciona
        if (email) {
            person.email = email;
            await person.save();
        }

        // Generar username único
        const username = await User.generateUniqueUsername(person.generateUsernameBase());

        // Crear admin
        const user = await User.create({
            username,
            password,
            role: 'admin',
            personRef: personId,
            tipoPersona: person.tipoPersona,
            isActive: true
        });

        // Actualizar persona
        person.tieneCuenta = true;
        await person.save();

        res.status(201).json({
            success: true,
            message: 'Administrador creado exitosamente',
            data: {
                user: user.getUserInfo(),
                person: person.getBasicInfo()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear administrador',
            error: error.message
        });
    }
};

// @desc    Obtener información del usuario actual
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('personRef')
            .select('-password');

        res.status(200).json({
            success: true,
            data: {
                user: user.getUserInfo(),
                person: user.personRef ? user.personRef.getDetailedInfo() : null
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del usuario',
            error: error.message
        });
    }
};

// @desc    Crear SuperAdministrador adicional (solo superadmin existente)
// @route   POST /api/auth/create-additional-superadmin
// @access  Private (SuperAdmin only)
const createAdditionalSuperAdmin = async (req, res) => {
    try {
        const { email, password, personData, confirmation } = req.body;

        // Validar datos requeridos
        if (!email || !password || !personData) {
            return res.status(400).json({
                success: false,
                message: 'Email, password y personData son requeridos'
            });
        }

        // Verificar confirmación explícita
        if (!confirmation || confirmation !== 'CREATE_SUPERADMIN_CONFIRMED') {
            return res.status(400).json({
                success: false,
                message: 'Se requiere confirmación explícita para crear SuperAdministrador'
            });
        }

        // Solo SuperAdmin puede crear otro SuperAdmin
        if (!req.user || req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Solo un SuperAdministrador puede crear otro SuperAdministrador'
            });
        }

        // Validar email para superadmin
        await validateAdminEmail('superadmin', email);

        // Verificar límite de SuperAdministradores
        const superAdminCount = await User.countDocuments({ 
            role: 'superadmin', 
            isActive: true 
        });
        
        const MAX_SUPERADMINS = 3;
        if (superAdminCount >= MAX_SUPERADMINS) {
            return res.status(400).json({
                success: false,
                message: `Máximo ${MAX_SUPERADMINS} SuperAdministradores permitidos (Rector: ${1}, Coordinadora Académica: ${2}, Secretaria General: ${3})`
            });
        }

        // Verificar que no exista una persona con ese documento
        const existingPerson = await Person.findByDoc(personData.doc);
        if (existingPerson) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una persona con ese número de documento'
            });
        }

        // Crear la persona con email incluido
        const person = await Person.create({
            ...personData,
            email, // Agregar email a los datos de persona
            tipoPersona: 'Colaborador', // Forzar tipo colaborador para superadmin
            estado: 'Activo',
            tieneCuenta: true
        });

        // Actualizar persona para indicar que tiene cuenta
        person.tieneCuenta = true;
        await person.save();

        // Generar username único para el superadmin
        const username = await User.generateUniqueUsername(person.generateUsernameBase());

        // Crear el usuario superadmin
        const user = await User.create({
            username,
            password, // Se hashea automáticamente en el modelo
            role: 'superadmin',
            personRef: person._id,
            tipoPersona: person.tipoPersona,
            isActive: true
        });

        // Crear entrada de auditoría
        const Audit = require('../models/audit');
        await Audit.createEntry({
            userId: req.user.id,
            targetUserId: user._id,
            targetPersonId: person._id,
            action: 'CREATE',
            comment: `SuperAdministrador creado por ${req.user.username}`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Generar token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: `SuperAdministrador ${superAdminCount + 1}/3 creado exitosamente`,
            token,
            data: {
                user: {
                    id: user._id,
                    email: person.email, // Obtener email de person
                    username: user.username,
                    role: user.role,
                    isActive: user.isActive
                },
                person: {
                    id: person._id,
                    nombre: person.getNombreCompleto(),
                    doc: person.doc,
                    tipoPersona: person.tipoPersona,
                    estado: person.estado
                },
                superAdminCount: superAdminCount + 1,
                maxSuperAdmins: MAX_SUPERADMINS
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear SuperAdministrador adicional',
            error: error.message
        });
    }
};

// Función de validación para roles administrativos
const validateAdminEmail = async (role, email, personId = null) => {
    // SuperAdmin y Admin DEBEN tener email
    if ((role === 'superadmin' || role === 'admin') && !email) {
        throw new Error(`Los ${role}s deben tener un email válido`);
    }
    
    // Si se proporciona email, verificar que no esté en uso
    if (email) {
        const existingPersonWithEmail = await Person.findOne({ 
            email,
            ...(personId && { _id: { $ne: personId } }) // Excluir la misma persona si es actualización
        });
        
        if (existingPersonWithEmail) {
            throw new Error('Ya existe una persona con ese email');
        }
    }
    
    return true;
};

// @desc    Crear cualquier tipo de usuario (Universal)
// @route   POST /api/auth/create-user
// @access  Private (Admin/SuperAdmin con permisos específicos)
const createUser = async (req, res) => {
    try {
        const { personId, customUsername, role = 'user' } = req.body;

        // Validaciones básicas
        if (!personId) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la persona es requerido'
            });
        }

        // Validar rol solicitado
        const validRoles = ['user', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Roles permitidos: user, admin, superadmin'
            });
        }

        // Verificar permisos según el rol a crear
        if (role === 'superadmin') {
            // Solo MasterSuperAdmin puede crear SuperAdmins
            if (req.user.role !== 'superadmin' || !req.user.isMasterSuperAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el MasterSuperAdministrador puede crear SuperAdministradores'
                });
            }

            // Verificar límite de SuperAdmins
            const superAdminCount = await User.countDocuments({ 
                role: 'superadmin', 
                isActive: true 
            });
            
            const MAX_SUPERADMINS = 3;
            if (superAdminCount >= MAX_SUPERADMINS) {
                return res.status(400).json({
                    success: false,
                    message: `Máximo ${MAX_SUPERADMINS} SuperAdministradores permitidos (Rector, Coordinadora Académica, Secretaria General)`
                });
            }
        } else if (role === 'admin') {
            // SuperAdmins y Admins pueden crear Admins
            if (!['superadmin', 'admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo SuperAdministradores y Administradores pueden crear Administradores'
                });
            }
        }
        // Para usuarios normales, cualquier admin+ puede crearlos

        // Buscar la persona
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).json({
                success: false,
                message: 'Persona no encontrada'
            });
        }

        // Verificar que la persona no esté vetada
        if (person.estado === 'Vetado') {
            return res.status(400).json({
                success: false,
                message: 'No se puede crear cuenta para persona vetada'
            });
        }

        // Verificar que la persona no tenga cuenta ya
        if (person.tieneCuenta) {
            return res.status(400).json({
                success: false,
                message: 'Esta persona ya tiene una cuenta de usuario'
            });
        }

        // Generar username único
        const baseUsername = customUsername || person.generateUsernameBase();
        const username = await User.generateUniqueUsername(baseUsername);

        // Generar contraseña aleatoria
        const password = User.generateRandomPassword();

        // Crear usuario
        const user = await User.create({ 
            username, 
            password,
            role,
            personRef: personId,
            tipoPersona: person.tipoPersona,
            isMasterSuperAdmin: false // Solo false por defecto, el script inicial maneja el true
        });

        // Actualizar person para indicar que tiene cuenta
        person.tieneCuenta = true;
        await person.save();

        // Crear registro de auditoría
        const Audit = require('../models/audit');
        await Audit.createEntry({
            action: 'CREATE_USER',
            targetType: 'User',
            targetId: user._id,
            performedBy: req.user._id,
            details: {
                username: user.username,
                role: user.role,
                tipoPersona: user.tipoPersona,
                createdFor: person.getNombreCompleto(),
                createdByRole: req.user.role
            }
        });

        // Mensaje específico según el rol creado
        let successMessage = 'Usuario creado exitosamente';
        if (role === 'superadmin') {
            successMessage = '⚠️ SuperAdministrador creado exitosamente';
        } else if (role === 'admin') {
            successMessage = '🔧 Administrador creado exitosamente';
        }

        res.status(201).json({
            success: true,
            message: successMessage,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    role: user.role,
                    tipoPersona: user.tipoPersona,
                    isActive: user.isActive,
                    fechaCreacion: user.fechaCreacion
                },
                person: person.getBasicInfo(),
                credentials: {
                    username: user.username,
                    password: password, // Contraseña sin hashear para mostrar al admin
                    role: user.role
                }
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    }
};

// @desc    Crear usuario con datos de persona (universal - cualquier rol)
// @route   POST /api/auth/create-user-with-person
// @access  Private (Admin/SuperAdmin con permisos específicos)
const createUserWithPerson = async (req, res) => {
    try {
        const userData = req.body;
        
        console.log('🔧 createUserWithPerson - Datos recibidos:', userData);

        // Validar datos requeridos
        if (!userData.username || !userData.password || !userData.doc || !userData.nombre1 || !userData.apellido1 || !userData.role) {
            console.log('🔧 createUserWithPerson - Faltan datos requeridos');
            return res.status(400).json({
                success: false,
                message: 'Username, password, documento, nombre, apellido y rol son requeridos'
            });
        }

        // Validar rol solicitado
        const validRoles = ['user', 'admin', 'superadmin'];
        if (!validRoles.includes(userData.role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Roles permitidos: user, admin, superadmin'
            });
        }

        // Verificar permisos según el rol a crear
        if (userData.role === 'superadmin') {
            // Solo MasterSuperAdmin puede crear SuperAdmins
            if (req.user.role !== 'superadmin' || !req.user.isMasterSuperAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el MasterSuperAdministrador puede crear SuperAdministradores'
                });
            }

            // Verificar límite de SuperAdmins
            const superAdminCount = await User.countDocuments({ 
                role: 'superadmin', 
                isActive: true 
            });
            
            const MAX_SUPERADMINS = 3;
            if (superAdminCount >= MAX_SUPERADMINS) {
                return res.status(400).json({
                    success: false,
                    message: `Máximo ${MAX_SUPERADMINS} SuperAdministradores permitidos (Rector, Coordinadora Académica, Secretaria General)`
                });
            }
        } else if (userData.role === 'admin') {
            // SuperAdmins y Admins pueden crear Admins
            if (!['superadmin', 'admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo SuperAdministradores y Administradores pueden crear Administradores'
                });
            }
        }

        // Verificar que no exista una persona con ese documento
        console.log('🔧 createUserWithPerson - Buscando persona con doc:', userData.doc);
        const existingPerson = await Person.findByDoc(userData.doc);
        if (existingPerson) {
            console.log('🔧 createUserWithPerson - Ya existe persona con ese documento');
            return res.status(400).json({
                success: false,
                message: 'Ya existe una persona con ese número de documento'
            });
        }

        // Verificar que no exista un usuario con ese username
        console.log('🔧 createUserWithPerson - Buscando usuario con username:', userData.username);
        const existingUser = await User.findOne({ username: userData.username.toLowerCase() });
        if (existingUser) {
            console.log('🔧 createUserWithPerson - Ya existe usuario con ese username');
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con ese nombre de usuario'
            });
        }

        console.log('🔧 createUserWithPerson - Creando persona...');
        
        // Determinar tipoPersona basado en el rol y datos proporcionados
        let tipoPersona = userData.tipoPersona || 'Colaborador';
        if (userData.role === 'superadmin' || userData.role === 'admin') {
            tipoPersona = 'Colaborador';
        }

        // Crear la persona
        const person = await Person.create({
            doc: userData.doc,
            tipoDoc: userData.tipoDoc || 'CC',
            apellido1: userData.apellido1,
            apellido2: userData.apellido2 || '',
            nombre1: userData.nombre1,
            nombre2: userData.nombre2 || '',
            genero: userData.genero || 'Masculino',
            fechaNacimiento: userData.fechaNacimiento || null,
            direccion: userData.direccion || '',
            celular: userData.celular || '',
            email: userData.email || '',
            tipoPersona: tipoPersona,
            // Campos específicos para estudiantes
            ...(tipoPersona === 'Estudiante' && {
                grado: userData.grado || '',
                grupo: userData.grupo || ''
            }),
            // Campos específicos para profesores
            ...(tipoPersona === 'Profesor' && {
                nivelEducativo: userData.nivelEducativo || 'General',
                materias: userData.materias || []
            }),
            estado: 'Activo',
            tieneCuenta: true,
            observaciones: userData.observaciones || ''
        });
        
        console.log('🔧 createUserWithPerson - Persona creada:', person._id);

        // Crear el usuario
        console.log('🔧 createUserWithPerson - Creando usuario...');
        const user = await User.create({
            username: userData.username.toLowerCase(),
            password: userData.password,
            role: userData.role,
            personRef: person._id,
            tipoPersona: person.tipoPersona,
            isActive: true,
            isMasterSuperAdmin: false // Solo false por defecto
        });
        
        console.log('🔧 createUserWithPerson - Usuario creado:', user._id);

        // Crear registro de auditoría
        const Audit = require('../models/audit');
        await Audit.create({
            userId: req.user._id,
            targetUserId: user._id,
            targetPersonId: person._id,
            action: 'CREATE',
            field: 'user_and_person',
            oldValue: null,
            newValue: {
                username: user.username,
                role: user.role,
                personName: person.nombre1 + ' ' + person.apellido1
            },
            reason: `Creación de usuario completo con rol ${userData.role}`,
            performedAt: new Date()
        });

        // Mensaje específico según el rol creado
        let successMessage = 'Usuario y persona creados exitosamente';
        if (userData.role === 'superadmin') {
            successMessage = '⚠️ SuperAdministrador y persona creados exitosamente';
        } else if (userData.role === 'admin') {
            successMessage = '🔧 Administrador y persona creados exitosamente';
        }

        res.status(201).json({
            success: true,
            message: successMessage,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    role: user.role,
                    tipoPersona: user.tipoPersona,
                    isActive: user.isActive,
                    fechaCreacion: user.fechaCreacion
                },
                person: person.getBasicInfo(),
                credentials: {
                    username: user.username,
                    password: userData.password, // Contraseña sin hashear para mostrar
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('🔧 createUserWithPerson - Error capturado:', error);
        console.error('🔧 createUserWithPerson - Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario y persona',
            error: error.message
        });
    }
};

module.exports = {
    registerUser, 
    loginUser, 
    resetPassword,
    changeOwnPassword, 
    registerUsersByGrade,
    createSuperAdmin,
    createAdditionalSuperAdmin,
    createAdmin,
    createAdminWithPerson,
    createUser,
    createUserWithPerson,
    getMe
};