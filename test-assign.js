// Test script để kiểm tra assign và notification
const mongoose = require('mongoose');
require('dotenv').config();

// Import models và utils
const Request = require('./model/request.model');
const RequestDetail = require('./model/requestDetail.model');
const DeviceToken = require('./model/deviceToken.model');
const { notifyOrderStatusChange, checkNotificationHealth } = require('./utils/notifications');

async function testAssignNotification() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homecare', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to database');

        // 1. Check notification system health
        console.log('\n🏥 CHECKING NOTIFICATION SYSTEM HEALTH...');
        const health = await checkNotificationHealth();
        console.log('Health result:', health);

        // 2. Find a test request with pending schedules
        console.log('\n🔍 LOOKING FOR TEST REQUEST...');
        const testRequest = await Request.findOne({}).populate('scheduleIds');
        
        if (!testRequest) {
            console.log('❌ No test request found');
            return;
        }

        console.log('✅ Found test request:', testRequest._id);
        console.log('Customer phone:', testRequest.customerInfo?.phone);

        // 3. Check if customer has registered device tokens
        if (testRequest.customerInfo?.phone) {
            console.log('\n📱 CHECKING DEVICE TOKENS...');
            const tokens = await DeviceToken.find({ phone: testRequest.customerInfo.phone });
            console.log(`Found ${tokens.length} device tokens for phone ${testRequest.customerInfo.phone}`);
            
            if (tokens.length === 0) {
                console.log('⚠️  No device tokens found. Customer needs to register for notifications first.');
                console.log('💡 Use POST /api/notifications/register with:');
                console.log(JSON.stringify({
                    token: 'YOUR_FCM_TOKEN',
                    phone: testRequest.customerInfo.phone,
                    platform: 'web'
                }, null, 2));
            } else {
                tokens.forEach((token, index) => {
                    console.log(`Token ${index + 1}: ${token.token.substring(0, 20)}... (${token.platform})`);
                });
            }
        }

        // 4. Test notification sending
        console.log('\n📤 TESTING NOTIFICATION...');
        try {
            const result = await notifyOrderStatusChange(testRequest, 'assigned');
            console.log('Notification result:', result);
        } catch (error) {
            console.error('Notification error:', error);
        }

        // 5. Show test endpoints
        console.log('\n🧪 TEST ENDPOINTS:');
        console.log('Health check: GET /api/notifications/health');
        console.log('Check tokens: GET /api/notifications/check/' + (testRequest.customerInfo?.phone || 'PHONE_NUMBER'));
        console.log('Test notification: POST /api/notifications/test');
        console.log('Register token: POST /api/notifications/register');

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from database');
    }
}

// Run test
testAssignNotification();
