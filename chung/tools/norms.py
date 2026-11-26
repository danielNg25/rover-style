"""norms.py - how much drawn detail a region of a frame carries in the REFERENCE, over all its shots, so that a new
scene can be checked WITHOUT a matching reference shot.
  norms.py build                 -> rover-lab/out/deep/norms.json  (from the middle frame of every reference shot)
  norms.py check VIDEO f1,f2,... -> where each region of those frames falls in the reference's distribution
Regions: top (far background), left and right (set pieces), ground. Measures: edges (share of edge pixels),
tones (distinct colour clusters over 0.4 % of the region), texture (mean local contrast)."""
import sys, json, glob, subprocess, numpy as np, cv2
REG = {'top': (0, 0, 1280, 240), 'left': (0, 120, 427, 600), 'right': (853, 120, 1280, 600), 'ground': (0, 470, 1280, 720)}
def metrics(c):
    g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY); e = cv2.Canny(g, 40, 110); q = (c // 24).reshape(-1, 3); _, cnt = np.unique(q, axis=0, return_counts=True)
    return dict(edges=float((e > 0).mean() * 100), tones=int((cnt > q.shape[0] * 0.004).sum()), texture=float(np.abs(g.astype(np.float32) - cv2.GaussianBlur(g, (0, 0), 6).astype(np.float32)).mean()))
P = 'rover-lab/out/deep/norms.json'
if sys.argv[1] == 'build':
    rows = {r: [] for r in REG}
    for f in sorted(glob.glob('rover-lab/out/deep/sheets/*-a.jpg')):
        im = cv2.imread(f)
        if im is None: continue
        im[:30, :520] = im[30:60, :520]   # cover the label bar
        for r, (x0, y0, x1, y1) in REG.items(): rows[r].append(metrics(im[y0:y1, x0:x1]))
    out = {r: {k: [round(float(np.percentile([m[k] for m in v], p)), 2) for p in (10, 25, 50, 75, 90)] for k in ('edges', 'tones', 'texture')} for r, v in rows.items()}
    out['n'] = len(rows['top']); json.dump(out, open(P, 'w'), indent=1); print(json.dumps(out))
else:
    N = json.load(open(P)); video = sys.argv[2]
    for f in [int(v) for v in sys.argv[3].split(',')]:
        p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f / 24:.4f}', '-i', video, '-frames:v', '1', '-vf', 'scale=1280:720', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
        im = np.frombuffer(p.stdout, np.uint8).reshape(720, 1280, 3)
        for r, (x0, y0, x1, y1) in REG.items():
            m = metrics(im[y0:y1, x0:x1]); line = []
            for k in ('edges', 'tones'):
                q = N[r][k]; rank = 'below the lowest tenth' if m[k] < q[0] else 'lowest quarter' if m[k] < q[1] else 'below the middle' if m[k] < q[2] else 'above the middle'
                line.append(f"{k} {m[k]:.2f} ({rank}; reference middle {q[2]})")
            print(f'frame {f} {r:6s} ' + ' | '.join(line))
