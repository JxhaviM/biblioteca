require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initAgenda } = require('./jobs/agenda');
const { initializePermissionSystem } = require('./utils/initializePermissions');
const { ensureInitialSuperAdmin } = require('./utils/bootstrapSuperAdmin');

const app = express();

// Conectar a la base de datos
connectDB();

// Inicializar sistema de permisos después de conectar la base de datos
setTimeout(async () => {
    try {
        const { initializePermissionSystem } = require('./utils/initializePermissions');
        await initializePermissionSystem();
        console.log('✅ Sistema de permisos inicializado');

        await ensureInitialSuperAdmin();
    } catch (error) {
        console.error('❌ Error inicializando sistema de permisos:', error.message);
    }
}, 2000); // Pequeño delay para asegurar que la conexión esté establecida

// Inicializar agenda (job processor)
initAgenda().then(() => {
    console.log('✅ Agenda inicializada');
}).catch(err => {
    console.error('❌ Error inicializando Agenda:', err.message);
});

// Middlewares básicos
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Modo desarrollo: Permitiendo cualquier origen');
      return callback(null, true);
    }
    
    // En producción, solo orígenes permitidos
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'http://172.16.3.253:3000',
          'http://localhost:5000',
          'http://172.16.3.253:5000',
          process.env.FRONTEND_URL
        ].filter(Boolean);
    
    console.log('Origen de la petición:', origin);
    console.log('Orígenes permitidos:', allowedOrigins);
    
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.log('✅ Origen permitido:', origin);
      return callback(null, true);
    } else {
      console.log('❌ Origen no permitido:', origin);
      return callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir archivos estáticos (imágenes de portadas)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Archivos estáticos configurados: /uploads');

// Ruta de prueba y estado de la API
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'API de Biblioteca funcionando correctamente',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            persons: '/api/persons',
            attendance: '/api/attendance',
            spaces: '/api/spaces',
            books: '/api/books',
            users: '/api/users',
            loans: '/api/loans',
            reports: '/api/reports',
            permissions: '/api/permissions',
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
    
    const personRoutes = require('./routes/personRoutes');
    console.log('✅ personRoutes - OK');
    app.use('/api/persons', personRoutes);
    
    const attendanceRoutes = require('./routes/attendanceRoutes');
    console.log('✅ attendanceRoutes - OK');
    app.use('/api/attendance', attendanceRoutes);
    
    const spaceUsageRoutes = require('./routes/spaceUsageRoutes');
    console.log('✅ spaceUsageRoutes - OK');
    app.use('/api/spaces', spaceUsageRoutes);
    
    const bookRoutes = require('./routes/bookRoutes');
    console.log('✅ bookRoutes - OK');
    app.use('/api/books', bookRoutes);
    
    const userRoutes = require('./routes/userRoutes');
    console.log('✅ userRoutes - OK');
    app.use('/api/users', userRoutes);
    
    const permissionRoutes = require('./routes/permissionRoutes');
    console.log('✅ permissionRoutes - OK');
    app.use('/api/permissions', permissionRoutes);
    
    const systemRoutes = require('./routes/system');
    console.log('✅ systemRoutes - OK');
    app.use('/api/system', systemRoutes);
    
    // Student routes - Ahora usar /api/users
    // const studentRoutes = require('./routes/studentRoutes');
    // console.log('✅ studentRoutes - OK');
    // app.use('/api/students', updateLoanStatuses, studentRoutes);
    
    const loanRoutes = require('./routes/loanRoutes');
    console.log('✅ loanRoutes - OK');
    app.use('/api/loans', updateLoanStatuses, loanRoutes);
    
    const reportsRoutes = require('./routes/reportsRoutes');
    console.log('✅ reportsRoutes - OK');
    app.use('/api/reports', updateLoanStatuses, reportsRoutes);
    
    // 🔄 Rutas futuras - PQR System (Coming Soon v1.1)
    // const pqrRoutes = require('./routes/pqrRoutes');
    // console.log('✅ pqrRoutes - OK');
    // app.use('/api/pqrs', pqrRoutes);
    
    console.log('✅ Todas las rutas core cargadas correctamente (PQR pendiente v1.1)');
    
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
            '/api/persons',
            '/api/attendance',
            '/api/spaces',
            '/api/books',
            '/api/users',
            '/api/loans',
            '/api/reports',
            '/api/permissions',
            '/api/health'
            // '/api/pqrs' - Coming Soon v1.1
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
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
    console.log(`🌐 Accesible en la red local como: http://${require('os').networkInterfaces().eth0?.[0]?.address || 'localhost'}:${PORT}`);
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
