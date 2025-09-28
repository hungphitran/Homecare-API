const { initFirebase } = require('../utils/firebase');
const HelperDeviceToken = require('../model/helperDeviceToken.model');
const Helper = require('../model/helper.model');
const { 
  sendToHelperPhone,
  sendToHelperId,
  checkHelperNotificationHealth 
} = require('../utils/helperNotifications');

// Ensure Firebase is initialized
let admin;
try {
  admin = initFirebase();
} catch (e) {
  console.warn('Firebase not initialized yet. Some helper notification endpoints will fail until configured.');
}

const helperNotificationController = {
  // Register or update a helper device token
  registerToken: async (req, res) => {
    try {
      let { token, phone, platform } = req.body || {};
      console.log('[REGISTER HELPER TOKEN] Request body:', req.body);
      
      if (!token) {
        return res.status(400).json({ success: false, message: 'Missing token' });
      }
      
      // Validate that we have at least one identifier (helperId, helper_id, or phone)
      if (!phone) {
        return res.status(400).json({ 
          success: false, 
          message: ' phone is required' 
        });
      }

      // If we have phone
      let helper_id;
      if (phone) {
        const helper = await Helper.findOne({ phone });
        if (helper) {
          helper_id = helper._id.toString();
        } else {
          console.warn(`[REGISTER HELPER TOKEN] No helper found with phone: ${phone}`);
        }
      }
      

      const update = {
        helper_id: helper_id || undefined,
        phone: phone || undefined,
        platform: platform || 'unknown',
        lastSeenAt: new Date(),
      };

      const saved = await HelperDeviceToken.findOneAndUpdate(
        { token },
        { $set: update, $setOnInsert: { topics: [] } },
        { new: true, upsert: true }
      );

      console.log('[REGISTER HELPER TOKEN] Saved token:', {
        token: token.substring(0, 20) + '...', 
        helper_id, 
        phone,
        platform
      });

      return res.json({ 
        success: true, 
        message: 'Helper device token registered successfully',
        data: {
          helper_id: saved.helper_id,
          phone: saved.phone,
          platform: saved.platform,
          lastSeenAt: saved.lastSeenAt
        }
      });
    } catch (err) {
      console.error('registerHelperToken error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Send a push notification to a helper token directly
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
      console.error('sendToHelperToken error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Send notification to helper by phone
  sendToHelperPhone: async (req, res) => {
    try {
      const { phone, title, body, data } = req.body || {};
      if (!phone || !title || !body) {
        return res.status(400).json({ 
          success: false, 
          message: 'phone, title, body are required' 
        });
      }

      console.log(`[SEND TO HELPER PHONE] Sending notification to helper phone: ${phone}`);
      const result = await sendToHelperPhone(phone, title, body, data);
      
      return res.json({
        success: result.success,
        message: result.success ? 'Notification sent successfully' : 'Failed to send notification',
        data: {
          phone: result.phone,
          sent: result.sent || 0,
          failed: result.failed || 0,
          tokens: result.tokens || 0
        },
        details: result.details || []
      });
    } catch (err) {
      console.error('sendToHelperPhone error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Send notification to helper by helper_id
  sendToHelperId: async (req, res) => {
    try {
      const { helper_id, title, body, data } = req.body || {};
      if (!helper_id || !title || !body) {
        return res.status(400).json({ 
          success: false, 
          message: 'helper_id, title, body are required' 
        });
      }

      console.log(`[SEND TO HELPER ID] Sending notification to helper_id: ${helper_id}`);
      const result = await sendToHelperId(helper_id, title, body, data);
      
      return res.json({
        success: result.success,
        message: result.success ? 'Notification sent successfully' : 'Failed to send notification',
        data: {
          helper_id: result.helper_id,
          sent: result.sent || 0,
          failed: result.failed || 0,
          tokens: result.tokens || 0
        },
        details: result.details || []
      });
    } catch (err) {
      console.error('sendToHelperId error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Subscribe a helper token to a topic
  subscribe: async (req, res) => {
    try {
      if (!admin) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const { token, topic } = req.body || {};
      if (!token || !topic) {
        return res.status(400).json({ success: false, message: 'token and topic are required' });
      }

      const response = await admin.messaging().subscribeToTopic(token, topic);
      // Persist topic locally (store unique)
      await HelperDeviceToken.updateOne(
        { token },
        { $addToSet: { topics: topic }, $set: { lastSeenAt: new Date() } },
        { upsert: true }
      );

      return res.json({ success: true, data: response });
    } catch (err) {
      console.error('helperSubscribe error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Unsubscribe a helper token from a topic
  unsubscribe: async (req, res) => {
    try {
      if (!admin) return res.status(500).json({ success: false, message: 'Firebase not initialized' });
      const { token, topic } = req.body || {};
      if (!token || !topic) {
        return res.status(400).json({ success: false, message: 'token and topic are required' });
      }

      const response = await admin.messaging().unsubscribeFromTopic(token, topic);
      await HelperDeviceToken.updateOne(
        { token },
        { $pull: { topics: topic }, $set: { lastSeenAt: new Date() } }
      );

      return res.json({ success: true, data: response });
    } catch (err) {
      console.error('helperUnsubscribe error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Test helper notification với kiểm tra kết quả chi tiết
  testNotification: async (req, res) => {
    try {
      const { 
        phone, 
        helper_id, 
        title = 'Test Helper Notification', 
        body = 'This is a test message for helper', 
        data 
      } = req.body || {};
      
      if (!phone && !helper_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Either phone or helper_id is required' 
        });
      }

      let result;
      if (helper_id) {
        console.log(`[TEST HELPER NOTIFICATION] Sending test notification to helper_id: ${helper_id}`);
        result = await sendToHelperId(helper_id, title, body, data);
      } else {
        console.log(`[TEST HELPER NOTIFICATION] Sending test notification to phone: ${phone}`);
        result = await sendToHelperPhone(phone, title, body, data);
      }
      
      return res.json({
        success: result.success,
        message: result.success 
          ? 'Helper notification sent successfully' 
          : 'Failed to send helper notification',
        data: {
          phone: result.phone,
          helper_id: result.helper_id,
          sent: result.sent || 0,
          failed: result.failed || 0,
          tokens: result.tokens || 0
        },
        details: result.details || []
      });
      
    } catch (err) {
      console.error('testHelperNotification error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Kiểm tra trạng thái device tokens của một helper
  checkTokenStatus: async (req, res) => {
    try {
      const { identifier } = req.params; // Could be phone or helper_id
      const { type = 'phone' } = req.query; // 'phone' or 'helper_id'
      
      if (!identifier) {
        return res.status(400).json({ 
          success: false, 
          message: 'Identifier parameter is required' 
        });
      }

      let tokens;
      if (type === 'helper_id') {
        tokens = await HelperDeviceToken.find({ helper_id: identifier });
      } else {
        tokens = await HelperDeviceToken.find({ phone: identifier });
      }
      
      const tokenList = tokens.map(token => ({
        token: token.token.substring(0, 20) + '...', // Hide full token for security
        platform: token.platform,
        lastSeenAt: token.lastSeenAt,
        topics: token.topics,
        helper_id: token.helper_id,
        phone: token.phone
      }));

      return res.json({
        success: true,
        identifier,
        type,
        totalTokens: tokens.length,
        tokens: tokenList,
        canReceiveNotifications: tokens.length > 0
      });
      
    } catch (err) {
      console.error('checkHelperTokenStatus error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Health check endpoint để kiểm tra trạng thái hệ thống helper notification
  healthCheck: async (req, res) => {
    try {
      console.log('[HELPER NOTIFICATION CONTROLLER] Health check requested');
      
      const healthData = await checkHelperNotificationHealth();
      
      const isHealthy = healthData.firebase && healthData.database;
      
      return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        message: isHealthy ? 'Helper notification system is healthy' : 'Helper notification system has issues',
        timestamp: new Date().toISOString(),
        health: healthData,
        recommendations: isHealthy ? [] : [
          !healthData.firebase && 'Check Firebase configuration (service account credentials)',
          !healthData.database && 'Check database connection',
          healthData.totalTokens === 0 && 'No helper device tokens registered yet'
        ].filter(Boolean)
      });
      
    } catch (err) {
      console.error('helperHealthCheck error', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Health check failed', 
        error: err.message 
      });
    }
  },

  // Send to a topic (for broadcasting to all helpers)
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
      console.error('sendToHelperTopic error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = helperNotificationController;