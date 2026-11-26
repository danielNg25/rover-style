"""cadence.py - how often the CHARACTER drawings change, with the camera's own motion removed.
For each shot: stabilise every frame onto the previous one (affine fitted on the whole picture), then, inside the part
of the frame that changes most (where the acting is), measure the share of pixels that changed per frame step.
  twos    = of the frame steps that follow an active step, the share that are (nearly) unchanged. Animation on twos
            alternates change / hold, so this is near 1; animation on ones gives near 0.
  active  = share of frame steps on which the acting area changes at all (how much of the shot something moves)
  events  = changes per second (new drawings per second in the acting area)
  moved   = mean share of the acting area that changes on an active step, in percent (how big the changes are)
usage: cadence.py VIDEO RANGES [--every N]     RANGES = 'ref' (the reference cut list) or 'a-b,c-d,...' frame ranges"""
import subprocess, sys, json, numpy as np, cv2
video = sys.argv[1]; every = int(sys.argv[sys.argv.index('--every') + 1]) if '--every' in sys.argv else 1
if sys.argv[2] == 'ref':
    cuts = [0.0] + [float(x) for x in open('research/rover-explains-2026-11-20/bao-cao-goc/cuts.txt').read().split()] + [1435.0]; F = [round(c * 24) for c in cuts]
    R = [(F[i] + 1, F[i + 1] - 1) for i in range(0, len(F) - 1, every) if F[i + 1] - F[i] >= 30]
else: R = [tuple(int(v) for v in r.split('-')) for r in sys.argv[2].split(',')]
W, H = 640, 360; rows = []
for f0, f1 in R:
    n = f1 - f0 + 1
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f0 / 24:.4f}', '-i', video, '-frames:v', str(n), '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True)
    G = np.frombuffer(p.stdout, np.uint8); G = G[:len(G) // (W * H) * W * H].reshape(-1, H, W)
    if len(G) < 24: continue
    D = []
    for i in range(1, len(G)):
        p0 = cv2.goodFeaturesToTrack(G[i - 1], 500, 0.01, 7); M = None
        if p0 is not None:
            p1, ok, _ = cv2.calcOpticalFlowPyrLK(G[i - 1], G[i], p0, None); ok = ok.ravel() == 1
            if ok.sum() >= 12: M, _ = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=1.0)
        if M is None: M = np.float32([[1, 0, 0], [0, 1, 0]])
        a = cv2.GaussianBlur(cv2.warpAffine(G[i - 1], M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), (0, 0), 1.2).astype(np.int16); b = cv2.GaussianBlur(G[i], (0, 0), 1.2).astype(np.int16)
        d = (np.abs(a - b) > 22).astype(np.float32); d[:8] = 0; d[-8:] = 0; d[:, :8] = 0; d[:, -8:] = 0; D.append(d)
    heat = sum(D); box = cv2.boxFilter(heat, -1, (150, 150), normalize=False); by, bx = np.unravel_index(np.argmax(box), box.shape); bx = int(np.clip(bx - 75, 0, W - 150)); by = int(np.clip(by - 75, 0, H - 150))
    c = np.array([d[by:by + 150, bx:bx + 150].mean() * 100 for d in D]); act = c > 0.12
    if act.sum() < 6: rows.append(dict(f0=f0, n=len(G), twos=None, active=float(act.mean()), events=float(act.sum() / len(c) * 24), moved=0.0)); continue
    follow = [c[i + 1] < 0.25 * c[i] for i in range(len(c) - 1) if c[i] > 0.3]
    rows.append(dict(f0=f0, n=len(G), twos=float(np.mean(follow)) if len(follow) >= 4 else None, active=float(act.mean()), events=float(act.sum() / len(c) * 24), moved=float(c[act].mean())))
t = [r['twos'] for r in rows if r['twos'] is not None]
q = lambda v: [round(float(x), 2) for x in np.percentile(v, [25, 50, 75])] if len(v) else None
print(f'shots {len(rows)} | twos share (25/50/75 %): {q(t)} | shots mostly on twos (>0.6): {sum(x > 0.6 for x in t)} of {len(t)}, mostly on ones (<0.25): {sum(x < 0.25 for x in t)}')
print(f"active share of frame steps: {q([r['active'] for r in rows])} | new drawings per second: {q([r['events'] for r in rows])} | area changed per active step %: {q([r['moved'] for r in rows if r['moved']])}")
if len(rows) <= 6:
    for r in rows: print('  ', {k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items()})
if '--gate' in sys.argv:
    # --gate wide,medium,close : one shot size per range. The floor for each size is the reference's lower quartile for shots of
    # that size with characters (out/deep/cadence-floors.json); the middle of the reference is printed beside it.
    sizes = sys.argv[sys.argv.index('--gate') + 1].split(','); FL = json.load(open('rover-lab/out/deep/cadence-floors.json')); MID = {'wide': 5.85, 'medium': 8.73, 'close': 12.52}; bad = 0
    for r, z in zip(rows, sizes):
        CEIL = {'wide': 8.24, 'medium': 11.29, 'close': 15.74}[z] * 1.15   # the reference's upper quartile plus a margin: more than this reads as wobble
        ok = r['active'] >= min(0.42, FL[z]['active']) and FL[z]['moved'] <= r['moved'] <= CEIL; bad += not ok
        print(f"  {z:6s} shot at f{r['f0']}: new drawing on {r['active'] * 100:.0f} % of frames (floor 42); each change moves {r['moved']:.1f} % of the acting area (allowed {FL[z]['moved']:.1f} to {CEIL:.1f}, reference middle {MID[z]}) -> {'pass' if ok else 'FAIL'}")
    print('MOTION GATE:', 'FAIL' if bad else 'PASS')
json.dump(rows, open('rover-lab/out/deep/cadence-' + ('ref' if sys.argv[2] == 'ref' else 'ours') + '.json', 'w'))
