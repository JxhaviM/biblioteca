#!/usr/bin/env node

/**
 * Script que usa el endpoint API para crear SuperAdmin
 * Útil cuando el servidor ya está ejecutándose
 */

const axios = require('axios');

// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const SUPERADMIN_DATA = {
    email: 'admin@biblioteca.com',
    password: 'BibliotecaAdmin2024!',
    personData: {
        doc: '12345678',
        tipoDoc: 'CC',
        apellido1: 'Sistema',
        apellido2: 'Biblioteca',
        nombre1: 'Super',
        nombre2: 'Administrador',
        genero: 'M',
        tipoPersona: 'Colaborador',
        fechaNacimiento: '1990-01-01'
    }
};

async function createSuperAdminViaAPI() {
    try {
        console.log('🚀 Creando SuperAdmin via API...');
        console.log(`🌐 Conectando a: ${API_BASE_URL}\n`);

        // Verificar que el servidor esté activo
        console.log('📡 Verificando servidor...');
        try {
            const healthCheck = await axios.get(`${API_BASE_URL}/api/health`);
            console.log('✅ Servidor activo\n');
        } catch (error) {
            console.log('❌ Error: El servidor no está ejecutándose');
            console.log('💡 Inicia el servidor con: npm start');
            console.log(`🌐 Esperado en: ${API_BASE_URL}\n`);
            process.exit(1);
        }

        // Crear SuperAdmin
        console.log('👑 Creando SuperAdmin...');
        const response = await axios.post(
            `${API_BASE_URL}/api/auth/create-superadmin`,
            SUPERADMIN_DATA,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Éxito
        console.log('\n🎉 ¡SuperAdmin creado exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 INFORMACIÓN DE ACCESO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (response.data && response.data.data) {
            const { user, person, credentials } = response.data.data;
            console.log(`👤 Nombre: ${person.nombre}`);
            console.log(`📄 Documento: ${person.doc}`);
            console.log(`📧 Email: ${credentials.email}`);
            console.log(`🔑 Username: ${credentials.username}`);
            console.log(`🔒 Password: ${credentials.password}`);
        } else {
            console.log(`📧 Email: ${SUPERADMIN_DATA.email}`);
            console.log(`🔒 Password: ${SUPERADMIN_DATA.password}`);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🌐 URL de Login: http://localhost:5000/api/auth/login');
        console.log('\n📝 Próximos pasos:');
        console.log('   1. Usa estas credenciales para hacer login');
        console.log('   2. Cambia la contraseña por una más segura');
        console.log('   3. Crea usuarios administradores adicionales');

    } catch (error) {
        console.error('\n❌ Error al crear SuperAdmin:');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (error.response) {
            // Error de respuesta del servidor
            console.error(`🚨 Estado HTTP: ${error.response.status}`);
            console.error(`📝 Mensaje: ${error.response.data.message || 'Error desconocido'}`);
            
            if (error.response.status === 400) {
                console.error('\n💡 Posibles causas:');
                console.error('   - Ya existe un SuperAdmin en el sistema');
                console.error('   - Los datos proporcionados son inválidos');
                console.error('   - Ya existe una persona con el mismo documento');
            }
        } else if (error.request) {
            // Error de conexión
            console.error('🚨 Error de conexión');
            console.error('💡 Verifica que el servidor esté ejecutándose en:', API_BASE_URL);
        } else {
            // Otro error
            console.error('🚨 Error:', error.message);
        }
        
        process.exit(1);
    }
}

// Función para mostrar ayuda
function showHelp() {
    console.log('\n📚 Script de Creación de SuperAdmin via API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📖 DESCRIPCIÓN:');
    console.log('   Este script usa el endpoint API para crear el SuperAdmin.');
    console.log('   Requiere que el servidor esté ejecutándose.');
    console.log('\n🔧 USO:');
    console.log('   node scripts/createSuperAdminAPI.js');
    console.log('\n⚙️  CONFIGURACIÓN:');
    console.log('   - URL del servidor: http://localhost:5000 (por defecto)');
    console.log('   - Email: admin@biblioteca.com');
    console.log('   - Password: BibliotecaAdmin2024!');
    console.log('\n🌐 VARIABLES DE ENTORNO:');
    console.log('   API_URL - URL base del servidor (opcional)');
    console.log('\n📋 PREREQUISITOS:');
    console.log('   1. Servidor backend ejecutándose');
    console.log('   2. Base de datos MongoDB conectada');
    console.log('   3. No debe existir SuperAdmin previo');
    process.exit(0);
}

// Verificar argumentos
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
}

// Ejecutar
if (require.main === module) {
    createSuperAdminViaAPI();
}

module.exports = createSuperAdminViaAPI;
