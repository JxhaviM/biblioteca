const mongoose = require('mongoose');

const BulkJobSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  tipoPersona: { type: String, required: true },
  status: { type: String, enum: ['queued','processing','completed','finished_with_errors','failed'], default: 'queued' },
  totalRows: { type: Number, default: 0 },
  processed: { type: Number, default: 0 },
  inserted: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  errorFile: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BulkJob', BulkJobSchema);
