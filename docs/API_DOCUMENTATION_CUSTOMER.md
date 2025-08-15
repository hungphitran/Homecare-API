# API Documentation for Customers (Tài liệu API cho Khách hàng)



## Authentication (Xác thực)
- Hầu hết các API yêu cầu JWT token
- Token được trả về sau khi đăng nhập thành công
- Sử dụng token trong header: `Authorization: Bearer <token>`

## 1. Authentication APIs

### 1.1 Đăng ký tài khoản khách hàng
- **Endpoint**: `POST /auth/register/customer`
- **Description**: Tạo tài khoản khách hàng mới
- **Authentication**: Không cần

**Request Body:**
```json
{
  "phone": "0901234567",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "email": "customer@example.com",
  "address": "123 Đường ABC, TP.HCM"
}
```

**Response Success (201):**
```json
{
  "message": "Đăng ký thành công",
  "customer": {
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "email": "customer@example.com"
  }
}
```

### 1.2 Đăng nhập
- **Endpoint**: `POST /auth/login/customer`
- **Description**: Đăng nhập tài khoản khách hàng
- **Authentication**: Không cần

**Request Body:**
```json
{
  "phone": "0901234567",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "message": "Đăng nhập thành công",
  "token": "jwt_token_here",
  "customer": {
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "role": "customer"
  }
}
```

### 1.3 Đổi mật khẩu
- **Endpoint**: `POST /auth/change-password`
- **Description**: Thay đổi mật khẩu tài khoản
- **Authentication**: Bắt buộc

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
}
```

## 2. Customer Profile APIs

### 2.1 Lấy thông tin cá nhân
- **Endpoint**: `GET /customer/{phone}`
- **Description**: Lấy thông tin tài khoản của khách hàng (chỉ được xem thông tin của chính mình)
- **Authentication**: Bắt buộc

**Response Success (200):**
```json
{
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "email": "customer@example.com",
  "address": "123 Đường ABC, TP.HCM",
  "isActive": true
}
```

### 2.2 Cập nhật thông tin cá nhân
- **Endpoint**: `PATCH /customer/{phone}`
- **Description**: Cập nhật thông tin tài khoản (chỉ được cập nhật thông tin của chính mình)
- **Authentication**: Bắt buộc

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn B",
  "email": "newemail@example.com",
  "address": "456 Đường XYZ, TP.HCM"
}
```

## 3. Service APIs

### 3.1 Lấy danh sách dịch vụ
- **Endpoint**: `GET /service`
- **Description**: Lấy danh sách tất cả dịch vụ có sẵn
- **Authentication**: Không cần

**Response Success (200):**
```json
[
  {
    "_id": "service_id",
    "title": "Dọn dẹp nhà cửa",
    "description": "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp",
    "basicPrice": 100000,
    "coefficient_id": "coeff_id"
  }
]
```

### 3.2 Lấy chi tiết dịch vụ
- **Endpoint**: `GET /service/{id}`
- **Description**: Lấy chi tiết một dịch vụ cụ thể
- **Authentication**: Không cần

## 4. Helper APIs

### 4.1 Lấy danh sách helper
- **Endpoint**: `GET /helper`
- **Description**: Lấy danh sách tất cả helper (thông tin công khai)
- **Authentication**: Không cần

**Response Success (200):**
```json
[
  {
    "_id": "helper_id",
    "fullName": "Trần Thị B",
    "phone": "0987654321",
    "rating": 4.8,
    "completedJobs": 150,
    "isActive": true
  }
]
```

### 4.2 Lấy chi tiết helper
- **Endpoint**: `GET /helper/{id}`
- **Description**: Lấy chi tiết thông tin của một helper
- **Authentication**: Không cần

## 5. Request APIs (Đơn hàng)

### 5.1 Tính toán chi phí dự kiến
- **Endpoint**: `POST /request/calculateCost`
- **Description**: Tính toán chi phí dự kiến cho đơn hàng (không cần đăng nhập)
- **Authentication**: Không cần

**Request Body:**
```json
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "workingDate": "2025-08-20",
  "startTime": "08:00",
  "endTime": "12:00"
}
```

**Response Success (200):**
```json
{
  "estimatedCost": 250000,
  "breakdown": {
    "baseCost": 100000,
    "serviceCoefficient": 1.2,
    "timeCoefficient": 1.5,
    "otherFees": 50000
  }
}
```

### 5.2 Tạo đơn hàng mới
- **Endpoint**: `POST /request`
- **Description**: Tạo đơn hàng dịch vụ mới
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "serviceLocation": {
    "address": "123 Đường ABC, TP.HCM",
    "coordinates": [106.7, 10.8]
  },
  "schedules": [
    {
      "workingDate": "2025-08-20",
      "startTime": "08:00",
      "endTime": "12:00"
    },
    {
      "workingDate": "2025-08-22",
      "startTime": "14:00",
      "endTime": "17:00"
    }
  ],
  "note": "Cần dọn dẹp kỹ phòng khách và bếp",
  "discountCode": "SUMMER2025"
}
```

**Response Success (201):**
```json
{
  "message": "Đơn hàng được tạo thành công",
  "request": {
    "_id": "request_id",
    "serviceTitle": "Dọn dẹp nhà cửa",
    "totalCost": 450000,
    "status": "pending",
    "scheduleIds": ["schedule_id_1", "schedule_id_2"]
  }
}
```

### 5.3 Lấy danh sách đơn hàng của khách hàng
- **Endpoint**: `GET /request/{phone}`
- **Description**: Lấy tất cả đơn hàng của khách hàng (chỉ được xem đơn hàng của chính mình)
- **Authentication**: Bắt buộc (customer only)

**Response Success (200):**
```json
[
  {
    "_id": "request_id",
    "serviceTitle": "Dọn dẹp nhà cửa",
    "serviceLocation": {
      "address": "123 Đường ABC, TP.HCM"
    },
    "totalCost": 450000,
    "status": "confirmed",
    "schedules": [
      {
        "_id": "schedule_id",
        "workingDate": "2025-08-20T00:00:00.000Z",
        "startTime": "2025-08-20T01:00:00.000Z",
        "endTime": "2025-08-20T05:00:00.000Z",
        "helper_id": "helper_id",
        "cost": 250000,
        "status": "confirmed"
      }
    ]
  }
]
```

### 5.4 Hủy đơn hàng
- **Endpoint**: `POST /request/cancel`
- **Description**: Hủy đơn hàng (chỉ được hủy đơn hàng của chính mình)
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "id": "request_id",
  "reason": "Không cần dịch vụ nữa"
}
```

**Response Success (200):**
```json
{
  "message": "Đơn hàng đã được hủy thành công"
}
```

## 6. General APIs

### 6.1 Lấy thông tin chung
- **Endpoint**: `GET /general`
- **Description**: Lấy thông tin cài đặt chung của hệ thống
- **Authentication**: Không cần

### 6.2 Lấy chính sách
- **Endpoint**: `GET /policy`
- **Description**: Lấy các chính sách của công ty
- **Authentication**: Không cần

### 6.3 Lấy câu hỏi thường gặp
- **Endpoint**: `GET /question`
- **Description**: Lấy danh sách câu hỏi thường gặp
- **Authentication**: Không cần

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad request",
  "message": "Dữ liệu gửi lên không hợp lệ"
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
  "error": "Customer access required",
  "message": "Chỉ khách hàng mới có thể truy cập endpoint này"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Không tìm thấy tài nguyên"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Lỗi server nội bộ"
}
```

## Usage Examples

### Tạo đơn hàng hoàn chỉnh:

1. **Đăng nhập để lấy token:**
```bash
curl -X POST http://localhost:3000/api/auth/login/customer \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0901234567",
    "password": "password123"
  }'
```

2. **Tính toán chi phí trước:**
```bash
curl -X POST http://localhost:3000/api/request/calculateCost \
  -H "Content-Type: application/json" \
  -d '{
    "serviceTitle": "Dọn dẹp nhà cửa",
    "workingDate": "2025-08-20",
    "startTime": "08:00",
    "endTime": "12:00"
  }'
```

3. **Tạo đơn hàng:**
```bash
curl -X POST http://localhost:3000/api/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceTitle": "Dọn dẹp nhà cửa",
    "serviceLocation": {
      "address": "123 Đường ABC, TP.HCM"
    },
    "schedules": [
      {
        "workingDate": "2025-08-20",
        "startTime": "08:00",
        "endTime": "12:00"
      }
    ]
  }'
```

## Notes (Lưu ý)

1. **Múi giờ**: Tất cả thời gian sử dụng UTC, frontend cần convert sang giờ địa phương
2. **Định dạng ngày**: Sử dụng format ISO 8601 (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ)
3. **Số điện thoại**: Định dạng 10 chữ số bắt đầu bằng 0
4. **Bảo mật**: Token có thời hạn, cần refresh khi hết hạn
5. **Rate limiting**: API có giới hạn số request/phút để tránh spam
