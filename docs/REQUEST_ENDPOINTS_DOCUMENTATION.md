# 📋 Tài liệu API Request Endpoints - Homecare API

## 📌 Tổng quan

API Request Endpoints quản lý toàn bộ quy trình tạo, xử lý và theo dõi các yêu cầu dịch vụ trong hệ thống Homecare. Các endpoint này hỗ trợ nhiều vai trò khác nhau: Customer (khách hàng), Helper (người giúp việc) và quyền truy cập công khai.

## 🔐 Xác thực và Phân quyền

### Loại xác thực:
- **Public**: Không cần token xác thực
- **Customer**: Cần token và role = 'customer'
- **Helper**: Cần token và role = 'helper' 
- **Owner**: Cần token và chỉ truy cập được dữ liệu của chính mình

### Header xác thực:
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

---

## 📊 1. Tính toán chi phí dịch vụ (Public)

### Endpoint
```http
POST /request/calculateCost
```

### Mô tả
Tính toán chi phí dịch vụ dựa trên loại dịch vụ, thời gian và ngày làm việc. Endpoint này không yêu cầu xác thực.

### Request Body
Hỗ trợ nhiều định dạng input:

#### Format 1: Sử dụng serviceTitle và thời gian HH:mm
```json
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "startTime": "08:00",
  "endTime": "12:00",
  "workDate": "2024-01-15"
}
```

#### Format 2: Sử dụng serviceId và ISO timestamp
```json
{
  "serviceId": "67c5d72c78f7a2a704b027ee",
  "startTime": "2025-08-14T06:30:00.000Z",
  "endTime": "2025-08-14T08:30:00.000Z"
}
```

#### Format 3: Mixed format
```json
{
  "serviceId": "67c5d72c78f7a2a704b027ee",
  "startTime": "08:00",
  "endTime": "12:00", 
  "workDate": "2024-01-15",
  "location": {
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "ward": "Nghĩa Đô"
  }
}
```

### Tham số bắt buộc
- `serviceTitle` HOẶC `serviceId`: Tên dịch vụ hoặc ID dịch vụ
- `startTime`: Thời gian bắt đầu (HH:mm hoặc ISO format)
- `endTime`: Thời gian kết thúc (HH:mm hoặc ISO format)
- `workDate`: Ngày làm việc (YYYY-MM-DD hoặc tự động từ startTime nếu là ISO)

### Tham số tùy chọn
- `location`: Thông tin địa điểm (có thể ảnh hưởng đến giá)

### Response thành công (200)
```json
{
  "totalCost": 156000,
  "servicePrice": 50000,
  "HSDV": 1.2,
  "HSovertime": 1.5,
  "HScuoituan": 1.0,
  "isWeekend": false,
  "totalOvertimeHours": 2,
  "totalNormalHours": 2,
  "applicableWeekendCoefficient": 1.0,
  "overtimeCost": 3.0,
  "normalCost": 2.0
}
```

### Response lỗi (400)
```json
{
  "error": "Missing required parameters",
  "message": "serviceTitle (or serviceId), startTime, endTime, and workDate are required",
  "received": {
    "serviceTitle": null,
    "startTime": "08:00",
    "endTime": "12:00",
    "workDate": null
  }
}
```

### Response lỗi (404)
```json
{
  "error": "Service not found",
  "message": "Service with ID \"invalid_id\" not found"
}
```

### Ràng buộc dữ liệu
- **startTime/endTime**: Phải là định dạng HH:mm (VD: "08:00") hoặc ISO timestamp
- **workDate**: Định dạng YYYY-MM-DD (VD: "2024-01-15")
- **serviceTitle**: Phải tồn tại trong database
- **serviceId**: Phải là ObjectId hợp lệ

---

## 📝 2. Tạo yêu cầu dịch vụ (Customer Only)

### Endpoint
```http
POST /request
Authorization: Bearer {accessToken}
```

### Mô tả
Tạo yêu cầu dịch vụ mới. Chỉ khách hàng đã xác thực mới có thể tạo yêu cầu.

### Request Body
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
  "startDate": "2024-01-15,2024-01-16,2024-01-17",
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
  "requestType": "Ngắn hạn",
  "totalCost": 264000,
  "helperId": "optional_helper_id"
}
```

### Tham số bắt buộc
- `service.title`: Tên dịch vụ (phải tồn tại trong database)
- `startTime`: Thời gian bắt đầu (ISO format)
- `endTime`: Thời gian kết thúc (ISO format)
- `customerInfo`: Thông tin khách hàng
  - `fullName`: Tên đầy đủ
  - `phone`: Số điện thoại
  - `address`: Địa chỉ
- `requestType`: Loại yêu cầu
- `totalCost`: Tổng chi phí

### Tham số tùy chọn
- `orderDate`: Ngày đặt hàng (tự động từ startTime nếu không có)
- `startDate`: Danh sách ngày làm việc (phân cách bằng dấu phẩy)
- `location`: Có thể dùng object hoặc province/district/ward riêng lẻ
- `helperId`: ID người giúp việc được chỉ định

### Response thành công (200)
```json
"success"
```

### Response lỗi (400)
```json
{
  "success": false,
  "message": "Service title is required"
}
```

### Response lỗi (404)
```json
{
  "success": false,
  "message": "Service \"Tên dịch vụ không tồn tại\" not found"
}
```

### Ràng buộc dữ liệu
- **service.title**: Phải tồn tại trong collection services
- **startTime/endTime**: ISO format (VD: "2024-01-15T08:00:00.000Z")
- **customerInfo.phone**: Định dạng số điện thoại hợp lệ
- **totalCost**: Số dương
- **startDate**: Danh sách ngày phân cách bằng dấu phẩy (VD: "2024-01-15,2024-01-16")

---

## 📱 3. Lấy danh sách yêu cầu của khách hàng (Owner Only)

### Endpoint
```http
GET /request/{phone}
Authorization: Bearer {accessToken}
```

### Mô tả
Lấy tất cả yêu cầu dịch vụ của một khách hàng. Chỉ chủ sở hữu (customer có phone trùng khớp) mới có thể truy cập.

### Parameters
- `phone`: Số điện thoại của khách hàng (trong URL path)

### Response thành công (200)
```json
[
  {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderDate": "2024-01-15T07:00:00.000Z",
    "scheduleIds": ["schedule_id_1", "schedule_id_2"],
    "startTime": "2024-01-15T08:00:00.000Z",
    "endTime": "2024-01-15T12:00:00.000Z",
    "customerInfo": {
      "fullName": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Hoàng Quốc Việt",
      "usedPoint": 0
    },
    "requestType": "Ngắn hạn",
    "service": {
      "title": "Dọn dẹp nhà cửa",
      "coefficient_service": 1.2,
      "coefficient_other": 1.1,
      "cost": 50000
    },
    "totalCost": 264000,
    "status": "notDone",
    "location": {
      "province": "Hà Nội",
      "district": "Cầu Giấy",
      "ward": "Nghĩa Đô"
    }
  }
]
```

### Response lỗi (403)
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể truy cập thông tin của chính mình"
}
```

### Ràng buộc dữ liệu
- **phone**: Phải trùng với phone trong JWT token
- Trả về mảng rỗng nếu không có yêu cầu nào

---

## ❌ 4. Hủy yêu cầu (Customer Only)

### Endpoint
```http
POST /request/cancel
Authorization: Bearer {accessToken}
```

### Mô tả
Hủy yêu cầu dịch vụ. Chỉ khách hàng sở hữu yêu cầu mới có thể hủy, và chỉ hủy được khi status = "notDone".

### Request Body
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Tham số bắt buộc
- `id`: ID của yêu cầu cần hủy

### Response thành công (200)
```json
"success"
```

### Response lỗi (403)
```json
{
  "error": "Access denied",
  "message": "Bạn chỉ có thể hủy request của chính mình"
}
```

### Response lỗi (500)
```json
"cannot cancel this request"
```

### Ràng buộc dữ liệu
- **id**: Phải là ObjectId hợp lệ
- Chỉ hủy được khi tất cả scheduleIds có status = "notDone"
- Customer chỉ hủy được request có customerInfo.phone trùng với token

---

## ✅ 5. Nhận việc (Helper Only)

### Endpoint
```http
POST /request/assign
Authorization: Bearer {accessToken}
```

### Mô tả
Helper nhận làm một yêu cầu dịch vụ. Chuyển status từ "notDone" thành "assigned".

### Request Body
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Tham số bắt buộc
- `id`: ID của yêu cầu cần nhận

### Response thành công (200)
```json
"success"
```

### Response lỗi (500)
```json
"Cannot change status of detail"
```

### Ràng buộc dữ liệu
- **id**: Phải là ObjectId hợp lệ
- Chỉ nhận được khi tất cả scheduleIds có status = "notDone"
- Sau khi nhận, status chuyển thành "assigned"

---

## 🚫 6. Từ chối việc (Helper Only)

### Endpoint
```http
POST /request/reject
Authorization: Bearer {accessToken}
```

### Mô tả
Helper từ chối một yêu cầu dịch vụ. Reset helper_id về "notAvailable".

### Request Body
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Tham số bắt buộc
- `id`: ID của yêu cầu cần từ chối

### Response thành công (200)
```json
"Success"
```

### Response lỗi (500)
```json
"Cannot find order"
```

### Ràng buộc dữ liệu
- **id**: Phải là ObjectId hợp lệ
- Reset helper_id của tất cả scheduleIds về "notAvailable"

---

## 🔄 7. Bắt đầu làm việc (Helper Only)

### Endpoint
```http
POST /request/processing
Authorization: Bearer {accessToken}
```

### Mô tả
Helper bắt đầu thực hiện công việc. Chuyển status từ "assigned" thành "processing".

### Request Body
```json
{
  "detailId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Tham số bắt buộc
- `detailId`: ID của request detail cần bắt đầu

### Response thành công (200)
```json
"success"
```

### Response lỗi (500)
```json
"can not change status of detail"
```

### Ràng buộc dữ liệu
- **detailId**: Phải là ObjectId hợp lệ của RequestDetail
- Chỉ bắt đầu được khi status = "assigned"
- Sau khi bắt đầu, status chuyển thành "processing"

---

## ✅ 8. Hoàn thành công việc (Helper Only)

### Endpoint
```http
POST /request/finish
Authorization: Bearer {accessToken}
```

### Mô tả
Helper hoàn thành công việc. Chuyển status từ "processing" thành "waitPayment".

### Request Body
```json
{
  "detailId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Tham số bắt buộc
- `detailId`: ID của request detail cần hoàn thành

### Response thành công (200)
```json
"success"
```

### Response lỗi (500)
```json
"can not change status of detail"
```

### Ràng buộc dữ liệu
- **detailId**: Phải là ObjectId hợp lệ của RequestDetail
- Chỉ hoàn thành được khi status = "processing"
- Sau khi hoàn thành, status chuyển thành "waitPayment"

---

## 💰 9. Hoàn thành thanh toán (Helper Only)

### Endpoint
```http
POST /request/finishpayment
Authorization: Bearer {accessToken}
```

### Mô tả
Helper xác nhận đã nhận thanh toán. Chuyển status từ "waitPayment" thành "done".

### Request Body
```json
{
  "detailId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

### Tham số bắt buộc
- `detailId`: ID của request detail cần xác nhận thanh toán

### Response thành công (200)
```json
"Success"
```

### Response lỗi (500)
```json
"Cannot change status of detail"
```

### Ràng buộc dữ liệu
- **detailId**: Phải là ObjectId hợp lệ của RequestDetail
- Chỉ xác nhận được khi status = "waitPayment"
- Sau khi xác nhận, status chuyển thành "done"
- Khi tất cả scheduleIds = "done", request status cũng chuyển thành "done"

---

## 📊 Status Flow (Luồng trạng thái)

```
notDone → assigned → processing → waitPayment → done
   ↓         ↓
cancelled   rejected (helper_id reset)
```

### Mô tả các trạng thái:
- **notDone**: Yêu cầu mới tạo, chưa có helper nhận
- **assigned**: Đã có helper nhận việc
- **processing**: Helper đang thực hiện công việc
- **waitPayment**: Công việc hoàn thành, chờ thanh toán
- **done**: Đã hoàn thành và thanh toán
- **cancelled**: Đã bị hủy bởi customer

---

## 🔒 Bảo mật và Ràng buộc

### Xác thực
- Tất cả endpoint trừ `/calculateCost` đều cần JWT token
- Token phải chứa đúng role (customer/helper)
- Token phải còn hiệu lực

### Phân quyền
- Customer chỉ truy cập được dữ liệu của chính mình
- Helper chỉ thao tác được với các yêu cầu đã được assign
- Ownership được kiểm tra bằng phone number hoặc helper_id

### Validation
- Tất cả ObjectId phải hợp lệ
- Thời gian phải đúng định dạng
- Service phải tồn tại trong database
- Status transition phải tuân theo luồng đã định

### Error Handling
- 400: Dữ liệu đầu vào không hợp lệ
- 401: Token không hợp lệ hoặc hết hạn
- 403: Không có quyền truy cập
- 404: Không tìm thấy resource
- 500: Lỗi server nội bộ

---

## 📝 Models liên quan

### Request Model
```javascript
{
  orderDate: Date,
  scheduleIds: Array,
  startTime: Date,
  endTime: Date,
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
  status: String,
  location: {
    province: String,
    district: String,
    ward: String
  }
}
```

### RequestDetail Model
```javascript
{
  workingDate: Date,
  startTime: Date,
  endTime: Date,
  helper_id: String,
  cost: Number,
  helper_cost: Number,
  status: String,
  comment: {
    review: String,
    loseThings: Boolean,
    breakThings: Boolean
  }
}
```

---

## 🧪 Test Cases

### Test calculateCost
```bash
curl -X POST http://localhost/request/calculateCost \
  -H "Content-Type: application/json" \
  -d '{
    "serviceTitle": "Dọn dẹp nhà cửa",
    "startTime": "08:00",
    "endTime": "12:00",
    "workDate": "2024-01-15"
  }'
```

### Test create request (cần token)
```bash
curl -X POST http://localhost/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service": {"title": "Dọn dẹp nhà cửa"},
    "startTime": "2024-01-15T08:00:00.000Z",
    "endTime": "2024-01-15T12:00:00.000Z",
    "customerInfo": {
      "fullName": "Test User",
      "phone": "0123456789",
      "address": "Test Address"
    },
    "requestType": "Ngắn hạn",
    "totalCost": 100000
  }'
```

---

*Tài liệu này cung cấp hướng dẫn chi tiết để tích hợp với API Request Endpoints của hệ thống Homecare.*
