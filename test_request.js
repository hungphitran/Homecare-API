// Test script to verify the fix for orderDate issue
const axios = require('axios');

const testData = {
  service: { title: 'Dọn dẹp nhà cửa', coefficient_service: 1, coefficient_other: 1, cost: 0 },
  startTime: '2025-08-04T06:30:00.000Z',
  endTime: '2025-08-04T08:30:00.000Z',
  customerInfo: { fullName: 'Test User', phone: '0123456789', address: 'Test Address', usedPoint: 0 },
  location: { province: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Phường 1' },
  requestType: 'Ngắn hạn',
  totalCost: '62400'
};

async function testRequest() {
  try {
    console.log('Testing request with the following data:');
    console.log(JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost/request', testData, {
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
        // 'Authorization': 'Bearer your-token-here'
      }
    });
    
    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testRequest();
