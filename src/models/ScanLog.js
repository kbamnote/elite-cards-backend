const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    device: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
scanLogSchema.index({ cardId: 1 });
scanLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);