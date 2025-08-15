const mongoose = require('mongoose');

const DeviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
    phone: { type: String, required: false },
    token: { type: String, required: true, index: true, unique: true },
    platform: { type: String, enum: ['ios', 'android', 'web', 'unknown'], default: 'unknown' },
    topics: { type: [String], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeviceToken', DeviceTokenSchema);
