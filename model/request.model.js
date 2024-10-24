const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    orderDate: {
        type: Date,
        default: Date.now()
    },
    scheduleIds: {
        type: Array,
        default: []
    },
    startTime: Date,
    endTime: Date,
    comment: {
        review: String,
        loseThings: Boolean,
        breakThings: Boolean
    },
    customerInfo: {
        fullName: String,
        phone: String,
        address: String,
        usedPoint: Number
    },
    requestType: String,
    service: {
        title: String, // Tên dịch vụ
        coefficient_service: Number, // Hệ số dịch vụ,
        coefficient_other: Number, // Hệ số khác (ngoài giờ, cuối tuần, ...),
        cost: Number // Số tiền phải trả cho dịch vụ đó trên 1 giờ
    },
    totalCost: Number,
    profit: Number,
    status: {
        type: String,
        default: "notDone"
    },
    location: {
        province: String,
        district: String,
        ward: String
    },
    deleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        account_id: String,
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    updatedBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ],
    deletedBy: {
        account_id: String,
        deletedAt: Date
    }
}, {
    timestamps: true
});

const Request = mongoose.model("Request", requestSchema, "requests");

module.exports = Request;