const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    // Referencia a la persona que marcó la asistencia
    person: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: [true, 'El registro de asistencia debe estar asociado a una persona']
    },
    
    // Fecha y hora de entrada (automática al crear)
    checkInTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Fecha y hora de salida (opcional)
    checkOutTime: {
        type: Date,
        default: null
    },
    
    // Usuario que registró la entrada
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Debe especificarse quién registró la asistencia']
    },
    
    // Usuario que registró la salida (opcional)
    checkOutRegisteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Notas adicionales (opcional)
    notes: {
        type: String,
        trim: true,
        maxLength: [200, 'Las notas no pueden exceder 200 caracteres']
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
AttendanceSchema.index({ person: 1, checkInTime: -1 });
AttendanceSchema.index({ checkInTime: -1 });
AttendanceSchema.index({ person: 1, checkInTime: 1, checkOutTime: 1 });

// Middleware para validaciones
AttendanceSchema.pre('validate', function(next) {
    // Validar que checkOutTime sea posterior a checkInTime
    if (this.checkOutTime && this.checkInTime && this.checkOutTime <= this.checkInTime) {
        return next(new Error('La hora de salida debe ser posterior a la hora de entrada'));
    }
    next();
});

// Método para marcar salida
AttendanceSchema.methods.markCheckOut = function(registeredBy, notes = '') {
    this.checkOutTime = new Date();
    this.checkOutRegisteredBy = registeredBy;
    if (notes) {
        this.notes = this.notes ? `${this.notes}. Salida: ${notes}` : `Salida: ${notes}`;
    }
    return this.save();
};

// Método para calcular tiempo de permanencia
AttendanceSchema.methods.getStayDuration = function() {
    if (!this.checkOutTime) {
        return null; // Aún no ha salido
    }
    
    const duration = this.checkOutTime - this.checkInTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        hours,
        minutes,
        totalMinutes: Math.floor(duration / (1000 * 60)),
        duration: duration
    };
};

// Método para obtener información básica
AttendanceSchema.methods.getBasicInfo = function() {
    return {
        _id: this._id,
        person: this.person,
        checkInTime: this.checkInTime,
        checkOutTime: this.checkOutTime,
        stayDuration: this.getStayDuration(),
        notes: this.notes,
        isActive: !this.checkOutTime // Si no tiene checkout, aún está presente
    };
};

// Método estático para encontrar asistencias activas (sin checkout)
AttendanceSchema.statics.findActiveAttendances = function() {
    return this.find({ checkOutTime: null })
        .populate('person', 'apellido1 apellido2 nombre1 nombre2 tipoPersona doc grado grupo')
        .populate('registeredBy', 'username')
        .sort({ checkInTime: -1 });
};

// Método estático para encontrar asistencias por persona
AttendanceSchema.statics.findByPerson = function(personId, startDate = null, endDate = null) {
    const query = { person: personId };
    
    if (startDate || endDate) {
        query.checkInTime = {};
        if (startDate) {
            query.checkInTime.$gte = new Date(startDate);
        }
        if (endDate) {
            query.checkInTime.$lte = new Date(endDate);
        }
    }
    
    return this.find(query)
        .populate('registeredBy', 'username')
        .populate('checkOutRegisteredBy', 'username')
        .sort({ checkInTime: -1 });
};

// Método estático para obtener estadísticas diarias
AttendanceSchema.statics.getDailyStats = function(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.aggregate([
        {
            $match: {
                checkInTime: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }
        },
        {
            $lookup: {
                from: 'people',
                localField: 'person',
                foreignField: '_id',
                as: 'personInfo'
            }
        },
        {
            $unwind: '$personInfo'
        },
        {
            $group: {
                _id: '$personInfo.tipoPersona',
                count: { $sum: 1 },
                currentlyPresent: {
                    $sum: {
                        $cond: [{ $eq: ['$checkOutTime', null] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                tipoPersona: '$_id',
                totalVisits: '$count',
                currentlyPresent: 1,
                _id: 0
            }
        }
    ]);
};

// Método estático para verificar si una persona ya tiene entrada activa
AttendanceSchema.statics.hasActiveEntry = function(personId) {
    return this.findOne({
        person: personId,
        checkOutTime: null
    });
};

module.exports = mongoose.model('Attendance', AttendanceSchema);
