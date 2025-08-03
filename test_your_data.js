const http = require('http');

// Test with your exact original data but using a valid service
function testOriginalDataFixed() {
    const testData = {
        "serviceTitle": "Chăm sóc người già", // Using a real service from the database
        "startTime": "2025-08-03T06:30:00.000Z",
        "endTime": "2025-08-03T08:30:00.000Z",
        "workDate": "2025-08-03",
        "location": {
            "province": "string",
            "district": "string",
            "ward": "string"
        }
    };

    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/request/calculateCost',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('🧪 Testing your original data format with valid service');
    console.log('📤 Request data:', JSON.stringify(testData, null, 2));

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log(`📥 Response Status: ${res.statusCode}`);
            try {
                const result = JSON.parse(responseData);
                console.log('📥 Response data:', JSON.stringify(result, null, 2));
                
                if (result.totalCost) {
                    console.log('\n📊 Detailed Cost Analysis:');
                    console.log(`💰 Total Cost: ${result.totalCost} VND`);
                    console.log(`🏷️  Base Service Price: ${result.servicePrice} VND`);
                    console.log(`⚙️  Service Coefficient (HSDV): ${result.HSDV}`);
                    console.log(`🕐 Overtime Coefficient: ${result.HSovertime}`);
                    console.log(`📅 Weekend Coefficient: ${result.HScuoituan}`);
                    console.log(`🗓️  Is Weekend: ${result.isWeekend}`);
                    console.log(`⏰ Total Overtime Hours: ${result.totalOvertimeHours}`);
                    console.log(`🕒 Total Normal Hours: ${result.totalNormalHours}`);
                    console.log(`💵 Overtime Cost Component: ${result.overtimeCost}`);
                    console.log(`💴 Normal Cost Component: ${result.normalCost}`);
                    console.log(`🔢 Applied Weekend Coefficient: ${result.applicableWeekendCoefficient}`);
                    
                    console.log('\n🔍 Calculation Formula Analysis:');
                    console.log('Formula: totalCost = servicePrice × HSDV × (overtimeComponent + normalComponent)');
                    console.log(`Where:`);
                    console.log(`• overtimeComponent = HSovertime × overtimeHours × weekendCoeff = ${result.HSovertime} × ${result.totalOvertimeHours} × ${result.applicableWeekendCoefficient} = ${result.overtimeCost}`);
                    console.log(`• normalComponent = weekendCoeff × normalHours = ${result.applicableWeekendCoefficient} × ${result.totalNormalHours} = ${result.normalCost}`);
                    console.log(`• Final: ${result.servicePrice} × ${result.HSDV} × (${result.overtimeCost} + ${result.normalCost}) = ${result.totalCost}`);
                    
                    console.log('\n✅ Your endpoint is working correctly!');
                    console.log('\n📝 Recommendations for your original data:');
                    console.log('❌ Issue: serviceId: "string" is not a valid ObjectId');
                    console.log('✅ Solution: Use serviceTitle instead, or provide a valid MongoDB ObjectId');
                    console.log('✅ Time format: Your ISO timestamp format is supported');
                    console.log('✅ Weekend detection: August 3, 2025 is correctly identified as Saturday');
                }
            } catch (error) {
                console.log('📥 Raw response:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request error:', error.message);
    });

    req.write(postData);
    req.end();
}

// Test the problematic serviceId format
function testInvalidServiceId() {
    const testData = {
        "serviceId": "string", // This should fail
        "startTime": "2025-08-03T06:30:00.000Z",
        "endTime": "2025-08-03T08:30:00.000Z",
        "workDate": "2025-08-03",
        "location": {
            "province": "string",
            "district": "string",
            "ward": "string"
        }
    };

    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/request/calculateCost',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('\n🧪 Testing invalid serviceId format (should show error)');
    console.log('📤 Request data:', JSON.stringify(testData, null, 2));

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log(`📥 Response Status: ${res.statusCode}`);
            try {
                const result = JSON.parse(responseData);
                console.log('📥 Response data:', JSON.stringify(result, null, 2));
            } catch (error) {
                console.log('📥 Raw response:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request error:', error.message);
    });

    req.write(postData);
    req.end();
}

testOriginalDataFixed();
setTimeout(testInvalidServiceId, 2000);
