const mongoose = require('mongoose');
require('dotenv').config();

async function checkTestData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biblioteca';
    console.log('Conectando a:', mongoUri);
    await mongoose.connect(mongoUri);
    const Person = require('../models/person');
    
    const testPersons = await Person.find({
      $or: [
        { nombre1: { $regex: 'Super', $options: 'i' } },
        { nombre1: { $regex: 'Admin', $options: 'i' } },
        { nombre1: { $regex: 'Test', $options: 'i' } }
      ]
    });
    
    console.log('=== DATOS DE PRUEBA ENCONTRADOS ===');
    console.log(`Total: ${testPersons.length} registros`);
    
    testPersons.forEach((person, index) => {
      console.log(`${index + 1}. ${person.getNombreCompleto()}`);
      console.log(`   Doc: ${person.doc} | Tipo: ${person.tipoPersona}`);
      console.log(`   Creado: ${person.createdAt}`);
      console.log('   ---');
    });
    
    console.log('\n=== RECOMENDACIÓN ===');
    if (testPersons.length > 0) {
      console.log('🔍 Estos parecen ser datos de prueba/desarrollo.');
      console.log('💡 Puedes eliminarlos si quieres limpiar la base de datos.');
    } else {
      console.log('✅ No se encontraron datos de prueba obvios.');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkTestData();
