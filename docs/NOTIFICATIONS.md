# Hướng dẫn sử dụng chức năng Thông báo (Firebase Cloud Messaging)

Tài liệu này hướng dẫn cấu hình môi trường, cơ chế tự động đẩy thông báo khi đơn hàng đổi trạng thái, và cách sử dụng các endpoint thông báo đã tích hợp với Firebase Admin SDK.

## 1) Yêu cầu môi trường

Bạn phải cấu hình credential cho Firebase Admin theo 1 trong 2 cách (chỉ dùng một):

- Cách A: Dùng đường dẫn file JSON (local/dev)
  - Tải file service account JSON từ Firebase Console → Project settings → Service accounts → Generate new private key
  - Đặt file tại một đường dẫn tuyệt đối trên Windows, ví dụ:
    - `C:\Users\<user>\Documents\GitHub\Homecare-API\secrets\service-account.json`
  - Cấu hình `.env`:
    - `GOOGLE_APPLICATION_CREDENTIALS=C:\Users\<user>\Documents\GitHub\Homecare-API\secrets\service-account.json`
    - (không đặt `FIREBASE_SERVICE_ACCOUNT`)

- Cách B: Dùng base64 của toàn bộ JSON (deploy/production)
  - Chuyển nội dung file JSON sang base64
  - Cấu hình `.env`:
    - `FIREBASE_SERVICE_ACCOUNT=<CHUỖI_BASE64_RẤT_DÀI>`
    - (không đặt `GOOGLE_APPLICATION_CREDENTIALS`)

Lưu ý:
- Chỉ dùng một trong hai biến trên. Nếu đặt sai định dạng, SDK sẽ cảnh báo và fallback sang Application Default, có thể khiến gửi thông báo thất bại.
- Sau khi sửa `.env`, khởi động lại server.

## 2) Các endpoint

Base URL mặc định: `http://localhost` (port lấy từ `PORT` env, mặc định 80)

- Đăng ký/ cập nhật device token
  - `POST /notifications/register`
  - Body JSON:
    ```json
    {
      "token": "<fcm_device_token>",
      "userId": "<mongo_customer_id_optional>",
      "phone": "<sdt_optional>",
      "platform": "ios|android|web|unknown"
    }
    ```
  - Mục đích: Lưu token vào DB, cập nhật nền tảng và lastSeenAt. Token là unique.
  - Lưu ý quan trọng: Hãy truyền kèm `phone` của khách hàng. Hệ thống sẽ map token theo `customerInfo.phone` để có thể gửi thông báo tự động theo số điện thoại khách hàng.

- Subscribe token vào topic
  - `POST /notifications/subscribe`
  - Body JSON:
    ```json
    {
      "token": "<fcm_device_token>",
      "topic": "<topic_name>"
    }
    ```
  - Lưu ý: Topic chỉ gồm ký tự chữ-số-gạch dưới-dấu gạch ngang; không chứa khoảng trắng.

- Unsubscribe token khỏi topic
  - `POST /notifications/unsubscribe`
  - Body JSON:
    ```json
    {
      "token": "<fcm_device_token>",
      "topic": "<topic_name>"
    }
    ```

- Gửi thông báo tới 1 token
  - `POST /notifications/send/token`
  - Body JSON:
    ```json
    {
      "token": "<fcm_device_token>",
      "title": "Tiêu đề",
      "body": "Nội dung",
      "data": { "key1": "value1", "orderId": "123" }
    }
    ```
  - Ghi chú: Tất cả giá trị trong `data` sẽ được ép về chuỗi trước khi gửi (yêu cầu của FCM).

- Gửi thông báo tới 1 topic
  - `POST /notifications/send/topic`
  - Body JSON:
    ```json
    {
      "topic": "<topic_name>",
      "title": "Tiêu đề",
      "body": "Nội dung",
      "data": { "screen": "RequestDetail", "id": "abc" }
    }
    ```

## 3) Phản hồi (response)
- Thành công: `{ "success": true, ... }`
- Lỗi validate: mã 400 với thông báo thiếu trường hoặc sai định dạng
- Lỗi cấu hình Firebase: mã 500 với thông báo `Firebase not initialized` hoặc lỗi khác từ SDK

## 4) Đẩy thông báo tự động khi đổi trạng thái đơn hàng
Hệ thống tự động gửi FCM đến tất cả thiết bị đã đăng ký (token gắn với `customerInfo.phone` của đơn) khi trạng thái đơn hàng thay đổi thực sự (chỉ gửi khi status trước khác status sau):

- assign → `assigned`
- startWork → `processing`
- finishRequest → `waitPayment`
- finishPayment → `done`
- cancelRequest → `cancelled`

Payload gửi lên FCM:

```
notification: {
  title: "Cập nhật đơn hàng",
  body:  "Đơn <orderId> đã chuyển sang trạng thái: <nhãn VN>"
},
data: {
  orderId: "<mongo_id>",
  status:  "assigned|processing|waitPayment|done|cancelled",
  screen:  "RequestDetail"
}
```

Yêu cầu để nhận được thông báo tự động:
- Client phải gọi `/notifications/register` trước và truyền `phone` đúng với số điện thoại trong `customerInfo.phone` của đơn.
- Firebase Admin phải được cấu hình hợp lệ (xem phần 1).

## 5) Quy trình tích hợp client
1. Lấy FCM device token trên app (Android/iOS/web) và gửi lên server bằng `/notifications/register`.
2. (Tuỳ chọn) Subscribe token vào 1 topic bằng `/notifications/subscribe` (ví dụ `customer-<phone>` hoặc `broadcast`).
3. Hệ thống sẽ tự động đẩy thông báo khi đơn hàng đổi trạng thái như trên. Ngoài ra, bạn có thể chủ động gọi `/notifications/send/token` hoặc `/notifications/send/topic` nếu muốn đẩy ngoài luồng.
4. Trên client, lắng nghe thông báo ở foreground/background; điều hướng theo trường `data` nếu cần (ví dụ mở màn hình chi tiết đơn bằng `orderId`).

## 6) Bảo mật & quyền
- Nên bảo vệ các endpoint gửi (`/send/*`) bằng middleware xác thực/ phân quyền (admin).
- Không lộ service account JSON hoặc biến môi trường công khai.
- Hạn chế quyền IAM của service account ở mức cần thiết (FCM Sender, Firebase Admin nếu cần nhiều dịch vụ).

## 7) Lỗi thường gặp & cách khắc phục
- `Firebase SERVICE_ACCOUNT is not valid base64 or JSON`
  - Nguyên nhân: `FIREBASE_SERVICE_ACCOUNT` không phải là base64 của toàn bộ JSON, hoặc là path/email.
  - Cách xử lý: Dùng đúng base64 nội dung JSON, hoặc chuyển sang `GOOGLE_APPLICATION_CREDENTIALS` với path tuyệt đối.

- `Firebase init error: Failed to read credentials from file ... ENOENT`
  - Nguyên nhân: `GOOGLE_APPLICATION_CREDENTIALS` trỏ tới file không tồn tại.
  - Cách xử lý: Sửa thành đường dẫn tuyệt đối hợp lệ.

- `Firebase not initialized` khi gọi `/notifications/*`
  - Nguyên nhân: Credential chưa hợp lệ; SDK fallback sang Application Default nhưng môi trường không có ADC.
  - Cách xử lý: Cấu hình lại credential bằng 1 trong 2 cách trên.

- Gửi tới token báo `messaging/registration-token-not-registered`
  - Nguyên nhân: Token hết hạn/thu hồi.
  - Cách xử lý: Yêu cầu client đăng ký lại bằng `/notifications/register`.

- Không nhận được thông báo tự động khi đổi trạng thái đơn
  - Kiểm tra client đã đăng ký token với đúng `phone` hay chưa.
  - Kiểm tra đơn có `customerInfo.phone` khớp với `phone` đã đăng ký token.
  - Kiểm tra Firebase đã được khởi tạo hợp lệ (log ở lúc start server: “Initializing Firebase Admin SDK…”).
  - Kiểm tra status có thực sự thay đổi (server chỉ gửi khi `prevStatus !== newStatus`).

## 8) Mẹo triển khai
- Sử dụng `DEFAULT_FCM_TOPIC=homecare-broadcast` để gom broadcast.
- Thiết kế topic theo nhóm người dùng (vd: `customer-<phone>`, `helper-<id>`, `region-<province>`).
- Log mã message id trả về để theo dõi.

---

Nếu cần, bạn có thể bật middleware auth cho các route `/notifications/send/*` để chỉ admin mới có quyền gửi.
