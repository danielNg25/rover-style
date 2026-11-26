# Extension hàng chờ gen ảnh (bản 0.6)

Bảng bên cạnh trang gen, đọc hàng chờ `chung/gen/cho-gen/`. Extension KHÔNG đọc và KHÔNG sửa trang web nào: Flow chặn lượt tạo khi extension tự điền ("hoạt động bất thường", 26/11/2026), nên hai nút tự động đã bỏ ở bản 0.6. Mọi thao tác trên trang do tay bạn làm.

## Cài (một lần)
1. Chrome → `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `chung/tien-ich/flow-gen`.
2. Mở trang gen, bấm biểu tượng extension: bảng hiện bên cạnh trang.
3. Bấm **Chọn thư mục cutout3d**, chọn thư mục `cutout3d` của dự án, cho quyền sửa.

## Dùng
1. **Chép lời tả**, sang trang gen bấm Cmd+V.
2. Bấm từng **hình mẫu** trong thẻ để chép ảnh đó, sang trang gen bấm Cmd+V. Mỗi lần chép một ảnh.
3. Tạo ảnh trên trang, tải tấm ưng ý về.
4. **Lưu ảnh đã tải về**, chọn file vừa tải: ảnh được ghi vào `chung/gen/<tên>.png`. Thẻ chuyển sang xanh.

Việc không cần nữa: **Bỏ việc này** (khôi phục lại được).

**Mở thư mục việc / Mở thư mục ảnh** mở Finder tại thư mục của việc hoặc tại ảnh đã lưu. Cần cài cầu nối một lần: `bash chung/tien-ich/flow-gen/cai-may.sh <mã extension>` (mã hiện trong bảng khi bấm nút lần đầu). Gỡ: xoá file `com.cutout3d.mo_thu_muc.json` trong thư mục NativeMessagingHosts của Chrome.

Phiên xếp việc: `GEN_QUA=flow ./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu…>` hoặc `python3 tools/xep_gen.py …`; xem hàng chờ: `python3 tools/xep_gen.py --xem`.
