# API Documentation for Customers (Tài liệu API cho khách hàng)

## Base URL

## Authentication (Xác thực)
- Tất cả API dành cho customer đều yêu cầu JWT token (trừ đăng ký và đăng nhập)
- Token được trả về sau khi đăng nhập thành công
- Sử dụng token trong header: `Authorization: Bearer <token>`

## 1. Authentication APIs

### 1.1 Đăng ký tài khoản
- **Endpoint**: `POST /auth/register/customer`
- **Description**: Đăng ký tài khoản mới cho khách hàng
- **Authentication**: Không cần

**Request Body:**
```json
{
  "phone": "0901234567",
  "password": "customer123",
  "fullName": "Nguyễn Văn A",
  "email": "example@gmail.com",
  "address": {
    "province": "province_id_here",
    "district": "district_id_here", 
    "ward": "ward_id_here",
    "detailAddress": "Số 123, Đường ABC"
  }
}
```

**Validation Rules:**
- `phone`: Bắt buộc, số điện thoại (phải duy nhất)
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Bắt buộc, họ tên đầy đủ
- `email`: Không bắt buộc, nhưng phải đúng định dạng email nếu có
- `address`: Bắt buộc, thông tin địa chỉ đầy đủ
  - `province`: Bắt buộc, ID tỉnh/thành phố
  - `district`: Bắt buộc, ID quận/huyện
  - `ward`: Bắt buộc, ID phường/xã
  - `detailAddress`: Bắt buộc, địa chỉ chi tiết

**Response Success (201):**
```json
{
  "message": "Đăng ký thành công",
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here", 
  "user": {
    "id": "customer_id_here",
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "email": "example@gmail.com",
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
  "password": "customer123"
}
```

**Response Success (200):**
```json
{
  "message": "Đăng nhập thành công",
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "id": "customer_id_here",
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "email": "example@gmail.com",
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
  "currentPassword": "customer123",
  "newPassword": "newCustomer456"
}
```

**Response Success (200):**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

### 1.4 Refresh Token
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

### 2.0 Tính chi phí dịch vụ  
- **Endpoint**: `POST /request/calculateCost`
- **Description**: Tính toán chi phí dịch vụ dựa trên thời gian và ngày làm việc
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

**Hoặc có thể sử dụng serviceId thay cho serviceTitle:**
```json
{
  "serviceId": "service_id_or_title_here",
  "startTime": "08:00",
  "endTime": "12:00",
  "workDate": "2025-08-20"
}
```

**Validation Rules:**
- `serviceTitle` hoặc `serviceId`: Bắt buộc, tên hoặc ID dịch vụ
- `startTime`: Bắt buộc, thời gian bắt đầu (HH:mm hoặc ISO format)
- `endTime`: Bắt buộc, thời gian kết thúc (HH:mm hoặc ISO format) 
- `workDate`: Bắt buộc, ngày làm việc (YYYY-MM-DD)

**Response Success (200):**
```json
{
  "totalCost": 450000.00,
  "servicePrice": 100000,
  "HSDV": 1.2,
  "HSovertime": 1.5,
  "HScuoituan": 1.3,
  "isWeekend": false,
  "isHoliday": false,
  "totalOvertimeHours": 1.0,
  "totalNormalHours": 3.0,
  "applicableWeekendCoefficient": 1.0,
  "overtimeCost": 1.5,
  "normalCost": 3.0
}
```

**Lưu ý:**
- API này không cần xác thực, có thể sử dụng để estimate chi phí trước khi đặt đơn
- Hệ số weekend/holiday sẽ được áp dụng tự động dựa trên ngày làm việc
- Chi phí overtime được tính cho giờ làm ngoài giờ hành chính

### 2.1 Tạo đơn hàng mới
- **Endpoint**: `POST /request`
- **Description**: Tạo đơn hàng mới với thời gian làm việc
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "customerInfo": {
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "address": "Số 123, Đường ABC, Quận XYZ",
    "usedPoint": 0
  },
  "service": {
    "title": "Dọn dẹp nhà cửa"
  },
  "startTime": "08:00",
  "endTime": "12:00",
  "startDate": "2025-08-20",
  "totalCost": 450000
}
```

**Validation Rules:**
- `customerInfo`: Bắt buộc, thông tin khách hàng
  - `phone`: Bắt buộc, số điện thoại khách hàng
  - `fullName`: Bắt buộc, họ tên đầy đủ
  - `address`: Bắt buộc, địa chỉ chi tiết
  - `usedPoint`: Không bắt buộc, điểm tích lũy sử dụng (mặc định: 0)
- `service`: Bắt buộc, thông tin dịch vụ
  - `title`: Bắt buộc, tên dịch vụ (phải tồn tại trong hệ thống)
- `startTime`: Bắt buộc, thời gian bắt đầu (định dạng HH:mm hoặc ISO)
- `endTime`: Bắt buộc, thời gian kết thúc (định dạng HH:mm hoặc ISO)
- `startDate`: Bắt buộc, ngày làm việc (định dạng YYYY-MM-DD)
- `totalCost`: Bắt buộc, tổng chi phí dịch vụ

**Response Success (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "request_id_here",
    "customerInfo": {
      "phone": "0901234567",
      "fullName": "Nguyễn Văn A",
      "address": "Số 123, Đường ABC, Quận XYZ",
      "usedPoint": 0
    },
    "service": {
      "title": "Dọn dẹp nhà cửa"
    },
    "startTime": "2025-08-20T08:00:00.000Z",
    "endTime": "2025-08-20T12:00:00.000Z",
    "orderDate": "2025-08-20T00:00:00.000Z",
    "scheduleIds": ["requestDetail_id_1"],
    "totalCost": 450000,
    "helper_cost": 0,
    "status": "pending"
  },
  "costBreakdown": {
    "totalServiceCost": 450000,
    "workingDates": 1,
    "schedules": 1
  },
  "note": "Helper will be assigned later through assign endpoint"
}
```

**Lưu ý:**
- Thời gian đặt hàng (orderDate) được tự động gán từ startDate hoặc ngày hiện tại
- Tất cả thời gian được lưu dưới dạng UTC trong database
- Mặc định không có helper khi tạo đơn (helper_id = "notAvailable")
- Helper sẽ được gán sau thông qua endpoint assign
- Chi phí helper (helper_cost) ban đầu là 0

### 2.2 Lấy danh sách đơn hàng của khách hàng
- **Endpoint**: `GET /request/{phone}`
- **Description**: Lấy danh sách tất cả đơn hàng của khách hàng theo số điện thoại
- **Authentication**: Bắt buộc (customer only, chỉ được xem đơn hàng của chính mình)

**Response Success (200):**
```json
[
  {
    "_id": "request_id",
    "customerInfo": {
      "phone": "0901234567",
      "fullName": "Nguyễn Văn A",
      "address": "Số 123, Đường ABC, Quận XYZ"
    },
    "service": {
      "title": "Dọn dẹp nhà cửa"
    },
    "totalCost": 450000,
    "orderDate": "2025-08-19",
    "startTime": "2025-08-20T08:00:00.000Z",
    "endTime": "2025-08-20T12:00:00.000Z",
    "status": "pending",
    "schedules": [
      {
        "_id": "requestDetail_id_1",
        "startTime": "2025-08-20T08:00:00.000Z",
        "endTime": "2025-08-20T12:00:00.000Z",
        "workingDate": "2025-08-20",
        "helper_id": "notAvailable",
        "cost": 450000,
        "status": "pending",
        "helper_cost": 0
      }
    ]
  }
]
```

**Lưu ý:**
- Trả về tất cả thông tin đơn hàng và lịch làm việc (schedules) tương ứng
- Thời gian được chuyển đổi sang múi giờ Việt Nam (UTC+7) để hiển thị
- Chỉ customer được phép xem đơn hàng của chính mình (kiểm tra quyền sở hữu)
      "endTime": "2025-08-21T17:00:00.000Z",
      "status": "pending",
      "addressDetail": "Số 123, Đường ABC, Quận XYZ",
      "schedules": [
        {
          "_id": "schedule_id_1",
          "workingDate": "2025-08-20",
          "startTime": "2025-08-20T08:00:00.000Z",
          "endTime": "2025-08-20T12:00:00.000Z",
          "helper_id": "notAvailable",
          "cost": 250000,
          "status": "pending",
          "helper_cost": 180000
        },
        {
          "_id": "schedule_id_2",
          "workingDate": "2025-08-21",
          "startTime": "2025-08-21T13:00:00.000Z",
          "endTime": "2025-08-21T17:00:00.000Z",
          "helper_id": "notAvailable",
          "cost": 200000,
          "status": "pending",
          "helper_cost": 150000
        }
      ],
      "paymentMethod": "cash"
    }
  ],
  "pagination": {
    "totalRequests": 5,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10
  }
}
```

**Lưu ý:** 
- Tất cả thời gian trả về cho client đều đã được chuyển đổi sang múi giờ Việt Nam (UTC+7)
- Các trường thời gian (startTime, endTime, workingDate, orderDate) được chuyển đổi sử dụng hàm `convertUTCToVietnamTime` và `convertUTCToVietnamDate`

### 2.3 Lấy chi tiết đơn hàng
- **Endpoint**: `GET /request/{requestId}`
- **Description**: Lấy thông tin chi tiết của một đơn hàng
- **Authentication**: Bắt buộc (customer only)

**Response Success (200):**
```json
{
  "_id": "request_id",
  "customer_id": "customer_id",
  "service": {
    "_id": "service_id",
    "title": "Dọn dẹp nhà cửa",
    "description": "Dọn dẹp, lau chùi nhà cửa",
    "price": 100000,
    "priceUnit": "giờ"
  },
  "totalCost": 450000,
  "orderDate": "2025-08-19",
  "startTime": "2025-08-20T08:00:00.000Z",
  "endTime": "2025-08-21T17:00:00.000Z",
  "status": "pending",
  "addressDetail": "Số 123, Đường ABC, Quận XYZ",
  "location": {
    "_id": "location_id",
    "name": "Quận XYZ"
  },
  "note": "Mang theo dụng cụ làm vệ sinh",
  "schedules": [
    {
      "_id": "schedule_id_1",
      "workingDate": "2025-08-20",
      "startTime": "2025-08-20T08:00:00.000Z",
      "endTime": "2025-08-20T12:00:00.000Z",
      "helper_id": "notAvailable",
      "cost": 250000,
      "status": "pending",
      "helper_cost": 180000
    },
    {
      "_id": "schedule_id_2",
      "workingDate": "2025-08-21",
      "startTime": "2025-08-21T13:00:00.000Z",
      "endTime": "2025-08-21T17:00:00.000Z",
      "helper_id": "notAvailable",
      "cost": 200000,
      "status": "pending",
      "helper_cost": 150000
    }
  ],
  "paymentMethod": "cash"
}
```

**Lưu ý:** Tất cả thời gian trả về cho client đều đã được chuyển đổi sang múi giờ Việt Nam (UTC+7)

### 2.3 Hủy đơn hàng
- **Endpoint**: `POST /request/cancel`
- **Description**: Hủy một đơn hàng của khách hàng
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "id": "request_id_here"
}
```

**Validation Rules:**
- `id`: Bắt buộc, ID của đơn hàng cần hủy
- Chỉ có thể hủy đơn hàng có status = "pending" hoặc các requestDetail có status = "pending" hoặc "assigned"

**Response Success (200):**
```json
{
  "message": "Đơn hàng đã được hủy thành công"
}
```

**Lưu ý:** 
- Customer chỉ có thể hủy đơn hàng của chính mình
- Không thể hủy đơn hàng đã bắt đầu làm việc (status = "inProgress") hoặc đã hoàn thành
- Khi hủy đơn hàng, tất cả các requestDetail liên quan cũng sẽ được hủy

### 2.4 Đánh giá dịch vụ
- **Endpoint**: `POST /requestDetail/review`
- **Description**: Đánh giá và nhận xét về chất lượng dịch vụ đã hoàn thành
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id_here",
  "comment": {
    "review": "Dịch vụ rất tốt, helper làm việc chuyên nghiệp và tận tâm",
    "loseThings": false,
    "breakThings": false
  }
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của requestDetail cần đánh giá (phải có định dạng ObjectId hợp lệ)
- RequestDetail phải có status = "completed" (đã hoàn thành)
- Chỉ customer đặt đơn mới có thể đánh giá requestDetail của đơn hàng đó
- `comment`: Không bắt buộc, thông tin đánh giá chi tiết
  - `review`: Không bắt buộc, nhận xét bằng văn bản (String)
  - `loseThings`: Không bắt buộc, đánh dấu có mất đồ hay không (Boolean, mặc định: false)
  - `breakThings`: Không bắt buộc, đánh dấu có làm hỏng đồ hay không (Boolean, mặc định: false)

**Response Success (200):**
```json
{
  "message": "Review updated successfully"
}
```

**Response Error (400 - Missing required field):**
```json
{
  "error": "Missing required field",
  "message": "detailId là bắt buộc"
}
```

**Response Error (400 - Invalid ObjectId format):**
```json
{
  "error": "Invalid ObjectId format",
  "message": "detailId phải có định dạng ObjectId hợp lệ"
}
```

**Response Error (400 - Invalid status):**
```json
{
  "error": "Invalid status",
  "message": "Chỉ có thể đánh giá các đơn hàng đã hoàn thành"
}
```

**Response Error (403 - Access denied):**
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể đánh giá đơn hàng của chính mình"
}
```

**Response Error (404 - RequestDetail not found):**
```json
{
  "error": "RequestDetail not found",
  "message": "Không tìm thấy chi tiết đơn hàng"
}
```

**Response Error (404 - Request not found):**
```json
{
  "error": "Request not found", 
  "message": "Không tìm thấy đơn hàng chứa chi tiết này"
}
```

**Lưu ý:**
- Customer chỉ có thể đánh giá các requestDetail thuộc về đơn hàng của chính mình
- RequestDetail phải có trạng thái "completed" (đã hoàn thành) mới có thể đánh giá
- Có thể cập nhật từng thành phần của comment riêng biệt (chỉ gửi review, chỉ gửi loseThings, hoặc kết hợp)
- API sử dụng phương pháp cập nhật từng trường để không ghi đè dữ liệu hiện có
- Thông tin đánh giá sẽ được lưu vào trường `comment` trong requestDetail
- Hệ thống sẽ kiểm tra quyền sở hữu thông qua số điện thoại trong JWT token

**Ví dụ request body khác:**

Chỉ cập nhật nhận xét văn bản:
```json
{
  "detailId": "requestDetail_id_here",
  "comment": {
    "review": "Công việc hoàn thành tốt"
  }
}
```

Chỉ cập nhật thông tin mất/hỏng đồ:
```json
{
  "detailId": "requestDetail_id_here", 
  "comment": {
    "loseThings": true,
    "breakThings": false
  }
}
```

## 3. Service APIs (Quản lý dịch vụ)

### 3.1 Lấy danh sách dịch vụ
- **Endpoint**: `GET /service`
- **Description**: Lấy danh sách tất cả dịch vụ có sẵn
- **Authentication**: Không cần

**Response Success (200):**
```json
[
  {
    "_id": "service_id_1",
    "title": "Dọn dẹp nhà cửa",
    "basicPrice": 100000,
    "coefficient_id": "coefficient_id_here",
    "isActive": true
  },
  {
    "_id": "service_id_2", 
    "title": "Nấu ăn gia đình",
    "basicPrice": 120000,
    "coefficient_id": "coefficient_id_here",
    "isActive": true
  }
]
```

### 3.2 Lấy chi tiết dịch vụ
- **Endpoint**: `GET /service/{idOrTitle}`
- **Description**: Lấy thông tin chi tiết của một dịch vụ theo ID hoặc title
- **Authentication**: Không cần

**Response Success (200):**
```json
{
  "_id": "service_id_1",
  "title": "Dọn dẹp nhà cửa", 
  "basicPrice": 100000,
  "coefficient_id": "coefficient_id_here",
  "isActive": true
}
```

## 4. Location APIs (Quản lý khu vực)

### 4.1 Lấy danh sách khu vực
- **Endpoint**: `GET /location`
- **Description**: Lấy cấu trúc địa chỉ hành chính (tỉnh/thành phố, quận/huyện, phường/xã)
- **Authentication**: Không cần

**Response Success (200):**
```json
[
  {
    "_id": "province_id_1",
    "Name": "Thành phố Hồ Chí Minh",
    "Districts": [
      {
        "_id": "district_id_1",
        "Name": "Quận 1",
        "Wards": [
          {
            "_id": "ward_id_1",
            "Name": "Phường Bến Nghé"
          }
        ]
      }
    ]
  }
]
```

## 5. Notification APIs (Thông báo)

### 5.1 Đăng ký token thiết bị
- **Endpoint**: `POST /notification/register`
- **Description**: Đăng ký token thiết bị để nhận thông báo push
- **Authentication**: Không cần

**Request Body:**
```json
{
  "token": "firebase_device_token_here",
  "phone": "0901234567",
  "deviceType": "android"
}
```

**Validation Rules:**
- `token`: Bắt buộc, token thiết bị từ Firebase
- `phone`: Bắt buộc, số điện thoại người dùng  
- `deviceType`: Không bắt buộc, loại thiết bị ("android", "ios", "web")

**Response Success (200):**
```json
{
  "message": "Đăng ký token thiết bị thành công"
}
```

### 5.2 Kiểm tra trạng thái token
- **Endpoint**: `GET /notification/check/{phone}`
- **Description**: Kiểm tra trạng thái token của người dùng theo số điện thoại
- **Authentication**: Không cần

**Response Success (200):**
```json
{
  "phone": "0901234567",
  "tokens": [
    {
      "token": "firebase_token_here",
      "deviceType": "android",
      "isActive": true,
      "createdAt": "2025-08-19T08:30:00.000Z"
    }
  ]
}
```

### 5.3 Test notification
- **Endpoint**: `POST /notification/test`  
- **Description**: Gửi thông báo test để kiểm tra
- **Authentication**: Không cần

**Request Body:**
```json
{
  "phone": "0901234567",
  "title": "Test notification",
  "body": "This is a test notification"
}
```

**Response Success (200):**
```json
{
  "message": "Test notification sent successfully"
}
```

## 6. Profile APIs (Quản lý hồ sơ)

### 6.1 Lấy thông tin hồ sơ
- **Endpoint**: `GET /customer/{phone}`
- **Description**: Lấy thông tin hồ sơ của khách hàng theo số điện thoại
- **Authentication**: Bắt buộc (customer only, chỉ được xem hồ sơ của chính mình)

**Response Success (200):**
```json
{
  "_id": "customer_id",
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "email": "example@gmail.com",
  "signedUp": true,
  "addresses": [
    {
      "_id": "address_id_1",
      "province": "Thành phố Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé",
      "detailAddress": "Số 123, Đường ABC"
    }
  ]
}
```

### 6.2 Cập nhật hồ sơ  
- **Endpoint**: `PATCH /customer/{phone}`
- **Description**: Cập nhật thông tin hồ sơ của khách hàng
- **Authentication**: Bắt buộc (customer only, chỉ được sửa hồ sơ của chính mình)

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A (Updated)",
  "email": "newemail@gmail.com",
  "addresses": [
    {
      "province": "province_id_here", 
      "district": "district_id_here",
      "ward": "ward_id_here",
      "detailAddress": "Số 456, Đường DEF"
    }
  ]
}
```

**Response Success (200):**
```json
{
  "message": "Cập nhật thông tin thành công",
  "customer": {
    "_id": "customer_id",
    "phone": "0901234567", 
    "fullName": "Nguyễn Văn A (Updated)",
    "email": "newemail@gmail.com",
    "addresses": [
      {
        "_id": "address_id_1",
        "province": "Thành phố Hồ Chí Minh",
        "district": "Quận 1", 
        "ward": "Phường Bến Nghé",
        "detailAddress": "Số 456, Đường DEF"
      }
    ]
  }
}
```

**Lưu ý:**
- Địa chỉ được trả về với tên đầy đủ (đã map từ ID sang tên) 
- Customer chỉ có thể xem và chỉnh sửa thông tin của chính mình
