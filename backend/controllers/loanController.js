const Loan = require('../models/loan');
const Book = require('../models/book');
const Student = require('../models/student');
const mongoose = require('mongoose');
const { validateLoanRules, calculateDueDate } = require('../middlewares/loanMiddleware');

// Crear un nuevo préstamo
const createLoan = async (req, res) => {
    try {
        const { bookId, studentId, copyNumber, dueDate, loanedBy = 'Sistema', loanType = 'standard' } = req.body;
        
        // Validaciones básicas
        if (!bookId || !studentId || !copyNumber) {
            return res.status(400).json({
                success: false,
                message: 'bookId, studentId y copyNumber son requeridos'
            });
        }
        
        // Verificar que el libro existe y está activo
        const book = await Book.findById(bookId);
        if (!book || !book.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado o inactivo'
            });
        }
        
        // Verificar que el estudiante existe y está activo
        const student = await Student.findById(studentId);
        if (!student || !student.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado o inactivo'
            });
        }

        // Validar reglas de negocio
        const validationResult = await validateLoanRules(studentId, bookId);
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                message: validationResult.error,
                data: validationResult.rules
            });
        }
        
        // Verificar si ya existe una copia con ese número para ese libro
        const existingCopy = await Loan.findOne({ bookId, copyNumber });
        
        if (existingCopy) {
            // Si existe, verificar que esté disponible
            if (existingCopy.status !== 'disponible') {
                return res.status(400).json({
                    success: false,
                    message: `La copia #${copyNumber} no está disponible. Estado actual: ${existingCopy.status}`
                });
            }
            
            // Actualizar la copia existente para prestarla
            existingCopy.studentId = studentId;
            existingCopy.isBorrowed = true;
            existingCopy.status = 'prestado';
            existingCopy.loanStartDate = new Date();
            existingCopy.dueDate = dueDate ? new Date(dueDate) : calculateDueDate(loanType, student.grade);
            existingCopy.loanedBy = loanedBy;
            existingCopy.returnDate = null;
            existingCopy.returnedBy = null;
            
            await existingCopy.save();
            
            const populatedLoan = await Loan.findById(existingCopy._id)
                .populate('bookId', 'title author isbn')
                .populate('studentId', 'name idNumber grade');
            
            return res.status(200).json({
                success: true,
                message: 'Préstamo creado exitosamente',
                data: {
                    loan: populatedLoan,
                    validationInfo: validationResult
                }
            });
        }
        
        // Si no existe la copia, crear una nueva
        const loan = new Loan({
            bookId,
            studentId,
            copyNumber,
            isBorrowed: true,
            status: 'prestado',
            loanStartDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : calculateDueDate(loanType, student.grade),
            loanedBy
        });
        
        await loan.save();
        
        const populatedLoan = await Loan.findById(loan._id)
            .populate('bookId', 'title author isbn')
            .populate('studentId', 'name idNumber grade');
        
        res.status(201).json({
            success: true,
            message: 'Préstamo creado exitosamente',
            data: {
                loan: populatedLoan,
                validationInfo: validationResult
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear el préstamo',
            error: error.message
        });
    }
};

// Devolver un libro
const returnBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { returnedBy = 'Sistema', notes = '', condition = 'bueno' } = req.body;
        
        const loan = await Loan.findById(id)
            .populate('bookId', 'title author isbn')
            .populate('studentId', 'name idNumber grade');
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }
        
        if (!loan.isBorrowed) {
            return res.status(400).json({
                success: false,
                message: 'Este libro ya ha sido devuelto'
            });
        }
        
        // Devolver el libro
        loan.returnBook(returnedBy, notes);
        
        // Si el libro está dañado o perdido, actualizar el estado
        if (condition === 'dañado') {
            loan.status = 'dañado';
        } else if (condition === 'perdido') {
            loan.status = 'perdido';
        } else {
            loan.status = 'disponible';
        }
        
        await loan.save();
        
        res.status(200).json({
            success: true,
            message: 'Libro devuelto exitosamente',
            data: loan
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al devolver el libro',
            error: error.message
        });
    }
};

// Renovar/Posponer un préstamo
const postponeLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { additionalDays = 7, reason = '' } = req.body;
        
        const loan = await Loan.findById(id)
            .populate('bookId', 'title author isbn')
            .populate('studentId', 'name idNumber grade');
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }
        
        if (!loan.isBorrowed) {
            return res.status(400).json({
                success: false,
                message: 'No se puede renovar un libro que no está prestado'
            });
        }
        
        try {
            loan.renewLoan(additionalDays);
            
            if (reason) {
                loan.notes = loan.notes ? `${loan.notes}. Renovado: ${reason}` : `Renovado: ${reason}`;
            }
            
            await loan.save();
            
            res.status(200).json({
                success: true,
                message: `Préstamo renovado por ${additionalDays} días adicionales`,
                data: loan
            });
            
        } catch (renewError) {
            return res.status(400).json({
                success: false,
                message: renewError.message
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al renovar el préstamo',
            error: error.message
        });
    }
};

// Obtener préstamos por estudiante
const getLoansByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        
        // Verificar que el estudiante existe
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        let filters = { studentId };
        if (status) {
            filters.status = status;
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        const loans = await Loan.find(filters)
            .populate('bookId', 'title author isbn location')
            .sort({ createdAt: -1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const total = await Loan.countDocuments(filters);
        
        res.status(200).json({
            success: true,
            data: {
                student: student.getFormattedInfo(),
                loans
            },
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los préstamos del estudiante',
            error: error.message
        });
    }
};

// Obtener préstamos atrasados
const getOverdueLoans = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        // Actualizar estados primero
        await Loan.updateMany(
            {
                isBorrowed: true,
                status: 'prestado',
                dueDate: { $lt: new Date() }
            },
            { status: 'atrasado' }
        );
        
        const overdueLoans = await Loan.find({ status: 'atrasado' })
            .populate('bookId', 'title author isbn location')
            .populate('studentId', 'name idNumber grade contactInfo')
            .sort({ dueDate: 1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const total = await Loan.countDocuments({ status: 'atrasado' });
        
        // Agregar días de atraso a cada préstamo
        const loansWithOverdueDays = overdueLoans.map(loan => ({
            ...loan.toObject(),
            overdueDays: loan.getOverdueDays()
        }));
        
        res.status(200).json({
            success: true,
            data: loansWithOverdueDays,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los préstamos atrasados',
            error: error.message
        });
    }
};

// Obtener historial completo de préstamos
const getLoanHistory = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, startDate, endDate, bookId, studentId } = req.query;
        
        // Construir filtros
        let filters = {};
        
        if (status) {
            filters.status = status;
        }
        
        if (bookId) {
            filters.bookId = bookId;
        }
        
        if (studentId) {
            filters.studentId = studentId;
        }
        
        if (startDate || endDate) {
            filters.loanStartDate = {};
            if (startDate) {
                filters.loanStartDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filters.loanStartDate.$lte = new Date(endDate);
            }
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        const loans = await Loan.find(filters)
            .populate('bookId', 'title author isbn location')
            .populate('studentId', 'name idNumber grade')
            .sort({ createdAt: -1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const total = await Loan.countDocuments(filters);
        
        res.status(200).json({
            success: true,
            data: loans,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de préstamos',
            error: error.message
        });
    }
};

// Crear múltiples copias de un libro
const createBookCopies = async (req, res) => {
    try {
        const { bookId, numberOfCopies } = req.body;
        
        if (!bookId || !numberOfCopies || numberOfCopies < 1) {
            return res.status(400).json({
                success: false,
                message: 'bookId y numberOfCopies (mayor a 0) son requeridos'
            });
        }
        
        // Verificar que el libro existe
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }
        
        // Encontrar el último número de copia para este libro
        const lastCopy = await Loan.findOne({ bookId })
            .sort({ copyNumber: -1 })
            .select('copyNumber');
            
        let startCopyNumber = lastCopy ? lastCopy.copyNumber + 1 : 1;
        
        const copies = [];
        for (let i = 0; i < numberOfCopies; i++) {
            copies.push({
                bookId,
                studentId: null,
                copyNumber: startCopyNumber + i,
                isBorrowed: false,
                status: 'disponible',
                loanStartDate: new Date(),
                dueDate: new Date()
            });
        }
        
        const createdCopies = await Loan.insertMany(copies);
        
        res.status(201).json({
            success: true,
            message: `${numberOfCopies} copias creadas exitosamente`,
            data: {
                book: book.basicInfo,
                copies: createdCopies
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear las copias del libro',
            error: error.message
        });
    }
};

module.exports = {
    createLoan,
    returnBook,
    postponeLoan,
    getLoansByStudent,
    getOverdueLoans,
    getLoanHistory,
    createBookCopies
};
