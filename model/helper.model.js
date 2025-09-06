const mongoose = require("mongoose");

const helperSchema = new mongoose.Schema({
    helper_id: String,
    fullName: String,
    startDate: {
        type: Date,
        default: Date.now()
    },
    baseFactor: Number, // Hệ số lương cơ bản
    birthDate: Date,
    phone: String,
    birthPlace: String,
    address: String,
    // workingArea: {
    //     province: String,
    //     districts: {
    //         type: Array,
    //         default: []
    //     }
    // },  
    jobs: {
        type: Array,
        default: []
    }, 
    yearOfExperience: Number,
    experienceDescription: String,
    avatar: String,
    healthCertificates: {
        type: Array,
        default: []
    },
    gender: String,
    nationality: String,
    educationLevel: String,
    height: Number,
    weight: Number,
    workingStatus: String, // offline, online, working
    status: String, // active, inactive
    password: String,
    deleted: {
        type: Boolean,
        default: false
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
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

const Helper = mongoose.model("Helper", helperSchema, "helpers");

module.exports = Helper;