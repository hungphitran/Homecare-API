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
  "address": {
    "province": "Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "detailAddress": "123 Đường Lê Lợi"
  }
}
```

**Validation Rules:**
- `phone`: Bắt buộc, định dạng số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Bắt buộc, tên đầy đủ của khách hàng
- `email`: Tùy chọn, định dạng email hợp lệ
- `address`: Bắt buộc, đối tượng chứa thông tin địa chỉ đầy đủ
  - `province`: Tỉnh/Thành phố (bắt buộc)
  - `district`: Quận/Huyện (bắt buộc)
  - `ward`: Phường/Xã (bắt buộc)
  - `detailAddress`: Địa chỉ chi tiết (bắt buộc)

**Response Success (201):**
```json
{
  "message": "Đăng ký thành công",
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "customer_id",
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "email": "customer@example.com",
    "role": "customer"
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
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "customer_id",
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

### 1.3 Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Description**: Làm mới access token khi hết hạn
- **Authentication**: Không cần

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response Success (200):**
```json
{
  "message": "Token đã được làm mới",
  "accessToken": "new_jwt_token_here"
}
```

### 1.4 Đổi mật khẩu
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

**Validation Rules:**
- `currentPassword`: Bắt buộc, mật khẩu hiện tại chính xác
- `newPassword`: Bắt buộc, mật khẩu mới tối thiểu 6 ký tự

**Response Success (200):**
```json
{
  "message": "Đổi mật khẩu thành công"
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
  "_id": "customer_id",
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "email": "customer@example.com",
  "addresses": [
    {
      "province": "Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé",
      "detailAddress": "123 Đường Lê Lợi"
    }
  ],
  "signedUp": true,
  "point": 0
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
  "addresses": [
    {
      "province": "Hà Nội",
      "district": "Quận Ba Đình",
      "ward": "Phường Ngọc Hà",
      "detailAddress": "456 Đường Hoàng Hoa Thám"
    }
  ]
}
```

**Validation Rules:**
- `fullName`: Bắt buộc, tối thiểu 2 ký tự
- `email`: Tùy chọn, định dạng email hợp lệ nếu có
- `addresses`: Bắt buộc, mảng chứa ít nhất 1 địa chỉ
  - `province`: Bắt buộc
  - `district`: Bắt buộc
  - `ward`: Bắt buộc
  - `detailAddress`: Bắt buộc

**Lưu ý:** Chỉ phần tử đầu tiên trong mảng addresses sẽ được sử dụng để thay thế địa chỉ hiện tại.

**Response Success (200):**
```json
{
  "message": "Cập nhật thông tin thành công",
  "customer": {
    "_id": "customer_id",
    "phone": "0901234567",
    "fullName": "Nguyễn Văn B",
    "email": "newemail@example.com",
    "addresses": [
      {
        "province": "Hà Nội",
        "district": "Quận Ba Đình",
        "ward": "Phường Ngọc Hà",
        "detailAddress": "456 Đường Hoàng Hoa Thám"
      }
    ]
  }
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
  "startTime": "08:00",
  "endTime": "12:00",
  "workDate": "2025-08-20"
}
```

**Hoặc sử dụng serviceId thay vì serviceTitle:**
```json
{
  "serviceId": "service_object_id",
  "startTime": "08:00", 
  "endTime": "12:00",
  "workDate": "2025-08-20"
}
```

**Validation Rules:**
- `serviceTitle` hoặc `serviceId`: Bắt buộc, tên dịch vụ hoặc ID dịch vụ
- `startTime`: Bắt buộc, thời gian bắt đầu (HH:mm)
- `endTime`: Bắt buộc, thời gian kết thúc (HH:mm)
- `workDate`: Bắt buộc, ngày làm việc (YYYY-MM-DD)

**Response Success (200):**
```json
{
  "totalCost": 250000,
  "servicePrice": 100000,
  "HSDV": 1.2,
  "HSovertime": 1.5,
  "HScuoituan": 1.3,
  "isWeekend": false,
  "isHoliday": false,
  "totalOvertimeHours": 0,
  "totalNormalHours": 4,
  "applicableWeekendCoefficient": 1,
  "overtimeCost": 0,
  "normalCost": 4
}
```

### 5.2 Tạo đơn hàng mới
- **Endpoint**: `POST /request`
- **Description**: Tạo đơn hàng dịch vụ mới
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "service": {
    "title": "Dọn dẹp nhà cửa",
    "coefficient_service": 1.2,
    "coefficient_other": 1.0,
    "cost": 100000
  },
  "startTime": "2025-08-20T08:00:00",
  "endTime": "2025-08-20T12:00:00",
  "startDate": "2025-08-20,2025-08-22",
  "customerInfo": {
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Đường ABC, TP.HCM",
    "usedPoint": 0
  },
  "location": {
    "province": "Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé"
  },
  "requestType": "Ngắn hạn",
  "totalCost": 450000,
  "helperId": ""
}
```

**Validation Rules:**
- `service`: Bắt buộc, thông tin dịch vụ
  - `title`: Tên dịch vụ (bắt buộc)
- `startTime`: Bắt buộc, hỗ trợ nhiều định dạng:
  - ISO string: `"2025-08-20T08:00:00"`
  - Timestamp: `1755905400000`
  - Time only: `"08:00"`
- `endTime`: Bắt buộc, cùng định dạng như startTime
- `startDate`: Tùy chọn, chuỗi ngày phân cách bằng dấu phẩy
- `customerInfo`: Bắt buộc, thông tin khách hàng
- `location`: Bắt buộc, thông tin vị trí
- `requestType`: Loại yêu cầu ("Dài hạn" hoặc "Ngắn hạn")
- `totalCost`: Tổng chi phí
- `helperId`: ID của helper (tùy chọn, để trống nếu chưa chọn)

**Response Success (200):**
```json
"success"
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
    "orderDate": "2025-08-20T00:00:00.000Z",
    "requestType": "Ngắn hạn",
    "startTime": "2025-08-20T08:00:00.000Z",
    "endTime": "2025-08-20T12:00:00.000Z",
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567",
      "address": "123 Đường ABC, TP.HCM",
      "usedPoint": 0
    },
    "service": {
      "title": "Dọn dẹp nhà cửa",
      "coefficient_service": 1.2,
      "coefficient_other": 1.0,
      "cost": 100000
    },
    "location": {
      "province": "Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé"
    },
    "totalCost": 450000,
    "status": "pending",
    "schedules": [
      {
        "_id": "schedule_id",
        "startTime": "2025-08-20T08:00:00.000Z",
        "endTime": "2025-08-20T12:00:00.000Z",
        "workingDate": "2025-08-20T00:00:00.000Z",
        "helper_id": null,
        "cost": 250000,
        "helper_cost": 0,
        "status": "pending"
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
  "id": "request_id"
}
```

**Validation Rules:**
- `id`: Bắt buộc, ID của yêu cầu cần hủy

**Response Success (200):**
```json
"success"
```

**Lưu ý:** 
- Customer chỉ có thể hủy đơn hàng của chính mình
- Chỉ có thể hủy đơn hàng có status "pending" hoặc "assigned"

## 6. Review & Rating APIs

### 6.1 Gửi đánh giá cho dịch vụ
- **Endpoint**: `POST /requestDetail/review`
- **Description**: Gửi đánh giá cho một chi tiết đơn hàng đã hoàn thành
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "detailId": "request_detail_id",
  "comment": "Dịch vụ rất tốt, helper nhiệt tình và chu đáo."
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của chi tiết yêu cầu cần đánh giá
- `comment`: Bắt buộc, nội dung đánh giá

**Response Success (200):**
```json
"success"
```

## 7. General APIs

### 7.1 Lấy thông tin chung
- **Endpoint**: `GET /general`
- **Description**: Lấy thông tin cài đặt chung của hệ thống
- **Authentication**: Không cần

### 7.2 Lấy chính sách
- **Endpoint**: `GET /policy`
- **Description**: Lấy các chính sách của công ty
- **Authentication**: Không cần

### 7.3 Lấy câu hỏi thường gặp
- **Endpoint**: `GET /question`
- **Description**: Lấy danh sách câu hỏi thường gặp
- **Authentication**: Không cần

### 7.4 Lấy danh sách khuyến mãi
- **Endpoint**: `GET /discount`
- **Description**: Lấy danh sách mã khuyến mãi hiện có
- **Authentication**: Không cần

### 7.5 Lấy thông báo
- **Endpoint**: `GET /notifications`
- **Description**: Lấy danh sách thông báo của khách hàng
- **Authentication**: Bắt buộc (customer only)

## 8. Status Flow (Luồng trạng thái đơn hàng)

Đơn hàng sẽ có các trạng thái sau:

1. **pending** → Đơn hàng mới tạo, chờ helper nhận
2. **assigned** → Helper đã nhận đơn hàng
3. **inProgress** → Helper đang thực hiện công việc
4. **waitPayment** → Công việc hoàn thành, chờ thanh toán
5. **completed** → Đơn hàng đã hoàn thành
6. **cancelled** → Đơn hàng đã bị hủy

**Lưu ý:** Customer chỉ có thể hủy đơn hàng ở trạng thái "pending" hoặc "assigned".

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "message": "Vui lòng cung cấp số điện thoại và mật khẩu"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials",
  "message": "Số điện thoại hoặc mật khẩu không đúng"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể truy cập dữ liệu của chính mình"
}
```

### 404 Not Found
```json
{
  "error": "Customer not found",
  "message": "Không tìm thấy khách hàng"
}
```

### 409 Conflict
```json
{
  "error": "Phone already exists",
  "message": "Số điện thoại này đã được đăng ký"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Lỗi hệ thống, vui lòng thử lại"
}
```

### 501 Not Implemented
```json
{
  "error": "Service not implemented",
  "message": "OTP/ZNS messaging service has been removed"
}
```

## Usage Examples

### Quy trình tạo đơn hàng hoàn chỉnh:

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
    "startTime": "08:00",
    "endTime": "12:00",
    "workDate": "2025-08-20"
  }'
```

3. **Tạo đơn hàng:**
```bash
curl -X POST http://localhost:3000/api/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "service": {
      "title": "Dọn dẹp nhà cửa",
      "coefficient_service": 1.2,
      "coefficient_other": 1.0,
      "cost": 100000
    },
    "startTime": "2025-08-20T08:00:00",
    "endTime": "2025-08-20T12:00:00",
    "startDate": "2025-08-20",
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567",
      "address": "123 Đường ABC, TP.HCM"
    },
    "location": {
      "province": "Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé"
    },
    "requestType": "Ngắn hạn",
    "totalCost": 250000
  }'
```

4. **Kiểm tra trạng thái đơn hàng:**
```bash
curl -X GET http://localhost:3000/api/request/0901234567 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Notes (Lưu ý)

1. **Múi giờ**: Tất cả thời gian sử dụng UTC, frontend cần convert sang giờ địa phương
2. **Định dạng thời gian**: API hỗ trợ nhiều định dạng:
   - Timestamp: `1755905400000` (milliseconds since epoch)
   - ISO String: `"2025-08-20T08:00:00"`
   - Time Only: `"08:00"` hoặc `"8"`
3. **Số điện thoại**: Định dạng 10-11 chữ số bắt đầu bằng 0
4. **Bảo mật**: 
   - Access token có thời hạn 24h
   - Refresh token có thời hạn 7 ngày
   - Sử dụng refresh token để lấy access token mới
5. **Quyền truy cập**: Customer chỉ có thể truy cập và quản lý dữ liệu của chính mình
6. **Địa chỉ**: Sử dụng cấu trúc phân cấp (province/district/ward/detailAddress)
7. **Endpoints bị vô hiệu hóa**: POST /message (OTP/SMS service) trả về 501 Not Implemented
8. **Cost calculation**: Tính toán dựa trên giờ hành chính, overtime, cuối tuần và ngày lễ
