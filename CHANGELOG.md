# CHANGELOG: thay đổi của phần chung cutout3d

Phần chung gồm engine (`chung/src`), công cụ (`chung/tools`, `chung/*.sh`), luật (`chung/skills`, `CLAUDE.md`, `BAT-DAU-O-DAY.md`), kho chung (`chung/assets`, `chung/public`, `chung/gen`), workflow và hook (`.claude/`). File này ghi mọi thay đổi của các phần đó, ngày mới nhất ở trên. Máy khác đọc file này sau mỗi lần `git pull`.

**Cách ghi.** Đổi phần chung thì thêm một dòng dưới ngày hôm đó, trước khi commit: đổi gì; file chính; dựng lại thì hình có đổi không. Việc máy khác phải làm sau khi lấy về ghi ở mục "Sau khi lấy về" của ngày đó. Viết ngắn. Số đo, nguyên nhân, ảnh trước sau và lời Daniel của các thay đổi tới hết 26/11/2026 nằm ở `chung/NHAT-KY-THAY-DOI.md`.

## 2026-11-26

### Sau khi lấy về

- Mở phiên Claude Code ở đúng thư mục `cutout3d/`. Mở ở thư mục khác thì hook của khoá và thẻ luật không nạp.
- Phiên mở từ trước chưa có luật mới: mở phiên mới, hoặc bảo phiên đọc lại `CLAUDE.md` và `chung/skills/THE-LUAT-CUNG.md`.
- `chung/package.json` không đổi từ 20/11: không phải cài lại `node_modules`.
- Video đã duyệt không dựng lại. Cảnh dựng lại sau ngày này sẽ khác bản cũ ở các điểm ghi trong mục Engine.

### Repo và khoá

- **Phần chung lên git.** Repo ở gốc `cutout3d/`, remote `https://github.com/danielNg25/rover-style`, nhánh `main`. `kenh/`, `chung/node_modules`, `chung/qa`, `chung/out`, `chung/dang-lam.yaml` ở lại từng máy (`.gitignore`). Thôi dùng gói `goi-update/*.tar.gz`. File `CHANGELOG.md` này bắt đầu từ đây.
- **Khoá phần chung.** `chung/tools/khoa_chung.py` cùng hook trong `.claude/settings.json` niêm 343 file engine, công cụ, luật, workflow. Sửa file đã niêm phải có phiếu Daniel duyệt; file engine kèm ảnh cùng một khung KHÔNG SỬA và CÓ SỬA. Luật: `CLAUDE.md`, thẻ luật điều 15. Hình không đổi.
- **Quy trình một tập vào `CLAUDE.md`.** Bảng 9 bước và các chỗ chờ Daniel duyệt, tự nạp mọi phiên. `chung/tools/buoc.py` ghi tập đang ở bước nào và không cho mở bước sau khi bước trước chưa xong. Workflow `dung-canh-3d` đòi tham số `duyet`. Hook mở phiên in bước hiện tại của các tập đang dở.

### Luật

- **Thẻ luật cứng viết lại còn 15 điều** (`chung/skills/THE-LUAT-CUNG.md`), mỗi điều dẫn tới đúng một chỗ ghi cách làm. Skill 0, 1, 3 gọt phần kể chuyện và ví dụ lặp. Bản trước: `chung/_luu-luat-2026-11-25/`, `chung/_luu-luat-2026-11-26-truoc-rut-gon/`.
- **Thẻ làm một món** (skill 2): tra kho, chọn loại (phẳng, khối 3D, khối tiện, tấm nền xa), lấy nét từ Codex, đưa vào kho. Luật núi và đá gom về skill 2.
- **Codex gom nhiều món một lần gen** (skill 2, skill 4, workflow): tấm kín 12–20 món nhỏ và vừa, 4–6 món lớn, hoặc 3–4 dải lớp xa; mỗi bối cảnh tối đa 2 tấm kín và 1 tấm sửa. `chung/tools/cut.py --mong=<số món>` báo lỗi khi cắt ra khác số món.
- **Codex hết hạn mức thì nhờ Daniel gen ở chỗ khác** (skill 2, thẻ luật điều 13). `chung/gen.sh` thoát mã 3 và in lời tả, ảnh mẫu, nơi lưu ảnh; workflow `dung-canh-3d` trả `cho_gen` và bỏ lượt rà của bối cảnh đó.
- **Bóng** (skill 1): đồ vật ở chỗ đèn không tới thì không cần bóng.
- **Ánh sáng** (thẻ luật điều 5, luật rút gọn 19, bảng chấm mục 3 và 8): người vẽ đúng màu riêng; đồ cạnh nguồn sáng không cháy trắng, quầng chỉ nhẹ.
- **Lớp** (thẻ luật điều 3): vật khác nhau xếp trước sau theo vị trí 3D, không ép thứ tự vẽ bằng số.

### Engine (dựng lại thì hình đổi)

- **Người vẽ đúng màu riêng, như video gốc.** `src/mould/Puppet3.tsx`, `src/lib3/look.tsx`: `NGUOI_AN_DEN = {sang: 0.05, mau: 0.15}`. Mọi cảnh có người dựng lại sẽ sáng hơn bản cũ; `lift` cho người gần như hết tác dụng.
- **Trần cho nguồn sáng tự phát.** `src/lib3/look.tsx`: `NGUON_SANG = {tranDenGan: 1.4, tranQuang: 0.2}`. Cảnh có lửa, đèn, nến dựng lại sẽ bớt cháy và bớt ánh ấm quanh nguồn sáng.
- **Bộ màu da đo từ video gốc.** `src/mould/palettes.ts`: `SKINS` là bảy tông (`porcelain`, `warm`, `light`, `fair`, `tan`, `brown`, `dark`). Nhân vật dùng `SKINS.*` đổi màu da khi dựng lại.
- **`Sprite` đứng trước người che được người.** `src/lib3/depth.tsx`: mỗi `Sprite` ghi thêm chiều sâu, prop mới `che` (mặc định bật). Chỉ cảnh có `Sprite` đứng trước người mới khác bản cũ.

### Công cụ

- `chung/tools/kiem_mat.py`: thêm LOI `da-ngoai-bo` (mã màu da tự ghi, không thuộc `SKINS`).
- `chung/tools/khoa_chung.py`, `chung/tools/buoc.py`: mới (xem mục Repo và khoá).

### Kho chung

- Daniel duyệt giữ 13 món hang Kabuto (`src/lib3/khoiTuAnh.tsx`): đá vách hang, nhũ đá, tảng đá, bàn đá, giá gỗ, nến, lọ, bình gốm, hộp gỗ, cuộn giấy, kệ gỗ.

### Chưa vào repo

Sáu file phiên shisui-1 sửa trưa 26/11, sau lúc niêm. Repo giữ bản đã niêm; bản sửa nằm ở máy chính và vào repo khi Daniel cho niêm.

- `src/lib3/look.tsx`: `Finish` bỏ lớp ấm hậu kỳ mặc định (trước `#f3e2c4`, 6 %). Áp cho mọi `Shot` không truyền `finish`.
- `src/lib3/kit.tsx`: bóng người không còn cụt ở phiến lát và mép sàn (đất thấp hơn chân tới 15 cm hoặc cao hơn tới 8 cm vẫn tính là đất).
- `src/lib3/depth.tsx`, `src/demo/NuiTuyet.tsx`: `paintPeak` thêm `motSac`; núi tuyết một sắc, bỏ 40 vệt tam giác, sườn không còn mảng chia dọc.
- `tools/kiem_bong.py`: phép `xoay-nguoi` bắt `rotY` đi qua component bọc `Puppet3`.
- `tools/kiem_mat.py`: thêm cảnh báo `mat-mac-dinh`, `khep-mi`.

Thay đổi trước 26/11/2026: `chung/NHAT-KY-THAY-DOI.md`.
