const Book = require('../models/book');
const Student = require('../models/student');
const Loan = require('../models/loan');
const { generateAutomaticReports, performDatabaseMaintenance } = require('../middlewares/loanMiddleware');

// Obtener dashboard con estadísticas generales
const getDashboard = async (req, res) => {
    try {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Estadísticas generales
        const totalBooks = await Book.countDocuments({ isActive: true });
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalLoans = await Loan.countDocuments({});

        // Préstamos activos
        const activeLoans = await Loan.countDocuments({
            isBorrowed: true,
            status: { $in: ['prestado', 'atrasado'] }
        });

        // Préstamos atrasados
        const overdueLoans = await Loan.countDocuments({
            status: 'atrasado'
        });

        // Actividad del último mes
        const monthlyActivity = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: oneMonthAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$loanStartDate" }
                    },
                    loans: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Libros más populares del mes
        const popularBooks = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: oneMonthAgo }
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
            {
                $project: {
                    book: {
                        title: '$book.title',
                        author: '$book.author',
                        isbn: '$book.isbn'
                    },
                    loanCount: 1
                }
            },
            { $sort: { loanCount: -1 } },
            { $limit: 5 }
        ]);

        // Distribución por estado de préstamos
        const loanStatusDistribution = await Loan.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalBooks,
                    totalStudents,
                    totalLoans,
                    activeLoans,
                    overdueLoans,
                    availabilityRate: totalBooks > 0 ? ((totalBooks - activeLoans) / totalBooks * 100).toFixed(1) : 0
                },
                monthlyActivity,
                popularBooks,
                loanStatusDistribution,
                period: {
                    from: oneMonthAgo.toISOString().split('T')[0],
                    to: now.toISOString().split('T')[0]
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del dashboard',
            error: error.message
        });
    }
};

// Generar reporte de préstamos por período
const getLoanReport = async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate y endDate son requeridos'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const loans = await Loan.find({
            loanStartDate: {
                $gte: start,
                $lte: end
            }
        })
        .populate('bookId', 'title author isbn genre')
        .populate('studentId', 'name idNumber grade')
        .sort({ loanStartDate: -1 });

        // Estadísticas del período
        const stats = {
            totalLoans: loans.length,
            returnedLoans: loans.filter(loan => loan.status === 'devuelto').length,
            overdueLoans: loans.filter(loan => loan.status === 'atrasado').length,
            currentLoans: loans.filter(loan => loan.status === 'prestado').length,
            averageLoanDuration: 0
        };

        // Calcular duración promedio de préstamos devueltos
        const returnedLoans = loans.filter(loan => loan.returnDate);
        if (returnedLoans.length > 0) {
            const totalDuration = returnedLoans.reduce((sum, loan) => {
                const duration = loan.returnDate - loan.loanStartDate;
                return sum + duration;
            }, 0);
            stats.averageLoanDuration = Math.round(totalDuration / returnedLoans.length / (1000 * 60 * 60 * 24));
        }

        res.status(200).json({
            success: true,
            data: {
                period: {
                    from: startDate,
                    to: endDate
                },
                statistics: stats,
                loans: format === 'summary' ? [] : loans
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de préstamos',
            error: error.message
        });
    }
};

// Obtener reporte de libros más populares
const getPopularBooksReport = async (req, res) => {
    try {
        const { period = 30, limit = 20 } = req.query;
        const now = new Date();
        const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

        const popularBooks = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$bookId',
                    totalLoans: { $sum: 1 },
                    currentlyBorrowed: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['prestado', 'atrasado']] },
                                1,
                                0
                            ]
                        }
                    },
                    averageRenewalCount: { $avg: '$renewalCount' }
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
            {
                $project: {
                    book: {
                        title: '$book.title',
                        author: '$book.author',
                        isbn: '$book.isbn',
                        genre: '$book.genre'
                    },
                    totalLoans: 1,
                    currentlyBorrowed: 1,
                    averageRenewalCount: { $round: ['$averageRenewalCount', 2] },
                    popularityScore: { $multiply: ['$totalLoans', 1] } // Puede ser más complejo
                }
            },
            { $sort: { totalLoans: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.status(200).json({
            success: true,
            data: {
                period: `${period} días`,
                totalBooks: popularBooks.length,
                books: popularBooks
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de libros populares',
            error: error.message
        });
    }
};

// Obtener reporte de estudiantes activos
const getActiveStudentsReport = async (req, res) => {
    try {
        const { period = 30, limit = 20 } = req.query;
        const now = new Date();
        const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

        const activeStudents = await Loan.aggregate([
            {
                $match: {
                    loanStartDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$studentId',
                    totalLoans: { $sum: 1 },
                    currentLoans: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['prestado', 'atrasado']] },
                                1,
                                0
                            ]
                        }
                    },
                    overdueLoans: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'atrasado'] }, 1, 0]
                        }
                    },
                    totalRenewals: { $sum: '$renewalCount' }
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            {
                $project: {
                    student: {
                        name: '$student.name',
                        idNumber: '$student.idNumber',
                        grade: '$student.grade'
                    },
                    totalLoans: 1,
                    currentLoans: 1,
                    overdueLoans: 1,
                    totalRenewals: 1,
                    activityScore: '$totalLoans' // Puede ser más complejo
                }
            },
            { $sort: { totalLoans: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.status(200).json({
            success: true,
            data: {
                period: `${period} días`,
                totalStudents: activeStudents.length,
                students: activeStudents
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de estudiantes activos',
            error: error.message
        });
    }
};

// Ejecutar mantenimiento manual de la base de datos
const runMaintenance = async (req, res) => {
    try {
        const maintenanceResult = await performDatabaseMaintenance();
        
        res.status(200).json({
            success: true,
            message: 'Mantenimiento de base de datos ejecutado exitosamente',
            data: maintenanceResult
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al ejecutar mantenimiento de base de datos',
            error: error.message
        });
    }
};

// Generar reporte automático
const getAutomaticReport = async (req, res) => {
    try {
        const report = await generateAutomaticReports();
        
        res.status(200).json({
            success: true,
            message: 'Reporte automático generado exitosamente',
            data: report
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte automático',
            error: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getLoanReport,
    getPopularBooksReport,
    getActiveStudentsReport,
    runMaintenance,
    getAutomaticReport
};
