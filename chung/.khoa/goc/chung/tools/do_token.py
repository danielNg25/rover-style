#!/usr/bin/env python3
"""Đo token đã dùng của một phiên Claude Code và các agent con của nó, từ file ghi phiên trên máy.
Dùng: python3 -I tools/do_token.py <thư mục phiên> [số giờ gần đây, mặc định 30]
  <thư mục phiên> = ~/.claude/projects/<dự án>/<mã phiên>   (bên trong có subagents/; file <mã phiên>.jsonl nằm cạnh nó)
In: tổng, phần đọc lại ngữ cảnh, số lượt gọi, trung bình mỗi lượt, và 15 agent tốn nhất.
Bài học 23/11/2026: gần hết token là ĐỌC LẠI ngữ cảnh; trung bình mỗi lượt trên khoảng 150 nghìn là dấu hiệu đang dùng lại agent hoặc phiên quá dài."""
import os, re, sys, glob, time
P = re.compile(rb'"usage":\{"input_tokens":(\d+),"cache_creation_input_tokens":(\d+),"cache_read_input_tokens":(\d+),"output_tokens":(\d+)')
MID = re.compile(rb'"id":"(msg_[A-Za-z0-9]+)"')
def scan(f):
    t = [0, 0, 0, 0, 0]; seen = set()
    with open(f, 'rb') as fh:
        for line in fh:
            m = P.search(line)
            if not m: continue
            k = MID.search(line); k = k.group(1) if k else None
            if k in seen: continue
            if k: seen.add(k)
            for i, v in enumerate(map(int, m.groups())): t[i] += v
            t[4] += 1
    return t
d = sys.argv[1].rstrip('/'); gio = float(sys.argv[2]) if len(sys.argv) > 2 else 30
rows = []
for f in glob.glob(os.path.join(d, 'subagents', '*.jsonl')):
    if os.stat(f).st_mtime < time.time() - gio * 3600: continue
    t = scan(f); rows.append((sum(t[:4]), t, os.path.basename(f)[6:40]))
rows.sort(reverse=True)
T = [sum(r[1][i] for r in rows) for i in range(5)]
tb = lambda t: (sum(t[:4]) / t[4] / 1e3) if t[4] else 0
print(f"AGENT ({len(rows)} agent, {gio:g} giờ qua): tổng {sum(T[:4])/1e6:.0f} triệu | đọc lại {T[2]/1e6:.0f} triệu | ghi mới {T[1]/1e6:.0f} triệu | viết ra {T[3]/1e6:.1f} triệu | {T[4]} lượt | trung bình {tb(T):.0f} nghìn mỗi lượt")
for tot, t, n in rows[:15]: print(f"  {n:34} {tot/1e6:5.0f} triệu | {t[4]:4} lượt | {tb(t):4.0f} nghìn mỗi lượt")
m = d + '.jsonl'
if os.path.exists(m):
    t = scan(m); print(f"PHIÊN CHÍNH (cả phiên): tổng {sum(t[:4])/1e6:.0f} triệu | {t[4]} lượt | trung bình {tb(t):.0f} nghìn mỗi lượt")
