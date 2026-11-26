#!/bin/bash
# usage: ./fullpairs.sh <name> <from> <to> <step> [crop=w:h:x:y in 1280x720 px] [dir=out/audit]
# Compares the assembled film out/full.mp4 with the reference at the SAME frame numbers (cut points are identical).
# -> <dir>/<name>.jpg : one row per sampled frame (max 12 rows), LEFT = reference, RIGHT = ours, frame number burned in.
# READ-ONLY tool: it only runs ffmpeg; it never renders. Use tight crops and step 1-2 to judge motion of one element.
cd "$(dirname "$0")"; NAME=$1; A=$2; B=$3; K=$4; CROP=${5:-1280:720:0:0}; DIR=${6:-out/audit}; mkdir -p "$DIR"
N=$(( (B - A) / K + 1 )); [ $N -gt 12 ] && N=12
W=$(echo $CROP | cut -d: -f1); H=$(echo $CROP | cut -d: -f2); OW=640; OH=$(( 640 * H / W / 2 * 2 ))
ffmpeg -v error -i ../ref/rover_doom.webm -i out/full.mp4 -filter_complex \
"[0:v]select='between(n\,$A\,$B)*not(mod(n-$A\,$K))',settb=AVTB,setpts=N/24/TB,crop=$CROP,scale=$OW:$OH[a];\
[1:v]select='between(n\,$A\,$B)*not(mod(n-$A\,$K))',settb=AVTB,setpts=N/24/TB,crop=$CROP,scale=$OW:$OH,drawtext=text='%{eif\:n*$K+$A\:d}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6[b];\
[a][b]hstack,tile=1x$N" -frames:v 1 -q:v 4 -y "$DIR/$NAME.jpg" && echo "$DIR/$NAME.jpg"
