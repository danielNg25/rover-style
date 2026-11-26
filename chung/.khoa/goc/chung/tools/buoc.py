#!/usr/bin/env python3
"""Tập đang ở BƯỚC NÀO của quy trình (quy trình ghi ở CLAUDE.md, gốc cutout3d). Trạng thái: kenh/<kênh>/tap/<tập>/buoc.json.

  python3 tools/buoc.py                    xem tập đang ở bước nào, đang chờ gì (kênh, tập: KENH= TAP= hoặc dang-lam.yaml)
  python3 tools/buoc.py dat <bước> dang|cho-duyet|xong [--lo <tên lô>] [--duyet "<nguyên văn lời Daniel>"] [--bo-qua "<lời Daniel>"] ["ghi chú"]
  python3 tools/buoc.py --hook             vài dòng cho mọi tập đang dở (hook mở phiên gọi; phiên chỉ làm tập Daniel giao)

Bước có CỔNG chỉ ghi `xong` được khi kèm --duyet (lời Daniel duyệt). Bước sau chỉ mở được khi bước trước của nó đã xong;
Daniel bảo bỏ qua một bước thì ghi --bo-qua kèm lời ông. Bước 4–7 tính theo lô chương (--lo c1-5); không ghi --lo là lô `ca-tap`."""
import datetime, json, os, pathlib, re, sys

CHUNG = pathlib.Path(__file__).resolve().parent.parent
# (mã, tên, phạm vi: cả tập hay từng lô chương, cổng: thứ Daniel phải duyệt thì bước mới xong)
BUOC = [
    ('du-kien', 'Dữ kiện có nguồn; học transcript video nhiều view cùng đề tài', 'tap', ''),
    ('kich-ban', 'Kịch bản qua workflow video-script (video dài: dàn ý trước)', 'tap', 'gửi Daniel dàn ý (video dài) rồi lời đọc, DỪNG chờ duyệt'),
    ('giong', 'Thu giọng', 'tap', 'HỎI Daniel trước khi thu (tốn tiền)'),
    ('danh-sach', 'Danh sách cảnh và phiếu ngoại hình nhân vật', 'lo', 'gửi Daniel danh sách cảnh và phiếu ngoại hình, DỪNG chờ duyệt'),
    ('boi-canh', 'Nhân vật và bối cảnh', 'lo', 'bối cảnh MỚI: gửi Daniel bảng thiết kế của bối cảnh (các lớp, từng món, màu; không lấy bố cục của khung mẫu nào), DỪNG chờ duyệt rồi mới dựng; món mới vào kho chung cũng chờ duyệt'),
    ('bang-phan-canh', 'Bảng phân cảnh PDF: mỗi cảnh một ảnh người đứng ở mốc', 'lo', 'gửi Daniel bảng phân cảnh của cả lô, DỪNG chờ duyệt rồi mới diễn'),
    ('dien', 'Diễn, kiểm, video chương 1440p', 'lo', 'gửi Daniel video chương cỡ 2, DỪNG chờ duyệt'),
    ('ghep', 'Ghép cả tập, video 1440p', 'tap', 'gửi Daniel video cả tập cỡ 2, DỪNG chờ duyệt'),
    ('dang', 'Bài đăng, ảnh bìa (không tự đăng)', 'tap', ''),
]
CAN = {'du-kien': [], 'kich-ban': ['du-kien'], 'giong': ['kich-ban'], 'danh-sach': ['kich-ban'], 'boi-canh': ['danh-sach'],
       'bang-phan-canh': ['boi-canh'], 'dien': ['bang-phan-canh', 'giong'], 'ghep': ['dien'], 'dang': ['ghep']}
PV = {m: p for m, _, p, _ in BUOC}
SO = {m: i + 1 for i, (m, *_r) in enumerate(BUOC)}
TT = {'chua': 'chưa', 'dang': 'ĐANG LÀM', 'cho-duyet': 'CHỜ DANIEL DUYỆT', 'xong': 'xong'}


def kenh_tap():
    k, t = os.environ.get('KENH'), os.environ.get('TAP')
    if not (k and t):
        for l in (CHUNG / 'dang-lam.yaml').read_text(encoding='utf-8').split('\n'):
            m = re.match(r'^(kenh|tap):\s*([^#\s]+)', l)
            if m and m.group(1) == 'kenh': k = k or m.group(2)
            if m and m.group(1) == 'tap': t = t or m.group(2)
    return k, t


def doc(p):
    return json.loads(p.read_text(encoding='utf-8')) if p.is_file() else {'buoc': {}, 'lo': []}


def khoa(ma, lo):
    return ma if PV[ma] == 'tap' else f'{ma}@{lo}'


def tt(d, ma, lo=None):
    return d['buoc'].get(khoa(ma, lo), {}).get('tt', 'chua')


def day(d):
    """Mọi bước theo thứ tự làm: 1–3, rồi 4–7 của từng lô, rồi 8–9."""
    lo = d.get('lo') or ['ca-tap']
    ra = [(m, None) for m, _, p, _ in BUOC[:3]]
    for l in lo: ra += [(m, l) for m, _, p, _ in BUOC if p == 'lo']
    return ra + [(m, None) for m, _, p, _ in BUOC[7:]]


def hien_tai(d):
    for ma, lo in day(d):
        if tt(d, ma, lo) != 'xong': return ma, lo
    return None, None


def cau_ke(d):
    """Một câu: đang chờ Daniel ở đâu, đang làm gì, việc kế là gì."""
    ten = lambda ma, lo: f'bước {SO[ma]} `{ma}`' + (f' lô {lo}' if lo else '')
    cong = {m: c for m, _, _, c in BUOC}
    cho = [f'{ten(m, l)} ({cong[m]})' for m, l in day(d) if tt(d, m, l) == 'cho-duyet']
    lam = [ten(m, l) for m, l in day(d) if tt(d, m, l) == 'dang']
    ke = next(((m, l) for m, l in day(d) if tt(d, m, l) == 'chua'), None)
    ra = []
    if cho: ra.append('ĐANG CHỜ DANIEL DUYỆT: ' + '; '.join(cho) + '. Chưa có lời duyệt thì KHÔNG làm bước sau của phần đó.')
    if lam: ra.append('Đang làm: ' + ', '.join(lam) + '.')
    if ke: ra.append(f'Bước chưa làm kế tiếp: {ten(*ke)}, {next(t for m, t, _, _ in BUOC if m == ke[0])}' + (f'. Cổng: {cong[ke[0]]}.' if cong[ke[0]] else '.'))
    return ' '.join(ra) or 'Mọi bước đã xong.'


def xem(d, k, t):
    print(f'Tập {k}/{t}. {cau_ke(d)}')
    dong = lambda ma, lo: f'{SO[ma]} {ma}: {TT[tt(d, ma, lo)]}'
    print('  ' + ' · '.join(dong(m, None) for m, _, p, _ in BUOC[:3]))
    for l in d.get('lo') or ['ca-tap']:
        print(f'  lô {l}: ' + ' · '.join(dong(m, l) for m, _, p, _ in BUOC if p == 'lo'))
    print('  ' + ' · '.join(dong(m, None) for m, _, p, _ in BUOC[7:]))
    for kh, r in d['buoc'].items():
        if r.get('duyet'): print(f'  duyệt {kh} ({r.get("ngay", "")}): {r["duyet"]}')
        if r.get('bo_qua'): print(f'  bỏ qua trước {kh} ({r.get("ngay", "")}): {r["bo_qua"]}')


def dat(d, a):
    co = lambda c: a[a.index(c) + 1] if c in a else None
    lo, duyet, bo_qua = co('--lo'), co('--duyet'), co('--bo-qua')
    for c in ('--lo', '--duyet', '--bo-qua'):
        if c in a: i = a.index(c); del a[i:i + 2]
    if len(a) < 2 or a[0] not in PV or a[1] not in ('dang', 'cho-duyet', 'xong'):
        raise SystemExit('dùng: buoc.py dat <bước> dang|cho-duyet|xong [--lo <lô>] [--duyet "<lời Daniel>"] [--bo-qua "<lời Daniel>"] ["ghi chú"]\nbước: ' + ', '.join(PV))
    ma, moi, ghi = a[0], a[1], ' '.join(a[2:])
    if PV[ma] == 'lo':
        lo = lo or 'ca-tap'
        if lo not in d.setdefault('lo', []): d['lo'].append(lo)
    else: lo = None
    thieu = []
    for p in CAN[ma]:
        cac = [(p, lo)] if PV[p] == 'tap' or PV[ma] == 'lo' else [(p, l) for l in (d.get('lo') or ['ca-tap'])]
        thieu += [f'bước {SO[p]} `{khoa(p, l) if PV[p] == "lo" else p}` đang là "{TT[tt(d, p, l)]}"' for p, l in cac if tt(d, p, l) != 'xong']
    if thieu and not bo_qua:
        raise SystemExit(f'CHƯA ĐƯỢC mở bước {SO[ma]} `{ma}`: ' + '; '.join(thieu) + '.\nLàm xong bước đó trước (bước có cổng: gửi Daniel, chờ duyệt). Daniel bảo bỏ qua thì thêm --bo-qua "<nguyên văn lời Daniel>".')
    cong = next(c for m, _, _, c in BUOC if m == ma)
    if moi == 'xong' and cong and not duyet:
        raise SystemExit(f'Bước {SO[ma]} `{ma}` có CỔNG ({cong}). Đã gửi mà chưa có lời duyệt thì ghi `cho-duyet`; có rồi thì thêm --duyet "<nguyên văn lời Daniel>".')
    r = d['buoc'].setdefault(khoa(ma, lo), {})
    r.update({'tt': moi, 'ngay': datetime.date.today().isoformat()})
    if ghi: r['ghi'] = ghi
    if duyet: r['duyet'] = duyet
    if bo_qua: r['bo_qua'] = bo_qua
    return d


def hook():
    ra = []
    for p in sorted((CHUNG.parent / 'kenh').glob('*/tap/*/buoc.json')):
        try: d = doc(p)
        except Exception: continue
        if hien_tai(d)[0]: ra.append(f'- {p.parts[-4]}/{p.parts[-2]}: {cau_ke(d)}')
    if ra:
        print('\n# Các tập đang dở và bước hiện tại (chỉ làm tập Daniel giao cho phiên này; chi tiết: KENH=<kênh> TAP=<tập> python3 chung/tools/buoc.py)')
        print('\n'.join(ra))


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--hook']:
        hook(); sys.exit(0)
    k, t = kenh_tap()
    thu_muc = CHUNG.parent / 'kenh' / k / 'tap' / t
    if not thu_muc.is_dir(): raise SystemExit(f'không có tập {k}/{t} ({thu_muc}); đặt KENH=<kênh> TAP=<tập>')
    p = thu_muc / 'buoc.json'
    d = doc(p)
    if a[:1] == ['dat']:
        d = dat(d, a[1:]); d.update({'kenh': k, 'tap': t})
        p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    elif a:
        raise SystemExit(__doc__)
    if not p.is_file(): print(f'(tập {k}/{t} chưa có buoc.json: mọi bước đang tính là "chưa". Tập đã làm dở thì ghi lại các bước đã xong bằng `buoc.py dat …`, bước có cổng kèm --duyet lời Daniel đã duyệt.)')
    xem(d, k, t)
