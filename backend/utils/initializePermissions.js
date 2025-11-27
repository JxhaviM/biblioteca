const Permission = require('../models/permission');
const Role = require('../models/role');

// Función para inicializar permisos básicos del sistema
const initializePermissions = async () => {
    try {
        console.log('🔧 Inicializando permisos básicos del sistema...');

        const basicPermissions = [
            // Permisos básicos para estadísticas y reportes
            { name: 'statistics_read', description: 'Ver estadísticas básicas', resource: 'statistics', action: 'read', scope: 'all' },
            { name: 'statistics_manage', description: 'Gestionar estadísticas', resource: 'statistics', action: 'manage', scope: 'all' },

            // Permisos de usuarios
            { name: 'users_create', description: 'Crear usuarios', resource: 'users', action: 'create', scope: 'all' },
            { name: 'users_read', description: 'Ver usuarios', resource: 'users', action: 'read', scope: 'all' },
            { name: 'users_update', description: 'Editar usuarios', resource: 'users', action: 'update', scope: 'all' },
            { name: 'users_delete', description: 'Eliminar usuarios', resource: 'users', action: 'delete', scope: 'all' },
            { name: 'users_manage', description: 'Gestionar usuarios completamente', resource: 'users', action: 'manage', scope: 'all' },

            // Permisos de personas
            { name: 'persons_create', description: 'Crear personas', resource: 'persons', action: 'create', scope: 'all' },
            { name: 'persons_read', description: 'Ver personas', resource: 'persons', action: 'read', scope: 'all' },
            { name: 'persons_update', description: 'Editar personas', resource: 'persons', action: 'update', scope: 'all' },
            { name: 'persons_delete', description: 'Eliminar personas', resource: 'persons', action: 'delete', scope: 'all' },
            { name: 'persons_manage', description: 'Gestionar personas completamente', resource: 'persons', action: 'manage', scope: 'all' },

            // Permisos de libros
            { name: 'books_create', description: 'Crear libros', resource: 'books', action: 'create', scope: 'all' },
            { name: 'books_read', description: 'Ver libros', resource: 'books', action: 'read', scope: 'all' },
            { name: 'books_update', description: 'Editar libros', resource: 'books', action: 'update', scope: 'all' },
            { name: 'books_delete', description: 'Eliminar libros', resource: 'books', action: 'delete', scope: 'all' },
            { name: 'books_manage', description: 'Gestionar libros completamente', resource: 'books', action: 'manage', scope: 'all' },

            // Permisos de préstamos
            { name: 'loans_create', description: 'Crear préstamos', resource: 'loans', action: 'create', scope: 'all' },
            { name: 'loans_read', description: 'Ver préstamos', resource: 'loans', action: 'read', scope: 'all' },
            { name: 'loans_update', description: 'Editar préstamos', resource: 'loans', action: 'update', scope: 'all' },
            { name: 'loans_delete', description: 'Eliminar préstamos', resource: 'loans', action: 'delete', scope: 'all' },
            { name: 'loans_manage', description: 'Gestionar préstamos completamente', resource: 'loans', action: 'manage', scope: 'all' },

            // Permisos de asistencia
            { name: 'attendance_read', description: 'Ver asistencia', resource: 'attendance', action: 'read', scope: 'all' },
            { name: 'attendance_manage', description: 'Gestionar asistencia', resource: 'attendance', action: 'manage', scope: 'all' },

            // Permisos de espacios
            { name: 'spaces_read', description: 'Ver espacios', resource: 'spaces', action: 'read', scope: 'all' },
            { name: 'spaces_manage', description: 'Gestionar espacios', resource: 'spaces', action: 'manage', scope: 'all' },

            // Permisos de reportes
            { name: 'reports_read', description: 'Ver reportes', resource: 'reports', action: 'read', scope: 'all' },
            { name: 'reports_export', description: 'Exportar reportes', resource: 'reports', action: 'export', scope: 'all' },

            // Permisos de auditoría
            { name: 'audit_read', description: 'Ver auditoría', resource: 'audit', action: 'read', scope: 'all' },

            // Permisos del sistema
            { name: 'system_manage', description: 'Gestionar configuración del sistema', resource: 'system', action: 'manage', scope: 'all' },
            { name: 'system_backup', description: 'Crear respaldos del sistema', resource: 'system', action: 'create', scope: 'all' },

            // Permisos de permisos (meta-permisos)
            { name: 'permissions_read', description: 'Ver permisos y roles', resource: 'permissions', action: 'read', scope: 'all' },
            { name: 'permissions_manage', description: 'Gestionar permisos y roles', resource: 'permissions', action: 'manage', scope: 'all' }
        ];

        // Crear permisos básicos
        for (const permissionData of basicPermissions) {
            const existingPermission = await Permission.findOne({ name: permissionData.name });
            if (!existingPermission) {
                await Permission.create({
                    ...permissionData,
                    createdBy: null // Permisos del sistema
                });
                console.log(`✅ Permiso creado: ${permissionData.name}`);
            } else {
                console.log(`ℹ️ Permiso ya existe: ${permissionData.name}`);
            }
        }

        console.log('✅ Permisos básicos inicializados');
    } catch (error) {
        console.error('❌ Error inicializando permisos básicos:', error);
    }
};

// Función para inicializar roles básicos del sistema
const initializeRoles = async () => {
    try {
        console.log('🔧 Inicializando roles básicos del sistema...');

        // Obtener permisos básicos
        const allPermissions = await Permission.find({ isActive: true });
        const permissionMap = {};
        allPermissions.forEach(permission => {
            permissionMap[permission.name] = permission._id;
        });

        const basicRoles = [
            {
                name: 'superadmin',
                displayName: 'Super Administrador',
                description: 'Acceso completo a todas las funciones del sistema',
                level: 100,
                isSystem: true,
                permissions: Object.values(permissionMap) // Todos los permisos
            },
            {
                name: 'admin',
                displayName: 'Administrador',
                description: 'Gestión completa del sistema excepto configuración avanzada',
                level: 80,
                isSystem: true,
                permissions: [
                    // Estadísticas - acceso completo
                    permissionMap.statistics_read,
                    permissionMap.statistics_manage,
                    // Usuarios - gestión completa excepto permisos
                    permissionMap.users_create,
                    permissionMap.users_read,
                    permissionMap.users_update,
                    permissionMap.users_delete,
                    permissionMap.users_manage,
                    // Personas - gestión completa
                    permissionMap.persons_create,
                    permissionMap.persons_read,
                    permissionMap.persons_update,
                    permissionMap.persons_delete,
                    permissionMap.persons_manage,
                    // Libros - gestión completa
                    permissionMap.books_create,
                    permissionMap.books_read,
                    permissionMap.books_update,
                    permissionMap.books_delete,
                    permissionMap.books_manage,
                    // Préstamos - gestión completa
                    permissionMap.loans_create,
                    permissionMap.loans_read,
                    permissionMap.loans_update,
                    permissionMap.loans_delete,
                    permissionMap.loans_manage,
                    // Asistencia - gestión completa
                    permissionMap.attendance_read,
                    permissionMap.attendance_manage,
                    // Espacios - gestión completa
                    permissionMap.spaces_read,
                    permissionMap.spaces_manage,
                    // Reportes - lectura y exportación
                    permissionMap.reports_read,
                    permissionMap.reports_export,
                    // Auditoría - solo lectura
                    permissionMap.audit_read,
                    // Sistema - gestión básica
                    permissionMap.system_backup
                ]
            },
            {
                name: 'user',
                displayName: 'Usuario Estándar',
                description: 'Usuario básico con acceso limitado',
                level: 10,
                isSystem: true,
                permissions: [
                    // Solo lectura de información pública
                    permissionMap.books_read,
                    permissionMap.loans_read,
                    permissionMap.persons_read
                ]
            }
        ];

        // Crear roles básicos
        for (const roleData of basicRoles) {
            const existingRole = await Role.findOne({ name: roleData.name });
            if (!existingRole) {
                await Role.create({
                    ...roleData,
                    createdBy: null // Roles del sistema
                });
                console.log(`✅ Rol creado: ${roleData.displayName}`);
            } else {
                console.log(`ℹ️ Rol ya existe: ${roleData.displayName}`);
            }
        }

        console.log('✅ Roles básicos inicializados');
    } catch (error) {
        console.error('❌ Error inicializando roles básicos:', error);
    }
};

// Función para inicializar permisos y roles básicos
const initializePermissionSystem = async () => {
    try {
        await initializePermissions();
        await initializeRoles();
        console.log('🎉 Sistema de permisos completamente inicializado');
    } catch (error) {
        console.error('❌ Error inicializando sistema de permisos:', error);
    }
};

module.exports = {
    initializePermissions,
    initializeRoles,
    initializePermissionSystem
};
