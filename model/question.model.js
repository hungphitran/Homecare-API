const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    question:String,
    answer: String,
    date: {
        type: Date,
        default: Date.now
    },
    status: String,
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

const Question = mongoose.model("Question", QuestionSchema, "questions");

module.exports = Question;