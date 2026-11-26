#!/bin/bash
# usage: ./still.sh <composition-id> [frame=0] [scale=1]   ->  ../kenh/<kênh>/out/<id>-<frame>.png  (kênh: dang-lam.yaml; out/ ở đây là liên kết tới chỗ đó)
# One frame of any composition (render-still.sh only does frame 0). Run with the sandbox disabled: Chrome cannot start inside it.
# A shot is looked at on three frames at least:  for f in 0 24 47; do ./still.sh my-shot $f; done
source "$(cd "$(dirname "$0")" && pwd)/tools/chrome.sh"   # đặt BX (Chrome không đầu), không ghi cứng theo máy
cd "$(dirname "$0")"
source tools/dang-lam.sh
[ -z "$1" ] && { echo "usage: ./still.sh <composition-id> [frame] [scale]"; exit 1; }
F="${2:-0}"
npx remotion still "$ENTRY" "$1" "$OUT/$1-$F.png" --frame="$F" --browser-executable="$BX" --scale="${3:-1}" --log=error 2>&1 | grep -v "npm notice" | tail -12
