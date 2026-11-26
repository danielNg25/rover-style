# Bảng màu theo loại cảnh (đo từ video mẫu Rover Explains)

Nguồn: 239 khung cách nhau khoảng 6 giây, mỗi khung gắn vào một loại theo tình huống màu. Số đo là khoảng phần tư 1 đến phần tư 3 trên tất cả khung của loại. Mã hex là màu thật lấy từ cụm màu đo được trên khung, không tự nghĩ. Mỗi loại tô từ cảnh CÙNG LOẠI, không dùng một công thức chung.

Độ đậm C: dưới 0,03 gần xám, 0,03 đến 0,10 lưng chừng, trên 0,10 rực. L là độ sáng 0 đến 1.

## Điều chung (kiểm được trên khung)

1. **Nhân vật giữ màu riêng, đèn và giờ trong ngày không nhuộm lên áo hay da.** Áo choàng Doom (trung vị các điểm ảnh lục): #317d3b (chiều tím, khung 68), #378541 (ngày phố, 84), #388844 (sáng trắng, 87), #327e3d (phố đêm, 100), #3e843d (lửa, 159), #317438 (đêm trại, 170), #3c9148 (phòng lạnh, 168), #388641 (thế giới lạ, 113). Chỉ lệch nhẹ: tối hơn chút ở đêm (#317438), sáng hơn chút ở phòng ấm (#479d48, khung 145). So khung 010 (ngày) với khung 056 (đêm): áo giáp lính xám #99a2a7 và #9ea1a6, áo trắng người phụ nữ #e3dabd và #f0e1c0, nghĩa là đêm không làm tối áo. Da: #deae92 (phòng sáng, 184), #daae90 (chiều, 193), #ddb696 (ngày phố, 108), #efbfa0 (vũ trụ, 216), #dda67f và #d89d7c (lửa, 157 và 159): chỉ cảnh lửa làm da đỏ và tối hơn một chút.
2. **Không có viền nét.** Mọi khung là khối phẳng có đổ bóng nhẹ, không đường viền đen quanh người, nhà, cây (khung 10, 56, 45 xem ở 720). Người tách khỏi nền bằng độ sáng và độ rực.
3. **Tường và đất phẳng, hoa văn chỉ nằm trên đồ vật.** Cỏ là một mảng lục đều với vài chấm hoa (khung 10); đá lát đường chỉ hơi khác sắc, gần như cùng giá trị (khung 56); tường gỗ phẳng, hoa văn chỉ ở thảm, tấm vải treo, cờ (khung 8, 12, 232).
4. **Lớp xa nhạt và đục hơn lớp gần.** Khung 10: núi xa #8a9fa0 và #859b8f, núi gần #68846b, cỏ gần #718256. Thành phố xa ở khung 84 và 219 là xanh xám nhạt.
5. **Cửa sổ và đèn là chỗ sáng nhất ở cảnh đêm, vàng ấm, nhỏ.** Khung 56: cửa sổ #c2a87d và #a67141; khung 105, 223, 18 cũng vậy. Nền đêm ngả lam hoặc xám xanh, tối nhất L 0,1 đến 0,3, không đen thuần.
6. **Cảnh ngoài cửa sổ trong nhà luôn nhạt và đục** (khung 25, 138: #8092b9, #b4daf5), không rực.
7. **Không chắc:** màu bóng đổ (khung 10 bóng dưới lính nhìn hơi nâu ô liu hơn cỏ nhưng chỗ đó có cả mảng đất, chưa tách được); da ở cảnh đêm (các mẫu da đêm lấy được không đáng tin vì mặt nạ da lẫn gỗ).

## Danh sách loại (nhóm thường gặp xếp trước, nhóm đặc biệt sau)

| Loại | Số khung | Nhóm |
|---|---|---|
| Phòng ấm (`phong-am`) | 25 | thường gặp |
| Phòng lạnh (`phong-lanh`) | 29 | thường gặp |
| Phòng sáng (`phong-sang`) | 11 | thường gặp |
| Phòng tối có nguồn sáng (`phong-toi-co-nguon`) | 4 | thường gặp; ít mẫu |
| Phố đêm (`pho-dem`) | 9 | thường gặp |
| Đêm thiên nhiên (`dem-thien-nhien`) | 9 | thường gặp |
| Chiều tím (`chieu-tim`) | 14 | thường gặp |
| Ngày thiên nhiên (`ngay-thien-nhien`) | 13 | thường gặp |
| Ngày phố (`ngay-pho`) | 23 | thường gặp |
| Tuyết (`tuyet`) | 7 | thường gặp; ít mẫu |
| Lửa (`lua`) | 16 | đặc biệt |
| Sáng trắng (`sang-trang`) | 26 | đặc biệt |
| Vũ trụ (`vu-tru`) | 14 | đặc biệt |
| Vũ trụ cam đỏ (`vu-tru-cam`) | 6 | đặc biệt; ít mẫu |
| Thế giới lạ tím (`the-gioi-la`) | 15 | đặc biệt |
| Nơi phủ một màu (xanh lục và vàng kim) (`noi-mot-mau`) | 15 | đặc biệt |
| Khung bỏ (`bo`): bản vẽ, thẻ chữ | 3 | 43, 50, 54 |

## Phòng ấm (`phong-am`, 25 khung, nhóm thường gặp)

**Dùng khi:** Trong nhà tông ấm: lều, phòng gỗ, văn phòng, hội trường, kho đồ, lò rèn (khung 8, 22, 25, 232, 135, 51). Phòng thí nghiệm có rèm đỏ rượu và tường nâu ô liu (33 đến 39, 209) cũng ở đây: nền chính của chúng là nâu ô liu và nâu sẫm (#554d3f, #5d4b3b, #382422, C 0,03 đến 0,04), thuộc họ ấm.

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Gỗ, tường lều, vải (nền giữa) | #8c7652, #876749, #9a8962 | 11-17 % | 0.51-0.69 | 0.04-0.11 |
| Gỗ sẫm, ván, đồ đạc | #685239, #523f2b, #6f573b | 14-18 % | 0.35-0.48 | 0.04-0.05 |
| Xám nâu sẫm (tường bóng, rèm) | #49453b, #3b2d25, #584f52 | 12-19 % | 0.31-0.48 | 0.01-0.03 |
| Mảng sáng ấm (da, giấy, chỗ đèn chiếu) | #dbad82, #c4a475, #e6bf83 | 8-16 % | 0.70-0.84 | 0.03-0.13 |
| Vùng tối sâu | #28211b, #231d19, #382422 | 8-18 % | 0.20-0.29 | 0.01-0.03 |
| Điểm nhấn đỏ rượu (thảm, rèm) | #80262e, #61272e, #982b36 | 7-12 % | 0.32-0.49 | 0.04-0.17 |
| Cảnh ngoài cửa sổ (trời xanh nhạt, núi xanh lam xám) | #b4daf5, #8092b9 | 19-21 % | 0.65-0.88 | 0.04-0.06 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 11-40 % · lưng chừng 53-74 % · rực 5-19 % · độ đậm TB 0.05-0.07 · tối sâu 1-5 % · sáng TB 0.49-0.53.

- Tối nhất là các nếp gỗ sẫm và viền (L khoảng 0,2 đến 0,3); sáng nhất là da, giấy, ô cửa sổ.
- Điểm nhấn là thảm hoặc rèm đỏ rượu, chiếm 11 đến 18 % khung (khung 232: #9e3138 chiếm 18 %, đ 0,14; khung 8: #812930 11 %).
- Gần như cả khung ở mức lưng chừng (trung vị 70 %), rực chỉ 11 %. Nâu của gỗ có độ đậm 0,04 đến 0,07, thấy rõ là nâu chứ không xám.
- Nhân vật tách khỏi nền bằng áo sáng hơn (kem #efcfa2, trắng ngà) hoặc đỏ rực hơn nền, không bằng viền.
- Cảnh ngoài cửa sổ luôn nhạt (L trên 0,65) và đục (đ không quá 0,06). Không có cảnh ngoài rực.
- Lò rèn (51, 52) là kiểu con xám nâu hơn: tường #88745f, #7e7160 (đ 0,03 đến 0,04), ánh lửa cam nhỏ #ed8137 (đ 0,15 đến 0,16) và vùng sáng quanh lửa #f1c182.

**Không làm:**
- Không tường xám lạnh hay xanh lục: tường luôn nâu vàng (hue cam nâu).
- Không cảnh ngoài cửa sổ xanh ngọc rực.
- Không để cả khung gần xám: gần xám chỉ 3 đến 31 %.

**Tấm mẫu:** `mau-phong-am.jpg` (khung 8, 22, 25, 232, 135, 51, 138)

## Phòng lạnh (`phong-lanh`, 29 khung, nhóm thường gặp)

**Dùng khi:** Trong nhà tông lạnh: phòng máy, phòng điều khiển, phòng thí nghiệm tối, đại sảnh xám xanh (khung 69, 79, 66, 129, 174, 187). Đại sảnh đá xám trung tính (187 đến 190, nền C 0,00 đến 0,01) với thảm lục và cửa kính màu cũng ở đây. Có ba kiểu con: xám thép (69, 79, 66), tím tối (129, 131, 137) và tối có chữ rune xanh phát sáng (174, 175).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Tường, máy xám xanh sẫm (nền) | #353f44, #3f2e23, #475452 | 16-24 % | 0.30-0.50 | 0.00-0.03 |
| Vùng tối sâu (gầm máy, góc) | #1f2425, #171c1f, #252e2c | 9-14 % | 0.19-0.30 | 0.00-0.03 |
| Xám sáng vừa (bàn, vỏ máy, tấm) | #66767b, #6b6e69, #7c9296 | 6-11 % | 0.50-0.69 | 0.00-0.03 |
| Mảng sáng (bảng, màn hình, tấm trắng) | #f6e3e5, #c0ddef, #edeee5 | 9-13 % | 0.86-0.95 | 0.01-0.03 |
| Điểm nhấn lục (đèn, màn hình, glow phép) | #3f914c, #357d46, #449e56 | 7-13 % | 0.50-0.67 | 0.03-0.16 |
| Kiểu tím tối: tường, máy tím xám | #403853, #4e4764, #322b43 | 16-33 % | 0.30-0.43 | 0.04-0.05 |
| Glow rune xanh lục sáng | #b5faa5, #316037 | 13-15 % | 0.45-0.91 | 0.08-0.10 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 40-64 % · lưng chừng 24-37 % · rực 8-20 % · độ đậm TB 0.04-0.06 · tối sâu 2-10 % · sáng TB 0.44-0.52.

- Nền chiếm phần lớn và gần xám (trung vị 50 %), tối hơn phòng ấm; tối sâu trung vị 4 %, tới 10 % ở khung có tường tối.
- Sáng nhất là màn hình, bảng, tấm trắng (L 0,86 đến 0,95); điểm nhấn là một mảng lục hoặc màn hình phát sáng, trung vị rực 12 %.
- Nhân vật tách khỏi nền bằng độ rực (áo lục Doom #398f48 trên nền xám) và sáng hơn nền, không bằng viền.
- Có những ô tím tối (129) và lục phát sáng (174): đây là kiểu con, không phải màu thường của loại.

**Không làm:**
- Không nền nâu ấm, không gỗ vàng.
- Không tường rực: nền luôn đ dưới 0,05 trừ kiểu tím tối.

**Tấm mẫu:** `mau-phong-lanh.jpg` (khung 69, 79, 66, 129, 174, 187)

## Phòng sáng (`phong-sang`, 11 khung, nhóm thường gặp)

**Dùng khi:** Trong nhà rất sáng, tường trắng hoặc xám xanh nhạt, có cửa sổ lớn thấy phố: phòng thí nghiệm sáng, bệnh viện, nhà vệ sinh (khung 40, 42, 64, 167, 182, 227).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Tường, bàn trắng (rất sáng) | #ebeceb, #d7dadb, #f5f1ed | 11-18 % | 0.88-0.97 | 0.00-0.03 |
| Tường xám xanh nhạt | #b0bfc8, #99adbc, #c4c9b6 | 15-20 % | 0.71-0.83 | 0.00-0.03 |
| Xám vừa (tủ, nền sau, bóng) | #7e868e, #70678e, #889188 | 8-11 % | 0.52-0.70 | 0.01-0.03 |
| Ô cửa sổ, trời | #9bb2bf, #97aabe, #b6d5ee | 16-18 % | 0.73-0.85 | 0.03-0.04 |
| Áo xanh Fantastic Four | #2f4062, #2f3e4d, #3a5577 | 7-12 % | 0.37-0.45 | 0.04-0.10 |
| Da, tóc vàng nhạt | #e4bf92, #e0b092, #e4bf92 | 5-8 % | 0.76-0.83 | 0.07-0.08 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 47-60 % · lưng chừng 32-44 % · rực 3-9 % · độ đậm TB 0.03-0.04 · tối sâu 0-2 % · sáng TB 0.72-0.78.

- Hai kiểu con: tông xanh lục nhạt và kem (40, 42: #eeeacd, #c2cbb6, #8e9c8a) và tông xám xanh lam (64, 70, 85, 167, 182, 227: #ebeceb, #bbc4cb, #b6d8f3).
- Là loại sáng nhất trong phòng: sáng TB trung vị 0,77, gần trắng 12 đến 27 % khung; gần xám trung vị 56 %.
- Tối nhất chỉ là áo xanh sẫm (L khoảng 0,37 đến 0,45) và tóc; tối sâu trung vị 1,3 %.
- Nhân vật tách khỏi nền bằng độ sẫm: áo xanh đậm trên tường trắng; không có điểm nhấn rực lớn (rực trung vị 5 %).

**Không làm:**
- Không nền tối, không điểm nhấn rực chiếm nhiều khung.
- Không tường màu đậm: đ dưới 0,04.

**Tấm mẫu:** `mau-phong-sang.jpg` (khung 40, 42, 64, 167, 182, 227)

## Phòng tối có nguồn sáng (`phong-toi-co-nguon`, 4 khung, nhóm thường gặp)

**Dùng khi:** Trong nhà tối, nến, đuốc hoặc phép là nguồn sáng: phòng ngủ có đuốc (16), phòng có tranh và nến (95), thư viện nến và phép lục (163, 226). Ít mẫu: chỉ 4 khung, hai kiểu: đỏ rượu (16, 95) và xám lục (163, 226).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Tường, đồ vật sẫm xám lục (kiểu thư viện) | #3f433b, #333525, #4c5c52 | 14-25 % | 0.32-0.47 | 0.01-0.03 |
| Đỏ rượu (rèm, giường, bức tranh, cờ) | #751b2d, #541a2d, #5d4341 | 11-16 % | 0.33-0.42 | 0.04-0.13 |
| Vùng tối sâu | #191811, #140f0a, #242726 | 11-14 % | 0.18-0.27 | 0.00-0.02 |
| Lục (phép, sách phát sáng, áo Doom) | #638649, #6a7e3c, #40ac4a | 8-10 % | 0.56-0.66 | 0.08-0.17 |
| Nâu sẫm ấm (tường, đồ gỗ phòng ngủ) | #38261c, #38261c, #3c251d | 11-12 % | 0.29-0.29 | 0.03-0.04 |
| Vùng sáng quanh nguồn (da, nến, giấy) | #deb388, #deb388, #efbd5e | 8-10 % | 0.79-0.83 | 0.07-0.10 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 29-41 % · lưng chừng 41-49 % · rực 16-21 % · độ đậm TB 0.05-0.06 · tối sâu 12-14 % · sáng TB 0.42-0.45.

- Tối sâu 11 đến 14 % khung ở cả 4 khung; sáng TB 0,42 đến 0,45, thấp hơn mọi loại phòng khác.
- Nguồn sáng là nến, đuốc hoặc phép: mảng nhỏ L 0,79 đến 0,84 (khung 16: #deb388, #efbd5e; khung 226: lục nhạt #c7f7f0), nền xung quanh vẫn sẫm đ 0,01 đến 0,05.
- Điểm nhấn là đỏ rượu (khung 16: #832134 đ 0,13; khung 95: #bf1b33 đ 0,19) hoặc lục phép (#40ac4a đ 0,17, khung 163).
- Lò rèn (51, 52) không thuộc loại này: tường nâu xám vừa, tối sâu chỉ 1 đến 3 %. Chúng ở phong-am.

**Không làm:**
- Không toàn khung tối đồng đều: luôn có một nguồn sáng nhỏ làm tâm.
- Không nền lam hay lục rực: lục chỉ ở chỗ có phép.

**Tấm mẫu:** `mau-phong-toi-co-nguon.jpg` (khung 16, 95, 163, 226)

## Phố đêm (`pho-dem`, 9 khung, nhóm thường gặp)

**Dùng khi:** Ngoài trời đêm có nhà, đèn đường, cửa sổ sáng: phố chợ đêm, sân lâu đài đêm, thành phố đêm (khung 18, 56, 100, 98, 105, 223).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Tường nhà xám xanh sẫm | #353a49, #3f2e2e, #4b4d5c | 12-22 % | 0.31-0.50 | 0.02-0.03 |
| Vùng tối sâu (bóng, gầm) | #191b1d, #060a17, #252738 | 14-18 % | 0.11-0.29 | 0.01-0.03 |
| Trời, tường lam tím sẫm | #32384d, #32384d, #404658 | 16-21 % | 0.30-0.43 | 0.03-0.07 |
| Trời, đầu ngõ lam tím tối | #1d243a, #181e34, #242a41 | 13-19 % | 0.10-0.30 | 0.03-0.07 |
| Ô cửa sổ sáng đèn | #f3d7be, #efca95, #f3d7be | 7-8 % | 0.86-0.92 | 0.04-0.09 |
| Áo Doom lục | #36853f, #357b3f, #3a8342 | 8-12 % | 0.54-0.55 | 0.08-0.13 |
| Nâu gỗ sẫm (quầy, cột) | #563d29, #4d3925, #6b5234 | 8-8 % | 0.37-0.46 | 0.04-0.05 |
| Ô cửa sổ sáng, đèn lồng (vàng ấm) | #c2a87d, #a67141 | 1-3 % | 0.66-0.78 | 0.07-0.10 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 30-42 % · lưng chừng 44-68 % · rực 1-14 % · độ đậm TB 0.04-0.05 · tối sâu 9-18 % · sáng TB 0.32-0.44.

- Nền xanh xám sẫm đ 0,02 đến 0,05, tối nhất ở trời và góc; ô cửa sổ và đèn là chỗ sáng nhất (L 0,86 đến 0,92) nhưng nhỏ, chỉ 2 đến 9 % khung.
- Điểm nhấn là ô cửa sổ vàng ấm, rải nhiều ô nhỏ; không có mảng rực lớn (rực trung vị 7 %).
- Nhân vật giữ màu riêng, không bị làm tối theo đêm (xem Điều chung). Chúng tách khỏi nền sẫm bằng áo sáng và đỏ rượu.

**Không làm:**
- Không nền đen thuần: tối nhất L khoảng 0,1 đến 0,3 và còn ngả lam.
- Không ô cửa sổ trắng lạnh, chỉ vàng ấm.

**Tấm mẫu:** `mau-pho-dem.jpg` (khung 18, 56, 100, 98, 105, 223)

## Đêm thiên nhiên (`dem-thien-nhien`, 9 khung, nhóm thường gặp)

**Dùng khi:** Đêm ngoài trời không có nhà: bãi trại có lửa (7, 170, 171, 172), vòng nến trong rừng (13, 15), nghĩa địa (146, 177), mặt người trong lều tối (26).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Rừng, nền tối xám xanh lục sẫm | #1b282b, #0e1c1f, #202e34 | 14-22 % | 0.21-0.30 | 0.01-0.03 |
| Núi, nền xám sẫm | #45403a, #28343b, #4c5167 | 14-18 % | 0.32-0.46 | 0.01-0.02 |
| Trời đêm lam sẫm | #1a233c, #141d38, #1b243b | 25-33 % | 0.24-0.27 | 0.05-0.05 |
| Lam xám (đồi xa, tuyết đêm) | #455272, #424e6d, #515f80 | 9-12 % | 0.42-0.50 | 0.03-0.05 |
| Tuyết, đất sáng | #c0b3b2, #a3a6ad, #cabcb5 | 12-19 % | 0.72-0.82 | 0.01-0.03 |
| Nâu ấm (lều, gỗ, lửa) | #a18161, #966f49, #b88251 | 4-8 % | 0.54-0.69 | 0.06-0.10 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 33-46 % · lưng chừng 39-58 % · rực 1-9 % · độ đậm TB 0.04-0.05 · tối sâu 14-25 % · sáng TB 0.34-0.49.

- Gần xám nhiều nhất trong các cảnh đêm (trung vị 40 %), tối sâu trung vị 15,6 %; rực chỉ 3 %.
- Sáng nhất là tuyết hoặc đất bên lửa (khung 172, L 0,85 đến 0,91) và ánh lửa, nến.
- Điểm nhấn là lửa trại hoặc nến cam, mảng nhỏ ở giữa cảnh.
- Có hai kiểu con: tuyết đêm sáng (7, 170, 171, 172) và rừng đen xanh (13, 15, 146, 177).

**Không làm:**
- Không bầu trời xanh dương rực: trời lam đ chỉ 0,05.
- Không cây cỏ lục rực: lục chỉ xuất hiện như xám xanh sẫm.

**Tấm mẫu:** `mau-dem-thien-nhien.jpg` (khung 7, 13, 26, 146, 170, 177)

## Chiều tím (`chieu-tim`, 14 khung, nhóm thường gặp)

**Dùng khi:** Hoàng hôn, trời tím hồng hoặc đào ở ban công, đền (khung 68, 73, 126, 150, 185, 217). Gồm cả 149, 151 đến 153 (đền đêm tím) cùng tông.

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Lan can, đá xám sẫm | #3e464b, #313745, #484f57 | 11-15 % | 0.31-0.45 | 0.01-0.03 |
| Núi, trời tím xám nhạt | #8f879f, #646094, #938ba7 | 14-23 % | 0.51-0.68 | 0.03-0.13 |
| Núi, tường lam tím sẫm | #383673, #36336b, #3b397b | 13-22 % | 0.33-0.47 | 0.05-0.12 |
| Núi tím sẫm | #60496c, #493964, #66497e | 16-18 % | 0.38-0.47 | 0.04-0.09 |
| Trời đào (đỏ cam nhạt) | #c79977, #c79977, #cd9a76 | 13-34 % | 0.71-0.72 | 0.04-0.08 |
| Trời, vùng sáng nhạt cam nâu | #e0c09c, #cdab97, #f2c99a | 7-14 % | 0.70-0.85 | 0.04-0.11 |
| Áo Doom lục | #34823e, #307737, #409946 | 8-11 % | 0.51-0.60 | 0.12-0.14 |
| Vùng tối sâu | #171a2c, #171a2d, #191e23 | 10-14 % | 0.22-0.27 | 0.01-0.03 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 8-32 % · lưng chừng 50-64 % · rực 13-34 % · độ đậm TB 0.06-0.08 · tối sâu 1-10 % · sáng TB 0.47-0.57.

- Có hai bộ tách bạch: tím (khung 73, 126, 150, 228: núi tím và trời tím sẫm) và đào (khung 68, 185, 217: trời #c79977, L 0,71). Khung 193 hồng cam.
- Rực trung vị 19 %, nhưng phần lớn là lục của áo Doom; trời không rực.
- Tối nhất là lan can và bóng đá (L 0,22 đến 0,3), sáng nhất là vùng trời gần chân trời (L 0,7 đến 0,85).
- Nhân vật tách khỏi nền bằng độ rực: áo lục trên nền tím hoặc đào.

**Không làm:**
- Không trời xanh dương thuần.
- Không nền gần xám hết: gần xám trung vị 21 %, lưng chừng 55 %.

**Tấm mẫu:** `mau-chieu-tim.jpg` (khung 68, 73, 126, 150, 185, 217)

## Ngày thiên nhiên (`ngay-thien-nhien`, 13 khung, nhóm thường gặp)

**Dùng khi:** Ban ngày ngoài trời: trại, đồi, đồng lúa, chiến trường (khung 9, 10, 28, 136, 179, 181, 206). Chiến trường (134, 225, 229) là kiểu con trời xám khói.

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Cỏ, cây (lục đục) | #6a8151, #477c3e, #6a964b | 11-22 % | 0.50-0.66 | 0.05-0.12 |
| Núi, bãi đất xám lục | #80897c, #777c72, #7a9081 | 13-21 % | 0.51-0.69 | 0.01-0.03 |
| Bóng cây, đất sẫm | #5a4e3e, #403a2f, #675941 | 8-12 % | 0.31-0.49 | 0.01-0.03 |
| Trời nhạt | #cdd7e2, #cbd3db, #dde9f3 | 8-15 % | 0.86-0.93 | 0.01-0.03 |
| Núi xa (xanh lam xám nhạt) | #96aabe, #94a5bf, #98aec8 | 12-19 % | 0.71-0.75 | 0.04-0.04 |
| Đất, lúa nhạt | #737c59, #726c5a, #8e8672 | 12-15 % | 0.51-0.64 | 0.03-0.10 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 16-47 % · lưng chừng 45-63 % · rực 1-32 % · độ đậm TB 0.04-0.07 · tối sâu 1-2 % · sáng TB 0.58-0.62.

- Lục của cỏ nhiều nhưng đục: C 0,05 đến 0,12 (khung 10: cỏ #6d7e52, núi gần #68846b), không rực. Rực trung vị 3 %.
- Lớp xa nhạt và xám hơn lớp gần: núi xa #8a9fa0, #859b8f so với cỏ gần #718256 (khung 10).
- Sáng nhất là trời và đỉnh núi trắng (L 0,86 đến 0,93); tối nhất chỉ là bóng cây và áo, tối sâu trung vị 1 %.
- Điểm nhấn là áo đỏ rượu của lính, cờ, lửa, mỗi thứ vài phần trăm.
- Hai kiểu con: đục (9, 10, 11, 28, 181, 134, 225, 229: rực 1 đến 3 %, cỏ #808c63, #6a8151, trời #96aabc) và tươi hơn (136, 179, 206: rực 31 đến 40 %, cỏ #5b8547, #347540, #6a964b).

**Không làm:**
- Không lục chói: lục cao nhất C 0,12 (khung 136, 179, 206); các khung còn lại C 0,05 đến 0,09.
- Không trời xanh ngọc đậm: trời xanh lam xám nhạt (#96aabe).

**Tấm mẫu:** `mau-ngay-thien-nhien.jpg` (khung 9, 28, 136, 179, 181, 206)

## Ngày phố (`ngay-pho`, 23 khung, nhóm thường gặp)

**Dùng khi:** Ban ngày ở phố, sân, thành phố: chợ, sân trường, mái nhà (khung 31, 46, 57, 82, 99, 219).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Đá, nền đường xám vừa | #8b8272, #73726c, #979188 | 14-22 % | 0.51-0.70 | 0.00-0.03 |
| Tường, bóng xám sẫm | #433b33, #383132, #58544c | 7-15 % | 0.31-0.49 | 0.00-0.03 |
| Tường nhà kem, nâu nhạt | #beb19a, #c7a279, #c7bfaa | 10-16 % | 0.72-0.84 | 0.03-0.12 |
| Trời nhạt | #cae0ec, #c8ddeb, #eae4d9 | 5-22 % | 0.88-0.93 | 0.02-0.03 |
| Nhà xa, trời xanh xám | #a3b9c9, #b7aea0, #a5bbcc | 10-16 % | 0.75-0.81 | 0.02-0.03 |
| Gỗ, mái nâu đỏ | #5d4836, #56392a, #675a4c | 9-13 % | 0.36-0.49 | 0.03-0.10 |
| Cây, mái bạt lục | #5a8448, #347b3e, #5a8448 | 10-15 % | 0.50-0.59 | 0.07-0.12 |
| Mái ngói đỏ rượu | #763731, #7d332e, #912a2b | 5-18 % | 0.41-0.47 | 0.04-0.14 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 29-46 % · lưng chừng 45-62 % · rực 4-11 % · độ đậm TB 0.04-0.05 · tối sâu 1-3 % · sáng TB 0.56-0.63.

- Gần xám nhiều (trung vị 38 %), rực trung vị chỉ 7,7 %; sáng TB 0,59, tối sâu chỉ 2 %.
- Điểm nhấn là các mái bạt đỏ trắng, quầy hàng và áo người, mảng nhỏ.
- Lớp xa (nhà, thành phố) nhạt và xanh xám, lớp gần sẫm hơn.
- Nhân vật tách khỏi nền bằng áo có màu (đỏ rượu, xanh, lục) trên nền xám nâu.

**Không làm:**
- Không nền nhiều màu rực: đ nền thường 0,03 hoặc thấp hơn.
- Không trời xanh dương đậm.

**Tấm mẫu:** `mau-ngay-pho.jpg` (khung 31, 46, 57, 82, 99, 219)

## Tuyết (`tuyet`, 7 khung, nhóm thường gặp)

**Dùng khi:** Cảnh phủ tuyết, ban ngày hoặc chiều: đường làng tuyết, tu viện tuyết (khung 19, 20, 21, 47, 48, 49, 78). Ít mẫu: 7 khung.

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Tuyết, núi xám xanh vừa | #848993, #807d7a, #8b93a3 | 14-21 % | 0.54-0.68 | 0.00-0.03 |
| Tuyết sáng | #bbc1c7, #b6b1a6, #bac3c7 | 11-19 % | 0.71-0.83 | 0.01-0.02 |
| Thông, bóng xám lục sẫm | #55605a, #404249, #55605a | 9-13 % | 0.37-0.49 | 0.01-0.03 |
| Tuyết rất sáng, đỉnh trắng | #dadfe7, #becde2, #efe6cd | 7-10 % | 0.85-0.94 | 0.01-0.03 |
| Trời, núi lam đậm (khung đêm 19) | #333e5e, #333e5e, #4d566d | 20-23 % | 0.37-0.46 | 0.03-0.05 |
| Áo, cờ đỏ (tu viện) | #5c2226, #5c2226, #5f2227 | 14-18 % | 0.33-0.36 | 0.06-0.09 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 68-74 % · lưng chừng 18-26 % · rực 0-9 % · độ đậm TB 0.02-0.04 · tối sâu 1-5 % · sáng TB 0.62-0.64.

- Là loại xám nhất: gần xám trung vị 72 %, rực trung vị 0,1 %, độ đậm TB 0,03.
- Sáng TB 0,63; sáng nhất là tuyết (L 0,85 đến 0,94), tối nhất là thông và áo choàng nâu.
- Điểm nhấn là áo tu sĩ đỏ hoặc cam (khung 47, 48, 49), áo choàng nâu: mảng nhỏ, chiếm 4 đến 6 %.
- Nhân vật tách khỏi nền bằng độ sẫm và độ ấm (nâu, đỏ trên trắng xám).
- Ba kiểu con: tuyết xám ban ngày (20, 47, 78: gần xám 72 đến 83 %), tuyết đêm lam (19: nền #333e5e, #24293c) và tu viện đỏ trắng có cửa sổ vàng ấm (48, 49: rực 14 đến 15 %, đỏ rượu #5f2227 chiếm 12 đến 20 %).

**Không làm:**
- Không tuyết trắng sạch thuần: tuyết luôn ngả xám xanh nhẹ hoặc kem.
- Không nền rực.

**Tấm mẫu:** `mau-tuyet.jpg` (khung 19, 20, 47, 49, 78, 48)

## Lửa (`lua`, 16 khung, nhóm đặc biệt)

**Dùng khi:** Địa ngục, lửa, đỏ cam bao trùm: khung 14, 147, 154 đến 162, 164, 165, 176, 220, 235. Khung 176 là lửa tràn lên phố gạch (có tường gạch, khói xám).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Nền tối nâu đỏ (đất, hang) | #35120d, #270d08, #40180f | 13-25 % | 0.18-0.30 | 0.03-0.08 |
| Đá, lửa tối đỏ nâu | #642116, #541f15, #782718 | 9-19 % | 0.30-0.44 | 0.07-0.13 |
| Lửa, trời cam vàng | #f2aa4a, #efa748, #f2aa4a | 13-16 % | 0.72-0.84 | 0.05-0.13 |
| Lửa đỏ cam rực | #e84e2c, #8c645d, #ea6c30 | 6-12 % | 0.50-0.69 | 0.04-0.21 |
| Bóng đỏ đen | #270a09, #230806, #3e100d | 12-19 % | 0.15-0.29 | 0.03-0.07 |
| Vùng đen | #110803, #0d0401, #110803 | 6-17 % | 0.12-0.17 | 0.02-0.03 |
| Áo Doom lục | #3f823f, #3e833d, #409143 | 6-11 % | 0.53-0.60 | 0.06-0.13 |
| Cột sáng vàng kem | #f7d473, #f4cb67, #f7d6a4 | 4-7 % | 0.85-0.89 | 0.07-0.13 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 3-14 % · lưng chừng 47-59 % · rực 33-41 % · độ đậm TB 0.09-0.10 · tối sâu 18-29 % · sáng TB 0.43-0.46.

- Là loại rực nhất ngoài vũ trụ cam: rực trung vị 37 %, tối sâu trung vị 22 %; hai đầu cực: đen đỏ tối và cam vàng sáng.
- Tối nhất là đen đỏ (L 0,12 đến 0,3) ở nền; sáng nhất là cam vàng và cột sáng vàng kem (L 0,85 đến 0,89).
- Điểm nhấn là lục của Doom, xanh áo Strange, và cột sáng: chiếm vài phần trăm.
- Nhân vật tách khỏi nền bằng độ sáng và khác họ màu (lục, xanh, kem trên nền đỏ cam).

**Không làm:**
- Không nền lam, lục.
- Không lửa trắng chói: lửa đỏ cam #e84e2c, đỉnh vàng #f2aa4a.

**Tấm mẫu:** `mau-lua.jpg` (khung 14, 147, 157, 164, 159, 220)

## Sáng trắng (`sang-trang`, 26 khung, nhóm đặc biệt)

**Dùng khi:** Rất sáng, nền trắng, kem, mây, vàng nhạt: thiên đường trắng vàng, mây trời, sảnh trắng (khung 5, 67, 86, 200, 207, 212; khung 1 là sảnh trắng vàng dưới trời đêm; nhóm khung 200 đến 203, 207, 210, 236 đến 238 có thêm lục và vàng kim).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Mây, tường trắng tím nhạt | #e8e1e9, #dbd6de, #f5f0ee | 9-19 % | 0.85-0.97 | 0.00-0.03 |
| Trụ, sàn xám kem | #beb9ac, #b7b2a0, #c2c3bf | 12-22 % | 0.71-0.85 | 0.00-0.03 |
| Kem, vàng nhạt, đồ vàng kim | #f1e7c6, #ddd6b8, #f6efd2 | 8-18 % | 0.86-0.95 | 0.03-0.11 |
| Mảng lục (nền ngai, áo Doom) | #40904a, #3a7c3f, #4faf55 | 7-12 % | 0.50-0.70 | 0.03-0.16 |
| Vàng kim, đồ trang trí | #b1ae5e, #baa442, #d7ccac | 8-15 % | 0.70-0.85 | 0.03-0.13 |
| Vàng nhạt, tóc | #e8c664, #bfa88e, #e8c664 | 13-23 % | 0.73-0.84 | 0.05-0.13 |
| Xám vừa (bóng) | #8c8f94, #747f6e, #9ba4a7 | 7-13 % | 0.56-0.70 | 0.00-0.02 |
| Kiểu mây tím nhạt: nền mây trắng tím, tia nắng | #e0d7e9, #d0c9dd, #faf6ec, #e4ddec | 16-30 % | 0.79-0.97 | 0.01-0.03 |
| Kiểu trời mây xanh nhạt (khung 86, 87) | #aed6f1, #ecf4f7, #a2c9e4 | 13-38 % | 0.81-0.96 | 0.01-0.06 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 25-55 % · lưng chừng 31-44 % · rực 8-33 % · độ đậm TB 0.04-0.07 · tối sâu 1-4 % · sáng TB 0.69-0.82.

- Gồm ba kiểu con: mây tím trắng (5, 44, 67, 93, 114, 178), trời xanh nhạt có mây (86, 87) và sảnh trắng kem vàng kim (200 đến 213, 230, 236 đến 238). Mỗi kiểu có bộ riêng ở bảng vai.
- Sáng TB trung vị 0,74, gần trắng 14 % khung (đến 34 % ở khung toàn mây).
- Tối nhất là áo lục của Doom, và vài đồ tối nhỏ (L 0,19 đến 0,28, 2 % khung).
- Điểm nhấn là lục (nền ngai và áo) và vàng kim, mỗi thứ 5 đến 20 % khung.
- Nhân vật tách khỏi nền bằng độ sẫm và rực (lục đậm trên trắng).

**Không làm:**
- Không đổ nền xám sẫm.
- Không viền đen: đồ vàng kim và trụ cũng nhạt.

**Tấm mẫu:** `mau-sang-trang.jpg` (khung 5, 67, 86, 200, 207, 212)

## Vũ trụ (`vu-tru`, 14 khung, nhóm đặc biệt)

**Dùng khi:** Không gian, hành tinh, sao (khung 3, 53, 74, 88, 191, 197).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Nền tím xanh tối | #0c1229, #0b0c20, #1b1a39 | 12-20 % | 0.15-0.29 | 0.03-0.09 |
| Nền lam đen | #060b1c, #04091a, #090f24 | 16-25 % | 0.13-0.30 | 0.03-0.07 |
| Hành tinh, đại dương (lam) | #3675ad, #3671ad, #5083cd | 6-20 % | 0.53-0.70 | 0.06-0.11 |
| Nền đen gần xám | #080e18, #03050e, #181b2a | 5-18 % | 0.11-0.24 | 0.02-0.03 |
| Lam sẫm (khí quyển) | #2a3f67, #1a3762, #34537a | 7-11 % | 0.31-0.49 | 0.06-0.11 |
| Lục đục (lục địa) | #6a9b55, #2e7139, #6a9b55 | 5-7 % | 0.54-0.65 | 0.07-0.11 |
| Sao, ánh sáng | #e4eef4, #cad6e6, #e4eef4 | 4-5 % | 0.89-0.93 | 0.01-0.02 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 7-15 % · lưng chừng 52-84 % · rực 5-40 % · độ đậm TB 0.05-0.07 · tối sâu 32-78 % · sáng TB 0.24-0.41.

- Tối sâu trung vị 71 %, sáng TB 0,30; nền lam tím đen đ 0,03 đến 0,09.
- Mảng sáng nhất là sao, mặt trời, viền khí quyển (L 0,89 đến 0,93, 1 % khung).
- Điểm nhấn là hành tinh lam và lục: lam #3671ad, lục #6a9b55.
- Khung 88 và 191 có hành tinh lam rực (#3675ad, đ 0,11) là điểm sáng chính; khung 53, 74, 197 nền gần như đen lam.

**Không làm:**
- Không nền đen thuần: luôn ngả lam hoặc lam tím.
- Không hành tinh rực quá C 0,11.

**Tấm mẫu:** `mau-vu-tru.jpg` (khung 53, 74, 88, 191, 197, 127)

## Vũ trụ cam đỏ (`vu-tru-cam`, 6 khung, nhóm đặc biệt)

**Dùng khi:** Mặt trời cam (khung 3) và cảnh vũ trụ trừu tượng nền đỏ cam rực (111, 192, 194, 195, 196). Ít mẫu: 6 khung, hai kiểu: mặt trời trên nền đen đỏ (3) và nền đỏ cam phẳng (5 khung còn lại).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Nền đỏ rượu | #892e3a, #832c45, #923b31 | 16-35 % | 0.42-0.49 | 0.12-0.12 |
| Nền đỏ cam | #b95b3e, #b25a3f, #c77e4f | 12-18 % | 0.54-0.67 | 0.10-0.18 |
| Vệt sáng kem | #f7e0a3, #f6de97, #f7e0a3 | 4-9 % | 0.89-0.92 | 0.06-0.11 |
| Vệt sáng cam nhạt | #daa469, #d6a366, #eaac6d | 10-11 % | 0.76-0.78 | 0.10-0.10 |
| Vệt sáng đỏ cam nhạt | #d38954, #d38954, #e5a36f | 9-16 % | 0.72-0.77 | 0.10-0.16 |
| Chỗ tối tím (lỗ đen) | #1e1b35, #19162d, #272039 | 3-5 % | 0.21-0.28 | 0.05-0.06 |
| Mặt trời (khung 3): cam đậm, cam sáng, nền đen đỏ | #f1832a, #be4014, #f9d570, #110614 | 11-24 % | 0.15-0.89 | 0.04-0.18 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 1-3 % · lưng chừng 11-29 % · rực 67-88 % · độ đậm TB 0.11-0.12 · tối sâu 1-4 % · sáng TB 0.51-0.57.

- Rực trung vị 76 %, gần xám 2 %: loại rực nhất của video; vẫn có độ sáng vừa (TB 0,55).
- Khung 3 (mặt trời) có nền đen đỏ #110614 chiếm 24 %, nên tối sâu của khung đó 38 %, khác 5 khung còn lại.
- Tối chỉ ở lỗ đen nhỏ (L 0,21 đến 0,28, 3 % khung); sáng nhất là vệt sáng kem.

**Không làm:**
- Không có vùng xám: gần xám dưới 3 %.

**Tấm mẫu:** `mau-vu-tru-cam.jpg` (khung 3, 111, 192, 194, 195, 196)

## Thế giới lạ tím (`the-gioi-la`, 15 khung, nhóm đặc biệt)

**Dùng khi:** Hành tinh lạ: trời tím, đất cam nâu, tinh thể ngọc lam, thành vàng kim (khung 109, 110, 113, 119, 121, 234; các khung 110, 112, 115 có tia sáng trắng vàng).

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Trời tím lam sẫm | #504087, #4c3985, #5d4d8b | 14-21 % | 0.39-0.50 | 0.08-0.12 |
| Đất đỏ nâu cam | #946b4c, #92694b, #aa7a52 | 17-27 % | 0.55-0.62 | 0.05-0.08 |
| Đất, đá cam nâu | #ae7e37, #9c702e, #b6893c | 13-21 % | 0.57-0.69 | 0.08-0.11 |
| Thành vàng kim | #cda543, #b99f82, #d9af47 | 11-22 % | 0.72-0.78 | 0.05-0.12 |
| Tia sáng, người sáng vàng | #f6e0ba, #f1dc96, #f6efe8 | 8-13 % | 0.86-0.96 | 0.04-0.09 |
| Núi tím vừa | #7c5e9d, #6c588e, #806093 | 12-18 % | 0.50-0.55 | 0.09-0.10 |
| Tinh thể, áo Doom lục | #327e3c, #327c3b, #34833e | 9-12 % | 0.52-0.55 | 0.12-0.12 |
| Đá đỏ tím sẫm | #6e3743, #623741, #743b47 | 6-16 % | 0.39-0.45 | 0.05-0.08 |
| Núi tím sẫm | #603e79, #5c3979, #694f9c | 6-14 % | 0.41-0.49 | 0.08-0.11 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 4-7 % · lưng chừng 40-61 % · rực 29-51 % · độ đậm TB 0.09-0.09 · tối sâu 0-3 % · sáng TB 0.56-0.61.

- Rực trung vị 44 %, gần xám chỉ 6 %: hầu như mọi vùng đều có màu.
- Tối sâu trung vị 1 %, sáng TB 0,57; sáng nhất là tia sáng và thành vàng (L 0,72 đến 0,96).
- Điểm nhấn là thành vàng kim phía sau và tinh thể ngọc lam; Doom lục tách khỏi nền bằng khác họ màu.

**Không làm:**
- Không vùng xám rộng.
- Không nền ngày xanh lục, phải là tím và cam.

**Tấm mẫu:** `mau-the-gioi-la.jpg` (khung 109, 110, 113, 119, 121, 234)

## Nơi phủ một màu (xanh lục và vàng kim) (`noi-mot-mau`, 15 khung, nhóm đặc biệt)

**Dùng khi:** Phòng ngai xanh lục của Doom: nền lục sẫm, cửa sổ vàng (khung 45, 63, 92, 96, 128, 215, 239; cũng 94, 97, 102, 106, 107, 142). Khung 133 (tím) và 186 (hồng) cũng ở nhóm này như hai nơi phủ một màu riêng, mỗi nơi chỉ một khung.

| Vai | Mã màu (từ số đo) | Phần khung | L | C |
|---|---|---|---|---|
| Tường, cột tối xám lục | #17231d, #161d19, #232b28 | 12-20 % | 0.20-0.29 | 0.01-0.03 |
| Lục sẫm (ngai, tường) | #3b523d, #334e31, #256a34 | 9-16 % | 0.32-0.49 | 0.04-0.11 |
| Lục vừa (ngai sáng, thảm) | #507754, #507657, #42a94b | 9-14 % | 0.50-0.69 | 0.04-0.17 |
| Cửa sổ vàng chói | #efd366, #efcd65, #eedb4f | 12-17 % | 0.85-0.89 | 0.11-0.14 |
| Vàng sẫm, trang trí | #afa34d, #afa34d, #b5b852 | 6-9 % | 0.70-0.84 | 0.07-0.10 |

**Số đo (phần tư 1 đến phần tư 3):** gần xám 14-42 % · lưng chừng 32-52 % · rực 23-34 % · độ đậm TB 0.06-0.08 · tối sâu 7-20 % · sáng TB 0.45-0.54.

- Cả nền xoay quanh một họ lục và vàng: lục sẫm chiếm 19 %, lục vừa 18 %, cửa sổ vàng 11 đến 23 %.
- Tối nhất là tường xám lục đen (L 0,2 đến 0,29), trung vị tối sâu 14 %; sáng nhất là cửa sổ vàng (#e5d44a, L 0,85).
- Điểm nhấn là vàng và lục sáng của cửa sổ, ô kính hình thoi, và đèn nến; chiếm 11 đến 23 % khung.
- Nhân vật Doom lục không tách khỏi nền bằng màu; tách bằng mặt xám sáng và áo lục sáng hơn tường.

**Không làm:**
- Không thêm họ màu khác vào nền (đỏ, lam): ngoài lục và vàng gần như không có.
- Không cửa sổ trắng.

**Tấm mẫu:** `mau-noi-mot-mau.jpg` (khung 45, 63, 92, 96, 128, 215)
