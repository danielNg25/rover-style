"""Kênh và tập đang làm, đọc từ dang-lam.yaml ở gốc chung/ (biến môi trường KENH / TAP ghi đè).

    from dang_lam import CHUNG, KENH, TAP, KENH_DIR, TAP_DIR, OUT, ENTRY
OUT = ../kenh/<kenh>/out (cùng chỗ ./still.sh ghi ảnh)."""
import os, pathlib, re

CHUNG = pathlib.Path(__file__).resolve().parent.parent


def _doc():
    cfg = {}
    for l in (CHUNG / 'dang-lam.yaml').read_text(encoding='utf-8').split('\n'):
        m = re.match(r'^(kenh|tap):\s*([^#\s]+)', l)
        if m:
            cfg[m.group(1)] = m.group(2)
    return cfg


_c = _doc()
KENH = os.environ.get('KENH') or _c['kenh']
TAP = os.environ.get('TAP') or _c['tap']
KENH_DIR = CHUNG.parent / 'kenh' / KENH
if not KENH_DIR.is_dir():
    raise SystemExit(f"dang-lam: không có kênh '{KENH}' ({KENH_DIR})")
TAP_DIR = KENH_DIR / 'tap' / TAP
OUT = KENH_DIR / 'out'
OUT.mkdir(parents=True, exist_ok=True)
# File vào của gói dựng (tính từ gốc chung/): của riêng kênh nếu có, không thì file chứa mọi kênh.
ENTRY = f'../kenh/{KENH}/entry.ts' if (KENH_DIR / 'entry.ts').is_file() else 'src/index.ts'
