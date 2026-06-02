# CLAUDE.md — Zielinski & Rozen Art Galleries (SPINE)

> **חובה לקרוא לפני כל משימה**, ולעדכן בסיום.
> זה ה-spine: מצב הפרויקט, חוזי-נתונים, workflow, וכללי-זהב. **כל היתר ב-`docs/`** — תפתח לפי טבלת ה-Required Reading למטה.

---

## 0. TL;DR לסוכנים חדשים

1. אתה בונה **דף אחד מתוך אתר**. לא פרויקט בועתי.
2. **🔗 קישורי Figma:** ב-[`FIGMA_LINKS.md`](./FIGMA_LINKS.md). אם הדף חסר — הוסף לפני שאתה מתחיל.
3. פונטים ב-`./פונטים/` — תמיד `@font-face`. **אסור Google Fonts**.
4. נתונים מ-`./data/*.json`. שדה חסר → תוסיף ל-JSON קודם.
5. תמונות ב-`./images/<category>/<slug>/`. **לפני הורדה — `ls` קודם.**
6. **כל דף = שני לינקים מהמשתמש (desktop + mobile)**. **אל תזהה לפי שם node** — הוא משקר. תזהה לפי `absoluteBoundingBox.width`: 1440=desktop, 390=mobile.
7. **מובייל ≠ דסקטופ מצומצם.** sections ייחודיים, סדר שונה, overlay אחר. תבדוק שני frames לפני CSS.
8. **אינטראקטיביות נסתרת.** Figma סטטי; באתר יש גלילה אופקית, lightbox, hover scale. ראה `docs/lessons.md §1` — Static-vs-Dynamic. **שאל אם לא ברור.**
9. **כל אנגלית באתר = Copperplate UPPERCASE.** הכלל ב-CSS גלובלי. פרטים: `docs/conventions.md §5`.
10. **כל אזכור אומן = קישור** (`docs/artist-linking.md`). הפרה = הדף לא מוכן.
11. בסוף — עדכן sitemap (§3), `FIGMA_LINKS.md` אם גילית URL חדש, JSON contracts (§5) אם נוסף שדה, ולקח חדש ב-`docs/lessons.md §4`.

---

## 1. Required Reading Map — תפתח לפי מה שאתה עושה

> **כלל ברזל:** לפני שאתה כותב CSS/HTML או נוגע בתוכן — תוודא שקראת את ה-docs הרלוונטיים. אל תנחש מהזיכרון. הקבצים האלה הם המקור הסמכותי.

| אם אתה עושה... | קרא חובה |
|---|---|
| כותב CSS חדש, נוגע ב-typography, RTL, casing, `text-transform`, responsive, או tokens | [`docs/conventions.md`](./docs/conventions.md) |
| מוסיף/נוגע ב-lightbox, gallery, carousel, slideshow, או רואה ב-Figma תמונות עם dots | [`docs/components.md`](./docs/components.md) |
| מוסיף תוכן/קוד שמזכיר אומן (שם, תמונה, פסקת body, caption, alt) | [`docs/artist-linking.md`](./docs/artist-linking.md) — **חובה לפני סיום משימה** |
| בונה דף חדש או נתקלת ב-Figma quirk / Static-vs-Dynamic decision | [`docs/lessons.md`](./docs/lessons.md) |
| בודק אם משהו כבר נסגר או נתקלת ב-placeholder | [`docs/todo.md`](./docs/todo.md) |
| מתחיל לבנות דף — צריך URLs של Figma | [`FIGMA_LINKS.md`](./FIGMA_LINKS.md) |

---

## 2. מה אנחנו בונים

**אתר Zielinski & Rozen** — רשת 3 גלריות אומנות בתל אביב, מותג בישום שגם הוא אומנותי. ארז זילינסקי־רוזן (founder) הוא אמן בעצמו.

תוכן: **תערוכות**, **אומנים** (22), **גלריות פיזיות** (3), **מאמרי עיתונות**, **אירועים**, **קולות קוראים**, **works**.

עברית = body content; אנגלית = כותרות, ניווט, branding.

Stack: **HTML + CSS** (single-file per page), נתונים ב-`data/*.json`. JSONs מחקים schema של CMS עתידי.

---

## 3. Figma files

> **📌 קישורים ישירים לכל דף ב-[`FIGMA_LINKS.md`](./FIGMA_LINKS.md).** אל תחפש URL כאן.

שני קבצים. **תזהה תמיד מה-URL** (`figma.com/design/<FILEKEY>/...`), לא לפי node-id (שני הקבצים ממוספרים מאפס).

| Key | שם | תוכן |
|---|---|---|
| `XhGH289YTRcW811wrufRJz` | **landing** | homepage, exhibitions, artist, press, events (ktuba), open-call section |
| `Zn3N3mBQkbYER7tTJMbCcz` | **graphics** | about, works, artist pages, events (loneliness), opencalls, lightbox states |

**MCP:** `mcp__figma__get_figma_data`, `mcp__figma__download_figma_images`. `fileKey` הוא parameter — אסור hardcode.

**node-id ב-URL = `119-156`. ב-API = `119:156`.** (dash ↔ colon)

**figma_node_id מקבל משמעות רק יחד עם fileKey** — frames יכולים לעבור בין קבצים. אמת מה-URL של המשתמש תמיד.

---

## 4. SITEMAP

| Route | שם | Figma desktop | Figma mobile | סטטוס |
|---|---|---|---|---|
| `/` | Homepage | `XhGH...::144:317` (canonical; older `Zn3N...::1213:3093`) | `XhGH...::144:2` (canonical; older `Zn3N...::1213:3360`) | ✅ `index.html` |
| `/about/` | Biography of Erez | `Zn3N...::1213:2970` | `Zn3N...::1213:2888` | ✅ `about/index.html` |
| `/works/` | The Art Works | `Zn3N...::1213:2615` (name lies) / alt `1213:2725`, `2764` | (responsive) | ✅ `works/index.html` |
| `/galleries/` | Galleries index | — | — | ⏳ |
| `/galleries/:slug/` | Single gallery | — | — | ⏳ (NOT `1213:2725/2820/2854` — אלו lightbox states) |
| `/exhibitions/` | Index | (כיום ארכיון בהומפייג') | — | ⏳ |
| `/exhibitions/loneliness/` | Single | `XhGH...::119:156` | `XhGH...::119:331` | ✅ `exhibitions/loneliness/index.html` |
| `/exhibitions/how-many/` | Single | `XhGH...::119:435` | `XhGH...::119:642` | ✅ `exhibitions/how-many/index.html` |
| `/curators/korin-avraham/` | Curator (Korin Avraham) | `XhGH...::314:4` | `XhGH...::314:97` | ✅ `curators/korin-avraham/index.html` |
| `/artists/` | All artists | (אולי `Zn3N...::1213:4547`) | — | ⏳ |
| `/artists/:slug/` | Single artist (×22) | `Zn3N...::1213:3` (alon = canonical) | `Zn3N...::1213:3672` (`artist-pages`: 13×390) | ✅ 13 figma + 5 placeholder. Each `artists/<slug>/index.html` is a copy of the shared template with `data-slug` set on `<html>`. |
| `/press/` | Index | — | — | ⏳ |
| `/press/walla/` | Article | `XhGH...::119:740` | `XhGH...::119:868` | ✅ |
| `/press/press-1/` | Article (קורין אברהם) | `XhGH...::119:972` | `XhGH...::119:1163` | ✅ |
| `/press/time-out/` | Article | `XhGH...::119:1340` | `XhGH...::119:1433` | ✅ |
| `/events/ktuba/` | Event (zohar ron live art) | `XhGH...::119:1651` (canonical 2026-05-11; legacy `Zn3N...::1213:1644`) | `XhGH...::119:1509` (legacy `Zn3N...::1213:1502`) | ✅ |
| `/events/loneliness/` | Event (opening) | `Zn3N...::1213:1873` | `Zn3N...::1213:2099` | ✅ |
| `/events/close-look/` | Event (מבט מקרוב — open meeting, tanya shin, how-many) | `XhGH...::420:1520` | `XhGH...::420:1625` | ✅ `events/close-look/index.html` |
| `/events/how-many/` | Event (opening — how many, 15 artists, korin avraham) | `XhGH...::433:2` | `XhGH...::433:179` | ✅ `events/how-many/index.html` |
| `/opencalls/` | Index | — | — | ⏳ |
| `/opencalls/the-peeler/` | Single | `Zn3N...::1213:2417` | `Zn3N...::1213:2518` | ✅ |
| `/opencalls/how-many/` | Single | `Zn3N...::1213:2340` | `Zn3N...::1213:2263` | ✅ |
| `/contact/` | Form | — | — | ✅ `contact/index.html` |
| `/accessibility/` | Statement | — | — | ✅ `accessibility/index.html` |
| `/privacy/` | Privacy policy | — | — | ✅ `privacy/index.html` |

**סטטי (shell):** brand, nav, footer, newsletter copy, copyright, palette + typography. ב-`data/site.json` או CSS.
**דינמי (JSON):** galleries, artists, exhibitions, events, press, opencalls, works, instagram, homepage curation, announcement, **curators**.

---

## 5. STACK & FILE LAYOUT

```
.
├── index.html                 # Homepage entry → /
├── about/index.html           # → /about/
├── works/index.html           # → /works/
├── contact/, accessibility/, privacy/   # Static pages, each <dir>/index.html
├── artists/<slug>/index.html  # Per-artist pages (shared template + data-slug)
├── exhibitions/<slug>/index.html
├── opencalls/<slug>/index.html
├── press/<slug>/index.html
├── events/<slug>/index.html
├── curators/<slug>/index.html
├── components/                # artwork-lightbox, gallery, stacked-gallery, triptych-gallery, site-chrome
├── data/                      # JSON content (mirrors future CMS)
├── images/                    # see docs/conventions.md §1
├── docs/                      # conventions, components, artist-linking, lessons, todo
├── פונטים/                    # Copperplate {300/400/700/900}, FbEzmel {300/400}
├── .nojekyll                  # Tells GitHub Pages to serve files as-is (no Jekyll processing)
├── FIGMA_LINKS.md             # All page-by-page Figma URLs
└── CLAUDE.md                  # ← you are here
```

> **URLs:** Directory-based for clean paths. `/about/` instead of `/pages/about.html`. Templates (`exhibition`, `opencall`, `artist`) are copied per slug with `data-slug` attribute on `<html>` so each page is fully self-contained at its own clean URL.

**שמות:** kebab-case, ASCII. סלאגים = `id` ב-JSON. תיקיות עברית רק לפונטים ולקובץ הזה.

**תיקיות חסרות** — תיצור. **אל תשנה חלוקה קיימת.**

---

## 6. JSON Data Contracts

**עיקרון:** דף קורא JSONs, לא מטמיע inline. שדה חסר → תוסיף ל-JSON לפני שימוש. שדה חדש → לכל הרשומות (null אם לא ידוע).

| Schema | שדות עיקריים |
|---|---|
| `site.json` | brand, nav, footer, announcement, social — **גלובלי בכל דף** |
| `galleries.json` | id, slug, name_he/en, address_he/en, status (`open\|coming-soon\|closed`), hours[], image_hero |
| `artists.json` | id, slug, name_he/en, portrait, bio_he/en, works[] (objects: `{id,title,image,year?,medium?}` inline, לא ref ל-works.json), instagram_handle, hero_images[], **`hero_image_focus[]`** (object-position לכל תמונה בדואו), **`hero_collab`** (שיתוף: `artists[{name_en, bio_he_short, instagram}]` — hero מובייל Figma `119:3917`), figma_artist_page_desktop/mobile, homepage_featured, **אופציונלי:** `works_caption_each_image` (`true` = תמיד כיתוב מתחת לכל תמונה; דורש כשכותרות זהות אך הקשר How Many ולא loneliness) |
| `exhibitions.json` | id, slug, title_en, subtitle_he, status (`current\|upcoming\|archived`), gallery_id, start/end_date, hero_image, thumbnails[], description_he/en (paragraphs: `[{weight, lines:[...]}]`), artist_ids[], `gallery_images[]`, `artists[]` (פריט: `name_en`, `thumb`, `slug` אופציונלי, `artist_page_slug` אופציונלי = קישור הכרטיס לדף אומן אחר — לשיתופי פעולה), **`curator_slug`** (אופציונלי: `slug` מ-`curators.json` — מציג סקשן אוצרת ב-`exhibition.html` מתחת לאומנים), `archive_thumbnails`, `hero_overlay_en_only` (אופציונלי: `true` = אוברליי תמונת גיבור רק `title_en`, בלי פס volume / כותרת עברית על התמונה), figma_node_* |
| `events.json` | id, slug, title_he/en, date, gallery_id, cover_image, description_he, figma_node_*, figma_file |
| `press.json` | type (`press\|event`), tag_he/en, source_he/en, subtitle_he, author_he, route, cover_image, date, homepage_visible, figma_article_*. **כתבות long-form: גוף נשאר ב-HTML, רק meta ב-JSON.** |
| `opencalls.json` | id, slug, title_en, status (`open\|archived`), deadline, city, hero_image, **אופציונליים:** `emotional_triggers` (`title_he`, `items[]`, אופציונלית `lines[]` לשבירת שורות כמו ב-Figma), `gallery_images[]` |
| `works.json` | id, title, image, artist_id, + homepage flags. **מעוקף לדפי אומן** — work data inline ב-`artists.json`. |
| `instagram.json` | snapshot זמני |
| `homepage.json` | composition layer — `*_id`/`*_ids` לפריטים מ-JSONs אחרים; בלוקים כמו `x_our_artists`, `tribe_teaser` (כותרת/קרדיטים/גלריה מעל press; **מובייל:** `gallery_images[]`, `figma_gallery_strip` `250:98`, thumbs = לייטבוקס בלי CTA — ראה `docs/components.md` §1.4.1) |
| `curators.json` | `curators[]`: `id`, `slug`, `name_en_first`/`name_en_last`, `instagram_handle`, `badge_en`, `section_heading_en`, `portrait` (`src`, `width`, `height`, `alt_he`), `exhibition_slugs[]` (סדר דסקטופ שמאל→ימין; מובייל — CSS `order` אם נדרש), `figma_desktop`/`figma_mobile` |

---

## 7. WORKFLOW לדף חדש

1. קרא `CLAUDE.md`.
2. בדוק ב-§4 sitemap אם הדף כבר רשום. אם לא — תוסיף שורה.
3. קבל URLs מ-`FIGMA_LINKS.md` (או הוסף אם חסרים).
4. ספאון 2 subagents במקביל (desktop + mobile) לקרוא Figma. Prompt:
   > "קרא את הקובץ `<path>` ב-chunks של 600 שורות. החזר blueprint מובנה: dimensions, sections (top→bottom), כל הטקסטים verbatim (כולל עברית), צבעים, imageRefs, layout (gap/padding/justify/align). אל תסכם."
5. אסוף imageRefs **ייחודיים**. **`ls images/<category>/<slug>/` קודם.** הורד ב-batches מקבילים.
6. **לפני HTML — עדכן JSONs.** הוסף entity חדש לקובץ המתאים.
7. בנה HTML יחיד עם CSS מוטמע. Pattern: `font-face → tokens → sections → media queries → casing block (conventions.md §5)`.
8. הוסף לינק לדף ב-nav של כל הדפים הקיימים (אין partial loader — copy-paste; כשמעל 8 דפים, ראה `docs/todo.md`).
9. **לפני סיום:** עבור על `docs/artist-linking.md §7` (בדיקת anchors), וודא `text-transform`/font compliance (`conventions.md §5`), והרץ perf checklist (§8.11): כל `<img>` עם `src="*.webp"` + `width`/`height` + `loading="lazy" decoding="async"` (חוץ מה-LCP שמקבל `fetchpriority="high"`).
10. עדכן: §4 sitemap status, §6 אם הוספת שדה, `docs/lessons.md §4` אם יש לקח חדש.

**שיתוף קבצים:** לפני edit ל-`index.html`, `data/site.json`, `CLAUDE.md`, או כל קובץ shared — **Re-Read קודם**. סוכנים מקבילים יוצרים race conditions.

---

## 8. כללי-זהב (אסור לשבור) 🔴

1. **לא משכפלים תוכן** מ-JSON ל-HTML. שדה חסר → תוסיף ל-JSON.
2. **לא Google Fonts** כתחליף לפונטים מקומיים. **גם לא Inter/sans-serif כברירת מחדל** — אם צריך גופן ללא-Copperplate, להוריד מקומית.
3. **🔴 כל אנגלית = Copperplate UPPERCASE** — כולל אימיילים, handles, URLs, שמות אומנים, caption. הפרה = bug. פרטים ב-`docs/conventions.md §5`.
4. **לא Figma node IDs ב-CSS/HTML.** רק ב-JSONs (כ-meta) וכאן.
5. **לא לשנות slugs** של entities שכבר קיימים.
6. **לא לעגל pixel values** מהפיגמה.
7. **לא לדרוס תמונות קיימות** — `portrait-v2.webp` אם הצילום שונה. (מקור גולמי ב-`_originals/`, gitignored; ב-`images/` רק WebP+AVIF.)
8. **Re-Read לפני edit** של קובץ shared (`index.html`, `data/site.json`, `CLAUDE.md`).
9. **🔴 כל אזכור של אומן חייב להיות קישור** לדף האומן (`pages/artists/<slug>.html`). פרטים ב-`docs/artist-linking.md` — **קרא לפני סיום משימה**.
10. **לא לבנות קומפוננטה שכבר קיימת** (lightbox, gallery, carousel). `docs/components.md` הוא ה-source of truth.
11. **🔴 Perf checklist לכל `<img>`:**
    - `src="...webp"` (לא `.png`. `picture-upgrade.js` מוסיף source ל-AVIF אוטומטית.)
    - `width="N" height="N"` (מהפיקסלים האמיתיים, מונע CLS).
    - `loading="lazy" decoding="async"` — חוץ מה-img הראשון בדף.
    - ה-img הראשון בדף = ה-LCP, מקבל `fetchpriority="high"` במקום `loading="lazy"`.
    - **תמונה ≥80KB וגם ≥800px רוחב → חובה srcset:** צור וריאנטים `<name>-{480,768,1080}w.webp+avif` (רק רחבים מ-90% מהמקור: `magick src.webp -resize 480x -strip -quality 85 out.webp`, avif עם `-quality 60`), והוסף `srcset="...-480w.webp 480w, ..., <name>.webp <naturalW>w" sizes="100vw"`. `picture-upgrade.js` ממפה את ה-srcset ל-AVIF אוטומטית — חובה ש**כל** וריאנט webp יהיה לו אח avif.
12. **כן** לעדכן את הקובץ הזה כש-state משתנה (sitemap, golden rules, contracts).

---

> *"Yes, the files are everywhere — but the system is in your head. Document it."*
