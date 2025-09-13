const mongoose = require('mongoose');
const Location = require('../model/location.model');
require('dotenv').config();

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB', mongoose.connection.name);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Xóa tất cả locations
const clearLocations = async () => {
    try {
        const result = await Location.deleteMany({});
        console.log(`✅ Đã xóa ${result.deletedCount} locations`);
    } catch (error) {
        console.error('❌ Lỗi khi xóa locations:', error);
    }
};

// Dữ liệu mẫu locations
const sampleLocations = [
    {
        name: "Hà Nội",
        status: "active",
        wards: [
            { name: "Phường Cầu Dền" },
            { name: "Phường Ngọc Khánh" },
            { name: "Phường Phúc Xá" },
            { name: "Phường Trúc Bạch" },
            { name: "Phường Vĩnh Phúc" },
            { name: "Phường Cống Vị" },
            { name: "Phường Liễu Giai" },
            { name: "Phường Nguyễn Trung Trực" },
            { name: "Phường Quán Thánh" },
            { name: "Phường Thành Công" },
            { name: "Phường Đội Cấn" },
            { name: "Phường Ngọc Hà" },
            { name: "Phường Kim Mã" },
            { name: "Phường Giảng Võ" },
            { name: "Phường Cát Linh" }
        ]
    },
    {
        name: "Hồ Chí Minh",
        status: "active",
        wards: [
            { name: "Phường Bến Nghé" },
            { name: "Phường Bến Thành" },
            { name: "Phường Cầu Kho" },
            { name: "Phường Cầu Ông Lãnh" },
            { name: "Phường Cô Giang" },
            { name: "Phường Đa Kao" },
            { name: "Phường Nguyễn Cư Trinh" },
            { name: "Phường Nguyễn Thái Bình" },
            { name: "Phường Phạm Ngũ Lão" },
            { name: "Phường Tân Định" },
            { name: "Phường 1" },
            { name: "Phường 2" },
            { name: "Phường 3" },
            { name: "Phường 4" },
            { name: "Phường 5" }
        ]
    },
    {
        name: "Đà Nẵng",
        status: "active",
        wards: [
            { name: "Phường Thanh Bình" },
            { name: "Phường Thuận Phước" },
            { name: "Phường Thạch Thang" },
            { name: "Phường Hải Châu I" },
            { name: "Phường Hải Châu II" },
            { name: "Phường Phước Ninh" },
            { name: "Phường Hòa Thuận Tây" },
            { name: "Phường Hòa Thuận Đông" },
            { name: "Phường Tam Thuận" },
            { name: "Phường Thanh Khê Tây" },
            { name: "Phường Thanh Khê Đông" },
            { name: "Phường Xuân Hà" },
            { name: "Phường Tân Chính" },
            { name: "Phường Chính Gián" },
            { name: "Phường Vĩnh Trung" }
        ]
    },
    {
        name: "Hải Phòng",
        status: "active",
        wards: [
            { name: "Phường Máy Chai" },
            { name: "Phường Máy Tơ" },
            { name: "Phường Ngọc Xuyên" },
            { name: "Phường Cầu Tre" },
            { name: "Phường Cầu Đất" },
            { name: "Phường Niệm Nghĩa" },
            { name: "Phường Nghĩa Xá" },
            { name: "Phường Dư Hàng" },
            { name: "Phường Lạch Tray" },
            { name: "Phường Đông Khê" }
        ]
    },
    {
        name: "Cần Thơ",
        status: "active",
        wards: [
            { name: "Phường Tân An" },
            { name: "Phường An Phú" },
            { name: "Phường Tân Phong" },
            { name: "Phường Cái Khế" },
            { name: "Phường An Cư" },
            { name: "Phường Hưng Lợi" },
            { name: "Phường An Hòa" },
            { name: "Phường Thới Bình" },
            { name: "Phường An Khánh" },
            { name: "Phường An Bình" }
        ]
    }
];

// Tạo dữ liệu mẫu locations
const seedLocations = async () => {
    try {
        const createdLocations = await Location.insertMany(sampleLocations);
        console.log(`✅ Đã tạo ${createdLocations.length} locations với tổng cộng ${sampleLocations.reduce((total, loc) => total + loc.wards.length, 0)} wards`);
        
        // In ra thông tin chi tiết
        createdLocations.forEach(location => {
            console.log(`📍 ${location.name}: ${location.wards.length} wards`);
        });
    } catch (error) {
        console.error('❌ Lỗi khi tạo locations:', error);
    }
};

// Hàm chính
const resetLocations = async () => {
    console.log('🚀 Bắt đầu reset dữ liệu locations...\n');
    
    await connectDB();
    
    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await clearLocations();
    
    console.log('\n📝 Đang tạo dữ liệu mẫu...');
    await seedLocations();
    
    console.log('\n✨ Hoàn thành reset dữ liệu locations!');
    
    // Đóng kết nối
    mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
};

// Chạy script
if (require.main === module) {
    resetLocations().catch(error => {
        console.error('❌ Lỗi chung:', error);
        process.exit(1);
    });
}

module.exports = { resetLocations, clearLocations, seedLocations };