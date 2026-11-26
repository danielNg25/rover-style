"""Đo bộ màu của ảnh hoặc video và so với CẢNH CÙNG LOẠI của video gốc (bảng số đo theo loại cảnh, tools/mau-goc/).
Từ 25/11/2026 đây chỉ là công cụ ĐO THAM KHẢO, không phải cổng: màu của cảnh nhìn theo bộ cảnh mẫu (skill 1, mục Cảnh mẫu của cảnh).

Dùng (từ gốc chung/):
  python3 tools/do_mau.py --loai                       liệt kê các loại cảnh và khoảng số đo của video gốc
  python3 tools/do_mau.py <loại> <ảnh hoặc video ...>   đo và so với loại đó (video: lấy mẫu 3 giây một khung, so từng khung)
Thoát 1 nếu có LOI.

Vì sao so theo loại: video gốc khác nhau rất nhiều giữa các loại cảnh (tuyết gần xám tới 70 % khung, lửa chỉ 3–14 %). Một ngưỡng
chung cho mọi cảnh làm hình hoặc nhợt hoặc loè (Daniel, 25/11/2026: bản thử theo công thức chung "nhợt nhạt").

Số đo (không gian OKLCH; C là độ đậm: dưới 0,03 gần xám, 0,03–0,10 lưng chừng, trên 0,10 rực; L là độ sáng 0..1):
  gần xám %, rực %, độ đậm trung bình, độ đậm mảng lớn (cụm từ 10 % khung), tối sâu % (L < 0,25), sáng trung bình.
Chấm từng số:  dat  = nằm trong khoảng giữa của video gốc (phần tư 1 tới phần tư 3)
               CANH = ra ngoài khoảng giữa nhưng còn trong khoảng nhỏ nhất–lớn nhất của loại
               LOI  = ra ngoài cả khoảng nhỏ nhất–lớn nhất (gần xám, độ đậm trung bình, độ đậm mảng lớn, sáng TB: cả hai phía;
                      rực %: chỉ khi THẤP hơn mọi khung của video gốc, tức là khung không có gì rực)
Tối sâu % phụ thuộc bố cục nên chỉ báo CANH.
  CANH mau-la: một mảng ĐẬM MÀU (C trên 0,08) từ 6 % khung mà không gần màu nào trong bảng vai của loại (lệch trên 0,07 trong
  OKLab), ví dụ biển xanh ngọc rực ngoài cửa sổ. Mảng của nhân vật có thể bị báo: bỏ qua nếu đó đúng là áo nhân vật.
Con số chỉ để bắt lệch lớn. Vẫn phải đặt ảnh cạnh tấm mẫu `mau-<loại>.jpg` của loại đó mà nhìn.
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

GOC = Path(__file__).resolve().parent.parent
MAU = Path(os.environ.get('MAU_GOC', GOC / 'tools' / 'mau-goc'))
KHOA = [('xam', 'gần xám %', 'hai'), ('ruc', 'rực %', 'duoi'), ('C', 'độ đậm TB', 'hai'), ('Clon', 'độ đậm mảng lớn', 'hai'), ('toi', 'tối sâu %', ''), ('L', 'sáng TB', 'hai')]   # 'hai': LOI cả hai phía; 'duoi': chỉ LOI khi thấp hơn video gốc
VIDEO = ('.mp4', '.mov', '.webm', '.mkv')


def oklab(rgb):
    c = rgb.astype(np.float32) / 255
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = 0.4122214708 * c[..., 0] + 0.5363325363 * c[..., 1] + 0.0514459929 * c[..., 2]
    m = 0.2119034982 * c[..., 0] + 0.6806995451 * c[..., 1] + 0.1073969566 * c[..., 2]
    s = 0.0883024619 * c[..., 0] + 0.2817188376 * c[..., 1] + 0.6299787005 * c[..., 2]
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.stack([0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s], -1)


def hex_lab(h):
    h = h.lstrip('#'); return oklab(np.array([[int(h[i:i + 2], 16) for i in (0, 2, 4)]], dtype=np.uint8))[0]


def do(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((480, 270), Image.LANCZOS)); lab = oklab(a); L = lab[..., 0]; C = np.hypot(lab[..., 1], lab[..., 2])
    X = lab.reshape(-1, 3)[::3].copy(); A = a.reshape(-1, 3)[::3]; r = np.random.RandomState(3); cen = X[r.choice(len(X), 8, replace=False)].copy()
    for _ in range(20):
        lb = ((X[:, None] - cen[None]) ** 2).sum(-1).argmin(1)
        for j in range(8):
            if (lb == j).any(): cen[j] = X[lb == j].mean(0)
    sh = np.bincount(lb, minlength=8) / len(lb); Cc = np.hypot(cen[:, 1], cen[:, 2]); lon = sh >= 0.10
    mang = [(float(sh[j]), '#%02x%02x%02x' % tuple(int(v) for v in np.median(A[lb == j], 0)), cen[j].copy()) for j in np.argsort(-sh) if sh[j] >= 0.01]
    return dict(xam=float(100 * (C < 0.03).mean()), ruc=float(100 * (C > 0.10).mean()), C=float(C.mean()), Clon=float((Cc[lon] * sh[lon]).sum() / max(1e-6, sh[lon].sum())),
                toi=float(100 * (L < 0.25).mean()), L=float(L.mean())), mang


def khung_cua(p, tam):
    """ảnh thì trả chính nó; video thì cắt 3 giây một khung vào thư mục tạm"""
    if p.lower().endswith(VIDEO):
        d = Path(tam) / Path(p).stem; d.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-vf', 'fps=1/3,scale=480:270', '-q:v', '3', str(d / 'f_%04d.jpg')], check=True)
        return sorted(str(f) for f in d.glob('f_*.jpg'))
    return [p]


def cham(v, q, loi_duoc):
    lo, q1, _, q3, hi = q; bien = 0.1 * (hi - lo)
    if q1 <= v <= q3: return 'dat'
    if v < lo - bien and loi_duoc in ('hai', 'duoi'): return 'LOI'
    if v > hi + bien and loi_duoc == 'hai': return 'LOI'
    return 'CANH'


def main(args):
    if not (MAU / 'loai-canh.json').exists():
        print(f'không thấy {MAU}/loai-canh.json'); return 1
    bang = json.loads((MAU / 'loai-canh.json').read_text(encoding='utf-8'))
    if not args or args[0] == '--loai':
        print(f"{'loại':22}{'khung':>6}  {'gần xám %':>10}  {'rực %':>8}  {'độ đậm TB':>12}  {'tối sâu %':>10}  {'sáng TB':>10}   dùng khi")
        for k, v in bang.items():
            s = v['so_do']; print(f"{k:22}{v.get('so_khung', 0):>6}  {s['xam'][1]:4.0f}–{s['xam'][3]:<4.0f}  {s['ruc'][1]:3.0f}–{s['ruc'][3]:<3.0f}  {s['C'][1]:.3f}–{s['C'][3]:.3f}  {s['toi'][1]:4.0f}–{s['toi'][3]:<4.0f}  {s['L'][1]:.2f}–{s['L'][3]:.2f}   {v.get('dung_khi', '')[:70]}")
        return 0
    loai, files = args[0], args[1:]
    if loai not in bang or not files:
        print(f"dùng: do_mau.py <loại> <ảnh hoặc video…>; loại có: {', '.join(bang)}"); return 1
    B = bang[loai]; vai = [(v['vai'], h, hex_lab(h)) for v in B.get('vai', []) for h in v.get('hex', [])]
    print(f"So với video gốc, loại {loai} ({B.get('ten', '')}, {B.get('so_khung', '?')} khung). Tấm mẫu: {MAU / B.get('tam_mau', f'mau-{loai}.jpg')}")
    co_loi = False
    with tempfile.TemporaryDirectory() as tam:
        for p in files:
            ks = khung_cua(p, tam); n_loi = 0
            for f in ks:
                s, mang = do(f); dong = []; xau = False
                for k, nhan, loi_duoc in KHOA:
                    c = cham(s[k], B['so_do'][k], loi_duoc); xau |= c == 'LOI'
                    q = B['so_do'][k]; so = f'{s[k]:.3f}' if k in ('C', 'Clon', 'L') else f'{s[k]:.0f}'; kh = f'{q[1]:.3f}–{q[3]:.3f}' if k in ('C', 'Clon', 'L') else f'{q[1]:.0f}–{q[3]:.0f}'
                    dong.append(f'{nhan} {so} [{kh}] {c}')
                ten = p if len(ks) == 1 else f'{p} @ {3 * ks.index(f)}s'
                if len(ks) == 1 or xau:
                    print(f"\n{'LOI ' if xau else '    '}{ten}\n    " + ' | '.join(dong))
                    for sh, hx, lab in mang:
                        if sh < 0.06 or not vai or float(np.hypot(lab[1], lab[2])) <= 0.08: continue   # chỉ xét mảng đậm màu: mảng nhạt, trắng, xám lệch nhau ít ý nghĩa
                        d, ten_vai, hv = min((float(np.linalg.norm(lab - lv)), tv, h) for tv, h, lv in vai)
                        if d > 0.07: print(f'    CANH mau-la  {hx} chiếm {100 * sh:.0f} % khung, không gần màu nào của loại này (gần nhất: {ten_vai} {hv}, lệch {d:.2f})')
                n_loi += xau
            if len(ks) > 1: print(f'\n{p}: {len(ks)} khung, {n_loi} khung LOI')
            co_loi |= n_loi > 0
    return 1 if co_loi else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
