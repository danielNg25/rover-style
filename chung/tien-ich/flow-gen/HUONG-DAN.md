# Extension hàng chờ gen ảnh (bản 0.1, bản gọn)

Dán lời tả và đính ảnh mẫu của một việc trong hàng chờ `chung/gen/cho-gen/` vào trang gen ảnh đang mở. Bạn tự bấm tạo và tải ảnh.

## Cài (một lần)
1. Chrome → `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `chung/tien-ich/flow-gen`.
2. Mở trang gen (Flow), bấm biểu tượng extension: bảng hiện bên cạnh trang.
3. Bấm **Chọn thư mục cutout3d**, chọn thư mục `cutout3d` của dự án (chọn `chung` hay `gen` cũng được), cho quyền sửa.

## Dùng
1. Trên trang gen, bấm một lần vào ô nhập lời tả.
2. Trong bảng, bấm **Đưa vào trang gen** ở việc cần làm. Kiểm trên trang: đúng lời tả, đủ ảnh mẫu.
3. Bấm tạo trên trang, tải tấm ưng ý về.
4. Bấm **Lấy ảnh mới nhất trên trang** rồi bấm vào tấm muốn lưu (xem kích cỡ ghi dưới tấm). Hoặc tải ảnh về, bấm **Lưu ảnh đã tải về**, chọn file vừa tải: ảnh được ghi vào `chung/gen/<tên>.png`. Báo phiên tên việc đã có ảnh.

Việc không cần nữa: bấm **Bỏ việc này** (ẩn khỏi hàng chờ, khôi phục lại được).

Ảnh mẫu không vào trang: đổi **Cách đính ảnh mẫu** (dán, ô chọn file, thả) rồi thử lại; không cách nào được thì mở `cho-gen/<tên>/` lấy `loi-ta.txt` và ảnh mẫu bằng tay.

Nút **Mở thư mục ảnh** mở `chung/gen` trong Finder, chọn sẵn ảnh của việc đó. Cần cài cầu nối một lần: `bash chung/tien-ich/flow-gen/cai-may.sh <mã extension>` (mã hiện trong bảng khi bấm nút lần đầu). Nó ghi một file khai báo vào thư mục NativeMessagingHosts của Chrome; gỡ thì xoá file đó.

Phiên xếp việc: `GEN_QUA=flow ./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu…>` hoặc `python3 tools/xep_gen.py …`; xem hàng chờ: `python3 tools/xep_gen.py --xem`.
