const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    date:String,
    title:String,
    description:String,
    url:String,
    img:String,
    deleted:{
        type:Boolean,
        default:false
    },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});



const Blog = mongoose.model("blog", blogSchema, "blogs");

module.exports = Blog;