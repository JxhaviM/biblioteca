const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    // Usuario que realizó la acción
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario que realizó la acción es requerido']
    },
    
    // Usuario afectado por el cambio
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario objetivo es requerido']
    },
    
    // Persona afectada por el cambio
    targetPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: [true, 'La persona objetivo es requerida']
    },
    
    // Tipo de acción realizada
    action: {
        type: String,
        required: [true, 'La acción es requerida'],
        enum: {
            values: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'PASSWORD_RESET'],
            message: 'La acción debe ser: CREATE, UPDATE, DELETE, RESTORE o PASSWORD_RESET'
        }
    },
    
    // Campo modificado (para UPDATE)
    field: {
        type: String,
        required: function() {
            return this.action === 'UPDATE';
        }
    },
    
    // Valor anterior
    oldValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Valor nuevo
    newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Información de la sesión
    ip: {
        type: String,
        default: null
    },
    
    userAgent: {
        type: String,
        default: null
    },
    
    // Comentario adicional
    comment: {
        type: String,
        maxLength: [500, 'El comentario no puede exceder 500 caracteres']
    }
}, {
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
AuditSchema.index({ userId: 1, createdAt: -1 });
AuditSchema.index({ targetUserId: 1, createdAt: -1 });
AuditSchema.index({ targetPersonId: 1, createdAt: -1 });
AuditSchema.index({ action: 1, createdAt: -1 });
AuditSchema.index({ field: 1, createdAt: -1 });

// Método estático para crear entrada de auditoría
AuditSchema.statics.createEntry = async function(data) {
    return await this.create({
        userId: data.userId,
        targetUserId: data.targetUserId,
        targetPersonId: data.targetPersonId,
        action: data.action,
        field: data.field || null,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        comment: data.comment || null
    });
};

// Método estático para obtener auditoría por usuario
AuditSchema.statics.getByTargetUser = function(targetUserId, limit = 50) {
    return this.find({ targetUserId })
        .populate('userId', 'username role')
        .populate('targetUserId', 'username role')
        .populate('targetPersonId', 'apellido1 apellido2 nombre1 nombre2 doc')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Método estático para obtener auditoría completa (solo SuperAdmin)
AuditSchema.statics.getSystemAudit = function(limit = 100) {
    return this.find({})
        .populate('userId', 'username role')
        .populate('targetUserId', 'username role')
        .populate('targetPersonId', 'apellido1 apellido2 nombre1 nombre2 doc')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Método estático para obtener auditoría por rango de fechas
AuditSchema.statics.getByDateRange = function(startDate, endDate, targetUserId = null) {
    const query = {
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    };
    
    if (targetUserId) {
        query.targetUserId = targetUserId;
    }
    
    return this.find(query)
        .populate('userId', 'username role')
        .populate('targetUserId', 'username role')
        .populate('targetPersonId', 'apellido1 apellido2 nombre1 nombre2 doc')
        .sort({ createdAt: -1 });
};

module.exports = mongoose.models.Audit || mongoose.model('Audit', AuditSchema);
