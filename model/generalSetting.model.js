const mongoose = require("mongoose");

const GeneralSettingSchema = new mongoose.Schema({
    id: {
        type: String,
        default: "generalSetting"
    }, // Có tác dụng làm tham chiếu khi truy xuất, ngoài ra không còn tác dụng khác
    baseSalary: Number,
    openHour: String, // Thời gian mở cửa
    closeHour: String, //Thời gian đóng cửa
    officeStartTime: String, // Giờ bắt đầu hành chính
    officeEndTime: String, // Giờ kết thúc hành chính
    companyName: String,
    companyEmail: String,
    companyAddress: String,
    companyPhone: String,
    holidayStartDate: Date,
    holidayEndDate: Date
}, {
    timestamps: true
});

const GeneralSetting = mongoose.model("GeneralSetting", GeneralSettingSchema, "generalSettings");

module.exports = GeneralSetting;