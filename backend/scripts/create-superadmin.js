#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

// Configuración
const API_URL = 'http://localhost:5000';

// Crear interfaz de readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para hacer preguntas
const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
};

// Función para ocultar password (simulado)
const questionPassword = (prompt) => {
    return new Promise((resolve) => {
        process.stdout.write(prompt);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        let password = '';
        process.stdin.on('data', (ch) => {
            ch = ch + "";
            
            switch (ch) {
                case "\n":
                case "\r":
                case "\u0004": // Ctrl+D
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdout.write('\n');
                    resolve(password);
                    break;
                case "\u0003": // Ctrl+C
                    process.exit();
                    break;
                default:
                    if (ch.charCodeAt(0) === 8) { // Backspace
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    } else {
                        password += ch;
                        process.stdout.write('*');
                    }
                    break;
            }
        });
    });
};

// Función principal
async function createSuperAdmin() {
    console.log('🔐 CREADOR DE SUPERADMINISTRADOR');
    console.log('====================================');
    console.log('');
    
    try {
        // Verificar que el servidor esté corriendo
        console.log('📡 Verificando conexión con el servidor...');
        await axios.get(`${API_URL}/api/health`);
        console.log('✅ Servidor conectado correctamente');
        console.log('');
        
        // Recolectar datos del superadmin
        console.log('📝 Por favor, ingrese los datos del SuperAdministrador:');
        console.log('');
        
        const email = await question('📧 Email: ');
        const password = await questionPassword('🔒 Contraseña: ');
        
        console.log('');
        console.log('👤 Datos personales:');
        const doc = await question('🆔 Número de documento: ');
        const tipoDoc = await question('📄 Tipo de documento (CC/TI/CE/Pasaporte) [CC]: ') || 'CC';
        const apellido1 = await question('👨 Primer apellido: ');
        const apellido2 = await question('👨 Segundo apellido: ');
        const nombre1 = await question('👤 Primer nombre: ');
        const nombre2 = await question('👤 Segundo nombre: ');
        const genero = await question('⚧ Género (Masculino/Femenino/Otro) [Masculino]: ') || 'Masculino';
        
        console.log('');
        console.log('🔄 Creando SuperAdministrador...');
        
        // Preparar datos
        const superAdminData = {
            email,
            password,
            personData: {
                doc,
                tipoDoc,
                apellido1,
                apellido2,
                nombre1,
                nombre2,
                genero,
                tipoPersona: 'Colaborador'
            }
        };
        
        // Crear superadmin
        const response = await axios.post(
            `${API_URL}/api/auth/create-superadmin`,
            superAdminData
        );
        
        console.log('');
        console.log('🎉 ¡SuperAdministrador creado exitosamente!');
        console.log('====================================');
        console.log(`👤 Nombre: ${response.data.data.person.nombre}`);
        console.log(`📧 Email: ${response.data.data.user.email}`);
        console.log(`🆔 Username: ${response.data.data.user.username}`);
        console.log(`🔑 Role: ${response.data.data.user.role}`);
        console.log('');
        console.log('✨ Ahora puedes hacer login con:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('');
        console.log('🚀 Sistema listo para usar!');
        
    } catch (error) {
        console.log('');
        console.log('❌ Error al crear SuperAdministrador:');
        
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message}`);
            
            if (error.response.data.errors) {
                console.log('   Errores:');
                error.response.data.errors.forEach(err => {
                    console.log(`     - ${err}`);
                });
            }
        } else if (error.request) {
            console.log('   No se pudo conectar al servidor');
            console.log('   Asegúrate de que el servidor esté corriendo en http://localhost:5000');
        } else {
            console.log(`   ${error.message}`);
        }
        
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    createSuperAdmin().catch(console.error);
}

module.exports = createSuperAdmin;
