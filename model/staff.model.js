const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
    staff_id: String,
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
    offDateList: [
        {
            offDate: Date
        }
    ],
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

const staff = mongoose.model("Staff", staffSchema, "staffs");

module.exports = staff;