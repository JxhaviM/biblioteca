const express = require('express');
const { protect } = require('../middlewares/authmiddleware');
const { createPqr, listPqrs, getPqrById, updatePqr } = require('../controllers/pqrController');

const router = express.Router();

// Crear PQR (publica)
router.post('/', createPqr);

// Rutas protegidas para gestión
router.get('/', protect, listPqrs);
router.get('/:id', protect, getPqrById);
router.patch('/:id', protect, updatePqr);

module.exports = router;
