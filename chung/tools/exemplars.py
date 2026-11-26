"""Build a reference EXEMPLAR BANK from the annotated reference video: full-resolution frames of real shots, grouped by
kind of shot, with an index that says what each one shows. Designers, builders and reviewers use it as the visual target
for FINISH (sharpness, flatness, palette, density of detail, how much is in a frame), never as content to copy.

usage (from rover-lab/):  python3 tools/exemplars.py [per_category=10] [folder=exemplars]
writes ../research/rover-explains-2026-11-20/exemplars/<category>/<id>.jpg (1280x720), <category>.jpg (contact sheet)
and index.json / INDEX.md. The held-out test stretch (22.5-70 s) is not in the annotation data and is never touched."""
import json, glob, os, subprocess, sys, collections
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = os.path.join(ROOT, 'research', 'rover-explains-2026-11-20'); VIDEO = os.path.join(ROOT, 'ref', 'rover_doom.webm')
N = int(sys.argv[1]) if len(sys.argv) > 1 else 10
OUT = os.path.join(R, sys.argv[2] if len(sys.argv) > 2 else 'exemplars')  # second argument: output folder name (so a bigger bank does not disturb one in use)
rows = []
for f in sorted(glob.glob(os.path.join(R, 'shots', 'chunk-*.json'))):
    d = json.load(open(f)); c = os.path.basename(f)[6:8]
    for r in (d['rows'] if isinstance(d, dict) else d):
        r['id'] = f"{c}.{int(r['i']):03d}"; rows.append(r)
def night(r): t = (r['shows'] + ' ' + r['set'] + ' ' + r['motion_fx']).lower(); return any(k in t for k in ('night', 'star', 'moon', 'dark', 'dusk'))
def exterior(r): t = (r['shows'] + ' ' + r['set']).lower(); return any(k in t for k in ('camp', 'street', 'square', 'forest', 'mountain', 'village', 'exterior', 'outside', 'field', 'city', 'gate', 'balcony', 'sky', 'snow', 'sea', 'ocean', 'savanna', 'campus', 'rooftop', 'garden', 'road', 'battle', 'trench'))
def cat(r):
    fr = r['framing']
    if fr == 'abstract' or r['set_status'] == 'abstract': return 'abstract-or-space'
    if fr in ('insert',) or r['mode'].startswith('insert'): return 'insert-object-or-screen'
    if fr in ('close', 'extreme_close'): return 'close-up'
    if fr == 'medium': return 'medium-exterior' if exterior(r) else 'medium-interior'
    if exterior(r): return 'wide-exterior-night' if night(r) else 'wide-exterior-day'
    return 'wide-interior'
groups = collections.defaultdict(list)
for r in rows:
    if r['t1'] - r['t0'] < 1.0: continue
    groups[cat(r)].append(r)
    # extra themed sets (a shot can be in its kind AND in a theme)
    t = (r['shows'] + ' ' + r['motion_fx'] + ' ' + r['action']).lower()
    if r['framing'] in ('close', 'extreme_close', 'medium') and any(k in t for k in ('fire', 'lantern', 'candle', 'torch', 'lamp', 'glow', 'screen', 'campfire', 'flame')): groups['theme-character-near-a-light-source'].append(r)
    if r['framing'] in ('close', 'extreme_close'): groups['theme-faces-and-expressions'].append(r)
    if r['framing'] == 'medium' and any(k in t for k in ('point', 'hold', 'hand', 'carr', 'grab', 'raise', 'wave', 'arms')): groups['theme-hands-and-gestures'].append(r)
    if r['framing'] == 'wide' and any(k in t for k in ('crowd', 'soldiers', 'villagers', 'people', 'army', 'group')): groups['theme-crowds-and-groups'].append(r)
index = {}
for c, rs in sorted(groups.items()):
    # spread the picks over the whole film and over distinct sets
    rs.sort(key=lambda r: r['t0']); picked = []; seen = set()
    step = max(1, len(rs) // (N * 3))
    for r in rs[::step]:
        if r['set'] in seen: continue
        seen.add(r['set']); picked.append(r)
        if len(picked) >= N: break
    for r in rs[::step]:
        if len(picked) >= N: break
        if r not in picked: picked.append(r)
    d = os.path.join(OUT, c); os.makedirs(d, exist_ok=True); index[c] = []
    for r in picked:
        t = r['t0'] + 0.5 * (r['t1'] - r['t0']); p = os.path.join(d, r['id'] + '.jpg')
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', '-q:v', '2', '-y', p], check=True)
        index[c].append({'id': r['id'], 'file': os.path.relpath(p, OUT), 'time': round(t, 2), 'shows': r['shows'], 'set': r['set'], 'characters': r['characters'], 'camera': r['camera'], 'moving': r['motion_fx'], 'action': r['action']})
    subprocess.run(['ffmpeg', '-v', 'error', '-pattern_type', 'glob', '-i', os.path.join(d, '*.jpg'), '-vf', f'scale=640:360,tile=4x{(len(picked) + 3) // 4}', '-q:v', '3', '-y', os.path.join(OUT, c + '.jpg')], check=True)
    print(c, len(picked), 'of', len(rs))
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1, ensure_ascii=False)
with open(os.path.join(OUT, 'INDEX.md'), 'w') as f:
    f.write('# Reference exemplars by kind of shot\n\nUse these as the target for FINISH and DENSITY (how sharp, how flat, how many things are in the frame, how the palette is organised, how big the subject is). Do not copy their content, characters or dressing.\n\n')
    for c, items in index.items():
        f.write(f'## {c}  (sheet: {c}.jpg)\n\n')
        for it in items: f.write(f"- `{it['file']}` — {it['shows']} | set: {it['set']} | moving: {it['moving']}\n")
        f.write('\n')
