#!/bin/bash
# tools/art/test_gen.sh: self-test of tools/art/gen.sh WITHOUT calling Codex.
#
# usage: tools/art/test_gen.sh            (writes qa/art/gen-test/{transcript.txt,log.jsonl,result.json})
#
# Every case runs gen.sh with GEN_LOG and GEN_DIR pointed away from gen/ (nothing in gen/ is touched) and,
# where a call would be made, with CODEX_BIN pointed at a tiny fake that writes a file, prints a refusal,
# or hangs. Each case states the exit code it expects. Exit 0 = all cases as expected, 1 = at least one not.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"; cd "$ROOT"
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0; fi
T="$ROOT/qa/art/gen-test"; mkdir -p "$T"
W="$(mktemp -d "${TMPDIR:-/tmp}/gentest.XXXXXX")"
: > "$T/transcript.txt"
export GEN_LOG="$W/log.jsonl" GEN_DIR="$W/gen" GEN_RUN_ID=selftest
unset GEN_BUDGET GEN_ALLOW_POSE GEN_DRY_RUN GEN_TIMEOUT CODEX_BIN

cat > "$W/codex-ok" <<'EOF'
#!/bin/bash
while [ $# -gt 0 ]; do case "$1" in -C) D="$2"; shift;; --) shift; P="$1";; esac; shift; done
N="$(echo "$P" | sed -n 's/.*save it as \([^ ]*\) in the current.*/\1/p')"
echo "stub image" > "$D/$N"; echo "$D/$N"
EOF
cat > "$W/codex-refuse" <<'EOF'
#!/bin/bash
echo "The image tool rejected the request with a safety-system error, so the file was not created."
EOF
cat > "$W/codex-hang" <<'EOF'
#!/bin/bash
sleep 30
EOF
chmod +x "$W"/codex-*

# a filled copy of the full-body template for the positive cases
sed -e 's/{{WHO[^}]*}}/a stern old baker/' \
    -e 's/{{FACE[^}]*}}/large white round eyes with small brown pupils, thick grey brows, flat mouth/' \
    -e 's/{{HAIR_AND_HEADWEAR}}/a white cap/' -e 's/{{CLOTHING_TOP_TO_BOTTOM_WITH_COLOURS}}/cream shirt, brown apron/' \
    -e 's/{{HANDS}}/peach hands/' -e 's/{{LEGS_AND_SHOES}}/grey trousers, black shoes/' \
    "$HERE/prompts/character-full-body.txt" > "$W/prompt-ok.txt"
P="$W/prompt-ok.txt"; G="$HERE/gen.sh"; FAILS=0; N=0; ROWS=""

t() { # expected-exit, label, command...
  local want="$1" label="$2"; shift 2
  { echo "### $label"; echo "\$ $*"; } >> "$T/transcript.txt"
  "$@" >> "$T/transcript.txt" 2>&1; local rc=$?
  echo "-> exit $rc (expected $want)" >> "$T/transcript.txt"; echo >> "$T/transcript.txt"
  N=$((N + 1)); local v=PASS; if [ "$rc" != "$want" ]; then v=FAIL; FAILS=$((FAILS + 1)); fi
  printf '  %-4s exit %s (expected %s)  %s\n' "$v" "$rc" "$want" "$label"
  ROWS="$ROWS{\"name\":\"$label\",\"value\":$rc,\"threshold\":\"exit == $want\",\"verdict\":\"$v\"},"
}

t 3 "refuse: reference under a ref/ folder"            env GEN_BUDGET=2 "$G" x.png gen/prompts/doom-heads.txt ../ref/rover_doom.webm
t 3 "refuse: reference named ref-*"                    env GEN_BUDGET=2 "$G" x.png gen/prompts/doom-heads.txt gen/ref-doom-crop.jpg
t 3 "refuse: pose word (the seated prompt that the image tool rejected)" env GEN_BUDGET=2 "$G" x.png gen/prompts/doom-seated.txt gen/doom-front.png
t 3 "refuse: pose word in an animal prompt without override" env GEN_BUDGET=2 "$G" x.png gen/prompts/animal-parts.txt gen/savanna.png
t 3 "refuse: unfilled template placeholders"           env GEN_BUDGET=2 "$G" x.png tools/art/prompts/body-parts.txt gen/doom-front.png
t 3 "refuse: output name with a path"                  env GEN_BUDGET=2 "$G" ../x.png "$P" gen/doom-front.png
t 3 "refuse: missing reference file"                   env GEN_BUDGET=2 "$G" x.png "$P" gen/no-such.png
t 3 "refuse: GEN_BUDGET not set"                       "$G" x.png "$P" gen/doom-front.png
t 2 "usage error: no arguments"                        "$G"
t 0 "dry run: template prompt, style block appended"   "$G" --dry-run x.png "$P" gen/doom-front.png
t 0 "dry run: existing prompt that already has a style block" env GEN_BUDGET=2 "$G" --dry-run x.png gen/prompts/doom-heads.txt gen/doom-front.png
t 0 "dry run: animal strides with GEN_ALLOW_POSE=1"    env GEN_BUDGET=2 GEN_ALLOW_POSE=1 "$G" --dry-run x.png gen/prompts/animal-parts.txt gen/savanna.png
t 0 "fake codex writes the file (1 of 2 spent)"        env GEN_BUDGET=2 CODEX_BIN="$W/codex-ok" "$G" baker.png "$P" gen/doom-front.png
t 3 "fake codex prints the image tool's refusal (2 of 2 spent)" env GEN_BUDGET=2 CODEX_BIN="$W/codex-refuse" "$G" baker2.png "$P" gen/doom-front.png
t 3 "refuse: budget used up"                           env GEN_BUDGET=2 CODEX_BIN="$W/codex-ok" "$G" baker3.png "$P" gen/doom-front.png
t 1 "fake codex hangs: stopped after GEN_TIMEOUT=2"    env GEN_BUDGET=4 GEN_TIMEOUT=2 CODEX_BIN="$W/codex-hang" "$G" baker4.png "$P" gen/doom-front.png
t 0 "existing output is moved to _old, not overwritten" env GEN_BUDGET=4 CODEX_BIN="$W/codex-ok" "$G" baker.png "$P" gen/doom-front.png

# --- cases added after the adversarial test of 2026-11-20
mkdir -p "$W/own" "$W/ref-earth" "$W/refs"
cp gen/doom-front.png "$W/own/style.png"; cp gen/doom-front.png "$W/ref-earth/frame.png"; cp gen/doom-front.png "$W/refs/frame.png"
cp gen/doom-front.png "$W/own/ref-crop.png"; ln -s "$W/own/ref-crop.png" "$W/own/innocent.png"
cp gen/doom-front.png "$W/own/doom-ref-crop.png"; cp gen/doom-front.png "$W/own/reference-frame.png"
t 3 "refuse: symlink with a harmless name to a ref-* file" env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/own/innocent.png"
t 3 "refuse: reference in a folder named ref-earth/"   env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/ref-earth/frame.png"
t 3 "refuse: reference in a folder named refs/"        env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/refs/frame.png"
t 3 "refuse: file named doom-ref-crop"                 env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/own/doom-ref-crop.png"
t 3 "refuse: file named reference-frame"               env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/own/reference-frame.png"
REFIMG="$(python3 "$HERE/genlib.py" refimages | head -1)"
if [ -n "$REFIMG" ]; then cp "$ROOT/$REFIMG" "$W/own/plain-name.${REFIMG##*.}"
  t 3 "refuse: byte-identical copy of a reference-folder image under a harmless name" env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/own/plain-name.${REFIMG##*.}"
fi
t 0 "dry run: our own picture in a plain folder is accepted" env GEN_BUDGET=9 "$G" --dry-run x.png "$P" "$W/own/style.png"
for phrase in "sat on a throne" "sit on a bench" "kneels" "runs" "crouched" "squatting" "walks forward mid-stride" "seated_pose" "ngồi trên ngai" "s e a t e d"; do
  { cat "$P"; echo "The character: $phrase"; } > "$W/pose.txt"
  t 3 "refuse: pose wording '$phrase'"                 env GEN_BUDGET=9 "$G" --dry-run x.png "$W/pose.txt" gen/doom-front.png
done
{ cat "$P"; echo "A wooden seat stands beside him; a running stream on his cloak emblem."; } > "$W/harmless.txt"
t 0 "dry run: harmless 'running stream' and 'seat' are accepted" env GEN_BUDGET=9 "$G" --dry-run x.png "$W/harmless.txt" gen/doom-front.png
cat > "$W/codex-slow" <<'EOF'
#!/bin/bash
echo call >> "$RACE_CALLS"; sleep 2
while [ $# -gt 0 ]; do case "$1" in -C) D="$2"; shift;; --) shift; P="$1";; esac; shift; done
N="$(echo "$P" | sed -n 's/.*save it as \([^ ]*\) in the current.*/\1/p')"; echo "stub image" > "$D/$N"
EOF
chmod +x "$W/codex-slow"; : > "$W/race-calls"
for n in 1 2 3; do env GEN_RUN_ID=race GEN_BUDGET=1 RACE_CALLS="$W/race-calls" CODEX_BIN="$W/codex-slow" "$G" race$n.png "$P" gen/doom-front.png >> "$T/transcript.txt" 2>&1 & done; wait
t 3 "refuse: real codex (CODEX_BIN unset) with GEN_LOG moved away from gen/" env GEN_BUDGET=9 GEN_RUN_ID=moved "$G" x.png "$P" gen/doom-front.png

# structural checks on what the cases left behind
chk() { N=$((N + 1)); local v=PASS ok=true; if ! eval "$2" > /dev/null 2>&1; then v=FAIL; ok=false; FAILS=$((FAILS + 1)); fi
        printf '  %-4s %s\n' "$v" "$1"; ROWS="$ROWS{\"name\":\"$1\",\"value\":$ok,\"threshold\":\"true\",\"verdict\":\"$v\"},"; }
chk "old output kept under _old/"                    'ls "$W"/gen/_old/*-baker.png'
chk "provenance file written"                        'grep -q prompt_sha256 "$W/gen/baker.png.prov.json"'
chk "log has one line per case that reached the checks" '[ "$(wc -l < "$W/log.jsonl")" -ge 16 ]'
chk "log records the image tool refusal text"        'grep -q "refused_by_image_tool.*safety-system" "$W/log.jsonl"'
chk "style block reached the fake codex prompt once" '[ "$(grep -c "ART STYLE" "$T/transcript.txt")" -ge 2 ]'
chk "three parallel calls with GEN_BUDGET=1 reached the stub exactly once" '[ "$(wc -l < "$W/race-calls")" -eq 1 ]'
chk "a new run id is recorded with what other runs spent today" 'grep -q "\"run\": \"race\", \"status\": \"run_opened\".*selftest" "$W/log.jsonl"'
chk "every generation is reserved before the call" '[ "$(grep -c "\"status\": \"reserved\"" "$W/log.jsonl")" -eq 5 ]'
chk "the real gen/ folder has no log.jsonl from this test" '[ ! -e "$ROOT/gen/log.jsonl" ] || ! grep -q selftest "$ROOT/gen/log.jsonl"'

cp "$W/log.jsonl" "$T/log.jsonl"
V=PASS; [ "$FAILS" -gt 0 ] && V=FAIL
cat > "$T/result.json" <<EOF
{"tool": "art/test_gen.sh", "mode": "standalone", "verdict": "$V", "cases": $N, "failed": $FAILS,
 "checks": [${ROWS%,}],
 "not_checked": ["a real Codex call (forbidden in this test; the fake stands in for the CLI)",
                 "whether the image tool accepts the prompts in tools/art/prompts/ (none has been sent yet)",
                 "the approved.json allow-list (public/chars/approved.json does not exist yet: gen.sh warns and checks names and bytes only)",
                 "pose wording that paraphrases a pose without any listed stem"],
 "evidence": ["qa/art/gen-test/transcript.txt", "qa/art/gen-test/log.jsonl"]}
EOF
echo "test_gen.sh: $V ($((N - FAILS)) of $N as expected) -> qa/art/gen-test/result.json"
[ "$FAILS" -eq 0 ]
