#!/usr/bin/env python3
"""bang_phan_canh.py - ghép bảng phân cảnh của một chương thành một ảnh để chủ kênh duyệt.

    python3 tools/bang_phan_canh.py <mã> "<tên chương>" [số cột=4]

Đọc ../kenh/<kênh>/out/<mã>/bp/rows.json: danh sách [["lời đọc", "một dòng việc chính"], ...] theo thứ tự cảnh,
và ảnh ../kenh/<kênh>/out/<mã>/bp/<mã>-bp-01.png, -02.png ... Ghi ../kenh/<kênh>/out/<mã>/bang-phan-canh.jpg.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dang_lam import OUT

F, FB = '/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
ma, ten = sys.argv[1], sys.argv[2]
cot = int(sys.argv[3]) if len(sys.argv) > 3 else 4
D = os.path.join(str(OUT), ma)
rows = json.load(open(os.path.join(D, 'bp', 'rows.json'), encoding='utf-8'))
W, H, CAP, PAD = 560, 315, 138, 10
f1, f2, fn, ft = ImageFont.truetype(FB, 21), ImageFont.truetype(F, 18), ImageFont.truetype(FB, 26), ImageFont.truetype(FB, 30)


def wrap(d, t, f, w):
    out, cur = [], ''
    for word in t.split(' '):
        x = (cur + ' ' + word).strip()
        if d.textlength(x, font=f) <= w:
            cur = x
        else:
            out.append(cur)
            cur = word
    out.append(cur)
    return out


hang = (len(rows) + cot - 1) // cot
G = Image.new('RGB', (cot * W + (cot + 1) * PAD, hang * (H + CAP) + (hang + 1) * PAD + 60), '#1c1a20')
d = ImageDraw.Draw(G)
d.text((PAD, 14), f'{ten} ({ma}): bảng phân cảnh, {len(rows)} cảnh', font=ft, fill='#f2e8d0')
for i, (loi, viec) in enumerate(rows):
    r, c = divmod(i, cot)
    x, y = PAD + c * (W + PAD), 60 + PAD + r * (H + CAP + PAD)
    p = os.path.join(D, 'bp', f'{ma}-bp-{i + 1:02d}.png')
    if not os.path.exists(p):
        sys.exit(f'THIẾU ảnh: {p}')
    G.paste(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
    d.rectangle([x, y + H, x + W, y + H + CAP], fill='#2a2630')
    d.rectangle([x, y, x + 48, y + 40], fill='#000000')
    d.text((x + 8, y + 5), str(i + 1), font=fn, fill='#ffd88a')
    ty = y + H + 7
    for l in wrap(d, '“' + loi + '”', f1, W - 18):
        d.text((x + 9, ty), l, font=f1, fill='#fff6e0')
        ty += 26
    ty += 3
    for l in wrap(d, viec, f2, W - 18):
        d.text((x + 9, ty), l, font=f2, fill='#c9c2d6')
        ty += 23
    if ty > y + H + CAP:
        print(f'cảnh {i + 1}: chữ tràn ô, rút ngắn dòng việc chính')
out = os.path.join(D, 'bang-phan-canh.jpg')
G.save(out, quality=88)
print(out, G.size)

# Bản GỬI DANIEL (23/11/2026: "ghép nhiều hình vào 1 chỗ nhỏ quá ko thấy rõ"): PDF, mỗi trang 4 cảnh, ảnh rộng 960, chữ to. Tấm jpg ở trên chỉ để người điều phối soi nhanh.
PW, PH, PC, M, TOP = 960, 540, 172, 14, 66
F1, F2, FN, FT = ImageFont.truetype(FB, 31), ImageFont.truetype(F, 27), ImageFont.truetype(FB, 40), ImageFont.truetype(FB, 32)
trang = []
tong = (len(rows) + 3) // 4
for t in range(tong):
    P = Image.new('RGB', (2 * PW + 3 * M, TOP + 2 * (PH + PC) + 2 * M), '#1c1a20')
    a = ImageDraw.Draw(P)
    a.text((M, 14), f'{ten}: trang {t + 1}/{tong}', font=FT, fill='#f2e8d0')
    for k, i in enumerate(range(t * 4, min(t * 4 + 4, len(rows)))):
        loi, viec = rows[i]
        x, y = M + (k % 2) * (PW + M), TOP + (k // 2) * (PH + PC + M)
        P.paste(Image.open(os.path.join(D, 'bp', f'{ma}-bp-{i + 1:02d}.png')).convert('RGB').resize((PW, PH), Image.LANCZOS), (x, y))
        a.rectangle([x, y + PH, x + PW, y + PH + PC], fill='#2a2630')
        a.rectangle([x, y, x + 74, y + 58], fill='#000000')
        a.text((x + 12, y + 6), str(i + 1), font=FN, fill='#ffd88a')
        ty = y + PH + 9
        for l in wrap(a, '“' + loi + '”', F1, PW - 26):
            a.text((x + 13, ty), l, font=F1, fill='#fff6e0')
            ty += 39
        ty += 4
        for l in wrap(a, viec, F2, PW - 26):
            a.text((x + 13, ty), l, font=F2, fill='#c9c2d6')
            ty += 34
        if ty > y + PH + PC:
            print(f'cảnh {i + 1}: chữ tràn ô PDF')
    trang.append(P)
pdf = os.path.join(D, 'bang-phan-canh.pdf')
trang[0].save(pdf, save_all=True, append_images=trang[1:], resolution=150, quality=86)
print(pdf, f'{tong} trang', f'{os.path.getsize(pdf) / 1048576:.1f} MB')
