"""Helper of tools/art/gen.sh (prompt checks, reference checks, budget, log). Not meant to be run by hand.

  python3 genlib.py prepare OUT PROMPT_FILE COMPOSED_OUT [REF ...]
      runs every refusal check, writes the composed prompt (comments stripped, style block appended) to
      COMPOSED_OUT, prints one JSON object {"ok": bool, "status": ..., "reason": ..., ...} and exits 0 or 3.
  python3 genlib.py log JSON_OBJECT     appends one line to the log (GEN_LOG, default gen/log.jsonl)
  python3 genlib.py prov OUT_PATH PROMPT_FILE COMPOSED [REF ...]   writes OUT_PATH.prov.json

Budget: prepare counts and RESERVES one generation under an exclusive file lock (<log>.lock) before the call, so
parallel gen.sh processes cannot overspend. A new run id and a changed GEN_BUDGET are written to the log
("run_opened" with what other run ids spent today, "budget_changed"); art.gen.max_per_day caps all run ids together.
Environment: GEN_BUDGET, GEN_RUN_ID, GEN_LOG, GEN_ALLOW_POSE, GEN_DRY_RUN (see gen.sh).
Word lists and limits come from qa.json art.gen.
"""
import fcntl
import glob
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import uuid
from contextlib import contextmanager

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
QA = os.environ.get('ART_QA_JSON', os.path.join(ROOT, 'qa.json'))
LOG = os.environ.get('GEN_LOG') or os.path.join(ROOT, 'gen', 'log.jsonl')
RUN = os.environ.get('GEN_RUN_ID') or time.strftime('%Y%m%d')
SPENT = ('ok', 'refused_by_image_tool', 'failed', 'timeout')  # outcome statuses of a generation (see costs())


def cfg():
    return json.load(open(QA))['art']['gen']


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def log(rec):
    rec = {'time': time.strftime('%Y-%m-%dT%H:%M:%S'), 'run': RUN, **rec}
    if os.environ.get('GEN_RESERVATION') and 'reservation' not in rec:
        rec['reservation'] = os.environ['GEN_RESERVATION']
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, 'a') as f:
        f.write(json.dumps(rec, ensure_ascii=False) + '\n')


@contextmanager
def locked():
    """Exclusive lock for "count the budget, then reserve one generation": parallel gen.sh processes queue here."""
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG + '.lock', 'w') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def records():
    out = []
    if os.path.exists(LOG):
        for line in open(LOG):
            try:
                out.append(json.loads(line))
            except ValueError:
                continue
    return out


def costs(r):
    """A generation is counted once: by its reservation (written under the lock BEFORE the call). Outcome lines
    carry the reservation id and are not counted again; lines of the older format (no reservation) count by status."""
    return r.get('status') == 'reserved' or (r.get('status') in SPENT and not r.get('reservation'))


def spent(recs=None):
    return sum(1 for r in (records() if recs is None else recs) if r.get('run') == RUN and costs(r))


def name_hits(path, pat):
    """Folder or file names of a path that look like reference footage."""
    return [p for p in os.path.abspath(path).split(os.sep) if p and pat.search(p)]


def reference_hashes(c):
    """sha256 of the images in the project's reference-footage folders (qa.json art.gen.reference_image_globs)."""
    out, n = {}, 0
    for g in c['reference_image_globs']:
        for f in sorted(glob.glob(os.path.join(ROOT, g))):
            if n >= c['reference_image_max']:
                return out, True
            if os.path.isfile(f) and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                try:
                    out[sha(f)] = os.path.relpath(f, ROOT); n += 1
                except OSError:
                    pass
    return out, False


def ref_problem(path, c):
    real = os.path.realpath(path)
    if not os.path.isfile(real):
        return f'reference image not found: {path}'
    pat = re.compile(c['forbidden_ref_pattern'], re.I)
    advice = ('Reference footage must not be sent to the image tool (it refused a tight crop of copyrighted footage). '
              'Describe the character in words and pass an approved picture of OUR OWN art as the style reference.')
    hits = name_hits(path, pat)
    if hits:
        return f'reference image {path} is named like reference footage (folder or file name: {", ".join(hits)}). ' + advice
    hits = name_hits(real, pat)
    if hits:
        return (f'reference image {path} is a link to {real}, which is named like reference footage '
                f'({", ".join(hits)}). ' + advice)
    digest = sha(real)
    known, truncated = reference_hashes(c)
    if digest in known:
        return f'reference image {path} is a byte-identical copy of the reference-footage image {known[digest]}. ' + advice
    approved = os.path.join(ROOT, 'public', 'chars', 'approved.json')
    if os.path.exists(approved):
        ok = {v.get('sha256') for v in json.load(open(approved)).values() if isinstance(v, dict)}
        if digest not in ok:
            return f'reference image {path} is not listed in public/chars/approved.json'
    else:
        print(f'WARNING: public/chars/approved.json does not exist, so the allow-list of approved style references is NOT '
              f'enforced for {path}: only its names and a byte comparison with the reference folders were checked.', file=sys.stderr)
    return None


def pose_hits(text, c):
    """Pose words in the prompt: verb stems with endings (qa.json art.gen.pose_patterns), between letter boundaries,
    after normalising: NFC, lower case, '_' -> space, spaced-out letters joined ("s e a t e d")."""
    t = unicodedata.normalize('NFC', text).lower().replace('_', ' ')
    t = re.sub(r'(?<!\w)(?:\w ){2,}\w(?!\w)', lambda m: m.group(0).replace(' ', ''), t)
    for e in c.get('pose_exceptions', []):
        t = t.replace(e.lower(), ' ')
    pats = list(c.get('pose_patterns', [])) + [re.escape(w) for w in c.get('pose_words', [])]
    hits = set()
    for p in pats:
        for m in re.finditer(r'(?<![^\W\d_])(?:' + p + r')(?![^\W\d_])', t, re.I):
            hits.add(m.group(0))
    return sorted(hits)


def prepare(out, prompt_file, composed_out, refs):
    c = cfg()
    dry = os.environ.get('GEN_DRY_RUN') == '1'
    base = {'prompt_file': prompt_file, 'refs': refs, 'output': out}

    def refuse(status, reason, **extra):
        rec = {**base, 'status': status, 'refusal': reason, **extra}
        log(rec)
        print(json.dumps({'ok': False, **rec}))
        sys.exit(3)

    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*\.png', out):
        refuse('refused_usage', f'output name {out!r} must be a plain file name ending in .png (it is saved into gen/)')
    if not os.path.isfile(prompt_file):
        refuse('refused_usage', f'prompt file not found: {prompt_file}')
    for r in refs:
        p = ref_problem(r, c)
        if p:
            refuse('refused_reference', p)
    if len(refs) > c['max_refs']:
        refuse('refused_reference', f'{len(refs)} reference images, at most {c["max_refs"]}')
    raw = open(prompt_file).read()
    text = '\n'.join(l for l in raw.splitlines() if not l.lstrip().startswith('#')).strip()
    holes = sorted(set(re.findall(r'\{\{[^}]*\}\}', text)))
    if holes:
        refuse('refused_prompt', f'unfilled template placeholders: {", ".join(holes)}')
    if len(text) < c['min_prompt_chars']:
        refuse('refused_prompt', f'prompt has {len(text)} characters, fewer than {c["min_prompt_chars"]}')
    hits = pose_hits(text, c)
    pose_override = False
    if hits:
        if os.environ.get('GEN_ALLOW_POSE') == '1':
            pose_override = True
        else:
            refuse('refused_pose', 'the prompt contains pose wording (' + ', '.join(hits) + '). The image tool refused a seated '
                   'figure before, and poses are assembled from parts in the rig: ask for a neutral standing front view or a '
                   'parts sheet (tools/art/prompts/). If the word describes a whole prop or an animal stride that cannot be '
                   'rigged, or is harmless here ("a running stream"), rerun with GEN_ALLOW_POSE=1 (the override is logged).', pose_words=hits)
    if not re.search(c['style_marker'], text):
        style = open(os.path.join(os.path.dirname(__file__), 'prompts', 'style.txt')).read()
        style = '\n'.join(l for l in style.splitlines() if not l.lstrip().startswith('#')).strip()
        text = text + '\n' + style
        style_added = True
    else:
        style_added = False
    budget = os.environ.get('GEN_BUDGET')
    real_codex = os.path.basename(os.environ.get('CODEX_BIN') or 'codex') == 'codex'
    default_log = os.path.join(ROOT, 'gen', 'log.jsonl')
    moved = [k for k, d in (('GEN_LOG', default_log), ('GEN_DIR', os.path.join(ROOT, 'gen')))
             if os.environ.get(k) and os.path.abspath(os.environ[k]) != d]
    reservation = None
    with locked():
        recs = records()
        used = spent(recs)
        today = time.strftime('%Y-%m-%d')
        today_all = [r for r in recs if str(r.get('time', '')).startswith(today) and costs(r)]
        others = {}
        for r in today_all:
            if r.get('run') != RUN:
                others[r.get('run')] = others.get(r.get('run'), 0) + 1
        mine = [r for r in recs if r.get('run') == RUN]
        if not dry and not any(r.get('status') == 'run_opened' for r in mine):
            log({'status': 'run_opened', 'budget': budget, 'spent_before_in_this_run': used, 'other_runs_today': others})
            if others:
                print(f'NOTE: new run id {RUN}: {sum(others.values())} generation(s) were already spent today under other run ids '
                      f'({others}). Recorded in the log.', file=sys.stderr)
        last_budget = [r.get('budget') if r.get('status') == 'run_opened' else r.get('to') for r in mine
                       if r.get('status') in ('run_opened', 'budget_changed')]
        if not dry and last_budget and last_budget[-1] != budget:
            log({'status': 'budget_changed', 'from': last_budget[-1], 'to': budget, 'spent': used})
            print(f'NOTE: GEN_BUDGET of run {RUN} changed from {last_budget[-1]} to {budget}. Recorded in the log.', file=sys.stderr)
        if budget is None or not budget.isdigit():
            if not dry:
                refuse('refused_budget', 'GEN_BUDGET is not set. Set it to the number of generations the owner approved for this '
                       'run (GEN_RUN_ID, default: today). Every generation costs money.')
        elif used >= int(budget):
            refuse('refused_budget', f'budget used up: {used} of {budget} generations already spent in run {RUN}', spent=used)
        if len(today_all) >= c['max_per_day'] and not dry:
            refuse('refused_budget', f'{len(today_all)} generations already spent today over all run ids, the daily ceiling is '
                   f'{c["max_per_day"]} (qa.json art.gen.max_per_day, an owner decision).', spent_today=len(today_all))
        if moved and real_codex and not dry:
            refuse('refused_budget', f'{" and ".join(moved)} point(s) away from gen/: these overrides are for tests with a CODEX_BIN stub. '
                   'A real call always counts in gen/log.jsonl, so the budget cannot be reset by moving the log.')
        if not dry:
            reservation = uuid.uuid4().hex[:12]
            log({**base, 'status': 'reserved', 'reservation': reservation, 'budget': budget, 'spent_after': used + 1})
    open(composed_out, 'w').write(text)
    print(json.dumps({'ok': True, **base, 'style_added': style_added, 'pose_override': pose_override,
                      'pose_words': hits, 'spent': used, 'budget': budget, 'timeout': c['timeout_s'],
                      'reservation': reservation, 'allow_list': os.path.exists(os.path.join(ROOT, 'public', 'chars', 'approved.json')),
                      'prompt_sha256': hashlib.sha256(text.encode()).hexdigest(), 'prompt_chars': len(text)}))


def main():
    cmd = sys.argv[1]
    if cmd == 'prepare':
        prepare(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:])
    elif cmd == 'refimages':
        print('\n'.join(reference_hashes(cfg())[0].values()))
    elif cmd == 'log':
        log(json.loads(sys.argv[2]))
    elif cmd == 'prov':
        outp, pf, comp, refs = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:]
        json.dump({'time': time.strftime('%Y-%m-%dT%H:%M:%S'), 'run': RUN, 'output': os.path.basename(outp),
                   'output_sha256': sha(outp), 'prompt_file': pf, 'prompt_sha256': sha(comp),
                   'refs': [{'path': r, 'sha256': sha(r)} for r in refs]}, open(outp + '.prov.json', 'w'), indent=1)
    else:
        sys.exit(2)


if __name__ == '__main__':
    main()
