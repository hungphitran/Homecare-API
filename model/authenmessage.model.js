const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    phone:String,
    otp:Number,
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});


// setting time limit for data (expired after 15 minutes)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const message = mongoose.model("message", messageSchema, "messages");

module.exports = message;