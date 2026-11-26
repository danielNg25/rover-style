export const meta = {
  name: 'dung-canh-3d',
  description: 'cutout3d: 1 agent chọn bộ cảnh mẫu của video gốc cho từng nhóm, rồi dựng song song các nhóm cảnh (bối cảnh, cảnh quay, diễn): mỗi nhóm 1 agent dựng + 1 agent rà (đoán mù tấm lạc loài, chấm bảng chấm 8 mục), HỎNG thì sửa 1 vòng',
  whenToUse: 'Mọi lượt dựng bối cảnh, cảnh quay hoặc diễn của dự án cutout3d (hoạt hình cắt giấy three.js). Phiên chính không tự dựng. Tối đa 3 nhóm. Hai nhóm là tối đa 7 agent; ba nhóm là tối đa 10 agent: hỏi Daniel trước khi chạy.',
  phases: [
    { title: 'Chọn mẫu', detail: 'một agent đọc mô tả từng nhóm trong danh sách cảnh, chọn 8–12 khung của video gốc và vài tấm cắt cận' },
    { title: 'Dựng', detail: 'mỗi nhóm một agent dựng theo thẻ luật cứng + skill của vai, nhìn bộ cảnh mẫu được giao' },
    { title: 'Rà', detail: 'agent khác đoán mù tấm lạc loài, chấm bảng chấm 8 mục bằng hình, chạy kiem_bong, kiem_canh, kiểm vật lý' },
    { title: 'Sửa', detail: 'nhóm HỎNG: một agent mới sửa đúng các điểm hỏng (có lọc) rồi tự chấm lại' },
  ],
}
// args: {
//   kenh: 'phim-tv', tap: '<tập>', ma: '<mã đoạn>'                bắt buộc
//   danh_sach: đường dẫn danh sách cảnh (tính từ cutout3d/)          bắt buộc; mỗi bối cảnh có dòng mô tả (nơi chốn, văn hoá, thời đại, giờ, đồ vật, không khí)
//   nhom: [{ ten: 'lang-chang-vang', viec: 'boi-canh' | 'canh-quay' | 'dien', canh: ['xx-01', …], ghi_chu?: 'đường dẫn ghi chú sân khấu hoặc lời dặn ngắn' }]   tối đa 3
//   mau?: ['đường dẫn ảnh đã duyệt để so', …]                     ảnh cảnh của dự án mà Daniel đã duyệt (nếu có)
//   sua?: true                                                        mặc định true: nhóm HỎNG được một vòng sửa
//   model?: 'opus'                                                    mặc định sonnet; 'opus' chỉ khi Daniel yêu cầu
//   goc: '/đường/dẫn/tới/cutout3d'                                  bắt buộc: đường dẫn tuyệt đối của thư mục cutout3d trên máy đang chạy (trong chung/: cd .. && pwd)
//   chi_khuon?: true                                                  chỉ chạy bước chọn mẫu rồi dừng: trả về khung khuôn, bảng đổi món, màu theo vai để gửi Daniel duyệt trước khi dựng
//   duyet: { danh_sach: '…', bang_doi?: '…', bang_phan_canh?: '…' }   bắt buộc (26/11/2026): NGUYÊN VĂN lời Daniel duyệt ở từng cổng của quy trình (CLAUDE.md), kèm ngày.
//                                                                     danh_sach: luôn cần; bang_doi: cần khi có nhóm 'boi-canh' và không phải lượt chi_khuon; bang_phan_canh: cần khi có nhóm 'dien'.
//                                                                     Daniel bảo chạy thử không dừng duyệt: duyet: { che_do_thu: '<lời Daniel>' }
//   chon?: <trường chon của lượt chi_khuon đã được Daniel duyệt>      lượt dựng dùng đúng bộ cảnh mẫu và khung khuôn đó, không chọn lại; nhóm 'boi-canh' dựng MỚI bắt buộc phải có trong chon
//   nhom[].sua_cu?: true                                              nhóm 'boi-canh' này là lượt SỬA một bối cảnh đã dựng và đã duyệt: không cần chon
// }
// Nhóm 'boi-canh' và 'canh-quay' được giao một bộ cảnh mẫu của video gốc (thư viện chung/skills/canh-mau/); nhóm 'dien' thì không.
// Từ 25/11/2026 (Daniel xác nhận lỗi màu chói ở cảnh thử khe suối): nhóm 'boi-canh' còn được giao MỘT KHUNG KHUÔN làm bản thiết kế (bố cục, số món từng lớp, màu theo vai),
// kèm bảng đổi từng món sang thế giới của tập; người dựng làm ĐỒ trước rồi mới ghép cảnh; màu đo trên ảnh dựng ra bằng tools/do_mau_khuon.py.
const A = args || {}
if (!A.kenh || !A.tap || !A.ma || !A.danh_sach || !A.nhom || !A.nhom.length) throw new Error('thiếu args: kenh, tap, ma, danh_sach, nhom')
// ---------- Cổng duyệt (26/11/2026): workflow không chạy khi bước trước của quy trình chưa có lời duyệt của Daniel ----------
const D = A.duyet || {}
const coViec = (v) => A.nhom.some((n) => n.viec === v)
const thieu = []
if (!D.che_do_thu) {
  if (!D.danh_sach) thieu.push('duyet.danh_sach: Daniel đã duyệt danh sách cảnh của lô này chưa (bước 4)? Chưa thì gửi danh sách cảnh và phiếu ngoại hình, DỪNG chờ duyệt.')
  if (coViec('boi-canh') && !A.chi_khuon && !D.bang_doi) thieu.push("duyet.bang_doi: nhóm 'boi-canh' cần lời Daniel duyệt khung khuôn và bảng đổi món (bước 5). Chưa có thì chạy trước với chi_khuon: true, gửi Daniel kết quả, DỪNG chờ duyệt; rồi chạy lại với chon = kết quả đã duyệt. Sửa một bối cảnh Daniel đã duyệt thì ghi lời duyệt bối cảnh đó.")
  if (coViec('dien') && !D.bang_phan_canh) thieu.push("duyet.bang_phan_canh: nhóm 'dien' cần lời Daniel duyệt bảng phân cảnh của lô (bước 6). Chưa có thì chạy nhóm 'canh-quay', ghép PDF bằng tools/bang_phan_canh.py, gửi Daniel, DỪNG chờ duyệt.")
}
if (thieu.length) throw new Error('CHƯA ĐƯỢC CHẠY, thiếu lời duyệt của Daniel (quy trình: CLAUDE.md ở gốc cutout3d; xem tập đang ở bước nào: python3 tools/buoc.py):\n- ' + thieu.join('\n- ') + '\nTruyền args.duyet = { … } với NGUYÊN VĂN lời Daniel và ngày. Không tự viết lời duyệt.')
const TIEP = A.chi_khuon ? "VIỆC KẾ: gửi Daniel khung khuôn và bảng đổi món của từng bối cảnh mới (trường chon), rồi DỪNG. Có lời duyệt mới chạy lại với args.chon = kết quả này (sửa theo lời Daniel nếu ông đổi món) và args.duyet.bang_doi = nguyên văn lời duyệt. Ghi: python3 tools/buoc.py dat boi-canh cho-duyet."
  : coViec('dien') ? 'VIỆC KẾ: soi ảnh từng nhóm, chạy tools/kiem-canh.sh, ghép chương và dựng cỡ 2 (2560×1440), gửi Daniel rồi DỪNG chờ duyệt. Ghi: python3 tools/buoc.py dat dien cho-duyet.'
  : coViec('canh-quay') ? "VIỆC KẾ: ghép bảng phân cảnh PDF (python3 tools/bang_phan_canh.py), soi theo bảng chấm, gửi Daniel rồi DỪNG. Chưa có lời duyệt bảng phân cảnh thì KHÔNG chạy nhóm 'dien'. Ghi: python3 tools/buoc.py dat bang-phan-canh cho-duyet."
  : "VIỆC KẾ: soi ảnh bối cảnh cạnh khung khuôn; món mới xin vào kho chung thì gửi Daniel ảnh từng món và chờ duyệt. Sau đó chạy nhóm 'canh-quay' để làm bảng phân cảnh."
// args.goc (bắt buộc từ 26/11/2026): workflow không tự biết dự án nằm ở đâu và không ghi sẵn đường dẫn của máy nào; phiên chính truyền vào.
if (typeof A.goc !== 'string' || !/^(\/|[A-Za-z]:[\\/])/.test(A.goc)) throw new Error('CHƯA ĐƯỢC CHẠY, thiếu args.goc: truyền đường dẫn TUYỆT ĐỐI của thư mục cutout3d trên máy đang chạy (thư mục chứa CLAUDE.md của dự án; đang đứng trong chung/ thì là kết quả của lệnh: cd .. && pwd). Chưa agent nào chạy; thêm goc rồi gọi lại.')
const ROOT = A.goc.replace(/[\\/]+$/, '')
const NHOM = A.nhom.slice(0, 3)
if (A.nhom.length > 3) log(`chỉ chạy 3 nhóm đầu; bỏ: ${A.nhom.slice(3).map((n) => n.ten).join(', ')}`)
const SUA = A.sua !== false
const OPT = { model: A.model === 'opus' ? 'opus' : 'sonnet', effort: 'medium' }   // args.model: 'opus' chỉ khi Daniel yêu cầu (mặc định sonnet)
const TV = `${ROOT}/chung/skills/canh-mau`
const VAI = { 'boi-canh': 'Dựng cảnh (skill 1, 2)', 'canh-quay': 'Dựng cảnh quay: người đứng ở mốc, góc máy, kiểu máy (skill 1, mục Một bối cảnh nhiều cảnh quay)', 'dien': 'Diễn xuất (skill 3)' }
const DOC = {
  'boi-canh': 'chung/skills/2-chuan-mon-do.md: mục Thẻ làm một món, Phẳng hay khối, Vẽ đồ bằng Codex; chung/skills/1-dung-canh.md: mục Sân khấu ngang, Cảnh mẫu của cảnh, Máy quay và chỗ đứng, Hạt, Bóng; chung/skills/3-nhan-vat-dien-xuat.md: mục Dàn người, Kiểm vật lý',
  'canh-quay': 'chung/skills/1-dung-canh.md: mục Sân khấu ngang, Máy quay và chỗ đứng, Một bối cảnh nhiều cảnh quay, Bóng; chung/skills/3-nhan-vat-dien-xuat.md: mục Dàn người, Hướng nhìn, Kiểm vật lý',
  'dien': 'chung/skills/3-nhan-vat-dien-xuat.md (cả file); chung/skills/1-dung-canh.md: mục Một bối cảnh nhiều cảnh quay, Bóng',
}
const docVai = (n) => `ĐỌC THÊM, BẮT BUỘC cho vai này (chỉ các mục nêu tên): ${DOC[n.viec] || DOC['boi-canh']}.`
const CAN_MAU = (n) => n.viec === 'boi-canh' || n.viec === 'canh-quay'
const OUTD = A.ra || `out/${A.ma}`   // args.ra: thư mục tuyệt đối cho ảnh tạm và báo cáo (chung/out là liên kết sang kenh/phim-tv/out)
const TAM = (n) => `${OUTD}/tam-${n.ten}`
const ABS = (p) => (p.startsWith('/') ? p : `${ROOT}/chung/${p}`)
const CHUNG = `Dự án: ${ROOT} (phần chung ở chung/, kênh ở kenh/${A.kenh}/, tập kenh/${A.kenh}/tap/${A.tap}/). Mọi lệnh dựng chạy trong chung/ kèm KENH=${A.kenh} TAP=${A.tap}; Chrome phải chạy NGOÀI sandbox (dangerouslyDisableSandbox cho lệnh still.sh, render-video.sh, kiem-canh.sh). Không sửa dang-lam.yaml, không mở ref/, không gọi tools/thu_giong.py, không commit, không gọi agent con, không sửa skill và không sửa file nào của phần chung (chung/src, chung/tools, chung/skills bị khoá, hook sẽ chặn; thấy thiếu hay cần đổi thì ghi vào báo cáo). Các nhóm chạy song song: file dùng chung của tập (file đăng ký composition, entry, file ghép chương) chỉ thêm hoặc sửa đúng dòng của mình bằng Edit, không ghi đè cả file; ảnh tạm chỉ để trong thư mục tạm của nhóm mình.
ĐỌC TRƯỚC, theo thứ tự: chung/skills/THE-LUAT-CUNG.md; chung/skills/LUAT-RUT-GON.md; chung/skills/bang-cham/BANG-CHAM.md và mở các ảnh muc-*.jpg, giai-phau-canh.jpg trong đó (đây là chuẩn ĐẠT/HỎNG bằng hình, khung ĐẠT cắt từ video gốc); chung/skills/4-quy-trinh.md (phần của vai mình).${A.mau && A.mau.length ? `\nẢnh cảnh của dự án đã được duyệt để so: ${A.mau.join(', ')}` : ''}
Danh sách cảnh: ${A.danh_sach}.`
const VAI_MAU = 'Cảnh mẫu dạy CÁCH VẼ: đồ vật kỹ tới đâu, bề mặt lớn phẳng tới đâu, đồ gom thế nào, người to cỡ nào ở cỡ cảnh đó, bộ màu, bóng, hạt. VẼ CÁI GÌ thì theo danh sách cảnh (và cảnh gốc, khi sửa một cảnh có sẵn): nơi chốn, văn hoá, thời đại, đồ vật, không khí (nắng, bụi trong nắng, lớp xa). Không chép nhà cửa, đồ vật của cảnh mẫu vào cảnh mình: món nào cũng phải ĐỔI sang thế giới của tập (bảng đổi món). Riêng KHUNG KHUÔN thì lấy nguyên BỐ CỤC (số lớp, vị trí, cỡ tương đối, số món mỗi lớp, hướng sáng) và lấy MÀU THEO VAI (lá, đất hoặc sàn, trời, nước, tường): agent tự chọn màu thì ra chói. Không thêm thứ danh sách cảnh và bảng đổi món không có chỉ để cho giống hay cho đủ một con số; không bỏ món để đạt số màu. KHÔNG ĐỔI thứ đã duyệt: màu áo, kiểu vẽ, hình dáng nhân vật giữ theo dàn của kênh; cỡ cảnh, góc máy, chỗ đứng, diễn xuất giữ theo danh sách cảnh (cảnh mẫu không phải lý do để lùi máy hay tô lại áo).'

const S_CHON = { type: 'object', required: ['nhom'], properties: { nhom: { type: 'array', items: { type: 'object', required: ['ten', 'mo_ta', 'khung', 'cat_can', 'tam_ghep'], properties: {
  ten: { type: 'string', description: 'tên nhóm, đúng như được giao' },
  mo_ta: { type: 'string', description: 'một hai câu rút từ danh sách cảnh: nơi chốn, văn hoá và thời đại, trong hay ngoài, giờ, cỡ cảnh chính, đồ vật, không khí' },
  khung: { type: 'array', items: { type: 'object', required: ['id', 'file', 'ly_do'], properties: { id: { type: 'string' }, file: { type: 'string', description: 'đường dẫn tuyệt đối của ảnh' }, ten: { type: 'string' }, ly_do: { type: 'string' } } } },
  cat_can: { type: 'array', items: { type: 'string' }, description: 'đường dẫn tuyệt đối các tấm cắt cận đã chọn' },
  tam_ghep: { type: 'string', description: 'đường dẫn tuyệt đối tấm ghép các khung đã chọn' },
  ghi_chu: { type: 'string', description: 'loại nơi chốn mà thư viện thiếu, đã thay bằng gì' },
  khuon: { type: 'object', description: 'chỉ cho nhóm boi-canh: MỘT khung làm bản thiết kế', required: ['id', 'file', 'lop', 'bang_doi', 'mau'], properties: {
    id: { type: 'string' }, file: { type: 'string', description: 'đường dẫn tuyệt đối' },
    lop: { type: 'array', items: { type: 'string' }, description: 'các lớp của khung khuôn từ xa tới gần, mỗi lớp một dòng: có những món gì, khoảng bao nhiêu món, nằm ở đâu trong khung (% ngang, % cao)' },
    bang_doi: { type: 'array', items: { type: 'object', required: ['goc', 'doi', 'loai', 'kho'], properties: { goc: { type: 'string', description: 'món trong khung khuôn' }, doi: { type: 'string', description: 'đổi thành món gì của thế giới trong tập' }, loai: { type: 'string', description: 'loại dựng của món theo skill 2 mục Phẳng hay khối: "phẳng" (thứ sống hoặc mềm), "khối 3D" (thứ cứng được làm ra), "khối tiện" (đá, cột, chum, bình), "tấm nền xa" (lớp xa), "mặt lớn" (đất, nước, tường)' }, kho: { type: 'string', description: 'kết quả tra kho cho món này: id món kho dùng lại được (vd thien-nhien/tang-da-ba-sac), hoặc "chưa có", hoặc "có <id> nhưng sai kiểu: <lý do>"' } } } },
    mau: { type: 'string', description: 'nguyên văn phần in ra của `python3 tools/do_mau_khuon.py <khung khuôn>`: màu theo vai của khuôn' },
  } },
} } } } }
const BAO_CAO = { type: 'object', required: ['xong', 'anh', 'con_yeu'], properties: {
  xong: { type: 'array', items: { type: 'string' }, description: 'cảnh/bối cảnh đã làm, mỗi dòng một cái kèm tên composition' },
  anh: { type: 'array', items: { type: 'string' }, description: 'đường dẫn tuyệt đối các ảnh tĩnh hoặc tấm 9 khung để người rà chấm' },
  luoi: { type: 'string', description: 'đường dẫn tuyệt đối tấm lưới 2x3 (tools/canh_mau.py luoi) cho phép tấm lạc loài; KHÔNG ghi ô nào là của mình' },
  bao_cao: { type: 'string', description: 'đường dẫn file báo cáo' },
  con_yeu: { type: 'array', items: { type: 'string' } },
  cho_gen: { type: 'array', description: 'CHỈ điền khi gen.sh báo CODEX HẾT HẠN MỨC: mỗi tấm chưa gen được một mục, để phiên chính nhờ Daniel gen ở chỗ khác', items: { type: 'object', required: ['loi_ta', 'anh_mau', 'luu_vao'], properties: {
    loi_ta: { type: 'string', description: 'đường dẫn tuyệt đối file lời tả (chung/gen/prompts/<tên>.txt), có bảng món ở đầu và đã qua python3 tools/kiem_loi_ta.py' },
    anh_mau: { type: 'array', items: { type: 'string' }, description: 'đường dẫn tuyệt đối các ảnh mẫu kiểu vẽ đã đưa cho gen.sh' },
    luu_vao: { type: 'string', description: 'đường dẫn tuyệt đối nơi lưu ảnh gen được (chung/gen/<tên>.png)' } } } },
} }
const CHAM = { type: 'object', required: ['ket_luan', 'muc', 'kiem'], properties: {
  lac_loai: { type: 'object', required: ['o_doan', 'do_chac', 'doan_dung'], properties: { o_doan: { type: 'string' }, do_chac: { type: 'string', enum: ['rat-chac', 'kha-chac', 'khong-chac'] }, doan_dung: { type: 'boolean' }, dau_hieu: { type: 'array', items: { type: 'string' } } } },
  khac_biet: { type: 'array', description: 'tối đa 6 khác biệt lớn nhất so với phim mẫu', items: { type: 'object', required: ['thay', 'mau_lam', 'sua'], properties: { thay: { type: 'string' }, mau_lam: { type: 'string' }, sua: { type: 'string' } } } },
  noi_dung: { type: 'object', required: ['dung_mo_ta', 'mat', 'tu_them'], properties: { dung_mo_ta: { type: 'boolean' }, mat: { type: 'array', items: { type: 'string' } }, tu_them: { type: 'array', items: { type: 'string' } } } },
  ket_luan: { type: 'string', enum: ['DAT', 'HONG'] },
  muc: { type: 'array', items: { type: 'object', required: ['so', 'dat', 'ly_do'], properties: { so: { type: 'integer' }, dat: { type: 'boolean' }, canh: { type: 'string' }, ly_do: { type: 'string' } } } },
  kiem: { type: 'string', description: 'kết quả kiem_bong, kiem_canh, vật lý, độ sáng (một dòng mỗi lệnh)' },
  can_sua: { type: 'array', items: { type: 'string' }, description: 'việc sửa cụ thể: cảnh, chỗ nào, sửa thế nào' },
} }

// ---------- Chọn mẫu ----------
const daCo = (A.chon && A.chon.nhom) || []   // bộ cảnh mẫu và khung khuôn Daniel đã duyệt ở lượt chi_khuon: dùng lại, không chọn lại
const canMau = NHOM.filter(CAN_MAU).filter((n) => !daCo.some((c) => c.ten === n.ten))
if (daCo.length) log(`dùng lại bộ cảnh mẫu đã duyệt cho: ${daCo.map((c) => c.ten).join(', ')}`)
const thieuChon = NHOM.filter((n) => n.viec === 'boi-canh' && !n.sua_cu && !daCo.some((c) => c.ten === n.ten))
if (thieuChon.length && !A.chi_khuon && !D.che_do_thu) throw new Error(`CHƯA ĐƯỢC CHẠY: nhóm boi-canh ${thieuChon.map((n) => '"' + n.ten + '"').join(', ')} không có trong args.chon. Bối cảnh MỚI phải dựng đúng khung khuôn và bảng đổi món Daniel đã duyệt: truyền chon = trường chon của lượt chi_khuon đó (sửa theo lời Daniel nếu ông đổi món). Nếu đây là lượt SỬA một bối cảnh đã dựng và đã được duyệt thì ghi sua_cu: true ở nhóm đó.`)
let chon = { nhom: [] }
if (canMau.length) {
  phase('Chọn mẫu')
  chon = await agent(`Việc: CHỌN BỘ CẢNH MẪU cho từng nhóm cảnh sắp dựng của một phim hoạt hình cắt giấy. Thư viện cảnh mẫu cắt từ hai video của kênh mà dự án học theo. Bạn chỉ chọn ảnh, không dựng gì, không sửa file nào ngoài các tấm ghép.

Dự án: ${ROOT}. Lệnh chạy trong ${ROOT}/chung. Danh sách cảnh: ${A.danh_sach} (tính từ ${ROOT}/).
Thư viện: ${TV}/
- canh-mau.json: mỗi khung có id, file (ảnh 1280x720), ten (tên bối cảnh), loai, trong_ngoai, gio, co_canh (toan | trung | can), van_hoa, vat (đồ vật chính), mau_tot (khung thấy rõ nền).
- MUC-LUC.md: danh sách bối cảnh; tam-loai/<loại>-NN.jpg: tấm ghép theo loại (mỗi ô ghi mã, tên bối cảnh, cỡ cảnh; chữ xám là khung thấy ít nền).
- cat-can/: tấm cắt cận theo loại vật: do-go.jpg, cay-co.jpg, kien-truc.jpg, do-nho.jpg, mat-phang-lon.jpg, bong-va-nguon-sang.jpg, hat-va-hieu-ung.jpg, troi-nui-lop-xa.jpg, bo-cuc.jpg.
Công cụ đo màu theo vai: \`python3 tools/do_mau_khuon.py <ảnh>\`.
Công cụ: \`python3 tools/canh_mau.py tim [--loai a,b] [--trong | --ngoai] [--gio ngay|dem|chieu] [--co toan|trung|can] [--van-hoa x] [--tu "bàn, sách"]\` in ứng viên gom theo bối cảnh; \`python3 tools/canh_mau.py ghep <ra.jpg> <mã…>\` ghép tấm.

Các nhóm cần chọn mẫu:
${canMau.map((n) => `- nhóm "${n.ten}" (${n.viec}); cảnh: ${(n.canh || []).join(', ') || '(xem danh sách)'}${n.ghi_chu ? `; ghi chú: ${n.ghi_chu}` : ''}; tấm ghép lưu ở ${ABS(TAM(n))}/mau-${n.ten}.jpg`).join('\n')}

Với TỪNG nhóm:
1. Đọc các cảnh của nhóm trong danh sách cảnh và dòng mô tả bối cảnh của chúng. Viết mo_ta: trong nhà hay ngoài trời, kiểu nơi chốn, văn hoá và thời đại, giờ trong ngày, cỡ cảnh chính, các loại đồ vật, không khí.
2. Tra bằng \`canh_mau.py tim\` (thử vài cách lọc), mở các tấm tam-loai của loại liên quan để NHÌN, mở ảnh to của ứng viên khi cần.
3. Chọn 8–12 khung: cùng kiểu nơi chốn, cùng giờ, phần lớn cùng cỡ cảnh với cảnh sắp dựng (thêm một hai khung cỡ khác để thấy nơi chốn rộng hơn); lấy từ ÍT NHẤT 4 bối cảnh khác tên, không quá 3 khung của cùng một bối cảnh; ưu tiên khung thấy rõ nền. Mục đích là để người dựng thấy cái LẶP LẠI về cách vẽ loại cảnh này, không phải để họ chép một nơi: cảnh của dự án có thể thuộc văn hoá khác hẳn (Nhật, châu Á, cổ đại), khi đó chọn theo kiểu không gian, giờ, cỡ cảnh, loại đồ vật.
4. Chọn thêm 2–4 tấm cắt cận có loại vật mà mô tả nhắc tới (luôn kèm bo-cuc.jpg).
5. Ghép bằng \`canh_mau.py ghep\` rồi mở tấm ghép ra xem lại: khung nào lạc loại thì thay và ghép lại.
6. CHỈ với nhóm boi-canh, chọn thêm MỘT KHUNG KHUÔN (trường khuon) trong số khung đã chọn hoặc trong thư viện: khung có cùng KIỂU KHÔNG GIAN với bối cảnh sắp dựng (ví dụ cây cối ôm hai bên và một khối lớn ở giữa; phòng có một bức tường chính và cửa sổ; phố có dãy nhà và khoảng sân), giàu đồ vật, thấy rõ nền, cỡ cảnh toàn hoặc trung. Mở ảnh to của nó và ghi: (lop) từng lớp từ xa tới gần có những món gì, khoảng mấy món, ở đâu trong khung; (bang_doi) bảng đổi TỪNG món của khung khuôn sang món tương ứng trong thế giới của tập, lấy từ danh sách cảnh và từ hiểu biết về nơi chốn, thời đại đó (ví dụ sạp chợ thành quán mì, tượng báo thành đèn đá): giữ số món, không tự thêm món màu rực mà khuôn không có; với TỪNG món của bảng, ghi trường loai theo chung/skills/2-chuan-mon-do.md mục "Phẳng hay khối" (thứ sống hoặc mềm: phẳng; thứ cứng được làm ra: khối 3D; đá, cột, chum, bình: khối tiện; lớp xa: tấm nền xa), rồi chạy \`python3 tools/kho.py tim <từ>\` (trong chung/; thêm \`--nhom thien-nhien\` cho đá, cây) và ghi vào trường kho: id món kho dùng lại được, hoặc "chưa có", hoặc "có <id> nhưng sai kiểu: <lý do>" (so ảnh món kho ở chung/assets/<nhóm>/<id>.png với khung khuôn); (mau) chạy \`python3 tools/do_mau_khuon.py <ảnh khung khuôn>\` và chép nguyên phần in ra.
Thư viện không có loại nơi chốn mà mô tả cần thì chọn loại gần nhất và ghi vào ghi_chu. Không mở thư mục ref/ nào.`, { ...OPT, label: 'chọn cảnh mẫu', phase: 'Chọn mẫu', schema: S_CHON })
  if (!chon || !chon.nhom) throw new Error('bước chọn cảnh mẫu không trả kết quả')
}
chon = { nhom: [...daCo, ...((chon && chon.nhom) || [])] }
if (A.chi_khuon) return { chon, ket: [], tiep_theo: TIEP }
const mauCua = (n) => (chon.nhom || []).find((c) => c.ten === n.ten) || null
const liet = (m) => `BỘ CẢNH MẪU của nhóm (bước chọn ảnh đã giao; đây là khung của video gốc):
${m.khung.map((k) => `- ${k.file}  (${k.id}, ${k.ten || ''}: ${k.ly_do})`).join('\n')}
Tấm ghép cả bộ: ${m.tam_ghep}
Tấm cắt cận đồ vật: ${m.cat_can.join(', ')}${m.ghi_chu ? `\nGhi chú của người chọn: ${m.ghi_chu}` : ''}${m.khuon ? `\nKHUNG KHUÔN (bản thiết kế của bối cảnh): ${m.khuon.file} (${m.khuon.id})\nCác lớp của khuôn, từ xa tới gần:\n${(m.khuon.lop || []).map((x) => '- ' + x).join('\n')}\nBảng đổi món (khuôn → cảnh của mình):\n${(m.khuon.bang_doi || []).map((x) => '- ' + x.goc + ' → ' + x.doi + '   [loại: ' + (x.loai || 'CHƯA GHI') + '; kho: ' + (x.kho || 'CHƯA TRA') + ']').join('\n')}\nMàu theo vai của khuôn:\n${m.khuon.mau}` : ''}
${VAI_MAU}`

// ---------- Dựng ----------
const dung = (n) => { const m = mauCua(n); return agent(`${CHUNG}
${docVai(n)}

Vai: ${VAI[n.viec] || n.viec}. Nhóm "${n.ten}", mã đoạn ${A.ma}. Cảnh của nhóm: ${(n.canh || []).join(', ') || '(xem danh sách)'}.${n.ghi_chu ? `\nGhi chú: ${n.ghi_chu}` : ''}
${m ? `
${liet(m)}
Cách dùng (skill 1, mục Cảnh mẫu của cảnh): MỞ XEM HẾT bộ cảnh mẫu và các tấm cắt cận trước khi làm; viết vào báo cáo 8–10 điều LẶP LẠI ở phần lớn ảnh; khi sửa một cảnh có sẵn thì kiểm kê GIỮ / GOM / BỎ trước.${m.khuon && n.viec === 'boi-canh' ? ` Bối cảnh dựng MỚI thì làm theo KHUÔN, đúng ba bước:
(1) LÀM ĐỒ TRƯỚC, mỗi món đi đủ bốn bước của Thẻ làm một món (skill 2: tra kho, chọn loại, lấy nét từ Codex, vào kho): món cần nét vẽ (cây, bụi, đá, thác, con vật, đồ nhỏ nhiều chi tiết, lớp xa) thì VẼ BẰNG CODEX, không chờ ai nhắc: gom TẤT CẢ món cần gen của bối cảnh rồi gen thành TẤM KÍN chia theo cỡ món (hạn mức Codex tính theo số lần gen: 12–20 món nhỏ và vừa một tấm, 4–6 món lớn một tấm, 3–4 dải lớp xa một tấm; lời tả đòi xếp sát, khe hở 2–3 % bề ngang, không món nào chạm nhau; file lời tả PHẢI mở đầu bằng BẢNG MÓN, mỗi món một dòng "#MON số | tên | loại (phang, khoi-dun, khoi-tien, khoi-rap, tam-nen) | kho: tra bằng từ gì, ra gì", tức là tra kho và chọn loại XONG rồi mới viết lời tả, món kho đã có thì không đưa vào tấm; soát bằng python3 tools/kiem_loi_ta.py <file>, gen.sh từ chối lời tả thiếu bảng (mã thoát 4) và tự thêm câu "vẽ chính diện, không phối cảnh" cho món là khối; mẫu lời tả gen/prompts/_mau-tam-kin.txt; KHÔNG gen một tấm cho một hai món, món thiếu hay hỏng dồn vào một tấm sửa) bằng \`./gen.sh\` với khung khuôn làm mẫu kiểu vẽ, cắt bằng \`python3 tools/cut.py … --mong=<số món>\`, đặt THEO LOẠI ghi ở cột loai của bảng đổi món (chung/skills/2-chuan-mon-do.md, mục "Phẳng hay khối": thứ sống hoặc mềm là hình phẳng Pic2D hoặc Sprite, lớp xa là tấm nền; thứ cứng là khối 3D ráp từ B, đá cột chum bình là khối tiện FacetLathe, tranh Codex làm bản thiết kế và mặt vẽ của khối, KHÔNG dán nguyên tấm tranh thay cho món cứng; cách làm và lời tả: mục Vẽ đồ bằng Codex; tối đa 2 tấm kín và 1 tấm sửa cho bối cảnh này; lệnh chạy ngoài sandbox; gen.sh báo CODEX HẾT HẠN MỨC (mã thoát 3) thì DỪNG bối cảnh này ngay: KHÔNG chờ, KHÔNG vẽ thay bằng code, KHÔNG dựng bối cảnh thiếu món; viết sẵn lời tả của MỌI tấm còn thiếu vào gen/prompts/ (có bảng món, python3 tools/kiem_loi_ta.py <file> phải ra ĐẠT), điền cho_gen trong báo cáo (mỗi tấm: file lời tả, các ảnh mẫu, nơi lưu ảnh) và trả báo cáo ngay với xong và anh để trống, phiên chính sẽ nhờ Daniel gen ở chỗ khác); khối xây dựng to, mặt đất, mặt nước, thứ phải chuyển động thì vẽ bằng code. Mỗi món của bảng đổi món là một component hoặc một ảnh riêng (TRA KHO TRƯỚC: món nào bảng đổi món ghi id kho thì PHẢI gọi lại món kho đó, đổi màu, seed, cỡ cho hợp, KHÔNG viết component mới cùng loại; món bảng ghi CHƯA TRA thì tự chạy \`python3 tools/kho.py tim <từ>\`; món tự làm mới ghi \`kho:ok <lý do>\` trên dòng khai báo, viết MỘT lần rồi các file khác import; món dùng lại được ở kênh khác thì KHÔNG tự ghi vào kho chung: liệt kê ở mục "Món mới xin vào kho chung" của báo cáo kèm ảnh, Daniel duyệt rồi phiên chính mới đưa vào; món riêng của kênh thì vào kho của kênh; trước khi báo xong chạy \`python3 tools/kiem_kho.py <file>\` và xử lý từng dòng tu-ve-lai, trung-mon), 2–4 sắc phẳng cùng họ màu, mặt sáng mặt tối theo một hướng nắng, có chi tiết nhận diện, không khối đa giác xám trơn, không vân nhiễu, không viền đen. Khối tự nhiên (đá, vách, gò đất) là vài KHỐI LỚN bo tròn, mỗi khối 2–3 mảng sáng tối chéo theo nắng: không xếp ô như tường gạch, không lưới tam giác, núi xa mỗi lớp một sắc phẳng và không kẻ sống dọc chia hai màu (ảnh so chung/skills/bang-cham/nui-da.jpg); rêu, cỏ trên đá là vài mảng phủ ở đỉnh và vai khối, không rải chấm; nước của thác bám theo từng bậc đá, mỗi bậc lệch ngang và rộng dần xuống dưới, không phải một cột thẳng; vật để người đứng lên (tảng đá, bục) có một mặt vát sáng phía nắng, không bẹt; dựng một TẤM ĐỒ bày mọi món có nhãn (${TAM(n)}/tam-do-${n.ten}.png), soi từng món cạnh món tương ứng của khuôn và tấm cắt cận, sửa món sơ hoặc rối rồi mới ghép;
(2) GHÉP theo khuôn: đủ các lớp, mỗi lớp số món ngang với khuôn, vị trí và cỡ tương đối như khuôn, bóng do engine lo (skill 1, mục Bóng): KHÔNG đặt vệt bóng dưới người hay đồ vật, không tự chỉnh độ nhoè bóng, đèn chính đặt từ phía máy; đồ nhỏ đặt gần máy không được to quá tỉ lệ thật so với người; cỡ cảnh, chỗ đứng của người vẫn theo danh sách cảnh;
(3) MÀU theo vai của khuôn, đo trên ảnh dựng ra: \`python3 tools/do_mau_khuon.py <ảnh của mình> ${m.khuon.file}\` không có LOI (đèn làm mặt nhận sáng nhạt đi: tô vật liệu sẫm hơn đích hoặc hạ đèn; không bỏ món, không thêm món để đạt số). Nộp cả tấm đồ trong trường anh.` : ''} Dựng xong, làm phép tấm lạc loài: \`python3 tools/canh_mau.py luoi ${TAM(n)}/luoi-${n.ten}.jpg <ảnh tiêu biểu nhất của nhóm> <5 mã khung của bộ cảnh mẫu>\`, mở lưới ra nhìn xem ô của mình lạc ở điểm nào (đồ vật sơ hơn hay rối hơn, mức gọn, màu, cỡ người, bóng, hạt) rồi sửa và làm lại lưới. Nộp đường dẫn lưới cuối cùng ở trường luoi; không ghi ô nào là của mình ở bất cứ đâu trong báo cáo.
` : ''}
Làm đúng thứ tự skill của vai. Trước khi báo xong: \`python3 tools/kiem_bong.py <file đã sửa>\` và \`python3 tools/kiem_canh.py <file đã sửa>\` không có LOI; tự chấm 8 mục bảng chấm trên ảnh của mình (đặt cạnh ảnh ĐẠT), sửa mục hỏng trong ngân sách dựng của skill 4. Ảnh tạm để ở ${TAM(n)}/. Viết báo cáo ${OUTD}/bao-cao-${n.ten}.md theo mẫu skill 4.`,
  { ...OPT, label: `dựng ${n.ten}`, phase: 'Dựng', schema: BAO_CAO }) }

// ---------- Rà ----------
const ra = (n, bc, vong) => { const m = mauCua(n), coLuoi = !!(m && bc.luoi); return agent(`${coLuoi ? `BƯỚC 0, LÀM TRƯỚC KHI ĐỌC BẤT CỨ THỨ GÌ KHÁC (kể cả các file luật và phần dưới của phiếu này nếu có thể): mở ảnh ${bc.luoi}. Đó là lưới 6 ô đánh chữ A–F. Năm ô cắt từ cùng một bộ phim hoạt hình cắt giấy; một ô do người khác dựng theo phong cách đó. Ô nào LẠC LOÀI? Ghi ô đoán, độ chắc, 3–5 dấu hiệu. Sau đó mới đọc file ${String(bc.luoi).replace(/\.jpe?g$/i, '')}-vi-tri.txt (chữ của ô thuộc dự án) để biết mình đoán trúng không. Kết quả ghi vào lac_loai.

` : ''}${CHUNG}
${docVai(n)}

Bạn là người RÀ ĐỘC LẬP (không phải người dựng) nhóm "${n.ten}" (${VAI[n.viec] || n.viec}), vòng ${vong}. Người dựng báo:
${JSON.stringify(bc, null, 1)}
Việc:
1. Chạy \`python3 tools/kiem_bong.py\` và \`python3 tools/kiem_canh.py\` trên các file của nhóm; với cảnh quay có người: \`tools/kiem-canh.sh <comp…>\` (vật lý, độ sáng, tấm 9 khung).
2. Mở TỪNG ảnh người dựng nộp (đổi sang JPEG nếu cần), đặt cạnh ảnh ĐẠT của từng mục trong chung/skills/bang-cham/, chấm 8 mục ĐẠT/HỎNG cho cả nhóm, ghi cảnh nào hỏng và nhìn thấy gì. Phóng to vùng sau đầu người và vùng có bóng.
3. Kiểm thêm theo thẻ luật cứng: sân khấu ngang, máy dùng kiểu có tên, chuỗi cảnh cùng nơi giữ một hướng máy, chuyển cảnh ở chỗ cắt đúng tên kiểu ghi trong danh sách, có lý do trong truyện, và cảnh trước thật sự có thứ kiểu đó cần (bảng chống lạm dụng ở skill 0, mục Chuyển cảnh: ô cửa cho lao-cua, cận mặt cho vao-mat…), hạt có nguồn.${m ? `
4. So với phim mẫu. Mở tấm ghép bộ cảnh mẫu ${m.tam_ghep} và các tấm cắt cận ${m.cat_can.join(', ')}. So ảnh của nhóm với chúng, viết TỐI ĐA 6 khác biệt lớn nhất vào khac_biet, xếp theo mức làm lộ "khác phim". Mỗi khác biệt: (thay) thấy gì ở ảnh của nhóm, chỗ nào; (mau_lam) phim mẫu làm thế nào, ghi khung hoặc tấm làm chứng; (sua) sửa cụ thể ra sao. Xét đủ: từng ĐỒ VẬT có sơ sài hơn hay rối hơn mức của tấm cắt cận không (nêu tên vật); bề mặt lớn; mức gọn (đồ gom cụm hay rải, món nào bị người che hay bị cắt cụt ở mép); màu (mảng nào quá rực hay quá nhạt); bóng (mỗi người đúng một bóng ngả ra sau, mép mềm, trong nhà mờ hơn; không vệt tròn vẽ dưới người hay đồ vật); vệt nắng và hạt. KHÔNG tính là khác biệt: kiểu vẽ mặt và áo nhân vật, cỡ cảnh và chỗ đứng (do danh sách cảnh quyết định), nơi chốn và văn hoá khác với cảnh mẫu.${m.khuon && n.viec === 'boi-canh' ? `
   Bối cảnh này có KHUNG KHUÔN ${m.khuon.file}. Đặt ảnh toàn cảnh của nhóm cạnh khuôn, cùng cỡ: đếm số món gọi được tên ở TỪNG LỚP của hai bên (lớp nào của nhóm thưa hơn hẳn, hoặc là khối xám không tên, thì là khác biệt lớn); mở TẤM ĐỒ người dựng nộp và soi từng món: món nào sơ (hộp trơn, một sắc), rối (vân, nhiều nét vụn) hoặc sai kiểu (đá xếp ô như tường gạch, đá lưới tam giác, núi bị một sống dọc chia làm hai màu, rêu rải chấm, thác là một cột thẳng, vật đứng lên bẹt như bánh) thì ghi TÊN MÓN và cách sửa vào can_sua; món cứng (đá, bàn ghế, thùng, hộp, chum, bình) bị đặt thành tấm phẳng Pic2D hoặc Sprite, hoặc món có loại dựng khác cột loai của bảng đổi món, là HỎNG; chạy \`python3 tools/kiem_kho.py <các file của nhóm>\`: mỗi dòng tu-ve-lai hoặc trung-mon chưa có \`kho:ok <lý do>\`, và mỗi món bảng đổi món ghi id kho mà người dựng lại tự viết, là một chỗ HỎNG, ghi vào can_sua kèm id món kho phải dùng; chạy \`python3 tools/do_mau_khuon.py <ảnh của nhóm> ${m.khuon.file}\` và chép các dòng LOI, CANH vào kiem (có LOI mau-khuon là HONG; sửa bằng màu vật liệu và đèn, không bỏ món).` : ''}
5. Soi nội dung theo danh sách cảnh (noi_dung): dung_mo_ta (đúng nơi chốn, văn hoá, thời đại, đủ những thứ mô tả nêu không); mat (thứ đáng có mà không thấy, kể cả không khí: nắng, bụi, lớp xa); tu_them (thứ bản này tự thêm mà danh sách cảnh không có).` : ''}
ket_luan HONG khi: một mục bảng chấm HỎNG, hoặc có LOI${m ? ', hoặc bạn đoán trúng ô lạc loài với độ chắc từ kha-chac trở lên và còn khác biệt lớn, hoặc nội dung lệch mô tả, hoặc có LOI mau-khuon' : ''}. Khắt khe: "tạm được" là HỎNG. can_sua phải cụ thể (cảnh, chỗ, cách sửa). Không tự sửa file. Không khen.`,
  { ...OPT, label: `rà ${n.ten} v${vong}`, phase: 'Rà', schema: CHAM }) }

// ---------- Sửa ----------
const sua = (n, bc, cham) => { const m = mauCua(n); return agent(`${CHUNG}
${docVai(n)}

Vai: ${VAI[n.viec] || n.viec}. Nhóm "${n.ten}" vừa bị người rà chấm HỎNG. Báo cáo người dựng:
${JSON.stringify(bc, null, 1)}
Chấm của người rà:
${JSON.stringify(cham, null, 1)}
${m ? `
${liet(m)}
` : ''}
LỌC trước khi sửa (ghi vào báo cáo những gợi ý bị loại và vì sao): bỏ gợi ý đòi thêm thứ không thuộc nơi chốn, văn hoá của cảnh mình (ví dụ đồ kiểu Tây cho cảnh Nhật); bỏ gợi ý dời máy, đổi cỡ cảnh, đổi chỗ đứng, đổi diễn xuất khác danh sách cảnh; bỏ gợi ý đổi màu áo hay kiểu vẽ nhân vật; bỏ gợi ý xoá không khí của cảnh (nắng, bụi, lớp xa: chỉ làm cho mềm, thưa, đúng chỗ); không chèn tấm phẳng sau đầu người. Thứ ở mục tu_them mà danh sách cảnh không có thì gỡ.
Còn lại: sửa ĐÚNG từng mục hỏng và từng khác biệt (không làm lại phần đã đạt), dựng lại ảnh, chạy lại kiem_bong + kiem_canh, tự chấm lại 8 mục đặt cạnh ảnh ĐẠT${m ? ', đặt ảnh mới cạnh tấm ghép bộ cảnh mẫu để soi lại' : ''}. Ghi thêm mục "Vòng sửa" vào ${OUTD}/bao-cao-${n.ten}.md. Trong \`con_yeu\` ghi rõ mục nào vẫn chưa đạt.`,
  { ...OPT, label: `sửa ${n.ten}`, phase: 'Sửa', schema: BAO_CAO }) }

const ket = await pipeline(NHOM,
  (n) => dung(n),
  async (bc, n) => ({ bc, cham: bc && !(bc.cho_gen || []).length ? await ra(n, bc, 1) : null }),   // Codex hết hạn mức: bối cảnh chưa dựng, không tốn lượt rà
  async ({ bc, cham }, n) => {
    if (!bc || !cham || cham.ket_luan === 'DAT' || !SUA) return { nhom: n.ten, bc, cham, sau_sua: null }
    return { nhom: n.ten, bc, cham, sau_sua: await sua(n, bc, cham) }
  })

const choGen = ket.flatMap((r) => (r && r.bc && r.bc.cho_gen) || [])
const NHO_GEN = choGen.length ? `CODEX HẾT HẠN MỨC: ${choGen.length} tấm chưa gen được (danh sách ở cho_gen); các bối cảnh đó CHƯA dựng, chưa rà. TRƯỚC KHI GỬI, với từng tấm chạy trong chung/: python3 tools/kiem_loi_ta.py <file lời tả> --in ; lệnh báo LOI thì tra kho, chọn loại, sửa bảng món ở đầu file rồi chạy lại (Daniel 26/11/2026: không chuyển nguyên lời tả của agent khi chưa soát luật 2D/3D). Gửi Daniel NGAY trong MỘT tin: lời tả từng tấm là KẾT QUẢ của lệnh đó (thêm dòng đầu "Create ONE image, landscape 16:9."; tấm đã chạy gen.sh thì có sẵn ở gen/<tên>.png.loi-ta.txt), dán trong khối code, KHÔNG dán file gốc; các ảnh mẫu gửi thẳng bằng SendUserFile, và nơi lưu từng ảnh, để Daniel gen ở chỗ khác. Có ảnh rồi thì chạy lại workflow cho các nhóm đó. ` : ''
return { chon, ket: ket.map((r, i) => r || { nhom: NHOM[i].ten, loi: 'agent không trả kết quả' }), cho_gen: choGen, tiep_theo: NHO_GEN + TIEP }
