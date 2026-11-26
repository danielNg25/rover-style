# Skill 3: nhân vật và diễn xuất (cutout3d)

> Sửa luật trong skill này chỉ khi Daniel đã xác nhận đúng thay đổi đó (luật 25a); sửa xong thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Agent không sửa skill: thấy thiếu hay sai thì ghi vào báo cáo.
> Ai làm việc gì, file nào của ai, cổng kiểm nào phải qua: `skills/4-quy-trinh.md`.
> Nhân vật, bảng năm tông da, bảng nét mặt, bảng tư thế tay và các hiệu ứng có ảnh trong kho: `assets/DANH-MUC.md`, nhóm `nhan-vat` và `hieu-ung`. Nhân vật hay hiệu ứng mới phải vào kho (cách làm ở `skills/2-chuan-mon-do.md`, mục Kho asset).

Dùng cho hai việc: (a) **dàn người** khi dựng ảnh tĩnh (skill 1 cần phần này), và (b) **diễn xuất**: làm 8–10 giây chuyển động trong một cảnh đã có ảnh tĩnh được duyệt, theo ghi chú sân khấu.

## Mặt chuẩn

- Mắt của mọi nhân vật mới vẽ bằng `matChuan(spec)` (`src/mould/matChuan.ts`; kho: `mat-chuan-bang-net-mat`). Số đo lấy từ video gốc: mỗi mắt khoảng 0,40 bề ngang mặt, hai mắt chạm nhau ở giữa, mắt tròn; mặt bình thường mắt mở tròn, mí chỉ hạ khi giận, buồn, chán, nheo; lông mày tách khỏi mắt. Nhân vật có lông mày riêng: `matChuan(spec, {may: false})` hoặc gọi `veMat` trong lớp `head` của mình.
- Không tự vẽ lại mắt, không đổi cỡ, khoảng cách, vị trí mắt ở kênh (một lần tự thu mắt còn 0,24 bề ngang mặt mà không đặt cạnh video gốc đã làm cả một dàn phải dựng lại).
- Bị chê về mặt, dáng, tỉ lệ nhân vật: đặt mặt của mình cạnh `skills/bang-cham/mat-chuan.jpg`, tìm chỗ khác với video gốc, làm MỘT tấm mặt thử (vài nhân vật, vài nét mặt), gửi Daniel; duyệt rồi mới áp cho cả dàn.
- `python3 tools/kiem_mat.py` không có LOI (đã nằm trong `kiem_canh.py`). Kiểu mặt riêng đã được Daniel duyệt thì ghi trong file một dòng `mat:da-duyet <ngày>`.
- Kênh nào đang dùng mắt nào: xem `ghi-chu.md` của kênh đó. Đổi mắt của một dàn đã được duyệt là việc Daniel quyết.

## Nhân vật là gì

Một bộ khuôn vẽ bằng code, dùng chung cho mọi người; đổi người bằng tham số, không vẽ lại.

```tsx
const MAN: Spec = {outfit: 'vest', hair: 'sweep', build: 'adult', longLegs: true, expr: {...EXPR.smile, gaze: [18, -2]},
  armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]},
  palette: {hair: '#6b4a2a', brow: '#3a2816', shirt: '#ece6d6', vest: '#3f6a8a', shorts: '#3d4252', shoe: '#2b2422'}};
<Puppet3 height={1.7} pos={[x, 0, z]} spec={MAN} />     // trẻ con: build 'child', height 1.15, bỏ longLegs
```

- `outfit`: `vest` (áo sơ mi và gi-lê; cho `vest` cùng màu `shirt` thì thành áo trơn) hoặc `coat` (áo choàng dài). `hair`: `sweep`, `level`, `bald`. `beard`: màu râu. `view: 'back'` là quay lưng.
- **Bộ áo giáp mũ trùm (`outfit: 'doom'`, thêm 22/11/2026):** mũ trùm chảy xuống thành tấm phủ vai có hai khuy, áo trong gấu răng cưa và thắt lưng, tay chân giáp to bè, găng to, áo choàng treo SAU lưng. Tham số riêng: `mask` (`'iron'` mặt nạ sắt, `'hot'` mặt nạ nung, `'none'` mặt thật trong mũ trùm, `'dark'` lòng mũ tối chỉ thấy bóng đầu), `heat` từ 1 về 0 (mặt nạ nung nguội dần, có glow; `Puppet3` tự thêm quầng sáng khi `heat` trên 0,08, tham số `glow`), `sit: true` (ngồi), `bulk` (bề ngang, mặc định 1,3), `scar: {side, heavy: true}` (sẹo nặng); màu qua `palette` (`cloak`, `cloakDark`, `cloakLight`, `cloakIn`, `tunic`, `plate`, `plateLine`, `armour`, `armourDark`, `armourLight`, `gold`, `goldDark`, `belt`, `socket`). Mặt nạ: `brow` và `mouth` không hiện, diễn bằng mắt, đầu, thân và tay. Mặt nạ rời: `paintMask`, `MASK_BOX` (bộ khuôn) và `LooseMask` (`src/lib3/kitForge.tsx`). `bulk` và `sit` chỉ có ở bộ áo này; chưa có áo choàng tung theo bước, đi hay ngồi nhìn nghiêng, tay khi nhìn từ sau lưng. Chi tiết dựng nhân vật mặc bộ áo này ở kênh phim-tv (số đo, tay, ngồi, mặt nạ nóng, nhà sư, các lần chủ kênh chê): `ghi-chu.md` của kênh phim-tv, mục "Doctor Doom trên bộ khuôn".
  - **Vóc dáng khác người thường thì đo trên mẫu, không ước bằng mắt, và đo trên NHIỀU khung:** kẻ lưới lên ít nhất bốn khung mẫu ở các tư thế tay khác nhau (buông, giơ, dang, khoanh) và lập bảng tỉ lệ theo chiều cao TRƯỚC khi vẽ; phép thử: tay buông thẳng phải nằm đè lên thân.
  - **Daniel gọi "glow" là các chấm sáng nhỏ bay quanh vật nóng** (tàn lửa, bụi than, vụn kim loại), không chỉ là quầng sáng: vật nóng nào trong cảnh cũng có `Embers` hay `HotSpecks` (`src/lib3/fx.tsx`) quanh nó, thưa dần khi nguội; `Steam` cho hơi nước, `SparkBurst` cho chùm tia lửa lúc chạm.
- **Phụ kiện thêm 22/11/2026** (bảng kho `bang-phu-kien-latveria-mu-sat-ria-khan-tap-de`), mỗi thứ là một màu trong `Spec`: `helmet` (mũ sắt có che mũi, vẽ cả nhìn trước lẫn nhìn sau), `emblem` (huy hiệu hình thoi trên ngực áo), `moustache` (ria vểnh), `goatee` (chòm râu cằm; râu quai nón đầy vẫn là `beard`), `scarf` (khăn trùm đầu, tóc dài rủ hai bên mặt), `apron` (tạp dề ngoài sơ mi của người `vest`). Dáng mặt riêng (hàm vuông, mặt dài) vẫn CHƯA có.
- **Mỗi nhân vật có tên một dáng mặt và một bộ đồ riêng**. `faceShape`: `'round'` (mặc định), `'square'` (hàm vuông), `'long'` (mặt dài), `'heart'` (gò má rộng, cằm nhọn), `'wide'` (má xệ); trong một cảnh không để hai người có tên cùng dáng mặt, và chọn theo phiếu ngoại hình. Người quyền quý không mặc áo choàng thường tô lại màu: dùng `regal: {gold, gem}` (cổ lông chồn trắng đốm đen, nẹp vàng nạm đá dọc thân và quanh gấu, dây chuyền có mặt đá, điểm lấp lánh) và `crown` (vương miện) khi là vua. Nhân vật quan trọng mà bộ khuôn chưa có đồ xứng với họ thì báo người điều phối vẽ thêm, đừng lấy đồ có sẵn mặc tạm. Bảng kho: `bang-dang-mat-va-ao-vua`.
- **Thêm 22/11/2026:** `messy: true` (tóc bù xù, các chỏm tóc chĩa ra khỏi khối tóc; cho đứa trẻ hoang dã); `snow` từ 0 tới 1 (tuyết đọng trên đỉnh đầu và hai vai, chỉ vẽ trên chính nhân vật; 1 là người đứng lâu trong bão, 0,5 mới lấm tấm); áo choàng `outfit: 'coat'` vẽ được trên khuôn trẻ con (`build: 'child'`), đã thử. Xem bảng kho `bang-phu-kien-latveria-mu-sat-ria-khan-tap-de`. Quỳ, khuỵu gối cho người thường: xem mục "Dáng mới 23/11/2026".
- **Thêm 23/11/2026:** `tie` (cà vạt trên áo sơ mi của người mặc gi-lê, giá trị là màu); `skirt` (váy dài phủ từ hông tới gần mắt cá cho người mặc gi-lê, giá trị là màu; gi-lê và áo giữ nguyên); `ponytail` (tóc đuôi ngựa dài vắt ra trước vai trái của nhân vật; `true`, hoặc một màu để có nơ buộc); nhìn từ sau dùng `backHair: 'long'`; `hair: 'smooth'` (tóc chải mượt rẽ ngôi lệch, không chỏm lởm chởm: cho phụ nữ, trẻ gọn gàng; `sweep` và `level` là tóc có chỏm của nam). Xem bảng kho `bang-phu-kien-latveria-mu-sat-ria-khan-tap-de` (hai hình `tie`, `skirt + ponytail`).
- **Thêm 23/11/2026, mặt con gái:** `lashes: true` (mắt mở to: đường mi đậm ở hai phần ba ngoài của mép trên mắt và ba sợi mi; mí hạ: chỉ một phần ba ngoài của mép mí tối và ba sợi mi đứng trên đó, vì tô tối cả mép mí thì ra một hàng lông mày thẳng vắt ngang hai mắt; mắt nhắm thì mi chĩa xuống), `lips` (màu môi, vẽ dưới nét miệng ở mọi kiểu miệng), `blush` (màu má hồng), `sideLocks: true` (hai lọn tóc ôm hai bên mặt xuống quá cằm), `faceShape: 'oval'` (cằm thon mềm). Nhân vật nữ trẻ dùng đủ bộ này cùng `hair: 'smooth'`, `ponytail` hoặc `scarf`; chỉ đổi màu tóc và váy thì vẫn đọc ra là con trai. Xem bốn hình `girl…` ở bảng kho `bang-phu-kien-latveria-mu-sat-ria-khan-tap-de` và nhân vật `VALERIA` của kênh phim-tv.
- **Thêm 23/11/2026, lớn lên:** `faceTo: {shape, k}` cho đường viền mặt nằm giữa `faceShape` và một dáng khác (k từ 0 tới 1). `src/mould/LonLen.tsx`: `<LonLen stages={[{spec, height}, …]} t={…} pos={…} pose={(spec, i) => …} />` cho một người biến đổi dần qua các nấc tuổi trong một cảnh: giữa hai nấc là MỘT hình nội suy (chiều cao, cỡ đầu `headK`, viền mặt, màu quần áo, góc tay), không chồng hai hình. `headK` là cỡ đầu (1 trẻ con, 0,8 người lớn). Hai nấc liền nhau nên chung kiểu tóc, kiểu áo và kiểu bàn tay, vì những thứ đó chỉ đổi được ở giữa quãng. Luật dùng ở skill 0, mục "Cảnh giấy, quả địa cầu, lớn lên, độ nhanh".
- **Người chạm phải đứng trước người bị chạm.** Mỗi người là một tấm phẳng: bàn tay của A chỉ hiện trên đầu hay vai của B khi tấm của A ở gần máy hơn tấm của B (lệch khoảng 0,45 m là đủ, và phải qua kiểm vật lý). Xoa đầu, vỗ vai, nắm tay, đưa đồ: đặt người làm động tác lên trước.
- **Người nhìn từ sau lưng (`view: 'back'`)** phải khác nhau như người nhìn từ trước. Đầu: `backHair` nhận `'bob'` (mặc định), `'long'`, `'bald'` (da đầu, tai, vành tóc thấp), `'bun'`, `'scarf'` (khăn trùm buộc sau gáy, hai đuôi), `'hat'` (mũ phớt có vành); màu khăn hay mũ ở `backCloth`. Tóc `bald` và `bun` tự ra đúng kiểu khi quay lưng. Áo choàng nhìn từ sau có nếp từ vai xuống gấu; `shawl` vẽ cả ở lưng thành khăn tam giác có tua. Một đám đông nhìn từ sau không để cả nhóm cùng một khối tóc tròn.
- **Mỗi người một màu da, CHỈ lấy từ bộ `SKINS`** (`src/mould/palettes.ts`; bộ đo từ video gốc ngày 26/11/2026, Daniel: "chọn bộ có sẵn để agent chỉ chọn màu từ đó ra"). Bảy tông, từ sáng tới sẫm: `porcelain`, `warm`, `light`, `fair`, `tan`, `brown`, `dark`; `warm` và `light` gặp nhiều nhất ở video gốc. Trải vào bảng màu: `palette: {...SKINS.light, hair: ..., vest: ...}`. KHÔNG tự ghi mã màu da (`skin`, `skinA`…) trong dàn nhân vật: `tools/kiem_mat.py` báo LOI `da-ngoai-bo` kèm tông gần nhất. Nhân vật không phải da người (tượng, ma, người tím, người đá) ghi `da:ok <lý do>` trên dòng đó; màu da riêng Daniel đã duyệt ghi `da:da-duyet <ngày>`. Nhân vật phụ dùng `skinFor(tên hoặc màu áo)` để cả nhóm tự ra nhiều tông; có màu tóc đã biết thì `skinClearOf(màu tóc, tên)` (tránh tông da trùng sắc độ với tóc). Một nhóm người cùng một màu da là lỗi. Ảnh so với video gốc: `skills/bang-cham/mau-da.jpg`.
- Bảng màu (`palette`): `skin`, `hair`, `hairLine`, `brow`, `shirt`, `shirtEdge`, `shirtRim`, `vest`, `shorts`, `shoe`, `button`, và `coat`, `fur` cho áo choàng. Quần phải khác sắc với áo.
- Nét mặt có sẵn (`EXPR`): `neutral`, `smile`, `happy`, `sad`, `sadTalk`, `squint`, `angry`, `glare`, `shock`, `bored`, `smirk` (nhếch mép, khinh khỉnh). `gaze: [ngang, dọc]` là hướng nhìn.
- Tư thế tay có sẵn (`POSES`): `idle`, `greet`, `wave`, `present`, `offer`, `open`, `cheer`, `hips`, `akimbo`, `chest`, `think`, `cross`, `point`, `pointUp`, `scold`, `fist`, `fists`, `shrug`, `explain`, `hold`, `gasp`. Đặt tư thế đứng yên: `withPose(spec, 'present')`.
- **Nhân vật vẽ đúng màu riêng, như video gốc** (mặc định của `Puppet3`; luật và số ở skill 1, mục Bóng): đèn của cảnh gần như không làm người sáng lên hay tối đi, chỉ phủ một lớp màu nhẹ. Không truyền `tint` hay `lift` để chỉnh người theo chỗ đứng. Người đứng sát một hiệu ứng (phép, cổng, lửa lớn) cần ánh màu hắt lên: `anMau={0.5}` tới `anMau={1}`. Bóng của người do engine vẽ (skill 1, mục Bóng); cần đậm nhạt riêng: `bong={số}`.
- **Tóc búi và khăn choàng:** `hair: 'bun'`; `shawl: '#màu'` trên nhân vật áo dài (`outfit: 'coat'`, khăn thay cho cổ lông). Ví dụ: `BA_MAU` trong `src/mould/nguoi-mau.ts`.
- **Vết sẹo:** `scar: {side: 'L' | 'R', fresh?: true}` trong spec; `side` tính trong không gian bộ khuôn ('L' là bên trái khung khi hình không lật, hình lật thì đảo). Ghi rõ trong danh sách cảnh quay là má nào của NHÂN VẬT rồi đổi ra bên khung cho từng cảnh.
- **Dàn nhân vật của một đoạn phim nằm trong một file dùng chung của kênh** (`../kenh/<kênh>/cast/<ma>Cast.ts`): mọi cảnh quay và ảnh tĩnh có người của kênh lấy nhân vật từ đó, để một người giống nhau ở mọi nơi. Bối cảnh và kho của phần chung KHÔNG import file này (người mẫu cho bảng chung: `src/mould/nguoi-mau.ts`).
- Code: `src/mould/draw.ts` (hình), `Puppet3.tsx` (đặt vào cảnh), `expr.ts`, `gestures.ts`, `act.ts`.
- Bộ khuôn chưa làm được gì: mục "Bộ khuôn chưa có" ở dưới (một danh sách duy nhất).
- `gaze` phải đủ lớn mới đọc được: mắt rộng 86 đơn vị, nhìn hẳn sang bên trong toàn cảnh cần khoảng 40; 18–28 chỉ đọc được ở cận cảnh.

## Dàn người (khi dựng ảnh tĩnh)

- Người lớn cao 1.7, trẻ con 1.15. Toàn cảnh: thấy cả người tới chân. Trung cảnh: người chính cao từ 40 % khung.
- Người đứng bên phải mà nhìn sang trái thì thêm `flip`. Hai người nói chuyện đứng cách nhau khoảng 1.5–2.2 m, lệch độ sâu một chút.
- Không để vật gì mọc ra từ đầu, không để dây hay cột cắt ngang người, không để cửa sáng nằm ngay sau đầu.
- Nhân vật phải nổi trên nền: đầu nằm trên một mảng khác sắc với tóc và da.
- Ai phải đi vào thì chừa lối đi trống trên đất.

## Diễn xuất: viết bằng nhịp

Mỗi nhân vật có một danh sách nhịp; máy tự sinh hình trung gian, gật đầu, nhún cổ tay, miệng nói, bước chân.

```tsx
const BEATS: Beat[] = [
  {f: 6, body: 'walk', dist: 1611, over: 56},        // đi 1611 đơn vị trong 56 khung (người cao 1191 đơn vị; nhịp chuẩn 29 đơn vị mỗi khung)
  {f: 68, pose: 'greet', big: true},                   // big: đổi mạnh, thêm một hình trung gian
  {f: 86, pose: 'present', say: 22},                   // say: nói trong 22 khung
  {f: 110, body: 'shift'},                             // dồn trọng tâm, bàn chân đứng yên
  {f: 122, pose: 'point', body: 'leanIn', face: 'happy', look: [18, -6]},
];
const KEYS = perform(BEATS, {dirDefault: 1});          // người có flip: perform(BEATS, {dirDefault: -1, mirror: true})
<Puppet3 ... spec={blink(act(BASE, KEYS, frame, {seed: 1}), frame, [30, 100, 158], 'half')} />
```

- `body`: `shift`, `leanIn`, `leanBack`, `upright`, `step` (một bước), `walk`, `bounce`, `hop`, `dip`, `recoil`, `slump`, `shiver`. `dir: 1` là sang phải màn hình, `-1` là sang trái.
- **Đi: `pos` của `Puppet3` là điểm BẮT ĐẦU, không phải mốc đứng.** Đơn vị quãng đi tính theo chính nhân vật (1191 đơn vị bằng chiều cao của người đó), nên đổi ra mét là `dist × cao / 1191`. Muốn dừng đúng mốc: `pos.x = mốc.x − dir × dist × cao / 1191`. Ví dụ đứa trẻ cao 1.15 đi sang trái 2590 đơn vị (2.5 m) tới mốc x = 1.5 thì bắt đầu ở x = 4.0.
- Tư thế vươn tay chỉ dùng cánh tay ở phía nhân vật quay mặt. Muốn chỉ về phía sau lưng: `swapArms(keys, từKhung, tớiKhung)` đổi sang tay kia sau khi `perform`.
- Gật đầu chưa là một nhịp riêng; mỗi lần đổi tư thế có sẵn một cái gật nhẹ.
- Mật độ: người đang nói có một nhịp mới ít nhất mỗi 24 khung, người nghe mỗi 48 khung. `lintBeats` kiểm giúp; một quãng đi dài tính là đang diễn, bỏ qua cảnh báo trong lúc đi.
- Chớp mắt: `blink(spec, frame, [các khung], 'half' | 'blank' | 'swap')`, khoảng 3–4 giây một lần; `blank` cho người đang nói ở cảnh vừa và cận. Hai người không chớp cùng lúc: lệch nhau ít nhất 8 khung.

## Hướng nhìn, tay và chỗ đứng khi bối cảnh bị xoay hoặc hình bị lật

- **Không xoay tấm người để "quay" nhân vật.** Người là tấm phẳng ăn nắng: đặt `rotY` bằng một số cụ thể thì cả người tối đi so với người đứng cạnh. Quay mặt về một phía bằng `flip` và hướng mắt (`gaze`). `rotY={-y}` để tấm quay về máy trong phòng bị xoay thì vẫn dùng. Trong phiếu giao việc viết "nhìn về phía…", đừng viết "quay hẳn người về phía…".
- **Bóng của người do engine vẽ** (skill 1, mục Bóng): mỗi người một bóng ngả ra sau. Không đặt `ContactShade`, không tự vẽ bóng dưới chân người.
- **Hướng nhìn viết theo màn hình.** Bộ khuôn vẽ con ngươi trong không gian của nó; hình lật (`flip`) là hình soi gương, nên cùng một số `gaze` sẽ nhìn ngược lại. Luôn viết qua một hàm đổi dấu: `look(flip, x, y)` với x dương là nhìn sang phải khung (đang nằm ở `src/demo/DaiHoc.tsx`).
- **Tay nào ở phía nào.** Hình không lật: `armR` nằm bên phải khung. Hình lật: `armR` nằm bên trái khung. Chọn tay ở phía người đang được nói tới, và ở phía khung còn chỗ trống; hai tay dùng chung một bộ số nên đổi `armR` thành `armL` là ra đúng hình soi gương.
- **Trong phòng bị xoay, `spec.x` chạy theo trục x của PHÒNG**, tức là gần như theo chiều sâu, nên bước đi và dịch người từ `act` sẽ đi sai hướng. Dùng `place(yaw, chỗ đứng, spec, cao, flip, depth)` (cùng file) để chuyển quãng đi ngang sang trục ngang của màn hình; `depth` là số mét lùi xa máy (âm là tới gần), dùng khi người vừa đi ngang vừa tiến lại gần.
- **Miệng khi nói câu nghiêm túc:** chỉ dùng `flat` xen với `o`. Miệng `aw` đọc thành hoảng sợ, miệng `open` đọc thành cười toe; cả hai sai với một lời cảnh báo nói nhỏ.
- **Người đứng sau bàn:** tay chống bàn và dáng cúi không đọc được vì thân bị mặt bàn che; bộ khuôn chưa cúi người. Diễn bằng đầu hạ thấp, mắt và một bàn tay giơ lên trên mép bàn.
- **Nhìn từ sau lưng** (qua vai): lưng của bộ khuôn gần như chỉ là một đĩa tóc đen, chưa thấy vai. Đây là chỗ bộ khuôn còn thiếu; đừng để lưng chiếm nhiều khung.

## Tay: tầm với, tay trước mặt, đường đi của bàn tay

- **Số đo tầm tay của bộ khuôn** (đơn vị khuôn; nhân với chiều cao người chia 1191 để ra mét): vai ở y 612, x 180 (trái) và 364 (phải); cánh tay trên dài 110, cẳng tay 108, bàn tay khoảng 80. Dùng để tính trước bàn tay có tới được một vật hay không, thay vì thử từng chút. Vật ở sát vai (cần gạt đã kéo xuống) cần tư thế gập khuỷu, tay duỗi không tới.
- **Tay vẽ TRƯỚC mặt** (che má, che miệng): thêm `front: true` vào tư thế tay. Dùng được cho cả áo gi-lê và áo khoác. Nhìn từ sau lưng thì mọi tay đều nằm dưới đầu.
- **Bàn tay đi từ tư thế gập (ở mặt, ở ngực) xuống buông thõng sẽ văng ngang ra ngoài như vẫy**, vì máy trộn góc vai và góc khuỷu như hai con số. Cách tránh: thêm một nhịp trung gian (tay qua ngực) và ghi góc khuỷu đích là 360 thay cho 0, để khuỷu gập vào trong. Việc đúng là cho máy đi theo đường của bàn tay; còn nợ.
- **Đừng treo một nhịp diễn vào bàn tay nhìn từ sau lưng:** bàn tay nằm trong mảng tóc, chỉ thấy khuỷu giơ lên.
- **Ánh sáng màu trên mặt:** đèn màu của bối cảnh chỉ phủ rất nhẹ lên người. Muốn ánh màu rõ trên người đứng sát một hiệu ứng: đặt `anMau` (0,5 tới 1) cho `Puppet3` của người đó. Không đặt thêm đèn màu ở phía ống kính.
- **Hình bóng tối trước nguồn sáng mạnh:** đặt `anSang={1}` cho `Puppet3` (người sáng tối hẳn theo đèn), kèm `lift` nhỏ (ví dụ 0.03).
- **Cỡ đầu:** công thức `headSpan` có khi lệch (đoán 60 %, đo được 53 %). Đo đầu trên ảnh tĩnh rồi chỉnh máy, đừng tin riêng công thức.
- **Tấm kiểm nhiều khung:** trình duyệt chỉ giữ khoảng 16 vùng vẽ WebGL; một cảnh nền mềm dùng ba vùng mỗi khung, nên một tấm kiểm chỉ chứa được bốn năm khung của cảnh nền mềm.

## Tầm tay đổi ra mét, áo, dáng mặt

- **Tầm tay đổi ra mét** (người cao 1,74 m): vai cao khoảng 1,02 m; bàn tay với xa nhất khoảng 0,4 m tính từ vai; `sh 70, el 34` đưa bàn tay tới độ cao khoảng 0,95 m, cách tâm người 0,56 m; `sh 114, el 8` tới khoảng 1,2 m. Vật để tay chạm phải nằm trong tầm đó ở CẢ HAI ĐẦU của động tác (cần gạt lúc chưa kéo và lúc đã kéo).
- **Áo `coat`:** các tư thế tay trước ngực (`cross`, `chest`, `gasp`) phải thêm `front: true`, nếu không tay nằm dưới vạt áo và mất.
- **`POSES.chest` đặt bàn tay ở bụng.** Muốn tay lên ngực: vai khoảng 44, khuỷu khoảng −150.
- **Hướng nhìn ở trung cảnh với mặt `happy`:** cần khoảng 48 và hạ con ngươi xuống một chút (dọc +8) mới đọc ra là nhìn sang bên; 34 là chưa đủ.
- **Bộ đồ:** `vest` (sơ mi, gi-lê; thêm được `tie`, `skirt`, `apron`, `suit`), `coat` (áo choàng dài cổ lông), `doom`. Chưa có áo vét, áo khoác có ve. `coat` chỉ dùng cho nhân vật thật sự mặc áo choàng, không mặc tạm cho người thời khác.
- **Mỗi nhân vật có tên một dáng mặt** (`faceShape`: `round`, `square`, `long`, `heart`, `wide`, `oval`). Phim mẫu có nhiều dáng đầu: đo 641 khuôn mặt thì hàm tròn rộng 26 %, hàm vuông 19 %, mặt dài cằm thon 17 %, cằm nhọn chữ V 12 %.
- **Nhân vật đã có hình ở nơi khác thì vẽ theo mặt thật của họ.** Người có thật (Tesla, Edison) và nhân vật đã có trong truyện, phim (Doom, Reed): dáng mặt, tóc, râu, dáng người lấy từ hình thật hoặc hình gốc của họ, rồi mới chuyển sang nét của bộ khuôn. Chỉ nhân vật mình tự nghĩ ra (người phụ, đám đông) mới được chia dáng mặt tự do.
- **Soi nhiều khung cho rẻ:** `Shot` lấy cỡ theo composition nên không xếp được nhiều cảnh lên một tấm kiểm. Cách rẻ nhất: dựng video 720 một lần rồi cắt khung bằng ffmpeg.

## Luật chuyển động (đã soi trên phim mẫu)

- **Nhân vật đổi hình mỗi hai khung**; máy quay, lửa, hạt đổi mỗi khung.
- **Đứng thì bàn chân ghim tại chỗ.** Dồn trọng tâm, ngả người, nhịp nói chỉ dịch phần thân phía trên. Không trượt cả hình, không nhún cả hình khi nói. Máy tự lo việc này.
- **Bước một bước:** một chân bước ra, thân theo sau, chân kia khép lại. Tự sinh khi thân dịch quá tầm.
- **Đi:** hai chân thẳng đứng dưới thân; mỗi bước là một bàn chân rút thẳng lên khoảng một phần mười chiều dài chân rồi hạ xuống; không đưa ngang, không bắt chéo.
- **Một động tác kéo dài bao lâu.** Đo trên phim mẫu (n = 241 động tác, `tools/steps.py ... --stats`): một động tác dài 11 khung ở trung vị, tức 6 hình, mỗi hình giữ 2 khung; một phần tư dài 6 khung trở xuống, một phần tư dài 16 khung trở lên.
  - Máy tự tính số hình trung gian theo QUÃNG ĐƯỜNG bộ phận phải đi (`paceArm`, `paceBody`, `paceHead` trong `src/mould/act.ts`): tay buông lên chỉ trỏ là 4 hình trung gian (10 khung), giơ tay cao là 6 hình (14 khung), nhích cổ tay là bật ngay. `inb` trong nhịp chỉ làm chậm thêm, không làm nhanh hơn.
  - Nhịp tăng tốc rồi lắng: rời tư thế cũ nhanh, vào tư thế mới chậm dần.
  - Mỗi bộ phận (từng tay, đầu, thân) chạy động tác riêng: một nhịp đổi miệng xen giữa không cắt ngang động tác tay.
  - Khi viết nhịp: hai nhịp cho CÙNG một tay phải cách nhau đủ cho động tác trước tới nơi (quãng lớn: 14 khung), nếu không máy sẽ rút ngắn và động tác lại nhanh. Một cảnh 2 giây chỉ chứa được một hai động tác tay lớn.
  - Muốn một cú giật có chủ ý (hất tay, tát, giật mình): thêm `fast: true` vào nhịp đó; chỉ khi ấy hình đầu của cú vung lớn mới là hình nhoè.
- **Giữa các động tác là quãng giữ có trôi nhẹ**, không đứng chết. Ít động tác mà rõ tốt hơn nhiều động tác vụn.
- **Người nghe phản ứng trễ** 2–6 khung sau người nói; mắt đi trước tay.

## Kiểm vật lý

Nhân vật là một tấm phẳng, nên "xuyên qua đồ vật" hiện ra thành đồ vật che mất một phần người từ ngay sát phía trước. Mắt soi từng khung dễ sót; có công cụ soi MỌI khung:

```
cd shorts-claude && UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \
  uv run --offline --no-project --with opencv-python-headless --with numpy python cutout3d/chung/tools/vatly.py <comp> [<comp> ...]
```

- Chạy ngoài sandbox. Mỗi nhân vật tự vẽ thêm dấu (`PHYS` trong `src/mould/Puppet3.tsx`), bề dày nửa thân mặc định 0,12 m.
- **Tím = lỗi:** có vật nằm trong 0,12 m ngay trước mặt phẳng nhân vật và che một phần người (tay trong đồng hồ, bụng trong mép bàn). Phải về 0 khung.
- **Xanh dương = cảnh báo:** có vật nằm trong 0,12 m ngay sau nhân vật (lưng, tay lún vào tường). Mở ảnh `out/vatly/<comp>.jpg` ra xem.
- **Xanh lá:** phần người bị che bởi vật ở xa phía trước (đứng sau bàn); bình thường.
- Cách sửa gần như luôn là dời chỗ đứng: người phải cách tường, tủ, đồng hồ, mép bàn ít nhất nửa thân cộng tầm tay của động tác sẽ diễn ở đó. Khi chọn chỗ đứng, xem sơ đồ vị trí của bối cảnh trước.
- Chạy công cụ này cho mọi cảnh có người trước khi gửi Daniel, sau mỗi lần đổi chỗ đứng hoặc đổi động tác tay.
- Chưa kiểm được: hai nhân vật chồng lên nhau, và bàn chân có chạm đất không (vẫn phải soi bằng mắt).

## Chuyển động của cảnh

- **Lửa:** lưỡi lửa giữ hình, đầu lưỡi nghiêng chậm và mượt trên mọi khung (`Fire` trong `src/lib3/kit.tsx`, truyền `f` là số khung). Không đổi hình ngẫu nhiên mỗi khung.
- **Hạt lơ lửng** chọn theo thứ có trong cảnh: tàn lửa bay lên chậm rồi tắt, đom đóm trôi rất chậm (`Fireflies`), bụi nắng trong luồng nắng, tuyết. Hạt TỰ SINH theo nguồn sáng và cây hoa (`lib3/buiNguon`; skill 1, mục Hạt): người diễn không tự rải hạt; chỉ thêm `Fireflies`, `Motes` khi cảnh cần thứ nguồn không tự có, và ghi `hat:ok` cùng dòng.
- **Khói** (`LocoSmoke`): các cụm bay lên, nở ra, trôi theo gió rồi tan; cụm non phải chồng lên nhau, nếu không trông như chuỗi hạt.
- **Lá bay** (`FlyingLeaves` trong `src/lib3/kit.tsx`): lá rơi chậm theo gió, xoay và lật; phần lớn bay sau lưng nhân vật, thêm vài chiếc bay TRƯỚC nhân vật (`order={600}`) nhưng đừng để chúng đi ngang mặt.
- **Chấm lơ lửng** (`Motes`, món cũ; cảnh mới để `Sun`, đèn, lửa tự sinh bụi): bụi vàng trong nắng thấp, bụi trong vùng sáng đèn bàn, thiêu thân quanh đèn đường; mỗi chấm trôi chậm quanh chỗ của nó và có quầng nhỏ.
- **Quầng sáng** (`Halo` trong `src/lib3/look.tsx`): nắng thấp hắt từ một phía, cửa sổ có ánh máy "thở" (bán kính đổi chậm theo khung), đèn đường. Cảnh ngoài trời nên có những thứ này cho sống động.
- **Hiệu ứng lớn** (`src/lib3/fx.tsx`, có ảnh trong kho, nhóm `hieu-ung`): cửa ánh sáng xoáy `Portal`, tia điện `Arc`, giấy bị hút `FlyingPapers`, vụ nổ từ ô cửa `Explosion`, khói trôi `SmokeDrift`, tàn lửa `Embers`, chớp trắng `Flash`, rung máy `Shake`. Tất cả chạy mỗi khung theo `f`.
  - Thêm 22/11/2026: `RingLightning` (sét bò quanh một cái vòng), `BulbHalo` (đầu cực bật sáng, quầng nhiều cạnh), `beyondTex` (bức tranh của phía bên kia cho `Portal`). `Portal` nhận `inside` (tranh bên trong) và nhận nhân vật làm con: `Puppet3` với `order` thấp (vẽ sau tranh, trước viền), `cast={false}`, `lit={false}`, `tint` nhạt, `opacity` để hiện dần. `Explosion` nhận `star` (hình sao phẳng) và `clouds` (mây phẳng).
  - Cảnh phô diễn hiệu ứng: dài hơn cảnh thường, kích hoạt sớm, các lớp vào lần lượt, rồi giữ; luật ở `skills/0-dao-dien.md`, mục Cảnh phô diễn hiệu ứng.
  - Một hiệu ứng lớn là điểm nhấn của MỘT cảnh quay. Vụ nổ đi theo thứ tự: chớp trắng 2 khung, nổ ở khung kế, rung máy 6 khung rồi đứng yên hẳn, người trong cảnh phản ứng trễ 2 đến 4 khung (động tác `fast`), các thứ xung quanh thay đổi lần lượt (cửa sổ bật đèn từng cái).
  - Trong phòng bị xoay, các hiệu ứng phẳng nhận `rotY={-yaw}` để quay mặt về ống kính; riêng `Portal` nằm trong mặt phẳng của cái vòng nên đặt thẳng vào nhóm của cái vòng.
  - Ánh sáng màu của hiệu ứng hắt lên tường là đèn của bối cảnh. Hắt lên NGƯỜI thì đặt `anMau` cho người đứng sát hiệu ứng (mặc định người chỉ nhận rất nhẹ màu của đèn). Không tô tay lên nhân vật.
- **Dây cờ, lều, đèn, cây** đứng yên.
- Món trong thư viện có phần chuyển động thì nhận `f`; nếu cảnh đang dùng bản tĩnh, bật bản động qua tham số của cảnh (ví dụ `moving`), không sửa bố cục.
- **Máy quay:** chỉ dùng kiểu máy có tên (`Shot may={{kieu, D, muc}}`; luật ở skill 0, mục Máy quay; cách gọi ở skill 1, mục Máy quay và chỗ đứng). Không tự viết dx/dz.

## Cách làm một đoạn

1. Đọc ghi chú sân khấu; mở ảnh tĩnh đã duyệt. Không dời chỗ đứng đáng kể; cần dời thì trả về bước dựng cảnh.
2. Viết comp mới trong cùng file cảnh: `<Scene f={frame} dx={...} dz={...}>` với các `Puppet3` diễn theo nhịp; đăng kí comp 24 khung một giây.
3. Dựng vài khung lẻ trước (`./still.sh <comp> <khung>`), mở ra xem; rồi dựng video. Bản để kiểm nhanh: `./render-video.sh <comp> 1` (720 dòng). Bản gửi cho Daniel: `./render-video.sh <comp> 2` (2560×1440, vì màn hình của Daniel là 2K); ở độ phân giải thấp hơn mép nhân vật vỡ răng cưa khi bị phóng lên. Ảnh tĩnh gửi Daniel: `./still.sh <comp> <khung> 2`. Cả hai lệnh phải chạy ngoài sandbox.
4. Tự soi: cắt dải khung liên tiếp phóng to phần chân lúc đi và lúc đứng; dải khung lửa hoặc hạt; bốn khung toàn cảnh rải dọc đoạn. Xem: chân có trượt không, có bắt chéo không, tư thế có rõ không, có ai chạm mép vật gì khi di chuyển không.

Kiểm quãng đi so với mặt đất: trên dải khung liên tiếp, chân phải thẳng dưới thân, mỗi lần chỉ một bàn chân nhấc; khi dừng, hai chân đứng ngay dưới thân từ khung đầu tiên (không bước thêm). Lúc đi, bàn chân trôi theo thân như phim mẫu; nếu trông như trượt thì giảm tốc độ đi.

Không xem được video chạy thì nói rõ là chỉ kiểm qua khung.
- **Thêm 23/11/2026, bóng người:** `src/mould/BongNguoi.tsx`: `bongTex(spec, {blur, them, themKey, catDuoi})` cho hình bóng một tông của một nhân vật ở đúng tư thế đang có; `<BongNguoi spec height pos color opacity />` đặt nó lên rèm hoặc vách như đặt một `Puppet3`. `them` vẽ thêm gối, chăn vào cùng tấm bằng toạ độ của bộ khuôn; `catDuoi` cắt phần dưới của người. Luật dùng ở skill 0, mục "Bóng người vẽ lên rèm, lên vách". Cái bóng Doom ở `d1c4-21` còn dùng hàm riêng trong file cảnh (có khoét mắt mặt nạ); khi cần dùng lại thì chuyển sang công cụ này.
- **Thêm 23/11/2026, người ốm:** `eyeBags` (màu của quầng tối dưới mỗi mắt), dùng cùng bảng da xám nhợt và `lips` màu nhợt; xem `BARONESS` của kênh phim-tv. `phaNac(a, b, f)` của `LonLen.tsx` pha được hai bảng màu của cùng một người (da xám dần khi chết rét, mặt đỏ dần khi giận).

## Dáng mới 23/11/2026

Tất cả bật bằng trường mới; không khai báo thì hình không đổi (đã so 292 ảnh đối chứng). Tấm trình bày: composition `khuon-dang-moi`, ảnh `kenh/phim-tv/out/bo-khuon/dang-moi.jpg`.

```tsx
// Dáng người (`vest`, `coat`, người lớn, trẻ con): 'stand' | 'sit' | 'kneel' | 'buckle' (quỳ hai gối, nhìn chính diện) | 'fall' (ngã chúi, hai gối và hai bàn tay chạm đất) | 'lie'
<Puppet3 height={1.68} pos={[x, 0, z]} spec={withPose({...VICTOR, posture: 'sit'}, 'knees')} />   // mặt ghế cao seatHeight(cao) mét (mould/dang.ts)
// Chuyển dáng trên MỘT hình, qua act:
const KEYS = perform([{f: 6, posture: 'kneel', pose: 'knees'}, {f: 40, posture: 'stand', pose: 'idle'}]);
// 'fall' tự đặt hai tay thẳng xuống đất, không cần khoá tay. Chuỗi chương 9: perform([{f: 14, posture: 'buckle'}, {f: 22, posture: 'fall'}]): gối chạm đất ở khung 20, tay chạm tuyết ở khung 28. Ngẩng đầu: head.dy âm
// Tay dài: ArmPose.len (mặc định 1). POSES.reachUp, POSES.reachBoard, POSES.prop (tay buông, chỗ xuất phát trước khi chống), POSES.knees (tay trên đùi)
// Bàn tay rời từ mép khung: at = chỗ CỔ TAY; from = phía cẳng tay đi ra
<BanTayRoi spec={VICTOR} height={1.68} at={[1.2, 1.1, 0.4]} from="right" hand="open" />   // bare: tay trần; flip: đổi bên ngón cái
// Đầu quấn băng, chỉ hở mắt: mí, hướng nhìn, chớp mắt vẫn diễn; không có miệng và lông mày
const VICTOR_BANG = {...VICTOR, bandage: true};   // hoặc bandage: {color: '#cfc6b2', tail: false}
// Lông mày trên mặt nhìn thẳng: browFront: true. Mí sạch khi đổi nét mặt: {f: 10, expr: {...EXPR.shock}, resetLid: true} (Key hoặc Beat)
```

- `flip` đổi bên gối dựng khi quỳ và đổi hướng đầu khi nằm. Người nằm có tấm rộng hơn (`boxOf`), `Puppet3` tự lo; điểm thấp nhất tự chạm đất ở mọi hình trung gian.
- Đặt đồ cho khớp: ngồi cần ghế cao `seatHeight(cao)`; `fall` thì hai bàn tay nằm ngoài hai gối, rộng hơn vai một chút; `buckle` và `fall` của áo `coat` xoè vạt trên đất, cần chỗ trống hai bên.
- Chưa làm được: xem mục "Bộ khuôn chưa có" ở cuối file.

- **Thêm 23/11/2026, Doom nhìn từ sau lưng:** `{...DOOM, view: 'back', backDetail: true}` vẽ mũ trùm có chóp và đường may giữa, cổ áo, tấm phủ vai, áo choàng nhiều nếp với gấu so le, hai tay giáp và găng theo `armL`, `armR`. `backDetail: {tense: 1}` cho vai gồng. Không có cờ thì vẫn là khối cũ. `rim: {side: 'R', color: '#ff8a3a', amount: 1}` thêm viền sáng cứng ở một bên hình (`side` tính trong không gian bộ khuôn, hình lật thì đảo), dùng được cho mọi nhân vật. Tay buông bị áo che một phần; muốn thấy nắm tay ở cảnh cận thì gập khuỷu đưa găng ra hai bên (`{sh: 28, el: 104, hand: 'fist'}`). **Đèn `phu` của `Forge` đặt trước tấm người sẽ tẩy áo xanh thành xanh bạc hà:** đặt nó SAU tấm người (z nhỏ hơn z của người).

## Dáng đánh nhau (23/11/2026)

Bật bằng `posture` và pose mới; không khai báo thì hình không đổi (30 ảnh đối chứng `d1mo`, `d1c2`–`d1c9` trùng từng byte). Tấm trình bày: composition `dang-danh-nhau`, cảnh mẫu `dang-danh-nhau-ben`, `-johnny`, `-khien`, ảnh `kenh/phim-tv/out/lo-10-14/dang-danh-nhau.jpg`. Mọi dáng hướng về bên PHẢI khung; hướng trái thì `flip`.

```tsx
import {withDang, dangKey} from 'mould/gestures';   // tên: dam lao nhay ne hat chongDo banTia banTia2 bay bayChui benVung benDap reedDam sueKhien
import {handWorld, feetWorld} from 'mould/draw';
import {SaoVaCham, VongXungKich, NenNut, ManhVo, KhoiPhang, TiaNangLuong, KhienSue, VetTocDo, DuoiLua} from 'lib3/kitDanhNhau';
// Ảnh tĩnh, hoặc hình xuất phát của act. Doom thêm capeT: f để áo gợn
const ben = act(withDang(BEN_DA, 'benVung'), [dangKey(18, 'benDap', {fast: true, inb: 1})], f, {live: 0.5});
// Tia bắt đầu ĐÚNG ở bàn tay, đuôi lửa ĐÚNG ở cổ chân (tính từ spec đang diễn, cùng height, pos, flip với Puppet3)
<TiaNangLuong f={f} a={handWorld(doom, 1.96, pos, true, 'R')} b={dich} kieu="doom" rong={0.15} p={(f - 3) / 9} sang={2} />   // kieu: doom, lua, bac
<DuoiLua f={f} a={feetWorld(johnny, HEIGHT_FF.johnny, jp)} b={duoi} r={0.32} />                                                // order 488: nằm sau thân
// Va chạm tại khung VA: sao, vòng, nứt, mảnh, khói, rung, chớp
<SaoVaCham f={f} at={VA} pos={tay} r={0.86} /><VongXungKich f={f} at={VA} pos={dat} r={3} /><NenNut pos={dat} r={2.7} p={(f - VA + 1) / 5} />
<ManhVo f={f} at={VA} pos={dat} s={0.095} huong={[1.2, 2.6]} /><KhoiPhang f={f} at={VA + 1} pos={dat} s={1.15} rong={3} order={470} />
<KhienSue f={f} pos={truocTaySue} r={0.98} mo={(f + 3) / 6} va={VA} />   // tia dừng ở mặt khiên: x = tâm khiên + khoảng 0,65 r
```

- Người bay dùng `NguoiLua` (Johnny) hoặc `Puppet3`; `rise` có sẵn trong dáng, nâng thêm bằng y của `pos`. Bay theo đường chéo xuống thì dùng `bayChui`, để thân, tay, tia và đuôi nằm trên cùng một đường.
- Sao va chạm r 0,8–1 ở trung cảnh; to hơn là che mất cả hai người. Mảnh vỡ `s` dưới 0,12 ở trung cảnh.
- Chưa làm được: xem mục "Bộ khuôn chưa có" ở cuối file.

## Bộ khuôn chưa có (một danh sách duy nhất, cập nhật 26/11/2026)

Cảnh cần một thứ dưới đây thì đổi cách dàn cảnh và ghi lại; không làm mẹo (ống tay áo rời, đầu gối giả).

- **Dáng và chuyển động:** đi nhìn nghiêng thật; quay đầu (nhìn sang bên chỉ bằng mắt và `head.rot`); gật đầu thành một nhịp riêng; cúi người; cầm đồ vật trên tay; đi vào sâu hoặc đi ra xa máy; đi khi đang ở dáng thấp; ngẩng đầu và giơ tay nhìn từ sau lưng; dáng béo, gầy.
- **Trang phục:** áo vét, áo khoác có ve, đồng phục; mũ (mới có `helmet` và mũ phớt nhìn từ sau); áo choàng tung theo bước.
- **Nét mặt:** nét nằm giữa `smile` và `happy`.
- **Dáng mới 23/11:** `posture` cho `outfit: 'doom'` (Doom chỉ có `sit` riêng); `BongNguoi` và các hàm bóng tự viết cho người `lie`; áo `coat` ngồi, quỳ, khuỵu khác nhau ít (đọc bằng chiều cao và nếp vải).
- **Dáng đánh nhau:** `bay` cho Ben, Reed, Sue; áo `coat` chưa soi hình; chuyển từ `sit`, `kneel` sang dáng đánh chưa thử; đòn vẫn là thân chính diện xoay trong mặt phẳng tấm.
- **Tay co giãn, bụi:** tay co giãn không gập khuỷu; `dust` nằm yên trên tấm, không chạy theo tay; `rolled` chưa áp cho tay chống đất của dáng `fall`.

Đã có, đừng ghi là thiếu: ria (`moustache`), chòm râu (`goatee`), cà vạt (`tie`), váy (`skirt`), tóc mượt rẽ ngôi (`hair: 'smooth'`), sáu dáng mặt (`faceShape`), viền sáng một bên (`rim`), ngồi, quỳ, khuỵu, ngã, nằm (`posture`), tay với cao (`reachUp`, `reachBoard`), bàn tay rời (`BanTayRoi`), đầu quấn băng (`bandage`).

## Trường dùng chung sinh ra từ dàn nhân vật tập Doom

Sẹo có vẽ (`scar {paint: true}`), găng cho bàn tay rời (`gauntlet`), tay co giãn (`stretch`, `wideCard`), người lửa (`NguoiLua`), mắt sáng (`expr.glow`), mắt đờ của người bị thao túng (`MAT_DO`), bộ đồ anh hùng (`suit`), và các trường `temples`, `longHair`, `broad`, `rock`, `flame`, `sheen`, `dust`, `cape`: kênh nào cũng dùng được. Cách gọi, ví dụ và các số đo riêng của dàn Doom (Ben đá, Johnny lửa, các mốc của tập doom-1) nằm ở `kenh/phim-tv/ghi-chu.md`, mục "Dàn nhân vật tập Doom (dời từ skill 3 ngày 26/11/2026)".
