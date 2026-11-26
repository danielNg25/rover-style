# Báo cáo rà toàn bộ luật cutout3d (đêm 25/11/2026)

Người rà: Claude, phiên phim-tv. Tự đọc, không dùng agent. **Chưa sửa gì theo báo cáo này: chờ Daniel duyệt từng dòng.**

## 0. Trạng thái (26/11/2026): ĐÃ SỬA theo báo cáo này

Daniel đã trả lời đủ Q1–Q10 và đồng ý mục 4, 5, 7, 8. Đã làm:

- **Q1** người giữ màu riêng: engine (`Puppet3`, tham số `anMau`) và luật.
- **Q2** hạt quanh người khi giận, thề: có nhưng ít.
- **Q3** bỏ tấm tiền cảnh dán theo máy ở mọi kênh; `kiem_canh.py` báo `tien-canh-dan`.
- **Q4** chỉ làm mờ nền khi cảnh tập trung vào một chủ thể.
- **Q5** bỏ vệt tiếp đất của đồ vật: engine (`ContactShade` tắt).
- **Q6** trong nhà vẫn có bóng, mờ hơn theo độ sáng: engine vẽ bóng của người bằng chính hình bóng nhân vật (`BONG_NGUOI`).
- **Q7** một ngưỡng sàn Y 70, bỏ hai dải số. **Q8** video gửi Daniel cỡ 2 (1440p).
- **Q9** món dùng chung vào kho chung, thêm món nào cũng cần Daniel duyệt. **Q10** sáu món kiểu cũ đã bỏ khỏi kho.
- **Mục 4** (S1–S15), **mục 5** (11 đoạn lỗi thời): đã sửa trong các skill. **Mục 7**: hai mục dàn nhân vật Doom đã dời sang `kenh/phim-tv/ghi-chu.md`. **Mục 8**: 18 tài liệu cũ đã dời vào `chung/_tai-lieu-cu/`. **Mục 9**: workflow nhận thư mục dự án qua `args.goc`; đường dẫn Chrome trong các script CHƯA sửa.
- **Mục 10**: thẻ luật cứng rút từ 1.849 xuống 870 chữ; thêm Thẻ làm một món (skill 2); workflow ghi từng vai đọc mục nào.

**Làm thêm sáng 26/11/2026** (Daniel: "xử hết các việc chưa làm luôn, đèn ko tới chắc cũng ko cần bóng đâu"):
- Gọt phần kể chuyện, lời trích, ví dụ lặp trong skill 0, 1, 3; không đổi luật nào. Tám file luật (thẻ, luật rút gọn, skill 0–4, bảng chấm): 33.200 xuống 31.100 chữ. Phần còn lại là hướng dẫn thật; muốn ngắn nữa thì phải bỏ bớt luật, việc đó chờ Daniel chọn.
- Ba phép kiểm mới: `cung-ma-phang` (`kiem_kho.py`: món cứng chỉ là một tấm phẳng), `hai-den-bong` (`kiem_bong.py`: một file của kênh có hai đèn cùng đổ bóng), `mo-nen` (`kiem_canh.py`: cảnh từ hai người mà vẫn làm mờ nền). Cả ba là cảnh báo, có nhãn bỏ qua khi cố ý.
- Mục 9: đường dẫn Chrome và thư mục dự án trong 12 script, công cụ không còn ghi cứng (`tools/chrome.sh`, `tools/chrome.py`, biến `CUTOUT3D_CHROME`).
- Skill 1, mục Bóng: đồ vật ở chỗ đèn không tới thì không cần bóng.
- Người giữ màu riêng: đã đo trên ba cảnh Doom có đèn màu (`kenh/phim-tv/out/kiem-anh-sang/nguoi-giu-mau-rieng.jpg`).
- **Quy trình một tập** (lỗ hổng: phiên mới không được gì bắt đọc quy trình): `CLAUDE.md` ở gốc cutout3d tự nạp mỗi phiên, bảng 9 bước và cổng duyệt; `tools/buoc.py` ghi tập đang ở bước nào; hook in bước hiện tại; workflow `dung-canh-3d` đòi lời duyệt của bước trước (`duyet`, `chon`).
- CÒN CHỜ DANIEL: duyệt 13 món các phiên khác đã thêm vào kho chung ngày 25/11 (`kenh/_thu-mau/out/kho-13-mon-cho-duyet.jpg`).

Bản luật trước lượt rà: `chung/_luu-luat-2026-11-25/`; trước lượt gọt: `chung/_luu-luat-2026-11-26-truoc-rut-gon/`.

## 1. Kết luận

Đã đọc trọn: thẻ luật cứng, luật rút gọn, `BAT-DAU-O-DAY.md`, năm skill 0–4, bảng chấm, và toàn bộ lời giao việc trong workflow `dung-canh-3d`. Tổng khoảng 40 nghìn chữ.

- **25 chỗ nói ngược nhau.** 10 chỗ cần Daniel chọn (mục 3). 15 chỗ có bên đúng rõ ràng, chỉ cần Daniel gật (mục 4).
- **3 lỗ hổng cấu trúc** giải thích vì sao các phiên "quên luật" (mục 2).
- **11 chủ đề bị chép ở 4–9 nơi** (mục 6), **11 đoạn đã lỗi thời** (mục 5), khoảng 60 dòng luật riêng của kênh phim-tv nằm trong skill chung (mục 7).
- 18 tài liệu cũ, khoảng 75 nghìn chữ, còn nằm ở gốc `chung/` (mục 8).

Số dòng ghi trong báo cáo là số dòng của file tại lúc rà.

## 2. Ba lỗ hổng cấu trúc

**A. Agent dựng cảnh không được bảo đọc skill 1, 2, 3.**
Lời mở của workflow (dòng 38) bảo mọi agent đọc bốn thứ: thẻ luật cứng, luật rút gọn, bảng chấm, skill 4. `BAT-DAU-O-DAY.md` (dòng 3) cũng ghi "năm skill đầy đủ chỉ mở khi cần chi tiết". Trong khi đó:
- cách chia phẳng hay khối chỉ có ở skill 2;
- cách tra kho chỉ có ở skill 1;
- luật mặt, tay, hướng nhìn chỉ có ở skill 3.

Bảng vai của skill 4 (dòng 13–16) lại ghi người dựng cảnh đọc skill 1, 2, 4. Ba nơi nói ba kiểu, và agent theo lời của workflow.

**B. Không có luật nói rõ món dùng chung do phiên kênh làm ra thì để ở đâu.**
- Skill 2 (dòng 19): món làm xong nằm trong thư viện chung, không nằm trong file cảnh.
- Luật rút gọn 25 và skill 4 (dòng 35): không sửa thư viện chung khi chưa được giao.
- `BAT-DAU-O-DAY.md` (dòng 68) và skill 2 (dòng 10): phiên làm kênh chỉ ghi vào kho của kênh mình.

Kết quả: phiên kênh làm ra một tảng đá thì để luôn trong file bối cảnh của kênh. Đó là gốc của 136 món tự viết lại mà mình đếm được tối nay.

**C. Đầu skill 0, 1, 2, 3 đều ghi "đổi bất cứ thứ gì thì ghi ngay vào skill này".**
Skill 4 (dòng 3, 36), luật 25a và lời mở workflow lại ghi không sửa skill khi Daniel chưa xác nhận. Bốn dòng đầu file đó mời agent tự sửa luật.

## 3. Mười chỗ cần Daniel chọn

| # | Chủ đề | Bên này nói | Bên kia nói | Mình đề nghị |
|---|---|---|---|---|
| Q1 | Người ăn màu đèn hay giữ màu riêng | Thẻ 5; bảng chấm mục 3 (dòng 34, 36); skill 1 dòng 245: người giữ màu riêng, da ngả cam theo đèn là HỎNG | Skill 1 dòng 142 ("gần đèn bàn thì ấm, trong tối thì xám xanh"); skill 3 dòng 45, 165: người ăn sáng của cảnh, tự nhận màu | Giữ màu riêng. Ngoại lệ duy nhất: ánh hắt của hiệu ứng (bảng chấm mục 8). Engine hiện vẫn để người ăn màu đèn, phải sửa engine |
| Q2 | Hạt quanh người khi giận, thề | Thẻ 9; skill 1 dòng 268 (25/11): hạt không bám, không quấn quanh người; bụi cả phòng đổi màu nhân vật | Luật rút gọn 20; skill 0 dòng 262 (23/11): quầng màu ôm người và hạt sáng bốc quanh người | Theo bản 25/11. Còn "quầng màu ôm người" có giữ không thì Daniel nói |
| Q3 | Tiền cảnh | Skill 1 dòng 45 và mẫu file dòng 156: một tấm vẽ tiền cảnh đặt sát máy | Daniel 23/11 (kênh anime): "2 cục 2 bên dính màn hình... technic của bản cũ" | Bỏ tấm dán theo máy ở mọi kênh. Vật đóng khung của bảng chấm mục 1 phải là vật thật đặt trong bối cảnh |
| Q4 | Làm mờ nền ở trung cảnh, cận cảnh | Skill 0 dòng 44; skill 1 dòng 123, 129; skill 3 dòng 95: thêm `soft` cho nền mềm đi | Daniel 25/11 (kênh anime): "tắt làm mờ nền" | Tắt cho mọi kênh, hay chỉ kênh anime? |
| Q5 | Vệt tiếp đất của đồ vật | Skill 2 dòng 39: món nào cũng có bóng tiếp đất; skill 1 dòng 284: đồ trong kit giữ vệt | Thẻ 5: một bóng, bỏ vệt tròn (Daniel nói về người) | Đồ vật cũng bỏ vệt, hay giữ? Hiện đồ vật có cả vệt lẫn bóng đổ |
| Q6 | Nắng trong phòng | Skill 1 dòng 58: nắng qua cửa sổ thấp khoảng 22°; dòng 141: đêm trong phòng có trăng qua cửa sổ và đèn bàn cùng đổ bóng | Khung bóng 0,35–0,8 lần chiều cao; mỗi người một bóng | Người đứng trong vệt nắng cửa sổ được bóng dài không? Mình đề nghị: trong phòng chỉ một đèn đổ bóng lên người, đèn còn lại chỉ rọi sáng |
| Q7 | Thước đo độ sáng | Luật rút gọn 17: đêm sáng 85–105; skill 1 dòng 244: đêm 78–95; skill 4 dòng 83: không ảnh nào dưới 70 | Thẻ 11: không có công thức màu chung, màu đo theo khung khuôn | Giữ một ngưỡng sàn (không ảnh nào dưới 70) để chống tối; còn lại theo khuôn; xoá hai dải số lệch nhau |
| Q8 | Bản video gửi Daniel | Skill 3 dòng 174; skill 4 dòng 46: cỡ 2 (2560×1440) | `BAT-DAU-O-DAY.md` dòng 51; luật rút gọn dòng 3: cỡ 1,5 | Daniel chọn một |
| Q9 | Món dùng chung do phiên kênh làm ra để ở đâu (lỗ hổng B) | Skill 2: vào thư viện chung | Luật rút gọn 25, skill 4: không đụng thư viện chung | Phiên kênh được THÊM file mới vào thư viện chung và thêm mục vào kho chung; không được sửa hay xoá thứ đang có |
| Q10 | Món kho vẽ theo kiểu Daniel đã chê | Kho: hai món núi chia hai màu, bốn món đá tuyết nhiều mặt tam giác | Luật núi và đá 25/11 | Vẽ lại bằng Codex thành bộ mới đặt cạnh; món cũ ghi "chỉ dùng cho Doom" |

### Trả lời của Daniel (đêm 25/11/2026)

| # | Daniel chốt | Trạng thái |
|---|---|---|
| Q1 | Người giữ màu riêng, không ăn màu đèn | chốt; chưa sửa luật, chưa sửa engine |
| Q2 | Hạt quanh người khi giận, thề: có, nhưng ít | chốt; chưa sửa luật |
| Q3 | "ko hiểu" | hỏi lại bằng hình (`kenh/phim-tv/out/kiem-anh-sang/hoi-lai-3-5-6.jpg`) |
| Q4 | Chỉ làm mờ nền khi cảnh quay tập trung vào một chủ thể chính | chốt; chưa sửa luật |
| Q5 | "là gì" | hỏi lại bằng hình |
| Q6 | chưa rõ câu hỏi | hỏi lại bằng hình: trong phòng người không còn bóng nào |
| Q7 | chưa rõ câu hỏi | hỏi lại: xoá hai dải số lệch nhau, giữ một ngưỡng sàn |
| Q8 | chưa rõ câu hỏi | hỏi lại: video duyệt 1080p hay 1440p |
| Q9 | Để vào chỗ chung luôn, nhưng thêm món nào cũng cần Daniel duyệt | chốt; chưa sửa luật |
| Q10 | Bỏ khỏi kho | ĐÃ LÀM: gỡ sáu món khỏi `assets/catalog.json` và `Catalog.tsx`, ảnh dời vào `assets/_da-bo/`, code giữ cho tập Doom |

## 4. Mười lăm chỗ có bên đúng rõ ràng

Bên đúng là lời mới hơn của Daniel. Mình đề nghị sửa bên sai cho khớp.

| # | Chủ đề | Câu sai, ở đâu | Câu đúng |
|---|---|---|---|
| S1 | Mặt lớn phải nhiều chi tiết | Skill 1 dòng 51, 184 ("12 ô, ô nào cũng có hai lớp"), dòng 211–214 (tường phải có vân, vết ố); skill 2 dòng 36–37; luật rút gọn 22 ("không vùng trơn") | Skill 1 dòng 78, 80 (25/11): mặt lớn yên, kiểu rất nhẹ; chi tiết dồn vào đồ vật |
| S2 | Đường dẫn mắt chạy vào sâu | Skill 1 dòng 50, 126 | Thẻ 2: sân khấu ngang, không đường chạy vào sâu |
| S3 | Cỡ cảnh ghi theo phần trăm đầu | Skill 0 dòng 100 (21/11) | Skill 0 dòng 226 (23/11): ghi bằng thứ thấy trong khung |
| S4 | Toàn cảnh người cao 40–50 % khung | Skill 1 dòng 97; skill 3 dòng 55 | Thẻ 6: trung cảnh mới là từ 40 %. Toàn cảnh ghi "thấy cả người tới chân" |
| S5 | "Bóng mềm dưới mọi vật và người" | Skill 1 dòng 78, 79; workflow dòng 40, 115; skill 0 dòng 102 ("bóng vẽ") | Thẻ 5: người một bóng, không đặt vệt. Chính câu sai này làm agent chồng ba vệt bóng |
| S6 | Nắng thấp cho bóng dài | Skill 1 dòng 162 | Khung bóng 0,35–0,8 |
| S7 | Đặt đèn màu ở phía ống kính | Skill 0 dòng 110; skill 3 dòng 103; skill 1 dòng 134, 141 | Thẻ 5: không đèn màu. Chỉ nguồn hiệu ứng có ánh màu cục bộ (bảng chấm mục 8) |
| S8 | "Không khí luôn có hạt", "không để trống" | Luật rút gọn 18; skill 0 dòng 257; skill 1 dòng 190, 254 | Thẻ 9: cảnh thường chỉ có bụi của nguồn sáng; hạt nền dưới 30 hạt |
| S9 | Thứ đã duyệt cũng phải làm lại theo luật mới | Skill 1 dòng 238, 247; bảng chấm bước 5 | Skill 1 dòng 81; Daniel: luật mới chỉ cho chương sau, vòng sửa không đổi khung đã duyệt |
| S10 | Agent không được tạo ảnh bằng công cụ khác | Skill 4 dòng 54 | Thẻ 13: phải vẽ bằng Codex |
| S11 | Số sắc mỗi món | 2–3 (luật rút gọn 21, skill 1 dòng 49), ba sắc (skill 2 dòng 35) | 2–4 sắc (skill 1 dòng 78) |
| S12 | Phía sáng của hình phẳng luôn ở bên trái | Skill 1 dòng 49; skill 2 dòng 31 | Phía sáng theo hướng đèn của cảnh (đèn được ở trái hoặc phải) |
| S13 | Ngân sách dựng lại | Bốn con số khác nhau: luật rút gọn 24, skill 1 dòng 28, skill 4 dòng 51, workflow | Một bảng duy nhất ở skill 4 |
| S14 | Agent đọc gì (lỗ hổng A) | Ba nơi nói ba kiểu | Workflow ghi rõ từng vai đọc mục nào của skill nào |
| S15 | "Đổi gì thì ghi ngay vào skill này" (lỗ hổng C) | Dòng 3 của skill 0, 1, 2, 3 | Skill 4 dòng 3 và luật 25a |

## 5. Mười một đoạn lỗi thời (xoá hoặc sửa, không đổi luật)

1. Luật rút gọn, dòng 3: ghi "cập nhật 23/11".
2. Skill 1 dòng 31: lấy bốn ảnh của mình làm chuẩn; chuẩn nay là khung video gốc.
3. Skill 1 dòng 252–260: cả mục lớp hạt `CampAir` đã thay bằng bụi theo nguồn.
4. Skill 3 dòng 168: số máy quay kiểu cũ (dx, dz).
5. Skill 3 dòng 16: trạng thái từng kênh (sẽ sai theo thời gian).
6. Skill 1 dòng 134 và skill 0 dòng 110 ghi "viền sáng chưa làm được"; skill 3 dòng 205 đã có `rim`.
7. Ba danh sách "bộ khuôn chưa có" (skill 3 dòng 50, 114–116; luật rút gọn 16) còn ghi thiếu ria, cà vạt, dáng mặt; cả ba đã có từ 22–23/11.
8. Skill 4 dòng 9–38 và 62–67: quy trình trước khi có workflow, trùng và lệch với hai mục cuối file.
9. `BAT-DAU-O-DAY.md`: sơ đồ thiếu kênh lich-su, danh sách công cụ thiếu các công cụ kiểm mới.
10. Skill 4 dòng 53 cấm mở tư liệu phim mẫu nhưng chưa nói `skills/canh-mau/` là phần được mở.
11. Bảng chấm mục 3 (ánh sáng): câu về đá và núi nằm nhầm chỗ, do mình thêm tối nay.

## 6. Mười một chủ đề bị chép nhiều nơi

| Chủ đề | Số nơi | Đề nghị ghi ở MỘT chỗ |
|---|---|---|
| Bóng | 9 | skill 1, mục Bóng |
| Tra kho | 9 | skill 2, một thẻ "làm một món" |
| Codex, phẳng hay khối, núi và đá | 8 | skill 2, cùng thẻ đó |
| Hạt | 7 | skill 1 |
| Máy quay | 6 | skill 0 |
| Cảnh mẫu, khuôn, màu | 6 | skill 1 |
| Sân khấu ngang, lớp chồng, không lặp đều | 5 | bảng chấm (chuẩn), skill 1 (cách làm) |
| Cỡ cảnh đủ bậc | 6 | skill 0 |
| Chuyển cảnh | 4 | skill 0 |
| Độ sáng | 4 | skill 1 |
| Workflow, số agent | 5 | skill 4 |

Thẻ luật cứng và luật rút gọn chỉ còn mỗi chủ đề một hai dòng và tên chỗ ghi chi tiết.

## 7. Luật của kênh nằm trong skill chung

- Skill 3 dòng 205–266: dàn nhân vật tập Doom của kênh phim-tv (Reed, Ben đá cao 2,42 m, các mốc của cảnh `d1c14`…).
- Skill 3 dòng 30: chi tiết bộ áo Doom.
- Skill 1 dòng 229–236: danh sách thư viện đồ của từng bối cảnh, trùng với kho.

Đề nghị dời sang `kenh/phim-tv/ghi-chu.md`; skill 3 chỉ giữ cách dùng chung.

## 8. Tài liệu cũ ở gốc `chung/`

18 file `.md`, khoảng 75 nghìn chữ, viết ngày 20–21/11 (`AUDIT`, `STYLE-BIBLE`, `CACH-DUNG-CANH-XEP-LOP`, `TOOLKIT`, `CHARACTERS`, `PUPPET`, `LUAT-CUTOUT3D`…). Không luật hiện hành nào dẫn tới chúng. Skill 4 cấm agent mở sáu loại, nhưng `CACH-DUNG-CANH-XEP-LOP`, `TOOLKIT`, `CHARACTERS`, `PUPPET` không nằm trong danh sách cấm. Chính `CACH-DUNG-CANH-XEP-LOP` từng ghi "vẽ bằng code là chính".

Đề nghị: dời cả 18 file vào `chung/_tai-lieu-cu/`, sau khi kiểm không công cụ nào đọc chúng.

## 9. Đường dẫn ghi cứng theo máy này

Liên quan gói cập nhật cho máy khác:
- `dung-canh-3d.js` dòng 26: thư mục dự án ghi cứng `/Users/daniel/WorkStation/…`. Máy kia đặt dự án ở chỗ khác thì workflow hỏng.
- 9 script và công cụ ghi cứng đường dẫn Chrome; `tools/render-thu-lai.sh` ghi cứng thư mục dự án.

Đề nghị: workflow nhận thư mục dự án qua tham số; các script đọc đường dẫn Chrome từ một file cấu hình của máy.

**Đã sửa 26/11/2026:** workflow nhận `goc` qua tham số; script và công cụ lấy Chrome qua `tools/chrome.sh` / `tools/chrome.py` (biến `CUTOUT3D_CHROME`; không đặt thì bản đã ghim nếu máy có, rồi bản mới nhất puppeteer đã tải); `tools/ghep-chuong.sh`, `tools/render-thu-lai.sh` tính thư mục `chung/` từ chỗ của script.

## 10. Cấu trúc đề nghị sau khi sửa

1. **Mỗi chủ đề một chỗ ghi** (bảng mục 6). Sửa luật là sửa tại chỗ đó.
2. **Thẻ luật cứng** từ 14 đoạn, khoảng 1.800 chữ, còn mỗi điều một hai dòng.
3. **Một thẻ "làm một món"** ở skill 2, bốn bước theo thứ tự: tra kho; chọn loại (phẳng, khối, khối tiện, tấm nền xa); vẽ bằng Codex hay code; đưa vào kho.
4. **Workflow:** lời mở ghi từng vai đọc mục nào; lời giao cho người dựng tách thành gạch đầu dòng (hiện là một câu dài khoảng 500 chữ).
5. **Luật thành công cụ kiểm** ở chỗ làm được:
   - món cứng đặt thành tấm phẳng;
   - tấm tiền cảnh dán theo máy;
   - làm mờ nền (nếu Daniel tắt);
   - hai đèn cùng đổ bóng lên người;
   - đèn tự đặt nằm ngoài khung bóng.
6. **Dòng đầu mỗi skill** đổi thành: "Sửa luật ở đây chỉ khi Daniel đã xác nhận; ghi nhật ký."

## 11. Thứ tự làm

1. Daniel trả lời mục 3 (Q1–Q10) và gật hoặc gạch mục 4 (S1–S15), mục 5, 7, 8, 9.
2. Mình sửa đúng các dòng được duyệt, tự làm, không agent.
3. Kiểm: chạy khô workflow, chạy các công cụ kiểm, kiểm kiểu; rồi đóng lại gói cập nhật.

Việc sửa engine đi kèm Q1 (người giữ màu riêng), Q5 và Q6 làm riêng, có ảnh trước và sau trên cảnh tập Itachi.
