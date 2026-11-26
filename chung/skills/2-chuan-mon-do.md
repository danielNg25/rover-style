# Skill 2: chuẩn chi tiết cho một món đồ (cutout3d)

> Sửa luật trong skill này chỉ khi Daniel đã xác nhận đúng thay đổi đó (luật 25a); sửa xong thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Agent không sửa skill: thấy thiếu hay sai thì ghi vào báo cáo.
> Ai làm việc gì, file nào của ai, cổng kiểm nào phải qua: `skills/4-quy-trinh.md`.

## Thẻ làm một món (26/11/2026; chỗ ghi duy nhất của thẻ luật cứng 13 và 14)

Trước khi viết code hay gen BẤT CỨ món nào (cây, đá, bàn, đèn, lớp xa…), đi đủ bốn bước theo thứ tự. Bảng đổi món của workflow `dung-canh-3d` có sẵn hai cột `kho` và `loại` cho bước 1 và 2.

1. **Tra kho.** `python3 tools/kho.py tim <từ> [--nhom <nhóm>]` (kho chung `assets/`, kho của kênh `../kenh/<kênh>/kho/`), rồi mở ảnh món kho ra xem. Có món cùng loại và đúng kiểu thì GỌI LẠI, đổi màu, seed, cỡ cho hợp cảnh, và dừng ở đây. Chỉ làm mới khi kho chưa có, hoặc món kho sai kiểu so với khuôn; khi đó ghi lý do trên dòng khai báo: `kho:ok <vì sao>`. Một món chỉ viết MỘT lần; file khác import lại.
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

## Vẽ đồ bằng Codex (mặc định từ 25/11/2026)

Daniel: các phiên "không chủ động dùng codex nếu mình ko nhắc", mà "codex cho ra chất lượng tốt hơn nhiều". Thử cùng ngày trên cảnh khe suối: một lần gen 55 giây ra sáu món (tre, tuyết tùng, tán cây, tảng đá rêu, đèn đá, giàn bia) đẹp hơn hẳn các món agent vẽ bằng code (`kenh/_thu-mau/out/codex-so-code.jpg`). Từ nay KHÔNG chờ Daniel nhắc.

- Gen là BƯỚC 3 của Thẻ làm một món ở đầu file: tra kho và chọn loại trước. **`gen.sh` giữ điều này bằng code (Daniel 26/11/2026: "lúc gen ảnh codex nó ko check luật 2d 3d để gen").** File lời tả phải mở đầu bằng BẢNG MÓN, mỗi món một dòng: `#MON <số> | <tên món> | <loại> | kho: <tra bằng từ gì, ra gì>`; loại là `phang`, `khoi-dun`, `khoi-tien`, `khoi-rap` hoặc `tam-nen`. Món kho đã có thì không đưa vào tấm. Soát: `python3 tools/kiem_loi_ta.py gen/prompts/<tên>.txt`; thiếu bảng thì `gen.sh` không gọi Codex (mã thoát 4). Món là khối được dựng bằng cách đùn hoặc tiện viền ảnh rồi dán ảnh lên mặt trước, nên tranh của nó phải vẽ CHÍNH DIỆN, không phối cảnh: công cụ tự thêm câu đó vào lời tả theo cột loại. Lời tả đưa cho bất cứ ai gen (Codex, hay Daniel gen hộ) là kết quả của `python3 tools/kiem_loi_ta.py <file> --in`, không phải file gốc.
- **Món nào gen:** thứ cần nét vẽ tay: cây, bụi, hoa cỏ, đá, thác, con vật, đồ nhỏ nhiều chi tiết, đồ trang trí, sạp hàng, lớp xa (làng, tháp, núi), tranh treo tường. **Món nào vẫn vẽ bằng code:** khối xây dựng to và đơn giản (tường, sàn, mái, bậc), mặt đất, mặt nước, thứ phải chuyển động theo tham số (cờ bay, nước chảy, lửa), hiệu ứng, và nhân vật (bộ khuôn).
- **Mỗi lần gen một TẤM KÍN, nhiều món (Daniel 26/11/2026: "gen các hình nhỏ rất nhanh hết quota, ta có gom nhiều hình lại gen 1 lần").** Hạn mức của Codex tính theo SỐ LẦN gen, không theo số món, và mỗi lần gen ra một tấm cỡ cố định (khoảng 1672×941). Trên 23 tấm gen ngày 25–26/11 hình chỉ chiếm trung bình 23 % diện tích, phần còn lại là nền trống. Vì vậy:
  - Gom TẤT CẢ món cần gen của bối cảnh rồi chia tấm theo CỠ món: đồ nhỏ và đồ vừa (lọ, hộp, sách, đèn, bàn, ghế, thùng, bụi cây) 12–20 món một tấm; đồ lớn (cây to, vách đá, quầy hàng) 4–6 món; lớp xa 3–4 dải xếp chồng theo chiều dọc. Thường mỗi bối cảnh chỉ cần 1–2 tấm.
  - Lời tả phải đòi xếp sát: chia hàng theo cỡ món, các món lấp kín tấm, khe hở giữa hai món chỉ 2–3 % bề ngang, không món nào chạm nhau hay bị mép cắt. Mẫu lời tả: `gen/prompts/_mau-tam-kin.txt` (16 món, ba hàng, có bảng món; ba món của danh sách ban đầu bỏ ra vì kho đã có).
  - KHÔNG gen một tấm cho một hai món. Món thiếu, món hỏng thì dồn lại, gen chung một tấm sửa.
  - Cắt kèm số món: `python3 tools/cut.py … --mong=<số món>`. Lệch số là có món dính nhau hoặc bị bỏ sót; công cụ cũng in phần diện tích có hình, dưới 40 % là tấm thưa.
  - Mức 12–20 món đã thử ngày 26/11 (tấm 19 món `gen/e1-lo2-do-gop.png`, Daniel gen ở chỗ khác): đủ 19 món, không món nào chạm nhau hay bị mép cắt, hình chiếm 46 % tấm. Ảnh gen ở công cụ ngoài có thể mang vệt mờ hoặc dấu của công cụ đó (tấm thử có một vệt bị cắt thành "món" và một dấu làm dính hai món): luôn mở tấm overview ra xem, không tin riêng con số của `--mong`.
  - Nền hồng phẳng #FF00FF. Viết lời tả từng món vào `gen/prompts/<tên>.txt`, rồi nối `gen/prompts/style.txt` vào cuối (kiểu vẽ, nền hồng, không chữ).
- **Mẫu kiểu vẽ:** đưa khung khuôn của bối cảnh (hoặc một hai khung video gốc cùng loại) làm ảnh mẫu và viết "drawn in exactly the art style of the attached reference frame". Tả món bằng lời. KHÔNG bảo vẽ lại đúng khung hay đúng nhân vật trong khung, không đưa nhân vật nổi tiếng: công cụ từ chối (đã gặp 20–21/11).
- **Lệnh** (trong chung/, chạy NGOÀI sandbox, mỗi lần 1–3 phút): `./gen.sh <tên>.png gen/prompts/<tên>.txt skills/canh-mau/anh/<mã khuôn>.jpg` ra `gen/<tên>.png`; rồi `python3 tools/cut.py gen/<tên>.png public/<thư mục của bối cảnh> <tiền tố>` cắt thành từng PNG nền trong suốt kèm tấm `<tiền tố>-overview.jpg`. Mở tấm overview ra xem: món hỏng (cụt, dính nhau, sai kiểu) thì gen lại riêng món đó.
- **Codex hết hạn mức thì nhờ Daniel gen ở chỗ khác (Daniel 26/11/2026: "nếu codex hết quota chủ động nói session gửi prompt/ảnh tham chiếu để mình gen chỗ khác").** `gen.sh` báo `CODEX HẾT HẠN MỨC` (mã thoát 3) thì KHÔNG chờ tới giờ mở lại, KHÔNG vẽ thay bằng code, KHÔNG bỏ món. Ngay trong câu trả lời kế tiếp gửi Daniel, gom mọi tấm còn thiếu của bối cảnh vào MỘT tin: (1) lời tả ĐÃ SOÁT của từng tấm, dán trong khối code để copy: file `gen/<tên>.png.loi-ta.txt` do `gen.sh` ghi khi hết hạn mức, hoặc kết quả của `python3 tools/kiem_loi_ta.py <file> --in`; không gửi file gốc còn bảng món, không chuyển nguyên lời tả của agent khi chưa soát; (2) các ảnh mẫu kiểu vẽ đã đưa cho `gen.sh`, gửi thẳng bằng SendUserFile; (3) đường dẫn đầy đủ nơi lưu từng ảnh, `chung/gen/<tên>.png`, kèm nhắc một tấm ngang 16:9, nền hồng phẳng #FF00FF. Daniel lưu ảnh vào đúng chỗ thì cắt bằng `cut.py --mong=<số món>` như thường. Trong lúc chờ thì làm phần không cần các món đó. Agent trong workflow không nhắn được Daniel: điền `cho_gen` trong báo cáo rồi dừng bối cảnh, phiên chính gửi.
- **Đặt vào cảnh THEO LOẠI của món (mục "Phẳng hay khối" ở trên; sửa đêm 25/11, bản trước ghi `Pic2D` cho mọi món là sai):** thứ sống hoặc mềm (cây, bụi, hoa, con vật, đồ ăn) là hình phẳng: `<Pic2D src="<thư mục>/<tiền tố>-N.png" w={bề ngang ngoài đời} pos={[x, 0, z]} />` (`src/lib3/flat.tsx`); lớp xa là tấm nền. Thứ cứng (bàn ghế, tủ, thùng, hộp) là khối 3D ráp từ `B`; đá, cột, chum, bình là khối tiện `FacetLathe`: tranh Codex là bản thiết kế (dáng, số mảng, màu) và mặt vẽ của khối, KHÔNG dán nguyên tấm tranh thay cho món cứng. Màu vẫn phải khớp khuôn: đo trên ảnh dựng ra bằng `tools/do_mau_khuon.py`; lệch thì ghi màu cần có vào lời tả rồi gen lại, không tô đè bằng bộ lọc.
- **Đá và núi (chỗ ghi duy nhất; ảnh SAI và ĐÚNG: `bang-cham/nui-da.jpg`):** núi xa là tấm nền phẳng, MỖI LỚP MỘT SẮC, lớp chồng lớp, càng xa càng nhạt; muốn núi có khối thì thêm chỏm tuyết mép gãy, hoặc một mảng tối rộng bám theo sườn, hai sắc gần nhau; KHÔNG kẻ một sống thẳng từ đỉnh xuống rồi tô hai nửa hai màu. Tảng đá là MỘT khối bo (khối tiện hoặc khối 3D), 2–3 mảng lớn, mặt trên sáng, mặt bên tối, các sắc gần nhau; KHÔNG ghép đá từ nhiều mặt tam giác mỗi mặt một sắc. Lỗi là chia khối thành nhiều mặt tam giác, không phải là việc dựng khối. Dáng và mặt vẽ lấy từ tranh Codex. Lời tả cho đá: "a large rounded boulder, two or three big soft planes, lighter top, darker side, close tones, no low-poly triangle facets". Lời tả cho núi xa: "distant mountain range as flat single-tone silhouette layers, each layer one tone, paler with distance, optional jagged snow caps, no straight vertical ridge that splits a peak into a light half and a dark half". Nhận tấm về thì soi đúng hai điểm đó trước khi cắt.
- **Ngân sách:** mỗi bối cảnh tối đa 2 tấm kín và 1 tấm sửa (trước 26/11 là 6 tấm thưa và 2 lần gen lại). Cần hơn thì hỏi Daniel. Không gen lại vì lỗi nhỏ.
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
