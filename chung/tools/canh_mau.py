#!/usr/bin/env python3
"""Thư viện CẢNH MẪU (573 khung của 202 bối cảnh, cắt từ hai video của kênh gốc): tra, ghép tấm, làm lưới đoán mù.
Thư viện nằm ở chung/skills/canh-mau/ (canh-mau.json, anh/<mã>.jpg, tam-loai/, cat-can/, MUC-LUC.md).

  python3 tools/canh_mau.py tim [--loai phong-am,phong-sang] [--trong | --ngoai] [--gio ngay|dem|chieu] [--co toan|trung|can]
                               [--van-hoa chau-au] [--tu "bàn, sách, cửa sổ"]
      in các khung khớp, gom theo bối cảnh (khung thấy rõ nền in trước); --tu tìm trong tên bối cảnh và đồ vật, không phân biệt dấu
  python3 tools/canh_mau.py ghep <ra.jpg> <mã> <mã> …
      ghép các khung đã chọn thành một tấm, mỗi ô ghi mã và tên bối cảnh; in đường dẫn từng ảnh
  python3 tools/canh_mau.py luoi <ra.jpg> <ảnh của mình> <mã> <mã> <mã> <mã> <mã>
      lưới 2x3 đánh chữ A–F cho phép "tấm lạc loài": năm khung mẫu và ảnh của mình ở một ô bất kì;
      chữ của ô mình ghi vào <ra bỏ đuôi>-vi-tri.txt (người rà chỉ đọc file này SAU khi đã đoán)
"""
import json, random, sys, unicodedata
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

TV = Path(__file__).resolve().parent.parent / 'skills' / 'canh-mau'
DS = json.load(open(TV / 'canh-mau.json'))
THEO = {d['id']: d for d in DS}


def chu(co):
    for f in ('/System/Library/Fonts/Helvetica.ttc', '/Library/Fonts/Arial.ttf'):
        try: return ImageFont.truetype(f, co)
        except OSError: pass
    return ImageFont.load_default()


def tron(s): return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c) != 'Mn').replace('đ', 'd')


def lay(ma):
    if ma not in THEO: sys.exit(f'không có mã {ma} trong thư viện (xem: python3 tools/canh_mau.py tim …)')
    return THEO[ma]


def tim(a):
    o = {'loai': None, 'tn': None, 'gio': None, 'co': None, 'vh': None, 'tu': []}; i = 0
    while i < len(a):
        k = a[i]
        if k == '--trong': o['tn'] = 'trong'
        elif k == '--ngoai': o['tn'] = 'ngoai'
        elif k in ('--loai', '--gio', '--co', '--van-hoa', '--tu') and i + 1 < len(a):
            v = a[i + 1]; i += 1
            if k == '--loai': o['loai'] = set(v.split(','))
            elif k == '--gio': o['gio'] = v
            elif k == '--co': o['co'] = v
            elif k == '--van-hoa': o['vh'] = tron(v)
            else: o['tu'] = [tron(t.strip()) for t in v.split(',') if t.strip()]
        else: sys.exit(f'không hiểu tham số {k}\n{__doc__}')
        i += 1
    ra = {}
    for d in DS:
        if o['loai'] and d['loai'] not in o['loai']: continue
        if o['tn'] and d['trong_ngoai'] != o['tn']: continue
        if o['gio'] and d['gio'] != o['gio']: continue
        if o['co'] and d['co_canh'] != o['co']: continue
        if o['vh'] and o['vh'] not in tron(d['van_hoa']): continue
        ch = tron(d['ten'] + ' ' + ' '.join(d.get('vat') or []))
        diem = sum(1 for t in o['tu'] if t in ch)
        if o['tu'] and not diem: continue
        ra.setdefault(d['ten'], []).append((diem, d))
    xep = sorted(ra.items(), key=lambda kv: (-max(x[0] for x in kv[1]), kv[0]))
    print(f'{sum(len(v) for v in ra.values())} khung của {len(ra)} bối cảnh (dấu * = khung thấy rõ nền). Ảnh: {TV}/anh/<mã>.jpg')
    for ten, lo in xep:
        d0 = lo[0][1]
        print(f"\n{ten}  [{d0['loai']}, {d0['trong_ngoai']}, {d0['gio']}, {d0['van_hoa']}]  vật: {', '.join((d0.get('vat') or [])[:8])}")
        print('   ' + '  '.join(f"{d['id']}{'*' if d['mau_tot'] else ''}({d['co_canh']})" for _, d in sorted(lo, key=lambda x: (not x[1]['mau_tot'], x[1]['id']))))


def ghep(a):
    if len(a) < 2: sys.exit(__doc__)
    ra, ds = Path(a[0]), [lay(m) for m in a[1:]]; cot = 3 if len(ds) <= 9 else 4; W, H = 640, 360; F = chu(22)
    sh = Image.new('RGB', (cot * W, ((len(ds) + cot - 1) // cot) * (H + 30)), (0, 0, 0)); dr = ImageDraw.Draw(sh)
    for k, d in enumerate(ds):
        x, y = (k % cot) * W, (k // cot) * (H + 30)
        sh.paste(Image.open(TV / d['file']).convert('RGB').resize((W, H), Image.LANCZOS), (x, y)); dr.text((x + 6, y + H + 3), f"{d['id']}  {d['ten']}  [{d['co_canh']}]"[:56], font=F, fill=(255, 255, 0))
    ra.parent.mkdir(parents=True, exist_ok=True); sh.save(ra, quality=88); print(f'tấm ghép: {ra.resolve()}  ({len({d["ten"] for d in ds})} bối cảnh)')
    for d in ds: print(f"  {TV / d['file']}  ({d['ten']})")


def luoi(a):
    if len(a) != 7: sys.exit('luoi cần: <ra.jpg> <ảnh của mình> và đúng 5 mã khung mẫu\n' + __doc__)
    ra, minh, ds = Path(a[0]), a[1], [lay(m) for m in a[2:]]; W, H = 960, 540; F = chu(54)
    o = [Image.open(TV / d['file']).convert('RGB').resize((W, H), Image.LANCZOS) for d in ds]; random.shuffle(o)
    vt = random.randrange(6); o.insert(vt, Image.open(minh).convert('RGB').resize((W, H), Image.LANCZOS))
    sh = Image.new('RGB', (3 * W, 2 * H), (0, 0, 0)); dr = ImageDraw.Draw(sh)
    for k, im in enumerate(o):
        x, y = (k % 3) * W, (k // 3) * H; sh.paste(im, (x, y)); dr.rectangle([x + 10, y + 10, x + 76, y + 76], fill=(0, 0, 0)); dr.text((x + 24, y + 12), 'ABCDEF'[k], font=F, fill=(255, 255, 255))
    ra.parent.mkdir(parents=True, exist_ok=True); sh.save(ra, quality=88); f = ra.with_name(ra.stem + '-vi-tri.txt'); f.write_text('ABCDEF'[vt] + '\n')
    print(f'lưới: {ra.resolve()}\nvị trí ô của mình ghi ở: {f.resolve()} (không ghi chữ đó vào báo cáo)')


if __name__ == '__main__':
    lenh = {'tim': tim, 'ghep': ghep, 'luoi': luoi}.get(sys.argv[1] if len(sys.argv) > 1 else '')
    if not lenh: sys.exit(__doc__)
    lenh(sys.argv[2:])
