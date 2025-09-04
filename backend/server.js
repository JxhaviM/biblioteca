require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta de prueba y estado de la API
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'API de Biblioteca funcionando correctamente',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            books: '/api/books',
            students: '/api/students', 
            loans: '/api/loans',
            reports: '/api/reports',
            pqrs: '/api/pqrs'
        },
        features: [
            'Sistema de préstamos inteligente',
            'Gestión de copias múltiples',
            'Estados automáticos',
            'Reportes y estadísticas',
            'Validaciones de reglas de negocio'
        ],
        status: 'active'
    });
});

// Cargar rutas del sistema
try {
    console.log('🔍 Cargando rutas del sistema...');
    
    // Importar middleware
    const { updateLoanStatuses } = require('./middlewares/loanMiddleware');
    
    // Importar rutas
    const authRoutes = require('./routes/authRoutes');
    console.log('✅ authRoutes - OK');
    app.use('/api/auth', authRoutes);
    
    const bookRoutes = require('./routes/bookRoutes');
    console.log('✅ bookRoutes - OK');
    app.use('/api/books', bookRoutes);
    
    const studentRoutes = require('./routes/studentRoutes');
    console.log('✅ studentRoutes - OK');
    app.use('/api/students', updateLoanStatuses, studentRoutes);
    
    const loanRoutes = require('./routes/loanRoutes');
    console.log('✅ loanRoutes - OK');
    app.use('/api/loans', updateLoanStatuses, loanRoutes);
    
    const reportsRoutes = require('./routes/reportsRoutes');
    console.log('✅ reportsRoutes - OK');
    app.use('/api/reports', updateLoanStatuses, reportsRoutes);
    
    const pqrRoutes = require('./routes/pqrRoutes');
    console.log('✅ pqrRoutes - OK');
    app.use('/api/pqrs', pqrRoutes);
    
    console.log('✅ Todas las rutas cargadas correctamente');
    
} catch (error) {
    console.error('❌ Error al cargar rutas:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

// Ruta para verificar el estado de la API
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
        availableRoutes: [
            '/api/auth',
            '/api/books', 
            '/api/students',
            '/api/loans',
            '/api/reports',
            '/api/pqrs',
            '/api/health'
        ]
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    
    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors
        });
    }
    
    // Error de duplicado (MongoDB)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `El ${field} ya existe en la base de datos`
        });
    }
    
    // Error de cast (ID inválido)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID de recurso inválido'
        });
    }
    
    // Error interno del servidor
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`🌐 API disponible en: http://localhost:${PORT}`);
    console.log(`📚 Endpoints principales:`);
    console.log(`   - Books: http://localhost:${PORT}/api/books`);
    console.log(`   - Students: http://localhost:${PORT}/api/students`);
    console.log(`   - Loans: http://localhost:${PORT}/api/loans`);
    console.log(`   - Reports: http://localhost:${PORT}/api/reports`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
    console.log(`✨ Sistema de biblioteca completamente funcional!`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.log('❌ Unhandled Promise Rejection:', err.message);
    server.close(() => {
        process.exit(1);
    });
});
