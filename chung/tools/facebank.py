"""Face bank of the reference film: scan the whole video (3 frames per second), find every eye pair (the big white eye
band), cut normalised EYE, MOUTH and HEAD crops, then group the eye shapes and the mouth shapes to see how many
moulds exist, and measure head proportions against the eye band.
Run from rover-lab/ with OpenCV:  uv run --offline --no-project --with opencv-python-headless --with numpy python tools/facebank.py
Writes out/gallery/khuon-mat-mat.jpg (eye shapes), khuon-mat-mieng.jpg (mouths), khuon-mat-dau.jpg (heads by proportion), facebank.json."""
import subprocess, json, os, numpy as np, cv2
V = '../ref/rover_doom.webm'; W, H, FPS = 640, 360, 3
OUT = 'out/gallery'; os.makedirs(OUT, exist_ok=True)
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', V, '-vf', f'fps={FPS},scale={W}:{H}', '-pix_fmt', 'bgr24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
faces = []; prev = []; n = 0
def crop(f, x0, y0, x1, y1, size):
    x0, y0, x1, y1 = [int(round(v)) for v in (x0, y0, x1, y1)]
    if x0 < 0 or y0 < 0 or x1 > W or y1 > H or x1 - x0 < 8 or y1 - y0 < 8: return None
    return cv2.resize(f[y0:y1, x0:x1], size, interpolation=cv2.INTER_AREA)
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3); t = n / FPS; n += 1
    mn = f.min(2).astype(int); mx = f.max(2).astype(int); found = []
    for thr in (225, 200, 175):
        m = ((mn > thr) & ((mx - mn) < 40)).astype(np.uint8)
        num, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, num):
            x, y, w, h, a = [int(v) for v in st[i]]
            if not (44 <= w <= 300 and 14 <= h <= 150 and 1.3 <= w / h <= 4.2 and a > 0.5 * w * h): continue
            if y + h > H * 0.86 or x < 4 or x + w > W - 4 or y < 4: continue
            roi_mx = mx[y:y + h, x:x + w]; dark = roi_mx < 135
            if not (0.008 <= dark.mean() <= 0.3) or dark[:, :w // 2].sum() < 3 or dark[:, w // 2:].sum() < 3: continue
            if any(abs(x - fx) < fw * 0.6 and abs(y - fy) < fh for fx, fy, fw, fh, _ in found): continue
            found.append((x, y, w, h, (lab[y:y + h, x:x + w] == i)))
    cur = []
    for x, y, w, h, msk in found:
        cx, cy = x + w / 2, y + h / 2
        sig = cv2.resize(msk.astype(np.uint8) * 255, (12, 8)) > 127
        cur.append((cx, cy, w, sig))
        if any(abs(cx - px) < 14 and abs(cy - py) < 14 and abs(w - pw) < 10 and (sig != ps).sum() < 7 for px, py, pw, ps in prev): continue
        full = np.zeros((H, W), np.uint8); full[y:y + h, x:x + w] = msk * 255
        eye = crop(f, cx - 0.56 * w, cy - 0.36 * w, cx + 0.56 * w, cy + 0.36 * w, (112, 72))
        eyem = crop(full[..., None].repeat(3, 2), cx - 0.56 * w, cy - 0.36 * w, cx + 0.56 * w, cy + 0.36 * w, (112, 72))
        mouth = crop(f, cx - 0.5 * w, y + h + 0.03 * w, cx + 0.5 * w, y + h + 0.7 * w, (100, 67))
        head = crop(f, cx - 0.95 * w, cy - 0.95 * w, cx + 0.95 * w, cy + 0.95 * w, (128, 128))
        if eye is None or eyem is None: continue
        rec = {'t': round(t, 2), 'w': w, 'eye': eye, 'eyem': (eyem[..., 0] > 127), 'mouth': mouth, 'head': head, 'fw': None, 'chin': None, 'eh': round(h / w, 3)}
        if mouth is not None:
            skin = np.median(mouth.reshape(-1, 3), 0); d = np.abs(f.astype(int) - skin).sum(2)
            row = min(H - 1, int(y + h + 0.06 * w)); xl = int(cx); xr = int(cx)
            while xl > 0 and (d[row, xl] < 70 or mn[row, xl] > 170): xl -= 1
            while xr < W - 1 and (d[row, xr] < 70 or mn[row, xr] > 170): xr += 1
            yy = int(y + h); gap = 0; last = yy
            while yy < H - 1 and gap < 0.14 * w:
                if d[yy, int(cx)] < 70: last = yy; gap = 0
                else: gap += 1
                yy += 1
            if xl > 2 and xr < W - 3 and last < H - 3: rec['fw'] = round((xr - xl) / w, 3); rec['chin'] = round((last - cy) / w, 3)
        faces.append(rec)
    prev = cur
print('frames', n, 'faces', len(faces))


# ---------------------------------------------------------------- pass 2: keep real eye pairs, then name the lid and mouth moulds
def lobe(m, x0, x1, inner_sign):
    cols = [x for x in range(x0, x1) if m[:, x].any()]
    if len(cols) < 16: return None
    a, b = cols[0], cols[-1]; wd = b - a + 1; xs = [x for x in cols if a + 0.2 * wd <= x <= a + 0.8 * wd]
    top = np.array([np.argmax(m[:, x]) for x in xs], float); bot = np.array([len(m) - 1 - np.argmax(m[::-1, x]) for x in xs], float); xa = np.array(xs, float)
    kt = np.polyfit(xa, top, 1); kb = np.polyfit(xa, bot, 1)
    return {'w': wd, 'h': float(np.median(bot - top)), 'top_res': float(np.std(top - np.polyval(kt, xa))), 'bot_res': float(np.std(bot - np.polyval(kb, xa))), 'top_in': float(kt[0] * inner_sign), 'bot_in': float(kb[0] * inner_sign)}
def eye_class(fc):
    m = fc['eyem']; L = lobe(m, 0, 56, 1); R = lobe(m, 56, 112, -1)
    if L is None or R is None: return None
    col = m.sum(0)
    if col[52:60].min() > 0.88 * min(col[14:42].max(), col[70:98].max()): return None        # no waist between the two eyes: not an eye pair
    g = cv2.cvtColor(fc['eye'], cv2.COLOR_BGR2GRAY); dk = ((g < 110) & cv2.dilate(m.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)).astype(np.uint8)
    nb = sum(1 for i in range(1, cv2.connectedComponentsWithStats(dk, 8)[0]) if cv2.connectedComponentsWithStats(dk, 8)[2][i][4] >= 8)
    if nb < 2 or nb > 6: return None
    def top(e):
        if e['top_res'] > 1.1: return 'tron'                      # round top edge: lid not lowered
        if e['top_in'] > 0.13: return 'xech-vao'                  # straight cut, lower toward the nose: angry
        if e['top_in'] < -0.13: return 'xech-ra'                  # straight cut, lower toward the ear: sad / worried
        return 'ngang'                                           # straight level cut: half-lidded
    tl, tr = top(L), top(R); r = (L['h'] / L['w'] + R['h'] / R['w']) / 2
    t = tl if tl == tr else 'lech'                               # the two eyes differ: asymmetric (doubt, smirk)
    low = 'duoi-day-len' if (L['bot_res'] < 0.9 and R['bot_res'] < 0.9 and r < 0.8) else ''
    if t == 'tron' and r >= 0.95: name = 'mo-to'
    elif t == 'tron': name = 'mo-thuong'
    else: name = 'mi-' + t
    if r < 0.5: name = 'nheo-hep'
    return name + ('+' + low if low and t == 'tron' else ''), r
def mouth_class(fc):
    if fc['mouth'] is None: return None
    m = fc['mouth'].astype(int)[8:60, 14:86]; lum = m.sum(2) / 3; skin = np.median(lum)
    dark = lum < 0.6 * skin; teeth = (m.min(2) > 205) & (lum > skin * 1.12)
    if dark.mean() > 0.3: return 'rau-hoac-che'                  # beard, hand or shadow covers the mouth area
    if teeth.mean() > 0.03: return 'rang'
    ys, xs = np.where(dark)
    if len(xs) < 25: return 'khong-thay'
    wd, ht = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1; thick = len(xs) / max(wd, 1)
    if thick > 7 and ht > 0.45 * wd: return 'ha-tron'
    if thick > 5: return 'ha-det'
    k = np.polyfit(xs - xs.mean(), ys, 2)[0] * wd
    return 'cong-len' if k < -0.08 else ('cong-xuong' if k > 0.08 else 'ngang')
def rows_sheet(name, cats, imgs, size, per=14):
    tw, th = size; rows = []
    for cname, idx in sorted(cats.items(), key=lambda kv: -len(kv[1])):
        row = np.full((th + 4, 210 + tw * per, 3), 30, np.uint8)
        for j, i in enumerate([idx[int(v)] for v in np.linspace(0, len(idx) - 1, min(per, len(idx)))]): row[2:2 + th, 210 + tw * j:210 + tw * (j + 1)] = imgs[i]
        cv2.putText(row, cname, (6, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1); cv2.putText(row, f'{len(idx)}  ({100 * len(idx) / tot:.0f}%)', (6, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1); rows.append(row)
    cv2.imwrite(os.path.join(OUT, name), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
real = []; ecats = {}; mcats = {}
for i, fc in enumerate(faces):
    ec = eye_class(fc)
    if ec is None: continue
    real.append(i); ecats.setdefault(ec[0], []).append(i)
tot = len(real)
rows_sheet('khuon-mi-mat.jpg', ecats, [fc['eye'] for fc in faces], (112, 72), 12)
for i in real:
    mc = mouth_class(faces[i])
    if mc: mcats.setdefault(mc, []).append(i)
blank = np.zeros((67, 100, 3), np.uint8)
rows_sheet('khuon-mieng.jpg', mcats, [fc['mouth'] if fc['mouth'] is not None else blank for fc in faces], (100, 67), 12)
print('REAL FACES', tot, 'of', len(faces)); print('EYES', {k: len(v) for k, v in sorted(ecats.items(), key=lambda kv: -len(kv[1]))}); print('MOUTHS', {k: len(v) for k, v in sorted(mcats.items(), key=lambda kv: -len(kv[1]))})
faces = [faces[i] for i in real]

def kmeans(X, k, it=40, seed=3):
    r = np.random.RandomState(seed); C = X[r.choice(len(X), k, replace=False)].copy()
    for _ in range(it):
        D = ((X[:, None, :] - C[None]) ** 2).sum(2); L = D.argmin(1)
        for j in range(k):
            if (L == j).any(): C[j] = X[L == j].mean(0)
    return L, C
def sheet(name, groups, imgs, means, size, title):
    tw, th = size; rows = []
    for gi, (idx, mean) in enumerate(zip(groups, means)):
        row = np.full((th + 4, 150 + tw * 11 + 4, 3), 30, np.uint8)
        mm = cv2.resize((mean * 255).astype(np.uint8), (tw, th)); row[2:2 + th, 150:150 + tw] = cv2.cvtColor(mm, cv2.COLOR_GRAY2BGR)
        pick = idx[np.linspace(0, len(idx) - 1, min(10, len(idx))).astype(int)]
        for j, i in enumerate(pick): row[2:2 + th, 150 + tw * (j + 1):150 + tw * (j + 2)] = imgs[i]
        cv2.putText(row, f'{title} {gi + 1}', (6, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(row, f'{len(idx)} ({100 * len(idx) // len(imgs)}%)', (6, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        rows.append(row)
    cv2.imwrite(os.path.join(OUT, name), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])

stats = {'faces': len(faces)}
# ---- eyes: shape of the white area, eye band width normalised
X = np.array([fc['eyem'].reshape(-1) for fc in faces], np.float32); K = 14
L, C = kmeans(X, K); order = np.argsort([-(L == j).sum() for j in range(K)])
groups = [np.where(L == j)[0] for j in order if (L == j).sum() >= 4]
sheet('khuon-mat-mat.jpg', groups, [fc['eye'] for fc in faces], [C[j].reshape(72, 112) for j in order if (L == j).sum() >= 4], (112, 72), 'mat')
stats['eye_groups'] = [int(len(g)) for g in groups]
# ---- mouths: dark stroke / open mouth / teeth below the eyes
mi = [i for i, fc in enumerate(faces) if fc['mouth'] is not None]; M = []
for i in mi:
    m = faces[i]['mouth'].astype(int); lum = m.sum(2) / 3; skin = np.median(lum)
    dark = (lum < 0.62 * skin).astype(np.float32); teeth = ((m.min(2) > 205) & (lum > skin * 1.12)).astype(np.float32)
    M.append(np.concatenate([cv2.resize(dark, (40, 27)).reshape(-1), 0.7 * cv2.resize(teeth, (40, 27)).reshape(-1)]))
M = np.array(M, np.float32); KM = 12; L2, C2 = kmeans(M, KM); order2 = np.argsort([-(L2 == j).sum() for j in range(KM)])
g2 = [np.where(L2 == j)[0] for j in order2 if (L2 == j).sum() >= 4]
sheet('khuon-mat-mieng.jpg', g2, [faces[i]['mouth'] for i in mi], [np.clip(C2[j][:1080] + C2[j][1080:], 0, 1).reshape(27, 40) for j in order2 if (L2 == j).sum() >= 4], (100, 67), 'mieng')
stats['mouth_groups'] = [int(len(g)) for g in g2]
# ---- heads: face width and chin drop relative to the eye band
hp = [(fc['fw'], fc['chin'], i) for i, fc in enumerate(faces) if fc['fw'] and fc['head'] is not None and 0.9 < fc['fw'] < 2.2 and 0.4 < fc['chin'] < 1.6]
fw = np.array([a for a, _, _ in hp]); ch = np.array([b for _, b, _ in hp])
stats['head'] = {'n': len(hp), 'face_width_over_eye_band': [round(float(np.percentile(fw, q)), 2) for q in (10, 25, 50, 75, 90)], 'chin_drop_over_eye_band': [round(float(np.percentile(ch, q)), 2) for q in (10, 25, 50, 75, 90)],
                 'hist_face_width': np.histogram(fw, bins=np.arange(0.9, 2.21, 0.1))[0].tolist(), 'hist_chin': np.histogram(ch, bins=np.arange(0.4, 1.61, 0.1))[0].tolist()}
hp.sort(key=lambda a: a[1]); pick = [hp[i] for i in np.linspace(0, len(hp) - 1, 48).astype(int)]; tiles = []
for a, b, i in pick:
    im = faces[i]['head'].copy(); cv2.putText(im, f'{a:.2f} / {b:.2f}', (4, 122), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1); tiles.append(im)
cv2.imwrite(os.path.join(OUT, 'khuon-mat-dau.jpg'), np.vstack([np.hstack(tiles[r * 12:(r + 1) * 12]) for r in range(4)]), [cv2.IMWRITE_JPEG_QUALITY, 88])
stats['eye_height_over_width_hist'] = np.histogram([fc['eh'] for fc in faces], bins=np.arange(0.2, 0.81, 0.05))[0].tolist()
json.dump(stats, open(os.path.join(OUT, 'facebank.json'), 'w'), indent=1); print(json.dumps(stats))
