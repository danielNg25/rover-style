"""deepextract.py - print chosen fields of the deep-look notes for a range of shots, one block per shot.
usage (from the repository root): python3 rover-lab/tools/deepextract.py FIELDS [FIRST LAST]
  FIELDS: comma list from camera,cuts,far,set,floor,props,light,shadows,characters,acting,fx,text,colour,other,easy_to_miss,summary"""
import json, glob, sys, re
fields = sys.argv[1].split(','); a = int(sys.argv[2]) if len(sys.argv) > 2 else 0; b = int(sys.argv[3]) if len(sys.argv) > 3 else 9999
R = []
for f in sorted(glob.glob('rover-lab/out/deep/notes/batch-*.jsonl')):
    for l in open(f):
        l = l.strip()
        if not l: continue
        try: R.append(json.loads(l))
        except Exception: pass
num = lambda r: int(re.match(r'\d+', str(r.get('shot', '0'))).group()) if re.match(r'\d+', str(r.get('shot', '0'))) else 0
R.sort(key=lambda r: (num(r), str(r.get('shot'))))
for r in R:
    if not a <= num(r) <= b: continue
    print(f"## shot {r.get('shot')} [{r.get('frames', '')}]")
    for k in fields:
        v = r.get(k)
        if v in (None, '', [], 'none'): continue
        print(f'{k}: ' + (v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)))
