# Trạng thái đơn hàng (Status Flow)

Tài liệu này mô tả vòng đời trạng thái cho Request (đơn tổng) và RequestDetail (lịch/ngày làm) theo quy ước mới.

## Từ vựng trạng thái

- Request (đơn tổng): `pending` → `confirm` → `completed`
	- Lưu ý: Trong quá trình làm việc theo ngày, `request` có thể tạm thời quay về `confirm` khi một ngày làm xong và chờ các ngày khác hoàn tất.

- RequestDetail (lịch/ngày): `pending` → `confirm` → `inProgress` → `waitPayment` → `completed`

## Luồng chuyển trạng thái chi tiết

1) Đặt đơn
- Khi tạo đơn: `request = pending`, tất cả `requestDetail = pending`.

2) Gán người giúp việc
- Khi gán helper cho một `requestDetail`: trạng thái `requestDetail` chuyển sang `confirm`.
- Khi tất cả (hoặc theo logic nghiệp vụ) các `requestDetail` đã được gán, trạng thái `request` chuyển sang `confirm`.

3) Bắt đầu làm việc trong ngày
- Khi helper bắt đầu làm việc cho một `requestDetail`: trạng thái `requestDetail` chuyển sang `inProgress`.

4) Hoàn thành công việc trong ngày
- Khi hoàn thành công việc của ngày: `requestDetail` chuyển sang `waitPayment` (chờ thanh toán cho ngày đó).
- Ở thời điểm này, trạng thái `request` là `confirm` (đơn tổng đã xác nhận, đang chờ các ngày còn lại hoặc bước thanh toán/hoàn tất).

5) Hoàn tất từng ngày
- Khi thanh toán/hoàn tất ngày đó xong: `requestDetail` chuyển sang `completed`.

6) Hoàn tất đơn tổng
- Khi tất cả các `requestDetail` của đơn đều là `completed`: trạng thái `request` chuyển sang `completed`.

## Gợi ý triển khai API (tham khảo)

- POST /request (tạo đơn): tạo `request(pending)` và các `requestDetail(pending)`.
- POST /request/assign (gán helper): đặt `requestDetail.confirm`; khi đủ điều kiện thì `request.confirm`.
- POST /request/processing (bắt đầu làm việc): `requestDetail.inProgress`.
- POST /request/finish (kết thúc ngày): `requestDetail.waitPayment`, đồng thời `request.confirm`.
- POST /request/finishpayment (xác nhận hoàn tất ngày): `requestDetail.completed` và kiểm tra nếu tất cả chi tiết đã completed thì `request.completed`.

Lưu ý: Tên endpoint và quyền truy cập có thể tuỳ chỉnh theo hệ thống thực tế.

