const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    orderDate : Date,
	startDate : Date,
	endDate : Date,
	fee : Number,
	handler : String,
    customerInfor:{
	   phone : String,
       email: String,
	   name: String,
    },
	detailedAddress:String,
	type : String,
	status : String,
    province:String,
	service: String,
	district: String,
    startTime: Date,
    endTime:Date,
    helperId: String,
    overTimeFee:Number,
    
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

const request = mongoose.model("request", requestSchema, "requests");

module.exports = request;