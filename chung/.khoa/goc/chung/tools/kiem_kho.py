#!/usr/bin/env python3
"""Rà việc DÙNG LẠI MÓN KHO (Daniel 25/11/2026: "một số vật như cục đá ta đã có ở phần asset chung nhưng mình thấy session khác vẫn
tự vẽ lại chứ ko dùng lại").

Chuyện đã xảy ra: kho chung có 8 món đá, kênh anime-analyst vẫn tự viết 7 component đá ở 5 file bối cảnh của tập shisui-1, có tên
viết hai lần ở hai file. Luật "tra kho trước khi dựng" có trong skill 1 nhưng không bước nào bắt, nên bị bỏ qua.

  python3 tools/kiem_kho.py [file hoặc thư mục ...]     mặc định rà ../kenh/*/tap và ../kenh/*/boi-canh (bỏ _luu, out, _thu-mau)

  CANH tu-ve-lai   file của kênh tự viết một component mà TÊN chỉ một loại vật kho đã có (đá, cây, núi, đèn, ghế, bàn…): in các món kho
                   cùng loại. Dùng lại món kho (đổi màu, seed, cỡ), hoặc ghi lý do trên dòng khai báo:  kho:ok <vì sao món kho không hợp>
  CANH trung-mon   cùng một tên component được viết ở hai file trở lên của một kênh: giữ một bản, file kia import lại
  CANH cung-ma-phang  một món cứng (đá, bàn, ghế, thùng…) chỉ là một tấm phẳng Pic2D / Sprite: món cứng là khối (skill 2, mục Phẳng hay khối)
Chỉ đọc code, không dựng hình. tools/kiem_canh.py tự gọi. Bối cảnh (component nhận children) không tính là món.
"""
import json, re, sys, unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
BO_QUA = ('/_luu/', '/out/', '/_thu-mau/', 'node_modules', '.bak', '/naruto-handover/', '/kho/')
# mảnh tên (tách theo chữ hoa) -> từ tiếng Việt có dấu để tra tên món trong kho
LOAI = {'Da': 'đá', 'Rock': 'đá', 'Boulder': 'đá', 'Stone': 'đá', 'Cay': 'cây', 'Tree': 'cây', 'Thong': 'thông', 'Pine': 'thông', 'Tre': 'tre', 'Bamboo': 'tre',
        'Bush': 'bụi', 'Nui': 'núi', 'Mountain': 'núi', 'Peak': 'núi', 'Lantern': 'đèn', 'Lamp': 'đèn', 'Den': 'đèn', 'Ghe': 'ghế', 'Bench': 'ghế', 'Chair': 'ghế',
        'Ban': 'bàn', 'Table': 'bàn', 'Thung': 'thùng', 'Barrel': 'thùng', 'Crate': 'thùng', 'Gieng': 'giếng', 'Well': 'giếng', 'Leu': 'lều', 'Tent': 'lều',
        'Thuyen': 'thuyền', 'Boat': 'thuyền', 'Fence': 'hàng rào', 'Cloud': 'mây', 'Ke': 'kệ', 'Shelf': 'kệ', 'Giuong': 'giường', 'Bed': 'giường'}
# nhóm kho được tính là "cùng loại" với từng từ (đá tự nhiên không tính ghế đá, nhà đá); từ không ghi ở đây thì tra trong các nhóm đồ
NHOM = {'đá': ('thien-nhien',), 'cây': ('thien-nhien',), 'thông': ('thien-nhien',), 'tre': ('thien-nhien',), 'bụi': ('thien-nhien',), 'núi': ('nen-xa', 'thien-nhien'), 'mây': ('nen-xa', 'thien-nhien', 'hieu-ung')}
NHOM_DO = ('do-trong-nha', 'do-ngoai-troi', 'do-cam-tay', 'nha-ga-xe-lua')
CHI_DAU = {'Den', 'Ban', 'Ke', 'Tre', 'Well'}   # mảnh dễ lẫn nghĩa (BangDen = bảng đen): chỉ tính khi đứng đầu tên
CUNG = {'đá', 'ghế', 'bàn', 'thùng', 'giếng', 'kệ', 'giường', 'hàng rào'}   # loại vật cứng: phải là khối, không là tấm phẳng
KHAI = re.compile(r'^(?:export\s+)?(?:const|function)\s+([A-Z][A-Za-z0-9]*)\b[^\n]*', re.M)


def kho():
    ds = []
    for f in [GOC / 'assets' / 'catalog.json', *GOC.parent.glob('kenh/*/kho/catalog.json')]:
        try: c = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        ds += c if isinstance(c, list) else next(iter(c.values()))
    return ds


def kiem(args):
    goc = [Path(a) for a in args] or [*GOC.parent.glob('kenh/*/tap'), *GOC.parent.glob('kenh/*/boi-canh')]
    files = [f for g in goc for f in ([g] if g.is_file() else sorted(g.rglob('*.tsx'))) if not any(b in str(f.resolve()) for b in BO_QUA)]
    mon = kho(); canh = []; theo_kenh = {}
    def cung_loai(tu):
        w = unicodedata.normalize('NFC', tu).split()
        ra = []
        for e in mon:
            if e.get('nhom') not in NHOM.get(tu, NHOM_DO): continue
            t = re.findall(r'[^\W_]+', unicodedata.normalize('NFC', e.get('ten', '').lower()))
            if any(t[i:i + len(w)] == w for i in range(len(t))): ra.append(e)
        return ra
    for f in files:
        s = f.read_text(encoding='utf-8', errors='replace'); ten_f = f.resolve().relative_to(GOC.parent) if GOC.parent in f.resolve().parents else f
        k = re.search(r'/kenh/([^/]+)/', str(f.resolve())); kenh = k.group(1) if k else '?'
        for m in KHAI.finditer(s):
            ten, dong_khai = m.group(1), m.group(0)
            if 'React.FC' not in dong_khai and '=>' not in dong_khai and 'function' not in dong_khai: continue
            if 'children' in dong_khai: continue                         # bối cảnh, không phải món
            manh = re.findall(r'[A-Z][a-z0-9]*', ten); loai = next((LOAI[x] for i, x in enumerate(manh) if x in LOAI and (i == 0 or x not in CHI_DAU)), None)
            if 'Hang' in manh and 'Rao' in manh: loai = 'hàng rào'
            if not loai: continue
            so_dong = s.count('\n', 0, m.start()) + 1
            theo_kenh.setdefault((kenh, ten), []).append(f'{ten_f}:{so_dong}')
            # món CỨNG mà dựng thành tấm phẳng (skill 2, mục Phẳng hay khối: đá, bàn, ghế, thùng, kệ, giường, giếng là khối)
            if loai in CUNG and 'loai:ok' not in dong_khai:
                sau = s[m.end(): m.end() + 900]; k = re.search(r'\n(?:export\s+)?(?:const|function)\s+[A-Z]', sau); than = dong_khai + (sau[: k.start()] if k else sau)   # thân component: phần còn lại của dòng khai báo và các dòng tới khai báo kế tiếp
                if re.search(r'<(Pic2D|Sprite)\b', than) and not re.search(r'<B\b|<mesh\b|FacetLathe|boxGeometry|KhoiTuAnh|<group', than):
                    canh.append(f'CANH cung-ma-phang {ten_f}:{so_dong}  <{ten}> là món cứng ("{loai}") nhưng chỉ là một tấm phẳng (Pic2D / Sprite): món cứng là khối 3D hoặc khối tiện, tranh Codex làm thiết kế và mặt vẽ (skill 2, mục Phẳng hay khối). Cố ý thì ghi  loai:ok <lý do>  trên dòng này')
            if 'kho:ok' in dong_khai: continue
            co = cung_loai(loai)
            if co:
                canh.append(f"CANH tu-ve-lai   {ten_f}:{so_dong}  <{ten}> tự viết, kho đã có {len(co)} món \"{loai}\": " + ', '.join(e['nhom'] + '/' + e['id'] for e in co[:5]) + (' …' if len(co) > 5 else '') + f'. Dùng lại món kho, hoặc ghi  kho:ok <lý do>  trên dòng này (tra: python3 tools/kho.py tim {loai})')
    for (kenh, ten), cho in sorted(theo_kenh.items()):
        if len(cho) > 1: canh.append(f'CANH trung-mon   kênh {kenh}: <{ten}> được viết ở {len(cho)} file: ' + ', '.join(cho) + '. Giữ một bản, file kia import lại')
    return canh, len(files)


if __name__ == '__main__':
    canh, n = kiem(sys.argv[1:])
    for d in canh: print(d)
    print(f'\nkiem_kho: {n} file; {len(canh)} cảnh báo')
