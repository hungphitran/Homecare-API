const http = require('http');

// Test data based on user's request
const testData = {
    "serviceId": "string", // This will show the error for invalid ObjectId
    "startTime": "2025-08-03T06:30:00.000Z",
    "endTime": "2025-08-03T08:30:00.000Z",
    "workDate": "2025-08-03",
    "location": {
        "province": "string",
        "district": "string",
        "ward": "string"
    }
};

// Alternative test with serviceTitle
const testDataWithTitle = {
    "serviceTitle": "Chăm sóc người già", // You may need to update this with actual service title
    "startTime": "2025-08-03T06:30:00.000Z",
    "endTime": "2025-08-03T08:30:00.000Z",
    "workDate": "2025-08-03",
    "location": {
        "province": "Hồ Chí Minh",
        "district": "Quận 1",
        "ward": "Phường Bến Nghé"
    }
};

function makeRequest(data, testName) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/request/calculateCost',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log(`\n🧪 Testing: ${testName}`);
        console.log('📤 Request data:', JSON.stringify(data, null, 2));

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    console.log(`📥 Response Status: ${res.statusCode}`);
                    console.log('📥 Response data:', JSON.stringify(parsedData, null, 2));
                    
                    if (res.statusCode === 200 && parsedData.totalCost) {
                        console.log('\n📊 Cost Breakdown:');
                        console.log(`💰 Total Cost: ${parsedData.totalCost}`);
                        console.log(`🏷️  Service Price: ${parsedData.servicePrice}`);
                        console.log(`⚙️  Service Factor (HSDV): ${parsedData.HSDV}`);
                        console.log(`🕐 Overtime Factor: ${parsedData.HSovertime}`);
                        console.log(`📅 Weekend Factor: ${parsedData.HScuoituan}`);
                        console.log(`🗓️  Is Weekend: ${parsedData.isWeekend}`);
                        console.log(`⏰ Overtime Hours: ${parsedData.totalOvertimeHours}`);
                        console.log(`🕒 Normal Hours: ${parsedData.totalNormalHours}`);
                        console.log(`💵 Overtime Cost: ${parsedData.overtimeCost}`);
                        console.log(`💴 Normal Cost: ${parsedData.normalCost}`);
                    }
                    
                    resolve(parsedData);
                } catch (error) {
                    console.log('📥 Raw response:', responseData);
                    resolve(responseData);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Cost Calculation Endpoint Tests');
    console.log('=' .repeat(50));
    
    try {
        // Test 1: Invalid serviceId format
        await makeRequest(testData, "Invalid serviceId format (should show error)");
        console.log('-'.repeat(50));
        
        // Test 2: With serviceTitle
        await makeRequest(testDataWithTitle, "With serviceTitle (recommended approach)");
        console.log('-'.repeat(50));
        
        // Test 3: Direct time format
        const testDataDirectTime = {
            "serviceTitle": "Chăm sóc người già",
            "startTime": "06:30",
            "endTime": "08:30",
            "workDate": "2025-08-03",
            "location": {
                "province": "Hồ Chí Minh",
                "district": "Quận 1",
                "ward": "Phường Bến Nghé"
            }
        };
        await makeRequest(testDataDirectTime, "Direct time format (HH:mm)");
        console.log('-'.repeat(50));
        
        // Test 4: Weekend calculation
        const testDataWeekend = {
            "serviceTitle": "Chăm sóc người già",
            "startTime": "2025-08-02T06:30:00.000Z", // Saturday
            "endTime": "2025-08-02T08:30:00.000Z",
            "workDate": "2025-08-02",
            "location": {
                "province": "Hồ Chí Minh",
                "district": "Quận 1",
                "ward": "Phường Bến Nghé"
            }
        };
        await makeRequest(testDataWeekend, "Weekend calculation (Saturday)");
        console.log('-'.repeat(50));
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('✅ All tests completed');
    console.log('💡 Key points:');
    console.log('• serviceId "string" should return error (invalid ObjectId format)');
    console.log('• serviceTitle approach is recommended');
    console.log('• Both ISO timestamp and HH:mm formats are supported');
    console.log('• Weekend dates should apply weekend coefficients');
    console.log('• Make sure to update serviceTitle with actual values from your database');
}

// Run tests
runTests();
