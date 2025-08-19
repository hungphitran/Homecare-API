# Trạng thái đơn hàng (Status Flow)

Tài liệu này mô tả vòng đời trạng thái cho Request (đơn tổng) và RequestDetail (lịch/ngày làm) sau khi loại bỏ trạng thái "confirm".

## Từ vựng trạng thái

- Request (đơn tổng): `pending` → `completed`
	- Lưu ý: Request giữ trạng thái `pending` cho đến khi tất cả RequestDetail hoàn tất.

- RequestDetail (lịch/ngày): `pending` → `assigned` → `inProgress` → `waitPayment` → `completed`

## Luồng chuyển trạng thái chi tiết

1) Đặt đơn
- Khi tạo đơn: `request = pending`, tất cả `requestDetail = pending` với `helper_id = null`.

2) Gán người giúp việc
- Khi helper assign một `requestDetail` cụ thể (thông qua API với detailId): trạng thái `requestDetail` chuyển sang `assigned`.
- Chỉ có thể assign các requestDetail có status = "pending" và thời gian bắt đầu trong vòng 2 giờ.
- Request vẫn giữ trạng thái `pending` sau khi gán.
3) Bắt đầu làm việc trong ngày
- Khi helper bắt đầu làm việc cho một `requestDetail`: trạng thái `requestDetail` chuyển từ `assigned` sang `inProgress`.

4) Hoàn thành công việc trong ngày
- Khi hoàn thành công việc của ngày: `requestDetail` chuyển sang `waitPayment` (chờ thanh toán cho ngày đó).
- Request vẫn giữ trạng thái `pending` (đang chờ các ngày còn lại hoặc bước thanh toán/hoàn tất).

5) Hoàn tất từng ngày
- Khi thanh toán/hoàn tất ngày đó xong: `requestDetail` chuyển sang `completed`.

6) Hoàn tất đơn tổng
- Khi tất cả các `requestDetail` của đơn đều là `completed`: trạng thái `request` chuyển sang `completed`.

## Gợi ý triển khai API (tham khảo)

- POST /request (tạo đơn): tạo `request(pending)` và các `requestDetail(pending)`.
- POST /request/assign (gán helper): helper gửi `detailId` để assign một RequestDetail cụ thể, đặt `requestDetail.assigned` và giữ `request.pending`.
- POST /request/processing (bắt đầu làm việc): `requestDetail.inProgress`.
- POST /request/finish (kết thúc ngày): `requestDetail.waitPayment`, đồng thời `request.pending`.
- POST /request/finishpayment (xác nhận hoàn tất ngày): `requestDetail.completed` và kiểm tra nếu tất cả chi tiết đã completed thì `request.completed`.

Lưu ý: Tên endpoint và quyền truy cập có thể tuỳ chỉnh theo hệ thống thực tế.

