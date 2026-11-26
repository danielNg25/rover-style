"""Soát file lời tả gửi Codex TRƯỚC khi gen (skill 2, Thẻ làm một món: tra kho, chọn loại, rồi mới lấy nét).

Daniel, 26/11/2026: "lúc gen ảnh codex nó ko check luật 2d 3d để gen". Một phiên đã chuyển nguyên lời tả của agent cho Daniel gen hộ,
chưa soát món nào là phẳng, món nào là khối. Từ nay gen.sh chỉ nhận lời tả đi qua công cụ này.

Dùng (trong chung/):
  python3 tools/kiem_loi_ta.py gen/prompts/<tên>.txt         soát và in kết quả
  python3 tools/kiem_loi_ta.py gen/prompts/<tên>.txt --in    in LỜI TẢ GỬI CODEX: bỏ bảng món, thêm câu về hướng vẽ của món là khối.
                                                              gen.sh dùng lệnh này; lời tả gửi Daniel gen hộ cũng là kết quả của lệnh này.

Mỗi file lời tả MỞ ĐẦU bằng BẢNG MÓN, mỗi món một dòng:
  #MON <số> | <tên món> | <loại> | kho: <tra kho bằng từ gì, ra gì>
ví dụ:
  #MON 1 | cây bồ đề non | phang | kho: không có (tìm "cây bồ đề", "cây phố")
  #MON 2 | rương vòm | khoi-dun | kho: có ruong-go nhưng nắp phẳng, cảnh cần nắp vòm

Loại (skill 2, mục Phẳng hay khối: chia theo loại vật, không theo cỡ):
  phang      thứ sống hoặc mềm (cây, bụi, hoa, con vật, bao vải, đồ ăn): tranh là chính món đó
  khoi-dun   thứ cứng, được làm ra, có mặt phẳng (bàn, ghế, tủ, rương, sách, xe đẩy, tranh treo): tranh là bản thiết kế và mặt vẽ; dựng bằng KhoiDun
  khoi-tien  thứ tròn quanh một trục đứng (đá, cột, cột đèn, chum, bình, lọ, quả cầu): dựng bằng KhoiTien hoặc FacetLathe
  khoi-rap   khối ráp bằng code từ B (nhà, sạp, quầy, toa xe): tranh chỉ là bản thiết kế
  tam-nen    lớp xa (núi, làng, rặng cây xa)

TRANH BỐI CẢNH MẪU (Daniel 26/11/2026: gen một tranh của cả bối cảnh để dựng theo, "thay vì tự agent nghĩ ra"): file lời tả mở đầu bằng
MỘT dòng   #CANH <tên bối cảnh>   và KHÔNG có dòng #MON, không nối gen/prompts/style.txt (tranh cả cảnh, không nền hồng). Công cụ thêm câu
về góc nhìn sân khấu: ngang tầm mắt, có dải đất trống cho người đứng, không có người. Mẫu: gen/prompts/_mau-tranh-boi-canh.txt
  python3 tools/kiem_loi_ta.py <file> --loai    in  canh  (tranh bối cảnh mẫu)  hoặc  mon  (tấm đồ)

Luật soát: số món chạy 1..N; mỗi số có trong lời tả dạng "N)"; loại hợp lệ; cột kho có nội dung. Thoát 1 khi có LOI.
Món là khối: công cụ dựng khối đùn viền ảnh và dán ảnh lên mặt trước, nên tranh phải vẽ CHÍNH DIỆN, không phối cảnh; câu đó được thêm tự động.
"""
import re
import sys
import unicodedata
from pathlib import Path

LOAI = {'phang': 'phẳng', 'khoi-dun': 'khối đùn', 'khoi-tien': 'khối tiện', 'khoi-rap': 'khối ráp', 'tam-nen': 'tấm nền'}
DONG_NGHIA = {'hinh-phang': 'phang', '2d': 'phang', 'dun': 'khoi-dun', 'tien': 'khoi-tien', 'rap': 'khoi-rap', 'tam-nen-xa': 'tam-nen', 'nen-xa': 'tam-nen', 'lop-xa': 'tam-nen'}


CAU_SAN_KHAU = ('STAGE VIEW (important): ONE wide 16:9 illustration of the whole place, seen at eye level and straight-on, like a theatre stage. '
                'Layers overlap from far to near. A flat, open strip of ground runs from left to right across the lower third of the picture and is kept clear, '
                'so that characters can stand and walk on it later. No road, river or row of objects running straight into the depth. '
                'NO characters, no animals in the foreground, no text, no frame. A full scene with sky and ground: NOT a parts sheet and NOT on a magenta background.')


# Kiểu vẽ của kênh gốc (Daniel 26/11/2026, kèm một khung video gốc: "style của kênh gốc là màu là các mảng riêng biệt chứ ko phải gradient";
# ảnh gen "dùng gradient để thể hiện màu sắc, rồi bóng và rất nhiều đường nét cong, tròn"). Câu này được thêm vào MỌI lời tả.
# Sửa cùng ngày: kiểu của kênh gốc là GIẤY CẮT XẾP LỚP, màu trầm như giấy thủ công (Daniel: "video gốc giống như là các mảnh giấy ghép lại
# với nhau"; "thêm phần yêu cầu là paper cut thì đã ra đúng hơn"). Bản đầu ghi "cạnh thẳng, góc gãy" làm ảnh ra kiểu low-poly.
CAU_KIEU_VE = ('STYLE (must follow, overrides anything else in this prompt): CUT PAPER, exactly as in the attached reference. '
               'Every element is a separate piece of matte coloured paper cut out with scissors. Each piece is ONE flat colour, with at most one second flat patch of a close tone for its shade side. '
               'NO gradients of any kind, no soft shading, no airbrush, no glow, no blur. '
               'Shapes are big and simple, with clean scissor-cut edges and slightly softened corners: no wavy, bubbly or ornate outlines, and no low-poly faceting into many small polygons. '
               'Very faint matte paper grain; no outlines, no ink lines, no painted texture. '
               'COLOUR MOOD: muted and slightly greyed, low contrast, like coloured craft paper; no saturated pure colours. '
               # bảng màu của kênh gốc (đo 573 khung, 26/11/2026; Daniel: "đưa luôn quy tắc màu vào prompt")
               'Large areas (sky, ground, walls) are low in saturation, close to grey. A strong colour is kept dark; a light colour is kept pale; no colour is both bright and saturated. '
               'Do not make the whole picture one warm family: keep some grey or cool areas. Daylight is neutral, with no orange or yellow cast unless the description says sunset or dusk.')
CAU_GIAY_CANH = ('LAYERS: the picture must look like a small stage diorama made of cut paper: each hill range, cliff, water band, rock, tree, bush and the ground ledge is its own paper piece, '
                 'laid in front of the piece behind it at a slightly different depth. Where one paper piece overlaps another, a thin dark shadow line shows along its edge, so the stacked layers read clearly. '
                 'The sky and the water are flat horizontal paper bands. Distant layers are paler and greyer, as if seen through a light haze.')
CAU_GIAY_DO = 'Each object is drawn alone: no shadow of any kind under, behind or beside it.'
DOI_MAU_RUC = re.compile(r'\b(vivid|vibrant|saturated|neon)\b', re.I)
DOI_GRADIENT = re.compile(r'(?<!no )(?<!without )(?<!not )((very |soft |subtle |gentle )+gradients?|gradients? only|smooth organic|hand-drawn curves|organic curves|soft shad(ing|ows?)|airbrush)', re.I)


def chuan(s):
    s = unicodedata.normalize('NFD', s.strip().lower().replace('đ', 'd'))
    return re.sub(r'[\s_]+', '-', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def doc(duong):
    """trả (món[], lời tả không còn bảng, lỗi[], cảnh báo[], tên bối cảnh khi là file #CANH); món = {'so', 'ten', 'loai'}"""
    p = Path(duong)
    if not p.is_file(): return [], '', [f'LOI  khong-co-file  {duong}'], [], None
    mon, than, loi, canh, ten_canh = [], [], [], [], []
    for k, d in enumerate(p.read_text(encoding='utf-8').split('\n'), 1):
        if not d.lstrip().startswith('#'):
            than.append(d); continue
        c = re.match(r'\s*#\s*CANH\b(.*)', d, re.I)
        if c: ten_canh.append(c.group(1).strip(' |:')); continue
        m = re.match(r'\s*#\s*MON\b(.*)', d, re.I)
        if not m: continue                                   # dòng chú thích khác: bỏ, không gửi Codex
        o = [x.strip() for x in m.group(1).split('|')]
        if len(o) != 4 or not re.fullmatch(r'\d+', o[0]):
            loi.append(f'LOI  bang-mon  dòng {k}: phải là  #MON <số> | <tên món> | <loại> | kho: <kết quả tra kho>'); continue
        l = chuan(o[2]); l = DONG_NGHIA.get(l, l)
        if l not in LOAI:
            goi = ' Món là khối thì ghi rõ khoi-dun, khoi-tien hay khoi-rap.' if 'khoi' in l or '3d' in l else ''
            loi.append(f'LOI  loai  dòng {k}, món {o[0]} "{o[1]}": loại "{o[2]}" không có. Chọn một trong: ' + ', '.join(LOAI) + '.' + goi)
        if not re.match(r'kho\s*:\s*\S.{5,}', o[3], re.I):
            loi.append(f'LOI  kho  dòng {k}, món {o[0]} "{o[1]}": thiếu kết quả tra kho. Chạy  python3 tools/kho.py tim <từ>  rồi ghi  kho: <từ đã tìm, kết quả>')
        if len(o[1]) < 2: loi.append(f'LOI  bang-mon  dòng {k}: thiếu tên món')
        mon.append({'so': int(o[0]), 'ten': o[1], 'loai': l})
    ta = '\n'.join(than).strip()
    g = DOI_GRADIENT.search(ta)
    if g: loi.append(f'LOI  kieu-ve  lời tả đòi "{g.group(0)}": kênh gốc vẽ mỗi màu một MẢNG PHẲNG riêng, mép sắc, hình khối cạnh thẳng góc gãy; không gradient, không bóng mềm, không nét cong mềm. Xoá cụm đó (đoạn kiểu vẽ cũ của gen/prompts/style.txt cũng xoá, nối lại bản mới)')
    for cau in re.split(r'(?<=[.;:!?])\s+', ta):                 # màu rực: chỉ bắt khi câu đó không phải câu cấm
        r = DOI_MAU_RUC.search(cau)
        if r and not re.search(r'\b(no|not|never|avoid|without)\b', cau, re.I):
            loi.append(f'LOI  mau-ruc  lời tả đòi màu "{r.group(0)}": màu của kênh gốc trầm, ngả xám, tương phản thấp như giấy thủ công. Đổi tên màu sang bản trầm (muted peach-orange, dusty violet, slate blue-grey…)'); break
    if ten_canh:                                         # tranh bối cảnh mẫu: tranh của cả cảnh, không có bảng món
        if mon: loi.append('LOI  lan-loai  file có cả #CANH lẫn #MON: tranh bối cảnh mẫu và tấm đồ là hai file lời tả riêng')
        if len(ten_canh) > 1 or len(ten_canh[0]) < 2: loi.append('LOI  canh  cần đúng MỘT dòng  #CANH <tên bối cảnh>')
        if len(ta) < 200: loi.append('LOI  ta-ngan  lời tả tranh bối cảnh quá ngắn: tả nơi chốn, giờ và ánh sáng, từng lớp từ xa tới gần với các món của lớp, dải đất cho người đứng, bộ màu (theo bảng thiết kế của bối cảnh)')
        if re.search(r'magenta|#FF00FF', ta, re.I): loi.append('LOI  nen-hong  tranh bối cảnh mẫu là tranh cả cảnh, không phải tấm đồ: bỏ đoạn nền hồng (không nối gen/prompts/style.txt)')
        return [], ta, loi, canh, ten_canh[0]
    if not mon and not loi:
        loi.append('LOI  thieu-bang  file lời tả chưa có bảng món. Trước khi gen, từng món phải qua bước 1 (tra kho) và bước 2 (chọn loại) của Thẻ làm một món (skill 2). '
                   'Thêm vào ĐẦU file, mỗi món một dòng:  #MON <số> | <tên món> | <phang, khoi-dun, khoi-tien, khoi-rap hoặc tam-nen> | kho: <tra kho bằng từ gì, ra gì>')
    so = [m['so'] for m in mon]
    if mon and sorted(so) != list(range(1, len(mon) + 1)):
        loi.append(f'LOI  so-mon  số món trong bảng phải chạy 1..{len(mon)}, không trùng, không nhảy (đang có: {", ".join(map(str, so))})')
    thieu = [m['so'] for m in mon if not re.search(r'(?<!\d)' + str(m['so']) + r'\)', ta)]
    if thieu: loi.append(f'LOI  so-trong-loi-ta  lời tả không có "{thieu[0]})"' + (f' và {len(thieu) - 1} số nữa' if len(thieu) > 1 else '') + ': mỗi món trong bảng phải được tả trong lời tả, đánh số dạng "N) …"')
    if 0 < len(mon) < 3 and not all(m['loai'] == 'tam-nen' for m in mon):
        canh.append(f'CANH it-mon  tấm chỉ có {len(mon)} món: hạn mức Codex tính theo số lần gen, gom thêm món vào tấm (skill 2, mục Vẽ đồ bằng Codex)')
    return mon, ta, loi, canh, None


def cau_huong(mon):
    """câu về hướng vẽ, thêm vào cuối lời tả khi tấm có món là khối"""
    ds = lambda loai: ', '.join(str(m['so']) for m in sorted(mon, key=lambda m: m['so']) if m['loai'] in loai)
    dun, tien, phang = ds(('khoi-dun', 'khoi-rap')), ds(('khoi-tien',)), ds(('phang', 'tam-nen'))
    if not dun and not tien: return ''
    c = ['VIEW (important):']
    if dun: c.append(f'Objects number {dun} are hard man-made props that will be rebuilt as 3D blocks from this drawing: draw each of them STRAIGHT-ON as a flat front elevation (orthographic view), with NO perspective, NO visible top face and NO visible side faces.')
    if tien: c.append(f'Objects number {tien} are round props that will be turned on a lathe: draw each of them straight-on and perfectly symmetric about its vertical axis, with no visible top opening and no perspective.')
    if phang: c.append(f'Objects number {phang} are flat cut-outs and keep their natural view.')
    return ' '.join(c)


def main(args):
    in_ra = '--in' in args; in_loai = '--loai' in args; args = [a for a in args if a not in ('--in', '--loai')]
    if len(args) != 1: print(__doc__); return 1
    mon, ta, loi, canh, ten_canh = doc(args[0])
    if in_loai: print('canh' if ten_canh else 'mon'); return 0
    if loi:
        for d in loi + canh: print(d, file=sys.stderr)
        print(f'\nLỜI TẢ CHƯA ĐƯỢC GEN: {len(loi)} lỗi ở {args[0]}. Cách ghi bảng món:  python3 tools/kiem_loi_ta.py', file=sys.stderr)
        return 1
    huong = CAU_SAN_KHAU if ten_canh else cau_huong(mon)
    day_du = ta + ('\n' + huong if huong else '') + '\n' + CAU_KIEU_VE + '\n' + (CAU_GIAY_CANH if ten_canh else CAU_GIAY_DO)
    if in_ra:
        for d in canh: print(d, file=sys.stderr)
        print(day_du); return 0
    if ten_canh:
        print(f'ĐẠT: tranh bối cảnh mẫu "{ten_canh}" (tranh cả cảnh, không cắt). Câu về góc nhìn sân khấu sẽ được thêm vào lời tả gửi Codex:  ' + huong)
        return 0
    for m in sorted(mon, key=lambda m: m['so']): print(f"  {m['so']:>2}  {LOAI[m['loai']]:<9} {m['ten']}")
    for d in canh: print(d)
    dem = {l: sum(1 for m in mon if m['loai'] == l) for l in LOAI}
    print(f"ĐẠT: {len(mon)} món (" + ', '.join(f'{v} {LOAI[l]}' for l, v in dem.items() if v) + f"). Cắt bằng  python3 tools/cut.py … --mong={len(mon)}")
    if huong: print('Câu về hướng vẽ sẽ được thêm vào lời tả gửi Codex:  ' + huong)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
