const mongoose = require('mongoose');

const SpaceUsageSchema = new mongoose.Schema({
    // Nombre descriptivo de la actividad
    activityName: {
        type: String,
        required: [true, 'El nombre de la actividad es obligatorio'],
        trim: true,
        maxLength: [200, 'El nombre de la actividad no puede exceder 200 caracteres']
    },
    
    // Número de personas que participarán
    participants: {
        type: Number,
        required: [true, 'El número de participantes es obligatorio'],
        min: [1, 'El número de participantes debe ser al menos 1'],
        max: [100, 'El número de participantes no puede exceder 100']
    },
    
    // Referencia a quién reservó el espacio
    reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'La reserva debe ser realizada por un usuario registrado']
    },
    
    // Fechas de inicio y fin del uso del espacio
    startDateTime: {
        type: Date,
        required: [true, 'La fecha y hora de inicio son obligatorias']
    },
    
    endDateTime: {
        type: Date,
        required: [true, 'La fecha y hora de finalización son obligatorias']
    },
    
    // Estado de la reserva
    status: {
        type: String,
        enum: {
            values: ['pendiente', 'confirmado', 'finalizado', 'cancelado'],
            message: 'El estado debe ser: pendiente, confirmado, finalizado o cancelado'
        },
        default: 'pendiente',
        required: true
    },
    
    // Descripción adicional de la actividad
    description: {
        type: String,
        trim: true,
        maxLength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    
    // Motivo de cancelación (si aplica)
    cancellationReason: {
        type: String,
        trim: true,
        maxLength: [300, 'El motivo de cancelación no puede exceder 300 caracteres']
    },
    
    // Usuario que confirmó o canceló
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Fecha de procesamiento (confirmación o cancelación)
    processedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
SpaceUsageSchema.index({ startDateTime: 1, endDateTime: 1 });
SpaceUsageSchema.index({ reservedBy: 1, status: 1 });
SpaceUsageSchema.index({ status: 1, startDateTime: 1 });

// Middleware para validaciones
SpaceUsageSchema.pre('validate', function(next) {
    // Validar que endDateTime sea posterior a startDateTime
    if (this.endDateTime <= this.startDateTime) {
        return next(new Error('La fecha de finalización debe ser posterior a la fecha de inicio'));
    }
    
    // Validar duración máxima (ej: máximo 8 horas)
    const duration = this.endDateTime - this.startDateTime;
    const maxDuration = 8 * 60 * 60 * 1000; // 8 horas en millisegundos
    
    if (duration > maxDuration) {
        return next(new Error('La duración de la reserva no puede exceder 8 horas'));
    }
    
    next();
});

// Middleware para validar horarios según el rol del usuario
SpaceUsageSchema.pre('save', async function(next) {
    if (!this.isNew && !this.isModified('startDateTime') && !this.isModified('endDateTime')) {
        return next();
    }
    
    try {
        const User = mongoose.model('User');
        const user = await User.findById(this.reservedBy);
        
        if (!user) {
            return next(new Error('Usuario no encontrado'));
        }
        
        // Solo validar horarios para usuarios regulares
        if (user.role === 'user') {
            const startHour = this.startDateTime.getHours();
            const endHour = this.endDateTime.getHours();
            const dayOfWeek = this.startDateTime.getDay(); // 0 = Domingo, 6 = Sábado
            
            // Validar días de la semana (Lunes a Viernes: 1-5)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return next(new Error('Los usuarios solo pueden reservar de lunes a viernes'));
            }
            
            // Validar horarios (8am a 6pm)
            if (startHour < 8 || endHour > 18) {
                return next(new Error('Los usuarios solo pueden reservar entre 8:00 AM y 6:00 PM'));
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Método para confirmar reserva
SpaceUsageSchema.methods.confirm = function(processedBy) {
    this.status = 'confirmado';
    this.processedBy = processedBy;
    this.processedAt = new Date();
    return this.save();
};

// Método para cancelar reserva
SpaceUsageSchema.methods.cancel = function(processedBy, reason = '') {
    this.status = 'cancelado';
    this.processedBy = processedBy;
    this.processedAt = new Date();
    if (reason) {
        this.cancellationReason = reason;
    }
    return this.save();
};

// Método para finalizar reserva
SpaceUsageSchema.methods.finish = function(processedBy) {
    this.status = 'finalizado';
    this.processedBy = processedBy;
    this.processedAt = new Date();
    return this.save();
};

// Método para obtener duración en horas
SpaceUsageSchema.methods.getDuration = function() {
    const duration = this.endDateTime - this.startDateTime;
    return {
        hours: Math.floor(duration / (1000 * 60 * 60)),
        minutes: Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)),
        totalMinutes: Math.floor(duration / (1000 * 60))
    };
};

// Método para verificar si está en curso
SpaceUsageSchema.methods.isInProgress = function() {
    const now = new Date();
    return this.status === 'confirmado' && 
           this.startDateTime <= now && 
           this.endDateTime > now;
};

// Método estático para verificar conflictos de horario
SpaceUsageSchema.statics.checkTimeConflict = function(startDateTime, endDateTime, excludeId = null) {
    const query = {
        status: { $in: ['pendiente', 'confirmado'] },
        $or: [
            // Nueva reserva empieza antes de que termine una existente
            {
                startDateTime: { $lt: endDateTime },
                endDateTime: { $gt: startDateTime }
            }
        ]
    };
    
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    
    return this.find(query)
        .populate('reservedBy', 'username')
        .sort({ startDateTime: 1 });
};

// Método estático para obtener reservas activas
SpaceUsageSchema.statics.getActiveReservations = function() {
    const now = new Date();
    return this.find({
        status: 'confirmado',
        startDateTime: { $lte: now },
        endDateTime: { $gte: now }
    })
    .populate('reservedBy', 'username')
    .populate({
        path: 'reservedBy',
        populate: {
            path: 'personRef',
            select: 'apellido1 apellido2 nombre1 nombre2 tipoPersona'
        }
    });
};

// Método estático para obtener próximas reservas
SpaceUsageSchema.statics.getUpcomingReservations = function(hours = 24) {
    const now = new Date();
    const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    return this.find({
        status: { $in: ['pendiente', 'confirmado'] },
        startDateTime: { $gte: now, $lte: futureTime }
    })
    .populate('reservedBy', 'username')
    .populate({
        path: 'reservedBy',
        populate: {
            path: 'personRef',
            select: 'apellido1 apellido2 nombre1 nombre2 tipoPersona'
        }
    })
    .sort({ startDateTime: 1 });
};

// Método estático para obtener estadísticas de uso
SpaceUsageSchema.statics.getUsageStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                startDateTime: { $gte: startDate, $lte: endDate },
                status: { $in: ['confirmado', 'finalizado'] }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reservedBy',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $lookup: {
                from: 'people',
                localField: 'user.personRef',
                foreignField: '_id',
                as: 'person'
            }
        },
        {
            $unwind: '$person'
        },
        {
            $group: {
                _id: '$person.tipoPersona',
                totalReservations: { $sum: 1 },
                totalParticipants: { $sum: '$participants' },
                averageParticipants: { $avg: '$participants' }
            }
        }
    ]);
};

module.exports = mongoose.model('SpaceUsage', SpaceUsageSchema);
