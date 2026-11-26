"""Themed galleries of reference frames for the "look first" step: pick shots by keywords in the annotations, spread over the
film and over distinct sets, and tile them with the time burned in.  usage: python3 tools/gallery.py  -> out/gallery/<theme>.jpg"""
import json, glob, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = os.path.join(ROOT, 'research', 'rover-explains-2026-11-20'); V = os.path.join(ROOT, 'ref', 'rover_doom.webm')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'out', 'gallery'); os.makedirs(OUT, exist_ok=True)
rows = []
for f in sorted(glob.glob(os.path.join(R, 'shots', 'chunk-*.json'))):
    d = json.load(open(f)); rows += (d['rows'] if isinstance(d, dict) else d)
def txt(r): return ' '.join(str(r[k]) for k in ('shows', 'action', 'motion_fx', 'characters', 'set')).lower()
THEMES = {
 'tay-va-cu-chi': (lambda r: r['framing'] == 'medium' and any(k in txt(r) for k in ('point', 'shrug', 'wave', 'arms crossed', 'chin', 'fist', 'holds', 'raises', 'palm', 'hands up', 'clap', 'salute', 'hug', 'grab', 'carries', 'finger')), 20, 0.45),
 'boi-canh': (lambda r: r['framing'] == 'wide' and r['set_status'] == 'new', 20, 0.5),
 'anh-sang-va-bong': (lambda r: r['framing'] in ('wide', 'medium') and any(k in txt(r) for k in ('lamp', 'lantern', 'window', 'candle', 'torch', 'shaft', 'night', 'sunset', 'dusk', 'dawn', 'spotlight', 'shadow', 'dark', 'moon', 'fireplace', 'campfire')), 20, 0.5),
 'hieu-ung': (lambda r: any(k in txt(r) for k in ('magic', 'explos', 'lightning', 'portal', 'beam', 'energy', 'glow', 'smoke', 'spark', 'blast', 'flash', 'laser', 'fire', 'flames', 'transform', 'puff', 'shield', 'spell')), 20, 0.55),
}
for name, (cond, n, where) in THEMES.items():
    cand = [r for r in rows if r['t1'] - r['t0'] >= 1.2 and cond(r)]
    cand.sort(key=lambda r: r['t0']); step = max(1, len(cand) // (n * 2)); pick = []; seen = set()
    for r in cand[::step]:
        if r['set'] in seen: continue
        seen.add(r['set']); pick.append(r)
        if len(pick) >= n: break
    for r in cand[::step]:
        if len(pick) >= n: break
        if r not in pick: pick.append(r)
    pick.sort(key=lambda r: r['t0'])
    for i, r in enumerate(pick):
        t = r['t0'] + where * (r['t1'] - r['t0'])
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', V, '-frames:v', '1', '-vf', f"scale=640:360,drawtext=text='{i + 1}  {t:.0f}s':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=5", '-y', os.path.join(OUT, f'_{name}_{i:02d}.png')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-pattern_type', 'glob', '-i', os.path.join(OUT, f'_{name}_*.png'), '-vf', f'tile=4x{(len(pick) + 3) // 4}', '-q:v', '3', '-y', os.path.join(OUT, name + '.jpg')], check=True)
    for f in glob.glob(os.path.join(OUT, f'_{name}_*.png')): os.remove(f)
    print(name, len(pick), 'of', len(cand))
