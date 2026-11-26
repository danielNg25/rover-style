"""Run every art tool on the real sheets and pieces of this project and on broken copies made here.

usage:
  python3 tools/art/selftest.py [--out qa/art/selftest.json]

Reads gen/*.png and public/{doom,king,queen,savanna,village} (never writes there). Writes cut pieces to
qa/art/cut-test/, broken copies ("mutants") to qa/art/mutants/, one result JSON + evidence image per run
under qa/art/, and the summary qa/art/selftest.json. Codex is never called (tools/art/test_gen.sh uses a fake).
Each run has an EXPECTED verdict: approved material should pass, mutants should fail. A run whose verdict
differs from the expectation is listed under "unexpected". Known real defects found in approved material are
listed under "known_findings" with their expectation set to FAIL, so that they stay visible.
Exit 0 = every run as expected, 1 = at least one unexpected verdict, 2 = a tool could not run.
"""
import argparse
import glob
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import common as C

ROOT = C.ROOT
QA = os.path.join(ROOT, 'qa', 'art')
runs = []


def run(name, expect, args, result_json, note=None):
    """args: command list. expect: 'PASS' | 'FAIL'."""
    p = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    d = {}
    try:
        d = json.load(open(os.path.join(ROOT, result_json)))
    except (OSError, ValueError):
        pass
    verdict = d.get('verdict', 'UNMEASURED')
    rec = {'name': name, 'command': ' '.join(os.path.relpath(a, ROOT) if a.startswith(ROOT) else a for a in args),
           'exit': p.returncode, 'verdict': verdict, 'expected': expect, 'as_expected': verdict == expect,
           'result': result_json, 'evidence': d.get('evidence', []),
           'failed_checks': [f"{c['name']} = {c['value']} ({c['threshold']})" for c in d.get('checks', []) if c['verdict'] == 'FAIL'][:12],
           'unmeasured_checks': [c['name'] for c in d.get('checks', []) if c['verdict'] == 'UNMEASURED'][:12],
           'warnings': [w[:200] for w in d.get('warnings', [])]}
    if note:
        rec['note'] = note
    if not d and p.stderr:
        rec['stderr'] = p.stderr[-400:]
    runs.append((rec, d))
    print(f"  {'ok ' if rec['as_expected'] else 'UNEXPECTED'} {verdict:<10} (expected {expect}) {name}")
    return rec, d


def py(tool, *a):
    return [sys.executable, os.path.join(HERE, tool), *a, '--quiet']


def make_mutants():
    m = os.path.join(QA, 'mutants')
    for d in ('fringe', 'purple-line', 'hole'):
        os.makedirs(os.path.join(m, d), exist_ok=True)
    a = np.asarray(Image.open(os.path.join(ROOT, 'public/doom/p-5.png')).convert('RGBA')).copy()
    vis = a[..., 3] >= 128
    ring = C.dilate(vis, 2) & ~C.erode(vis, 1)  # 2 px magenta ring around the silhouette
    f = a.copy(); f[ring, :3] = (0.6 * np.array([255, 0, 255]) + 0.4 * f[ring, :3]).astype('uint8'); f[ring, 3] = np.maximum(f[ring, 3], 230)
    Image.fromarray(f).save(os.path.join(m, 'fringe', 'p-5.png'))
    h, w = a.shape[:2]  # a thin grey line with a 1 px purple fringe on both sides, beside the piece
    l = np.zeros((h, w + 40, 4), 'uint8'); l[:, :w] = a
    l[20:h - 20, w + 18:w + 21] = (120, 120, 124, 255); l[20:h - 20, w + 17] = (150, 70, 160, 200); l[20:h - 20, w + 21] = (150, 70, 160, 200)
    Image.fromarray(l).save(os.path.join(m, 'purple-line', 'p-5.png'))
    k = a.copy(); k[150:210, 50:110, 3] = 0  # a block of art eaten inside the piece
    Image.fromarray(k).save(os.path.join(m, 'hole', 'p-5.png'))
    s = np.asarray(Image.open(os.path.join(ROOT, 'gen/doom-parts.png')).convert('RGB')).copy()  # pink art on magenta
    yy, xx = np.mgrid[0:s.shape[0], 0:s.shape[1]]
    s[((xx - 1250) / 110.0) ** 2 + ((yy - 520) / 70.0) ** 2 < 1] = (255, 64, 224)
    Image.fromarray(s).save(os.path.join(m, 'pink-on-magenta-sheet.png'))


def new_cut_mutants():
    """Broken copies of the torso cut a moment ago by cut.py (needs qa/art/cut-test/doom)."""
    src = os.path.join(QA, 'cut-test', 'doom')
    man = json.load(open(os.path.join(src, 'p.json')))
    pc = [p for p in man['pieces'] if p['name'] == 'torso'][0]
    im = np.asarray(Image.open(os.path.join(src, pc['file'])).convert('RGBA')).copy()
    vis = im[..., 3] >= 128; ys, xs = np.nonzero(vis); cy, cx = int(ys.mean()), int(xs.mean()); x0 = xs[ys == cy].min(); yb = ys.max()
    out = {'clean': im}
    o = im.copy(); o[cy - 10:cy + 10, max(0, x0 - 8):x0 + 2] = (255, 0, 255, 255); out['slab'] = o          # uncut block of key colour
    o = im.copy(); cols = np.nonzero(vis[yb - 3])[0]
    o[min(yb + 1, o.shape[0] - 1), cols.min():cols.max()] = (169, 74, 173, 217); out['bottomline'] = o       # the defect of public/doom/t-1
    o = im.copy(); o[cy - 25:cy + 25, cx - 25:cx + 25, 3] = 0; out['hole50'] = o
    o = im.copy(); o[..., 3] = (o[..., 3] * 0.55).astype('uint8'); out['alpha55'] = o
    for tag, arr in out.items():
        d = os.path.join(QA, 'mutants', f'newcut-{tag}'); os.makedirs(d, exist_ok=True)
        Image.fromarray(arr).save(os.path.join(d, pc['file']))
        json.dump({**man, 'pieces': [pc]}, open(os.path.join(d, 'p.json'), 'w'))
    from PIL import ImageDraw
    for tag, robe in (('robe-equals-key', (0, 177, 64)), ('robe-near-key', (10, 165, 60))):
        pic = Image.new('RGB', (1024, 1024), (0, 177, 64)); dr = ImageDraw.Draw(pic)
        dr.polygon([(300, 900), (380, 300), (644, 300), (724, 900)], fill=robe, outline=(20, 20, 20), width=6)
        dr.ellipse((412, 140, 612, 340), fill=(170, 170, 172), outline=(20, 20, 20), width=6)
        pic.save(os.path.join(QA, 'mutants', f'{tag}.png'))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default=os.path.join(QA, 'selftest.json'))
    a = ap.parse_args()
    os.makedirs(QA, exist_ok=True)
    make_mutants()
    known = []

    print('keycheck.py on every sheet in gen/')
    for f in sorted(glob.glob(os.path.join(ROOT, 'gen', '*.png'))):
        stem = os.path.basename(f)[:-4]
        exp = 'FAIL' if stem == 'doom-front' else 'PASS'
        run(f'keycheck {stem}', exp, py('keycheck.py', f, '--out', f'qa/art/keycheck-{stem}.json'), f'qa/art/keycheck-{stem}.json',
            note='green character on a green background: the case this check exists for' if exp == 'FAIL' else None)
    run('keycheck MUTANT pink art on magenta', 'FAIL', py('keycheck.py', 'qa/art/mutants/pink-on-magenta-sheet.png', '--out', 'qa/art/keycheck-mutant-pink.json'),
        'qa/art/keycheck-mutant-pink.json')

    print('cut.py on the sheets (into qa/art/cut-test/)')
    sheets = [('doom', 'p', 'doom-parts', ['--names', 'cape,torso,mantle,legs,upperarm,forearm,fist,openhand']),
              ('face', 'f', 'doom-face-parts', ['--names', 'hood,mask,plate,brow,nose,mouth', '--merge-dist', '60']),
              ('heads', 'h', 'doom-heads', ['--names', 'angry,neutral,sad,squint']),
              ('heads34', 't', 'doom-heads34', ['--expect', '4']),
              ('back', 'b', 'doom-back', ['--names', 'back']),
              ('king', 'k', 'king', ['--names', 'seated,head-shocked,arm-rest,arm-think,arm-shrug']),
              ('queen', 'q', 'queen', ['--names', 'queen']),
              ('savanna', 's', 'savanna', ['--names', 'elephant,calf,giraffe,impala,egret,vulture,dolphin,ship']),
              ('animal', 'a', 'animal-parts', ['--expect', '11']),
              ('village', 'v', 'villagers', ['--expect', '12'])]
    for d, pre, sheet, extra in sheets:
        run(f'cut {sheet}', 'PASS', py('cut.py', f'gen/{sheet}.png', f'qa/art/cut-test/{d}', pre, *extra, '--force', '--out', f'qa/art/cut-{sheet}.json'),
            f'qa/art/cut-{sheet}.json')
    run('cut MUTANT wrong name count', 'FAIL', py('cut.py', 'gen/doom-parts.png', 'qa/art/cut-test/mutant-names', 'p', '--names', 'a,b,c', '--force',
                                                 '--out', 'qa/art/cut-mutant-names.json'), 'qa/art/cut-mutant-names.json')

    print('spill.py --strict on the pieces cut just now')
    for d, pre, sheet, _ in sheets:
        run(f'spill strict new-cut {sheet}', 'PASS', py('spill.py', '--strict', '--manifest', f'qa/art/cut-test/{d}/{pre}.json', '--sheet', f'gen/{sheet}.png',
                                                         '--out', f'qa/art/spill-newcut-{d}.json'), f'qa/art/spill-newcut-{d}.json')

    print('spill.py (default thresholds) on the approved pieces in public/')
    approved = [('doom', 'p', 'doom-parts'), ('doom', 'f', 'doom-face-parts'), ('doom', 'h', 'doom-heads'), ('doom', 't', 'doom-heads34'),
                ('doom', 'b', 'doom-back'), ('king', 'k', 'king'), ('queen', 'q', 'queen'), ('savanna', 's', 'savanna'),
                ('savanna', 'a', 'animal-parts'), ('village', 'v', 'villagers')]
    for folder, pre, sheet in approved:
        exp = 'FAIL' if (folder, pre) == ('doom', 't') else 'PASS'
        rec, d = run(f'spill approved public/{folder}/{pre}-*', exp,
                     py('spill.py', '--manifest', f'public/{folder}/{pre}.json', '--sheet', f'gen/{sheet}.png', '--out', f'qa/art/spill-approved-{folder}-{pre}.json'),
                     f'qa/art/spill-approved-{folder}-{pre}.json')
        if exp == 'FAIL':
            known.append('public/doom/t-1.png and t-2.png (three-quarter heads, not referenced anywhere in src/) carry a real opaque purple '
                         '1 px line along the flat bottom edge: ' + '; '.join(rec['failed_checks']))
    loose = [f for f in sorted(glob.glob(os.path.join(ROOT, 'public/doom/*.png'))) if not os.path.basename(f)[0:2] in ('p-', 'f-', 'h-', 't-', 'b-')]
    run('spill approved public/doom loose pieces (hood, mask, plate, slit, pupil, brow, nose, mouth, torso2, back, open-down*)', 'PASS',
        py('spill.py', *loose, '--out', 'qa/art/spill-approved-doom-loose.json'), 'qa/art/spill-approved-doom-loose.json',
        note='no sheet for these: lost art is judged by enclosed holes only')
    vals = []
    for rec, d in runs:
        if rec['name'].startswith('spill approved'):
            vals += [c['value'] for c in d.get('checks', []) if c['name'].endswith('faint_fringe_frac')]
    if vals:
        known.append(f'every approved piece carries a faint 1 px key-coloured fringe: faint_fringe_frac min {min(vals)}, median {sorted(vals)[len(vals) // 2]}, '
                     f'max {max(vals)} of edge pixels. Only these files (sha256 in tools/art/legacy-pieces.json) get the loose gate max_faint_frac; every other '
                     'piece is judged strictly (0.05 and a fringe-run limit), which would fail nearly all of them. spill.py --fix removes it (0.0 afterwards) but the files in public/ were not changed.')

    print('spill.py on mutants')
    for mname, exp, strict in (('fringe', 'FAIL', False), ('hole', 'FAIL', False), ('purple-line', 'FAIL', True), ('purple-line', 'FAIL', False)):
        tag = f'{mname}{"-strict" if strict else ""}'
        run(f'spill MUTANT {tag}', exp, py('spill.py', f'qa/art/mutants/{mname}/p-5.png', '--manifest', 'public/doom/p.json', '--sheet', 'gen/doom-parts.png',
                                           '--fix', f'qa/art/mutants/{mname}/fixed', *(['--strict'] if strict else []), '--out', f'qa/art/spill-mutant-{tag}.json'),
            f'qa/art/spill-mutant-{tag}.json',
            note=('an edited copy of an approved piece is not in tools/art/legacy-pieces.json, so it is judged strictly without --strict')
            if (mname, strict) == ('purple-line', False) else None)
    new_cut_mutants()
    run('spill MISSING piece beside a good one', 'UNMEASURED', py('spill.py', 'public/doom/p-2.png', 'public/doom/DOES-NOT-EXIST.png',
                                                                   '--out', 'qa/art/spill-mutant-missing.json'), 'qa/art/spill-mutant-missing.json')
    for tag in ('clean', 'slab', 'bottomline', 'hole50', 'alpha55'):
        run(f'spill NEW-CUT {"control" if tag == "clean" else "MUTANT"} {tag}', 'PASS' if tag == 'clean' else 'FAIL',
            py('spill.py', '--manifest', f'qa/art/mutants/newcut-{tag}/p.json', '--sheet', 'gen/doom-parts.png', '--out', f'qa/art/spill-mutant-newcut-{tag}.json'),
            f'qa/art/spill-mutant-newcut-{tag}.json')
    for tag in ('robe-equals-key', 'robe-near-key'):
        run(f'keycheck MUTANT {tag} inside a dark outline', 'FAIL', py('keycheck.py', f'qa/art/mutants/{tag}.png', '--key', 'auto', '--out', f'qa/art/keycheck-mutant-{tag}.json'),
            f'qa/art/keycheck-mutant-{tag}.json')
    run('cut villagers in true reading order against the approved numbering', 'FAIL',
        py('cut.py', 'gen/villagers.png', 'qa/art/cut-test/village-reading', 'v', '--expect', '12', '--order', 'reading', '--force', '--out', 'qa/art/cut-mutant-reading-order.json'),
        'qa/art/cut-mutant-reading-order.json')
    run('cut with no names and no expected count', 'UNMEASURED',
        py('cut.py', 'gen/doom-parts.png', 'qa/art/cut-test/no-expect', 'zz', '--force', '--out', 'qa/art/cut-mutant-no-expect.json'), 'qa/art/cut-mutant-no-expect.json')

    print('key.py')
    for stem in ('doom-front', 'queen'):
        run(f'key {stem}', 'PASS', py('key.py', f'gen/{stem}.png', f'qa/art/cut-test/{stem}-keyed.png', '--force', '--out', f'qa/art/key-{stem}.json'),
            f'qa/art/key-{stem}.json')

    print('proportions.py')
    rec, d = run('proportions gen/doom-front.png vs reference model sheet', 'FAIL',
                 py('proportions.py', '--picture', 'gen/doom-front.png', '--model', 'qa/art/doom-proportions.json', '--out', 'qa/art/proportions-doom-front.json'),
                 'qa/art/proportions-doom-front.json', note='the generated front picture really differs from the reference character; the rig corrects it')
    known.append('gen/doom-front.png does not have the reference proportions: ' + '; '.join(rec['failed_checks']))
    run('proportions doom rig (numbers of src/chars/doomImg.ts) vs reference model sheet', 'PASS',
        py('proportions.py', '--rig', 'qa/art/doom-rig-manifest.json', '--model', 'qa/art/doom-proportions.json', '--out', 'qa/art/proportions-doom-rig.json'),
        'qa/art/proportions-doom-rig.json')
    run('proportions queen, standalone (style floors, head_frac given by hand)', 'UNMEASURED',
        py('proportions.py', '--picture', 'gen/queen.png', '--landmarks', '{"head_frac": 0.41}', '--out', 'qa/art/proportions-queen-standalone.json'),
        'qa/art/proportions-queen-standalone.json', note='head_frac 0.41 was read off the picture by eye, not measured by a recipe: a declared value cannot pass a check')

    print('gen.sh (fake codex)')
    run('gen.sh refusal paths, dry run, budget, timeout', 'PASS', ['bash', os.path.join(HERE, 'test_gen.sh')], 'qa/art/gen-test/result.json')

    unexpected = [r['name'] for r, _ in runs if not r['as_expected']]
    summary = {'tool': 'art/selftest.py', 'mode': 'standalone', 'time': runs and json.load(open(os.path.join(ROOT, runs[0][0]['result'])))['time'],
               'verdict': 'PASS' if not unexpected else 'FAIL', 'runs': len(runs), 'unexpected': unexpected,
               'known_findings': known, 'thresholds': json.load(open(C.QA_JSON))['art'],
               'not_checked': ['a real Codex generation (none was made; the templates in tools/art/prompts/ are untested against the image tool)',
                               'pieces as they look inside a rendered shot',
                               'proportions of king, queen, villagers against the reference (no model sheet measured for them)',
                               'approved.json allow-list in gen.sh (public/chars/approved.json does not exist yet: gen.sh warns and checks names and bytes only)',
                               'pose wording that paraphrases a pose without any listed stem',
                               'art in exactly the key colour with no outline, or smaller than art.keycheck.max_enclosed_frac of the art'],
               'results': [r for r, _ in runs]}
    json.dump(summary, open(a.out, 'w'), indent=1)
    print(f"selftest: {summary['verdict']}  {len(runs) - len(unexpected)} of {len(runs)} runs as expected -> {C.rel(a.out)}")
    sys.exit(0 if not unexpected else 1)


if __name__ == '__main__':
    main()
