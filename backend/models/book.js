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
        maxLength: [300, 'El autor no puede exceder 300 caracteres']
    },
    isbn: {
        type: String,
        required: [true, 'El ISBN es requerido'],
        trim: true,
        // Permitir ISBN de 5 a 17 caracteres (libros antiguos pueden tener menos de 10)
        match: [/^[0-9X\-\s]{5,17}$/, 'Por favor ingrese un ISBN válido (5-17 caracteres, números, X y guiones)']
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
        default: 'es', // Cambiar a código ISO
        maxLength: [50, 'El idioma no puede exceder 50 caracteres']
    },
    coverImage: {
        type: String,
        trim: true,
        default: '',
        maxLength: [500, 'La URL de la portada no puede exceder 500 caracteres']
    },
    estadoLibro: {
        type: String,
        enum: ['Bueno', 'Regular', 'Malo'],
        default: 'Bueno',
        required: true
    },
    grado: {
        type: String,
        trim: true,
        default: '',
        maxLength: [50, 'El grado no puede exceder 50 caracteres']
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
    initialCopies: {
        type: Number,
        default: 1,
        min: [1, 'Debe haber al menos 1 copia'],
        max: [999, 'No se pueden crear más de 999 copias']
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
// Temporalmente comentado para evitar conflictos con language override
// BookSchema.index({ title: 'text', author: 'text' }, { 
//     default_language: 'spanish',
//     language_override: 'idioma' // Usar un campo que no existe para evitar conflictos
// });
BookSchema.index({ title: 1 }); // Índice simple en lugar de texto
BookSchema.index({ author: 1 }); // Índice simple en lugar de texto
// Note: isbn ya tiene unique: true en el schema, no necesita índice adicional
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

// Método para obtener la disponibilidad (calcula copias por ISBN)
BookSchema.methods.getAvailabilityInfo = async function() {
    const Book = mongoose.model('Book');
    const Loan = mongoose.model('Loan');
    
    // Encontrar TODOS los libros con el mismo ISBN Y MISMO GRADO (libros educativos)
    const booksWithSameIsbn = await Book.find({ 
        isbn: this.isbn, 
        grado: this.grado, // Filtrar también por grado
        isActive: true 
    }).select('_id');
    
    if (booksWithSameIsbn.length === 0) {
        return {
            totalCopies: 0,
            availableCopies: 0,
            borrowedCopies: 0,
            isAvailable: false
        };
    }
    
    // Obtener IDs de todos los libros con mismo ISBN
    const bookIds = booksWithSameIsbn.map(book => book._id);
    
    // Contar COPIAS REALES en la colección Loan para estos libros
    // Excluir solicitudes pendientes y rechazadas que no son copias reales
    const totalCopies = await Loan.countDocuments({ 
        bookId: { $in: bookIds },
        isActive: true,
        status: { $nin: ['pendiente', 'rechazado'] }  // Excluir solicitudes
    });
    
    // Si no hay copias en Loan, usar el número de libros como copias (compatibilidad con libros antiguos)
    const finalTotalCopies = totalCopies > 0 ? totalCopies : booksWithSameIsbn.length;
    
    if (finalTotalCopies === 0) {
        return {
            totalCopies: 0,
            availableCopies: 0,
            borrowedCopies: 0,
            isAvailable: false
        };
    }
    
    // Contar cuántas copias están prestadas actualmente
    let borrowedCount = 0;
    if (totalCopies > 0) {
        // Si hay copias reales, contar las prestadas (excluir pendientes y rechazadas)
        borrowedCount = await Loan.countDocuments({ 
            bookId: { $in: bookIds },
            isBorrowed: true,
            isActive: true,
            status: { $nin: ['pendiente', 'rechazado'] }  // Excluir solicitudes
        });
    } else {
        // Si no hay copias en Loan, contar préstamos directos (compatibilidad)
        borrowedCount = await Loan.countDocuments({ 
            bookId: { $in: bookIds },
            isBorrowed: true,
            status: { $nin: ['pendiente', 'rechazado'] }  // Excluir solicitudes
        });
    }
    
    const availableCopies = finalTotalCopies - borrowedCount;
    
    // Debug temporal
    console.log(`📊 Disponibilidad para ISBN ${this.isbn}:`);
    console.log(`  - Libros encontrados: ${booksWithSameIsbn.length}`);
    console.log(`  - Copias en Loan: ${totalCopies}`);
    console.log(`  - Total final: ${finalTotalCopies}`);
    console.log(`  - Copias prestadas: ${borrowedCount}`);
    console.log(`  - Copias disponibles: ${availableCopies}`);
    
    return {
        totalCopies: finalTotalCopies,
        availableCopies: availableCopies,
        borrowedCopies: borrowedCount,
        isAvailable: availableCopies > 0
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