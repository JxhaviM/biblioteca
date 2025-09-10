const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxLength: [200, 'El título no puede exceder 200 caracteres']
    },
    author: {
        type: String,
        required: [true, 'El autor es requerido'],
        trim: true,
        maxLength: [100, 'El autor no puede exceder 100 caracteres']
    },
    isbn: {
        type: String,
        required: [true, 'El ISBN es requerido'],
        unique: true,
        trim: true,
        match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Por favor ingrese un ISBN válido']
    },
    genre: {
        type: [String],
        default: [],
        validate: {
            validator: function(genres) {
                return genres.length <= 5;
            },
            message: 'Un libro no puede tener más de 5 géneros'
        }
    },
    publishedYear: {
        type: Number,
        min: [1000, 'El año de publicación debe ser mayor a 1000'],
        max: [new Date().getFullYear(), 'El año de publicación no puede ser futuro']
    },
    location: {
        type: String,
        trim: true,
        default: 'Estante General',
        maxLength: [100, 'La ubicación no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    language: {
        type: String,
        trim: true,
        default: 'Español',
        maxLength: [50, 'El idioma no puede exceder 50 caracteres']
    },
    publisher: {
        type: String,
        trim: true,
        maxLength: [100, 'La editorial no puede exceder 100 caracteres']
    },
    pages: {
        type: Number,
        min: [1, 'El número de páginas debe ser mayor a 0']
    },
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

// Índices para optimizar búsquedas
BookSchema.index({ title: 'text', author: 'text' });
BookSchema.index({ isbn: 1 });
BookSchema.index({ genre: 1 });
BookSchema.index({ isActive: 1 });

// Método virtual para obtener la información básica del libro
BookSchema.virtual('basicInfo').get(function() {
    return {
        id: this._id,
        title: this.title,
        author: this.author,
        isbn: this.isbn,
        location: this.location
    };
});

// Método para obtener la disponibilidad (se calculará con el modelo Loan)
BookSchema.methods.getAvailabilityInfo = async function() {
    const Loan = mongoose.model('Loan');
    
    const availability = await Loan.getBookAvailability(this._id);
    
    if (availability.length === 0) {
        return {
            totalCopies: 0,
            availableCopies: 0,
            borrowedCopies: 0,
            isAvailable: false
        };
    }
    
    const info = availability[0];
    return {
        ...info,
        isAvailable: info.availableCopies > 0
    };
};

// Método estático para búsqueda de texto
BookSchema.statics.searchBooks = function(searchTerm, options = {}) {
    const {
        genre = null,
        isActive = true,
        limit = 50,
        skip = 0
    } = options;
    
    let query = {
        $and: [
            { isActive: isActive },
            {
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { author: { $regex: searchTerm, $options: 'i' } },
                    { isbn: { $regex: searchTerm, $options: 'i' } }
                ]
            }
        ]
    };
    
    if (genre) {
        query.$and.push({ genre: { $in: [genre] } });
    }
    
    return this.find(query)
        .sort({ title: 1 })
        .limit(limit)
        .skip(skip);
};

// Método estático para encontrar libros activos
BookSchema.statics.findActiveBooks = function() {
    return this.find({ isActive: true }).sort({ title: 1 });
};

// Métodos para soft delete
BookSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

BookSchema.methods.softDelete = function() {
    this.isActive = false;
    this.deletedAt = new Date();
    return this.save();
};

BookSchema.methods.restore = function() {
    this.isActive = true;
    this.deletedAt = null;
    return this.save();
};

module.exports = mongoose.model('Book', BookSchema);