const mongoose = require("mongoose");

const requestDetailSchema = new mongoose.Schema({
    workingDate: Date,
    helper_id: String,
    status: String, // notDone - processing - done
    helper_cost: Number
}, {
    timestamps: true
});

const RequestDetail = mongoose.model("RequestDetail", requestDetailSchema, "requestDetails");

module.exports = RequestDetail;