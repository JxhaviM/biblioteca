const mongoose = require('mongoose');
const User = require('../models/user');
const Person = require('../models/person');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createMasterSuperAdmin() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existe un MasterSuperAdmin
        const existingMaster = await User.findOne({ isMasterSuperAdmin: true });
        if (existingMaster) {
            console.log('❌ Ya existe un MasterSuperAdmin en el sistema');
            console.log(`Usuario: ${existingMaster.username}`);
            process.exit(1);
        }

        // Datos del MasterSuperAdmin
        const masterData = {
            // Datos de la persona
            personData: {
                nombres: 'Rector',
                apellidos: 'Principal',
                numeroDocumento: '00000000',
                tipoDocumento: 'CC',
                telefono: '0000000000',
                email: 'rector@institucion.edu.co',
                fechaNacimiento: new Date('1980-01-01'),
                genero: 'Masculino',
                tipoPersona: 'Colaborador'
            },
            // Datos del usuario
            userData: {
                username: 'rector.principal',
                password: 'MasterAdmin2024!',
                role: 'superadmin',
                isMasterSuperAdmin: true,
                tipoPersona: 'Colaborador'
            }
        };

        console.log('🔄 Creando persona...');
        
        // Crear la persona primero
        const newPerson = new Person(masterData.personData);
        await newPerson.save();
        console.log(`✅ Persona creada: ${newPerson.nombres} ${newPerson.apellidos}`);

        console.log('🔄 Creando usuario MasterSuperAdmin...');
        
        // Crear el usuario MasterSuperAdmin
        const newUser = new User({
            ...masterData.userData,
            personRef: newPerson._id
        });
        
        await newUser.save();
        console.log(`✅ MasterSuperAdmin creado exitosamente!`);
        console.log(`📧 Username: ${newUser.username}`);
        console.log(`🔑 Password: ${masterData.userData.password}`);
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

        // Crear registro de auditoría
        const Audit = require('../models/audit');
        await Audit.createEntry({
            action: 'CREATE_MASTER_SUPERADMIN',
            targetType: 'User',
            targetId: newUser._id,
            performedBy: newUser._id, // Se autoreferencia
            details: {
                username: newUser.username,
                role: newUser.role,
                isMasterSuperAdmin: true,
                method: 'INITIAL_SETUP_SCRIPT'
            },
            systemAction: true
        });

        console.log('📋 Auditoría registrada');
        console.log('🎉 MasterSuperAdmin configurado correctamente');

    } catch (error) {
        console.error('❌ Error creando MasterSuperAdmin:', error.message);
        if (error.code === 11000) {
            console.error('🚫 Ya existe un usuario con ese username o documento');
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Ejecutar el script solo si se llama directamente
if (require.main === module) {
    createMasterSuperAdmin();
}

module.exports = createMasterSuperAdmin;
