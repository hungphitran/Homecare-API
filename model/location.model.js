const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: String,
    status: String,
    wards: [
        {
            name: String,
        }
    ]
}, {
    timestamps: true
});

const Location = mongoose.model("Location", locationSchema, "locations");

module.exports = Location;
