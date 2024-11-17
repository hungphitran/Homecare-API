const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
    title: String,
    description: String,
    url: String,
    img: String,
    content: String,
    author: String,
    type: String, // Quảng cáo, Thông báo chính sách,...
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

const Blog = mongoose.model("Blog", BlogSchema, "blogs");

module.exports = Blog;