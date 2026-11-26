#!/bin/bash
# usage: ./render-video.sh <composition-id> [scale]   -> ../kenh/<kênh>/out/<id>.mp4  (kênh: dang-lam.yaml)
# The old file is removed first and the script FAILS when the render produced nothing, so a broken composition can never
# leave yesterday's video behind to be measured or sent by mistake.
source "$(cd "$(dirname "$0")" && pwd)/tools/chrome.sh"   # đặt BX (Chrome không đầu), không ghi cứng theo máy
cd "$(dirname "$0")"
source tools/dang-lam.sh
rm -f "$OUT/$1.mp4"
npx remotion render "$ENTRY" "$1" "$OUT/$1.mp4" --browser-executable="$BX" --scale="${2:-1}" --concurrency=3 --crf=18 --log=error 2>&1 | grep -v "npm notice" | tail -6
[ -s "$OUT/$1.mp4" ] || { echo "RENDER FAILED: $OUT/$1.mp4 was not written" >&2; exit 1; }
ls -la "$OUT/$1.mp4"
