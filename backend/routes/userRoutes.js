const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getUsers,
    getUser,
    updateUser,
    getUserAudit,
    getSystemAudit,
    createUsersByGrade
} = require('../controllers/userController');
const User = require('../models/user');
const { protect } = require('../middlewares/authMiddleware');

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config para imágenes de perfil
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter para solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Middleware para verificar que el usuario tenga permisos de administración
const requireAdminRole = async (req, res, next) => {
  try {
    console.log('🔍 [requireAdminRole] Verificando permisos de admin');
    console.log('🔍 [requireAdminRole] Usuario:', {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role,
      roleType: typeof req.user.role
    });

    // Si el usuario tiene el viejo sistema de roles (string), mantener compatibilidad
    if (typeof req.user.role === 'string') {
      console.log('✅ [requireAdminRole] Usando sistema antiguo de roles');
      if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
        console.log('❌ [requireAdminRole] Rol no autorizado:', req.user.role);
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
      }
      console.log('✅ [requireAdminRole] Acceso permitido para rol:', req.user.role);
      return next();
    }

    console.log('🔍 [requireAdminRole] Usando nuevo sistema de permisos');
    // Nuevo sistema: verificar permisos específicos
    const hasPermission = await req.user.hasResourcePermission('users', 'manage');
    console.log('🔍 [requireAdminRole] hasResourcePermission result:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ [requireAdminRole] Sin permisos para gestionar usuarios');
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    
    console.log('✅ [requireAdminRole] Acceso permitido');
    next();
  } catch (error) {
    console.error('❌ [requireAdminRole] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// Middleware para verificar que el usuario tenga permisos de superadmin
const requireSuperAdminRole = async (req, res, next) => {
  try {
    // Si el usuario tiene el viejo sistema de roles (string), mantener compatibilidad
    if (typeof req.user.role === 'string') {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({
          message: 'Acceso denegado. Se requieren permisos de superadministrador.'
        });
      }
      return next();
    }

    // Nuevo sistema: verificar permisos específicos
    const hasPermission = await req.user.hasResourcePermission('system', 'manage');
    if (!hasPermission) {
      return res.status(403).json({
        message: 'Acceso denegado. Se requieren permisos de superadministrador.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
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

// @desc    Actualizar permisos especiales de usuario
// @route   PUT /api/users/:id/permissions
// @access  Private (Admin/SuperAdmin)
router.put('/:id/permissions', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { canChangeBookImages } = req.body;

    console.log(`🔐 Actualizando permisos para usuario: ${id}`);
    console.log('🔐 Permisos solicitados:', { canChangeBookImages });

    // Buscar usuario
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir modificar permisos de superadmin
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No se pueden modificar permisos de un superadmin'
      });
    }

    // Actualizar permisos especiales
    targetUser.specialPermissions = {
      canChangeBookImages: Boolean(canChangeBookImages)
    };

    await targetUser.save();

    console.log(`✅ Permisos actualizados para: ${targetUser.username}`);
    
    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      data: {
        userId: targetUser._id,
        username: targetUser.username,
        specialPermissions: targetUser.specialPermissions
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// @route   POST /api/users/:id/profile-image
// @desc    Subir y optimizar imagen de perfil
// @access  Private (Admin/SuperAdmin)
router.post('/:id/profile-image', protect, upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    // Buscar usuario
    const user = await User.findById(id);
    if (!user) {
      // Eliminar archivo subido si no existe el usuario
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Optimizar imagen con Sharp
    const optimizedFilename = 'optimized-' + req.file.filename;
    const optimizedPath = path.join(uploadsDir, optimizedFilename);

    await sharp(req.file.path)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 80,
        progressive: true 
      })
      .toFile(optimizedPath);

    // Eliminar imagen original
    fs.unlinkSync(req.file.path);

    // Eliminar imagen anterior si existe
    if (user.profileImage) {
      const oldImagePath = path.join(uploadsDir, path.basename(user.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Actualizar usuario con la nueva imagen
    user.profileImage = `/uploads/profiles/${optimizedFilename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Imagen de perfil actualizada exitosamente',
      profileImage: user.profileImage
    });

  } catch (error) {
    console.error('❌ Error al subir imagen de perfil:', error);
    
    // Eliminar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen de perfil',
      error: error.message
    });
  }
});

module.exports = router;
