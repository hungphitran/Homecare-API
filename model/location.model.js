const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    province: String, 
    districts: {
        type: Array,
        default: []
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Location = mongoose.model("Location", locationSchema, "locations");

module.exports = Location;