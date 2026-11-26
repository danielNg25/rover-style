# Skill 1: dựng cảnh xếp lớp (cutout3d)

> Đổi bất cứ thứ gì trong cách làm, thư viện hay bộ khuôn thì ghi ngay vào skill này và thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Không ghi là mất.
> Ai làm việc gì, file nào của ai, cổng kiểm nào phải qua: `skills/4-quy-trinh.md`.

## Tra kho trước khi dựng (Daniel, 21/11/2026)

Mọi món dùng lại được đều nằm trong **kho asset** `assets/`: mỗi món một ảnh `assets/<nhóm>/<id>.png`, bảng tra `assets/catalog.json`, mục lục có ảnh `assets/DANH-MUC.md`, tấm tổng hợp từng nhóm `assets/_tong-hop/<nhóm>.jpg`. Món riêng của kênh đang làm (nhân vật, bối cảnh có người đứng sẵn) nằm ở `../kenh/<kênh>/kho/` cùng cách ghi; `tools/kho.py tim` tìm trên cả hai.

- Trước khi dựng một cảnh: đọc `assets/DANH-MUC.md` hoặc tìm bằng `python3 tools/kho.py tim <từ>` (không dấu cũng được: `tim den`, `tim san truong`). Mỗi mục cho biết món trông thế nào, hợp với cảnh nào, gọi bằng gì, code ở đâu.
- Món đã có thì gọi lại, đổi màu và seed cho hợp cảnh; chỉ làm mới thứ kho chưa có.
- **Luật này từng bị bỏ qua (Daniel 25/11/2026).** Kho chung có 9 món đá mà kênh anime-analyst tự viết 16 component đá ở tập shisui-1, có tên viết ở bốn file; cả ba kênh có 136 component tự viết thuộc loại kho đã có. Từ nay: (1) bảng đổi món của khuôn có cột **kho** cho TỪNG món (id món kho, hoặc "chưa có", hoặc "có <id> nhưng sai kiểu: <lý do>"); (2) món tự làm phải ghi `kho:ok <lý do>` trên dòng khai báo; (3) một món chỉ viết một lần trong kênh, file khác import; (4) `python3 tools/kiem_kho.py <file>` (kiem_canh.py tự gọi) in các dòng `tu-ve-lai`, `trung-mon`: xử lý hết trước khi báo xong. Tìm kho: `python3 tools/kho.py tim đá --nhom thien-nhien` (khớp nguyên từ; gõ có dấu thì khớp đúng dấu).
- **Món đã bỏ khỏi kho (Daniel 25/11/2026: "bỏ khỏi kho"):** núi chia hai màu theo sống dọc (`paintPeak`, `paintPeaks`) và đá tuyết nhiều mặt tam giác (`StandRock`, `RockShelter`, `RockMass`, `SnowRock`). Code còn vì tập Doom đã dựng bằng chúng; KHÔNG dùng cho cảnh mới. Núi và đá mới làm theo skill 2 và ảnh `bang-cham/nui-da.jpg`.
- Trong ghi chú sân khấu, liệt kê món lấy từ kho (theo id) và món mới làm. Món mới phải vào kho trước khi báo xong: xem `skills/2-chuan-mon-do.md`, mục Kho asset.
- Bối cảnh dựng xong cũng là một món của kho (nhóm `bo-canh`), kể cả các góc quay gần của nó.

Dùng khi phải dựng **ảnh tĩnh của một cảnh** (nền, bối cảnh, nhân vật đứng sẵn ở vị trí của họ). Kết quả là một file cảnh, một ảnh tĩnh đã tự soi, và một **ghi chú sân khấu** cho bước diễn xuất (skill 3). Chuẩn cho từng món đồ nằm ở skill 2.

Thư mục dự án: `cutout3d/chung/` (Remotion + three.js; đường cũ `rover-lab/` là liên kết tới đây). Mọi đường dẫn dưới đây tính từ đó. Cảnh quay của từng kênh nằm ở `../kenh/<kênh>/tap/<tập>/` và import phần chung bằng đường tương đối (`../../../../chung/src/...`); `out/` là liên kết tới `../kenh/<kênh>/out/`.

**Phần chung không biết kênh nào (23/11/2026).** Bối cảnh trong `src/demo/` chỉ nhận người qua `children` (hay `figures` của `Shot`) và không import dàn nhân vật của kênh nào. Ảnh tĩnh "người đứng ở mốc", mốc và góc máy của từng cảnh quay của một tập, dữ liệu riêng của tập (đám đông của một cảnh, kế hoạch dỡ lều…) viết ở `../kenh/<kênh>/tap/<tập>/dung-canh/<BốiCảnh>Nguoi.tsx` và import bối cảnh từ phần chung (mẫu: các file `*Nguoi.tsx` của tập doom-1). Ảnh tĩnh của bối cảnh trong phần chung là ảnh không người. Cổng: `grep -rn "kenh/\|Cast'" src` trong phần chung không ra dòng import nào.

## Thứ tự làm

1. Đọc câu lời đọc và phiếu cảnh: có ai, mấy người, làm gì, đi vào từ đâu.
2. Tính chỗ đứng của nhân vật bằng số (mục "Máy quay và chỗ đứng").
3. Viết file cảnh `src/demo/<Ten>.tsx`, đăng kí comp trong `src/Root.tsx`.
4. Dựng ảnh, tự mở ảnh ra soi theo danh sách ở cuối, sửa, dựng lại. Thường cần 3–6 lượt.
5. Viết ghi chú sân khấu.

Xem bốn ảnh đã duyệt để biết mức phải đạt: `out/valley/thung-lung-thu.png`, `out/camp/trai-chang-vang.png`, `out/village/lang-que-khong-mau.png`, `out/classroom/lop-hoc-lam-tay.png`. Code của chúng: `src/demo/Valley.tsx`, `Camp.tsx`, `Village.tsx`, `Classroom.tsx`.

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
| Tiền cảnh | cỏ mép dưới, góc ao | `Plate` rất gần, `order={900}` | 2.6–3.4 m |

- Cả cảnh có sương màu trời gần chân trời (`StageCam` đặt giúp), nên lớp xa tự nhạt.
- Xa thì lạnh và nhạt, gần thì ấm và đậm. Cảnh "đêm" là chạng vạng: nền xám xanh sáng vừa, phần ấm (lửa, đèn, cửa sáng) ở tầm giữa.
- Hình to, đơn giản, hai ba sắc, phía sáng ở bên trái.
- Một đường dẫn mắt (đường đi, hàng rào, đường ray) tới mốc cảnh; hai bên có vật đóng khung.
- Không vùng nào trơn: chia khung 12 ô (4 × 3), ô nào cũng có ít nhất hai lớp.

## Trong nhà

- Căn phòng là hộp thật (tường, trần, sàn là khối) để tự chắn nắng và nhận vệt nắng.
- Nhìn chéo vào một góc phòng bằng cách **xoay cả nhóm phòng** khoảng 0.45 rad (máy không xoay được); bọc phòng trong `RoomCtx.Provider value={góc}`.
- Các lớp: cảnh ngoài cửa sổ (`Plate`); vỏ phòng; đồ gắn tường; bục hoặc bàn chính cùng nhân vật; các hàng bàn ghế lùi dần; mặt bàn gần nhất làm tiền cảnh. Không dùng `Plate` tiền cảnh trong phòng.
- Ánh sáng buổi sáng: phòng phải SÁNG. `hemisphereLight` khoảng 1.95 và `Sun` (trong `src/lib3/room.tsx`) cường độ khoảng 5, thấp khoảng 22°, chéo khoảng 35° về phía tường chính. Không để vật gì đứng chắn cửa sổ; song cửa mảnh.
- Loại cảnh đặt bằng `GradeCtx.Provider value="brightInterior"`; khi đó `Sprite` tự ăn sáng của phòng.

## Sân khấu ngang (Daniel, 24/11/2026)

Daniel: các phiên khác "dựng sai bối cảnh theo chiều sâu dọc vào trong nhưng mà ta cảnh ngang", "mọi thứ khá là mess, ko clean". Phim cắt giấy là sân khấu NGANG: người và việc chính trải theo bề ngang khung; chiều sâu chỉ để xếp lớp nền.

- Người diễn trong một cảnh đứng trên một dải ngang nông: lệch nhau theo z không quá khoảng 2,5 m. Hai người nói chuyện đứng ngang hàng, nhìn nhau theo chiều ngang khung.
- Vào và ra ở mép trái, phải khung; đi ngang qua khung. Không cho người đi từ sâu trong khung ra phía máy hay đi vào sâu, trừ cảnh đặc biệt ghi trong danh sách cảnh.
- Đồ đạc của việc chính (bàn, bảng, cửa, giường) cũng nằm trên dải đó. Đồ xếp nối đuôi nhau vào sâu (hành lang, dãy bàn chạy thẳng vào) là lỗi; muốn có chiều sâu thì cho lớp nền chồng lên nhau theo khoảng cách (bảng chín lớp ở trên).
- Lớp nền phải CHỒNG lên nhau và có vật đóng khung ở mép (cột, khung cửa, cây gần, đồ gần máy): không để nền thành các sọc ngang song song trời / núi / dải nhà / dải đất. Vật lặp (cây, nhà, cột) lệch khoảng cách, cỡ, hình.
- Chuẩn bằng hình: `skills/bang-cham/` (mục 1, 2, 4, 6) và `giai-phau-canh.jpg`. Từ 25/11: vật đóng khung chỉ đòi ở toàn cảnh và trung cảnh; kiến trúc có nhịp (lan can, ô cửa) được lặp đều.

## Cảnh mẫu của cảnh (Daniel duyệt 25/11/2026)

Hình của các phiên bị chê "không ổn". Thêm luật màu (một công thức chung, rồi bảng màu theo loại cảnh) đều không ra: hình nhợt nhạt, hoặc đúng số mà vẫn khác phim. Cách cho hình gần video gốc nhất là để người dựng NHÌN một bộ khung của chính video gốc, chọn theo cảnh sắp dựng. Vì vậy workflow `dung-canh-3d` có bước CHỌN CẢNH MẪU trước bước dựng.

- **Thư viện:** `skills/canh-mau/` gồm 573 khung của 202 bối cảnh cắt từ hai video của kênh gốc, đã đặt tên và phân loại (`canh-mau.json`, `MUC-LUC.md`, ảnh `anh/<mã>.jpg`, tấm ghép theo loại `tam-loai/`), và chín tấm cắt cận theo loại vật ở `cat-can/` (đồ gỗ, cây cỏ, kiến trúc, đồ nhỏ, mặt phẳng lớn, bóng và nguồn sáng, hạt và hiệu ứng, trời núi lớp xa, bố cục). Tra, ghép tấm, làm lưới: `python3 tools/canh_mau.py tim … | ghep … | luoi …`.
- **Bộ được giao:** 8–12 khung cùng kiểu nơi chốn, cùng giờ, cùng cỡ cảnh với cảnh sắp dựng, lấy từ ít nhất bốn bối cảnh khác nhau, kèm 2–4 tấm cắt cận. Danh sách nằm trong phiếu giao việc. Mở xem HẾT trước khi làm, rồi viết ra 8–10 điều LẶP LẠI ở phần lớn ảnh (đồ vật mấy sắc độ, có nét bên trong không; bề mặt lớn phẳng tới đâu; đồ gom quanh người thế nào; người to cỡ nào; bóng; hạt; bộ màu).
- **Cảnh mẫu dạy CÁCH VẼ, danh sách cảnh quyết định VẼ CÁI GÌ.** Nơi chốn, văn hoá, thời đại, đồ vật, không khí (nắng, bụi trong nắng, lớp xa) lấy từ mô tả cảnh, và từ cảnh gốc khi sửa một cảnh có sẵn. Không chép nhà cửa, đồ vật của cảnh mẫu (cảnh Nhật không được thành phố Tây); không bám vào một ảnh; không thêm thứ mô tả không có chỉ để cho giống hay cho đủ một con số.
- **Mức vẽ:** đồ vật 2–4 sắc cùng họ màu, có mặt sáng mặt tối, vài nét bên trong và chi tiết nhận diện: không hộp trơn, không vụn, không viền đen. Khối tự nhiên (đá, vách, gò đất) là vài khối LỚN bo tròn, mỗi khối 2–3 mảng sáng tối chéo theo nắng: không xếp ô như tường gạch, không lưới tam giác; rêu, cỏ trên đá là vài mảng phủ ở đỉnh và vai khối, không rải chấm; nước của thác bám theo từng bậc đá và rộng dần xuống dưới; vật để người đứng lên có một mặt vát sáng phía nắng; dưới mọi vật và người có bóng mềm lệch về phía xa nắng; đồ nhỏ gần máy không to quá tỉ lệ thật so với người (các lỗi đã gặp ở cảnh thử khe suối, 25/11). **Núi và đá (Daniel 25/11/2026, cảnh bờ sông tập Shisui: "núi đá bị kiểu 2 màu theo chiều dọc và các khối có mặt tam giác này xấu"; ảnh so SAI và ĐÚNG: `bang-cham/nui-da.jpg`):** núi xa là mảng bóng phẳng, MỖI LỚP MỘT SẮC, lớp chồng lớp, càng xa càng nhạt; muốn núi có khối thì thêm chỏm tuyết mép gãy, hoặc một mảng tối rộng bám theo sườn, hai sắc gần nhau. KHÔNG kẻ một sống thẳng từ đỉnh xuống rồi tô hai nửa hai màu (núi thành kim tự tháp giấy gấp). Tảng đá là MỘT khối bo, 2–3 mảng lớn, mặt trên sáng, mặt bên tối, các sắc gần nhau. KHÔNG ghép đá từ nhiều mặt tam giác mỗi mặt một sắc (khối đa giác kiểu low-poly). Núi xa là tấm nền phẳng; đá là khối tiện hoặc khối 3D (skill 2, mục "Phẳng hay khối"), lấy dáng và mặt vẽ từ tranh Codex (thẻ luật cứng 13). Lỗi là chia khối thành nhiều mặt tam giác mỗi mặt một sắc, không phải là việc dựng khối. Đồ phụ gom thành 2–3 cụm, mỗi cụm 2–4 vật chồng mép, đặt bên cạnh người. Bề mặt lớn yên, kiểu rất nhẹ.
- **Bối cảnh dựng MỚI thì theo KHUÔN (25/11/2026).** Chỉ cho xem kiểu vẽ là chưa đủ: bối cảnh mới dựng theo bộ cảnh mẫu vẫn ra khối xám trống (khe suối tập Shisui), vì agent phải tự nghĩ ra cả cảnh. Tập Doom đạt vì mỗi cảnh có một khung video gốc làm bản thiết kế và đồ được làm trước. Nên bước chọn mẫu giao thêm MỘT khung khuôn có cùng kiểu không gian, kèm các lớp của nó, bảng đổi từng món sang thế giới của tập, và màu theo vai. Người dựng làm ba bước: (1) LÀM ĐỒ TRƯỚC: món cần nét vẽ (cây, đá, thác, đồ nhỏ, lớp xa) thì VẼ BẰNG CODEX theo skill 2, mục Vẽ đồ bằng Codex; khối xây dựng, mặt đất, mặt nước thì vẽ bằng code. Dựng tấm đồ có nhãn, soi từng món cạnh khuôn rồi mới ghép; (2) GHÉP theo khuôn: đủ lớp, mỗi lớp số món ngang với khuôn, vị trí và cỡ tương đối như khuôn, bóng mềm dưới mọi vật và người; (3) MÀU theo vai của khuôn, đo trên ảnh dựng ra: `python3 tools/do_mau_khuon.py <ảnh của mình> <khung khuôn>` không có LOI. Agent tự chọn màu thì ra chói (lá xanh nõn, cát gần trắng, nước gần trắng), và đèn còn đẩy mặt nhận sáng nhạt thêm: tô vật liệu sẫm hơn đích hoặc hạ đèn. Không bỏ món, không thêm món để đạt số. Phiên chính chạy workflow với `chi_khuon: true` để gửi Daniel bảng đổi món trước khi dựng.
- **Sửa một cảnh có sẵn:** kiểm kê thành ba nhóm GIỮ (nơi chốn, văn hoá, vật của câu chuyện, không khí), GOM (đồ phụ đang nhỏ, rời rạc), BỎ (chỉ là nhiễu: vân và hoa văn dày trên bề mặt lớn, mảng loang nhoè, khối đa giác lởm chởm, vật to chắn suốt mép khung, vật vụn rải rác). Không bỏ thứ gì khác.
- **Không đổi thứ đã duyệt:** màu áo, kiểu vẽ, hình dáng nhân vật giữ theo dàn của kênh; cỡ cảnh, góc máy, chỗ đứng, diễn xuất giữ theo danh sách cảnh. Cảnh mẫu không phải lý do để lùi máy hay tô lại áo.
- **Tấm lạc loài:** đặt ảnh của mình lẫn vào năm khung của bộ cảnh mẫu (`tools/canh_mau.py luoi`); ô của mình lạc ở điểm nào thì sửa. Sau đó người rà đoán mù đúng phép này.
- **Màu:** không có công thức chung và không có bảng số phải đạt. Màu nhìn theo bộ cảnh mẫu, giữ màu nhận diện của nơi chốn. Đèn gần trắng, người và vật gần giữ màu riêng. Cả khung ngả ấm vì lớp phủ cuối thì tắt lớp ấm của `Finish` ở cảnh quay (`finish={{warm: '', warmAmount: 0}}`). Không chữa màu bằng bộ lọc hậu kỳ.


## Máy quay và chỗ đứng

- Ống kính cố định 28°, luôn nhìn thẳng theo −z: `<StageCam eye={[x, cao, z]} haze="#..." fog={[gần, xa]} />`.
- Mọi `Plate` của cảnh nhận `from={eye}`. `Plate` vẽ theo đơn vị màn hình 1600 × 900.
- Một điểm trên đất cách máy D mét hiện ở: ngang `0.5 + x / (0.887 × D)`, dọc `0.5 + caoMáy / (0.4986 × D)`. Nửa bề ngang khung ở khoảng cách D là `0.4435 × D`: dùng nó để biết mép khung ở đâu (chỗ nhân vật đi vào) và thứ gì lọt vừa khung.
- **Sàn nâng cao** (sân ga, bậc thềm, bờ đê): nhân vật luôn đứng ở cao độ 0. Cho mặt sàn nâng là 0 và hạ phần đất bên cạnh xuống.
- **Kiểu máy có tên** (24/11/2026, `src/lib3/kieuMay.ts`): `<Shot may={{kieu: 'theo-phai', D: 6.5, muc: 'vua'}} …/>` (D = khoảng cách máy tới chủ thể, mét) hoặc `mayQuay(kieu, f, dur, D, muc)` trả `{dx, dy, dz, yaw, pitch}` cho cảnh dựng thẳng bằng StageCam (pitch, dy qua `NgocCtx`, `NangCtx` trong `duongMay.ts`, hoặc prop `dy`). Kiểu: `truot-trai/phai`, `day`, `keo`, `luon-trai/phai`, `theo-trai/phai`, `nang`, `ha`, `day-lia-trai/phai`. Đi đều tốc, khung giữa cảnh = khung chuẩn của bảng phân cảnh; giới hạn kẹp trong code. `theo` và `luon` giả định chủ thể đứng thẳng trước máy ở khung chuẩn. Cảnh thử: composition `thu-may-<kieu>` (`src/demo/ThuKieuMay.tsx`).
- **Máy đi vòng** `vong-trai`/`vong-phai` (Daniel duyệt 25/11/2026, "xoay như vậy đúng rồi"; bản 3°/s đầu bị chê "xoay hơi nhanh"): máy đi cung tròn quanh chủ thể, giữ khoảng cách D, luôn nhìn vào chủ thể. Tốc độ góc 1,5°/giây (nhẹ), 2,5°/giây (vừa), trần 20° hoặc `may.cung` nếu nhỏ hơn. Tấm nền xa quay theo máy một phần (`VongCtx`) nên mép không lộ; vật gắn lên tấm nền (đèn cửa sổ, cờ) phải bọc `TheoTam` (`depth.tsx`), bối cảnh chưa bọc thì không dùng vong. Phòng hở mặt trước: soi lại khi máy quay về phía mặt hở. Chủ thể phải đứng thẳng trước máy ở khung chuẩn. Dùng cho cảnh nhấn của một nhân vật, vài cảnh mỗi chương.
- **Máy lượn** (cảnh mới gọi qua `Shot may={{kieu: 'luon-trai'|'luon-phai', D}}`; bên dưới là hàm gốc `src/lib3/duongMay.ts`): `duongMay(f, dur, D, {cung})` với `cung` 3–5 độ; chỉ một hai cảnh rộng mỗi chương (luật 9a); truyền `yaw` nhận được vào `Shot` (prop `yaw`).
- Bối cảnh dựng trực tiếp (không qua `Shot`) bọc phần cần xoay trong `XoayCtx.Provider value={yaw}` (`XoayCtx` ở cùng file), đặt BÊN TRONG `ThreeCanvas`.
- Máy ngang tầm mắt (1.5–1.9 m) cho cảnh có nhân vật; nâng lên 3–3.4 m khi cần thấy ruộng, mặt nước, sân rộng.
- Nhân vật: người lớn cao 1.7, trẻ con 1.15. Toàn cảnh thì người cao khoảng 40–50 % khung. Đồ cao 0.7 m che mặt sàn sau nó tới khoảng 1.8 lần khoảng cách của nó.
- **Vật to ngay sau lưng nhân vật** (đoàn tàu, bức tường, toà nhà): với ống kính này nó thành một bức vách sau đầu người. Đẩy nó ra xa, cho mép khung cắt bớt nó, và giữ sau mỗi cái đầu một dải khác sắc (ví dụ dải sơn kem của đầu máy). Vật dài như xe, tàu thì không xoay 0.5 rad như nhà.
- **Kiểm đầu nhân vật trên MỌI lớp phía sau, kể cả các tấm vẽ xa:** tính vị trí cái đầu trên màn hình, rồi xem ở từng lớp phía sau, đúng chỗ đó là gì. Dời vật hoặc dời người cho tới khi sau mỗi cái đầu là một mảng sạch, khác sắc với tóc. Mọi hình phẳng đặt ở tầm 10–40 m rất dễ rơi đúng cạnh đầu.
- Người đứng trên bậc thềm hay sàn cao: `Puppet3` nhận `pos` có cao độ khác 0 bình thường.
- `withPose` làm mất cờ `show` của tay áo choàng: nhân vật mặc `coat` phải tự truyền tư thế tay kèm `show: true`, nếu không tay biến mất.
- Đặt nhân vật vào cảnh ngay từ ảnh tĩnh, tư thế trung tính: `<Puppet3 height={1.7} pos={[x, 0, z]} spec={...} />` (người đứng bên phải nhìn sang trái thì thêm `flip`; trong phòng xoay thì thêm `rotY={-góc}`).

## Người đứng trước nhà cửa: đừng lùi máy để lấy trọn toà nhà

Daniel chê bản sân trường đầu tiên "nền hơi xa quá" (21/11/2026): agent lùi máy 70 m để lấy trọn tháp đồng hồ, nên người nhỏ xíu và nửa khung là bãi cỏ.

Nguyên tắc (không phải con số):

- **Khoảng cách máy chọn theo thứ cảnh quay cần cho thấy** (người, hành động), không theo việc toà nhà có lọt trọn khung hay không. Toà nhà được phép bị mép khung cắt, kể cả lấp kín cả khung, không thấy trời.
- **Không "ngước" máy** để ôm trọn nhà cao; máy vẫn nhìn ngang. Muốn chân tường nằm thấp trong khung thì nâng máy lên.
- **Khoảng giữa người và toà nhà phải có thứ chồng lên mặt tiền** (cây, cột đèn, ghế, xe đạp, bảng tin, tượng, bồn hoa). Bãi cỏ hay sân trống giữa người và nhà là dấu hiệu máy đang đứng quá xa.
- Mỗi cảnh quay một độ gần khác nhau; cùng một bối cảnh có thể vừa có cảnh mở rộng vừa có cảnh sát.

Ví dụ đã thấy trong phim mẫu, chỉ để hình dung, KHÔNG phải luật:

- Cảnh mở sân trường: máy cao khoảng 3 m, người nhỏ ở phần dưới khung, toà nhà gần và bị cắt ở mái.
- Cảnh hai người đứng nói trước cửa: người cao gần hết khung, toà nhà ngay sau lưng lấp kín khung, không thấy trời, chỉ còn tầng trệt với cột cửa và cửa sổ sáng đèn.

## Một bối cảnh, nhiều cảnh quay

- Dựng bối cảnh một lần, rồi mỗi cảnh quay đặt máy ở chỗ khác bằng `Shot` trong `src/lib3/shot.tsx`: `<Shot grade=... eye={[x, y, z]} set={(inside, cam) => <Scene dx={cam.dx} dz={cam.dz}>{inside}</Scene>} figures={...} />`. Tấm vẽ tiền cảnh của bối cảnh tự ẩn đi khi máy rời chỗ chuẩn.
- Trung cảnh và cận mặt: `eye={frameOn({pos, height, spec}, 'medium' | 'close', lệch)}` đặt khung theo ĐẦU nhân vật (đầu chiếm 30 % hoặc 50 % chiều cao khung); thêm `soft={1.0}` hoặc `soft={1.6}` để nền mềm đi ở cảnh một người. Toàn cảnh thì nét hết.
- Điểm trong phòng xoay đổi ra toạ độ thật bằng `roomPoint(yaw, cam, điểm)`.
- Mỗi vị trí máy phải kiểm lại đầu nhân vật trên mọi lớp phía sau; đồ trang trí thêm cho riêng một cảnh quay có thể đưa vào qua `figures`.
- Con đường chạy thẳng về phía máy sẽ lấp kín đáy khung; đường dẫn mắt phải cắt chéo khung.
- Bối cảnh sâu (trên 50 m) thì bóng đổ thô và mờ; giữ phần có bóng quan trọng trong khoảng 25 m quanh nhân vật.

- **Nền mềm cho trung cảnh và cận mặt** (`Shot` với `soft`): nhân vật vẫn ăn sáng và nhận bóng của bối cảnh. `Shot` vẽ hai lớp bằng `Ghost` và `Solid` (`src/lib3/shot.tsx`): lớp nền bị làm mềm vẽ bối cảnh với nhân vật vô hình nhưng vẫn đổ bóng; lớp nét vẽ bối cảnh vô hình (vẫn che và vẫn chiếu sáng) với nhân vật thật. Dùng được cho mọi bối cảnh gọi qua `Shot`; đã thử ở sân trường (cảnh 16).

- **Phòng dựng hở mặt trước** (máy quay đứng ngoài nhìn vào) không có bức tường thứ tư. Một cảnh đảo góc nhìn ra phía hở sẽ không có nền: phải thêm bức tường đó cho riêng cảnh ấy, hoặc lấp kín bằng khói, bóng tối. Khi viết ghi chú sân khấu, ghi luôn máy quay được lùi, trượt tối đa bao nhiêu trước khi mép tường hở lọt vào khung.
- **Một bối cảnh có thể có nhiều trạng thái** (ví dụ phòng thí nghiệm: `night`, `dark`, `wrecked`): cùng vỏ phòng và cùng các mốc, đổi đồ đạc, ánh sáng, hư hại. Trạng thái cũ phải dựng ra y như trước; ánh sáng do cảnh quay điều khiển theo khung (ánh máy `glow`) là tham số riêng, không nằm trong trạng thái.
- **Tay chạm đồ vật:** bộ khuôn chưa có số đo tầm tay, nên đặt bàn tay lên một vật (cần gạt, tay nắm cửa) là thử từng chút. Đồ vật để nhân vật chạm phải nằm trong khoảng từ hông tới vai của hình vẽ, ở phía nhìn thấy được từ máy quay; kiểm bằng ảnh tĩnh trước khi diễn.
- **Nhân vật là tấm phẳng nên không có "mặt bên" hay viền sáng:** đèn đặt sau mặt phẳng nhân vật để nó tối; muốn ánh màu hắt lên người thì đặt một đèn phụ ở phía trước nhân vật. "Viền sáng" quanh người chưa làm được.

## Nội cảnh ban đêm

Cảnh mẫu: `src/demo/Lab.tsx` (phòng thí nghiệm). Đêm trong phòng là TỐI VỪA, không đen: mọi thứ vẫn phải đọc được.

- Ánh sáng nền lạnh khoảng 1.0 (`hemisphereLight` màu xanh tím nhạt). Để 0.55 thì nửa dưới khung đen kịt.
- Trăng là một đèn hướng lạnh đi qua cửa sổ, in khung cửa lên sàn; đèn bàn là một đèn chụp ấm có bóng; hành lang sáng hắt qua cửa; vật phát sáng (cỗ máy) có một đèn điểm yếu màu riêng.
- Nhân vật tự ăn sáng của phòng (gần đèn bàn thì ấm, trong tối thì xám xanh); không truyền `tint` bằng tay.

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
    <Plate from={EYE} id="x-fg" d={3.4} paint={foreground} fog={false} order={900} />
  </Scene3>
);
// ảnh tĩnh: <AbsoluteFill><Finish><ThreeCanvas width height flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>...</ThreeCanvas></Finish></AbsoluteFill>
```

- `Scene3 grade`: `dayExterior`, `lateDay` (chiều muộn: nắng ấm mạnh, bóng dài rõ; đặt hướng nắng thấp như `dir={[-8, 4.5, 3.5]}`), `nightExterior` (chạng vạng, thường thêm `gain={1.5}`), `snowExterior`, `brightInterior`, `darkInterior`. Dùng `dayExterior` với nắng thấp thì bóng gần như biến mất.
- Các lớp vẽ riêng của cảnh (trời, núi, rặng cây) nằm trong file cảnh; món dùng lại được thì vào thư viện.
- Thứ sẽ chuyển động (khói, lửa, hạt) nhận số khung `f`; cảnh có thể nhận thêm `moving` để ảnh tĩnh giữ hình tĩnh còn đoạn phim thì dùng bản động.
- `Scatter` (đá, cỏ, vết rải trên đất): `area` tính quanh `pos`; `keep` là các vùng trống `[x, z, bán kính]` tính TỪ `pos`; đừng để `area` chạm sát máy, đá gần máy sẽ to khổng lồ. Dọn sạch lối đi của nhân vật.
- `id` của `Plate` và `name` của `Sprite` phải khác nhau giữa các hình; đổi cách vẽ thì đổi tên. Khung vẽ của `Sprite` phải chứa trọn hình.
- Thứ tự vẽ: `Plate` 0, bóng tiếp đất 2, `Sprite` 3, quầng sáng 4, nhân vật 500, tiền cảnh 900.
- Dựng ảnh: `./still.sh <comp> 0` ra `out/<comp>-0.png`. Trình duyệt không chạy được trong sandbox, lệnh này phải chạy ngoài sandbox.
- Kiểm kiểu: `npx tsc --noEmit -p . 2>&1 | grep -E "src/(lib3|demo)"`.

## Thư viện

- `src/lib3/depth.tsx`: `Plate`, `Sprite`, và các kiểu vẽ `paintPeak`, `paintKarst`, `paintHills`, `paintPine`, `paintTree`, `paintBanyan`, `paintBamboo`, `paintPalm`, `paintBanana`, `paintBush`, `paintTuft`, `paintHaystack`, `paintRock`, `paintHouse`, `paintCastle`, `paintPagoda`, `paintCloud`, `paintBuffalo`, `paintEgret`, `paintChicken`, `paintFlameTree`, `paintWaterTower`, `paintSmoke`, cùng vài món lớp học. Cảnh mẫu thứ năm: `src/demo/Station.tsx` (ga xe lửa, do agent dựng từ skill này).
- `src/lib3/kit.tsx`: `B` (khối hộp), `StageCam`, `Label` (chữ trên biển hoặc trên một mặt), `Road`, `Fence`, `Cottage`, `ThatchHouse`, `Gate`, `BambooFence`, `Tent`, `Wagon`, `Lantern`, `LogSeat`, `Fire`, `Fireflies`, `FlyingLeaves`, `Motes`, `Well`, `Crate`, `Barrel`, `Sack`, `Jar`; nhà ga: `Track`, `Locomotive`, `Carriage`, `Platform`, `StationShelter`, `Bench`, `StationLamp`, `Semaphore`, `PoleLine`, `CarryBaskets`, `LocoSmoke`.
- `src/lib3/shot.tsx`: `Shot`, `frameOn`, `roomPoint` (một bối cảnh, nhiều cảnh quay).
- `src/lib3/kitCampus.tsx` (giảng đường, kí túc, cổng sắt, đèn gang, ghế đá, tượng, giá xe đạp, cây phong) và `src/lib3/kitLab.tsx` (cỗ máy vòng, đèn bàn, đèn chụp `Spot`, đồ phòng thí nghiệm).
- `src/lib3/room.tsx`: `RoomCtx`, `Sun`, `WindowWall`, `Desk`, `TeacherDesk`, `Cabinet`, `CeilingFan`, `Spr` (hình phẳng đứng tự do trong phòng xoay).
- `src/lib3/look.tsx`: `Scene3`, `Ground`, `FacetLathe` (khối tiện cho đá, cột, thùng tròn), `Halo`, `Finish`.
- Món chưa có thì tự làm theo skill 2 và thêm vào thư viện, không để trong file cảnh.

## Tự soi trước khi giao

- Có gì quá to, quá sát máy, che mất lớp xa không?
- 12 ô: ô nào trơn?
- Mảng phẳng lớn nào (tán cây một hình tròn, mái một mặt phẳng) cần thêm cấu trúc?
- Chỗ chạm mép: vật mọc ra từ đầu nhân vật, dây cắt ngang người, con vật như đứng trên tường?
- Thứ tự vẽ: quầng sáng đè lên mặt, bóng cây xa hiện xuyên thân cây gần?
- Hình bị cắt cụt vì khung vẽ nhỏ? Chữ trong cảnh có đúng nghĩa, đúng ngày tháng?
- Nhân vật: đủ chỗ đứng, thấy được bàn chân, nổi trên nền, có lối đi nếu họ phải đi?
- Cảnh có cần hạt lơ lửng, lá bay, quầng sáng không (bụi nắng, tàn lửa, đom đóm, tuyết, lá rơi, quầng đèn)? Cảnh ngoài trời gần như luôn cần một thứ. Ghi vào ghi chú sân khấu.

Không chỉnh hình để qua một con số; nhìn bằng mắt là chính.

## Chỗ đứng phải có khoảng hở thật

- Mốc đứng của nhân vật phải cách tường, tủ, đồng hồ, mép bàn ít nhất nửa thân (0,12 m) cộng tầm tay của động tác sẽ diễn ở đó (vẫy tay, chỉ tay: khoảng 0,5 m về phía tay vươn). Lỗi đã gặp: mốc đứng sát tường làm tay vẫy xuyên qua đồng hồ treo tường.
- Ảnh tĩnh có người cũng phải qua kiểm vật lý: `tools/vatly.py <comp>` (cách chạy và cách đọc ở `skills/3-nhan-vat-dien-xuat.md`, mục Kiểm vật lý). Không được có khung tím.
- Trong ghi chú sân khấu, ghi kèm mỗi mốc đứng: vật gần nhất ở bên trái, bên phải, phía sau và cách bao xa.

## Bổ sung từ phép thử Tesla (22/11/2026)

- **Bối cảnh dài (phố 200 m):** đèn chính của `Scene3` chỉ đổ bóng trong một vùng quanh gốc toạ độ (`reach`); góc máy ở xa gốc sẽ không có bóng. Hiện phải tự đặt một đèn chính có đích ngắm gần góc máy trong file cảnh (xem `src/demo/NyStreet.tsx`); chưa có tham số dùng chung.
- **Ghi chú sân khấu nên có bảng mốc thời gian của hiệu ứng** mà bối cảnh tự chạy (đèn bật lan dần ở khung nào tới đâu), danh sách người lọt khung ở từng góc máy, và giới hạn trượt, đẩy của từng góc. Ghi chú hội chợ (`out/tesla/ghi-chu-san-khau-HC-NHA.md`) là mẫu tốt: người quay gần như chỉ còn đặt máy.
- **Mỗi mốc đứng ghi kèm trạng thái đã kiểm** (ví dụ "kiểm ở `dark`"); sang trạng thái khác đồ đạc có thể đã dời.
- **Bối cảnh tự chạy kế hoạch ánh sáng của từng cảnh** (ví dụ `powerShot1`, `homeShot14`) là cách giao việc gọn cho khâu diễn xuất.

## Toà nhà lớn phải đủ chi tiết (Daniel xem đoạn Tesla, 22/11/2026)

Daniel: "vẫn chưa đẹp lắm, chắc là vì chưa đủ chi tiết... chỗ lâu đài chưa làm đủ chi tiết và texture các thứ". Các cung điện trắng ở hội chợ chỉ có khối hộp, hàng cột và dây đèn; mặt tường trơn.

- Một toà nhà chiếm nhiều khung phải có chi tiết ở BA CỠ: cỡ lớn (khối nhô ra thụt vào, tầng, mái, vòm), cỡ vừa (cửa sổ, gờ, phào, lan can, tượng, bậc), cỡ nhỏ (vân của vật liệu: mạch đá, gạch, vết ố, vết nước chảy, chỗ sờn). Thiếu cỡ nhỏ thì mặt tường thành một mảng phẳng dù hình khối đúng.
- Mặt tường trắng hoặc sáng càng cần vân và bóng đổ của các gờ, vì không có màu đỡ.
- Chuẩn năm thứ cho mỗi món (skill 2) áp cho từng PHẦN của toà nhà lớn, không chỉ cho cả toà.
- Khi tự soi: phóng to một ô bằng một phần mười hai khung ở mặt toà nhà; nếu trong ô chỉ có một màu phẳng thì chưa đạt.

## Ghi chú sân khấu (giao cho bước diễn xuất)

```
comp ảnh tĩnh: <id>            file cảnh: src/demo/<Ten>.tsx, component <Scene> nhận {children, f, dx, dz}
máy: eye [x, y, z]; được trượt dx ±..., đẩy dz ...
nhân vật: tên, cao, vị trí [x, 0, z], có flip không, spec đang dùng
vùng trống đi lại được: x từ ... tới ..., z ...; lối vào: từ trái / phải, điểm bắt đầu ngoài mép khung ở x = ..., quãng đi bao nhiêu mét
thứ che chân hoặc dễ chạm mép: ...
ánh sáng: loại cảnh, hướng nắng; hạt cần có: ...
```

## Thư viện đồ của từng bối cảnh (bổ sung 22/11/2026)

- `src/lib3/kitForge.tsx`: lò rèn (mặt đá `paintStone`, sàn đá lát, gỗ có vân, lò, ống bễ, đe, mặt nạ rời, núi tuyết đêm có cờ phướn).
- `src/lib3/kitCamp.tsx`: trại du mục (lều vải mười cọc có khổ vải, đường may, miếng vá vẽ thẳng vào mặt vải; dây phơi, thảm, giỏ, bình gốm, nồi gang, củi, ghế đẩu, yên ngựa, xe đẩy; hàm vẽ ván gỗ có vân cho thùng và hộp; thùng rượu có nan và đai sắt).
- `src/lib3/kitLeuThayLang.tsx`: trong lều thầy lang (vách vải có đường may, đèn dầu, chậu than, bàn thuốc, đệm rơm, rương, dây thảo dược). `src/lib3/kitBanDo.tsx`: bản đồ giấy cũ (châu Âu không tên nước, tờ Latveria có lâu đài, đường nét đứt, dấu X). `src/lib3/kitDiaCau.tsx` (23/11/2026, Daniel: mẫu dùng quả địa cầu chứ không dùng bản đồ): quả địa cầu `DiaCau` là đĩa tròn chiếu trực giao thật từ kinh vĩ nên quay đúng (đổi `lon`, `lat` theo khung, `tienDo` cho nhịp đều), kiểu CẮT GIẤY (mảng phẳng mép sắc, mây miếng, nửa tối một mảng mép cong sắc, viền khí quyển vòng mảnh; lượt đầu kiểu phun mềm bị chê lệch kênh); nền vũ trụ chàm cắt giấy `NenVuTru` (Y khoảng 85, cầu 72 % khung với `cauEye()`); món bám theo cầu `SongLan` (vòng sóng lan), `DuongDi` (đường chấm, tàu nhỏ luôn thăng bằng), `Ghim` (chấm hoặc cờ, nhãn viết tay). Mẫu: comp `dia-cau-song-lan`, `dia-cau-duong-tau`. Cảnh hành trình, tin lan xa: dùng địa cầu trước, bản đồ giấy khi cần chi tiết một vùng. `src/lib3/kitGiangDuong.tsx` (23/11/2026): giảng đường Mỹ đầu thế kỉ 20 cho trạng thái `dai-hoc` của `Classroom` (`GiangDuong`, `LOP.eye`): tường cửa sổ khung gỗ ốp gỗ sồi, bảng đá phiến có phấn tự viết `ChalkWriting`, bàn dài, đèn chao xanh, bản đồ cuộn, thanh treo tranh, cảnh ngoài cửa sổ là toà gạch đỏ có tháp đồng hồ. Thêm trạng thái mới cho một bối cảnh cũ thì để code cũ nguyên văn (một nhánh mới, một component mới) và so điểm ảnh comp cũ trước khi báo.
- `src/lib3/kitSanhNgai.tsx`: sảnh ngai (cửa kính màu tự sáng và vệt sáng màu, cờ, đuốc tường, chân nến, tượng giáp, bệ, ngai, thảm).
- `src/lib3/kitGiayTo.tsx`: giấy tờ quay cận trên mặt bàn gỗ (tờ báo có tít và ảnh khoanh đỏ, thư mời có con dấu tròn đóng xuống, trang sổ tay có dòng tự viết, bong bóng nghĩ chứa một nhân vật).
- `src/lib3/kitHanhLy.tsx`: hành lý và sách (va li da đứng, đóng, xách tay; sách cầm tay, sách bay khi tua nhanh, giá sách có trang lật).
- `src/lib3/kitCampus.tsx`: sân trường (bảng tin đứng có mái và các tờ kết quả ghim, xe đạp, lá rụng).
- `src/lib3/kitPhongNgu.tsx`, `kitNuiTuyet.tsx`, `kitCoiLua.tsx`: phòng ngủ lâu đài; sườn núi tuyết và bão; cõi lửa, lửa đổi màu, Mephisto có khớp.
- Thêm một thư viện mới thì thêm tên file vào `LIBS` của `tools/kho.py`, nếu không cổng kiểm kho không thấy các món của nó.
- Bối cảnh cũ đem dùng lại phải được soi lại theo luật hiện nay TRƯỚC khi đưa vào cảnh quay (trại bản cũ bị Daniel chê: lều đơn giản, ít đồ, mặt gỗ trơn, miếng vá lệch).

## Độ sáng của bối cảnh: đo, không ước (23/11/2026)

Chủ kênh chê các cảnh tối "hơi bị nhiều và liên tục". Mọi ảnh tĩnh giao nộp phải qua `python3 tools/do_sang.py <ảnh…>` (chạy trong sandbox được) và ghi số Y vào báo cáo.

- **Ngưỡng:** không ảnh nào dưới Y 70. Cảnh đêm và trong nhà tối nằm ở 78–95; cảnh ngày và phòng sáng từ 105 trở lên. (Mẫu: trung bình 112, cảnh tối nhất của họ vẫn 69–76.)
- **Cảnh tối của mẫu làm thế nào** (xem 12 khung tối điển hình: phố đêm, hầm đá, địa ngục, xưởng, vũ trụ): nền là xám xanh hoặc đỏ cam ĐẬM MÀU, không đen; nhân vật giữ nguyên màu sáng của mình, không bị nhuộm tối theo phòng; nguồn sáng (cửa mở, cửa sổ, lửa, đèn, trăng) chiếm mảng lớn trong khung và hắt sáng lên tường, sàn quanh nó; góc phòng tối nhất vẫn đọc được đồ vật.
- **Sửa bằng thiết kế ánh sáng, không nhân sáng cả khung:** nâng ánh nền (`hemisphereLight`) và màu `bg`, làm sáng màu tường và sàn, mở rộng mảng sáng của nguồn sáng, giảm mờ tối ở mép khung. Giữ "đêm" bằng sắc xanh lạnh và nguồn sáng ấm chứ không bằng độ tối.
- **Trạng thái đã duyệt cũng phải nâng** khi dưới ngưỡng: đây là góp ý của chủ kênh cho mọi cảnh từ đầu tập. Gửi ảnh trước và sau cạnh nhau.
- Số trong `GRADES` của `look.tsx` và `classnorms.py` ở thang khác (xám 0–255); Y ≈ 16 + 0,86 × xám.

## Không khí trong cảnh ngoài trời: hạt bay bật sẵn (23/11/2026)

> Từ 24/11/2026 cách làm chính là **bụi theo nguồn** ở cuối mục này (`lib3/buiNguon`). `CampAir` / `AirLayer` chỉ còn cho các bối cảnh cũ đã dùng nó; bối cảnh mới không thêm lớp hạt riêng.

Daniel xem chương 3, 4: "các cảnh ở trại thiếu các bụi bay quá". Cảnh ngoài trời của phim mẫu luôn có hạt trong không khí. Bối cảnh ngoài trời phải tự có lớp hạt, bật sẵn, không chờ cảnh quay thêm.

- Món: `CampAir` / `AirLayer` trong `src/lib3/kitCamp.tsx` (kho: `khong-khi-trai-bui-vang-dom-dom-tan-lua`). Mỗi hạt có đời: sinh, trôi theo gió chậm và lắc riêng, mờ vào mờ ra, sinh lại chỗ khác; các hạt lệch nhịp nhau.
- Ba lớp theo độ sâu: lớp gần máy thưa và mờ (không che mặt người), lớp giữa rõ nhất, lớp xa nhỏ và nhiều. Cỡ hạt tính sao cho đọc được ở 720p (bán kính khoảng 0,05 m ở cách máy 10 m).
- Theo ánh: ngày là bụi vàng đậm hơn nền trời (vàng nhạt trên trời sáng thì biến mất), vài lá nhỏ và phấn bay ngang; chạng vạng là bụi ấm và đom đóm chớp tắt; đêm là bụi lạnh và đom đóm; quanh lửa, bếp, nến có tàn lửa bốc lên. Cảnh tuyết thì để tuyết, không thêm bụi.
- `Camp` có `bui` (mặc định bật) và `buiK` (mật độ). Bối cảnh ngoài trời mới nên có tham số giống vậy.
- Hạt không được làm tụt độ sáng (đo `tools/do_sang.py` trước và sau).

**Bụi theo nguồn sáng (24/11/2026, Daniel: "các session ko biết nên thêm bụi theo từng môi trường, và bụi theo từng nguồn sáng").** `src/lib3/buiNguon.tsx`, StageCam tự vẽ (canvas không có StageCam thì đặt `<BuiNguon />`).
- Bối cảnh gọi `datNoiBui(noi, kieu?, gio?)`; lớp nền rất thưa theo nơi và giờ: trong nhà vài hạt be; ngoài trời ngày vài hạt phấn và lá; chạng vạng hạt ấm và đom đóm chớp; đêm hạt lạnh; tuyết, vũ trụ không có lớp nền.
- Nguồn tự đăng ký (prop `bui={false}` để tắt): `Sun` → bụi chỉ trong vệt nắng (hạt bị khối che thì không hiện); `Flame` (Fire, đuốc, lò, nến) → tàn lửa hoặc hạt nến theo cỡ ngọn; `Lantern`, `StationLamp` → bụi trong quầng đèn; `Halo` lớn ấm → đèn, màu khác → hạt phép.
- Nguồn tay: `<NguonBui kieu="phep" pos={[x, y, z]} mau="#..." />`. Đèn chỉ là `pointLight` trần thì không tự có hạt: đặt `NguonBui` cạnh nó.
- Cảnh đã có lớp hạt riêng (Motes, Fireflies, AirLayer) tự báo `DaCoKhi`: lớp nền tắt. Composition của tập đã khoá mức bụi (`datBuiAm`) không đổi gì.
- Màu theo cảnh: `datNoiBui(noi, kieu)` hoặc `<MauBuiCanh kieu="tim|xanh|vang-nen|..." />` cho riêng một cảnh quay (cảnh không có nguồn màu riêng thì chọn màu chủ đạo của cảnh, như tập Doom chọn tím cho Purple Man, xanh cho phòng máy Doom).
- **Bụi theo màu nhân vật** (Daniel 25/11): CHỈ cảnh signature của nhân vật signature (dùng sức mạnh, xuất hiện lần đầu, cơn giận), danh sách cảnh ghi rõ cảnh nào. Khi đó lớp bụi bay tự do khắp không gian trước máy đổi sang màu nhân vật (`<MauBuiCanh kieu="tim" />`), như các cảnh Purple Man của tập Doom; hạt không bám, không quấn quanh người (Daniel: "bụi vẫn phải bay linh tinh trong phòng"). Cảnh thường, ví dụ một người đứng giảng trong phòng có nắng, chỉ cần bụi từ cửa sổ.
- Ngoài trời hạt đi theo cây và hoa gần máy (lá rơi từ tán, phấn từ bụi hoa, hạt cỏ từ cỏ cao); không để hạt lơ lửng giữa trời không gắn nguồn.
- Không tự rải chấm hạt trong file cảnh (`tools/kiem_canh.py` báo `hat-tay`).

## Bóng đổ không bao giờ thiếu (24/11/2026, Daniel yêu cầu)

Lỗi gốc: trong three.js `receiveShadow` mặc định TẮT cho từng mesh. Mesh viết tay quên bật thì bóng của vật khác không hiện trên nó, không báo lỗi gì, ảnh phẳng như giấy dán (mặt tiền, tường, sàn "sao sao khó nói"). Lỗi này lọt qua cả loạt bối cảnh vì bước kiểm chỉ đo độ sáng.

- **Tự bật nhận bóng:** `StageCam` (`src/lib3/kit.tsx`) gọi `autoReceive(scene)` sau MỖI lần dựng: mọi mesh vật liệu nhận sáng (Lambert, Phong, Standard, Toon) đều được bật `receiveShadow`, trừ tấm trong suốt không ghi chiều sâu (`transparent` + `depthWrite={false}`: mảnh cắt giấy, `Sprite`, tấm dán; chúng tự quyết bóng) và mesh có `userData.noRecv`. Canvas nào không dùng `StageCam` thì đặt `<AutoRecv />` vào trong canvas (đã đặt sẵn ở `Shot`, `LabLop`, `ShotComp`, `Stage` của `kit/stage.tsx`, `Episode`).
- **Lưu ý VSM:** cảnh dựng bằng `VSMShadowMap`, loại này vẽ cả vật NHẬN bóng vào bản đồ bóng (xem skill 2, mục "Tắt bóng của một món"). Nên mọi khối đặc nhận sáng giờ đều che nắng. Tấm nền lớn, vòm trời bằng Lambert mà không được che nắng thì phải gắn `userData={{noRecv: true}}`.
- **Vật đứng phải `castShadow`.** Chỉ mặt nằm (sàn, đất, đường) được bỏ. Tắt nhận bóng thì dùng `userData={{noRecv: true}}` (helper đã làm sẵn: `B recv={false}`, `Stick recv={false}`, `kit/shapes` với `receive={false}`, `Ball`, `three/prims` với `receive={false}`, `Puppet3 noShadow`, `Sprite` không ăn sáng); KHÔNG viết `receiveShadow={false}` trần, vì `autoReceive` sẽ bật lại.
- **Renderer và đèn chính:** canvas có `shadows={{type: THREE.VSMShadowMap}}`; đèn chính (`SceneLight` ở `look.tsx`, `Sun` ở `room.tsx`) có `castShadow`, khung bóng (`shadow-camera-*`, tham số `reach`) phủ hết phần cảnh máy thấy. Sọc lỗi bóng (shadow acne) thì chỉnh `shadow-bias` / `shadow-normalBias` của chính đèn đó, không tắt nhận bóng.
- **Ngoài trời:** nắng ấm, trời mát. Màu đất (`ground`) của đèn bán cầu là màu hắt lên từ mặt đất nói chung, KHÔNG lấy màu cỏ (lấy màu cỏ thì mọi mặt hướng xuống ngả xanh lá).
- **Công cụ rà:** `python3 tools/kiem_bong.py [file…]` (trong sandbox được). Báo LỖI: canvas có bóng mà không có `StageCam` / `<AutoRecv />`, và `receiveShadow={false}` thiếu `noRecv`. Báo CẢNH BÁO: mesh nhận sáng không `castShadow` (cố ý thì ghi `bong:ok` trên cùng dòng).
- **Luật bóng (Daniel chốt 25/11/2026), engine giữ giúp:**
  - *Mép bóng mềm 6 cm.* Video gốc không có bóng mép cứng (0/109 cảnh). three đo `shadow.radius` bằng số ô của bản đồ bóng, nên cùng một con số ra độ nhoè khác nhau ở mỗi đèn (đèn `Sun`: mỗi ô 4,4 mm, radius 1,1 chỉ là 0,5 cm). `autoReceive` đặt lại radius của mọi đèn song song và đèn chiếu theo `MEP_BONG_CM = 6` (`src/lib3/kit.tsx`). Không tự đặt `shadow-radius` trong cảnh, không vá three ở kênh. Đèn thật sự cần mức riêng: `userData={{bongRieng: true}}`, và hỏi Daniel.
  - *Mỗi người một bóng (Daniel 25/11/2026: "chỉ dùng 1 bóng, bỏ vệt tròn").* Bóng của người là bóng đổ thật của tấm hình; `Puppet3` không còn vẽ vệt tròn dưới chân. Không tự đặt `ContactShade` dưới chân người. Người không có bóng nào thì sửa ĐÈN của cảnh, không vẽ thêm vệt: đèn chính phải rọi tới người và nằm trong khung bóng (đèn lệch ngang quá thì bóng của tấm phẳng mỏng tới mức không thấy: phòng Danzō tập Shisui, đèn lệch 73°), mặt đất dưới chân phải là mặt nhận bóng (thảm, tấm dán không nhận bóng thì bóng mất: hang Kabuto). `Sprite`, `Pic2D` và đồ trong kit vẫn có vệt tiếp đất; vệt chồng nhau thì engine gộp còn một.
  - *Khung bóng có min và max (Daniel: "chỉ cần set max và min").* `KHUNG_BONG` (`src/lib3/look.tsx`): bóng dài 0,35–0,8 lần chiều cao vật; đèn lệch ngang 10–35° so với trục máy (lệch nhiều thì bóng của tấm hình phẳng bị hẹp). Cảnh tự đặt hướng đèn; trong khung thì giữ, ngoài khung thì engine kéo về mép (`SceneLight`, `Sun` ngoài trời). Cảnh tự đặt `directionalLight` thì engine KHÔNG kéo: phải tự đặt trong khung. Nắng cao hơn làm mặt đất sáng lên: đo lại màu bằng `do_mau_khuon.py` sau khi đổi.
  - *Bóng đổ ra SAU và sang ngang.* Máy luôn nhìn về -z, nên đèn chính đặt từ phía máy: `SceneLight` tự bẻ hướng (`tuPhiaMay`), `Sun` ở ngoài trời (bối cảnh đã gọi `datNoiBui` với nơi khác `trong-nha`) cũng tự lật ra phía máy; `Sun` trong nhà và `directionalLight` tự đặt thì phải có z của đèn lớn hơn z của đích. Chỉ khi KHUNG HÌNH có nguồn sáng phía sau (cửa sổ ở tường sau, mặt trời thấp sau lưng; video gốc có 34 bản ghi kiểu này) mới được ngược sáng: khai `nguocSang` trên đèn và ghi vào danh sách cảnh. Nắng trong phòng không tự dời được (phải đi qua đúng ô cửa), đèn tự đặt cũng không (có thể là đèn viền), nên đặt sai thì `kiem_bong.py` báo LOI `bong-ve-may`. Ảnh TRƯỚC để so: dựng với `REMOTION_SOI_BONG=luat-cu` (tắt cả ba điều).
- **Trước khi gửi ảnh:** chạy `kiem_bong.py` cho các file vừa sửa, và phóng to một vùng có bóng (chân tường, gầm bàn, mép mái) để xem bóng có rơi đúng lên mặt nhận, không sọc, không hở.
