const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'La referencia al libro es requerida']
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'La referencia al estudiante es requerida']
    },
    copyNumber: {
        type: Number,
        required: [true, 'El número de copia es requerido'],
        min: [1, 'El número de copia debe ser mayor a 0']
    },
    isBorrowed: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: {
            values: ['disponible', 'prestado', 'atrasado', 'devuelto', 'perdido', 'dañado'],
            message: 'El estado debe ser: disponible, prestado, atrasado, devuelto, perdido o dañado'
        },
        default: 'prestado'
    },
    loanStartDate: {
        type: Date,
        default: Date.now,
        required: [true, 'La fecha de inicio del préstamo es requerida']
    },
    dueDate: {
        type: Date,
        required: [true, 'La fecha de vencimiento es requerida']
    },
    returnDate: {
        type: Date,
        default: null
    },
    renewalCount: {
        type: Number,
        default: 0,
        min: [0, 'El número de renovaciones no puede ser negativo']
    },
    maxRenewals: {
        type: Number,
        default: 2,
        min: [0, 'El máximo de renovaciones no puede ser negativo']
    },
    notes: {
        type: String,
        trim: true,
        maxLength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    loanedBy: {
        type: String,
        trim: true,
        default: 'Sistema'
    },
    returnedBy: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Índices compuestos para optimizar consultas
LoanSchema.index({ bookId: 1, copyNumber: 1 });
LoanSchema.index({ studentId: 1, status: 1 });
LoanSchema.index({ status: 1, dueDate: 1 });
LoanSchema.index({ isBorrowed: 1, status: 1 });

// Middleware para calcular si el préstamo está atrasado
LoanSchema.pre('save', function(next) {
    const now = new Date();
    
    // Solo actualizar a 'atrasado' si está prestado y pasó la fecha de vencimiento
    if (this.isBorrowed && this.status === 'prestado' && this.dueDate < now) {
        this.status = 'atrasado';
    }
    
    // Si se está devolviendo, actualizar campos relevantes
    if (!this.isBorrowed && this.status === 'prestado') {
        this.status = 'devuelto';
        this.returnDate = now;
    }
    
    next();
});

// Método para verificar si el préstamo está atrasado
LoanSchema.methods.isOverdue = function() {
    const now = new Date();
    return this.isBorrowed && this.dueDate < now;
};

// Método para calcular días de atraso
LoanSchema.methods.getOverdueDays = function() {
    if (!this.isOverdue()) return 0;
    
    const now = new Date();
    const diffTime = Math.abs(now - this.dueDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Método para renovar préstamo
LoanSchema.methods.renewLoan = function(additionalDays = 7) {
    if (this.renewalCount >= this.maxRenewals) {
        throw new Error('Se ha alcanzado el máximo número de renovaciones permitidas');
    }
    
    if (this.status !== 'prestado' && this.status !== 'atrasado') {
        throw new Error('Solo se pueden renovar libros prestados o atrasados');
    }
    
    // Agregar días a la fecha de vencimiento
    this.dueDate = new Date(this.dueDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
    this.renewalCount += 1;
    
    // Si estaba atrasado y se renueva, cambiar a prestado
    if (this.status === 'atrasado') {
        this.status = 'prestado';
    }
    
    return this;
};

// Método para devolver libro
LoanSchema.methods.returnBook = function(returnedBy = 'Sistema', notes = '') {
    this.isBorrowed = false;
    this.status = 'devuelto';
    this.returnDate = new Date();
    this.returnedBy = returnedBy;
    
    if (notes) {
        this.notes = this.notes ? `${this.notes}. ${notes}` : notes;
    }
    
    return this;
};

// Método estático para encontrar préstamos activos de un estudiante
LoanSchema.statics.findActiveLoansForStudent = function(studentId) {
    return this.find({
        studentId: studentId,
        isBorrowed: true,
        status: { $in: ['prestado', 'atrasado'] }
    }).populate('bookId', 'title author isbn');
};

// Método estático para encontrar préstamos atrasados
LoanSchema.statics.findOverdueLoans = function() {
    const now = new Date();
    return this.find({
        isBorrowed: true,
        dueDate: { $lt: now },
        status: { $in: ['prestado', 'atrasado'] }
    }).populate('bookId', 'title author isbn')
      .populate('studentId', 'name idNumber grade');
};

// Método estático para verificar disponibilidad de un libro
LoanSchema.statics.getBookAvailability = function(bookId) {
    return this.aggregate([
        { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
        {
            $group: {
                _id: '$bookId',
                totalCopies: { $sum: 1 },
                availableCopies: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'disponible'] },
                            1,
                            0
                        ]
                    }
                },
                borrowedCopies: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['prestado', 'atrasado']] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('Loan', LoanSchema);
