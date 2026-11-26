"""Shadow study, extra picks: same round-robin as shadowstudy.py but taken further, skipping shots already picked.
Writes pick_extra.json (ids X001...) and floor sheets fx01..."""
import json, glob, subprocess, os, sys, collections, cv2, numpy as np
ROOT = 'rover-lab/out/study/shadow'
S = []
for f in sorted(glob.glob('research/rover-explains-2026-11-20/shots/chunk-*.json')):
    d = json.load(open(f)); S += d if isinstance(d, list) else d.get('shots', [])
have = {round(r['t0'], 2) for r in json.load(open(f'{ROOT}/pick.json'))}
c = [s for s in S if s.get('framing') == 'wide' and str(s.get('characters', '')).strip().lower() not in ('', 'none', '0')
     and s['t1'] - s['t0'] >= 0.8 and round(s['t0'], 2) not in have and 'void' not in s['set'] and 'space' not in s['set'] and 'sky' not in s['set'] and 'orbit' not in s['set']]
by = collections.defaultdict(list)
for s in c: by[s['set']].append(s)
pick = []; r = 0; N = int(sys.argv[1])
while len(pick) < N:
    added = False
    for k in sorted(by, key=lambda k: by[k][0]['t0']):
        if r < len(by[k]) and len(pick) < N: pick.append(by[k][r]); added = True
    r += 1
    if not added: break
pick.sort(key=lambda s: s['t0'])
cl = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6)); rows = []; tiles = []
for n, s in enumerate(pick, 1):
    sid = 'X%03d' % n; t = (s['t0'] + s['t1']) / 2
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', 'ref/rover_doom.webm', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True)
    f = cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR)[int(720 * 0.38):]
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB); lab[..., 0] = cl.apply(lab[..., 0]); e = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    e = cv2.resize(e, (960, int(e.shape[0] * 960 / 1280)), interpolation=cv2.INTER_AREA)
    cv2.rectangle(e, (0, 0), (430, 20), (0, 0, 0), -1)
    cv2.putText(e, f"{sid} {t:.2f}s {s['set'][:34]}", (4, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 235, 255), 1, cv2.LINE_AA)
    tiles.append(e); rows.append(dict(sid=sid, t=round(t, 2), framing=s['framing'], set=s['set'], t0=s['t0'], t1=s['t1']))
json.dump(rows, open(f'{ROOT}/pick_extra.json', 'w'), indent=0)
h = tiles[0].shape[0]
for p in range(0, len(tiles), 8):
    sh = np.full((4 * (h + 4), 1924, 3), 20, np.uint8)
    for j, t in enumerate(tiles[p:p + 8]): sh[(j // 2) * (h + 4):(j // 2) * (h + 4) + h, (j % 2) * 964:(j % 2) * 964 + 960] = t
    cv2.imwrite(f'{ROOT}/floor/fx{p // 8 + 1:02d}.jpg', sh, [cv2.IMWRITE_JPEG_QUALITY, 88])
print(len(rows), 'extra shots', len(set(r['set'] for r in rows)), 'sets')
