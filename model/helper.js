const mongoose = require("mongoose");

const HelperSchema = new mongoose.Schema({
    Helper_id: String,
    fullName: String, 
    password: String,
    birthDate: Date,
    startDate: {
        type: Date,
        default: Date.now()
    },
    phone: String,
    email: String,
    birthPlace: String,
    avatar: String,
    salary: Number,
    role_id: String,
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

const Helper = mongoose.model("Helper", HelperSchema, "Helpers");

module.exports = Helper;