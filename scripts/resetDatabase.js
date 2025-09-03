require('dotenv').config();
const mongoose = require('mongoose');

// Import the clear and seed functions
const clearAllData = require('./clearAllData');
const seedDatabase = require('./seedDatabase');

async function resetDatabase() {
    try {
        console.log('🚀 Starting database reset process...\n');
        
        // Step 1: Clear all data
        console.log('STEP 1: Clearing all existing data...');
        await clearAllData();
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Step 2: Seed new data
        console.log('STEP 2: Seeding new data...');
        await seedDatabase();
        
        console.log('\n🎊 Database reset completed successfully!');
        console.log('Your database is now ready with fresh sample data.');
        
    } catch (error) {
        console.error('❌ Error during database reset:', error);
    }
}

// Run the reset function if this file is executed directly
if (require.main === module) {
    resetDatabase();
}

module.exports = resetDatabase;
