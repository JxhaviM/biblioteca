#!/usr/bin/env node

/**
 * Script interactivo para crear SuperAdmin
 * Permite personalizar los datos durante la ejecución
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const User = require('../models/user');
const Person = require('../models/person');

// Interfaz para input del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para hacer preguntas
function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

// Función para validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar documento
function validateDoc(doc) {
    return /^\d{6,15}$/.test(doc);
}

// Función principal interactiva
async function createSuperAdminInteractive() {
    try {
        console.log('\n🎯 Asistente Interactivo para Crear SuperAdmin');
        console.log('═══════════════════════════════════════════════');
        console.log('📝 Completa los siguientes datos:\n');

        // Conectar a MongoDB
        console.log('📡 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biblioteca');
        console.log('✅ Conectado a MongoDB\n');

        // Verificar si ya existe un superadmin
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('⚠️  Ya existe un SuperAdmin en el sistema.');
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Username: ${existingSuperAdmin.username}\n`);
            
            const continuar = await question('¿Deseas continuar y crear otro admin? (s/N): ');
            if (continuar.toLowerCase() !== 's') {
                console.log('❌ Operación cancelada');
                process.exit(0);
            }
        }

        // Recopilar datos del usuario
        console.log('\n👤 DATOS PERSONALES:');
        console.log('───────────────────');

        let doc;
        do {
            doc = await question('📄 Número de documento (6-15 dígitos): ');
            if (!validateDoc(doc)) {
                console.log('❌ Documento inválido. Debe tener entre 6 y 15 dígitos.');
            }
        } while (!validateDoc(doc));

        // Verificar si ya existe la persona
        const existingPerson = await Person.findOne({ doc });
        if (existingPerson) {
            console.log(`❌ Ya existe una persona con documento ${doc}`);
            console.log(`   Nombre: ${existingPerson.getNombreCompleto()}`);
            process.exit(1);
        }

        const tipoDoc = await question('📋 Tipo de documento (CC/TI/CE/Pasaporte) [CC]: ') || 'CC';
        const apellido1 = await question('👥 Primer apellido: ');
        const apellido2 = await question('👥 Segundo apellido (opcional): ') || '';
        const nombre1 = await question('👤 Primer nombre: ');
        const nombre2 = await question('👤 Segundo nombre (opcional): ') || '';
        
        let genero;
        do {
            genero = await question('⚧ Género (M/F/Otro) [M]: ') || 'M';
        } while (!['M', 'F', 'Otro'].includes(genero));

        console.log('\n🔐 DATOS DE ACCESO:');
        console.log('─────────────────');

        let email;
        do {
            email = await question('📧 Email para login: ');
            if (!validateEmail(email)) {
                console.log('❌ Email inválido. Por favor ingresa un email válido.');
            }
        } while (!validateEmail(email));

        // Verificar si el email ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`❌ Ya existe un usuario con email ${email}`);
            process.exit(1);
        }

        let password;
        do {
            password = await question('🔒 Contraseña (mínimo 8 caracteres): ');
            if (password.length < 8) {
                console.log('❌ La contraseña debe tener al menos 8 caracteres.');
            }
        } while (password.length < 8);

        const confirmPassword = await question('🔒 Confirmar contraseña: ');
        if (password !== confirmPassword) {
            console.log('❌ Las contraseñas no coinciden.');
            process.exit(1);
        }

        // Mostrar resumen
        console.log('\n📋 RESUMEN DE DATOS:');
        console.log('═══════════════════');
        console.log(`👤 Nombre: ${nombre1} ${nombre2} ${apellido1} ${apellido2}`.replace(/\s+/g, ' '));
        console.log(`📄 Documento: ${doc} (${tipoDoc})`);
        console.log(`⚧ Género: ${genero}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔒 Contraseña: ${'*'.repeat(password.length)}`);

        const confirmar = await question('\n¿Confirmas la creación del SuperAdmin? (s/N): ');
        if (confirmar.toLowerCase() !== 's') {
            console.log('❌ Operación cancelada');
            process.exit(0);
        }

        // Crear la persona
        console.log('\n👤 Creando registro de persona...');
        const person = await Person.create({
            doc,
            tipoDoc,
            apellido1,
            apellido2: apellido2 || undefined,
            nombre1,
            nombre2: nombre2 || undefined,
            genero,
            tipoPersona: 'Colaborador',
            fechaNacimiento: new Date('1990-01-01'),
            estado: 'Activo',
            tieneCuenta: true
        });

        // Generar username
        const baseUsername = person.generateUsernameBase();
        const username = await User.generateUniqueUsername(baseUsername);

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        console.log('👑 Creando usuario SuperAdmin...');
        const superAdmin = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'superadmin',
            personRef: person._id,
            isActive: true,
            tieneCuenta: true
        });

        // Actualizar persona
        person.tieneCuenta = true;
        await person.save();

        // Éxito
        console.log('\n🎉 ¡SuperAdmin creado exitosamente!');
        console.log('═══════════════════════════════════════');
        console.log('📊 CREDENCIALES DE ACCESO:');
        console.log('═══════════════════════════════════════');
        console.log(`👤 Nombre: ${person.getNombreCompleto()}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Username: ${username}`);
        console.log(`🔒 Password: ${password}`);
        console.log(`👑 Rol: superadmin`);
        console.log('\n🌐 URL de Login: http://localhost:5000/api/auth/login');
        console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');

    } catch (error) {
        console.error('\n❌ Error al crear SuperAdmin:', error.message);
        if (error.stack) {
            console.error('\n📋 Stack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        rl.close();
        await mongoose.connection.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar
if (require.main === module) {
    createSuperAdminInteractive();
}

module.exports = createSuperAdminInteractive;
