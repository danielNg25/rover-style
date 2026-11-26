# Bản đồ thư mục và bảng lệnh (cutout3d)

> **Quy trình làm một tập, các bước và các chỗ chờ Daniel duyệt: `CLAUDE.md` ở cùng thư mục** (tự nạp vào mọi phiên, từ 26/11/2026; file này trước đó là chỗ bắt đầu). File này chỉ còn là bản đồ: cái gì nằm ở đâu, lệnh nào hay dùng, hai phiên làm hai kênh thế nào. Vai nào đọc mục skill nào: bảng "Ai đọc gì" ở đầu `chung/skills/4-quy-trinh.md`.

Mở file này khi cần biết một thứ nằm ở đâu hoặc gọi lệnh nào; đừng đọc cả thư mục.

## Đây là gì

Một bộ làm phim hoạt hình giải thích kiểu "cắt giấy 2,5D" bằng code (Remotion 4 + three.js): nhân vật vẽ từ một bộ khuôn, đặt trong bối cảnh 3D xếp lớp, có ánh sáng, máy quay và hiệu ứng. Lời đọc là giọng ElevenLabs. Một phần dùng chung cho mọi kênh, mỗi kênh giữ riêng nội dung của mình.

## Cấu trúc

```
cutout3d/
├─ chung/                phần CHUNG: dự án dựng hình duy nhất
│  ├─ src/mould/         bộ khuôn nhân vật (chỉ người điều phối sửa)
│  ├─ src/lib3/          dựng cảnh, ánh sáng, máy quay, hiệu ứng, đồ của từng bối cảnh
│  ├─ src/demo/          các bối cảnh đã dựng (lò rèn, sảnh ngai, trại, lều, sân trường…), KHÔNG có người của kênh nào
│  ├─ src/mould/nguoi-mau.ts  người mẫu cho các bảng của kho chung
│  ├─ assets/            kho CHUNG: ảnh xem trước + catalog.json + DANH-MUC.md (mục lục)
│  ├─ skills/            cách làm, đọc theo vai: 0 đạo diễn, 1 dựng cảnh, 2 chuẩn món đồ và kho, 3 nhân vật và diễn, 4 quy trình; bang-cham/ (chuẩn bằng hình), canh-mau/ (khung video gốc)
│  ├─ tools/             buoc.py (tập đang ở bước nào); kho.py (kho); kiem_bong.py, kiem_canh.py, kiem_mat.py, kiem_kho.py (cổng kiểm); canh_mau.py, do_mau_khuon.py (cảnh mẫu để nhìn và học, đo màu tham khảo); vatly.py (kiểm vật lý); thu_giong.py (thu giọng)
│  ├─ dang-lam.yaml      kênh và tập mặc định; ghi đè cho một lệnh bằng KENH=<kênh> TAP=<tập> (bắt buộc khi hai phiên làm hai kênh)
│  └─ NHAT-KY-THAY-DOI.md   nhật ký dựng bối cảnh, cảnh quay; thay đổi phần chung tới 26/11/2026 (từ đó ghi ở CHANGELOG.md, gốc repo)
└─ kenh/
   ├─ phim-tv/           kênh hiện có: kenh.yaml, ghi-chu.md, cast/ (dàn nhân vật), kho/ (kho riêng của kênh),
   │                     tap/doom-1/ (cảnh quay; dung-canh/ = người đứng ở mốc trong các bối cảnh chung; dai-hoc/), out/
   ├─ anime-analyst/    kênh thứ hai (mở 22/11/2026); phiên làm kênh này đọc thêm BAT-DAU-O-DAY.md trong đó
   ├─ lich-su/          kênh thứ ba (tiếng Anh, "Your Life as…"); luật riêng ở ghi-chu.md của kênh
   └─ _khung-kenh-moi/   khung trống + README cách mở kênh mới
```
`shorts-claude/rover-lab` là liên kết cũ trỏ tới `cutout3d/chung`.

## Đọc gì, theo việc định làm

- **Làm một tập (mới hay đang dở):** theo `CLAUDE.md`. Tập đang ở bước nào: `python3 tools/buoc.py` (trong `chung/`); quyết định và ghi chú của tập: `kenh/<kênh>/tap/<tập>/STATUS.md`.
- **Việc của từng vai** (đạo diễn, dựng cảnh, diễn xuất, ghép), file nào của ai, ngân sách dựng hình: `chung/skills/4-quy-trinh.md`.
- **Mở kênh mới:** `kenh/_khung-kenh-moi/README.md`.
- **Sửa bộ khuôn hay thư viện chung:** `chung/skills/3-nhan-vat-dien-xuat.md`, `CHANGELOG.md` và cuối `chung/NHAT-KY-THAY-DOI.md`; sửa xong dựng lại ảnh kho liên quan và so với ảnh cũ.
- **Hiểu vì sao cấu trúc như thế này, còn nợ gì:** `BAO-CAO-TACH.md` (tách 22/11) và `BAO-CAO-GO-PHU-THUOC.md` (gỡ phần chung khỏi kênh, 23/11).

## Ba luật chung/kênh (từ 23/11/2026, ghi ở skill 1, 2, 3)

- **Phần chung không biết kênh nào.** Không file nào trong `chung/` import `kenh/`. Bối cảnh chỉ nhận người qua `children`/`figures` (cõi lửa: prop `soul`).
- **Người của kênh ở trong kênh.** Dàn nhân vật: `kenh/<kênh>/cast/`. Ảnh tĩnh có người đứng ở mốc, mốc và góc máy của từng cảnh, dữ liệu riêng của tập: `kenh/<kênh>/tap/<tập>/dung-canh/<BốiCảnh>Nguoi.tsx`, import bối cảnh từ `chung/src/demo/`. Cảnh quay import dàn nhân vật bằng đường tương đối tới `../../cast/<ma>Cast.ts`.
- **Kho hai danh mục.** Món dùng cho mọi kênh (code ở `chung/src`) vào `chung/assets/catalog.json` + `chung/src/catalog/Catalog.tsx`; món chỉ của một kênh (nhân vật, bảng của nhân vật, bối cảnh có người) vào `kenh/<kênh>/kho/catalog.json` + `kho/Previews.tsx` (composition `kho-asset-<kênh>`). `tools/kho.py` gộp danh mục chung với danh mục của kênh đang làm.

## Lệnh hay dùng (chạy trong `chung/`, Chrome phải chạy ngoài sandbox)

```
./still.sh <composition> <khung> [cỡ]        một khung hình → out/
./render-video.sh <composition> [cỡ]         video một cảnh (mặc định cỡ 1 để kiểm; bản gửi Daniel dùng cỡ 2 = 2560×1440)
python3 tools/buoc.py [dat <bước> dang|cho-duyet|xong …]   tập đang ở bước nào; ghi một bước, bước có cổng kèm --duyet "<lời Daniel>"
python3 tools/khoa_chung.py [xin … | duyet <mã> | dong <mã>]   PHẦN CHUNG BỊ KHOÁ: soát file lệch bản niêm; lập phiếu xin sửa kèm ảnh KHÔNG SỬA / CÓ SỬA (--help)
python3 tools/kiem_cam.py [file…]                              KIỂM CẤM (kiem_canh.py tự gọi): file của kênh tắt bóng, lọc màu, ép renderOrder, tự viết tấm ảnh; code cũ tính theo mốc kenh/<kênh>/kiem-cam-moc.json
python3 tools/khoa_chung.py luu "<đổi gì>" [món kho đã duyệt…]   lưu thay đổi phần chung lên repo: commit và đẩy lên GitHub (chạy ngoài sandbox; phải có dòng mới trong CHANGELOG.md)
python3 tools/kho.py kiem | anh <id…> | muc-luc
python3 tools/kiem_bong.py <file…>            rà bóng (không được có LOI)
python3 tools/kiem_canh.py <file…>            rà máy quay, hạt, vật lặp đều (không được có LOI)
python3 tools/canh_mau.py tim … | ghep … | luoi …   tra thư viện cảnh mẫu của video gốc, ghép tấm, làm lưới đoán mù
python3 tools/do_mau_khuon.py <ảnh> [khung mẫu…]   đo màu theo vai, so với khoảng của nhiều khung mẫu cùng loại cảnh (để tham khảo, không phải cổng)
python3 tools/kho.py tim <từ> [--nhom <nhóm>]     TRA KHO trước khi làm một món; python3 tools/kiem_kho.py <file> báo món tự vẽ lại
./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu kiểu vẽ>   Codex vẽ MỘT tấm KÍN 12–20 món (ngoài sandbox; hạn mức tính theo số lần gen); rồi python3 tools/cut.py gen/<tên>.png public/<thư mục> <tiền tố> --mong=<số món>
npx tsc --noEmit -p .                        kiểm kiểu
python3 tools/thu_giong.py                   thu giọng cho tập trong dang-lam.yaml (tốn tiền)
```
Kiểm vật lý: xem đầu file `tools/vatly.py` (chạy bằng `uv`).

## Repo git của phần chung

Từ 26/11/2026 phần chung nằm trong một repo git, gốc repo là `cutout3d/`, nhánh `main`, remote `https://github.com/danielNg25/rover-style`. Máy khác nhận thay đổi bằng `git pull`; không còn gói tar.

- **Trong repo:** `chung/` (engine, công cụ, luật, kho `assets/` `public/` `gen/`, bản niêm của khoá), `CLAUDE.md`, `BAT-DAU-O-DAY.md`, `CHANGELOG.md`, `.claude/settings.json`, `.claude/workflows/`. **Ở lại từng máy** (`.gitignore`): `kenh/`, `chung/node_modules`, `chung/qa`, `chung/out`, `chung/dang-lam.yaml`, phiếu và sổ của khoá.
- **Lưu một thay đổi:** ghi một dòng vào `CHANGELOG.md` (ngày mới nhất ở trên), rồi trong `chung/`: `python3 tools/khoa_chung.py luu "<đổi gì>" [món kho đã duyệt…]`. Lệnh tự đưa vào commit các file đã niêm đang khớp bản niêm, sổ niêm và `CHANGELOG.md`; món kho, ảnh gen, file mới phải kể tên. Nó từ chối file đã niêm lệch bản niêm (chưa có phiếu đóng) và commit thiếu dòng changelog. `git commit` bằng tay cũng qua chốt đó (`chung/tools/git-hooks/pre-commit`).
- **Lệnh git ghi vào `.git`** (add, commit, pull) bị sandbox của phiên chặn: chạy ngoài sandbox.
- **Lấy bản mới về:** chỉ khi Daniel bảo. `git pull`, rồi đọc phần mới của `CHANGELOG.md`, mục "Sau khi lấy về".
- **Máy chưa nối với repo** (đang có thư mục `cutout3d/` từ gói tar): trong `cutout3d/` chạy `git init -b main`, `git remote add origin https://github.com/danielNg25/rover-style.git`, `git fetch origin`, `git reset --hard origin/main`, `git branch -u origin/main`, `git config core.hooksPath chung/tools/git-hooks`. Lệnh `reset` ghi đè file phần chung bằng bản trên repo; `kenh/`, `node_modules`, `dang-lam.yaml` không bị đụng. Có `chung/.git` cũ thì dời ra trước.
- **Đường dẫn:** không file nào trong repo ghi đường dẫn của một máy. Hook dùng `$CLAUDE_PROJECT_DIR` (mở phiên ở đúng `cutout3d/`); workflow `dung-canh-3d` nhận `goc` do phiên truyền vào.

## Hai phiên làm hai kênh cùng lúc

- Mỗi kênh có file vào riêng `kenh/<kênh>/entry.ts`; các lệnh dựng hình tự chọn file đó theo kênh đang làm, nên code dở dang của kênh này không làm hỏng lệnh dựng của kênh kia. `chung/src/index.ts` chứa mọi kênh, chỉ dùng cho kiểm kiểu.
- Phiên không phải kênh mặc định chạy mọi lệnh kèm `KENH=<kênh> TAP=<tập>`, không sửa `dang-lam.yaml`.
- Món kho của riêng một kênh ghi vào `kenh/<kênh>/kho/` của kênh đó. Món dùng chung được thì vào kho chung, sau khi Daniel duyệt món đó (skill 2, Thẻ làm một món).
- File dùng chung mà cả hai cùng ghi (Root, `assets/catalog.json`, Catalog.tsx, kho.py, skill, nhật ký, bộ khuôn): chỉ chèn đúng chỗ, đọc lại ngay trước khi sửa, không ghi đè cả file. Chi tiết: `kenh/anime-analyst/BAT-DAU-O-DAY.md`.

## Luật làm việc với chủ kênh (Daniel), tóm tắt

- Trả lời bằng tiếng Việt. Các chỗ chờ ông duyệt: bảng ở `CLAUDE.md` (lời đọc, danh sách cảnh, bảng thiết kế của bối cảnh mới, bảng phân cảnh, video); bước 4–7 làm theo lô 5 chương, cả lô gửi một lần.
- Hỏi trước khi chạy hơn 7 agent hoặc agent trên mức vừa. Đừng thuật lại từng báo cáo của agent: chỉ nhắn khi có thứ để xem hoặc cần quyết.
- Đổi gì ở code hay kho chung thì ghi ngay một dòng vào `CHANGELOG.md` rồi lưu lên repo (mục Repo git của phần chung). Luật trong skill chỉ sửa khi Daniel đã xác nhận (luật 25a). Món mới theo Thẻ làm một món.
- Lỗi ông đã chỉ thì tự mở ảnh phóng to soi trước khi gửi lại.
- Bối cảnh thì được dùng lại; nhân vật có tên phải có dáng mặt và đồ mặc riêng. Người trong khung phải diễn. Vật nóng phải có đủ lớp sáng và hạt.
- Chi tiết nằm trong các skill và trong bộ nhớ của Claude Code cho dự án `shorts-claude`.
