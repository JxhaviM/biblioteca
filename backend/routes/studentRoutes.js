const express = require('express');
const router = express.Router();
const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentLoanHistory,
    getStudentStats
} = require('../controllers/studentController');

// Middleware de autenticación (comentado por ahora, se puede activar después)
// const { protect } = require('../middlewares/authMiddleware');

// @desc    Obtener todos los estudiantes con filtros y paginación
// @route   GET /api/students
// @query   ?page=1&limit=50&search=nombre&grade=grado&isActive=true
// @access  Private
router.get('/', getStudents);

// @desc    Obtener estadísticas de un estudiante específico
// @route   GET /api/students/:id/stats
// @access  Private
router.get('/:id/stats', getStudentStats);

// @desc    Obtener historial de préstamos de un estudiante
// @route   GET /api/students/:id/loans
// @query   ?page=1&limit=20&status=prestado
// @access  Private
router.get('/:id/loans', getStudentLoanHistory);

// @desc    Obtener un estudiante por ID
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', getStudentById);

// @desc    Crear un nuevo estudiante
// @route   POST /api/students
// @body    { name, idNumber, grade, contactInfo, notes }
// @access  Private
router.post('/', createStudent);

// @desc    Actualizar un estudiante
// @route   PUT /api/students/:id
// @body    { name, grade, contactInfo, notes, isActive }
// @access  Private
router.put('/:id', updateStudent);

// @desc    Desactivar un estudiante (soft delete)
// @route   DELETE /api/students/:id
// @access  Private
router.delete('/:id', deleteStudent);

module.exports = router;
