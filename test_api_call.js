const express = require('express');
const app = express();
const requestController = require('./controller/requestController');

app.use(express.json());

// Test API endpoint
app.post('/test-cost', requestController.calculateCost);

const testData = {
  "serviceId": "67c5d72c78f7a2a704b027ee",
  "startTime": "2025-08-15T23:30:00.000Z",
  "endTime": "2025-08-16T01:30:00.000Z", 
  "workDate": "2025-08-16",
  "location": { 
    "province": "Cao Bằng", 
    "district": "Bảo Lâm", 
    "ward": "undefined" 
  }
};

console.log('Testing with your data:');
console.log(JSON.stringify(testData, null, 2));

// Simulate the request
const req = {
  body: testData
};

const res = {
  status: (code) => ({
    json: (data) => {
      console.log(`\nResponse Status: ${code}`);
      console.log('Response Data:');
      console.log(JSON.stringify(data, null, 2));
    }
  })
};

requestController.calculateCost(req, res, () => {});
