"""classnorms.py - what a picture of a given KIND OF PLACE looks like in the reference, so a new scene on any subject
can be measured against its own kind without a matching shot.
  classnorms.py build                    -> rover-lab/out/deep/classnorms.json
  classnorms.py check IMAGE.png CLASS    -> where the image falls, and the light gain that would bring its brightness
                                            to the middle of its class
Classes come from the deep-look notes (words in summary / set / far / floor). Measures, per region (top, left, right,
ground) and for the whole frame: luma (0-255), sat (0-255), edges (share of edge pixels), tones (colour clusters)."""
import sys, json, glob, re, numpy as np, cv2
REG = {'frame': (0, 0, 1280, 720), 'top': (0, 0, 1280, 240), 'left': (0, 120, 427, 600), 'right': (853, 120, 1280, 600), 'ground': (0, 470, 1280, 720)}
RULES = [('space', r'space|planet|globe|star field|cosmic|orbit'), ('hell', r'hell|lava|demon'), ('snow', r'snow|frost|blizzard'),
         ('street_night', r'(street|kiosk|campus|college|city|rooftop|village|square|town|harbour).*(night|dusk|moon)|(night|dusk|moon).*(street|kiosk|campus|city|rooftop|village|square|town|harbour)'),
         ('street_day', r'street|kiosk|news|campus|college|city|rooftop|village|square|town|harbour'), ('tent', r'tent'), ('throne', r'throne'),
         ('lab', r'\blab\b|laboratory|machine|console|monitor|workshop'), ('interior', r'room|hall|chamber|classroom|office|ward|cell|chapel|library|interior'), ('camp', r'camp|meadow|field|forest')]
def measure(c):
    # measured at half size, with colours counted by a quick histogram (the same on reference frames and on ours)
    c = cv2.resize(c, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY); hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV); e = cv2.Canny(g, 40, 110)
    q = (c // 24).astype(np.int32); code = (q[..., 0] * 121 + q[..., 1] * 11 + q[..., 2]).ravel(); cnt = np.bincount(code, minlength=1331)
    return dict(luma=float(g.mean()), sat=float(hsv[..., 1].mean()), edges=float((e > 0).mean() * 100), tones=float((cnt > code.size * 0.004).sum()))
P = 'rover-lab/out/deep/classnorms.json'
if sys.argv[1] == 'build':
    cls = {}
    for f in sorted(glob.glob('rover-lab/out/deep/notes/batch-*.jsonl')):
        for l in open(f):
            l = l.strip()
            if not l: continue
            try: r = json.loads(l)
            except Exception: continue
            m = re.match(r'\d+', str(r.get('shot', '')))
            if not m: continue
            t = ' '.join(str(r.get(k, '')) for k in ('summary', 'set', 'far', 'floor')).lower()
            cls.setdefault(int(m.group()), next((c for c, p in RULES if re.search(p, t)), 'other'))
    rows = {}
    for n, c in cls.items():
        im = cv2.imread(f'rover-lab/out/deep/sheets/{n:03d}-a.jpg')
        if im is None: continue
        im[:30, :520] = im[30:60, :520]
        for r, (x0, y0, x1, y1) in REG.items(): rows.setdefault(c, {}).setdefault(r, []).append(measure(im[y0:y1, x0:x1]))
    out = {c: {'n': len(v['frame']), **{r: {k: [round(float(np.percentile([m[k] for m in ms], p)), 2) for p in (10, 25, 50, 75, 90)] for k in ('luma', 'sat', 'edges', 'tones')} for r, ms in v.items()}} for c, v in rows.items()}
    json.dump(out, open(P, 'w'), indent=1)
    for c, v in sorted(out.items(), key=lambda kv: -kv[1]['n']): print(f"{c:13s} n={v['n']:3d} luma {v['frame']['luma'][2]:6.1f} sat {v['frame']['sat'][2]:5.1f} | ground edges {v['ground']['edges'][2]:4.2f} tones {v['ground']['tones'][2]:4.0f} | left edges {v['left']['edges'][2]:4.2f} tones {v['left']['tones'][2]:4.0f}")
else:
    N = json.load(open(P)); im = cv2.resize(cv2.imread(sys.argv[2]), (1280, 720)); c = sys.argv[3]; bad = 0
    for r, (x0, y0, x1, y1) in REG.items():
        m = measure(im[y0:y1, x0:x1]); parts = []
        for k in (('luma', 'sat') if r == 'frame' else ('edges', 'tones')):
            q = N[c][r][k]; low = m[k] < q[0]; high = m[k] > q[4] and k in ('luma', 'sat'); bad += low or high
            parts.append(f"{k} {m[k]:.1f} [{'TOO LOW' if low else 'TOO HIGH' if high else 'ok'}; class 10%..90% = {q[0]}..{q[4]}, middle {q[2]}]")
        print(f'{r:6s} ' + ' | '.join(parts))
        if r == 'frame': print(f"       light gain to reach the class middle: x{N[c]['frame']['luma'][2] / max(1, m['luma']):.2f}")
    print('FAIL' if bad else 'PASS', f'({bad} measures outside the class range)')
