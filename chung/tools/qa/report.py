#!/usr/bin/env python3
"""report.py - turn gate.json into report.md (package Q3). Nobody types a verdict by hand.

Usage
  python3 tools/qa/report.py qa/<id>/gate/gate.json [--out report.md] [--clip PATH]

The report holds one line per check (verdict, tool, element, name, measured
value, threshold), then three lists:
  VERIFIED      checks that PASSED
  NOT VERIFIED  checks that are UNMEASURED or FAILED, plus everything the tools
                and the gate say they did NOT check
  WAIVED        UNMEASURED checks waived in the contract, with the reason

It refuses to produce a passing report:
  * when the sha256 of the clip on disk (the path stored in gate.json, or
    --clip) differs from the sha in gate.json, or the clip is gone: the
    evidence is stale, the report says VOID and the exit code is 1;
  * when the contract file changed since the gate ran: VOID, exit 1;
  * when any check is FAIL: status FAIL, exit 1;
  * when gate.json does not agree with what stands behind it: status INVALID,
    exit 1. Checked: every WAIVED row needs a waiver in the contract file on
    disk (same tool / name / element, a reason, an image that exists, within
    max_waivers); every row is compared with the tool result file the gate
    read (a row whose verdict differs from the tool's, a tool row missing
    from gate.json, or a result file changed since the gate ran);
  * when the gate was PARTIAL (--only, a disabled tool, or a tool of
    gate.order without a run): status PARTIAL, exit 2 - never a pass;
  * when anything is UNMEASURED and not waived, or a tool result file is gone
    so the rows cannot be cross-checked: status INCOMPLETE, exit 2.
Only when every tool ran, every check is PASS or WAIVED, and all of the above
agree is the status PASS (exit 0). The verdict word stored in gate.json is not
used. A changed qa.json is reported as a warning: thresholds may have
moved since the gate ran.

Not done here: the reviewer's code check of review_log.md (spec, G8).
Evidence image: the gate's own gate.jpg is linked; report.py adds none.
Needs python3 only (plus tools/qa/common.py).
"""
import argparse
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

BANNED = re.compile(r"\bmatch" + r"es\b", re.I)     # the banned verdict word, never written out


def _short(v, n=150):
    if v is None:
        return "-"
    s = json.dumps(v, ensure_ascii=False, default=str)
    return s if len(s) <= n else s[: n - 3] + "..."


def _name(k):
    return "%s%s %s" % (k.get("tool"), ("/" + k["element"]) if k.get("element") else "", k.get("name"))


def cross_check(g, checks, void):
    """Compare gate.json with the contract's waivers and with the tool result files.

    Returns (invalid, uncheckable): lists of sentences. Stale files go to `void`.
    """
    invalid, uncheckable = [], []
    # --- waivers: the contract file on disk is the authority
    waivers = []
    con = g.get("contract")
    if con and os.path.isfile(con):
        try:
            with open(con, "r", encoding="utf8") as f:
                waivers = (json.load(f) or {}).get("waivers") or []
        except ValueError:
            waivers = (g.get("contract_data") or {}).get("waivers") or []
    base = os.path.dirname(os.path.abspath(con)) if con else ""
    good = []
    for w in waivers:
        img = w.get("image")
        if img and not os.path.isabs(img):
            img = os.path.normpath(os.path.join(base, img))
        if w.get("tool") and str(w.get("reason", "")).strip() and img and os.path.isfile(img):
            good.append(w)
    limit = int(g.get("max_waivers") or (C.load_cfg("gate") or {}).get("max_waivers") or 3)
    good = good[:limit]
    for k in checks:
        if k.get("verdict") != "WAIVED":
            continue
        if not any(w["tool"] == k.get("tool") and (not w.get("name") or w["name"] == k.get("name"))
                   and (not w.get("element") or w["element"] == k.get("element")) for w in good):
            invalid.append("%s is WAIVED but the contract holds no valid waiver for it (tool, reason and an existing image)" % _name(k))
    # --- rows against the tool result files
    by_tool = {}
    for k in checks:
        by_tool.setdefault(k.get("tool"), []).append(k)
    seen = {}
    for r in g.get("runs") or []:
        if r.get("status") != "ran":
            continue
        res = r.get("result")
        if not res or not os.path.isfile(res):
            uncheckable.append("result file of %s is gone (%s)" % (r.get("tool"), res))
            continue
        if r.get("result_sha") and C.sha(res) != r["result_sha"]:
            void.append("the result file of %s changed after the gate ran (%s)" % (r.get("tool"), res))
            continue
        try:
            with open(res, "r", encoding="utf8") as f:
                rows = json.load(f).get("checks") or []
        except ValueError:
            uncheckable.append("result file of %s is not JSON (%s)" % (r.get("tool"), res))
            continue
        if isinstance(rows, dict):
            rows = [dict(v, name=n) for n, v in rows.items()]
        for row in rows:
            v = row.get("verdict") if row.get("verdict") in ("PASS", "FAIL", "UNMEASURED") else "UNMEASURED"
            seen.setdefault(r.get("tool"), []).append((r.get("element") or row.get("element"), row.get("name"), v))
    for tool, rows in seen.items():
        have = [(k.get("element"), k.get("name"), k.get("verdict")) for k in by_tool.get(tool, [])]
        for el, name, v in rows:
            ok = [(el, name, v)] + ([(el, name, "WAIVED")] if v == "UNMEASURED" else [])
            hit = next((h for h in ok if h in have), None)
            if hit:
                have.remove(hit)
            else:
                invalid.append("%s%s %s: the tool result says %s, gate.json says %s" % (
                    tool, ("/" + el) if el else "", name, v,
                    sorted({h[2] for h in have if h[0] == el and h[1] == name}) or "nothing"))
        for el, name, v in have:
            if name not in ("run", "exit_code"):
                invalid.append("%s%s %s (%s) is in gate.json but in no tool result" % (tool, ("/" + el) if el else "", name, v))
    return invalid, uncheckable


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("gate_json")
    ap.add_argument("--out", help="default: report.md beside gate.json")
    ap.add_argument("--clip", help="clip to check the sha of (default: the path stored in gate.json)")
    a = ap.parse_args()
    try:
        with open(a.gate_json, "r", encoding="utf8") as f:
            g = json.load(f)
        checks = g["checks"]
        want_sha = g["clip_sha"]
    except (OSError, ValueError, KeyError) as e:
        print("report: cannot read gate.json (%s: %s)" % (type(e).__name__, e))
        return 2
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.gate_json)), "report.md")
    clip = a.clip or g.get("clip")
    void, warnings = [], []
    if not clip or not os.path.isfile(clip):
        void.append("the clip %s does not exist any more" % clip)
        have_sha = None
    else:
        have_sha = C.sha(clip)
        if have_sha != want_sha:
            void.append("the clip changed after the gate ran: sha now %s, gate.json has %s" % (have_sha[:16], want_sha[:16]))
    con = g.get("contract")
    if con and os.path.isfile(con):
        if g.get("contract_sha") and C.sha(con) != g["contract_sha"]:
            void.append("the contract %s changed after the gate ran" % con)
    elif con:
        void.append("the contract %s does not exist any more" % con)
    if g.get("qa_json_sha") and os.path.isfile(C.QA_JSON) and C.sha(C.QA_JSON) != g["qa_json_sha"]:
        warnings.append("qa.json changed after the gate ran: thresholds in this report are the ones used then")
    invalid, uncheckable = cross_check(g, checks, void)
    cfg_order = (C.load_cfg("gate") or {}).get("order") or []
    expected = g.get("tools_expected") or cfg_order
    ran = {r.get("tool") for r in g.get("runs") or []}
    left_out = sorted(set(g.get("tools_left_out") or []) | {t for t in expected if t not in ran})
    partial = bool(g.get("partial")) or bool(left_out) or any("restricted by --only" in str(n) for n in g.get("not_checked") or [])
    vs = [k.get("verdict") for k in checks]
    fails = [k for k in checks if k.get("verdict") == "FAIL"]
    unmeasured = [k for k in checks if k.get("verdict") == "UNMEASURED"]
    passed = [k for k in checks if k.get("verdict") == "PASS"]
    waived = [k for k in checks if k.get("verdict") == "WAIVED"]
    odd = [k for k in checks if k.get("verdict") not in ("PASS", "FAIL", "UNMEASURED", "WAIVED")]
    if void:
        status, rc = "VOID (stale evidence - run the gate again)", 1
    elif fails:
        status, rc = "FAIL", 1
    elif invalid:
        status, rc = "INVALID (gate.json does not agree with the contract or with the tool results)", 1
    elif partial:
        status, rc = "PARTIAL (not a pass: tools not run: %s)" % (", ".join(left_out) or "see --only"), 2
    elif unmeasured or odd or not checks or uncheckable:
        status, rc = "INCOMPLETE (not everything could be measured)", 2
    else:
        status, rc = "PASS", 0
    L = []
    L.append("# QA report: %s" % g.get("id", "?"))
    L.append("")
    L.append("**Status: %s**" % status)
    L.append("")
    L.append("- mode: %s" % g.get("mode"))
    L.append("- clip: `%s`" % g.get("clip"))
    L.append("- clip sha256 at gate time: `%s`" % want_sha)
    L.append("- clip sha256 now: `%s`" % (have_sha or "clip missing"))
    L.append("- contract: `%s`" % con)
    L.append("- reference: `%s`" % (g.get("ref_clip") or "none (standalone: judged against style floors)"))
    L.append("- gate ran: %s; report written: %s" % (g.get("written"), time.strftime("%Y-%m-%dT%H:%M:%S")))
    L.append("- counts: PASS %d, FAIL %d, UNMEASURED %d, WAIVED %d" % (
        vs.count("PASS"), vs.count("FAIL"), vs.count("UNMEASURED"), vs.count("WAIVED")))
    for e in g.get("evidence") or []:
        L.append("- gate sheet: `%s` (code %s)" % (e.get("path"), e.get("code")))
    for v in void:
        L.append("- **VOID: %s**" % v)
    for v in invalid:
        L.append("- **INVALID: %s**" % v)
    for v in uncheckable:
        L.append("- cannot cross-check: %s" % v)
    if partial:
        L.append("- **PARTIAL gate: tools not run: %s**" % (", ".join(left_out) or "unknown"))
    for w in warnings:
        L.append("- warning: %s" % w)
    for w in g.get("waiver_problems") or []:
        L.append("- waiver problem: %s" % w)
    L.append("")
    L.append("## Checks")
    L.append("")
    for k in checks:
        line = "- [%s] %s: measured %s; threshold %s" % (k.get("verdict"), _name(k), _short(k.get("measured")), _short(k.get("threshold")))
        if k.get("note"):
            line += "; note: %s" % k["note"]
        if k.get("evidence") and k["evidence"][0]:
            line += "; evidence `%s`" % k["evidence"][0]
        L.append(line)
    if not checks:
        L.append("- (no checks were recorded)")
    L.append("")
    L.append("## VERIFIED")
    L.append("")
    if void:
        L.append("- nothing: the evidence is stale, the rows above describe an older clip or contract")
    else:
        L += ["- %s" % _name(k) for k in passed] or ["- nothing"]
    L.append("")
    L.append("## NOT VERIFIED")
    L.append("")
    for k in fails:
        L.append("- FAILED: %s (measured %s; threshold %s)" % (_name(k), _short(k.get("measured")), _short(k.get("threshold"))))
    for k in unmeasured + odd:
        L.append("- UNMEASURED: %s%s" % (_name(k), (" - " + k["note"]) if k.get("note") else ""))
    for t in left_out:
        L.append("- TOOL NOT RUN: %s (everything it measures is unverified)" % t)
    for v in invalid:
        L.append("- INVALID: %s" % v)
    for r in g.get("runs") or []:
        if r.get("status") in ("missing", "crashed", "did not run", "skipped"):
            L.append("- tool %s: %s" % (r.get("tool"), r.get("status")))
    for n in g.get("not_checked") or []:
        L.append("- not checked - %s" % n)
    L.append("")
    L.append("## WAIVED")
    L.append("")
    if waived:
        for k in waived:
            w = k.get("waiver") or {}
            L.append("- %s - reason: %s%s" % (_name(k), w.get("reason"), ("; image `%s`" % w["image"]) if w.get("image") else ""))
    else:
        L.append("- nothing")
    L.append("")
    text = BANNED.sub("equals", "\n".join(L))
    with open(out, "w", encoding="utf8") as f:
        f.write(text)
    print("report: %s -> %s" % (status, out))
    return rc


if __name__ == "__main__":
    sys.exit(main())
