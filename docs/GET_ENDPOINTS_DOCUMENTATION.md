# Tài Liệu API - Các Endpoint GET và Endpoints Khác

## Mục Lục
1. [Service Endpoints](#service-endpoints)
2. [Helper Endpoints](#helper-endpoints)
3. [Customer Endpoints](#customer-endpoints)
4. [Request Management Endpoints](#request-management-endpoints)
5. [Request Detail Endpoints](#request-detail-endpoints)
6. [Location Endpoints](#location-endpoints)
7. [Blog Endpoints](#blog-endpoints)
8. [General Settings Endpoints](#general-settings-endpoints)
9. [Policy Endpoints](#policy-endpoints)
10. [Question (FAQ) Endpoints](#question-faq-endpoints)
11. [Discount Endpoints](#discount-endpoints)
12. [Time Off Endpoints](#time-off-endpoints)
13. [Cost Factor Endpoints](#cost-factor-endpoints)

---

## Service Endpoints

### 1. Lấy Tất Cả Dịch Vụ
**Endpoint:** `GET /service/`

**Mô tả:** Lấy danh sách tất cả các dịch vụ đang hoạt động

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Dọn dẹp nhà cửa",
    "basicPrice": 50000,
    "coefficient_id": "coeff_001",
    "description": "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp, bao gồm quét nhà, lau nhà, dọn dẹp phòng tắm"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Chăm sóc người già",
    "basicPrice": 80000,
    "coefficient_id": "coeff_002", 
    "description": "Chăm sóc người cao tuổi tại nhà, hỗ trợ sinh hoạt hàng ngày"
  }
]
```

---

### 2. Lấy Thông Tin Chi Tiết Dịch Vụ
**Endpoint:** `GET /service/:id`

**Mô tả:** Lấy thông tin chi tiết của một dịch vụ theo ID

**Headers:** Không yêu cầu authentication

**Parameters:**
- `id` (string): ID của dịch vụ

**Response Body:**

*Thành công (200):*
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Dọn dẹp nhà cửa",
  "basicPrice": 50000,
  "coefficient_id": "coeff_001",
  "description": "Dịch vụ dọn dẹp nhà cửa chuyên nghiệp, bao gồm quét nhà, lau nhà, dọn dẹp phòng tắm"
}
```

*Lỗi (404):*
```json
null
```

---

## Helper Endpoints

### 3. Lấy Tất Cả Helper
**Endpoint:** `GET /helper/`

**Mô tả:** Lấy danh sách tất cả helper (thông tin công khai)

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "helper_id": "HLP001",
    "fullName": "Trần Thị Lan",
    "startDate": "2024-01-15T00:00:00.000Z",
    "birthDate": "1990-05-20T00:00:00.000Z",
    "phone": "0987654321",
    "birthPlace": "Hà Nội",
    "address": "123 Đường ABC, Quận Ba Đình, Hà Nội",
    "workingArea": {
      "province": "Hà Nội",
      "districts": ["Ba Đình", "Hoàn Kiếm", "Đống Đa"]
    },
    "jobs": ["Dọn dẹp nhà cửa", "Chăm sóc người già"],
    "yearOfExperience": 3,
    "experienceDescription": "3 năm kinh nghiệm làm việc tại các gia đình",
    "avatar": "https://example.com/avatar1.jpg",
    "healthCertificates": ["cert1.pdf", "cert2.pdf"],
    "gender": "Nữ",
    "nationality": "Việt Nam",
    "educationLevel": "Trung học phổ thông",
    "height": 160,
    "weight": 55,
    "status": "active"
  }
]
```

---

### 4. Lấy Thông Tin Chi Tiết Helper
**Endpoint:** `GET /helper/:id`

**Mô tả:** Lấy thông tin chi tiết của một helper theo ID

**Headers:** Không yêu cầu authentication

**Parameters:**
- `id` (string): ID của helper

**Response Body:**

*Thành công (200):*
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "helper_id": "HLP001",
  "fullName": "Trần Thị Lan",
  "startDate": "2024-01-15T00:00:00.000Z",
  "birthDate": "1990-05-20T00:00:00.000Z",
  "phone": "0987654321",
  "birthPlace": "Hà Nội",
  "address": "123 Đường ABC, Quận Ba Đình, Hà Nội",
  "workingArea": {
    "province": "Hà Nội",
    "districts": ["Ba Đình", "Hoàn Kiếm", "Đống Đa"]
  },
  "jobs": ["Dọn dẹp nhà cửa", "Chăm sóc người già"],
  "yearOfExperience": 3,
  "experienceDescription": "3 năm kinh nghiệm làm việc tại các gia đình",
  "avatar": "https://example.com/avatar1.jpg",
  "healthCertificates": ["cert1.pdf", "cert2.pdf"],
  "gender": "Nữ",
  "nationality": "Việt Nam",
  "educationLevel": "Trung học phổ thông",
  "height": 160,
  "weight": 55,
  "status": "active"
}
```

*Lỗi (404):*
```json
null
```

---

## Customer Endpoints

### 5. Lấy Thông Tin Customer
**Endpoint:** `GET /customer/:phone`

**Mô tả:** Customer lấy thông tin của chính mình

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `phone` (string): Số điện thoại của customer

**Response Body:**

*Thành công (200):*
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "fullName": "Nguyễn Văn Nam",
  "phone": "0123456789",
  "email": "nguyenvannam@email.com",
  "signedUp": true,
  "points": [
    {
      "point": 100,
      "updateDate": "2024-08-01T00:00:00.000Z"
    },
    {
      "point": 50,
      "updateDate": "2024-07-15T00:00:00.000Z"
    }
  ],
  "addresses": [
    {
      "province": "Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé",
      "detailAddress": "123 Đường Lê Lợi"
    },
    {
      "province": "Hồ Chí Minh",
      "district": "Quận 3",
      "ward": "Phường Võ Thị Sáu",
      "detailAddress": "456 Đường Cách Mạng Tháng 8"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-08-01T00:00:00.000Z"
}
```

*Lỗi (403):*
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể xem thông tin của chính mình"
}
```

*Lỗi (404):*
```json
{
  "error": "Customer not found",
  "message": "Không tìm thấy khách hàng"
}
```

---

### 6. Cập Nhật Thông Tin Customer
**Endpoint:** `PATCH /customer/:phone`

**Mô tả:** Customer cập nhật thông tin của chính mình

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `phone` (string): Số điện thoại của customer

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn Nam Updated",
  "email": "newemail@example.com",
  "addresses": [
    {
      "province": "Hồ Chí Minh",
      "district": "Quận 2",
      "ward": "Phường An Phú",
      "detailAddress": "456 Đường Xa lộ Hà Nội"
    }
  ]
}
```

**Response Body:**

*Thành công (200):*
```json
{
  "message": "Cập nhật thông tin thành công",
  "customer": {
    "_id": "507f1f77bcf86cd799439014",
    "fullName": "Nguyễn Văn Nam Updated",
    "phone": "0123456789",
    "email": "newemail@example.com",
    "signedUp": true,
    "points": [
      {
        "point": 100,
        "updateDate": "2024-08-01T00:00:00.000Z"
      }
    ],
    "addresses": [
      {
        "province": "Hồ Chí Minh",
        "district": "Quận 2",
        "ward": "Phường An Phú",
        "detailAddress": "456 Đường Xa lộ Hà Nội"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-08-03T00:00:00.000Z"
  }
}
```

*Lỗi (400):*
```json
{
  "error": "Invalid email format",
  "message": "Email không đúng định dạng"
}
```

---

## Request Management Endpoints

### 7. Lấy Request Theo Số Điện Thoại
**Endpoint:** `GET /request/:phone`

**Mô tả:** Customer lấy danh sách request của chính mình

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `phone` (string): Số điện thoại của customer

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "orderDate": "2025-08-04T00:00:00.000Z",
    "requestType": "normal",
    "scheduleIds": [
      "507f1f77bcf86cd799439016",
      "507f1f77bcf86cd799439017"
    ],
    "startTime": "2025-08-04T06:30:00.000Z",
    "endTime": "2025-08-04T10:30:00.000Z",
    "customerInfo": {
      "phone": "0123456789",
      "fullName": "Nguyễn Văn Nam",
      "email": "nguyenvannam@email.com",
      "address": "123 Đường Lê Lợi, Quận 1",
      "usedPoint": 0
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
    "totalCost": 200000,
    "status": "assigned"
  }
]
```

*Lỗi (403):*
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể xem request của chính mình"
}
```

---

## Request Detail Endpoints

### 8. Lấy Request Detail Theo Helper ID
**Endpoint:** `GET /requestDetail/helper/:id`

**Mô tả:** Helper lấy danh sách request detail được gán cho mình

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (string): Helper ID (ví dụ: "HLP001")

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "startTime": "2025-08-04T06:30:00.000Z",
    "endTime": "2025-08-04T10:30:00.000Z",
    "workingDate": "2025-08-04T00:00:00.000Z",
    "helper_id": "HLP001",
    "cost": 200000,
    "helper_cost": 150000,
    "status": "processing",
    "comment": "Dịch vụ tốt, helper làm việc chu đáo"
  },
  {
    "_id": "507f1f77bcf86cd799439017",
    "startTime": "2025-08-05T08:00:00.000Z",
    "endTime": "2025-08-05T12:00:00.000Z",
    "workingDate": "2025-08-05T00:00:00.000Z",
    "helper_id": "HLP001",
    "cost": 180000,
    "helper_cost": 140000,
    "status": "assigned",
    "comment": null
  }
]
```

*Lỗi (403):*
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể xem request detail của chính mình"
}
```

---

### 9. Lấy Request Detail Theo IDs
**Endpoint:** `GET /requestDetail/?ids=id1,id2,id3`

**Mô tả:** Lấy request details theo danh sách IDs

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `ids` (string): Danh sách IDs cách nhau bởi dấu phẩy

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "startTime": "2025-08-04T06:30:00.000Z",
    "endTime": "2025-08-04T10:30:00.000Z",
    "workingDate": "2025-08-04T00:00:00.000Z",
    "helper_id": "HLP001",
    "cost": 200000,
    "helper_cost": 150000,
    "status": "processing",
    "comment": "Dịch vụ tốt"
  }
]
```

---

## Location Endpoints

### 10. Lấy Danh Sách Địa Điểm
**Endpoint:** `GET /location/`

**Mô tả:** Lấy danh sách tỉnh thành, quận huyện, phường xã

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "Name": "Hồ Chí Minh",
    "Districts": [
      {
        "Name": "Quận 1",
        "Wards": [
          {
            "Name": "Phường Bến Nghé"
          },
          {
            "Name": "Phường Bến Thành"
          }
        ]
      },
      {
        "Name": "Quận 2",
        "Wards": [
          {
            "Name": "Phường An Phú"
          },
          {
            "Name": "Phường Thảo Điền"
          }
        ]
      }
    ]
  },
  {
    "Name": "Hà Nội",
    "Districts": [
      {
        "Name": "Ba Đình",
        "Wards": [
          {
            "Name": "Phường Điện Biên"
          },
          {
            "Name": "Phường Đội Cấn"
          }
        ]
      }
    ]
  }
]
```

---

## Blog Endpoints

### 11. Lấy Tất Cả Blog
**Endpoint:** `GET /blog/`

**Mô tả:** Lấy danh sách tất cả blog đang hoạt động

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Tips chăm sóc nhà cửa hiệu quả",
    "content": "Nội dung blog về cách chăm sóc nhà cửa...",
    "author": "Admin",
    "date": "2025-08-01T00:00:00.000Z",
    "thumbnail": "https://example.com/blog1.jpg",
    "tags": ["homecare", "tips"],
    "views": 150
  },
  {
    "_id": "507f1f77bcf86cd799439019",
    "title": "Cách chọn helper phù hợp",
    "content": "Hướng dẫn chọn helper...",
    "author": "Expert",
    "date": "2025-07-28T00:00:00.000Z",
    "thumbnail": "https://example.com/blog2.jpg",
    "tags": ["helper", "guide"],
    "views": 98
  }
]
```

---

### 12. Lấy Chi Tiết Blog
**Endpoint:** `GET /blog/:id`

**Mô tả:** Lấy thông tin chi tiết của một blog

**Headers:** Không yêu cầu authentication

**Parameters:**
- `id` (string): ID của blog

**Response Body:**

*Thành công (200):*
```json
{
  "_id": "507f1f77bcf86cd799439018",
  "title": "Tips chăm sóc nhà cửa hiệu quả",
  "content": "Nội dung chi tiết của blog về cách chăm sóc nhà cửa. Bao gồm các mẹo hay và kinh nghiệm thực tế từ các chuyên gia...",
  "author": "Admin",
  "date": "2025-08-01T00:00:00.000Z",
  "thumbnail": "https://example.com/blog1.jpg",
  "tags": ["homecare", "tips"],
  "views": 150,
  "status": "active",
  "createdAt": "2025-08-01T00:00:00.000Z",
  "updatedAt": "2025-08-01T00:00:00.000Z"
}
```

---

## General Settings Endpoints

### 13. Lấy Cài Đặt Chung
**Endpoint:** `GET /general/`

**Mô tả:** Lấy các cài đặt chung của hệ thống

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
{
  "officeStartTime": "08:00",
  "officeEndTime": "17:00",
  "serviceFee": 5000,
  "deliveryFee": 20000,
  "maxBookingDays": 30,
  "supportPhone": "1900123456",
  "supportEmail": "support@homecare.vn",
  "companyName": "Homecare Solutions",
  "companyAddress": "123 Đường ABC, Quận 1, TP.HCM"
}
```

---

## Policy Endpoints

### 14. Lấy Tất Cả Chính Sách
**Endpoint:** `GET /policy/`

**Mô tả:** Lấy danh sách tất cả chính sách đang hoạt động

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "title": "Chính sách bảo mật thông tin",
    "content": "Nội dung chi tiết về chính sách bảo mật...",
    "type": "privacy",
    "effectiveDate": "2024-01-01T00:00:00.000Z"
  },
  {
    "title": "Điều khoản sử dụng dịch vụ",
    "content": "Các điều khoản và điều kiện sử dụng dịch vụ...",
    "type": "terms",
    "effectiveDate": "2024-01-01T00:00:00.000Z"
  },
  {
    "title": "Chính sách hoàn tiền",
    "content": "Quy định về việc hoàn tiền khi hủy dịch vụ...",
    "type": "refund",
    "effectiveDate": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## Question (FAQ) Endpoints

### 15. Lấy Tất Cả Câu Hỏi Thường Gặp
**Endpoint:** `GET /question/`

**Mô tả:** Lấy danh sách tất cả câu hỏi thường gặp

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "question": "Làm thế nào để đặt dịch vụ?",
    "answer": "Bạn có thể đặt dịch vụ qua ứng dụng di động hoặc website của chúng tôi. Chọn dịch vụ, thời gian và địa điểm, sau đó xác nhận đặt hàng."
  },
  {
    "question": "Có thể hủy dịch vụ được không?",
    "answer": "Bạn có thể hủy dịch vụ trước 2 giờ so với thời gian bắt đầu làm việc mà không mất phí. Hủy muộn hơn sẽ bị tính phí theo quy định."
  },
  {
    "question": "Helper có được kiểm tra sức khỏe không?",
    "answer": "Tất cả helper đều được kiểm tra sức khỏe định kỳ và có giấy chứng nhận sức khỏe hợp lệ trước khi làm việc."
  }
]
```

---

## Discount Endpoints

### 16. Lấy Tất Cả Khuyến Mãi
**Endpoint:** `GET /discount/`

**Mô tả:** Lấy danh sách tất cả khuyến mãi đang hoạt động

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "code": "NEWUSER20",
    "title": "Giảm 20% cho khách hàng mới",
    "description": "Áp dụng cho lần đặt dịch vụ đầu tiên",
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderValue": 100000,
    "maxDiscountAmount": 50000,
    "validFrom": "2025-08-01T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "usageLimit": 1000,
    "usedCount": 245,
    "status": true,
    "applicableServices": ["all"],
    "createdAt": "2025-08-01T00:00:00.000Z",
    "updatedAt": "2025-08-03T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439021",
    "code": "SUMMER50",
    "title": "Giảm 50K dịch vụ mùa hè",
    "description": "Khuyến mãi đặc biệt mùa hè",
    "discountType": "fixed",
    "discountValue": 50000,
    "minOrderValue": 200000,
    "maxDiscountAmount": 50000,
    "validFrom": "2025-06-01T00:00:00.000Z",
    "validTo": "2025-08-31T23:59:59.000Z",
    "usageLimit": 500,
    "usedCount": 123,
    "status": true,
    "applicableServices": ["Dọn dẹp nhà cửa"],
    "createdAt": "2025-06-01T00:00:00.000Z",
    "updatedAt": "2025-08-03T00:00:00.000Z"
  }
]
```

---

## Time Off Endpoints

### 17. Lấy Danh Sách Ngày Nghỉ Của Helper
**Endpoint:** `GET /timeOff/:id`

**Mô tả:** Helper lấy danh sách ngày nghỉ của chính mình

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (string): Helper ID (ví dụ: "HLP001")

**Response Body:**

*Thành công (200):*
```json
[
  {
    "helper_id": "HLP001",
    "startDate": "2025-08-10T00:00:00.000Z",
    "endDate": "2025-08-12T00:00:00.000Z",
    "reason": "Nghỉ phép cá nhân",
    "timeOffType": "personal",
    "createdAt": "2025-08-01T00:00:00.000Z",
    "updatedAt": "2025-08-01T00:00:00.000Z"
  },
  {
    "helper_id": "HLP001",
    "startDate": "2025-08-20T00:00:00.000Z",
    "endDate": "2025-08-20T00:00:00.000Z",
    "reason": "Khám sức khỏe định kỳ",
    "timeOffType": "medical",
    "createdAt": "2025-08-05T00:00:00.000Z",
    "updatedAt": "2025-08-05T00:00:00.000Z"
  }
]
```

*Lỗi (403):*
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể xem time off của chính mình"
}
```

---

## Cost Factor Endpoints

### 18. Lấy Tất Cả Hệ Số Chi Phí
**Endpoint:** `GET /costFactor/`

**Mô tả:** Lấy tất cả hệ số chi phí đang hoạt động

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "applyTo": "service",
    "name": "Hệ số dịch vụ",
    "description": "Các hệ số áp dụng cho từng loại dịch vụ",
    "coefficientList": [
      {
        "_id": "coeff_001",
        "name": "Dọn dẹp nhà cửa",
        "value": 1.2,
        "description": "Hệ số cho dịch vụ dọn dẹp"
      },
      {
        "_id": "coeff_002", 
        "name": "Chăm sóc người già",
        "value": 1.8,
        "description": "Hệ số cho dịch vụ chăm sóc"
      }
    ],
    "status": "active"
  },
  {
    "applyTo": "other",
    "name": "Hệ số khác",
    "description": "Các hệ số áp dụng cho thời gian và ngày đặc biệt",
    "coefficientList": [
      {
        "_id": "other_001",
        "name": "Làm thêm giờ",
        "value": 1.5,
        "description": "Hệ số cho giờ làm thêm"
      },
      {
        "_id": "other_002",
        "name": "Cuối tuần",
        "value": 1.3,
        "description": "Hệ số cho ngày cuối tuần"
      }
    ],
    "status": "active"
  }
]
```

---

### 19. Lấy Hệ Số Dịch Vụ
**Endpoint:** `GET /costFactor/service`

**Mô tả:** Lấy các hệ số áp dụng cho dịch vụ

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
[
  {
    "applyTo": "service",
    "name": "Hệ số dịch vụ",
    "description": "Các hệ số áp dụng cho từng loại dịch vụ",
    "coefficientList": [
      {
        "_id": "coeff_001",
        "name": "Dọn dẹp nhà cửa",
        "value": 1.2,
        "description": "Hệ số cho dịch vụ dọn dẹp"
      },
      {
        "_id": "coeff_002",
        "name": "Chăm sóc người già", 
        "value": 1.8,
        "description": "Hệ số cho dịch vụ chăm sóc"
      }
    ],
    "status": "active"
  }
]
```

---

### 20. Lấy Hệ Số Khác
**Endpoint:** `GET /costFactor/other`

**Mô tả:** Lấy các hệ số khác (thời gian, ngày đặc biệt)

**Headers:** Không yêu cầu authentication

**Response Body:**

*Thành công (200):*
```json
{
  "applyTo": "other",
  "name": "Hệ số khác",
  "description": "Các hệ số áp dụng cho thời gian và ngày đặc biệt",
  "coefficientList": [
    {
      "_id": "other_001",
      "name": "Làm thêm giờ",
      "value": 1.5,
      "description": "Hệ số cho giờ làm thêm (trước 8h và sau 17h)"
    },
    {
      "_id": "other_002",
      "name": "Cuối tuần",
      "value": 1.3,
      "description": "Hệ số cho ngày cuối tuần (thứ 7, chủ nhật)"
    },
    {
      "_id": "other_003",
      "name": "Ngày lễ",
      "value": 2.0,
      "description": "Hệ số cho các ngày lễ tết"
    }
  ],
  "status": "active"
}
```

---

## Ghi Chú Quan Trọng

### Authentication & Authorization
- **Public Endpoints**: Service, Helper, Location, Blog, General, Policy, Question, Discount, Cost Factor
- **Protected Endpoints**: Customer, Request, Request Detail, Time Off
- **Role-based Access**:
  - Customer: Chỉ có thể truy cập dữ liệu của chính mình
  - Helper: Chỉ có thể truy cập request detail và time off của chính mình

### Data Selection
- Hầu hết các endpoint đã loại bỏ các field nhạy cảm như:
  - `password`, `__v`, `deleted`, `createdBy`, `updatedBy`, `deletedBy`
  - Timestamps (`createdAt`, `updatedAt`) được giữ lại ở một số endpoint cần thiết

### Response Format
- **Thành công**: Trả về data trực tiếp hoặc array of objects
- **Lỗi**: Trả về object chứa `error` và `message`
- **Không tìm thấy**: Trả về `null` hoặc array rỗng `[]`

### Sort & Filter
- **Blog**: Sắp xếp theo ngày giảm dần (`date: -1`)
- **Request Detail**: Sắp xếp theo ngày làm việc giảm dần (`workingDate: -1`)
- **Status Filter**: Chỉ trả về items có status `"active"` hoặc `true`

### Common Status Values
- **Request**: `"notDone"`, `"assigned"`, `"processing"`, `"waitPayment"`, `"done"`, `"cancelled"`
- **Request Detail**: `"notDone"`, `"assigned"`, `"processing"`, `"waitPayment"`, `"done"`, `"cancelled"`
- **General Status**: `"active"`, `"inactive"`
- **Discount Status**: `true`, `false`

### Best Practices
1. **Luôn check Authorization header** cho protected endpoints
2. **Validate ownership** trước khi trả về dữ liệu nhạy cảm
3. **Use appropriate HTTP status codes**: 200, 403, 404, 500
4. **Select only necessary fields** để tối ưu performance
5. **Implement pagination** cho endpoints trả về nhiều data (nếu cần)

### Customer Registration Changes (Mới)
- **Địa chỉ bắt buộc**: Khi đăng ký customer mới, bắt buộc phải cung cấp địa chỉ đầy đủ
- **Địa chỉ đầu tiên**: Sẽ được lưu vào mảng `addresses[0]` và có thể dùng làm địa chỉ mặc định
- **Nhiều địa chỉ**: Customer có thể có nhiều địa chỉ, được lưu trong mảng `addresses`
- **Cấu trúc địa chỉ**: Mỗi địa chỉ bao gồm `province`, `district`, `ward`, `detailAddress`

---

*Tài liệu này được cập nhật ngày 03/08/2025 - Thêm yêu cầu địa chỉ bắt buộc cho đăng ký customer*
