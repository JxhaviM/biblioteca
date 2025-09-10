#!/usr/bin/env node

const axios = require('axios');

// Configuración
const API_URL = 'http://localhost:5000';

// Datos del superadmin por defecto
const defaultSuperAdmin = {
    email: 'admin@biblioteca.com',
    password: 'admin123',
    personData: {
        doc: `${Math.floor(Math.random() * 900000000) + 100000000}`,
        tipoDoc: 'CC',
        apellido1: 'Administrador',
        apellido2: 'Sistema',
        nombre1: 'Super',
        nombre2: 'Admin',
        genero: 'Masculino',
        tipoPersona: 'Colaborador'
    }
};

async function createDefaultSuperAdmin() {
    console.log('🔐 CREANDO SUPERADMINISTRADOR POR DEFECTO');
    console.log('==========================================');
    console.log('');
    
    try {
        // Verificar conexión
        console.log('📡 Verificando conexión...');
        await axios.get(`${API_URL}/api/health`);
        console.log('✅ Servidor conectado');
        
        // Crear superadmin
        console.log('🔄 Creando SuperAdministrador...');
        const response = await axios.post(
            `${API_URL}/api/auth/create-superadmin`,
            defaultSuperAdmin
        );
        
        console.log('');
        console.log('🎉 ¡SuperAdministrador creado exitosamente!');
        console.log('==========================================');
        console.log('📧 Email: admin@biblioteca.com');
        console.log('🔒 Password: admin123');
        console.log(`🆔 Username: ${response.data.data.user.username}`);
        console.log('👤 Nombre: Super Admin Administrador Sistema');
        console.log('');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
        console.log('🚀 Sistema listo para usar!');
        
    } catch (error) {
        console.log('');
        console.log('❌ Error:');
        
        if (error.response) {
            console.log(`   ${error.response.data.message}`);
            
            if (error.response.status === 400 && error.response.data.message.includes('ya existe')) {
                console.log('');
                console.log('ℹ️  El SuperAdministrador ya existe. Usa las credenciales:');
                console.log('   Email: admin@biblioteca.com');
                console.log('   Password: admin123');
            }
        } else {
            console.log('   No se pudo conectar al servidor');
            console.log('   Ejecuta: npm start');
        }
    }
}

// Ejecutar
createDefaultSuperAdmin();
