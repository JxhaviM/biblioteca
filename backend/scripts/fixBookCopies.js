/**
 * Script para corregir copias de libros existentes
 * 
 * Problemas a corregir:
 * 1. Copias con status='devuelto' deben volver a 'disponible'
 * 2. Copias disponibles no deben tener fechas de préstamo
 * 3. Copias disponibles no deben tener userId ni tipoPersona
 * 4. Copias sin copyNumber deben tener uno asignado
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Loan = require('../models/loan');

const fixCopies = async () => {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Conectado a MongoDB');

        // 1. Convertir copias 'devuelto' a 'disponible'
        const devueltos = await Loan.updateMany(
            { 
                status: 'devuelto',
                isActive: true,
                $or: [
                    { copyNumber: { $exists: true, $ne: null } },
                    { copyNumber: { $exists: false } }
                ]
            },
            { 
                $set: { 
                    status: 'disponible',
                    isBorrowed: false,
                    userId: null,
                    tipoPersona: null
                }
            }
        );
        console.log(`✅ ${devueltos.modifiedCount} copias cambiadas de 'devuelto' a 'disponible'`);

        // 2. Limpiar fechas de copias disponibles
        const disponibles = await Loan.updateMany(
            { 
                status: 'disponible',
                isActive: true,
                $or: [
                    { copyNumber: { $exists: true, $ne: null } },
                    { copyNumber: { $exists: false } }
                ]
            },
            { 
                $unset: { 
                    loanStartDate: "",
                    dueDate: ""
                },
                $set: {
                    userId: null,
                    tipoPersona: null,
                    isBorrowed: false
                }
            }
        );
        console.log(`✅ ${disponibles.modifiedCount} copias disponibles limpiadas`);

        // 3. Asignar copyNumber a copias que no lo tienen
        console.log('\n📝 Asignando números de copia...');
        
        // Obtener todos los libros únicos que tienen copias
        const uniqueBookIds = await Loan.distinct('bookId', {
            isActive: true,
            status: { $nin: ['pendiente', 'rechazado'] }
        });

        let copiesFixed = 0;
        for (const bookId of uniqueBookIds) {
            const copies = await Loan.find({
                bookId: bookId,
                isActive: true,
                status: { $nin: ['pendiente', 'rechazado'] }
            }).sort({ copyNumber: 1 });

            if (copies.length === 0) continue;

            // Encontrar el máximo copyNumber existente
            const maxCopyNumber = copies.reduce((max, copy) => {
                return (copy.copyNumber || 0) > max ? (copy.copyNumber || 0) : max;
            }, 0);
            
            let nextNumber = maxCopyNumber + 1;
            
            // Asignar números solo a las copias que no lo tienen
            for (const copy of copies) {
                if (!copy.copyNumber || copy.copyNumber === 0) {
                    copy.copyNumber = nextNumber;
                    await copy.save();
                    copiesFixed++;
                    nextNumber++;
                }
            }
        }
        console.log(`✅ ${copiesFixed} copias obtuvieron número de copia asignado`);

        // 4. Mostrar estadísticas finales
        const totalCopias = await Loan.countDocuments({ 
            isActive: true,
            status: { $nin: ['pendiente', 'rechazado'] }
        });
        const copiasDisponibles = await Loan.countDocuments({ 
            status: 'disponible',
            isActive: true
        });
        const copiasPrestadas = await Loan.countDocuments({ 
            status: { $in: ['prestado', 'atrasado'] },
            isActive: true
        });
        const copiasSinNumero = await Loan.countDocuments({
            isActive: true,
            status: { $nin: ['pendiente', 'rechazado'] },
            $or: [
                { copyNumber: { $exists: false } },
                { copyNumber: null },
                { copyNumber: 0 }
            ]
        });

        console.log('\n📊 Estadísticas:');
        console.log(`   Total de copias: ${totalCopias}`);
        console.log(`   Copias disponibles: ${copiasDisponibles}`);
        console.log(`   Copias prestadas: ${copiasPrestadas}`);
        console.log(`   Copias sin número: ${copiasSinNumero}`);

        console.log('\n✨ Corrección completada exitosamente');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixCopies();
