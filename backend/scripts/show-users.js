#!/usr/bin/env node

// Script para conectar directamente a MongoDB y ver los usuarios
const mongoose = require('mongoose');
require('dotenv').config();

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

// Esquemas simplificados para consulta
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
    role: String,
    isActive: Boolean,
    personRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' }
}, { timestamps: true });

const Person = mongoose.model('Person', PersonSchema);
const User = mongoose.model('User', UserSchema);

async function showUsers() {
    try {
        await connectDB();
        
        console.log('👥 USUARIOS EN EL SISTEMA');
        console.log('=========================');
        
        const users = await User.find().populate('personRef');
        
        if (users.length === 0) {
            console.log('❌ No hay usuarios en el sistema');
            console.log('');
            console.log('💡 Para crear el primer superadmin, ejecuta:');
            console.log('   npm run setup-admin');
            return;
        }
        
        console.log(`📊 Total de usuarios: ${users.length}`);
        console.log('');
        
        users.forEach((user, index) => {
            console.log(`👤 Usuario ${index + 1}:`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email || 'No especificado'}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Activo: ${user.isActive ? 'Sí' : 'No'}`);
            
            if (user.personRef) {
                console.log(`   Persona: ${user.personRef.nombre1} ${user.personRef.apellido1}`);
                console.log(`   Documento: ${user.personRef.doc}`);
                console.log(`   Tipo: ${user.personRef.tipoPersona}`);
                console.log(`   Estado: ${user.personRef.estado}`);
            } else {
                console.log(`   ❌ Sin persona asociada`);
            }
            console.log('');
        });
        
        // Mostrar info de login
        const superadmin = users.find(u => u.role === 'superadmin');
        if (superadmin) {
            console.log('🔑 CREDENCIALES DE LOGIN:');
            console.log('========================');
            console.log(`Username: ${superadmin.username}`);
            console.log('Password: [La que definiste al crearlo]');
            console.log('');
            console.log('💡 Para hacer login usa:');
            console.log(`   POST /api/auth/login`);
            console.log(`   Body: {"username": "${superadmin.username}", "password": "tu_password"}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

showUsers();
