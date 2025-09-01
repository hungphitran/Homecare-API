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
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "id": "helper_id_here",
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

**Response Success (200):**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

### 1.3 Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Description**: Làm mới access token bằng refresh token
- **Authentication**: Không cần (sử dụng refresh token)

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token_here"
}
```

**Response Success (200):**
```json
{
  "accessToken": "new_jwt_access_token_here",
  "refreshToken": "new_jwt_refresh_token_here"
}
```

## 2. Request Management APIs (Quản lý đơn hàng)

### 2.1 Lấy danh sách đơn hàng khả dụng (chưa có helper)
- **Endpoint**: `GET /request`
- **Description**: Lấy danh sách đơn hàng chưa có helper nào được gán mà helper có thể nhận
- **Authentication**: Bắt buộc (helper only)
- **Logic**: Chỉ hiển thị các requestDetail mà:
  - Status = "pending" và helper_id = "notAvailable" (chưa có helper nào được gán)
  - Thời gian bắt đầu cách hiện tại tối đa 2 giờ
  - Thời gian bắt đầu trong tương lai (không phải trong quá khứ)

**Response Success (200):**
```json
[
  {
    "_id": "request_id",
    "service": {
      "title": "Dọn dẹp nhà cửa"
    },
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567"
    },
    "totalCost": 450000,
    "orderDate": "2025-08-20", 
    "startTime": "2025-08-20T08:00:00.000Z",
    "endTime": "2025-08-20T12:00:00.000Z",
    "status": "pending",
    "schedules": [
      {
        "_id": "schedule_id",
        "workingDate": "2025-08-20",
        "startTime": "2025-08-20T08:00:00.000Z",
        "endTime": "2025-08-20T12:00:00.000Z",
        "helper_id": "notAvailable",
        "cost": 250000,
        "status": "pending",
        "helper_cost": 180000
      }
    ]
  }
]
```

**Lưu ý:**
- Tất cả thời gian trả về cho client đều đã được chuyển đổi sang múi giờ Việt Nam (UTC+7)
- Các trường thời gian (startTime, endTime, workingDate, orderDate) được chuyển đổi sử dụng hàm `convertUTCToVietnamTime` và `convertUTCToVietnamDate`
- Chỉ hiển thị schedules có workingDate từ ngày hiện tại trở đi
- Chỉ hiển thị schedules có thời gian bắt đầu trong khoảng từ hiện tại đến 2 giờ sau

### 2.2 Lấy danh sách đơn hàng đã được gán cho helper
- **Endpoint**: `GET /request/my-assigned`
- **Description**: Lấy danh sách đơn hàng mà helper hiện tại đã được gán
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
[
  {
    "_id": "request_id",
    "service": {
      "title": "Dọn dẹp nhà cửa"
    },
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567"
    },
    "totalCost": 450000,
    "orderDate": "2025-08-20", 
    "startTime": "2025-08-20T08:00:00.000Z",
    "endTime": "2025-08-20T12:00:00.000Z",
    "status": "assigned",
    "schedules": [
      {
        "_id": "schedule_id",
        "workingDate": "2025-08-20",
        "startTime": "2025-08-20T08:00:00.000Z",
        "endTime": "2025-08-20T12:00:00.000Z",
        "helper_id": "current_helper_id",
        "cost": 250000,
        "status": "assigned",
        "helper_cost": 180000
      }
    ]
  }
]
```

**Lưu ý:**
- API này chỉ hiển thị các schedule mà helper_id khớp với ID của helper đang đăng nhập
- Thời gian cũng được chuyển đổi sang múi giờ Việt Nam (UTC+7)

### 2.3 Nhận đơn hàng (Assign)
- **Endpoint**: `POST /request/assign`
- **Description**: Nhận (assign) một requestDetail cụ thể vào tài khoản helper hiện tại
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id_here"
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của requestDetail cần nhận
- RequestDetail phải có status = "pending" 
- Helper_id phải là "notAvailable"
- Thời gian bắt đầu công việc phải trong khoảng từ hiện tại đến 2 giờ sau

**Response Success (200):**
```json
{
  "message": "Successfully assigned to requestDetail",
  "requestDetail": {
    "_id": "requestDetail_id_here",
    "helper_id": "helper_id_here",
    "status": "assigned"
  },
  "notification": {
    "sent": true,
    "message": "Notification sent successfully"
  }
}
```

**Response Errors:**
- `400`: Work time is not within 2 hours window
- `500`: RequestDetail is not available for assignment
- `500`: Cannot find requestDetail

**Lưu ý:**
- API này chuyển trạng thái RequestDetail từ "pending" -> "assigned"
- Helper_id sẽ được cập nhật từ "notAvailable" thành ID của helper đang đăng nhập
- Hệ thống sẽ gửi thông báo cho customer khi có helper nhận đơn

### 2.4 Bắt đầu làm việc  
- **Endpoint**: `POST /request/processing`
- **Description**: Đánh dấu bắt đầu thực hiện công việc (chuyển trạng thái từ assigned -> inProgress)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id_here"
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của requestDetail cần bắt đầu
- RequestDetail phải có status = "assigned"

**Response Success (200):**
```json
{
  "message": "Đã bắt đầu thực hiện công việc"
}
```

**Lưu ý:**
- Chuyển trạng thái RequestDetail từ "assigned" -> "inProgress"
- Nếu Request cha đang có status = "pending", sẽ được chuyển thành "inProgress"
- Hệ thống sẽ gửi thông báo cho customer khi helper bắt đầu làm việc

### 2.5 Hoàn thành công việc
- **Endpoint**: `POST /request/finish`
- **Description**: Đánh dấu hoàn thành công việc (chuyển trạng thái từ inProgress -> waitPayment)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id_here",
  "comment": {
    "review": "Đã hoàn thành tốt công việc",
    "loseThings": false,
    "breakThings": false
  }
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của requestDetail cần hoàn thành
- RequestDetail phải có status = "inProgress"
- `comment`: Không bắt buộc, thông tin bổ sung về công việc

**Response Success (200):**
```json
{
  "message": "Đã hoàn thành công việc, chờ thanh toán"
}
```

**Lưu ý:**
- Chuyển trạng thái RequestDetail từ "inProgress" -> "waitPayment"
- Nếu tất cả RequestDetail của Request cha đều ở trạng thái "waitPayment", "completed", hoặc "cancelled", Request sẽ chuyển thành "waitPayment"
- Hệ thống sẽ gửi thông báo cho customer khi helper hoàn thành công việc

### 2.6 Xác nhận thanh toán
- **Endpoint**: `POST /request/finishpayment`
- **Description**: Xác nhận đã nhận thanh toán (chuyển trạng thái từ waitPayment -> completed)
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id_here"
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của requestDetail cần xác nhận thanh toán
- RequestDetail phải có status = "waitPayment"

**Response Success (200):**
```json
{
  "message": "Đã xác nhận thanh toán"
}
```

**Lưu ý:**
- Chuyển trạng thái RequestDetail từ "waitPayment" -> "completed"
- Nếu tất cả RequestDetail của Request cha đều có status = "completed", Request sẽ chuyển thành "completed"
- Hệ thống sẽ gửi thông báo cho customer khi helper xác nhận đã nhận thanh toán
- Đây là bước cuối cùng trong quy trình xử lý đơn hàng

## 3. Time Off APIs (Quản lý thời gian nghỉ)

### 3.1 Lấy danh sách thời gian nghỉ
- **Endpoint**: `GET /timeOff/{helper_id}`
- **Description**: Lấy danh sách thời gian nghỉ của helper theo ID
- **Authentication**: Bắt buộc

**Response Success (200):**
```json
[
  {
    "_id": "timeOff_id",
    "helper_id": "helper_id",
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-09-05T00:00:00.000Z",
    "reason": "Nghỉ phép cá nhân",
    "status": "approved"
  }
]
```

**Lưu ý:** API này hiện tại chỉ hỗ trợ lấy danh sách thời gian nghỉ, chưa hỗ trợ tạo mới hoặc cập nhật.

**Lưu ý:** Chỉ có thể hủy những đăng ký nghỉ có status = "pending"
