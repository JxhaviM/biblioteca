const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('../models/book');
const Loan = require('../models/loan');

const testBook = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Buscar el libro específico
        const book = await Book.findOne({
            title: /ALGEBRA Y GEOMETRIA/i,
            author: /ACOSTA/i
        });

        if (!book) {
            console.log('❌ Libro no encontrado');
            process.exit(1);
        }

        console.log('📚 Libro encontrado:');
        console.log(`   ID: ${book._id}`);
        console.log(`   Título: ${book.title}`);
        console.log(`   Autor: ${book.author}`);
        console.log(`   ISBN: ${book.isbn}`);
        console.log(`   isActive: ${book.isActive}\n`);

        // Buscar TODAS las copias de este libro
        console.log('🔍 Buscando copias...\n');
        
        const allLoans = await Loan.find({ bookId: book._id });
        console.log(`📊 Total de registros Loan para este libro: ${allLoans.length}`);
        
        // Agrupar por estado
        const byStatus = {};
        const withCopyNumber = [];
        const withoutCopyNumber = [];
        
        allLoans.forEach(loan => {
            const status = loan.status || 'sin-estado';
            byStatus[status] = (byStatus[status] || 0) + 1;
            
            if (loan.copyNumber) {
                withCopyNumber.push(loan);
            } else {
                withoutCopyNumber.push(loan);
            }
        });
        
        console.log('\n📋 Copias por estado:');
        Object.entries(byStatus).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        
        console.log(`\n✅ Con copyNumber: ${withCopyNumber.length}`);
        console.log(`❌ Sin copyNumber: ${withoutCopyNumber.length}`);
        
        // Mostrar copias activas
        const activeCopies = await Loan.find({
            bookId: book._id,
            isActive: true,
            status: { $nin: ['pendiente', 'rechazado'] }
        }).sort({ copyNumber: 1 });
        
        console.log(`\n🟢 Copias ACTIVAS (excluyendo pendientes/rechazadas): ${activeCopies.length}`);
        
        if (activeCopies.length > 0) {
            console.log('\nPrimeras 5 copias:');
            activeCopies.slice(0, 5).forEach(copy => {
                console.log(`   #${copy.copyNumber || 'SIN NÚMERO'} - Estado: ${copy.status} - isBorrowed: ${copy.isBorrowed}`);
            });
        }
        
        // Verificar disponibilidad
        const availability = await book.getAvailabilityInfo();
        console.log('\n📊 Información de disponibilidad:');
        console.log(`   Total: ${availability.totalCopies}`);
        console.log(`   Disponibles: ${availability.availableCopies}`);
        console.log(`   Prestadas: ${availability.borrowedCopies}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testBook();
