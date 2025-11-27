const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { processBookCover } = require('../middlewares/imageProcessor');
const { protect, roleRequired } = require('../middlewares/authMiddleware');
const {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    searchBooks,
    getBookAvailability,
    createBulkBooks,
    getBookCopies,
    addBookCopies,
    updateBookCopy,
    deleteBookCopy
} = require('../controllers/bookController');
const { debugSearchBooks, getSimpleBooks, getAllBooksForGenres } = require('../controllers/debugController');
const {
    bulkUploadBooks,
    getBooksStats
} = require('../controllers/bookBulkController');

// Middleware para verificar permisos de cambio de imágenes
const canChangeBookImages = async (req, res, next) => {
    try {
        console.log('🔐 Verificando permisos para cambiar imagen de libro...');
        console.log('🔐 Usuario:', req.user.username, 'Role:', req.user.role);
        
        // Admin y superadmin siempre pueden cambiar imágenes
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            console.log('✅ Permiso concedido: Admin/Superadmin');
            return next();
        }
        
        // Usuarios normales necesitan permiso especial
        if (req.user.role === 'user') {
            const hasPermission = req.user.specialPermissions?.canChangeBookImages === true;
            console.log('🔍 Usuario normal - ¿tiene permiso specialPermissions?.canChangeBookImages?:', hasPermission);
            
            if (hasPermission) {
                console.log('✅ Permiso concedido: Usuario con permiso especial');
                return next();
            } else {
                console.log('❌ Permiso denegado: Usuario sin permiso especial');
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para cambiar imágenes de libros'
                });
            }
        }
        
        // Cualquier otro rol no puede cambiar imágenes
        console.log('❌ Permiso denegado: Rol no autorizado');
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para cambiar imágenes de libros'
        });
        
    } catch (error) {
        console.error('❌ Error en middleware de permisos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos'
        });
    }
};

// Configurar multer para imágenes en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

// Configurar multer para archivos Excel
const uploadExcel = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../uploads'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'books-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'), false);
        }
    }
});

// @desc    Búsqueda avanzada de libros
// @route   GET /api/books/search
// @query   ?search=titulo&genre=ficcion&author=autor&publishedYear=2020&available=true&page=1&limit=20
// @access  Public
router.get('/search', searchBooks);

// @desc    Crear un nuevo libro (con imagen opcional)
// @route   POST /api/books
// @body    title, author, isbn, genre, publishedYear, location, initialCopies, (cover image file)
// @access  Private
router.post('/', protect, roleRequired(['admin', 'superadmin']), upload.single('coverImage'), processBookCover, createBook);

// @desc    Crear múltiples libros (importación masiva)
// @route   POST /api/books/bulk
// @body    [{ title, author, isbn, genre, publishedYear, location, initialCopies }, ...]
// @access  Private
router.post('/bulk', protect, roleRequired(['admin', 'superadmin']), createBulkBooks);

// @desc    Obtener disponibilidad específica de un libro
// @route   GET /api/books/:id/availability
// @access  Public
router.get('/:id/availability', getBookAvailability);

// @desc    Obtener todos los libros con información de disponibilidad
// @route   GET /api/books
// @query   ?page=1&limit=50&search=titulo&genre=ficcion&isActive=true
// @access  Public
router.get('/', getBooks);

// @desc    Obtener todos los libros para géneros (sin agregación)
// @route   GET /api/books/genres/all
// @access  Public
router.get('/genres/all', getAllBooksForGenres);

// @desc    DEBUG: Buscar en todas las colecciones
// @route   GET /api/books/debug/search
// @access  Public (temporal para debug)
router.get('/debug/search', debugSearchBooks);

// @desc    DEBUG: Obtener libros simples sin agregación
// @route   GET /api/books/simple
// @access  Public (temporal para debug)
router.get('/simple', getSimpleBooks);

// @desc    Obtener un libro por ID con detalles de copias
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', getBookById);

// @desc    Actualizar un libro (con imagen opcional)
// @route   PUT /api/books/:id
// @body    title, author, isbn, genre, publishedYear, location, (cover image file)
// @access  Private
router.put('/:id', upload.single('coverImage'), processBookCover, updateBook);

// @desc    Desactivar un libro (soft delete)
// @route   DELETE /api/books/:id
// @access  Private
router.delete('/:id', deleteBook);

// @desc    Actualizar portada de un libro
// @route   PUT /api/books/:id/cover
// @body    coverImage (file)
// @access  Private (con permisos especiales)
router.put('/:id/cover', protect, canChangeBookImages, upload.single('coverImage'), processBookCover, updateBook);

// @desc    Carga masiva de libros desde Excel
// @route   POST /api/books/upload-excel
// @body    file (Excel o CSV)
// @access  Private
router.post('/upload-excel', protect, roleRequired(['admin','superadmin']), uploadExcel.single('file'), bulkUploadBooks);

// @desc    Obtener estadísticas de libros
// @route   GET /api/books/stats/summary
// @access  Private
router.get('/stats/summary', protect, roleRequired(['admin','superadmin']), getBooksStats);

// @desc    Obtener copias de un libro
// @route   GET /api/books/:id/copies
// @access  Private
router.get('/:id/copies', protect, roleRequired(['admin', 'superadmin']), getBookCopies);

// @desc    Agregar copias a un libro
// @route   POST /api/books/:id/copies
// @access  Private
router.post('/:id/copies', protect, roleRequired(['admin', 'superadmin']), addBookCopies);

// @desc    Actualizar una copia
// @route   PUT /api/books/copies/:copyId
// @access  Private
router.put('/copies/:copyId', protect, roleRequired(['admin', 'superadmin']), updateBookCopy);

// @desc    Eliminar una copia
// @route   DELETE /api/books/copies/:copyId
// @access  Private
router.delete('/copies/:copyId', protect, roleRequired(['admin', 'superadmin']), deleteBookCopy);

module.exports = router;