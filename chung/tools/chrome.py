"""Đường dẫn Chrome không đầu cho các công cụ dựng hình (kho.py, vatly.py, autograde.py). Cùng thứ tự chọn với tools/chrome.sh:
biến môi trường CUTOUT3D_CHROME; bản đã ghim nếu máy có; không thì bản mới nhất puppeteer đã tải. (26/11/2026: bỏ đường dẫn ghi cứng.)"""
import glob, os

GHIM = '~/.cache/puppeteer/chrome-headless-shell/mac_arm-146.0.7680.31/chrome-headless-shell-mac-arm64/chrome-headless-shell'


def bx():
    e = os.environ.get('CUTOUT3D_CHROME')
    if e: return e
    g = os.path.expanduser(GHIM)
    if os.path.exists(g): return g
    c = sorted(glob.glob(os.path.expanduser('~/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell')))
    if not c: raise SystemExit('không thấy Chrome không đầu. Chạy trong chung/:  npx puppeteer browsers install chrome-headless-shell   hoặc đặt CUTOUT3D_CHROME=<đường dẫn>')
    return c[-1]
