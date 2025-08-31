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

### 2.3 Nhận đơn hàng
- **Endpoint**: `POST /request/assign`
- **Description**: Nhận (assign) một requestDetail cụ thể vào tài khoản helper hiện tại
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

**Lưu ý:**
- API này chỉ chấp nhận RequestDetail có status = "pending"
- Chỉ các RequestDetail có thời gian bắt đầu trong khoảng từ hiện tại đến 2 giờ sau mới được chấp nhận
- Helper_id sẽ được cập nhật từ "notAvailable" thành ID của helper đang đăng nhập

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
- **Description**: Xác nhận đã nhận thanh toán (chuyển trạng thái từ waitPayment -> completed)
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
  "message": "Đã xác nhận thanh toán",
  "status": "completed"
}
```

## 3. Time Off APIs (Quản lý thời gian nghỉ)

### 3.1 Đăng ký thời gian nghỉ
- **Endpoint**: `POST /timeOff`
- **Description**: Đăng ký thời gian không làm việc
- **Authentication**: Bắt buộc (helper only)

**Request Body:**
```json
{
  "startDate": "2025-09-01",
  "endDate": "2025-09-05",
  "reason": "Nghỉ phép cá nhân"
}
```

**Validation Rules:**
- `startDate`: Bắt buộc, định dạng YYYY-MM-DD
- `endDate`: Bắt buộc, định dạng YYYY-MM-DD, phải >= startDate
- `reason`: Bắt buộc, lý do nghỉ

**Response Success (200):**
```json
{
  "message": "Đăng ký nghỉ thành công",
  "timeOff": {
    "_id": "timeOff_id",
    "helper_id": "helper_id",
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-09-05T00:00:00.000Z",
    "reason": "Nghỉ phép cá nhân",
    "status": "pending"
  }
}
```

### 3.2 Lấy danh sách thời gian nghỉ
- **Endpoint**: `GET /timeOff/my`
- **Description**: Lấy danh sách thời gian nghỉ của helper hiện tại
- **Authentication**: Bắt buộc (helper only)

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

### 3.3 Hủy đăng ký thời gian nghỉ
- **Endpoint**: `DELETE /timeOff/{id}`
- **Description**: Hủy đăng ký thời gian nghỉ
- **Authentication**: Bắt buộc (helper only)

**Response Success (200):**
```json
{
  "message": "Hủy đăng ký nghỉ thành công"
}
```

**Lưu ý:** Chỉ có thể hủy những đăng ký nghỉ có status = "pending"
