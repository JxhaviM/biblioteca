/**
 * Script para migrar libros antiguos al sistema de copias
 * 
 * Crea copias en Loan para libros que:
 * - Tienen múltiples registros con el mismo ISBN
 * - NO tienen copias en la colección Loan
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('../models/book');
const Loan = require('../models/loan');

const migrateLegacyBooks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Obtener todos los ISBNs únicos
        const uniqueIsbns = await Book.distinct('isbn', { isActive: true });
        console.log(`📚 Total de ISBNs únicos: ${uniqueIsbns.length}\n`);

        let booksProcessed = 0;
        let copiesCreated = 0;
        let booksSkipped = 0;

        for (const isbn of uniqueIsbns) {
            // Obtener todos los libros con este ISBN
            const booksWithIsbn = await Book.find({ 
                isbn: isbn, 
                isActive: true 
            }).sort({ createdAt: 1 });

            if (booksWithIsbn.length === 0) continue;

            // Verificar si ya tiene copias en Loan
            const existingCopies = await Loan.countDocuments({
                bookId: { $in: booksWithIsbn.map(b => b._id) },
                status: { $nin: ['pendiente', 'rechazado'] }
            });

            if (existingCopies > 0) {
                booksSkipped++;
                continue; // Ya tiene copias, saltar
            }

            // Crear copias para cada libro
            console.log(`📖 Procesando: ${booksWithIsbn[0].title} (${booksWithIsbn.length} copias)`);
            
            let copyNumber = 1;
            for (const book of booksWithIsbn) {
                await Loan.create({
                    bookId: book._id,
                    copyNumber: copyNumber,
                    status: 'disponible',
                    isBorrowed: false,
                    userId: null,
                    tipoPersona: null,
                    isActive: true
                });
                copyNumber++;
                copiesCreated++;
            }

            booksProcessed++;
        }

        console.log('\n✅ Migración completada:');
        console.log(`   Libros procesados: ${booksProcessed}`);
        console.log(`   Copias creadas: ${copiesCreated}`);
        console.log(`   Libros saltados (ya tenían copias): ${booksSkipped}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

migrateLegacyBooks();
