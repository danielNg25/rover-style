# CHANGELOG: thay đổi của phần chung cutout3d

Phần chung gồm engine (`chung/src`), công cụ (`chung/tools`, `chung/*.sh`), luật (`chung/skills`, `CLAUDE.md`, `BAT-DAU-O-DAY.md`), kho chung (`chung/assets`, `chung/public`, `chung/gen`), workflow và hook (`.claude/`). File này ghi mọi thay đổi của các phần đó, ngày mới nhất ở trên. Máy khác đọc file này sau mỗi lần `git pull`.

**Cách ghi.** Đổi phần chung thì thêm một dòng dưới ngày hôm đó, trước khi commit: đổi gì; file chính; dựng lại thì hình có đổi không. Việc máy khác phải làm sau khi lấy về ghi ở mục "Sau khi lấy về" của ngày đó. Viết ngắn. Số đo, nguyên nhân, ảnh trước sau và lời Daniel của các thay đổi tới hết 26/11/2026 nằm ở `chung/NHAT-KY-THAY-DOI.md`.

## 2026-11-26

### Sau khi lấy về

- Mở phiên Claude Code ở đúng thư mục `cutout3d/`. Mở ở thư mục khác thì hook của khoá và thẻ luật không nạp.
- Phiên mở từ trước chưa có luật mới: mở phiên mới, hoặc bảo phiên đọc lại `CLAUDE.md` và `chung/skills/THE-LUAT-CUNG.md`.
- `chung/package.json` không đổi từ 20/11: không phải cài lại `node_modules`.
- Cài chốt trước commit, một lần cho mỗi máy: `git config core.hooksPath chung/tools/git-hooks` (lệnh `khoa_chung.py luu` tự cài khi chưa có).
- Lập mốc kiểm cấm, một lần cho các kênh của máy đó: trong `chung/`, `python3 tools/kiem_cam.py --lap-moc`. Chưa có mốc thì code cũ của kênh bị `kiem_canh.py` báo LOI.
- File lời tả Codex đang dở phải thêm bảng món mới gen tiếp được (`python3 tools/kiem_loi_ta.py`).
- Bối cảnh mới đang chờ duyệt "bảng đổi món" theo cơ chế khuôn cũ: chạy lại lượt chọn mẫu với `chi_thiet_ke: true` để ra tranh bối cảnh mẫu và bảng thiết kế rồi mới gửi Daniel.
- Gọi workflow `dung-canh-3d` phải truyền `goc` (đường dẫn thư mục `cutout3d` của máy đó); thiếu thì workflow dừng ngay và in cách lấy.
- Video đã duyệt không dựng lại. Cảnh dựng lại sau ngày này sẽ khác bản cũ ở các điểm ghi trong mục Engine.

### Repo và khoá

- **Phần chung lên git.** Repo ở gốc `cutout3d/`, remote `https://github.com/danielNg25/rover-style`, nhánh `main`. `kenh/`, `chung/node_modules`, `chung/qa`, `chung/out`, `chung/dang-lam.yaml` ở lại từng máy (`.gitignore`). Thôi dùng gói `goi-update/*.tar.gz`. File `CHANGELOG.md` này bắt đầu từ đây.
- **Ghi thay đổi và lưu lên repo (phiếu P1126-03).** Đổi phần chung hay kho chung thì ghi một dòng vào file này rồi chạy `python3 tools/khoa_chung.py luu "<đổi gì>" [món kho đã duyệt…]`: commit và đẩy lên GitHub. Lệnh đóng phiếu đòi dòng mới ở file này (trước đòi ở `NHAT-KY`); `NHAT-KY` từ nay chỉ ghi việc dựng bối cảnh, cảnh quay của kênh. Chốt trước commit `chung/tools/git-hooks/pre-commit` chặn file đã niêm lệch bản niêm và commit thiếu dòng changelog. Luật: `CLAUDE.md`, `BAT-DAU-O-DAY.md` mục Repo git, skill 4. Hình không đổi.
- **Workflow `dung-canh-3d` bỏ đường dẫn ghi cứng (phiếu P1126-04).** `args.goc` thành bắt buộc; không file nào trong repo còn ghi đường dẫn của một máy. Hình không đổi.
- **Lệnh shell không còn ghi được vào công cụ chung (phiếu P1126-05).** `.claude/settings.json`: sandbox cấm ghi thêm `chung/tools`, các file `chung/*.sh`, `chung/package.json`, `chung/tsconfig.json`. Sửa công cụ chung chỉ còn đường Edit/Write, là đường hook chặn khi không có phiếu; file công cụ mới cũng tạo bằng Write. `khoa_chung.py tra-lai` chạy ngoài sandbox. Lý do: 15:05 ngày 26/11 một phiên sửa `kiem_bong.py` bằng lệnh shell, khoá chỉ phát hiện sau khi đã sửa. Hình không đổi.
- **Khoá phần chung.** `chung/tools/khoa_chung.py` cùng hook trong `.claude/settings.json` niêm 343 file engine, công cụ, luật, workflow. Sửa file đã niêm phải có phiếu Daniel duyệt; file engine kèm ảnh cùng một khung KHÔNG SỬA và CÓ SỬA. Luật: `CLAUDE.md`, thẻ luật điều 15. Hình không đổi.
- **Quy trình một tập vào `CLAUDE.md`.** Bảng 9 bước và các chỗ chờ Daniel duyệt, tự nạp mọi phiên. `chung/tools/buoc.py` ghi tập đang ở bước nào và không cho mở bước sau khi bước trước chưa xong. Workflow `dung-canh-3d` đòi tham số `duyet`. Hook mở phiên in bước hiện tại của các tập đang dở.

### Luật

- **Thẻ luật cứng viết lại còn 15 điều** (`chung/skills/THE-LUAT-CUNG.md`), mỗi điều dẫn tới đúng một chỗ ghi cách làm. Skill 0, 1, 3 gọt phần kể chuyện và ví dụ lặp. Bản trước: `chung/_luu-luat-2026-11-25/`, `chung/_luu-luat-2026-11-26-truoc-rut-gon/`.
- **Thẻ làm một món** (skill 2): tra kho, chọn loại (phẳng, khối 3D, khối tiện, tấm nền xa), lấy nét từ Codex, đưa vào kho. Luật núi và đá gom về skill 2.
- **Codex gom nhiều món một lần gen** (skill 2, skill 4, workflow): tấm kín 12–20 món nhỏ và vừa, 4–6 món lớn, hoặc 3–4 dải lớp xa; mỗi bối cảnh tối đa 2 tấm kín và 1 tấm sửa. `chung/tools/cut.py --mong=<số món>` báo lỗi khi cắt ra khác số món.
- **Codex hết hạn mức thì nhờ Daniel gen ở chỗ khác** (skill 2, thẻ luật điều 13). `chung/gen.sh` thoát mã 3 và in lời tả, ảnh mẫu, nơi lưu ảnh; workflow `dung-canh-3d` trả `cho_gen` và bỏ lượt rà của bối cảnh đó.
- **Tranh bối cảnh mẫu (phiếu P1126-10; Daniel: "cùng với việc gen đồ thì nên dùng flow gen bối cảnh nữa … thay vì tự agent nghĩ ra").** Mỗi bối cảnh MỚI có một tranh của cả cảnh do Codex vẽ theo bảng thiết kế; Daniel duyệt tranh cùng bảng (hoặc tự gen tranh khác rồi lưu vào đúng đường dẫn); người dựng dựng sân khấu 3D THEO tranh (không dán làm nền, không cắt ra làm đồ); người rà so ảnh dựng với tranh. Workflow `dung-canh-3d`: bước chọn mẫu gen tranh, `thiet_ke` thêm `tranh_mau`, `tranh_co`; chưa có tranh thì không dựng; Codex hết hạn mức thì trả `cho_gen`. `chung/tools/kiem_loi_ta.py` nhận file lời tả `#CANH` (tranh cả cảnh, không bảng món, không nền hồng) và thêm câu về góc nhìn sân khấu; `chung/gen.sh` ghi đúng loại ảnh trong lời nhắn gửi Daniel. Mẫu lời tả: `chung/gen/prompts/_mau-tranh-boi-canh.txt`. Ngân sách một bối cảnh: 1 tranh (gen lại tối đa một lần), 2 tấm kín, 1 tấm sửa. Bối cảnh đã duyệt không đổi.
- **Gọn lại các phần luật vừa thêm (phiếu P1126-11; Daniel: "review lại skill để làm gọn, ko để bị loạn những phần vừa thêm").** Skill 2, mục Vẽ đồ bằng Codex viết lại theo thứ tự làm, bỏ phần kể chuyện và số đo cũ (1.387 xuống 1.075 từ); skill 1, mục Cảnh mẫu của cảnh gom việc dựng bối cảnh mới vào một đoạn; thẻ luật 11 và 13 ngắn lại. Không đổi luật nào. Tám file luật: 32.081 từ lúc đầu ngày, 32.376 từ sau mọi thay đổi của ngày 26/11.
- **BỎ khung khuôn và bảng đổi món (phiếu P1126-08; Daniel: "mình đâu có nói làm như vậy đâu, cảnh mẫu là để nhìn vào học hỏi chứ ko phải là tái sử dụng lại như vậy").** Cơ chế này do một phiên tự thêm tối 25/11, không phải lời Daniel. Từ nay: bộ 8–12 khung mẫu chỉ để nhìn và học; không cảnh nào lấy bố cục, số món hay vị trí của một khung mẫu. Bối cảnh mới dựng theo BẢNG THIẾT KẾ của chính truyện mình (điều học được từ cả bộ, các lớp, từng món kèm loại và kết quả tra kho, màu), Daniel duyệt trước khi dựng: workflow `dung-canh-3d` dùng `chi_thiet_ke: true` và `duyet.thiet_ke` (tên cũ `chi_khuon` vẫn nhận; `chon` cũ chỉ có `khuon` và lời duyệt `bang_doi` bị từ chối, phải chạy lại lượt chọn mẫu). `chung/tools/do_mau_khuon.py` so với khoảng của NHIỀU khung cùng loại cảnh, chỉ in cảnh báo để tham khảo, không còn dòng LOI. Sửa theo: thẻ luật 11, luật rút gọn 17, skill 1 (Cảnh mẫu của cảnh), skill 2, skill 4, `CLAUDE.md` bước 5, `BAT-DAU-O-DAY.md`, `chung/tools/buoc.py`. Bối cảnh đã duyệt không đổi; bối cảnh mới sẽ không còn giống bố cục của một khung mẫu.
- **Lời tả Codex phải qua bước tra kho và chọn loại (phiếu P1126-06; Daniel: "lúc gen ảnh codex nó ko check luật 2d 3d để gen").** Công cụ mới `chung/tools/kiem_loi_ta.py`: file lời tả mở đầu bằng bảng món `#MON số | tên | loại | kho: …` (loại `phang`, `khoi-dun`, `khoi-tien`, `khoi-rap`, `tam-nen`). `chung/gen.sh` lấy lời tả qua công cụ đó: thiếu bảng thì không gọi Codex (mã thoát 4); món là khối được thêm câu "vẽ chính diện, không phối cảnh"; khi hết hạn mức ghi sẵn bản đã soát `gen/<tên>.png.loi-ta.txt` để gửi Daniel. Workflow `dung-canh-3d` và skill 2 (mục Vẽ đồ bằng Codex) ghi theo; lời tả mẫu mới `chung/gen/prompts/_mau-tam-kin.txt`. Lời tả đang dở trong `gen/prompts/` phải thêm bảng món mới gen tiếp được. Mức 12–20 món một tấm đã thử: 19 món cắt đủ. Hình đã dựng không đổi.
- **Bóng** (skill 1): đồ vật ở chỗ đèn không tới thì không cần bóng.
- **Ánh sáng** (thẻ luật điều 5, luật rút gọn 19, bảng chấm mục 3 và 8): người vẽ đúng màu riêng; đồ cạnh nguồn sáng không cháy trắng, quầng chỉ nhẹ.
- **Lớp** (thẻ luật điều 3): vật khác nhau xếp trước sau theo vị trí 3D, không ép thứ tự vẽ bằng số.

### Engine (dựng lại thì hình đổi)

- **Người vẽ đúng màu riêng, như video gốc.** `src/mould/Puppet3.tsx`, `src/lib3/look.tsx`: `NGUOI_AN_DEN = {sang: 0.05, mau: 0.15}`. Mọi cảnh có người dựng lại sẽ sáng hơn bản cũ; `lift` cho người gần như hết tác dụng.
- **Trần cho nguồn sáng tự phát.** `src/lib3/look.tsx`: `NGUON_SANG = {tranDenGan: 1.4, tranQuang: 0.2}`. Cảnh có lửa, đèn, nến dựng lại sẽ bớt cháy và bớt ánh ấm quanh nguồn sáng.
- **Bộ màu da đo từ video gốc.** `src/mould/palettes.ts`: `SKINS` là bảy tông (`porcelain`, `warm`, `light`, `fair`, `tan`, `brown`, `dark`). Nhân vật dùng `SKINS.*` đổi màu da khi dựng lại.
- **`Sprite` đứng trước người che được người.** `src/lib3/depth.tsx`: mỗi `Sprite` ghi thêm chiều sâu, prop mới `che` (mặc định bật). Chỉ cảnh có `Sprite` đứng trước người mới khác bản cũ.
- **Bỏ lớp ấm hậu kỳ mặc định.** `src/lib3/look.tsx`: `Finish` mặc định không còn phủ `#f3e2c4` 6 %. Mọi `Shot` không truyền `finish` dựng lại sẽ bớt ngả vàng. (Phiên shisui-1 sửa; Daniel cho giữ.)
- **Bóng người không còn cụt ở phiến lát, mép sàn.** `src/lib3/kit.tsx`: mặt đất thấp hơn chân tới 15 cm hoặc cao hơn tới 8 cm vẫn tính là đất (trước ±6 cm). (Phiên shisui-1 sửa; Daniel cho giữ.)
- **Núi một sắc.** `src/lib3/depth.tsx`: `paintPeak` thêm tuỳ chọn `motSac` (mặc định tắt, nơi khác không đổi). `src/demo/NuiTuyet.tsx`: dãy núi xa một sắc, bỏ 40 vệt tam giác, sườn không còn mảng chia dọc; bối cảnh núi tuyết dựng lại sẽ khác. (Phiên shisui-1 sửa; Daniel cho giữ.)
- **`Pic2D` nhận tham số màu `chinh` (phiếu P1126-09).** `src/lib3/flat.tsx`: `chinh={{sat, lum, tint, amount}}` chỉnh nhẹ màu riêng của một tấm ảnh, chồng lên phép khớp theo cảnh; số bị kẹp (sat 0,5–1,3; lum 0,6–1,2; amount 0–0,4) nên không đổi được sắc màu của ảnh. Không truyền thì hình không đổi một điểm ảnh (đã dựng so trước và sau). Đây là đường hợp lệ để chỉnh màu một ảnh, thay cho tự viết tấm ảnh và lọc màu (`kiem_cam.py` cấm). Món kho (`MonHang`) chưa có tham số này.

### Công cụ

- `chung/tools/kiem_mat.py`: thêm LOI `da-ngoai-bo` (mã màu da tự ghi, không thuộc `SKINS`); thêm cảnh báo `mat-mac-dinh`, `khep-mi`.
- `chung/tools/kiem_bong.py`: `xoay-nguoi` bắt cả `rotY` đi qua component bọc `Puppet3`. Cảnh báo `hai-den-bong` đếm thêm `DenBongPhong` của kênh lich-su. LOI mới `nguoc-sang-hai-den`: đèn khai ngược sáng có đổ bóng mà file còn đèn đổ bóng khác (kiểu lỗi bóng hai hướng ở phòng Berlin); chưa bắt đèn ngược sáng khai bằng `<Sun nguocSang>`, và soát theo file nên file chứa hai cảnh riêng có thể bị báo oan (ghi `hai-den:ok`). Chạy trên cả dự án không thêm lỗi nào.
- `chung/tools/kiem_cam.py` mới (phiếu P1126-07; Daniel: "agent tự tắt các tính năng ko theo engine nữa"): KIỂM CẤM cho file của kênh, `kiem_canh.py` tự gọi nên cổng trước khi gửi Daniel và người rà của workflow đều bắt. LOI `tat-bong` (`cast={false}` trên món không phải khối `B`), `loc-mau` (bộ lọc màu canvas/CSS), `ep-thu-tu` (`renderOrder` ghi tay), `tam-anh-tu-viet` (mesh phẳng có `map`, không đổ bóng); CANH `den-diem`, `lop-am`. Miễn một dòng: `cam:ok <lý do>`. Code có từ trước tính theo mốc `kenh/<kênh>/kiem-cam-moc.json` (lập 26/11: anime-analyst 324 chỗ, lich-su 330, phim-tv 297; năm file bối cảnh đang dựng dở không vào mốc và đang báo 15 lỗi). Workflow `dung-canh-3d`: khối CẤM ở đầu lời giao người dựng và người sửa. Hình không đổi.
- `chung/tools/khoa_chung.py`, `chung/tools/buoc.py`: mới (xem mục Repo và khoá).

### Kho chung

- Daniel duyệt giữ 13 món hang Kabuto (`src/lib3/khoiTuAnh.tsx`): đá vách hang, nhũ đá, tảng đá, bàn đá, giá gỗ, nến, lọ, bình gốm, hộp gỗ, cuộn giấy, kệ gỗ.

Thay đổi trước 26/11/2026: `chung/NHAT-KY-THAY-DOI.md`.
