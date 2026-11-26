"""Cape / coat motion: per frame, find the garment by colour and report where its top and its hem are.
shear = hem centre x minus top centre x (px); hemw = hem width; a garment that hangs rigidly keeps both constant
while the figure travels. Shows whether cloth moves on its own, on twos or every frame, and whether it overshoots.
usage: capemotion.py <first> <count> <green|brown> [x0,y0,x1,y1]"""
import subprocess, sys, numpy as np, cv2
f0, n, kind = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
box = [int(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else [0, 0, 1280, 720]
p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f0 / 24:.4f}', '-i', 'ref/rover_doom.webm', '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True)
fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, 720, 1280, 3)
prev = None; out = []
for i, im in enumerate(fr):
    c = im[box[1]:box[3], box[0]:box[2]]; hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (45, 90, 60), (75, 255, 220)) if kind == 'green' else cv2.inRange(hsv, (8, 80, 60), (20, 200, 170))
    num, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if num < 2: out.append((f0 + i, None)); continue
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); mm = lab == k
    ys, xs = np.nonzero(mm); y0, y1 = ys.min(), ys.max(); h = y1 - y0 + 1
    top = xs[ys < y0 + h * 0.25].mean(); hemrows = ys > y1 - h * 0.12; hx = xs[hemrows]
    same = prev is not None and np.array_equal(mm, prev); prev = mm
    out.append((f0 + i, round(float(top), 1), round(float(hx.mean() - top), 1), int(hx.max() - hx.min()), int(h), int(y1), '=' if same else ''))
print('frame topx shear hemw height bottom same-as-previous')
for o in out: print(*o)
