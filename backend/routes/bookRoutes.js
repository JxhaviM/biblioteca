// backend/routes/bookRoutes.jsk
const express = require('express');
const {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    createBulkBooks
} = require('../controllers/bookController');
const { protect } = require('../middlewares/authmiddleware'); // Importar el middleware de protección

const router = express.Router();

// Rutas públicas (no necesitan token)
router.get('/', getBooks);
router.get('/:id', getBookById);

// Rutas protegidas (necesitan token)
router.post('/', protect, createBook); // Solo usuarios autenticados pueden crear
router.put('/:id', protect, updateBook); // Solo usuarios autenticados pueden actualizar
router.delete('/:id', protect, deleteBook);
router.post('/import', protect, createBulkBooks); // Solo usuarios autenticados pueden eliminar

module.exports = router;