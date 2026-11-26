# Extension hàng chờ gen ảnh (bản 0.5)

Bảng bên cạnh trang gen, đọc hàng chờ `chung/gen/cho-gen/`. Từ bản 0.5, mặc định extension không đọc và không sửa trang web nào (Flow báo "hoạt động bất thường" khi extension tự điền, 26/11/2026): cách chính là làm tay. Hai nút tự động vẫn giữ, chỉ chạm vào trang khi bạn bấm.

## Cài (một lần)
1. Chrome → `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `chung/tien-ich/flow-gen`.
2. Mở trang gen, bấm biểu tượng extension: bảng hiện bên cạnh trang.
3. Bấm **Chọn thư mục cutout3d**, chọn thư mục `cutout3d` của dự án, cho quyền sửa.

## Dùng
1. **Chép lời tả**, sang trang gen bấm Cmd+V.
2. Bấm từng **hình mẫu** trong thẻ để chép ảnh đó, sang trang gen bấm Cmd+V. Mỗi lần chép một ảnh.
3. Tạo ảnh trên trang, tải tấm ưng ý về.
4. **Lưu ảnh đã tải về**, chọn file vừa tải: ảnh được ghi vào `chung/gen/<tên>.png`. Thẻ chuyển sang xanh.

Hai nút viền cam **Tự đưa vào trang gen** và **Tự lấy ảnh mới nhất trên trang** vẫn có: chúng tự điền lời tả, đính ảnh mẫu và đọc ảnh kết quả ngay trên trang. Lần đầu bấm, Chrome hỏi cấp quyền với trang gen. Flow từng báo "hoạt động bất thường" khi dùng hai nút này; gặp lại thì quay về cách làm tay.

Việc không cần nữa: **Bỏ việc này** (khôi phục lại được).

**Mở thư mục việc / Mở thư mục ảnh** mở Finder tại thư mục của việc hoặc tại ảnh đã lưu. Cần cài cầu nối một lần: `bash chung/tien-ich/flow-gen/cai-may.sh <mã extension>` (mã hiện trong bảng khi bấm nút lần đầu). Gỡ: xoá file `com.cutout3d.mo_thu_muc.json` trong thư mục NativeMessagingHosts của Chrome.

Phiên xếp việc: `GEN_QUA=flow ./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu…>` hoặc `python3 tools/xep_gen.py …`; xem hàng chờ: `python3 tools/xep_gen.py --xem`.
