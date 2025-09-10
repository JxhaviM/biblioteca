#!/usr/bin/env node

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
};

// Conectar a MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biblioteca');
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};

// Esquemas
const PersonSchema = new mongoose.Schema({
    doc: String,
    apellido1: String,
    apellido2: String,
    nombre1: String,
    nombre2: String,
    tipoPersona: String,
    estado: String
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String,
    isActive: Boolean,
    personRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' }
}, { timestamps: true });

const Person = mongoose.model('Person', PersonSchema);
const User = mongoose.model('User', UserSchema);

async function resetSuperAdminPassword() {
    try {
        await connectDB();
        
        console.log('🔐 RESET DE CONTRASEÑA DEL SUPERADMIN');
        console.log('=====================================');
        console.log('');
        
        // Buscar superadmin
        const superadmin = await User.findOne({ role: 'superadmin' }).populate('personRef');
        
        if (!superadmin) {
            console.log('❌ No se encontró ningún SuperAdministrador en el sistema');
            console.log('');
            console.log('💡 Para crear uno nuevo, ejecuta:');
            console.log('   npm run create-superadmin');
            return;
        }
        
        console.log('👤 SuperAdmin encontrado:');
        console.log(`   Username: ${superadmin.username}`);
        console.log(`   Email: ${superadmin.email || 'No especificado'}`);
        if (superadmin.personRef) {
            console.log(`   Nombre: ${superadmin.personRef.nombre1} ${superadmin.personRef.apellido1}`);
        }
        console.log('');
        
        // Pedir nueva contraseña
        const newPassword = await question('🔒 Nueva contraseña: ');
        
        if (!newPassword || newPassword.length < 6) {
            console.log('❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        const confirmPassword = await question('🔒 Confirmar contraseña: ');
        
        if (newPassword !== confirmPassword) {
            console.log('❌ Las contraseñas no coinciden');
            return;
        }
        
        console.log('');
        console.log('🔄 Actualizando contraseña...');
        
        // Hash de la nueva contraseña
        const salt = await bcryptjs.genSalt(12);
        const hashedPassword = await bcryptjs.hash(newPassword, salt);
        
        // Actualizar en la base de datos
        superadmin.password = hashedPassword;
        await superadmin.save();
        
        console.log('✅ ¡Contraseña actualizada exitosamente!');
        console.log('');
        console.log('🔑 Credenciales de login:');
        console.log(`   Username: ${superadmin.username}`);
        console.log(`   Password: ${newPassword}`);
        console.log('');
        console.log('🚀 Ahora puedes hacer login con estas credenciales');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
        mongoose.connection.close();
    }
}

resetSuperAdminPassword();
