#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync all inline mirrors from data/works.json (the single source of truth) AND
upgrade the per-work statement banner to the Figma design (short rule + work-title
heading + statement, as a full-width "featured" block above its own card).

Unlike tools/migrate_exhibition_statements.py this does NOT extract/strip anything —
works.json (art_works + exhibition_statements) is treated as authoritative:
  - art_works[].statement_he  = per-work text (rendered as a featured banner)
  - exhibition_statements[]    = (artist x exhibition) group text

Idempotent. Run from repo root:  python3 tools/sync_works_mirrors.py
"""
import json, re, glob, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

d = json.load(open("data/works.json", encoding="utf-8"))
ART = d["art_works"]
STORE = d["exhibition_statements"]
BY_ID = {w["id"]: w for w in ART}


def replace_js_array(text, var_name, arr):
    payload = "window.%s=%s" % (var_name, json.dumps(arr, separators=(",", ":"), ensure_ascii=False))
    pat = re.compile(r"window\." + re.escape(var_name) + r"=\[.*?\](?=;?</script>)", re.S)
    return pat.subn(lambda _: payload, text, count=1)


# ---- renderer upgrade snippets (idempotent) ----
# v3: statement banner spans full grid width, but the artwork CARD stays a normal
# half-width grid item (even when alone) — banner and card are SEPARATE grid children
# (no full-width .work-featured wrapper that stretched the image edge-to-edge).
OLD_JS = ('        var cards=g.items.map(function(w){if(w.statement_he&&w.statement_he.length){'
          'var _wt=(w.title_he||w.title_en||"");'
          'var _wh=_wt?\'<div class="ws-head">\'+mixedHtml(_wt)+\'</div>\':"";'
          'return \'<div class="work-featured"><div class="work-statement"><span class="ws-rule"></span>\''
          '+_wh+\'<div class="ws-body">\'+statementHtml(w.statement_he)+\'</div></div>\'+buildRichCard(w,gi++)+\'</div>\';}'
          'return buildRichCard(w,gi++);}).join("");')
NEW_JS = ('        var cards=g.items.map(function(w){if(w.statement_he&&w.statement_he.length){'
          'var _wt=(w.title_he||w.title_en||"");'
          'var _wh=_wt?\'<div class="ws-head">\'+mixedHtml(_wt)+\'</div>\':"";'
          'return \'<div class="work-statement"><span class="ws-rule"></span>\''
          '+_wh+\'<div class="ws-body">\'+statementHtml(w.statement_he)+\'</div></div>\'+buildRichCard(w,gi++);}'
          'return buildRichCard(w,gi++);}).join("");')

OLD_CSS = ('.work-featured{grid-column:1/-1;display:flex;flex-direction:column;gap:24px}'
           '.work-statement{direction:rtl;text-align:right;font-family:var(--heb);color:var(--ink)}'
           '.ws-rule{display:block;width:72px;height:1px;background:#EFEFEF;margin:0 0 16px auto}'
           '.ws-head{font-size:16px;letter-spacing:.02em;margin:0 0 8px;line-height:1.3}'
           '.ws-head .lat{font-family:var(--cop)}'
           '.ws-body{font-size:16px;line-height:1.7}.ws-body p{margin:0 0 .7em}.ws-body p:last-child{margin-bottom:0}')
NEW_CSS = ('.work-statement{grid-column:1/-1;direction:rtl;text-align:right;font-family:var(--heb);'
           'color:var(--ink);margin-bottom:-40px}'
           '.ws-rule{display:block;width:72px;height:1px;background:#EFEFEF;margin:0 0 16px auto}'
           '.ws-head{font-size:16px;letter-spacing:.02em;margin:0 0 8px;line-height:1.3}'
           '.ws-head .lat{font-family:var(--cop)}'
           '.ws-body{font-size:16px;line-height:1.7}.ws-body p{margin:0 0 .7em}.ws-body p:last-child{margin-bottom:0}')


def main():
    # ---- 1) artist pages ----
    artist_files = sorted(glob.glob("artists/*/index.html"))
    patched = 0
    for fp in artist_files:
        t = open(fp, encoding="utf-8").read()
        orig = t
        t, _ = replace_js_array(t, "__ART_WORKS_INLINE__", ART)
        if "function buildExGroups(list){" in t:
            # ex-statements inline
            ex_script = '<script id="ex-statements-inline">window.__EX_STATEMENTS_INLINE__=%s</script>' % \
                json.dumps(STORE, separators=(",", ":"), ensure_ascii=False)
            if 'id="ex-statements-inline"' in t:
                t = re.sub(r'<script id="ex-statements-inline">window\.__EX_STATEMENTS_INLINE__=\[.*?\]</script>',
                           lambda _: ex_script, t, count=1, flags=re.S)
            # banner renderer upgrade (idempotent: OLD vanishes after replace)
            if OLD_JS in t:
                t = t.replace(OLD_JS, NEW_JS, 1)
            elif NEW_JS not in t:
                print("  ! banner JS anchor not found:", fp, file=sys.stderr)
            if OLD_CSS in t:
                t = t.replace(OLD_CSS, NEW_CSS, 1)
            elif NEW_CSS not in t:
                print("  ! banner CSS anchor not found:", fp, file=sys.stderr)
            patched += 1
        if t != orig:
            open(fp, "w", encoding="utf-8").write(t)
    print("  artist pages: %d scanned, %d with grouping renderer" % (len(artist_files), patched))

    # ---- 2) works/index.html grid mirror ----
    fp = "works/index.html"
    t = open(fp, encoding="utf-8").read()
    pretty = "\n" + json.dumps(ART, ensure_ascii=False, indent=2) + "\n"
    t2, n = re.subn(r'(<script[^>]*id="works-data"[^>]*>).*?(</script>)',
                    lambda m: m.group(1) + pretty + m.group(2), t, count=1, flags=re.S)
    if n and t2 != t:
        open(fp, "w", encoding="utf-8").write(t2)
    print("  works/index.html #works-data refreshed:", bool(n))

    # ---- 3) single artwork pages: refresh from works.json, preserve injected statement
    #         for exhibition works whose statement lives in the store (work has none). ----
    single = changed = missing = 0
    for fp in sorted(glob.glob("works/*/index.html")):
        if fp == "works/index.html":
            continue
        t = open(fp, encoding="utf-8").read()
        m = re.search(r'(<script[^>]*id="artwork-data"[^>]*>)(\{.*?\})(</script>)', t, re.S)
        if not m:
            continue
        single += 1
        rec_old = json.loads(m.group(2))
        wid = rec_old.get("id")
        base = BY_ID.get(wid)
        if not base:
            missing += 1
            print("  ! single page id not in works.json:", wid, fp, file=sys.stderr)
            continue
        rec = dict(base)
        if not rec.get("statement_he"):
            old = rec_old.get("statement_he")
            if old:
                rec["statement_he"] = old  # exhibition-level statement injected earlier; keep it
        compact = json.dumps(rec, separators=(",", ":"), ensure_ascii=False)
        if compact != m.group(2):
            t = t[:m.start(2)] + compact + t[m.end(2):]
            open(fp, "w", encoding="utf-8").write(t)
            changed += 1
    print("  single pages: %d scanned, %d updated, %d id-mismatch" % (single, changed, missing))
    print("done.")


if __name__ == "__main__":
    main()
