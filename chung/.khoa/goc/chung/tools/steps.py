#!/usr/bin/env python3
"""steps.py VIDEO f0-f1[,f0-f1...]   how much the ACTING AREA changes on every single frame step, camera motion removed.
Prints one number per frame step (mean absolute change of the busiest 150 x 150 area at 640 x 360, x10, NO threshold), so a
movement can be read step by step:  40 0 38 0 = drawings held two frames (on twos);  20 19 21 = a new drawing every frame;
0 0 0 = a dead hold;  2 3 2 3 = a hold that keeps drifting."""
import subprocess, sys, numpy as np, cv2
v = sys.argv[1]; W, H = 640, 360; STATS = '--stats' in sys.argv; MOVES = []
fps = float(eval(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout.strip().rstrip(',')))
RANGES = sys.argv[2]
if RANGES.startswith('ref'):   # ref or ref/3 = every third shot of the reference cut list
    cuts = [0.0] + [float(x) for x in open('research/rover-explains-2026-11-20/bao-cao-goc/cuts.txt').read().split()] + [1435.0]; F = [round(x * 24) for x in cuts]; ev = int(RANGES.split('/')[1]) if '/' in RANGES else 1
    RANGES = ','.join(f'{F[i] + 1}-{F[i + 1] - 1}' for i in range(0, len(F) - 1, ev) if F[i + 1] - F[i] >= 30)
for rg in RANGES.split(','):
    f0, f1 = (int(x) for x in rg.split('-')); n = f1 - f0 + 1
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f0 / fps:.4f}', '-i', v, '-frames:v', str(n), '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True)
    G = np.frombuffer(p.stdout, np.uint8); G = G[:len(G) // (W * H) * W * H].reshape(-1, H, W); D = []
    for i in range(1, len(G)):
        p0 = cv2.goodFeaturesToTrack(G[i - 1], 500, 0.01, 7); M = None
        if p0 is not None:
            p1, ok, _ = cv2.calcOpticalFlowPyrLK(G[i - 1], G[i], p0, None); ok = ok.ravel() == 1
            if ok.sum() >= 12: M, _ = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=1.0)
        if M is None: M = np.float32([[1, 0, 0], [0, 1, 0]])
        a = cv2.GaussianBlur(cv2.warpAffine(G[i - 1], M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), (0, 0), 1.0).astype(np.float32); b = cv2.GaussianBlur(G[i], (0, 0), 1.0).astype(np.float32)
        d = np.abs(a - b); d[:8] = 0; d[-8:] = 0; d[:, :8] = 0; d[:, -8:] = 0; D.append(d)
    heat = sum((d > 22).astype(np.float32) for d in D); box = cv2.boxFilter(heat, -1, (150, 150), normalize=False); by, bx = np.unravel_index(np.argmax(box), box.shape)
    bx = int(np.clip(bx - 75, 0, W - 150)); by = int(np.clip(by - 75, 0, H - 150))
    c = [d[by:by + 150, bx:bx + 150].mean() * 10 for d in D]
    if STATS:
        # a MOVE = a run of clear changes (>= 45) with no gap longer than 3 frame steps; its length runs to the end of its last drawing
        i = 0
        while i < len(c):
            if c[i] < 45: i += 1; continue
            j = i; k = i
            while k < len(c) and k - j <= 3:
                if c[k] >= 45: j = k
                k += 1
            steps = [x for x in c[i:j + 1] if x >= 45]
            if sum(steps) >= 200: MOVES.append((j - i + 2, len(steps), float(np.mean(steps)), i == 0 or j >= len(c) - 2))
            i = j + 1
    else: print(f'{rg} box {bx},{by}:', ' '.join(f'{x:.0f}' for x in c))
if STATS:
    full = [m for m in MOVES if not m[3]]   # moves that start and end inside their shot
    q = lambda v: [round(float(x), 1) for x in np.percentile(v, [10, 25, 50, 75, 90])]
    print(f'moves {len(MOVES)} (inside their shot: {len(full)})')
    print('length in frames (10/25/50/75/90 %):', q([m[0] for m in full])); print('drawings per move:', q([m[1] for m in full])); print('change per drawing:', q([m[2] for m in full]))
    print('share of moves of 6 frames or less:', round(float(np.mean([m[0] <= 6 for m in full])), 2), '| of 16 frames or more:', round(float(np.mean([m[0] >= 16 for m in full])), 2))
