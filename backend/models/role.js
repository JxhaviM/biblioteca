const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del rol es requerido'],
        unique: true,
        trim: true,
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    displayName: {
        type: String,
        required: [true, 'El nombre para mostrar es requerido'],
        trim: true,
        maxlength: [100, 'El nombre para mostrar no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        maxlength: [300, 'La descripción no puede exceder 300 caracteres']
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
        required: true
    }],
    isSystem: {
        type: Boolean,
        default: false // Los roles del sistema no se pueden eliminar
    },
    isActive: {
        type: Boolean,
        default: true
    },
    level: {
        type: Number,
        required: true,
        min: [0, 'El nivel debe ser mayor o igual a 0'],
        max: [100, 'El nivel no puede exceder 100']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // No es requerido para roles del sistema
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
RoleSchema.index({ level: 1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });

// Método estático para obtener roles activos ordenados por nivel
RoleSchema.statics.findActiveOrdered = function() {
    return this.find({ isActive: true })
        .populate('permissions', 'name description resource action')
        .sort({ level: 1, name: 1 });
};

// Método estático para obtener roles del sistema
RoleSchema.statics.findSystemRoles = function() {
    return this.find({ isSystem: true, isActive: true })
        .populate('permissions')
        .sort({ level: 1 });
};

// Método para verificar si un rol tiene un permiso específico
RoleSchema.methods.hasPermission = function(permissionId) {
    return this.permissions.some(permission => permission._id.toString() === permissionId.toString());
};

// Método para verificar si un rol tiene permisos para un recurso específico
RoleSchema.methods.hasResourcePermission = function(resource, action) {
    return this.permissions.some(permission =>
        permission.resource === resource && permission.action === action && permission.isActive
    );
};

// Método para agregar un permiso al rol
RoleSchema.methods.addPermission = function(permissionId) {
    if (!this.hasPermission(permissionId)) {
        this.permissions.push(permissionId);
        return this.save();
    }
    return Promise.resolve(this);
};

// Método para remover un permiso del rol
RoleSchema.methods.removePermission = function(permissionId) {
    this.permissions = this.permissions.filter(
        permission => permission._id.toString() !== permissionId.toString()
    );
    return this.save();
};

module.exports = mongoose.models.Role || mongoose.model('Role', RoleSchema);
