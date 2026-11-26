"""selfcheck.py - the gate a built sequence passes BEFORE the owner sees it.
Pairs our render with the reference shot by shot and region by region at native size, and measures how much
detail each region carries, so a reviewer (who is not told what to look for) can list every difference.

usage: selfcheck.py OURS.mp4 REF_FIRST_FRAME OUT_DIR LEN1,LEN2,...     (shot lengths in frames, in order)
For every shot and three moments (15 %, 50 %, 85 % of the shot) it writes into OUT_DIR:
  sNN-k-full.jpg     reference (top) over ours (bottom), 1280 wide each
  sNN-k-<region>.jpg reference (left) | ours (right), enlarged 2x: face, feet, left, right, top, ground
and metrics.json: per region, for both pictures: edges = share of pixels on an edge (how much drawn detail),
tones = number of distinct colour clusters covering at least 0.4 % of the region, texture = mean local contrast.
A region where ours has under 60 % of the reference's edges or tones is listed under "thin"."""
import subprocess, sys, os, json, numpy as np, cv2
ours, ref0, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]; lens = [int(v) for v in sys.argv[4].split(',')]
os.makedirs(out, exist_ok=True); REF = 'ref/rover_doom.webm'
def frame(path, f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f / 24:.4f}', '-i', path, '-frames:v', '1', '-vf', 'scale=1280:720', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(720, 1280, 3).copy()
def face(im):
    """The largest head in the picture as (x, y, w, h, area) of its eye band, or of the upper part of its skin blob.
    Skin colour is the anchor (it is the same in the reference and in ours); eye whites alone are confused with snow."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); skin = cv2.inRange(hsv, (6, 55, 148), (22, 175, 255))   # value floor keeps brown coats and wood out
    skin = cv2.morphologyEx(skin, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); skin = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    n, lab_, st, _ = cv2.connectedComponentsWithStats(skin, 8)
    if n > 1:
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); x, y, w, h, a = st[k]
        if a > 900 and 0.55 < w / h < 2.2:
            # report an eye-band-like box: the middle of the head blob, as wide as about 80 % of it
            return (int(x + w * 0.1), int(y + h * 0.3), int(w * 0.8), int(h * 0.3), int(a))
    return face_by_whites(im)
def face_by_whites(im):
    mn = im.min(2).astype(int); mx = im.max(2).astype(int); best = None
    for thr, ch in ((225, 40), (200, 40), (175, 45), (150, 75)):
        m = ((mn > thr) & ((mx - mn) < ch)).astype(np.uint8); n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        for k in range(1, n):
            x, y, w, h, a = st[k]
            if a < 300 or not 1.3 < w / h < 4.2 or a / (w * h) < 0.5 or (mn[y:y + h, x:x + w] < 80).mean() < 0.01: continue
            if best is None or a > best[4]: best = (x, y, w, h, a)
        if best: break
    return best
def box_face(im):
    b = face(im)
    if not b: return None
    x, y, w, h, _ = b; s = int(w * 1.9); x0 = int(np.clip(x + w / 2 - s / 2, 0, 1280 - s)); y0 = int(np.clip(y - s * 0.42, 0, 720 - s)); return (x0, y0, x0 + s, y0 + s)
def box_feet(im):   # found in EACH picture: below the face, follow the figure down to where it ends, so both crops show the feet
    b = face(im)
    if not b: return None
    x, y, w, h, _ = b; cx = int(x + w / 2); half = int(w * 0.9); x0 = max(0, cx - half); x1 = min(1280, cx + half)
    col = im[:, x0:x1].astype(int)
    row = (np.abs(col - np.median(col, 1, keepdims=True)).sum(2) > 60).mean(1)   # rows crossed by a figure differ from their own median colour
    ys = np.nonzero(row[y:] > 0.12)[0]; bottom = int(y + ys.max()) if len(ys) else 719
    s = int(max(200, w * 2.2)); xa = int(np.clip(cx - s / 2, 0, 1280 - s)); yb = min(720, bottom + int(s * 0.22)); ya = max(0, yb - int(s * 0.7))
    return (xa, ya, xa + s, yb)
FIXED = {'left': (0, 120, 427, 600), 'right': (853, 120, 1280, 600), 'top': (0, 0, 1280, 240), 'ground': (0, 470, 1280, 720)}
def metrics(c):
    g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY); e = cv2.Canny(g, 40, 110); q = (c // 24).reshape(-1, 3); _, cnt = np.unique(q, axis=0, return_counts=True)
    blur = cv2.GaussianBlur(g, (0, 0), 6).astype(np.float32)
    return dict(edges=round(float((e > 0).mean() * 100), 2), tones=int((cnt > q.shape[0] * 0.004).sum()), texture=round(float(np.abs(g.astype(np.float32) - blur).mean()), 2))
def lab(im, t):
    cv2.rectangle(im, (0, 0), (len(t) * 11 + 8, 22), (0, 0, 0), -1); cv2.putText(im, t, (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 235, 255), 1, cv2.LINE_AA); return im
M = []; start = 0
for si, L in enumerate(lens, 1):
    for k, u in enumerate((0.15, 0.5, 0.85), 1):
        f = start + int(L * u); a = frame(REF, ref0 + f); b = frame(ours, f); tag = f's{si:02d}-{k}'
        cv2.imwrite(f'{out}/{tag}-full.jpg', np.vstack([lab(a.copy(), f'REFERENCE f{ref0 + f}'), lab(b.copy(), f'OURS f{f}')]), [cv2.IMWRITE_JPEG_QUALITY, 90])
        regs = dict(FIXED)
        for name, fn in (('face', box_face), ('feet', box_feet)):
            ba, bb = fn(a), fn(b)
            if ba and bb: regs[name] = (ba, bb)
        for name, bx in regs.items():
            ba, bb = bx if isinstance(bx[0], tuple) else (bx, bx)
            ca, cb = a[ba[1]:ba[3], ba[0]:ba[2]], b[bb[1]:bb[3], bb[0]:bb[2]]
            if ca.size == 0 or cb.size == 0: continue
            H = 640 if name in ('face', 'feet') else int((ba[3] - ba[1]) * 1.5)
            ra = cv2.resize(ca, (int(ca.shape[1] * H / ca.shape[0]), H), interpolation=cv2.INTER_CUBIC); rb = cv2.resize(cb, (int(cb.shape[1] * H / cb.shape[0]), H), interpolation=cv2.INTER_CUBIC)
            if name in ('top', 'ground'): sheet = np.vstack([lab(ra, 'REFERENCE'), lab(rb, 'OURS')])
            else: sheet = np.hstack([lab(ra, 'REFERENCE'), np.full((H, 8, 3), 0, np.uint8), lab(rb, 'OURS')])
            cv2.imwrite(f'{out}/{tag}-{name}.jpg', sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
            ma, mb = metrics(ca), metrics(cb); thin = [x for x in ('edges', 'tones') if mb[x] < 0.6 * ma[x]]
            M.append(dict(shot=si, moment=k, region=name, ref=ma, ours=mb, thin=thin))
    rows = []   # the face at 10 moments spread over the shot, reference row above ours: shows which expression is used when
    for path, base, name in ((REF, ref0, 'REF'), (ours, 0, 'OURS')):
        tiles = []
        for j in range(10):
            f = start + int(round(j * (L - 1) / 9)); im = frame(path, base + f); bx = box_face(im)
            c = im[bx[1]:bx[3], bx[0]:bx[2]] if bx else im[60:420, 460:820]
            tiles.append(lab(cv2.resize(c, (256, 256), interpolation=cv2.INTER_AREA), f'{name} +{f - start}'))
        rows.append(np.hstack(tiles))
    cv2.imwrite(f'{out}/s{si:02d}-faces-over-time.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 90])
    start += L
json.dump(M, open(f'{out}/metrics.json', 'w'), indent=0)
print('regions', len(M), '| thin:', sum(1 for m in M if m['thin']))
for m in M:
    if m['thin'] and m['moment'] == 2: print(f"  shot {m['shot']} {m['region']:7s} edges {m['ours']['edges']} vs ref {m['ref']['edges']} | tones {m['ours']['tones']} vs ref {m['ref']['tones']}")
