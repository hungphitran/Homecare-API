const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	phone : String,
    email: String,
	name: String,
    address:[
        {
            detailedAddress: String,
        }
    ],
    requests:[
        {requestId:String}
    ],
    updatedBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ]
}, {
    timestamps: true
});

const customer = mongoose.model("customer", customerSchema, "customers");

module.exports = customer;