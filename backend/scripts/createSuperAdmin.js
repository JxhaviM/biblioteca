#!/usr/bin/env node

/**
 * Script para crear el primer SuperAdmin del sistema
 * Uso: node scripts/createSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Person = require('../models/person');

// Configuración del SuperAdmin
const SUPERADMIN_CONFIG = {
    email: 'admin@biblioteca.com',
    password: 'BibliotecaAdmin2024!', // Cambiar en producción
    personData: {
        doc: '12345678',
        tipoDoc: 'CC',
        apellido1: 'Sistema',
        apellido2: 'Biblioteca',
        nombre1: 'Super',
        nombre2: 'Administrador',
        genero: 'M',
        tipoPersona: 'Colaborador',
        fechaNacimiento: new Date('1990-01-01'),
        estado: 'Activo',
        tieneCuenta: true
    }
};

// Función principal
async function createSuperAdmin() {
    try {
        console.log('🚀 Iniciando creación del SuperAdmin...\n');

        // Conectar a MongoDB
        console.log('📡 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biblioteca');
        console.log('✅ Conectado a MongoDB\n');

        // Verificar si ya existe un superadmin
        console.log('🔍 Verificando si ya existe un SuperAdmin...');
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        
        if (existingSuperAdmin) {
            console.log('⚠️  Ya existe un SuperAdmin en el sistema:');
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Username: ${existingSuperAdmin.username}`);
            console.log('\n💡 Si necesitas crear otro admin, usa el endpoint /api/auth/create-admin');
            process.exit(0);
        }

        console.log('✅ No existe SuperAdmin, procediendo con la creación...\n');

        // Verificar si ya existe una persona con el mismo documento
        console.log('📋 Verificando datos de la persona...');
        const existingPerson = await Person.findOne({ doc: SUPERADMIN_CONFIG.personData.doc });
        
        if (existingPerson) {
            console.log('⚠️  Ya existe una persona con el documento especificado:');
            console.log(`   Documento: ${existingPerson.doc}`);
            console.log(`   Nombre: ${existingPerson.getNombreCompleto()}`);
            console.log('\n❌ Por favor, cambie el número de documento en el script');
            process.exit(1);
        }

        // Crear la persona
        console.log('👤 Creando registro de persona...');
        const person = await Person.create(SUPERADMIN_CONFIG.personData);
        console.log(`✅ Persona creada: ${person.getNombreCompleto()}`);

        // Generar username único
        console.log('🔑 Generando credenciales...');
        const baseUsername = person.generateUsernameBase();
        const username = await User.generateUniqueUsername(baseUsername);

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(SUPERADMIN_CONFIG.password, salt);

        // Crear usuario SuperAdmin
        console.log('👑 Creando usuario SuperAdmin...');
        const superAdmin = await User.create({
            username,
            email: SUPERADMIN_CONFIG.email,
            password: hashedPassword,
            role: 'superadmin',
            personRef: person._id,
            isActive: true,
            tieneCuenta: true
        });

        // Actualizar persona con flag de cuenta
        person.tieneCuenta = true;
        await person.save();

        // Mostrar información de éxito
        console.log('\n🎉 ¡SuperAdmin creado exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 INFORMACIÓN DE ACCESO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👤 Nombre Completo: ${person.getNombreCompleto()}`);
        console.log(`📄 Documento: ${person.doc} (${person.tipoDoc})`);
        console.log(`📧 Email: ${superAdmin.email}`);
        console.log(`🔑 Username: ${superAdmin.username}`);
        console.log(`🔒 Password: ${SUPERADMIN_CONFIG.password}`);
        console.log(`👑 Rol: ${superAdmin.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📝 PRÓXIMOS PASOS:');
        console.log('1. Inicia sesión en el sistema con las credenciales mostradas');
        console.log('2. Cambia la contraseña por una más segura');
        console.log('3. Crea usuarios administradores adicionales si es necesario');
        console.log('4. Comienza a registrar personas en el sistema');
        console.log('\n🌐 URL de Login: http://localhost:5000/api/auth/login');
        console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');

    } catch (error) {
        console.error('\n❌ Error al crear SuperAdmin:');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`🚨 ${error.message}`);
        
        if (error.code === 11000) {
            console.error('\n💡 Este error indica que ya existe un registro con el mismo valor único.');
            console.error('   Verifica que no exista ya un usuario con el mismo email o username.');
        }
        
        console.error('\n📋 Stack trace completo:');
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB cerrada');
    }
}

// Función para mostrar ayuda
function showHelp() {
    console.log('\n📚 Script de Creación de SuperAdmin - Sistema de Biblioteca');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📖 DESCRIPCIÓN:');
    console.log('   Este script crea el primer SuperAdmin del sistema de biblioteca.');
    console.log('   Solo puede ejecutarse si no existe ningún SuperAdmin previo.');
    console.log('\n🔧 USO:');
    console.log('   node scripts/createSuperAdmin.js');
    console.log('\n⚙️  CONFIGURACIÓN:');
    console.log('   - Email predeterminado: admin@biblioteca.com');
    console.log('   - Password predeterminado: BibliotecaAdmin2024!');
    console.log('   - Documento: 12345678 (CC)');
    console.log('\n✏️  PERSONALIZACIÓN:');
    console.log('   Edita la variable SUPERADMIN_CONFIG en el script para cambiar');
    console.log('   el email, contraseña o datos personales del SuperAdmin.');
    console.log('\n🔒 SEGURIDAD:');
    console.log('   - Cambia la contraseña después del primer login');
    console.log('   - Usa un email corporativo real en producción');
    console.log('   - Mantén las credenciales en lugar seguro');
    process.exit(0);
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
}

// Ejecutar script
if (require.main === module) {
    createSuperAdmin();
}

module.exports = createSuperAdmin;
