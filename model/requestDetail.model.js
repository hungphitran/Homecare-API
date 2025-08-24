const mongoose = require("mongoose");

const requestDetailSchema = new mongoose.Schema({
    workingDate: Date,
    startTime: Date, // Giờ bắt đầu làm việc
    endTime: Date, // Giờ kết thúc làm việc
    helper_id: String,
    cost: Number, // Tổng tiền đơn nhỏ
    comment: {
        review: { type: String, default: '' },
        loseThings: { type: Boolean, default: false },
        breakThings: { type: Boolean, default: false }
    },
    status: String, // notDone - assigned - processing - done - cancelled
    helper_cost: Number
}, {
    timestamps: true
});

const RequestDetail = mongoose.model("RequestDetail", requestDetailSchema, "requestDetails");

module.exports = RequestDetail;
