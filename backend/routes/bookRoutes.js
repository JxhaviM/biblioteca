const express = require('express');
const router = express.Router();
const {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    searchBooks,
    getBookAvailability,
    createBulkBooks
} = require('../controllers/bookController');

// Middleware de autenticación (comentado por ahora, se puede activar después)
// const { protect } = require('../middlewares/authMiddleware');

// @desc    Búsqueda avanzada de libros
// @route   GET /api/books/search
// @query   ?search=titulo&genre=ficcion&author=autor&publishedYear=2020&available=true&page=1&limit=20
// @access  Public
router.get('/search', searchBooks);

// @desc    Crear múltiples libros (importación masiva)
// @route   POST /api/books/bulk
// @body    [{ title, author, isbn, genre, publishedYear, location, initialCopies }, ...]
// @access  Private
router.post('/bulk', createBulkBooks);

// @desc    Obtener disponibilidad específica de un libro
// @route   GET /api/books/:id/availability
// @access  Public
router.get('/:id/availability', getBookAvailability);

// @desc    Obtener todos los libros con información de disponibilidad
// @route   GET /api/books
// @query   ?page=1&limit=50&search=titulo&genre=ficcion&isActive=true
// @access  Public
router.get('/', getBooks);

// @desc    Obtener un libro por ID con detalles de copias
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', getBookById);

// @desc    Crear un nuevo libro
// @route   POST /api/books
// @body    { title, author, isbn, genre, publishedYear, location, description, language, publisher, pages, initialCopies }
// @access  Private
router.post('/', createBook);

// @desc    Actualizar un libro
// @route   PUT /api/books/:id
// @body    { title, author, isbn, genre, publishedYear, location, description, language, publisher, pages }
// @access  Private
router.put('/:id', updateBook);

// @desc    Desactivar un libro (soft delete)
// @route   DELETE /api/books/:id
// @access  Private
router.delete('/:id', deleteBook);

module.exports = router;