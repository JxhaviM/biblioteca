const mongoose = require('mongoose');
require('dotenv').config();

async function checkPersonsWithUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biblioteca';
    console.log('Conectando a:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const Person = require('../models/person');
    const User = require('../models/user');
    
    // Buscar personas de prueba
    const testPersons = await Person.find({
      $or: [
        { nombre1: { $regex: 'Super', $options: 'i' } },
        { nombre1: { $regex: 'Admin', $options: 'i' } },
        { nombre1: { $regex: 'Test', $options: 'i' } }
      ]
    });
    
    console.log('=== ANÁLISIS DE PERSONAS VS USUARIOS ===\n');
    
    for (const person of testPersons) {
      // Buscar si esta persona tiene un usuario asociado
      const user = await User.findOne({ personRef: person._id });
      
      console.log(`👤 ${person.getNombreCompleto()}`);
      console.log(`   📄 Doc: ${person.doc}`);
      console.log(`   👥 Tipo: ${person.tipoPersona}`);
      
      if (user) {
        console.log(`   ✅ TIENE USUARIO: ${user.username} (${user.role})`);
        console.log(`   🔒 Activo: ${user.isActive ? 'Sí' : 'No'}`);
      } else {
        console.log(`   ❌ NO TIENE USUARIO - Solo es un registro de persona`);
      }
      console.log('   ---');
    }
    
    // Estadísticas generales
    const totalPersons = await Person.countDocuments();
    const totalUsers = await User.countDocuments();
    const personsWithUsers = await Person.countDocuments({ tieneCuenta: true });
    
    console.log('\n=== ESTADÍSTICAS GENERALES ===');
    console.log(`📊 Total personas: ${totalPersons}`);
    console.log(`👤 Total usuarios: ${totalUsers}`);
    console.log(`🔗 Personas con cuenta: ${personsWithUsers}`);
    console.log(`📝 Personas sin cuenta: ${totalPersons - personsWithUsers}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkPersonsWithUsers();
