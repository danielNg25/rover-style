"""Survey of the green cape over the whole film: in every shot where a cape-like green shape is found for 12+ frames,
measure top centre, hem centre and hem width per frame (640x360) and summarise how the hem moves against the top.
Writes out/study/cape/shots.csv and prints the tallies."""
import json, glob, subprocess, os, csv, numpy as np, cv2
S = []
for f in sorted(glob.glob('research/rover-explains-2026-11-20/shots/chunk-*.json')):
    d = json.load(open(f)); S += d if isinstance(d, list) else d.get('shots', [])
os.makedirs('rover-lab/out/study/cape', exist_ok=True); rows = []
for s in S:
    f0, f1 = round(s['t0'] * 24) + 1, round(s['t1'] * 24) - 1; n = f1 - f0
    if n < 14: continue
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f0 / 24:.4f}', '-i', 'ref/rover_doom.webm', '-frames:v', str(n), '-vf', 'scale=640:360', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
    fr = np.frombuffer(p.stdout, np.uint8); fr = fr[:len(fr) // (640 * 360 * 3) * 640 * 360 * 3].reshape(-1, 360, 640, 3)
    seq = []
    for im in fr:
        m = cv2.inRange(cv2.cvtColor(im, cv2.COLOR_BGR2HSV), (50, 110, 70), (72, 255, 215))
        num, lab, st, _ = cv2.connectedComponentsWithStats(m, 8); ok = None
        for k in sorted(range(1, num), key=lambda k: -st[k, cv2.CC_STAT_AREA])[:2]:
            x, y, w, h, a = st[k]
            if 1200 < a < 60000 and 0.7 < h / w < 2.6 and a / (w * h) > 0.55 and x > 2 and x + w < 638: ok = (k, y, h, w); break
        if ok is None: seq.append(None); continue
        k, y, h, w = ok; ys, xs = np.nonzero(lab == k)
        top = xs[ys < y + h * 0.25].mean(); hx = xs[ys > y + h * 0.88]
        seq.append((top, hx.mean() - top, hx.max() - hx.min(), w, h))
    good = [v for v in seq if v is not None]
    if len(good) < 12 or len(good) < 0.8 * len(seq): continue
    a = np.array(good); w = np.median(a[:, 3]); sh = a[:, 1] / w * 100; top = a[:, 0] / w * 100; hw = a[:, 2] / w * 100
    d = np.abs(np.diff(sh)); big = d > 0.5
    # on twos: of the frame-to-frame steps where the hem offset changes, how many are followed by a step with no change
    pairs = sum(1 for i in range(len(d) - 1) if big[i] and not big[i + 1]); nbig = int(big[:-1].sum())
    vel = np.diff(top); corr = float(np.corrcoef(vel[1:], np.diff(sh)[1:])[0, 1]) if vel.std() > 0.05 and sh.std() > 0.05 else 0.0
    rows.append(dict(shot=s['i'], f0=f0, n=len(good), framing=s['framing'], travel=round(float(np.ptp(top)), 1), shear_range=round(float(np.ptp(sh)), 1), hemw_range=round(float(np.ptp(hw)), 1),
                     height_range=round(float(np.ptp(a[:, 4]) / np.median(a[:, 4]) * 100), 1), changes=nbig, held_after=pairs, corr=round(corr, 2), action=s['action'][:50]))
with open('rover-lab/out/study/cape/shots.csv', 'w', newline='') as f:
    wr = csv.DictWriter(f, fieldnames=list(rows[0])); wr.writeheader(); wr.writerows(rows)
R = rows; print('shots with a cape shape:', len(R))
mv = [r for r in R if r['travel'] >= 8]; st = [r for r in R if r['travel'] < 8]
for name, g in (('figure travels (top moves 8%+ of cape width)', mv), ('figure stays', st)):
    print(name, len(g), '| hem offset changes 3%+:', sum(r['shear_range'] >= 3 for r in g), '| 8%+:', sum(r['shear_range'] >= 8 for r in g), '| hem width changes 5%+:', sum(r['hemw_range'] >= 5 for r in g),
          '| median shear range', round(float(np.median([r['shear_range'] for r in g])), 1) if g else '-')
ch = sum(r['changes'] for r in R); print('hem-offset changes:', ch, 'followed by a held frame:', sum(r['held_after'] for r in R))
