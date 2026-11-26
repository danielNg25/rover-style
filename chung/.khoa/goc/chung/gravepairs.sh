#!/bin/bash
# usage: ./gravepairs.sh <out.jpg> <seq-frame> [more frames...]
# Pairs for the grave test: reference frame (left, 2744 + n) next to out/grave-seq-<n>.png (right), one row per frame.
cd "$(dirname "$0")"; OUT="$1"; shift; IN=(); FC=""; i=0
for n in "$@"; do
  ffmpeg -v error -y -ss $(python3 -c "print((2744+$n)/24)") -i ../ref/rover_doom.webm -frames:v 1 "out/_gp-ref-$n.png"
  IN+=(-i "out/_gp-ref-$n.png" -i "out/grave-seq-$n.png"); FC+="[$((i*2))]scale=800:450[a$i];[$((i*2+1))]scale=800:450[b$i];[a$i][b$i]hstack[r$i];"; i=$((i+1))
done
ST=""; for j in $(seq 0 $((i-1))); do ST+="[r$j]"; done
if [ $i -gt 1 ]; then FC+="${ST}vstack=inputs=$i"; else FC="${FC%;}"; FC="${FC/\[r0\]/}"; fi
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -q:v 3 "$OUT" && rm -f out/_gp-ref-*.png && echo "$OUT"
