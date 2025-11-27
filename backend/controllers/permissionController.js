const Permission = require('../models/permission');
const Role = require('../models/role');
const User = require('../models/user');

// @desc    Obtener todos los permisos
// @route   GET /api/permissions
// @access  Private (SuperAdmin only)
const getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findActive();
        res.status(200).json({
            success: true,
            data: permissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener permisos',
            error: error.message
        });
    }
};

// @desc    Crear un nuevo permiso
// @route   POST /api/permissions
// @access  Private (SuperAdmin only)
const createPermission = async (req, res) => {
    try {
        const { name, description, resource, action, scope = 'own' } = req.body;

        // Verificar si el permiso ya existe
        const existingPermission = await Permission.findOne({ name });
        if (existingPermission) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un permiso con ese nombre'
            });
        }

        const permission = await Permission.create({
            name,
            description,
            resource,
            action,
            scope,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Permiso creado exitosamente',
            data: permission
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear permiso',
            error: error.message
        });
    }
};

// @desc    Actualizar un permiso
// @route   PUT /api/permissions/:id
// @access  Private (SuperAdmin only)
const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, resource, action, scope, isActive } = req.body;

        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permiso no encontrado'
            });
        }

        // Verificar si el nuevo nombre ya existe (si se está cambiando)
        if (name && name !== permission.name) {
            const existingPermission = await Permission.findOne({ name });
            if (existingPermission) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un permiso con ese nombre'
                });
            }
        }

        const updatedPermission = await Permission.findByIdAndUpdate(
            id,
            { name, description, resource, action, scope, isActive },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Permiso actualizado exitosamente',
            data: updatedPermission
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar permiso',
            error: error.message
        });
    }
};

// @desc    Eliminar un permiso
// @route   DELETE /api/permissions/:id
// @access  Private (SuperAdmin only)
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;

        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permiso no encontrado'
            });
        }

        // Verificar si hay roles usando este permiso
        const rolesUsingPermission = await Role.countDocuments({ permissions: id });
        if (rolesUsingPermission > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el permiso porque está siendo utilizado por roles existentes'
            });
        }

        await Permission.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Permiso eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar permiso',
            error: error.message
        });
    }
};

// @desc    Obtener todos los roles
// @route   GET /api/roles
// @access  Private (Admin only)
const getRoles = async (req, res) => {
    try {
        const roles = await Role.findActiveOrdered();
        res.status(200).json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener roles',
            error: error.message
        });
    }
};

// @desc    Crear un nuevo rol
// @route   POST /api/roles
// @access  Private (SuperAdmin only)
const createRole = async (req, res) => {
    try {
        const { name, displayName, description, permissions, level = 1 } = req.body;

        // Verificar si el rol ya existe
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un rol con ese nombre'
            });
        }

        // Verificar que todos los permisos existen
        if (permissions && permissions.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: permissions } });
            if (validPermissions.length !== permissions.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Algunos permisos especificados no existen'
                });
            }
        }

        const role = await Role.create({
            name,
            displayName,
            description,
            permissions,
            level,
            createdBy: req.user.id
        });

        await role.populate('permissions', 'name description resource action');

        res.status(201).json({
            success: true,
            message: 'Rol creado exitosamente',
            data: role
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear rol',
            error: error.message
        });
    }
};

// @desc    Actualizar un rol
// @route   PUT /api/roles/:id
// @access  Private (SuperAdmin only)
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, displayName, description, permissions, level, isActive } = req.body;

        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        // No permitir modificar roles del sistema
        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'No se pueden modificar roles del sistema'
            });
        }

        // Verificar si el nuevo nombre ya existe (si se está cambiando)
        if (name && name !== role.name) {
            const existingRole = await Role.findOne({ name });
            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un rol con ese nombre'
                });
            }
        }

        // Verificar que todos los permisos existen
        if (permissions && permissions.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: permissions } });
            if (validPermissions.length !== permissions.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Algunos permisos especificados no existen'
                });
            }
        }

        const updatedRole = await Role.findByIdAndUpdate(
            id,
            { name, displayName, description, permissions, level, isActive },
            { new: true, runValidators: true }
        ).populate('permissions', 'name description resource action');

        res.status(200).json({
            success: true,
            message: 'Rol actualizado exitosamente',
            data: updatedRole
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol',
            error: error.message
        });
    }
};

// @desc    Eliminar un rol
// @route   DELETE /api/roles/:id
// @access  Private (SuperAdmin only)
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        // No permitir eliminar roles del sistema
        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'No se pueden eliminar roles del sistema'
            });
        }

        // Verificar si hay usuarios usando este rol
        const usersUsingRole = await User.countDocuments({ role: id });
        if (usersUsingRole > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el rol porque está siendo utilizado por ${usersUsingRole} usuario(s)`
            });
        }

        await Role.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Rol eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar rol',
            error: error.message
        });
    }
};

// @desc    Obtener permisos de un usuario específico
// @route   GET /api/permissions/user/:id
// @access  Private (Admin only)
const getUserPermissions = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).populate('role');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const permissions = await user.getPermissions();

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                },
                permissions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener permisos del usuario',
            error: error.message
        });
    }
};

// @desc    Verificar si un usuario tiene un permiso específico
// @route   POST /api/permissions/check
// @access  Private
const checkPermission = async (req, res) => {
    try {
        const { userId, permission } = req.body;

        let targetUser;
        if (userId) {
            targetUser = await User.findById(userId);
        } else {
            targetUser = req.user;
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const hasPermission = await targetUser.hasPermission(permission);

        res.status(200).json({
            success: true,
            data: {
                hasPermission,
                user: {
                    id: targetUser._id,
                    username: targetUser.username
                },
                permission
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

module.exports = {
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
};
