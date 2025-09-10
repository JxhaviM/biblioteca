const express = require('express');
const router = express.Router();
const {
    getPersons,
    getPersonById,
    createPerson,
    createPersonsBulk,
    updatePerson,
    changePersonStatus,
    getPersonsByGrade,
    searchPersons,
    getPersonsStats,
    getPersonsWithoutAccount
} = require('../controllers/personController');
const { protect, roleRequired } = require('../middlewares/authMiddleware');

// Rutas públicas para búsqueda (con autenticación)
router.get('/search', protect, searchPersons);

// Rutas para administradores
router.get('/stats', protect, roleRequired(['admin', 'superadmin']), getPersonsStats);
router.get('/without-account', protect, roleRequired(['admin', 'superadmin']), getPersonsWithoutAccount);
router.get('/by-grade/:grado', protect, roleRequired(['admin', 'superadmin']), getPersonsByGrade);

router.get('/', protect, roleRequired(['admin', 'superadmin']), getPersons);
router.post('/', protect, roleRequired(['admin', 'superadmin']), createPerson);
router.post('/bulk', protect, roleRequired(['admin', 'superadmin']), createPersonsBulk);

// Rutas específicas por ID
router.get('/:id', protect, getPersonById);
router.put('/:id', protect, roleRequired(['admin', 'superadmin']), updatePerson);
router.put('/:id/status', protect, roleRequired(['admin', 'superadmin']), changePersonStatus);

module.exports = router;
