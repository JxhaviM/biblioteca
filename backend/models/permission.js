const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del permiso es requerido'],
        unique: true,
        trim: true,
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    resource: {
        type: String,
        required: [true, 'El recurso es requerido'],
        enum: {
            values: [
                'users', 'persons', 'books', 'loans', 'attendance',
                'spaces', 'reports', 'audit', 'system', 'permissions', 'statistics'
            ],
            message: 'Recurso no válido'
        }
    },
    action: {
        type: String,
        required: [true, 'La acción es requerida'],
        enum: {
            values: ['create', 'read', 'update', 'delete', 'manage', 'export', 'import'],
            message: 'Acción no válida'
        }
    },
    scope: {
        type: String,
        enum: {
            values: ['own', 'department', 'all', 'specific'],
            message: 'Scope no válido'
        },
        default: 'own'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // No es requerido para permisos del sistema
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
PermissionSchema.index({ resource: 1, action: 1 });
PermissionSchema.index({ isActive: 1 });

// Método estático para obtener permisos por recurso
PermissionSchema.statics.findByResource = function(resource) {
    return this.find({ resource, isActive: true }).sort({ name: 1 });
};

// Método estático para obtener permisos activos
PermissionSchema.statics.findActive = function() {
    return this.find({ isActive: true }).sort({ resource: 1, action: 1 });
};

module.exports = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
