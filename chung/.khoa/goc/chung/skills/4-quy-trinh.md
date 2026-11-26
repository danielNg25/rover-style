# Skill 4: quy trình làm một đoạn phim (cutout3d)

> Phần chung bị khoá (thẻ luật điều 15): sửa skill, engine hay công cụ phải có phiếu Daniel duyệt, lập bằng `python3 tools/khoa_chung.py xin …` (từng bước ở `CLAUDE.md`); luật của một kênh chỉ ghi ở `../kenh/<kênh>/ghi-chu.md`. Đổi code, kho thì thêm một dòng vào `NHAT-KY-THAY-DOI.md`. Agent không sửa skill: thấy thiếu hay sai thì ghi vào báo cáo.

Dùng khi làm một đoạn phim từ lời đọc tới video. Skill này nói AI làm việc gì, giao nhận cái gì, file nào của ai, và phải qua cổng nào trước khi báo xong. Cách làm của từng việc nằm ở skill 0 (đạo diễn), 1 (dựng cảnh), 2 (chuẩn món đồ và kho), 3 (nhân vật, diễn xuất, hiệu ứng, kiểm vật lý).

Mọi đường dẫn tính từ thư mục `cutout3d/chung/` (phần chung; đường cũ `rover-lab/` là liên kết tới đây). Phần riêng của kênh nằm ở `../kenh/<kênh>/` (kênh và tập đang làm ghi trong `dang-lam.yaml`); `out/` ở gốc chung là liên kết tới `../kenh/<kênh>/out/`. Sơ đồ chung/kênh: `../BAO-CAO-TACH.md`. Mỗi đoạn phim có một mã ngắn không dấu, gọi là `<ma>` (ví dụ `daihoc`, `tesla`). Khi hai phiên làm hai kênh cùng lúc: phiên không phải kênh mặc định chạy mọi lệnh kèm `KENH=<kênh> TAP=<tập>` và không sửa `dang-lam.yaml`; mỗi kênh có file vào riêng `../kenh/<kênh>/entry.ts` nên gói dựng của kênh này không chứa code của kênh kia (22/11/2026).

## Chuỗi công việc

> Thứ tự các bước của một tập và các chỗ chờ Daniel duyệt ghi ở MỘT chỗ: `CLAUDE.md` ở gốc cutout3d (tự nạp mỗi phiên; tập đang ở bước nào: `python3 tools/buoc.py`). Bảng dưới đây cho biết vai nào đọc gì, giao nhận gì. Cách chạy: hai mục cuối file, "Dựng qua workflow `dung-canh-3d`" và "Cách làm từ 23/11/2026". Cột "Đọc" là bảng **Ai đọc gì** duy nhất (26/11/2026): lời mở của workflow ghi đúng như bảng này.

| Bước | Vai | Đọc | Nhận | Giao |
|---|---|---|---|---|
| 0 | Đạo diễn | thẻ luật cứng, luật rút gọn; skill 0 (cả file); skill 3, mục "Bộ khuôn chưa có"; skill 1, mục Máy quay và chỗ đứng; mục lục kho `assets/DANH-MUC.md` | lời đọc `../kenh/<kênh>/tap/<tập>/<ma>-loi-doc.md` | danh sách cảnh quay `../kenh/<kênh>/tap/<tập>/<ma>-danh-sach-canh.md` |
| 1 | Dựng cảnh | thẻ luật cứng, luật rút gọn, bảng chấm; skill 2: Thẻ làm một món, Phẳng hay khối, Vẽ đồ bằng Codex; skill 1: Sân khấu ngang, Cảnh mẫu của cảnh, Máy quay và chỗ đứng, Hạt, Bóng; skill 3: Dàn người, Kiểm vật lý | danh sách cảnh quay | bối cảnh và các trạng thái của nó, ảnh tĩnh có người đứng ở mốc, ghi chú sân khấu, dàn nhân vật, món mới (xin Daniel duyệt trước khi vào kho chung) |
| 2 | Diễn xuất | thẻ luật cứng, luật rút gọn, bảng chấm; skill 3 (cả file); skill 1: Một bối cảnh, nhiều cảnh quay, Bóng; skill 0: Soát danh sách trước khi giao; Viết danh sách đúng với ống kính và bộ khuôn | danh sách cảnh quay, ghi chú sân khấu, bối cảnh | từng cảnh quay thành một composition, video kiểm, ảnh kiểm |
| 3 | Ghép | skill 4 | các composition | kiểm vật lý mọi cảnh, video 2K từng cảnh, bản ghép |

- Một vai là một agent ở mức suy nghĩ vừa. Bối cảnh nhiều thì mỗi bối cảnh một agent dựng cảnh; cảnh quay nhiều thì chia theo bối cảnh cho vài agent diễn xuất.
- Phông nền và đồ vật của một bối cảnh ở chung một agent. Người dựng cảnh đặt sẵn nhân vật đứng yên ở mốc; người diễn xuất không dời mốc, nếu buộc phải dời thì chạy lại kiểm vật lý và ghi lí do.
- **Chế độ thường:** dừng chờ Daniel ở các cổng ghi trong bảng của `CLAUDE.md` (lời đọc, danh sách cảnh, bảng đổi món của bối cảnh mới, bảng phân cảnh, video); mỗi lần đổi trạng thái một bước ghi bằng `python3 tools/buoc.py dat …`.
- **Chế độ thử không sửa tay** (chỉ khi Daniel bảo): không dừng chờ duyệt, người điều phối không sửa gì trong kết quả; chỗ nào hỏng thì ghi lại để sửa vào skill sau. Gọi workflow với `duyet: {che_do_thu: "<lời Daniel>"}`.

## File của ai

| Thứ | Ở đâu | Ai viết |
|---|---|---|
| Lời đọc | `../kenh/<kênh>/tap/<tập>/<ma>-loi-doc.md` | người điều phối hoặc khâu kịch bản |
| Danh sách cảnh quay | `../kenh/<kênh>/tap/<tập>/<ma>-danh-sach-canh.md` | đạo diễn |
| Dàn nhân vật của đoạn | `../kenh/<kênh>/cast/<ma>Cast.ts` | dựng cảnh (người đầu tiên cần tới nó) |
| Một bối cảnh | `src/demo/<TenBoiCanh>.tsx`, món riêng của nó trong `src/lib3/kit<TenBoiCanh>.tsx` | agent dựng bối cảnh đó |
| Các cảnh quay | `src/demo/<Ma>Shots.tsx` (hoặc `<Ma>Shots<TenBoiCanh>.tsx` khi chia nhiều agent): mỗi cảnh một component không tham số, một bảng `[{id: '<ma>-01', C, frames}]`, một component đăng kí composition | diễn xuất |
| Ghi chú sân khấu, báo cáo, ảnh và video | `out/<ma>/` | người làm ra chúng |
| Đăng kí composition | `src/Root.tsx`: thêm đúng một dòng import và một dòng gọi cho mỗi file | người viết file đó |

- Thư viện dùng chung (`src/lib3/depth.tsx`, `kit.tsx`, `room.tsx`, `look.tsx`, `shot.tsx`, `fx.tsx`) và bộ khuôn (`src/mould/`): agent chỉ được THÊM, không sửa và không xoá thứ đang có. Món dùng chung thêm bằng một file mới `src/lib3/kit<Tên>.tsx` (hoặc cuối `kit.tsx`), và thêm món nào vào kho chung cũng phải được Daniel duyệt (skill 2, Thẻ làm một món). Thiếu thứ gì ở bộ khuôn, ở hiệu ứng, ở `Shot` thì tìm cách khác trong file của mình và ghi rõ vào báo cáo là thiếu gì.
- Không sửa file của agent khác, không sửa skill, không sửa danh sách cảnh quay (trừ đạo diễn). Thấy danh sách hay skill sai thì làm theo cách hợp lí nhất và ghi vào báo cáo.
- **Chạy song song được** khi các agent làm trên các bối cảnh khác nhau (Daniel, 22/11/2026: chạy nối tiếp "lâu vậy"; một bối cảnh mới mất khoảng nửa tiếng). Bốn file dùng chung là `assets/catalog.json`, `src/catalog/Catalog.tsx`, `src/Root.tsx`, `NHAT-KY-THAY-DOI.md` (món của riêng một kênh thì ghi vào `../kenh/<kênh>/kho/catalog.json` và `Previews.tsx` của kênh đó, không đụng hai file kho chung): mỗi lần sửa một trong bốn file này phải đọc lại nó ngay trước khi sửa, chỉ thêm hoặc đổi đúng các dòng của mình bằng một lần sửa nhỏ, không ghi đè cả file. Sau đó kiểm lại dòng của mình còn đó; cổng kiểm kiểu và `tools/kho.py kiem` sẽ lộ ra nếu một dòng bị mất, khi ấy thêm lại.
- Việc phụ thuộc nhau thì vẫn nối tiếp: diễn xuất trên một bối cảnh chỉ bắt đầu khi bối cảnh đó đã có ghi chú sân khấu.

## Việc ai cũng phải làm

- **Làm một món:** theo skill 2, mục Thẻ làm một món (tra kho; chọn loại phẳng, khối, khối tiện, tấm nền; lấy nét từ Codex; vào kho, kho chung cần Daniel duyệt). Cổng: `python3 tools/kiem_kho.py <file>` xử lý hết dòng `tu-ve-lai`, `trung-mon`; `python3 tools/kho.py kiem`.
- **Ghi thay đổi, mỗi việc một chỗ:** thay đổi của phần chung (engine, công cụ, luật, kho chung) ghi một dòng vào `CHANGELOG.md` ở gốc repo, dưới ngày hôm đó (đổi gì; file chính; dựng lại thì hình có đổi không), rồi lưu lên repo bằng `python3 tools/khoa_chung.py luu "<đổi gì>"`. Mỗi bối cảnh, mỗi nhóm cảnh quay của kênh thêm một dòng vào `NHAT-KY-THAY-DOI.md` (đổi gì | code ở đâu | ghi ở skill hay kho nào).
- **Kiểm kiểu:** `npx tsc --noEmit -p . 2>&1 | grep -E "src/(lib3|demo|mould|episodes|catalog)"` phải im lặng.
- **Dựng hình:** một khung `./still.sh <comp> <khung>` (ra `out/<comp>-<khung>.png`); video kiểm `./render-video.sh <comp> 1` (720 dòng, ra `out/<comp>.mp4`); video gửi Daniel `./render-video.sh <comp> 2` (2560×1440). Chrome không khởi động được trong sandbox của Bash nên các lệnh này phải chạy ngoài sandbox. Nếu bị từ chối thì dừng và báo; không tìm đường khác để dựng.
- **Tự soi bằng mắt:** mở ảnh ra xem (đổi sang JPEG rồi đọc), đi hết danh sách tự soi của skill mình dùng, sửa điều thấy được. Không ai xem được video chạy; phải nói rõ điều đó trong báo cáo.
- **Kiểm bóng** (24/11/2026) trước khi gửi bất kỳ ảnh nào: `python3 tools/kiem_bong.py <file vừa sửa…>` không được có dòng LOI; rồi phóng to một vùng có bóng (chân tường, gầm bàn, mép mái) xem bóng rơi đúng, không sọc, không hở. Luật bóng: skill 1, mục Bóng.
- **Chấm bảng chấm** (24/11/2026) trước khi gửi bất kỳ ảnh hay video nào: `python3 tools/kiem_canh.py <file vừa sửa…>` không có LOI; đặt ảnh cạnh ảnh ĐẠT của 8 mục trong `skills/bang-cham/BANG-CHAM.md` (ảnh ĐẠT cắt từ video gốc), chấm từng mục; bối cảnh mới hoặc vừa sửa làm thêm phép tấm lạc loài với bộ cảnh mẫu (skill 1, mục Cảnh mẫu của cảnh). Một mục HỎNG thì dựng lại, không gửi.
- **Kiểm vật lý** cho mọi ảnh tĩnh và mọi cảnh quay có người (skill 3, mục Kiểm vật lý): không được có khung tím; cảnh báo xanh dương phải mở ảnh ra xem và giải thích.
- **Ngân sách dựng hình** cho một agent (bảng duy nhất; luật rút gọn 24 trỏ về đây): khoảng 16 khung lẻ, 5 lượt kiểm vật lý, và video kiểm thì tính theo vai: dựng cảnh 6 video; diễn xuất một video kiểm 720 cho MỖI cảnh được giao (tấm 9 khung cắt từ đó) cộng thêm tối đa một nửa số cảnh cho các lượt dựng lại sau khi sửa; bối cảnh lớn dựng mới hoàn toàn được tới khoảng 24 khung lẻ. Một tấm kiểm nhiều khung trong một lần dựng tính là một. Trong workflow: mỗi nhóm một vòng sửa. Codex: mỗi bối cảnh tối đa 2 tấm kín (12–20 món nhỏ và vừa một tấm) và 1 tấm sửa; không gen một tấm cho một hai món (skill 2, mục Vẽ đồ bằng Codex). Hết ngân sách thì dừng và báo.
- **Ảnh tạm của mỗi agent** để trong thư mục con riêng `out/<ma>/tam-<vai>/`, không để chung thư mục tạm của phiên (dễ ghi đè nhau).
- **Tư liệu phim mẫu:** chỉ mở thư viện cảnh mẫu `skills/canh-mau/` và ảnh trong `skills/bang-cham/` (khung của video gốc đã chọn sẵn). KHÔNG mở `shorts-claude/ref/`, `out/deep/`, `out/motion/ref-*`, thư mục `research*`, và thư mục tài liệu cũ `chung/_tai-lieu-cu/` (các file `BAO-CAO-*`, `DANH-MUC-HINH-*`, `STYLE-BIBLE`, `RUBRIC`, `KIT`, `LUAT-*`… viết trước 22/11/2026: không còn là luật).
- **Làm một mình:** không gọi agent con, không dùng mạng. Tạo ảnh chỉ bằng Codex qua `./gen.sh` theo skill 2 (thẻ luật cứng 13), trong ngân sách ở trên.
- **Báo cáo viết ra file** `out/<ma>/bao-cao-<vai>[-<bối cảnh>].md` (tin nhắn có thể bị cắt), rồi nhắn một câu là đã viết. Báo cáo gồm:
  1. Đã làm gì: từng bối cảnh hoặc từng cảnh quay, kèm chỗ không làm được như danh sách ghi.
  2. Tự soi bắt được gì, đã sửa gì; kết quả kiểm vật lý và kiểm kho.
  3. Món, tham số, hàm mới và cách gọi.
  4. Danh sách cảnh quay, ghi chú sân khấu hay skill chỗ nào thiếu, mơ hồ hoặc sai cho việc này. Nói cụ thể; đây là phần quan trọng nhất.
  5. Chỗ còn yếu. Kết quả yếu mà báo là yếu thì có ích; yếu mà báo là tốt thì không.

## Riêng từng vai

- **Đạo diễn:** viết danh sách theo mẫu của skill 0, kể cả sơ đồ vị trí của từng bối cảnh và phần "khâu thực hiện chưa làm được". Trước khi giao, tự soát theo hai mục của skill 0: Tự soát danh sách; Soát danh sách trước khi giao: trục, khung, nhịp. Ghi rõ món nào lấy từ kho (theo id) và món nào phải làm mới. Số bối cảnh phải vừa sức: một đoạn 20 tới 30 giây nên có hai tới bốn bối cảnh.
- **Dựng cảnh:** làm theo thứ tự của skill 1; viết ghi chú sân khấu theo mẫu của skill 1, kèm mỗi mốc đứng là vật gần nhất ở từng phía và cách bao xa, và máy quay được lùi, trượt tối đa bao nhiêu. Ảnh tĩnh cuối cùng chép vào `out/<ma>/`.
- **Diễn xuất:** mỗi cảnh soi ít nhất khung đầu, khung giữa, khung cuối; giữ cho mỗi cảnh một TẤM ảnh kiểm 9 khung trải đều, cắt từ video kiểm 720 (không tốn lượt dựng), trong `out/<ma>/`. Hiệu ứng mới viết ra thì báo người điều phối để đưa vào `src/lib3/fx.tsx` và kho; đừng để nằm trong file cảnh. Cảnh hiệu ứng lớn làm theo mục Cảnh phô diễn hiệu ứng của skill 0.
- **Ghép:** chạy kiểm vật lý cho mọi composition của đoạn; chương có chuyển cảnh (từ 25/11/2026) ghép bằng `NoiCanh` thành một composition chương (cách làm ở dưới, mục Ghép chương), chương chỉ cắt thẳng thì dựng 2K từng cảnh rồi ghép bằng ffmpeg theo thứ tự cảnh; cắt một tấm khoảng 18 khung trải đều để soi; file nặng hơn 30 MB thì nén lại (`-crf 23`) trước khi gửi.

## Người điều phối

- **Phiếu ngoại hình nhân vật** `../kenh/<kênh>/cast/<ma>-nhan-vat.md`: với nhân vật có thật hoặc đã có hình ở nơi khác (người lịch sử, nhân vật truyện tranh, phim), người điều phối tra hình thật hoặc hình gốc và viết phiếu TRƯỚC khi giao đạo diễn: dáng mặt (hàm tròn, hàm vuông, mặt dài, cằm nhọn), tóc, râu, dáng người, bộ đồ quen thuộc, kèm nguồn. Agent không dùng mạng nên không tự tra được.
- **Món dùng chung giữa các bối cảnh** (bản đồ, đường sóng, một hiệu ứng): giao cho MỘT người ngay từ đầu và báo tên món cho những người sẽ dùng. Ở phép thử Tesla không ai được giao, hai agent mỗi bên làm một cái, phải gỡ bớt một.
- **Bối cảnh dùng lại không có agent dựng cảnh:** phần phải thêm vào nó (đồ hoạ, đồ che) giao cho agent diễn xuất của bối cảnh đó, ghi rõ trong lời giao việc.
- **Đổi một bối cảnh sau khi đã giao:** người đổi báo người điều phối; người điều phối báo ngay cho ai đang dùng; ghi chú sân khấu, ảnh tĩnh và báo cáo phải được sửa cùng lúc.

- Viết hoặc nhận lời đọc; giao từng vai một lời nhắn NGẮN: vai, mã đoạn, file nhận vào, và "đọc `skills/4-quy-trinh.md` rồi làm đúng vai của mình". Mọi hướng dẫn khác phải nằm trong skill; nếu thấy cần dặn thêm điều gì thì đó là chỗ skill còn thiếu, ghi lại và bổ sung vào skill.
- Soi cả khung sau mỗi vai (chế độ thường), ghi bài học của agent vào skill và nhật ký.
- Hỏi Daniel trước khi chạy hơn 7 agent cho một đoạn hoặc dùng agent trên mức vừa.
- **Trước khi giao phiếu (Daniel, 24/11/2026):** đối chiếu mọi con số trong phiếu với skill. Phiếu không được đè lên luật chung. Muốn lệch thì nêu số của skill, số định dùng, lý do, và hỏi Daniel trước (luật 25a).

## Cổng độ sáng (23/11/2026)

Trước khi gửi chủ kênh: ảnh tĩnh của bối cảnh qua `python3 tools/do_sang.py <ảnh…>` (không ảnh nào dưới Y 70); video của một chương hoặc một đoạn qua `python3 tools/do_sang.py <video>` (số khung dưới 70 không quá 12 %, quãng liên tục dưới 60 không quá 8 giây; không còn đòi mức trung bình: trên ngưỡng sàn, độ sáng theo khung khuôn của bối cảnh). Chữ `TỐI` thì sửa trước khi gửi: đạo diễn đổi giờ hoặc nơi của cảnh (skill 0, mục Độ sáng), dựng cảnh nâng ánh sáng của bối cảnh (skill 1, mục Độ sáng của bối cảnh). Ghi số đo vào báo cáo.

## Đánh số lại cảnh khi nhiều agent cùng sửa (23/11/2026)

Hai composition trùng tên làm hỏng MỌI lượt dựng của cả dự án, kể cả của chương khác (lỗi "Multiple composition with id …"). Chuyện xảy ra khi chương 5 dựng lại với số cảnh mới và hai agent cùng đổi bảng đăng ký của hai file. Trước khi giao một lượt dựng lại có đổi số cảnh, người điều phối tự gỡ hết tên cũ khỏi bảng đăng ký của các file liên quan, rồi mới giao; agent chỉ đăng ký cảnh đã viết xong và chạy `npx tsc --noEmit -p .` cùng một lượt `./still.sh` thử sau mỗi lần đổi bảng đăng ký. Lượt ghép của người điều phối nên tự thử lại khi gặp lỗi này thay vì bỏ cuộc.

## Dựng qua workflow `dung-canh-3d` (Daniel, 24/11/2026)

Daniel: các phiên "dùng sai workflow không dùng subagent mà lại dựng lần lượt cảnh trong session luôn". Từ nay mọi lượt dựng bối cảnh, cảnh quay, diễn chạy `Workflow({scriptPath: "<cutout3d>/.claude/workflows/dung-canh-3d.js", args: {kenh, tap, ma, danh_sach, nhom: [{ten, viec: 'boi-canh'|'canh-quay'|'dien', canh: [...], ghi_chu}], mau: [ảnh đã duyệt], duyet: {danh_sach, bang_doi, bang_phan_canh}, chon}})`. `duyet` là nguyên văn lời Daniel duyệt ở từng cổng (26/11/2026): thiếu `danh_sach` thì workflow không chạy; nhóm `boi-canh` cần `bang_doi` (trừ lượt `chi_khuon: true` để lấy bảng đổi món gửi Daniel); nhóm `dien` cần `bang_phan_canh`. `chon` là kết quả của lượt `chi_khuon` mà Daniel đã duyệt: truyền lại để lượt dựng dùng đúng khung khuôn đó, không chọn lại. Nhóm `boi-canh` dựng mới mà không có trong `chon` thì workflow không chạy; lượt sửa một bối cảnh đã duyệt ghi `sua_cu: true` ở nhóm đó. Từ 25/11/2026 workflow mở đầu bằng một agent CHỌN CẢNH MẪU: đọc mô tả từng nhóm trong danh sách cảnh, chọn 8–12 khung của video gốc từ `skills/canh-mau/` cho người dựng nhìn theo. Rồi mỗi nhóm (tối đa 3): một agent dựng, một agent rà khác người dựng đoán mù tấm lạc loài và chấm bảng chấm 8 mục, HỎNG thì một agent mới sửa một vòng (có lọc: không đổi nhân vật, cỡ cảnh, chỗ đứng; không thêm thứ ngoài mô tả). Hai nhóm là 7 agent; ba nhóm là 10 agent, phải hỏi Daniel trước khi chạy. Sonnet mức vừa. Phiên chính chỉ chia nhóm, đọc kết quả, soi ảnh, gửi Daniel. Workflow `dung-tap` là của kiểu hình truyện tranh, webtoon, không dùng ở đây.

## Cách làm từ 23/11/2026: đi nhanh hơn, tốn ít token hơn (Daniel đã đồng ý; chỗ nào ở trên trái thì theo mục này)

Daniel: "ta đi khá chậm, nhưng mà token đang tốn rất nhanh". Đo bằng `tools/do_token.py`: trong 30 giờ các agent dùng khoảng 1.154 triệu token, gần hết là đọc lại ngữ cảnh (trung bình 370 nghìn mỗi lượt gọi), vì người điều phối gọi lại agent cũ và giữ một phiên chính nhiều ngày; chương 3, 4, 5 đều phải làm bản 2 vì lỗi dàn cảnh chỉ lộ ra khi video đã diễn xong.

1. **Cổng bảng phân cảnh trước khi diễn.** Đạo diễn viết danh sách cảnh; người dựng cảnh đặt người đứng ở mốc cho TỪNG cảnh (một ảnh tĩnh ở nhịp chính, không diễn); ghép thành một tấm cho cả chương `out/<mã>/bang-phan-canh.jpg` (mỗi ô: số cảnh, lời đọc, một dòng việc chính). Người điều phối soi theo `LUAT-RUT-GON.md` rồi gửi Daniel. Gửi Daniel bản PDF `out/<mã>/bang-phan-canh.pdf` (mỗi trang 4 cảnh, `tools/bang_phan_canh.py` tự tạo), không gửi tấm jpg ghép vì ảnh quá nhỏ (Daniel, 23/11/2026). Daniel duyệt xong mới giao diễn.
2. **Agent mới cho mỗi việc.** Không gọi lại (SendMessage) một agent đã xong một việc lớn; mở agent mới với phiếu giao ngắn trỏ tới `skills/LUAT-RUT-GON.md`, ghi chú sân khấu và danh sách cảnh. Chỉ nhắn lại agent cũ để sửa ngay chính việc nó vừa làm, nhiều nhất hai vòng.
3. **Mỗi phiên chính làm trọn một tập** (Daniel, 23/11/2026: "mỗi session sẽ làm 1 tập"; đừng dừng giữa tập để bảo mở phiên mới). Phiên mới của một tập: làm theo `CLAUDE.md` (tự nạp): chạy `python3 tools/buoc.py`, đọc `STATUS.md` của tập. Phiên chính chạy Opus; agent mặc định Sonnet mức vừa, muốn cho agent dùng model mạnh hơn thì hỏi Daniel trước.
4. **Một lệnh kiểm cho mỗi cảnh** (tấm 9 khung, vật lý, độ sáng trong một lần chạy). Đã có (23/11/2026): `tools/kiem-canh.sh <comp…>`, chạy ngoài sandbox, kết quả ở `out/kiem-canh/`.
5. **Làm theo lô 5 chương** (Daniel, 23/11/2026, sau lô 3 chương đầu): bảng phân cảnh của cả lô gửi Daniel một lần; diễn cả lô rồi gửi một lần.
6. **Đo:** cuối mỗi đợt chạy `python3 -I tools/do_token.py <thư mục phiên>`; trung bình mỗi lượt trên 150 nghìn thì đang làm sai điều 2 hoặc 3.
Ghép chương: `tools/ghep-chuong.sh <mã> <giây bắt đầu> <số giây> <file ra> "<các cảnh theo thứ tự>" [cảnh cần dựng lại…]` (tự thử lại khi dự án đang bị sửa dở; đường dẫn giọng đang gắn với kênh phim-tv, tập doom-1); `tools/render-thu-lai.sh <mã> <cảnh…>` chỉ dựng.
Ghép chương có chuyển cảnh (từ 25/11/2026): viết một composition chương gồm `<NoiCanh canh={[{C, dai, vao?, may?, chuyen?, noi?}, …]} />` (`chung/src/lib3/chuyenCanh.tsx`) và `<Audio>` giọng của chương. `C` lấy bằng `layCanh(<Bảng đăng ký cảnh>, '<id cảnh>')`; `dai` là số khung của cảnh trong chương (tổng các `dai` bằng độ dài chương, khớp lời); `chuyen` đặt ở cảnh SAU chỗ cắt, vd `{kieu: 'lao-cua', cua: [x, y, rộng, cao]}`, kèm `vi: '<lý do trong truyện>'`; mỗi file ghép một chương (kiem_canh đếm theo file); `noi: 'dong-tac'` cho chỗ cắt nối động tác. Cảnh dựng sẵn không nhận kiểu máy thì `may={{huong, quang}}` (MayPhu) để chuỗi cảnh cùng nơi giữ một hướng. Mẫu: `kenh/phim-tv/tap/doom-1/ThuChuyenCanh.tsx`, `ThuChuyenCanhMay.tsx` (video `tat-ca-chuyen-canh-2d`, `tat-ca-chuyen-canh-may`, `thu-cm-<kiểu>`).

