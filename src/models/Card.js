const mongoose = require('mongoose');
const crypto = require('crypto');

function generateCardId() {
  return crypto.randomBytes(6).toString('hex'); // 12-char hex ID
}

const cardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardId: { type: String, unique: true, default: generateCardId },

    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },

    website: { type: String, trim: true },
    socialLinks: { type: [String], default: [] },

    profileImage: { type: String, trim: true }, // S3 URL

    backgroundColor: { type: String, trim: true },
    textColor: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    scanCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
cardSchema.index({ userId: 1 });

module.exports = mongoose.model('Card', cardSchema);