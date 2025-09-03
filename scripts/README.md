# Database Scripts

Thư mục này chứa các scripts để quản lý database cho ứng dụng Homecare API.

## Scripts có sẵn

### 1. clearAllData.js
Xóa toàn bộ dữ liệu trong tất cả collections (trừ collection `general`).

**Cách chạy:**
```bash
npm run db:clear
# hoặc
node scripts/clearAllData.js
```

### 2. seedDatabase.js  
Thêm dữ liệu mẫu vào database cho tất cả các collections.

**Cách chạy:**
```bash
npm run db:seed
# hoặc  
node scripts/seedDatabase.js
```

### 3. resetDatabase.js
Kết hợp cả 2 scripts trên - xóa toàn bộ dữ liệu cũ và thêm dữ liệu mẫu mới.

**Cách chạy:**
```bash
npm run db:reset
# hoặc
node scripts/resetDatabase.js
```

## Dữ liệu mẫu được tạo

### Roles (3 items)
- Admin: Quản trị viên hệ thống
- Manager: Quản lý  
- Staff: Nhân viên

### Cost Factor Types (2 items)
- Hệ số theo thời gian (4 mức: hành chính, ngoài giờ, cuối tuần, lễ tết)
- Hệ số theo độ khó (3 mức: dễ, trung bình, khó)

### Services (5 items)
- Chăm sóc người cao tuổi
- Chăm sóc trẻ em
- Chăm sóc bệnh nhân
- Dọn dẹp nhà cửa
- Nấu ăn tại nhà

### Locations (2 items)
- Hà Nội (3 quận với các phường)
- TP. Hồ Chí Minh (3 quận với các phường)

### Staff (3 items)
- Admin account
- Manager account  
- Staff account
- **Password mặc định:** `123456`

### Helpers (3 items)
- Helper với các kỹ năng khác nhau
- **Password mặc định:** `123456`

### Customers (3 items)
- Khách hàng với thông tin địa chỉ và điểm tích lũy
- **Password mặc định:** `123456`

### Blogs (3 items)
- Bài viết hướng dẫn chăm sóc
- Bài quảng cáo dịch vụ
- Thông báo chính sách

### Policies (3 items)
- Chính sách bảo mật
- Quy định hoàn tiền
- Điều khoản sử dụng

### Questions (5 items)
- Câu hỏi thường gặp về dịch vụ
- Hướng dẫn sử dụng

### Device Tokens (4 items)
- Token cho push notification trên các platform

## Lưu ý quan trọng

⚠️ **CẢNH BÁO**: Script `clearAllData.js` và `resetDatabase.js` sẽ **XÓA HOÀN TOÀN** dữ liệu hiện tại trong database (trừ collection `general`). 

🔒 **Bảo mật**: Tất cả password mẫu đều là `123456` và đã được hash bằng bcrypt.

🌐 **Environment**: Đảm bảo file `.env` đã được cấu hình đúng với `MONGO_URI` trước khi chạy scripts.

## Cấu trúc Database

Scripts này tương thích với cấu trúc database hiện tại của Homecare API, bao gồm:
- References giữa các collections (staff ↔ roles, services ↔ costFactorTypes, etc.)
- Timestamps tự động
- Soft delete (deleted flag)
- Audit trail (createdBy, updatedBy)
- Password hashing với bcrypt
