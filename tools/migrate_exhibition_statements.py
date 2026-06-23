#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrate artist-on-exhibition statements out of individual art_works records
into an explicit top-level `exhibition_statements` store in data/works.json.

Why:
  Until now the "artist statement about an exhibition" was *stored* on every
  artwork (art_works[].statement_he / statement_he_by_artist) and the artist-page
  renderer DERIVED the group statement via "first non-empty wins" while grouping
  by exhibition_title_he. That conflated two ideas:
    - exhibition_statement  : one text per (artist x exhibition)  -> belongs to the exhibition
    - artwork_statement      : optional text about ONE specific artwork
  This script makes the first explicit and frees art_works[].statement_he to mean
  the second (per-artwork banner, rendered above its own work).

Guarantee:
  Rendering is IDENTICAL to before today, because:
    - new exhibition_statements[(slug,title)] == exactly the value the old
      first-non-empty-by-artist_page_pos logic would have picked (verified: 0 conflicts).
    - single artwork pages get the resolved statement injected back into their
      per-page #artwork-data snapshot, so their renderer is untouched.
    - no artwork currently carries a per-artwork statement, so the new banner
      never renders today.

Idempotent: re-running after migration rebuilds all inline mirrors from works.json
+ the existing exhibition_statements store.

Run from repo root:  python3 tools/migrate_exhibition_statements.py
"""
import json, re, glob, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

WORKS_JSON = "data/works.json"
POS = lambda w: (w.get("artist_page_pos") or 1e9)


def load_works():
    with open(WORKS_JSON, encoding="utf-8") as f:
        return json.load(f)


def build_store(art_works):
    """Return ordered list of exhibition_statements records, replicating the
    old renderer's per-(artist-page, exhibition_title) first-non-empty pick."""
    slugs = []
    seen_slug = set()
    for w in art_works:
        for s in [w["artist_slug"]] + (w.get("artist_pages") or []):
            if s not in seen_slug:
                seen_slug.add(s); slugs.append(s)
    records = []
    conflicts = 0
    for s in slugs:
        ws = sorted([w for w in art_works
                     if w["artist_slug"] == s or s in (w.get("artist_pages") or [])],
                    key=POS)
        chosen = {}
        for w in ws:
            title = w.get("exhibition_title_he")
            if not title:
                continue
            stmt = (w.get("statement_he_by_artist") or {}).get(s) or w.get("statement_he")
            if not stmt:
                continue
            if title in chosen:
                if chosen[title]["statement_he"] != stmt:
                    conflicts += 1
                    print(f"  ! conflict kept-first: slug={s} title={title!r}", file=sys.stderr)
                continue
            chosen[title] = {
                "artist_slug": s,
                "exhibition_title_he": title,
                "exhibition_slug": w.get("exhibition_slug"),
                "exhibition_route": w.get("exhibition_route"),
                "statement_he": stmt,
            }
        records.extend(chosen.values())
    if conflicts:
        print(f"  WARNING: {conflicts} conflicting groups (kept first).", file=sys.stderr)
    return records


def stripped_art_works(art_works):
    """Remove the EXHIBITION-LEVEL statement from art_works:
      - works that have exhibition_title_he  -> their statement_he moved to the store, drop it.
      - works WITHOUT an exhibition_title_he  -> their statement_he is a per-artwork text, KEEP it.
      - statement_he_by_artist is always exhibition-level (collab) -> always drop.
    This frees art_works[].statement_he to mean "text about this specific artwork"."""
    out = []
    for w in art_works:
        w = dict(w)
        w.pop("statement_he_by_artist", None)
        if w.get("exhibition_title_he"):
            w.pop("statement_he", None)
        out.append(w)
    return out


def store_lookup(store):
    m = {}
    for r in store:
        m[(r["artist_slug"], r["exhibition_title_he"])] = r["statement_he"]
    return m


# ---------- inline-mirror rewriters ----------

def replace_js_array(text, var_name, new_array):
    """Replace `window.<var>=[...]` (compact, single line) inside a <script>."""
    payload = "window.%s=%s" % (var_name, json.dumps(new_array, separators=(",", ":"), ensure_ascii=False))
    pat = re.compile(r"window\." + re.escape(var_name) + r"=\[.*?\](?=;?</script>)", re.S)
    new_text, n = pat.subn(lambda _: payload, text, count=1)
    return new_text, n


def main():
    data = load_works()
    art_works = data["art_works"]

    # extraction source: if art_works still carry statements -> extract;
    # otherwise reuse existing store (idempotent re-run).
    has_raw = any(w.get("statement_he_by_artist") for w in art_works) or \
        any(w.get("statement_he") and w.get("exhibition_title_he") for w in art_works)
    # authoritative "what the single page showed today" = the work's own raw statement_he
    orig_stmt = {w["id"]: w.get("statement_he") for w in art_works}
    if has_raw:
        store = build_store(art_works)
    else:
        store = data.get("exhibition_statements", [])
        print("  (art_works already stripped; reusing existing exhibition_statements)")

    new_art_works = stripped_art_works(art_works)
    lut = store_lookup(store)

    # ---- 1) works.json ----
    new_data = {}
    for k, v in data.items():
        if k == "art_works":
            new_data["art_works"] = new_art_works
            new_data["exhibition_statements"] = store
        elif k == "exhibition_statements":
            continue  # already placed next to art_works
        else:
            new_data[k] = v
    if "art_works" not in data:
        new_data["exhibition_statements"] = store
    with open(WORKS_JSON, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("  works.json: %d art_works, %d exhibition_statements" % (len(new_art_works), len(store)))

    # ---- 2) artist pages ----
    artist_files = sorted(glob.glob("artists/*/index.html"))
    patched_render = 0
    for fp in artist_files:
        t = open(fp, encoding="utf-8").read()
        orig = t
        # 2a. refresh __ART_WORKS_INLINE__ (all artist pages carry it)
        t, n = replace_js_array(t, "__ART_WORKS_INLINE__", new_art_works)
        # 2b. only pages with the grouping renderer get the statement store + JS patch
        if "function buildExGroups(list){" in t:
            # inject / refresh ex-statements inline mirror right after art-works-inline
            ex_script = '<script id="ex-statements-inline">window.__EX_STATEMENTS_INLINE__=%s</script>' % \
                json.dumps(store, separators=(",", ":"), ensure_ascii=False)
            if 'id="ex-statements-inline"' in t:
                t = re.sub(r'<script id="ex-statements-inline">window\.__EX_STATEMENTS_INLINE__=\[.*?\]</script>',
                           lambda _: ex_script, t, count=1, flags=re.S)
            else:
                t = re.sub(r'(<script id="art-works-inline">window\.__ART_WORKS_INLINE__=\[.*?\]</script>)',
                           lambda m: m.group(1) + "\n" + ex_script, t, count=1, flags=re.S)
            # helper (idempotent)
            if "function exStatement(slug,title){" not in t:
                helper = ('    function exStatement(slug,title){\n'
                          '      var L=window.__EX_STATEMENTS_INLINE__||[];\n'
                          '      for(var i=0;i<L.length;i++){if(L[i].artist_slug===slug&&L[i].exhibition_title_he===title)return L[i].statement_he;}\n'
                          '      return null;\n'
                          '    }\n'
                          '    function buildExGroups(list){')
                t = t.replace("    function buildExGroups(list){", helper, 1)
            # statement source: from store, not from work
            OLD_A = ('        if(!byKey[key]){byKey[key]={title:w.exhibition_title_he,route:w.exhibition_route,statement:null,items:[]};groups.push(byKey[key]);}\n'
                     '        var g=byKey[key];\n'
                     '        var _st=(w.statement_he_by_artist&&w.statement_he_by_artist[a.slug])||w.statement_he;\n'
                     '        if(!g.statement && _st && _st.length) g.statement=_st;\n'
                     '        g.items.push(w);')
            NEW_A = ('        if(!byKey[key]){byKey[key]={title:w.exhibition_title_he,route:w.exhibition_route,statement:exStatement(a.slug,w.exhibition_title_he),items:[]};groups.push(byKey[key]);}\n'
                     '        byKey[key].items.push(w);')
            if OLD_A in t:
                t = t.replace(OLD_A, NEW_A, 1)
            elif NEW_A not in t:
                print("  ! buildExGroups source block not found in", fp, file=sys.stderr)
            # per-artwork banner above its own card
            OLD_B = '        var cards=g.items.map(function(w){return buildRichCard(w,gi++);}).join("");'
            NEW_B = ('        var cards=g.items.map(function(w){'
                     'var _wb=(w.statement_he&&w.statement_he.length)?\'<div class="work-statement">\'+statementHtml(w.statement_he)+\'</div>\':\'\';'
                     'return _wb+buildRichCard(w,gi++);}).join("");')
            if OLD_B in t:
                t = t.replace(OLD_B, NEW_B, 1)
            # CSS for the (currently unused) per-work banner
            CSS_ANCHOR = ".works-grid .work{direction:ltr}"
            CSS_ADD = (".works-grid .work{direction:ltr}"
                       ".work-statement{grid-column:1/-1;direction:rtl;text-align:right;"
                       "font-family:var(--heb);color:var(--ink);font-size:16px;line-height:1.7;margin:0}"
                       ".work-statement p{margin:0 0 .7em}.work-statement p:last-child{margin-bottom:0}")
            if CSS_ANCHOR in t and ".work-statement{" not in t:
                t = t.replace(CSS_ANCHOR, CSS_ADD, 1)
            patched_render += 1
        if t != orig:
            open(fp, "w", encoding="utf-8").write(t)
    print("  artist pages: %d touched, %d with grouping renderer patched" % (len(artist_files), patched_render))

    # ---- 3) works/index.html grid mirror (#works-data, pretty-printed; no statements rendered) ----
    fp = "works/index.html"
    t = open(fp, encoding="utf-8").read()
    pretty = "\n" + json.dumps(new_art_works, ensure_ascii=False, indent=2) + "\n"
    t2, n = re.subn(r'(<script[^>]*id="works-data"[^>]*>).*?(</script>)',
                    lambda m: m.group(1) + pretty + m.group(2), t, count=1, flags=re.S)
    if n:
        open(fp, "w", encoding="utf-8").write(t2)
    print("  works/index.html #works-data refreshed:", bool(n))

    # ---- 4) single artwork pages: resolve statement back into per-page snapshot ----
    by_id = {w["id"]: w for w in new_art_works}
    single = 0; missing = 0
    for fp in sorted(glob.glob("works/*/index.html")):
        if fp == "works/index.html":
            continue
        t = open(fp, encoding="utf-8").read()
        m = re.search(r'(<script[^>]*id="artwork-data"[^>]*>)(\{.*?\})(</script>)', t, re.S)
        if not m:
            continue
        try:
            rec_old = json.loads(m.group(2))
        except Exception:
            print("  ! bad artwork-data JSON:", fp, file=sys.stderr); continue
        wid = rec_old.get("id")
        base = by_id.get(wid)
        if not base:
            missing += 1
            print("  ! single page id not in works.json:", wid, fp, file=sys.stderr)
            continue
        rec = dict(base)  # stripped record (keeps per-work statement_he, if any)
        # The single-page renderer reads w.statement_he. To render EXACTLY what it
        # shows today, restore the work's own ORIGINAL statement_he verbatim:
        #   - exhibition works  -> their raw text (== the exhibition statement)
        #   - per-work works     -> their per-work text (e.g. alon-1/2)
        #   - works with none    -> nothing (e.g. talia-zoref-2/3, even though their
        #                            group has a statement on another work)
        raw = orig_stmt.get(wid) if has_raw else rec_old.get("statement_he")
        if raw:
            rec["statement_he"] = raw
        else:
            rec.pop("statement_he", None)
        compact = json.dumps(rec, separators=(",", ":"), ensure_ascii=False)
        t2 = t[:m.start(2)] + compact + t[m.end(2):]
        if t2 != t:
            open(fp, "w", encoding="utf-8").write(t2)
        single += 1
    print("  single artwork pages: %d updated, %d id-mismatch" % (single, missing))
    print("done.")


if __name__ == "__main__":
    main()
