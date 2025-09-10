const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getTodayAttendances,
    getAttendanceHistory,
    getAttendanceStats,
    getActiveAttendances
} = require('../controllers/attendanceController');
const { protect, roleRequired } = require('../middlewares/authMiddleware');

// Rutas para marcar entrada y salida
router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);

// Rutas de consulta
router.get('/active', protect, getActiveAttendances);
router.get('/today', protect, getTodayAttendances);

// Rutas administrativas
router.get('/history', protect, roleRequired(['admin', 'superadmin']), getAttendanceHistory);
router.get('/stats', protect, roleRequired(['admin', 'superadmin']), getAttendanceStats);

module.exports = router;
