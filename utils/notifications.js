const { initFirebase } = require('./firebase');
const DeviceToken = require('../model/deviceToken.model');

function coerceDataToStrings(data) {
  if (!data) return undefined;
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
}

async function getTokensByPhone(phone) {
  const tokens = await DeviceToken.find({ phone }).distinct('token');
  return tokens.filter(Boolean);
}

async function sendToCustomerPhone(phone, title, body, data) {
  let admin;
  try {
    admin = initFirebase();
  } catch (e) {
    console.warn('Firebase not initialized for notifications:', e?.message || e);
    throw new Error('Firebase not initialized');
  }

  const tokens = await getTokensByPhone(phone);
  if (!tokens || tokens.length === 0) {
    console.log(`[NOTIFICATION] No device tokens found for phone: ${phone}`);
    return { success: false, message: 'No device tokens for this phone', phone };
  }

  console.log(`[NOTIFICATION] Sending to phone ${phone} with ${tokens.length} token(s)`);
  
  const payload = {
    tokens,
    notification: { title, body },
    data: coerceDataToStrings(data),
  };

  try {
    const resp = await admin.messaging().sendEachForMulticast(payload);
    
    // Log detailed results
    console.log(`[NOTIFICATION] Results for phone ${phone}:`);
    console.log(`- Success count: ${resp.successCount}`);
    console.log(`- Failure count: ${resp.failureCount}`);
    
    if (resp.responses && resp.responses.length > 0) {
      resp.responses.forEach((response, index) => {
        if (response.success) {
          console.log(`- Token ${index + 1}: SUCCESS (MessageId: ${response.messageId})`);
        } else {
          console.log(`- Token ${index + 1}: FAILED (Error: ${response.error?.code} - ${response.error?.message})`);
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
        success: r.success,
        messageId: r.messageId || null,
        error: r.error ? { code: r.error.code, message: r.error.message } : null
      }))
    };
    
    return result;
  } catch (error) {
    console.error(`[NOTIFICATION] Error sending to phone ${phone}:`, error);
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
    case 'confirm':
      return 'Đã xác nhận';
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
  if (!order || !order.customerInfo || !order.customerInfo.phone) {
    console.log('[NOTIFICATION] Missing customer phone in order:', order?._id);
    return { success: false, message: 'Missing customer phone' };
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
  
  console.log(`[NOTIFICATION] Sending order status change notification:`);
  console.log(`- Order ID: ${order._id}`);
  console.log(`- Phone: ${order.customerInfo.phone}`);
  console.log(`- Status: ${newStatus} (${vnStatus})`);
  
  const result = await sendToCustomerPhone(order.customerInfo.phone, title, body, data);
  
  // Log final result
  if (result.success) {
    console.log(`[NOTIFICATION] Order status notification sent successfully to ${order.customerInfo.phone}`);
  } else {
    console.log(`[NOTIFICATION] Failed to send order status notification to ${order.customerInfo.phone}: ${result.message}`);
  }
  
  return result;
}

module.exports = {
  sendToCustomerPhone,
  notifyOrderStatusChange,
};
