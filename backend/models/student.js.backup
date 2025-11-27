const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxLength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    idNumber: {
        type: String,
        required: [true, 'El número de identificación es requerido'],
        unique: true,
        trim: true,
        maxLength: [20, 'El ID no puede exceder 20 caracteres']
    },
    grade: {
        type: String,
        required: [true, 'El grado es requerido'],
        trim: true,
        maxLength: [50, 'El grado no puede exceder 50 caracteres']
    },
    contactInfo: {
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
        },
        phone: {
            type: String,
            trim: true,
            maxLength: [15, 'El teléfono no puede exceder 15 caracteres']
        },
        address: {
            type: String,
            trim: true,
            maxLength: [200, 'La dirección no puede exceder 200 caracteres']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true,
        maxLength: [500, 'Las notas no pueden exceder 500 caracteres']
    }
}, {
    timestamps: true
});

// Índices para optimizar búsquedas
StudentSchema.index({ idNumber: 1 });
StudentSchema.index({ name: 1 });
StudentSchema.index({ grade: 1 });
StudentSchema.index({ isActive: 1 });

// Método para obtener el nombre completo formateado
StudentSchema.methods.getFormattedInfo = function() {
    return {
        id: this._id,
        name: this.name,
        idNumber: this.idNumber,
        grade: this.grade,
        isActive: this.isActive
    };
};

// Método estático para buscar estudiantes activos
StudentSchema.statics.findActiveStudents = function() {
    return this.find({ isActive: true }).sort({ name: 1 });
};

// Método estático para buscar por ID de estudiante
StudentSchema.statics.findByIdNumber = function(idNumber) {
    return this.findOne({ idNumber: idNumber });
};

module.exports = mongoose.model('Student', StudentSchema);
