#!/usr/bin/env python3
"""ẢNH TRƯỢT MÁY: cho thấy bối cảnh có TÁCH LỚP THẬT hay không (chạy ngoài sandbox: cần Chrome).

Daniel, 27/11/2026: "ở phía xa ko biết là có chia lớp không hay là 1 lớp … ngoài cửa sổ ko biết là có dựng cảnh 3d theo lớp ở ngoài ko
hay là 2d, 3d thì lúc di camera mới thấy được". Luật lớp (thẻ luật 3) có từ trước nhưng không ai nhìn thấy nó được giữ hay không.

Dùng (từ gốc chung/, kèm KENH=<kênh> TAP=<tập> khi cần):
    python3 tools/truot_may.py <comp-truot> [comp…]

<comp-truot> là composition CHỈ ĐỂ KIỂM của bối cảnh, tên kết thúc bằng -truot: bối cảnh trống, máy dời NGANG thuần 3 m suốt cảnh
(truyền thẳng dx vào bối cảnh, từ -1,5 tới 1,5; không xoay ống kính; không dùng trong phim nên không theo trần của kiểu máy có tên).

Kết quả: ../kenh/<kênh>/out/truot-may/<comp>.jpg  gồm khung MÁY Ở TRÁI (trên) và MÁY Ở PHẢI (dưới), có vạch dọc để so; cạnh mỗi dải
ngang ghi dải đó trôi bao nhiêu % bề ngang khung. Lớp gần trôi nhiều, lớp xa trôi ít, trời gần như đứng yên: mỗi lớp thật có một độ trôi
riêng. Hai thứ đáng ra ở hai độ sâu mà trôi bằng nhau thì chúng đang nằm chung MỘT tấm.

Thoát 1 khi không dựng được, hoặc khung hình không trôi (comp không dời máy). Số "độ trôi khác nhau" chỉ để tham khảo: công cụ đo theo dải
ngang nên không tách được thứ nằm cạnh nhau trong cùng dải (cảnh ngoài ô cửa sổ, đồ trong phòng). Người rà và Daniel nhìn ảnh mới là chính.
"""
import subprocess
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
SO_DAI = 12


def moi_truong():
    r = subprocess.run(['bash', '-c', 'source tools/chrome.sh && source tools/dang-lam.sh && printf "%s\\n%s\\n%s\\n" "$BX" "$ENTRY" "$OUT"'], cwd=GOC, capture_output=True, text=True)
    if r.returncode: print(r.stderr.strip() or 'không đọc được chrome.sh / dang-lam.sh'); sys.exit(1)
    bx, entry, out = r.stdout.strip().split('\n')[-3:]
    return bx, entry, Path(out)


def do_troi(a, b):
    """độ trôi ngang (px, ở bề ngang 640) của từng dải; None = dải phẳng, không đo được"""
    import numpy as np
    from PIL import Image
    A = np.asarray(Image.open(a).convert('L').resize((640, 360)), dtype=np.float32)
    B = np.asarray(Image.open(b).convert('L').resize((640, 360)), dtype=np.float32)
    ra, h, S = [], 360 // SO_DAI, 200
    for k in range(SO_DAI):
        x, y = A[k * h:(k + 1) * h], B[k * h:(k + 1) * h]
        if np.abs(np.diff(x, axis=1)).mean() < 0.6: ra.append(None); continue
        tot, tot_s = None, 0
        for s in range(-S, S + 1):
            d = np.abs(x[:, max(0, -s):640 - max(0, s)] - y[:, max(0, s):640 - max(0, -s)]).mean()
            if tot is None or d < tot: tot, tot_s = d, s
        ra.append(tot_s)
    return ra


def ghep(a, b, troi, dich, ten):
    from PIL import Image, ImageDraw, ImageFont
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    W, H = A.size
    le = 150
    T = Image.new('RGB', (W + le, H * 2 + 6), '#111111')
    T.paste(A, (le, 0)); T.paste(B, (le, H + 6))
    d = ImageDraw.Draw(T)
    try: f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', max(14, H // 26)); fn = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', max(11, H // 40))
    except OSError: f = fn = ImageFont.load_default()
    for i in range(1, 8):
        x = le + W * i // 8
        for y in range(0, H * 2 + 6, 14): d.line([(x, y), (x, y + 6)], fill='#ffffff', width=1)
    for y0, chu in ((0, 'MAY O TRAI'), (H + 6, 'MAY O PHAI')):
        d.rectangle([le, y0, le + d.textlength(chu, font=f) + 16, y0 + f.size + 10], fill='#000000'); d.text((le + 8, y0 + 4), chu, fill='#ffffff', font=f)
    hd = H / SO_DAI
    for k, s in enumerate(troi):
        chu = 'phang' if s is None else f'troi {abs(s) / 640 * 100:.1f} %'
        for y0 in (0, H + 6): d.text((6, y0 + k * hd + hd / 2 - fn.size / 2), chu, fill='#bbbbbb' if s is None else '#ffd866', font=fn)
        d.line([(0, H + 6 + k * hd), (le - 4, H + 6 + k * hd)], fill='#444444'); d.line([(0, k * hd), (le - 4, k * hd)], fill='#444444')
    T.save(dich, quality=90)


def mot(comp, bx, entry, out):
    D = out / 'truot-may'; D.mkdir(parents=True, exist_ok=True)
    v = D / f'{comp}.mp4'; v.unlink(missing_ok=True)
    r = subprocess.run(['npx', 'remotion', 'render', entry, comp, str(v), '--scale=0.5', f'--browser-executable={bx}', '--log=error'], cwd=GOC, capture_output=True, text=True)
    if not v.is_file(): print(f'{comp}: KHÔNG DỰNG ĐƯỢC\n' + '\n'.join((r.stdout + r.stderr).strip().split('\n')[-6:])); return 1
    a, b = D / f'{comp}-trai.png', D / f'{comp}-phai.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(v), '-frames:v', '1', '-update', '1', str(a)], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-sseof', '-0.2', '-i', str(v), '-update', '1', str(b)], check=True)
    troi = do_troi(a, b)
    dich = D / f'{comp}.jpg'
    ghep(a, b, troi, dich, comp)
    co = [abs(s) / 640 * 100 for s in troi if s is not None]
    print(f'== {comp}: {dich}')
    print('   trôi theo dải, từ trên xuống (% bề ngang): ' + ', '.join('phẳng' if s is None else f'{abs(s) / 640 * 100:.1f}' for s in troi))
    if not co or max(co) < 0.5:
        print(f'LOI  khong-truot     {comp}: khung hình không trôi. Comp -truot phải dời máy NGANG 3 m (dx từ -1,5 tới 1,5 truyền thẳng vào bối cảnh).'); return 1
    nhom = []
    for c in sorted(co):
        if not nhom or c - nhom[-1] > 0.45: nhom.append(c)
    print(f'   thấy {len(nhom)} độ trôi khác nhau: ' + ', '.join(f'{c:.1f} %' for c in nhom) + ' (tham khảo; nhìn ảnh mới là chính)')
    if len(nhom) < 3:
        print(f'CANH it-lop          {comp}: chỉ thấy {len(nhom)} độ trôi khác nhau. Lớp xa, lớp giữa, lớp gần phải là các tấm RIÊNG ở độ sâu riêng (thẻ luật 3); cảnh ngoài cửa sổ cũng vậy.')
    return 0


def main(args):
    if not args or args[0] in ('-h', '--help'): print(__doc__); return 2
    bx, entry, out = moi_truong()
    return 1 if sum(mot(c, bx, entry, out) for c in args) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
