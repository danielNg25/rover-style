> **ĐÃ THAY MỘT PHẦN (21/11/2026):** các mục 3, 5–8 (nhịp, chuyển động, ánh sáng, bối cảnh, camera) theo `LUAT-CUTOUT3D-v3.md` và `BAO-CAO-SOI-TOAN-PHIM.md`. Mục 1, 2, 4 (tỉ lệ cơ thể, bộ khuôn mặt, tay) vẫn dùng.

# Danh mục hình ảnh kênh mẫu, bản 2 (21/11/2026)

Bản này thay cho `DANH-MUC-HINH.md` và cho mọi chỗ trái với nó trong `STYLE-BIBLE.md`, `LUAT-CUTOUT3D.md`.

**Nguồn:** một video duy nhất của kênh (kênh chỉ có một video), 24 phút, 34.444 khung hình, khoảng 700 cảnh. Bảy lượt soi, mỗi lượt ghi một dòng cho từng mẫu trước khi đếm. Dữ liệu thô và ảnh ghép: `out/study/<mảng>/` (arms-hands, body, locomotion, expressions, light, fx, sets).

**Cách đọc:** mỗi dòng kèm số mẫu, viết kiểu "87/112" hoặc "n=150". Dòng ghi **[ít mẫu]** nghĩa là cả video không có đủ 100 trường hợp; đó là toàn bộ những gì có. Các lượt soi do agent làm; Claude mới kiểm chọn mẫu hai tấm ảnh (dáng người, tay) và ba cận mặt (ánh lửa).

---

## 1. Nhân vật: một khuôn dùng chung

### 1.1 Tỉ lệ cơ thể (n=150 người đứng, 87 nhân vật; tính theo chiều cao cả người; sai số đọc ±3–5 điểm phần trăm)
| Bộ phận | Trung vị | Ghi chú |
|---|---|---|
| Đầu kể cả tóc | 39% | một nửa số mẫu trong 36–42%; người cao khoảng 2,6 đầu |
| Bề ngang đầu | 32% | bằng 0,83 chiều cao đầu (đầu cao hơn rộng) |
| Bề ngang mặt (da) | 28% | |
| Bề ngang cặp mắt | 24% | bằng 87% bề ngang mặt (n=149) |
| Bề ngang vai | 31% | đầu rộng bằng vai |
| Thân (kiểu tiêu chuẩn) | cao 33% | hình chữ nhật 127/150; nở dưới 18 (đều là váy, áo dài); nở trên 5 |
| Thắt lưng | ở 67% từ đỉnh đầu | n=80 |
| Chân lộ ra | 24% | ngắn hơn đầu ở 125/125; mỗi chân rộng 8,6% |
| Bàn chân | dài 14% | |
| Tay | dày 7,8% | |
| Bàn tay | cao 9% | |
| Cổ | không có | 150/150 |

Chân là hai ống thẳng thò ra từ dưới gấu áo (125/125), không có hình hông.

### 1.2 Sáu kiểu mặc trên cùng một khuôn
| Kiểu | Mẫu / nhân vật | Đầu | Khác ở đâu |
|---|---|---|---|
| Tiêu chuẩn | 83 / 49 | 40% | mốc so sánh |
| Áo dài hoặc váy chấm đất | 25 / 19 | 38% | không thấy chân; gấu rộng 41% so với vai 31% |
| Trẻ con **[ít mẫu]** | 17 / 9 | 39% | đầu rộng hơn vai 1,22 lần; chân mảnh 7%; cao bằng 53–79% người lớn khi đứng cạnh (6/8 cảnh) |
| Áo choàng mở **[ít mẫu]** | 14 / 7 | 38% | gấu áo choàng rộng 62% |
| Người già **[ít mẫu]** | 7 / 5 | 38% | gấu áo thấp hơn |
| To bè **[ít mẫu]** | 4 / 2 | 33% | vai 47%, tay chân dày gấp rưỡi |

Không có người lớn đẫy đà hay cao gầy. Nam và nữ cùng tỉ lệ đầu; nữ vai hẹp hơn (26% so với 31%, n=18 nữ **[ít mẫu]**).

Số đo từng nhân vật chính (đầu / ngang đầu / thân / vai / chân): Reed 37 / 30 / 33 / 29 / 30; Sue 43 / 34 / 33 / 26 / 27; cậu bé Victor 36 / 34 / 39 / 25 / 24; Victor thanh niên 36 / 28 / 37 / 30 / 28; Doom 39 / 32 / 41 / 33 / 21. Bảng đầy đủ: `out/study/body/samples.csv`.

### 1.3 Trang phục (n=87 nhân vật)
Thắt lưng có khóa vàng nhỏ 25; bốt 17; áo ghi lê ngoài sơ mi 11; áo choàng 9; áo khoác 8; khăn thắt lưng 7; mũ trùm 7; cà vạt 3.
Giày (n=150): giày bệt tròn sẫm 65; bốt 39; bị che hoặc chỉ lộ mũi 23; chân giáp xám 8; dép trắng 7.

### 1.4 Khuôn đầu (n=641 mặt, gom theo đường viền nửa dưới; số khuôn do Claude đọc bằng mắt, Daniel đã xác nhận)
Số đo lấy bề ngang cặp mắt làm 1.
| Khuôn | Má | Hàm | Cằm dưới mắt | Ai |
|---|---|---|---|---|
| A. Chữ U bầu (khoảng 26%) | 1,26 | 0,73 | 0,82 | cậu bé, nữ hoàng, đa số vai phụ |
| B. Vuông bo góc (khoảng 19%) | 1,34 | 1,17 | 0,77 | Doom không mặt nạ, người tím, pháp sư, lính |
| C. Trứng dài (khoảng 17%) | 1,24 | 0,79 | 0,97 | Reed, vài người lớn |
| D. Cằm thon (khoảng 12%) | 1,23 | 0,47 | 0,94 | phụ nữ, bé gái |
Ranh giới A–C chưa chắc (cùng một nhân vật rơi vào cả hai nhóm).

---

## 2. Mặt

### 2.1 Mắt và mí (n=164 mặt, 44 nhân vật)
- **Mí trên, 4 hình, không có mí cong:** tròn không mí 76; cắt ngang thẳng 35; cắt thẳng thấp về phía mũi (giận) 28; cắt thẳng thấp về phía tai (buồn) 25.
- Chiều cao tròng trắng so với bề ngang cặp mắt: tròn 0,40; cắt ngang 0,21; giận 0,27; buồn 0,33.
- **Mí dưới, 3 hình:** tròn 84; cắt ngang đẩy lên 55; đẩy lên có cong 25 (22 ở mặt vui).
- **Hai mắt cùng một hình:** 155/162; khác nhau 7, tất cả là vẻ nghi ngờ.
- **Con ngươi, 3 cỡ:** thường 133; nhỏ 17; chấm tí hon 14 (sợ, ngạc nhiên). Không có cỡ to hơn thường. Chấm sáng 163/164.
- **Mắt nhắm:** một hình duy nhất, da che kín mắt và một nét cong võng xuống (63/63). Không có kiểu "nhắm cười".

### 2.2 Lông mày (n=164)
Cung mảnh 62; hai đầu trong nhướn lên 39; xếch xuống phía mũi 29; không thấy 22 (ở mặt ngạc nhiên, sợ); một cao một thấp 7; thanh dày 3. Nằm trên da 85, đè lên tóc 47.

### 2.3 Miệng (n=164), 10 hình
Cong xuống 42; cong lên 33; nét ngang 24; há thấy răng trên và lưỡi 17; nghiến răng 16; chữ O nhỏ 16; cười nhe răng 6; nhếch một bên 3; lượn sóng 3; bị che 4.

### 2.4 Chi tiết phụ (n=164)
Râu 29; nếp nhăn 24; sẹo 22; kính 5; băng 4. Không hề có: má hồng, mồ hôi, nước mắt, dấu giận, bọng mắt. Không có mũi.

### 2.5 Doom đeo mặt nạ (n=115 khung)
Khe mắt: ngang 68; xếch giận 38; cao 5; lo 2; lệch 2. Tấm mày: ngang 82; giận 27; lo 3; lệch 3; khớp với khe mắt 97/115. Mỗi khe luôn có một chấm trắng. Tấm miệng không đổi (115/115). Không chớp mắt.

---

## 3. Biểu cảm theo thời gian

### 3.1 Đổi biểu cảm (n=103 lần)
- Mọi thứ đổi trong cùng một khung 44; đổi so le 59 (khoảng cách đầu–cuối trung vị 2 khung).
- Hình trung gian: không có 45; một hình 35; hai hình 20; ba hình 3. Mỗi hình trung gian giữ 2 khung (77/84).
- Bộ phận đổi: mí 87; mày 62; miệng 59; con ngươi 41. Mí đi trước hoặc cùng lúc 75/87.
- Đầu dịch theo 68/103.
- Sau khi đổi, mặt đứng yên trung vị 3 khung (một nửa trong 2–6) trước lần đổi kế.
- Doom **[ít mẫu, n=19]**: khe mắt và tấm mày đi qua 1–3 hình trung gian, mỗi hình 2 khung.

### 3.2 Nói (n=49 đoạn)
Miệng được vẽ lại mỗi 2 khung ở 33/49 đoạn.

### 3.3 Chớp mắt (n=65), hai kiểu
- Kiểu A (37): 2 khung mí nửa khép, 2 khung nhắm, 2 khung nửa khép.
- Kiểu B (26): nhắm 4 khung, không có khung nửa khép; 12 lần khung mở lại đầu tiên chưa có con ngươi.
- Lông mày đứng yên 60/62; đầu dịch 29/65.
- Khoảng cách giữa hai lần chớp: chỉ đo được 1 cặp **[ít mẫu]**.

---

## 4. Tay và bàn tay

### 4.1 Cấu tạo tay (n=260)
- Hai khúc thẳng có khuỷu 175; tay duỗi thẳng 65; không rõ 20; ống mềm uốn cong 0.
- Dày đều 234; thuôn 0.
- Vai: tay thò ra từ dưới viền thân 163/174 (nhân vật thường); Doom có chụp vai giáp 75/86.
- Khuỷu: nhân vật thường chỉ là một góc viền 105/107 (nếp gập chỉ thấy ở cận cảnh); Doom có nếp hoặc cầu khuỷu 61/63.
- Tô: phẳng 137; chuyển sáng 1; mặt dưới sẫm hơn 4 (nhân vật thường). Giáp Doom có chuyển sáng 82/86.
- Kích thước theo bề ngang cặp mắt **[ít mẫu, ước bằng mắt]**: bàn tay 0,39 (n=17); cẳng tay 0,64 (n=7); dày 0,21 (n=7); tay găng 0,46–0,60.

### 4.2 Tư thế tay (n=260)
Buông 69; gập thấp 38; giơ tay xòe 36; khoanh 29; với 20; lên ngực 17; lên cằm hoặc mặt 14; sau lưng 13; chống hông 13; cầm đồ 6; chỉ 5.
Hai tay cùng thấy (121 cặp): đối xứng 77 (25 là cùng buông); lệch 44.

### 4.3 Bàn tay (n=202)
Thả lỏng 54; xòe lòng bàn tay 52; nắm 25; xòe mu bàn tay 24; chắp 12; ôm tay kia 9; nghiêng cạnh 9; khum 5; chỉ 5; cầm đồ 4; khuất sau đồ 2; giơ ngón cái 0.
Ngón luôn tách rời (126/126); thấy 4 ngón ở 71, 5 ngón ở 41. Găng khác màu 109; cùng màu da mặt 92. Xoay ở cổ tay 85; không 71.

### 4.4 Đổi tư thế tay (n=41 lần)
- Hình trung gian giữa hai tư thế giữ: trung vị 2 (0: 7; 1: 6; 2: 10; 3: 11; 4: 3; 5: 3; 6: 1). Mọi hình trung gian giữ đúng 2 khung (100/100).
- Hai khúc tay giữ hình, chỉ xoay 40/41; không vẽ lại tay, không vệt nhòe.
- Hình bàn tay đổi trong lúc chuyển 28; không 5; không rõ 8.
- Sau khi tới nơi: đứng im hẳn (tới 17 khung) hoặc "giữ động" (nhích nhẹ mỗi 2 khung, 14 lần).

### 4.5 Cầm đồ **[ít mẫu, n=7]**
Nắm tay có ngón đè lên cán 3; bàn tay khuất sau đồ 2; ép vào ngực 1; đặt trên lòng bàn tay ngửa 1.

---

## 5. Chuyển động cơ thể (n=114 lần chuyển động, 71 lần đổi tư thế đứng)

### 5.1 Có những kiểu nào
Đi bộ 38; lơ lửng 18; bay 9; vào khung 9; ra khung hoặc biến mất 9; ngã 7; quay người 6; nảy 5; ngồi xuống 3; quỳ 3; nằm sẵn 2; co rúm, leo, cưỡi, cúi chào, đứng dậy, bế mỗi kiểu 1. Mọi kiểu trừ đi bộ và lơ lửng đều **[ít mẫu]**.
Không hề có: chạy thấy rõ chân, nhảy, đi bộ nhìn nghiêng, bò, bơi.

### 5.2 Đi bộ (n=38)
- Chân bước xen kẽ thấy rõ 7; bị áo che 11; quá nhỏ để xét 20.
- Trong 7 lần thấy rõ **[ít mẫu]**: chân thẳng 6; người đá nhấc gối gập 1. Mỗi lần đi dùng 2 hình chân (5 lần) hoặc 3 hình (2 lần); mỗi hình giữ 2 khung.
- Thân lắc 26/38. 15 lần nhìn từ sau lưng, đi xa dần.

### 5.3 Bay, lơ lửng (n=27)
Đứng trên đĩa hoặc ván bay 21. Tư thế giữ nguyên, chỉ tay đổi; cả người trượt cứng kèm phóng to thu nhỏ; 3 lần nền cuộn thay vì người chạy. (Agent ghi "áo choàng không phấp phới lần nào"; SAI, xem 5.6.)

### 5.4 Vào, ra, quay, ngồi, ngã **[ít mẫu]**
- Vào hoặc ra: bật hiện hay bật mất trong một khung 9 (7 không kèm hiệu ứng); trượt cứng từ mép khung 4; bay chéo vào 2; mờ dần 4 khung 1.
- Quay người (6): đổi hình trong một khung 5.
- Ngồi xuống: 2–3 hình chuyển tiếp (2/3 lần). Một lần quỳ hạ dần trong khoảng 10 khung. Có hình chân gập ở 6 trường hợp (người đá bước, ngồi, quỳ).
- Nằm: hình đứng xoay 90 độ (4/4). Ngã ngang: xoay cả con rối cứng trong khoảng 8 khung (2/2).
- Co: 2 lần. Giãn: 0. Hình lấy đà: 3/185.

### 5.5 Đổi tư thế khi đứng (n=71)
Bàn chân đứng yên 69; chân thẳng 68; tay cử động 62; đầu nghiêng hoặc thân ngả 14; không gì cử động 9.

### 5.6 Áo choàng, áo dài tự cử động theo người (đo lại 21/11/2026; `tools/capesurvey.py`, `out/study/cape/shots.csv`)
Đo bằng máy trên 73 cảnh có áo choàng xanh: so vị trí gấu áo với vai áo ở từng khung.
- Nhân vật có di chuyển (47 cảnh): gấu lệch khỏi vai từ 3% bề ngang áo trở lên ở 42 cảnh; từ 8% trở lên ở 30 cảnh.
- Nhân vật đứng tại chỗ (26 cảnh): gấu vẫn lệch từ 3% trở lên ở 19 cảnh; từ 8% trở lên ở 8 cảnh.
- Nhịp: 634 trong 1.058 lần gấu đổi vị trí được giữ nguyên ở khung kế (trên twos); số còn lại lẫn với camera trôi.
- Soi từng khung cảnh cậu bé giơ nắm tay (2934-2959): người dịch ngang khoảng một phần tư bề ngang áo trong một khung và bước một chân; gấu ở lại phía sau rồi xòe rộng gần gấp đôi (86 lên 151 điểm ảnh) trong 6 khung; sau đó xòe thêm một lần nhỏ rồi mới yên. Mỗi hình giữ 2 khung.
- Ngược lại, cảnh nhân vật hạ từ trên cao xuống (14143-14172): áo cứng hoàn toàn suốt lúc rơi.
- Chưa biết họ làm bằng gì (tự đặt hình hay cho gấu "đi trễ" tự động); video không cho thấy.

---

## 6. Ánh sáng, bóng, bề mặt (n=165 cảnh)

### 6.1 Bóng trên sàn (soi lại 21/11/2026: 164 cảnh toàn và trung, 109 cảnh chấm được; dữ liệu `out/study/shadow/samples.csv`)
Lượt đầu của agent cắt sát bàn chân nên bỏ sót phần bóng đổ dài. Lượt này Claude xem cả phần sàn, tăng tương phản.
- **Có bóng:** 108/109 cảnh. Không có: 1 (đứng trên mây). Bóng cứng: 0. Màu bóng là sắc tối hơn của sàn, không đen.
- **Bóng đổ dài có hướng:** 36/109. **Bóng ngắn sát chân:** 72/109.
- **Theo nơi:** ngoài trời ban ngày 17/32 cảnh có bóng đổ dài; ngoài trời đêm hoặc chạng vạng 6/20; trong nhà 13/56.
- **Một hướng cho cả cảnh:** nhân vật và đồ vật (ghế, cột đèn, hàng rào, lan can, bia mộ) đổ bóng cùng một hướng ở mọi cảnh soi được có đồ vật đổ bóng (10 cảnh).
- **Cùng bối cảnh thì cùng hướng qua các cảnh quay:** 8 bối cảnh, 21 cảnh, không thấy cảnh nào lệch (quảng trường làng, sân trường, phố sạp báo, phòng thí nghiệm thành phố, lớp học, lều, sân tu viện, phòng ngủ lâu đài).
- **Khớp nguồn sáng nhìn thấy [ít mẫu]:** khớp ở phòng ngủ lâu đài (cửa sổ phía sau, bóng đổ về phía máy, 2 cảnh) và ban công lúc chạng vạng (mặt trời thấp phía sau, 1 cảnh); đèn treo trên đầu thì bóng nằm ngay dưới chân (xưởng trong lều, nhà chứa robot). KHÔNG khớp ở trại có đống lửa: bóng đổ về phía đống lửa (1 bối cảnh, 2 cảnh). Chưa rõ: lò rèn, chiến trường, quảng trường đêm, lớp học. Vậy lửa và đèn vẽ trong cảnh không phải thứ tạo ra bóng; mỗi bối cảnh có một hướng sáng chính riêng.
- **Bóng là hình chiếu của chính nhân vật (soi phóng to 12 cảnh):** bóng có dáng người bị kéo xiên, mép mềm, ở 10 cảnh; 2 cảnh là hình bầu dục mềm. Bóng đổi hình cùng lúc nhân vật đổi tư thế ở 4/4 cảnh bắt được lúc đổi tay và bóng đủ lớn để đọc (giơ tay, dang tay, ngồi xổm). Bóng đi theo nhân vật đang bước ở 5/5 cảnh; khi nhân vật bước vào từ phía ngược hướng bóng thì bóng vào khung trước. Bóng gãy theo mặt đất (đổ trên đường rồi vắt lên bờ tuyết) ở 1 cảnh **[ít mẫu]**.
- **Nhân vật bay:** có một vệt bóng tròn riêng trên mặt đất bên dưới (2 cảnh) **[ít mẫu]**.
- **Ánh sáng rơi trên sàn:** ô sáng cửa sổ (lớp học), vệt sáng từ cửa mở, vũng sáng quanh đuốc và đống lửa, vệt nắng xiên từ cửa sổ.
- Suy luận của Claude (chưa kiểm chứng được): con rối là tấm phẳng đứng trong cảnh 3D và được một ngọn đèn của cảnh chiếu thành bóng thật, mềm. Cách này giải thích cùng lúc cả bốn điều trên.

### 6.2 Tô trên nhân vật
- Chuyển sáng mềm trên đầu 119/119.
- Vệt sáng mảnh trên tóc 51/52.
- Bóng dưới cằm đổ lên thân **[ít mẫu, 42 xét được]**: rõ 2; mờ 24; không có 16.
- Ánh sáng ấm hắt lên một bên mặt khi gần lửa hoặc đèn: có thật ở cận mặt cậu bé giây 40 (mép trái 0,93 so với giữa 0,65) và giây 91; không có ở giây 120 (không lửa). Trong 12 cảnh có nguồn sáng cạnh đầu **[ít mẫu]**: bên sáng quay về nguồn 3; quay ngược 4; không khác 5.
- Ánh màu cục bộ lên nhân vật **[ít mẫu]**: 3, đều màu xanh lá.

### 6.3 Nhân vật đổi màu theo cảnh (đo trên mặt nạ Doom 32 cảnh, da 79 mẫu)
Ban đêm: tối đi khoảng 0,1 độ sáng, sắc màu không đổi (da luôn ở 22–27 độ). Cậu bé nhạt màu hơn ở cảnh tuyết và chạng vạng (độ bão hòa 0,40–0,43 so với 0,54–0,55 trong lều). Lửa và địa ngục gần như không nhuộm màu nhân vật. Chỉ phòng ánh xanh lá nhuộm rõ (5/5).

### 6.4 Nguồn sáng (n=165)
Quầng sáng: không có 50; chỉ quầng nhỏ 63; chỉ quầng lớn 20; cả hai 32. Cảnh đêm không có quầng: 4/43. Đuốc và đèn lồng có quầng cả ban ngày. Ánh sáng thấy rõ là rơi lên bề mặt xung quanh: 21. Vệt nắng nhìn thấy được: 10/66 cảnh trong nhà.

### 6.5 Sàn, khối, đồ vật **[ít mẫu]**
Sàn (43 cảnh): phẳng 16; chuyển sáng 10; vũng sáng 9; vệt nắng 8. Mặt khối hộp (12): mặt trên sáng nhất, một mặt bên sẫm hơn. Bóng của đồ vật: mới ghi được 3.

### 6.6 Chiều sâu và bề mặt
- Lớp xa nhạt hoặc xanh hơn: 31/165 (không cảnh nào ở trong nhà ban ngày).
- Nền mềm hơn nhân vật từ 1,5 lần: cận 13/37; trung 4/53; toàn 0/37. Vật tiền cảnh bị mờ: 0.
- Viền: 0/165. Hạt nhiễu: không có. Tối góc: khoảng 3–4%.

### 6.7 Độ sáng và màu theo loại nơi (độ sáng trung bình / độ bão hòa / tỉ lệ họ màu chủ đạo)
Trong nhà ngày 130 / 36% / 73%; trong nhà đêm 93 / 38% / 70%; ngoài trời ngày 133 / 31% / 67%; ngoài trời đêm 102 / 40% / 64%; trừu tượng 96 / 59% / 85%. Ngoài trời đêm có màu chủ đạo xanh tím ở 28/43; trong nhà ngày cam vàng ở 23/42.

---

## 7. Bối cảnh, đạo cụ, bố cục

### 7.1 Nơi chốn (67 nơi, là toàn bộ video **[ít mẫu]**)
Trong nhà 31; ngoài trời 28; nền trống 8. Dựng: hộp phòng 37; phông phẳng có mặt đất 22; vật lơ lửng trong không gian 5; các lớp phẳng xếp chồng 3. Mỗi nơi dùng trung vị 7 cảnh (1–47). Hộp phòng: 265/314 cảnh trong nhà.

### 7.2 Dựng một góc nhìn (n=126 góc nhìn)
- Điểm tụ đúng giữa khung 69/80; cao 0,60 từ mép trên.
- Sàn chiếm 20% chiều cao khung ở toàn cảnh trong nhà (một nửa trong 15–25%); 25% ngoài trời. Đường sàn–tường ở 0,75 từ mép trên.
- Đồ vật mỗi góc nhìn: trung vị 14 (một nửa trong 10–20); số loại 6; nguồn sáng 2.
- Thảm: 19/57 góc nhìn trong nhà.
- Chữ trong cảnh: 99/666 cảnh; chữ ngắn; chữ có chân đậm 19/31.
- Cây thông hình nón 23/48 góc có cây. Màu: trung vị 4 nhóm sắc; sắc chủ đạo chiếm 0,32 số điểm ảnh.
- Dùng lại nơi cũ (25 cảnh ghi nhận): giữ bố trí, đổi biển, cờ, giờ trong ngày, đồ vật.

### 7.3 Bố cục (n=666 cảnh)
- Máy ngang tầm mắt 633; nhìn xuống 19; nhìn lên 14.
- Chiều cao nhân vật trong khung: toàn 0,40; trung 0,75; cận 0,85.
- Trung cảnh thấy nguyên người 144/235; cắt hông hoặc gối 34.
- Chủ thể ở một phần ba giữa: toàn 156/234; trung 148/230; cận 118/135.
- Khoảng trống trên đầu: toàn 0,40; trung 0,15; cận 0,15.
- Vật tiền cảnh làm khung: toàn 26/265; cận 15/138. Đối xứng: toàn 101/265.
- Cận mặt: bối cảnh phía sau vẫn đọc được 138/138.
- Cảnh hai người (166): nguyên người 116; phần lớn đứng cạnh nhau quay về máy, cách nhau 0,2–0,5 bề ngang khung (ước bằng mắt).

### 7.4 Đạo cụ (n=123)
Nhìn thẳng phẳng 86; góc ba phần tư 33. Viền đen 0. Phần lớn 3 sắc độ (69). Trung vị 8 chi tiết mỗi món. Màn hình (9/13) và giấy tờ (10/17) đa số chỉ có biểu tượng hoặc vạch xám giả chữ **[ít mẫu]**.

---

## 8. Hiệu ứng, chuyển cảnh, camera

### 8.1 Hiệu ứng (n=147 dải 24 khung; mỗi loại đều **[ít mẫu]**)
- Hình phẳng thuần 109; hình phẳng kèm quầng mềm 37; viền hay mờ 0. Số lớp màu: một 32; hai 74; ba 33; bốn 8.
- Loại: lửa 27; nổ và va chạm 17; tia sáng 14; lấp lánh 13; cổng và vòng 11; quầng sáng 11; màn hình 9; tia điện 9; khói bật hiện 7; khói và hơi 7; tuyết 7; vệt tốc độ 7; khác 8.
- Nhịp: đổi ở mọi khung 75/128; mỗi 2 khung 39. Lửa: mọi khung 16/27; mỗi 2 khung 8; không lặp vòng ngắn trong 1,5 giây.
- Làm đổi độ sáng cả khung: 15/147 (nổ 6, tia sáng 5, lóa trắng 2). Lửa hắt sáng lên người hoặc đất 1/27. Nhân vật phản ứng 28.
- Bụi bay: không thấy ở 5/5 dải nhắm vào nó.

### 8.2 Chuyển cảnh
- Đổi cảnh không cắt thẳng: 7 lần trong cả video. 5 lần lóa trắng qua đám mây ý nghĩ (3–9 khung tới trắng, 2–5 khung trắng, 4–9 khung trở lại); 1 lần hòa hình 7 khung; 1 chuỗi zoom ra Trái Đất (lùi nhanh còn 0,18 lần trong khoảng 26 khung và chậm dần, hòa hình 8 khung sang quả cầu, giữ 14 khung, quả cầu lớn 2,4 lần trong 6 khung, hòa hình 6 khung vào trại).
- Không có lia giật, không chuyển tối dần, không quét hình giữa hai cảnh.
- Chỗ cắt thường (n=119): ở lại cùng bối cảnh 67 (vào gần 30; ra rộng 18; đổi góc cùng cỡ 15; chèn 4). Cảnh mới đã trôi sẵn từ khung đầu 117/119.

### 8.3 Camera
- Hướng trôi của các cảnh (n=699): đẩy vào 35%; lùi ra 26%; gần như không 39%. Tốc độ ở khung đầu bằng tốc độ cả cảnh (tỉ lệ trung vị 0,98).
- Di chuyển lớn: chỉ 7 cảnh đổi hơn 15%; 17 cảnh đổi hơn 10%. Đẩy và lùi chạy đều tốc; hai cú trượt ngang và một cú đẩy chậm dần ở cuối. Cả hình di chuyển như một lớp ở 12/13 cú đo được.

---

## 9. Những thứ video này không trả lời được
- Trẻ con, người già, dáng to bè, áo choàng: dưới 20 mẫu mỗi kiểu.
- Đi bộ thấy rõ chân: 7 lần. Ngồi, quỳ, ngã, quay: dưới 10 lần mỗi kiểu.
- Cầm đồ vật: 7 mẫu. Kích thước tay đo chính xác: 3–17 mẫu.
- Hướng bóng theo nguồn sáng, ánh lửa hắt lên mặt: 2–12 mẫu; chưa rút được quy tắc.
- Bóng của đồ vật, sáng tối của khối hộp, bóng dưới cằm: 3–42 mẫu.
- Mỗi loại hiệu ứng: dưới 30 mẫu. Màn hình, giấy tờ, biển hiệu, bản đồ: 1–17 mẫu mỗi loại.
- Nơi chốn: 67. Bối cảnh hiện đại (văn phòng, nhà máy, phố ngày nay) gần như không có.
Với các mục này, luật chỉ nên coi là "họ đã làm như vậy trong vài lần", không phải quy tắc.

---

## 10. Bộ khuôn cần vẽ (rút từ các số đếm trên; chờ Daniel duyệt)
| Nhóm | Số hình | Gồm |
|---|---|---|
| Khuôn đầu | 4 | chữ U bầu; vuông bo góc; trứng dài; cằm thon |
| Tròng trắng | 1 cặp | hai hình bầu dục chạm nhau, rộng 87% bề ngang mặt |
| Mí trên | 3 (và trạng thái không mí) | cắt ngang; thấp về phía mũi; thấp về phía tai |
| Mí dưới | 2 (và trạng thái không mí) | cắt ngang đẩy lên; đẩy lên có cong |
| Con ngươi | 3 cỡ | thường; nhỏ; chấm tí hon; luôn có chấm sáng |
| Mắt nhắm | 1 | da che kín, một nét cong võng xuống |
| Lông mày | 4 | cung mảnh; đầu trong nhướn lên; xếch xuống phía mũi; thanh dày (kiểu "một cao một thấp" ghép từ hai hình) |
| Miệng | 9 | cong xuống; cong lên; nét ngang; há thấy răng trên và lưỡi; nghiến răng; chữ O nhỏ; cười nhe răng; nhếch một bên; lượn sóng |
| Bàn tay | 10, mỗi hình hai màu (da, găng) | thả lỏng; xòe lòng; xòe mu; nắm; chắp; ôm tay kia; nghiêng cạnh; khum; chỉ; nắm quanh cán |
| Tay | 2 khúc | bắp tay và cẳng tay cứng, dày đều, xoay ở vai và khuỷu |
| Chân | 2 | ống thẳng; một hình chân gập (ngồi, quỳ) |
| Giày | 2 | bệt tròn sẫm; bốt |
| Thân | 3 | chữ nhật; áo dài hình nón chấm đất; áo choàng mở |
| Chi tiết gắn thêm | theo nhân vật | tóc, râu, nếp nhăn, sẹo, kính, băng, mũ, thắt lưng khóa vàng |

Không vẽ (kênh mẫu không dùng): giơ ngón cái; mắt "nhắm cười"; con ngươi to; má hồng, mồ hôi, nước mắt, dấu giận; dáng người đẫy đà; mũi.

## 11. Claude đã tự kiểm những gì (21/11/2026)
Mỗi mảng mở một tấm ảnh ghép và so với số đếm của agent:
- **Dáng người** (8 người): đọc lại lưới ra đầu 35% cho mẫu b017, agent ghi 36,6%; khớp trong sai số. Ba trong bốn mẫu là cùng một giáo sư đầu nhỏ hơn trung vị.
- **Tay** (20 ô): mẫu đúng là tay thật, có đánh số; tay hai khúc, dày đều.
- **Mặt** (30 ô): mí trên đúng là cắt thẳng, không có mí cong; miệng và mày khớp danh sách. Ghi thêm: tròng trắng ngả màu theo cảnh (vàng trong lều sáng đèn, xám ở cảnh tuyết chạng vạng), n nhỏ, chưa đếm.
- **Bóng dưới chân** (30 ô): bóng rõ khoảng 14, mờ khoảng 8, không thấy hoặc cắt trượt khoảng 8. Vậy "có bóng" là thường lệ nhưng nhiều chỗ rất nhạt; con số 107/109 của agent tính cả bóng nhạt.
- **Đi bộ** (3 dải từng khung): hình chân giữ đúng 2 khung; người đá nhấc gối gập.
- **Lửa** (4 dải): hình phẳng răng cưa 2–3 lớp màu, đổi ở mọi khung.
- **Bối cảnh** (6 toàn cảnh): nhân vật cao 30–48% khung, sàn 15–25%, thảm ở 2/4 phòng; khớp.
- **Ánh lửa trên mặt**: tự xem ba cận mặt của cậu bé; khớp bảng đo.
