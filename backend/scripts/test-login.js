#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

// Configuración
const API_URL = 'http://localhost:5000';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
};

async function testLogin() {
    console.log('🔐 TEST DE LOGIN');
    console.log('================');
    console.log('');
    
    try {
        // Verificar servidor
        await axios.get(`${API_URL}/api/health`);
        console.log('✅ Servidor conectado');
        console.log('');
        
        // Pedir credenciales
        const username = await question('🆔 Username (o presiona Enter para usar super.administrador): ') || 'super.administrador';
        const password = await question('🔒 Password: ');
        
        if (!password) {
            console.log('❌ La contraseña es requerida');
            return;
        }
        
        console.log('');
        console.log('🔄 Iniciando sesión...');
        
        // Hacer login
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            username,
            password
        });
        
        console.log('');
        console.log('🎉 ¡Login exitoso!');
        console.log('==================');
        console.log(`👤 Usuario: ${response.data.data.user.username}`);
        console.log(`📧 Email: ${response.data.data.user.email || 'No especificado'}`);
        console.log(`🔑 Rol: ${response.data.data.user.role}`);
        if (response.data.data.person) {
            console.log(`👨 Persona: ${response.data.data.person.nombre}`);
        }
        console.log('');
        console.log('🔑 Token JWT:');
        console.log(response.data.token);
        console.log('');
        console.log('✨ Usa este token en el header Authorization: Bearer TOKEN');
        
    } catch (error) {
        console.log('');
        console.log('❌ Error en login:');
        
        if (error.response) {
            console.log(`   ${error.response.data.message}`);
            
            if (error.response.status === 401) {
                console.log('');
                console.log('💡 Sugerencias:');
                console.log('   - Verifica que las credenciales sean correctas');
                console.log('   - Si no tienes superadmin, ejecuta: npm run setup-admin');
            }
        } else {
            console.log('   No se pudo conectar al servidor');
        }
    } finally {
        rl.close();
    }
}

testLogin();
