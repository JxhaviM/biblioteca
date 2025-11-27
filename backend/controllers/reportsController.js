const Book = require('../models/book');
const User = require('../models/user');
const Loan = require('../models/loan');
const Log = require('../models/Log');
const { generateAutomaticReports, performDatabaseMaintenance } = require('../middlewares/loanMiddleware');

// Obtener dashboard con estadísticas generales
const getDashboard = async (req, res) => {
    try {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Estadísticas generales - AGRUPAR LIBROS por ISBN + GRADO como en /admin/libros
        const booksAggregation = await Book.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: { isbn: '$isbn', grado: '$grado' } } },
            { $count: 'total' }
        ]);
        const totalBooks = booksAggregation[0]?.total || 0;
        
        const totalUsers = await User.countDocuments({ isActive: true });
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
                        isbn: '$book.isbn',
                        coverImage: '$book.coverImage'
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
                    totalUsers,
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

        // Si no se proporcionan fechas, usar rango por defecto (últimos 6 meses)
        let start, end;
        if (!startDate && !endDate) {
            end = new Date();
            start = new Date();
            start.setMonth(start.getMonth() - 6);
        } else {
            start = new Date(startDate);
            end = new Date(endDate);
        }

        const loans = await Loan.find({
            loanStartDate: {
                $gte: start,
                $lte: end
            }
        })
    .populate('bookId', 'title author isbn genre coverImage')
        .populate('userId', 'username tipoPersona personRef')
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
                        genre: '$book.genre',
                        coverImage: '$book.coverImage'
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

// TEMPORAL: Función comentada mientras se migra de Student a User
const getActiveStudentsReport = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Función en migración - usar /api/users para obtener usuarios activos',
            data: {
                totalUsers: 0,
                users: []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en reporte de usuarios',
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

// Reporte de usuarios activos (reemplaza el de estudiantes)
const getActiveUsersReport = async (req, res) => {
    try {
        const { startDate, endDate, tipoPersona, page = 1, limit = 50 } = req.query;
        
        // Construir filtros de fecha
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.loanStartDate = {};
            if (startDate) dateFilter.loanStartDate.$gte = new Date(startDate);
            if (endDate) dateFilter.loanStartDate.$lte = new Date(endDate);
        }

        // Agregar filtro por tipo de persona si se especifica
        if (tipoPersona) {
            dateFilter.tipoPersona = tipoPersona;
        }

        const activeUsers = await Loan.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$userId',
                    tipoPersona: { $first: '$tipoPersona' },
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
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    user: {
                        username: '$user.username',
                        tipoPersona: '$user.tipoPersona',
                        role: '$user.role'
                    },
                    totalLoans: 1,
                    currentLoans: 1,
                    overdueLoans: 1,
                    totalRenewals: 1,
                    averageLoansPerMonth: {
                        $round: [{ $divide: ['$totalLoans', 12] }, 2]
                    }
                }
            },
            { $sort: { totalLoans: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers: activeUsers.length,
                users: activeUsers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: activeUsers.length === parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reporte de usuarios activos',
            error: error.message
        });
    }
};

// Obtener reporte de usuarios
const getUsersReport = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, status } = req.query;
        
        // Construir filtros
        let filters = {};
        if (role) filters.role = role;
        if (status) filters.isActive = status === 'active';
        
        // Obtener TODOS los usuarios para ordenamiento global
        const allUsers = await User.find(filters)
            .populate('personRef')
            .sort({ createdAt: -1 });
        
        // Contar préstamos por usuario para todos
        const usersWithStats = await Promise.all(allUsers.map(async (user) => {
            const loansCount = await Loan.countDocuments({ userId: user._id });
            const activeLoans = await Loan.countDocuments({ 
                userId: user._id, 
                isBorrowed: true 
            });
            
            return {
                ...user.toObject(),
                loansCount,
                activeLoans
            };
        }));
        
        // Ordenar por relevancia: usuarios con más préstamos totales primero
        usersWithStats.sort((a, b) => {
            // Primero: usuarios con más préstamos totales (descendente)
            if (a.loansCount > b.loansCount) return -1;
            if (b.loansCount > a.loansCount) return 1;
            
            // Segundo: usuarios con préstamos activos
            if (a.activeLoans > 0 && b.activeLoans === 0) return -1;
            if (b.activeLoans > 0 && a.activeLoans === 0) return 1;
            
            // Tercero: por fecha de creación (más antiguos primero)
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Aplicar paginación DESPUÉS de ordenar
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = usersWithStats.slice(startIndex, endIndex);
        
        const totalUsers = usersWithStats.length;
        
        res.status(200).json({
            success: true,
            data: paginatedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reporte de usuarios',
            error: error.message
        });
    }
};

// Obtener reporte de libros
const getBooksReport = async (req, res) => {
    try {
        const { page = 1, limit = 20, genre, availability } = req.query;
        
        // Construir filtros
        let filters = { isActive: true };
        if (genre) filters.genre = { $in: [genre] };
        if (availability) {
            if (availability === 'available') {
                filters.copiesAvailable = { $gt: 0 };
            } else if (availability === 'borrowed') {
                filters.copiesAvailable = 0;
            }
        }
        
        // AGRUPAR libros por ISBN + GRADO como en /admin/libros
        const aggregation = [
            { $match: filters },
            {
                $group: {
                    _id: { isbn: '$isbn', grado: '$grado' },
                    // Tomar el primer libro como representante del grupo
                    book: { $first: '$$ROOT' },
                    // Contar total de copias en este grupo
                    totalCopies: { $sum: 1 }
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ['$book', { _groupedCopies: '$totalCopies' }]
                    }
                }
            },
            { $sort: { title: 1, grado: 1 } }
        ];
        
        // Aplicar paginación
        const skip = (page - 1) * limit;
        const paginatedAggregation = [
            ...aggregation,
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];
        
        const groupedBooks = await Book.aggregate(paginatedAggregation);
        
        // Contar préstamos por libro y preparar datos finales
        const booksWithStats = await Promise.all(groupedBooks.map(async (book) => {
            const loansCount = await Loan.countDocuments({ bookId: book._id });
            const activeLoans = await Loan.countDocuments({ 
                bookId: book._id, 
                isBorrowed: true 
            });
            
            return {
                ...book,
                loansCount,
                activeLoans,
                totalTimesLoaned: loansCount
            };
        }));
        
        // Contar total de grupos únicos (ISBN + GRADO)
        const totalAggregation = await Book.aggregate([
            { $match: filters },
            {
                $group: {
                    _id: { isbn: '$isbn', grado: '$grado' }
                }
            },
            { $count: 'total' }
        ]);
        
        const totalBooks = totalAggregation[0]?.total || 0;
        
        res.status(200).json({
            success: true,
            data: booksWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalBooks,
                pages: Math.ceil(totalBooks / limit),
                note: `Mostrando libros únicos por ISBN + Grado. Total copias individuales: ${await Book.countDocuments(filters)}`
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reporte de libros',
            error: error.message
        });
    }
};

// Obtener actividad del sistema
const getSystemActivity = async (req, res) => {
    try {
        const { limit = 50, startDate, endDate } = req.query;
        
        // Construir filtros de fecha
        let dateFilters = {};
        if (startDate && endDate) {
            dateFilters.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Obtener actividad reciente
        const activity = await Log.find(dateFilters)
            .populate('userId', 'username role')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: activity,
            count: activity.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener actividad del sistema',
            error: error.message
        });
    }
};

// Obtener estadísticas en tiempo real
const getRealTimeStats = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'user';

    let matchQuery = {};
    if (userRole === 'admin') {
      matchQuery = { 'user.role': 'user' };
    }

    const [
      activeUsersNow,
      loansToday,
      returnsToday,
      newUsersToday
    ] = await Promise.all([
      User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        ...(userRole === 'admin' && [{ role: 'user' }])
      }),
      Loan.countDocuments({ 
        loanDate: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Loan.countDocuments({ 
        returnDate: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        },
        ...(userRole === 'admin' && [{ role: 'user' }])
      })
    ]);

    res.json({
      success: true,
      data: {
        activeUsersNow,
        loansToday,
        returnsToday,
        newUsersToday,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error en getRealTimeStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas en tiempo real'
    });
  }
};

module.exports = {
    getDashboard,
    getLoanReport,
    getPopularBooksReport,
    getActiveStudentsReport: getActiveUsersReport, // Alias para compatibilidad con rutas
    getActiveUsersReport,
    getUsersReport,
    getBooksReport,
    getSystemActivity,
    runMaintenance,
    getAutomaticReport,
    getRealTimeStats
};
