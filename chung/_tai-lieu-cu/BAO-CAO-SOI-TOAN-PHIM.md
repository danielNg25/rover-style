# Báo cáo soi kỹ toàn bộ phim (674 cảnh, 34.444 khung)

Ngày 21/11/2026. Thay cho `BAO-CAO-SOI-84-CANH.md` (bản đó chỉ có 84 cảnh đầu).

## 0. Phạm vi và độ tin
- 106 agent soi, mỗi cảnh được xem ở cỡ gốc trên các khung liên tiếp, theo 14 vùng; không agent nào được xem danh mục cũ. Kết quả: 731 bản ghi (57 cảnh trong danh sách cắt hoá ra chứa chỗ cắt ẩn), 3.761 ảnh phóng to. Ghi chép: `out/deep/notes/batch-*.jsonl`; ảnh: `out/deep/notes/zooms/`.
- 10 agent tổng hợp theo vùng. Bản tổng hợp gốc (tiếng Anh, có số cảnh ví dụ): `out/deep/synth/_*.txt`; bảng đếm: `out/deep/synth/*.json`.
- **Các con số dưới đây là số bản ghi có nhắc tới đặc điểm, trên 731**, phần lớn đếm bằng từ khoá sau khi đọc, sai lệch vài cảnh. "Không nhắc" không có nghĩa là không có. Ba agent tổng hợp (camera, hiệu ứng và nhịp diễn, nhân vật phần một) hết chỗ đọc giữa chừng nên nửa sau của chúng chỉ đếm bằng từ khoá.
- Claude tự mở ảnh kiểm 11 phát hiện: 9 đúng, 1 có vẻ đúng, 1 không xác nhận được (bóng đảo hướng, mục 14).

---

## 1. Nhịp vẽ: đã ngã ngũ
- **Nhân vật vẽ trên twos, camera và hiệu ứng trên ones.** 355 bản ghi nêu thẳng điều này. Theo bộ phận (twos / ones): tay 171 / 27; bàn tay 153 / 50; miệng 49 / 18; mí 41 / 4; đầu 65 / 27; chân và bước đi 69 / 9; cả tư thế 284 / 69.
- Một cử động tay điển hình: 3–6 hình, mỗi hình 2 khung, rồi giữ. Tư thế cuối giữ 10–27 khung. Độ dài giữ đếm được: 2 khung 77 lần, 4 khung 13, 6 khung 6, 8 khung 7.
- Nhân vật lên ones khi: đi hoặc trượt, rơi và bay, vòng lặp đám đông, hình trung gian rất nhanh.
- Các agent của 84 cảnh đầu báo "vẽ lại mọi khung" là do cách soi (lẫn với camera trôi), không phải do phim.
- **Bật trong một khung, không hình trung gian:** 272 bản ghi. Giữ động (không bao giờ đứng im hẳn): 63; giữ chết: 44.
- **Lệch khung có chủ ý giữa các sự kiện:** 110 (mắt đi trước tay 4 khung ở cảnh 386; phản ứng trễ 2–6 khung). Phản ứng lan qua nhóm người lần lượt: 62.
- **Nhoè trên khung nhanh:** 70; văng quá rồi về: 40; lấy đà: 23; co: 10.

## 2. Camera
- Đã chuyển động ngay từ khung đầu: 342. Đẩy vào 272, lùi ra 211. Cỡ đẩy (265 cảnh có số): dưới 1% 104; 1–3% 64; 3–6% 46; 6–10% 31; trên 10% 20.
- Tốc độ (317 cảnh có số): đều 188; tăng dần 46; hãm cuối 38.
- **Trượt dọc thẳng tuyệt đối, không đẩy:** 140, thường 5–11% chiều cao. Trượt ngang 1–5%: 156. Đi cung quanh chủ thể: 37. Trôi lững lờ kiểu cầm tay: 115. Gần như đứng máy: 75.
- **Nghiêng máy** (341 cảnh có số): dưới 0,5 độ 87; 0,5–1 độ 114; 1–2 độ 96; 2–4 độ 30. Khung nghiêng hẳn: 5.
- **Rung máy:** 10 cảnh, chỉ ở va chạm và quỷ cười, và dừng hẳn ở chỗ cắt. Máy đi theo hành động: 12.
- **Lớp gần trượt khác lớp xa:** agent thấy rõ ở 218, thấy phẳng ở 215. Có ở trượt ngang và đi cung khi có đạo cụ tiền cảnh; phẳng ở toàn cảnh đối xứng, trượt dọc, cảnh chèn.
- **Nền mờ sau nhân vật:** 194, trong đó 127 là cận và trung. Nét hết: 288, trong đó 213 là toàn cảnh. Vật tiền cảnh mờ: 37. Không có đổi nét trong cảnh.
- Cỡ cảnh: toàn 271; rất rộng 24; nguyên người 94; trung 162; trung cận 87; cận 46. Đối xứng một điểm tụ: 104. Hai người 80; qua vai 29; sau lưng 35. Có vật tiền cảnh làm khung: 101.

## 3. Chỗ cắt và chuyển cảnh
- Cắt thẳng gần như tuyệt đối. Không có quét hình, không có chuyển tối.
- Chuyển khác: lóa trắng 5 lần, luôn để vào cảnh mơ hoặc tưởng tượng, ra khỏi mơ bằng cắt thẳng; hoà hình ở 3 cảnh. Mặt nạ thành mặt thật: tan dần 4–18 khung chỉ trên lớp mặt (9 cảnh) hoặc đổi trong một khung (5 cảnh).
- **Danh sách cắt thiếu khoảng 53 chỗ cắt** trong 45 cảnh.
- Tư thế hoặc hành động nối qua chỗ cắt: 166; không khớp: 100. Hành động đã chạy sẵn ở khung đầu: 114. Cắt vào trục: 91; đảo góc: 92. Hiệu ứng bắc cầu qua chỗ cắt: 35; khớp hình theo vật hoặc tư thế: 32.

## 4. Mặt
- **Chớp mắt có ba kiểu** (184 bản ghi có chớp):
  - nửa khép 2 khung, nhắm 2, nửa khép 2: khoảng 54;
  - nhắm 3–4 khung, một khung tròng trắng không con ngươi, rồi mở: khoảng 55 (thiên về trung và cận);
  - đổi thẳng mở sang nhắm, không nửa khép: khoảng 15.
  - Mắt nhắm luôn là bỏ tròng trắng, hai nét cong trên da. Người đeo kính: tròng kính tô màu mí, gọng giữ nguyên. Đổi hướng nhìn giấu trong lúc chớp (631). Chớp ngay trước chỗ cắt: 7.
- Hai tròng trắng chạm nhau thành một hình; mí trên phẳng cắt ngang cả hai mắt: 69 ở phần hai của phim. Mí dưới hoặc cung má đẩy lên khi cười: khoảng 40.
- **Sốc:** tròng trắng thành hình tròn to, con ngươi co thành chấm, bật trong một khung: khoảng 110 qua ba phần. Cỡ con ngươi là công cụ biểu cảm.
- Tròng trắng không trắng tinh, theo màu cảnh: khoảng 80 (kem trong phòng giam, tím nhạt ban đêm, xanh bạc hà trong phòng ngai xanh; lính gác có mắt hồng nhạt).
- Miệng: nét khép thuôn; há có lưỡi và dải răng (khoảng 130); lưới răng nghiến (khoảng 120); chữ o sẫm (khoảng 75). Người không nói giữ một hình miệng và chỉ diễn bằng mắt.
- Mày lệch nhau: khoảng 125. Mày vẽ đè lên tóc, mũ, băng: khoảng 40.
- **Doom đeo mặt nạ:** mắt là khe đen với một chấm kem trượt trong khe để đổi hướng nhìn, thường nhảy trong một khung; khe và tấm mày đổi góc theo cảm xúc; không chớp, trừ 4 cảnh tấm mí khép 2 khung. Tấm miệng: đứng im ở khoảng 175 bản ghi, nhưng được vẽ lại hoặc đổi cỡ khi nói ở khoảng 30. Ở cận cảnh, đầu rung nhẹ từng khung thay cho cử động miệng.

## 5. Thân, tay, đi lại, vải
- Diễn chính bằng nghiêng đầu và đung đưa nhẹ: khoảng 340 bản ghi. Bàn chân đứng yên: 80 ở phần ba.
- Tư thế tay hay gặp: giơ hai lòng bàn tay, tay đặt lên ngực, khoanh tay, chống hông, chỉ ngón trỏ, tay lên cằm. Vẫy tay bằng cách đổi 2–3 góc bàn tay. Có hình bàn tay "chụm ngón" (4 cảnh). Tay giấu trong áo choàng cho tới khi cần: 27.
- **Đi:** lạch bạch (cả con rối lắc, chân thẳng, hai bàn chân đổi cao thấp, trên twos trong khi dịch chuyển trên ones) 31; trượt không có hình bước 32; bước thật 7. Ngã: một hình cứng xoay quanh bàn chân, 4 nấc (109, 662). Nhún và co: khoảng 38.
- **Vải:** viền áo choàng được vẽ lại theo từng tư thế là chính (khoảng 110); đi trễ, xòe, văng quá rồi yên chỉ ở cử động lớn của cả người (104 bản ghi nhắc; rõ nhất ở 464, 498, 526, 611). Gấu đung đưa theo bước: 5. Tóc cứng theo đầu; đuôi tóc tự cử động ở 4 cảnh, khuyên tai ở 1.
- Nhìn từ sau: khoảng 110 bản ghi; đường tóc gáy răng cưa; với Doom có một mảnh mặt nạ lộ ở mép mũ khi quay ba phần tư lưng (khoảng 20).
- Đổi hình ngay trên màn hình: hiện, mất, biến hình trong một khung: 50; khói và lấp lánh đến sau 1–3 khung: 18.

## 6. Bóng
- **Bóng mềm có hướng, mang dáng nhân vật, đổi theo tư thế:** 161 bản ghi nêu là chi tiết dễ sót; 48 bản ghi tả rõ viền bóng đổi theo người. Bóng không phản ứng với tay: 20. Chỉ vệt sát chân hoặc không có: 37.
- Theo nơi: ngoài trời ban ngày và phòng sáng (lab, bệnh viện) có bóng dài nhuộm màu mặt đất; phòng tối chỉ có vệt dưới gấu áo; cảnh ngược sáng thì bóng đổ về phía máy (34); không gian và cảnh mơ không có bóng (89 bản ghi không bóng).
- **Người bay có bóng tách rời nằm lại trên đất:** 29; bóng chờ sẵn rồi nhập vào khi hạ xuống (174, 611). Người bay không có bóng: 16.
- Bóng lên mặt đứng: 17. Bóng tay lên thân: có ở 26, không có ở khoảng 121. Hoa văn sàn nhìn xuyên qua bóng: 12.

## 7. Ánh sáng
- **Phần lớn nguồn sáng là trang trí:** khoảng 252 bản ghi nói nguồn sáng nhìn thấy (cửa sổ, đuốc, nến, màn hình, lửa) không làm sáng thứ cạnh nó.
- Nguồn sáng thật: mảng ấm trên tường quanh đèn hoặc đuốc 30; vũng sáng của lửa trên đất 8; màn hình hắt một hình thang nhạt lên sàn 9; quả cầu sáng làm đèn chính 11.
- **Ánh phép trong tay:** 87; làm sáng găng, mép áo, tường hoặc đất cạnh nó ở 53; tới mặt hoặc cả người chỉ ở 3. Không bao giờ tạo bóng.
- Vệt nắng trong suốt, đứng yên: khoảng 90; phủ lên nhân vật ở 2. Nón sáng của đèn: 22.
- Quầng mềm quanh nguồn sáng: khoảng 205; có nguồn sáng mà không quầng: 93. Quầng xuất hiện ở đêm, chạng vạng và cảnh gần; ban ngày và toàn cảnh nhỏ thì không. Quầng xếp bậc: 13.
- Viền sáng ấm thật trên nhân vật: 22. Ngược sáng mà không có viền: 92.
- Đổi sáng trong một khung: 20; chớp sáng không làm sáng gì: 23; vệt sáng quét qua tường (619).

## 8. Tô và màu trên nhân vật
- Có chuyển sắc mềm, mảng tối hoặc vân giấy trên nền tô phẳng: khoảng 150 bản ghi. Vân giấy trên vải nhân vật: 49.
- Nhân vật nhuộm theo cảnh: mặt nạ xám ngoài trời, xanh bạc hà trong phòng ngai, kem ở nghĩa địa đêm, đỏ sẫm dưới hố; tù nhân sau buồng kính thành một màu tím. Ngược lại, 38 bản ghi nói nhân vật giữ nguyên màu trong đêm, và 21 nói nhân vật đậm màu trên bối cảnh đã làm tối.
- Claude thấy thêm khi kiểm ảnh: một số nhân vật có viền nâu quanh mắt (người băng mặt, cảnh 99).

## 9. Hiệu ứng và nền động
- **Bụi trắng lơ lửng:** 456 bản ghi, cả trong nhà lẫn ngoài trời.
- Lửa: 229; đổi hình mỗi khung 151, mỗi hai khung 12 (đuốc và nến nhỏ, xa). Tàn lửa bay lên: 143. Cụm mây hai sắc mép lượn cho bụi, biến mất, va chạm: 128, co về không chứ không mờ dần. Khói 96; hơi nước 61; lấp lánh bốn cánh 65; tuyết ba cỡ 58; tia điện 29; vệt tốc độ 17; vòng lan 14.
- Vòng lặp nền: quả lắc, ra-đa, bánh răng, quạt, hơi nước, thiên cầu: 113. Chim, bồ câu: 83. Báo và lá bay: 17.
- Sao đứng yên (23 lần kiểm), cờ và đèn lồng phần lớn đứng yên.
- Nổ: đỉnh ở khung thứ hai, sao rồi vòng (25). Để lại đống tro hoặc vụn: 25.

## 10. Bối cảnh và sàn
- Khối hộp ít mặt, mỗi mặt một sắc: 246. Nẹp vàng: 217. Hoạ tiết hình thoi: 201. Đinh tán: 157. Cờ, dây cờ: 166. Mạch đá bằng nét mảnh, vài viên khác sắc: 118. Giấy ghim tường: 82. Dấu vết cũ kỹ: 66; vết nứt: 45.
- Khoảng 20 bối cảnh lặp lại gánh phần lớn phim (đồng bằng ngoài hành tinh khoảng 50 cảnh, sảnh địa ngục 42, phòng ngai xanh 40, trại 39, sân thượng 35, quảng trường làng 34...). Cùng bối cảnh được dựng lại theo thời điểm: ngày, đêm, tuyết, giới nghiêm, tang lễ, đổ nát; năm trên biển sạp báo đổi 1962, 1984, 1987.
- Sàn: mạch lát theo phối cảnh 194; thảm 101, viền vàng 155; vũng sáng 83; tối dần về mép 82; vết nứt 95; dây cáp 59; vạch sơn 58; mảnh vụn 57; hình khảm 52; bóng sọc của lan can 9.

## 11. Nền xa, màu, bề mặt
- Không có trời, tường đóng kín khung: 157. Ngoại cảnh chỉ thấy qua cửa: khoảng 135. Trời sao: khoảng 190 (sao hình thoi 73, bốn cánh 54, ba cỡ). Trăng: khoảng 70. Núi nhiều mặt có dải tuyết răng cưa: 90. Mây dạng tấm đáy phẳng: 62. Xa nhạt và xanh dần theo nấc: 39.
- Mỗi kiểu nơi một bảng màu và mức sáng riêng (đêm ngoài trời 49–92; phòng ngai xanh 79–107; lab và bệnh viện 170–205; cảnh mơ khoảng 200). Khoảng 160 bản ghi chỉ ra một màu "duy nhất" làm điểm nhấn.
- Tối góc: có 232, không 120, và 29 trường hợp là do chính bối cảnh tối ở mép. Không hạt nhiễu: 164; có vân giấy: 127.

## 12. Đạo cụ và chữ
- Không có chữ đè lên hình ở phần lớn phim. Nhãn tên kèm mũi tên cong: 18 cảnh, có sẵn từ khung đầu ở 17; màu theo nền; nằm trong cảnh ở 6, dính màn hình ở 5.
- Chữ giả bằng vạch: 58. Biển hiệu có chữ thật, chữ in có chân, luôn là một phần bối cảnh: 69. Năm trên biển sạp báo làm thay phụ đề. Bong bóng ý nghĩ luôn để trống: 7.
- Đạo cụ khối ít mặt cạnh nhân vật phẳng: 82–104. Đạo cụ 3D quay trên ones (thiên cầu, vòng nguyên tử): 24. Quạt quay: 12. Kính chỉ là vệt sáng chéo: 18. Phần lớn đạo cụ đứng yên (72 lần kiểm).

## 13. Những ý dàn dựng hiếm, đáng học
- Đại sảnh tan vào quả cầu, như vẽ lên mặt cầu (17). Cùng khung hình cắt từ ngày sang đêm (108/109). Đêm kéo tới như một tấm màn mép lượn viền đỏ (625a).
- Camera cưỡi theo xe ngựa với bốn lớp trượt (64b), theo máy bay không người lái (220a). Di chuyển bằng cách cuộn đường hầm qua một nhân vật đứng yên (413, 440).
- Khớp hình mặt nạ sang mặt thật rồi đổi cả địa điểm sau một cận cảnh không đổi (663–666). Vương miện trên ghế trống sang vương miện trên đầu (137b/138).
- Hình phản chiếu trong gương đi trễ 2 khung (98). Bóng tay quét qua chăn trong 4 khung (631). Vệt sáng quét qua tường còn bóng tấm áp phích đứng yên (619).
- Dấu đóng "EXPELLED": dấu to hơn khi còn trên không, mực bắn ra trong một khung (132). Biển hiệu rơi, lún, nảy lại nghiêng, bụi ở hai thời điểm (145). Vòng khoanh đỏ bật ra cách nhau đúng 12 khung (84, 669).
- Buồng đông lạnh: không vẽ cửa, một tấm sương trượt lên và nền đổi màu trong một khung (571).

## 14. Chỗ còn tranh cãi
- **Hướng bóng trong cùng một bối cảnh:** các agent báo đảo trái phải ở 6 bối cảnh (trại 26/28, tu viện, sạp báo, làng, sân thượng, sảnh địa ngục). Claude mở cặp 26/28 và không thấy đảo. Cần so mốc bối cảnh để biết đó là cảnh quay lật gương, bối cảnh dựng lại, hay agent đọc sai.
- Tấm miệng của mặt nạ có thật sự cử động khi nói không.
- Các đốm bầu dục cố định trên sàn (9 cảnh): hoa văn, vết ố, ánh sáng hay bóng.
- Sàn bóng có phản chiếu thật không; tối góc là lớp phủ hay do bối cảnh; sao có nhấp nháy không (chỉ một cảnh nói có).
- Lửa có nhuộm màu người không: có ở 17, 18, 466; không ở 26, 353, 357, 470.
- Chớp kiểu nào dùng cho ai: chưa lập bảng theo nhân vật.

## 15. Chi phí
Token mới theo bộ đếm: 1,65 triệu (7 agent đầu) cộng 5,24 triệu (lượt bị ngắt) cộng 15,72 triệu (lượt cuối), khoảng 22,6 triệu. Chưa tính phần đọc lại từ bộ nhớ đệm; riêng 251 cảnh đầu phần đó là khoảng 93 triệu.
