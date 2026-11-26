# Ghi chú: vẽ lại Doom cho sát bản gốc (chưa làm, để sau)

Ngày ghi: 20/11/2026. Trạng thái: con rối hiện tại (`src/chars/doomImg.ts`) được Daniel chấp nhận "khá ổn" để đi tiếp bước 3; các điểm dưới đây là chỗ còn kém bản gốc, cần vẽ lại bằng Codex khi quay lại.

Ảnh đối chiếu: `out/so-sanh-buoc2.mp4`, `out/end-pairs.jpg`, `out/measure.jpg`, khung gốc `out/ref-medium-full.jpg`, `out/ref-wide-full.jpg`.

## Cần vẽ khác đi như thế nào

1. **Mũ trùm và áo choàng là MỘT khối liền.**
   - Của họ: mép ngoài của mũ chạy thẳng xuống thành mép áo choàng, không có chỗ thắt ở cổ. Nhìn tổng thể là một hình chuông.
   - Của mình: mũ, khăn vai, áo choàng là ba mảnh ráp, nên khăn vai trông như một dải nằm ngang tách rời.
   - Cách vẽ: nhờ Codex vẽ một mảnh "mũ + áo choàng liền" (phần trong mũ để trống tối màu), thay cho hai mảnh `hood.png` và `p-1.png`. Khăn vai chỉ còn là phần cổ áo nhỏ có hai khuy vàng, nằm đè lên trên, hai đầu nhọn chìa nhẹ ra ngoài.

2. **Mặt nạ vuông vức, hàm rộng.**
   - Của họ: gần như hình chữ nhật bo góc, cạnh bên thẳng đứng, đáy rộng gần bằng đỉnh.
   - Của mình: hình trứng, thon dần xuống cằm.
   - Cách vẽ: mô tả cho Codex "rounded rectangle, straight vertical sides, wide flat jaw, width about 76% of the hood opening".

3. **Chi tiết mặt nạ.**
   - Tấm mắt của họ to, chiếm gần hết nửa trên mặt nạ, hai tấm gần chạm nhau ở sống mũi.
   - Sống mũi của họ là hình thang cao, sáng hơn mặt nạ, đáy rộng.
   - Đường má của họ rất nhạt và ngắn (mình đang để 55% độ đậm, có thể giảm nữa).
   - Tấm miệng nhỏ hơn của mình một chút, 5 khe đen.

4. **Thân và tay.**
   - Thân áo của họ rộng gần bằng đầu, vai xuôi; phần váy dưới thắt lưng ngắn, mép váy lượn sóng nhẹ.
   - Tay của họ: bắp tay là một khối tròn mập ngay dưới khăn vai, cẳng tay ngắn, có một đường kẻ ngang ở cổ tay. Bề dày tay khoảng 10% chiều cao người.
   - Bàn tay của họ vẽ kiểu găng tròn, ngón ngắn mập; bàn tay của mình ngón dài và xòe quá rộng.

5. **Tỉ lệ đã đo trên khung gốc** (phần trăm chiều cao cả người): đầu 40%, mũ trùm rộng 42%, khăn vai nằm ở 39–52%, thắt lưng ở 70%, gấu áo ở 77%, gấu áo choàng rộng 77%.

6. **Chất hình.** Của họ có chuyển sáng rất nhẹ trên vải (sáng ở trên, tối dần xuống), nếp vải là nét vuốt nhọn hai đầu. Giữ nguyên chất này khi vẽ lại; dùng `gen/doom-front.png` làm ảnh mẫu giữ nét.

## Cách làm khi quay lại
- Mỗi lần gọi Codex dùng `./gen.sh <tên>.png gen/prompts/<tên>.txt gen/doom-front.png`, nền hồng tím #FF00FF, cắt bằng `tools/cut.py`.
- Không dùng khung cắt sát từ video gốc làm ảnh mẫu (Codex đã từ chối một lần); dùng hình mình đã tạo.
- Ước lượng 2–3 hình: (a) mũ + áo choàng liền, (b) mặt nạ trống hình vuông + tấm mắt + mũi + miệng, (c) thân + tay + bàn tay kiểu găng tròn.
- Sau khi thay mảnh, chạy `./kfpairs.sh` để so sáu khung mốc với bản gốc.

## Nữ hoàng (cùng đợt)
- Hiện là một tấm liền (`public/queen/q-1.png`), chỉ chớp mắt bằng hai miếng da che. Cần tấm bộ phận: đầu, tóc, thân váy, hai tay, để đầu và tay cử động riêng.
