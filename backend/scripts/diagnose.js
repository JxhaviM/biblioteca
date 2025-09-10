#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAPI() {
    try {
        console.log('🔧 DIAGNÓSTICO DEL SISTEMA');
        console.log('==========================');
        
        // Test 1: Conexión al servidor
        console.log('📡 Test 1: Conexión al servidor...');
        const healthResponse = await axios.get(`${API_URL}/api/health`);
        console.log('✅ Servidor conectado');
        console.log('');
        
        // Test 2: Crear superadmin (esperamos error si ya existe)
        console.log('🔐 Test 2: Intentando crear superadmin por defecto...');
        try {
            const createResponse = await axios.post(`${API_URL}/api/auth/create-superadmin`, {
                email: 'admin@biblioteca.com',
                password: 'admin123',
                personData: {
                    doc: '123456789',
                    tipoDoc: 'CC',
                    apellido1: 'Administrador',
                    apellido2: 'Sistema',
                    nombre1: 'Super',
                    nombre2: 'Admin',
                    genero: 'M',
                    tipoPersona: 'Colaborador'
                }
            });
            
            console.log('✅ SuperAdmin creado exitosamente!');
            console.log(`👤 Username: ${createResponse.data.data.user.username}`);
            
        } catch (createError) {
            if (createError.response && createError.response.status === 400) {
                console.log('ℹ️  SuperAdmin ya existe (esto es normal)');
            } else {
                console.log('❌ Error inesperado al crear SuperAdmin:');
                console.log(`   ${createError.response?.data?.message || createError.message}`);
                return;
            }
        }
        
        console.log('');
        
        // Test 3: Intentar login con diferentes combinaciones
        console.log('🔑 Test 3: Probando login...');
        
        const loginAttempts = [
            { username: 'admin@biblioteca.com', password: 'admin123' },
            { email: 'admin@biblioteca.com', password: 'admin123' }
        ];
        
        for (const attempt of loginAttempts) {
            try {
                console.log(`   Probando con: ${JSON.stringify(attempt)}`);
                const loginResponse = await axios.post(`${API_URL}/api/auth/login`, attempt);
                
                console.log('✅ ¡Login exitoso!');
                console.log(`   Username: ${loginResponse.data.data.user.username}`);
                console.log(`   Role: ${loginResponse.data.data.user.role}`);
                console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
                break;
                
            } catch (loginError) {
                console.log(`   ❌ ${loginError.response?.data?.message || loginError.message}`);
            }
        }
        
    } catch (error) {
        console.log('❌ Error general:');
        console.log(`   ${error.message}`);
    }
}

testAPI();
