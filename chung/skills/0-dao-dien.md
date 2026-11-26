# Skill 0: đạo diễn (cutout3d)

> Sửa luật trong skill này chỉ khi Daniel đã xác nhận đúng thay đổi đó (luật 25a); sửa xong thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Agent không sửa skill: thấy thiếu hay sai thì ghi vào báo cáo.
> Ai làm việc gì, file nào của ai, cổng kiểm nào phải qua: `skills/4-quy-trinh.md`.
> Trước khi nghĩ bối cảnh mới, mở `assets/DANH-MUC.md` (hoặc `python3 tools/kho.py tim <từ>`): bối cảnh, nhân vật, nét mặt, tư thế và hiệu ứng đã có đều nằm trong kho, kèm ảnh. Ghi trong danh sách cảnh quay món nào lấy từ kho (theo id) và món nào phải làm mới.

Dùng khi có **lời đọc** và phải quyết định **quay gì**: chia lời thành các cảnh quay, nghĩ ra hình cho từng cảnh, chọn cỡ cảnh, đường máy, hiệu ứng. Kết quả là một **danh sách cảnh quay** để người duyệt đọc trước khi dựng bất cứ thứ gì; sau đó mỗi bối cảnh đi qua skill 1 (dựng cảnh) và skill 3 (diễn xuất).

Các con số dưới đây đếm trên toàn bộ phim mẫu (674 cảnh quay, 731 bản ghi; `out/deep/synth/_camera-cuts.txt`, `out/deep/stats.jsonl`).

## Cảnh mở đầu phải cho thấy ngay nhân vật người xem tìm tới

Video mẫu mở bằng hình ảnh quen nhất của nhân vật nên người xem biết ngay là ai; mở bằng một hình chưa nhận ra thì người xem bỏ qua. Nguyên văn lời Daniel và ví dụ: `ghi-chu.md` của kênh phim-tv, mục "Cảnh mở của tập Doom".

- Khung hình đầu tiên phải là hình ảnh dễ nhận ra nhất của nhân vật hoặc đề tài mà tên video hứa (bộ đồ, gương mặt, vật gắn liền với nhân vật). Người xem bấm vào vì hình ảnh đó; vài giây đầu không thấy nó là họ bỏ.
- **Lời mở chưa chắc đã xướng tên ngay.** Có tập chủ kênh muốn kể trước một việc kinh khủng hoặc lạ mà nhân vật làm (hình thì đã cho thấy nhân vật), rồi mới xướng tên như một cú chốt; có tập xướng tên ngay cũng được. Mỗi tập đưa Daniel hai cách mở (xướng tên ngay, hoặc kể việc trước rồi mới xướng tên) để ông chọn theo cảm nhận; đừng tự áp một kiểu.
- Muốn khác video mẫu thì đổi tình huống và câu hỏi của cảnh mở, KHÔNG đổi việc cho thấy nhân vật ngay. Mở bằng một cảnh mà nhân vật chưa mang hình dáng quen thuộc (một sinh viên trong phòng thí nghiệm, một đứa trẻ trong lều) là sai, dù cảnh đó hay.
- Áp cho cả kịch bản lẫn danh sách cảnh quay: dàn ý phải ghi rõ khung đầu tiên cho thấy gì.

## Nhịp cắt

- Trung bình khoảng 2 giây một cảnh quay (trung vị 45 khung; 80 % nằm trong khoảng 30–77 khung). 30 giây lời đọc là khoảng 14–16 cảnh quay.
- Cảnh chèn đồ hoạ có nhiều thứ bật ra lần lượt thì dài hơn (tới 5–6 giây).
- Một mệnh đề của lời đọc thường là một cảnh quay; câu dài thì hai ba cảnh.

## Nghĩ hình cho từng câu

Mỗi cảnh quay chỉ mang MỘT ý, và phải là hình của chính điều đang được nói. Các cách họ dùng:

- **Cho thấy lý do, không chỉ sự việc.** "Để tìm lại mẹ" là tấm ảnh người mẹ trên bàn, không phải thêm một cảnh nhân vật đứng nói.
- **Chèn đồ vật:** cận một vật mang ý (cái mặt nạ đang đỏ lửa, tấm bia, lá thư).
- **Chèn đồ hoạ cho điều trừu tượng:** danh sách có dấu tích bật ra lần lượt, bản vẽ có vòng đỏ khoanh chỗ sai, đường đi trên bản đồ hoặc quả địa cầu cho một chuyến đi.
- **Giấu rồi lộ bằng đảo góc:** nhân vật quay lưng làm một việc (đeo mặt nạ), cắt sang góc đối diện là lộ kết quả.
- **Cảnh phản ứng:** sau một hành động chính, cắt sang những người đang nhìn.
- **Ẩn dụ và trò vui bằng hình:** bong bóng suy nghĩ, ngã cứng đơ như tấm ván, nhảy trước tới tương lai một cảnh.
- **Điều ở xa kể bằng chi tiết nhỏ trong nền:** đoàn người cầm đuốc trên sườn núi xa.
- Đổi nơi chốn rất nhanh: gần như mỗi mệnh đề một nơi, có khi một nơi chỉ xuất hiện một cảnh quay.

## Cỡ cảnh

- Khoảng một nửa là toàn cảnh (thấy cả người), một phần ba là các cỡ trung (từ đầu gối hoặc thắt lưng trở lên), cận mặt ít (46 cảnh) và dành cho lúc cảm xúc đổi; chèn đồ vật và đồ hoạ khoảng một hai cảnh trong mỗi mười cảnh.
- Chuỗi quen: toàn cảnh mở nơi chốn, trung cảnh hai người, chèn đồ vật, đảo góc hoặc phản ứng, quay lại toàn cảnh.
- Không để hai cảnh liền nhau cùng cỡ và cùng góc; phần lớn chỗ cắt là đổi cỡ (256 lần) hoặc đảo góc (92 lần).
- Chỉ làm mờ nền khi cảnh tập trung vào MỘT chủ thể chính (cận hoặc trung cảnh một người); cảnh hai người và cảnh rộng thì nét hết.
- Một bối cảnh được quay từ nhiều vị trí (lò rèn: 7 cảnh quay từ 5 vị trí). Dựng một bối cảnh rồi quay nhiều kiểu là cách tiết kiệm công; ghi rõ cảnh quay nào dùng lại bối cảnh nào.

## Máy quay

- Gần như luôn chuyển động, nhưng rất nhẹ và đều tốc từ khung đầu tới chỗ cắt: đẩy vào (272) hoặc kéo ra (211), phần lớn dưới 3 %; trượt ngang (156) 1–5 % bề ngang; lên xuống (140). Mỗi cảnh chọn một kiểu máy có tên của `lib3/kieuMay` (truot, day, keo, luon, theo, nang/ha, day-lia, vong), ghi trong danh sách cảnh.
- Đẩy vào khi sự chú ý dồn về một người hoặc một vật; kéo ra khi mở ra bối cảnh hoặc sự cô độc; trượt ngang cho cảnh hai người và cảnh có tiền cảnh.
- Rung máy chỉ khi va chạm, nổ, cú áp (10 cảnh): ngắn, và dừng hẳn ở chỗ cắt. Riêng mấy giây đầu của cả video thì không rung.
- Không lia nhanh trong cảnh (lia vụt chỉ ở chuyển cảnh `lia-nhanh`), không đổi nét giữa cảnh.

## Chuyển cảnh và hiệu ứng (bộ 18 kiểu có tên)

- Mặc định vẫn là cắt thẳng. Mỗi chương 2–3 chỗ chuyển cảnh có lý do trong truyện và 1–2 chỗ cắt nối động tác (`noi: 'dong-tac'`: bước, vung tay, quay người chạy qua chỗ cắt, cảnh sau vào giữa động tác) hoặc nối hướng nhìn (`noi: 'nhin'`: người quay nhìn, cảnh sau là thứ ấy).
- Danh sách cảnh có cột "vào bằng": ghi tên kiểu ở chỗ cắt không phải cắt thẳng, kèm tham số chính (ô cửa nào, mắt ai, vật gì lướt qua).
- Chọn kiểu theo lý do (bảng đầy đủ, tham số ở đầu `chung/src/lib3/chuyenCanh.tsx`):
  - đổi nơi, đổi giờ trong cùng mạch kể: `gat-vat` (thân cây, cột, bóng người, mảng giấy lướt sát máy), `lia-nhanh` (hai nơi trong cùng một câu), `ngoc-troi` (ngoài trời, ngước lên trời rồi hạ xuống nơi mới);
  - ngoài nhìn vào phòng, chung sang riêng: `lao-cua` (máy lao vào ô cửa sổ, cảnh trong phòng nở ra từ ô kính); ngược lại, từ trong ra ngoài: `lui-cua`;
  - thời gian trôi ở cùng một nơi: `hoa-hinh`;
  - nhớ lại, tưởng tượng, nhìn thấy điều gì: `vao-mat` (máy lao vào mắt, con ngươi phản chiếu cảnh sau); ngất, ngủ, tỉnh dậy: `nham-mat`;
  - đổi nhịp mạnh từ một người sang nơi khác: `vao-bong`;
  - sau nổ, trận đánh, bão: `khoi-phu`; va chạm, loé sáng, ký ức ập về: `chop-trang`;
  - sang chương, sang kỷ niệm, chuyện "trên giấy": `lat-giay`; hết chương, cái chết, khoảng lặng dài: `ra-den`;
  - hai vật cùng dáng ở hai nơi, hai thời: `khop-hinh`; đổi nước, đổi châu lục: `bay-dia-cau`; nối hai nơi bằng một đồ vật (thư, bóng, tờ giấy) bay qua: `theo-vat`.
- **Chống lạm dụng:**
  - Không ghi được lý do trong truyện thì cắt thẳng. Cột "vào bằng" ghi tên kiểu kèm lý do, vd "`lao-cua`: từ ngoài sân vào phòng thí nghiệm"; trong code là trường `vi` của cảnh.
  - Hai cảnh cùng nơi, cùng lúc, hành động liền nhau: không chuyển cảnh, chỉ cắt thẳng hoặc nối động tác.
  - Cảnh TRƯỚC phải thật sự có thứ kiểu đó cần: `lao-cua`/`lui-cua` có ô cửa thấy rõ, rộng từ khoảng 1/6 khung; `vao-mat` là cận mặt của chính người đang nhớ hay đang nhìn; `nham-mat` nhân vật thật sự nhắm mắt, ngất, ngủ; `chop-trang` có va chạm hay loé sáng thật; `khoi-phu` có nổ, khói, bão; `khop-hinh` hai cảnh có hai vật cùng dáng; `theo-vat` đồ vật có trong truyện; `bay-dia-cau` đổi nước hoặc châu lục; `gat-vat` vật lướt qua có ở nơi đó (cây ngoài trời, cột trong sảnh).
  - Giữa hai chỗ chuyển cảnh ít nhất 3 chỗ cắt thẳng. Một kiểu không dùng hai lần trong một chương. Mỗi chương một kiểu mạnh (`vao-mat`, `chop-trang`, `khoi-phu`, `bay-dia-cau`, `lat-giay`, `ra-den`). `vao-mat` và `bay-dia-cau` mỗi kiểu không quá 2 lần cả tập.
  - `python3 tools/kiem_canh.py <file ghép chương>` báo LOI khi vượt các số trên, CANH khi chuyển cảnh thiếu lý do.
- Mạch máy: một chuỗi cảnh cùng nơi giữ MỘT hướng trôi, chỉ đổi hướng ở nhịp truyện (người mới vào, tin dữ, đổi phe).
- Không thêm wipe kỹ thuật số (tròn, sao, kẻ ô) và không thêm tiếng vút ở chỗ chuyển.
- Còn yếu (25/11): `lao-cua`, `lui-cua` nhoè khi ô cửa nhỏ, chọn ô cửa chiếm từ khoảng 1/6 bề ngang khung; `vao-mat` cần toạ độ mắt theo từng khung khi đầu cử động (`mat` nhận dãy); `chop-trang` là mảng trắng phẳng.
- Hành động thường đã chạy từ khung đầu của cảnh quay; tư thế nối qua chỗ cắt.
- Hiệu ứng là điểm nhấn của một cảnh quay, không phải nền của mọi cảnh: ánh sáng đổi màu hắt lên mặt, chớp trắng vài khung, vật bật ra có nảy, hạt theo thứ có trong cảnh. Một cảnh hiệu ứng lớn (vụ nổ, cánh cửa mở) nên có một cảnh phản ứng đi kèm.

## Khoảng cách và cỡ người

- Mỗi cảnh quay tự chọn độ gần theo thứ nó cần cho thấy; không có một khoảng cách hay một cỡ người chuẩn.
- Không ghi "thấy trọn toà nhà" làm yêu cầu của một cảnh có người; yêu cầu đó đẩy máy ra xa và làm người nhỏ đi.
- Ghi rõ khoảng giữa người và nền có gì; khoảng giữa trống là lỗi.
- **Mỗi bối cảnh phải có sơ đồ vị trí** (cái gì nằm ở đâu, cổng dẫn đi đâu), và phải kiểm các cảnh quay trên cùng bối cảnh có đòi khoảng cách máy trái nhau không.
- Con số đo trên một cảnh của phim mẫu chỉ là ví dụ cho cảnh đó, không chép thành luật.

## Giữ mạch

- Ai ở bên trái khung thì ở lại bên trái qua các cảnh quay của cùng một nơi; đảo bên chỉ khi đảo góc có chủ ý.
- Cùng một bối cảnh ở giờ khác trong ngày là một biến thể của bối cảnh đó, không dựng mới.
- Trong 15 cảnh quay nên có: ít nhất một cảnh mở nơi chốn, hai ba cảnh cận mặt ở chỗ cảm xúc đổi, một hai cảnh chèn, và không quá ba cảnh liền nhau có nhân vật chỉ đứng nói.

## Soát danh sách trước khi giao: trục, khung, nhịp

- **Trục giữa hai người.** Trong một cảnh có hai người nói với nhau, mọi máy quay đứng cùng một phía của đường nối hai người. Lấy sơ đồ vị trí của bối cảnh, xác định ở từng máy ai nằm bên trái khung, ai bên phải, rồi mới ghi hướng nhìn. Ghi hướng nhìn theo MÀN HÌNH ("nhìn sang trái khung"), không ghi theo nhân vật.
- **Cận mặt: chừa chỗ ở phía người đó nhìn.** Nhìn sang trái thì đầu nằm lệch phải khung. Nền sau đầu phải khác sắc độ với tóc, soát cả khung đầu lẫn khung cuối của đường máy.
- **Cỡ cảnh ghi bằng thứ thấy trong khung** (mục "Cỡ cảnh và tầm tay" bên dưới). Đầu của bộ khuôn bằng khoảng 36 % chiều cao người; người đứng sau bàn thì chỉ còn thấy đầu và cổ áo.
- **Ống kính không cúi.** Vật nằm phẳng trên mặt bàn chỉ hiện thành một dải mỏng, không quay "từ trên xuống" được. Cảnh chèn đồ vật nên chọn vật ĐỨNG (khung ảnh, tờ giấy ghim trên tường, cái chai) hoặc dựng riêng một mặt phẳng cho cảnh chèn.
- **Ánh sáng phải khả thi trong bối cảnh.** Bóng của người do engine tự vẽ (skill 1, mục Bóng), danh sách cảnh không cần ghi. Bóng của đồ vật lên tường, lên sàn thì đèn của cảnh phải tới được mặt nhận.
- **Nhịp trong một cảnh phải cộng lại vừa số khung.** Ghi rõ khung thừa dồn vào đâu (giữ ở cuối, hay chờ ở đầu). Một động tác "ở khung 18" và "cắt đúng lúc vung hết tay" trong cảnh 38 khung là hai yêu cầu trái nhau.
- **Đừng ghi "bước hai bước".** Ghi người đó dừng ở đâu và sau đầu họ là gì; số bước để khâu diễn xuất tính.
- **Vật là chủ thể của cảnh chèn phải được chiếu sáng riêng.** Tấm ảnh quay lưng với đèn bàn ra màu xám; phải thêm một chút sáng ấm hắt lại.
- **Tính khung cho từng động tác ngay khi viết danh sách:** một động tác tay lớn cần khoảng 14 khung; "khung 6 vươn tay, khung 16 kéo mạnh" là không đủ chỗ.
- **Đừng hứa thứ hệ thống chưa làm được:** mặt người đổi màu nhờ ánh sáng của bối cảnh (người vẽ đúng màu riêng, chỉ ngả rất nhẹ theo màu của cảnh), bàn tay nhìn rõ từ sau lưng. Người đứng sát một HIỆU ỨNG (phép, cổng, lửa lớn) cần ánh màu hắt lên thì ghi rõ trong danh sách cảnh, người dựng đặt `anMau` cho người đó. Viền sáng một bên đã có (`rim`, skill 3).
- **Khi hai yêu cầu của một cảnh trái nhau, ghi cái nào quan trọng hơn** ("nền tối" hay "ánh máy đủ mạnh để nhuộm màu người").
- **Cảnh đảo góc trong một bối cảnh hở mặt trước cần có nền:** ghi rõ là dựng thêm bức tường thứ tư hay lấp bằng khói.
- **Vật nhỏ mang ý nghĩa** (khung ảnh ở tiền cảnh của toàn cảnh) chỉ cao vài chục điểm ảnh; nếu nó là ý chính thì phải có một cảnh chèn riêng.

## Cảnh phô diễn hiệu ứng

- **Cảnh hiệu ứng lớn dài gấp rưỡi tới gấp đôi cảnh thường** (phim mẫu: bốn cảnh cổng dài 50–90 khung, cảnh thường 44 khung; mới bốn cảnh nên chỉ để định hướng, chưa thành luật có số).
- **Nhịp của một cảnh phô diễn:** hành động kích hoạt xảy ra SỚM (gạt cần ở khoảng khung 16 đến 20), phần còn lại của cảnh là hiệu ứng lớn dần theo từng lớp rồi GIỮ lâu cho người xem ngắm. Đừng dồn cả hiệu ứng vào một giây.
- **Xếp lớp hiệu ứng như xếp lớp nền:** mỗi hiệu ứng lớn gồm nhiều thứ chạy cùng lúc ở các tốc độ khác nhau. Cổng trong phim mẫu: đèn đầu cực bật trên một khung, sét bò quanh vòng, viền là các dải sáng xoay, lửa đổi hình mỗi một hai khung, tàn lửa, giấy bay, bụi trắng khắp khung, ánh sáng cả phòng đổi màu.
- **Cánh cửa sang nơi khác:** mặc định là VÒNG XOÁY XANH (`Portal` không truyền `inside`; Daniel chọn 22/11/2026). Kiểu cửa sổ nhìn vào một khung cảnh có chiều sâu chỉ dùng khi Daniel yêu cầu.
- **Người hiện ra trong cửa sáng là một CÁI BÓNG có dáng của nhân vật mình** (đầu to, thân nhỏ, đúng tỉ lệ bộ khuôn), không rõ mặt: dùng nhân vật của bộ khuôn (`Puppet3`, `lit={false}`) với `tint` gần đen. Không vẽ tay bóng theo tỉ lệ người thật; không để nhân vật rõ mặt đủ màu.
- **Vụ nổ theo kiểu phim mẫu là đồ hoạ phẳng:** hình sao nhiều cánh (kem trên cam) phình ra rồi co lại trong khoảng chín khung, mây khói là các cụm tròn phẳng hai sắc văng ra và nhỏ dần tới mất, mảnh vỡ bay vài khung; sau vụ nổ căn phòng TỐI hơn trước.
- Thời lượng của danh sách cảnh quay phải chừa chỗ cho các cảnh này: lời đọc ngừng, để nhạc và tiếng động dẫn.

## Viết danh sách đúng với ống kính và bộ khuôn

- **Trước khi viết, đọc thêm:** dòng "Chưa có" của skill 3 (bộ khuôn chưa làm được gì) và mục Máy quay và chỗ đứng của skill 1 (ống kính chỉ nhìn ngang về một hướng).
- **Tính khung bằng công thức của skill 1, đừng ước bằng mắt người thật:**
  - Ở cách máy D mét, khung cao 0,4986 × D và rộng 0,887 × D. Máy ngang tầm mắt cách tường 8 m chỉ thấy khoảng 4 m tường: không thể đòi thấy tầng ba.
  - Máy đặt cao h mét thì mép dưới khung chạm đất ở cách máy h / 0,2493 mét. Người đứng gần hơn mức đó nằm dưới khung.
  - Mỗi vật được kể tên trong một cảnh phải được kiểm là lọt khung từ đúng chỗ đặt máy của cảnh đó.
  - Muốn sau đầu là trời thì máy phải thấp hơn đầu; máy ngang vai thì sau đầu là chân nhà.
  - Vật đứng thẳng (cột đèn, cột nhà) không được nằm trên đường nhìn từ máy tới đầu nhân vật.
- **Sơ đồ vị trí viết bằng chữ có toạ độ mét** theo trục của máy quay sân khấu (x sang phải, z âm là vào sâu). Mặt nào cần quay chính diện thì phải quay về phía máy; ngoài trời chưa có cách quay đảo góc.
- **Tầm tay theo bộ khuôn, không theo người thật:** đầu to nên vai chỉ ở khoảng 60 % chiều cao. Xem bảng tầm tay ở skill 3 trước khi viết "tay nắm cần gạt".
- **Quy lời đọc ra khung khi chưa có giọng:** khoảng 6 khung cho một tiếng (4,1 tiếng một giây); ghi rõ là số ước, sẽ chỉnh khi có giọng.
- **Đường máy ghi rõ phần trăm của cái gì:** đẩy vào, kéo ra tính theo khoảng cách tới chủ thể; trượt ngang tính theo bề ngang khung ở chỗ chủ thể.
- **Tham số của đồ vật ghi bằng đơn vị thật của nó** (số cuộn dây sáng, không phải "0,3").
- **Đừng treo nhịp diễn vào đám đông quay lưng** (ngẩng đầu, giơ tay reo): nhìn từ sau chỉ thấy đĩa tóc.
- **Dùng lại bối cảnh của đoạn khác:** ghi những đồ riêng của đoạn kia còn nằm trong đó và cách che; mốc đứng chỉ đúng ở trạng thái đã được kiểm.
- **Món đồ hoạ dùng ở nhiều bối cảnh** (bản đồ, đường sóng): ghi rõ ai làm, làm một lần, đặt ở đâu.
- **Lời đọc chưa kiểm nguồn:** hình không được thêm dữ kiện mà lời chưa kiểm (tên thị trấn, con số, đường dây thật).
- **Trang phục phải đúng thời và đúng người.** Áo choàng dài cổ lông (dân quê, người già trong thế giới cổ của đoạn Doom) KHÔNG thay được cho áo vét, áo khoác có ve của quý ông thế kỉ 19 hay người thời nay. Thiếu bộ đồ đúng (bộ khuôn có gì: skill 3) thì ghi vào "khâu thực hiện chưa làm được" và yêu cầu bổ sung bộ khuôn trước khi dựng; đừng lấy áo choàng mặc tạm.
- **Cỡ cảnh đầu đoạn đừng ba toàn cảnh liền nhau;** cận mặt đừng ở mức tối thiểu.
- **Mốc đứng ghi riêng cho từng cảnh quay có góc máy khác.** Ống kính chỉ nhìn thẳng, không xoay, không cúi; một bộ mốc chung cho cả bối cảnh không cho ra được "qua vai" hay "hai người đứng sau lưng". Với mỗi cảnh, tính bằng phép chiếu xem từng người rơi vào đâu trong khung trước khi ghi mốc.
- **"Thấy qua vai" một vật thấp:** máy ngang tầm 1,45 tới 1,75 m thì đường nhìn tới vật thấp (mặt đe 0,9 m) đi ngang vai người đứng gần máy. Vật phải lệch hẳn sang bên so với thân người đó, và người thứ ba đứng ở phía còn lại.
- **Thứ máy phải "đi vào" (cửa sổ, cửa) phải nằm trên tường đối diện máy,** không nằm trên tường bên.
- **Vật che người:** đã đặt một vật to giữa máy và nhân vật (cái đe) thì đừng ghi cảnh "toàn thân" ở chỗ đó; cho nhân vật bước ra cạnh vật.
- **Hiệu ứng chưa có trong kho thì ghi luôn cách thay,** đừng hứa suông ("hơi nóng rung không khí" chưa có; thay bằng tàn lửa và chấm sáng bay lên).
- **Người xem phụ ở cận cảnh** không lùi xa được hơn tường sau lưng nhân vật chính: họ sẽ to gần bằng đầu nhân vật chính và chia sự chú ý. Hoặc bỏ họ khỏi cận cảnh, hoặc chấp nhận họ ở mép khung, mờ.

## Người trong khung phải diễn nhiều hơn

Danh sách cảnh phải ghi diễn cho MỌI người trong khung, không chỉ người đang được lời nhắc tới: mỗi người ít nhất hai ba nhịp trong một cảnh (việc đang làm, phản ứng với điều vừa xảy ra, cái nhìn sang người khác), lệch nhịp nhau. Đám đông phải phản ứng đúng với việc xảy ra (bị đuổi thì hoảng: lùi, che, nấp, đánh rơi đồ; được giúp thì tiến lại, nắm tay, cười). Một cảnh mà mọi người đứng yên, chỉ một người cử động, là thiếu.

## Khi nhiều đạo diễn viết song song các chương của một tập

- Mỗi chương một file `../kenh/<kênh>/tap/<tập>/<mã chương>-danh-sach-canh.md`. Đọc danh sách của các chương đã viết xong (người điều phối ghi tên trong lời giao) để nối cảnh, giữ trục và dùng lại bối cảnh.
- **Dùng lại trước, dựng mới sau.** Bối cảnh đã dựng và đã được chủ kênh duyệt thì dùng lại, cần khác đi thì xin thêm một TRẠNG THÁI (đổi giờ trong ngày, màu, cờ, đồ đạc), không tả một bối cảnh mới na ná. Tra kho (`assets/DANH-MUC.md`) trước khi đòi món mới.
- Bối cảnh mới đặt tên theo nơi chốn trong chuyện (ví dụ "phòng thí nghiệm ở đại học", "tu viện Tây Tạng: sân"), vì đạo diễn chương khác có thể cũng cần chính nơi đó; người điều phối sẽ gộp các bối cảnh trùng nơi.
- Cuối file phải có bảng **"Cần làm mới"** ba phần: bối cảnh mới (tên nơi, dùng ở cảnh nào, chương nào khác trong kịch bản có thể dùng lại), thứ bộ khuôn còn thiếu (theo dòng "Chưa có" của skill 3), món kho còn thiếu. Và mục **"Để chủ kênh chọn"** nếu có chỗ phải quyết.
- Nhân vật có trong phiếu ngoại hình thì theo phiếu; nhân vật đã có trong dàn nhân vật của kênh (`../kenh/<kênh>/cast/`) hoặc đã được danh sách chương trước đặt tên thì dùng đúng tên đó.

## Mẫu danh sách cảnh quay

Mô tả phải chi tiết, **theo các lớp**, và nhân vật phải có **mặt và hành động**. Một dòng tóm tắt cho mỗi cảnh là không đủ để duyệt.

Viết theo thứ tự:

1. **Nhân vật** của đoạn: ngoại hình, trang phục, thay đổi theo thời gian (vết sẹo, áo ám khói). Nhân vật có thật hoặc đã có hình ở nơi khác thì ngoại hình (dáng mặt, tóc, râu, dáng người, bộ đồ quen thuộc) phải lấy từ phiếu ngoại hình `../kenh/<kênh>/cast/<ma>-nhan-vat.md`, không tự đặt; thiếu phiếu thì yêu cầu người điều phối cung cấp trước khi viết.
2. **Mỗi bối cảnh một lần, theo các lớp từ xa tới gần** (trời, rất xa, xa, mốc cảnh, tầm giữa, người ở xa, tiền cảnh; trong nhà: ngoài cửa sổ, vỏ phòng, trên tường, tầm giữa, vật chính, tiền cảnh), kèm ánh sáng và các biến thể (giờ trong ngày, trước và sau một biến cố).
3. **Từng cảnh quay**, mỗi cảnh một khối:

```
### số. "lời đọc" (số khung) cỡ cảnh, bối cảnh (giờ)
- Khung: máy đứng ở đâu, cái gì nằm ở đâu trong khung, đường dẫn mắt.
- Lớp: những gì thấy được ở cảnh quay này, từ xa tới gần (chỉ ghi phần lọt vào khung và phần khác với mô tả bối cảnh).
- Nhân vật: ai, đứng đâu, cao bao nhiêu phần khung. Mặt: mày, mắt (nhìn đâu), miệng. Hành động: việc gì ở khung nào.
- Máy quay: kiểu đi và bao nhiêu phần trăm. Hiệu ứng, hạt: cái gì, bắt đầu khung nào, diễn ra thế nào.
```

4. Cuối cùng: **những thứ khâu thực hiện chưa làm được**, và những chỗ danh sách đã phải tránh vì giới hạn của bộ khuôn.

Bản mẫu đầy đủ: danh sách cảnh `doom-dai-hoc-danh-sach-canh.md` trong `tap/doom-1/` của kênh phim-tv.

## Tự soát danh sách

- Đọc riêng cột "thấy gì": có kể được câu chuyện mà không cần lời không?
- Có cảnh quay nào chỉ là "nhân vật đứng nói câu đó" không? Thay bằng hình của điều được nói.
- Nhịp: tổng thời lượng khớp lời đọc; không cảnh nào quá 4 giây trừ cảnh chèn đồ hoạ.
- Cỡ cảnh có xen kẽ không; có cận mặt ở đúng chỗ cảm xúc đổi không.
- Số bối cảnh phải dựng có hợp với công sức không (một bối cảnh nên được quay ít nhất hai ba kiểu).

## Độ sáng: cảnh tối phải ít và ngắn

Video mẫu sáng trung bình 112 (đo bằng `tools/do_sang.py`, 718 khung), chỉ 8 % số khung dưới 70, quãng tối liền dài nhất 8 giây trên 24 phút.

- **Chọn giờ và nơi cho sáng trước.** Lời đọc không nói "đêm" thì cảnh là ban ngày, chiều muộn hoặc chạng vạng còn sáng. Chuyện buồn, chuyện dữ không cần trời tối: mẫu kể phần lớn chuyện dữ giữa ban ngày.
- **Không xếp hai cảnh tối liền nhau quá 8 giây.** Sau một quãng tối phải có cảnh sáng (ngoài trời ngày, phòng sáng, bản đồ, tờ giấy, cận mặt có nguồn sáng lớn).
- **Trong một chương, cảnh thuộc loại tối (đêm, trong nhà tối, hầm, cõi lửa) không quá một phần tư thời lượng**, trừ khi lời đọc buộc; khi buộc thì ghi rõ trong danh sách và dùng "đêm sáng" (trăng to, tuyết, lửa lớn, cửa sáng chiếm mảng lớn).
- Mỗi cảnh trong danh sách ghi loại sáng: `ngày`, `chiều`, `chạng vạng`, `đêm sáng`, `trong nhà sáng`, `trong nhà tối`. Cuối danh sách có một dòng đếm: bao nhiêu giây thuộc loại tối, quãng tối liền dài nhất.

## Nhân vật khổng lồ phải áp đảo khung

Ở mẫu, "lực" của một nhân vật khổng lồ đến từ bốn thứ; ghi cả bốn vào danh sách cảnh:
- **Kích cỡ trong khung:** lúc xuất hiện nó cao khoảng ba phần tư khung, sải tay hơn nửa bề ngang; cận mặt thì cái đầu lấp khung (sừng trải khoảng 60% bề ngang).
- **Người đứng cạnh bé tí:** người thường chỉ cao khoảng một phần tám khung, đứng dưới chân nó; máy đặt thấp nhìn lên.
- **Hình dáng có góc cạnh và nhiều mảng:** mặt cắt góc vài mặt phẳng, sừng dày, răng nhọn, vuốt có đốt, ngực có hoạ tiết, sau lưng có mảng toả ra; không phải một khối trơn.
- **Phần tự sáng tương phản với thân sẫm:** mắt, lòng miệng, vết nứt trên ngực sáng vàng cam trên thân đỏ sẫm; nền quanh nó vẫn sáng và đậm màu (xem mục Độ sáng).
Trước khi gửi chủ kênh, đặt ảnh của mình cạnh khung mẫu cùng cỡ.
- **Khi diễn nó phải sống động:** thân thở và lửa quanh thân luôn chạy; đầu cúi, nghiêng, mắt nheo, hàm mở khi cười; tay có nhiều nhịp và ngón động riêng; cả cảnh phản ứng theo nó (đất nứt, lửa bùng, áo tóc người bị thổi, rung máy lúc nó cười hoặc đập). Ít nhất ba nhịp riêng cho nó trong mỗi cảnh; món phải có đủ tham số để diễn các nhịp đó.
- **Học cách làm, không chép tạo hình và bố cục:** cỡ trong khung, máy thấp, nền nhiều lớp, tương phản sáng–sẫm là cách làm, dùng được. Tạo hình riêng của nhân vật (kiểu sừng, hoạ tiết ngực), bộ đồ vật và cách xếp khung của một cảnh cụ thể ở mẫu thì không chép: nhân vật có nguồn gốc (truyện tranh, lịch sử) thì vẽ theo nguồn gốc, cảnh thì tự xếp.

## Cỡ cảnh và tầm tay: ghi theo thứ làm được

- **Cỡ cảnh ghi bằng thứ thấy trong khung**, không bằng phần trăm đầu: "thấy từ thắt lưng lên", "thấy cả người tới chân", "mặt lấp khung". Với bộ khuôn này (đầu to), "đầu cao 30% khung" đã là thấy cả người.
- **Hai người chạm nhau thì ghi chiều cao hai người và điểm chạm**; người diễn tính tay bằng hàm tính tay (đừng ghi số góc vai, khuỷu trong danh sách). Người lớn 1,7 m đứng thẳng không với tay tới đỉnh đầu một đứa bé 0,95 m đứng sát mình mà vẫn đẹp: cho cúi, quỳ, hoặc đặt tay lên vai.
- **Kiểm tầm nhìn trước khi đặt đồ vào một điểm của bối cảnh:** vật treo ở cột giữa vách, sau cọc, sau cột giường có thể không góc máy nào thấy. Ghi "phải thấy trong khung" để người dựng cảnh dời vật.
- **Một cảnh chỉ có một giờ:** khi sửa giờ ở một mục cuối file thì sửa luôn dòng tiêu đề của cảnh, đừng để hai mục cho hai giờ.

## Chỗ cắt rơi vào ranh giới tiếng

Số khung tính từ mốc TIẾNG, không từ mốc câu (tính theo câu thì chỗ cắt lệch giọng thật 8–20 khung). Khi chia khung cho các cảnh:
- Lấy mốc từng tiếng trong `voice/ch-NN.timing.json` của tập, không chỉ mốc đầu và cuối câu.
- Mỗi chỗ cắt đặt vào khoảng lặng giữa hai tiếng, ngay trước tiếng đầu tiên mà cảnh sau minh hoạ; không cắt giữa một từ ghép.
- Hình của một ý phải có mặt khi tiếng của ý đó vang lên: chữ tự viết, nhãn, con dấu bật đúng lúc lời đọc tới chữ ấy.
- Người diễn xuất thấy chỗ cắt lệch quá 6 khung thì báo người điều phối để dời, không lặng lẽ giữ số khung.

## Cảnh giấy, quả địa cầu, lớn lên, độ nhanh

- **Hình phẳng chèn (tờ báo, thư, trang sổ, bảng điểm, bong bóng nghĩ) là món hiếm:** nhiều nhất hai cảnh trong một chương, không đặt hai cảnh liền nhau. Video mẫu kể bằng người diễn ở một nơi (người ta bàn tán, một người nghe tin, người của trường tới tận trại mời): tin đồn, lời mời, kế hoạch, "giỏi nhất" phải có người làm ra điều đó trong khung. Tiếc công dựng bối cảnh thì dùng lại bối cảnh có sẵn với người mới, đừng thay người bằng giấy.
- **Chuyện địa lý dùng quả địa cầu, không dùng bản đồ giấy:** Trái Đất tròn giữa trời sao, quay tới nơi cần chỉ; sóng lan, đường chấm, con tàu đi trên mặt cầu (`src/lib3/kitDiaCau.tsx`). Cảnh quả cầu dài ít nhất 60 khung; thứ đi trên cầu đi chậm và đều.
- **Nhân vật lớn lên thì biến đổi ngay trong một cảnh liền,** không cắt sang một người khác cao hơn: dùng `src/mould/LonLen.tsx` với 3 hoặc 4 nấc tuổi và `faceTo` (đường viền mặt chuyển dần), cùng tư thế, kiểu tóc và kiểu áo ở mọi nấc, kèm dấu hiệu thời gian trôi trong bối cảnh (nắng quét, đồ vật lớn dần). Quãng biến đổi ít nhất 40 khung, không che bằng loé trắng.
- **Độ nhanh:** không cảnh nào dưới 44 khung; mỗi cảnh một việc chính và việc đó xong ít nhất 10 khung trước chỗ cắt; một câu lời đọc không chia quá hai cảnh; khi dời chỗ cắt về ranh giới tiếng mà một cảnh tụt dưới 44 khung thì gộp nó vào cảnh bên cạnh. (Daniel chỉ nói "diễn ra bị nhanh quá"; việc cái nhanh nằm ở chỗ nhồi trong cảnh và ở các cảnh chèn lướt qua là suy diễn của người điều phối.)
- **Nhân vật nữ phải đọc ra là nữ ở cỡ trung cảnh:** phiếu ngoại hình ghi `lashes`, `lips`, `blush`, `sideLocks`, `faceShape: 'oval'` hoặc dáng mặt riêng (skill 3), và cho cô ít nhất một cận mặt.

## Bóng người vẽ lên rèm, lên vách

Bóng của một người, dù chỉ là bóng, vẫn phải là NGƯỜI CỦA BỘ KHUÔN: lấy đường viền từ chính nhân vật ở tư thế đang diễn (`src/mould/BongNguoi.tsx`), không vẽ tay một dáng người khác kiểu (nhìn nghiêng có mũi cằm, đầu là tấm rời). Một cái bóng là một tấm một tông; gối, chăn, đồ vật quanh người vẽ vào cùng tấm, không xếp nhiều tấm mờ chồng nhau. Trong danh sách cảnh ghi rõ bóng của nhân vật nào và nó diễn gì.

## Bụi bay, người ốm, cái chết, cơn giận, cảnh "còn lại một mình"

- **Hạt** tự sinh theo nguồn sáng, cây hoa và môi trường (`lib3/buiNguon`; chi tiết: skill 1, mục Hạt). Đạo diễn không rải hạt; chỉ ghi màu bụi theo cảnh, và cảnh signature của một nhân vật thì ghi màu nhân vật. Cảnh thường chỉ có bụi của nguồn sáng.
- **Điều lời đọc doạ thì cho thấy.** "Nam tước sẽ làm gì mình" là Nam tước rút kiếm giơ cao rồi chém xuống (không máu, cắt đúng lúc kiếm tới), không phải ông đứng trừng mắt. Câu nói về một hành động dữ dội thì hình là chính hành động đó.
- **Người ốm phải trông ốm:** da xám nhợt, quầng mắt (`eyeBags`), môi nhợt, khăn ướt trên trán, mồ hôi, thở nặng, ho. Phiếu ngoại hình ghi sẵn bảng màu lúc ốm.
- **Cái chết diễn bằng thân người trong bối cảnh,** không bằng cận mặt đổi màu: người chết rét ngồi tựa vách ôm lấy mình, run chậm dần rồi dừng, tuyết phủ dần, da xám dần (pha bảng màu bằng `phaNac`), đầu gục; người ở lại lay gọi không được. Gộp thành một cảnh liền đủ dài (từ 3 giây).
- **"Chỉ còn lại một mình":** mở gần ở nhân vật rồi máy LÙI ra và nâng lên cho người nhỏ dần giữa cảnh rộng. Đẩy từ xa vào thì người xem chưa kịp thấy ai mà đã mất cái rộng.
- **Cảm xúc mạnh** (cơn giận, lời thề, quyết tâm): bụi bay trong không gian đổi sang màu nhân vật và có một quầng màu, mạnh dần theo câu; quanh người có hạt sáng nhưng ÍT. Khi Daniel nói "glow" ông thường muốn nói các chấm sáng bay.

## Cỡ cảnh đủ bậc, sân khấu ngang, kiểu máy ghi trong danh sách

- Mỗi chương có đủ bậc: toàn (mở nơi chốn), trung (người cao từ 40 % khung, thấy tay và việc đang làm), cận (lấy cả cằm và một phần vai), và ít nhất một cảnh hai người cùng khung nhìn nhau. Không nhảy thẳng từ toàn sang cận mặt quá hai lần liền.
- Mỗi cảnh ghi việc người làm bằng tay hay bằng đồ vật (cầm, chạm, quay sang, lùi lại), không chỉ "đứng nhìn".
- Mỗi dòng của danh sách cảnh ghi kiểu máy có tên (`truot`, `day`, `keo`, `luon`, `theo`, `nang`/`ha`, `day-lia`, kèm hướng và `nhe`/`vua`; `chung/src/lib3/kieuMay.ts`). Chuỗi cảnh cùng nơi giữ một hướng máy, đổi ở nhịp truyện; `luon` và `theo` chỉ vài cảnh rộng mỗi chương. Chỗ cắt không phải cắt thẳng ghi tên kiểu chuyển cảnh (mục Chuyển cảnh và hiệu ứng).
- **Mô tả bối cảnh cho bước chọn cảnh mẫu:** mỗi bối cảnh trong danh sách cảnh có một dòng mô tả đủ để chọn ảnh mẫu và để dựng: nơi chốn là gì, văn hoá và thời đại, trong nhà hay ngoài trời, giờ trong ngày, các đồ vật của câu chuyện, không khí (nắng xiên, bụi, tuyết, lửa). Workflow dùng dòng này để chọn 8–12 khung của video gốc cho người dựng (skill 1, mục Cảnh mẫu của cảnh). Các bối cảnh liền nhau nên khác nhau về nơi chốn, giờ hoặc màu chủ; đừng để cả tập quanh một họ màu. Nhân vật chính nên có một màu nhận diện rõ ở áo; nhân vật mặc màu sẫm theo nguyên tác thì ghi điểm nhấn màu đi kèm (dải trời, đèn, đồ cầm tay).
- Sơ đồ vị trí của bối cảnh vẽ theo sân khấu ngang (skill 1, mục Sân khấu ngang): người trên một dải ngang, vào ra ở mép.
