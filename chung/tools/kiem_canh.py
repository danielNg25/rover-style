"""Rà dàn cảnh, máy quay và hạt trong file cảnh quay (không cần trình duyệt). Bổ sung cho bảng chấm bằng hình (skills/bang-cham/),
không thay nó: thứ đo được bằng mã thì đo ở đây, thứ phải nhìn thì người rà chấm bằng bảng.

Dùng (từ gốc chung/):  python3 tools/kiem_canh.py [thư mục hoặc file ...]
Mặc định rà ../kenh/*/tap (bỏ _luu, out, .bak). Thoát 1 nếu có LOI.

  LOI  may-dung     file có Shot/StageCam mà không có dòng nào cho máy đi (may=, mayQuay, duongMay, dx/dz theo khung). Luật 9a: không cảnh nào đứng yên.
  LOI  cung         duongMay / may lượn với cung trên 5 độ (máy đi vòng `vong`: trên 20 độ).
  CANH may-tu-che   máy đi bằng dx/dz/yaw tự viết thay vì kiểu máy có tên (Shot may={{kieu, D}} hoặc mayQuay). Kiểu có tên đã kẹp độ mạnh.
  (Sân khấu ngang, cỡ người, mảng sạch sau đầu không đo được bằng mã: người rà chấm bằng bảng chấm, mục 1, 4, 6.)
  CANH hat-tay      file cảnh tự rải hạt (Fireflies, Motes, DriftSpecks, Embers, AirLayer, mảng circleGeometry): hạt phải đi theo nguồn
                    (lib3/buiNguon) và môi trường (datNoiBui). Cố ý thì thêm chú thích  hat:ok  cùng dòng.
  CANH lap-deu      mảng từ 4 toạ độ cách đều trở lên dùng để đặt cây, nhà, cột: nhìn ra ngay là máy làm. Lệch khoảng cách, cỡ, hình.
  Chuyển cảnh (file có <NoiCanh, mỗi file ghép một chương; file có  chuyen:thu  là file thử, bỏ qua; luật 9b, Daniel 25/11):
  LOI  chuyen-nhieu  quá 3 chuyển cảnh trong một chương.
  LOI  chuyen-sat    giữa hai chuyển cảnh ít hơn 3 chỗ cắt thẳng.
  LOI  chuyen-lap    một kiểu dùng hai lần trong một chương.
  LOI  chuyen-manh   hơn một kiểu mạnh (vao-mat, chop-trang, khoi-phu, bay-dia-cau, lat-giay, ra-den) trong một chương.
  LOI  chuyen-tap    vao-mat hoặc bay-dia-cau quá 2 lần trong cả tập (đếm trên các file được rà cùng lượt; rà cả thư mục tập).
  CANH chuyen-ly-do  chuyển cảnh thiếu  vi: '<lý do trong truyện>'.
"""
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
BO_QUA = ('node_modules', '/out/', '/_luu/', '.bak', '/demo-before/')
SO = r'-?\d+(?:\.\d+)?'
HAT = re.compile(r'<(Fireflies|Motes|DriftSpecks|Embers|AirLayer|CampAir)\b')
VAT_LAP = re.compile(r'Sprite|Tree|Pine|Cay|Thong|House|Nha|Cot|Pillar|Trunk|Than')
MANH = {'vao-mat', 'chop-trang', 'khoi-phu', 'bay-dia-cau', 'lat-giay', 'ra-den'}
HIEM_TAP = {'vao-mat': 2, 'bay-dia-cau': 2}


def kiem_chuyen(s, ten, loi, canh):
    """trả danh sách kiểu chuyển cảnh theo thứ tự trong chương (để đếm cả tập)"""
    if '<NoiCanh' not in s or 'chuyen:thu' in s:
        return []
    dau = [m.start() for m in re.finditer(r'\{\s*C\s*:', s)]
    cac = []   # (thứ tự cảnh, kiểu, vị trí, có lý do)
    for i, a in enumerate(dau):
        k = s[a: dau[i + 1] if i + 1 < len(dau) else len(s)]
        m = re.search(r"chuyen\s*:\s*\{[^}]*?kieu\s*:\s*'([a-z-]+)'", k)
        if m:
            cac.append((i, m.group(1), a, re.search(r"\bvi\s*:\s*['\"`]\S", k) is not None))
    if len(cac) > 3:
        loi.append(f'LOI  chuyen-nhieu {ten}  {len(cac)} chuyển cảnh trong một chương (tối đa 3)')
    for (i0, k0, _, _), (i1, k1, a1, _) in zip(cac, cac[1:]):
        if i1 - i0 - 1 < 3:
            loi.append(f'LOI  chuyen-sat   {ten}:{dong(s, a1)}  {k0} rồi {k1} chỉ cách {i1 - i0 - 1} chỗ cắt thẳng (ít nhất 3)')
    ds = [k for _, k, _, _ in cac]
    for k in sorted({k for k in ds if ds.count(k) > 1}):
        loi.append(f'LOI  chuyen-lap   {ten}  {k} dùng {ds.count(k)} lần trong một chương')
    manh = [k for k in ds if k in MANH]
    if len(manh) > 1:
        loi.append(f'LOI  chuyen-manh  {ten}  {len(manh)} kiểu mạnh trong một chương: {", ".join(manh)} (tối đa 1)')
    for _, k, a, vi in cac:
        if not vi:
            canh.append(f"CANH chuyen-ly-do {ten}:{dong(s, a)}  {k} thiếu vi: '<lý do trong truyện>' (không có lý do thì cắt thẳng)")
    return ds


def cac_file(args):
    goc = [Path(a) for a in args] or [*GOC.parent.glob('kenh/*/tap')]
    for g in goc:
        for f in ([g] if g.is_file() else sorted(g.rglob('*.tsx'))):
            if not any(b in str(f) for b in BO_QUA):
                yield f


def dong(src, i):
    return src.count('\n', 0, i) + 1


def main(args):
    loi, canh, files = [], [], list(cac_file(args))
    theo_tap = {}
    for f in files:
        s = f.read_text(encoding='utf-8', errors='replace')
        ten = f.relative_to(GOC.parent) if GOC.parent in f.parents else f
        co_may = re.search(r'<(Shot|ShotOf|StageCam)\b', s)
        # 1. máy: chỉ xét file cảnh quay (bảng cảnh có frames, hoặc tên có Shots); file bối cảnh nhận dx/dz từ cảnh quay
        la_canh_quay = 'Shots' in f.name or re.search(r'\bframes\s*:', s)
        if co_may and la_canh_quay:
            co_ten = re.search(r'\bmay=\{\{|\bmayQuay\(', s)
            di = co_ten or re.search(r'duongMay\(', s) or re.search(r'\b(dx|dz|yaw)\s*[=:]\s*\{?[^,}\n]*\b(f|frame|t)\b', s) or re.search(r'<ShotOf\b[^>]*\bf=\{', s) or re.search(r'\b(dx|dz|yaw|pitch)=\{(?!\s*0\s*\})', s)
            if not di:
                loi.append(f'LOI  may-dung    {ten}:{dong(s, co_may.start())}  không thấy máy đi (luật 9a): dùng Shot may={{{{kieu, D}}}}')
            elif not co_ten:
                canh.append(f'CANH may-tu-che {ten}:{dong(s, di.start())}  máy tự viết: dùng kiểu máy có tên (lib3/kieuMay)')
        for m in re.finditer(r'cung\s*[:=]\s*(%s)' % SO, s):
            ln = s[s.rfind('\n', 0, m.start()) + 1: s.find('\n', m.start())]
            if 'vong' in ln:      # máy đi vòng: trần 20 độ, kẹp trong kieuMay
                if abs(float(m.group(1))) > 20: loi.append(f'LOI  cung        {ten}:{dong(s, m.start())}  vòng {m.group(1)} độ > 20')
                continue
            if abs(float(m.group(1))) > 5:
                loi.append(f'LOI  cung        {ten}:{dong(s, m.start())}  cung {m.group(1)} độ > 5')
        # 3. hạt
        for m in HAT.finditer(s):
            ln = s[s.rfind('\n', 0, m.start()) + 1: s.find('\n', m.start())]
            if 'hat:ok' not in ln:
                canh.append(f'CANH hat-tay    {ten}:{dong(s, m.start())}  <{m.group(1)}> tự rải: hạt theo nguồn sáng (lib3/buiNguon) và datNoiBui')
        for m in re.finditer(r'Array\.from\(\{\s*length:\s*(\d+)', s):
            k = s[m.start(): m.start() + 600]
            if int(m.group(1)) >= 12 and 'circleGeometry' in k and 'hat:ok' not in k:
                canh.append(f'CANH hat-tay    {ten}:{dong(s, m.start())}  mảng {m.group(1)} chấm tròn tự vẽ')
        # 5. chuyển cảnh
        ds = kiem_chuyen(s, ten, loi, canh)
        mt = re.search(r'/tap/([^/]+)/', str(f))
        if ds and mt:
            theo_tap.setdefault(mt.group(1), []).extend(ds)
        # 4. lặp đều
        for m in re.finditer(r'\[((?:\s*%s\s*,){3,}\s*%s\s*)\]\s*\.map\(' % (SO, SO), s):
            v = [float(x) for x in m.group(1).split(',')]
            d = [b - a for a, b in zip(v, v[1:])]
            sau = s[m.end(): m.end() + 300]
            if len(set(round(x, 3) for x in d)) == 1 and VAT_LAP.search(sau):
                canh.append(f'CANH lap-deu    {ten}:{dong(s, m.start())}  {len(v)} vật cách đều {d[0]:g}: lệch khoảng cách, cỡ, hình')
    for tap, ds in theo_tap.items():
        for k, tran in HIEM_TAP.items():
            if ds.count(k) > tran:
                loi.append(f'LOI  chuyen-tap   tập {tap}: {k} dùng {ds.count(k)} lần (tối đa {tran} cả tập)')
    # 6. tỉ lệ mắt trên mặt (25/11/2026): mắt chuẩn và bộ khuôn còn đúng số đo video gốc, kênh của các file đang rà không tự vẽ mắt
    try:
        from kiem_mat import kiem as kiem_mat
        kenh = {m.group(1) for f in files for m in [re.search(r'/kenh/([^/]+)/', str(f.resolve()))] if m}
        if kenh:
            l2, _ = kiem_mat(sorted(kenh)); loi.extend(l2)
    except ImportError:
        canh.append('CANH kiem-mat    không nạp được tools/kiem_mat.py: chạy tay `python3 tools/kiem_mat.py`')
    # 6b. tấm tiền cảnh dán theo máy (Daniel 23/11 và 25/11/2026: bỏ ở mọi kênh; vật đóng khung phải là vật thật đặt trong bối cảnh)
    for f in files:
        if '/kenh/' not in str(f.resolve()): continue
        s = f.read_text(encoding='utf-8', errors='replace')
        for m in re.finditer(r'<Plate\b[^>]*\border=\{\s*9\d\d\s*\}|<FgFrame\b', s):
            if 'tien-canh:ok' in s[s.rfind('\n', 0, m.start()) + 1: s.find('\n', m.end())]: continue
            canh.append(f"CANH tien-canh-dan {f.name}:{s.count(chr(10), 0, m.start()) + 1}  tấm tiền cảnh dán theo máy: bỏ; vật đóng khung ở mép phải là vật thật đặt trong bối cảnh")
    # 6c. làm mờ nền (soft) ở cảnh có từ hai người (Daniel 25/11/2026: chỉ mờ khi cảnh tập trung vào MỘT chủ thể chính)
    for f in files:
        if '/kenh/' not in str(f.resolve()): continue
        s = f.read_text(encoding='utf-8', errors='replace')
        for m in re.finditer(r'<Shot\b', s):
            k = re.search(r'\n\s*(?:const|export|function)\s', s[m.end():]); khoi = s[m.start(): m.end() + (k.start() if k else 2500)]
            if not re.search(r'\bsoft=\{\s*(?:[1-9]|0?\.\d*[1-9])', khoi) or 'mo-nen:ok' in khoi: continue
            nguoi = len(re.findall(r'<(?:Puppet3|Person|Nguoi|NguoiLua)\b', khoi))
            if nguoi >= 2:
                canh.append(f"CANH mo-nen     {f.name}:{s.count(chr(10), 0, m.start()) + 1}  cảnh có {nguoi} người mà vẫn làm mờ nền (soft): chỉ mờ khi cảnh tập trung vào MỘT chủ thể; cố ý thì ghi  mo-nen:ok")
    # 7. dùng lại món kho (25/11/2026): file của kênh tự viết lại loại vật kho đã có, hoặc viết một món ở hai file
    try:
        from kiem_kho import kiem as kiem_kho
        c2, _ = kiem_kho([str(f) for f in files]); canh.extend(c2)
    except ImportError:
        canh.append('CANH kiem-kho    không nạp được tools/kiem_kho.py: chạy tay `python3 tools/kiem_kho.py`')
    for d in loi + canh:
        print(d)
    print(f'\n{len(files)} file; {len(loi)} lỗi, {len(canh)} cảnh báo')
    return 1 if loi else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
