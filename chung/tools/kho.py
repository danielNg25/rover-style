#!/usr/bin/env python3
"""Kho asset của cutout3d.   Chạy trong cutout3d/chung (đường cũ rover-lab vẫn trỏ tới đây), ngoài sandbox (Chrome không khởi động được trong sandbox).

  python3 tools/kho.py                 dựng ảnh mọi món + mục lục + kiểm
  python3 tools/kho.py anh [id ...]    chỉ dựng ảnh (tất cả, hoặc vài món theo id)
  python3 tools/kho.py bo-canh [id..]  dựng ảnh các bối cảnh (mỗi bối cảnh một lượt dựng riêng, chậm)
  python3 tools/kho.py muc-luc         viết DANH-MUC.md và các tấm tổng hợp _tong-hop/<nhóm>.jpg của từng danh mục
  python3 tools/kho.py kiem            món nào thiếu ảnh, ảnh nào thừa, món nào trong thư viện chưa vào kho
  python3 tools/kho.py tim <từ> ... [--nhom thien-nhien]   tìm món theo TỪ NGUYÊN VẸN trong tên, mô tả, chỗ hợp; gõ có dấu thì khớp đúng dấu (`tim đá`), không dấu cũng được; --nhom lọc theo nhóm

HAI DANH MỤC (23/11/2026), gộp lại khi dùng:
  chung:  assets/catalog.json, ảnh assets/<nhom>/<id>.png, ảnh xem trước trong src/catalog/Catalog.tsx (PREVIEWS),
          composition `kho-asset`, mục lục assets/DANH-MUC.md. Mọi món có code trong chung/src. `kenh` = "chung".
  kênh:   ../kenh/<kênh>/kho/catalog.json, ảnh ../kenh/<kênh>/kho/<nhom>/<id>.png, ảnh xem trước trong
          ../kenh/<kênh>/kho/Previews.tsx (PREVIEWS_KENH), composition `kho-asset-<kênh>`, mục lục ../kenh/<kênh>/kho/DANH-MUC.md.
          Món chỉ có nghĩa với kênh đó (nhân vật, bối cảnh có người của kênh). `kenh` = tên kênh.
Kênh là kênh đang làm (dang-lam.yaml, ghi đè bằng KENH=...). Kênh chưa có kho/catalog.json thì chỉ có danh mục chung.
Mỗi phiên kênh chỉ ghi vào danh mục của kênh mình; danh mục chung chỉ đổi khi thêm món vào thư viện chung.
KHO_RA=<thư mục>: `anh` và `bo-canh` ghi ảnh vào <thư mục>/<chung|kênh>/<nhom>/<id>.png thay vì vào kho (để so)."""
import json, os, re, shutil, subprocess, sys, unicodedata
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dang_lam import OUT, ENTRY  # ../kenh/<kênh>/out theo dang-lam.yaml, cùng chỗ ./still.sh ghi ảnh
OUT = str(OUT)
from chrome import bx
BX = bx()   # Chrome không đầu: tools/chrome.py (không ghi cứng theo máy)
GROUPS = [('bo-canh', 'Bối cảnh dựng sẵn'), ('nhan-vat', 'Nhân vật, nét mặt, tư thế'), ('nha-cua', 'Nhà cửa'), ('do-ngoai-troi', 'Đồ ngoài trời'), ('nha-ga-xe-lua', 'Nhà ga, xe lửa'),
          ('do-trong-nha', 'Đồ trong nhà'), ('thien-nhien', 'Cây, cỏ, đá'), ('con-vat', 'Con vật'), ('nen-xa', 'Nền xa (vẽ trên tấm nền)'), ('hieu-ung', 'Hiệu ứng, chuyển động của cảnh'), ('cong-cu', 'Công cụ dựng (không có ảnh)')]
LIBS = ['src/lib3/depth.tsx', 'src/lib3/kit.tsx', 'src/lib3/room.tsx', 'src/lib3/kitCampus.tsx', 'src/lib3/kitLab.tsx', 'src/lib3/fx.tsx', 'src/lib3/kitNyStreet.tsx', 'src/lib3/kitHomeCorner.tsx', 'src/lib3/kitChicagoFair.tsx', 'src/lib3/kitForge.tsx', 'src/lib3/kitSanhNgai.tsx', 'src/lib3/kitCamp.tsx', 'src/lib3/kitLeuThayLang.tsx', 'src/lib3/kitBanDo.tsx', 'src/lib3/kitPhongNgu.tsx', 'src/lib3/kitCoiLua.tsx', 'src/lib3/kitNuiTuyet.tsx', 'src/lib3/kitGiayTo.tsx', 'src/lib3/kitHanhLy.tsx', 'src/lib3/kitDiaCau.tsx', 'src/lib3/kitGiangDuong.tsx', 'src/lib3/buiNguon.tsx', 'src/lib3/kieuMay.ts', 'src/lib3/chuyenCanh.tsx', 'src/lib3/chuyenCanhMay.tsx', 'src/lib3/khoiTuAnh.tsx']
# tên xuất ra từ thư viện nhưng không phải một món (hằng số, hàm phụ)
# Kiểu cũ, Daniel bỏ khỏi kho 25/11/2026 (núi chia hai màu theo sống dọc, đá nhiều mặt tam giác); code còn vì tập Doom đã dựng bằng chúng. KHÔNG dùng cho cảnh mới.
BO_KHOI_KHO = set('paintPeak paintPeaks StandRock RockShelter RockMass SnowRock'.split())
SKIP = set('VIEW ShotCtx RiseCtx rnd P ribbon Flame RoomCtx canvasTex once bookTex deskTex Spr HALL DORM MACHINE DESK CALC_LINES tex flowerTex Pal3 Ctx Two ELBOW'.split()) | BO_KHOI_KHO

from dang_lam import KENH, KENH_DIR
KD = os.path.join(str(KENH_DIR), 'kho')
KHO_RA = os.environ.get('KHO_RA')
# nguồn: (tên, thư mục ảnh, catalog, file ảnh xem trước, composition)
SRCS = [('chung', A, os.path.join(A, 'catalog.json'), os.path.join(ROOT, 'src/catalog/Catalog.tsx'), 'kho-asset')]
if os.path.isfile(os.path.join(KD, 'catalog.json')): SRCS.append((KENH, KD, os.path.join(KD, 'catalog.json'), os.path.join(KD, 'Previews.tsx'), 'kho-asset-' + KENH))

def cat_of(src):
    c = json.load(open(src[2]))
    for e in c: e['_src'] = src[0]
    return c
def cat(): return [e for s in SRCS for e in cat_of(s)]
def src_of(name): return next(s for s in SRCS if s[0] == name)
def seq(c): return [e for e in c if e.get('anh', True) and 'comp' not in e]
def png(e, ra=False):
    base = os.path.join(KHO_RA, e['_src']) if (ra and KHO_RA) else src_of(e['_src'])[1]
    return os.path.join(base, e['nhom'], e['id'] + '.png')
def plain(s): return ''.join(ch for ch in unicodedata.normalize('NFD', s.lower().replace('đ', 'd')) if unicodedata.category(ch) != 'Mn')
def run(cmd): return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)

def anh(ids):
    total = 0
    for src in SRCS:
        items = seq(cat_of(src)); want = [i for i, e in enumerate(items) if not ids or e['id'] in ids]
        if not want: continue
        out = os.path.join(OUT, 'kho-seq'); shutil.rmtree(out, ignore_errors=True)
        # các id rời nhau: dựng từng khoảng liền nhau
        spans, a = [], want[0]
        for i, j in zip(want, want[1:] + [None]):
            if j != i + 1: spans.append((a, i)); a = j
        for a, b in spans:
            r = run(['npx', 'remotion', 'render', ENTRY, src[4], out, '--sequence', '--image-format=png', f'--frames={a}-{b}', f'--browser-executable={BX}', '--concurrency=3', '--log=error'])
            if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit(1)
        for fn in sorted(os.listdir(out)):
            m = re.search(r'(\d+)\.png$', fn)
            if not m: continue
            e = items[int(m.group(1))]; d = png(e, True); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.move(os.path.join(out, fn), d); total += 1
    print(f'đã dựng {total} ảnh' + (f' vào {KHO_RA}' if KHO_RA else ' vào kho'))

def bo_canh(ids):
    for e in cat():
        if 'comp' not in e or (ids and e['id'] not in ids): continue
        r = run(['./still.sh', e['comp'], '0']); src = os.path.join(OUT, f"{e['comp']}-0.png")
        if not os.path.exists(src): print('HỎNG', e['comp'], r.stdout[-400:]); continue
        d = png(e, True); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy(src, d); print('bối cảnh', e['id'])

def muc_luc():
    for src in SRCS: muc_luc_of(src)

def muc_luc_of(src):
    c = cat_of(src); A_ = src[1]; ten = 'chung' if src[0] == 'chung' else f'kênh {src[0]}'
    L = [f'# Danh mục kho asset của cutout3d ({ten})', '',
        'File này do `python3 tools/kho.py muc-luc` viết ra từ `catalog.json` cùng thư mục; đừng sửa tay. Thêm món: thêm một mục vào `catalog.json` của danh mục (chung: `chung/assets/`, kênh: `kenh/<kênh>/kho/`), một ảnh xem trước vào file PREVIEWS của danh mục đó, rồi chạy `python3 tools/kho.py`.', '',
        'Tìm nhanh: `python3 tools/kho.py tim <từ>` (ví dụ `tim den`, `tim san truong`). Tấm tổng hợp từng nhóm: `_tong-hop/` cùng thư mục.' + ('' if src[0] == 'chung' else ' Món dùng chung cho mọi kênh: `cutout3d/chung/assets/DANH-MUC.md`.'), '',
        f'Tổng cộng {len(c)} mục.', '']
    os.makedirs(os.path.join(A_, '_tong-hop'), exist_ok=True)
    for g, title in GROUPS:
        es = [e for e in c if e['nhom'] == g]
        if not es: continue
        L += [f'## {title} ({len(es)})', '']
        if g == 'cong-cu':
            L += ['| Tên | Là gì | Dùng cho | Cách gọi | Code |', '|---|---|---|---|---|']
            L += [f"| **{e['ten']}** | {e['mo_ta']} | {e['hop_voi']} | `{e['goi']}` | `{e['code']}` |" for e in es]
        else:
            L += ['| Ảnh | Tên và id | Trông thế nào | Hợp với | Cách gọi | Code |', '|---|---|---|---|---|---|']
            for e in es:
                img = f"<img src=\"{g}/{e['id']}.png\" width=\"200\">" if os.path.exists(png(e)) else 'CHƯA CÓ ẢNH'
                L.append(f"| {img} | **{e['ten']}**<br>`{e['id']}`{'' if e.get('kenh', 'chung') == 'chung' else '<br>kênh `' + e['kenh'] + '`'} | {e['mo_ta']} | {e['hop_voi']} | `{e['goi']}`{' ; comp `' + e['comp'] + '`' if 'comp' in e else ''} | `{e['code']}` |")
            have = [png(e) for e in es if os.path.exists(png(e))]
            if have:
                cols = 3 if g == 'bo-canh' else 5; rows = -(-len(have) // cols); lst = os.path.join(OUT, '_kho-list.txt'); os.makedirs(os.path.dirname(lst), exist_ok=True)
                open(lst, 'w').write(''.join(f"file '{p}'\nduration 1\n" for p in have))
                run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', (f'scale=640:360,tile={cols}x{rows}' if g == 'bo-canh' else f'scale=480:360,tile={cols}x{rows}'), '-frames:v', '1', '-update', '1', '-q:v', '3', os.path.join(A_, '_tong-hop', g + '.jpg')])
        L.append('')
    open(os.path.join(A_, 'DANH-MUC.md'), 'w').write('\n'.join(L)); print(f'đã viết {os.path.relpath(A_, ROOT)}/DANH-MUC.md và _tong-hop/')

def kiem():
    ok = True
    for src in SRCS:
        c = cat_of(src); ids = {e['id'] for e in c}; name = src[0]
        pf = src[3]; prev = set(re.findall(r"^  '([a-z0-9-]+)':", open(pf).read(), re.M)) if os.path.exists(pf) else set()
        for e in c:
            if e.get('anh', True) and not os.path.exists(png(e)): print('THIẾU ẢNH     ', name, e['nhom'] + '/' + e['id']); ok = False
            if e.get('anh', True) and 'comp' not in e and e['id'] not in prev: print('THIẾU PREVIEW ', e['id'], f'({os.path.relpath(pf, ROOT)})'); ok = False
            if '??' in e['mo_ta']: print('THIẾU MÔ TẢ   ', e['id']); ok = False
            if e.get('kenh') != name: print('SAI DANH MỤC  ', e['id'], 'kenh =', repr(e.get('kenh')), 'mà nằm trong danh mục', name); ok = False
        for p in sorted(prev - ids): print('PREVIEW THỪA  ', name, p); ok = False
        for g, _ in GROUPS:
            d = os.path.join(src[1], g)
            for fn in (sorted(os.listdir(d)) if os.path.isdir(d) else []):
                if fn.endswith('.png') and fn[:-4] not in ids: print('ẢNH THỪA      ', name, g + '/' + fn); ok = False
    allids = [e['id'] for e in cat()]
    for i in sorted({i for i in allids if allids.count(i) > 1}): print('TRÙNG ID      ', i); ok = False
    # thư viện chung phải vào kho CHUNG (để đúng cả khi không có kênh nào)
    text = ' '.join(e['goi'] + ' ' + e['mo_ta'] + ' ' + e['ten'] for e in cat_of(SRCS[0]))
    for lib in LIBS:
        for name in re.findall(r'^export const ([A-Za-z0-9_]+)', open(os.path.join(ROOT, lib)).read(), re.M):
            if name not in SKIP and not re.search(r'\b' + name + r'\b', text): print('CHƯA VÀO KHO  ', name, f'({lib})'); ok = False
    print('kho đủ và khớp' if ok else 'kho CHƯA khớp: sửa các dòng trên')
    return ok

def tim(words):
    """Tìm món theo TỪ NGUYÊN VẸN (sửa 25/11/2026: trước đây khớp theo khúc chữ nên `tim da` ra cả "dãy", "đài", món cần tìm bị chìm).
    Từ gõ CÓ DẤU thì khớp đúng dấu (`đá` không dính `đa`, `dạ`); gõ không dấu thì bỏ dấu cả hai bên. Món có đủ các từ ngay trong TÊN in trước."""
    def tu(s, giu_dau): return re.findall(r'[^\W_]+', unicodedata.normalize('NFC', s.lower().replace('-', ' ')) if giu_dau else plain(s.replace('-', ' ')))
    nhom = None
    if '--nhom' in words: k = words.index('--nhom'); nhom = words[k + 1] if k + 1 < len(words) else None; words = words[:k] + words[k + 2:]
    ws = [w for x in words for w in unicodedata.normalize('NFC', x).split()]
    ra = []
    for e in cat():
        if nhom and e['nhom'] != nhom: continue
        ten_d, ca_d = tu(e['ten'], True), tu(' '.join([e['ten'], e['mo_ta'], e['hop_voi']]), True)
        ten_k, ca_k = tu(e['id'] + ' ' + e['ten'], False), tu(' '.join([e['id'], e['ten'], e['mo_ta'], e['hop_voi']]), False)
        co_dau = [plain(w) != w.lower() for w in ws]
        if all((w.lower() in ca_d) if d else (plain(w) in ca_k) for w, d in zip(ws, co_dau)):
            o_ten = all((w.lower() in ten_d) if d else (plain(w) in ten_k) for w, d in zip(ws, co_dau))
            ra.append((0 if o_ten else 1, e))
    for _, e in sorted(ra, key=lambda x: x[0]):
        print(f"{e['nhom']}/{e['id']}\n   {e['ten']}: {e['mo_ta']}\n   hợp với: {e['hop_voi']}\n   gọi: {e['goi']}   [{e['code']}]\n")
    print(f"{len(ra)} món khớp {' + '.join(ws)}" + ('' if ra else ': thử từ khác, hoặc mở assets/DANH-MUC.md'))

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: anh([]); muc_luc(); kiem()
    elif a[0] == 'anh': anh(a[1:])
    elif a[0] == 'bo-canh': bo_canh(a[1:])
    elif a[0] == 'muc-luc': muc_luc()
    elif a[0] == 'kiem': sys.exit(0 if kiem() else 1)
    elif a[0] == 'tim': tim(a[1:])
    else: print(__doc__)
