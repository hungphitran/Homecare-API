const mongoose = require("mongoose");

const helperSchema = new mongoose.Schema({
    helper_id: String,
    fullName: String,
    startDate: {
        type: Date,
        default: Date.now()
    },
    birthDate: Date,
    phone: String,
    birthPlace: String,
    address: String,
    workingArea: {
        province: String,
        districts: [
            {
                district: String
            }
        ]
    },
    jobs: [
        {
            jobName: String
        }
    ],
    yearOfExperience: Number,
    experienceDescription: String,
    avatar: String,
    healthCertificates: [
        {
            healthCertificate: String
        }
    ],
    salary_id: String,
    gender: String,
    nationality: String,
    educationLevel: String,
    height: Number,
    weight: Number,
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

const Helper = mongoose.model("Helper", helperSchema, "helpers");

module.exports = Helper;