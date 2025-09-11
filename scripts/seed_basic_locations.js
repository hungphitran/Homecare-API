const mongoose = require('mongoose');
const Location = require('../model/location.model');
require('dotenv').config();

// Basic location data for testing
const basicLocations = [
    {
        name: "Hà Nội",
        status: "active",
        wards: [
            { name: "Ba Đình" },
            { name: "Hoàn Kiếm" },
            { name: "Cầu Giấy" },
            { name: "Đống Đa" },
            { name: "Thanh Xuân" }
        ]
    },
    {
        name: "Hồ Chí Minh",
        status: "active", 
        wards: [
            { name: "Quận 1" },
            { name: "Quận 3" },
            { name: "Quận 7" },
            { name: "Bình Thạnh" },
            { name: "Tân Bình" }
        ]
    },
    {
        name: "Đà Nẵng",
        status: "active",
        wards: [
            { name: "Hải Châu" },
            { name: "Thanh Khê" },
            { name: "Sơn Trà" }
        ]
    }
];

async function seedBasicLocations() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('✅ Connected to MongoDB');

        console.log('Starting to seed basic locations...');
        
        for (const locationData of basicLocations) {
            const existingLocation = await Location.findOne({ name: locationData.name });
            
            if (existingLocation) {
                console.log(`⚠️  Location "${locationData.name}" already exists`);
                continue;
            }

            const newLocation = new Location(locationData);
            await newLocation.save();
            console.log(`✅ Created location: ${locationData.name} with ${locationData.wards.length} wards`);
        }

        console.log('🎉 Seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding locations:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the seeding
seedBasicLocations();
