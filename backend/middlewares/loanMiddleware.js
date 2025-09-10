const Loan = require('../models/loan');

// Middleware para actualizar estados de préstamos automáticamente
const updateLoanStatuses = async (req, res, next) => {
    try {
        const now = new Date();
        
        // Actualizar préstamos que están vencidos a estado 'atrasado'
        const updatedLoans = await Loan.updateMany(
            {
                isBorrowed: true,
                status: 'prestado',
                dueDate: { $lt: now }
            },
            { 
                status: 'atrasado'
            }
        );

        // Log solo si se actualizaron préstamos (opcional)
        if (updatedLoans.modifiedCount > 0) {
            console.log(`📅 ${updatedLoans.modifiedCount} préstamos actualizados a estado 'atrasado'`);
        }

        next();
    } catch (error) {
        console.error('Error al actualizar estados de préstamos:', error);
        next(); // Continuar con la petición aunque falle la actualización
    }
};

// Función para ejecutar mantenimiento periódico de la base de datos
const performDatabaseMaintenance = async () => {
    try {
        const now = new Date();
        
        // 1. Actualizar préstamos atrasados
        const overdueUpdate = await Loan.updateMany(
            {
                isBorrowed: true,
                status: 'prestado',
                dueDate: { $lt: now }
            },
            { status: 'atrasado' }
        );

        // 2. Limpiar préstamos muy antiguos (opcional - comentado por seguridad)
        // const oldLoansCleanup = await Loan.deleteMany({
        //     status: 'devuelto',
        //     returnDate: { $lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } // Más de 1 año
        // });

        // 3. Generar estadísticas de mantenimiento
        const stats = await Loan.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('🔧 Mantenimiento de base de datos completado:');
        console.log(`   - Préstamos marcados como atrasados: ${overdueUpdate.modifiedCount}`);
        console.log('   - Estado actual de préstamos:');
        stats.forEach(stat => {
            console.log(`     * ${stat._id}: ${stat.count}`);
        });

        return {
            overdueUpdated: overdueUpdate.modifiedCount,
            currentStats: stats,
            timestamp: now
        };

    } catch (error) {
        console.error('❌ Error en mantenimiento de base de datos:', error);
        throw error;
    }
};

// Función para validar reglas de negocio antes de crear préstamos
const validateLoanRules = async (userId, bookId) => {
    const rules = {
        maxLoansPerUser: 5,
        maxOverdueLoansAllowed: 2,
        maxRenewalDays: 30
    };

    try {
        // 1. Verificar número máximo de préstamos activos por usuario
        const activeLoans = await Loan.countDocuments({
            userId: userId,
            isBorrowed: true,
            status: { $in: ['prestado', 'atrasado'] }
        });

        if (activeLoans >= rules.maxLoansPerUser) {
            throw new Error(`El usuario ya tiene ${activeLoans} préstamos activos. Máximo permitido: ${rules.maxLoansPerUser}`);
        }

        // 2. Verificar préstamos atrasados
        const overdueLoans = await Loan.countDocuments({
            userId: userId,
            status: 'atrasado'
        });

        if (overdueLoans >= rules.maxOverdueLoansAllowed) {
            throw new Error(`El usuario tiene ${overdueLoans} préstamos atrasados. Debe devolver libros atrasados antes de solicitar nuevos préstamos.`);
        }

        // 3. Verificar si el usuario ya tiene este libro prestado
        const existingLoan = await Loan.findOne({
            userId: userId,
            bookId: bookId,
            isBorrowed: true,
            status: { $in: ['prestado', 'atrasado'] }
        });

        if (existingLoan) {
            throw new Error('El usuario ya tiene una copia de este libro prestada');
        }

        return {
            valid: true,
            activeLoans,
            overdueLoans,
            rules
        };

    } catch (error) {
        return {
            valid: false,
            error: error.message,
            rules
        };
    }
};

// Función para calcular fecha de vencimiento inteligente
const calculateDueDate = (loanType = 'standard', userGrade = null) => {
    const now = new Date();
    let daysToAdd = 14; // Por defecto 14 días

    // Reglas específicas según el tipo de préstamo
    switch (loanType) {
        case 'weekend':
            daysToAdd = 3; // Préstamo de fin de semana
            break;
        case 'vacation':
            daysToAdd = 30; // Préstamo de vacaciones
            break;
        case 'research':
            daysToAdd = 21; // Préstamo para investigación
            break;
        case 'standard':
        default:
            daysToAdd = 14; // Préstamo estándar
            break;
    }

    // Ajustar según el grado del usuario (opcional)
    if (userGrade) {
        // Usuarios de grados superiores pueden tener más tiempo
        if (userGrade.includes('11') || userGrade.includes('12') || userGrade.toLowerCase().includes('universitario')) {
            daysToAdd += 7; // 7 días adicionales para grados superiores
        }
    }

    const dueDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    
    // Evitar que la fecha de vencimiento caiga en domingo
    const dayOfWeek = dueDate.getDay();
    if (dayOfWeek === 0) { // Domingo
        dueDate.setDate(dueDate.getDate() + 1); // Mover a lunes
    }

    return dueDate;
};

// Función para generar reportes automáticos
const generateAutomaticReports = async () => {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Reporte de préstamos de la última semana
        const weeklyLoans = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: oneWeekAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$loanStartDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Reporte de libros más prestados
        const popularBooks = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: oneWeekAgo }
                }
            },
            {
                $group: {
                    _id: '$bookId',
                    loanCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'book'
                }
            },
            { $unwind: '$book' },
            { $sort: { loanCount: -1 } },
            { $limit: 10 }
        ]);

        // Reporte de usuarios más activos
        const activeUsers = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: oneWeekAgo }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    loanCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            { $sort: { loanCount: -1 } },
            { $limit: 10 }
        ]);

        const report = {
            period: {
                from: oneWeekAgo.toISOString().split('T')[0],
                to: now.toISOString().split('T')[0]
            },
            weeklyLoans,
            popularBooks,
            activeUsers,
            generatedAt: now
        };

        console.log('📊 Reporte semanal generado automáticamente');
        
        return report;

    } catch (error) {
        console.error('Error generando reportes automáticos:', error);
        throw error;
    }
};

module.exports = {
    updateLoanStatuses,
    performDatabaseMaintenance,
    validateLoanRules,
    calculateDueDate,
    generateAutomaticReports
};
