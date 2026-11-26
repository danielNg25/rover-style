"""shotdeep.py - inspection material for EVERY shot of the reference, for the region-by-region study.
For shot N (1-based, from the cut list) writes into rover-lab/out/deep/sheets/:
  NNN-a.jpg  the middle frame at native size (1280x720)
  NNN-b.jpg  12 frames spread evenly over the shot (4x3), frame numbers burnt in
  NNN-c.jpg  top-left: head and upper body of the largest face found, enlarged; top-right: the region of the frame that
             changes most, 6 CONSECUTIVE frames at native size; bottom: the floor band with local contrast raised
and one line of measurements into rover-lab/out/deep/stats.jsonl (camera path, parallax, cadence, light jumps).
usage: shotdeep.py FIRST LAST        (shot numbers, inclusive)"""
import subprocess, sys, os, json, numpy as np, cv2
VID = 'ref/rover_doom.webm'; ROOT = 'rover-lab/out/deep'; os.makedirs(f'{ROOT}/sheets', exist_ok=True)
cuts = [0.0] + [float(x) for x in open('research/rover-explains-2026-11-20/bao-cao-goc/cuts.txt').read().split()] + [1435.0]
FR = [round(c * 24) for c in cuts]

def grab(f0, n, w, h):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f0 / 24:.4f}', '-i', VID, '-frames:v', str(n), '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
    a = np.frombuffer(p.stdout, np.uint8); k = len(a) // (w * h * 3); return a[:k * w * h * 3].reshape(k, h, w, 3)
def label(im, t, s=0.5):
    cv2.rectangle(im, (0, 0), (int(len(t) * 19 * s) + 8, int(34 * s) + 4), (0, 0, 0), -1); cv2.putText(im, t, (4, int(30 * s)), cv2.FONT_HERSHEY_SIMPLEX, s, (60, 235, 255), 1, cv2.LINE_AA); return im
def face_box(im):
    mn = im.min(2).astype(int); mx = im.max(2).astype(int); best = None
    for thr, chroma in ((225, 40), (200, 40), (175, 45), (150, 75)):   # the last pass catches eye whites tinted by warm or coloured light
        m = ((mn > thr) & ((mx - mn) < chroma)).astype(np.uint8); num, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        for k in range(1, num):
            x, y, w, h, a = st[k]
            if a < 500 or not 1.3 < w / h < 4.2 or a / (w * h) < 0.5: continue
            if (mn[y:y + h, x:x + w] < 80).mean() < 0.01: continue
            if best is None or a > best[4]: best = (x, y, w, h, a)
        if best: break
    return best
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6))
def boost(im):
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB); lab[..., 0] = clahe.apply(lab[..., 0]); return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
def fit(p0, p1):
    if len(p0) < 8: return None
    M, _ = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=1.5); return M

def shot(n):
    f0, f1 = FR[n - 1], FR[n]; cnt = f1 - f0
    if cnt < 3: return None
    F = grab(f0, cnt, 960, 540); cnt = len(F); G = [cv2.cvtColor(cv2.resize(f, (480, 270), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY) for f in F]
    S = 1.0; cx = cy = rot = 0.0; path = [(0, 0, 1.0)]; heat = np.zeros((270, 480), np.float32); change = []; masks = []; par = []; luma = [float(g.mean()) for g in G]
    for i in range(1, cnt):
        p0 = cv2.goodFeaturesToTrack(G[i - 1], 400, 0.01, 6); M = None
        if p0 is not None:
            p1, ok, _ = cv2.calcOpticalFlowPyrLK(G[i - 1], G[i], p0, None); ok = ok.ravel() == 1; a, b = p0[ok].reshape(-1, 2), p1[ok].reshape(-1, 2); M = fit(a, b)
            if M is not None:
                mt, mb = fit(a[a[:, 1] < 100], b[a[:, 1] < 100]), fit(a[a[:, 1] > 190], b[a[:, 1] > 190])
                if mt is not None and mb is not None: par.append(float(mt[0, 2] + mt[0, 0] * 240 - (mb[0, 2] + mb[0, 0] * 240)) - 0.0)
        if M is None: M = np.float32([[1, 0, 0], [0, 1, 0]])
        s = float(np.hypot(M[0, 0], M[1, 0])); S *= s; rot += float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
        # shift of the frame centre, in percent of frame width / height
        cx += float(M[0, 0] * 240 + M[0, 1] * 135 + M[0, 2] - 240) / 480 * 100; cy += float(M[1, 0] * 240 + M[1, 1] * 135 + M[1, 2] - 135) / 270 * 100; path.append((cx, cy, S))
        d = cv2.absdiff(cv2.warpAffine(G[i - 1], M, (480, 270), borderMode=cv2.BORDER_REPLICATE), G[i]); m = (d > 18).astype(np.float32); m[:6] = 0; m[-6:] = 0; m[:, :6] = 0; m[:, -6:] = 0
        heat += m; masks.append(m); change.append(float(m.mean() * 100))
    # busiest 120x120 window (320x320 native) and its busiest moment
    box = cv2.boxFilter(heat, -1, (120, 120), normalize=False); by, bx = np.unravel_index(np.argmax(box), box.shape); bx = int(np.clip(bx - 60, 0, 360)); by = int(np.clip(by - 60, 0, 150))
    win = [float(m[by:by + 120, bx:bx + 120].mean() * 100) for m in masks]; t = int(np.argmax(win)) if win else 0; t0 = int(np.clip(t - 2, 0, max(0, cnt - 6)))
    mov = [w > 0.3 for w in win]; nm = sum(mov[:-1]); held = sum(1 for i in range(len(mov) - 1) if mov[i] and not mov[i + 1])
    P = np.array(path); seg = np.hypot(np.diff(P[:, 0]), np.diff(P[:, 1])); L = float(seg.sum()); chord = float(np.hypot(P[-1, 0] - P[0, 0], P[-1, 1] - P[0, 1]))
    k3 = max(1, (cnt - 1) // 3); zr = [float(np.log(P[min(cnt - 1, (j + 1) * k3), 2] / P[j * k3, 2]) / k3 * 2400) for j in range(3)]
    st = dict(shot=n, f0=f0, frames=cnt, zoom=round(S, 4), pan_x=round(cx, 2), pan_y=round(cy, 2), rot_deg=round(rot, 2), path_len=round(L, 2), straight=round(chord / L, 2) if L > 0.3 else None,
              zoom_rate_thirds=[round(z, 2) for z in zr], parallax_px=round(float(np.median(np.abs(par))), 2) if par else None, parallax_signed=round(float(np.mean(par)), 2) if par else None,
              change_pct_med=round(float(np.median(change)), 2) if change else 0, change_pct_max=round(max(change), 2) if change else 0, busy_box=[bx * 8 // 3, by * 8 // 3, 320, 320], busy_frame=f0 + t,
              busy_moving_frames=nm, busy_held_after=held, luma=[round(luma[0], 1), round(luma[cnt // 2], 1), round(luma[-1], 1)], luma_jump=round(float(np.max(np.abs(np.diff(luma)))) if cnt > 1 else 0, 1))
    tag = f'{n:03d}'
    mid = grab(f0 + cnt // 2, 1, 1280, 720)[0].copy(); cv2.imwrite(f'{ROOT}/sheets/{tag}-a.jpg', label(mid.copy(), f'shot {n}  f{f0}-{f1 - 1}  {cnt} fr  mid f{f0 + cnt // 2}', 0.6), [cv2.IMWRITE_JPEG_QUALITY, 90])
    idx = [round(j * (cnt - 1) / 11) for j in range(12)]; B = np.zeros((810, 1920, 3), np.uint8)
    for j, i in enumerate(idx): B[(j // 4) * 270:(j // 4) * 270 + 270, (j % 4) * 480:(j % 4) * 480 + 480] = label(cv2.resize(F[i], (480, 270), interpolation=cv2.INTER_AREA), f'f{f0 + i}')
    cv2.imwrite(f'{ROOT}/sheets/{tag}-b.jpg', B, [cv2.IMWRITE_JPEG_QUALITY, 88])
    C = np.full((1045, 1600, 3), 24, np.uint8); fb = face_box(mid)
    if fb: x, y, w, h, _ = fb; x0 = int(x + w / 2 - w * 1.15); y0 = int(y - w * 1.0); sz = int(w * 2.3); hh = int(sz * 1.0)
    else: x0, y0, sz, hh = 320, 40, 640, 640
    x0 = int(np.clip(x0, 0, 1280 - min(sz, 1280))); y0 = int(np.clip(y0, 0, 720 - min(hh, 720))); crop = mid[y0:y0 + hh, x0:x0 + sz]
    C[0:640, 0:640] = label(cv2.resize(crop, (640, 640), interpolation=cv2.INTER_CUBIC), f'head x{640 / max(1, crop.shape[1]):.1f} @{x0},{y0}' if fb else 'no face found: centre')
    N6 = grab(f0 + t0, 6, 1280, 720); X, Y = st['busy_box'][0], st['busy_box'][1]; X = min(X, 960); Y = min(Y, 400)
    for j in range(len(N6)): C[(j // 3) * 320:(j // 3) * 320 + 320, 640 + (j % 3) * 320:960 + (j % 3) * 320] = label(N6[j][Y:Y + 320, X:X + 320].copy(), f'f{f0 + t0 + j} @{X},{Y}')
    C[640:1045] = label(cv2.resize(boost(mid[396:720]), (1600, 405), interpolation=cv2.INTER_CUBIC), 'floor band, contrast raised')
    cv2.imwrite(f'{ROOT}/sheets/{tag}-c.jpg', C, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return st

a, b = int(sys.argv[1]), int(sys.argv[2])
with open(f'{ROOT}/stats.jsonl', 'a') as out:
    for n in range(a, min(b, len(FR) - 1) + 1):
        st = shot(n)
        if st: out.write(json.dumps(st) + '\n'); out.flush()
print('done', a, b, 'of', len(FR) - 1, 'shots')
