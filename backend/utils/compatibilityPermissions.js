const Permission = require('../models/permission');

// Función para crear permisos básicos adicionales para compatibilidad
const createCompatibilityPermissions = async () => {
    try {
        console.log('🔧 Creando permisos básicos de compatibilidad...');

        // Crear permisos básicos adicionales para acceso a estadísticas
        const compatibilityPermissions = [
            { name: 'basic_read', description: 'Acceso básico de lectura', resource: 'system', action: 'read', scope: 'own' },
            { name: 'basic_stats', description: 'Acceso a estadísticas básicas', resource: 'statistics', action: 'read', scope: 'all' },
        ];

        for (const permissionData of compatibilityPermissions) {
            const existingPermission = await Permission.findOne({ name: permissionData.name });
            if (!existingPermission) {
                await Permission.create({
                    ...permissionData,
                    createdBy: null // Permisos del sistema
                });
                console.log(`✅ Permiso de compatibilidad creado: ${permissionData.name}`);
            } else {
                console.log(`ℹ️ Permiso de compatibilidad ya existe: ${permissionData.name}`);
            }
        }

        console.log('✅ Permisos de compatibilidad inicializados');
    } catch (error) {
        console.error('❌ Error creando permisos de compatibilidad:', error);
    }
};

module.exports = {
    createCompatibilityPermissions
};
