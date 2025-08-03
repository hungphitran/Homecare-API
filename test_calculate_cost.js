const axios = require('axios');

// Test scenarios
const testScenarios = [
    {
        name: "Invalid serviceId format",
        data: {
            "serviceId": "string", // Invalid ObjectId format
            "startTime": "2025-08-03T06:30:00.000Z",
            "endTime": "2025-08-03T08:30:00.000Z",
            "workDate": "2025-08-03",
            "location": {
                "province": "string",
                "district": "string",
                "ward": "string"
            }
        },
        expectedError: true
    },
    {
        name: "With serviceTitle (recommended)",
        data: {
            "serviceTitle": "Chăm sóc người già", // Update with actual service title from your database
            "startTime": "2025-08-03T06:30:00.000Z", 
            "endTime": "2025-08-03T08:30:00.000Z",
            "workDate": "2025-08-03",
            "location": {
                "province": "string",
                "district": "string",
                "ward": "string"
            }
        },
        expectedError: false
    },
    {
        name: "Direct time format",
        data: {
            "serviceTitle": "Chăm sóc người già",
            "startTime": "06:30",
            "endTime": "08:30", 
            "workDate": "2025-08-03",
            "location": {
                "province": "Hồ Chí Minh",
                "district": "Quận 1",
                "ward": "Phường Bến Nghé"
            }
        },
        expectedError: false
    },
    {
        name: "Weekend calculation",
        data: {
            "serviceTitle": "Chăm sóc người già",
            "startTime": "2025-08-02T06:30:00.000Z", // Saturday
            "endTime": "2025-08-02T08:30:00.000Z",
            "workDate": "2025-08-02",
            "location": {
                "province": "Hồ Chí Minh",
                "district": "Quận 1", 
                "ward": "Phường Bến Nghé"
            }
        },
        expectedError: false
    },
    {
        name: "Missing required parameters",
        data: {
            "startTime": "2025-08-03T06:30:00.000Z",
            "endTime": "2025-08-03T08:30:00.000Z",
            // Missing serviceTitle/serviceId and workDate
            "location": {
                "province": "string",
                "district": "string",
                "ward": "string"
            }
        },
        expectedError: true
    }
];

async function testCalculateCost(scenario) {
    try {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        console.log('📤 Request data:', JSON.stringify(scenario.data, null, 2));
        
        // Update this URL based on your actual server configuration
        const baseURL = process.env.API_URL || 'http://localhost:3000';
        const response = await axios.post(`${baseURL}/api/request/calculateCost`, scenario.data);
        
        if (scenario.expectedError) {
            console.log('⚠️  Expected error but got success response:');
        } else {
            console.log('✅ Success Response:');
        }
        console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
        
        // Analyze the response structure
        if (response.data && typeof response.data === 'object') {
            console.log('\n📊 Cost Breakdown:');
            if (response.data.totalCost) console.log(`💰 Total Cost: ${response.data.totalCost}`);
            if (response.data.servicePrice) console.log(`🏷️  Service Price: ${response.data.servicePrice}`);
            if (response.data.HSDV) console.log(`⚙️  Service Factor (HSDV): ${response.data.HSDV}`);
            if (response.data.HSovertime) console.log(`🕐 Overtime Factor: ${response.data.HSovertime}`);
            if (response.data.HScuoituan) console.log(`📅 Weekend Factor: ${response.data.HScuoituan}`);
            if (response.data.isWeekend !== undefined) console.log(`🗓️  Is Weekend: ${response.data.isWeekend}`);
            if (response.data.totalOvertimeHours) console.log(`⏰ Overtime Hours: ${response.data.totalOvertimeHours}`);
            if (response.data.totalNormalHours) console.log(`🕒 Normal Hours: ${response.data.totalNormalHours}`);
            if (response.data.overtimeCost) console.log(`💵 Overtime Cost: ${response.data.overtimeCost}`);
            if (response.data.normalCost) console.log(`💴 Normal Cost: ${response.data.normalCost}`);
        }
        
    } catch (error) {
        if (scenario.expectedError) {
            console.log('✅ Expected error occurred:');
        } else {
            console.log('❌ Unexpected error occurred:');
        }
        
        if (error.response) {
            console.log(`📛 Status: ${error.response.status}`);
            console.log('📥 Error data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('📡 No response received. Is the server running?');
            console.log('💡 Try starting the server with: npm run dev');
        } else {
            console.log('⚠️  Error:', error.message);
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Cost Calculation Endpoint Tests');
    console.log('=' .repeat(50));
    
    for (const scenario of testScenarios) {
        await testCalculateCost(scenario);
        console.log('-'.repeat(50));
    }
    
    console.log('\n📋 Test Summary:');
    console.log('• Make sure to update serviceTitle with actual values from your database');
    console.log('• Ensure the server is running on the correct port');
    console.log('• Check database connection and required collections exist');
    console.log('\n💡 Tips:');
    console.log('• Use serviceTitle instead of serviceId for easier testing');
    console.log('• ISO timestamp format (with T and Z) is supported');
    console.log('• Direct time format (HH:mm) is also supported');
    console.log('• Weekend dates will apply weekend coefficients');
}

// Run all tests
runAllTests();
