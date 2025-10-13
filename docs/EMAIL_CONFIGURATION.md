# Email Configuration for Homecare API

## Tổng quan
Hệ thống email đã được tích hợp vào API để gửi báo cáo công việc từ helper qua email. Khi helper gửi báo cáo, hệ thống sẽ tự động tạo email HTML đẹp mắt và gửi đến địa chỉ email được cấu hình.

## Cấu hình Email

### 1. Cấu hình biến môi trường

Thêm các biến sau vào file `.env`:

```env
# Email Configuration for Reports
EMAIL_HOST=smtp.gmail.com          # SMTP server
EMAIL_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com    # Tài khoản email
EMAIL_PASS=your-app-password       # Mật khẩu ứng dụng

# Email addresses
EMAIL_FROM_ADDRESS=your-email@gmail.com     # Địa chỉ gửi
EMAIL_TO_ADDRESS=reports@homecare.com       # Địa chỉ nhận báo cáo
```

### 2. Cấu hình cho các nhà cung cấp email phổ biến

#### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Tạo app password trong Google Account settings
```

**Lưu ý cho Gmail:**
1. Bật 2-Step Verification
2. Tạo App Password tại: https://myaccount.google.com/apppasswords
3. Sử dụng App Password thay vì mật khẩu thường

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

#### SMTP Server tùy chỉnh
```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
```

## API Endpoints

### 1. Gửi báo cáo qua email
**Endpoint:** `POST /request-details/send-report`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "detailId": "670abc123def456789",
  "report": "Đã hoàn thành công việc vệ sinh tại nhà khách hàng. Mọi thứ đều sạch sẽ và khách hàng hài lòng."
}
```

**Response Success (200):**
```json
{
  "message": "Report sent successfully",
  "email": {
    "sent": true,
    "recipient": "reports@homecare.com",
    "messageId": "message-id-from-smtp"
  }
}
```

**Response Error (500):**
```json
{
  "error": "Email sending failed",
  "message": "Invalid login: 535-5.7.8 Username and Password not accepted",
  "details": "Báo cáo được tạo thành công nhưng không thể gửi email. Vui lòng kiểm tra cấu hình email."
}
```

### 2. Kiểm tra kết nối email
**Endpoint:** `GET /request-details/test-email`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Email connection is working properly",
  "details": "Email connection is working"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Email connection failed",
  "error": "Invalid login: 535-5.7.8 Username and Password not accepted",
  "suggestion": "Please check your email environment variables configuration"
}
```

## Tính năng Email Template

Email báo cáo sẽ bao gồm:

- **Header đẹp mắt** với logo công ty
- **Thông tin khách hàng**: Tên, số điện thoại
- **Thông tin nhân viên**: Tên, số điện thoại
- **Thông tin dịch vụ**: Tên dịch vụ, ngày thực hiện
- **Trạng thái công việc** với màu sắc phân biệt
- **Nội dung báo cáo** được format đẹp
- **Footer** với thông tin công ty và thời gian

## Troubleshooting

### Lỗi thường gặp:

1. **"Invalid login"**
   - Kiểm tra username/password
   - Đối với Gmail: Sử dụng App Password thay vì mật khẩu thường
   - Bật 2-Factor Authentication

2. **"Connection timeout"**
   - Kiểm tra HOST và PORT
   - Kiểm tra firewall/proxy
   - Thử port khác: 465 (SSL) hoặc 587 (TLS)

3. **"Missing environment variables"**
   - Kiểm tra file .env có đầy đủ biến không
   - Restart server sau khi thay đổi .env

4. **"RequestDetail not found"**
   - Kiểm tra detailId có tồn tại không
   - Kiểm tra format ObjectId

## Logs và Debugging

Hệ thống có logging chi tiết:

```
[EMAIL SERVICE] ✅ Email transporter initialized successfully
[SEND REPORT] Starting report sending process...
[SEND REPORT] RequestDetail found, gathering additional data...
[SEND REPORT] Report data prepared: {...}
[SEND REPORT] Attempting to send email...
[EMAIL SERVICE] 📤 Sending report email to: reports@homecare.com
[EMAIL SERVICE] ✅ Report email sent successfully!
[SEND REPORT] ✅ Email sent successfully!
```

## Security Notes

- Không commit file `.env` lên Git
- Sử dụng App Password thay vì mật khẩu thật
- Giới hạn quyền truy cập API endpoint
- Định kỳ thay đổi mật khẩu email

## Testing

1. Sử dụng endpoint `/request-details/test-email` để kiểm tra kết nối
2. Tạo một request detail test và gửi báo cáo
3. Kiểm tra email đã nhận được chưa
4. Xem logs để debug nếu có lỗi