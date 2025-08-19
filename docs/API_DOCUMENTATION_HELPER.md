# API Documentation for Helpers (Tài liệu API cho Helper)

## Base URL

## Authentication (Xác thực)
- Tất cả API dành cho helper đều yêu cầu JWT token
- Token được trả về sau khi đăng nhập thành công
- Sử dụng token trong header: `Authorization: Bearer <token>`

## 1. Authentication APIs

### 1.1 Đăng nhập
- **Endpoint**: `POST /auth/login/helper`
- **Description**: Đăng nhập tài khoản helper
- **Authentication**: Không cần

**Request Body:**
```json
{
  "phone": "0987654321",
  "password": "helper123"
}
```

**Response Success (200):**
```json
{
  "message": "Đăng nhập thành công",
  "token": "jwt_token_here",
  "helper": {
    "phone": "0987654321",
    "fullName": "Trần Thị B",
    "role": "helper"
  }
}
```

### 1.2 Đổi mật khẩu
- **Endpoint**: `POST /auth/change-password`
- **Description**: Thay đổi mật khẩu tài khoản
- **Authentication**: Bắt buộc

**Request Body:**
```json
{
  "currentPassword": "helper123",
  "newPassword": "newHelper456"
}
```

## 2. Request Management APIs (Quản lý đơn hàng)

### 2.1 Lấy danh sách đơn hàng khả dụng (chưa có helper)
- **Endpoint**: `GET /request`
- **Description**: Lấy danh sách đơn hàng chưa có helper nào được gán mà helper có thể nhận
- **Authentication**: Bắt buộc (helper only)
- **Logic**: Chỉ hiển thị các requestDetail mà:
  - Status = "pending" và helper_id = null (chưa có helper nào được gán)
  - Thời gian bắt đầu cách hiện tại tối đa 2 giờ

**Response Success (200):**
```json
[
  {
    "_id": "request_id",
    "serviceTitle": "Dọn dẹp nhà cửa",
    "serviceLocation": {
      "address": "123 Đường ABC, TP.HCM",
      "coordinates": [106.7, 10.8]
    },
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567"
    },
    "totalCost": 450000,
    "status": "pending",
    "schedules": [
      {
        "_id": "schedule_id",
        "workingDate": "2025-08-20T00:00:00.000Z",
        "startTime": "2025-08-20T01:00:00.000Z",
        "endTime": "2025-08-20T05:00:00.000Z",
        "helper_id": null,
        "cost": 250000,
        "status": "pending",
        "helper_cost": 180000
      }
    ]
  }
]
```

### 2.2 Lấy danh sách đơn hàng đã được gán cho helper
- **Endpoint**: `GET /request/my-assigned`
- **Description**: Lấy danh sách đơn hàng mà helper hiện tại đã được gán
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
[
  {
    "_id": "request_id",
    "serviceTitle": "Dọn dẹp nhà cửa",
    "serviceLocation": {
      "address": "123 Đường ABC, TP.HCM",
      "coordinates": [106.7, 10.8]
    },
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567"
    },
    "totalCost": 450000,
    "status": "pending",
    "schedules": [
      {
        "_id": "schedule_id",
        "workingDate": "2025-08-20T00:00:00.000Z",
        "startTime": "2025-08-20T01:00:00.000Z",
        "endTime": "2025-08-20T05:00:00.000Z",
        "helper_id": "current_helper_id",
        "cost": 250000,
        "status": "assigned",
        "helper_cost": 180000
      }
    ]
  }
]
```

### 2.3 Nhận đơn hàng
- **Endpoint**: `POST /request/assign`
- **Description**: Nhận (assign) một requestDetail cụ thể vào tài khoản helper hiện tại (chỉ có thể assign requestDetail có thời gian bắt đầu trong vòng 2 giờ)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id"
}
```

**Response Success (200):**
```json
{
  "message": "Successfully assigned to requestDetail",
  "requestDetail": {
    "_id": "requestDetail_id",
    "helper_id": "helper_id",
    "status": "assigned"
  }
}
```

### 2.3 Bắt đầu làm việc
- **Endpoint**: `POST /request/processing`
- **Description**: Đánh dấu bắt đầu thực hiện công việc (chuyển trạng thái từ assigned -> inProgress)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "schedule_id"
}
```

**Response Success (200):**
```json
{
  "message": "Đã bắt đầu thực hiện công việc",
  "status": "inProgress"
}
```

### 2.4 Hoàn thành công việc
- **Endpoint**: `POST /request/finish`
- **Description**: Đánh dấu hoàn thành công việc (chuyển trạng thái từ inProgress -> waitPayment)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "schedule_id",
  "comment": {
    "review": "Đã hoàn thành tốt công việc",
    "loseThings": false,
    "breakThings": false
  }
}
```

**Response Success (200):**
```json
{
  "message": "Đã hoàn thành công việc, chờ thanh toán",
  "status": "waitPayment"
}
```

### 2.5 Xác nhận thanh toán
- **Endpoint**: `POST /request/finishpayment`
- **Description**: Xác nhận đã nhận được thanh toán (chuyển trạng thái từ waitPayment -> completed)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "schedule_id",
  "paymentMethod": "cash"
}
```

**Response Success (200):**
```json
{
  "message": "Đã xác nhận thanh toán, đơn hàng hoàn tất",
  "status": "completed"
}
```

## 3. RequestDetail Management APIs

### 3.1 Lấy chi tiết một requestDetail
- **Endpoint**: `GET /requestDetail/{id}`
- **Description**: Lấy chi tiết thông tin của một requestDetail
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
{
  "_id": "schedule_id",
  "workingDate": "2025-08-20T00:00:00.000Z",
  "startTime": "2025-08-20T01:00:00.000Z",
  "endTime": "2025-08-20T05:00:00.000Z",
  "helper_id": "helper_id",
  "cost": 250000,
  "helper_cost": 180000,
  "status": "pending",
  "comment": {
    "review": "",
    "loseThings": false,
    "breakThings": false
  }
}
```

### 3.2 Cập nhật requestDetail
- **Endpoint**: `PATCH /requestDetail/{id}`
- **Description**: Cập nhật thông tin requestDetail (chỉ helper được assign mới được cập nhật)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "comment": {
    "review": "Công việc được thực hiện tốt",
    "loseThings": false,
    "breakThings": false
  }
}
```

## 4. Time Off Management APIs (Quản lý nghỉ phép)

### 4.1 Đăng ký nghỉ phép
- **Endpoint**: `POST /timeOff`
- **Description**: Đăng ký lịch nghỉ phép
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "startDate": "2025-08-25",
  "endDate": "2025-08-27",
  "reason": "Nghỉ phép cá nhân",
  "isFullDay": true
}
```

**Response Success (201):**
```json
{
  "message": "Đăng ký nghỉ phép thành công",
  "timeOff": {
    "_id": "timeoff_id",
    "startDate": "2025-08-25T00:00:00.000Z",
    "endDate": "2025-08-27T00:00:00.000Z",
    "status": "pending"
  }
}
```

### 4.2 Lấy danh sách nghỉ phép
- **Endpoint**: `GET /timeOff`
- **Description**: Lấy danh sách lịch nghỉ phép của helper
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
[
  {
    "_id": "timeoff_id",
    "startDate": "2025-08-25T00:00:00.000Z",
    "endDate": "2025-08-27T00:00:00.000Z",
    "reason": "Nghỉ phép cá nhân",
    "status": "approved",
    "isFullDay": true
  }
]
```

### 4.3 Hủy nghỉ phép
- **Endpoint**: `DELETE /timeOff/{id}`
- **Description**: Hủy đăng ký nghỉ phép (chỉ được hủy khi status = pending)
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
{
  "message": "Hủy nghỉ phép thành công"
}
```

## 5. Notification APIs (Thông báo)

### 5.1 Lấy danh sách thông báo
- **Endpoint**: `GET /notifications`
- **Description**: Lấy danh sách thông báo của helper
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
[
  {
    "_id": "notification_id",
    "title": "Đơn hàng mới",
    "message": "Có đơn hàng mới phù hợp với bạn",
    "type": "new_request",
    "isRead": false,
    "createdAt": "2025-08-15T10:00:00.000Z",
    "data": {
      "requestId": "request_id"
    }
  }
]
```

### 5.2 Đánh dấu đã đọc thông báo
- **Endpoint**: `PATCH /notifications/{id}/read`
- **Description**: Đánh dấu thông báo đã được đọc
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
{
  "message": "Đã đánh dấu thông báo đã đọc"
}
```

## 6. Public APIs (Helper có thể xem)

### 6.1 Lấy thông tin dịch vụ
- **Endpoint**: `GET /service`
- **Description**: Lấy danh sách dịch vụ có sẵn
- **Authentication**: Không cần

### 6.2 Lấy thông tin chung
- **Endpoint**: `GET /general`
- **Description**: Lấy thông tin cài đặt chung (giờ làm việc, lương cơ bản, v.v.)
- **Authentication**: Không cần

## Work Flow (Quy trình làm việc)

### 1. Nhận và thực hiện đơn hàng:
```
pending -> assign -> assigned -> processing -> inProgress -> finish -> waitPayment -> finishpayment -> completed
```

### 2. Các trạng thái chi tiết:
- **pending**: RequestDetail chưa có helper
- **assigned**: Helper đã được gán cho RequestDetail
- **inProgress**: Đang thực hiện công việc
- **waitPayment**: Chờ thanh toán
- **completed**: Hoàn tất
- **cancelled**: Đã hủy

### 3. Quy trình thực hiện:
1. **Xem đơn khả dụng**: `GET /request` - Chỉ hiển thị requestDetail chưa có helper và có thời gian bắt đầu trong vòng 2 giờ
2. **Xem đơn đã nhận**: `GET /request/my-assigned` - Xem các requestDetail đã được gán cho helper hiện tại
3. **Nhận đơn**: `POST /request/assign` - Gửi detailId để assign requestDetail cụ thể
4. **Bắt đầu làm việc**: `POST /request/processing`
5. **Hoàn thành**: `POST /request/finish`
6. **Xác nhận thanh toán**: `POST /request/finishpayment`

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad request",
  "message": "Dữ liệu gửi lên không hợp lệ"
}
```

**Hoặc khi thời gian không hợp lệ:**
```json
{
  "error": "Cannot assign: work time is not within 2 hours window",
  "message": "Không thể nhận đơn: thời gian làm việc không nằm trong khung 2 giờ"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required",
  "message": "Vui lòng cung cấp token xác thực"
}
```

### 403 Forbidden
```json
{
  "error": "Helper access required",
  "message": "Chỉ helper mới có thể truy cập endpoint này"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Không tìm thấy tài nguyên"
}
```

### 409 Conflict
```json
{
  "error": "Request already assigned",
  "message": "Đơn hàng đã được helper khác nhận"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Cannot process request",
  "message": "Không thể thực hiện hành động này trong trạng thái hiện tại"
}
```

## Usage Examples

### Quy trình làm việc hoàn chỉnh:

1. **Đăng nhập:**
```bash
curl -X POST http://localhost:3000/api/auth/login/helper \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0987654321",
    "password": "helper123"
  }'
```

2. **Xem đơn hàng khả dụng:**
```bash
curl -X GET http://localhost:3000/api/request \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Nhận đơn hàng:**
```bash
curl -X POST http://localhost:3000/api/request/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "detailId": "schedule_id"
  }'
```

4. **Bắt đầu làm việc:**
```bash
curl -X POST http://localhost:3000/api/request/processing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "detailId": "schedule_id"
  }'
```

5. **Hoàn thành công việc:**
```bash
curl -X POST http://localhost:3000/api/request/finish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "detailId": "schedule_id",
    "comment": {
      "review": "Đã hoàn thành tốt công việc",
      "loseThings": false,
      "breakThings": false
    }
  }'
```

6. **Xác nhận thanh toán:**
```bash
curl -X POST http://localhost:3000/api/request/finishpayment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "detailId": "schedule_id",
    "paymentMethod": "cash"
  }'
```

## Notes (Lưu ý quan trọng)

1. **Thời gian hiển thị đơn**: Chỉ hiển thị các đơn chưa có helper và sắp bắt đầu trong 30-60 phút
2. **Không thể nhận đơn đã có helper**: System sẽ trả về lỗi 409 nếu đơn đã được nhận
3. **Quy trình bắt buộc**: Phải theo đúng trình tự trạng thái, không thể bỏ qua bước nào
4. **Thời gian thực**: Thông báo real-time khi có đơn hàng mới phù hợp
5. **Bảo mật**: Chỉ được thao tác trên đơn hàng của chính mình
6. **Nghỉ phép**: Cần đăng ký nghỉ phép trước, không nhận đơn trong thời gian nghỉ
7. **Rating**: Đánh giá từ khách hàng sẽ ảnh hưởng đến khả năng nhận đơn tương lai

## Helper Mobile App Integration

### Push Notifications:
- Thông báo khi có đơn hàng mới phù hợp
- Nhắc nhở khi sắp đến giờ làm việc
- Cập nhật trạng thái đơn hàng từ khách hàng

### Real-time Updates:
- WebSocket connection để cập nhật trạng thái real-time
- Đồng bộ dữ liệu khi có thay đổi từ khách hàng hoặc admin
- Thông báo khi khách hàng hủy đơn
