#!/bin/bash
# usage: ./motionpairs.sh <shot-id> <ref-start-frame> <from> <to> <step> [crop=w:h:x:y in 1280x720 px]
# Needs out/shot-<id>.mp4 (run ./render-video.sh shot-<id> 1 first).
# -> out/motion-<id>.jpg : one row per sampled frame, LEFT = reference, RIGHT = yours, same crop, frame number burned in.
# (Both streams are put on one common time base first: the webm's millisecond time base otherwise makes hstack repeat frames.)
# Use it to compare MOTION (what changes from row to row), not just composition. Use a tight crop to see small things
# (a leg, a star, a flame) and step 1 or 2 for fast motion.
cd "$(dirname "$0")"; ID=$1; S=$2; A=$3; B=$4; K=$5; CROP=${6:-1280:720:0:0}
N=$(( (B - A) / K + 1 )); [ $N -gt 12 ] && N=12
W=$(echo $CROP | cut -d: -f1); H=$(echo $CROP | cut -d: -f2); OW=640; OH=$(( 640 * H / W / 2 * 2 ))
ffmpeg -v error -i ../ref/rover_doom.webm -i out/shot-$ID.mp4 -filter_complex \
"[0:v]select='between(n\,$((S+A))\,$((S+B)))*not(mod(n-$((S+A))\,$K))',settb=AVTB,setpts=N/24/TB,crop=$CROP,scale=$OW:$OH[a];\
[1:v]select='between(n\,$A\,$B)*not(mod(n-$A\,$K))',settb=AVTB,setpts=N/24/TB,crop=$CROP,scale=$OW:$OH,drawtext=text='%{eif\:n*$K+$A\:d}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6[b];\
[a][b]hstack,tile=1x$N" -frames:v 1 -q:v 4 -y out/motion-$ID.jpg && echo out/motion-$ID.jpg
