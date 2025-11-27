const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: [50, 'El username no puede exceder 50 caracteres']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minLength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    role: {
        type: mongoose.Schema.Types.Mixed, // Permite tanto String (sistema antiguo) como ObjectId (sistema nuevo)
        required: [true, 'El rol es requerido']
    },
    isMasterSuperAdmin: {
        type: Boolean,
        default: false
    },
    personRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: function() {
            // Solo es requerido si no es Master SuperAdmin
            return !this.isMasterSuperAdmin;
        }
    },
    tipoPersona: {
        type: String,
        required: function() {
            // Solo es requerido si no es Master SuperAdmin
            return !this.isMasterSuperAdmin;
        },
        enum: {
            values: ['Estudiante', 'Profesor', 'Colaborador', 'Publico'],
            message: 'El tipo de persona debe ser: Estudiante, Profesor, Colaborador o Publico'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    specialPermissions: {
        canChangeBookImages: {
            type: Boolean,
            default: false
        }
    },
    profileImage: {
        type: String,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    },
    passwordResetCount: {
        type: Number,
        default: 0
    },
    mustChangePassword: {
        type: Boolean,
        default: false // Se activa cuando un admin resetea la contraseña o es primer login
    },
    firstLogin: {
        type: Boolean,
        default: true // Se marca como false después del primer login
    },
    grupo: {
        type: String,
        default: null // Grupo académico (10-A, 11-B, etc.) - copiado de Person
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
// Note: username ya tiene unique: true en el schema, no necesita índice adicional
UserSchema.index({ personRef: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ tipoPersona: 1, isActive: 1 });

// Middleware para hashear contraseña antes de guardar
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Método para generar contraseña aleatoria (6 caracteres alfanuméricos)
UserSchema.statics.generateRandomPassword = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    
    // Asegurar al menos una mayúscula, una minúscula y un número
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // Completar con 3 caracteres aleatorios más
    for (let i = 3; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Método estático para generar username único
UserSchema.statics.generateUniqueUsername = async function(baseUsername) {
    let username = baseUsername;
    let counter = 0;
    
    while (await this.findOne({ username: username })) {
        counter++;
        username = `${baseUsername}${counter}`;
    }
    
    return username;
};

// Método para obtener información del usuario (sin contraseña)
UserSchema.methods.getUserInfo = function() {
    return {
        _id: this._id,
        username: this.username,
        role: this.role,
        personRef: this.personRef,
        tipoPersona: this.tipoPersona,
        isActive: this.isActive,
        fechaCreacion: this.fechaCreacion,
        lastLogin: this.lastLogin,
        isMasterSuperAdmin: this.isMasterSuperAdmin,
        profileImage: this.profileImage
    };
};

// Método para resetear contraseña
UserSchema.methods.resetPassword = function() {
    const newPassword = this.constructor.generateRandomPassword();
    this.password = newPassword;
    this.passwordResetCount += 1;
    return newPassword; // Retorna la contraseña sin hashear para mostrarla al admin
};

// Método para verificar si el usuario tiene un permiso específico
UserSchema.methods.hasPermission = async function(permissionName) {
    if (!this.role) return false;

    // Si es Master SuperAdmin, tiene todos los permisos
    if (this.isMasterSuperAdmin) return true;

    // COMPATIBILIDAD: Si el rol es un string (sistema antiguo), asumir que tiene los permisos básicos
    if (typeof this.role === 'string') {
        if (this.role === 'superadmin') return true;
        if (this.role === 'admin') {
            // Admin tiene la mayoría de permisos excepto gestión de permisos
            return !permissionName.includes('permissions_manage');
        }
        return false;
    }

    // Nuevo sistema: buscar permisos por ObjectId
    try {
        const Role = mongoose.models.Role;
        const role = await Role.findById(this.role).populate('permissions');
        if (!role) return false;

        return role.permissions.some(permission => permission.name === permissionName && permission.isActive);
    } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
    }
};

// Método para verificar si el usuario tiene permisos para un recurso específico
UserSchema.methods.hasResourcePermission = async function(resource, action) {
    console.log('🔍 [hasResourcePermission] Verificando permiso:', { resource, action });
    console.log('🔍 [hasResourcePermission] Usuario role:', this.role, 'tipo:', typeof this.role);
    
    if (!this.role) {
        console.log('❌ [hasResourcePermission] Usuario sin rol');
        return false;
    }

    // Si es Master SuperAdmin, tiene todos los permisos
    if (this.isMasterSuperAdmin) {
        console.log('✅ [hasResourcePermission] Es Master SuperAdmin');
        return true;
    }

    // COMPATIBILIDAD: Si el rol es un string (sistema antiguo), usar lógica simplificada
    if (typeof this.role === 'string') {
        console.log('🔍 [hasResourcePermission] Usando lógica de compatibilidad para rol string');
        
        // SuperAdmin tiene todos los permisos
        if (this.role === 'superadmin') {
            console.log('✅ [hasResourcePermission] SuperAdmin tiene todos los permisos');
            return true;
        }
        
        // Admin tiene permisos de gestión de usuarios, personas, libros, préstamos, estadísticas
        if (this.role === 'admin') {
            const adminResources = ['users', 'persons', 'books', 'loans', 'attendance', 'spaces', 'reports', 'statistics'];
            const hasAccess = adminResources.includes(resource);
            console.log(`${hasAccess ? '✅' : '❌'} [hasResourcePermission] Admin acceso a ${resource}: ${hasAccess}`);
            return hasAccess;
        }
        
        // User tiene permisos básicos de lectura
        if (this.role === 'user') {
            const hasAccess = action === 'read' && ['books', 'loans'].includes(resource);
            console.log(`${hasAccess ? '✅' : '❌'} [hasResourcePermission] User acceso a ${resource}: ${hasAccess}`);
            return hasAccess;
        }
        
        console.log('❌ [hasResourcePermission] Rol no reconocido:', this.role);
        return false;
    }

    // Nuevo sistema: buscar permisos por ObjectId
    console.log('🔍 [hasResourcePermission] Usando nuevo sistema de permisos (ObjectId)');
    try {
        const Role = mongoose.models.Role;
        const role = await Role.findById(this.role).populate('permissions');
        if (!role) {
            console.log('❌ [hasResourcePermission] Rol no encontrado en BD');
            return false;
        }

        const hasPermission = role.permissions.some(permission =>
            permission.resource === resource &&
            permission.action === action &&
            permission.isActive
        );
        
        console.log(`${hasPermission ? '✅' : '❌'} [hasResourcePermission] Permiso en nuevo sistema: ${hasPermission}`);
        return hasPermission;
    } catch (error) {
        console.error('❌ [hasResourcePermission] Error:', error);
        return false;
    }
};

// Método para obtener todos los permisos del usuario
UserSchema.methods.getPermissions = async function() {
    if (!this.role) return [];

    // Si es Master SuperAdmin, devolver todos los permisos activos
    if (this.isMasterSuperAdmin) {
        try {
            const Permission = mongoose.models.Permission;
            return await Permission.findActive();
        } catch (error) {
            console.error('Error getting all permissions:', error);
            return [];
        }
    }

    // COMPATIBILIDAD: Si el rol es un string (sistema antiguo), devolver array vacío o permisos simulados
    if (typeof this.role === 'string') {
        // Para usuarios con roles string, devolver permisos simulados básicos
        if (this.role === 'superadmin') {
            // SuperAdmin tiene todos los permisos (podría devolver todos los permisos del sistema)
            try {
                const Permission = mongoose.models.Permission;
                return await Permission.find({ isActive: true });
            } catch (error) {
                return [];
            }
        }
        // Para otros roles, devolver array vacío (funcionará con la lógica de compatibilidad)
        return [];
    }

    // Nuevo sistema: buscar permisos por ObjectId
    try {
        const Role = mongoose.models.Role;
        const role = await Role.findById(this.role).populate('permissions');
        if (!role) return [];

        return role.permissions.filter(permission => permission.isActive);
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
};

// Método para verificar si el usuario es administrador (tiene permisos de gestión)
UserSchema.methods.isAdmin = async function() {
    if (this.isMasterSuperAdmin) return true;

    return await this.hasResourcePermission('users', 'manage') ||
           await this.hasResourcePermission('system', 'manage');
};

// Método para verificar si el usuario tiene permisos básicos para estadísticas
UserSchema.methods.hasBasicStatsPermission = async function() {
    // Si es Master SuperAdmin, tiene todos los permisos
    if (this.isMasterSuperAdmin) return true;

    // Si tiene el viejo sistema de roles (string), permitir acceso básico para mantener compatibilidad
    if (typeof this.role === 'string') {
        return this.role === 'admin' || this.role === 'superadmin';
    }

    // Nuevo sistema: verificar permisos específicos
    try {
        const hasSystemRead = await this.hasResourcePermission('statistics', 'read');
        const hasReportsRead = await this.hasResourcePermission('reports', 'read');

        return hasSystemRead || hasReportsRead;
    } catch (error) {
        console.error('Error checking basic stats permission:', error);
        return false;
    }
};

// Método estático para buscar usuarios activos
UserSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true })
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 tipoPersona doc estado')
        .populate('role', 'name displayName level')
        .sort({ username: 1 });
};

// Método estático para buscar por rol (ahora busca por referencia de rol)
UserSchema.statics.findByRole = function(roleId) {
    return this.find({ role: roleId, isActive: true })
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 tipoPersona doc estado')
        .populate('role', 'name displayName level')
        .sort({ username: 1 });
};

// Método estático para buscar por tipo de persona
UserSchema.statics.findByTipoPersona = function(tipoPersona) {
    return this.find({ tipoPersona: tipoPersona, isActive: true })
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 doc estado')
        .populate('role', 'name displayName level')
        .sort({ username: 1 });
};

// Método para obtener usuarios con permisos específicos
UserSchema.statics.findUsersWithPermission = async function(resource, action) {
    const users = await this.find({ isActive: true })
        .populate('role', 'name displayName permissions')
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 tipoPersona doc estado');

    // Filtrar usuarios que tienen el permiso específico
    const usersWithPermission = [];
    for (const user of users) {
        const hasPermission = await user.hasResourcePermission(resource, action);
        if (hasPermission) {
            usersWithPermission.push(user);
        }
    }

    return usersWithPermission;
};

// Métodos para soft delete
UserSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

UserSchema.statics.findActiveByRole = function(role) {
    return this.find({ role: role, isActive: true });
};

UserSchema.methods.softDelete = function() {
    this.isActive = false;
    this.deletedAt = new Date();
    return this.save();
};

UserSchema.methods.restore = function() {
    this.isActive = true;
    this.deletedAt = null;
    return this.save();
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);













