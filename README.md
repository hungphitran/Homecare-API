# Homecare API

Hệ thống API cho dịch vụ chăm sóc tại nhà với JWT Authentication, hỗ trợ quản lý khách hàng, người giúp việc, và các yêu cầu dịch vụ.

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Models](#models)
- [Error Handling](#error-handling)
- [Deployment](#deployment)

## 🏠 Giới thiệu

**Homecare API** là một hệ thống backend RESTful API được xây dựng để phục vụ ứng dụng dịch vụ chăm sóc tại nhà. Hệ thống cho phép:

- **Khách hàng (Customer)**: Đăng ký, đăng nhập, tạo yêu cầu dịch vụ, quản lý thông tin cá nhân
- **Người giúp việc (Helper)**: Đăng nhập, nhận và xử lý các yêu cầu dịch vụ
- **Quản lý dịch vụ**: Tính toán chi phí, theo dõi trạng thái công việc, quản lý lịch trình

### Tính năng chính

- 🔐 **Xác thực JWT**: Bảo mật với Access Token và Refresh Token
- 👥 **Phân quyền người dùng**: Customer và Helper với quyền hạn khác nhau
- 💰 **Tính toán chi phí động**: Dựa trên dịch vụ, thời gian, vị trí và các yếu tố khác
- 📍 **Quản lý địa điểm**: Hỗ trợ tỉnh/thành, quận/huyện, phường/xã
- 📅 **Quản lý lịch trình**: Theo dõi thời gian làm việc và nghỉ phép
- 💬 **Hệ thống tin nhắn**: Giao tiếp giữa khách hàng và người giúp việc

## 🆕 Cập Nhật Gần Đây (v2.1 - 04/08/2025)

### 🔧 Cải Tiến Xử Lý Thời Gian
- **✅ Fixed**: Xử lý chính xác local time format (`2025-08-06T06:30:00`)
- **✨ Enhanced**: Timezone detection thông minh - phân biệt local time và timezone-aware time
- **🚀 Improved**: Cross-midnight handling được cải thiện cho ca làm việc qua đêm
- **🛡️ Secure**: Bảo tồn ý định thời gian của người dùng

### Formats được hỗ trợ:
- `"08:00"` - Time only (HH:mm)
- `"2025-08-06T08:00:00"` - Local time (preserved exactly)
- `"2025-08-06T08:00:00Z"` - UTC time
- `"2025-08-06T08:00:00+07:00"` - Timezone aware

## 🛠 Công nghệ sử dụng

- **Runtime**: Node.js (≥16.x)
- **Framework**: Express.js
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt cho mã hóa mật khẩu
- **CORS**: Hỗ trợ Cross-Origin Resource Sharing
- **Deployment**: Vercel

## 🚀 Cài đặt và chạy

### Prerequisites

- Node.js (≥16.x)
- MongoDB
- npm hoặc yarn

### Cài đặt

```bash
# Clone repository
git clone https://github.com/hungphitran/Homecare-API.git
cd Homecare-API

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env
```

### Cấu hình môi trường (.env)

```env
# Server
PORT=80

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Other configurations
NODE_ENV=development
```

### Chạy ứng dụng

```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start

# Chạy scripts utility
npm run check-passwords
npm run reset-passwords
```

## 🔐 Authentication

### Cơ chế xác thực

API sử dụng JWT (JSON Web Tokens) với hai loại token:

- **Access Token**: Có thời hạn 24 giờ, dùng để xác thực các request
- **Refresh Token**: Có thời hạn 7 ngày, dùng để làm mới Access Token

### Headers yêu cầu

```javascript
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

### Roles (Vai trò)

- **customer**: Khách hàng sử dụng dịch vụ
- **helper**: Người giúp việc cung cấp dịch vụ

## 📚 API Documentation

### Base URL

```
Production: https://your-vercel-app.vercel.app
Development: http://localhost:80
```

## 🔐 Authentication Endpoints

### 1. Đăng ký khách hàng

```http
POST /auth/register/customer
```

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "email": "example@email.com"
}
```

**Response:**
```json
{
  "message": "Đăng ký thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "phone": "0123456789",
    "fullName": "Nguyễn Văn A",
    "email": "example@email.com",
    "role": "customer"
  }
}
```

### 2. Đăng nhập khách hàng

```http
POST /auth/login/customer
```

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

### 3. Đăng nhập người giúp việc

```http
POST /auth/login/helper
```

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

### 4. Làm mới token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Đổi mật khẩu

```http
POST /auth/change-password
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

## 👥 Customer Endpoints

### 1. Lấy thông tin khách hàng

```http
GET /customer/{phone}
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "example@email.com",
  "addresses": [
    {
      "province": "Hà Nội",
      "district": "Cầu Giấy",
      "ward": "Nghĩa Đô",
      "detailAddress": "123 Hoàng Quốc Việt"
    }
  ],
  "points": [
    {
      "point": 100,
      "updateDate": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. Cập nhật thông tin khách hàng

```http
PATCH /customer/{phone}
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A Updated",
  "email": "newemail@email.com",
  "addresses": [
    {
      "province": "Hà Nội",
      "district": "Cầu Giấy",
      "ward": "Nghĩa Đô",
      "detailAddress": "456 Hoàng Quốc Việt"
    }
  ]
}
```

## 🛠 Request (Yêu cầu dịch vụ) Endpoints

### 1. Tính toán chi phí (Public)

```http
POST /request/calculateCost
```

**Request Body:**
```json
{
  "serviceId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "startTime": "2024-01-15T08:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z",
  "location": {
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "ward": "Nghĩa Đô"
  }
}
```

**Response:**
```json
{
  "service": {
    "title": "Dọn dẹp nhà cửa",
    "coefficient_service": 1.2,
    "coefficient_other": 1.1,
    "cost": 50000
  },
  "totalCost": 264000,
  "breakdown": {
    "baseCost": 200000,
    "serviceCoefficient": 1.2,
    "timeCoefficient": 1.1,
    "finalCost": 264000
  }
}
```

### 2. Tạo yêu cầu dịch vụ

```http
POST /request
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "service": {
    "title": "Dọn dẹp nhà cửa",
    "coefficient_service": 1.2,
    "coefficient_other": 1.1,
    "cost": 50000
  },
  "startTime": "2024-01-15T08:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z",
  "customerInfo": {
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội",
    "usedPoint": 0
  },
  "location": {
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "ward": "Nghĩa Đô"
  },
  "requestType": "regular",
  "totalCost": 264000
}
```

### 3. Lấy danh sách yêu cầu của khách hàng

```http
GET /request/{phone}
Authorization: Bearer {accessToken}
```

### 4. Hủy yêu cầu (Customer only)

```http
POST /request/cancel
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "reason": "Thay đổi lịch trình"
}
```

### 5. Nhận việc (Helper only)

```http
POST /request/assign
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "requestId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### 6. Từ chối việc (Helper only)

```http
POST /request/reject
Authorization: Bearer {accessToken}
```

### 7. Bắt đầu làm việc (Helper only)

```http
POST /request/processing
Authorization: Bearer {accessToken}
```

### 8. Hoàn thành công việc (Helper only)

```http
POST /request/finish
Authorization: Bearer {accessToken}
```

### 9. Hoàn thành thanh toán (Helper only)

```http
POST /request/finishpayment
Authorization: Bearer {accessToken}
```

## 👨‍🔧 Helper Endpoints

### 1. Lấy danh sách người giúp việc (Public)

```http
GET /helper
```

**Response:**
```json
[
  {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "fullName": "Trần Thị B",
    "phone": "0987654321",
    "avatar": "https://example.com/avatar.jpg",
    "rating": 4.8,
    "experience": "3 năm kinh nghiệm",
    "services": ["Dọn dẹp", "Nấu ăn", "Chăm sóc người già"],
    "isAvailable": true
  }
]
```

### 2. Lấy thông tin chi tiết người giúp việc (Public)

```http
GET /helper/{id}
```

## 🛍 Service Endpoints

### 1. Lấy danh sách dịch vụ (Public)

```http
GET /service
```

**Response:**
```json
[
  {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Dọn dẹp nhà cửa",
    "description": "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp",
    "coefficient_service": 1.2,
    "baseCost": 50000,
    "category": "cleaning",
    "duration": "2-4 giờ",
    "image": "https://example.com/service.jpg"
  }
]
```

### 2. Lấy thông tin chi tiết dịch vụ (Public)

```http
GET /service/{id}
```

## 📍 Location Endpoints

### 1. Lấy danh sách địa điểm (Public)

```http
GET /location
```

**Response:**
```json
{
  "provinces": [
    {
      "name": "Hà Nội",
      "districts": [
        {
          "name": "Cầu Giấy",
          "wards": ["Nghĩa Đô", "Nghĩa Tân", "Mai Dịch"]
        }
      ]
    }
  ]
}
```

## 📰 Blog Endpoints

### 1. Lấy danh sách blog (Public)

```http
GET /blog
```

### 2. Lấy chi tiết blog (Public)

```http
GET /blog/{id}
```

## 💬 Message Endpoints

### 1. Gửi tin nhắn

```http
POST /message
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "message": "Xin chào, tôi sẽ đến đúng giờ",
  "recipientRole": "customer"
}
```

### 2. Lấy tin nhắn theo yêu cầu

```http
GET /message/request/{requestId}
Authorization: Bearer {accessToken}
```

## ⚙️ General Settings

### 1. Lấy cài đặt chung

```http
GET /general
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "businessHours": {
    "start": "08:00",
    "end": "18:00"
  },
  "holidayCoefficient": 1.5,
  "weekendCoefficient": 1.2,
  "overtimeCoefficient": 1.3,
  "minimumBookingHours": 2,
  "cancellationDeadline": 24
}
```

## 📝 Models

### Customer Model
```javascript
{
  fullName: String,
  phone: String,
  email: String,
  password: String,
  signedUp: Boolean,
  points: [{
    point: Number,
    updateDate: Date
  }],
  addresses: [{
    province: String,
    district: String,
    ward: String,
    detailAddress: String
  }],
  timestamps: true
}
```

### Request Model
```javascript
{
  orderDate: Date,
  scheduleIds: Array,
  startTime: Date,
  endTime: Date,
  comment: {
    review: String,
    loseThings: Boolean,
    breakThings: Boolean
  },
  customerInfo: {
    fullName: String,
    phone: String,
    address: String,
    usedPoint: Number
  },
  requestType: String,
  service: {
    title: String,
    coefficient_service: Number,
    coefficient_other: Number,
    cost: Number
  },
  totalCost: Number,
  profit: Number,
  status: String, // "notDone", "processing", "done", "cancelled"
  location: {
    province: String,
    district: String,
    ward: String
  },
  deleted: Boolean,
  createdBy: String,
  assignedTo: String,
  timestamps: true
}
```

## ❌ Error Handling

### Cấu trúc lỗi chuẩn

```json
{
  "error": "Error Type",
  "message": "Thông báo lỗi chi tiết",
  "statusCode": 400
}
```

### Mã lỗi thường gặp

| Status Code | Error Type | Mô tả |
|------------|------------|--------|
| 400 | Bad Request | Dữ liệu đầu vào không hợp lệ |
| 401 | Unauthorized | Không có quyền truy cập |
| 403 | Forbidden | Bị cấm truy cập |
| 404 | Not Found | Không tìm thấy tài nguyên |
| 409 | Conflict | Xung đột dữ liệu (số điện thoại đã tồn tại) |
| 500 | Internal Server Error | Lỗi hệ thống |

### Ví dụ lỗi validation

```json
{
  "error": "Validation Error",
  "message": "Vui lòng cung cấp số điện thoại và mật khẩu",
  "statusCode": 400
}
```

### Ví dụ lỗi authentication

```json
{
  "error": "Authentication Error",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "statusCode": 401
}
```

## 🚀 Deployment

### Vercel Deployment

Dự án được cấu hình để deploy trên Vercel với file `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```

### Environment Variables trên Vercel

Cần cấu hình các biến môi trường sau trên Vercel Dashboard:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`

## 🔧 Scripts Utility

### Kiểm tra mật khẩu
```bash
npm run check-passwords
```

### Reset mật khẩu (an toàn)
```bash
npm run reset-passwords
```

### Reset mật khẩu (force)
```bash
npm run reset-passwords-force
```

## 📞 Liên hệ

- **Tác giả**: Trần Phi Hùng
- **Email**: [your-email@example.com]
- **GitHub**: [https://github.com/hungphitran](https://github.com/hungphitran)

## 📄 License

Dự án này được phân phối dưới giấy phép ISC. Xem file `LICENSE` để biết thêm chi tiết.

---

## 🔗 Frontend Integration Guide

### Cài đặt Authentication

```javascript
// utils/auth.js
class AuthService {
  constructor() {
    this.baseURL = 'https://your-api-domain.vercel.app';
    this.token = localStorage.getItem('accessToken');
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      this.token = data.accessToken;
    }
    return data;
  }

  async login(phone, password) {
    const response = await fetch(`${this.baseURL}/auth/login/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password })
    });
    
    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      this.token = data.accessToken;
    }
    return data;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

export default new AuthService();
```

### Sử dụng API trong React/Vue

```javascript
// services/api.js
import AuthService from './auth';

class APIService {
  constructor() {
    this.baseURL = 'https://your-api-domain.vercel.app';
  }

  async getServices() {
    const response = await fetch(`${this.baseURL}/service`);
    return response.json();
  }

  async createRequest(requestData) {
    const response = await fetch(`${this.baseURL}/request`, {
      method: 'POST',
      headers: AuthService.getAuthHeaders(),
      body: JSON.stringify(requestData)
    });
    return response.json();
  }

  async calculateCost(costData) {
    const response = await fetch(`${this.baseURL}/request/calculateCost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(costData)
    });
    return response.json();
  }

  async getMyRequests(phone) {
    const response = await fetch(`${this.baseURL}/request/${phone}`, {
      headers: AuthService.getAuthHeaders()
    });
    return response.json();
  }
}

export default new APIService();
```

### Error Handling cho Frontend

```javascript
// utils/errorHandler.js
export const handleAPIError = (error) => {
  if (error.statusCode === 401) {
    // Token hết hạn, chuyển về trang login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  } else if (error.statusCode === 403) {
    // Không có quyền
    alert('Bạn không có quyền thực hiện thao tác này');
  } else {
    // Lỗi khác
    alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
  }
};
```

Tài liệu này cung cấp hướng dẫn đầy đủ để tích hợp với Homecare API. Để biết thêm chi tiết, vui lòng tham khảo mã nguồn hoặc liên hệ với đội phát triển.
