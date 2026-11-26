# Skill 1: dựng cảnh xếp lớp (cutout3d)

> Sửa luật trong skill này chỉ khi Daniel đã xác nhận đúng thay đổi đó (luật 25a); sửa xong thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Agent không sửa skill: thấy thiếu hay sai thì ghi vào báo cáo.
> Ai làm việc gì, file nào của ai, cổng kiểm nào phải qua: `skills/4-quy-trinh.md`.

## Tra kho trước khi dựng

Mọi món dùng lại được đều nằm trong **kho asset** `assets/`: mỗi món một ảnh `assets/<nhóm>/<id>.png`, bảng tra `assets/catalog.json`, mục lục có ảnh `assets/DANH-MUC.md`, tấm tổng hợp từng nhóm `assets/_tong-hop/<nhóm>.jpg`. Món riêng của kênh đang làm (nhân vật, bối cảnh có người đứng sẵn) nằm ở `../kenh/<kênh>/kho/` cùng cách ghi; `tools/kho.py tim` tìm trên cả hai.

- Trước khi dựng một cảnh và trước khi làm bất cứ món nào: làm theo skill 2, mục **Thẻ làm một món** (tra kho, chọn loại, lấy nét từ Codex, vào kho). Tìm kho: `python3 tools/kho.py tim đá --nhom thien-nhien` (khớp nguyên từ; gõ có dấu thì khớp đúng dấu), hoặc đọc `assets/DANH-MUC.md`.
- **Món đã bỏ khỏi kho:** núi chia hai màu theo sống dọc (`paintPeak`, `paintPeaks`) và đá tuyết nhiều mặt tam giác (`StandRock`, `RockShelter`, `RockMass`, `SnowRock`). Code còn vì tập Doom đã dựng bằng chúng; KHÔNG dùng cho cảnh mới. Núi và đá mới: skill 2, mục Vẽ đồ bằng Codex, và ảnh `bang-cham/nui-da.jpg`.
- Trong ghi chú sân khấu, liệt kê món lấy từ kho (theo id) và món mới làm. Món mới phải vào kho trước khi báo xong: xem `skills/2-chuan-mon-do.md`, mục Kho asset.
- Bối cảnh dựng xong cũng là một món của kho (nhóm `bo-canh`), kể cả các góc quay gần của nó.

Dùng khi phải dựng **ảnh tĩnh của một cảnh** (nền, bối cảnh, nhân vật đứng sẵn ở vị trí của họ). Kết quả là một file cảnh, một ảnh tĩnh đã tự soi, và một **ghi chú sân khấu** cho bước diễn xuất (skill 3). Chuẩn cho từng món đồ nằm ở skill 2.

Thư mục dự án: `cutout3d/chung/` (Remotion + three.js; đường cũ `rover-lab/` là liên kết tới đây). Mọi đường dẫn dưới đây tính từ đó. Cảnh quay của từng kênh nằm ở `../kenh/<kênh>/tap/<tập>/` và import phần chung bằng đường tương đối (`../../../../chung/src/...`); `out/` là liên kết tới `../kenh/<kênh>/out/`.

**Phần chung không biết kênh nào.** Bối cảnh trong `src/demo/` chỉ nhận người qua `children` (hay `figures` của `Shot`) và không import dàn nhân vật của kênh nào. Ảnh tĩnh "người đứng ở mốc", mốc và góc máy của từng cảnh quay của một tập, dữ liệu riêng của tập (đám đông của một cảnh, kế hoạch dỡ lều…) viết ở `../kenh/<kênh>/tap/<tập>/dung-canh/<BốiCảnh>Nguoi.tsx` và import bối cảnh từ phần chung (mẫu: các file `*Nguoi.tsx` của tập doom-1). Ảnh tĩnh của bối cảnh trong phần chung là ảnh không người. Cổng: `grep -rn "kenh/\|Cast'" src` trong phần chung không ra dòng import nào.

## Thứ tự làm

1. Đọc câu lời đọc và phiếu cảnh: có ai, mấy người, làm gì, đi vào từ đâu.
2. Tính chỗ đứng của nhân vật bằng số (mục "Máy quay và chỗ đứng").
3. Viết file cảnh `src/demo/<Ten>.tsx`, đăng kí comp trong `src/Root.tsx`.
4. Dựng ảnh, tự mở ảnh ra soi theo danh sách ở cuối, sửa, dựng lại. Thường cần 3–6 lượt.
5. Viết ghi chú sân khấu.

Mức phải đạt là khung của video gốc: `skills/bang-cham/` và bộ cảnh mẫu được giao (`skills/canh-mau/`); không lấy ảnh của mình làm chuẩn. Code mẫu để học cách gọi: `src/demo/Valley.tsx`, `Camp.tsx`, `Village.tsx`, `Classroom.tsx`.

## Ngoài trời: chín lớp theo độ xa

| Lớp | Ví dụ | Dựng bằng | Cách máy |
|---|---|---|---|
| Trời | dải màu, mây, mặt trời hoặc trăng, sao, chim | `Plate`, `fog={false}` | 520 m |
| Dãy núi rất xa | núi tuyết, núi đá vôi | `Plate` | 215 m |
| Dãy núi gần hơn | có thể thêm dải sương | `Plate` | 140 m |
| Mốc cảnh | lâu đài, chùa tháp, tháp nước | `Plate` | 95 m |
| Đồi, rặng cây xa | làng nhỏ, ruộng, khói bếp | `Plate` | 70 m |
| Rặng cây gần | đứng đúng mép xa của mặt đất | `Plate` | 46–58 m |
| Vật đứng trên đất | cây, bụi, đống rơm, con vật | `Sprite` ở vị trí thật | 10–40 m |
| Bối cảnh chính | nhà, cổng, giếng, hàng rào | khối 3D trong `src/lib3/kit.tsx` | 8–20 m |
| Vật đóng khung gần máy | cột, thân cây gần, khung cửa, đồ gần máy ở mép khung | VẬT THẬT đặt trong bối cảnh (`Sprite`, khối); KHÔNG dán tấm vẽ theo máy | 3–6 m |

- Cả cảnh có sương màu trời gần chân trời (`StageCam` đặt giúp), nên lớp xa tự nhạt.
- Xa thì lạnh và nhạt, gần thì ấm và đậm. Cảnh "đêm" là chạng vạng: nền xám xanh sáng vừa, phần ấm (lửa, đèn, cửa sáng) ở tầm giữa.
- Hình to, đơn giản, mỗi món 2–4 sắc; phía sáng của hình theo hướng đèn chính của cảnh.
- Hai bên có vật đóng khung. Không dựng đường, hàng rào, dãy đồ chạy thẳng vào sâu (mục Sân khấu ngang).
- **Trước sau theo vị trí 3D (Daniel 26/11/2026: "các vật khác nhau luôn phải xếp trước sau trên nền 3d"; áp cho cả trong nhà).** Mỗi vật (người, hình phẳng, ảnh, khối) là một vật riêng, đặt ở đúng độ sâu của nó; vật gần máy hơn che vật xa hơn. Không vẽ nhiều vật khác nhau vào chung một tấm, không xếp các vật khác nhau trên cùng một mặt phẳng. Muốn một vật ra trước hay ra sau thì DỜI nó theo z; không đặt `order` hay `renderOrder` để ép. Engine lo phần che, kể cả `Sprite` đứng trước người (lớp che trong `src/lib3/depth.tsx`; trước 26/11 người luôn đè lên mọi `Sprite`). Hình trong mờ cố ý (khói, sương): `Sprite che={false}`.
- Mặt lớn (trời, đất, tường, nước) YÊN, kiểu rất nhẹ; chi tiết dồn vào đồ vật và vào chỗ các lớp chồng lên nhau.

## Trong nhà

- Căn phòng là hộp thật (tường, trần, sàn là khối) để tự chắn nắng và nhận vệt nắng.
- Nhìn chéo vào một góc phòng bằng cách **xoay cả nhóm phòng** khoảng 0.45 rad (máy không xoay được); bọc phòng trong `RoomCtx.Provider value={góc}`.
- Các lớp: cảnh ngoài cửa sổ (`Plate`); vỏ phòng; đồ gắn tường; bục hoặc bàn chính cùng nhân vật; các hàng bàn ghế lùi dần; mặt bàn gần nhất làm tiền cảnh. Không dùng `Plate` tiền cảnh trong phòng.
- Ánh sáng buổi sáng: phòng phải SÁNG. `hemisphereLight` khoảng 1.95 và `Sun` (trong `src/lib3/room.tsx`) cường độ khoảng 5, thấp khoảng 22°, chéo khoảng 35° về phía tường chính. Không để vật gì đứng chắn cửa sổ; song cửa mảnh.
- Loại cảnh đặt bằng `GradeCtx.Provider value="brightInterior"`; khi đó `Sprite` tự ăn sáng của phòng.

## Sân khấu ngang

Phim cắt giấy là sân khấu NGANG: người và việc chính trải theo bề ngang khung; chiều sâu chỉ để xếp lớp nền.

- Người diễn trong một cảnh đứng trên một dải ngang nông: lệch nhau theo z không quá khoảng 2,5 m. Hai người nói chuyện đứng ngang hàng, nhìn nhau theo chiều ngang khung.
- Vào và ra ở mép trái, phải khung; đi ngang qua khung. Không cho người đi từ sâu trong khung ra phía máy hay đi vào sâu, trừ cảnh đặc biệt ghi trong danh sách cảnh.
- Đồ đạc của việc chính (bàn, bảng, cửa, giường) cũng nằm trên dải đó. Đồ xếp nối đuôi nhau vào sâu (hành lang, dãy bàn chạy thẳng vào) là lỗi; muốn có chiều sâu thì cho lớp nền chồng lên nhau theo khoảng cách (bảng chín lớp ở trên).
- Lớp nền phải CHỒNG lên nhau và có vật đóng khung ở mép (cột, khung cửa, cây gần, đồ gần máy): không để nền thành các sọc ngang song song trời / núi / dải nhà / dải đất. Vật lặp (cây, nhà, cột) lệch khoảng cách, cỡ, hình.
- Chuẩn bằng hình: `skills/bang-cham/` (mục 1, 2, 4, 6) và `giai-phau-canh.jpg`. Vật đóng khung chỉ đòi ở toàn cảnh và trung cảnh; kiến trúc có nhịp (lan can, ô cửa) được lặp đều.

## Cảnh mẫu của cảnh

Chỗ ghi duy nhất của thẻ luật cứng 11. Hình gần video gốc nhất khi người dựng NHÌN một bộ khung của chính video gốc, chọn theo cảnh sắp dựng; vì vậy workflow `dung-canh-3d` có bước CHỌN CẢNH MẪU trước bước dựng.

- **Thư viện:** `skills/canh-mau/` gồm 573 khung của 202 bối cảnh cắt từ hai video của kênh gốc, đã đặt tên và phân loại (`canh-mau.json`, `MUC-LUC.md`, ảnh `anh/<mã>.jpg`, tấm ghép theo loại `tam-loai/`), và chín tấm cắt cận theo loại vật ở `cat-can/` (đồ gỗ, cây cỏ, kiến trúc, đồ nhỏ, mặt phẳng lớn, bóng và nguồn sáng, hạt và hiệu ứng, trời núi lớp xa, bố cục). Tra, ghép tấm, làm lưới: `python3 tools/canh_mau.py tim … | ghep … | luoi …`.
- **Bộ được giao:** 8–12 khung cùng kiểu nơi chốn, cùng giờ, cùng cỡ cảnh với cảnh sắp dựng, lấy từ ít nhất bốn bối cảnh khác nhau, kèm 2–4 tấm cắt cận. Danh sách nằm trong phiếu giao việc. Mở xem HẾT trước khi làm, rồi viết ra 8–10 điều LẶP LẠI ở phần lớn ảnh (đồ vật mấy sắc độ, có nét bên trong không; bề mặt lớn phẳng tới đâu; đồ gom quanh người thế nào; người to cỡ nào; bóng; hạt; bộ màu).
- **Cảnh mẫu dạy CÁCH VẼ, danh sách cảnh quyết định VẼ CÁI GÌ.** Nơi chốn, văn hoá, thời đại, đồ vật, không khí (nắng, bụi trong nắng, lớp xa) lấy từ mô tả cảnh, và từ cảnh gốc khi sửa một cảnh có sẵn. Không chép nhà cửa, đồ vật của cảnh mẫu (cảnh Nhật không được thành phố Tây); không bám vào một ảnh; không thêm thứ mô tả không có chỉ để cho giống hay cho đủ một con số.
- **Mức vẽ:** hình của video gốc là GIẤY CẮT XẾP LỚP: mỗi thứ là một mảnh giấy màu phẳng đặt trước mảnh sau nó, màu trầm ngả xám, lớp xa nhạt dần; không gradient (ảnh gen: skill 2, mục Vẽ đồ bằng Codex). Đồ vật 2–4 sắc cùng họ màu, có mặt sáng mặt tối, vài nét bên trong và chi tiết nhận diện: không hộp trơn, không vụn, không viền đen. Khối tự nhiên (đá, vách, gò đất) là vài khối LỚN bo tròn, mỗi khối 2–3 mảng sáng tối chéo theo nắng: không xếp ô như tường gạch, không lưới tam giác. Rêu, cỏ trên đá là vài mảng phủ ở đỉnh và vai khối, không rải chấm. Nước của thác bám theo từng bậc đá và rộng dần xuống dưới. Vật để người đứng lên có một mặt vát sáng phía nắng. Đồ nhỏ gần máy không to quá tỉ lệ thật so với người. Núi và đá: luật ở skill 2, mục Vẽ đồ bằng Codex (núi xa mỗi lớp một sắc, không sống dọc chia hai màu; đá là một khối bo, không nhiều mặt tam giác). Đồ phụ gom thành 2–3 cụm, mỗi cụm 2–4 vật chồng mép, đặt bên cạnh người.
- **Bối cảnh dựng MỚI: theo TRANH BỐI CẢNH MẪU và BẢNG THIẾT KẾ của chính nó, Daniel duyệt cả hai trước khi dựng.** Bộ cảnh mẫu chỉ để nhìn và học: không cảnh nào lấy bố cục, số món hay vị trí của một khung video gốc. Bước chọn mẫu của workflow (`chi_thiet_ke: true`) làm hai thứ: bảng thiết kế (điều học được từ cả bộ khung; các lớp của bối cảnh từ xa tới gần; từng món của truyện kèm loại và kết quả tra kho; bộ màu) và một tranh của cả bối cảnh, gen bằng Codex đúng theo bảng đó (skill 2, mục Vẽ đồ bằng Codex). Người dựng làm ba bước: (1) LÀM ĐỒ TRƯỚC theo skill 2, mục Thẻ làm một món; dựng tấm đồ có nhãn, soi từng món rồi mới ghép; (2) GHÉP theo tranh: bố cục, các lớp, vị trí và cỡ tương đối của các món, hướng sáng. Tranh là hình phẳng, cảnh là sân khấu 3D: mỗi món đặt ở đúng độ sâu của nó, giữ dải đất ngang cho người đứng; không dán tranh làm nền, không cắt tranh ra làm đồ; không lớp nào là khối xám trống (bóng do engine lo, mục Bóng); (3) MÀU theo tranh, nhìn thêm bộ cảnh mẫu; `python3 tools/do_mau_khuon.py <ảnh của mình> <3–5 khung cùng loại cảnh>` chỉ để tham khảo. Tự chọn màu thì hay ra chói (lá xanh nõn, cát và nước gần trắng), và đèn còn đẩy mặt nhận sáng nhạt thêm: tô vật liệu sẫm hơn hoặc hạ đèn. Không lọc màu ảnh, không bỏ món, không thêm món để đạt số.
- **Sửa một cảnh có sẵn:** kiểm kê thành ba nhóm GIỮ (nơi chốn, văn hoá, vật của câu chuyện, không khí), GOM (đồ phụ đang nhỏ, rời rạc), BỎ (chỉ là nhiễu: vân và hoa văn dày trên bề mặt lớn, mảng loang nhoè, khối đa giác lởm chởm, vật to chắn suốt mép khung, vật vụn rải rác). Không bỏ thứ gì khác.
- **Không đổi thứ đã duyệt:** màu áo, kiểu vẽ, hình dáng nhân vật giữ theo dàn của kênh; cỡ cảnh, góc máy, chỗ đứng, diễn xuất giữ theo danh sách cảnh. Cảnh mẫu không phải lý do để lùi máy hay tô lại áo.
- **Tấm lạc loài:** đặt ảnh của mình lẫn vào năm khung của bộ cảnh mẫu (`tools/canh_mau.py luoi`); ô của mình lạc ở điểm nào thì sửa. Sau đó người rà đoán mù đúng phép này.
- **Màu:** không có công thức chung và không có bảng số phải đạt. Màu nhìn theo bộ cảnh mẫu, giữ màu nhận diện của nơi chốn. **Chọn màu trên bảng màu như kênh gốc** (đo 573 khung, 26/11/2026): màu nằm ở nửa TRÁI của ô chọn màu (ít rực); mặt lớn (đất, tường, trời) ở phần ba bên trái nhưng không xám hẳn; muốn rực thì kéo xuống nửa dưới (tối), muốn sáng thì kéo sát cột trái (nhạt); không chọn ở góc trên bên phải (vừa sáng vừa rực). Mỗi khung có một vùng gần xám hoặc màu lạnh, không để cả khung một họ màu ấm. Cảnh ban ngày dùng đèn trung tính (`dayExterior`, `brightInterior`, đèn bầu trời gần trắng); đèn chiều muộn `lateDay` và trời cam chỉ cho cảnh mà truyện ghi là chiều tà. Đo trên ẢNH DỰNG RA, vì đèn nhuộm lại màu vật liệu: `python3 tools/do_mau_khuon.py <ảnh>` in cảnh báo khi cả khung ngả ấm, thiếu vùng xám hoặc quá rực. Đèn gần trắng, người và vật gần giữ màu riêng. Cả khung ngả ấm vì lớp phủ cuối thì tắt lớp ấm của `Finish` ở cảnh quay (`finish={{warm: '', warmAmount: 0}}`). Không chữa màu bằng bộ lọc hậu kỳ.

## Máy quay và chỗ đứng

- Ống kính cố định 28°, luôn nhìn thẳng theo −z: `<StageCam eye={[x, cao, z]} haze="#..." fog={[gần, xa]} />`.
- Mọi `Plate` của cảnh nhận `from={eye}`. `Plate` vẽ theo đơn vị màn hình 1600 × 900.
- Một điểm trên đất cách máy D mét hiện ở: ngang `0.5 + x / (0.887 × D)`, dọc `0.5 + caoMáy / (0.4986 × D)`. Nửa bề ngang khung ở khoảng cách D là `0.4435 × D`: dùng nó để biết mép khung ở đâu (chỗ nhân vật đi vào) và thứ gì lọt vừa khung.
- **Sàn nâng cao** (sân ga, bậc thềm, bờ đê): nhân vật luôn đứng ở cao độ 0. Cho mặt sàn nâng là 0 và hạ phần đất bên cạnh xuống.
- **Kiểu máy có tên** (`src/lib3/kieuMay.ts`): `<Shot may={{kieu: 'theo-phai', D: 6.5, muc: 'vua'}} …/>` (D = khoảng cách máy tới chủ thể, mét) hoặc `mayQuay(kieu, f, dur, D, muc)` trả `{dx, dy, dz, yaw, pitch}` cho cảnh dựng thẳng bằng StageCam (pitch, dy qua `NgocCtx`, `NangCtx` trong `duongMay.ts`, hoặc prop `dy`). Kiểu: `truot-trai/phai`, `day`, `keo`, `luon-trai/phai`, `theo-trai/phai`, `nang`, `ha`, `day-lia-trai/phai`. Đi đều tốc, khung giữa cảnh = khung chuẩn của bảng phân cảnh; giới hạn kẹp trong code. `theo` và `luon` giả định chủ thể đứng thẳng trước máy ở khung chuẩn. Cảnh thử: composition `thu-may-<kieu>` (`src/demo/ThuKieuMay.tsx`).
- **Máy đi vòng** `vong-trai`/`vong-phai`: máy đi cung tròn quanh chủ thể, giữ khoảng cách D, luôn nhìn vào chủ thể. Tốc độ góc 1,5°/giây (nhẹ), 2,5°/giây (vừa), trần 20° hoặc `may.cung` nếu nhỏ hơn. Tấm nền xa quay theo máy một phần (`VongCtx`) nên mép không lộ; vật gắn lên tấm nền (đèn cửa sổ, cờ) phải bọc `TheoTam` (`depth.tsx`), bối cảnh chưa bọc thì không dùng vong. Phòng hở mặt trước: soi lại khi máy quay về phía mặt hở. Chủ thể phải đứng thẳng trước máy ở khung chuẩn. Dùng cho cảnh nhấn của một nhân vật, vài cảnh mỗi chương.
- **Máy lượn** (cảnh mới gọi qua `Shot may={{kieu: 'luon-trai'|'luon-phai', D}}`; bên dưới là hàm gốc `src/lib3/duongMay.ts`): `duongMay(f, dur, D, {cung})` với `cung` 3–5 độ; chỉ một hai cảnh rộng mỗi chương (luật 9a); truyền `yaw` nhận được vào `Shot` (prop `yaw`).
- Bối cảnh dựng trực tiếp (không qua `Shot`) bọc phần cần xoay trong `XoayCtx.Provider value={yaw}` (`XoayCtx` ở cùng file), đặt BÊN TRONG `ThreeCanvas`.
- Máy ngang tầm mắt (1.5–1.9 m) cho cảnh có nhân vật; nâng lên 3–3.4 m khi cần thấy ruộng, mặt nước, sân rộng.
- Nhân vật: người lớn cao 1.7, trẻ con 1.15. Toàn cảnh thì thấy cả người tới chân; trung cảnh người chính cao từ 40 % khung. Đồ cao 0.7 m che mặt sàn sau nó tới khoảng 1.8 lần khoảng cách của nó.
- **Vật to ngay sau lưng nhân vật** (đoàn tàu, bức tường, toà nhà): với ống kính này nó thành một bức vách sau đầu người. Đẩy nó ra xa, cho mép khung cắt bớt nó, và giữ sau mỗi cái đầu một dải khác sắc (ví dụ dải sơn kem của đầu máy). Vật dài như xe, tàu thì không xoay 0.5 rad như nhà.
- **Kiểm đầu nhân vật trên MỌI lớp phía sau, kể cả các tấm vẽ xa:** tính vị trí cái đầu trên màn hình, rồi xem ở từng lớp phía sau, đúng chỗ đó là gì. Dời vật hoặc dời người cho tới khi sau mỗi cái đầu là một mảng sạch, khác sắc với tóc. Mọi hình phẳng đặt ở tầm 10–40 m rất dễ rơi đúng cạnh đầu.
- Người đứng trên bậc thềm hay sàn cao: `Puppet3` nhận `pos` có cao độ khác 0 bình thường.
- `withPose` làm mất cờ `show` của tay áo choàng: nhân vật mặc `coat` phải tự truyền tư thế tay kèm `show: true`, nếu không tay biến mất.
- Đặt nhân vật vào cảnh ngay từ ảnh tĩnh, tư thế trung tính: `<Puppet3 height={1.7} pos={[x, 0, z]} spec={...} />` (người đứng bên phải nhìn sang trái thì thêm `flip`; trong phòng xoay thì thêm `rotY={-góc}`).

## Người đứng trước nhà cửa: đừng lùi máy để lấy trọn toà nhà

- **Khoảng cách máy chọn theo thứ cảnh quay cần cho thấy** (người, hành động), không theo việc toà nhà có lọt trọn khung hay không. Toà nhà được phép bị mép khung cắt, kể cả lấp kín cả khung, không thấy trời.
- **Không "ngước" máy** để ôm trọn nhà cao; máy vẫn nhìn ngang. Muốn chân tường nằm thấp trong khung thì nâng máy lên.
- **Khoảng giữa người và toà nhà phải có thứ chồng lên mặt tiền** (cây, cột đèn, ghế, xe đạp, bảng tin, tượng, bồn hoa). Bãi cỏ hay sân trống giữa người và nhà là dấu hiệu máy đang đứng quá xa.
- Mỗi cảnh quay một độ gần khác nhau; cùng một bối cảnh có thể vừa có cảnh mở rộng vừa có cảnh sát.

## Một bối cảnh, nhiều cảnh quay

- Dựng bối cảnh một lần, rồi mỗi cảnh quay đặt máy ở chỗ khác bằng `Shot` trong `src/lib3/shot.tsx`: `<Shot grade=... eye={[x, y, z]} set={(inside, cam) => <Scene dx={cam.dx} dz={cam.dz}>{inside}</Scene>} figures={...} />`. (Bối cảnh cũ còn tấm vẽ tiền cảnh thì nó tự ẩn khi máy rời chỗ chuẩn; bối cảnh mới không dùng tấm này.)
- Trung cảnh và cận mặt: `eye={frameOn({pos, height, spec}, 'medium' | 'close', lệch)}` đặt khung theo ĐẦU nhân vật (đầu chiếm 30 % hoặc 50 % chiều cao khung); CHỈ khi cảnh tập trung vào MỘT chủ thể mới thêm `soft={1.0}` hoặc `soft={1.6}` cho nền mềm đi; cảnh hai người và cảnh rộng thì nét hết (`kiem_canh.py` báo `mo-nen` khi cảnh có từ hai người mà vẫn đặt `soft`).
- Điểm trong phòng xoay đổi ra toạ độ thật bằng `roomPoint(yaw, cam, điểm)`.
- Mỗi vị trí máy phải kiểm lại đầu nhân vật trên mọi lớp phía sau; đồ trang trí thêm cho riêng một cảnh quay có thể đưa vào qua `figures`.
- Không dựng đường chạy thẳng về phía máy hay vào sâu: nó lấp kín đáy khung và trái sân khấu ngang.
- Bối cảnh sâu (trên 50 m) thì bóng đổ thô và mờ; giữ phần có bóng quan trọng trong khoảng 25 m quanh nhân vật.
- **Nền mềm** (`Shot` với `soft`, chỉ cho cảnh tập trung vào một chủ thể): nhân vật vẫn ăn sáng và nhận bóng của bối cảnh; dùng được cho mọi bối cảnh gọi qua `Shot`.
- **Phòng dựng hở mặt trước** (máy quay đứng ngoài nhìn vào) không có bức tường thứ tư. Một cảnh đảo góc nhìn ra phía hở sẽ không có nền: phải thêm bức tường đó cho riêng cảnh ấy, hoặc lấp kín bằng khói, bóng tối. Khi viết ghi chú sân khấu, ghi luôn máy quay được lùi, trượt tối đa bao nhiêu trước khi mép tường hở lọt vào khung.
- **Một bối cảnh có thể có nhiều trạng thái** (ví dụ phòng thí nghiệm: `night`, `dark`, `wrecked`): cùng vỏ phòng và cùng các mốc, đổi đồ đạc, ánh sáng, hư hại. Trạng thái cũ phải dựng ra y như trước; ánh sáng do cảnh quay điều khiển theo khung (ánh máy `glow`) là tham số riêng, không nằm trong trạng thái.
- **Tay chạm đồ vật:** bộ khuôn chưa có số đo tầm tay, nên đặt bàn tay lên một vật (cần gạt, tay nắm cửa) là thử từng chút. Đồ vật để nhân vật chạm phải nằm trong khoảng từ hông tới vai của hình vẽ, ở phía nhìn thấy được từ máy quay; kiểm bằng ảnh tĩnh trước khi diễn.
- **Nhân vật là tấm phẳng, vẽ đúng màu riêng:** người không sáng tối theo đèn của cảnh, chỉ ngả nhẹ theo màu của cảnh (mục Bóng, dòng "Người vẽ đúng MÀU RIÊNG"). Người đứng sát một hiệu ứng cần ánh màu thì đặt `anMau` cho `Puppet3`; viền sáng một bên dùng `rim` (skill 3).

## Nội cảnh ban đêm

Cảnh mẫu: `src/demo/Lab.tsx` (phòng thí nghiệm). Đêm trong phòng là TỐI VỪA, không đen: mọi thứ vẫn phải đọc được.

- Ánh sáng nền lạnh khoảng 1.0 (`hemisphereLight` màu xanh tím nhạt). Để 0.55 thì nửa dưới khung đen kịt.
- Trăng là một đèn hướng lạnh đi qua cửa sổ, in khung cửa lên sàn; đèn bàn là một đèn chụp ấm có bóng; hành lang sáng hắt qua cửa; vật phát sáng (cỗ máy) có một đèn điểm yếu màu riêng.
- Nhân vật vẫn sáng đúng màu riêng trong phòng tối, như video gốc (mục Bóng); không truyền `tint` bằng tay để làm tối hay nhuộm màu người.

## Khung của một file cảnh

```tsx
const HAZE = '#b7c9e2', EYE: V3 = [0, 1.9, 9];
const sky = (c: Ctx) => { /* vẽ bằng canvas 2D, đơn vị 1600 x 900 */ };
export const Scene: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number}> = ({children, f = 0, dx, dz}) => (
  <Scene3 grade="dayExterior" reach={22}>
    <StageCam eye={EYE} haze={HAZE} fog={[16, 400]} dx={dx} dz={dz} />
    <Plate from={EYE} id="x-sky" d={520} paint={sky} fog={false} />
    {/* ...các Plate xa... */}
    <Ground near="#8ea66c" far="#84a073" size={[110, 54]} pos={[0, 0, -11.5]} />
    {/* Sprite, khối trong kit, nhân vật (children) */}
  </Scene3>
);
// ảnh tĩnh: <AbsoluteFill><Finish><ThreeCanvas width height flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>...</ThreeCanvas></Finish></AbsoluteFill>
```

- `Scene3 grade`: `dayExterior`, `lateDay` (chiều muộn: nắng ấm mạnh; hướng nắng do cảnh đặt, engine kéo vào khung bóng), `nightExterior` (chạng vạng, thường thêm `gain={1.5}`), `snowExterior`, `brightInterior`, `darkInterior`.
- Các lớp vẽ riêng của cảnh (trời, núi, rặng cây) nằm trong file cảnh; món dùng lại được thì vào thư viện.
- Thứ sẽ chuyển động (khói, lửa, hạt) nhận số khung `f`; cảnh có thể nhận thêm `moving` để ảnh tĩnh giữ hình tĩnh còn đoạn phim thì dùng bản động.
- `Scatter` (đá, cỏ, vết rải trên đất): `area` tính quanh `pos`; `keep` là các vùng trống `[x, z, bán kính]` tính TỪ `pos`; đừng để `area` chạm sát máy, đá gần máy sẽ to khổng lồ. Dọn sạch lối đi của nhân vật.
- `id` của `Plate` và `name` của `Sprite` phải khác nhau giữa các hình; đổi cách vẽ thì đổi tên. Khung vẽ của `Sprite` phải chứa trọn hình.
- Thứ tự vẽ bên trong engine (cảnh không tự đặt; vật nào che vật nào là do vị trí, xem mục Ngoài trời): `Plate` 0, tấm dán mặt đất (thảm, vạch đường) tới 2, bóng của người 2,5, `Sprite` 3, quầng sáng 4, bụi 5–6, lớp che của `Sprite` 499, nhân vật 500.
- Dựng ảnh: `./still.sh <comp> 0` ra `out/<comp>-0.png`. Trình duyệt không chạy được trong sandbox, lệnh này phải chạy ngoài sandbox.
- Kiểm kiểu: `npx tsc --noEmit -p . 2>&1 | grep -E "src/(lib3|demo)"`.

## Thư viện

- `src/lib3/depth.tsx`: `Plate`, `Sprite` và các kiểu vẽ `paint…` (cây, bụi, núi và nhà ở lớp xa, con vật, mây, khói). `src/lib3/kit.tsx`: `B` (khối hộp), `StageCam`, `Label` (chữ trên biển hoặc trên một mặt) và đồ làng, trại, nhà ga. Tên và ảnh từng món: tra KHO (`python3 tools/kho.py tim <từ>`), không chép lại ở đây.
- `src/lib3/shot.tsx`: `Shot`, `frameOn`, `roomPoint` (một bối cảnh, nhiều cảnh quay).
- `src/lib3/kitCampus.tsx` (giảng đường, kí túc, cổng sắt, đèn gang, ghế đá, tượng, giá xe đạp, cây phong) và `src/lib3/kitLab.tsx` (cỗ máy vòng, đèn bàn, đèn chụp `Spot`, đồ phòng thí nghiệm).
- `src/lib3/room.tsx`: `RoomCtx`, `Sun`, `WindowWall`, `Desk`, `TeacherDesk`, `Cabinet`, `CeilingFan`, `Spr` (hình phẳng đứng tự do trong phòng xoay).
- `src/lib3/look.tsx`: `Scene3`, `Ground`, `FacetLathe` (khối tiện cho đá, cột, thùng tròn), `Halo`, `Finish`.
- Món chưa có thì tự làm theo skill 2 và thêm vào thư viện, không để trong file cảnh.

## Tự soi trước khi giao

- Có gì quá to, quá sát máy, che mất lớp xa không?
- Mặt lớn có yên không, hay bị vân, hoa văn dày làm rối?
- ĐỒ VẬT nào còn là một mảng trơn (tán cây một hình tròn, mái một mặt phẳng), cần thêm mặt sáng tối và chi tiết nhận diện?
- Chỗ chạm mép: vật mọc ra từ đầu nhân vật, dây cắt ngang người, con vật như đứng trên tường?
- Thứ tự vẽ: quầng sáng đè lên mặt, bóng cây xa hiện xuyên thân cây gần?
- Hình bị cắt cụt vì khung vẽ nhỏ? Chữ trong cảnh có đúng nghĩa, đúng ngày tháng?
- Nhân vật: đủ chỗ đứng, thấy được bàn chân, nổi trên nền, có lối đi nếu họ phải đi?
- Hạt: bối cảnh đã gọi `datNoiBui` chưa, nguồn sáng có tự sinh hạt đúng chỗ không (mục Hạt)? Không tự rải thêm.

Không chỉnh hình để qua một con số; nhìn bằng mắt là chính.

## Chỗ đứng phải có khoảng hở thật

- Mốc đứng của nhân vật phải cách tường, tủ, đồng hồ, mép bàn ít nhất nửa thân (0,12 m) cộng tầm tay của động tác sẽ diễn ở đó (vẫy tay, chỉ tay: khoảng 0,5 m về phía tay vươn). Lỗi đã gặp: mốc đứng sát tường làm tay vẫy xuyên qua đồng hồ treo tường.
- Ảnh tĩnh có người cũng phải qua kiểm vật lý: `tools/vatly.py <comp>` (cách chạy và cách đọc ở `skills/3-nhan-vat-dien-xuat.md`, mục Kiểm vật lý). Không được có khung tím.
- Trong ghi chú sân khấu, ghi kèm mỗi mốc đứng: vật gần nhất ở bên trái, bên phải, phía sau và cách bao xa.

## Bối cảnh dài và ghi chú cho người quay

- **Bối cảnh dài (phố 200 m):** đèn chính của `Scene3` chỉ đổ bóng trong một vùng quanh gốc toạ độ (`reach`); góc máy ở xa gốc sẽ không có bóng. Hiện phải tự đặt một đèn chính có đích ngắm gần góc máy trong file cảnh (xem `src/demo/NyStreet.tsx`); chưa có tham số dùng chung.
- **Ghi chú sân khấu nên có bảng mốc thời gian của hiệu ứng** mà bối cảnh tự chạy (đèn bật lan dần ở khung nào tới đâu), danh sách người lọt khung ở từng góc máy, và giới hạn trượt, đẩy của từng góc. Ghi chú hội chợ (`out/tesla/ghi-chu-san-khau-HC-NHA.md`) là mẫu tốt: người quay gần như chỉ còn đặt máy.
- **Mỗi mốc đứng ghi kèm trạng thái đã kiểm** (ví dụ "kiểm ở `dark`"); sang trạng thái khác đồ đạc có thể đã dời.
- **Bối cảnh tự chạy kế hoạch ánh sáng của từng cảnh** (ví dụ `powerShot1`, `homeShot14`) là cách giao việc gọn cho khâu diễn xuất.

## Toà nhà lớn phải đủ chi tiết

- Một toà nhà chiếm nhiều khung phải có chi tiết ở BA CỠ: cỡ lớn (khối nhô ra thụt vào, tầng, mái, vòm), cỡ vừa (cửa sổ, gờ, phào, lan can, tượng, bậc), cỡ nhỏ là MỘT kiểu vật liệu rất nhẹ (mạch đá, hàng gạch mờ), không vân dày, không vết loang. Chi tiết của toà nhà nằm ở cỡ lớn và cỡ vừa.
- Mặt tường trắng hoặc sáng cần bóng đổ của gờ, phào, lan can để có khối; không chữa bằng vân dày.
- Chuẩn năm thứ cho mỗi món (skill 2) áp cho từng PHẦN của toà nhà lớn, không chỉ cho cả toà.
- Khi tự soi: mặt tiền đã đủ cửa, gờ, phào, lan can ở cỡ lớn và cỡ vừa chưa; phần tường giữa chúng được phép phẳng.

## Ghi chú sân khấu (giao cho bước diễn xuất)

```
comp ảnh tĩnh: <id>            file cảnh: src/demo/<Ten>.tsx, component <Scene> nhận {children, f, dx, dz}
máy: eye [x, y, z]; được trượt dx ±..., đẩy dz ...
nhân vật: tên, cao, vị trí [x, 0, z], có flip không, spec đang dùng
vùng trống đi lại được: x từ ... tới ..., z ...; lối vào: từ trái / phải, điểm bắt đầu ngoài mép khung ở x = ..., quãng đi bao nhiêu mét
thứ che chân hoặc dễ chạm mép: ...
ánh sáng: loại cảnh, hướng nắng; hạt cần có: ...
```

## Thư viện đồ của từng bối cảnh

- Đồ của từng bối cảnh nằm trong các file `src/lib3/kit<TênBốiCảnh>.tsx`. Danh sách đầy đủ kèm ảnh là KHO (`assets/DANH-MUC.md`, `python3 tools/kho.py tim <từ>`); không chép lại ở đây.
- Thêm một thư viện mới thì thêm tên file vào `LIBS` của `tools/kho.py`, nếu không cổng kiểm kho không thấy các món của nó.
- Bối cảnh cũ đem dùng lại phải được soi lại theo luật hiện nay TRƯỚC khi đưa vào cảnh quay. Thứ Daniel ĐÃ DUYỆT trong tập đang làm thì giữ nguyên: luật mới chỉ áp cho chương sau (thẻ luật cứng 11).

## Độ sáng của bối cảnh: đo, không ước

Mọi ảnh tĩnh giao nộp phải qua `python3 tools/do_sang.py <ảnh…>` (chạy trong sandbox được) và ghi số Y vào báo cáo.

- **Ngưỡng sàn duy nhất:** không ảnh nào dưới Y 70 (cảnh tối nhất của video gốc vẫn ở 69–76). Không còn dải số riêng cho đêm hay ngày: trên ngưỡng sàn, độ sáng và màu nhìn theo cả bộ cảnh mẫu cùng loại cảnh (`do_mau_khuon.py` so với nhiều khung, chỉ để tham khảo).
- **Cảnh tối của mẫu làm thế nào** (xem 12 khung tối điển hình: phố đêm, hầm đá, địa ngục, xưởng, vũ trụ): nền là xám xanh hoặc đỏ cam ĐẬM MÀU, không đen; nhân vật giữ nguyên màu sáng của mình, không bị nhuộm tối theo phòng; nguồn sáng (cửa mở, cửa sổ, lửa, đèn, trăng) chiếm mảng lớn trong khung và hắt sáng lên tường, sàn quanh nó; góc phòng tối nhất vẫn đọc được đồ vật.
- **Sửa bằng thiết kế ánh sáng, không nhân sáng cả khung:** nâng ánh nền (`hemisphereLight`) và màu `bg`, làm sáng màu tường và sàn, mở rộng mảng sáng của nguồn sáng, giảm mờ tối ở mép khung. Giữ "đêm" bằng sắc xanh lạnh và nguồn sáng ấm chứ không bằng độ tối.
- Cảnh Daniel đã duyệt mà nằm dưới ngưỡng sàn: báo Daniel, không tự làm lại (luật mới chỉ áp cho chương sau).
- Số trong `GRADES` của `look.tsx` và `classnorms.py` ở thang khác (xám 0–255); Y ≈ 16 + 0,86 × xám.

## Hạt: đi theo nguồn sáng và môi trường

Chỗ ghi duy nhất của luật hạt (thẻ luật cứng 9). Code: `src/lib3/buiNguon.tsx`; `StageCam` tự vẽ (canvas không có `StageCam` thì đặt `<BuiNguon />`). Bối cảnh cũ còn dùng lớp hạt riêng `CampAir` / `AirLayer` (`kitCamp.tsx`) thì giữ; bối cảnh mới không thêm lớp hạt riêng.
- Bối cảnh gọi `datNoiBui(noi, kieu?, gio?)`; lớp nền rất thưa theo nơi và giờ: trong nhà vài hạt be; ngoài trời ngày vài hạt phấn và lá; chạng vạng hạt ấm và đom đóm chớp; đêm hạt lạnh; tuyết, vũ trụ không có lớp nền.
- Nguồn tự đăng ký (prop `bui={false}` để tắt): `Sun` → bụi chỉ trong vệt nắng (hạt bị khối che thì không hiện); `Flame` (Fire, đuốc, lò, nến) → tàn lửa hoặc hạt nến theo cỡ ngọn; `Lantern`, `StationLamp` → bụi trong quầng đèn; `Halo` lớn ấm → đèn, màu khác → hạt phép.
- Nguồn tay: `<NguonBui kieu="phep" pos={[x, y, z]} mau="#..." />`. Đèn chỉ là `pointLight` trần thì không tự có hạt: đặt `NguonBui` cạnh nó.
- Cảnh đã có lớp hạt riêng (Motes, Fireflies, AirLayer) tự báo `DaCoKhi`: lớp nền tắt. Composition của tập đã khoá mức bụi (`datBuiAm`) không đổi gì.
- Màu theo cảnh: `datNoiBui(noi, kieu)` hoặc `<MauBuiCanh kieu="tim|xanh|vang-nen|..." />` cho riêng một cảnh quay (cảnh không có nguồn màu riêng thì chọn màu chủ đạo của cảnh, như tập Doom chọn tím cho Purple Man, xanh cho phòng máy Doom).
- **Bụi theo màu nhân vật:** CHỈ cảnh signature của nhân vật signature (dùng sức mạnh, xuất hiện lần đầu, cơn giận), danh sách cảnh ghi rõ cảnh nào. Khi đó lớp bụi bay tự do khắp không gian trước máy đổi sang màu nhân vật (`<MauBuiCanh kieu="tim" />`), như các cảnh Purple Man của tập Doom; hạt không quấn dày quanh người; cảnh cảm xúc mạnh (giận, thề) thì quanh người có hạt sáng nhưng ÍT. Cảnh thường, ví dụ một người đứng giảng trong phòng có nắng, chỉ cần bụi từ cửa sổ.
- Ngoài trời hạt đi theo cây và hoa gần máy (lá rơi từ tán, phấn từ bụi hoa, hạt cỏ từ cỏ cao); không để hạt lơ lửng giữa trời không gắn nguồn.
- Không tự rải chấm hạt trong file cảnh (`tools/kiem_canh.py` báo `hat-tay`).

## Bóng

Chỗ ghi duy nhất của luật bóng (thẻ luật cứng 5). Trong three.js `receiveShadow` mặc định TẮT cho từng mesh; quên bật thì bóng mất mà không báo lỗi gì, nên engine tự bật.

- **Tự bật nhận bóng:** `StageCam` (`src/lib3/kit.tsx`) gọi `autoReceive(scene)` sau MỖI lần dựng: mọi mesh vật liệu nhận sáng (Lambert, Phong, Standard, Toon) đều được bật `receiveShadow`, trừ tấm trong suốt không ghi chiều sâu (`transparent` + `depthWrite={false}`: mảnh cắt giấy, `Sprite`, tấm dán; chúng tự quyết bóng) và mesh có `userData.noRecv`. Canvas nào không dùng `StageCam` thì đặt `<AutoRecv />` vào trong canvas (đã đặt sẵn ở `Shot`, `LabLop`, `ShotComp`, `Stage` của `kit/stage.tsx`, `Episode`).
- **Lưu ý VSM:** cảnh dựng bằng `VSMShadowMap`, loại này vẽ cả vật NHẬN bóng vào bản đồ bóng (xem skill 2, mục "Tắt bóng của một món"). Nên mọi khối đặc nhận sáng giờ đều che nắng. Tấm nền lớn, vòm trời bằng Lambert mà không được che nắng thì phải gắn `userData={{noRecv: true}}`.
- **Vật đứng (đồ vật, tường, cột) phải `castShadow`;** người thì không (bóng của người là tấm bóng riêng, xem dưới). Chỉ mặt nằm (sàn, đất, đường) được bỏ. Tắt nhận bóng thì dùng `userData={{noRecv: true}}` (helper đã làm sẵn: `B recv={false}`, `Stick recv={false}`, `kit/shapes` với `receive={false}`, `Ball`, `three/prims` với `receive={false}`, `Puppet3 noShadow`, `Sprite` không ăn sáng); KHÔNG viết `receiveShadow={false}` trần, vì `autoReceive` sẽ bật lại.
- **Renderer và đèn chính:** canvas có `shadows={{type: THREE.VSMShadowMap}}`; đèn chính (`SceneLight` ở `look.tsx`, `Sun` ở `room.tsx`) có `castShadow`, khung bóng (`shadow-camera-*`, tham số `reach`) phủ hết phần cảnh máy thấy. Sọc lỗi bóng (shadow acne) thì chỉnh `shadow-bias` / `shadow-normalBias` của chính đèn đó, không tắt nhận bóng.
- **Ngoài trời:** nắng ấm, trời mát. Màu đất (`ground`) của đèn bán cầu là màu hắt lên từ mặt đất nói chung, KHÔNG lấy màu cỏ (lấy màu cỏ thì mọi mặt hướng xuống ngả xanh lá).
- **Công cụ rà:** `python3 tools/kiem_bong.py [file…]` (trong sandbox được). LOI: canvas có bóng mà không có `StageCam` / `<AutoRecv />`; `receiveShadow={false}` thiếu `noRecv`; đèn đổ bóng đặt phía sau sân khấu (`bong-ve-may`); xoay tấm người bằng số (`xoay-nguoi`). CANH: mesh nhận sáng không `castShadow` (cố ý thì ghi `bong:ok` trên cùng dòng); cảnh còn gọi `ContactShade` (`bong-chong`); một file của kênh có hai đèn cùng đổ bóng, đồ vật sẽ ra hai bóng lệch hướng (`hai-den-bong`; cố ý thì ghi `hai-den:ok`).
- **Luật bóng (Daniel chốt 25–26/11/2026); engine giữ giúp, cảnh và kênh không tự vá:**
  - *Mép bóng mềm 6 cm.* `autoReceive` đặt lại `shadow.radius` của mọi đèn song song và đèn chiếu theo `MEP_BONG_CM = 6` (`src/lib3/kit.tsx`). three đo radius bằng số ô của bản đồ bóng, nên không đặt tay: không viết `shadow-radius` trong cảnh, không vá three ở kênh.
  - *Bóng của NGƯỜI là hình bóng của chính người đó.* `Puppet3` vẽ một tấm mang hình bóng nhân vật (đúng tư thế đang diễn, mép nhoè); mỗi lần dựng, `autoReceive` ngả tấm đó xuống đất theo hướng đèn chính đã kéo vào khung bóng. Tấm người không đổ bóng qua bản đồ bóng của đèn, nên mỗi người có ĐÚNG MỘT bóng ở mọi cảnh (phòng có trần, đứng trên thảm, cảnh tự đặt đèn lệch).
  - *Đậm nhạt theo loại cảnh* (`BONG_NGUOI` trong `src/lib3/look.tsx`): ngoài trời ngày và chiều 0,42; tuyết và đêm ngoài trời 0,3; trong nhà sáng 0,32; trong nhà tối 0,22 (trong nhà vẫn có bóng, mờ hơn, theo độ sáng của cảnh). Cảnh sáng hay tối khác hẳn loại của nó thì truyền `bong={số}` cho `Puppet3`.
  - *Khung bóng có min và max* (`KHUNG_BONG`, `look.tsx`): bóng dài 0,35–0,8 lần chiều cao; đèn lệch ngang 10–35° so với trục máy; đèn đặt phía sau thì lật ra phía máy, để bóng ngả ra SAU. Engine kéo `SceneLight`, `Sun` ngoài trời và hướng bóng của người vào khung. Đèn `directionalLight` do cảnh tự đặt thì engine KHÔNG dời (bóng của ĐỒ VẬT đi theo đèn đó): tự đặt từ phía máy, trong khung; đặt phía sau thì `kiem_bong.py` báo LOI `bong-ve-may`. Cảnh không có đèn đổ bóng: bóng người ngả sang phải và ra sau, dài nửa người.
  - *Bóng dừng ở mép đất.* Engine dò mặt đất dọc theo bóng; tới mép bờ, mép bục thì bóng dừng ở đó.
  - *Không còn vệt tròn vẽ dưới chân*, cả người lẫn đồ vật. `ContactShade` đã tắt; cảnh mới không gọi nó.
  - *Đồ vật ở chỗ đèn không tới thì không cần bóng* (Daniel 26/11/2026): trong phòng, món nào nằm ngoài tầm đèn đổ bóng thì để vậy; không thêm đèn, không vẽ vệt để tạo bóng cho nó.
  - *Ngược sáng thật* (khung hình có cửa sổ ở tường sau, mặt trời thấp sau lưng): khai `nguocSang` trên đèn và ghi vào danh sách cảnh; bóng người khi đó ngả về phía máy.
  - *Người vẽ đúng MÀU RIÊNG, như video gốc (Daniel 26/11/2026: "đáng lẽ ta phải làm như rover"; chỗ ghi duy nhất).* Đo trên video gốc: người sáng như nhau ban ngày, ban đêm, đứng sát lửa hay xa lửa (lòng trắng mắt 254); cảnh có màu mạnh chỉ phủ một lớp màu nhẹ, đều lên cả người (trong lều đêm màu lam giảm 18 %, cõi lửa 6 %, trại đêm 0). Engine (`NGUOI_AN_DEN` trong `src/lib3/look.tsx`): người nhận 5 % độ sáng và 15 % màu của đèn trong cảnh; khoảng cho cảnh thường là 0–10 % và 0–20 % (`Puppet3 anSang`, `anMau`). Hệ quả: người không tối đi ở cảnh đêm, không trắng bệch cạnh lửa; bóng của vật khác đổ lên người gần như không thấy. Người đứng sát một hiệu ứng (phép, cổng, lửa lớn): `anMau` 0,5–1 (bảng chấm mục 8). Hình bóng tối trước đèn mạnh: `anSang={1}`. Không chỉnh người bằng `tint` hay `lift`. Ảnh TRƯỚC của cách cũ: `REMOTION_THU_AN_DEN="1,0"`.
  - *Nguồn sáng tự phát không làm chói (Daniel 26/11/2026: "các nguồn sáng tự phát trong hình phát ra ánh rất chói"; ông chọn "trần 1.4 và quầng 0.2").* Ở video gốc đèn lồng, nến, lửa là hình vẽ phẳng và bề mặt ngay cạnh nguồn không sáng hơn bề mặt ở xa. Engine (`NGUON_SANG` trong `src/lib3/look.tsx`) giữ hai trần: một đèn ĐIỂM (`pointLight`) không rọi lên bề mặt nào mạnh hơn 1,4 (bề mặt ở xa, nơi đèn vốn yếu hơn, không đổi); quầng `Halo` màu ấm (đèn, nến, lửa) không đậm hơn 0,2; quầng màu khác (phép, cổng) giữ nguyên. Cảnh không cần tự hạ đèn để chống chói; nhưng đèn bàn, đèn lồng thì lấy món có sẵn trong kho, không tự ghép một `pointLight` mạnh đặt sát đồ vật với một quầng bán kính hàng mét. Màu của chính hình tự sáng: mảng LỚN (cửa sổ, cửa lều, kính đèn) dùng vàng cam đậm như video gốc (khoảng #f5ce81, #f1b75e); vàng rất nhạt gần trắng (#fcf2c3) chỉ dành cho lõi nhỏ của ngọn lửa. Thử số khác: `REMOTION_THU_NGUON_SANG="trần đèn,trần quầng"` ("0,0" = cách cũ).
  - *Không xoay tấm người bằng số cụ thể* (`rotY`): cả người tối đi so với người đứng cạnh; quay mặt bằng `flip` và hướng mắt (skill 3).
  - Ảnh TRƯỚC để so: dựng với `REMOTION_SOI_BONG=luat-cu` (tắt mọi điều trên). Soi chỗ nằm của bóng người: `REMOTION_SOI_BONG=bong-do` (tô đỏ đặc).
- **Trước khi gửi ảnh:** chạy `kiem_bong.py` cho các file vừa sửa, và phóng to một vùng có bóng (chân tường, gầm bàn, mép mái) để xem bóng có rơi đúng lên mặt nhận, không sọc, không hở.
