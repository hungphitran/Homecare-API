const mongoose = require("mongoose");
const requestSchema = new mongoose.Schema({
    orderDate: {
        type: Date,
        default: Date.now()
    },
    schedule:{
        startTime: Date,
        endTime: Date,
        dates:[
            {   
                date: Date,
                helper_id:String
            }
        ]
    },
    
    staff_id: String,
    comment: {
        review: String,
        loseThings: Boolean,
        breakThings: Boolean
    },
    customer_id: String,
    customerInfo: {
        fullName: String,
        phone: String,
        address: String
    },
    requestType: String,
    service_id: String,
    negotiationCosts: {
        type: Number,
        default: 0
    }, // Giá thỏa thuận
    status: {
        type: String,
        default: "notDone"
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