# Bắt đầu ở đây (cutout3d)

> **Phiên mới đọc theo thứ tự, không đọc gì khác trước (sửa 24/11/2026):** (1) `chung/skills/THE-LUAT-CUNG.md` (hook của dự án tự nạp thẻ này mỗi lần mở phiên và sau mỗi lần tóm tắt); (2) `chung/skills/LUAT-RUT-GON.md` (một trang luật); (3) `chung/skills/bang-cham/BANG-CHAM.md` và các ảnh trong đó (đẹp là gì, bằng hình, khung đạt cắt từ video gốc; bộ cảnh mẫu của video gốc ở `chung/skills/canh-mau/`); (4) `STATUS.md` của ĐÚNG tập Daniel giao (`kenh/<kênh>/tap/<tập>/STATUS.md`), không mở STATUS của tập khác; (5) mục "Cách làm từ 23/11/2026" ở cuối `chung/skills/4-quy-trinh.md`. Năm skill đầy đủ chỉ mở khi cần chi tiết. Dựng cảnh luôn qua workflow `dung-canh-3d` (`.claude/workflows/dung-canh-3d.js`), phiên chính không tự dựng. Agent mới cho mỗi việc, mỗi phiên chính làm trọn một tập, làm theo lô 5 chương, Daniel duyệt bảng phân cảnh trước khi diễn.

Dành cho một phiên làm việc mới (người hoặc Claude) chưa biết gì về thư mục này. Đọc file này trước, rồi mở đúng các file nó chỉ; đừng đọc cả thư mục.

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
│  ├─ skills/            cách làm, đọc theo vai: 0 đạo diễn, 1 dựng cảnh, 2 kho, 3 nhân vật và diễn, 4 quy trình
│  ├─ tools/             kho.py (kho), vatly.py (kiểm vật lý), thu_giong.py (thu giọng)
│  ├─ dang-lam.yaml      kênh và tập mặc định; ghi đè cho một lệnh bằng KENH=<kênh> TAP=<tập> (bắt buộc khi hai phiên làm hai kênh)
│  └─ NHAT-KY-THAY-DOI.md   mọi thay đổi, mới nhất ở cuối phần đầu
└─ kenh/
   ├─ phim-tv/           kênh hiện có: kenh.yaml, ghi-chu.md, cast/ (dàn nhân vật), kho/ (kho riêng của kênh),
   │                     tap/doom-1/ (cảnh quay; dung-canh/ = người đứng ở mốc trong các bối cảnh chung; dai-hoc/), out/
   ├─ anime-analyst/    kênh thứ hai (mở 22/11/2026): mới có khung và một tập giữ chỗ; phiên làm kênh này đọc BAT-DAU-O-DAY.md trong đó
   └─ _khung-kenh-moi/   khung trống + README cách mở kênh mới
```
`shorts-claude/rover-lab` là liên kết cũ trỏ tới `cutout3d/chung`.

## Đọc gì, theo việc định làm

- **Làm tiếp tập đang dở:** `kenh/<kênh>/tap/<tập>/STATUS.md` của tập Daniel giao (đang ở bước nào, chờ gì), rồi kế hoạch tập đã duyệt, rồi danh sách cảnh của chương sắp làm.
- **Làm một đoạn phim mới (bất kì kênh nào):** `chung/skills/4-quy-trinh.md`. Nó nói các vai (đạo diễn → dựng cảnh → diễn xuất → ghép), ai đọc skill nào, file nào của ai, và các cổng duyệt.
- **Mở kênh mới:** `kenh/_khung-kenh-moi/README.md`.
- **Sửa bộ khuôn hay thư viện chung:** `chung/skills/3-nhan-vat-dien-xuat.md` và cuối `chung/NHAT-KY-THAY-DOI.md`; sửa xong dựng lại ảnh kho liên quan và so với ảnh cũ.
- **Hiểu vì sao cấu trúc như thế này, còn nợ gì:** `BAO-CAO-TACH.md` (tách 22/11) và `BAO-CAO-GO-PHU-THUOC.md` (gỡ phần chung khỏi kênh, 23/11).

## Ba luật chung/kênh (từ 23/11/2026, ghi ở skill 1, 2, 3)

- **Phần chung không biết kênh nào.** Không file nào trong `chung/` import `kenh/`. Bối cảnh chỉ nhận người qua `children`/`figures` (cõi lửa: prop `soul`).
- **Người của kênh ở trong kênh.** Dàn nhân vật: `kenh/<kênh>/cast/`. Ảnh tĩnh có người đứng ở mốc, mốc và góc máy của từng cảnh, dữ liệu riêng của tập: `kenh/<kênh>/tap/<tập>/dung-canh/<BốiCảnh>Nguoi.tsx`, import bối cảnh từ `chung/src/demo/`. Cảnh quay import dàn nhân vật bằng đường tương đối tới `../../cast/<ma>Cast.ts`.
- **Kho hai danh mục.** Món dùng cho mọi kênh (code ở `chung/src`) vào `chung/assets/catalog.json` + `chung/src/catalog/Catalog.tsx`; món chỉ của một kênh (nhân vật, bảng của nhân vật, bối cảnh có người) vào `kenh/<kênh>/kho/catalog.json` + `kho/Previews.tsx` (composition `kho-asset-<kênh>`). `tools/kho.py` gộp danh mục chung với danh mục của kênh đang làm.

## Lệnh hay dùng (chạy trong `chung/`, Chrome phải chạy ngoài sandbox)

```
./still.sh <composition> <khung> [cỡ]        một khung hình → out/
./render-video.sh <composition> [cỡ]         video một cảnh (mặc định cỡ 1; bản gửi duyệt dùng 1.5)
python3 tools/kho.py kiem | anh <id…> | muc-luc
python3 tools/kiem_bong.py <file…>            rà bóng (không được có LOI)
python3 tools/kiem_canh.py <file…>            rà máy quay, hạt, vật lặp đều (không được có LOI)
python3 tools/canh_mau.py tim … | ghep … | luoi …   tra thư viện cảnh mẫu của video gốc, ghép tấm, làm lưới đoán mù
python3 tools/do_mau_khuon.py <ảnh> [khung khuôn]  đo màu theo vai, so với khung khuôn của bối cảnh (không được có LOI)
python3 tools/kho.py tim <từ> [--nhom <nhóm>]     TRA KHO trước khi làm một món; python3 tools/kiem_kho.py <file> báo món tự vẽ lại
./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu kiểu vẽ>   Codex vẽ MỘT tấm 4–8 món (ngoài sandbox); rồi python3 tools/cut.py gen/<tên>.png public/<thư mục> <tiền tố>
npx tsc --noEmit -p .                        kiểm kiểu
python3 tools/thu_giong.py                   thu giọng cho tập trong dang-lam.yaml (tốn tiền)
```
Kiểm vật lý: xem đầu file `tools/vatly.py` (chạy bằng `uv`).

## Hai phiên làm hai kênh cùng lúc

- Mỗi kênh có file vào riêng `kenh/<kênh>/entry.ts`; các lệnh dựng hình tự chọn file đó theo kênh đang làm, nên code dở dang của kênh này không làm hỏng lệnh dựng của kênh kia. `chung/src/index.ts` chứa mọi kênh, chỉ dùng cho kiểm kiểu.
- Phiên không phải kênh mặc định chạy mọi lệnh kèm `KENH=<kênh> TAP=<tập>`, không sửa `dang-lam.yaml`.
- Món kho của riêng một kênh ghi vào `kenh/<kênh>/kho/` của kênh đó, không đụng kho chung.
- File dùng chung mà cả hai cùng ghi (Root, `assets/catalog.json`, Catalog.tsx, kho.py, skill, nhật ký, bộ khuôn): chỉ chèn đúng chỗ, đọc lại ngay trước khi sửa, không ghi đè cả file. Chi tiết: `kenh/anime-analyst/BAT-DAU-O-DAY.md`.

## Luật làm việc với chủ kênh (Daniel), tóm tắt

- Trả lời bằng tiếng Việt. Ông duyệt theo nấc: danh sách cảnh trên giấy, ảnh tĩnh từng bối cảnh, rồi video; khi kiểu hình đã chốt thì làm theo lô lớn, đừng dừng chờ từng nấc.
- Hỏi trước khi chạy hơn 7 agent hoặc agent trên mức vừa. Đừng thuật lại từng báo cáo của agent: chỉ nhắn khi có thứ để xem hoặc cần quyết.
- Đổi gì cũng ghi ngay: skill liên quan, `NHAT-KY-THAY-DOI.md`, kho. Món mới phải vào kho.
- Lỗi ông đã chỉ thì tự mở ảnh phóng to soi trước khi gửi lại.
- Bối cảnh thì được dùng lại; nhân vật có tên phải có dáng mặt và đồ mặc riêng. Người trong khung phải diễn. Vật nóng phải có đủ lớp sáng và hạt.
- Chi tiết nằm trong các skill và trong bộ nhớ của Claude Code cho dự án `shorts-claude`.
