const express = require('express');
const router = express.Router();
const {
    createReservation,
    getMyReservations,
    getAllReservations,
    updateReservationStatus,
    cancelMyReservation,
    getSpaceAvailability,
    getSpaceUsageStats
} = require('../controllers/spaceUsageController');
const { protect, roleRequired } = require('../middlewares/authMiddleware');

// Rutas para usuarios
router.post('/reserve', protect, createReservation);
router.get('/my-reservations', protect, getMyReservations);
router.delete('/reservations/:id', protect, cancelMyReservation);
router.get('/availability', protect, getSpaceAvailability);

// Rutas administrativas
router.get('/reservations', protect, roleRequired(['admin', 'superadmin']), getAllReservations);
router.put('/reservations/:id/status', protect, roleRequired(['admin', 'superadmin']), updateReservationStatus);
router.get('/stats', protect, roleRequired(['admin', 'superadmin']), getSpaceUsageStats);

module.exports = router;
