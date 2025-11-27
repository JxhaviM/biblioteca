const express = require('express');
const router = express.Router();
const {
  getSystemStats,
  getUsersReport,
  getBooksReport,
  getLoansReport,
  getSystemActivity,
  exportReport,
  getRealTimeStats
} = require('../controllers/reportController');
const { protect, roleRequired } = require('../middlewares/authMiddleware');

// Middleware de autenticación para todas las rutas
router.use(protect);

// Estadísticas generales del sistema
router.get('/stats', roleRequired(['admin', 'superadmin']), getSystemStats);

// Reporte de usuarios
router.get('/users', roleRequired(['admin', 'superadmin']), getUsersReport);

// Reporte de libros
router.get('/books', roleRequired(['admin', 'superadmin']), getBooksReport);

// Reporte de préstamos
router.get('/loans', roleRequired(['admin', 'superadmin']), getLoansReport);

// Actividad del sistema (solo superadmin)
router.get('/activity', roleRequired(['superadmin']), getSystemActivity);

// Estadísticas en tiempo real
router.get('/realtime', getRealTimeStats);

// Exportar reportes
router.get('/export/:reportType', roleRequired(['admin', 'superadmin']), exportReport);

module.exports = router;
