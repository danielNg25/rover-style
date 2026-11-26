#!/bin/bash
# usage: ./render-still.sh <composition-id> [scale]
source "$(cd "$(dirname "$0")" && pwd)/tools/chrome.sh"   # đặt BX (Chrome không đầu), không ghi cứng theo máy
cd "$(dirname "$0")"
source tools/dang-lam.sh
npx remotion still "$ENTRY" "$1" "$OUT/$1.png" --browser-executable="$BX" --scale="${2:-0.6667}" --log=error 2>&1 | grep -v "npm notice" | tail -8
