const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'SECURITY', 'SYSTEM'],
        required: true
    },
    categoria: {
        type: String,
        enum: ['AUTH', 'USER', 'PERSON', 'LOAN', 'BACKUP', 'CONFIG', 'SYSTEM'],
        required: true
    },
    accion: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    usuarioNombre: String, // Guardamos el nombre por si el usuario se elimina
    ip: String,
    userAgent: String,
    datos: mongoose.Schema.Types.Mixed, // Datos adicionales en JSON
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Índices para búsquedas rápidas
logSchema.index({ tipo: 1, createdAt: -1 });
logSchema.index({ categoria: 1, createdAt: -1 });
logSchema.index({ usuario: 1, createdAt: -1 });

// Método para crear log fácilmente
logSchema.statics.crear = async function(datos) {
    try {
        const log = new this(datos);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error al crear log:', error);
        return null;
    }
};

module.exports = mongoose.model('Log', logSchema);
