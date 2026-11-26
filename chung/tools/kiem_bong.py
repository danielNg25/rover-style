"""Rà bóng đổ trong mã dựng cảnh three.js / react-three-fiber (không cần trình duyệt).

Dùng (từ gốc chung/):  python3 tools/kiem_bong.py [thư mục hoặc file ...]
Mặc định rà src/ và ../kenh/*/tap, ../kenh/*/boi-canh (bỏ node_modules, out/, _luu/, *.bak).
Thoát 1 nếu có lỗi chặn (canvas thiếu autoReceive, receiveShadow={false} không kèm userData noRecv).

Ba loại báo:
  LOI  canvas   <ThreeCanvas>/<Canvas> mà trong nó không gọi tới StageCam hay <AutoRecv /> (trực tiếp hay qua component khác):
                autoReceive không chạy, mesh nào quên receiveShadow sẽ không nhận bóng mà không báo gì.
  LOI  recv     receiveShadow={false} viết tay mà không có userData={{noRecv: true}}: autoReceive sẽ bật lại nhận bóng
                (và với VSMShadowMap, vật nhận bóng cũng ĐỔ bóng).
  CANH cast     mesh vật liệu nhận sáng (Lambert/Phong/Standard/Toon) mà không có castShadow. Vật đứng phải đổ bóng.
                Bỏ qua mặt nằm (plane/circle xoay -PI/2), mesh có userData noRecv. Cố ý không đổ bóng thì thêm
                chú thích  {/* bong:ok */}  hoặc  // bong:ok  trên cùng dòng.
  CANH canvas?  canvas chỉ chứa {children}: là khung bọc, xét ở nơi gọi nó.
"""
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
BO_QUA = ('/_thu-mau/', 'node_modules', '/out/', '/_luu/', '.bak', '/demo-before/')
VAT_SANG = re.compile(r'<mesh(Lambert|Phong|Standard|Physical|Toon)Material\b')
DINH_NGHIA = re.compile(r'(?:export\s+)?(?:const|function)\s+([A-Z]\w*)\b')


def cac_file(args):
    goc = [Path(a) for a in args] or [GOC / 'src', *GOC.parent.glob('kenh/*/tap'), *GOC.parent.glob('kenh/*/boi-canh')]
    for g in goc:
        for f in ([g] if g.is_file() else sorted(g.rglob('*.tsx'))):
            s = str(f)
            if not any(b in s for b in BO_QUA):
                yield f


def the_mo(src, i):
    """từ vị trí '<' của một thẻ JSX, trả (chỉ số sau '>', nội dung thuộc tính, tự đóng?) — bỏ qua '>' trong {...}"""
    sau, j = 0, i + 1
    while j < len(src):
        ch = src[j]
        if ch == '{': sau += 1
        elif ch == '}': sau -= 1
        elif ch == '>' and sau == 0:
            return j + 1, src[i:j + 1], src[j - 1] == '/'
        j += 1
    return len(src), src[i:], True


def dong(src, i):
    return src.count('\n', 0, i) + 1


def khoi_component(src):
    """{tên component: đoạn mã của nó} — đoạn từ định nghĩa tới định nghĩa kế tiếp"""
    m = list(DINH_NGHIA.finditer(src))
    return {a.group(1): src[a.start(): (m[k + 1].start() if k + 1 < len(m) else len(src))] for k, a in enumerate(m)}


def main(args):
    files = list(cac_file(args))
    ma = {f: f.read_text(encoding='utf-8', errors='replace') for f in files}
    # 1. component nào (trực tiếp hay gián tiếp) dựng StageCam / AutoRecv
    khoi = {}
    for f, s in ma.items():
        for ten, doan in khoi_component(s).items():
            khoi.setdefault(ten, []).append(doan)
    co = {'StageCam', 'AutoRecv'}
    doi = True
    while doi:
        doi = False
        for ten, ds in khoi.items():
            if ten not in co and any(re.search(r'<(%s)\b' % '|'.join(co), d) for d in ds):
                co.add(ten); doi = True
    mau_co = re.compile(r'<(%s)\b' % '|'.join(sorted(co)))

    loi, canh = [], []
    for f, s in ma.items():
        ten_f = f.relative_to(GOC.parent) if GOC.parent in f.parents else f
        # 2. canvas
        for m in re.finditer(r'<(ThreeCanvas|Canvas)\b', s):
            if re.match(r'<Canvas\s*[,:=]', s[m.start():]):
                continue
            het, tag_c, tu_dong = the_mo(s, m.start())
            if tu_dong or 'shadows' not in tag_c: continue      # canvas không bật bản đồ bóng: autoReceive không liên quan
            k = s.find('</%s>' % m.group(1), het)
            trong = s[het: k if k > 0 else len(s)]
            if mau_co.search(trong): continue
            if re.fullmatch(r'\s*\{\s*(props\.)?children\s*\}\s*', trong):
                canh.append(f'CANH canvas? {ten_f}:{dong(s, m.start())}  khung bọc {{children}}: xét ở nơi gọi'); continue
            loi.append(f'LOI  canvas  {ten_f}:{dong(s, m.start())}  không có StageCam / <AutoRecv /> bên trong')
        # 3. mesh
        for m in re.finditer(r'<mesh\b', s):
            het, tag, tu_dong = the_mo(s, m.start())
            dong_nay = s[s.rfind('\n', 0, m.start()) + 1: s.find('\n', m.start())]
            if 'noRecv' in tag or 'bong:ok' in dong_nay: continue
            if re.search(r'receiveShadow=\{false\}', tag):
                loi.append(f'LOI  recv    {ten_f}:{dong(s, m.start())}  receiveShadow={{false}} thiếu userData={{{{noRecv: true}}}}')
            if tu_dong:
                vl = tag
            else:
                k = s.find('</mesh>', het); vl = s[het: k if k > 0 else het]
            if not VAT_SANG.search(vl) and 'Lambert' not in tag: continue
            if 'castShadow' in tag: continue
            if re.search(r'<(plane|circle)Geometry', vl + tag) and re.search(r'rotation=\{\[\s*-\s*Math\.PI\s*/\s*2', tag): continue
            canh.append(f'CANH cast    {ten_f}:{dong(s, m.start())}  mesh nhận sáng không castShadow')
    # 3. lỗi ánh sáng trên NGƯỜI và bóng vẽ chồng (25/11/2026, cảnh thử khe suối; Daniel: "Itachi tối mà Shisui sáng, bóng thì một cục tròn dưới chân")
    for f, s in ma.items():
        ten_f = f.relative_to(GOC.parent) if GOC.parent in f.parents else f
        # tấm người bị xoay lệch khỏi máy bằng một số cụ thể: người là tấm phẳng ăn nắng, xoay đi thì cả người tối. rotY={-y}, {ry}… (xoay bù để tấm quay về máy) không tính
        for m in re.finditer(r'<(Puppet3|Nguoi)\b[^>]*\brotY=\{\s*(-?\d*\.?\d+)\s*\}', s):
            if abs(float(m.group(2))) > 0.15 and 'bong:ok' not in s[s.rfind('\n', 0, m.start()) + 1: s.find('\n', m.end())]:
                loi.append(f'LOI  xoay-nguoi {ten_f}:{dong(s, m.start())}  tấm người xoay {m.group(2)} rad: cả người tối đi so với người khác. Quay mặt bằng flip và hướng mắt, không xoay tấm')
        # vệt tròn vẽ dưới chân đã bỏ cho cả người lẫn đồ vật (Daniel 25/11/2026: "chỉ dùng 1 bóng, bỏ vệt tròn"): ContactShade đã tắt trong engine, lời gọi còn sót là thừa
        if '/kenh/' in str(f):
            for m in re.finditer(r'<ContactShade\b', s):
                canh.append(f'CANH bong-chong {ten_f}:{dong(s, m.start())}  <ContactShade> đã tắt trong engine (không còn vệt tròn dưới chân người hay đồ vật): bỏ lời gọi này; bóng của người do engine vẽ')
        # hai đèn cùng đổ bóng trong một bối cảnh của kênh: đồ vật ra hai bóng lệch hướng (video gốc: một hướng bóng cho cả cảnh)
        if '/kenh/' in str(f) and 'hai-den:ok' not in s:
            den = [m.start() for m in re.finditer(r'<Sun\b|<SceneLight\b|<Scene3\b', s)] + [m.start() for m in re.finditer(r'<(?:directionalLight|spotLight)\b[^>]*\bcastShadow', s)]
            if len(den) > 1:
                canh.append(f'CANH hai-den-bong {ten_f}:{dong(s, sorted(den)[1])}  file có {len(den)} đèn cùng đổ bóng: nếu chúng cùng bật trong một cảnh thì đồ vật ra hai bóng lệch hướng; soát lại, đèn phụ nên bỏ castShadow. Cố ý (hai trạng thái của một bối cảnh, vệt nắng nhiều cửa sổ) thì ghi  hai-den:ok  ở bất cứ đâu trong file')
        # đèn đổ bóng đặt PHÍA SAU sân khấu: bóng đổ về phía máy (Daniel 25/11/2026: "bóng đổ ra phía trước mặt, đáng ra nó phải phía sau").
        # Đọc được khi hướng là số cụ thể hoặc hằng [x, y, z] khai trong cùng file. Cảnh ngược sáng thật thì khai nguocSang trên đèn.
        for m in re.finditer(r'<(Sun|SceneLight|directionalLight)\b', s):
            het, tag, _ = the_mo(s, m.start()); loai = m.group(1)
            if 'nguocSang' in tag or 'nguoc-sang:ok' in s[s.rfind('\n', 0, m.start()) + 1: s.find('\n', het)]: continue
            if loai == 'directionalLight' and 'castShadow' not in tag: continue
            def v3(ten):
                k = re.search(r'\b' + ten + r'=\{([^{}]*)\}', tag)
                if not k: return None
                b = k.group(1).strip(); so = r'(-?\d*\.?\d+)'; mau = r'\[\s*' + so + r'\s*,\s*' + so + r'\s*,\s*' + so + r'\s*\]'
                g = re.fullmatch(mau, b)
                if not g and re.fullmatch(r'[A-Za-z_]\w*', b): g = re.search(r'\bconst\s+' + b + r'\b[^=\n]*=\s*' + mau, s)
                return tuple(float(x) for x in g.groups()) if g else None
            if loai == 'Sun':
                a, b = v3('from'), v3('to'); d = None if not (a and b) else (a[0] - b[0], a[2] - b[2])
            else:
                a = v3('dir' if loai == 'SceneLight' else 'position'); d = None if not a else (a[0], a[2])
            if d and d[1] < -0.15 * (d[0] ** 2 + d[1] ** 2) ** 0.5:
                sua = 'engine tự lật ra trước; sửa số cho đúng ý' if loai == 'SceneLight' else 'đặt đèn về phía máy (z của đèn lớn hơn z của đích)'
                (canh if loai == 'SceneLight' else loi).append(f'{"CANH" if loai == "SceneLight" else "LOI "} bong-ve-may {ten_f}:{dong(s, m.start())}  <{loai}> đặt phía SAU sân khấu (lệch z {d[1]:.1f}): bóng đổ về phía máy. {sua}; chỉ khi khung hình có nguồn sáng phía sau (cửa sổ tường sau, mặt trời thấp) thì khai nguocSang')
        # tự đặt độ nhoè mép bóng trong file kênh: engine đặt lại theo MEP_BONG_CM, số ghi tay không còn tác dụng
    # tự vá cách three tính bóng cho cả kênh (kể cả file .ts trong lib/ của kênh): mức nhoè mép bóng là của engine chung (MEP_BONG_CM trong lib3/kit.tsx)
    if not args:
        for f in sorted(GOC.parent.glob('kenh/*/lib/*.ts')) + sorted(GOC.parent.glob('kenh/*/lib/*.tsx')):
            if any(b in str(f) for b in BO_QUA): continue
            t = f.read_text(encoding='utf-8')
            if re.search(r'updateMatrices\s*=|getPrototypeOf\([^)]*\.shadow\)', t):
                canh.append(f'CANH bong-va    {f.relative_to(GOC.parent)}  file này vá cách three tính bóng cho cả kênh: mép bóng đã do engine chung đặt 6 cm (lib3/kit.tsx MEP_BONG_CM); bỏ bản vá riêng')
    canh.sort(key=lambda d: 0 if (d.startswith('CANH bong-') or d.startswith('CANH hai-den-bong')) else 1)   # cảnh báo về bóng chồng, bóng về máy, bản vá bóng in trước (danh sách bị cắt ở 400 dòng)
    for d in loi: print(d)
    so_canh = len(canh)
    for d in canh[:400]: print(d)
    if so_canh > 400: print(f'... và {so_canh - 400} cảnh báo nữa')
    print(f'\n{len(files)} file; {len(loi)} lỗi, {so_canh} cảnh báo')
    return 1 if loi else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
