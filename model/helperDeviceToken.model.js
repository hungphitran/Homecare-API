const mongoose = require('mongoose');

const HelperDeviceTokenSchema = new mongoose.Schema(
  {
    helper_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Helper', required: false },
    phone: { type: String, required: false }, // Số điện thoại helper
    token: { type: String, required: true, index: true, unique: true },
    platform: { type: String, enum: ['ios', 'android', 'web', 'unknown'], default: 'unknown' },
    topics: { type: [String], default: [] },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Tạo index compound để tối ưu truy vấn
HelperDeviceTokenSchema.index({ helper_id: 1 });
HelperDeviceTokenSchema.index({ phone: 1 });

module.exports = mongoose.model('HelperDeviceToken', HelperDeviceTokenSchema);