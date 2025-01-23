const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    title: String,
    basicPrice: Number,
    coefficient_id: String, // Id của hệ số
    description: String,
    status: String,
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

const Service = mongoose.model("Service", serviceSchema, "services");

module.exports = Service;