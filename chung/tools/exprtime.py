"""How expressions change over time, measured on EVERY close-up of the reference (not one shot):
per frame, find the eye band, cut normalised eye / brow / mouth crops, and mark the frames where each one changes.
Reports hold lengths, transition lengths, what changes together, head shifts at changes, and blinks.
Also cuts whole-body strips of the walking shots listed in the annotations -> out/gallery/di-bo-nhieu.jpg
Run: uv run --offline --no-project --with opencv-python-headless --with numpy python tools/exprtime.py"""
import subprocess, json, glob, os, numpy as np, cv2
V = '../ref/rover_doom.webm'; R = '../research/rover-explains-2026-11-20'; W, H = 960, 540
rows = []
for f in sorted(glob.glob(R + '/shots/chunk-*.json')):
    d = json.load(open(f)); rows += (d['rows'] if isinstance(d, dict) else d)
def frames(t0, t1):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-t', f'{t1 - t0:.3f}', '-i', V, '-vf', f'scale={W}:{H}', '-pix_fmt', 'bgr24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
    out = []
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        out.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
    return out
def eyeband(f, wmin, wmax):
    mn = f.min(2).astype(int); mx = f.max(2).astype(int); best = None
    for thr in (225, 200, 175):
        m = ((mn > thr) & ((mx - mn) < 40)).astype(np.uint8)
        num, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, num):
            x, y, w, h, a = [int(v) for v in st[i]]
            if not (wmin <= w <= wmax and 1.25 <= w / max(h, 1) <= 5.0 and a > 0.45 * w * h) or y + h > H * 0.9: continue
            if (mx[y:y + h, x:x + w] < 125).mean() < 0.004: continue
            if best is None or a > best[4]: best = (x, y, w, h, a)
        if best: break
    return best
def crop(g, x0, y0, x1, y1, size):
    x0, y0, x1, y1 = [int(round(v)) for v in (x0, y0, x1, y1)]
    if x0 < 0 or y0 < 0 or x1 > W or y1 > H: return None
    return cv2.resize(g[y0:y1, x0:x1], size, interpolation=cv2.INTER_AREA).astype(np.float32)
holds = []; trans = []; blinks = []; kinds = {'eyes': 0, 'mouth': 0, 'brows': 0}; together = {1: 0, 2: 0, 3: 0}; shift_at_change = []; shift_rest = []; tot_frames = 0; shots_used = 0; perchar = []
closes = [r for r in rows if r['framing'] in ('close', 'extreme_close') and r['t1'] - r['t0'] >= 1.2]
TE, TM, TB = 7.0, 6.0, 6.0
for r in closes:
    fs = frames(r['t0'] + 0.09, r['t1'] - 0.09); prev = None; seq = []; w0 = None
    for f in fs:
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); b = eyeband(f, 150, 620)
        if b is None: seq.append(None); continue
        x, y, w, h, _ = b
        if w0 is None: w0 = w
        if abs(w - w0) > 0.22 * w0: w = w0                      # lids change the band a little; a big jump means another face
        else: w0 = 0.9 * w0 + 0.1 * w
        cx = x + b[2] / 2; cy = y + h / 2
        seq.append((cx, cy, w0, crop(g, cx - 0.56 * w0, cy - 0.36 * w0, cx + 0.56 * w0, cy + 0.36 * w0, (56, 36)), crop(g, cx - 0.5 * w0, cy + 0.42 * w0, cx + 0.5 * w0, cy + 1.0 * w0, (50, 29)), crop(g, cx - 0.62 * w0, cy - 0.66 * w0, cx + 0.62 * w0, cy - 0.3 * w0, (62, 18))))
    found = [s for s in seq if s is not None]
    if len(found) < 0.5 * len(seq) or len(seq) < 20: continue
    shots_used += 1; tot_frames += len(seq)
    # blinks: short gaps in the eye band surrounded by detections
    i = 0
    while i < len(seq):
        if seq[i] is None:
            j = i
            while j < len(seq) and seq[j] is None: j += 1
            if 0 < i and j < len(seq) and 1 <= j - i <= 9: blinks.append(j - i)
            i = j
        else: i += 1
    ch = []; pos = []
    for a, b in zip(seq, seq[1:]):
        if a is None or b is None: ch.append(None); pos.append(None); continue
        de = None if a[3] is None or b[3] is None else float(np.abs(a[3] - b[3]).mean()); dm = None if a[4] is None or b[4] is None else float(np.abs(a[4] - b[4]).mean()); db = None if a[5] is None or b[5] is None else float(np.abs(a[5] - b[5]).mean())
        ch.append((de is not None and de > TE, dm is not None and dm > TM, db is not None and db > TB)); pos.append(float(np.hypot(b[0] - a[0], b[1] - a[1]) / a[2]))
    run = 0; hold = 0; nch = 0
    for c, pz in zip(ch, pos):
        if c is None: hold = 0; run = 0; continue
        if any(c):
            if run == 0:
                if hold > 0: holds.append(hold)
                nch += 1; together[sum(c)] += 1
                for k, v in zip(('eyes', 'mouth', 'brows'), c): kinds[k] += int(v)
                shift_at_change.append(pz)
            run += 1; hold = 0
        else:
            if run > 0: trans.append(run)
            run = 0; hold += 1; shift_rest.append(pz)
    perchar.append(nch / (len(seq) / 24))
q = lambda a, ps=(10, 25, 50, 75, 90): [round(float(np.percentile(a, p)), 2) for p in ps] if len(a) else []
res = {'close_shots_measured': shots_used, 'of_close_shots': len(closes), 'frames': tot_frames, 'seconds': round(tot_frames / 24, 1),
       'face_changes_per_second_p10_25_50_75_90': q(perchar), 'hold_frames_p10_25_50_75_90': q(holds), 'hold_hist_1_2_3_4_5to8_9to16_17plus': [int((np.array(holds) == k).sum()) for k in (1, 2, 3, 4)] + [int(((np.array(holds) >= 5) & (np.array(holds) <= 8)).sum()), int(((np.array(holds) >= 9) & (np.array(holds) <= 16)).sum()), int((np.array(holds) >= 17).sum())],
       'transition_frames_hist_1_2_3_4plus': [int((np.array(trans) == k).sum()) for k in (1, 2, 3)] + [int((np.array(trans) >= 4).sum())],
       'parts_changing_together_1_2_3': together, 'which_part_changes': kinds, 'head_shift_at_change_median_pct_of_eyeband': round(100 * float(np.median(shift_at_change)), 2), 'head_shift_between_changes_median_pct': round(100 * float(np.median(shift_rest)), 2),
       'share_of_changes_with_head_shift_over_2pct': round(float((np.array(shift_at_change) > 0.02).mean()), 2), 'blinks': len(blinks), 'blink_frames_hist_1to9': [int((np.array(blinks) == k).sum()) for k in range(1, 10)], 'blinks_per_10s': round(10 * len(blinks) / (tot_frames / 24), 2)}
json.dump(res, open('out/gallery/exprtime.json', 'w'), indent=1); print(json.dumps(res))
# ---------------------------------------------------------------- walking: whole-body strips from every shot the annotations call a walk
walks = [r for r in rows if any(k in (r['action'] + ' ' + r['shows']).lower() for k in ('walks', 'walking', 'strides', 'struts', 'marches', 'runs ', 'running'))]
strips = []
for r in walks:
    fs = frames(r['t0'] + 0.1, min(r['t1'], r['t0'] + 2.2)); tiles = []; last = None
    for k in range(0, len(fs), 2):
        b = eyeband(fs[k], 30, 150)
        if b is None: continue
        x, y, w, h, _ = b
        if last is not None and abs(x - last) > 2.5 * w: continue
        last = x; cx, cy = x + w / 2, y + h / 2; x0, y0, x1, y1 = int(cx - 1.5 * w), int(cy - 1.1 * w), int(cx + 1.5 * w), int(cy + 3.9 * w)
        if x0 < 0 or y0 < 0 or x1 > W or y1 > H: continue
        tiles.append(cv2.resize(fs[k][y0:y1, x0:x1], (108, 180), interpolation=cv2.INTER_AREA))
        if len(tiles) >= 14: break
    if len(tiles) >= 8:
        row = np.hstack(tiles + [np.zeros((180, 108, 3), np.uint8)] * (14 - len(tiles))); cv2.putText(row, f"{r['t0']:.0f}s", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1); strips.append(row)
print('walk shots listed', len(walks), 'usable strips', len(strips))
if strips: cv2.imwrite('out/gallery/di-bo-nhieu.jpg', np.vstack(strips[:9]), [cv2.IMWRITE_JPEG_QUALITY, 88])
