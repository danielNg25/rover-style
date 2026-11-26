"""Floor view for the shadow study: lower 62% of each picked frame at native size, local contrast raised
so faint soft shadows show. 2 x 4 per sheet. Frames are re-grabbed at 1280 wide."""
import json, subprocess, os, sys, cv2, numpy as np
ROOT = 'rover-lab/out/study/shadow'
rows = json.load(open(f'{ROOT}/pick.json'))
os.makedirs(f'{ROOT}/full', exist_ok=True); os.makedirs(f'{ROOT}/floor', exist_ok=True)
cl = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6))
tiles = []
for r in rows:
    out = f"{ROOT}/full/{r['sid']}.png"
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{r['t']:.3f}", '-i', 'ref/rover_doom.webm', '-frames:v', '1', out], check=True)
    f = cv2.imread(out)[int(720 * 0.38):]
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB); lab[..., 0] = cl.apply(lab[..., 0])
    e = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    e = cv2.resize(e, (960, int(e.shape[0] * 960 / 1280)), interpolation=cv2.INTER_AREA)
    cv2.rectangle(e, (0, 0), (430, 20), (0, 0, 0), -1)
    cv2.putText(e, f"{r['sid']} {r['t']}s {r['set'][:34]}", (4, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 235, 255), 1, cv2.LINE_AA)
    tiles.append(e)
h = tiles[0].shape[0]
for p in range(0, len(tiles), 8):
    sh = np.full((4 * (h + 4), 1924, 3), 20, np.uint8)
    for j, t in enumerate(tiles[p:p + 8]):
        x = (j % 2) * 964; y = (j // 2) * (h + 4); sh[y:y + h, x:x + 960] = t
    cv2.imwrite(f'{ROOT}/floor/fl{p // 8 + 1:02d}.jpg', sh, [cv2.IMWRITE_JPEG_QUALITY, 88])
print(len(tiles), 'tiles', h)
