"""Cut a parts sheet (flat magenta background) into separate transparent PNGs.
usage: python3 tools/cut.py sheet.png out_dir prefix [min_area=1500] [--mong=<số món lời tả đòi>]
--mong (26/11/2026): cắt ra khác số món thì báo LOI so-mon và thoát mã 1. Cuối cùng in phần diện tích tấm có hình: tấm thưa là phí một lần gen.
Writes out_dir/prefix-N.png (N in reading order), out_dir/prefix.json (bboxes) and out_dir/prefix-overview.jpg (numbered)."""
import sys, json, os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
mong = next((int(x.split('=')[1]) for x in sys.argv if x.startswith('--mong=')), None); sys.argv = [x for x in sys.argv if not x.startswith('--mong=')]
src, outdir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
min_area = int(sys.argv[4]) if len(sys.argv) > 4 else 1500
os.makedirs(outdir, exist_ok=True)
im = Image.open(src).convert('RGB'); a = np.array(im).astype(int); h, w = a.shape[:2]
bgc = np.median(a[:6, :, :].reshape(-1, 3), axis=0)  # background colour sampled from the top rows
dist = np.sqrt(((a - bgc) ** 2).sum(-1))
# magenta-ness: far from any colour used by the art, so a generous threshold is safe
fg = dist > 70
mask = Image.fromarray((fg * 255).astype('uint8'))
lab = mask.copy(); comps = []; label = 0
px = lab.load()
for y in range(0, h, 4):
    for x in range(0, w, 4):
        if px[x, y] == 255 and label < 250:
            label += 1
            ImageDraw.floodfill(lab, (x, y), label)
            m = np.array(lab) == label
            ys, xs = np.where(m)
            comps.append((label, int(m.sum()), int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
            px = lab.load()
big = [c for c in comps if c[1] >= min_area]
# reading order: rows by y-centre bands, then x
rowh = h / 6
big.sort(key=lambda c: (round(((c[3] + c[5]) / 2) / rowh), c[2]))
L = np.array(lab)
soft = Image.fromarray((np.clip((dist - 40) / 50, 0, 1) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))
ov = im.copy(); d = ImageDraw.Draw(ov); meta = []
for i, (lb, area, x0, y0, x1, y1) in enumerate(big, 1):
    pad = 3; X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)
    region = (L[Y0:Y1, X0:X1] == lb)
    # include small specks fully inside this bbox that belong to the piece (e.g. rivets are already connected); grow mask a little
    grown = Image.fromarray((region * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
    alpha = Image.fromarray(np.minimum(np.array(grown), np.array(soft.crop((X0, Y0, X1, Y1)))).astype('uint8'))
    rgb = im.crop((X0, Y0, X1, Y1))
    # de-spill: replace pixels that are still magenta-ish at the edge by a blurred interior colour
    arr = np.array(rgb).astype(int); dd = dist[Y0:Y1, X0:X1]
    inner = Image.composite(rgb, Image.new('RGB', rgb.size, (0, 0, 0)), Image.fromarray(((dd > 120) * 255).astype('uint8')))
    g = inner
    for _ in range(5):
        g = Image.composite(g, g.filter(ImageFilter.MaxFilter(3)), g.convert('L').point(lambda v: 255 if v > 0 else 0))
    rgb2 = Image.composite(rgb, g, Image.fromarray(((dd > 120) * 255).astype('uint8')))
    out = rgb2.convert('RGBA'); out.putalpha(alpha)
    name = f'{prefix}-{i}.png'; out.save(os.path.join(outdir, name))
    meta.append({'n': i, 'file': name, 'bbox': [X0, Y0, X1, Y1], 'w': X1 - X0, 'h': Y1 - Y0})
    d.rectangle((X0, Y0, X1, Y1), outline=(255, 255, 0), width=3); d.text((X0 + 6, Y0 + 4), str(i), fill=(255, 255, 255), stroke_width=3, stroke_fill=(0, 0, 0), font_size=40)
json.dump(meta, open(os.path.join(outdir, prefix + '.json'), 'w'), indent=1)
ov.convert('RGB').save(os.path.join(outdir, prefix + '-overview.jpg'), quality=85)
for m in meta: print(m)
day = fg.mean() * 100
print(f'cắt được {len(meta)} món; hình chiếm {day:.0f} % diện tích tấm' + ('' if day >= 40 else '. TẤM THƯA: hạn mức tính theo số lần gen, lần sau xếp sát hơn (skill 2, mục Vẽ đồ bằng Codex)'))
if mong is not None and len(meta) != mong:
    print(f'LOI  so-mon      lời tả đòi {mong} món, cắt được {len(meta)}: có món dính nhau hoặc bị bỏ sót. Mở {prefix}-overview.jpg; món thiếu dồn sang tấm sau, không gen riêng một tấm cho một hai món')
    sys.exit(1)
