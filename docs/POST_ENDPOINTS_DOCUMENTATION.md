# Tài Liệu API - Các Endpoint POST

## Mục Lục
1. [Authentication Endpoints](#authentication-endpoints)
2. [Request Management Endpoints](#request-management-endpoints)
3. [Request Detail Endpoints](#request-detail-endpoints)
4. [Cost Calculation Endpoints](#cost-calculation-endpoints)

---

## Authentication Endpoints

### 1. Đăng Ký Customer
**Endpoint:** `POST /auth/register/customer`

**Mô tả:** Đăng ký tài khoản mới cho khách hàng

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@email.com",
  "address": {
    "province": "Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "detailAddress": "123 Đường Lê Lợi"
  }
}
```

**Validation Rules:**
- `phone`: Bắt buộc, số điện thoại duy nhất
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Tùy chọn, tên đầy đủ của khách hàng
- `email`: Tùy chọn, định dạng email hợp lệ
- `address`: **Bắt buộc**, phải bao gồm đầy đủ 4 trường:
  - `province`: Tỉnh/Thành phố (bắt buộc)
  - `district`: Quận/Huyện (bắt buộc)
  - `ward`: Phường/Xã (bắt buộc)
  - `detailAddress`: Địa chỉ chi tiết (bắt buộc)

**Response Body:**

*Thành công (201):*
```json
{
  "message": "Đăng ký thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phone": "0123456789",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@email.com",
    "role": "customer"
  }
}
```

*Lỗi (400) - Thiếu thông tin bắt buộc:*
```json
{
  "error": "Missing required fields",
  "message": "Vui lòng cung cấp số điện thoại và mật khẩu"
}
```

*Lỗi (400) - Thiếu địa chỉ:*
```json
{
  "error": "Missing address information",
  "message": "Vui lòng cung cấp đầy đủ thông tin địa chỉ (tỉnh/thành phố, quận/huyện, phường/xã, địa chỉ chi tiết)"
}
```

*Lỗi (409) - Số điện thoại đã tồn tại:*
```json
{
  "error": "Phone already exists",
  "message": "Số điện thoại này đã được đăng ký"
}
```

---

### 2. Đăng Nhập Customer
**Endpoint:** `POST /auth/login/customer`

**Mô tả:** Đăng nhập cho khách hàng

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

**Response Body:**

*Thành công (200):*
```json
{
  "message": "Đăng nhập thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phone": "0123456789",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@email.com",
    "role": "customer"
  }
}
```

*Lỗi (401):*
```json
{
  "error": "Invalid credentials",
  "message": "Số điện thoại hoặc mật khẩu không đúng"
}
```

---

### 3. Đăng Nhập Helper
**Endpoint:** `POST /auth/login/helper`

**Mô tả:** Đăng nhập cho người giúp việc

**Request Body:**
```json
{
  "phone": "0987654321",
  "password": "password123"
}
```

**Response Body:**

*Thành công (200):*
```json
{
  "message": "Đăng nhập thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
  "helper_id": "HLP001",
    "fullName": "Trần Thị B",
  "phone": "0987654321",
    "role": "helper"
  }
}
```

---

### 4. Đổi Mật Khẩu
**Endpoint:** `POST /auth/change-password`

**Mô tả:** Đổi mật khẩu cho người dùng đã đăng nhập

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response Body:**

*Thành công (200):*
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

*Lỗi (400):*
```json
{
  "error": "Password too short",
  "message": "Mật khẩu mới phải có ít nhất 6 ký tự"
}
```

*Lỗi (401):*
```json
{
  "error": "Invalid current password",
  "message": "Mật khẩu hiện tại không đúng"
}
```

---

### 5. Refresh Token
**Endpoint:** `POST /auth/refresh`

**Mô tả:** Làm mới access token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Body:**

*Thành công (200):*
```json
{
  "message": "Token đã được làm mới",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Request Management Endpoints

### 6. Tạo Request Mới
**Endpoint:** `POST /request/`

**Mô tả:** Tạo yêu cầu dịch vụ mới với định dạng thời gian được chuẩn hóa

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "orderDate": "2025-08-04",
  "startTime": "06:30",
  "endTime": "10:30", 
  "startDate": "2025-08-04",
  "requestType": "normal",
  "totalCost": 200000,
  "customerInfo": {
    "phone": "0123456789",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@email.com",
    "address": "123 Đường ABC, Quận 1"
  },
  "service": {
    "title": "Dọn dẹp nhà cửa",
    "description": "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp"
  },
  "location": {
    "province": "Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé"
  },
  "helperId": "507f1f77bcf86cd799439012"
}
```

**Định dạng thời gian hỗ trợ:**
- **HH:mm format**: `"06:30"`, `"22:15"`
- **ISO format**: `"2025-08-04T06:30:00.000Z"`
- **Date format**: `"2025-08-04"` (YYYY-MM-DD)

**Response Body:**

*Thành công (200):*
```json
"success"
```

*Lỗi (400):*
```json
{
  "success": false,
  "message": "Invalid time format. Please use HH:mm or ISO format"
}
```

*Lỗi (400) - Time range:*
```json
{
  "success": false,
  "message": "Invalid time range. End time must be after start time"
}
```

*Lỗi (404):*
```json
{
  "success": false,
  "message": "Service \"Dọn dẹp nhà cửa\" not found"
}
```

---

### 7. Hủy Request
**Endpoint:** `POST /request/cancel`

**Mô tả:** Hủy yêu cầu dịch vụ (chỉ customer có thể hủy request của mình)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Response Body:**

*Thành công (200):*
```json
"success"
```

*Lỗi (403):*
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể hủy request của chính mình"
}
```

*Lỗi (500):*
```json
"cannot cancel this request"
```

---

### 8. Assign Helper cho Request
**Endpoint:** `POST /request/assign`

**Mô tả:** Gán helper cho request (chỉ helper có thể thực hiện)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Response Body:**

*Thành công (200):*
```json
"success"
```

*Lỗi (500):*
```json
"Cannot change status of detail"
```

---

### 9. Bắt Đầu Làm Việc
**Endpoint:** `POST /request/processing`

**Mô tả:** Helper bắt đầu thực hiện công việc

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "detailId": "507f1f77bcf86cd799439013"
}
```

**Response Body:**

*Thành công (200):*
```json
"success"
```

*Lỗi (500):*
```json
"can not change status of detail"
```

---

### 10. Hoàn Thành Công Việc
**Endpoint:** `POST /request/finish`

**Mô tả:** Helper hoàn thành công việc, chuyển trạng thái thành chờ thanh toán

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "detailId": "507f1f77bcf86cd799439013"
}
```

**Response Body:**

*Thành công (200):*
```json
"success"
```

*Lỗi (500):*
```json
"can not change status of detail"
```

---

### 11. Hoàn Thành Thanh Toán
**Endpoint:** `POST /request/finishpayment`

**Mô tả:** Hoàn thành thanh toán, kết thúc request

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "detailId": "507f1f77bcf86cd799439013"
}
```

**Response Body:**

*Thành công (200):*
```json
"Success"
```

*Lỗi (500):*
```json
"Cannot change status of detail"
```

---

### 12. Từ Chối Helper
**Endpoint:** `POST /request/reject`

**Mô tả:** Helper từ chối nhận request

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Response Body:**

*Thành công (200):*
```json
"Success"
```

---

## Request Detail Endpoints

### 13. Đánh Giá Dịch Vụ
**Endpoint:** `POST /requestDetail/review`

**Mô tả:** Customer đánh giá dịch vụ sau khi hoàn thành

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "detailId": "507f1f77bcf86cd799439013",
  "comment": "Dịch vụ tốt, helper làm việc rất chu đáo và sạch sẽ"
}
```

**Response Body:**

*Thành công (200):*
```json
"success"
```

---

## Cost Calculation Endpoints

### 14. Tính Toán Chi Phí
**Endpoint:** `POST /request/calculateCost`

**Mô tả:** Tính toán chi phí dịch vụ dựa trên thời gian và loại dịch vụ với định dạng thời gian được chuẩn hóa

**Request Body:**

*Cách 1 - Sử dụng serviceTitle với HH:mm format:*
```json
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "startTime": "08:00",
  "endTime": "12:00",
  "workDate": "2025-08-04"
}
```

*Cách 2 - Sử dụng serviceId:*
```json
{
  "serviceId": "507f1f77bcf86cd799439014",
  "startTime": "08:00",
  "endTime": "12:00", 
  "workDate": "2025-08-04"
}
```

*Cách 3 - Sử dụng ISO timestamp (tự động extract date):*
```json
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "startTime": "2025-08-04T08:00:00.000Z",
  "endTime": "2025-08-04T12:00:00.000Z"
}
```

**Định dạng thời gian hỗ trợ:**
- **HH:mm format**: `"08:00"`, `"23:30"`
- **ISO format**: `"2025-08-04T08:00:00.000Z"`
- **Date format**: `"2025-08-04"` (YYYY-MM-DD)

**Response Body:**

*Thành công (200):*
```json
{
  "totalCost": 180000,
  "servicePrice": 50000,
  "HSDV": 1.5,
  "HSovertime": 1.3,
  "HScuoituan": 1.2,
  "isWeekend": false,
  "totalOvertimeHours": 1,
  "totalNormalHours": 3,
  "applicableWeekendCoefficient": 1,
  "overtimeCost": 1.3,
  "normalCost": 3
}
```

*Lỗi (400) - Thiếu thông tin:*
```json
{
  "error": "Missing required parameters",
  "message": "serviceTitle (or serviceId), startTime, endTime, and workDate are required",
  "received": {
    "serviceTitle": null,
    "startTime": "08:00",
    "endTime": "12:00",
    "workDate": "2025-08-04"
  }
}
```

*Lỗi (400) - Thời gian không hợp lệ:*
```json
{
  "error": "Invalid time range",
  "message": "End time must be after start time"
}
```

*Lỗi (404):*
```json
{
  "error": "Service not found",
  "message": "Service with ID \"507f1f77bcf86cd799439014\" not found"
}
```

---

## Ghi Chú Quan Trọng

### Authentication
- Hầu hết các endpoint yêu cầu Authentication header với Bearer token
- Access token có thời hạn 24 giờ
- Refresh token có thời hạn 7 ngày
- Sử dụng endpoint `/auth/refresh` để làm mới token
 - Từ 12/08/2025: Đăng nhập Helper sử dụng SĐT (`phone`) thay cho `helper_id`; response vẫn trả về `helper_id` để dùng cho các nghiệp vụ khác

### Phân Quyền
- **Customer**: Chỉ có thể thao tác với request của chính mình
- **Helper**: Chỉ có thể thao tác với request được assign cho mình
- Các endpoint có kiểm tra quyền sẽ trả về lỗi 403 nếu vi phạm

### Trạng Thái Request
1. **notDone**: Request mới tạo
2. **assigned**: Đã gán helper
3. **processing**: Helper đang thực hiện
4. **waitPayment**: Hoàn thành, chờ thanh toán
5. **done**: Hoàn thành toàn bộ
6. **cancelled**: Đã hủy

### Yêu Cầu Địa Chỉ Bắt Buộc (Mới)
Khi đăng ký customer, **bắt buộc** phải cung cấp địa chỉ đầy đủ bao gồm:
- **province**: Tỉnh/Thành phố
- **district**: Quận/Huyện  
- **ward**: Phường/Xã
- **detailAddress**: Địa chỉ chi tiết (số nhà, tên đường)

Địa chỉ này sẽ được lưu vào mảng `addresses` của customer và có thể được sử dụng làm địa chỉ mặc định cho các đơn hàng.

### Format Thời Gian (Đã Chuẩn Hóa - Cập Nhật Mới)
API hiện tại hỗ trợ nhiều định dạng thời gian với xử lý timezone được cải thiện:

#### Định dạng đầu vào được hỗ trợ:
- **Time Only**: `"08:00"`, `"14:30"` (HH:mm format)
- **Local ISO Format**: `"2025-08-04T08:00:00"` (không có timezone)
- **UTC ISO Format**: `"2025-08-04T08:00:00Z"` hoặc `"2025-08-04T08:00:00.000Z"`
- **Timezone ISO Format**: `"2025-08-04T08:00:00+07:00"`
- **Date Only**: `"2025-08-04"` (YYYY-MM-DD format)

#### Xử lý tự động được cải thiện:
- **Local Time Preservation**: Thời gian local được giữ nguyên như ý định
- **Timezone Detection**: Phân biệt chính xác giữa local time và timezone-aware time
- **Cross-midnight Support**: Hỗ trợ ca làm việc qua đêm
- **Validation**: Kiểm tra tính hợp lệ của thời gian
- **Range Check**: Đảm bảo endTime > startTime (bao gồm cross-midnight)
- **Auto Extract**: Tự động trích xuất date từ ISO timestamp
- **Smart Standardization**: Chuyển đổi thông minh dựa trên timezone info

#### Ví dụ chuyển đổi:
```json
// Local time (không có timezone) - ĐƯỢC BẢO TỒN
{
  "startTime": "2025-08-04T08:00:00",
  "endTime": "2025-08-04T12:00:00"
}
// → Giữ nguyên 08:00-12:00 theo giờ địa phương

// UTC time với Z
{
  "startTime": "2025-08-04T08:00:00Z",
  "endTime": "2025-08-04T12:00:00Z"
}
// → Xử lý như UTC time

// Timezone aware
{
  "startTime": "2025-08-04T08:00:00+07:00",
  "endTime": "2025-08-04T12:00:00+07:00"
}
// → Xử lý với offset timezone
```

### Tính Năng Mới Trong Time Utils (Cập Nhật)
- **timeUtils.standardizeDate()**: Chuẩn hóa ngày về YYYY-MM-DD
- **timeUtils.standardizeTime()**: Chuẩn hóa giờ về HH:mm với timezone detection
- **timeUtils.isValidTimeRange()**: Kiểm tra khoảng thời gian hợp lệ (hỗ trợ cross-midnight)
- **timeUtils.extractDate()**: Trích xuất ngày từ datetime (local/UTC aware)
- **timeUtils.extractTime()**: Trích xuất giờ từ datetime
- **timeUtils.formatDateArray()**: Xử lý mảng ngày từ chuỗi
- **timeUtils.timeToDate()**: Chuyển đổi time + date thành Date object (local/UTC support)

### Cải Tiến Mới Nhất (v2.1)
- **🔧 Fixed**: Xử lý chính xác local time format (`2025-08-04T08:00:00`)
- **✨ Enhanced**: Timezone detection thông minh hơn
- **🚀 Improved**: Cross-midnight handling được cải thiện
- **🛡️ Secure**: Bảo tồn ý định thời gian của người dùng

### Các Lỗi Thường Gặp
- **400**: Thiếu dữ liệu bắt buộc, thiếu địa chỉ, hoặc định dạng thời gian không hợp lệ
- **401**: Token không hợp lệ hoặc hết hạn
- **403**: Không có quyền truy cập
- **404**: Không tìm thấy resource
- **409**: Dữ liệu bị trùng lặp (số điện thoại đã tồn tại)
- **500**: Lỗi server hoặc logic business

### Best Practices cho Time Format
1. **Sử dụng HH:mm format** cho time input đơn giản
2. **Sử dụng ISO format không timezone** (`2025-08-04T08:00:00`) cho local time
3. **Sử dụng ISO format với Z** (`2025-08-04T08:00:00Z`) cho UTC time
4. **Sử dụng timezone offset** (`2025-08-04T08:00:00+07:00`) khi cần chính xác timezone
5. **Luôn validate** time range trước khi submit
6. **Cross-midnight shifts** được hỗ trợ tự động (23:30 → 01:30)

### Ghi Chú Quan Trọng
⚠️ **Thay đổi quan trọng**: Kể từ phiên bản mới, local time format (`2025-08-04T08:00:00`) sẽ được bảo tồn chính xác thay vì bị chuyển đổi timezone như trước đây.

📝 **Chi tiết thay đổi:**
- **Trước**: `2025-08-05T06:30:00` → Database: `2025-08-04T23:30:00.000Z` (timezone conversion)
- **Sau**: `2025-08-05T06:30:00` → Database: `2025-08-05T06:30:00.000Z` (preserved as UTC)

🎯 **Lợi ích**: Thời gian bạn nhập sẽ là thời gian được lưu chính xác, tránh nhầm lẫn do chuyển đổi timezone.

### Best Practices cho Address
1. **Sử dụng dropdown/select** cho province, district, ward để đảm bảo tính nhất quán
2. **Validate** địa chỉ chi tiết không được để trống
3. **Cung cấp API location** để lấy danh sách province/district/ward
4. **Lưu địa chỉ đầu tiên** làm địa chỉ mặc định cho customer

---

*Tài liệu này được cập nhật ngày 12/08/2025 - Cập nhật đăng nhập Helper bằng SĐT; 03/08/2025 - Thêm yêu cầu địa chỉ bắt buộc cho đăng ký customer*
