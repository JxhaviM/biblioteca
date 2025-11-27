const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    clave: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    valor: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    descripcion: String,
    tipo: {
        type: String,
        enum: ['string', 'number', 'boolean', 'object', 'array'],
        default: 'string'
    },
    actualizadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Método estático para obtener o crear configuración por defecto
configSchema.statics.obtenerOCrear = async function(clave, valorPorDefecto, descripcion, tipo = 'string') {
    let config = await this.findOne({ clave });
    
    if (!config) {
        config = await this.create({
            clave,
            valor: valorPorDefecto,
            descripcion,
            tipo
        });
    }
    
    return config.valor;
};

// Método estático para actualizar configuración
configSchema.statics.actualizar = async function(clave, valor, usuarioId) {
    const config = await this.findOneAndUpdate(
        { clave },
        { 
            valor, 
            actualizadoPor: usuarioId,
            updatedAt: new Date()
        },
        { 
            new: true, 
            upsert: true 
        }
    );
    
    return config;
};

module.exports = mongoose.model('Config', configSchema);
