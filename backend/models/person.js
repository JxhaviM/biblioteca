const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
    // Identificación única
    doc: {
        type: String,
        required: [true, 'El documento es requerido'],
        unique: true,
        trim: true,
        maxLength: [20, 'El documento no puede exceder 20 caracteres']
    },
    tipoDoc: {
        type: String,
        required: [true, 'El tipo de documento es requerido'],
        enum: {
            values: ['CC', 'NES', 'PPT', 'RC', 'TI'],
            message: 'El tipo de documento debe ser: CC, NES, PPT, RC o TI'
        }
    },
    
    // Nombres completos
    apellido1: {
        type: String,
        required: [true, 'El primer apellido es requerido'],
        trim: true,
        maxLength: [50, 'El primer apellido no puede exceder 50 caracteres']
    },
    apellido2: {
        type: String,
        trim: true,
        maxLength: [50, 'El segundo apellido no puede exceder 50 caracteres']
    },
    nombre1: {
        type: String,
        required: [true, 'El primer nombre es requerido'],
        trim: true,
        maxLength: [50, 'El primer nombre no puede exceder 50 caracteres']
    },
    nombre2: {
        type: String,
        trim: true,
        maxLength: [50, 'El segundo nombre no puede exceder 50 caracteres']
    },
    
    // Información personal
    genero: {
        type: String,
        required: [true, 'El género es requerido'],
        enum: {
            values: ['Masculino', 'Femenino'],
            message: 'El género debe ser: Masculino o Femenino'
        }
    },
    direccion: {
        type: String,
        trim: true,
        maxLength: [200, 'La dirección no puede exceder 200 caracteres']
    },
    celular: {
        type: String,
        trim: true,
        maxLength: [15, 'El celular no puede exceder 15 caracteres']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true, // Permite múltiples valores null/undefined
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    
    // Tipo de persona
    tipoPersona: {
        type: String,
        required: [true, 'El tipo de persona es requerido'],
        enum: {
            values: ['Estudiante', 'Profesor', 'Colaborador', 'Publico'],
            message: 'El tipo de persona debe ser: Estudiante, Profesor, Colaborador o Publico'
        }
    },
    
    // Campos específicos para Estudiantes
    grado: {
        type: String,
        required: function() { 
            return this.tipoPersona === 'Estudiante'; 
        },
        trim: true,
        maxLength: [20, 'El grado no puede exceder 20 caracteres']
    },
    grupo: {
        type: String,
        required: function() { 
            return this.tipoPersona === 'Estudiante'; 
        },
        trim: true,
        maxLength: [10, 'El grupo no puede exceder 10 caracteres']
    },
    
    // Campos específicos para Profesores
    nivelEducativo: {
        type: String,
        required: function() { 
            return this.tipoPersona === 'Profesor'; 
        },
        enum: {
            values: ['Transición', 'Primaria', 'Secundaria', 'General'],
            message: 'El nivel educativo debe ser: Transición, Primaria, Secundaria o General'
        }
    },
    materias: [{
        type: String,
        trim: true,
        maxLength: [100, 'Cada materia no puede exceder 100 caracteres']
    }],
    
    // Control del sistema
    estado: {
        type: String,
        enum: {
            values: ['Activo', 'Suspendido', 'Vetado'],
            message: 'El estado debe ser: Activo, Suspendido o Vetado'
        },
        default: 'Activo'
    },
    motivoEstado: {
        type: String,
        required: function() {
            return this.estado === 'Suspendido' || this.estado === 'Vetado';
        },
        trim: true,
        maxLength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    tieneCuenta: {
        type: Boolean,
        default: false
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    },
    
    // Soft Delete
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
PersonSchema.index({ doc: 1 });
PersonSchema.index({ tipoPersona: 1, estado: 1 });
PersonSchema.index({ grado: 1, grupo: 1 });
PersonSchema.index({ apellido1: 1, nombre1: 1 });
PersonSchema.index({ isActive: 1 });
PersonSchema.index({ isActive: 1, tipoPersona: 1 });

// Middleware para actualizar fechaActualizacion
PersonSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.fechaActualizacion = new Date();
    }
    next();
});

// Validación personalizada para campos específicos por tipo
PersonSchema.pre('validate', function(next) {
    // Validar campos de estudiante
    if (this.tipoPersona === 'Estudiante') {
        if (!this.grado || !this.grupo) {
            return next(new Error('Los estudiantes deben tener grado y grupo'));
        }
        // Limpiar campos de profesor
        this.nivelEducativo = undefined;
        this.materias = [];
    }
    
    // Validar campos de profesor
    if (this.tipoPersona === 'Profesor') {
        if (!this.nivelEducativo) {
            return next(new Error('Los profesores deben tener nivel educativo'));
        }
        // Limpiar campos de estudiante
        this.grado = undefined;
        this.grupo = undefined;
    }
    
    // Limpiar campos específicos para otros tipos
    if (this.tipoPersona === 'Colaborador' || this.tipoPersona === 'Publico') {
        this.grado = undefined;
        this.grupo = undefined;
        this.nivelEducativo = undefined;
        this.materias = [];
    }
    
    next();
});

// Método para obtener nombre completo
PersonSchema.methods.getNombreCompleto = function() {
    let nombre = this.nombre1;
    if (this.nombre2) nombre += ` ${this.nombre2}`;
    
    let apellidos = this.apellido1;
    if (this.apellido2) apellidos += ` ${this.apellido2}`;
    
    return `${nombre} ${apellidos}`;
};

// Método para generar username base
PersonSchema.methods.generateUsernameBase = function() {
    const nombre = this.nombre1.toLowerCase().trim();
    const apellido = this.apellido1.toLowerCase().trim();
    
    // Remover acentos y caracteres especiales
    const cleanNombre = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    const cleanApellido = apellido.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    
    return `${cleanNombre}.${cleanApellido}`;
};

// Método para obtener información básica
PersonSchema.methods.getBasicInfo = function() {
    return {
        _id: this._id,
        doc: this.doc,
        tipoDoc: this.tipoDoc,
        nombreCompleto: this.getNombreCompleto(),
        tipoPersona: this.tipoPersona,
        estado: this.estado,
        tieneCuenta: this.tieneCuenta,
        grado: this.grado,
        grupo: this.grupo,
        nivelEducativo: this.nivelEducativo,
        materias: this.materias
    };
};

// Método para obtener información detallada
PersonSchema.methods.getDetailedInfo = function() {
    return {
        ...this.getBasicInfo(),
        apellido1: this.apellido1,
        apellido2: this.apellido2,
        nombre1: this.nombre1,
        nombre2: this.nombre2,
        genero: this.genero,
        direccion: this.direccion,
        celular: this.celular,
        email: this.email,
        motivoEstado: this.motivoEstado,
        fechaRegistro: this.fechaRegistro,
        fechaActualizacion: this.fechaActualizacion
    };
};

// Método estático para buscar personas activas
PersonSchema.statics.findActivePersons = function() {
    return this.find({ estado: 'Activo' }).sort({ apellido1: 1, nombre1: 1 });
};

// Método estático para buscar por documento
PersonSchema.statics.findByDoc = function(doc) {
    return this.findOne({ doc: doc });
};

// Método estático para buscar por grado
PersonSchema.statics.findByGrado = function(grado, grupo = null) {
    const query = { tipoPersona: 'Estudiante', grado: grado, isActive: true };
    if (grupo) query.grupo = grupo;
    return this.find(query).sort({ apellido1: 1, nombre1: 1 });
};

// Método estático para buscar por tipo de persona
PersonSchema.statics.findByTipo = function(tipoPersona) {
    return this.find({ tipoPersona: tipoPersona, estado: 'Activo', isActive: true }).sort({ apellido1: 1, nombre1: 1 });
};

// Métodos para soft delete
PersonSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

PersonSchema.methods.softDelete = function() {
    this.isActive = false;
    this.deletedAt = new Date();
    return this.save();
};

PersonSchema.methods.restore = function() {
    this.isActive = true;
    this.deletedAt = null;
    return this.save();
};

module.exports = mongoose.model('Person', PersonSchema);
