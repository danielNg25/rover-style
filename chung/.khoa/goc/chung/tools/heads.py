"""Sheet of character HEADS from reference close-ups, all scaled so the eye band has the same width, to see whether the
characters share a few fixed moulds (head shape, eye and mouth sets). usage: python3 tools/heads.py -> out/gallery/dau-nhan-vat.jpg"""
import glob, os
import numpy as np
from PIL import Image, ImageDraw
R = '../research/rover-explains-2026-11-20/exemplars-xl'
files = sorted(set(glob.glob(R + '/close-up/*.jpg') + glob.glob(R + '/theme-faces-and-expressions/*.jpg') + glob.glob(R + '/medium-interior/*.jpg')))
def label(mask):
    """connected components of a small boolean mask (4-neighbour), returns list of (area, x0, y0, x1, y1)"""
    h, w = mask.shape; seen = np.zeros_like(mask, bool); out = []
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not seen[y, x]:
                st = [(y, x)]; seen[y, x] = True; a = 0; x0 = x1 = x; y0 = y1 = y
                while st:
                    cy, cx = st.pop(); a += 1; x0 = min(x0, cx); x1 = max(x1, cx); y0 = min(y0, cy); y1 = max(y1, cy)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; st.append((ny, nx))
                out.append((a, x0, y0, x1 + 1, y1 + 1))
    return out
tiles = []
for f in files:
    im = Image.open(f).convert('RGB'); W, H = im.size
    s = np.array(im.resize((160, 90))).astype(int)
    white = (s.min(2) > 222) & ((s.max(2) - s.min(2)) < 26)
    best = None
    for a, x0, y0, x1, y1 in label(white):
        w, h = x1 - x0, y1 - y0
        if not (14 <= w <= 80 and 6 <= h <= 40 and 1.25 <= w / h <= 3.6 and a > 0.5 * w * h and y1 < 75): continue
        if best is None or a > best[0]: best = (a, x0, y0, x1, y1)
    if not best: continue
    k = W / 160; _, x0, y0, x1, y1 = best; cx, cy, ew = (x0 + x1) / 2 * k, (y0 + y1) / 2 * k, (x1 - x0) * k
    side = ew * 1.75; box = (int(cx - side / 2), int(cy - side * 0.52), int(cx + side / 2), int(cy + side * 0.48))
    if box[0] < 0 or box[1] < -20 or box[2] > W or box[3] > H + 20: continue
    tiles.append((ew, im.crop(box).resize((256, 256), Image.LANCZOS), os.path.basename(f)))
tiles = tiles[:48]; cols = 8; rows = (len(tiles) + cols - 1) // cols
S = Image.new('RGB', (cols * 256, rows * 256), 'black'); d = ImageDraw.Draw(S)
for i, (ew, t, n) in enumerate(tiles):
    x, y = (i % cols) * 256, (i // cols) * 256; S.paste(t, (x, y))
    # guide lines: the eye band is always 256/1.75 = 146 px wide, centred
    d.line([(x + 55, y + 133), (x + 201, y + 133)], fill=(255, 0, 255), width=1); d.text((x + 4, y + 4), str(i + 1), fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0), font_size=18)
os.makedirs('out/gallery', exist_ok=True); S.save('out/gallery/dau-nhan-vat.jpg', quality=88); print(len(tiles), 'heads from', len(files), 'frames', S.size)
