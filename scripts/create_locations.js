const mongoose = require('mongoose');
const Location = require('../model/location.model');
require('dotenv').config();

async function createLocations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('Connected to MongoDB');

        // Sample location data for Vietnam provinces/cities
        const locationData = [
            {
                name: "Hà Nội",
                status: "active",
                wards: [
                    { name: "Ba Đình" },
                    { name: "Hoàn Kiếm" },
                    { name: "Tây Hồ" },
                    { name: "Long Biên" },
                    { name: "Cầu Giấy" },
                    { name: "Đống Đa" },
                    { name: "Hai Bà Trưng" },
                    { name: "Hoàng Mai" },
                    { name: "Thanh Xuân" },
                    { name: "Sóc Sơn" },
                    { name: "Đông Anh" },
                    { name: "Gia Lâm" },
                    { name: "Nam Từ Liêm" },
                    { name: "Bắc Từ Liêm" }
                ]
            },
            {
                name: "Hồ Chí Minh",
                status: "active",
                wards: [
                    { name: "Quận 1" },
                    { name: "Quận 2" },
                    { name: "Quận 3" },
                    { name: "Quận 4" },
                    { name: "Quận 5" },
                    { name: "Quận 6" },
                    { name: "Quận 7" },
                    { name: "Quận 8" },
                    { name: "Quận 9" },
                    { name: "Quận 10" },
                    { name: "Quận 11" },
                    { name: "Quận 12" },
                    { name: "Bình Thạnh" },
                    { name: "Tân Bình" },
                    { name: "Tân Phú" },
                    { name: "Phú Nhuận" },
                    { name: "Gò Vấp" },
                    { name: "Bình Tân" },
                    { name: "Thủ Đức" }
                ]
            },
            {
                name: "Đà Nẵng",
                status: "active",
                wards: [
                    { name: "Hải Châu" },
                    { name: "Thanh Khê" },
                    { name: "Sơn Trà" },
                    { name: "Ngũ Hành Sơn" },
                    { name: "Liên Chiểu" },
                    { name: "Cẩm Lệ" },
                    { name: "Hòa Vang" },
                    { name: "Hoàng Sa" }
                ]
            },
            {
                name: "Hải Phòng",
                status: "active",
                wards: [
                    { name: "Hồng Bàng" },
                    { name: "Ngô Quyền" },
                    { name: "Lê Chân" },
                    { name: "Hải An" },
                    { name: "Kiến An" },
                    { name: "Đồ Sơn" },
                    { name: "Dương Kinh" },
                    { name: "Thuỷ Nguyên" },
                    { name: "An Dương" },
                    { name: "An Lão" },
                    { name: "Kiến Thuỵ" },
                    { name: "Tiên Lãng" },
                    { name: "Vĩnh Bảo" },
                    { name: "Cát Hải" },
                    { name: "Bạch Long Vĩ" }
                ]
            },
            {
                name: "Cần Thơ",
                status: "active",
                wards: [
                    { name: "Ninh Kiều" },
                    { name: "Ô Môn" },
                    { name: "Bình Thuỷ" },
                    { name: "Cái Răng" },
                    { name: "Thốt Nốt" },
                    { name: "Vĩnh Thạnh" },
                    { name: "Cờ Đỏ" },
                    { name: "Phong Điền" },
                    { name: "Thới Lai" }
                ]
            },
            {
                name: "Bắc Giang",
                status: "active",
                wards: [
                    { name: "Thành phố Bắc Giang" },
                    { name: "Yên Thế" },
                    { name: "Tân Yên" },
                    { name: "Việt Yên" },
                    { name: "Hiệp Hòa" },
                    { name: "Lạng Giang" },
                    { name: "Sơn Động" },
                    { name: "Lục Nam" },
                    { name: "Lục Ngạn" },
                    { name: "Yên Dũng" }
                ]
            },
            {
                name: "Bắc Kạn",
                status: "active",
                wards: [
                    { name: "Thành phố Bắc Kạn" },
                    { name: "Pác Nặm" },
                    { name: "Ba Bể" },
                    { name: "Ngân Sơn" },
                    { name: "Bạch Thông" },
                    { name: "Chợ Đồn" },
                    { name: "Chợ Mới" },
                    { name: "Na Rì" }
                ]
            },
            {
                name: "Bạc Liêu",
                status: "active",
                wards: [
                    { name: "Thành phố Bạc Liêu" },
                    { name: "Hồng Dân" },
                    { name: "Phước Long" },
                    { name: "Vĩnh Lợi" },
                    { name: "Giá Rai" },
                    { name: "Đông Hải" },
                    { name: "Hoà Bình" }
                ]
            }
        ];

        // Check for existing locations and create new ones
        let createdCount = 0;
        let skippedCount = 0;

        for (const locationItem of locationData) {
            // Check if location already exists
            const existingLocation = await Location.findOne({ name: locationItem.name });
            
            if (existingLocation) {
                console.log(`Location "${locationItem.name}" already exists, skipping...`);
                skippedCount++;
                continue;
            }

            // Create new location
            const newLocation = new Location(locationItem);
            const savedLocation = await newLocation.save();
            
            console.log(`Successfully created location: ${savedLocation.name} with ${savedLocation.wards.length} wards`);
            createdCount++;
        }

        console.log(`\nSummary:`);
        console.log(`- Created: ${createdCount} locations`);
        console.log(`- Skipped (already exists): ${skippedCount} locations`);
        console.log(`- Total processed: ${locationData.length} locations`);

    } catch (error) {
        console.error('Error creating locations:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

// Function to clear all locations (use with caution)
async function clearAllLocations() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('Connected to MongoDB');

        const result = await Location.deleteMany({});
        console.log(`Deleted ${result.deletedCount} locations`);

    } catch (error) {
        console.error('Error clearing locations:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Function to list all locations
async function listAllLocations() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('Connected to MongoDB');

        const locations = await Location.find({});
        console.log(`\nFound ${locations.length} locations:`);
        
        locations.forEach((location, index) => {
            console.log(`${index + 1}. ${location.name} (${location.status}) - ${location.wards.length} wards`);
        });

    } catch (error) {
        console.error('Error listing locations:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

// Check command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'create':
        createLocations();
        break;
    case 'clear':
        console.log('WARNING: This will delete all locations!');
        console.log('Type "yes" to confirm or any other key to cancel:');
        process.stdin.setEncoding('utf8');
        process.stdin.on('readable', () => {
            const chunk = process.stdin.read();
            if (chunk !== null) {
                if (chunk.trim().toLowerCase() === 'yes') {
                    clearAllLocations();
                } else {
                    console.log('Operation cancelled');
                    process.exit(0);
                }
            }
        });
        break;
    case 'list':
        listAllLocations();
        break;
    default:
        console.log('Usage:');
        console.log('  node create_locations.js create  - Create sample locations');
        console.log('  node create_locations.js list    - List all locations');
        console.log('  node create_locations.js clear   - Clear all locations (with confirmation)');
        break;
}
