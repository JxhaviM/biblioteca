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
    getPersonsWithAccount,
    getPersonsWithoutAccount
} = require('../controllers/personController');
const { protect, roleRequired } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Rutas públicas para búsqueda (con autenticación)
router.get('/search', protect, searchPersons);

// Rutas para administradores
router.get('/stats', protect, roleRequired(['admin', 'superadmin']), getPersonsStats);
router.get('/with-account', protect, roleRequired(['admin', 'superadmin']), getPersonsWithAccount);
router.get('/without-account', protect, roleRequired(['admin', 'superadmin']), getPersonsWithoutAccount);
router.get('/by-grade/:grado', protect, roleRequired(['admin', 'superadmin']), getPersonsByGrade);

router.get('/', protect, roleRequired(['admin', 'superadmin']), getPersons);
router.post('/', protect, roleRequired(['admin', 'superadmin']), createPerson);
router.post('/bulk', protect, roleRequired(['admin', 'superadmin']), upload.single('file'), createPersonsBulk);

// Obtener estado de job y descargar reporte de errores
const { getBulkJobStatus, downloadBulkJobReport } = require('../controllers/personController');
router.get('/bulk/:id/status', protect, roleRequired(['admin', 'superadmin']), getBulkJobStatus);
router.get('/bulk/:id/report', protect, roleRequired(['admin', 'superadmin']), downloadBulkJobReport);

// Rutas específicas por ID
router.get('/:id', protect, getPersonById);
router.put('/:id', protect, roleRequired(['admin', 'superadmin']), updatePerson);
router.put('/:id/status', protect, roleRequired(['admin', 'superadmin']), changePersonStatus);

module.exports = router;
