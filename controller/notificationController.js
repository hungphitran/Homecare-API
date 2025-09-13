const { initFirebase } = require('../utils/firebase');
const DeviceToken = require('../model/deviceToken.model');
const NotificationHelper = require('../utils/notificationHelper');
const Customer = require('../model/customer.model');
const { checkNotificationHealth } = require('../utils/notifications');

// Ensure Firebase is initialized
let admin;
try {
  admin = initFirebase();
} catch (e) {
  console.warn('Firebase not initialized yet. Some endpoints will fail until configured.');
}

const notificationController = {
  // Register or update a device token
  registerToken: async (req, res) => {
    try {
      let { token, userId, phone, platform } = req.body || {};
      console.log('[REGISTER TOKEN] Request body:', req.body);
      if (!token) {
        return res.status(400).json({ success: false, message: 'Missing token' });
      }
      if(!userId){
        if(!phone){
          return res.status(400).json({ success: false, message: 'Either userId or phone is required' });
        }
        
        const customer = await Customer.findOne({ phone });
        if(!customer){
          return res.status(400).json({ success: false, message: 'No customer found with the provided phone' });
        }

        userId = customer._id;
      }

      const update = {
        userId: userId || undefined,
        phone: phone || undefined,
        platform: platform || 'unknown',
        lastSeenAt: new Date(),
      };

      const saved = await DeviceToken.findOneAndUpdate(
        { token },
        { $set: update, $setOnInsert: { topics: [] } },
        { new: true, upsert: true }
      );

      return res.json({ success: true, data: saved });
    } catch (err) {
      console.error('registerToken error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Send a push notification to a token
  sendToToken: async (req, res) => {
    try {
      if (!admin) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const { token, title, body, data } = req.body || {};
      if (!token || !title || !body) {
        return res.status(400).json({ success: false, message: 'token, title, body are required' });
      }

      const message = {
        token,
        notification: { title, body },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
      };

      const response = await admin.messaging().send(message);
      return res.json({ success: true, id: response });
    } catch (err) {
      console.error('sendToToken error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Send to a topic
  sendToTopic: async (req, res) => {
    try {
      if (!admin) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const { topic, title, body, data } = req.body || {};
      if (!topic || !title || !body) {
        return res.status(400).json({ success: false, message: 'topic, title, body are required' });
      }

      const message = {
        topic,
        notification: { title, body },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
      };

      const response = await admin.messaging().send(message);
      return res.json({ success: true, id: response });
    } catch (err) {
      console.error('sendToTopic error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Subscribe a token to a topic
  subscribe: async (req, res) => {
    try {
      if (!admin) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const { token, topic } = req.body || {};
      if (!token || !topic) {
        return res.status(400).json({ success: false, message: 'token and topic are required' });
      }

      const response = await admin.messaging().subscribeToTopic(token, topic);
      // Persist topic locally (store unique)
      await DeviceToken.updateOne(
        { token },
        { $addToSet: { topics: topic }, $set: { lastSeenAt: new Date() } },
        { upsert: true }
      );

      return res.json({ success: true, data: response });
    } catch (err) {
      console.error('subscribe error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Unsubscribe a token from a topic
  unsubscribe: async (req, res) => {
    try {
      if (!admin) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const { token, topic } = req.body || {};
      if (!token || !topic) {
        return res.status(400).json({ success: false, message: 'token and topic are required' });
      }

      const response = await admin.messaging().unsubscribeFromTopic(token, topic);
      await DeviceToken.updateOne(
        { token },
        { $pull: { topics: topic }, $set: { lastSeenAt: new Date() } }
      );

      return res.json({ success: true, data: response });
    } catch (err) {
      console.error('unsubscribe error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Test notification với kiểm tra kết quả chi tiết
  testNotification: async (req, res) => {
    try {
      const { phone, title = 'Test Notification', body = 'This is a test message', data } = req.body || {};
      
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      console.log(`[TEST NOTIFICATION] Sending test notification to phone: ${phone}`);
      
      const result = await NotificationHelper.sendWithCheck(phone, title, body, data);
      const stats = NotificationHelper.getStats(result);
      
      return res.json({
        success: NotificationHelper.isSuccess(result),
        message: NotificationHelper.isSuccess(result) 
          ? 'Notification sent successfully' 
          : 'Failed to send notification',
        stats,
        details: result.details || [],
        hasFailures: NotificationHelper.hasFailures(result),
        result: result
      });
      
    } catch (err) {
      console.error('testNotification error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Kiểm tra trạng thái device tokens của một phone
  checkTokenStatus: async (req, res) => {
    try {
      const { phone } = req.params;
      
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone parameter is required' });
      }

      const tokens = await DeviceToken.find({ phone });
      const tokenList = tokens.map(token => ({
        token: token.token.substring(0, 20) + '...', // Hide full token for security
        platform: token.platform,
        lastSeenAt: token.lastSeenAt,
        topics: token.topics
      }));

      return res.json({
        success: true,
        phone,
        totalTokens: tokens.length,
        tokens: tokenList,
        canReceiveNotifications: tokens.length > 0
      });
      
    } catch (err) {
      console.error('checkTokenStatus error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Health check endpoint để kiểm tra trạng thái hệ thống notification
  healthCheck: async (req, res) => {
    try {
      console.log('[NOTIFICATION CONTROLLER] Health check requested');
      
      const healthData = await checkNotificationHealth();
      
      const isHealthy = healthData.firebase && healthData.database;
      
      return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        message: isHealthy ? 'Notification system is healthy' : 'Notification system has issues',
        timestamp: new Date().toISOString(),
        health: healthData,
        recommendations: isHealthy ? [] : [
          !healthData.firebase && 'Check Firebase configuration (service account credentials)',
          !healthData.database && 'Check database connection',
          healthData.totalTokens === 0 && 'No device tokens registered yet'
        ].filter(Boolean)
      });
      
    } catch (err) {
      console.error('healthCheck error', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Health check failed', 
        error: err.message 
      });
    }
  },
};

module.exports = notificationController;
