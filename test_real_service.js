const http = require('http');

// Test to get all services first
function testGetServices() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/service',
        method: 'GET',
    };

    console.log('🔍 Getting all services from database...');

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log(`📥 Response Status: ${res.statusCode}`);
            try {
                const services = JSON.parse(responseData);
                console.log('📋 Available services:');
                if (Array.isArray(services)) {
                    services.forEach((service, index) => {
                        console.log(`${index + 1}. Title: "${service.title}", Price: ${service.basicPrice}, ID: ${service._id}`);
                    });
                    
                    // Test with the first service if available
                    if (services.length > 0) {
                        setTimeout(() => testWithRealService(services[0].title), 1000);
                    } else {
                        console.log('⚠️  No services found in database');
                    }
                } else {
                    console.log('📥 Response:', responseData);
                }
            } catch (error) {
                console.log('📥 Raw response:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Connection error:', error.message);
    });

    req.end();
}

function testWithRealService(serviceTitle) {
    const testData = {
        "serviceTitle": serviceTitle,
        "startTime": "2025-08-03T06:30:00.000Z",
        "endTime": "2025-08-03T08:30:00.000Z",
        "workDate": "2025-08-03",
        "location": {
            "province": "Hồ Chí Minh",
            "district": "Quận 1", 
            "ward": "Phường Bến Nghé"
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

    console.log(`\n🧪 Testing cost calculation with real service: "${serviceTitle}"`);
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
                    console.log('\n📊 Cost Breakdown:');
                    console.log(`💰 Total Cost: ${result.totalCost}`);
                    console.log(`🏷️  Service Price: ${result.servicePrice}`);
                    console.log(`⚙️  Service Factor (HSDV): ${result.HSDV}`);
                    console.log(`🕐 Overtime Factor: ${result.HSovertime}`);
                    console.log(`📅 Weekend Factor: ${result.HScuoituan}`);
                    console.log(`🗓️  Is Weekend: ${result.isWeekend}`);
                    console.log(`⏰ Overtime Hours: ${result.totalOvertimeHours}`);
                    console.log(`🕒 Normal Hours: ${result.totalNormalHours}`);
                    console.log(`💵 Overtime Cost: ${result.overtimeCost}`);
                    console.log(`💴 Normal Cost: ${result.normalCost}`);
                    
                    console.log('\n✅ Cost calculation successful!');
                    console.log('\n🔍 Analysis of your original data:');
                    console.log('• Time: 06:30 UTC - 08:30 UTC (2 hours)');
                    console.log('• Date: August 3, 2025 (Saturday - should be weekend)');
                    console.log('• If office hours are different from these times, some hours may be counted as overtime');
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

testGetServices();
