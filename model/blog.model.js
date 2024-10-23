const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
    title: String,
    description: String,
    url: String,
    img: String,
    content: String,
    author: String,
    date: {
        type: Date,
        default: Date.now()
    },
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