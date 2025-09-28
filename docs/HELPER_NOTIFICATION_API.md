# Helper Notification API Documentation

## Tổng quan
API này cho phép gửi push notifications đến các helper trong hệ thống Homecare. Hệ thống hỗ trợ gửi thông báo qua phone number hoặc helper_id.

## Base URL
```
/api/helper-notifications
```

## Authentication
Hiện tại các endpoint chưa yêu cầu authentication. Có thể thêm middleware auth sau này.

---

## 1. Đăng ký Device Token

### 1.1 Đăng ký token thiết bị helper
- **Endpoint**: `POST /helper-notifications/register`
- **Description**: Đăng ký token thiết bị để helper nhận thông báo push
- **Authentication**: Không cần

**Request Body:**
```json
{
  "token": "firebase_device_token_here",
  "helper_id": "H001", 
  "phone": "0987654321",
  "platform": "android"
}
```

**Validation Rules:**
- `token`: Bắt buộc, token thiết bị từ Firebase
- `helper_id`: Không bắt buộc, ID của helper
- `phone`: Không bắt buộc, số điện thoại helper
- `platform`: Không bắt buộc, loại thiết bị ("android", "ios", "web", "unknown")
- **Lưu ý**: Cần có ít nhất một trong `helper_id` hoặc `phone`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Helper device token registered successfully",
  "data": {
    "id": "token_id_here",
    "helper_id": "H001",
    "phone": "0987654321",
    "platform": "android",
    "topics": [],
    "lastSeenAt": "2025-09-28T10:30:00.000Z"
  }
}
```

---

## 2. Gửi Thông Báo

### 2.1 Gửi thông báo đến helper bằng phone
- **Endpoint**: `POST /helper-notifications/send/phone`
- **Description**: Gửi push notification đến helper thông qua số điện thoại

**Request Body:**
```json
{
  "phone": "0987654321",
  "title": "Công việc mới",
  "body": "Bạn có một công việc mới cần thực hiện",
  "data": {
    "requestId": "req123",
    "type": "job_assigned",
    "screen": "JobDetail"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "phone": "0987654321",
    "sent": 1,
    "failed": 0,
    "tokens": 1
  },
  "details": [
    {
      "tokenIndex": 0,
      "success": true,
      "messageId": "0:1234567890"
    }
  ]
}
```

### 2.2 Gửi thông báo đến helper bằng helper_id
- **Endpoint**: `POST /helper-notifications/send/helper-id`
- **Description**: Gửi push notification đến helper thông qua helper_id

**Request Body:**
```json
{
  "helper_id": "H001",
  "title": "Cập nhật trạng thái",
  "body": "Trạng thái công việc của bạn đã được cập nhật",
  "data": {
    "requestId": "req123",
    "status": "completed"
  }
}
```

### 2.3 Gửi thông báo đến token cụ thể
- **Endpoint**: `POST /helper-notifications/send/token`
- **Description**: Gửi notification trực tiếp đến một device token

**Request Body:**
```json
{
  "token": "firebase_device_token_here",
  "title": "Thông báo khẩn",
  "body": "Nội dung thông báo khẩn cấp",
  "data": {
    "priority": "high",
    "action": "immediate"
  }
}
```

### 2.4 Gửi thông báo broadcast (topic)
- **Endpoint**: `POST /helper-notifications/send/topic`
- **Description**: Gửi notification đến tất cả helpers đã subscribe topic

**Request Body:**
```json
{
  "topic": "all-helpers",
  "title": "Thông báo hệ thống",
  "body": "Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng",
  "data": {
    "type": "system_maintenance",
    "start_time": "02:00",
    "end_time": "04:00"
  }
}
```

---

## 3. Topic Subscription

### 3.1 Subscribe vào topic
- **Endpoint**: `POST /helper-notifications/subscribe`
- **Description**: Đăng ký helper nhận thông báo từ một topic

**Request Body:**
```json
{
  "token": "firebase_device_token_here",
  "topic": "urgent-jobs"
}
```

### 3.2 Unsubscribe khỏi topic
- **Endpoint**: `POST /helper-notifications/unsubscribe`
- **Description**: Hủy đăng ký helper khỏi một topic

**Request Body:**
```json
{
  "token": "firebase_device_token_here",
  "topic": "urgent-jobs"
}
```

---

## 4. Kiểm Tra và Test

### 4.1 Test notification
- **Endpoint**: `POST /helper-notifications/test`
- **Description**: Gửi thông báo test để kiểm tra hệ thống

**Request Body:**
```json
{
  "phone": "0987654321",
  "title": "Test Helper Notification",
  "body": "This is a test message for helper",
  "data": {
    "test": "true"
  }
}
```

**Hoặc test bằng helper_id:**
```json
{
  "helper_id": "H001",
  "title": "Test Helper Notification",
  "body": "This is a test message for helper"
}
```

### 4.2 Kiểm tra trạng thái token
- **Endpoint**: `GET /helper-notifications/check/{identifier}?type={type}`
- **Description**: Kiểm tra trạng thái token của helper
- **Parameters**: 
  - `identifier`: phone number hoặc helper_id
  - `type`: "phone" hoặc "helper_id" (mặc định là "phone")

**Ví dụ:**
```
GET /helper-notifications/check/0987654321?type=phone
GET /helper-notifications/check/H001?type=helper_id
```

**Response Success (200):**
```json
{
  "success": true,
  "identifier": "0987654321",
  "type": "phone",
  "totalTokens": 2,
  "tokens": [
    {
      "token": "firebase_token_1...",
      "platform": "android",
      "lastSeenAt": "2025-09-28T10:30:00.000Z",
      "topics": ["urgent-jobs"],
      "helper_id": "H001",
      "phone": "0987654321"
    }
  ],
  "canReceiveNotifications": true
}
```

### 4.3 Health check
- **Endpoint**: `GET /helper-notifications/health`
- **Description**: Kiểm tra trạng thái sức khỏe của hệ thống helper notification

**Response Success (200):**
```json
{
  "success": true,
  "message": "Helper notification system is healthy",
  "timestamp": "2025-09-28T10:30:00.000Z",
  "health": {
    "firebase": true,
    "database": true,
    "totalTokens": 150,
    "uniqueHelperIds": 75,
    "uniquePhones": 75
  },
  "recommendations": []
}
```

---

## 5. Sử dụng trong Code

### 5.1 Import utilities
```javascript
const { 
  sendToHelperPhone, 
  sendToHelperId,
  notifyHelperJobAssigned,
  notifyHelperJobStatusChange,
  notifyHelperJobCancelled
} = require('../utils/helperNotifications');

const HelperNotificationHelper = require('../utils/helperNotificationHelper');
```

### 5.2 Gửi thông báo công việc mới
```javascript
// Khi phân công công việc cho helper
await notifyHelperJobAssigned(request, helper, {
  priority: 'high',
  deadline: '2025-09-29T15:00:00Z'
});
```

### 5.3 Cập nhật trạng thái công việc
```javascript
// Khi thay đổi trạng thái công việc
await notifyHelperJobStatusChange(request, helper, 'inProgress', {
  updatedBy: 'system',
  updateTime: new Date().toISOString()
});
```

### 5.4 Sử dụng Helper class
```javascript
// Gửi và kiểm tra kết quả
const result = await HelperNotificationHelper.sendWithCheckByPhone(
  helper.phone, 
  'Công việc mới', 
  'Bạn có công việc mới',
  { requestId: 'req123' }
);

if (HelperNotificationHelper.isSuccess(result)) {
  console.log('Notification sent successfully');
  const stats = HelperNotificationHelper.getStats(result);
  console.log(`Sent to ${stats.sent}/${stats.total} devices`);
}
```

---

## 6. Error Handling

### Common Error Codes:
- `400`: Thiếu tham số bắt buộc
- `500`: Lỗi Firebase hoặc database
- `503`: Hệ thống notification không khỏe mạnh

### Firebase Error Codes:
- `messaging/registration-token-not-registered`: Token đã hết hạn
- `messaging/invalid-registration-token`: Token không hợp lệ
- `messaging/messaging-payload-error`: Payload không đúng định dạng

---

## 7. Data Schema

### HelperDeviceToken Model:
```javascript
{
  helperId: ObjectId,      // Reference đến Helper
  helper_id: String,       // Helper ID (như H001)
  phone: String,           // Số điện thoại helper
  token: String,           // Firebase device token
  platform: String,       // "ios", "android", "web", "unknown"
  topics: [String],        // Danh sách topics đã subscribe
  lastSeenAt: Date,        // Lần cuối active
  createdAt: Date,
  updatedAt: Date
}
```