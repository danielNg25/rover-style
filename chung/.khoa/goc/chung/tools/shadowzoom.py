"""Shadow study, zoom: given frames and a native crop box, show the crop enlarged with contrast raised,
so the outline of a soft floor shadow can be compared between poses.
usage: shadowzoom.py NAME x0,y0,x1,y1 f1 f2 ... [--cols N]"""
import subprocess, os, sys, cv2, numpy as np
ROOT = 'rover-lab/out/study/shadow/zoom'; os.makedirs(ROOT, exist_ok=True)
a = sys.argv[1:]; cols = 3
if '--cols' in a: i = a.index('--cols'); cols = int(a[i + 1]); a = a[:i] + a[i + 2:]
name = a[0]; x0, y0, x1, y1 = [int(v) for v in a[1].split(',')]; frames = [int(v) for v in a[2:]]
cl = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(4, 4)); tiles = []
W = 1880 // cols - 4
for f in frames:
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f / 24:.4f}', '-i', 'ref/rover_doom.webm', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True)
    im = cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR)[y0:y1, x0:x1]
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB); lab[..., 0] = cl.apply(lab[..., 0]); im = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    im = cv2.resize(im, (W, int(im.shape[0] * W / im.shape[1])), interpolation=cv2.INTER_CUBIC)
    cv2.rectangle(im, (0, 0), (90, 20), (0, 0, 0), -1); cv2.putText(im, f'f{f}', (4, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 235, 255), 1, cv2.LINE_AA)
    tiles.append(im)
h = tiles[0].shape[0]; rws = (len(tiles) + cols - 1) // cols
sh = np.full((rws * (h + 4), cols * (W + 4), 3), 20, np.uint8)
for j, t in enumerate(tiles): sh[(j // cols) * (h + 4):(j // cols) * (h + 4) + h, (j % cols) * (W + 4):(j % cols) * (W + 4) + W] = t
cv2.imwrite(f'{ROOT}/{name}.jpg', sh, [cv2.IMWRITE_JPEG_QUALITY, 92]); print(name, sh.shape)
