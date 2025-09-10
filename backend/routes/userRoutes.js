const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    updateUser,
    getUserAudit,
    getSystemAudit
} = require('../controllers/userController');
const User = require('../models/user');
const { protect } = require('../middlewares/authMiddleware');

// Middleware para verificar que el usuario tenga permisos de administración
const requireAdminRole = (req, res, next) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// Middleware para verificar que el usuario tenga permisos de superadmin
const requireSuperAdminRole = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de superadministrador.' 
    });
  }
  next();
};

// Todas las rutas requieren autenticación
router.use(protect);

// @route   GET /api/users
// @desc    Obtener todos los usuarios (con permisos y datos de persona)
// @access  Private
router.get('/', requireAdminRole, getUsers);

// @route   GET /api/users/audit/system
// @desc    Obtener auditoría completa del sistema
// @access  Private (SuperAdmin only)
router.get('/audit/system', requireSuperAdminRole, getSystemAudit);

// @route   GET /api/users/:id
// @desc    Obtener un usuario específico con datos de persona
// @access  Private
router.get('/:id', getUser);

// @route   PUT /api/users/:id
// @desc    Actualizar datos de usuario/persona con auditoría
// @access  Private
router.put('/:id', updateUser);

// @route   GET /api/users/:id/audit
// @desc    Obtener historial de auditoría de un usuario
// @access  Private
router.get('/:id/audit', getUserAudit);

// @route   DELETE /api/users/:id
// @desc    Soft delete de usuario (mantener funcionalidad existente)
// @access  Private (Admin/SuperAdmin)
router.delete('/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Soft delete de usuario ${id}`);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar permisos: admin solo puede eliminar usuarios regulares
    if (req.user.role === 'admin' && user.role !== 'user') {
      return res.status(403).json({ 
        message: 'No tienes permisos para eliminar este usuario' 
      });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'El usuario ya está inactivo' });
    }

    // Verificar si el usuario tiene préstamos activos
    const Loan = require('../models/loan');
    const activeLoans = await Loan.countDocuments({ 
      userId: id, 
      estado: 'Prestado',
      isActive: true 
    });

    if (activeLoans > 0) {
      return res.status(400).json({ 
        message: `No se puede desactivar el usuario. Tiene ${activeLoans} préstamo(s) activo(s)` 
      });
    }

    // Soft delete
    await user.softDelete();
    
    console.log(`✅ Usuario eliminado (soft): ${user.username}`);
    res.json({ 
      message: 'Usuario eliminado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive,
        deletedAt: user.deletedAt
      }
    });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// @route   POST /api/users/:id/restore
// @desc    Restaurar usuario eliminado
// @access  Private (Admin/SuperAdmin)
router.post('/:id/restore', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Restaurando usuario ${id}`);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: 'El usuario ya está activo' });
    }

    // Restaurar usuario
    await user.restore();
    
    console.log(`✅ Usuario restaurado: ${user.username}`);
    res.json({ 
      message: 'Usuario restaurado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive,
        deletedAt: user.deletedAt
      }
    });
  } catch (error) {
    console.error('❌ Error al restaurar usuario:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// @route   PUT /api/users/:id/reset-password
// @desc    Resetear contraseña de usuario
// @access  Private (Admin/SuperAdmin)
router.put('/:id/reset-password', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔑 Reseteando contraseña para usuario ${id}`);

    const targetUser = await User.findById(id).populate('personRef');
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar permisos jerárquicos (usar la misma lógica que authController)
    const currentUserRole = req.user.role;
    const targetUserRole = targetUser.role;
    const isMasterSuperAdmin = req.user.isMasterSuperAdmin;

    const canResetPassword = () => {
      if (currentUserRole === 'superadmin' && isMasterSuperAdmin) {
        return true;
      }
      if (currentUserRole === 'superadmin' && !isMasterSuperAdmin) {
        return targetUserRole === 'admin' || targetUserRole === 'user';
      }
      if (currentUserRole === 'admin') {
        return targetUserRole === 'user';
      }
      return false;
    };

    if (!canResetPassword()) {
      return res.status(403).json({ 
        message: `No tienes permisos para resetear la contraseña de un ${targetUserRole}` 
      });
    }

    // Evitar auto-reseteo
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'Usa el panel de perfil para cambiar tu propia contraseña'
      });
    }

    // Generar nueva contraseña y aplicar reset
    const newPassword = targetUser.resetPassword();
    await targetUser.save();

    // Crear auditoría
    const Audit = require('../models/audit');
    await Audit.create({
      userId: req.user._id,
      targetUserId: targetUser._id,
      targetPersonId: targetUser.personRef?._id,
      action: 'PASSWORD_RESET',
      field: 'password',
      oldValue: 'encrypted_password',
      newValue: 'new_encrypted_password',
      reason: `Reseteo de contraseña por ${currentUserRole}`,
      performedAt: new Date()
    });

    console.log(`✅ Contraseña reseteada para: ${targetUser.username}`);
    res.json({ 
      success: true,
      message: 'Contraseña reseteada exitosamente',
      data: {
        newPassword: newPassword,
        user: {
          id: targetUser._id,
          username: targetUser.username,
          passwordResetCount: targetUser.passwordResetCount
        },
        resetBy: req.user.username
      }
    });

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;
