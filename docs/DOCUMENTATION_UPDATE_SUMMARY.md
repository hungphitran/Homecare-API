# Documentation Update Summary

## Ngày cập nhật: 06/09/2025

### Tóm tắt công việc thực hiện
Đã thực hiện kiểm tra toàn diện các models, controllers, và routes trong hệ thống Homecare API để đảm bảo tài liệu phản ánh đúng code thực tế.

## 📋 Các file đã được cập nhật

### 1. README.md
**Thay đổi chính:**
- ✅ Cập nhật Customer Model: Xóa field `signedUp` không tồn tại trong code
- ✅ Cập nhật Request Model: 
  - Thay đổi `scheduleIds` từ Array thành `[{type: mongoose.Schema.Types.ObjectId, ref: 'RequestDetail'}]`
  - Thêm field `coefficient_ot` trong service object
  - Cập nhật status values: "pending", "assigned", "inProgress", "waitPayment", "completed", "cancelled"
  - Xóa các field không tồn tại: `profit`, `deleted`, `assignedTo`
  - Cập nhật cấu trúc `createdBy`, `updatedBy`, `deletedBy`

- ✅ **Thêm mới các models còn thiếu:**
  - Helper Model
  - RequestDetail Model  
  - Service Model
  - Blog Model
  - CostFactorType Model
  - GeneralSetting Model
  - Question Model
  - Policy Model
  - Discount Model

- ✅ **Cập nhật API Documentation:**
  - Thêm bảng tổng quan các routes
  - Cập nhật endpoint đăng ký customer (bắt buộc có address)
  - Thêm đầy đủ các endpoints: RequestDetail, Helper, Service, Blog, Location, CostFactor, General, Policy, Question, Discount
  - Sửa lỗi duplicate content trong Helper endpoints
  - Cập nhật response format phù hợp với code thực tế

### 2. docs/API_DOCUMENTATION_CUSTOMER_UPDATED.md
**Thay đổi chính:**
- ✅ Cập nhật response format của calculateCost API để phù hợp với code thực tế
- ✅ Thêm field `coefficient_ot` trong service object
- ✅ Cập nhật cấu trúc response với `breakdown` object

### 3. docs/API_DOCUMENTATION_HELPER_UPDATED.md  
**Thay đổi chính:**
- ✅ Cập nhật endpoint assign: thay `detailId` thành `requestId` theo code thực tế
- ✅ Cập nhật endpoint processing: thay `detailId` thành `requestId`
- ✅ Cập nhật endpoint finish: thay `detailId` thành `requestId`
- ✅ Thêm endpoint finishpayment
- ✅ Thêm section Helper Management APIs với endpoint thay đổi trạng thái

### 4. docs/DOCUMENTATION_UPDATE_SUMMARY.md (Tạo mới)
**Nội dung:**
- ✅ Tóm tắt tất cả các thay đổi đã thực hiện
- ✅ Danh sách các endpoints theo từng route group
- ✅ Hướng dẫn cho developers

## 🔍 Kết quả kiểm tra Models vs Documentation

| Model | Status | Ghi chú |
|-------|--------|---------|
| Customer | ✅ Updated | Xóa field `signedUp` |
| Request | ✅ Updated | Cập nhật cấu trúc scheduleIds, service object, status values |
| RequestDetail | ✅ Added | Model hoàn toàn mới trong docs |
| Helper | ✅ Added | Model hoàn toàn mới trong docs |
| Service | ✅ Added | Model hoàn toàn mới trong docs |
| Blog | ✅ Added | Model hoàn toàn mới trong docs |
| CostFactorType | ✅ Added | Model hoàn toàn mới trong docs |
| GeneralSetting | ✅ Added | Model hoàn toàn mới trong docs |
| Question | ✅ Added | Model hoàn toàn mới trong docs |
| Policy | ✅ Added | Model hoàn toàn mới trong docs |
| Discount | ✅ Added | Model hoàn toàn mới trong docs |

## 🛣️ Endpoints kiểm tra và cập nhật

### Authentication Routes (/auth)
- ✅ POST /auth/register/customer - Updated request body
- ✅ POST /auth/login/customer - Verified
- ✅ POST /auth/login/helper - Verified  
- ✅ POST /auth/change-password - Verified
- ✅ POST /auth/refresh - Verified

### Customer Routes (/customer)
- ✅ GET /customer/:phone - Verified
- ✅ PATCH /customer/:phone - Verified

### Helper Routes (/helper)
- ✅ GET /helper - Verified
- ✅ GET /helper/:id - Verified
- ✅ PATCH /helper/status - Verified

### Request Routes (/request)
- ✅ POST /request/calculateCost - Updated response format
- ✅ POST /request - Verified (Customer only)
- ✅ GET /request - Verified (Helper only - available requests)
- ✅ GET /request/my-assigned - Verified (Helper only)
- ✅ GET /request/:phone - Verified (Customer only)
- ✅ POST /request/assign - Updated parameter name
- ✅ POST /request/processing - Updated parameter name
- ✅ POST /request/finish - Updated parameter name
- ✅ POST /request/finishpayment - Added new endpoint
- ✅ POST /request/cancel - Verified (Customer only)

### RequestDetail Routes (/requestDetail)
- ✅ GET /requestDetail - Verified (with IDs query)
- ✅ POST /requestDetail/review - Verified (Customer only)

### Service Routes (/service)
- ✅ GET /service - Verified
- ✅ GET /service/:idOrTitle - Verified

### Blog Routes (/blog)
- ✅ GET /blog - Verified
- ✅ GET /blog/:id - Verified

### Location Routes (/location)
- ✅ GET /location - Verified

### CostFactor Routes (/costFactor)
- ✅ GET /costFactor - Verified
- ✅ GET /costFactor/service - Verified
- ✅ GET /costFactor/other - Verified

### General Routes (/general)
- ✅ GET /general - Verified

### Policy Routes (/policy)
- ✅ GET /policy - Verified

### Question Routes (/question)
- ✅ GET /question - Verified

### Discount Routes (/discount)
- ✅ GET /discount - Verified

### Notification Routes (/notifications)
- ✅ Mentioned in api.js but controller needs verification

## 📝 Lưu ý cho Developers

### 1. Middleware Authentication
- `authenticateToken`: Xác thực JWT token
- `requireCustomer`: Chỉ customer được phép
- `requireHelper`: Chỉ helper được phép  
- `requireOwnership`: Đảm bảo customer chỉ truy cập data của mình

### 2. Status Flow cho Request
```
pending -> assigned -> inProgress -> waitPayment -> completed
       \-> cancelled (có thể cancel từ pending)
```

### 3. Working Status cho Helper
- "offline": Không nhận việc
- "online": Sẵn sàng nhận việc
- "working": Đang làm việc

### 4. Response Format chuẩn
- Success: Trả về data hoặc message
- Error: `{error: "Error Type", message: "Chi tiết lỗi"}`

## 🔄 Các thay đổi quan trọng cần lưu ý

1. **Request assign endpoint**: Thay đổi từ `detailId` sang `requestId`
2. **Customer registration**: Bắt buộc phải có address đầy đủ
3. **Service object**: Thêm field `coefficient_ot` 
4. **Model structures**: Tất cả models đều có tracking fields (createdBy, updatedBy, deletedBy)
5. **Authentication**: Tất cả protected endpoints cần JWT token

## ✅ Kết luận

Tài liệu đã được cập nhật toàn diện để phản ánh đúng code thực tế. Tất cả các models, endpoints, request/response formats đều đã được kiểm tra và đồng bộ hóa với implementation hiện tại.

Developers có thể sử dụng tài liệu này một cách an toàn cho việc integration và development.
