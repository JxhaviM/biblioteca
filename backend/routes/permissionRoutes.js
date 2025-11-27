const express = require('express');
const router = express.Router();
const {
    getPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserPermissions,
    checkPermission
} = require('../controllers/permissionController');
const { protect } = require('../middlewares/authMiddleware');

// Middleware para verificar permisos de gestión de permisos (simplificado para compatibilidad)
const requirePermissionManagement = async (req, res, next) => {
    try {
        // Si el usuario tiene el viejo sistema de roles, permitir acceso completo a SuperAdmin
        if (typeof req.user.role === 'string') {
            if (req.user.role === 'superadmin') {
                return next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para gestionar permisos y roles'
                });
            }
        }

        // Nuevo sistema: verificar permisos específicos
        const hasPermission = await req.user.hasResourcePermission('permissions', 'manage');
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para gestionar permisos y roles'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

// Middleware para verificar permisos de lectura de permisos (simplificado para compatibilidad)
const requirePermissionRead = async (req, res, next) => {
    try {
        console.log('🔍 [requirePermissionRead] Verificando permisos de lectura');
        console.log('🔍 [requirePermissionRead] Usuario:', {
            id: req.user._id,
            username: req.user.username,
            role: req.user.role,
            roleType: typeof req.user.role
        });

        // Si el usuario tiene el viejo sistema de roles, permitir acceso básico a admin/superadmin
        if (typeof req.user.role === 'string') {
            console.log('✅ [requirePermissionRead] Usando sistema antiguo de roles');
            if (req.user.role === 'superadmin' || req.user.role === 'admin') {
                console.log('✅ [requirePermissionRead] Acceso permitido para rol:', req.user.role);
                return next();
            } else {
                console.log('❌ [requirePermissionRead] Rol no autorizado:', req.user.role);
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver permisos y roles'
                });
            }
        }

        console.log('🔍 [requirePermissionRead] Usando nuevo sistema de permisos');
        // Nuevo sistema: verificar permisos específicos
        const hasPermission = await req.user.hasResourcePermission('permissions', 'read');
        console.log('🔍 [requirePermissionRead] hasResourcePermission result:', hasPermission);
        
        if (!hasPermission) {
            console.log('❌ [requirePermissionRead] Sin permisos para ver permisos');
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver permisos y roles'
            });
        }
        
        console.log('✅ [requirePermissionRead] Acceso permitido');
        next();
    } catch (error) {
        console.error('❌ [requirePermissionRead] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

// Todas las rutas requieren autenticación
router.use(protect);

// ========== RUTAS DE PERMISOS ==========

// @route   GET /api/permissions
// @desc    Obtener todos los permisos
// @access  Private (usuarios con permisos de lectura)
router.get('/', requirePermissionRead, getPermissions);

// @route   POST /api/permissions
// @desc    Crear un nuevo permiso
// @access  Private (usuarios con permisos de gestión)
router.post('/', requirePermissionManagement, createPermission);

// @route   PUT /api/permissions/:id
// @desc    Actualizar un permiso
// @access  Private (usuarios con permisos de gestión)
router.put('/:id', requirePermissionManagement, updatePermission);

// @route   DELETE /api/permissions/:id
// @desc    Eliminar un permiso
// @access  Private (usuarios con permisos de gestión)
router.delete('/:id', requirePermissionManagement, deletePermission);

// ========== RUTAS DE ROLES ==========

// @route   GET /api/roles
// @desc    Obtener todos los roles
// @access  Private (usuarios con permisos de lectura)
router.get('/roles', requirePermissionRead, getRoles);

// @route   POST /api/roles
// @desc    Crear un nuevo rol
// @access  Private (usuarios con permisos de gestión)
router.post('/roles', requirePermissionManagement, createRole);

// @route   PUT /api/roles/:id
// @desc    Actualizar un rol
// @access  Private (usuarios con permisos de gestión)
router.put('/roles/:id', requirePermissionManagement, updateRole);

// @route   DELETE /api/roles/:id
// @desc    Eliminar un rol
// @access  Private (usuarios con permisos de gestión)
router.delete('/roles/:id', requirePermissionManagement, deleteRole);

// ========== RUTAS DE VERIFICACIÓN ==========

// @route   GET /api/permissions/user/:id
// @desc    Obtener permisos de un usuario específico
// @access  Private (usuarios con permisos de lectura)
router.get('/user/:id', requirePermissionRead, getUserPermissions);

// @route   POST /api/permissions/check
// @desc    Verificar si un usuario tiene un permiso específico
// @access  Private
router.post('/check', checkPermission);

module.exports = router;
