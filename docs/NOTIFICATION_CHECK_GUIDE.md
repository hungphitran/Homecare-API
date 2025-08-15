# Hướng Dẫn Kiểm Tra Thông Báo (Notification Check)

## Tổng quan
Hệ thống đã được nâng cấp để có thể kiểm tra xem thông báo đã được gửi thành công hay chưa.

## Các cách kiểm tra thông báo

### 1. Kiểm tra qua Log
Khi gửi thông báo, hệ thống sẽ tự động log thông tin chi tiết:

```
[NOTIFICATION] Sending to phone 0123456789 with 2 token(s)
[NOTIFICATION] Results for phone 0123456789:
- Success count: 1
- Failure count: 1
- Token 1: SUCCESS (MessageId: projects/your-project/messages/xyz)
- Token 2: FAILED (Error: messaging/registration-token-not-registered - The registration token is not a valid FCM registration token)
```

### 2. Sử dụng NotificationHelper

```javascript
const NotificationHelper = require('../utils/notificationHelper');

// Gửi notification với kiểm tra kết quả
const result = await NotificationHelper.sendWithCheck(
    '0123456789', 
    'Test Title', 
    'Test Body',
    { orderId: '123' }
);

// Kiểm tra kết quả
if (NotificationHelper.isSuccess(result)) {
    console.log('Thông báo đã gửi thành công!');
} else {
    console.log('Thông báo gửi thất bại!');
}

// Lấy thống kê
const stats = NotificationHelper.getStats(result);
console.log(`Tỷ lệ thành công: ${stats.successRate}%`);
console.log(`Đã gửi: ${stats.sent}, Thất bại: ${stats.failed}`);
```

### 3. API Endpoints mới

#### Test Notification
```
POST /api/notification/test
Body: {
    "phone": "0123456789",
    "title": "Test Notification",
    "body": "This is a test message",
    "data": { "key": "value" }
}

Response: {
    "success": true,
    "message": "Notification sent successfully",
    "stats": {
        "total": 2,
        "sent": 1,
        "failed": 1,
        "successRate": 50,
        "phone": "0123456789"
    },
    "details": [...],
    "hasFailures": true
}
```

#### Kiểm tra Token Status
```
GET /api/notification/check/0123456789

Response: {
    "success": true,
    "phone": "0123456789",
    "totalTokens": 2,
    "tokens": [
        {
            "token": "abc123...",
            "platform": "android",
            "lastSeenAt": "2025-08-15T10:00:00.000Z",
            "topics": ["general"]
        }
    ],
    "canReceiveNotifications": true
}
```

## Cấu trúc Response Chi tiết

### Thành công
```javascript
{
    success: true,
    sent: 2,           // Số lượng gửi thành công
    failed: 0,         // Số lượng gửi thất bại
    phone: "0123456789",
    tokens: 2,         // Tổng số token
    details: [
        {
            tokenIndex: 0,
            success: true,
            messageId: "projects/your-project/messages/xyz",
            error: null
        }
    ]
}
```

### Thất bại
```javascript
{
    success: false,
    message: "No device tokens for this phone",
    phone: "0123456789",
    tokens: 0
}
```

## Các lỗi thường gặp

### 1. Không có Device Token
- **Lỗi**: `No device tokens for this phone`
- **Giải pháp**: Người dùng cần đăng ký device token qua `/api/notification/register`

### 2. Token không hợp lệ
- **Lỗi**: `messaging/registration-token-not-registered`
- **Giải pháp**: Token đã hết hạn hoặc app đã được gỡ cài đặt. Cần xóa token cũ và đăng ký lại.

### 3. Firebase chưa được cấu hình
- **Lỗi**: `Firebase not initialized`
- **Giải pháp**: Kiểm tra file `service_account.json` và cấu hình Firebase

## Best Practices

1. **Luôn kiểm tra kết quả** sau khi gửi notification
2. **Log chi tiết** để debug khi có vấn đề
3. **Xử lý token hết hạn** bằng cách xóa token không hợp lệ
4. **Retry logic** cho các lỗi tạm thời
5. **Monitor success rate** để đánh giá hiệu quả

## Ví dụ sử dụng trong RequestController

```javascript
// Trong requestController.js
const NotificationHelper = require('../utils/notificationHelper');

// Gửi notification với kiểm tra
const notificationResult = await NotificationHelper.sendWithCheck(
    request.customerInfo.phone,
    'Cập nhật đơn hàng',
    `Đơn ${request._id} đã được xác nhận`,
    { orderId: request._id, status: 'confirm' }
);

if (NotificationHelper.isSuccess(notificationResult)) {
    console.log('Khách hàng đã nhận được thông báo');
} else {
    console.log('Không thể gửi thông báo đến khách hàng');
    // Có thể lưu vào queue để retry sau
}

// Trả về thông tin notification trong response
const response = {
    success: true,
    data: request,
    ...NotificationHelper.createResponse(notificationResult)
};
```
