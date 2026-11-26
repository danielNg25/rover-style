#!/usr/bin/env python3
"""vatly.py - KIỂM VẬT LÝ: nhân vật có xuyên qua đồ vật, tường, hay lún vào thứ gì không.

  cd shorts-claude && UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \\
     uv run --offline --no-project --with opencv-python-headless --with numpy python rover-lab/tools/vatly.py dh-05 [dh-07 ...] [--thick 0.12]
  (chạy ngoài sandbox: Chrome không khởi động được trong sandbox)

Dựng MỌI khung của từng composition ở cỡ nhỏ với cờ phys (xem PHYS trong src/mould/Puppet3.tsx): mỗi nhân vật tự vẽ thêm
  TÍM  = có vật của bối cảnh nằm sát ngay TRƯỚC mặt phẳng nhân vật (trong bề dày nửa thân) và che mất một phần người: người đang
         nằm TRONG vật đó (tay xuyên đồng hồ, bụng trong mép bàn). Đây là LỖI.
  XANH DƯƠNG = có vật nằm sát ngay SAU nhân vật: lưng hay tay lún vào tường, vào đồ. Đây là CẢNH BÁO, mở ảnh ra xem.
  XANH LÁ = phần người bị che bởi vật ở xa phía trước (đứng sau bàn): bình thường, không tính.
In ra số khung có tím và có xanh dương của từng cảnh, khung nặng nhất, và ghi tấm ảnh ../kenh/<kênh>/out/vatly/<comp>.jpg (kênh: dang-lam.yaml) gồm các khung bị đánh dấu."""
import subprocess, sys, os, shutil, glob, numpy as np, cv2
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dang_lam import OUT, ENTRY  # ../kenh/<kênh>/out theo dang-lam.yaml
OUT = str(OUT)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chrome import bx
BX = bx()   # Chrome không đầu: tools/chrome.py (không ghi cứng theo máy)
a = sys.argv[1:]; thick = float(a[a.index('--thick') + 1]) if '--thick' in a else 0.12; comps = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or a[i - 1] != '--thick')]
bad = 0
for comp in comps:
    out = os.path.join(OUT, 'vatly', comp); shutil.rmtree(out, ignore_errors=True)
    r = subprocess.run(['npx', 'remotion', 'render', ENTRY, comp, out, '--sequence', '--image-format=png', '--scale=0.5', f'--props={{"phys":{thick}}}', f'--browser-executable={BX}', '--concurrency=3', '--log=error'], cwd=ROOT, capture_output=True, text=True)
    files = sorted(glob.glob(os.path.join(out, '*.png')))
    if not files: print(comp, 'KHÔNG DỰNG ĐƯỢC', r.stdout[-600:], r.stderr[-600:]); bad += 1; continue
    rows = []
    for i, fn in enumerate(files):
        im = cv2.imread(fn).astype(np.int16); b, g, rr = im[..., 0], im[..., 1], im[..., 2]; n = b.size
        mag = (rr > 170) & (b > 150) & (g < 110); yel = (b > 190) & (rr < 80) & (g < 80)
        rows.append((i, mag.sum() / n * 100, yel.sum() / n * 100))
    M = [x for x in rows if x[1] > 0.02]; Y = [x for x in rows if x[2] > 0.02]
    def runs(v):
        o, s = [], None
        for i, *_ in v:
            if s is None: s = p = i
            elif i == p + 1: p = i
            else: o.append(f'{s}-{p}'); s = p = i
        if s is not None: o.append(f'{s}-{p}')
        return ', '.join(o)
    print(f"{comp}: {len(files)} khung | TÍM (xuyên vật) {len(M)} khung" + (f" [{runs(M)}], nặng nhất khung {max(M, key=lambda x: x[1])[0]} ({max(x[1] for x in M):.2f} % khung hình)" if M else '') + f" | XANH DƯƠNG (sát sau) {len(Y)} khung" + (f" [{runs(Y)}]" if Y else ''))
    pick = sorted({x[0] for x in sorted(M, key=lambda x: -x[1])[:3]} | {x[0] for x in sorted(Y, key=lambda x: -x[2])[:2]})
    if pick:
        ims = [cv2.putText(cv2.imread(files[i]), f'{comp} f{i}', (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2) for i in pick]
        cv2.imwrite(os.path.join(OUT, 'vatly', comp + '.jpg'), np.hstack(ims), [cv2.IMWRITE_JPEG_QUALITY, 88])
    bad += bool(M)
print('VẬT LÝ:', 'CÓ LỖI XUYÊN VẬT, sửa rồi chạy lại' if bad else 'không có chỗ nào xuyên vật' + ' (xem các cảnh báo xanh dương nếu có)')
sys.exit(1 if bad else 0)
