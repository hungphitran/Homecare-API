const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    orderDate: {
        type:Date,
        default:Date.now()
    },
    startDate: Date,
    endDate: Date,
    startTime: Date,
    endTime: Date,
    staff_id: String,
    helper_id: String,
    comment: {
        review: String,
        loseThings: Boolean,
        breakThings: Boolean
    },
    customerInfo: {
        fullName: String,
        phone: String,
        address: String
    },
    customer_id:String,
    requestType: String,
    service_id: String,
    negotiationCosts: String,
    status:{
        type:String,
        default:"notDone"
    },
    location: {
        province: String,
        district: String
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