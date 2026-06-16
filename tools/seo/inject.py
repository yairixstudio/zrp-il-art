#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HEAD-ONLY SEO injector for art.zrp.co.il
Iron rule: NEVER touches <body>. All output lives inside <head>, between
<!-- SEO:auto:start --> ... <!-- SEO:auto:end --> markers (idempotent / re-runnable).
Also (head-only) upgrades generic static <title>/<meta description> for data-driven pages.
"""
import json, os, re, sys, html

# repo root = two levels up from this file (tools/seo/inject.py); fallback to hardcoded path
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) \
    if "__file__" in dir() else "/Users/yairix/Library/Mobile Documents/com~apple~CloudDocs/Z & R/ארט פיגמה פרו"
BASE = "https://art.zrp.co.il"
SITE = "ZIELINSKI & ROZEN"
DEFAULT_OG = "images/homepage/hero-landscape.webp"
START = "<!-- SEO:auto:start -->"
END = "<!-- SEO:auto:end -->"

os.chdir(ROOT)

def load(p):
    with open(os.path.join("data", p), encoding="utf-8") as f:
        return json.load(f)

artists = {a["slug"]: a for a in load("artists.json")["artists"]}
works = {w["id"]: w for w in load("works.json")["art_works"]}
exhibitions = {e["slug"]: e for e in load("exhibitions.json")["exhibitions"]}
events = {e.get("slug", e["id"]): e for e in load("events.json")["events"]}
press = load("press.json")["items"]
opencalls = {o["slug"]: o for o in load("opencalls.json")["opencalls"]}
curators = {c["slug"]: c for c in load("curators.json")["curators"]}
galleries = {g["slug"]: g for g in load("galleries.json")["galleries"]}

# editorial overrides produced by the content workflow: {route: {"title":..,"description":..}}
OVERRIDES = {}
for ov_path in ("tools/seo/overrides.json", "/tmp/seo_overrides.json"):
    if os.path.exists(ov_path):
        with open(ov_path, encoding="utf-8") as f:
            OVERRIDES = json.load(f)
        break

def esc_attr(s):
    if s is None: return ""
    s = str(s)
    s = s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")
    return s.strip()

def flatten(x):
    """Flatten nested lists/dicts (description_he is sometimes list-of-lines or paragraphs) to text."""
    if x is None: return ""
    if isinstance(x, str): return x
    if isinstance(x, (int, float)): return str(x)
    if isinstance(x, list): return " ".join(flatten(i) for i in x)
    if isinstance(x, dict):
        for k in ("text", "lines", "he", "body"):
            if k in x: return flatten(x[k])
        return " ".join(flatten(v) for v in x.values())
    return str(x)

def clean_text(s):
    """plain text for descriptions: strip tags/markers, collapse whitespace."""
    s = flatten(s)
    if not s: return ""
    s = re.sub(r"\{/?[a-zA-Z]+\}", "", s)      # {en}..{/en} markers
    s = re.sub(r"<[^>]+>", "", s)               # any html
    s = s.replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def truncate(s, n=158):
    s = clean_text(s)
    if len(s) <= n: return s
    cut = s[:n]
    sp = cut.rfind(" ")
    if sp > n * 0.6: cut = cut[:sp]
    return cut.rstrip(" ,.;-–—") + "…"

def abs_url(rel):
    rel = rel.lstrip("/")
    return BASE + "/" + rel

def abs_img(path):
    if not path: return abs_url(DEFAULT_OG)
    if not os.path.exists(path):
        return abs_url(DEFAULT_OG)
    return abs_url(path)

# dims map for OG JPGs: {source_webp_rel: {"jpg":rel, "w":int, "h":int}} (built by og-gen pass)
DIMS = {}
for _dims_path in ("tools/seo/og-dims.json", "/tmp/og_dims.json"):
    if os.path.exists(_dims_path):
        with open(_dims_path, encoding="utf-8") as f:
            DIMS = json.load(f)
        break

def og_image_info(src):
    """Return (abs_url, width, height). Prefer the published JPG in /og/ (social compat; images/*.jpg is gitignored)."""
    if not src or not os.path.exists(src):
        src = DEFAULT_OG
    d = DIMS.get(src) or {}
    jpg = d.get("jpg")
    use = jpg if (jpg and os.path.exists(jpg)) else src
    return abs_url(use), d.get("w"), d.get("h")

FAVICONS = [
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
]

def route_for(relpath):
    # relpath like 'about/index.html' or 'index.html' or '404.html'
    if relpath == "index.html":
        return "/"
    if relpath == "404.html":
        return "/404.html"
    d = relpath[:-len("/index.html")]
    return "/" + d + "/"

def jsonld_script(obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    txt = txt.replace("</", "<\\/")
    return '<script type="application/ld+json">' + txt + "</script>"

ORG = {
    "@type": ["Organization", "ArtGallery"],
    "@id": BASE + "/#org",
    "name": SITE,
    "url": BASE + "/",
    "logo": abs_url("images/brand/logo.svg"),
    "sameAs": [
        "https://www.instagram.com/erezzielinskirozen/",
        "https://web.facebook.com/ZielinskiRozen/",
    ],
    "areaServed": "Tel Aviv, Israel",
}

def breadcrumb(crumbs):
    # crumbs: list of (name, route)
    items = []
    for i, (name, route) in enumerate(crumbs, 1):
        items.append({
            "@type": "ListItem", "position": i, "name": name,
            "item": abs_url(route.lstrip("/")) if route else None,
        })
    for it in items:
        if it["item"] is None: del it["item"]
    return {"@type": "BreadcrumbList", "itemListElement": items}

def artist_name(w):
    return w.get("artist_he") or w.get("artist_en") or ""

def build_meta(relpath):
    """Return dict: title(opt override), description(opt override), og_type, og_image, jsonld(list)."""
    route = route_for(relpath)
    canonical = abs_url(route.lstrip("/")) if route != "/" else BASE + "/"
    parts = relpath.split("/")
    title_override = None
    desc_override = None
    og_type = "website"
    og_image = DEFAULT_OG
    jsonld = []

    def page_node(name, desc, extra=None):
        n = {"@type": "WebPage", "@id": canonical + "#webpage", "url": canonical,
             "name": name, "isPartOf": {"@id": BASE + "/#website"},
             "publisher": {"@id": BASE + "/#org"}}
        if desc: n["description"] = clean_text(desc)
        if extra: n.update(extra)
        return n

    if relpath == "index.html":
        og_type = "website"
        jsonld = [
            {"@context": "https://schema.org", "@graph": [
                ORG,
                {"@type": "WebSite", "@id": BASE + "/#website", "url": BASE + "/",
                 "name": SITE, "inLanguage": "he-IL", "publisher": {"@id": BASE + "/#org"}},
            ]},
        ]
        return dict(canonical=canonical, title_override=None, desc_override=None,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "artists" and len(parts) == 3:
        slug = parts[1]
        a = artists.get(slug)
        if a:
            name_en = a.get("name_en") or slug
            title_override = name_en + " — Zielinski & Rozen"
            bio = a.get("bio_he")
            if bio:
                desc_override = truncate(bio)
            else:
                desc_override = (a.get("name_he") or name_en)
            # ensure a usable SERP-length description even for short/placeholder bios (no fabricated facts)
            if len(desc_override) < 60:
                desc_override = (desc_override.rstrip(" .,-—") +
                                 " — בגלריות זילינסקי ורוזן, תל אביב. צפו בעבודות ובביוגרפיה.")
            og_type = "profile"
            og_image = a.get("portrait") or (a.get("hero_images") or [None])[0] or DEFAULT_OG
            same = []
            if a.get("instagram_handle"):
                h = a["instagram_handle"].lstrip("@")
                same.append("https://www.instagram.com/" + h + "/")
            person = {"@type": "Person", "name": name_en,
                      "alternateName": a.get("name_he"), "url": canonical,
                      "image": abs_img(a.get("portrait")),
                      "jobTitle": "Artist",
                      "memberOf": {"@id": BASE + "/#org"}}
            if a.get("bio_he"): person["description"] = truncate(a["bio_he"], 280)
            if same: person["sameAs"] = same
            jsonld = [{"@context": "https://schema.org", "@graph": [
                {"@type": "ProfilePage", "@id": canonical + "#webpage", "url": canonical,
                 "name": title_override, "isPartOf": {"@id": BASE + "/#website"},
                 "mainEntity": {"@id": canonical + "#person"}},
                dict(person, **{"@id": canonical + "#person"}),
                breadcrumb([("Artists", "/artists/"), (name_en, route)]),
            ]}]
        return dict(canonical=canonical, title_override=title_override, desc_override=desc_override,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "artists" and len(parts) == 2:  # artists/index.html
        jsonld = [{"@context": "https://schema.org",
                   "@type": "CollectionPage", "@id": canonical + "#webpage", "url": canonical,
                   "name": "The Artists — Zielinski & Rozen",
                   "isPartOf": {"@id": BASE + "/#website"},
                   "about": {"@id": BASE + "/#org"}}]
        return dict(canonical=canonical, title_override=None, desc_override=None,
                    og_type="website", og_image=DEFAULT_OG, jsonld=jsonld)

    if parts[0] == "works" and len(parts) == 3:
        wid = parts[1]
        w = works.get(wid)
        if w:
            title_he = w.get("title_he") or w.get("title_en") or ""
            an = artist_name(w)
            if not (relpath in OVERRIDES):
                pass
            og_type = "article"
            imgfile = "images/works/v2/" + w["img"] + ".webp"
            og_image = imgfile
            desc_bits = [x for x in [title_he, an] if x]
            base_desc = " — ".join(desc_bits)
            extra = w.get("details_he") or ""
            full = base_desc + ("، " if False else " · ") + clean_text(extra) if extra else base_desc
            desc_override = truncate((title_he + " מאת " + an + ". " + clean_text(extra)) if an else (title_he + ". " + clean_text(extra)))
            creator = {"@type": "Person", "name": w.get("artist_en") or an}
            if w.get("artist_slug") and w["artist_slug"] in artists:
                creator["@id"] = abs_url("artists/" + w["artist_slug"] + "/") + "#person"
                creator["url"] = abs_url("artists/" + w["artist_slug"] + "/")
            art = {"@type": "VisualArtwork", "@id": canonical + "#artwork", "url": canonical,
                   "name": title_he or (w.get("title_en") or wid),
                   "image": abs_img(imgfile), "creator": creator,
                   "isPartOf": {"@id": BASE + "/#org"}}
            if extra: art["artMedium"] = clean_text(extra)[:120]
            crumbs = [("The Art Works", "/works/")]
            if w.get("artist_slug") in artists:
                crumbs.append((w.get("artist_en") or an, "/artists/" + w["artist_slug"] + "/"))
            crumbs.append((title_he or wid, route))
            jsonld = [{"@context": "https://schema.org", "@graph": [art, breadcrumb(crumbs)]}]
        return dict(canonical=canonical, title_override=None, desc_override=None,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "works" and len(parts) == 2:  # works/index.html
        jsonld = [{"@context": "https://schema.org", "@type": "CollectionPage",
                   "@id": canonical + "#webpage", "url": canonical,
                   "name": "The Art Works — Zielinski & Rozen",
                   "isPartOf": {"@id": BASE + "/#website"}, "about": {"@id": BASE + "/#org"}}]
        return dict(canonical=canonical, title_override=None, desc_override=None,
                    og_type="website", og_image=DEFAULT_OG, jsonld=jsonld)

    if parts[0] == "exhibitions" and len(parts) == 3:
        slug = parts[1]
        e = exhibitions.get(slug)
        if e:
            ten = e.get("title_en") or e.get("title_he") or slug
            title_override = ten + " — Exhibition — Zielinski & Rozen"
            sub = e.get("subtitle_he") or ""
            desc_override = truncate((ten + " — " + clean_text(sub)) if sub else ten)
            og_type = "article"
            og_image = e.get("hero_image") or DEFAULT_OG
            ev = {"@type": "ExhibitionEvent", "@id": canonical + "#event", "url": canonical,
                  "name": ten, "image": abs_img(e.get("hero_image")),
                  "organizer": {"@id": BASE + "/#org"},
                  "location": {"@id": BASE + "/#org"}}
            if e.get("start_date"): ev["startDate"] = e["start_date"]
            if e.get("end_date"): ev["endDate"] = e["end_date"]
            jsonld = [{"@context": "https://schema.org", "@graph": [
                ev, breadcrumb([("Exhibitions", "/exhibitions/"), (ten, route)])]}]
        return dict(canonical=canonical, title_override=title_override, desc_override=desc_override,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "events" and len(parts) == 3:
        slug = parts[1]
        e = events.get(slug)
        if e:
            ten = e.get("title_he") or e.get("title_en") or slug
            desc_override = truncate((ten + " — " + clean_text(e.get("description_he") or e.get("subtitle_he") or "")))
            og_type = "article"
            og_image = e.get("cover_image") or DEFAULT_OG
            ev = {"@type": "Event", "@id": canonical + "#event", "url": canonical,
                  "name": ten, "image": abs_img(e.get("cover_image")),
                  "organizer": {"@id": BASE + "/#org"}, "location": {"@id": BASE + "/#org"}}
            if e.get("date"): ev["startDate"] = e["date"]
            if e.get("description_he"): ev["description"] = truncate(e["description_he"], 280)
            jsonld = [{"@context": "https://schema.org", "@graph": [
                ev, breadcrumb([("Press & Events", "/press/"), (ten, route)])]}]
        return dict(canonical=canonical, title_override=None, desc_override=desc_override,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "press" and len(parts) == 3:
        slug = parts[1]
        # match by route ending
        art = None
        for p in press:
            r = (p.get("route") or "").strip("/")
            if r.endswith(slug) or p.get("id") == slug:
                art = p; break
        if art:
            ten = art.get("title_he") or art.get("title_en") or slug
            desc_override = truncate(clean_text(art.get("subtitle_en") or art.get("subtitle_he") or ten))
            og_type = "article"
            og_image = art.get("cover_image") or DEFAULT_OG
            node = {"@type": "NewsArticle", "@id": canonical + "#article", "url": canonical,
                    "headline": ten, "image": abs_img(art.get("cover_image")),
                    "publisher": {"@id": BASE + "/#org"}, "mainEntityOfPage": canonical}
            if art.get("date"): node["datePublished"] = art["date"]
            if art.get("source_en"): node["sourceOrganization"] = {"@type": "Organization", "name": art["source_en"]}
            jsonld = [{"@context": "https://schema.org", "@graph": [
                node, breadcrumb([("Press & Events", "/press/"), (ten, route)])]}]
        return dict(canonical=canonical, title_override=None, desc_override=desc_override,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "opencalls" and len(parts) == 3:
        slug = parts[1]
        o = opencalls.get(slug)
        if o:
            ten = o.get("title_en") or o.get("title_he") or slug
            desc_override = truncate(clean_text(o.get("description_he") or ten))
            og_type = "article"
            og_image = o.get("hero_image") or o.get("card_image") or DEFAULT_OG
            jsonld = [{"@context": "https://schema.org", "@graph": [
                page_node(ten + " — Open Call", o.get("description_he")),
                breadcrumb([("Open Calls", "/opencalls/"), (ten, route)])]}]
        return dict(canonical=canonical, title_override=None, desc_override=desc_override,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    if parts[0] == "curators" and len(parts) == 3:
        slug = parts[1]
        c = curators.get(slug)
        if c:
            name = (c.get("name_en_first", "") + " " + c.get("name_en_last", "")).strip()
            title_override = name + " — Curator — Zielinski & Rozen"
            bio = c.get("bio_he")
            biotxt = ""
            if isinstance(bio, list) and bio:
                flat = bio[0] if isinstance(bio[0], list) else bio
                biotxt = " ".join(flat) if isinstance(flat, list) else str(flat)
            desc_override = truncate(clean_text(biotxt) or (name + " — אוצרת בגלריות זילינסקי ורוזן."))
            og_type = "profile"
            portrait = (c.get("portrait") or {}).get("src")
            og_image = portrait or DEFAULT_OG
            person = {"@type": "Person", "@id": canonical + "#person", "name": name,
                      "url": canonical, "image": abs_img(portrait), "jobTitle": "Curator"}
            if c.get("instagram_handle"):
                person["sameAs"] = ["https://www.instagram.com/" + c["instagram_handle"].lstrip("@") + "/"]
            if biotxt: person["description"] = truncate(biotxt, 280)
            jsonld = [{"@context": "https://schema.org", "@graph": [
                {"@type": "ProfilePage", "@id": canonical + "#webpage", "url": canonical,
                 "name": title_override, "isPartOf": {"@id": BASE + "/#website"},
                 "mainEntity": {"@id": canonical + "#person"}},
                person,
                breadcrumb([("Curators", "/curators/"), (name, route)])]}]
        return dict(canonical=canonical, title_override=title_override, desc_override=desc_override,
                    og_type=og_type, og_image=og_image, jsonld=jsonld)

    # generic static pages: about, contact, accessibility, privacy, 404, and indexes
    name_map = {
        "about": "About — Zielinski & Rozen Art Galleries",
        "contact": "Contact — Zielinski & Rozen",
        "accessibility": "Accessibility — Zielinski & Rozen",
        "privacy": "Privacy Policy — Zielinski & Rozen",
    }
    pname = name_map.get(parts[0], SITE)
    if parts[0] == "about":
        jsonld = [{"@context": "https://schema.org", "@graph": [
            {"@type": "AboutPage", "@id": canonical + "#webpage", "url": canonical,
             "name": pname, "isPartOf": {"@id": BASE + "/#website"},
             "about": {"@id": BASE + "/#org"},
             "mainEntity": {"@type": "Person", "name": "Erez Zielinski-Rozen",
                            "jobTitle": "Founder & Artist", "worksFor": {"@id": BASE + "/#org"}}}]}]
    else:
        jsonld = [{"@context": "https://schema.org", "@type": "WebPage",
                   "@id": canonical + "#webpage", "url": canonical, "name": pname,
                   "isPartOf": {"@id": BASE + "/#website"}, "publisher": {"@id": BASE + "/#org"}}]
    return dict(canonical=canonical, title_override=None, desc_override=None,
                og_type="website", og_image=DEFAULT_OG, jsonld=jsonld)


def current_title(headtxt):
    m = re.search(r"<title>(.*?)</title>", headtxt, re.S | re.I)
    # unescape: source title is already HTML-escaped; we re-escape once in esc_attr -> avoid double-escape
    return html.unescape(m.group(1).strip()) if m else SITE

def current_desc(headtxt):
    m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', headtxt, re.S | re.I)
    return html.unescape(m.group(1).strip()) if m else None

def build_block(relpath, headtxt, meta):
    route_abs = meta["canonical"]
    # apply editorial override
    ov = OVERRIDES.get(route_for(relpath), {})
    title_final = ov.get("title") or meta.get("title_override") or current_title(headtxt)
    desc_final = ov.get("description") or meta.get("desc_override") or current_desc(headtxt) or \
        "Zielinski & Rozen — art galleries in Tel Aviv."
    og_img_abs, og_w, og_h = og_image_info(meta["og_image"])
    is404 = (relpath == "404.html")
    lines = [START]
    lines.append('<link rel="canonical" href="%s">' % route_abs)
    lines.append('<meta name="robots" content="%s">' %
                 ("noindex,follow" if is404 else "index,follow,max-image-preview:large,max-snippet:-1"))
    lines.append('<meta name="theme-color" content="#FFFFFF">')
    for fav in FAVICONS:
        lines.append(fav)
    lines.append('<meta property="og:site_name" content="%s">' % esc_attr(SITE))
    lines.append('<meta property="og:locale" content="he_IL">')
    lines.append('<meta property="og:type" content="%s">' % meta["og_type"])
    lines.append('<meta property="og:title" content="%s">' % esc_attr(title_final))
    lines.append('<meta property="og:description" content="%s">' % esc_attr(desc_final))
    lines.append('<meta property="og:url" content="%s">' % route_abs)
    lines.append('<meta property="og:image" content="%s">' % og_img_abs)
    if og_w and og_h:
        lines.append('<meta property="og:image:width" content="%d">' % og_w)
        lines.append('<meta property="og:image:height" content="%d">' % og_h)
    lines.append('<meta property="og:image:alt" content="%s">' % esc_attr(title_final))
    lines.append('<meta name="twitter:card" content="summary_large_image">')
    lines.append('<meta name="twitter:title" content="%s">' % esc_attr(title_final))
    lines.append('<meta name="twitter:description" content="%s">' % esc_attr(desc_final))
    lines.append('<meta name="twitter:image" content="%s">' % og_img_abs)
    for j in meta["jsonld"]:
        lines.append(jsonld_script(j))
    lines.append(END)
    return "\n".join(lines), title_final, desc_final


def process(relpath):
    with open(relpath, encoding="utf-8") as f:
        src = f.read()
    hm = re.search(r"(?is)<head\b[^>]*>(.*?)</head>", src)
    if not hm:
        return "NOHEAD", relpath
    head_inner = hm.group(1)
    headstart, headend = hm.start(1), hm.end(1)

    meta = build_meta(relpath)
    block, title_final, desc_final = build_block(relpath, head_inner, meta)

    new_head = head_inner
    # 1) optionally replace static <title> / description (head-only)
    ov = OVERRIDES.get(route_for(relpath), {})
    want_title = ov.get("title") or meta.get("title_override")
    want_desc = ov.get("description") or meta.get("desc_override")
    if want_title:
        new_head = re.sub(r"(?is)<title>.*?</title>",
                          "<title>" + html.escape(want_title, quote=False) + "</title>",
                          new_head, count=1)
    if want_desc:
        if re.search(r'(?is)<meta\s+name=["\']description["\']', new_head):
            new_head = re.sub(r'(?is)<meta\s+name=["\']description["\']\s+content=["\'].*?["\']\s*/?>',
                              '<meta name="description" content="' + esc_attr(want_desc) + '">',
                              new_head, count=1)
        else:
            new_head = new_head.rstrip() + '\n<meta name="description" content="' + esc_attr(want_desc) + '">\n'

    # 2) remove any previous auto block, then append fresh before </head>
    new_head = re.sub(re.escape(START) + r".*?" + re.escape(END), "", new_head, flags=re.S)
    new_head = new_head.rstrip() + "\n" + block + "\n"

    new_src = src[:headstart] + new_head + src[headend:]
    if new_src != src:
        with open(relpath, "w", encoding="utf-8") as f:
            f.write(new_src)
        return "OK", relpath
    return "NOCHANGE", relpath


def all_pages():
    out = []
    for dp, dn, fn in os.walk("."):
        if any(seg in dp for seg in ("/trash", "/node_modules", "/.git", "/_originals")):
            continue
        for f in fn:
            if f.endswith(".html"):
                rp = os.path.normpath(os.path.join(dp, f))
                if rp.startswith("trash") or rp.startswith("node_modules"):
                    continue
                out.append(rp)
    return sorted(out)


if __name__ == "__main__":
    pages = all_pages()
    stats = {}
    for p in pages:
        st, _ = process(p)
        stats[st] = stats.get(st, 0) + 1
    print("pages:", len(pages))
    for k, v in sorted(stats.items()):
        print(" ", k, v)
