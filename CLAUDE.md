# cutout3d: chỉ dẫn cho mọi phiên

File này tự nạp vào mọi phiên mở trong `cutout3d/` và còn nguyên sau mỗi lần tóm tắt. Nó là chỗ ghi DUY NHẤT của thứ tự các bước làm một tập và các chỗ phải chờ Daniel duyệt. Daniel không cần nhắc lại file này; bạn tự làm theo.

Dự án: hoạt hình cắt giấy 2,5D bằng code (Remotion + three.js). `chung/` là phần dùng chung (engine, luật, kho, công cụ); `kenh/<kênh>/` là nội dung của từng kênh. Bản đồ thư mục và bảng lệnh: `BAT-DAU-O-DAY.md`, mở khi cần. Trả lời Daniel bằng tiếng Việt.

## Bạn là ai trong phiên này

- **Agent được giao một việc** (qua workflow hoặc một phiếu): làm đúng phiếu, đọc đúng các mục skill phiếu nêu, không gọi agent con, không sửa skill hay file nào của phần chung (thấy cần đổi thì ghi vào báo cáo). Mục "Quy trình một tập" là việc của phiên chính, không phải của bạn.
- **Phiên chính** (đang nói chuyện với Daniel): bạn điều phối MỘT tập theo đúng các bước dưới đây, từ đầu tới cuối tập. Bạn không tự dựng cảnh trong phiên; dựng và diễn chạy qua workflow `dung-canh-3d`.

## Mở phiên, và sau mỗi lần phiên bị tóm tắt

1. Trong `chung/`, chạy `python3 tools/buoc.py` (kèm `KENH=<kênh> TAP=<tập>` khi không phải tập mặc định). Nó in tập đang ở bước nào và đang chờ Daniel duyệt gì. Chỉ làm tập Daniel giao cho phiên này.
2. Đọc `kenh/<kênh>/tap/<tập>/STATUS.md` (quyết định và ghi chú của tập) và `kenh/<kênh>/ghi-chu.md` (luật riêng của kênh). Không mở STATUS của tập khác.
3. Nói với Daniel một câu: tập đang ở bước nào, việc kế là gì. Rồi làm tiếp từ đó.

## Quy trình một tập

Làm đúng thứ tự. Ở bước có cổng: gửi Daniel thứ ghi ở cột "Cổng" rồi DỪNG; có lời duyệt mới sang bước sau. Bước 4–7 làm theo lô 5 chương, cả lô gửi một lần. Mọi lệnh chạy trong `chung/`.

| # | Bước | Làm gì, theo luật nào | Cổng: gửi Daniel rồi dừng |
|---|---|---|---|
| 1 | `du-kien` | Bảng dữ kiện có nguồn (`facts.md` của tập). Tải transcript vài video nhiều view cùng đề tài để học cách kể, không chép câu. | không |
| 2 | `kich-ban` | Workflow `video-script`; video dài làm dàn ý trước. Khung hình đầu phải cho thấy ngay nhân vật người xem tìm tới (skill 0, mục Cảnh mở đầu). | dàn ý (video dài), rồi lời đọc |
| 3 | `giong` | `python3 tools/thu_giong.py`. Tốn tiền. | hỏi TRƯỚC khi thu |
| 4 | `danh-sach` | Danh sách cảnh theo skill 0 (đọc cả file): mỗi bối cảnh có dòng mô tả và sơ đồ vị trí, mỗi cảnh ghi cỡ cảnh, kiểu máy, việc người làm. Tra kho trước khi đòi món mới. Phiếu ngoại hình nhân vật (skill 4, mục Người điều phối). | danh sách cảnh và phiếu ngoại hình |
| 5 | `boi-canh` | Workflow `dung-canh-3d`, nhóm `boi-canh`. Bối cảnh MỚI: chạy trước với `chi_khuon: true`, gửi Daniel khung khuôn và bảng đổi món; có lời duyệt thì chạy lại với `chon` (kết quả đã duyệt) và `duyet.bang_doi`. Đồ vật làm theo Thẻ làm một món (skill 2). | bảng đổi món của bối cảnh mới; từng món mới xin vào kho chung |
| 6 | `bang-phan-canh` | Workflow, nhóm `canh-quay`: người đứng ở mốc cho TỪNG cảnh, chưa diễn. Ghép PDF: `python3 tools/bang_phan_canh.py`. | bảng phân cảnh PDF của cả lô |
| 7 | `dien` | Workflow, nhóm `dien` (workflow đòi `duyet.bang_phan_canh`). Kiểm từng cảnh: `tools/kiem-canh.sh <comp…>`. Ghép chương, dựng cỡ 2 (2560×1440). | video chương của lô |
| 8 | `ghep` | Ghép cả tập (skill 4, cuối file). | video cả tập |
| 9 | `dang` | Bài đăng, ảnh bìa (skill `youtube-publish`). Không tự bấm đăng. | Daniel tự đăng |

Ghi lại mỗi lần đổi trạng thái một bước, kèm một dòng vào `STATUS.md` của tập:

```
python3 tools/buoc.py dat <bước> dang|cho-duyet|xong [--lo c1-5] [--duyet "<nguyên văn lời Daniel>"] ["ghi chú"]
```

Bước có cổng chỉ ghi `xong` được khi kèm `--duyet`. Công cụ không cho mở bước sau khi bước trước chưa xong; Daniel bảo bỏ qua một bước thì ghi `--bo-qua "<lời Daniel>"`. Workflow `dung-canh-3d` cũng từ chối chạy khi thiếu lời duyệt của bước trước (tham số `duyet`).

## Luật áp cho mọi bước

- **Thẻ luật cứng 15 điều** (`chung/skills/THE-LUAT-CUNG.md`): hook nạp mỗi phiên; không thấy thẻ trong ngữ cảnh thì đọc file. Mỗi điều ghi chỗ có cách làm.
- **Vai nào đọc mục skill nào:** bảng "Ai đọc gì" ở đầu `chung/skills/4-quy-trinh.md`. Không đọc cả năm skill.
- **Trước khi gửi Daniel ảnh hay video:** `python3 tools/kiem_bong.py` và `python3 tools/kiem_canh.py <file vừa sửa>` không có LOI; chấm 8 mục của `chung/skills/bang-cham/BANG-CHAM.md` cạnh ảnh ĐẠT; ảnh so sánh ghi nhãn TRƯỚC / SAU, cùng cảnh đặt cạnh nhau; video dựng cỡ 2.
- **Tiền và token:** hỏi Daniel trước khi chạy workflow hơn 7 agent, agent trên mức vừa, agent Opus, hoặc thu giọng. Agent mặc định Sonnet mức vừa; mỗi việc một agent mới.
- **PHẦN CHUNG BỊ KHOÁ (Daniel, 26/11/2026).** Engine (`chung/src/`), công cụ (`chung/tools/`, `chung/*.sh`), luật (`chung/skills/`, file này) và workflow: không phiên nào, không agent nào tự sửa. Lời duyệt cho danh sách lỗi của một tập ("sửa tất cả") KHÔNG phải lời duyệt sửa phần chung. Làm riêng được ở thư mục kênh thì làm ở kênh. Buộc phải sửa phần chung: làm bản thử ở NGOÀI phần chung, dựng CÙNG một khung hai lần (KHÔNG SỬA và CÓ SỬA), lập phiếu bằng `python3 tools/khoa_chung.py xin …`, gửi Daniel tấm so sánh cùng nội dung phiếu rồi DỪNG; Daniel duyệt đúng phiếu đó mới được sửa. Hook chặn lệnh sửa file đã niêm và soát lại sau mỗi lệnh; từng bước: `python3 tools/khoa_chung.py --help`. Một lời chê không tự thành luật hay con số mới: sửa trên đúng khung bị chê, gửi trước và sau.
- **Thứ Daniel đã duyệt thì không đổi;** luật mới chỉ áp cho chương sau.
- **Hai phiên hai kênh:** chạy lệnh kèm `KENH=<kênh> TAP=<tập>`, không sửa `chung/dang-lam.yaml`, không sửa file của kênh khác.
- **Phần chung là repo git** (gốc repo là `cutout3d/`; `kenh/` không nằm trong repo). Đổi code hay kho của `chung/` thì thêm một dòng vào `CHANGELOG.md` ở gốc repo (dưới ngày hôm đó: đổi gì, file chính, dựng lại thì hình có đổi không), rồi lưu: `python3 tools/khoa_chung.py luu "<đổi gì>" [món kho Daniel đã duyệt…]`. Lệnh đó commit và đẩy lên GitHub, chạy ngoài sandbox; nó từ chối file phần chung chưa có phiếu đóng. Lấy bản mới về (`git pull`) chỉ khi Daniel bảo.
