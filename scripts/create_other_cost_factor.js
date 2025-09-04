const mongoose = require('mongoose');
const CostFactorType = require('../model/costFactorType.model');
require('dotenv').config();

async function createOtherCostFactor() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('Connected to MongoDB');

        // Check if a record with applyTo: "other" already exists
        const existingRecord = await CostFactorType.findOne({ applyTo: "other" });
        
        if (existingRecord) {
            console.log('Record with applyTo: "other" already exists:');
            console.log(JSON.stringify(existingRecord, null, 2));
            return;
        }

        // Create new cost factor record with applyTo: "other"
        const newCostFactor = new CostFactorType({
            title: "Other Cost Factors",
            description: "Cost factors for overtime, weekend, and holiday calculations",
            coefficientList: [
                {
                    title: "Overtime Coefficient",
                    description: "Coefficient for overtime hours (HSovertime)",
                    value: 1.5,
                    status: "active",
                    deleted: false
                },
                {
                    title: "Weekend Coefficient", 
                    description: "Coefficient for weekend work (HScuoituan)",
                    value: 2.0,
                    status: "active",
                    deleted: false
                },
                {
                    title: "Holiday Coefficient",
                    description: "Coefficient for holiday work (HSle)",
                    value: 2.5,
                    status: "active", 
                    deleted: false
                }
            ],
            applyTo: "other",
            status: "active",
            deleted: false,
            createdBy: {
                account_id: "system",
                createdAt: new Date()
            }
        });

        const savedRecord = await newCostFactor.save();
        console.log('Successfully created cost factor record with applyTo: "other":');
        console.log(JSON.stringify(savedRecord, null, 2));

    } catch (error) {
        console.error('Error creating cost factor record:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
createOtherCostFactor();
