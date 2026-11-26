#!/bin/bash
# usage: ./kit-check.sh   (no browser needed) runs tools/kit-check.ts: twos rule, step limits, pick checks, camera guard, liveness
cd "$(dirname "$0")"
OUT="${TMPDIR:-/tmp}/kit-check.cjs"
npx esbuild tools/kit-check.ts --bundle --platform=node --format=cjs --log-level=error --outfile="$OUT" \
  --loader:.png=empty --loader:.woff2=empty --loader:.ttf=empty --loader:.css=empty && node "$OUT"
