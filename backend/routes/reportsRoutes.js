const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getLoanReport,
    getPopularBooksReport,
    getActiveStudentsReport,
    runMaintenance,
    getAutomaticReport
} = require('../controllers/reportsController');

// Middleware de autenticación (comentado por ahora, se puede activar después)
// const { protect } = require('../middlewares/authMiddleware');

// @desc    Obtener dashboard con estadísticas generales
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', getDashboard);

// @desc    Generar reporte de préstamos por período
// @route   GET /api/reports/loans
// @query   ?startDate=2024-01-01&endDate=2024-12-31&format=json|summary
// @access  Private
router.get('/loans', getLoanReport);

// @desc    Obtener reporte de libros más populares
// @route   GET /api/reports/popular-books
// @query   ?period=30&limit=20
// @access  Private
router.get('/popular-books', getPopularBooksReport);

// @desc    Obtener reporte de estudiantes más activos
// @route   GET /api/reports/active-students
// @query   ?period=30&limit=20
// @access  Private
router.get('/active-students', getActiveStudentsReport);

// @desc    Ejecutar mantenimiento manual de la base de datos
// @route   POST /api/reports/maintenance
// @access  Private
router.post('/maintenance', runMaintenance);

// @desc    Generar reporte automático semanal
// @route   GET /api/reports/automatic
// @access  Private
router.get('/automatic', getAutomaticReport);

module.exports = router;
