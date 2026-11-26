#!/usr/bin/env python3
"""do_sang.py - đo độ sáng của ảnh tĩnh và video, so với video mẫu (Rover Explains, "Doctor Doom").

    python3 tools/do_sang.py <ảnh hoặc video> [...]        (đường dẫn tính từ nơi gọi; chạy được trong sandbox, chỉ cần ffmpeg)

Vì sao có: 23/11/2026 chủ kênh chê "các cảnh hơi tối... hơi bị nhiều và liên tục". Đo thì đúng: video mẫu sáng trung bình 112,
đoạn mở của mình 71, chương 2 là 100; 38% và 25% số khung của mình dưới 70, ở mẫu chỉ 8%.

Thang đo: Y trung bình của khung theo ffmpeg signalstats (YAVG, 16 là đen, 235 là trắng). KHÔNG cùng thang với `luma` trong
look.tsx / classnorms.py (xám 0-255 của OpenCV): Y ≈ 16 + 0,86 × xám.

Số đo trên video mẫu (718 khung, 2 giây một khung, cả 1434 giây):
    trung bình 112, trung vị 110, p10 = 73, p90 = 158; dưới 50: 3% số khung; dưới 70: 8%; quãng liên tục dưới 60 dài nhất: 8 giây.
Cảnh tối của mẫu (đêm, hầm, địa ngục, vũ trụ) vẫn ở khoảng 69-76: nền xám xanh hoặc đỏ cam ĐẬM MÀU chứ không đen, nhân vật giữ
nguyên màu sáng của mình, nguồn sáng (cửa, lửa, đèn, trăng) chiếm mảng lớn.

Ngưỡng (in ĐẠT / TỐI):
    ảnh tĩnh hoặc một cảnh quay:  Y >= 70 (cảnh đêm, trong nhà tối nên ở 78-95; cảnh ngày, phòng sáng >= 105)
    một chương hoặc cả đoạn video: trung bình >= 100; số khung dưới 70 <= 12%; quãng liên tục dưới 60 <= 8 giây
"""
import sys, re, subprocess, statistics as st

MIN_SHOT, MEAN_SEQ, SHARE70, RUN60 = 70, 100, 12, 8.0
IMG = ('.png', '.jpg', '.jpeg', '.webp')


def ys(path, fps):
    vf = (f'fps={fps},' if fps else '') + 'scale=320:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-'
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', vf, '-f', 'null', '-'], capture_output=True, text=True)
    return [float(x) for x in re.findall(r'YAVG=([\d.]+)', r.stdout)]


bad = 0
for p in sys.argv[1:]:
    if p.lower().endswith(IMG):
        y = ys(p, 0)
        if not y: print(f'KHÔNG ĐỌC ĐƯỢC  {p}'); bad += 1; continue
        ok = y[0] >= MIN_SHOT; bad += not ok
        print(f"{'ĐẠT' if ok else 'TỐI'}  Y={y[0]:5.1f}  {p}")
        continue
    FPS = 6
    y = ys(p, FPS)
    if not y: print(f'KHÔNG ĐỌC ĐƯỢC  {p}'); bad += 1; continue
    n = len(y); mean = st.mean(y); share = 100 * sum(v < 70 for v in y) / n
    run = cur = 0
    for v in y:
        cur = cur + 1 if v < 60 else 0; run = max(run, cur)
    run /= FPS
    sec = [st.mean(y[i:i + FPS]) for i in range(0, n, FPS)]
    ok = mean >= MEAN_SEQ and share <= SHARE70 and run <= RUN60 and min(sec) >= MIN_SHOT - 10
    bad += not ok
    print(f"{'ĐẠT' if ok else 'TỐI'}  {p}\n     dài {n / FPS:.1f} s; Y trung bình {mean:.0f} (mẫu 112, cần >= {MEAN_SEQ}); dưới 70: {share:.0f}% số khung (mẫu 8%, cần <= {SHARE70}%); "
          f"quãng liên tục dưới 60: {run:.1f} s (mẫu 8 s)\n     theo từng giây: {' '.join(f'{v:.0f}' for v in sec)}")
sys.exit(1 if bad else 0)
