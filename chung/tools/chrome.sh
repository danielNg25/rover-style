# Đường dẫn Chrome không đầu cho mọi script dựng hình. Dùng: source tools/chrome.sh  → đặt biến BX.
# (26/11/2026: trước đây mỗi script ghi cứng đường dẫn theo máy của Daniel, sang máy khác là hỏng.)
# Thứ tự chọn: biến môi trường CUTOUT3D_CHROME nếu có; bản đã ghim nếu máy có; không thì bản mới nhất puppeteer đã tải.
_CHROME_GHIM="$HOME/.cache/puppeteer/chrome-headless-shell/mac_arm-146.0.7680.31/chrome-headless-shell-mac-arm64/chrome-headless-shell"
if [ -n "$CUTOUT3D_CHROME" ]; then BX="$CUTOUT3D_CHROME"
elif [ -x "$_CHROME_GHIM" ]; then BX="$_CHROME_GHIM"
else BX="$(ls -d "$HOME"/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell 2>/dev/null | sort | tail -1)"; fi
if [ ! -x "$BX" ]; then echo "không thấy Chrome không đầu. Chạy trong chung/:  npx puppeteer browsers install chrome-headless-shell   hoặc đặt CUTOUT3D_CHROME=<đường dẫn>" >&2; exit 1; fi
