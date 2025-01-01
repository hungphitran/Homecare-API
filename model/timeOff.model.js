const mongoose = require("mongoose");

const TimeOffSchema = new mongoose.Schema({
    helper_id: String,
    dateOff: Date, // Ngày nghỉ
    startTime: Number, // Giờ bắt đầu (phút)
    endTime: Number, // Giờ kết thúc (phút)
    reason: String,
    status: String, // Trạng thái (approved, rejected, done)
    createdBy: {
        account_id: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    deletedAt: Date
}, {
    timestamps: true
});

const TimeOff = mongoose.model("TimeOff", TimeOffSchema, "timeOffs");

module.exports = TimeOff;