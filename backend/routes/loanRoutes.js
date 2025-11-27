const express = require('express');
const router = express.Router();
const Loan = require('../models/loan');
const {
    createLoan,
    returnBook,
    postponeLoan,
    getLoansByUser,
    getOverdueLoans,
    getLoanHistory,
    createBookCopies,
    approveLoan,
    rejectLoan,
    requestExtension,
    reviewExtensionRequest,
    getMyLoans
} = require('../controllers/loanController');

// Middleware de autenticación
const { protect, roleRequired } = require('../middlewares/authMiddleware');

// @desc    Obtener préstamos atrasados
// @route   GET /api/loans/overdue
// @query   ?page=1&limit=50
// @access  Private (Admin/SuperAdmin)
router.get('/overdue', protect, roleRequired(['admin', 'superadmin']), getOverdueLoans);

// @desc    Obtener préstamos del usuario actual
// @route   GET /api/loans/my-loans
// @access  Private
router.get('/my-loans', protect, getMyLoans);

// @desc    Crear múltiples copias de un libro
// @route   POST /api/loans/create-copies
// @body    { bookId, numberOfCopies }
// @access  Private (Admin/SuperAdmin)
router.post('/create-copies', protect, roleRequired(['admin', 'superadmin']), createBookCopies);

// @desc    Obtener préstamos por usuario
// @route   GET /api/loans/user/:userId
// @query   ?status=prestado&page=1&limit=20
// @access  Private
router.get('/user/:userId', protect, getLoansByUser);

// @desc    Obtener conteo de préstamos pendientes
// @route   GET /api/loans/pending-count
// @access  Private (Admin/SuperAdmin)
router.get('/pending-count', protect, roleRequired(['admin', 'superadmin']), async (req, res) => {
    try {
        const count = await Loan.countDocuments({ 
            status: 'pendiente', 
            isActive: true 
        });
        
        res.status(200).json({
            success: true,
            data: count
        });
    } catch (error) {
        console.error('Error en pending-count:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conteo de pendientes',
            error: error.message
        });
    }
});

// @desc    Obtener historial completo de préstamos con filtros
// @route   GET /api/loans
// @query   ?page=1&limit=50&status=prestado&startDate=2024-01-01&endDate=2024-12-31&bookId=id&userId=id&tipoPersona=Estudiante
// @access  Private (Admin/SuperAdmin)
router.get('/', protect, roleRequired(['admin', 'superadmin']), getLoanHistory);

// @desc    Crear un nuevo préstamo
// @route   POST /api/loans
// @body    { bookId, userId, copyNumber, dueDate?, loanedBy?, loanType? }
// @access  Private
router.post('/', protect, createLoan);

// @desc    Aprobar préstamo (solo admin/superadmin)
// @route   PUT /api/loans/:id/approve
// @access  Private (Admin/SuperAdmin)
router.put('/:id/approve', protect, roleRequired(['admin', 'superadmin']), approveLoan);

// @desc    Rechazar una solicitud de préstamo
// @route   PUT /api/loans/:id/reject
// @access  Private (Admin/SuperAdmin)
router.put('/:id/reject', protect, roleRequired(['admin', 'superadmin']), rejectLoan);

// @desc    Devolver un libro
// @route   PUT /api/loans/:id/return
// @body    { returnedBy?, notes?, condition? }
// @access  Private (Admin/SuperAdmin)
router.put('/:id/return', protect, roleRequired(['admin', 'superadmin']), returnBook);

// @desc    Renovar/Posponer un préstamo
// @route   PUT /api/loans/:id/renew
// @body    { additionalDays?, reason? }
// @access  Private
router.put('/:id/renew', protect, postponeLoan);

// @desc    Solicitar prórroga de préstamo
// @route   POST /api/loans/:id/request-extension
// @body    { reason?, requestedDays? }
// @access  Private (User dueño del préstamo o Admin)
router.post('/:id/request-extension', protect, requestExtension);

// @desc    Aprobar/rechazar solicitud de prórroga
// @route   PUT /api/loans/:id/review-extension
// @body    { approved, reviewComments?, newDueDate? }
// @access  Private (Admin/SuperAdmin)
router.put('/:id/review-extension', protect, roleRequired(['admin', 'superadmin']), reviewExtensionRequest);

module.exports = router;
