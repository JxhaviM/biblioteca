// backend/routes/authRoutes.js
const express = require('express');
const { 
    registerUser, 
    loginUser, 
    resetPassword,
    changeOwnPassword, 
    registerUsersByGrade,
    createSuperAdmin,
    createAdmin,
    createAdminWithPerson,
    createUser,
    createUserWithPerson,
    createUserFromPerson,
    createAdditionalSuperAdmin,
    getMe
} = require('../controllers/authController');
const { protect, adminOnly, superAdminOnly, masterSuperAdminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas públicas
router.post('/login', loginUser);

// Ruta especial para crear primer superadmin (sin autenticación)
router.post('/create-superadmin', createSuperAdmin);

// Rutas protegidas
router.get('/me', protect, getMe);
router.put('/change-password', protect, changeOwnPassword);
router.get('/validate', protect, (req, res) => {
  // Si llega hasta aquí, el token es válido (gracias al middleware protect)
  res.status(200).json({ 
    valid: true, 
    user: req.user,
    message: 'Token válido' 
  });
});

// Rutas para admin/superadmin
router.post('/register', protect, adminOnly, registerUser);
router.post('/create-user', protect, adminOnly, createUser);
router.post('/create-user-with-person', protect, adminOnly, createUserWithPerson);
router.post('/create-user-from-person/:personId', protect, adminOnly, createUserFromPerson);
router.post('/create-users-by-grade', protect, adminOnly, registerUsersByGrade);
router.put('/reset-password/:userId', protect, adminOnly, resetPassword);

// Rutas para SuperAdmin (crear admins)
router.post('/create-admin', protect, superAdminOnly, createAdmin);
router.post('/create-admin-with-person', protect, superAdminOnly, createAdminWithPerson);

// Rutas solo para Master SuperAdmin (crear otros superadmins)
router.post('/create-additional-superadmin', protect, masterSuperAdminOnly, createAdditionalSuperAdmin);

module.exports = router;