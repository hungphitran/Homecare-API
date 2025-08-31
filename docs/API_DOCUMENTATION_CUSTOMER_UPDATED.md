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
  "email": "example@gmail.com"
}
```

**Validation Rules:**
- `phone`: Bắt buộc, là số điện thoại Việt Nam (10 số)
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Bắt buộc
- `email`: Không bắt buộc, nhưng phải đúng định dạng email nếu có

**Response Success (201):**
```json
{
  "message": "Đăng ký thành công",
  "customer": {
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
  "token": "jwt_token_here",
  "customer": {
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

## 2. Request Management APIs (Quản lý đơn hàng)

### 2.1 Tạo đơn hàng mới
- **Endpoint**: `POST /request`
- **Description**: Tạo đơn hàng mới với một hoặc nhiều lịch làm việc
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "service_id": "service_id_here",
  "schedules": [
    {
      "workingDate": "2025-08-20",
      "startTime": "08:00",
      "endTime": "12:00"
    },
    {
      "workingDate": "2025-08-21",
      "startTime": "13:00",
      "endTime": "17:00"
    }
  ],
  "addressDetail": "Số 123, Đường ABC, Quận XYZ",
  "location_id": "location_id_here",
  "note": "Mang theo dụng cụ làm vệ sinh",
  "paymentMethod": "cash"
}
```

**Validation Rules:**
- `service_id`: Bắt buộc, ID của dịch vụ
- `schedules`: Bắt buộc, mảng chứa ít nhất 1 lịch làm việc
  - `workingDate`: Bắt buộc, định dạng YYYY-MM-DD
  - `startTime`: Bắt buộc, định dạng HH:MM, giờ bắt đầu làm việc
  - `endTime`: Bắt buộc, định dạng HH:MM, giờ kết thúc làm việc
- `addressDetail`: Bắt buộc, địa chỉ chi tiết
- `location_id`: Bắt buộc, ID của khu vực (location)
- `note`: Không bắt buộc, ghi chú thêm cho đơn hàng
- `paymentMethod`: Bắt buộc, phương thức thanh toán ("cash", "vnpay", "momo")

**Response Success (201):**
```json
{
  "message": "Tạo đơn hàng thành công",
  "request": {
    "_id": "request_id_here",
    "customer_id": "customer_id",
    "service_id": "service_id_here",
    "status": "pending",
    "totalCost": 450000,
    "schedules": [
      {
        "_id": "requestDetail_id_1",
        "workingDate": "2025-08-20",
        "startTime": "2025-08-20T01:00:00.000Z",
        "endTime": "2025-08-20T05:00:00.000Z",
        "helper_id": "notAvailable",
        "cost": 250000,
        "status": "pending",
        "helper_cost": 180000
      },
      {
        "_id": "requestDetail_id_2",
        "workingDate": "2025-08-21",
        "startTime": "2025-08-21T06:00:00.000Z",
        "endTime": "2025-08-21T10:00:00.000Z",
        "helper_id": "notAvailable",
        "cost": 200000,
        "status": "pending",
        "helper_cost": 150000
      }
    ],
    "addressDetail": "Số 123, Đường ABC, Quận XYZ",
    "location_id": "location_id_here",
    "note": "Mang theo dụng cụ làm vệ sinh",
    "paymentMethod": "cash"
  }
}
```

**Lưu ý:**
- Thời gian đặt hàng (orderDate) được tự động gán là ngày hiện tại
- Tất cả startTime và endTime được chuyển đổi sang UTC khi lưu vào database
- Giá tiền (cost, totalCost, helper_cost) được tính toán tự động dựa trên service và thời gian làm việc

### 2.2 Lấy danh sách đơn hàng của khách hàng
- **Endpoint**: `GET /request/my`
- **Description**: Lấy danh sách tất cả đơn hàng của khách hàng hiện tại
- **Authentication**: Bắt buộc (customer only)

**Query Parameters:**
- `status`: Không bắt buộc, lọc theo trạng thái đơn hàng
- `page`: Không bắt buộc, số trang (mặc định: 1)
- `limit`: Không bắt buộc, số lượng kết quả mỗi trang (mặc định: 10)

**Response Success (200):**
```json
{
  "requests": [
    {
      "_id": "request_id",
      "service": {
        "title": "Dọn dẹp nhà cửa"
      },
      "totalCost": 450000,
      "orderDate": "2025-08-19",
      "startTime": "2025-08-20T08:00:00.000Z",
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

### 2.4 Hủy đơn hàng
- **Endpoint**: `POST /request/cancel`
- **Description**: Hủy một đơn hàng
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "request_id": "request_id_here",
  "reason": "Thay đổi lịch trình cá nhân"
}
```

**Validation Rules:**
- `request_id`: Bắt buộc, ID của đơn hàng cần hủy
- `reason`: Bắt buộc, lý do hủy đơn

**Response Success (200):**
```json
{
  "message": "Hủy đơn hàng thành công",
  "request": {
    "_id": "request_id_here",
    "status": "cancelled",
    "cancelReason": "Thay đổi lịch trình cá nhân"
  }
}
```

**Lưu ý:** Chỉ có thể hủy đơn hàng có trạng thái là "pending" hoặc đơn hàng có các requestDetail có trạng thái là "pending".

### 2.5 Đánh giá đơn hàng
- **Endpoint**: `POST /request/review`
- **Description**: Đánh giá đơn hàng sau khi hoàn thành
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "detailId": "requestDetail_id",
  "rating": 5,
  "comment": "Dịch vụ rất tốt, helper làm việc chuyên nghiệp"
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của requestDetail cần đánh giá
- `rating`: Bắt buộc, điểm đánh giá (1-5)
- `comment`: Không bắt buộc, nhận xét của khách hàng

**Response Success (200):**
```json
{
  "message": "Đánh giá thành công",
  "review": {
    "detailId": "requestDetail_id",
    "rating": 5,
    "comment": "Dịch vụ rất tốt, helper làm việc chuyên nghiệp"
  }
}
```

**Lưu ý:** Chỉ có thể đánh giá RequestDetail có trạng thái là "completed"

## 3. Service APIs (Quản lý dịch vụ)

### 3.1 Lấy danh sách dịch vụ
- **Endpoint**: `GET /service`
- **Description**: Lấy danh sách tất cả dịch vụ có sẵn
- **Authentication**: Không bắt buộc

**Response Success (200):**
```json
[
  {
    "_id": "service_id_1",
    "title": "Dọn dẹp nhà cửa",
    "description": "Dọn dẹp, lau chùi nhà cửa",
    "price": 100000,
    "priceUnit": "giờ",
    "imagePath": "url_to_image",
    "isActive": true
  },
  {
    "_id": "service_id_2",
    "title": "Nấu ăn gia đình",
    "description": "Chuẩn bị và nấu ăn theo yêu cầu",
    "price": 120000,
    "priceUnit": "giờ",
    "imagePath": "url_to_image",
    "isActive": true
  }
]
```

### 3.2 Lấy chi tiết dịch vụ
- **Endpoint**: `GET /service/{id}`
- **Description**: Lấy thông tin chi tiết của một dịch vụ
- **Authentication**: Không bắt buộc

**Response Success (200):**
```json
{
  "_id": "service_id_1",
  "title": "Dọn dẹp nhà cửa",
  "description": "Dọn dẹp, lau chùi nhà cửa",
  "price": 100000,
  "priceUnit": "giờ",
  "imagePath": "url_to_image",
  "isActive": true,
  "details": "Chi tiết dịch vụ dọn dẹp nhà cửa bao gồm quét, lau chùi, dọn dẹp bề mặt..."
}
```

## 4. Location APIs (Quản lý khu vực)

### 4.1 Lấy danh sách khu vực
- **Endpoint**: `GET /location`
- **Description**: Lấy danh sách tất cả khu vực hỗ trợ
- **Authentication**: Không bắt buộc

**Response Success (200):**
```json
[
  {
    "_id": "location_id_1",
    "name": "Quận 1",
    "isActive": true
  },
  {
    "_id": "location_id_2",
    "name": "Quận 2",
    "isActive": true
  }
]
```

## 5. Notification APIs (Thông báo)

### 5.1 Đăng ký token thiết bị
- **Endpoint**: `POST /notification/register`
- **Description**: Đăng ký token thiết bị để nhận thông báo push
- **Authentication**: Bắt buộc

**Request Body:**
```json
{
  "deviceToken": "firebase_device_token_here",
  "deviceType": "android"
}
```

**Validation Rules:**
- `deviceToken`: Bắt buộc, token thiết bị từ Firebase
- `deviceType`: Bắt buộc, loại thiết bị ("android", "ios", "web")

**Response Success (200):**
```json
{
  "message": "Đăng ký token thiết bị thành công"
}
```

### 5.2 Lấy danh sách thông báo
- **Endpoint**: `GET /notification/my`
- **Description**: Lấy danh sách thông báo của người dùng hiện tại
- **Authentication**: Bắt buộc

**Query Parameters:**
- `page`: Không bắt buộc, số trang (mặc định: 1)
- `limit`: Không bắt buộc, số lượng kết quả mỗi trang (mặc định: 10)

**Response Success (200):**
```json
{
  "notifications": [
    {
      "_id": "notification_id_1",
      "title": "Đơn hàng mới",
      "body": "Đơn hàng #123456 đã được tạo thành công",
      "data": {
        "type": "new_order",
        "request_id": "request_id_here"
      },
      "isRead": false,
      "createdAt": "2025-08-19T08:30:00.000Z"
    }
  ],
  "pagination": {
    "totalNotifications": 5,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10
  }
}
```

### 5.3 Đánh dấu thông báo đã đọc
- **Endpoint**: `POST /notification/read`
- **Description**: Đánh dấu một hoặc nhiều thông báo đã đọc
- **Authentication**: Bắt buộc

**Request Body:**
```json
{
  "notificationIds": ["notification_id_1", "notification_id_2"]
}
```

**Response Success (200):**
```json
{
  "message": "Đánh dấu thông báo đã đọc thành công"
}
```

## 6. Profile APIs (Quản lý hồ sơ)

### 6.1 Lấy thông tin hồ sơ
- **Endpoint**: `GET /customer/profile`
- **Description**: Lấy thông tin hồ sơ của khách hàng hiện tại
- **Authentication**: Bắt buộc (customer only)

**Response Success (200):**
```json
{
  "_id": "customer_id",
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "email": "example@gmail.com",
  "role": "customer",
  "defaultAddress": "Số 123, Đường ABC, Quận XYZ",
  "defaultLocation_id": "location_id_here"
}
```

### 6.2 Cập nhật hồ sơ
- **Endpoint**: `PUT /customer/profile`
- **Description**: Cập nhật thông tin hồ sơ của khách hàng
- **Authentication**: Bắt buộc (customer only)

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A (Updated)",
  "email": "newemail@gmail.com",
  "defaultAddress": "Số 456, Đường DEF, Quận XYZ",
  "defaultLocation_id": "new_location_id"
}
```

**Response Success (200):**
```json
{
  "message": "Cập nhật hồ sơ thành công",
  "customer": {
    "_id": "customer_id",
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A (Updated)",
    "email": "newemail@gmail.com",
    "role": "customer",
    "defaultAddress": "Số 456, Đường DEF, Quận XYZ",
    "defaultLocation_id": "new_location_id"
  }
}
```
