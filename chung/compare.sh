#!/bin/bash
# renders hall-wide + hall-medium and builds out/so-sanh-buoc1.jpg (left: reference, right: ours)
cd "$(dirname "$0")"
./render-still.sh hall-wide && ./render-still.sh hall-medium
ffmpeg -v error -i out/ref-wide.png -i out/hall-wide.png -i out/ref-medium.png -i out/hall-medium.png -filter_complex "[1]scale=960:540[b];[3]scale=960:540[d];[0][b]hstack[t];[2][d]hstack[u];[t][u]vstack" -q:v 3 -y out/so-sanh-buoc1.jpg && echo ok
