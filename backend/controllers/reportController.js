const Loan = require('../models/loan');
const Book = require('../models/book');
const User = require('../models/user');
const Person = require('../models/person');
const Log = require('../models/Log');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Obtener estadísticas generales del sistema
const getSystemStats = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'user';
    const userId = req.headers['x-user-id'];

    let stats = {};

    if (userRole === 'superadmin') {
      // Vista completa para superadmin
      const [
        totalUsers,
        totalBooks,
        totalLoans,
        activeLoans,
        overdueLoans,
        usersByRole,
        booksByGenre,
        loansByMonth
      ] = await Promise.all([
        User.countDocuments(),
        Book.countDocuments(),
        Loan.countDocuments(),
        Loan.countDocuments({ status: 'prestado' }),
        Loan.countDocuments({ 
          status: 'prestado', 
          dueDate: { $lt: new Date() } 
        }),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Book.aggregate([
          { $unwind: '$genre' },
          { $group: { _id: '$genre', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Loan.aggregate([
          {
            $match: {
              loanDate: {
                $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$loanDate' },
                month: { $month: '$loanDate' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      stats = {
        totalUsers,
        totalBooks,
        totalLoans,
        activeLoans,
        overdueLoans,
        availableBooks: await Book.countDocuments({ 'availability.available': { $gt: 0 } }),
        activeUsers: await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
        usersByRole,
        booksByGenre,
        loansByMonth: loansByMonth.map(item => ({
          month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('es-ES', { month: 'long' }),
          count: item.count
        }))
      };
    } else if (userRole === 'admin') {
      // Vista limitada para bibliotecarios
      const [
        totalUsers,
        totalBooks,
        totalLoans,
        activeLoans,
        overdueLoans,
        booksByGenre,
        loansByMonth
      ] = await Promise.all([
        User.countDocuments({ role: 'user' }), // Solo usuarios normales
        Book.countDocuments(),
        Loan.countDocuments(),
        Loan.countDocuments({ status: 'prestado' }),
        Loan.countDocuments({ 
          status: 'prestado', 
          dueDate: { $lt: new Date() } 
        }),
        Book.aggregate([
          { $unwind: '$genre' },
          { $group: { _id: '$genre', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Loan.aggregate([
          {
            $match: {
              loanDate: {
                $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$loanDate' },
                month: { $month: '$loanDate' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      stats = {
        totalUsers,
        totalBooks,
        totalLoans,
        activeLoans,
        overdueLoans,
        availableBooks: await Book.countDocuments({ 'availability.available': { $gt: 0 } }),
        activeUsers: await User.countDocuments({ 
          role: 'user',
          lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        }),
        usersByRole: [
          { role: 'user', count: totalUsers }
        ],
        booksByGenre,
        loansByMonth: loansByMonth.map(item => ({
          month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('es-ES', { month: 'long' }),
          count: item.count
        }))
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error en getSystemStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del sistema'
    });
  }
};

// Obtener reporte de usuarios
const getUsersReport = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'user';
    const { 
      startDate, 
      endDate, 
      status, 
      role,
      page = 1, 
      limit = 50 
    } = req.query;

    let matchQuery = {};
    
    // Filtrar según el rol
    if (userRole === 'admin') {
      matchQuery.role = 'user'; // Los admin solo ven usuarios normales
    } else if (userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este reporte'
      });
    }

    // Aplicar filtros adicionales
    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const users = await User.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'people',
          localField: 'personRef',
          foreignField: '_id',
          as: 'person'
        }
      },
      { $unwind: { path: '$person', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'loans',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } }
          ],
          as: 'loans'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          lastLogin: 1,
          'person.nombre1': 1,
          'person.apellido1': 1,
          'person.tipoPersona': 1,
          loansCount: { $size: { $ifNull: ['$loans', []] } },
          activeLoans: {
            $size: {
              $filter: {
                input: { $ifNull: ['$loans', []] },
                cond: { $eq: ['$$this.status', 'prestado'] }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments(matchQuery);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error en getUsersReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de usuarios'
    });
  }
};

// Obtener reporte de libros
const getBooksReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      genre, 
      status,
      available,
      page = 1, 
      limit = 50 
    } = req.query;

    let matchQuery = {};

    // Aplicar filtros
    if (genre) matchQuery.genre = { $in: [genre] };
    if (available !== undefined) {
      matchQuery['availability.available'] = available === 'true' ? { $gt: 0 } : 0;
    }
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const books = await Book.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'bookId',
          as: 'loans'
        }
      },
      {
        $project: {
          title: 1,
          author: 1,
          isbn: 1,
          genre: 1,
          publishedYear: 1,
          availability: 1,
          createdAt: 1,
          loansCount: { $size: '$loans' },
          activeLoans: {
            $size: {
              $filter: {
                input: '$loans',
                cond: { $eq: ['$$this.status', 'prestado'] }
              }
            }
          },
          totalTimesLoaned: { $size: '$loans' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await Book.countDocuments(matchQuery);

    res.json({
      success: true,
      data: books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error en getBooksReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de libros'
    });
  }
};

// Obtener reporte de préstamos
const getLoansReport = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'user';
    const { 
      startDate, 
      endDate, 
      status, 
      overdue,
      page = 1, 
      limit = 50 
    } = req.query;

    let matchQuery = {};

    // Si no se proporcionan fechas, usar rango por defecto (últimos 6 meses)
    if (!startDate && !endDate) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      matchQuery.loanDate = {
        $gte: sixMonthsAgo,
        $lte: new Date()
      };
    }

    // Filtrar según el rol
    if (userRole === 'admin') {
      // Los admin no ven préstamos de otros admin
      matchQuery['userRole'] = 'user';
    }

    // Aplicar filtros
    if (status) matchQuery.status = status;
    if (overdue === 'true') {
      matchQuery.status = 'prestado';
      matchQuery.dueDate = { $lt: new Date() };
    }
    if (startDate || endDate) {
      if (!matchQuery.loanDate) matchQuery.loanDate = {};
      if (startDate) matchQuery.loanDate.$gte = new Date(startDate);
      if (endDate) matchQuery.loanDate.$lte = new Date(endDate);
    }

    const loans = await Loan.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'people',
          localField: 'user.personRef',
          foreignField: '_id',
          as: 'person'
        }
      },
      { $unwind: { path: '$person', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          loanDate: 1,
          dueDate: 1,
          returnDate: 1,
          status: 1,
          loanType: 1,
          'user.username': 1,
          'user.role': 1,
          'person.nombre1': 1,
          'person.apellido1': 1,
          'book.title': 1,
          'book.author': 1,
          'book.isbn': 1,
          isOverdue: {
            $and: [
              { $eq: ['$status', 'prestado'] },
              { $lt: ['$dueDate', new Date()] }
            ]
          }
        }
      },
      { $sort: { loanDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await Loan.countDocuments(matchQuery);

    res.json({
      success: true,
      data: loans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error en getLoansReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de préstamos'
    });
  }
};

// Obtener actividad del sistema (solo superadmin)
const getSystemActivity = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] || 'user';
    
    if (userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver la actividad del sistema'
      });
    }

    const { limit = 50 } = req.query;

    const activities = await Log.find()
      .sort({ createdAt: -1 })
      .populate('usuario', 'username')
      .lean();

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error en getSystemActivity:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad del sistema'
    });
  }
};

// Exportar reportes a Excel
const exportReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'excel' } = req.query;
    const userRole = req.headers['x-user-role'] || 'user';

    let data = [];
    let filename = '';

    switch (reportType) {
      case 'users':
        const usersResult = await getUsersReport({ headers: req.headers, query: req.query });
        data = usersResult.data;
        filename = `reporte_usuarios_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'books':
        const booksResult = await getBooksReport({ headers: req.headers, query: req.query });
        data = booksResult.data;
        filename = `reporte_libros_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'loans':
        const loansResult = await getLoansReport({ headers: req.headers, query: req.query });
        data = loansResult.data;
        filename = `reporte_prestamos_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        });
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');

      // Agregar encabezados
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Agregar datos
      data.forEach(item => {
        const row = headers.map(header => item[header]);
        worksheet.addRow(row);
      });

      // Configurar respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'csv') {
      // Implementar CSV
      res.status(400).json({
        success: false,
        message: 'Formato CSV no implementado aún'
      });
    }
  } catch (error) {
    console.error('Error en exportReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte'
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
  getSystemStats,
  getUsersReport,
  getBooksReport,
  getLoansReport,
  getSystemActivity,
  exportReport,
  getRealTimeStats
};
