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

            // Obtener usuario del token y poblar información de la persona
            req.user = await User.findById(decoded.id)
                .populate('personRef')
                .select('-password');

            console.log('👤 User found:', req.user ? {
                id: req.user._id,
                username: req.user.username,
                role: req.user.role,
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

// Middleware para verificar roles específicos
const roleRequired = (...roles) => {
    return (req, res, next) => {
        // Flatten the roles array in case an array was passed as first argument
        const flatRoles = roles.flat();
        
        console.log('🎭 Role check:', {
            userRole: req.user?.role,
            requiredRoles: flatRoles,
            hasAccess: req.user && flatRoles.includes(req.user.role)
        });
        
        if (req.user && flatRoles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ 
                success: false,
                message: `Acceso denegado - Se requiere uno de los siguientes roles: ${flatRoles.join(', ')}` 
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
    roleRequired,
    activePersonOnly,
    canMakeLoans
};