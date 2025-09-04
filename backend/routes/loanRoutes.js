const express = require('express');
const router = express.Router();
const {
    createLoan,
    returnBook,
    postponeLoan,
    getLoansByStudent,
    getOverdueLoans,
    getLoanHistory,
    createBookCopies
} = require('../controllers/loanController');

// Middleware de autenticación (comentado por ahora, se puede activar después)
// const { protect } = require('../middlewares/authMiddleware');

// @desc    Obtener préstamos atrasados
// @route   GET /api/loans/overdue
// @query   ?page=1&limit=50
// @access  Private
router.get('/overdue', getOverdueLoans);

// @desc    Crear múltiples copias de un libro
// @route   POST /api/loans/create-copies
// @body    { bookId, numberOfCopies }
// @access  Private
router.post('/create-copies', createBookCopies);

// @desc    Obtener préstamos por estudiante
// @route   GET /api/loans/student/:studentId
// @query   ?status=prestado&page=1&limit=20
// @access  Private
router.get('/student/:studentId', getLoansByStudent);

// @desc    Obtener historial completo de préstamos con filtros
// @route   GET /api/loans
// @query   ?page=1&limit=50&status=prestado&startDate=2024-01-01&endDate=2024-12-31&bookId=id&studentId=id
// @access  Private
router.get('/', getLoanHistory);

// @desc    Crear un nuevo préstamo
// @route   POST /api/loans
// @body    { bookId, studentId, copyNumber, dueDate?, loanedBy?, loanType? }
// @access  Private
router.post('/', createLoan);

// @desc    Devolver un libro
// @route   PUT /api/loans/:id/return
// @body    { returnedBy?, notes?, condition? }
// @access  Private
router.put('/:id/return', returnBook);

// @desc    Renovar/Posponer un préstamo
// @route   PUT /api/loans/:id/renew
// @body    { additionalDays?, reason? }
// @access  Private
router.put('/:id/renew', postponeLoan);

module.exports = router;
