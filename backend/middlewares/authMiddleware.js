// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware para proteger rutas
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token del header
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('🔓 JWT decoded:', decoded);

            // Obtener usuario del token sin poblar automáticamente el rol
            req.user = await User.findById(decoded.id)
                .select('-password');
            
            // Poblar personRef
            if (req.user && req.user.personRef) {
                await req.user.populate('personRef');
            }
            
            // Solo intentar popular el rol si es un ObjectId (nuevo sistema)
            if (req.user && req.user.role && typeof req.user.role === 'object') {
                await req.user.populate('role');
            }

            console.log('👤 User found:', req.user ? {
                id: req.user._id,
                username: req.user.username,
                role: req.user.role,
                roleType: typeof req.user.role,
                isActive: req.user.isActive
            } : 'null');

            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'No autorizado - Usuario no encontrado' 
                });
            }

            // Verificar que el usuario esté activo
            if (!req.user.isActive) {
                return res.status(401).json({ 
                    success: false,
                    message: 'No autorizado - Usuario desactivado' 
                });
            }

            // Verificar que la persona asociada esté activa
            if (!req.user.personRef || req.user.personRef.estado === 'Vetado') {
                return res.status(401).json({ 
                    success: false,
                    message: 'No autorizado - Acceso denegado' 
                });
            }

            next();
        } catch (error) {
            console.error('Error en middleware protect:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'No autorizado - Token expirado' 
                });
            }
            
            return res.status(401).json({ 
                success: false,
                message: 'No autorizado - Token inválido' 
            });
        }
    } else {
        return res.status(401).json({ 
            success: false,
            message: 'No autorizado - Token no proporcionado' 
        });
    }
};

// Middleware para verificar si es administrador (admin o superadmin)
const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Acceso denegado - Se requieren permisos de administrador' 
        });
    }
};

// Middleware para verificar si es superadministrador
const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Acceso denegado - Se requieren permisos de superadministrador' 
        });
    }
};

// Middleware para verificar si es Master SuperAdministrador
const masterSuperAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin' && req.user.isMasterSuperAdmin) {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Acceso denegado - Se requieren permisos de Master Superadministrador' 
        });
    }
};

// Middleware para verificar roles específicos
const roleRequired = (...roles) => {
    return async (req, res, next) => {
        try {
            // Flatten the roles array in case an array was passed as first argument
            const flatRoles = roles.flat();

            // Si el usuario tiene el viejo sistema de roles (string), mantener compatibilidad
            if (typeof req.user.role === 'string') {
                console.log('🎭 Role check:', {
                    userRole: req.user?.role,
                    requiredRoles: flatRoles,
                    hasAccess: req.user && flatRoles.includes(req.user.role)
                });

                if (req.user && flatRoles.includes(req.user.role)) {
                    return next();
                } else {
                    return res.status(403).json({
                        success: false,
                        message: `Acceso denegado - Se requiere uno de los siguientes roles: ${flatRoles.join(', ')}`
                    });
                }
            }

            // Nuevo sistema: verificar permisos específicos basados en roles
            // Para mantener compatibilidad, asignar permisos básicos según el rol requerido
            let requiredPermission = null;

            if (flatRoles.includes('admin') || flatRoles.includes('superadmin')) {
                // Para rutas que requieren admin/superadmin, verificar permisos básicos
                // Especialmente para rutas de estadísticas, permitir acceso básico
                if (req.path.includes('/stats')) {
                    const hasBasicPermission = await req.user.hasBasicStatsPermission();
                    if (hasBasicPermission) {
                        return next();
                    }
                } else {
                    // Para otras rutas admin, verificar permisos de gestión
                    requiredPermission = { resource: 'system', action: 'read' };
                }
            }

            if (requiredPermission) {
                const hasPermission = await req.user.hasResourcePermission(requiredPermission.resource, requiredPermission.action);
                if (hasPermission) {
                    return next();
                }
            }

            // Si no tiene permisos específicos, denegar acceso
            res.status(403).json({
                success: false,
                message: `Acceso denegado - Se requiere uno de los siguientes roles: ${flatRoles.join(', ')}`
            });
        } catch (error) {
            console.error('Error en roleRequired middleware:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    };
};

// Middleware para verificar estado de la persona
const activePersonOnly = (req, res, next) => {
    if (req.user && req.user.personRef && req.user.personRef.estado === 'Activo') {
        next();
    } else if (req.user && req.user.personRef && req.user.personRef.estado === 'Suspendido') {
        // Permitir solo consultas para usuarios suspendidos
        if (req.method === 'GET') {
            next();
        } else {
            res.status(403).json({ 
                success: false,
                message: 'Acceso restringido - Usuario suspendido. Solo consultas permitidas.' 
            });
        }
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Acceso denegado - Estado de usuario no válido' 
        });
    }
};

// Middleware para verificar si puede realizar préstamos
const canMakeLoans = (req, res, next) => {
    if (req.user && req.user.personRef && req.user.personRef.estado === 'Activo') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'No autorizado para realizar préstamos - Solo usuarios activos pueden solicitar préstamos' 
        });
    }
};

module.exports = {
    protect,
    adminOnly,
    superAdminOnly,
    masterSuperAdminOnly,
    roleRequired,
    activePersonOnly,
    canMakeLoans
};