# Cách dựng cảnh cutout3d: xếp lớp, thân dưới, tự soi (chốt 21/11/2026)

> Kho asset (mọi món dùng lại được, có ảnh và bảng tra): `assets/DANH-MUC.md`, `assets/catalog.json`, công cụ `tools/kho.py`.
>
> Mọi thay đổi đều ghi vào `NHAT-KY-THAY-DOI.md` (đổi gì, code ở đâu, ghi ở skill nào). Giờ có bốn skill: `skills/0-dao-dien.md` và ba skill dưới đây.
>
> Khi làm việc thì đọc ba skill tách ra từ tài liệu này: `skills/1-dung-canh.md` (dựng ảnh tĩnh của cảnh), `skills/2-chuan-mon-do.md` (làm một món cho kho), `skills/3-nhan-vat-dien-xuat.md` (dàn người và diễn xuất). Tài liệu này giữ lại lý do, lịch sử và các phép thử.

Tài liệu này ghi lại cách làm đã cho ra ba ảnh nền được Daniel duyệt (thung lũng, trại chạng vạng, làng quê Việt) và thân dưới con rối. Đọc nó trước khi dựng bất kì cảnh mới nào. Nó đứng trên `LUAT-CUTOUT3D-v3.md` ở phần bối cảnh và phần chân; các luật còn lại của bản 3 (nhịp, mặt, bóng, màu nhân vật) vẫn dùng.

## 1. Thứ tự làm việc

1. Một ảnh tĩnh của cảnh, tới khi tự soi đạt, rồi gửi Daniel.
2. Khoảng 8–10 giây chuyển động trong chính cảnh đó.
3. Sau đó mới tới nhiều cảnh, phiếu dữ liệu, quy trình.

Không tự động hoá thứ chưa đạt bằng tay. Không gửi video nhiều cảnh khi chưa qua ảnh tĩnh.

## 2. Bối cảnh là một chồng lớp theo độ xa

Một cảnh ngoài trời có khoảng chín lớp, từ xa tới gần:

| Lớp | Ví dụ | Cách dựng | Cách máy khoảng |
|---|---|---|---|
| Trời | dải màu, mây, mặt trời hoặc trăng, sao, chim | tấm vẽ (`Plate`), không sương | 520 m |
| Dãy núi rất xa | núi tuyết, núi đá vôi | tấm vẽ | 215 m |
| Dãy núi gần hơn | núi xám xanh, có thể có dải sương | tấm vẽ | 140 m |
| Mốc cảnh | lâu đài trên đồi, chùa tháp | tấm vẽ | 95 m |
| Đồi và rặng cây xa | làng nhỏ, ruộng, khói bếp | tấm vẽ | 70 m |
| Rặng cây gần, bờ rào xa | thông, lũy tre | tấm vẽ, đứng đúng mép xa của mặt đất | 46–58 m |
| Vật đứng trên mặt đất | cây, bụi, đống rơm, con vật | hình phẳng (`Sprite`) đặt ở vị trí thật | 10–40 m |
| Bối cảnh chính | nhà, cổng, giếng, hàng rào, thùng | khối hộp 3D ăn sáng, đổ bóng | 8–20 m |
| Tiền cảnh | cỏ mép dưới, góc ao, góc thùng | tấm vẽ rất gần, thứ tự vẽ 900 | 2.6–3.4 m |

Ba thứ tạo chiều sâu đều đến từ cách dựng, không chỉnh tay từng lớp:

- **Nhạt dần:** cả cảnh có sương màu trời gần chân trời (`scene.fog`), lớp nào đặt xa thì tự nhạt.
- **To nhỏ và che nhau:** vật đặt ở độ sâu thật nên tự nhỏ dần và che nhau.
- **Trôi khác tốc:** máy quay trượt thì lớp gần trôi nhanh hơn lớp xa.

Luật kèm theo:

- **Không vùng nào trơn.** Chia khung thành 12 ô (4 × 3); ô nào cũng phải có ít nhất hai lớp chồng nhau. Trời phải có mây, trăng hoặc mặt trời; đất phải có lối đi, mảng sáng tối, cỏ, đá.
- **Hình to, đơn giản, hai ba sắc**, phía sáng ở bên trái (đèn chính từ trước trái).
- **Xa thì lạnh và nhạt, gần thì ấm và đậm.** Cảnh "đêm" của kiểu hình này là chạng vạng: nền xám xanh sáng vừa, phần ấm (lửa, đèn, cửa sáng, vải bạt) ở tầm giữa. Không làm đêm đen.
- **Khối hộp 3D** cho thứ xây dựng to và đơn giản; **hình phẳng** cho cây, bụi, con vật, đồ nhỏ; không dùng khối cầu.
- **Đồ cần nét vẽ thì gen bằng Codex (đổi 25/11/2026; trước đây ghi "vẽ bằng code là chính").** Code chỉ cho khối xây dựng to, mặt đất, mặt nước, thứ phải chuyển động. Cách làm và ngân sách: `skills/2-chuan-mon-do.md`, mục Vẽ đồ bằng Codex.

## 3. Chuẩn chi tiết

Mỗi món phải có đủ:

1. Ba sắc độ (mặt sáng, mặt tối, điểm đậm).
2. Một cấu trúc phụ trên mọi bề mặt lớn: hàng gạch và mạch vữa, lớp rạ, hàng ngói, nan tre, ván thùng.
3. Một dấu vết đời sống nhỏ: miếng vá, rêu ở chân tường, cái nia treo, dây phơi, bát hương, con cò trên lưng trâu.
4. Không đều tăm tắp: nan cao thấp khác nhau, bó rạ dài ngắn, bờ ruộng không thẳng, cọc hơi nghiêng.
5. Chạm đất: có bóng tiếp đất và một thứ gì ở chân (búi cỏ, đá).

Mỗi cảnh phải có: khoảng chín lớp; ít nhất mười hai loại vật ở tầm giữa; một câu chuyện ánh sáng (ấm đối lạnh); không có chỗ chạm mép gây hiểu lầm (vật mọc ra từ đầu nhân vật, dây cắt ngang người, con vật như đứng trên tường).

## 4. Cách nghĩ ra một cảnh

- Bố cục cho riêng cảnh đó: một đường dẫn mắt (con đường, hàng rào) tới mốc cảnh; hai bên có vật đóng khung; chừa chỗ cho nhân vật.
- Danh sách đồ vật lấy từ hiểu biết về chủ đề (làng Việt: cổng làng, cây đa, giếng, nhà tranh, cau, tre, ruộng, trâu). Luật chỉ dùng để soát.
- Nếu phim mẫu có cảnh cùng LOẠI (ngoại cảnh ngày, trại, tuyết), xem một hai khung để đếm lớp và lấy tông màu. Khi báo cáo phải nói rõ cảnh nào có nhìn mẫu, cảnh nào không. Cảnh trại là theo đồ vật của họ; thung lũng và làng quê thì không.
- Chọn máy quay theo thứ cần thấy: ngang tầm mắt (cao 1.5–1.9 m) cho cảnh có nhân vật; nâng lên (3–3.4 m, vẫn nhìn ngang) khi cần thấy ruộng, mặt nước, sân rộng.

## 5. Tự soi trước khi gửi

Sau mỗi lượt dựng, tự mở ảnh ra nhìn và tự chê như một đạo diễn hình ảnh. Danh sách soát:

- Có gì quá to, quá sát máy, che mất lớp xa không?
- 12 ô: ô nào trơn?
- Có mảng phẳng lớn nào (tán cây một hình tròn, mái một mặt phẳng) cần thêm cấu trúc?
- Có chỗ chạm mép hay thứ tự vẽ sai không (quầng sáng đè lên mặt, bóng cây xa hiện xuyên thân cây gần)?
- Hình có bị cắt cụt vì khung vẽ của nó quá nhỏ không?
- Nếu có khung mẫu cùng loại: đặt cạnh, so số lớp, độ nhạt dần, độ trầm của màu.

Cổng đo bằng số (`tools/cadence.py`, `tools/classnorms.py`) chỉ để tham khảo. Không chỉnh hình để qua cổng: lần trước việc đó làm lửa giật và nhân vật lắc quá tay.

## 6. Thân dưới và bước chân của con rối

- **Cấu tạo:** hai chân là hai ống thẳng tách rời, hẹp hơn vạt áo, khác sắc với áo; vạt áo phủ lên và đổ bóng trên hông; mỗi chân một chiếc giày.
- **Đứng:** hai bàn chân ghim tại chỗ. Mọi chuyển động nhỏ (dồn trọng tâm, ngả người, nhịp nói) chỉ dịch phần thân phía trên. Không trượt cả hình, không nhún cả hình khi nói.
- **Bước một bước:** thân dịch quá tầm thì một chân tự bước ra, thân theo sau 4 khung, chân kia khép lại.
- **Đi:** hai chân thẳng đứng dưới thân; mỗi bước là một bàn chân rút thẳng lên khoảng một phần mười chiều dài chân trong một nhịp vẽ rồi hạ xuống, tới chân kia; chu kì 8 khung; thân nghiêng nhẹ về chân trụ và nhô lên; vị trí đổi mỗi khung, hình chân đổi mỗi hai khung; hai chân không bắt chéo, không đưa ngang.
- **Biên độ:** sức sống của cảnh đến từ các nhịp diễn rời rạc có quãng giữ yên, không từ việc lắc liên tục.

## 7. Bản đồ code

| Việc | File |
|---|---|
| Tấm vẽ, hình phẳng, các kiểu vẽ (núi, đồi, thông, cây, bụi, đá, nhà xa, lâu đài, mây, núi đá vôi, tre, cau, chuối, đa, trâu, cò, gà, chùa tháp, cỏ) | `src/lib3/depth.tsx` |
| Ánh sáng theo loại cảnh, mặt đất, bóng tiếp đất, quầng sáng, lớp hoàn thiện | `src/lib3/look.tsx` |
| Ba cảnh mẫu của cách làm | `src/demo/Valley.tsx`, `src/demo/Camp.tsx`, `src/demo/Village.tsx` |
| Chân, hông, vạt áo của con rối | `src/mould/draw.ts` (`hip`, `hipDy`, `legL`, `legR`) |
| Bước chân, đi, nhịp giữ | `src/mould/act.ts` (`footwork`, `act`) |
| Thư viện cử chỉ, động tác `walk`, `step` | `src/mould/gestures.ts` |

Ghi nhớ kĩ thuật:

- `Plate` vẽ theo đơn vị màn hình 1600 × 900 tại máy quay chuẩn của cảnh (`from`), rộng hơn khung 30 % để máy quay di chuyển được.
- Vị trí trên màn hình của một điểm trên đất: ngang `0.5 + x / (0.887 × D)`, dọc `0.5 + caoMáy / (0.4986 × D)`, với D là khoảng cách tới máy.
- Thứ tự vẽ: tấm vẽ 0, bóng tiếp đất 2, hình phẳng 3, quầng sáng 4, nhân vật 500, tiền cảnh 900. Nhân vật và hình phẳng không ghi độ sâu, nên sai thứ tự là hình sau đè lên hình trước.
- `Sprite` nhớ hình theo `name`: đổi cách vẽ hoặc cỡ khung thì phải đổi tên. Khung vẽ phải chứa trọn hình, nếu không sẽ bị cắt cụt.
- Dựng ảnh: `./still.sh <comp> <khung>`; dựng video: `./render-video.sh <comp> 1`. Trình duyệt không chạy được trong sandbox.
- Các món dựng bằng khối đã chuyển về thư viện chung (21/11/2026): ngoài trời ở `src/lib3/kit.tsx` (hộp `B`, máy quay `StageCam`, đường, hàng rào, nhà, cổng, lều, xe ngựa, đèn, lửa, đom đóm, giếng, thùng, chum), trong nhà ở `src/lib3/room.tsx` (mặt trời của phòng, tường cửa sổ, bàn học, bàn giáo viên, tủ, quạt trần). Sau khi chuyển, bốn ảnh mẫu dựng lại khớp từng điểm ảnh với bản trước.

Điều một người mới phải biết mà bản đầu của tài liệu này không ghi (rút từ phép thử chuyển giao, mục 9):

- **Ống kính cố định 28°** (`VIEW.fov`); cỡ của `Plate` tính theo đúng góc đó. Ở khoảng cách D chỉ thấy bề ngang khoảng 0.89 × D.
- **Máy quay luôn nhìn thẳng theo trục −z.** Các tấm vẽ đứng vuông góc với hướng đó, nên không xoay máy được; muốn nhìn chéo một căn phòng thì xoay cả nhóm bối cảnh.
- **Chỗ cho nhân vật phải tính bằng số trước khi dựng:** toàn cảnh thì người cao khoảng 42 % khung, trung cảnh thì đầu chiếm khoảng 30 % (`distanceFor` trong `look.tsx`); dùng hai công thức vị trí ở trên để biết bàn chân rơi vào đâu trên khung. Đồ vật cao 0.7 m che mất mặt sàn phía sau nó tới khoảng 1.8 lần khoảng cách của nó, nên một hàng bàn sẽ che chân người đứng sau.
- **Chữ trong cảnh** (biển, bảng, băng rôn) dùng chữ thật, đúng nghĩa, đúng ngày tháng; không dùng nét giả chữ.
- **Phẳng hay khối chia theo loại vật, không theo cỡ** (Daniel, 21/11/2026): thứ sống hoặc mềm (nhân vật, con vật, cây, hoa, đồ ăn) là hình phẳng dù cao tới đâu; thứ được làm ra, cứng, có các mặt phẳng (nhà, bàn ghế, tủ, thùng, sách) là khối.
- **Hướng của hình phẳng** (Daniel, 21/11/2026): vật đứng tự do thì quay mặt về máy; vật gắn vào một bề mặt thì nằm theo đúng mặt phẳng của bề mặt đó (cặp treo bên hông bàn quay sang bên, tranh nằm trên mặt tường, giấy nằm trên mặt bàn). Lỗi ở lớp học thử: cặp treo bên hông bàn mà mặt vẫn quay ra trước.
- **Hình phẳng phải ăn tông và độ sáng của cảnh.** `Sprite` và `Plate` hiện chưa làm việc này: ngoài trời không lộ, trong phòng thì các hình phẳng bị chói so với màu phòng.

## 7b. Nội cảnh (chốt 21/11/2026 với cảnh lớp học, Daniel: "mình thấy là đủ rồi")

Cảnh mẫu: `src/demo/Classroom.tsx` (comp `classroom-still`, ảnh `out/classroom/lop-hoc-lam-tay.png`). Nội dung do agent thử dựng, phần dưới đây là những thứ phải sửa tay mới đạt.

- **Căn phòng là hộp thật:** tường, trần, sàn là khối, để chúng tự chắn nắng và nhận vệt nắng.
- **Máy nhìn chéo vào một góc phòng** (xoay cả nhóm phòng khoảng 0.45 rad): thấy hai mặt tường, một mặt có cửa sổ chạy vào sâu, một mặt chính diện hơn. Nhìn thẳng một mặt tường thì phòng bị phẳng.
- **Các lớp trong nhà, từ xa tới gần:** cảnh ngoài cửa sổ (tấm vẽ: trời, mái nhà xa, dãy nhà đối diện, cây ngoài sân); vỏ phòng; đồ gắn tường (bảng, băng rôn, tranh, đồng hồ, tủ); bục hoặc bàn chính cùng nhân vật; các hàng bàn ghế lùi dần; mặt bàn gần nhất làm tiền cảnh. Không dùng tấm vẽ tiền cảnh trong phòng.
- **Ánh sáng buổi sáng:** phòng phải SÁNG. Một đèn nền lạnh nhạt (`hemisphereLight` cường độ khoảng 1.95) và một mặt trời ấm (cường độ khoảng 5, màu `#ffe0ae`) đặt trong toạ độ của phòng để xoay phòng thì hướng nắng không đổi. Mặt trời thấp khoảng 22°, chéo khoảng 35° về phía tường chính, để vệt nắng rơi lên tường chính, bục và sàn. Chéo quá 45° thì mỗi cửa sổ chỉ lọt một khe.
- **Hai lỗi làm phòng tối và mất nắng:** đèn nền quá thấp (phòng ra màu nâu ô liu như chiều muộn), và có vật đứng chắn đường nắng (cánh cửa chớp mở vào trong). Song cửa phải mảnh, nếu không vệt nắng vỡ thành khe.
- **Hình phẳng trong nhà tự ăn sáng của phòng** (`Sprite` tự bật `lit` khi loại cảnh là trong nhà), nhận cả bóng đổ. Vật treo trên một bề mặt dùng `rotY` để nằm theo bề mặt đó.
- **Chỗ đứng của nhân vật:** tính trước bằng công thức. Hàng bàn che chân người đứng sau nó, nên trong lớp học nhân vật đứng trên bục; dựng ảnh tĩnh với nhân vật đã đứng sẵn.
- **Chữ trong cảnh phải đúng:** bản thử ghi "Thứ Hai, ngày 21 tháng 11 năm 2026" trong khi hôm đó là thứ Bảy.

## 7c. Hạt lơ lửng (Daniel dặn 21/11/2026: "đừng quên có mấy cái chấm spark ở 1 số cảnh cần")

Một số cảnh phải có các chấm nhỏ lơ lửng, chọn theo thứ có trong cảnh, không bật sẵn cho mọi cảnh: bụi nắng trong luồng nắng qua cửa sổ, tàn lửa quanh lửa, đom đóm lúc chạng vạng, tuyết rơi, hạt màu quanh phép thuật. Chúng chuyển động trên mọi khung, nên làm ở bước chuyển động; khi dựng ảnh tĩnh phải ghi chú cảnh đó cần loại hạt nào. Bộ cũ có sẵn `Motes` trong `src/kit`; các cảnh xếp lớp mới chỉ có đom đóm đứng yên ở cảnh trại.

## 7d. Chuyển động trong cảnh (soi trên khung liên tiếp của phim mẫu, 21/11/2026)

- **Lửa:** các lưỡi lửa giữ hình, đầu lưỡi nghiêng vài điểm ảnh mỗi khung, mượt, trên mọi khung; chiều cao gần như không đổi. Cách làm: mỗi điểm của mỗi lưỡi trôi theo sóng chậm (chu kì khoảng một giây rưỡi), càng lên đầu lưỡi càng nhiều (`Flame` trong `src/demo/Camp.tsx`). Đổi hình ngẫu nhiên mỗi khung thì trông như tua nhanh. Quầng sáng của lửa vẽ TRƯỚC lưỡi lửa, nếu không nó phủ lên và làm bạc màu.
- **Tàn lửa:** vài chấm cam bay lên chậm rồi tắt.
- **Đom đóm:** trôi rất chậm (khoảng một điểm ảnh sau mười hai khung), hơi nhấp nháy.
- **Dây cờ, lều, đèn:** đứng yên; chỉ ánh lửa thở nhẹ.
- **Máy quay:** trượt hoặc đẩy rất chậm, đều tốc; các lớp tự trôi khác nhau.
- Đoạn mẫu: comp `camp-seq` (10 giây), `out/camp/trai-10-giay.mp4`.

## 8. Chưa làm

- Tư thế ngồi; đi nhìn nghiêng, đi xa dần; nhân vật áo choàng chưa dựng thử với bước chân mới.
- Lều còn là khối chóp đơn giản; thân cây đa chưa có vân vỏ; giếng và chum còn đơn giản.
- Khâu thiết kế cảnh chưa nằm trong quy trình: cả ba cảnh mẫu đều do bố cục tay.
- Hai phiếu cũ (`market`, `victor`) và `src/lib3/places.tsx` vẫn theo cách cũ, chưa chuyển sang xếp lớp.
- Nội cảnh mới có một cảnh mẫu (lớp học, mục 7b); chưa có nội cảnh ban đêm hay phòng không cửa sổ; bục giảng và tường chính của lớp học còn nằm trong file cảnh.
- Hạt lơ lửng (mục 7c): cảnh trại đã có tàn lửa và đom đóm chuyển động; lớp học chưa có bụi nắng.
- Để sau, Daniel đã đồng ý (21/11/2026): khói; bóng nhân vật lay theo lửa; lưỡi lửa ít ngọn và to bản hơn như phim mẫu; giọng đọc và nhịp diễn theo mốc thời gian thật.

## 9. Phép thử chuyển giao (21/11/2026)

Một agent mới, chỉ đọc tài liệu này, thư viện và code ba cảnh mẫu, không xem khung phim mẫu, dựng một lớp học buổi sáng (`src/demo/Classroom.tsx`, comp `classroom-still`, ảnh `out/classroom/lop-hoc.png`, 5 lượt dựng).

- **Chuyển giao được:** bố cục có chủ ý, mật độ đồ vật, dấu vết đời sống (bảng có ngày và bài học, băng rôn, bảng tin, bó hoa, bóng song cửa trên sàn), luật 12 ô, thói quen tự soi và tự chê.
- **Không chuyển giao được:** ánh sáng trong nhà (phòng ra màu nâu ô liu đều, nắng yếu) và chiều sâu trong nhà (ngoài cửa sổ chỉ hở một ô nhỏ). Lý do: tài liệu không có phần nội cảnh, agent phải tự nghĩ.
- **Bài học về cách thử:** chọn nội cảnh cho phép thử đã trộn hai câu hỏi (tài liệu có đủ không, và nội cảnh có làm được không). Muốn thử riêng tài liệu thì phải cho một chủ đề ngoài trời mới.

## 10. Phép thử hai giai đoạn (21/11/2026): ga xe lửa

Chủ đề chưa từng làm, phim mẫu không có. Hai agent mới, mức suy nghĩ vừa, chỉ đọc ba skill, thư viện và bốn ảnh mẫu.

- **Giai đoạn 1** (dựng cảnh, 5 lượt dựng): ra ảnh tĩnh `out/station/ga-xe-lua.png`, tự làm và đưa vào thư viện đầu máy, toa, đường ray, sân ga, mái che, cột tín hiệu; viết ghi chú sân khấu đủ số. Lượt soi cả khung phải sửa: đầu cậu bé chìm vào gầm tàu tối (đổi chỗ hai người), thiếu nắng chiều (thêm loại ánh sáng `lateDay` vào thư viện), chậu cây tiền cảnh to bè (bỏ). Ảnh sau khi soi: `out/station/ga-xe-lua-da-soi.png`.
- **Giai đoạn 2** (diễn xuất, 3 khung lẻ và 2 lượt video): ra `out/station/ga-9-giay.mp4` (comp `station-seq`). Agent thêm `swapArms` (chỉ tay ra sau lưng) và `LocoSmoke` (khói đầu máy). Lượt soi cả khung phải sửa ở máy: vấp chân cuối quãng đi (bàn chân giờ tới nơi cùng với thân, `footwork` trong `src/mould/act.ts`).
- **Kết luận:** quy trình hai giai đoạn chạy được; lượt soi cả khung sau mỗi giai đoạn vẫn cần. Các chỗ thiếu hai agent chỉ ra đã đưa vào ba skill.
- **Còn thiếu ở bộ khuôn** (lộ ra ở cảnh này): quay đầu, gật đầu riêng, vung tay khi đi, đi nhìn nghiêng, mũ và đồng phục, nét mặt giữa mỉm cười và vui.
