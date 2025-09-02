const Pqr = require('../models/pqr');

// Crear una nueva PQR (pública o autenticada)
const createPqr = async (req, res) => {
  try {
    const payload = req.body;

    // Si existe usuario en req (protegido) y no viene requester, autopoblar
    if (req.user && (!payload.requester || Object.keys(payload.requester).length === 0)) {
      payload.requester = {
        name: req.user.username || '',
        email: req.user.email || ''
      };
      payload.origin = payload.origin || 'in-app';
    }

    const pqr = await Pqr.create(payload);
    return res.status(201).json(pqr);
  } catch (error) {
    console.error('createPqr error', error);
    return res.status(500).json({ message: 'Error al crear PQR', error: error.message });
  }
};

// Listar PQRs con filtros simples
const listPqrs = async (req, res) => {
  try {
    const { status, type, origin, module } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (origin) filter.origin = origin;
    if (module) filter.module = module;

    const pqrs = await Pqr.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json(pqrs);
  } catch (error) {
    console.error('listPqrs error', error);
    return res.status(500).json({ message: 'Error al listar PQRs', error: error.message });
  }
};

// Obtener PQR por id
const getPqrById = async (req, res) => {
  try {
    const pqr = await Pqr.findById(req.params.id);
    if (!pqr) return res.status(404).json({ message: 'PQR no encontrada' });
    return res.json(pqr);
  } catch (error) {
    console.error('getPqrById error', error);
    return res.status(500).json({ message: 'Error al obtener PQR', error: error.message });
  }
};

// Actualizar campos básicos (estado, assignedTo, notas)
const updatePqr = async (req, res) => {
  try {
    const pqr = await Pqr.findById(req.params.id);
    if (!pqr) return res.status(404).json({ message: 'PQR no encontrada' });

    const updatable = ['status', 'assignedTo', 'priority', 'desiredOutcome'];
    updatable.forEach((f) => {
      if (req.body[f] !== undefined) pqr[f] = req.body[f];
    });

    // Si envían una acción (comentario), agregar al historial
    if (req.body.action) {
      pqr.actionsHistory.push({ action: req.body.action, by: req.user ? req.user.username : 'system', note: req.body.note || '' });
    }

    await pqr.save();
    return res.json(pqr);
  } catch (error) {
    console.error('updatePqr error', error);
    return res.status(500).json({ message: 'Error al actualizar PQR', error: error.message });
  }
};

module.exports = { createPqr, listPqrs, getPqrById, updatePqr };
