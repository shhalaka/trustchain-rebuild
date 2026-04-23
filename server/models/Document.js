const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  issuer: { type: String, required: true },
  fileName: { type: String, required: true },
  txHash: { type: String, required: true },
  proof: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

documentSchema.index({ documentId: 1 }, { unique: true });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);