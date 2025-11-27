const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');

// Footer (público) - antes de los middlewares de protección
router.get('/footer', systemController.getFooterConfig);

// Todas las rutas siguientes requieren autenticación y ser superadmin
router.use(protect);
router.use(superAdminOnly);

// Backup
router.get('/backup', systemController.createBackup);

// Logs
router.get('/logs', systemController.getLogs);
router.get('/logs/stats', systemController.getLogStats);

// Sesiones
router.get('/sessions', systemController.getActiveSessions);
router.get('/sessions/stats', systemController.getSessionStats);
router.post('/sessions/:sessionId/terminate', systemController.terminateSession);

// Configuración
router.get('/config', systemController.getConfig);
router.put('/config', systemController.updateConfig);

module.exports = router;
