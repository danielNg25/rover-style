"""Shadow study, motion: for chosen shots, N frames spread over the shot, a native crop around the
figure and its shadow, contrast raised, stacked in a grid. Lets the eye compare pose and shadow frame by frame.
usage: shadowmotion.py SID[:x0,y0,x1,y1] ...   (crop in 1280x720 pixels; default lower 62%)"""
import json, subprocess, os, sys, cv2, numpy as np
ROOT = 'rover-lab/out/study/shadow'
rows = {r['sid']: r for r in json.load(open(f'{ROOT}/pick.json'))}
os.makedirs(f'{ROOT}/motion', exist_ok=True)
cl = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6))
N = 8
for a in sys.argv[1:]:
    sid, _, box = a.partition(':')
    r = rows[sid]; x0, y0, x1, y1 = [int(v) for v in box.split(',')] if box else (0, 274, 1280, 720)
    f0 = int(round(r['t0'] * 24)) + 3; f1 = int(round(r['t1'] * 24)) - 3
    fr = [int(round(f0 + (f1 - f0) * k / (N - 1))) for k in range(N)]
    tiles = []
    for f in fr:
        p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f / 24:.4f}', '-i', 'ref/rover_doom.webm', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True)
        im = cv2.imdecode(np.frombuffer(p.stdout, np.uint8), cv2.IMREAD_COLOR)[y0:y1, x0:x1]
        lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB); lab[..., 0] = cl.apply(lab[..., 0]); im = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        w = 940; im = cv2.resize(im, (w, int(im.shape[0] * w / im.shape[1])), interpolation=cv2.INTER_CUBIC)
        cv2.rectangle(im, (0, 0), (150, 20), (0, 0, 0), -1)
        cv2.putText(im, f'{sid} f{f}', (4, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 235, 255), 1, cv2.LINE_AA)
        tiles.append(im)
    h = tiles[0].shape[0]; cols = 2; rws = (N + 1) // 2
    sh = np.full((rws * (h + 4), cols * 944, 3), 20, np.uint8)
    for j, t in enumerate(tiles):
        sh[(j // cols) * (h + 4):(j // cols) * (h + 4) + h, (j % cols) * 944:(j % cols) * 944 + 940] = t
    cv2.imwrite(f'{ROOT}/motion/{sid}.jpg', sh, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(sid, r['set'], fr[0], fr[-1], sh.shape)
