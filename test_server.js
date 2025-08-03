const http = require('http');

// Simple test to check server connectivity
function testServer() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
    };

    console.log('🔍 Testing server connectivity...');

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log(`📥 Response Status: ${res.statusCode}`);
            console.log('📥 Response:', responseData);
        });
    });

    req.on('error', (error) => {
        console.log('❌ Connection error:', error.message);
    });

    req.end();
}

// Test direct route
function testCalculateRoute() {
    const testData = {
        "serviceTitle": "test",
        "startTime": "06:30",
        "endTime": "08:30",
        "workDate": "2025-08-03"
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

    console.log('\n🧪 Testing /request/calculateCost directly...');

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log(`📥 Response Status: ${res.statusCode}`);
            console.log('📥 Response:', responseData);
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request error:', error.message);
    });

    req.write(postData);
    req.end();
}

testServer();
setTimeout(testCalculateRoute, 1000);
