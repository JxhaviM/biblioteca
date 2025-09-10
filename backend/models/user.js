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
        type: String,
        required: [true, 'El rol es requerido'],
        enum: {
            values: ['superadmin', 'admin', 'user'],
            message: 'El rol debe ser: superadmin, admin o user'
        },
        default: 'user'
    },
    isMasterSuperAdmin: {
        type: Boolean,
        default: false
    },
    personRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: [true, 'La referencia a la persona es requerida']
    },
    tipoPersona: {
        type: String,
        required: [true, 'El tipo de persona es requerido'],
        enum: {
            values: ['Estudiante', 'Profesor', 'Colaborador', 'Publico'],
            message: 'El tipo de persona debe ser: Estudiante, Profesor, Colaborador o Publico'
        }
    },
    isActive: {
        type: Boolean,
        default: true
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
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
UserSchema.index({ username: 1 });
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
        lastLogin: this.lastLogin
    };
};

// Método para resetear contraseña
UserSchema.methods.resetPassword = function() {
    const newPassword = this.constructor.generateRandomPassword();
    this.password = newPassword;
    this.passwordResetCount += 1;
    return newPassword; // Retorna la contraseña sin hashear para mostrarla al admin
};

// Método para actualizar último login
UserSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    // Usar updateOne para evitar validaciones del schema completo
    return this.constructor.updateOne(
        { _id: this._id }, 
        { lastLogin: this.lastLogin }
    );
};

// Método estático para buscar usuarios activos
UserSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true })
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 tipoPersona doc estado')
        .sort({ username: 1 });
};

// Método estático para buscar por rol
UserSchema.statics.findByRole = function(role) {
    return this.find({ role: role, isActive: true })
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 tipoPersona doc estado')
        .sort({ username: 1 });
};

// Método estático para buscar por tipo de persona
UserSchema.statics.findByTipoPersona = function(tipoPersona) {
    return this.find({ tipoPersona: tipoPersona, isActive: true })
        .populate('personRef', 'apellido1 apellido2 nombre1 nombre2 doc estado')
        .sort({ username: 1 });
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













