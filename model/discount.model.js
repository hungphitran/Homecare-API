const mongoose = require("mongoose");

const DiscountSchema = new mongoose.Schema({
    title: String,
    description: String,
    usageLimit: Number,
    applyStartDate: Date,
    applyEndDate: Date,
    rate: Number,
    status: Boolean,
    deleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        account_id: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    updatedBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ],
    deletedAt: Date
}, {
    timestamps: true
});

const Discount = mongoose.model("Discount", DiscountSchema, "discounts");

module.exports = Discount;