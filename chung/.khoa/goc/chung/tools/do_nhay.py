#!/usr/bin/env python3
"""Dò chỗ hình nhảy trong một cảnh (nhân vật đổi cỡ, ánh sáng giật, đồ biến mất), thứ tấm 9 khung không thấy.
Dùng sau tools/kiem-canh.sh, chạy trong chung/:  python3 tools/do_nhay.py d1c15-01 d1c15-02 [--anh]
Mỗi khung nhảy mạnh được in ra. Có --anh thì ghi thêm tấm 6 khung liên tiếp quanh chỗ nhảy mạnh nhất:
out/kiem-canh/<comp>-nhay.jpg. Đòn đánh, chớp, nổ đúng kịch bản cũng bị báo: phải mở ảnh để phân biệt."""
import subprocess, sys
from PIL import Image

W, H = 96, 54


def doc(v, w, h):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return [b[i:i + w * h] for i in range(0, len(b) - w * h + 1, w * h)]


def tam(v, k, ra):
    x0 = max(0, k - 2)
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-vf', f"select='between(n,{x0},{x0 + 5})',scale=320:180,format=rgb24", '-fps_mode', 'vfr', '-f', 'rawvideo', '-'], capture_output=True).stdout
    n = len(p) // (320 * 180 * 3)
    G = Image.new('RGB', (960, 360))
    for i in range(min(n, 6)):
        G.paste(Image.frombytes('RGB', (320, 180), p[i * 172800:(i + 1) * 172800]), ((i % 3) * 320, (i // 3) * 180))
    G.save(ra, quality=85)


def main():
    a = sys.argv[1:]
    anh = '--anh' in a
    L = [x for x in a if x != '--anh']
    if not L:
        sys.exit(__doc__)
    for c in L:
        v = f'out/kiem-canh/{c}.mp4'
        F = doc(v, W, H)
        if len(F) < 3:
            print(c, 'KHÔNG ĐỌC ĐƯỢC', v)
            continue
        D = [sum(abs(x - y) for x, y in zip(p[::2], q[::2])) / (W * H / 2) for p, q in zip(F, F[1:])]
        m = sorted(D)[len(D) // 2]
        J = [(i + 1, round(d)) for i, d in enumerate(D) if d > max(14, 5 * m)]
        print(c, f'{len(F)} khung;', 'nhảy: ' + ', '.join(f'{k}={d}' for k, d in J[:12]) if J else 'không nhảy')
        if anh and J:
            k = max(J, key=lambda t: t[1])[0]
            tam(v, k, f'out/kiem-canh/{c}-nhay.jpg')


if __name__ == '__main__':
    main()
