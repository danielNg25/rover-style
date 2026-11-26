"""zoom.py - look closer at any part of the reference. Crops a box (native 1280x720 pixels) from the given frames,
enlarges it and tiles the frames in order, frame numbers burnt in.
usage: zoom.py OUT.jpg x0,y0,x1,y1 FRAMES [--clahe] [--cols N] [--scale K]
  FRAMES: 1200,1201,1205  or a run 1200-1211  (every frame of the run)
  --clahe raises local contrast (faint shadows, soft gradients); --scale default fits about 640 px per tile"""
import subprocess, sys, numpy as np, cv2
a = sys.argv[1:]; opt = {}
for k in ('--cols', '--scale'):
    if k in a: i = a.index(k); opt[k] = float(a[i + 1]); a = a[:i] + a[i + 2:]
cl = '--clahe' in a; a = [v for v in a if v != '--clahe']
out = a[0]; x0, y0, x1, y1 = [int(v) for v in a[1].split(',')]; fr = []
for part in a[2].split(','):
    if '-' in part: s, e = part.split('-'); fr += list(range(int(s), int(e) + 1))
    else: fr.append(int(part))
k = opt.get('--scale', min(4.0, 640 / max(1, x1 - x0))); cols = int(opt.get('--cols', min(len(fr), max(1, int(1920 // ((x1 - x0) * k))))))
c = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(4, 4)); tiles = []
for f in fr:
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f / 24:.4f}', '-i', 'ref/rover_doom.webm', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
    im = np.frombuffer(p.stdout, np.uint8).reshape(720, 1280, 3)[y0:y1, x0:x1]
    if cl: lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB); lab[..., 0] = c.apply(lab[..., 0]); im = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    im = cv2.resize(im, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC); cv2.rectangle(im, (0, 0), (78, 20), (0, 0, 0), -1); cv2.putText(im, f'f{f}', (4, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 235, 255), 1, cv2.LINE_AA); tiles.append(im)
h, w = tiles[0].shape[:2]; rows = (len(tiles) + cols - 1) // cols; sh = np.full((rows * h, cols * w, 3), 24, np.uint8)
for j, t in enumerate(tiles): sh[(j // cols) * h:(j // cols) * h + h, (j % cols) * w:(j % cols) * w + w] = t
cv2.imwrite(out, sh, [cv2.IMWRITE_JPEG_QUALITY, 90]); print(out, sh.shape[1], 'x', sh.shape[0])
