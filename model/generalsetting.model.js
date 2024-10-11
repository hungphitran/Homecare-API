const mongoose = require("mongoose");

const GeneralSettingSchema = new mongoose.Schema({
    id: {
        type: String,
        default: "generalSetting"
    }, // Có tác dụng làm tham chiếu khi truy xuất, ngoài ra không còn tác dụng khác
    baseSalary: Number,
    openHour: Number, // Thời gian mở cửa, lưu đơn vị phút
    closeHour: Number, //Thời gian đóng cửa, lưu đơn vị phút
    officeStartTime: Number, // Giờ bắt đầu hành chính, lưu đơn vị phút
    officeEndTime: Number // Giờ kết thúc hành chính, lưu đơn vị phút
}, {
    timestamps: true
});

const GeneralSetting = mongoose.model("GeneralSetting", GeneralSettingSchema, "generalSettings");

module.exports = GeneralSetting;