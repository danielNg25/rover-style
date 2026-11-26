"""Shadow study: pick wide/medium shots with characters, spread over sets, grab the midpoint frame,
and lay them out large (2x3 per sheet) so whole shadows can be judged by eye."""
import json, glob, subprocess, os, sys, collections
from PIL import Image, ImageDraw
ROOT = 'rover-lab/out/study/shadow'
S = []
for f in sorted(glob.glob('research/rover-explains-2026-11-20/shots/chunk-*.json')):
    d = json.load(open(f)); S += d if isinstance(d, list) else d.get('shots', [])
c = [s for s in S if s.get('framing') in ('wide', 'medium') and str(s.get('characters', '')).strip().lower() not in ('', 'none', '0')
     and s['t1'] - s['t0'] >= 0.8]
by = collections.defaultdict(list)
for s in c: by[s['set']].append(s)
# round-robin over sets, wides first inside each set
for k in by: by[k].sort(key=lambda s: (s['framing'] != 'wide', s['t0']))
pick = []; r = 0
N = int(sys.argv[1]) if len(sys.argv) > 1 else 132
while len(pick) < N:
    added = False
    for k in sorted(by, key=lambda k: by[k][0]['t0']):
        if r < len(by[k]) and len(pick) < N:
            pick.append(by[k][r]); added = True
    r += 1
    if not added: break
pick.sort(key=lambda s: s['t0'])
rows = []
for n, s in enumerate(pick, 1):
    sid = 'S%03d' % n; t = (s['t0'] + s['t1']) / 2
    out = f'{ROOT}/frames/{sid}.jpg'
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', 'ref/rover_doom.webm', '-frames:v', '1', '-vf', 'scale=960:540', '-q:v', '2', out], check=True)
    rows.append(dict(sid=sid, i=s['i'], t=round(t, 2), framing=s['framing'], set=s['set'], t0=s['t0'], t1=s['t1']))
json.dump(rows, open(f'{ROOT}/pick.json', 'w'), indent=0)
for p in range(0, len(rows), 6):
    sheet = Image.new('RGB', (1920, 3 * 566), (20, 20, 20)); d = ImageDraw.Draw(sheet)
    for j, r_ in enumerate(rows[p:p + 6]):
        x = (j % 2) * 960; y = (j // 2) * 566
        sheet.paste(Image.open(f"{ROOT}/frames/{r_['sid']}.jpg"), (x, y + 26))
        d.text((x + 6, y + 6), f"{r_['sid']}  {r_['t']}s  {r_['framing']}  {r_['set']}", fill=(255, 235, 60))
    sheet.save(f'{ROOT}/sheets/sh{p // 6 + 1:02d}.jpg', quality=88)
print(len(rows), 'shots', len(set(r['set'] for r in rows)), 'sets')
