const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	phone : String,
	name: String,
    email: String,
    password: String,
    addresses:[
        {
            detailedAddress: String,
        }
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