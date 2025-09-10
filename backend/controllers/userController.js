const User = require('../models/user');
const Person = require('../models/person');
const Audit = require('../models/audit');

// Configuración de permisos
const EDIT_PERMISSIONS = {
    user: ['direccion', 'celular', 'email'],
    admin: ['apellido1', 'apellido2', 'nombre1', 'nombre2', 'direccion', 'celular', 'email', 'grado', 'grupo', 'materias'],
    superadmin: ['*'] // Todos los campos editables
};

const IMMUTABLE_FIELDS = ['doc', 'tipoDoc', 'username', 'tipoPersona', '_id', 'id'];

// Función para verificar permisos de edición
const canEditField = (userRole, field, targetUserRole = null) => {
    // SuperAdmin puede editar todo excepto campos inmutables
    if (userRole === 'superadmin') {
        return !IMMUTABLE_FIELDS.includes(field);
    }
    
    // Admin no puede editar datos de otros admins o superadmins
    if (userRole === 'admin' && targetUserRole && ['admin', 'superadmin'].includes(targetUserRole)) {
        return false;
    }
    
    // Verificar si el campo está en los permisos del rol
    return EDIT_PERMISSIONS[userRole]?.includes(field) || EDIT_PERMISSIONS[userRole]?.includes('*');
};

// Función para verificar si un usuario puede editar a otro
const canEditUser = (editorRole, editorId, targetUserId, targetUserRole) => {
    // Usuarios pueden editarse a sí mismos (campos permitidos)
    if (editorId === targetUserId) {
        return true;
    }
    
    // Admin no puede editar otros admins o superadmins
    if (editorRole === 'admin' && ['admin', 'superadmin'].includes(targetUserRole)) {
        return false;
    }
    
    // SuperAdmin puede editar a todos
    if (editorRole === 'superadmin') {
        return true;
    }
    
    // Admin puede editar users
    if (editorRole === 'admin' && targetUserRole === 'user') {
        return true;
    }
    
    return false;
};

// @desc    Obtener todos los usuarios (con permisos)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        
        let query = { isActive: true };
        
        // Admin solo ve users, no otros admins ni superadmins
        if (userRole === 'admin') {
            query.role = 'user';
        }
        
        const users = await User.find(query)
            .populate('personRef')
            .select('-password')
            .sort({ username: 1 });
        
        const usersWithPersonData = users.map(user => ({
            ...user.toObject(),
            person: user.personRef ? user.personRef.getDetailedInfo() : null
        }));
        
        res.status(200).json({
            success: true,
            data: usersWithPersonData,
            count: usersWithPersonData.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// @desc    Obtener un usuario específico
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        const { id: targetUserId } = req.params;
        
        const targetUser = await User.findById(targetUserId)
            .populate('personRef')
            .select('-password');
            
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar permisos de visualización
        if (!canEditUser(userRole, userId, targetUserId, targetUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver este usuario'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                ...targetUser.toObject(),
                person: targetUser.personRef ? targetUser.personRef.getDetailedInfo() : null
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

// @desc    Actualizar datos de usuario/persona
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        const { id: targetUserId } = req.params;
        const updates = req.body;
        
        // Obtener usuario objetivo
        const targetUser = await User.findById(targetUserId).populate('personRef');
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar permisos generales
        if (!canEditUser(userRole, userId, targetUserId, targetUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para editar este usuario'
            });
        }
        
        // Separar actualizaciones de User y Person
        const userUpdates = {};
        const personUpdates = {};
        const auditEntries = [];
        
        // Campos que van en el modelo User
        const userFields = ['role', 'isActive'];
        
        // Validar cada campo y permisos específicos
        for (const [field, newValue] of Object.entries(updates)) {
            // Verificar campos inmutables
            if (IMMUTABLE_FIELDS.includes(field)) {
                return res.status(400).json({
                    success: false,
                    message: `El campo '${field}' no puede ser modificado`
                });
            }
            
            // Verificar permisos específicos del campo
            if (!canEditField(userRole, field, targetUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: `No tienes permisos para editar el campo '${field}'`
                });
            }
            
            // Determinar si es campo de User o Person
            if (userFields.includes(field)) {
                const oldValue = targetUser[field];
                if (oldValue !== newValue) {
                    userUpdates[field] = newValue;
                    auditEntries.push({
                        field,
                        oldValue,
                        newValue,
                        action: 'UPDATE'
                    });
                }
            } else {
                // Campo de Person
                const oldValue = targetUser.personRef[field];
                if (oldValue !== newValue) {
                    personUpdates[field] = newValue;
                    auditEntries.push({
                        field,
                        oldValue,
                        newValue,
                        action: 'UPDATE'
                    });
                }
            }
        }
        
        // Validaciones especiales para grado/grupo
        if (personUpdates.grado || personUpdates.grupo) {
            if (targetUser.personRef.tipoPersona !== 'Estudiante') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo los estudiantes pueden tener grado y grupo'
                });
            }
        }
        
        // Realizar actualizaciones
        let updatedUser = targetUser;
        let updatedPerson = targetUser.personRef;
        
        if (Object.keys(userUpdates).length > 0) {
            updatedUser = await User.findByIdAndUpdate(
                targetUserId,
                userUpdates,
                { new: true, runValidators: true }
            );
        }
        
        if (Object.keys(personUpdates).length > 0) {
            updatedPerson = await Person.findByIdAndUpdate(
                targetUser.personRef._id,
                personUpdates,
                { new: true, runValidators: true }
            );
        }
        
        // Crear entradas de auditoría
        for (const auditData of auditEntries) {
            await Audit.createEntry({
                userId: userId,
                targetUserId: targetUserId,
                targetPersonId: targetUser.personRef._id,
                action: auditData.action,
                field: auditData.field,
                oldValue: auditData.oldValue,
                newValue: auditData.newValue,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                ...updatedUser.toObject(),
                person: updatedPerson ? updatedPerson.getDetailedInfo() : null
            },
            changesCount: auditEntries.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// @desc    Obtener historial de auditoría
// @route   GET /api/users/:id/audit
// @access  Private
const getUserAudit = async (req, res) => {
    try {
        const { role: userRole, id: userId } = req.user;
        const { id: targetUserId } = req.params;
        const { limit = 50 } = req.query;
        
        // Verificar permisos de auditoría
        if (userRole === 'user' && userId !== targetUserId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes ver tu propio historial'
            });
        }
        
        if (userRole === 'admin') {
            // Admin no puede ver auditoría de otros admins o superadmins
            const targetUser = await User.findById(targetUserId).select('role');
            if (targetUser && ['admin', 'superadmin'].includes(targetUser.role) && userId !== targetUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver este historial'
                });
            }
        }
        
        const auditHistory = await Audit.getByTargetUser(targetUserId, parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: auditHistory,
            count: auditHistory.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de auditoría',
            error: error.message
        });
    }
};

// @desc    Obtener auditoría completa del sistema (Solo SuperAdmin)
// @route   GET /api/users/audit/system
// @access  Private (SuperAdmin only)
const getSystemAudit = async (req, res) => {
    try {
        const { role: userRole } = req.user;
        const { limit = 100, startDate, endDate } = req.query;
        
        if (userRole !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Solo el SuperAdministrador puede ver la auditoría completa'
            });
        }
        
        let auditHistory;
        
        if (startDate && endDate) {
            auditHistory = await Audit.getByDateRange(
                new Date(startDate),
                new Date(endDate)
            );
        } else {
            auditHistory = await Audit.getSystemAudit(parseInt(limit));
        }
        
        res.status(200).json({
            success: true,
            data: auditHistory,
            count: auditHistory.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener auditoría del sistema',
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    updateUser,
    getUserAudit,
    getSystemAudit
};
