const { initFirebase } = require('./firebase');
const HelperDeviceToken = require('../model/helperDeviceToken.model');

function coerceDataToStrings(data) {
  if (!data) return {};
  const result = {};
  Object.keys(data).forEach(key => {
    result[key] = String(data[key]);
  });
  return result;
}

// Utility function to check helper notification system health
async function checkHelperNotificationHealth() {
  console.log(`[HELPER NOTIFICATION] 🏥 HEALTH CHECK START`);
  
  try {
    // Check Firebase initialization
    const admin = initFirebase();
    console.log(`[HELPER NOTIFICATION] ✅ Firebase Admin: Initialized`);
    
    // Check database connection
    const totalTokens = await HelperDeviceToken.countDocuments();
    const uniqueHelperIds = await HelperDeviceToken.distinct('helper_id').then(ids => ids.filter(Boolean));
    const uniquePhones = await HelperDeviceToken.distinct('phone').then(phones => phones.filter(Boolean));
    
    console.log(`[HELPER NOTIFICATION] 📊 Database Stats:`);
    console.log(`- Total helper device tokens: ${totalTokens}`);
    console.log(`- Unique helper IDs: ${uniqueHelperIds.length}`);
    console.log(`- Unique phone numbers: ${uniquePhones.length}`);
    
    if (uniqueHelperIds.length > 0) {
      console.log(`- Sample helper IDs:`, uniqueHelperIds.slice(0, 3));
    }
    
    console.log(`[HELPER NOTIFICATION] ✅ HEALTH CHECK PASSED`);
    return {
      firebase: true,
      database: true,
      totalTokens,
      uniqueHelperIds: uniqueHelperIds.length,
      uniquePhones: uniquePhones.length
    };
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] ❌ HEALTH CHECK FAILED:`, error.message);
    return {
      firebase: false,
      database: false,
      error: error.message
    };
  }
}

async function getTokensByHelperPhone(phone) {
  console.log(`[HELPER NOTIFICATION] 🔍 Querying database for tokens with phone: ${phone}`);
  
  try {
    const tokens = await HelperDeviceToken.find({ phone }).distinct('token');
    const validTokens = tokens.filter(Boolean);
    
    console.log(`[HELPER NOTIFICATION] 📊 Token query results:`);
    console.log(`- Raw tokens found: ${tokens.length}`);
    console.log(`- Valid tokens (after filtering): ${validTokens.length}`);
    
    if (validTokens.length === 0) {
      console.warn(`[HELPER NOTIFICATION] ⚠️  No valid tokens found for phone ${phone}`);
      console.warn(`[HELPER NOTIFICATION] Possible reasons:`);
      console.warn(`  - Helper hasn't registered for notifications yet`);
      console.warn(`  - Phone number mismatch in database`);
      console.warn(`  - All tokens have been invalidated/expired`);
    } else {
      console.log(`[HELPER NOTIFICATION] ✅ Found ${validTokens.length} valid token(s) for phone ${phone}`);
      validTokens.forEach((token, index) => {
        console.log(`  Token ${index + 1}: ${token.substring(0, 20)}...${token.substring(token.length - 10)} (length: ${token.length})`);
      });
    }
    
    return validTokens;
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] ❌ Database error when querying tokens for phone ${phone}:`, error);
    return [];
  }
}

async function getTokensByHelperId(helperId) {
  console.log(`[HELPER NOTIFICATION] 🔍 Querying database for tokens with helper_id: ${helperId}`);
  
  try {
    const tokens = await HelperDeviceToken.find({ helper_id: helperId }).distinct('token');
    const validTokens = tokens.filter(Boolean);
    
    console.log(`[HELPER NOTIFICATION] 📊 Token query results:`);
    console.log(`- Raw tokens found: ${tokens.length}`);
    console.log(`- Valid tokens (after filtering): ${validTokens.length}`);
    
    if (validTokens.length === 0) {
      console.warn(`[HELPER NOTIFICATION] ⚠️  No valid tokens found for helper_id ${helperId}`);
    } else {
      console.log(`[HELPER NOTIFICATION] ✅ Found ${validTokens.length} valid token(s) for helper_id ${helperId}`);
    }
    
    return validTokens;
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] ❌ Database error when querying tokens for helper_id ${helperId}:`, error);
    return [];
  }
}

async function sendToHelperPhone(phone, title, body, data) {
  console.log(`[HELPER NOTIFICATION] 🔍 Starting sendToHelperPhone for phone: ${phone}`);
  
  let admin;
  try {
    admin = initFirebase();
    console.log(`[HELPER NOTIFICATION] ✅ Firebase Admin initialized successfully`);
  } catch (e) {
    console.error('[HELPER NOTIFICATION] ❌ Firebase initialization failed:', e?.message || e);
    throw new Error('Firebase not initialized');
  }

  console.log(`[HELPER NOTIFICATION] 🔎 Looking up device tokens for helper phone: ${phone}`);
  const tokens = await getTokensByHelperPhone(phone);
  
  if (!tokens || tokens.length === 0) {
    console.warn(`[HELPER NOTIFICATION] ⚠️  No device tokens found for helper phone: ${phone}`);
    console.warn(`[HELPER NOTIFICATION] This means the helper hasn't registered any devices for notifications`);
    return { 
      success: false, 
      message: 'No device tokens for this helper phone', 
      phone,
      tokens: 0,
      details: []
    };
  }

  console.log(`[HELPER NOTIFICATION] 📱 Found ${tokens.length} token(s) for helper phone ${phone}:`);
  tokens.forEach((token, index) => {
    console.log(`  Token ${index + 1}: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
  });
  
  const payload = {
    tokens,
    notification: { title, body },
    data: coerceDataToStrings(data),
  };

  console.log(`[HELPER NOTIFICATION] 📤 Prepared FCM payload:`);
  console.log(`- Notification: ${JSON.stringify(payload.notification)}`);
  console.log(`- Data: ${JSON.stringify(payload.data)}`);
  console.log(`- Target tokens: ${payload.tokens.length}`);

  try {
    console.log(`[HELPER NOTIFICATION] 🚀 Sending FCM message via sendEachForMulticast...`);
    const sendStartTime = Date.now();
    const resp = await admin.messaging().sendEachForMulticast(payload);
    const sendDuration = Date.now() - sendStartTime;
    
    // Enhanced detailed results logging
    console.log(`[HELPER NOTIFICATION] 📊 FCM Response received (took ${sendDuration}ms):`);
    console.log(`- Success count: ${resp.successCount}`);
    console.log(`- Failure count: ${resp.failureCount}`);
    console.log(`- Total responses: ${resp.responses?.length || 0}`);
    
    if (resp.responses && resp.responses.length > 0) {
      console.log(`[HELPER NOTIFICATION] 📱 Individual token results:`);
      resp.responses.forEach((response, index) => {
        const tokenPreview = tokens[index] ? `${tokens[index].substring(0, 15)}...` : 'unknown';
        if (response.success) {
          console.log(`  Token ${index + 1} (${tokenPreview}): ✅ SUCCESS`);
          console.log(`    Message ID: ${response.messageId}`);
        } else {
          console.error(`  Token ${index + 1} (${tokenPreview}): ❌ FAILED`);
          console.error(`    Error Code: ${response.error?.code}`);
          console.error(`    Error Message: ${response.error?.message}`);
          
          // Log common error explanations
          if (response.error?.code === 'messaging/registration-token-not-registered') {
            console.error(`    💡 This usually means the token has expired or the app was uninstalled`);
          } else if (response.error?.code === 'messaging/invalid-registration-token') {
            console.error(`    💡 This token format is invalid`);
          }
        }
      });
    }

    const result = { 
      success: resp.successCount > 0, 
      raw: resp, 
      sent: resp.successCount, 
      failed: resp.failureCount,
      phone,
      tokens: tokens.length,
      details: resp.responses?.map((r, i) => ({
        tokenIndex: i,
        tokenPreview: tokens[i] ? `${tokens[i].substring(0, 15)}...` : 'unknown',
        success: r.success,
        messageId: r.messageId || null,
        error: r.error ? { code: r.error.code, message: r.error.message } : null
      }))
    };
    
    if (resp.successCount > 0) {
      console.log(`[HELPER NOTIFICATION] ✅ Final result: SUCCESS - ${resp.successCount}/${tokens.length} messages sent`);
    } else {
      console.error(`[HELPER NOTIFICATION] ❌ Final result: ALL FAILED - 0/${tokens.length} messages sent`);
    }
    
    return result;
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] 💥 FCM sending error for helper phone ${phone}:`, error);
    console.error(`[HELPER NOTIFICATION] Error details:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0] // First line of stack trace
    });
    
    return { 
      success: false, 
      message: error.message, 
      phone,
      tokens: tokens.length,
      error: error
    };
  }
}

async function sendToHelperId(helperId, title, body, data) {
  console.log(`[HELPER NOTIFICATION] 🔍 Starting sendToHelperId for helper_id: ${helperId}`);
  
  let admin;
  try {
    admin = initFirebase();
    console.log(`[HELPER NOTIFICATION] ✅ Firebase Admin initialized successfully`);
  } catch (e) {
    console.error('[HELPER NOTIFICATION] ❌ Firebase initialization failed:', e?.message || e);
    throw new Error('Firebase not initialized');
  }

  console.log(`[HELPER NOTIFICATION] 🔎 Looking up device tokens for helper_id: ${helperId}`);
  const tokens = await getTokensByHelperId(helperId);
  
  if (!tokens || tokens.length === 0) {
    console.warn(`[HELPER NOTIFICATION] ⚠️  No device tokens found for helper_id: ${helperId}`);
    return { 
      success: false, 
      message: 'No device tokens for this helper_id', 
      helper_id: helperId,
      tokens: 0,
      details: []
    };
  }

  const payload = {
    tokens,
    notification: { title, body },
    data: coerceDataToStrings(data),
  };

  try {
    const resp = await admin.messaging().sendEachForMulticast(payload);
    
    const result = { 
      success: resp.successCount > 0, 
      raw: resp, 
      sent: resp.successCount, 
      failed: resp.failureCount,
      helper_id: helperId,
      tokens: tokens.length,
      details: resp.responses?.map((r, i) => ({
        tokenIndex: i,
        success: r.success,
        messageId: r.messageId || null,
        error: r.error ? { code: r.error.code, message: r.error.message } : null
      }))
    };
    
    console.log(`[HELPER NOTIFICATION] ${result.success ? '✅ SUCCESS' : '❌ FAILED'} - ${resp.successCount}/${tokens.length} messages sent to helper_id ${helperId}`);
    return result;
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] 💥 FCM sending error for helper_id ${helperId}:`, error);
    return { 
      success: false, 
      message: error.message, 
      helper_id: helperId,
      tokens: tokens.length,
      error: error
    };
  }
}

function helperStatusLabel(status) {
  const statusMap = {
    assigned: 'Đã phân công',
    inProgress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    rescheduled: 'Đã dời lịch'
  };
  return statusMap[status] || status;
}

// Notification functions for specific helper events
async function notifyHelperJobAssigned(request, helper, extraData = {}) {
  const startTime = new Date();
  console.log(`[HELPER NOTIFICATION] ========== START JOB ASSIGNED NOTIFICATION ==========`);
  console.log(`[HELPER NOTIFICATION] Timestamp: ${startTime.toISOString()}`);
  
  if (!helper || !helper.phone) {
    console.error('[HELPER NOTIFICATION] ❌ VALIDATION FAILED: Missing helper phone:', helper);
    return { 
      success: false, 
      message: 'Missing helper phone',
      helperId: helper?.helper_id || 'unknown'
    };
  }
  
  const title = 'Công việc mới';
  const body = `Bạn được phân công công việc mới cho đơn ${request._id}. Vui lòng kiểm tra chi tiết.`;
  
  const data = {
    requestId: String(request._id),
    type: 'job_assigned',
    screen: 'JobDetail',
    ...extraData,
  };

  try {
    const result = await sendToHelperPhone(helper.phone, title, body, data);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    if (result.success) {
      console.log(`[HELPER NOTIFICATION] ✅ SUCCESS - Job assigned notification sent!`);
      console.log(`[HELPER NOTIFICATION] Duration: ${duration}ms`);
    } else {
      console.error(`[HELPER NOTIFICATION] ❌ FAILED - Could not send job assigned notification`);
      console.error(`[HELPER NOTIFICATION] Duration: ${duration}ms`);
    }
    
    console.log(`[HELPER NOTIFICATION] ========== END JOB ASSIGNED NOTIFICATION ==========`);
    return result;
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] 💥 Exception in notifyHelperJobAssigned:`, error);
    return { success: false, message: error.message, error };
  }
}

async function notifyHelperJobStatusChange(request, helper, newStatus, extraData = {}) {
  const startTime = new Date();
  console.log(`[HELPER NOTIFICATION] ========== START JOB STATUS CHANGE NOTIFICATION ==========`);
  
  if (!helper || !helper.phone) {
    console.error('[HELPER NOTIFICATION] ❌ VALIDATION FAILED: Missing helper phone');
    return { success: false, message: 'Missing helper phone' };
  }
  
  const title = 'Cập nhật trạng thái công việc';
  const body = `Trạng thái công việc đơn ${request._id} đã được cập nhật thành: ${helperStatusLabel(newStatus)}`;
  
  const data = {
    requestId: String(request._id),
    status: newStatus,
    type: 'job_status_change',
    screen: 'JobDetail',
    ...extraData,
  };

  try {
    const result = await sendToHelperPhone(helper.phone, title, body, data);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log(`[HELPER NOTIFICATION] ${result.success ? '✅ SUCCESS' : '❌ FAILED'} - Status change notification (${duration}ms)`);
    console.log(`[HELPER NOTIFICATION] ========== END JOB STATUS CHANGE NOTIFICATION ==========`);
    return result;
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] 💥 Exception in notifyHelperJobStatusChange:`, error);
    return { success: false, message: error.message, error };
  }
}

async function notifyHelperJobCancelled(request, helper, reason, extraData = {}) {
  const title = 'Công việc đã bị hủy';
  const body = `Công việc đơn ${request._id} đã bị hủy. Lý do: ${reason}`;
  
  const data = {
    requestId: String(request._id),
    reason,
    type: 'job_cancelled',
    screen: 'JobList',
    ...extraData,
  };

  try {
    return await sendToHelperPhone(helper.phone, title, body, data);
  } catch (error) {
    console.error(`[HELPER NOTIFICATION] Error in notifyHelperJobCancelled:`, error);
    return { success: false, message: error.message, error };
  }
}

module.exports = {
  sendToHelperPhone,
  sendToHelperId,
  getTokensByHelperPhone,
  getTokensByHelperId,
  checkHelperNotificationHealth,
  notifyHelperJobAssigned,
  notifyHelperJobStatusChange,
  notifyHelperJobCancelled
};