"""Contact sheets + narration alignment for a time range of the reference video.
usage: python3 tools/shotsheet.py <t0_seconds> <t1_seconds> <out_dir>
Writes <out_dir>/sheet-NN.jpg (25 shots per sheet, one frame per shot taken 40% into the shot, labelled "#index time")
and <out_dir>/shots.tsv (index, start, end, length, narration words spoken during the shot).
Shot boundaries come from the detected cut list (it misses some cuts between similar framings: treat a row as "one or more shots")."""
import sys, os, json, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VIDEO = os.path.join(ROOT, 'ref', 'rover_doom.webm')
R = os.path.join(ROOT, 'research', 'rover-explains-2026-11-20')
t0, t1, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
os.makedirs(out, exist_ok=True)
cuts = [0.0] + [float(x) for x in open(os.path.join(R, 'bao-cao-goc', 'cuts.txt')).read().split()] + [1435.0]
words = [w for s in json.load(open(os.path.join(R, 'transcript', 'doom.json'))) for w in s['words']]
shots = [(a, b) for a, b in zip(cuts, cuts[1:]) if b > t0 and a < t1]
rows = []
for i, (a, b) in enumerate(shots):
    said = ' '.join(w['w'] for w in words if a <= (w['s'] + w['e']) / 2 < b)
    rows.append((i, a, b, said))
    t = a + 0.4 * (b - a)
    label = f"#{i} {a:.1f}s"
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', '-vf',
                    f"scale=384:216,drawtext=text='{label}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.65", '-y', os.path.join(out, f'_f{i:03d}.jpg')], check=True)
with open(os.path.join(out, 'shots.tsv'), 'w') as f:
    f.write('index\tstart\tend\tlength\tnarration\n')
    for i, a, b, said in rows: f.write(f'{i}\t{a:.2f}\t{b:.2f}\t{b - a:.2f}\t{said}\n')
subprocess.run(['ffmpeg', '-v', 'error', '-pattern_type', 'glob', '-i', os.path.join(out, '_f*.jpg'), '-vf', 'tile=5x5', '-q:v', '3', '-y', os.path.join(out, 'sheet-%02d.jpg')], check=True)
for fn in os.listdir(out):
    if fn.startswith('_f'): os.remove(os.path.join(out, fn))
print(len(rows), 'shots ->', out)
