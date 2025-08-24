const mongoose = require('mongoose');

const costFactorTypeSchema = new mongoose.Schema({
    title: String,
    description: String,
    coefficientList: [
        {
            title: String,
            description: String,
            value: Number,
            deleted: {
                type: Boolean,
                default: false
            },
            status: String
        }
    ],
    applyTo: String,
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

const CostFactorType = mongoose.model("CostFactorType", costFactorTypeSchema, "costFactorTypes");

module.exports = CostFactorType;
