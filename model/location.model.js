const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    Name: String,
    status: String,
    Districts: [
        {
            Name: String,
            Wards: [
                {
                    Name: String
                }
            ]
        }
    ]
}, {
    timestamps: true
});

const Location = mongoose.model("Location", locationSchema, "locations");

module.exports = Location;
