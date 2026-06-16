#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate JPG OG images into /og/ (top-level, NOT gitignored), capture dims -> /tmp/og_dims.json.
   dims keyed by SOURCE webp path -> {"jpg": "og/<flat>.jpg", "w":int, "h":int}.
   Also cleans up any stray sibling *.jpg under images/ created by a prior run."""
import importlib.util, os, json, subprocess

spec = importlib.util.spec_from_file_location("seo_inject", "/tmp/seo_inject.py")
S = importlib.util.module_from_spec(spec)
spec.loader.exec_module(S)

os.makedirs("og", exist_ok=True)

srcs = set()
for p in S.all_pages():
    meta = S.build_meta(p)
    src = meta.get("og_image") or S.DEFAULT_OG
    if not os.path.exists(src):
        src = S.DEFAULT_OG
    srcs.add(src)
print("unique OG source images:", len(srcs))

def flat(src):
    base = src
    if base.startswith("images/"):
        base = base[len("images/"):]
    base = os.path.splitext(base)[0]
    return base.replace("/", "-").replace(" ", "-") + ".jpg"

# cleanup stray sibling jpgs from a previous run (gitignored, but remove clutter)
for src in srcs:
    sib = os.path.splitext(src)[0] + ".jpg"
    if os.path.exists(sib) and sib != src:
        try: os.remove(sib)
        except OSError: pass

dims = {}; made = 0
for src in sorted(srcs):
    jpg = os.path.join("og", flat(src))
    if not os.path.exists(jpg):
        r = subprocess.run(["magick", src, "-background", "white", "-flatten",
                            "-resize", "1200x1200>", "-strip", "-quality", "85", jpg],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print("  FAIL", src, r.stderr[:120]); continue
        made += 1
    out = subprocess.run(["magick", "identify", "-format", "%w %h", jpg],
                         capture_output=True, text=True).stdout.strip()
    try:
        w, h = (int(x) for x in out.split())
        dims[src] = {"jpg": jpg, "w": w, "h": h}
    except Exception:
        print("  no-dims", jpg, out)

os.makedirs("tools/seo", exist_ok=True)
for outp in ("tools/seo/og-dims.json", "/tmp/og_dims.json"):
    json.dump(dims, open(outp, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("jpgs in og/:", made, " dims recorded:", len(dims))
