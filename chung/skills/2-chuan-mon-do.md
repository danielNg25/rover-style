# Skill 2: chuẩn chi tiết cho một món đồ (cutout3d)

> Sửa luật trong skill này chỉ khi Daniel đã xác nhận đúng thay đổi đó (luật 25a); sửa xong thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Agent không sửa skill: thấy thiếu hay sai thì ghi vào báo cáo.
> Ai làm việc gì, file nào của ai, cổng kiểm nào phải qua: `skills/4-quy-trinh.md`.

## Thẻ làm một món (26/11/2026; chỗ ghi duy nhất của thẻ luật cứng 13 và 14)

Trước khi viết code hay gen BẤT CỨ món nào (cây, đá, bàn, đèn, lớp xa…), đi đủ bốn bước theo thứ tự. Bảng thiết kế bối cảnh của workflow `dung-canh-3d` có sẵn hai cột `kho` và `loại` cho bước 1 và 2.

1. **Tra kho.** `python3 tools/kho.py tim <từ> [--nhom <nhóm>]` (kho chung `assets/`, kho của kênh `../kenh/<kênh>/kho/`), rồi mở ảnh món kho ra xem. Có món cùng loại và đúng kiểu thì GỌI LẠI, đổi màu, seed, cỡ cho hợp cảnh, và dừng ở đây. Chỉ làm mới khi kho chưa có, hoặc món kho sai kiểu so với tranh bối cảnh mẫu; khi đó ghi lý do trên dòng khai báo: `kho:ok <vì sao>`. Một món chỉ viết MỘT lần; file khác import lại.
2. **Chọn loại theo loại vật** (mục "Phẳng hay khối" bên dưới): thứ sống hoặc mềm là hình phẳng; thứ cứng, được làm ra là khối 3D; đá, cột, chum, bình là khối tiện; lớp xa là tấm nền. Tranh Codex không quyết món là phẳng hay khối.
3. **Lấy nét.** Món cần nét vẽ thì gen bằng Codex (mục "Vẽ đồ bằng Codex"): với hình phẳng và tấm nền, tranh là chính món đó; với khối, tranh là bản thiết kế và mặt vẽ của khối. Khối xây dựng to đơn giản, mặt đất, mặt nước, thứ phải chuyển động thì vẽ bằng code.
4. **Vào kho.** Món dùng lại được ở kênh khác thì vào kho CHUNG (file mới trong `src/lib3/`, mục mới trong `assets/catalog.json`, ảnh xem trước); món chỉ có nghĩa với một kênh thì vào kho của kênh đó. **Thêm món nào vào kho chung cũng phải được Daniel duyệt** (Daniel 25/11/2026): gửi Daniel ảnh món kèm tên và chỗ dùng, duyệt rồi mới ghi vào `assets/catalog.json`. Không sửa, không xoá món đang có.

Công cụ canh: `python3 tools/kiem_kho.py <file>` (`kiem_canh.py` tự gọi) báo `tu-ve-lai` (tự viết lại loại vật kho đã có), `trung-mon` (một món viết ở hai file) và `cung-ma-phang` (món cứng như đá, bàn, ghế, thùng mà chỉ là một tấm `Pic2D` / `Sprite`; cố ý thì ghi `loai:ok <lý do>`).

## Kho asset: món nào làm xong cũng phải vào kho (Daniel, 21/11/2026)

Daniel dặn: "phải lưu lại asset vào 1 folder và đặt tên và lưu lại mapping ở đâu đó để có thể tái sử dụng; tên cần phải đặt để dễ liên tưởng và đủ chi tiết để biết có hợp ko".

- **Kho có hai danh mục (từ 23/11/2026), công cụ gộp lại khi dùng.** Danh mục CHUNG là thư mục `assets/`: món dùng được cho mọi kênh, có code trong `chung/src`; mỗi món có một mục trong `assets/catalog.json` (bảng tra, nguồn duy nhất), một ảnh xem trước `assets/<nhóm>/<id>.png`, một dòng trong mục lục `assets/DANH-MUC.md` (máy viết ra), ảnh xem trước khai trong `src/catalog/Catalog.tsx`. Danh mục của KÊNH là `../kenh/<kênh>/kho/`: món chỉ có nghĩa với kênh đó (nhân vật của kênh, bảng của nhân vật đó, bối cảnh có người của kênh đứng sẵn); cùng cách ghi (`catalog.json`, `<nhóm>/<id>.png`, `DANH-MUC.md`), ảnh xem trước khai trong `../kenh/<kênh>/kho/Previews.tsx` (`PREVIEWS_KENH`, composition `kho-asset-<kênh>`). Trường `kenh` của mục là `"chung"` hoặc tên kênh, phải khớp với danh mục chứa nó. Món có code trong thư viện chung (`src/lib3`, `src/mould`) thì vào danh mục chung, kể cả khi làm cho một kênh; ảnh xem trước của nó dùng người mẫu chung (`src/mould/nguoi-mau.ts`), không dùng nhân vật của kênh. Phiên làm kênh ghi món riêng của kênh vào danh mục của kênh mình; món dùng chung thì vào danh mục chung sau khi Daniel duyệt (Thẻ làm một món, bước 4).
- **Một mục gồm:** `id`, `nhom`, `ten` (tên có dấu), `mo_ta` (trông thế nào: hình dáng, chất liệu, màu, chi tiết riêng, tham số đổi được), `hop_voi` (loại cảnh, thời, vùng mà món hợp), `goi` (lời gọi mẫu), `code` (file chứa nó). Bối cảnh có thêm `comp` (tên composition để dựng ảnh).
- **Đặt `id`:** chữ thường không dấu, nối bằng gạch ngang; mở đầu bằng loại vật, tiếp theo là hai ba đặc điểm NHÌN THẤY ĐƯỢC đủ để phân biệt nó với món cùng loại và để người đọc đoán được có hợp cảnh không. Ví dụ: `nha-khung-go-mai-ngoi-do-co-ong-khoi`, `xe-thung-lu-hanh-do-mai-xanh-cua-so-sang`, `cay-phong-la-do-cam-mua-thu`. Không dùng tên component (`Cottage`), không dùng tên chung chung (`nha-1`, `cay-to`).
- **Nhóm:** `bo-canh`, `nhan-vat`, `nha-cua`, `do-ngoai-troi`, `nha-ga-xe-lua`, `do-trong-nha`, `thien-nhien`, `con-vat`, `nen-xa`, `hieu-ung`, `cong-cu` (công cụ dựng, không có ảnh). Thêm nhóm mới thì thêm vào `GROUPS` trong `tools/kho.py`.
- **Thêm một món:** (1) viết món vào file thư viện; (2) thêm mục vào `assets/catalog.json` (món của kênh: `../kenh/<kênh>/kho/catalog.json`); (3) thêm ảnh xem trước của `id` đó vào `PREVIEWS` trong `src/catalog/Catalog.tsx` (món của kênh: `PREVIEWS_KENH` trong `../kenh/<kênh>/kho/Previews.tsx`) (hình phẳng dùng `flat`, món vẽ trên tấm nền dùng `plate`, món khối dùng `d3`; máy tự căn khung theo kích thước thật, không cần ghi cỡ); (4) chạy `python3 tools/kho.py` ngoài sandbox; (5) mở ảnh ra xem, sửa mô tả cho khớp hình thật.
- **Cổng kiểm:** `python3 tools/kho.py kiem` phải in "kho đủ và khớp". Nó báo món thiếu ảnh, ảnh thừa, mô tả còn bỏ trống, và mọi thứ `export` trong các file thư viện mà chưa có trong kho. Agent thêm món mới mà không đăng kí thì cổng này bắt được.
- Đổi hình của một món thì dựng lại ảnh của nó (`python3 tools/kho.py anh <id>`) và sửa mô tả.
- Ảnh trong kho là ảnh xem trước; hình thật vẽ bằng code thì đổi được màu, cỡ, seed khi gọi. Món là tranh Codex thì mục kho ghi file ảnh trong `public/` và lời tả đã dùng.

Dùng khi phải **làm một món mới** cho kho (một cái nhà, một loại cây, một con vật, một đồ vật) hoặc soát một món đã có. Món dùng lại được nằm trong thư viện chung (vào kho chung cần Daniel duyệt: Thẻ làm một món, bước 4), không nằm trong file cảnh.

## Phẳng hay khối: chia theo loại vật, không theo cỡ

- **Hình phẳng** (vẽ bằng canvas, dùng qua `Sprite`): thứ sống hoặc mềm, hình dạng tự do. Nhân vật, con vật, cây, bụi, hoa, đồ ăn, bó rơm. Cao tới đâu cũng vẫn phẳng.
- **Khối 3D** (ráp từ `B` trong `src/lib3/kit.tsx`): thứ được làm ra, cứng, có các mặt phẳng. Nhà, tường, cổng, bàn ghế, tủ, thùng, sách, toa xe.
- **Khối tiện** (`FacetLathe` trong `src/lib3/look.tsx`): chỉ cho đá, cột, cột đèn, thùng tròn, chum, bình. Không dùng khối cầu.

## Hướng của hình phẳng

- Vật đứng tự do thì quay mặt về máy (`Sprite` mặc định; trong phòng xoay dùng `Spr`).
- Vật gắn vào một bề mặt thì nằm theo đúng bề mặt đó, dùng `rotY`: cặp treo bên hông bàn quay sang bên, tranh nằm trên mặt tường, giấy nằm trên mặt bàn.
- Trong nhà, hình phẳng ăn sáng và nhận bóng của phòng (`Sprite` tự bật khi loại cảnh là trong nhà). Ngoài trời, hình phẳng giữ ánh sáng tự vẽ; phía sáng vẽ theo hướng đèn chính của cảnh (hình dùng lại ở cảnh có đèn từ phía kia thì lật bằng `flip`).

## Mỗi món phải có đủ năm thứ

1. **2–4 sắc cùng họ màu:** mặt sáng, mặt tối, điểm đậm. Khối 3D lấy từ ánh sáng; hình phẳng phải tự vẽ.
2. **Một kiểu vật liệu, rất nhẹ,** trên bề mặt lớn (hàng gạch mờ, lớp rạ, hàng ngói, ván thùng); không vân dày, không vết loang (Daniel 25/11/2026: mặt lớn yên, chi tiết dồn vào hình dáng và đồ gắn kèm).
3. **Một dấu vết đời sống:** miếng vá, rêu ở chân tường, cái nia treo, dây phơi, bát hương, bình hoa, vết mực.
4. **Không đều tăm tắp:** nan cao thấp khác nhau, bó rạ dài ngắn, cọc hơi nghiêng, bờ không thẳng. Dùng `rnd(seed)` để lệch có kiểm soát.
5. **Chạm đất:** có một thứ gì ở chân (búi cỏ, đá, bậc thềm) và đổ bóng thật (`castShadow`). Không vẽ vệt tròn dưới chân món (đã bỏ 25/11/2026; skill 1, mục Bóng).

## Vẽ đồ bằng Codex

Món cần nét vẽ thì gen bằng Codex, không chờ Daniel nhắc. Gen là BƯỚC 3 của Thẻ làm một món: tra kho và chọn loại xong mới viết lời tả.

- **Gen gì, code gì.** Gen: cây, bụi, hoa cỏ, đá, thác, con vật, đồ nhỏ nhiều chi tiết, đồ trang trí, sạp hàng, lớp xa (làng, tháp, núi), tranh treo tường. Code: khối xây dựng to và đơn giản (tường, sàn, mái, bậc), mặt đất, mặt nước, thứ chuyển động theo tham số (cờ, nước chảy, lửa), hiệu ứng, nhân vật.
- **Tranh bối cảnh mẫu (bối cảnh MỚI, làm trước khi gen đồ).** Một tranh của CẢ bối cảnh để dựng theo, thay cho việc agent tự nghĩ bố cục. File lời tả `gen/prompts/<mã>-<tên>-canh.txt` mở đầu bằng `#CANH <tên bối cảnh>` và tả đúng bảng thiết kế: nơi chốn, giờ và ánh sáng, từng lớp từ xa tới gần, dải đất trống cho người đứng, bộ màu. Không nối `style.txt`, không nhắc tên phim hay nhân vật. Mẫu: `gen/prompts/_mau-tranh-boi-canh.txt`. Daniel duyệt tranh cùng bảng thiết kế rồi mới dựng (skill 1, mục Cảnh mẫu của cảnh). Tranh chỉ để dựng theo: không dán làm nền, không cắt ra làm đồ.
- **Tấm đồ: mỗi lần gen một TẤM KÍN.** Hạn mức Codex tính theo số lần gen. Gom mọi món cần gen của bối cảnh rồi chia tấm theo cỡ món: 12–20 món nhỏ và vừa; 4–6 món lớn (cây to, vách đá, quầy hàng); 3–4 dải lớp xa xếp chồng. Lời tả đòi xếp sát: chia hàng theo cỡ, lấp kín tấm, khe hở 2–3 % bề ngang, không món nào chạm nhau hay bị mép cắt. Không gen một tấm cho một hai món; món thiếu, món hỏng dồn vào một tấm sửa. Cuối lời tả nối `gen/prompts/style.txt` (kiểu vẽ, nền hồng #FF00FF, không chữ). Mẫu: `gen/prompts/_mau-tam-kin.txt`.
- **Bảng món ở đầu file lời tả của tấm đồ** (`gen.sh` giữ bằng code): mỗi món một dòng `#MON <số> | <tên món> | <loại> | kho: <tra bằng từ gì, ra gì>`; loại là `phang`, `khoi-dun`, `khoi-tien`, `khoi-rap` hoặc `tam-nen`. Món kho đã có thì không đưa vào tấm. Soát: `python3 tools/kiem_loi_ta.py <file>`; thiếu bảng thì `gen.sh` không gọi Codex (mã thoát 4). Món là khối được dựng bằng cách đùn hoặc tiện viền ảnh, nên công cụ tự thêm câu "vẽ chính diện, không phối cảnh" cho các món đó.
- **Ảnh mẫu kiểu vẽ:** tranh bối cảnh mẫu đã duyệt và một hai khung của bộ cảnh mẫu cùng loại cảnh; lời tả viết "drawn in exactly the art style of the attached reference". Tả món bằng lời; không bảo vẽ lại đúng khung hay nhân vật trong khung, không đưa nhân vật nổi tiếng (công cụ từ chối).
- **Kiểu vẽ của ảnh gen: GIẤY CẮT XẾP LỚP, như video gốc.** Mỗi thứ là một mảnh giấy màu mờ cắt bằng kéo: MỘT màu phẳng, thêm tối đa một mảng phẳng cùng họ màu cho mặt tối; thớ giấy rất nhẹ; hình lớn và đơn giản, mép cắt gọn, góc hơi mềm. Không gradient, không bóng mềm, không quầng, không viền, không nét uốn lượn, không cắt thành nhiều mặt đa giác nhỏ kiểu low-poly. Màu như giấy thủ công, mờ, tương phản thấp: MẶT LỚN (trời, đất, tường, sàn) trầm và ngả xám, tên màu trong lời tả viết bản trầm (muted peach-orange, dusty violet, slate blue-grey); màu nhận diện (áo nhân vật, cờ, lửa, nguồn sáng, vật của câu chuyện) giữ màu rực của nó ở vùng nhỏ. Tranh cả cảnh: các lớp giấy chồng nhau, có vệt bóng mảnh ở mép chỗ chồng; trời và nước là dải giấy phẳng; lớp xa nhạt và xám dần. Tấm đồ nền hồng: không bóng nào, bóng do engine dựng. `kiem_loi_ta.py` tự thêm các câu này vào mọi lời tả và báo LOI khi lời tả đòi gradient hay nét cong mềm (chữ vivid, saturated chỉ ra cảnh báo). Ảnh nhận về lệch kiểu này thì tính là hỏng.
- **Lệnh** (trong chung/, chạy NGOÀI sandbox, mỗi lần 1–3 phút): `./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu…>` ra `gen/<tên>.png`. Tấm đồ thì cắt: `python3 tools/cut.py gen/<tên>.png public/<thư mục của bối cảnh> <tiền tố> --mong=<số món>`. Luôn mở tấm `<tiền tố>-overview.jpg` ra xem, không tin riêng con số: lệch số là có món dính nhau hoặc sót; ảnh gen ở công cụ ngoài có thể mang vệt mờ hay dấu của công cụ đó; hình chiếm dưới 40 % tấm là tấm thưa.
- **Nhờ Daniel gen trên web (hàng chờ).** Daniel gen bằng Flow qua extension `chung/tien-ich/flow-gen`, đọc thư mục hàng chờ `chung/gen/cho-gen/`. Mỗi việc là một thư mục `gen/cho-gen/<tên>/` có sẵn lời tả đã soát (`loi-ta.txt`), các ảnh mẫu và nơi lưu ảnh. Việc vào hàng chờ theo hai đường: `gen.sh` tự xếp khi Codex hết hạn mức (thoát mã 3); hoặc xếp thẳng, không gọi Codex: `GEN_QUA=flow ./gen.sh <tên>.png gen/prompts/<tên>.txt <ảnh mẫu…>` (cũng thoát mã 3). Khi đó: không chờ Codex mở lại, không vẽ thay bằng code, không bỏ món. Ngay câu trả lời kế tiếp báo Daniel TÊN các việc đang chờ, gom vào MỘT tin; không dán lời tả, không gửi ảnh mẫu vào chat (đã nằm trong hàng chờ). Ảnh Daniel gen xong nằm ở `gen/<tên>.png`: xem bằng `python3 tools/xep_gen.py --xem`, có ảnh thì làm tiếp như thường; việc ghi "Daniel đã bỏ" thì không nhắc lại. Trong lúc chờ làm phần không cần các món đó. Agent trong workflow không nhắn được Daniel: điền `cho_gen` (với tranh bối cảnh mẫu: `tranh_co: false`) rồi dừng bối cảnh, phiên chính báo.
- **Đặt vào cảnh theo LOẠI của món** (mục Phẳng hay khối): thứ sống hoặc mềm là hình phẳng `<Pic2D src="<thư mục>/<tiền tố>-N.png" w={bề ngang ngoài đời} pos={[x, 0, z]} />` (`src/lib3/flat.tsx`); lớp xa là tấm nền; thứ cứng là khối 3D ráp từ `B`; đá, cột, chum, bình là khối tiện `FacetLathe`. Với khối, tranh Codex là bản thiết kế (dáng, số mảng, màu) và mặt vẽ: không dán nguyên tấm tranh thay cho món cứng.
- **Chỉnh màu một ảnh:** lệch nhẹ so với tranh bối cảnh mẫu thì dùng tham số của `Pic2D`: `chinh={{sat, lum, tint, amount}}` (mỗi số có khoảng kẹp); lệch nhiều thì ghi màu cần có vào lời tả rồi gen lại. Không tô đè bằng bộ lọc, không tự viết tấm ảnh (`kiem_cam.py` báo LOI).
- **Đá và núi (chỗ ghi duy nhất; ảnh SAI và ĐÚNG: `bang-cham/nui-da.jpg`):** núi xa là tấm nền phẳng, MỖI LỚP MỘT SẮC, lớp chồng lớp, càng xa càng nhạt; muốn núi có khối thì thêm chỏm tuyết mép gãy, hoặc một mảng tối rộng bám theo sườn, hai sắc gần nhau; KHÔNG kẻ một sống thẳng từ đỉnh xuống rồi tô hai nửa hai màu. Tảng đá là MỘT khối bo (khối tiện hoặc khối 3D), 2–3 mảng lớn, mặt trên sáng, mặt bên tối, các sắc gần nhau; KHÔNG ghép đá từ nhiều mặt tam giác mỗi mặt một sắc. Lỗi là chia khối thành nhiều mặt tam giác, không phải là việc dựng khối. Dáng và mặt vẽ lấy từ tranh Codex. Lời tả cho đá: "a large rounded boulder, two or three big flat planes with crisp edges, lighter top, darker side, close tones, no low-poly triangle facets". Lời tả cho núi xa: "distant mountain range as flat single-tone silhouette layers, each layer one tone, paler with distance, optional jagged snow caps, no straight vertical ridge that splits a peak into a light half and a dark half". Nhận tấm về thì soi đúng hai điểm đó trước khi cắt.
- **Ngân sách cho một bối cảnh:** 1 tranh bối cảnh mẫu (gen lại tối đa một lần), 2 tấm kín và 1 tấm sửa. Cần hơn thì hỏi Daniel. Không gen lại vì lỗi nhỏ.
- **Vào kho:** bước 4 của Thẻ làm một món (vào kho chung cần Daniel duyệt); mục kho ghi rõ file ảnh và lời tả đã dùng.

## Cách làm một hình phẳng

```ts
// trong src/lib3/depth.tsx
export const paintThing = (c: Ctx, W: number, H: number) => { /* vẽ trong khung W x H, chân hình ở cạnh dưới */ };
// dùng: <Sprite name="thing" art={paintThing} px={[400, 300]} w={2.2} pos={[x, 0, z]} />
```

- Vẽ bằng các mảng to, 2–4 sắc cùng họ màu; `P(c, [[x, y], ...], màu)` tô một đa giác.
- Khung `px` phải chứa trọn hình, kể cả phần nhô ra; thiếu thì hình bị cắt cụt.
- Tán cây: nhiều hình tròn chồng nhau ba sắc xanh, thêm cụm lá nhỏ và vài khe tối; một hình tròn to trơn là mảng phẳng.
- Con vật: thân, đầu, chân là các mảng đơn giản; thêm một chi tiết sống (con cò trên lưng trâu).

## Cách làm một khối 3D

```tsx
// trong src/lib3/kit.tsx
export const Thing: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 1, 0]} s={[2, 2, 3]} c="#e8dcc0" />                       {/* khối chính */}
    <B p={[0, 1, 1.52]} s={[2, 0.12, 0.05]} c="#5c4231" cast={false} />  {/* cấu trúc phụ: nẹp, đai, mạch */}
  </group>
);
```

- Nhà: xoay khoảng 0.5 rad để thấy hai mặt; mái là hai tấm nghiêng có hàng ngói hoặc lớp rạ mép lởm chởm; cửa, cửa sổ có khung, chớp, bậu.
- Chi tiết mỏng (nẹp, mạch vữa, chữ) đặt `cast={false}`.
- Chữ trên biển là chữ thật, đúng nghĩa: dùng `Label` trong `src/lib3/kit.tsx`.
- Hai chi tiết mỏng nằm cùng một mặt phải lệch nhau ít nhất 0.01 theo chiều sâu, nếu không chúng nhấp nháy đè lên nhau.
- Món có phần chuyển động (khói, lửa, cờ) nhận số khung `f`; bản tĩnh và bản động của phần đó cùng nằm trong thư viện.

## Soát một món trước khi cho vào kho

Dựng món đó trong một cảnh có sẵn, mở ảnh ra nhìn, và trả lời:

- Nhìn một giây có nhận ra nó là gì không?
- Đủ năm thứ ở trên chưa?
- Đặt cạnh các món cũ có lệch tông, lệch độ chi tiết, hay chói hơn không?
- Phẳng hay khối đã đúng loại vật chưa; hình phẳng có quay đúng hướng không?
- Đứng ở ba cỡ (gần, vừa, xa) có còn đọc được không?

## Tắt bóng của một món (23/11/2026)

Cảnh dựng bằng `VSMShadowMap`. Với loại bản đồ bóng này three.js vẽ cả những vật `receiveShadow` vào bản đồ bóng, nên muốn một món không đổ bóng thì phải tắt CẢ `castShadow` lẫn `receiveShadow` của nó; chỉ `castShadow={false}` thì bóng vẫn còn. Ví dụ: cọc đèn trước cửa lều đổ một vệt bóng lạ lên vạt cửa buông khi nắng thấp; món `DoorPole` có tham số `shadow="none"` cho trường hợp đó. Món nào có thể đứng trước một mặt phẳng lớn dưới nắng thấp thì cho sẵn tham số tắt bóng. Với người: `Puppet3` có `noShadow` (tắt cả đổ lẫn nhận); `cast={false}` một mình vẫn để lại bóng trên vách.

## Nhận bóng, tấm vẽ dán, ron (24/11/2026, Daniel yêu cầu)

- Từ 24/11 `autoReceive` (skill 1, mục Bóng) tự bật nhận bóng cho mọi mesh đặc nhận sáng. Món nào cần tắt cả bóng thì tắt `castShadow` VÀ gắn `userData={{noRecv: true}}`; `receiveShadow={false}` trần không còn tác dụng. Helper có tham số tắt nhận bóng (`recv`, `receive`, `noShadow`) phải tự gắn `noRecv`.
- Vật đứng (tường, cột, đồ đạc, người) luôn `castShadow`.
- **Tấm vẽ dán lên khối giữ tỉ lệ px:m.** Một tấm canvas vẽ gạch, đá, ván dán lên mặt khối phải có cùng số điểm ảnh trên một mét với các tấm khác của bối cảnh. Các mặt kề nhau (tường và cột, hai đoạn tường) cùng cỡ viên đá, cỡ ván theo px trên mét: tính `repeat` theo kích thước thật của mặt, đừng kéo giãn một tấm cho vừa.
- **Ron mảnh có mép sáng tối:** ron giữa viên đá, khe ván không chỉ là một nét tối; mép trên hoặc phía đón sáng có một vệt sáng mảnh, mép kia một vệt tối, để mặt đọc thành khối nổi chứ không như hình in.
