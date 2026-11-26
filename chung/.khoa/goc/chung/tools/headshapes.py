"""Head moulds of the reference: for every face found in the film, trace the skin outline of the head (eyes and mouth
filled in), scale it to the eye band, and measure how square the jaw is and how long the face is.
Run from rover-lab/:  uv run --offline --no-project --with opencv-python-headless --with numpy python tools/headshapes.py
Writes out/gallery/khuon-dau.jpg (heads sorted from most pointed to most square, outline drawn) and headshapes.json."""
import subprocess, json, os, numpy as np, cv2
V = '../ref/rover_doom.webm'; W, H, FPS = 960, 540, 2; OUT = 'out/gallery'
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', V, '-vf', f'fps={FPS},scale={W}:{H}', '-pix_fmt', 'bgr24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
recs = []; bodies = []; n = 0
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3).copy(); t = n / FPS; n += 1
    mn = f.min(2).astype(int); mx = f.max(2).astype(int); done = []
    for thr in (225, 200, 175):
        m = ((mn > thr) & ((mx - mn) < 40)).astype(np.uint8)
        num, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, num):
            x, y, w, h, a = [int(v) for v in st[i]]
            if 34 <= w < 70 and 10 <= h <= 40 and 1.3 <= w / h <= 4.2 and a > 0.5 * w * h and (mx[y:y + h, x:x + w] < 120).mean() > 0.006:
                bx0, by0, bx1, by1 = int(x + w / 2 - 1.7 * w), int(y + h / 2 - 1.3 * w), int(x + w / 2 + 1.7 * w), int(y + h / 2 + 4.3 * w)
                if bx0 >= 0 and by0 >= 0 and bx1 <= W and by1 <= H and not any(abs(t - bt) < 2.5 and abs(x - bxx) < 60 for bt, bxx, _ in bodies[-30:]):
                    bodies.append((t, x, cv2.resize(f[by0:by1, bx0:bx1], (122, 200), interpolation=cv2.INTER_AREA)))
            if not (70 <= w <= 380 and 22 <= h <= 200 and 1.3 <= w / h <= 4.2 and a > 0.5 * w * h): continue
            if any(abs(x - dx) < dw * 0.6 and abs(y - dy) < dw * 0.5 for dx, dy, dw in done): continue
            cx, cy = x + w / 2, y + h / 2
            x0, y0, x1, y1 = int(cx - 1.05 * w), int(cy - 0.95 * w), int(cx + 1.05 * w), int(cy + 1.15 * w)
            if x0 < 0 or y0 < 0 or x1 > W or y1 > H: continue
            msk = (lab[y:y + h, x:x + w] == i); col = msk.sum(0); c0 = w // 2
            if col[max(0, c0 - 4):c0 + 4].min() > 0.88 * min(col[w // 8:w // 2 - 6].max(), col[w // 2 + 6:w - w // 8].max()): continue   # not two eyes
            if (mx[y:y + h, x:x + w] < 120).mean() < 0.006: continue                                                                # no pupils
            done.append((x, y, w))
            # skin seed: just under the eye band, on the centre line
            sy, sx = int(y + h + 0.07 * w), int(cx)
            seed = np.median(f[sy - 2:sy + 3, sx - 3:sx + 4].reshape(-1, 3), 0)
            d = np.abs(f[y0:y1, x0:x1].astype(int) - seed).max(2)
            skin = (d < 34).astype(np.uint8)
            num2, lab2 = cv2.connectedComponents(skin, connectivity=4); k = lab2[sy - y0, sx - x0]
            if k == 0: continue
            comp = (lab2 == k).astype(np.uint8)
            cs, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            full = np.zeros_like(comp); cv2.drawContours(full, cs, -1, 1, -1)
            ys = np.where(full[:, sx - x0])[0]
            if len(ys) < 5: continue
            chin = ys.max(); ey = int(cy - y0); cd = (chin - ey) / w
            if not (0.35 < cd < 1.7) or chin >= full.shape[0] - 2: continue
            wid = lambda r: int(full[int(np.clip(r, 0, full.shape[0] - 1))].sum())
            cheek = np.median([wid(ey + q * w) for q in (0.2, 0.25, 0.3, 0.35)]); jaw = wid(chin - 0.16 * w); mid = wid((ey + chin) / 2)
            if cheek < 0.9 * w or cheek > 2.0 * w: continue          # a hand or another face merged in, or the mask leaked
            rowl = np.where(full[int(ey + 0.3 * w)])[0]
            if abs((rowl.min() + rowl.max()) / 2 - (sx - x0)) > 0.12 * w: continue   # not symmetric about the eyes: turned head or leak
            prof = [wid(ey + u * (chin - ey)) / w for u in np.linspace(0.0, 0.97, 12)]
            bx0, by0, bx1, by1 = int(cx - 0.62 * w), int(y - 0.36 * w), int(cx + 0.62 * w), int(y + 0.10 * w)
            brow = cv2.resize(f[by0:by1, bx0:bx1], (124, 46), interpolation=cv2.INTER_AREA) if by0 >= 0 and bx0 >= 0 and bx1 <= W else None
            tile = cv2.resize(f[y0:y1, x0:x1], (150, 150), interpolation=cv2.INTER_AREA); sc = 150 / (x1 - x0)
            cv2.drawContours(tile, [(c * sc).astype(np.int32) for c in cs], -1, (255, 0, 255), 1)
            recs.append({'t': round(t, 1), 'sq': round(jaw / cheek, 3), 'mid': round(mid / cheek, 3), 'cd': round(cd, 3), 'fw': round(cheek / w, 3), 'skin': [int(v) for v in seed], 'tile': tile, 'prof': prof, 'brow': brow})
print('frames', n, 'heads', len(recs))
sq = np.array([r['sq'] for r in recs]); cd = np.array([r['cd'] for r in recs]); fw = np.array([r['fw'] for r in recs])
stats = {'heads': len(recs), 'jaw_over_cheek_pct': [round(float(np.percentile(sq, q)), 2) for q in (5, 25, 50, 75, 95)], 'jaw_hist_0.3_to_1.0': np.histogram(sq, bins=np.arange(0.3, 1.01, 0.05))[0].tolist(),
         'chin_drop_pct': [round(float(np.percentile(cd, q)), 2) for q in (5, 25, 50, 75, 95)], 'chin_hist_0.4_to_1.4': np.histogram(cd, bins=np.arange(0.4, 1.41, 0.1))[0].tolist(),
         'face_width_pct': [round(float(np.percentile(fw, q)), 2) for q in (5, 25, 50, 75, 95)]}
# one tile per moment: drop near-repeats (same second range and same shape), then sample evenly along squareness
recs.sort(key=lambda r: r['sq']); kept = []
for r in recs:
    if any(abs(r['t'] - k['t']) < 6 and abs(r['sq'] - k['sq']) < 0.05 for k in kept[-40:]): continue
    kept.append(r)
pick = [kept[int(i)] for i in np.linspace(0, len(kept) - 1, min(70, len(kept)))]
for r in pick: cv2.putText(r['tile'], f"{r['sq']:.2f} {r['cd']:.2f} {int(r['t'])}s", (3, 146), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
rows = [np.hstack([r['tile'] for r in pick[i:i + 10]] + [np.zeros((150, 150, 3), np.uint8)] * (10 - len(pick[i:i + 10]))) for i in range(0, len(pick), 10)]
cv2.imwrite(os.path.join(OUT, 'khuon-dau.jpg'), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
stats['distinct_moments'] = len(kept); json.dump(stats, open(os.path.join(OUT, 'headshapes.json'), 'w'), indent=1); print(json.dumps(stats))

# ---------------------------------------------------------------- head moulds: group the lower-face outlines
def kmeans(X, k, it=50, seed=5):
    r = np.random.RandomState(seed); C = X[r.choice(len(X), k, replace=False)].copy()
    for _ in range(it):
        L = ((X[:, None, :] - C[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            if (L == j).any(): C[j] = X[L == j].mean(0)
    return L, C
X = np.array([r['prof'] + [r['cd']] for r in recs], np.float32); K = 8; L, C = kmeans(X, K); rows = []; out = []
for j in np.argsort([-(L == j).sum() for j in range(K)]):
    idx = np.where(L == j)[0]
    if len(idx) < 8: continue
    c = C[j]; cdm = float(c[12]); can = np.full((150, 170, 3), 30, np.uint8); S = 62      # S px = one eye band
    pts = [(85 - c[i] * S / 2, 40 + u * cdm * S) for i, u in enumerate(np.linspace(0, 0.97, 12))]; pts += [(170 - x, y) for x, y in pts[::-1]]
    cv2.polylines(can, [np.array(pts, np.int32)], False, (255, 0, 255), 2); cv2.line(can, (85 - S // 2, 40), (85 + S // 2, 40), (255, 255, 255), 1)
    cv2.putText(can, f'{len(idx)} mat ({100 * len(idx) // len(recs)}%)', (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 255), 1)
    cv2.putText(can, f'ma {c[3]:.2f} ham {c[9]:.2f} dai {cdm:.2f}', (4, 144), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)
    ts = sorted(idx, key=lambda i: recs[i]['t']); pick = []
    for i in ts:
        if not pick or recs[i]['t'] - recs[pick[-1]]['t'] > 20: pick.append(i)
    pick = [pick[int(v)] for v in np.linspace(0, len(pick) - 1, min(9, len(pick)))]
    rows.append(np.hstack([can] + [recs[i]['tile'] for i in pick] + [np.zeros((150, 150, 3), np.uint8)] * (9 - len(pick))))
    out.append({'faces': int(len(idx)), 'cheek_width': round(float(c[3]), 2), 'jaw_width': round(float(c[9]), 2), 'chin_drop': round(cdm, 2), 'jaw_over_cheek': round(float(c[9] / c[3]), 2)})
cv2.imwrite(os.path.join(OUT, 'khuon-dau-nhom.jpg'), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88]); print('HEAD GROUPS', json.dumps(out))
# ---------------------------------------------------------------- brows: one crop per moment, grouped by the dark shapes above the eyes
br = [r for r in recs if r['brow'] is not None]; B = []
for r in br:
    g = cv2.cvtColor(r['brow'], cv2.COLOR_BGR2GRAY).astype(int); B.append(cv2.resize((g < np.percentile(g, 18)).astype(np.float32), (31, 12)).reshape(-1))
LB, CB = kmeans(np.array(B, np.float32), 10); rows = []
for j in np.argsort([-(LB == j).sum() for j in range(10)]):
    idx = np.where(LB == j)[0]
    if len(idx) < 6: continue
    ts = sorted(idx, key=lambda i: br[i]['t']); pick = []
    for i in ts:
        if not pick or br[i]['t'] - br[pick[-1]]['t'] > 15: pick.append(i)
    pick = [pick[int(v)] for v in np.linspace(0, len(pick) - 1, min(11, len(pick)))]
    lab = np.full((46, 124, 3), 30, np.uint8); cv2.putText(lab, f'{len(idx)} ({100 * len(idx) // len(br)}%)', (6, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    rows.append(np.hstack([lab] + [br[i]['brow'] for i in pick] + [np.zeros((46, 124, 3), np.uint8)] * (11 - len(pick))))
cv2.imwrite(os.path.join(OUT, 'khuon-long-may.jpg'), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 90])
# ---------------------------------------------------------------- bodies: whole figures at the same eye-band scale
pick = [bodies[int(v)] for v in np.linspace(0, len(bodies) - 1, min(48, len(bodies)))]
cv2.imwrite(os.path.join(OUT, 'khuon-than.jpg'), np.vstack([np.hstack([b[2] for b in pick[i:i + 16]] + [np.zeros((200, 122, 3), np.uint8)] * (16 - len(pick[i:i + 16]))) for i in range(0, len(pick), 16)]), [cv2.IMWRITE_JPEG_QUALITY, 88])
print('bodies', len(bodies), 'brows', len(br))
