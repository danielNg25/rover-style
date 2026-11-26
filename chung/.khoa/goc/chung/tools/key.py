"""Remove a flat background by flood-filling from the image borders.
usage: python3 tools/key.py in.png out.png [tolerance=38]
Works even when the subject contains colours close to the background, as long as the subject is not touching the border."""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
tol = int(sys.argv[3]) if len(sys.argv) > 3 else 38
im = Image.open(src).convert('RGB'); w, h = im.size
work = im.copy(); KEY = (255, 0, 255)
for x, y in [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2), (w // 2, 1), (w // 2, h - 2), (1, h // 2), (w - 2, h // 2)]:
    if work.getpixel((x, y)) != KEY:
        ImageDraw.floodfill(work, (x, y), KEY, thresh=tol)
a = np.array(work); bg = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
alpha = Image.fromarray(np.where(bg, 0, 255).astype('uint8'))
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))  # shave the fringe, soften
# de-spill: push edge colours toward the nearest interior colour
inner = Image.composite(im, Image.new('RGB', im.size, (0, 0, 0)), alpha.point(lambda v: 255 if v > 250 else 0))
grow = inner
for _ in range(4):
    grow = Image.composite(grow, grow.filter(ImageFilter.MaxFilter(3)), grow.convert('L').point(lambda v: 255 if v > 0 else 0))
rgb = Image.composite(im, grow, alpha.point(lambda v: 255 if v > 250 else 0))
out = rgb.convert('RGBA'); out.putalpha(alpha)
bbox = out.getbbox(); out = out.crop(bbox)
out.save(dst); print(dst, out.size)
