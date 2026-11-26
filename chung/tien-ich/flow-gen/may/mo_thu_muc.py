"""Cầu nối cho extension flow-gen: mở thư mục chung/gen trong Finder / Explorer, chọn sẵn một ảnh.
Chrome gọi chương trình này qua Native Messaging (tin nhắn JSON có 4 byte độ dài ở đầu).
Chỉ nhận TÊN FILE nằm ngay trong chung/gen, hoặc TÊN một việc trong chung/gen/cho-gen; không nhận đường dẫn, không chạy lệnh nào khác."""
import json, os, struct, subprocess, sys
from pathlib import Path

GEN = Path(__file__).resolve().parents[3] / 'gen'      # chung/tien-ich/flow-gen/may/ → chung/gen


def doc():
    n = sys.stdin.buffer.read(4)
    return json.loads(sys.stdin.buffer.read(struct.unpack('<I', n)[0]).decode('utf-8')) if len(n) == 4 else None


def tra(d):
    b = json.dumps(d, ensure_ascii=False).encode('utf-8'); sys.stdout.buffer.write(struct.pack('<I', len(b)) + b); sys.stdout.buffer.flush()


t = doc() or {}
ten = os.path.basename(str(t.get('ten') or ''))
f = GEN / ten if ten else None
viec = os.path.basename(str(t.get('viec') or ''))          # mở thư mục của một việc trong hàng chờ
if viec and (GEN / 'cho-gen' / viec).is_dir(): GEN = GEN / 'cho-gen' / viec
try:
    if sys.platform == 'darwin': subprocess.run(['open', '-R', str(f)] if f and f.is_file() else ['open', str(GEN)], check=True)
    elif os.name == 'nt': subprocess.run(['explorer', '/select,', str(f)] if f and f.is_file() else ['explorer', str(GEN)])
    else: subprocess.run(['xdg-open', str(GEN)], check=True)
    tra({'ok': True, 'thu_muc': str(GEN), 'chon': ten if f and f.is_file() else ''})
except Exception as e:
    tra({'ok': False, 'loi': str(e)})
