#!/bin/bash
# tools/art/gen.sh: ask the local Codex CLI for ONE image, safely.
#
# usage (same calling convention as the root gen.sh; run from anywhere, paths relative to rover-lab/):
#   GEN_BUDGET=2 tools/art/gen.sh [--dry-run] <out-name.png> <prompt-file> <ref-image> [more refs...]
#
# What it adds to the root gen.sh:
#   * REFUSES before spending a generation (exit 3) when
#       - a reference image looks like reference footage: any folder or file name of its path, or of the
#         path a symlink leads to, holds "ref", "refs" or "reference" as a word (ref/, ref-earth/, x-ref-crop.jpg),
#         or the file is a byte-identical copy of an image in the project's reference folders
#         (the image tool refused a tight crop of the copyrighted reference footage);
#       - the prompt holds pose wording (sit/sat/seated, kneel, walk, run, crouch, ... English and Vietnamese
#         stems in qa.json art.gen.pose_patterns); poses are assembled from parts instead.
#         Override for props/animals or harmless text: GEN_ALLOW_POSE=1, logged;
#       - the prompt still holds {{PLACEHOLDERS}} of a template from tools/art/prompts/;
#       - the per-run budget is used up, GEN_BUDGET is not set, or the daily ceiling over all run ids
#         (art.gen.max_per_day) is reached. The generation is reserved under a file lock before the call,
#         so parallel calls cannot overspend; a new run id or a changed budget is written to the log.
#   * strips lines starting with "#" from the prompt file (template notes) and appends the style block
#     tools/art/prompts/style.txt unless the prompt already carries one ("ART STYLE");
#   * closes stdin, puts "--" before the prompt, stops Codex after art.gen.timeout_s seconds;
#   * never overwrites: an existing gen/<out> is moved to gen/_old/ first;
#   * logs every call (time, run, prompt file, references, output, status, refusal text) to gen/log.jsonl
#     and writes gen/<out>.prov.json (prompt sha, reference shas) on success.
#
# Environment:
#   GEN_BUDGET      generations allowed in this run (required for a real call)
#   GEN_RUN_ID      name of the run the budget belongs to (default: today's date, YYYYMMDD)
#   GEN_ALLOW_POSE  1 = accept pose words (use only for props or animal strides that cannot be rigged)
#   GEN_DRY_RUN     1 = same as --dry-run: run every check, print what would be sent, call nothing
#   GEN_LOG, GEN_DIR, CODEX_BIN   overrides for testing (log file, output folder, codex executable).
#                   GEN_LOG / GEN_DIR are refused for a real call (CODEX_BIN unset): the budget lives in gen/log.jsonl
#
# Exit codes: 0 = image written (or dry run passed), 1 = Codex ran but no fresh image (timeout, error),
#             2 = usage error, 3 = REFUSED (by this script before the call, or by the image tool).
# After a refusal by the image tool: reword ONCE, then stop and ask the owner.
# Needs the sandbox disabled for a real call (Codex cannot run inside it). Then check the sheet:
#   python3 tools/art/keycheck.py gen/<out>  &&  python3 tools/art/cut.py gen/<out> <dir> <prefix> --names ...
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then awk 'NR>1 && !/^#/ {exit} NR>1 {sub(/^# ?/, ""); print}' "$0"; exit 0; fi
if [ "${1:-}" = "--dry-run" ]; then export GEN_DRY_RUN=1; shift; fi
if [ $# -lt 2 ]; then echo "usage: GEN_BUDGET=n tools/art/gen.sh [--dry-run] <out-name.png> <prompt-file> <ref-image> [more refs...]" >&2; exit 2; fi
OUT="$1"; PROMPT_FILE="$2"; shift 2
GEN_DIR="${GEN_DIR:-$ROOT/gen}"
CODEX_BIN="${CODEX_BIN:-codex}"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/artgen.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
COMPOSED="$TMP/prompt.txt"

set +e
INFO="$(python3 "$HERE/genlib.py" prepare "$OUT" "$PROMPT_FILE" "$COMPOSED" "$@")"
RC=$?
set -e
field() { python3 -c 'import json,sys; v=json.loads(sys.argv[1]).get(sys.argv[2]); print("" if v is None else v)' "$INFO" "$1"; }
if [ $RC -ne 0 ]; then
  echo "REFUSED ($(field status)): $(field refusal)" >&2
  exit 3
fi
export GEN_RESERVATION="$(field reservation)"
ARGS=(); ABSREFS=()
for r in "$@"; do case "$r" in /*) a="$r";; *) a="$ROOT/$r";; esac; ARGS+=(-i "$a"); ABSREFS+=("$a"); done
INSTR="Use your image generation tool to create ONE image and save it as $OUT in the current directory. Do not write code and do not draw with scripts; it must come from the image generation tool. $(cat "$COMPOSED") After saving, reply with just the file path."
REFS=("$@")
write_log() { # status, refusal text
  python3 - "$PROMPT_FILE" "$OUT" "$1" "${2:-}" "$(field prompt_sha256)" "$(field pose_override)" ${REFS[@]+"${REFS[@]}"} <<'PY'
import json, subprocess, sys, os
pf, out, status, refusal, psha, pose = sys.argv[1:7]
rec = {"prompt_file": pf, "refs": sys.argv[7:], "output": out, "status": status, "refusal": refusal or None,
       "prompt_sha256": psha, "pose_override": pose == "True"}
here = os.environ["ART_HERE"]
subprocess.run([sys.executable, os.path.join(here, "genlib.py"), "log", json.dumps(rec)], check=True)
PY
}
export ART_HERE="$HERE"

if [ "${GEN_DRY_RUN:-0}" = "1" ]; then
  echo "DRY RUN: nothing sent, nothing spent."
  echo "  budget: $(field spent) spent of ${GEN_BUDGET:-<GEN_BUDGET not set: a real call would be refused>} (run ${GEN_RUN_ID:-$(date +%Y%m%d)})"
  echo "  style block appended: $(field style_added)   pose override: $(field pose_override)   prompt: $(field prompt_chars) chars"
  echo "  would run: $CODEX_BIN exec --skip-git-repo-check -s workspace-write -C $GEN_DIR ${ARGS[@]+${ARGS[@]}} -- <instruction> < /dev/null"
  echo "  ---- instruction ----"; echo "$INSTR"; echo "  ---------------------"
  write_log "dry-run" ""
  exit 0
fi

mkdir -p "$GEN_DIR"
if [ -e "$GEN_DIR/$OUT" ]; then
  mkdir -p "$GEN_DIR/_old"
  mv "$GEN_DIR/$OUT" "$GEN_DIR/_old/$(date +%Y%m%d-%H%M%S)-$OUT"
fi
TIMEOUT="${GEN_TIMEOUT:-$(field timeout)}"
set +e
"$CODEX_BIN" exec --skip-git-repo-check -s workspace-write -C "$GEN_DIR" ${ARGS[@]+"${ARGS[@]}"} -- "$INSTR" > "$GEN_DIR/$OUT.log" 2>&1 < /dev/null &
PID=$!
( sleep "$TIMEOUT"; kill -TERM "$PID" 2>/dev/null && echo timeout > "$TMP/timed-out" ) > /dev/null 2>&1 &
WATCH=$!
wait "$PID"; CRC=$?
kill "$WATCH" 2>/dev/null; wait "$WATCH" 2>/dev/null
set -e
TAIL="$(grep -v '^[[:space:]]*$' "$GEN_DIR/$OUT.log" 2>/dev/null | tail -3 | tr '\n' ' ' | cut -c1-600 || true)"
# any earlier file of this name was moved to _old above, so a non-empty file here is fresh
if [ -s "$GEN_DIR/$OUT" ]; then
  python3 "$HERE/genlib.py" prov "$GEN_DIR/$OUT" "$PROMPT_FILE" "$COMPOSED" ${ABSREFS[@]+"${ABSREFS[@]}"}
  write_log "ok" ""
  ls -la "$GEN_DIR/$OUT" | tail -1
  exit 0
fi
if [ -f "$TMP/timed-out" ]; then
  write_log "timeout" "no image after ${TIMEOUT}s: $TAIL"
  echo "FAILED: no image after ${TIMEOUT}s (Codex stopped). The generation counts against the budget." >&2
  exit 1
fi
if echo "$TAIL" | grep -qiE 'reject|refus|safety|policy|not (able|allowed)|cannot (create|generate)|can.t (create|generate)'; then
  write_log "refused_by_image_tool" "$TAIL"
  echo "REFUSED (by the image tool): $TAIL" >&2
  echo "Reword ONCE; if it is refused again, stop and ask the owner." >&2
  exit 3
fi
write_log "failed" "codex exit $CRC, no fresh image: $TAIL"
echo "FAILED: codex exit $CRC and no fresh image. Last output: $TAIL" >&2
exit 1
