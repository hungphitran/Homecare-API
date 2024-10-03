const mongoose = require('mongoose');

const costFactorSchema = new mongoose.Schema({
    title: String,
    description: String,
    coefficient: Number, //He so luong
    status: String,
    coefficientType_id:String,
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

const CostFactor = mongoose.model("CostFactor", costFactorSchema, "costFactors");

module.exports = CostFactor;