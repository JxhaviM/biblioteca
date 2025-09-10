const mongoose = require('mongoose');

const ActionSchema = new mongoose.Schema({
  action: { type: String, required: true },
  by: { type: String },
  note: { type: String },
  date: { type: Date, default: Date.now }
}, { _id: false });

const PqrSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['peticion', 'queja', 'reclamo', 'observacion', 'incidencia'],
    required: true
  },
  origin: { type: String, enum: ['in-app', 'public-site'], default: 'public-site' },
  status: { type: String, enum: ['pendiente', 'en_curso', 'resuelto', 'rechazado'], default: 'pendiente' },
  requester: {
    name: { type: String },
    idType: { type: String },
    idNumber: { type: String },
    email: { type: String },
    phone: { type: String },
    anon: { type: Boolean, default: false }
  },
  module: { type: String },
  urlContext: { type: String },
  description: { type: String, required: true, minlength: 10, maxlength: 4000 },
  desiredOutcome: { type: String },
  priority: { type: String, enum: ['baja', 'media', 'alta'], default: 'media' },
  attachments: [{ type: String }], // URLs or storage keys
  assignedTo: { type: String },
  actionsHistory: { type: [ActionSchema], default: [] },
  slaTargetHours: { type: Number },
  consentDataProcessing: { type: Boolean, default: false },
  
  // Soft Delete
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Índices para soft delete
PqrSchema.index({ isActive: 1 });
PqrSchema.index({ isActive: 1, status: 1 });

// Métodos para soft delete
PqrSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

PqrSchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

PqrSchema.methods.restore = function() {
  this.isActive = true;
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Pqr', PqrSchema);
