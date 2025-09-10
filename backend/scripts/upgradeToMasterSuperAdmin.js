const mongoose = require('mongoose');
const User = require('../models/user');
const Person = require('../models/person');
require('dotenv').config();

async function upgradToMasterSuperAdmin() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Buscar SuperAdmins existentes
        const superAdmins = await User.find({ role: 'superadmin' }).populate('personRef');
        
        if (superAdmins.length === 0) {
            console.log('❌ No se encontraron SuperAdministradores en el sistema');
            process.exit(1);
        }

        console.log(`📋 SuperAdministradores encontrados: ${superAdmins.length}`);
        superAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.username} - ${admin.personRef?.getNombreCompleto() || 'Sin nombre'} - Master: ${admin.isMasterSuperAdmin || false}`);
        });

        // Verificar si ya existe un MasterSuperAdmin
        const existingMaster = superAdmins.find(admin => admin.isMasterSuperAdmin);
        if (existingMaster) {
            console.log(`✅ Ya existe un MasterSuperAdmin: ${existingMaster.username}`);
            console.log('No se necesitan cambios.');
            process.exit(0);
        }

        // Si hay múltiples SuperAdmins, tomar el primero creado (más antiguo)
        const selectedAdmin = superAdmins.sort((a, b) => a.fechaCreacion - b.fechaCreacion)[0];
        
        console.log(`🔄 Actualizando ${selectedAdmin.username} a MasterSuperAdmin...`);

        // Verificar y corregir campos requeridos si es necesario
        if (!selectedAdmin.tipoPersona && selectedAdmin.personRef) {
            selectedAdmin.tipoPersona = selectedAdmin.personRef.tipoPersona || 'Colaborador';
            console.log(`🔧 Corrigiendo tipoPersona: ${selectedAdmin.tipoPersona}`);
        }

        // Actualizar el usuario seleccionado
        selectedAdmin.isMasterSuperAdmin = true;
        await selectedAdmin.save();

        console.log(`✅ ${selectedAdmin.username} ahora es MasterSuperAdmin`);
        console.log(`👤 Nombre: ${selectedAdmin.personRef?.getNombreCompleto()}`);
        console.log(`📧 Email: ${selectedAdmin.personRef?.email || 'No definido'}`);
        console.log(`📅 Creado: ${selectedAdmin.fechaCreacion}`);

        // Crear registro de auditoría compatible
        const Audit = require('../models/audit');
        await Audit.create({
            userId: selectedAdmin._id,
            targetUserId: selectedAdmin._id,
            targetPersonId: selectedAdmin.personRef._id,
            action: 'UPDATE',
            field: 'isMasterSuperAdmin',
            oldValue: false,
            newValue: true,
            reason: 'Actualización del sistema para convertir SuperAdmin en MasterSuperAdmin',
            performedAt: new Date()
        });

        console.log('📋 Auditoría registrada');
        console.log('🎉 Actualización completada exitosamente');
        console.log('');
        console.log('ℹ️  Información importante:');
        console.log('   - Este usuario ahora puede crear otros SuperAdministradores');
        console.log('   - Límite máximo: 3 SuperAdministradores total');
        console.log('   - Solo este usuario puede crear/desactivar otros SuperAdmins');

    } catch (error) {
        console.error('❌ Error actualizando SuperAdmin:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Ejecutar el script solo si se llama directamente
if (require.main === module) {
    upgradToMasterSuperAdmin();
}

module.exports = upgradToMasterSuperAdmin;
