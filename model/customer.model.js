const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    email: String,
    password: String,
    points: [
        {
            point: Number,
            updateDate: Date
        }
    ],
    addresses: [
        {
            province: String,
            ward: String,
            detailAddress: String
        }
    ]
}, {
    timestamps: true
});

const Customer = mongoose.model("Customer", CustomerSchema, "customers");

module.exports = Customer;