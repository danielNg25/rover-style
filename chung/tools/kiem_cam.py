"""KIỂM CẤM: file của kênh tự tắt hoặc đi vòng các thứ engine đang giữ (không cần trình duyệt). kiem_canh.py tự gọi công cụ này.

Daniel, 26/11/2026: "Hiện tại có lỗi agent tự tắt các tính năng ko theo engine nữa". Bốn bối cảnh mới của một tập qua hai vòng dựng,
ba công cụ kiểm báo 0 lỗi, trong khi code tắt bóng cây, lọc màu ảnh, ép thứ tự vẽ, tự viết tấm ảnh thay Pic2D.

Dùng (từ gốc chung/):  python3 tools/kiem_cam.py [thư mục hoặc file ...]        mặc định rà mọi file .tsx/.ts của ../kenh/*/
                       python3 tools/kiem_cam.py --lap-moc [kênh ...] [--tru <file> ...]   lập MỐC cho kênh chưa có (xem dưới);
                                                                 --tru: file đang dựng dở, chưa duyệt, KHÔNG đưa vào mốc
Thoát 1 nếu có LOI. Chỉ rà file của kênh (đường dẫn có /kenh/); engine trong chung/src dùng các thứ này hợp lệ.

  LOI  tat-bong         cast={false} / castShadow={false} trên một món không phải khối B (cây, bụi, tấm ảnh, món kho): vật đứng phải đổ bóng
                        (thẻ luật 5). Chi tiết mỏng ráp bằng B thì được (skill 2). Cố ý: ghi  bong:ok <lý do>  cùng dòng.
  LOI  loc-mau          bộ lọc màu của canvas/CSS (hue-rotate, saturate, sepia, grayscale, contrast, brightness): không lọc màu hậu kỳ,
                        không tô lại ảnh món bằng bộ lọc (thẻ luật 11). Màu sai thì sửa ở nguồn: lời tả Codex, màu vật liệu, đèn.
  LOI  ep-thu-tu        renderOrder ghi tay: vật nào che vật nào do vị trí 3D quyết định (thẻ luật 3).
  LOI  tam-anh-tu-viet  mesh đứng có planeGeometry + map mà không castShadow: tấm ảnh tự viết thay Sprite / Pic2D / Plate của engine,
                        mất bóng và mất lớp che (skill 2, mục Phẳng hay khối).
  LOI  da-phang         paintRock(...): đá vẽ thành tấm phẳng. Đá là KHỐI (thẻ luật 13): lấy món đá khối của kho (python3 tools/kho.py tim đá)
                        hoặc dựng khối theo tranh Codex. Daniel 27/11/2026: "đá thì đáng ra phải là 3d, thì lại làm 2d".
  LOI  cay-co-tu-ve     file của kênh tự viết hàm vẽ cây, cỏ, bụi, lá, tán bằng canvas (ve…/paint…/draw… có Cay, Tree, Tuft, Grass, Bui,
                        Bush, Leaf, Thong, Pine, Maple…): cây cỏ lấy nét từ ảnh gen kiểu giấy cắt, không tự vẽ bằng code (thẻ luật 13).
  LOI  lat-sang-toi     <Sprite … flip> trên món vẽ hai sắc sáng/tối (paintTuft, paintRock, bảng màu light/dark): lật gương làm mặt sáng
                        đổi bên, cả cảnh phải sáng cùng một phía.
  CANH den-diem         <pointLight> tự đặt: đèn bàn, đèn lồng, lửa lấy món kho có sẵn đèn (thẻ luật 5).
  CANH lop-am           warm / warmAmount khác 0: lớp ấm phủ cả khung đã bỏ khỏi mặc định (Daniel 26/11: "nên bỏ lớp ấm đi").
Bỏ qua một dòng cố ý: ghi  cam:ok <lý do>  cùng dòng (báo Daniel lý do).

MỐC (luật mới chỉ áp cho chương sau; thứ đã duyệt không đổi): kenh/<kênh>/kiem-cam-moc.json ghi số chỗ đã có của từng file lúc lập mốc.
File có số chỗ không vượt mốc thì không báo; vượt mốc thì báo cả file. File chưa có trong mốc (file mới) thì chỗ nào cũng báo.
Mốc chỉ lập MỘT lần cho mỗi kênh; đã có thì --lap-moc từ chối. Lập lại mốc là việc Daniel quyết.
Khi công cụ có MÃ MỚI:  python3 tools/kiem_cam.py --bo-sung-moc <mã> [mã…] [--tru <file> …]  ghi thêm số chỗ của RIÊNG các mã đó vào mốc
đã có (không đụng số của mã cũ; mã nào mốc đã ghi rồi thì bỏ qua). --tru: file đang dựng dở, chưa duyệt, không đưa vào mốc.
"""
import json
import re
import sys
import time
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
KENH = GOC.parent / 'kenh'
BO_QUA = ('/_thu-mau/', 'node_modules', '/out/', '/_luu/', '.bak', '/cong-cu/', '/demo-before/')
LOI_MA = {'tat-bong', 'loc-mau', 'ep-thu-tu', 'tam-anh-tu-viet', 'da-phang', 'cay-co-tu-ve', 'lat-sang-toi', 'gradient'}
# gradient THẲNG tô màu đặc lên người, đồ vật, tường, sàn, cây (Daniel 27/11/2026: "kênh của mình tuyệt đối không có gradient, kiểu cắt giấy mà").
# KHÔNG bắt: gradient tròn (quầng đèn, lửa, hạt), dải mờ trong suốt rgba (vệt nắng, bóng, mặt nạ) và trời: "2 cái ánh sáng này để nguyên".
RX_GRADIENT = re.compile(r'createLinearGradient\s*\(|linear-gradient\s*\(|<linearGradient\b')
RX_TROI = re.compile(r'sky|tr[oờ]i|hoang.?hon|binh.?minh|chan.?troi', re.I)
RX_TU_VE = re.compile(r'\b(?:const|function)\s+((?:ve|paint|draw)\w*?(?:Cay|Tree|Tuft|Grass|Bush|Leaf|Thong|Pine|Maple|Bui(?=[A-Z]|\b)|Tan(?=[A-Z]|\b)|La(?=[A-Z]|\b)|Co(?=[A-Z]|\b))\w*)\s*(?:=\s*\(|\()')
LOI_TA = {
    'da-phang': 'paintRock: đá vẽ thành tấm phẳng. Đá là KHỐI (thẻ luật 13): lấy món đá khối của kho (python3 tools/kho.py tim đá) hoặc dựng khối theo tranh Codex',
    'cay-co-tu-ve': 'hàm tự vẽ cây, cỏ, bụi, lá bằng canvas: cây cỏ lấy nét từ ảnh gen kiểu giấy cắt (./gen.sh, thẻ luật 13), không tự vẽ bằng code. Tên hàm trùng chữ nhưng không phải cây cỏ (cờ, cổ…) thì ghi  cam:ok <là gì>',
    'gradient': 'tô chuyển sắc (gradient thẳng, màu đặc) lên người, đồ vật, tường, sàn, cây: kênh vẽ kiểu giấy cắt, mỗi mảng MỘT màu phẳng; cần mặt tối thì thêm một mảng phẳng thứ hai (thẻ luật 13). Quầng sáng, vệt nắng trong suốt và trời không bị bắt; dòng là trời mà bị bắt thì ghi  cam:ok trời',
    'lat-sang-toi': 'Sprite lật gương (flip) trên món hai sắc sáng/tối: mặt sáng đổi bên. Cả cảnh sáng cùng một phía: bỏ flip, muốn khác dáng thì đổi seed, cỡ hoặc dùng món khác',
    'tat-bong': 'tắt bóng của một món không phải khối B: vật đứng phải đổ bóng (thẻ luật 5). Chi tiết mỏng thì ráp bằng B; cố ý thì ghi  bong:ok <lý do>',
    'loc-mau': 'lọc màu bằng bộ lọc canvas/CSS: không lọc màu hậu kỳ, không tô lại ảnh món (thẻ luật 11). Chỉnh nhẹ màu một ảnh thì dùng tham số chinh của Pic2D; còn lại sửa ở nguồn: lời tả Codex, màu vật liệu, đèn',
    'ep-thu-tu': 'renderOrder ghi tay: vật nào che vật nào do vị trí 3D quyết định (thẻ luật 3). Đặt vật ở đúng độ sâu của nó',
    'tam-anh-tu-viet': 'tấm ảnh đứng tự viết (planeGeometry + map, không castShadow): dùng Sprite / Pic2D / Plate của engine, tự viết thì mất bóng và lớp che (skill 2)',
    'den-diem': '<pointLight> tự đặt: đèn bàn, đèn lồng, lửa lấy món kho có sẵn đèn; engine giữ trần sáng (thẻ luật 5)',
    'lop-am': 'lớp ấm phủ cả khung (warm / warmAmount khác 0): đã bỏ khỏi mặc định của Finish, không bật lại ở cảnh',
}
THEO_DONG = [
    ('loc-mau', re.compile(r'\b(hue-rotate|saturate|sepia|grayscale|contrast|brightness)\(')),
    ('ep-thu-tu', re.compile(r'\brenderOrder\s*(=\s*\{|[:=]\s*-?\d)')),
    ('den-diem', re.compile(r'<pointLight\b')),
    ('lop-am', re.compile(r'''\bwarm(Amount)?\s*[=:]\s*\{?\s*(["'][^"']+["']|\d*\.?\d*[1-9])''')),
]


def the_mo(src, i):
    sau, j = 0, i + 1
    while j < len(src):
        ch = src[j]
        if ch == '{': sau += 1
        elif ch == '}': sau -= 1
        elif ch == '>' and sau == 0: return j + 1, src[i:j + 1]
        j += 1
    return len(src), src[i:]


def cho_sai(s):
    """[(mã, số dòng)] của một file"""
    ra, dong = [], s.split('\n')
    def dau(i): return s.count('\n', 0, i) + 1
    def mien(ln, *the): return any(t in dong[ln - 1] for t in ('cam:ok',) + the)
    for k, d in enumerate(dong, 1):
        if 'cam:ok' in d: continue
        for ma, rx in THEO_DONG:
            if rx.search(d): ra.append((ma, k))
        if re.search(r'\bpaintRock\s*\(', d) and not re.search(r'\b(const|function)\s+paintRock\b', d): ra.append(('da-phang', k))
        if RX_TU_VE.search(d) and re.search(r'Canvas|Ctx|\bc\s*[:,)]', d): ra.append(('cay-co-tu-ve', k))
        if RX_GRADIENT.search(d) and 'rgba(' not in d and 'transparent' not in d and not RX_TROI.search(' '.join(dong[max(0, k - 3):k])): ra.append(('gradient', k))
    for m in re.finditer(r'<Sprite\b', s):
        _, tag = the_mo(s, m.start())
        if re.search(r'paintTuft|paintRock|\blight\s*:', tag) and re.search(r'\bflip\b(?!\s*=\s*\{\s*false\s*\})', tag) and not mien(dau(m.start())): ra.append(('lat-sang-toi', dau(m.start())))
    for m in re.finditer(r'<([A-Z]\w*)\b', s):
        if m.group(1) == 'B': continue
        _, tag = the_mo(s, m.start())
        c = re.search(r'\bcast(Shadow)?=\{false\}', tag)
        if c and not mien(dau(m.start()), 'bong:ok') and not mien(dau(m.start() + c.start()), 'bong:ok'): ra.append(('tat-bong', dau(m.start() + c.start())))
    for m in re.finditer(r'<mesh\b', s):
        het, tag = the_mo(s, m.start())
        if tag.endswith('/>') or 'castShadow' in tag or re.search(r'rotation=\{\[\s*-\s*Math\.PI\s*/\s*2', tag): continue
        k = s.find('</mesh>', het); than = s[het: k if k > 0 else het]
        if '<planeGeometry' in than and re.search(r'\bmap=', than) and not mien(dau(m.start())): ra.append(('tam-anh-tu-viet', dau(m.start())))
    return sorted(set(ra), key=lambda x: (x[1], x[0]))


def cua_kenh(f):
    """(tên kênh, đường dẫn tính từ thư mục kênh) hoặc (None, None)"""
    try: r = f.resolve().relative_to(KENH)
    except ValueError: return None, None
    return (r.parts[0], '/'.join(r.parts[1:])) if len(r.parts) > 1 else (None, None)


def cac_file(args):
    goc = [Path(a) for a in args] or sorted(p for p in KENH.glob('*') if p.is_dir())
    for g in goc:
        for f in ([g] if g.is_file() else sorted(list(g.rglob('*.tsx')) + list(g.rglob('*.ts')))):
            s = str(f.resolve())
            if '/kenh/' in s and not any(b in s for b in BO_QUA): yield f


def doc_moc(kenh):
    try: return json.loads((KENH / kenh / 'kiem-cam-moc.json').read_text(encoding='utf-8'))
    except (OSError, ValueError): return None


def kiem(files):
    """trả (loi[], canh[], số chỗ cũ nằm trong mốc)"""
    loi, canh, cu, moc = [], [], 0, {}
    for f in files:
        f = Path(f); kenh, rel = cua_kenh(f)
        if kenh is None or any(b in str(f.resolve()) for b in BO_QUA): continue
        try: sai = cho_sai(f.read_text(encoding='utf-8', errors='replace'))
        except OSError: continue
        if kenh not in moc: moc[kenh] = doc_moc(kenh)
        m = ((moc[kenh] or {}).get('file') or {}).get(rel, {})
        dem = {}
        for ma, _ in sai: dem[ma] = dem.get(ma, 0) + 1
        ten = f.resolve().relative_to(GOC.parent)
        for ma, ln in sai:
            if dem[ma] <= m.get(ma, 0): cu += 1; continue
            them = f' [file này có {m[ma]} chỗ từ trước mốc, giờ {dem[ma]}: thừa {dem[ma] - m[ma]}]' if m.get(ma) else ''
            (loi if ma in LOI_MA else canh).append(f'{"LOI " if ma in LOI_MA else "CANH"} {ma:<16}{ten}:{ln}  {LOI_TA[ma]}{them}')
    return loi, canh, cu


def lap_moc(args):
    tru = {str(Path(a).resolve()) for a in args[args.index('--tru') + 1:]} if '--tru' in args else set()
    ten_kenh = args[:args.index('--tru')] if '--tru' in args else args
    for k in ten_kenh or sorted(p.name for p in KENH.glob('*') if p.is_dir() and not p.name.startswith('_')):
        dich = KENH / k / 'kiem-cam-moc.json'
        if dich.exists(): print(f'{k}: đã có mốc (lập {doc_moc(k).get("lap", "?")}); không lập lại. Lập lại mốc là việc Daniel quyết.'); continue
        so, tong = {}, 0
        for f in cac_file([str(KENH / k)]):
            if str(f.resolve()) in tru: continue
            dem = {}
            for ma, _ in cho_sai(f.read_text(encoding='utf-8', errors='replace')): dem[ma] = dem.get(ma, 0) + 1
            if dem: so[cua_kenh(f)[1]] = dem; tong += sum(dem.values())
        dich.write_text(json.dumps({'lap': time.strftime('%Y-%m-%d %H:%M'), 'ghi_chu': 'số chỗ kiem_cam.py đã thấy lúc lập mốc; file không vượt mốc thì không báo', 'file': so}, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{k}: lập mốc {tong} chỗ cũ ở {len(so)} file → {dich.relative_to(GOC.parent)}')
    return 0


def bo_sung_moc(args):
    """Công cụ có mã mới: ghi số chỗ của RIÊNG các mã đó vào mốc đã có, để file đã duyệt không bị báo. Không đụng số của mã cũ."""
    tru = {str(Path(a).resolve()) for a in args[args.index('--tru') + 1:]} if '--tru' in args else set()
    ma_moi = set(args[:args.index('--tru')] if '--tru' in args else args)
    if not ma_moi or not ma_moi <= set(LOI_TA): print('Dùng: --bo-sung-moc <mã> [mã…] [--tru <file> …]; mã có: ' + ', '.join(sorted(LOI_TA))); return 2
    for k in sorted(p.name for p in KENH.glob('*') if p.is_dir() and not p.name.startswith('_')):
        dich, moc = KENH / k / 'kiem-cam-moc.json', doc_moc(k)
        if moc is None: print(f'{k}: chưa có mốc, bỏ qua (lập bằng --lap-moc)'); continue
        da = set(moc.get('bo_sung', {}))
        lam = ma_moi - da
        if not lam: print(f'{k}: mốc đã ghi {", ".join(sorted(ma_moi))} rồi; không ghi lại.'); continue
        tong = 0
        for f in cac_file([str(KENH / k)]):
            if str(f.resolve()) in tru: continue
            dem = {}
            for ma, _ in cho_sai(f.read_text(encoding='utf-8', errors='replace')):
                if ma in lam: dem[ma] = dem.get(ma, 0) + 1
            if dem: moc.setdefault('file', {}).setdefault(cua_kenh(f)[1], {}).update(dem); tong += sum(dem.values())
        moc.setdefault('bo_sung', {}).update({ma: time.strftime('%Y-%m-%d %H:%M') for ma in lam})
        dich.write_text(json.dumps(moc, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{k}: ghi thêm {tong} chỗ cũ của {", ".join(sorted(lam))} vào mốc')
    return 0


def main(args):
    if args and args[0] == '--lap-moc': return lap_moc(args[1:])
    if args and args[0] == '--bo-sung-moc': return bo_sung_moc(args[1:])
    files = list(cac_file(args))
    loi, canh, cu = kiem(files)
    for d in loi + canh[:200]: print(d)
    if len(canh) > 200: print(f'... và {len(canh) - 200} cảnh báo nữa')
    print(f'\nkiem_cam: {len(files)} file; {len(loi)} lỗi, {len(canh)} cảnh báo' + (f'; bỏ qua {cu} chỗ có từ trước mốc' if cu else ''))
    return 1 if loi else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
