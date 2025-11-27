const Loan = require('../models/loan');
const Book = require('../models/book');
const User = require('../models/user');
const mongoose = require('mongoose');
const { validateLoanRules, calculateDueDate } = require('../middlewares/loanMiddleware');
const Log = require('../models/Log');

// Crear una solicitud de préstamo (estado pendiente)
const createLoan = async (req, res) => {
    try {
        let { bookId, userId, copyNumber, dueDate, loanedBy = 'Sistema', loanType = 'standard', notes } = req.body;
        
        // Validaciones básicas
        if (!bookId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'bookId y userId son requeridos'
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
        
        // Si no se proporciona copyNumber, buscar una copia disponible del mismo ISBN
        if (!copyNumber) {
            // Buscar todas las copias con el mismo ISBN
            const allCopiesWithISBN = await Book.find({ 
                isbn: book.isbn, 
                isActive: true 
            }).select('_id');
            
            if (allCopiesWithISBN.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay copias disponibles de este libro'
                });
            }
            
            // Obtener IDs de todas las copias
            const copyIds = allCopiesWithISBN.map(copy => copy._id);
            
            // Buscar cuáles están prestadas
            const borrowedCopies = await Loan.find({
                bookId: { $in: copyIds },
                status: { $in: ['prestado', 'atrasado'] }
            }).distinct('bookId');
            
            // Encontrar una copia disponible
            const availableCopy = copyIds.find(id => 
                !borrowedCopies.some(borrowedId => borrowedId.toString() === id.toString())
            );
            
            if (!availableCopy) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay copias disponibles de este libro para préstamo'
                });
            }
            
            // Usar el bookId de la copia disponible
            bookId = availableCopy.toString();
            copyNumber = 1; // Usamos 1 como número de copia genérico
        }
        
        // Verificar que el usuario existe y está activo
        const user = await User.findById(userId).populate('personRef');
        if (!user || !user.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        // Validar reglas de negocio
        const validationResult = await validateLoanRules(userId, bookId);
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                message: validationResult.error,
                data: validationResult.rules
            });
        }
        
        // Crear solicitud en estado 'pendiente' (no asigna copia ni descuenta disponibilidad todavía)
        const loan = new Loan({
            bookId,
            userId,
            tipoPersona: user.tipoPersona,
            isBorrowed: false,
            status: 'pendiente',
            loanedBy,
            notes: notes || ''
        });

        await loan.save();

        const populatedLoan = await Loan.findById(loan._id)
            .populate('bookId', 'title author isbn coverImage')
            .populate('userId', 'username tipoPersona personRef');

        res.status(201).json({
            success: true,
            message: 'Solicitud de préstamo creada y pendiente de aprobación',
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

// Aprobar una solicitud de préstamo (admin/superadmin)
const approveLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { dueDays = 7, loanType = 'standard' } = req.body;
        const pending = await Loan.findById(id).populate('bookId', 'isbn title').populate('userId', 'tipoPersona personRef');
        if (!pending) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (pending.status !== 'pendiente') {
            return res.status(400).json({ success: false, message: 'La solicitud no está en estado pendiente' });
        }

        // VALIDACIÓN: Verificar disponibilidad de copias antes de aprobar
        const book = await Book.findById(pending.bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Libro no encontrado' });
        }
        
        const availability = await book.getAvailabilityInfo();
        if (!availability.isAvailable || availability.availableCopies <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No hay copias disponibles de este libro para aprobar el préstamo',
                availability: availability
            });
        }

        // Buscar copia disponible del mismo bookId
        let copy = await Loan.findOne({ bookId: pending.bookId, status: 'disponible' });
        const now = new Date();
        const Person = require('../models/person');
        // Obtener grado para dueDate
        const user = await User.findById(pending.userId).populate('personRef');
        const calculatedDue = calculateDueDate ? calculateDueDate(loanType, user?.personRef?.grado) : new Date(now.getTime() + dueDays*24*60*60*1000);

        if (copy) {
            copy.userId = pending.userId;
            copy.tipoPersona = user.tipoPersona;
            copy.isBorrowed = true;
            copy.status = 'prestado';
            copy.loanStartDate = now;
            copy.dueDate = calculatedDue;
            copy.loanedBy = req.user?.username || 'Sistema';
            await copy.save();
        } else {
            // No existe copia disponible: crear una nueva copia con siguiente número
            const lastCopy = await Loan.findOne({ bookId: pending.bookId }).sort({ copyNumber: -1 }).select('copyNumber');
            const nextCopy = lastCopy ? (lastCopy.copyNumber || 0) + 1 : 1;
            copy = await Loan.create({
                bookId: pending.bookId,
                userId: pending.userId,
                tipoPersona: user.tipoPersona,
                copyNumber: nextCopy,
                isBorrowed: true,
                status: 'prestado',
                loanStartDate: now,
                dueDate: calculatedDue,
                loanedBy: req.user?.username || 'Sistema',
                notes: pending.notes || ''
            });
        }

        // Soft-delete de la solicitud pendiente para mantener historial
        pending.isActive = false;
        pending.status = 'prestado'; // ✅ CAMBIAR STATUS PARA QUE NO APAREZCA EN PENDIENTES
        pending.copyNumber = copy.copyNumber; // ✅ Agregar copyNumber para cumplir validación
        pending.deletedAt = new Date();
        pending.notes = pending.notes ? `${pending.notes}. Aprobada y materializada en copia` : 'Aprobada y materializada en copia';
        await pending.save();

        // Registrar log de préstamo aprobado
        await Log.crear({
            tipo: 'INFO',
            categoria: 'LOAN',
            accion: 'LOAN_APPROVED',
            descripcion: `Préstamo aprobado: ${pending.bookId.title} para ${user.username}`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                loanId: copy._id,
                bookId: pending.bookId._id,
                bookTitle: pending.bookId.title,
                bookIsbn: pending.bookId.isbn,
                userId: pending.userId._id,
                userUsername: user.username,
                copyNumber: copy.copyNumber,
                dueDate: calculatedDue,
                loanType: loanType
            }
        });

        const populated = await Loan.findById(copy._id)
            .populate('bookId', 'title author isbn coverImage')
            .populate('userId', 'username tipoPersona personRef');

        res.status(200).json({ success: true, message: 'Solicitud aprobada', data: populated });
    } catch (error) {
        console.error('approveLoan error:', error);
        res.status(500).json({ success: false, message: 'Error al aprobar la solicitud', error: error.message });
    }
};

// Rechazar una solicitud de préstamo (admin/superadmin)
const rejectLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = '' } = req.body;
        const pending = await Loan.findById(id);
        if (!pending) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        if (pending.status !== 'pendiente') return res.status(400).json({ success: false, message: 'La solicitud no está en estado pendiente' });

        pending.status = 'rechazado';
        pending.isBorrowed = false;
        if (reason) pending.notes = pending.notes ? `${pending.notes}. Rechazo: ${reason}` : `Rechazo: ${reason}`;
        await pending.save();

        res.status(200).json({ success: true, message: 'Solicitud rechazada', data: pending });
    } catch (error) {
        console.error('rejectLoan error:', error);
        res.status(500).json({ success: false, message: 'Error al rechazar la solicitud', error: error.message });
    }
};

// Devolver un libro
const returnBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { returnedBy = 'Sistema', notes = '', condition = 'bueno' } = req.body;
        
        const loan = await Loan.findById(id)
            .populate('bookId', 'title author isbn coverImage')
            .populate({
                path: 'userId',
                select: 'username tipoPersona personRef',
                populate: {
                    path: 'personRef',
                    select: 'name idNumber grado'
                }
            });
        
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
            loan.status = 'devuelto';
        }
        
        await loan.save();
        
        // Transformar respuesta al formato del frontend
        const transformedLoan = await transformLoanForFrontend(loan);
        
        res.status(200).json({
            success: true,
            message: 'Libro devuelto exitosamente',
            data: transformedLoan
        });
        
    } catch (error) {
        console.error('Error en returnBook:', error);
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
            .populate('bookId', 'title author isbn coverImage')
            .populate('userId', 'username tipoPersona personRef');
        
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

// Obtener préstamos por usuario
const getLoansByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;
        
        // Verificar que el usuario existe
        const user = await User.findById(userId).populate('personRef');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        let filters = { userId };
        if (status) {
            filters.status = status;
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        const loans = await Loan.find(filters)
            .populate('bookId', 'title author isbn location coverImage')
            .sort({ createdAt: -1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const total = await Loan.countDocuments(filters);
        
        res.status(200).json({
            success: true,
            data: {
                user: user.getUserInfo(),
                person: user.personRef ? user.personRef.getBasicInfo() : null,
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
            .populate('bookId', 'title author isbn location coverImage')
            .populate('userId', 'username tipoPersona personRef')
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

// Helper function para mapear status interno a frontend
const mapStatusToFrontend = (loan) => {
    let frontendStatus = 'borrowed';
    if (loan.status === 'devuelto' || loan.status === 'disponible') {
        frontendStatus = 'returned';
    } else if (loan.status === 'atrasado') {
        frontendStatus = 'overdue';
    } else if (loan.status === 'pendiente') {
        frontendStatus = 'pending';
    } else if (loan.status === 'rechazado') {
        frontendStatus = 'rejected';
    } else if (loan.status === 'prestado') {
        frontendStatus = 'borrowed';
    }
    
    return frontendStatus;
};

// Helper function para transformar loan al formato del frontend
const transformLoanForFrontend = async (loan) => {
    const Person = require('../models/person');
    
    const loanObj = loan.toObject ? loan.toObject() : loan;
    
    // Obtener info de la persona si existe userId
    let studentInfo = null;
    if (loanObj.userId && loanObj.userId.personRef) {
        const personId = loanObj.userId.personRef._id || loanObj.userId.personRef;
        const person = await Person.findById(personId);
        
        if (person) {
            studentInfo = {
                _id: person._id,
                name: (person.getNombreCompleto && person.getNombreCompleto()) || [person.apellido1, person.nombre1].filter(Boolean).join(' '),
                idNumber: person.doc || person.idNumber || '',
                grade: person.grado || ''
            };
        }
    }
    
    return {
        ...loanObj,
        status: mapStatusToFrontend(loanObj),
        loanDate: loanObj.loanStartDate,
        studentId: studentInfo || {
            _id: loanObj.userId?._id || '',
            name: 'Usuario desconocido',
            idNumber: '',
            grade: ''
        }
    };
};

// Obtener historial completo de préstamos
const getLoanHistory = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, startDate, endDate, bookId, userId, tipoPersona } = req.query;
        
        // Mapear status del frontend al backend si viene
        let backendStatus = null;
        if (status) {
            const statusMap = {
                'borrowed,overdue': ['prestado', 'atrasado'],
                'borrowed': 'prestado',
                'returned': 'devuelto',
                'overdue': 'atrasado',
                'pending': 'pendiente',
                'active': 'prestado',
                'pendiente': 'pendiente',  // Soporte directo para español
                'activo': 'prestado',      // Soporte directo para español
                'devuelto': 'devuelto'     // Soporte directo para español
            };
            
            if (status.includes(',')) {
                backendStatus = { $in: statusMap[status] || ['prestado', 'atrasado'] };
            } else {
                backendStatus = statusMap[status] || status;
            }
        }
        
        // Construir filtros
        let filters = { isActive: true }; // Solo préstamos activos
        
        if (backendStatus) {
            filters.status = backendStatus;
        }
        
        if (bookId) {
            filters.bookId = bookId;
        }
        
        if (userId) {
            filters.userId = userId;
        }
        
        if (tipoPersona) {
            filters.tipoPersona = tipoPersona;
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
            .populate('bookId', 'title author isbn location coverImage')
            .populate({
                path: 'userId',
                select: 'username tipoPersona personRef',
                populate: {
                    path: 'personRef',
                    select: 'name idNumber grado'
                }
            })
            .sort({ createdAt: -1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const total = await Loan.countDocuments(filters);
        
        // Transformar loans al formato del frontend
        const transformedLoans = await Promise.all(
            loans.map(loan => transformLoanForFrontend(loan))
        );
        
        res.status(200).json({
            success: true,
            data: transformedLoans,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });
        
    } catch (error) {
        console.error('Error en getLoanHistory:', error);
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
                userId: null, // Sin usuario asignado inicialmente
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

// Obtener préstamos del usuario actual
const getMyLoans = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Buscar préstamos del usuario
        const loans = await Loan.find({ 
            userId: userId,
            isActive: true 
        })
        .populate('bookId', 'title author isbn coverImage')
        .populate('userId', 'username')
        .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            loans: loans,
            count: loans.length
        });
        
    } catch (error) {
        console.error('Error getting my loans:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener préstamos',
            error: error.message
        });
    }
};

// Solicitar prórroga de préstamo
const requestExtension = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, requestedDays = 7 } = req.body;
        
        // Buscar el préstamo
        const loan = await Loan.findById(id).populate('bookId').populate('userId');
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Préstamo no encontrado'
            });
        }
        
        // Verificar que el préstamo esté activo
        if (loan.status !== 'prestado') {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede solicitar prórroga para préstamos activos'
            });
        }
        
        // Verificar que el usuario solicitante sea el dueño del préstamo o un admin
        if (loan.userId._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para solicitar prórroga de este préstamo'
            });
        }
        
        // Crear solicitud de prórroga
        const extensionRequest = {
            loanId: loan._id,
            requestedBy: req.user.id,
            reason: reason || 'Solicitud de prórroga',
            requestedDays: parseInt(requestedDays),
            currentDueDate: loan.dueDate,
            requestedDate: new Date(),
            status: 'pending', // pending, approved, rejected
            reviewedBy: null,
            reviewedAt: null,
            reviewComments: null
        };
        
        // Guardar la solicitud (podría ser en una colección separada o como un campo en el préstamo)
        loan.extensionRequest = extensionRequest;
        await loan.save();
        
        // Registrar log
        await Log.crear({
            tipo: 'INFO',
            categoria: 'LOAN',
            accion: 'EXTENSION_REQUESTED',
            descripcion: `Solicitud de prórroga para préstamo de "${loan.bookId.title}"`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                loanId: loan._id,
                bookTitle: loan.bookId.title,
                requestedDays: requestedDays,
                reason: reason
            }
        });
        
        res.status(200).json({
            success: true,
            message: 'Solicitud de prórroga enviada correctamente',
            data: {
                loanId: loan._id,
                requestStatus: 'pending'
            }
        });
        
    } catch (error) {
        console.error('Error requesting extension:', error);
        res.status(500).json({
            success: false,
            message: 'Error al solicitar prórroga',
            error: error.message
        });
    }
};

// Aprobar/rechazar solicitud de prórroga
const reviewExtensionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, reviewComments, newDueDate } = req.body;
        
        // Buscar el préstamo con solicitud de prórroga
        const loan = await Loan.findById(id).populate('bookId').populate('userId');
        if (!loan || !loan.extensionRequest) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de prórroga no encontrada'
            });
        }
        
        // Verificar que sea admin o superadmin
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para revisar solicitudes de prórroga'
            });
        }
        
        // Actualizar la solicitud
        loan.extensionRequest.status = approved ? 'approved' : 'rejected';
        loan.extensionRequest.reviewedBy = req.user.id;
        loan.extensionRequest.reviewedAt = new Date();
        loan.extensionRequest.reviewComments = reviewComments || '';
        
        if (approved) {
            // Aprobar la prórroga - extender la fecha de devolución
            const newDate = newDueDate ? new Date(newDueDate) : 
                           new Date(loan.dueDate.getTime() + loan.extensionRequest.requestedDays * 24 * 60 * 60 * 1000);
            loan.dueDate = newDate;
            loan.extensionRequest.approvedDueDate = newDate;
        }
        
        await loan.save();
        
        // Registrar log
        await Log.crear({
            tipo: 'INFO',
            categoria: 'LOAN',
            accion: approved ? 'EXTENSION_APPROVED' : 'EXTENSION_REJECTED',
            descripcion: `${approved ? 'Aprobada' : 'Rechazada'} solicitud de prórroga para "${loan.bookId.title}"`,
            usuario: req.user.id,
            usuarioNombre: req.user.username,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            datos: {
                loanId: loan._id,
                bookTitle: loan.bookId.title,
                approved: approved,
                reviewComments: reviewComments
            }
        });
        
        res.status(200).json({
            success: true,
            message: `Solicitud de prórroga ${approved ? 'aprobada' : 'rechazada'} correctamente`,
            data: {
                loanId: loan._id,
                status: loan.extensionRequest.status,
                newDueDate: approved ? loan.dueDate : null
            }
        });
        
    } catch (error) {
        console.error('Error reviewing extension request:', error);
        res.status(500).json({
            success: false,
            message: 'Error al revisar solicitud de prórroga',
            error: error.message
        });
    }
};

module.exports = {
    createLoan,
    returnBook,
    requestExtension,
    reviewExtensionRequest,
    getMyLoans,
    postponeLoan,
    getLoansByUser,
    getOverdueLoans,
    getLoanHistory,
    createBookCopies,
    approveLoan,
    rejectLoan
};
