const express = require('express');
const router = express.Router();
const {
    createLoan,
    returnBook,
    postponeLoan,
    getLoansByUser,
    getOverdueLoans,
    getLoanHistory,
    createBookCopies
} = require('../controllers/loanController');

// Middleware de autenticación
const { protect, roleRequired } = require('../middlewares/authMiddleware');

// @desc    Obtener préstamos atrasados
// @route   GET /api/loans/overdue
// @query   ?page=1&limit=50
// @access  Private (Admin/SuperAdmin)
router.get('/overdue', protect, roleRequired(['admin', 'superadmin']), getOverdueLoans);

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

module.exports = router;
