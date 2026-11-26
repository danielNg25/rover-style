# Báo cáo soi kỹ 84 cảnh đầu (khung 0–5108, khoảng 3 phút 33 giây)

Ngày 21/11/2026. Bảy agent, mỗi agent 12 cảnh, soi theo 14 vùng, không được xem danh mục cũ. Kết quả: 87 bản ghi (7 cảnh trong danh sách cắt thật ra chứa hai cảnh), 302 ảnh phóng to. Ghi chép từng cảnh: `out/deep/notes/batch-01..07.jsonl`; ảnh: `out/deep/notes/zooms/`.

**Claude đã tự mở ảnh để kiểm 7 phát hiện:** chớp mắt có khung trắng (đúng), nhoè chuyển động trên tay (đúng), tay đi qua hình nằm ngang (đúng), ông bố tái dần (đúng), vệt nắng phủ lên người (có vẻ đúng), bóng đảo hướng trong cùng trại (KHÔNG thấy: cả hai cảnh bóng đều đổ sang phải), "cử chỉ vẽ lại ở mọi khung" (chưa chắc, xem mục 12). Các mục còn lại là báo cáo của agent, chưa kiểm.

Ký hiệu: **[mới]** = chưa từng có trong danh mục; **[sửa]** = trái với danh mục v2; số trong ngoặc là số cảnh.

---

## 1. Camera
- Gần như không cảnh nào đứng máy: khoảng 80 trên 87 phần có máy chuyển động, đa số chậm và đều tốc (đẩy hoặc lùi 1–6%).
- **[mới] Máy nghiêng (xoay quanh trục nhìn):** 0,3–2 độ ở khoảng 25 cảnh; mạnh ở cảnh 14 (khoảng 7 độ khi lùi ra) và cảnh 52 (8 độ, kèm lùi).
- **[mới] Rung máy theo nhịp:** cảnh quỷ cười (34) rung và nghiêng máy ở mọi khung, đỉnh ở khung 2013. Tiếng cười được "bán" bằng máy rung chứ không chỉ bằng miệng.
- **[sửa] Lớp gần trượt khác lớp xa** ở khoảng 13 cảnh (11, 12, 21, 22, 34, 52, 64B, 66, 70, 71, 72, 81, 83); cảnh xe ngựa (64B) có ít nhất 4 lớp. Số còn lại cả hình đi như một tấm phẳng (ví dụ cảnh lùi khỏi trường, 65).
- Có hãm hoặc tăng tốc ở số ít: hãm cuối (4, 17, 23, 42, 72); tăng dần (12, 41, 50, 60). Trượt dọc thẳng tuyệt đối, đều tốc (16, 19, 39, 47).
- **[mới] Máy đi theo diễn xuất:** cúi theo cú ngồi xổm (51).
- **[sửa] Nền mờ sau mặt ở cận và trung cận:** khoảng 13 cảnh (5, 18, 25, 27, 29, 38, 49, 73, 75, 77, 78a...). Một đốm tròn mờ đứng yên trước ống kính (40).

## 2. Chỗ cắt và chuyển cảnh
- Gần như toàn cắt thẳng; cảnh mới đã trôi sẵn từ khung đầu.
- **[mới] Danh sách cắt của mình thiếu:** 7 trên 84 cảnh chứa một chỗ cắt ẩn (8, 31, 32, 43, 64, 78, 83), cộng một cú nhảy vào gần hơn trong cùng cảnh (84). Mọi số đo theo cảnh của các lượt trước ở những cảnh này đều lẫn hai cảnh.
- Chuyển không cắt: mặt nạ tan dần thành mặt thật trong khoảng 18 khung, nhìn xuyên thấy mắt và sẹo ở giữa chừng (13), tan ngược lại nhanh hơn, 12 khung (14); hoà hình 5 khung sang bầu trời mơ (13); chuỗi lùi ra Trái Đất (17): đại sảnh tan VÀO quả cầu, như được vẽ lên mặt cầu; lóa trắng qua bong bóng ý nghĩ (79).
- **[mới] Nét mặt không nối qua chỗ cắt:** cảnh sau diễn lại từ đầu sự thay đổi (48→49, 53→54), hoặc giữ nét cũ đúng một khung rồi mới đổi (51→52). Có cảnh kết thúc đúng lúc mắt đang nhắm (83b).

## 3. Kiểu "bật ra" của vật thể **[mới]**
- Vật hiện ra bằng cách phóng to từ một chấm, vượt quá cỡ rồi co về: quả cầu (9 khung, vượt ở khung 10–11), biểu tượng quả cầu (8 khung), nhãn "Latveria" (5 khung, sau khi cờ đã hiện), ba vòng khoanh đỏ trên tờ ghi chú (3 khung rồi vượt 2–3 khung, cách nhau 12–13 khung; vòng hở, hai đầu chồng lên nhau, không vẽ dần theo nét).
- Ngai rơi vào khung trong 3 khung, không co giãn; bụi nổ ra SAU khi chạm (khung 16), lan ngang, vỡ thành chấm, hết ở khung 38.
- Đổi nhân vật (6): các đốm xanh hiện trên người 4 khung TRƯỚC lúc đổi; đổi trong đúng một khung; khói và lấp lánh đến sau.
- Biến mất (35): mất trong một khung, không hiệu ứng; rồi tro rơi (mảnh có cạnh, chất đống), bụi tròn bốc lên tới khoảng khung 2100.
- Bong bóng ý nghĩ lớn dần từ chấm thành đám mây theo từng nấc 1–2 khung, phẳng, không viền.

## 4. Bóng
- **Bóng là hình chiếu của chính nhân vật ở mọi cảnh thấy chân** (khoảng 25 cảnh qua bảy nhóm): giữ cả khe giữa hai chân, đổi theo tư thế (ngồi xổm ở 37), đi theo từng bước (68, 81), trượt theo người (76).
- **[mới] Bóng lên mọi thứ, không chỉ lên sàn:** bóng giày hình chiếc giày trên mặt ghế ngai (6); đầu cô bé đổ bóng lên gối (42); cờ đổ bóng bầu dục mềm xuống tường (4); ngai đổ bóng loang lên bậc thềm (11); cột đèn đổ bóng xiên trên cỏ (65); cọc rào có sọc bóng và đổ bóng dài trên tuyết (48).
- **[mới] Nhân vật lơ lửng:** gấu áo nhấc khỏi mặt đường 10–15 điểm ảnh, bóng bầu dục mềm ở lại trên đất (7).
- Hướng bóng theo bối cảnh: trại ban ngày về phía sau bên phải; thảm trong cung và tuyết về phía sau bên trái; đường trước lâu đài về bên phải.
- Một agent báo bóng đảo hướng giữa cảnh 26 và 28 trong cùng trại. Claude mở cả hai ảnh: không thấy đảo.

## 5. Ánh sáng
- **Lửa trang trí không chiếu sáng gì:** lò than, đuốc trong đại sảnh không hắt lên tường (3/3 cảnh ở nhóm 1). Ngược lại:
  - ánh xanh quanh găng làm sáng bậc thềm phía sau nó (10);
  - phép thuật trong tay làm vàng các ngón, sáng cổ tay áo, và cả khung hình sáng dần lên (57);
  - quầng phép nhuộm tay áo bên cạnh thành màu cánh sen nhưng không tới mặt (29);
  - miệng và mắt quỷ soi sáng vùng mặt tối quanh chúng (34).
- **Ánh ấm lên mặt** ở cảnh có lửa, đèn hoặc cửa lều sáng gần: 17, 27, 38, 61, 62.
- **[mới] Mỗi người cầm đuốc mang theo một vệt sáng ấm hình bầu dục trên tuyết**, đi theo người; tia lửa bay lên từ từng ngọn đuốc (44).
- **[mới] Quầng sáng thường là các vòng phẳng xếp bậc, không phải mờ nhoè** (4 cảnh: mặt trời ba vòng đỏ sẫm, trăng một đĩa nhạt mép cứng cộng một vòng mảnh, quầng đuốc trên tường có mép vòng thấy rõ).
- Vệt nắng xiên: cả 4 cảnh lớp học của nhóm 6, 5 cảnh của nhóm 7, phòng ngủ lâu đài (kèm bụi bay trong vệt nắng), phòng điện thoại (59). **[mới]** Vệt nắng có vẻ phủ lên cả người đứng trong nó (72).
- **[mới] Ánh cửa sổ nằm trên sàn:** hai ô chữ nhật sắc nét trên thảm (74); các dải sáng tối xiên trên sàn ván (43).
- Không nhất quán: đèn treo tường ở cảnh 15 không có quầng; cửa sổ lâu đài ở cảnh 50 có viền tối thay vì quầng; chai phát sáng, đèn vòng, bóng chân không không có quầng (78b, 79).

## 6. Màu của nhân vật theo cảnh **[mới]**
- Tròng trắng mắt không trắng tinh: xám nhạt ở cảnh lạnh (48), ngả vàng kem trong lều ấm (52).
- Ông bố tái dần: da và áo chuyển đều từ ấm sang xám xanh trong khoảng 25 khung (2700–2726), rồi hiện mảng sương xanh nhạt trên má; ánh sáng cảnh không đổi.
- Hai người ở bến cảng (58) được tô khối thật trên đầu, mũ, râu, quần áo; các nhân vật khác trong đoạn tô phẳng. Con quỷ (33) là khối 3D nhiều mặt phẳng.

## 7. Mắt, chớp mắt, nét mặt
- **[mới] Chớp mắt kiểu chính:** tròng trắng biến mất, hai nét cong màu da trong 3–4 khung, rồi MỘT khung tròng trắng không có con ngươi, khung sau con ngươi mới hiện. Khoảng 20 lần ở cả bảy nhóm. Kiểu thứ hai, có mí nửa khép: 3 lần (11, 60).
- Mắt nhắm lúc vui là cung võng xuống, giữ 4 khung (27). Lo lắng thể hiện bằng mí trên trượt dần xuống qua vài khung, không phải chớp (14, 24, 38).
- **[mới] Mí trên là MỘT đường chạy suốt qua cả hai mắt** (8 cảnh ở nhóm 5), có khía nhọn chỗ hai mắt gặp nhau; khi giận thành chữ V.
- Mắt lệch nhau có chủ ý: một tròn một sụp (25), mắt gần to hơn mắt xa (72), một mày nhướn (83b).
- Đổi nét mặt trong một khung bằng cách thay cả bộ mắt và miệng: khoảng 30 lần. Có trình tự hai bước: miệng đổi trước, 2 khung sau mí dưới mới đẩy lên (53); miệng đổi đúng khung tay bắt đầu cử động (69); nhân vật A nhắm mắt cười đúng khung nhân vật B nổi giận (74).
- Miệng khi nói đổi gần như mỗi 1–2 khung, nhiều hình: nét khép, há có dải răng và lưỡi hồng, chữ o, bầu dục sẫm không răng. Răng nghiến là lưới ô có viền đen, hai hàng.
- Mặt nạ Doom có bộ biểu cảm riêng (khe mắt giận, buồn), và tấm mặt nạ bị kéo xiên để giả xoay 3D (5).
- Lông mày vẽ đè lên mũ và tóc (58). Râu lởm chởm là các vạch ngắn rời (28, 40, 58).

## 8. Thân, tay, di chuyển
- **[mới] Nhoè chuyển động** trên tay và ống tay ở cú vung nhanh, 1–2 khung, rồi tay văng quá một chút (46, 47; Claude đã thấy ở 47).
- **[mới] Giơ tay đi qua một hình tay duỗi ngang, bị kéo dài**, giữ 2 khung, rồi mới tới tư thế cuối (61, 69, 71, 75).
- Tay bật giữa các tư thế trong một khung ở nhiều chỗ (6, 10, 20, 30, 75, 78a, 83a); đập búa chỉ có hai hình (55).
- **[mới] Cả người trượt ngang khi phản ứng:** 30 điểm ảnh (26), khoảng 100 điểm ảnh khi nổi giận (49), 150–200 điểm ảnh không có hình bước (76). Đi thật có bước chân xen kẽ ở 68 và 81.
- **[mới] Đầu cử động trên thân đứng im** (67, 70, 72). Ngồi xổm sâu, chân dạng, bàn chân không rời chỗ (37); ngồi thụp trong một khung (51).
- **[mới] Đổi trang phục trong một khung:** trao áo choàng bằng một bọc vải bay lộn 8 khung (45).
- **[mới] Có hình vẽ riêng cho lưng:** tóc có các nét sợi, đường may áo, tay chắp sau lưng (32b, 44, 50, 70).
- Vải và dây đi trễ: gấu áo răng cưa nghiêng khoảng 6 khung (50), hai dây rút của bao tải đung đưa sau mỗi lần lắc (24). Cờ đuôi nheo và dây cờ thì đứng im dù có tuyết (47, 53, 60).
- Đạo cụ 3D cầm bằng tay 2D (bao tải ở 24); cuốn sách đi vào khung trong hai hình, ngón cái thấy rõ ở gáy sách (54).

## 9. Thứ luôn chuyển động trong nền
- **Chấm trắng lơ lửng** (bụi, đom đóm, tuyết, tàn lửa) ở khoảng 60 trên 87 phần, kể cả ban ngày và trong nhà.
- Lửa, nến, tia điện, hào quang mặt trời: vẽ lại ở mọi khung, 2–3 sắc, có lõi kem; tàn lửa bay lên. Khói là các cụm tròn rời, mờ dần theo độ cao; hơi nước là cụm phồng rồi teo theo chu kỳ khoảng 6 khung (56) hoặc ba nét lượn (74).
- Vật nhỏ: quả lắc đồng hồ (66, 81, 82), thiên cầu quay (2), bồ câu ngọ đầu, quần áo phơi (7), thiêu thân quanh đèn (56), chim là nét chữ V đổi hình (22), bánh răng và bánh đà (55, 56), sao băng có đốm sáng ở đầu, chậm lại rồi mờ (19), chấm quay quanh biểu tượng (12).
- Bụi dưới vó ngựa và bánh xe: mây mép lượn, mờ dần (64B). Cá heo xoay theo cung nhảy, nước bắn hình vương miện rồi vỡ thành giọt trong 6 khung (8b).

## 10. Bối cảnh và đạo cụ
- **[mới] Dấu vết cũ kỹ:** thạch cao bong, vết nứt, mạng nhện (74); vệt ố dưới cửa sổ (6); phấn xoá dở còn bóng chữ trên bảng (66, 67, 81); bia mộ có vệt nước, rêu, vết nứt, ba bông hoa nhỏ (47); băng nhũ, vết nứt trên đá (44, 45).
- **[mới] Chi tiết mặt đất:** dấu chân bầu dục xám và mảng tuyết tan quanh lửa (17), vết bánh xe (22, 48), cụm cỏ, hoa nhỏ, sỏi (21, 76), dây thường xuân che góc hộp (7, 65).
- Kính chỉ là hai cặp vệt trắng chéo (3, 16). Góc trong của khối trắng có bóng mềm, không có bóng cứng (2).
- Qua cửa lều hoặc cửa sổ thấy cả một ngoại cảnh nhỏ (30, 51), trượt khác lớp khi máy đi (43). Mỗi ô cửa sổ có nội thất khác nhau (76).
- Dùng lại bối cảnh: cung điện 6 cảnh, trại 3 cảnh (đổi sang đêm, lều sáng từ trong), lều 2 góc. Quần áo không nhất quán giữa các cảnh (quần đùi rồi quần dài, 37 và 41).
- Toàn cảnh thảo nguyên, biển, mặt trời (8a, 8b, 9) là tranh phẳng, không phải bối cảnh 3D.

## 11. Chữ và đồ hoạ
- Nhãn tên: chữ thường, không chân, bo tròn, trắng ngà, không viền, kèm mũi tên cong vẽ tay; đặt phía đối diện nhân vật; đã có sẵn từ khung đầu của cảnh (5 cảnh).
- **[mới] Nhãn nằm trong cảnh:** đi và to lên theo camera (5, 69).
- Tờ ghi chú (82, 84): chữ đứng cho nhãn, chữ nghiêng cho số; chữ trong sách là vạch xám; tờ giấy quăn góc; vẫn có hơi nước và quả lắc chuyển động trong cảnh chèn.

## 12. Chưa ngã ngũ
- **Nhịp vẽ của nhân vật: mỗi khung hay mỗi hai khung.** Các agent báo cử chỉ lớn "vẽ lại ở mọi khung" ở hơn 20 cảnh, chỉ 4 cảnh có giữ hai khung (7, 13, 42, 48). Nhưng ở hai dải Claude tự xem (47 và 69), phần lớn tư thế giữ đúng 2 khung, còn cả hình thì nhích nhẹ ở mọi khung, có thể do camera trôi. Cần đo riêng nhân vật sau khi khử chuyển động camera.
- Vệt nắng có thật sự phủ lên nhân vật không (72): cần so màu tay áo trong và ngoài dải sáng.
- Quy tắc nào quyết định đèn có quầng hay không.
- Vòng trong của hào quang ngai (2) có quay chậm không.

## 13. Chi phí của lượt này
Bảy agent, 390 lượt gọi: 1,65 triệu token mới (đầu vào mới cộng đầu ra) và 46,9 triệu token đọc lại từ bộ nhớ đệm. Tính ra mỗi cảnh khoảng 20 nghìn token mới và 560 nghìn token đọc lại.
