const { initFirebase } = require('./firebase');
const DeviceToken = require('../model/deviceToken.model');

function coerceDataToStrings(data) {
  if (!data) return undefined;
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

// Utility function to check notification system health
async function checkNotificationHealth() {
  console.log(`[NOTIFICATION] 🏥 HEALTH CHECK START`);
  
  try {
    // Check Firebase initialization
    const admin = initFirebase();
    console.log(`[NOTIFICATION] ✅ Firebase Admin: Initialized`);
    
    // Check database connection
    const totalTokens = await DeviceToken.countDocuments();
    const uniquePhones = await DeviceToken.distinct('phone').then(phones => phones.filter(Boolean));
    
    console.log(`[NOTIFICATION] 📊 Database Stats:`);
    console.log(`- Total device tokens: ${totalTokens}`);
    console.log(`- Unique phone numbers: ${uniquePhones.length}`);
    
    if (uniquePhones.length > 0) {
      console.log(`- Sample phones:`, uniquePhones.slice(0, 3).map(p => `${p.substring(0, 3)}***${p.substring(p.length - 3)}`));
    }
    
    console.log(`[NOTIFICATION] ✅ HEALTH CHECK PASSED`);
    return {
      firebase: true,
      database: true,
      totalTokens,
      uniquePhones: uniquePhones.length
    };
  } catch (error) {
    console.error(`[NOTIFICATION] ❌ HEALTH CHECK FAILED:`, error.message);
    return {
      firebase: false,
      database: false,
      error: error.message
    };
  }
}

async function getTokensByPhone(phone) {
  console.log(`[NOTIFICATION] 🔍 Querying database for tokens with phone: ${phone}`);
  
  try {
    const tokens = await DeviceToken.find({ phone }).distinct('token');
    const validTokens = tokens.filter(Boolean);
    
    console.log(`[NOTIFICATION] 📊 Token query results:`);
    console.log(`- Raw tokens found: ${tokens.length}`);
    console.log(`- Valid tokens (after filtering): ${validTokens.length}`);
    
    if (validTokens.length === 0) {
      console.warn(`[NOTIFICATION] ⚠️  No valid tokens found for phone ${phone}`);
      console.warn(`[NOTIFICATION] Possible reasons:`);
      console.warn(`  - Customer hasn't registered for notifications yet`);
      console.warn(`  - Phone number mismatch in database`);
      console.warn(`  - All tokens have been invalidated/expired`);
    } else {
      console.log(`[NOTIFICATION] ✅ Found ${validTokens.length} valid token(s) for phone ${phone}`);
      validTokens.forEach((token, index) => {
        console.log(`  Token ${index + 1}: ${token.substring(0, 20)}...${token.substring(token.length - 10)} (length: ${token.length})`);
      });
    }
    
    return validTokens;
  } catch (error) {
    console.error(`[NOTIFICATION] ❌ Database error when querying tokens for phone ${phone}:`, error);
    return [];
  }
}

async function sendToCustomerPhone(phone, title, body, data) {
  console.log(`[NOTIFICATION] 🔍 Starting sendToCustomerPhone for phone: ${phone}`);
  
  let admin;
  try {
    admin = initFirebase();
    console.log(`[NOTIFICATION] ✅ Firebase Admin initialized successfully`);
  } catch (e) {
    console.error('[NOTIFICATION] ❌ Firebase initialization failed:', e?.message || e);
    throw new Error('Firebase not initialized');
  }

  console.log(`[NOTIFICATION] 🔎 Looking up device tokens for phone: ${phone}`);
  const tokens = await getTokensByPhone(phone);
  
  if (!tokens || tokens.length === 0) {
    console.warn(`[NOTIFICATION] ⚠️  No device tokens found for phone: ${phone}`);
    console.warn(`[NOTIFICATION] This means the customer hasn't registered any devices for notifications`);
    return { 
      success: false, 
      message: 'No device tokens for this phone', 
      phone,
      tokens: 0,
      details: []
    };
  }

  console.log(`[NOTIFICATION] 📱 Found ${tokens.length} token(s) for phone ${phone}:`);
  tokens.forEach((token, index) => {
    console.log(`  Token ${index + 1}: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
  });
  
  const payload = {
    tokens,
    notification: { title, body },
    data: coerceDataToStrings(data),
  };

  console.log(`[NOTIFICATION] 📤 Prepared FCM payload:`);
  console.log(`- Notification: ${JSON.stringify(payload.notification)}`);
  console.log(`- Data: ${JSON.stringify(payload.data)}`);
  console.log(`- Target tokens: ${payload.tokens.length}`);

  try {
    console.log(`[NOTIFICATION] 🚀 Sending FCM message via sendEachForMulticast...`);
    const sendStartTime = Date.now();
    const resp = await admin.messaging().sendEachForMulticast(payload);
    const sendDuration = Date.now() - sendStartTime;
    
    // Enhanced detailed results logging
    console.log(`[NOTIFICATION] 📊 FCM Response received (took ${sendDuration}ms):`);
    console.log(`- Success count: ${resp.successCount}`);
    console.log(`- Failure count: ${resp.failureCount}`);
    console.log(`- Total responses: ${resp.responses?.length || 0}`);
    
    if (resp.responses && resp.responses.length > 0) {
      console.log(`[NOTIFICATION] 📱 Individual token results:`);
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
      console.log(`[NOTIFICATION] ✅ Final result: SUCCESS - ${resp.successCount}/${tokens.length} messages sent`);
    } else {
      console.error(`[NOTIFICATION] ❌ Final result: ALL FAILED - 0/${tokens.length} messages sent`);
    }
    
    return result;
  } catch (error) {
    console.error(`[NOTIFICATION] 💥 FCM sending error for phone ${phone}:`, error);
    console.error(`[NOTIFICATION] Error details:`, {
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

function statusLabel(status) {
  switch (status) {
    case 'assigned':
      return 'Đã phân công';
    case 'inProgress':
      return 'Đang thực hiện';
    case 'waitPayment':
      return 'Chờ thanh toán';
    case 'completed':
      return 'Hoàn tất';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || 'Cập nhật';
  }
}

async function notifyOrderStatusChange(order, newStatus, extraData = {}) {
  const startTime = new Date();
  console.log(`[NOTIFICATION] ========== START NOTIFICATION PROCESS ==========`);
  console.log(`[NOTIFICATION] Timestamp: ${startTime.toISOString()}`);
  
  if (!order || !order.customerInfo || !order.customerInfo.phone) {
    console.error('[NOTIFICATION] ❌ VALIDATION FAILED: Missing customer phone in order:', order?._id);
    return { 
      success: false, 
      message: 'Missing customer phone',
      orderId: order?._id || 'unknown',
      phone: 'not provided'
    };
  }
  
  const vnStatus = statusLabel(newStatus);
  const title = 'Cập nhật đơn hàng';
  const body = `Đơn ${order._id} đã chuyển sang trạng thái: ${vnStatus}`;
  const data = {
    orderId: String(order._id),
    status: String(newStatus),
    screen: 'RequestDetail',
    ...extraData,
  };
  
  console.log(`[NOTIFICATION] 📋 NOTIFICATION DETAILS:`);
  console.log(`- Order ID: ${order._id}`);
  console.log(`- Customer Phone: ${order.customerInfo.phone}`);
  console.log(`- Status: ${newStatus} → ${vnStatus}`);
  console.log(`- Title: ${title}`);
  console.log(`- Body: ${body}`);
  console.log(`- Data payload:`, JSON.stringify(data, null, 2));
  
  try {
    console.log(`[NOTIFICATION] 🚀 Calling sendToCustomerPhone...`);
    const result = await sendToCustomerPhone(order.customerInfo.phone, title, body, data);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Enhanced result logging
    if (result.success) {
      console.log(`[NOTIFICATION] ✅ SUCCESS - Notification sent successfully!`);
      console.log(`[NOTIFICATION] 📊 RESULT SUMMARY:`);
      console.log(`- Phone: ${order.customerInfo.phone}`);
      console.log(`- Tokens found: ${result.tokens || 0}`);
      console.log(`- Messages sent: ${result.sent || 0}`);
      console.log(`- Messages failed: ${result.failed || 0}`);
      console.log(`- Duration: ${duration}ms`);
      
      if (result.details && result.details.length > 0) {
        console.log(`[NOTIFICATION] 📱 TOKEN DETAILS:`);
        result.details.forEach((detail, index) => {
          if (detail.success) {
            console.log(`  Token ${index + 1}: ✅ SUCCESS (Message ID: ${detail.messageId})`);
          } else {
            console.log(`  Token ${index + 1}: ❌ FAILED (${detail.error?.code}: ${detail.error?.message})`);
          }
        });
      }
    } else {
      console.error(`[NOTIFICATION] ❌ FAILED - Notification could not be sent`);
      console.error(`[NOTIFICATION] 📊 ERROR SUMMARY:`);
      console.error(`- Phone: ${order.customerInfo.phone}`);
      console.error(`- Error Message: ${result.message}`);
      console.error(`- Tokens found: ${result.tokens || 0}`);
      console.error(`- Duration: ${duration}ms`);
      
      if (result.error) {
        console.error(`- Full Error:`, result.error);
      }
      
      if (result.details && result.details.length > 0) {
        console.error(`[NOTIFICATION] 📱 TOKEN ERROR DETAILS:`);
        result.details.forEach((detail, index) => {
          if (!detail.success && detail.error) {
            console.error(`  Token ${index + 1}: ❌ ${detail.error.code} - ${detail.error.message}`);
          }
        });
      }
    }
    
    console.log(`[NOTIFICATION] ========== END NOTIFICATION PROCESS ==========\n`);
    return result;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error(`[NOTIFICATION] 💥 EXCEPTION during notification sending:`);
    console.error(`- Phone: ${order.customerInfo.phone}`);
    console.error(`- Duration: ${duration}ms`);
    console.error(`- Error:`, error);
    console.error(`[NOTIFICATION] ========== END NOTIFICATION PROCESS (WITH ERROR) ==========\n`);
    
    return {
      success: false,
      message: `Exception: ${error.message}`,
      phone: order.customerInfo.phone,
      orderId: order._id,
      error: error
    };
  }
}

async function notifyDetailStatusChange(request, detail, newStatus, extraData = {}) {
  const startTime = new Date();
  console.log(`[NOTIFICATION] ========== START DETAIL NOTIFICATION PROCESS ==========`);
  console.log(`[NOTIFICATION] Timestamp: ${startTime.toISOString()}`);
  
  if (!request || !request.customerInfo || !request.customerInfo.phone) {
    console.error('[NOTIFICATION] ❌ VALIDATION FAILED: Missing customer phone in request:', request?._id);
    return { 
      success: false, 
      message: 'Missing customer phone',
      requestId: request?._id || 'unknown',
      phone: 'not provided'
    };
  }
  
  if (!detail) {
    console.error('[NOTIFICATION] ❌ VALIDATION FAILED: Missing detail information');
    return { 
      success: false, 
      message: 'Missing detail information',
      requestId: request?._id || 'unknown',
      phone: request.customerInfo.phone
    };
  }
  
  const vnStatus = statusLabel(newStatus);
  const title = 'Cập nhật chi tiết công việc';
  
  // Format working date for display
  const workingDate = detail.workingDate ? new Date(detail.workingDate).toLocaleDateString('vi-VN') : 'N/A';
  const startTime_str = detail.startTime ? new Date(detail.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const endTime_str = detail.endTime ? new Date(detail.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  
  const body = `Công việc ngày ${workingDate} (${startTime_str}-${endTime_str}) đã chuyển sang: ${vnStatus}`;
  
  const data = {
    requestId: String(request._id),
    detailId: String(detail._id),
    status: String(newStatus),
    workingDate: workingDate,
    startTime: startTime_str,
    endTime: endTime_str,
    screen: 'RequestDetail',
    ...extraData,
  };
  
  console.log(`[NOTIFICATION] 📋 DETAIL NOTIFICATION DETAILS:`);
  console.log(`- Request ID: ${request._id}`);
  console.log(`- Detail ID: ${detail._id}`);
  console.log(`- Customer Phone: ${request.customerInfo.phone}`);
  console.log(`- Working Date: ${workingDate}`);
  console.log(`- Time: ${startTime_str}-${endTime_str}`);
  console.log(`- Status: ${newStatus} → ${vnStatus}`);
  console.log(`- Title: ${title}`);
  console.log(`- Body: ${body}`);
  console.log(`- Data payload:`, JSON.stringify(data, null, 2));
  
  try {
    console.log(`[NOTIFICATION] 🚀 Calling sendToCustomerPhone...`);
    const result = await sendToCustomerPhone(request.customerInfo.phone, title, body, data);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Enhanced result logging
    if (result.success) {
      console.log(`[NOTIFICATION] ✅ SUCCESS - Detail notification sent successfully!`);
      console.log(`[NOTIFICATION] 📊 RESULT SUMMARY:`);
      console.log(`- Phone: ${request.customerInfo.phone}`);
      console.log(`- Detail ID: ${detail._id}`);
      console.log(`- Tokens found: ${result.tokens || 0}`);
      console.log(`- Messages sent: ${result.sent || 0}`);
      console.log(`- Messages failed: ${result.failed || 0}`);
      console.log(`- Duration: ${duration}ms`);
    } else {
      console.error(`[NOTIFICATION] ❌ FAILED - Detail notification could not be sent`);
      console.error(`[NOTIFICATION] 📊 ERROR SUMMARY:`);
      console.error(`- Phone: ${request.customerInfo.phone}`);
      console.error(`- Detail ID: ${detail._id}`);
      console.error(`- Error Message: ${result.message}`);
      console.error(`- Duration: ${duration}ms`);
    }
    
    console.log(`[NOTIFICATION] ========== END DETAIL NOTIFICATION PROCESS ==========\n`);
    return result;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error(`[NOTIFICATION] 💥 EXCEPTION during detail notification sending:`);
    console.error(`- Phone: ${request.customerInfo.phone}`);
    console.error(`- Detail ID: ${detail._id}`);
    console.error(`- Duration: ${duration}ms`);
    console.error(`- Error:`, error);
    console.error(`[NOTIFICATION] ========== END DETAIL NOTIFICATION PROCESS (WITH ERROR) ==========\n`);
    
    return {
      success: false,
      message: `Exception: ${error.message}`,
      phone: request.customerInfo.phone,
      requestId: request._id,
      detailId: detail._id,
      error: error
    };
  }
}

async function notifyPaymentRequest(request, extraData = {}) {
  const startTime = new Date();
  console.log(`[NOTIFICATION] ========== START PAYMENT NOTIFICATION PROCESS ==========`);
  console.log(`[NOTIFICATION] Timestamp: ${startTime.toISOString()}`);
  
  if (!request || !request.customerInfo || !request.customerInfo.phone) {
    console.error('[NOTIFICATION] ❌ VALIDATION FAILED: Missing customer phone in request:', request?._id);
    return { 
      success: false, 
      message: 'Missing customer phone',
      requestId: request?._id || 'unknown',
      phone: 'not provided'
    };
  }
  
  const title = 'Yêu cầu thanh toán';
  const body = `Tất cả công việc của đơn ${request._id} đã hoàn thành. Vui lòng thực hiện thanh toán.`;
  
  const data = {
    requestId: String(request._id),
    status: 'waitPayment',
    screen: 'Payment',
    ...extraData,
  };
  
  console.log(`[NOTIFICATION] 📋 PAYMENT NOTIFICATION DETAILS:`);
  console.log(`- Request ID: ${request._id}`);
  console.log(`- Customer Phone: ${request.customerInfo.phone}`);
  console.log(`- Title: ${title}`);
  console.log(`- Body: ${body}`);
  console.log(`- Data payload:`, JSON.stringify(data, null, 2));
  
  try {
    console.log(`[NOTIFICATION] 🚀 Calling sendToCustomerPhone...`);
    const result = await sendToCustomerPhone(request.customerInfo.phone, title, body, data);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    if (result.success) {
      console.log(`[NOTIFICATION] ✅ SUCCESS - Payment notification sent successfully!`);
      console.log(`[NOTIFICATION] Duration: ${duration}ms`);
    } else {
      console.error(`[NOTIFICATION] ❌ FAILED - Payment notification could not be sent`);
      console.error(`[NOTIFICATION] Error: ${result.message}, Duration: ${duration}ms`);
    }
    
    console.log(`[NOTIFICATION] ========== END PAYMENT NOTIFICATION PROCESS ==========\n`);
    return result;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error(`[NOTIFICATION] 💥 EXCEPTION during payment notification sending:`);
    console.error(`- Phone: ${request.customerInfo.phone}`);
    console.error(`- Duration: ${duration}ms`);
    console.error(`- Error:`, error);
    console.error(`[NOTIFICATION] ========== END PAYMENT NOTIFICATION PROCESS (WITH ERROR) ==========\n`);
    
    return {
      success: false,
      message: `Exception: ${error.message}`,
      phone: request.customerInfo.phone,
      requestId: request._id,
      error: error
    };
  }
}

async function notifySuccessfulPayment(request, extraData = {}) {
  const startTime = new Date();
  console.log(`[NOTIFICATION] ========== START PAYMENT SUCCESS NOTIFICATION PROCESS ==========`);
  console.log(`[NOTIFICATION] Timestamp: ${startTime.toISOString()}`)

  if (!request || !request.customerInfo || !request.customerInfo.phone) {
    console.error('[NOTIFICATION] ❌ VALIDATION FAILED: Missing customer phone in request:', request?._id);
    return {
      success: false,
      message: 'Missing customer phone',
      requestId: request?._id || 'unknown',
      phone: 'not provided'
    };
  }
  const title = 'Thanh toán thành công';
  const body = `Cảm ơn bạn đã thanh toán cho đơn ${request._id}. Chúng tôi rất vui được phục vụ bạn!`;
  const data = {
    requestId: String(request._id),
    status: 'completed',
    screen: 'RequestDetail',
    ...extraData,
  };
  console.log(`[NOTIFICATION] 📋 PAYMENT SUCCESS NOTIFICATION DETAILS:`)
  console.log(`- Request ID: ${request._id}`)
  console.log(`- Customer Phone: ${request.customerInfo.phone}`)
  console.log(`- Title: ${title}`)
  console.log(`- Body: ${body}`)
  console.log(`- Data payload:`, JSON.stringify(data, null, 2))
  try {
    console.log(`[NOTIFICATION] 🚀 Calling sendToCustomerPhone...`)
    const result = await sendToCustomerPhone(request.customerInfo.phone, title, body, data)
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    if (result.success) {
      console.log(`[NOTIFICATION] ✅ SUCCESS - Payment success notification sent successfully!`)
      console.log(`[NOTIFICATION] Duration: ${duration}ms`)
      } else {
        console.error(`[NOTIFICATION] ❌ FAILED - Payment success notification could not be sent`)
        console.error(`[NOTIFICATION] Error: ${result.message}, Duration: ${duration}ms`)
        }
        console.log(`[NOTIFICATION] ========== END PAYMENT SUCCESS NOTIFICATION PROCESS ==========\n`)
        return result
        } catch (error) {
        const endTime = new Date()
        const duration = endTime.getTime() - startTime.getTime()
        console.error(`[NOTIFICATION] 💥 EXCEPTION during payment success notification sending:`)
        console.error(`- Phone: ${request.customerInfo.phone}`)
        console.error(`- Duration: ${duration}ms`)
        console.error(`- Error:`, error)
        console.error(`[NOTIFICATION] ========== END PAYMENT SUCCESS NOTIFICATION PROCESS (WITH ERROR) ==========\n`)
        return {
        success: false,
        message: `Exception: ${error.message}`,
        phone: request.customerInfo.phone,
        requestId: request._id,
        error: error
    }
  }
}

module.exports = {
  sendToCustomerPhone,
  notifyOrderStatusChange,
  notifyDetailStatusChange,
  notifyPaymentRequest,
  checkNotificationHealth,
  notifySuccessfulPayment
};
