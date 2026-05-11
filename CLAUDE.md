# CLAUDE.md — Zielinski & Rozen Art Galleries (PROJECT SPINE)

> **חובה לקרוא לפני כל משימה**, וגם **לעדכן** בסיום (§12).
> single source of truth לכל סוכן בפרויקט.

---

## 0. TL;DR לסוכנים חדשים

1. אתה בונה **דף אחד מתוך אתר**. לא פרויקט בועתי.
2. **🔗 קישורי Figma לכל הדפים נמצאים ב-[`FIGMA_LINKS.md`](./FIGMA_LINKS.md).** לפני שאתה מתחיל לעבוד על דף — תפתח שם ותעתיק את הקישורים (desktop + mobile). אם הדף חסר ב-FIGMA_LINKS — תוסיף את הקישורים שקיבלת מהמשתמש לפני שאתה מתחיל.
3. פונטים ב-`./פונטים/` — תמיד `@font-face`, אסור Google Fonts.
4. נתונים מ-`./data/*.json` ולא inline ב-HTML. שדה חסר → תוסיף ל-JSON קודם.
5. תמונות ב-`./images/<category>/<slug>/` (§5). **לפני הורדה — `ls` קודם.** כל מדיית 3 דפי ה-press (`walla`, `press-1`, `time-out`) כבר קיימת (24 קבצים).
6. **כל דף = שני לינקים מהמשתמש (desktop + mobile)** תמיד. **אל תזהה לפי שם node** — הוא משקר. תזהה לפי `absoluteBoundingBox.width`: 1440=desktop, 390=mobile.
7. **רספונסיביות חובה.** מובייל ≠ דסקטופ מצומצם — לעיתים sections ייחודיים, סדר שונה, overlay אחר. תבדוק את שני ה-frames לפני CSS.
8. **אינטראקטיביות נסתרת.** Figma סטטי; באתר רכיבים אינטראקטיביים (גלילה אופקית, lightbox, hover scale). ראה §12.1 Static-vs-dynamic policy. **שאל את המשתמש** אם לא ברור.
9. **כל אנגלית באתר = UPPERCASE.** הכלל ב-CSS גלובלי (§9.2). אסור לבטל מקומית.
10. בסוף — תוסיף לקח ל-§12.2 (אם חדש; אחרת תאחד), עדכן sitemap (§3) אם נוסף דף, **עדכן `FIGMA_LINKS.md`** אם גילית URL חדש/שגוי, ו-JSON schemas (§7) אם נוסף שדה.

---

## 1. מה אנחנו בונים

**אתר Zielinski & Rozen** — רשת גלריות אומנות בתל אביב (3 גלריות), מותג בישום שגם הוא אומנותי. ארז זילינסקי־רוזן (founder) הוא אמן בעצמו.

תוכן: **תערוכות**, **אומנים** (18), **גלריות פיזיות** (3), **מאמרי עיתונות**, **אירועים**, **קולות קוראים**, **works**.

עברית + אנגלית: עברית = body content; אנגלית = כותרות, ניווט, branding.

Stack: **HTML + CSS** (single-file), נתונים ב-`data/*.json`. JSONs מחקים schema של CMS עתידי.

---

## 2. Figma files

> **📌 הקישורים הישירים לכל דף נמצאים ב-[`FIGMA_LINKS.md`](./FIGMA_LINKS.md).** אל תחפש URL ב-CLAUDE.md — לך לשם.

שני קבצים. **תזהה תמיד מה-URL של המשתמש** (`figma.com/design/<FILEKEY>/...`), לא לפי node-id (שני הקבצים ממוספרים מאפס).

| Key | שם | תוכן |
|---|---|---|
| `XhGH289YTRcW811wrufRJz` | **landing** | homepage (`144:317/2`), exhibitions (`119:156/331/435/642`), artist (`119:3`), press (`119:740/868`, `119:972/1163`, `119:1340/1433`), "the open call" section (`144:355/38`). |
| `Zn3N3mBQkbYER7tTJMbCcz` | **גרפיקות שונות** | about, works, artist pages, events, opencalls, lightbox states. Canvas `1213:2`. |

**MCP:** `mcp__figma__get_figma_data`, `mcp__figma__download_figma_images`. `fileKey` הוא parameter — אסור hardcode.

**node-id ב-URL = `119-156`. ב-API = `119:156`.** (dash ↔ colon)

**אם אתה רואה URL חדש שלא ב-`FIGMA_LINKS.md` — תעדכן אותו שם** לפני שתמשיך.

---

## 3. SITEMAP

### 3.1 דפים

| Route | שם | Figma desktop | Figma mobile | סטטוס |
|---|---|---|---|---|
| `/` | Homepage | `XhGH...::144:317` (canonical; older `Zn3N...::1213:3093`) | `XhGH...::144:2` (canonical; older `Zn3N...::1213:3360`) | ✅ `index.html` — URLs ב-`FIGMA_LINKS.md` |
| `/about` | Biography of Erez | `1213:2970` | `1213:2888` | ✅ `pages/about.html` |
| `/works` | The Art Works | `1213:2615` (frame 1440 — name lies) / alt `1213:2725`, `1213:2764` | (responsive from desktop) | ✅ `pages/works.html` |
| `/galleries` | Galleries index | — | — | ⏳ (אולי anchor בהומפייג') |
| `/galleries/:slug` | Single gallery | — | — | ⏳ — **לא מחובר ל-`1213:2725/2820/2854`. אלו עיצובי lightbox, לא דפים.** ראה §15. |
| `/exhibitions` | Index | (כיום ארכיון בהומפייג') | — | ⏳ |
| `/exhibitions/loneliness` | Single | `XhGH...::119:156` | `XhGH...::119:331` | ✅ `pages/exhibition.html?id=loneliness` |
| `/exhibitions/how-many` | Single | `XhGH...::119:435` | `XhGH...::119:642` | ✅ `pages/exhibition.html?id=how-many` |
| `/artists` | All artists | (אולי `1213:4547`) | — | ⏳ |
| `/artists/:slug` | Single artist (×18) | `1213:3` (alon = canonical desktop) | `1213:3672` (`artist-pages`: 13 frames @ 390px) | ✅ 13 figma + 5 placeholder. Template `pages/artists/artist.html` + per-slug shells. |
| `/press` | Index | — | — | ⏳ |
| `/press/walla` | Article | `XhGH...::119:740` | `XhGH...::119:868` | ✅ `pages/press/walla.html` |
| `/press/press-1` | Article (קורין אברהם) | `XhGH...::119:972` | `XhGH...::119:1163` | ✅ `pages/press/press-1.html` |
| `/press/time-out` | Article | `XhGH...::119:1340` | `XhGH...::119:1433` | ✅ `pages/press/time-out.html` |
| `/events/ktuba` | Event (live art performance by zohar ron) | `XhGH...::119:1651` (canonical 2026-05-11; legacy `Zn3N...::1213:1644`) | `XhGH...::119:1509` (canonical; legacy `Zn3N...::1213:1502`) | ✅ `pages/events/ktuba.html` |
| `/events/loneliness` | Event (opening of loneliness exhibition) | `1213:1873` | `1213:2099` | ✅ נבנה (`pages/events/loneliness.html`) — 2026-05-11 |
| `/opencall` | Index | — | — | ⏳ |
| `/opencall/the-peeler` | Single (+ emotional-triggers list, bottom gallery) | `1213:2417` | `1213:2518` | ✅ `pages/opencall.html?id=the-peeler` |
| `/opencall/how-many` | Single | `1213:2340` | `1213:2263` | ✅ `pages/opencall.html?id=how-many` |
| `/contact` | Form | — | — | ⏳ |
| `/accessibility` | Statement | — | — | ⏳ |

### 3.2 היררכיה

```
Site
├── Homepage
├── About
├── Galleries (medina פתוחה, dizengoff + flea-market coming-soon)
├── Exhibitions (loneliness=current, how-many=upcoming, archive)
├── Artists (18: 13 figma + 5 placeholder)
├── Works (artwork inventory; tied to artists)
├── Press & Events
├── Open Calls (the-peeler, how-many)
├── Contact
└── Accessibility
```

### 3.3 סטטי vs דינמי

**סטטי (shell):** brand, nav, footer, newsletter copy, copyright, color palette + typography. ב-`data/site.json` או CSS.

**דינמי (CMS-bound, ב-JSONs):** galleries, artists, exhibitions, events, press, opencalls, works, instagram, homepage curation, announcement.

**עיקרון:** תוכן שעשוי להשתנות בלי שינוי מבני → דינמי, צריך JSON. חלק מה-shell → סטטי.

---

## 4. STACK & FILE LAYOUT

```
.
├── index.html              # Homepage entry
├── pages/                  # /about.html, /works.html, /exhibition.html, /opencall.html, /artists/*, /press/*
├── components/             # artwork-lightbox.{css,js} (§15)
├── data/                   # JSON content
│   ├── site.json, homepage.json
│   ├── galleries.json, artists.json, exhibitions.json
│   ├── events.json, press.json, opencalls.json, works.json
│   ├── instagram.json
│   └── _schema/            # (TBD)
├── images/
│   ├── brand/, homepage/
│   ├── artists/<slug>/, galleries/<slug>/, exhibitions/<slug>/
│   ├── works/grid/, opencalls/<slug>/, press/, events/, instagram/
│   └── exhibitions/archive/
├── פונטים/                 # Copperplate {300/400/700/900}, FbEzmel {300/400}
└── CLAUDE.md
```

**שמות:** kebab-case, ASCII. סלאגים = `id` ב-JSON. תיקיות עברית מותרות רק לפונטים ולקובץ הזה.

**תיקיות חסרות** — תיצור. **אל תשנה חלוקה קיימת.**

---

## 5. ASSET CONVENTIONS

| תוכן | תיקייה | שמות | הערות |
|---|---|---|---|
| Hero של דף | `images/<category>/<slug>/` | `hero.png` | |
| Portrait של אומן | `images/artists/<slug>/` | `portrait.png` | square. **אל תדרוס** — שמור `portrait-v2.png` אם הצילום שונה. |
| Works של אומן | `images/artists/<slug>/works/` | `01.png`... | ממוספר |
| Works grid | `images/works/grid/` | `<artist-slug>.png` | flat |
| Gallery interior | `images/galleries/<slug>/` | `interior-01.png`... | |
| Exhibition stills | `images/exhibitions/<slug>/gallery/` | `01.png`... | |
| Press cover | `images/press/` | `<slug>-cover.png` | flat |
| Press inline | `images/press/<slug>/` | `00-hero-*.png`, `01-*.png`... | subfolder לכתבות long-form. **walla/press-1/time-out כבר קיימים — `ls` קודם.** |
| Event cover | `images/events/` | `<slug>-cover.png` | flat — homepage thumb only |
| Event page images (inline) | `images/events/<slug>/` | `hero.png`, `invite-*.png`, `second-*.png`, `atmosphere.png`, `opening-*.png` | **קיים:** `images/events/loneliness/` (22 קבצים). אל תוריד מחדש. |
| Open call hero/gallery | `images/opencalls/<slug>/` | `hero.png`, `gallery-01.png`... | subfolder per slug |
| Instagram | `images/instagram/` | `1.png`-`9.png` | |

**Logo:** `images/brand/logo.svg` (TODO). **איקונים:** inline SVG ב-HTML.

---

## 6. DESIGN TOKENS (אסור לשנות)

### 6.1 צבעים

```css
--white:#FFFFFF; --ink:#1B1B1B; --bg-grey:#EEF0EF;
--grey-mid:#808080; --artist:#828282; --copy-grey:#6B7280;
--sep:#EFEFEF; --divider:#D8D8D8;  /* about, artist bio split */
--slide-active:#515151;             /* about triptych dots */
--link:#2D3BD5;                     /* press inline links */
/* Overlays */
rgba(27,27,27,0.55)   /* gallery 'coming soon' desktop */
rgba(27,27,27,0.6)    /* mobile coming-soon */
linear-gradient(180deg, rgba(102,102,102,0) 0%, rgba(0,0,0,0.8) 81%)
```

### 6.2 פונטים

- **Copperplate** (`./פונטים/Copperplate*.{otf,ttf}`) — אנגלית. 300/400/700/900.
- **FbEzmel** (`./פונטים/FbEzmel-*.otf`) — עברית. 300/400.
- **Inter** (Google) — רק לכפתור `SUBSCRIBE` (12px, ls 10%, 400).

תמיד `@font-face` בקובץ. אסור Google substitutes (Cormorant/Frank Ruhl).

### 6.3 Spacing / Layout

- Desktop max-width **1440px**, padding **96px**.
- Tablet (≤1100): 48px.
- Mobile (≤768): 16px.
- Small mobile (≤400): 16px + font scale.
- **Border-radius: 0** בכל מקום. **אין shadows.**

### 6.4 Typography scales

| Element | Desktop | Mobile | Font | Weight |
|---|---|---|---|---|
| Hero title | 64 | 36 | Copperplate | 700/300 |
| Section bold (b) | 36 | 36-58 | Copperplate | 700 |
| Section light (l) | 36 | 36-91 | Copperplate | 300 |
| Body Hebrew | 18 | 16 | FbEzmel | 300/400 |
| Nav links | 14 | (hamburger) | Copperplate | 300 |
| Press desc | 16 | 14 | FbEzmel | 400 |
| Press tag | 14 | 14 | FbEzmel/Copperplate | 300 |
| Date inline | 14 | 14 | Copperplate | 300 |
| Newsletter title | 24/32 | 20/28 | Copperplate | 400 |
| SUBSCRIBE | 12/16 ls10% | same | Inter | 400 |
| Copyright | 11/16 | 11/16.5 | Copperplate | 300 |
| Big artwork word | 80 | 36 | Copperplate | 700 |

**אל תעגל ערכים לא-עגולים** (`497.78`, `191.52`, `18.99`, `121.52`, `12.66`, `6.33`...).

---

## 7. JSON DATA CONTRACTS

**עיקרון:** דף קורא JSONs, לא מטמיע inline. שדה חסר → תוסיף ל-JSON לפני שימוש. שדה חדש → לכל הרשומות (null אם לא ידוע).

| Schema | שדות עיקריים |
|---|---|
| `site.json` | brand, nav, footer, announcement, social — **גלובלי בכל דף** |
| `galleries.json` | id, slug, name_he/en, address_he/en, status (`open\|coming-soon\|closed`), hours[], image_hero |
| `artists.json` | id, slug, name_he/en, portrait, bio_he/en, works[] (objects: `{id,title,image,year?,medium?}` — inline, לא ref ל-works.json), instagram_handle, hero_images[] (ל-collab cards), figma_artist_page_desktop/mobile, homepage_featured |
| `exhibitions.json` | id, slug, title_en, subtitle_he, status (`current\|upcoming\|archived`), gallery_id, start/end_date, hero_image, thumbnails[], description_he/en (**מערך paragraphs:** `[{weight:"regular"\|"light"\|"heading-en", lines:[...]}]`), artist_ids[], figma_node_*. כולל `archive_thumbnails` ל-homepage. |
| `events.json` | id, slug, title_he/en, date, gallery_id, cover_image, description_he, figma_node_* |
| `press.json` | type (`press\|event`), tag_he/en, source_he/en (press), subtitle_he, author_he, route, cover_image, date, homepage_visible, figma_article_desktop/mobile. **כתבות long-form: גוף נשאר ב-HTML, רק meta ב-JSON.** |
| `opencalls.json` | id, slug, title_en, status (`open\|archived`), deadline, city, hero_image, **שדות אופציונליים:** `emotional_triggers[]`, `gallery_images[]` (הרנדרר מדלג אם null) |
| `works.json` | id, title, image, artist_id, + homepage flags (`homepage_word`, `homepage_word_mobile`, `is_cta`). **מעוקף לדפי אומן** — work data inline ב-`artists.json`. |
| `instagram.json` | snapshot זמני; בעתיד IG Graph API |
| `homepage.json` | composition layer — `*_id`/`*_ids` לפריטים מ-JSONs אחרים. |

---

## 8. NAMING & SLUGS

- **slug = id = שם תיקייה** (kebab-case, ASCII).
- אומנים: `firstname-lastname` בלי תארים (`nir-giorgio-levin`).
- תערוכות: שם מקוצר באנגלית (`loneliness`, `how-many`).
- גלריות: `medina`, `dizengoff`, `flea-market`.
- מאמרים: `<source>-<topic>`.

**שינוי slug בדיעבד אסור** אחרי פרסום. alias ב-JSON אם חייב.

---

## 9. RTL / Casing

### 9.1 RTL (עברית)

- `dir="rtl"` או `direction:rtl` **+** `text-align:right`. רק אחד מהם לא מספיק.
- ב-flex container עם RTL children: לעיתים `align-items:flex-end` הוא מה שמיישר (text-align לא מצביע).
- תאריכים/מספרים/מילים-לועזיות בתוך עברית: `<bdi>` או div עם `direction:ltr`.
- `\n` ו-`\L` ממחרוזות Figma → `<br>`.

### 9.2 Casing & Font — ⚠️ כלל גלובלי קריטי

**כל אנגלית באתר = Copperplate באותיות גדולות (UPPERCASE).** ללא חריגות. גובר על `textCase` ב-Figma, על איך שהמעצב כתב, ועל כל סוורס-סטרינג ב-JSON/HTML.

זה כולל גם: **כתובות מייל**, **handles** (`@user`), **URLs מוצגות**, **מספרי דגם**, **שמות אומנים באנגלית**, **תגיות**, **תאריכי לעז (`Volume 1`)**, **caption של תמונה**, וכו'. אם זה אנגלית — זה Copperplate UPPER.

**מימוש (חובה בכל קובץ HTML חדש):**
```css
body{ font-family: var(--cop); text-transform: uppercase; }
.heb, .heb *, [dir="rtl"], [dir="rtl"] *{ text-transform: none; font-family: var(--heb); }
```

**אסור (כל אחד מאלה הוא bug, גם אם המעצב ביקש):**
- `text-transform: lowercase` או `capitalize` על אלמנט שמכיל אנגלית.
- `text-transform: none` על אלמנט עם אנגלית (מבטל את ה-body default).
- שימוש בפונט אנגלי שאינו Copperplate (Solway, Inter, Times, system serif...). היחיד שמותר חוץ מ-Copperplate: **Inter בלבד לכפתור SUBSCRIBE** (§6.2).
- `font-family: var(--heb)` על אלמנט שמכיל אנגלית טהורה.
- שילובים נסתרים: `.heb` עוטף עם אנגלית בתוך — האנגלית **חייבת** `<span class="lat">` שמחזיר Copperplate+uppercase.

**מותר (חריגים מותרים):**
- `text-transform: none` על אלמנט עם **מספרים בלבד** (תאריכים `17/2/2026`, שעות `19:00-21:30`, מספרי דגם נטו) — אין אנגלית אז אין השפעה.
- שמות קבצים, paths, slugs, IDs ב-JSON — lowercase תמיד (לא טקסט שמוצג למשתמש).
- source strings ב-JSON/HTML יכולים להישאר Title Case/lowercase לקריאות בעריכה — ה-CSS משנה רינדור.
- **עברית פטורה** (אין uppercase/lowercase) — `.heb` / `[dir="rtl"]` משאירים `text-transform:none`.

**בדיקה לסוכן:**
```bash
# מוצא הפרות — צריך להחזיר ריק:
grep -rn "text-transform[: ]*\(lowercase\|capitalize\)" --include="*.html" --include="*.css" .
grep -rn "font-family.*\(Solway\|Times New Roman[^,]\|serif$\)" --include="*.html" --include="*.css" . | grep -v "var(--cop)\|var(--heb)"
```

---

## 10. RESPONSIVE BREAKPOINTS

```css
/* Default: 1440px desktop */
@media (max-width: 1100px) { /* tablet */ }
@media (max-width: 768px)  { /* mobile */ }
@media (max-width: 400px)  { /* small mobile */ }
```

**מובייל ≠ דסקטופ מצומצם.** המעצב מוסיף sections ייחודיים, מסדר אחרת, או משנה overlay. דוגמאות מההומפייג': "קול קורא" CTA, "exhibitions/now", "our artists", פסי גלילה אופקיים, "ART" באותיות גדולות. **תמיד בדוק שני frames לפני CSS.**

---

## 11. WORKFLOW לסוכן שבונה דף חדש

1. קרא `CLAUDE.md`.
2. ודא שהדף ב-§3. אם לא — תוסיף שורה.
3. ספאון 2 subagents במקביל (desktop + mobile) לקרוא Figma. Prompt:
   > "קרא את הקובץ `<path>` ב-chunks של 600 שורות. החזר blueprint מובנה: dimensions, sections (top→bottom), כל הטקסטים verbatim (כולל עברית), צבעים, imageRefs, layout (gap/padding/justify/align). אל תסכם."
4. אסוף imageRefs **ייחודיים** (לא בקיימים). **`ls images/<category>/<slug>/` קודם.** הורד ב-batches מקבילים.
5. **לפני HTML — עדכן JSONs.** הוסף entity חדש לקובץ המתאים.
6. בנה HTML יחיד עם CSS מוטמע. Pattern: `font-face → tokens → sections → media queries → §9.2 casing block`.
7. הוסף לינק לדף ב-nav של כל הדפים הקיימים (אין partial loader — copy-paste; כשיגיע מעל 8 דפים, ראה §13).
8. בדוק rendered output: casing, RTL flow, breakpoints.
9. עדכן: §3 status, §7 אם הוספת שדה, §12.2 לקח חדש (או חיזוק לקיים אם זהה).

**שיתוף קבצים:** לפני edit ל-`index.html`, `data/site.json`, `CLAUDE.md`, או כל קובץ shared — **Re-Read קודם**. סוכנים מקבילים יוצרים race conditions.

---

## 12. POLICIES & LESSONS

### 12.1 Static-vs-Dynamic policy

ה-Figma הוא snapshot סטטי. **האתר לא.** לכל section, החלט:

**אינטראקטיבי (אסור לשלוח כתמונה שטוחה):**
- grids של artworks → **lightbox** (§15).
- thumbnails מרובים לתערוכה → **carousel/lightbox**.
- שורות אופקיות (Instagram, archive, artists strip) → **scroll-snap horizontal**. גם בדסקטופ אם items > רוחב.
- גלריות עם `coming soon` → overlay כהה non-clickable; הפתוחה clickable.
- Newsletter form → `event.preventDefault()` עד backend.
- Nav במובייל → hamburger drawer (`.nav-links` כ-fixed inset:0 + `transform:translateX(100%)` → 0).

**Micro-interactions (תמיד הוסף):**
- Card images: `transform:scale(1.04)` ב-hover, `transition:.6-.8s`.
- Links: opacity .6-.7 ב-hover.
- Outline buttons: invert ב-hover.

**סטטי (אל תזייף אינטראקטיביות):**
- Hero, taglines, copyright — לא animations.
- Section headers — לא marquee/scroll animations.
- Overlays/gradients דקורטיביים — לא clickable.

**Rule of thumb:** Figma מציג תמונה curated אחת במקום שבאתר יהיו many → צריך אינטראקציה.

**Implementation default:** vanilla JS, inline `<script>` בסוף body, ללא תלויות. הדוגמה הקנונית: `components/artwork-lightbox.js`.

### 12.2 Recurring lessons (מאוחד — אם נתקלת בלקח קיים, חזק אותו; אל תכפיל)

**Figma quirks:**
- **שמות nodes משקרים על device.** `the art works-phone` היה 1440, `artist1-13` הם 390. תמיד `absoluteBoundingBox.width`. 1440=desktop, 390=mobile.
- **שני קבצי Figma עם תוכן מראה.** `XhGH...::119:3` ≡ `Zn3N...::1213:3` (artist-alon). תאמת `fileKey` מה-URL.
- **JSON ענק → subagents חובה.** קריאה ישירה של frames גדולים נכשלת על token budget. דפי-יחיד קטנים (about) נכנסים ישירות.
- **`depth:1-2`** לסקירת canvas — מספיק בלי להציף קונטקסט.
- **`{ts1}/{ts2}/{ts3}/{ts4}` markers** = textCase metadata בעיקר. רנדר כ-`<span class="lat">` (Copperplate Light), אלא אם זה לינק אמיתי → `<a>` עם `var(--link)`.
- **טעויות עיצוב ב-Figma** (כותרת loneliness בתוך how-many; caption של אומן אחד על תמונה של אחר; 4 imageRefs בערימה כאשר רק אחד רלוונטי) — **שיקול דעת**, בחר את המתאים לתמונה/JSON, לא מעתיק טעות.
- **`gap` שלילי** = `margin-top` שלילי על הילד (overlap מכוון בהומפייג').
- **`\n`/`\L`** → `<br>`.

**Image handling:**
- **stacked imageRefs ב-fill** — רוב artist/hero images כוללים 2-4 imageRefs (אמיתית + placeholder Figma כמו `cb002e02e2090...`, `41074587...`, או hero של דף אחר). **בחר לפי סמנטיקה, לא לפי "אחרון בסטאק".** הורד רק את הרלוונטי.
- **`cropTransform` לא חובה** — `object-fit:cover` ב-CSS פותר. הוסף רק אם תוצאה ויזואלית שונה דרסטית.
- **בדוק קיום + hash compare לפני הנחת reuse.** ב-about, 7/7 התמונות היו חדשות למרות שצפיתי ל-hero משותף.
- **`portrait.png` קיים → אל תדרוס.** שמור figma version כ-`portrait-v2.png` ועדכן ב-`artists.json`.
- **נתיבי קבצים בעברית** (`url("פונטים/...")`) עובדים בדפדפנים מודרניים בלי URL-encoding.

**Page architecture:**
- **Dynamic template + thin shells** לסטים גדולים. דפוס: `pages/<type>.html` קורא `?slug=`/`?id=` מ-URL + fetches JSON. shells per-slug `location.replace()`. דוגמאות: `pages/exhibition.html`, `pages/artists/artist.html`, `pages/opencall.html`. **כניסה חדשה = JSON entry, אין שינוי קוד.**
- **שדות אופציונליים ב-JSON** מאפשרים variant per slug בלי קוד-מותנה (לדוגמה `opencalls.json::emotional_triggers`, `gallery_images`). הרנדרר בודק קיום ומדלג בשקט.
- **fetch + inline JSON fallback.** ב-`file://` חלק מהדפדפנים חוסמים `fetch`. הטמע `<script type="application/json" id="fallback-...">`. **כשמעדכנים JSON — חייבים לעדכן גם fallback** עד שתהיה build infra (TODO §13).
- **Shared shell pattern** (nav+drawer+footer+JS): מועתק 1:1 בין דפים. אין partial loader. שינוי גלובלי = search-replace בכל הקבצים. **מעל 8 דפים — לעבור ל-partial loader.**
- **Hamburger drawer:** `.nav-links` הקיים *הוא* ה-drawer. אל תשכפל את הרשימה. `body.menu-open{overflow:hidden}`, `visibility:hidden` על drawer סגור (focus trap).
- **Logo → home בכל דף** עם `aria-label="home"`.
- **תוכן long-form (כתבות 5000+ מילים) נשאר ב-HTML**, רק meta ב-JSON. חורג מ-§7 ה-strict; מעשי. CMS עתידי יעביר.
- **דסקטופ + מובייל עם תוכן שונה → באתר חי, אחד.** Figma הוא snapshot. הצג את כל התוכן בכל ה-viewports באופן רספונסיבי.
- **`exhibitions` ב-nav** מצביע כרגע ל-`pages/exhibition.html?id=loneliness` (התערוכה הנוכחית). כשייבנה `/exhibitions` index — search-replace בכל 7 הדפים.

**Lightbox (§15):**
- **Event delegation** על `document.click` → תוכן מוזרק דינמית "תופס" בלי handlers ייעודיים. אחרי `innerHTML=...` קרא `ArtworkLightbox.refreshFocusable()` רק לנגישות-מקלדת.
- **font-stack של `.alb` הוא Copperplate בלבד** — עברית ב-caption נופלת ל-fallback מערכת. הוסף FbEzmel ב-`artwork-lightbox.css` אם נדרש.

**Hebrew / data:**
- **שמות עבריים ב-Figma הם source of truth** ל-`name_he`. תמיד תמשוך, אל תשאיר null.
- **אומנים חדשים שמתגלים** בעת בנייה — עדכן `artists.json`, אל תתעלם.

### 12.3 לקח חדש (template)

הוסף **רק** אם הוא לא חלק מ-§12.2. הפורמט: `**<topic>:** <one-line lesson>.` אם קיים כבר — תחזק אותו ב-§12.2, אל תוסיף שורה חדשה.

### 12.4 לקחים אחרונים

- **2026-05-11 — Event page loneliness (`/events/loneliness`):** נבנה ב-`pages/events/loneliness.html` מ-Figma frames `1213:1873`+`1213:2099` (קובץ ראשי `Zn3N3mBQkbYER7tTJMbCcz`). 22 imageRefs ל-`images/events/loneliness/`. כתבת אירוע = hero בנד אפור עם image card + טקסט גוף ארוך, אז שני slideshows ("the invitation" + ללא header), אז the atmosphere (image+artists list), אז 14-thumb opening grid. במובייל: hero הופך לתמונה במסך מלא + טקסט אחרי, slideshow הופך ל-3 תמונות עם peek-from-sides (left:-74, right:315 — יוצא מ-viewport מכוון), atmosphere image full-bleed עם artists text מתחת, ו-moments grid הופך לסקרול אופקי 200px cards.
- **2026-05-11 — Share + Bookmark feature:** מומומש בתוך `components/site-chrome.{js,css}` (single source of truth). כל דף press/event שמכיל `<site-header>` מקבל בחינם: (1) אייקון סימנייה בהידר עם count badge, (2) modal עם רשימת saved, (3) toast לפידבק. הדף עצמו רק מציין את ה-item שלו דרך `data-item-id`/`data-item-title`/`data-item-date` על ה-`[data-bookmark-toggle]` button + `[data-share-btn]` ליד. הלוגיקה: localStorage key `zr-bookmarks` JSON array `{id,title,url,date}`. ה-share button משתמש ב-`navigator.share()` נתיב ראשי, fallback ל-`navigator.clipboard.writeText()` עם toast "LINK COPIED".
- **2026-05-11 — Header bookmark icon = position:absolute:** האייקון יושב ב-`position:absolute; right:100%` של `.nav-right` (wrapper של nav-links + bookmark + hamburger). מובן: דסקטופ הוא יושב משמאל ל-nav-links (התפריט), מובייל הוא יושב משמאל להמבורגר. **Default `display:none`** — מופיע רק כשיש `.has-items` class (נוסף כשcount>0). מאחר וה-positioning הוא absolute, ה-show/hide לא מזיז שום אלמנט אחר מהמקום. הניהול ב-JS דרך `refreshCount()` ב-site-chrome.js.
- **2026-05-11 — Reusable `<image-gallery>`:** קומפוננטה גנרית ב-`components/gallery.{js,css}` שמחליפה את ה-"slideshow + dots" הסטטיים של ה-Figma בכל מקום שצריך. דף `exhibition.html` הוא הצרכן הראשון — `gallery_images[]` ב-`data/exhibitions.json` (וב-embedded fallback JSON). תיעוד מלא ב-§16. **כלל אצבע:** ב-Figma מופיעה תמונה אחת + dots → תמיד תשתמש ב-`<image-gallery>` (ה-Figma שטוח אבל זה תמיד carousel).
- **2026-05-11 — Event page ktuba (`/events/ktuba`):** נבנה ב-`pages/events/ktuba.html` מ-Figma frames חדשים ב-קובץ `landing` (`XhGH289YTRcW811wrufRJz`): desktop `119:1651`, mobile `119:1509`. הגרסה הישנה ב-`Zn3N…::1213:1644/1502` הוצגה ב-CLAUDE§3.1 + `events.json::figma_node_*` ועודכנה ל-canonical החדש (הישנה נשמרה כ-legacy בטבלאות + ב-FIGMA_LINKS.md). 4 imageRefs ל-`images/events/ktuba/` (hero + 3 slideshow) + 10 portraits ל-`images/events/ktuba/artists/` (skipped card-4 קוסטה מגרקיס שיש לו רק placeholder ID `41074587…`). מבנה: hero grey-band עם image card 492×744 (title overlay + `EXHIBITION VOLUME 1`) ועברי-עברית title+meta+poem בעמודה השנייה; slideshow band peek-main-peek 7-dots (3 צילומים אמיתיים, 4 dots placeholder לעתיד); paragraph תיאור; artists strip עם horizontal-scroll 11 כרטיסים. במובייל: image card הופך full-width 520h למעלה ואז title+meta+poem מתחת — דומה ל-`opencall.html` mobile order.
- **2026-05-11 — Triptych Gallery component (§16ב):** הוצא מ-about.html (היה inline `atc-*` + script ייעודי) ל-`components/triptych-gallery.{css,js}`. שתי דפים צרכנים: `about.html` (7 פורטרטים של ארז) + `events/ktuba.html` (slideshow band, 7 dots על 3 צילומים אמיתיים). העיצוב מתבסס על CSS vars (`--tri-max-w`, `--tri-center-w/h`, `--tri-peek-w/h/left/right/opacity`) שמאפשרים customization פר-דף בלי לדרוס positioning מהקומפוננטה. רואה את ה-`<image-gallery>` (1 slide visible) ו-`stacked-gallery` (2 items עם hover-swap) כקומפוננטות אחיות שמטפלות בתבניות אחרות. **כלל אצבע:** Figma מראה תמונה מרכזית גדולה + שתי peek בצדדים + dots → `<div class="tri">`.
- **2026-05-11 — Figma frame moves across files:** ה-frames של ktuba הועברו מ-קובץ "graphics" (`Zn3N3mBQkbYER7tTJMbCcz`) ל-קובץ "landing" (`XhGH289YTRcW811wrufRJz`) על ידי המעצב. ה-figma_node_id מקבל **משמעות רק יחד עם fileKey** — לעולם אל תאמין ל-node-id בלי לאמת מה-URL של המשתמש. ה-sitemap §3.1 צריך לשמור גם canonical וגם legacy בעמודות `Figma desktop/mobile` (`new (canonical 2026-05-11; legacy old)`) כדי לעקוב אחרי history של moves. עדכון `data/events.json::figma_file` field נוסף שיכיל את ה-fileKey כדי שלא נצטרך לנחש.
- **2026-05-11 — Mobile horizontal-scroll מ-titles גדולים:** הומפייג' נתן scroll אופקי במובייל בגלל `.ex-now .titles .l` (91px "now") ו-`.exhibitions-titles .b` (58px "exhibitions" = 11 תווים × ~32px ב-Copperplate Bold = ~322px > 288px available אחרי padding 16+16 ב-viewport 320px). **הפתרון:** (1) `html{overflow-x:clip}` + `body{overflow-x:clip;max-width:100vw}` — `overflow-x:hidden` רק על body לא תמיד מספיק כי html יכול לקבל את ה-scroll. (2) החלפת fixed-px ב-`clamp(min,vw-value,max)` — `font-size:clamp(48px,20vw,91px)` במקום `91px`. ה-`vw-value` מחושב מהעיצוב: `figma_px / figma_viewport × 100` (לדוגמה 91/390≈23, מעוגל ל-20 לבטיחות). זה מבטל את הצורך ב-`@media (max-width:400px)` overrides נפרדים — clamp רץ ברצף מ-320 ועד הרוחב המקסימלי. (3) הוסף `white-space:nowrap` למילים שאסור שיתפצלו ו-`max-width:100%;overflow:hidden` על הקונטיינר כרשת ביטחון. **חוק כללי:** לכל font-size ≥48px ב-mobile, בדוק את אורך-המילה × רוחב-תו-משוער מול ה-viewport הצר ביותר (320px). אם זה לא נכנס — clamp().

---

## 13. ידוע / TODO

- [x] ~~ארכיון תערוכות בהומפייג': התאמת thumbs ↔ exhibition_id~~ — בוצע 2026-05-11: `archive_thumbnails` הפך ל-array של tabs פר-גלריה, כל tab עם `thumbs[]` שכל אחד מהם מקושר ל-`exhibition_id` ופותח את ה-artwork lightbox. medina → loneliness (4 thumbs אמיתיים). dizengoff → how-many (4 thumbs placeholder עם `_placeholder:true` — אותם קבצים, swap כשיהיו אמיתיים).
- [ ] **Dizengoff archive thumbs** — `archive_thumbnails.tabs[0]` עדיין `_placeholder:true`. כשהגלריה תיפתח ויהיו צילומים מהתערוכה — לעדכן את 4 ה-`image` paths ב-`data/exhibitions.json` *ובמקביל* ב-fallback inline JSON ב-`index.html` (id=`fallback-archive`).
- [ ] `images/brand/logo.svg` עוד לא קיים.
- [ ] `images/galleries/flea-market/hero.png` — placeholder (עותק של dizengoff).
- [ ] 5 דפי-אומן (`zohar-ron`, `eitan-goldson`, `zohar-shtrit`, `hila-loterstein`, `adi-duak`) — placeholder בלי Figma design.
- [ ] Newsletter form — `event.preventDefault()` בלבד.
- [ ] Contact + Accessibility — אין Figma.
- [ ] meta tags / OG / favicon.
- [ ] i18n switcher — data תומך (`*_he`/`*_en`), אין UI.
- [ ] JSON Schema validators ב-`data/_schema/`.
- [ ] **Build step:** הטמעת JSON אוטומטית כ-fallback בכל דף דינמי (כיום ידני).
- [ ] **Partial loader** ל-nav/footer כשנעבור 8 דפים.
- [ ] **Routing decision:** static multi-file vs SPA. **המלצה:** static פשוט עד שמשהו ידרוש דינמיקה.

---

## 14. כללי-זהב (אסור לשבור)

1. **לא משכפלים תוכן** מ-JSON ל-HTML. שדה חסר → תוסיף ל-JSON.
2. **לא Google Fonts** כתחליף לפונטים מקומיים.
3. **🔴 כל אנגלית = Copperplate UPPERCASE** (§9.2). תמיד. **בלי חריגות**: כולל אימיילים, handles, URLs, שמות אומנים, caption. הפרה = bug.
4. **לא Figma node IDs ב-CSS/HTML.** רק ב-JSONs (כ-meta) וכאן.
5. **לא לשנות slugs** של entities שכבר קיימים.
6. **לא לעגל pixel values** מהפיגמה.
7. **לא לדרוס תמונות קיימות** — `portrait-v2.png` אם הצילום שונה.
8. **Re-Read לפני edit** של קובץ shared (`index.html`, `data/site.json`, `CLAUDE.md`).
9. **🔴 כל אזכור של אומן חייב להיות קישור** לדף האומן שלו (`pages/artists/<slug>.html`). פירוט מלא: §17 — קרא והקפד **לפני** סיום כל משימה.
10. **כן** לעדכן את הקובץ הזה כשמשהו זז.

---

## 15. ARTWORK LIGHTBOX — קומפוננטה משותפת ✅

**ה-frames `1213:2725` (gallery-desktop), `1213:2820` (gallery1), `1213:2854` (gallery2) אינם דפים** — שלושת המצבים של lightbox לתמונת **יצירת אומנות**.

### 15.1 קבצים

- `components/artwork-lightbox.css` — ריספונסיב (desktop: caption מתחת, chevrons 48×48 מסביב; mobile: overlay מלא, chevrons 24×24 בקצוות).
- `components/artwork-lightbox.js` — singleton, event delegation על `document.click`. API ב-`window.ArtworkLightbox`.

### 15.2 הוספה לדף

```html
<link rel="stylesheet" href="<rel>/components/artwork-lightbox.css">
...
<script src="<rel>/components/artwork-lightbox.js" defer></script>
```
`<rel>` = `..` מ-`pages/`, `../..` מ-`pages/artists/`.

### 15.3 סימון תמונות (3 דרכים, לפי קדימות)

| Attribute | מתי |
|---|---|
| `data-artwork-id="<id>"` | יש entry ב-`data/works.json` |
| `data-artwork-src` + `data-artwork-title` + `data-artwork-artist` | inline (מהיר) |
| אין `data-artwork-*` | לא ייפתח (portrait, gallery, Instagram, press cover) |

**אופציונלי, פר-מקור (לא כולל ב-`works.json` עדיין):**

| Attribute | תוצאה ב-lightbox |
|---|---|
| `data-artwork-alt="<text>"` | פיסקה קצרה מתחת לתמונה (כללי — לא חובה להציג). מתורגם ל-`<p class="alb-alt">`; ברוחב התמונה. השמטה ⇒ לא מוצג. |
| `data-artwork-link="<href>"` | כפתור מרובע (לבן/שחור border) מתחת לתמונה, **ברוחב התמונה** (מחושב ב-JS אחרי load). |
| `data-artwork-link-label="<text>"` | טקסט הכפתור. ברירת מחדל: `"מעבר ליצירה"`. עברית מזוהה אוטומטית ומקבלת FbEzmel + dir=rtl. |

ה-CTA מצביע לדף ייעודי (תערוכה / יצירה). ב-`index.html::archive_thumbnails` כל thumb מקבל קישור ל-`pages/exhibitions/<slug>.html` (פורוורד; הדפים עוד pending).

### 15.4 גלריית prev/next

עוטף קבוצה ב-`data-artwork-gallery`. prev/next מסתובב בתוך ה-container. ללא wrapper — כל הדף.

```html
<section class="grid" data-artwork-gallery>
  <a data-artwork-src="..." data-artwork-title="..."><img></a>
</section>
```

### 15.5 תכונות

קליק / Enter / Space — פותח. חיצים — prev/next. Esc — סוגר. Swipe — prev/next במובייל. Focus trap + body scroll lock + focus restore. Preload לתמונה הבאה/קודמת.

### 15.6 אסור

- אל תבנה lightbox חדש — הקומפוננטה היא הסטנדרט.
- `data-artwork-*` רק על יצירות אומנות. **לא** portrait, gallery hero, Instagram, press cover.
- ב-`exhibition.html` thumbs של "artists" = portraits → לא lightbox.

### 15.7 API פרוגרמטי

```js
window.ArtworkLightbox.open(elOrId)
window.ArtworkLightbox.close()
window.ArtworkLightbox.refreshFocusable()  // אחרי injection דינמי (רק לנגישות-מקלדת; click עובד דרך delegation)
```

### 15.8 שילובים

| דף | סטטוס |
|---|---|
| `pages/works.html` | ✅ 12 cards (`data-artwork-gallery` על `.grid`) |
| `pages/artists/artist.html` | ✅ render dynamic של `.works-grid` |
| `pages/exhibition.html` | ❌ thumbs = portraits |
| `index.html` | ❌ tiles = typography |

### 15.9 TODO

- שדות `title`, `year`, `dimensions`, `medium` ב-`data/works.json` וב-`artists.json::works[]`.
- FbEzmel ל-`.alb` font-stack כשנדרש caption עברי.

---

## 16. IMAGE GALLERY — קרוסלת תמונות גנרית ✅

קומפוננטה שמייתרת את ה-slideshows/קרוסלות הסטטיים של ה-Figma. תמיד תשתמש בה כשמופיע ב-Figma "תמונה אחת + נקודות ניווט" — זה תמיד מצב סטטי של קרוסלה.

### 16.1 קבצים

- `components/gallery.css` — viewport, slides, arrows, dots, counter; ריספונסיב.
- `components/gallery.js` — מגדיר `<image-gallery>` custom element. אוטו-זריקת ה-CSS אם לא נטען. אין תלות ב-site-chrome.

### 16.2 שימוש בסיסי

```html
<link rel="stylesheet" href="<rel>/components/gallery.css">
...
<image-gallery aria-label="exhibition gallery">
  <img src="..." alt="">
  <img src="..." alt="">
  <img src="..." alt="">
</image-gallery>
<script src="<rel>/components/gallery.js" defer></script>
```

הקומפוננטה ממלאת את ה-parent (width:100%; height:100%). ה-parent קובע מימדים (למשל `.img-frame` בדף exhibition הוא 492×744 desktop / 100%×520 mobile).

ה-`<img>` ילדים הם ה-source of truth — JS אוסף אותם וגורר ל-slides. **graceful degradation:** אם JS לא רץ, יוצגו `<img>` רגילים.

### 16.3 Attributes

| Attribute | Default | מה זה עושה |
|---|---|---|
| `data-fit="cover\|contain"` | `cover` | object-fit לתמונות |
| `data-loop="true\|false"` | `true` | מעבר מ-last → first / first → last |
| `data-arrows="true\|false"` | `true` | חיצים דסקטופ (hover/focus) |
| `data-dots="true\|false"` | `true` | נקודות ניווט |
| `data-counter="true\|false"` | `false` | תווית "3 / 8" בפינה |
| `aria-label="..."` | — | לנגישות |

### 16.4 פיצ'רים

- **Swipe** עם Pointer Events (mouse drag + touch). threshold 12% מרוחב או 40px.
- **חיצים** (← →) במקלדת, **Home/End** לקצוות.
- **לחיצה על dot** — קופץ לשקופית.
- **לולאה** — מסיים → מתחיל ולהפך.
- **ResizeObserver** — שומר transform נכון בכל שינוי width.
- **Lazy loading** — `loading="lazy"` על תמונה 2+ אוטומטית.

### 16.5 API פרוגרמטי

```js
const g = document.querySelector('image-gallery');
g.goTo(0); g.next(); g.prev(); g.refresh();
g.addEventListener('gallery:change', e => console.log(e.detail.index));
```

### 16.6 Stacking עם overlay טקסט (חשוב!)

כש-overlay טקסט יושב מעל גלריה (כמו `.ex-hero .overlay`), כדי שה-dots/arrows יישארו לחיצים ולא יוסתרו:

- אל תיתן ל-`<image-gallery>` `z-index` (יישבר ה-stacking context הפנימי).
- ה-`.overlay` עם `pointer-events:none` ו-children `pointer-events:auto`.
- gradient רקע על pseudo `::after` של ה-parent ב-`z-index:1; pointer-events:none`.
- ה-arrows/dots של הגלריה (z:2) יישבו אוטומטית מעל ה-gradient (z:1).

### 16.7 שילובים

| דף | סטטוס | תמונות |
|---|---|---|
| `pages/exhibition.html?id=loneliness` | ✅ hero gallery | 8 (hero + invite ×3 + atmosphere + second ×3) |
| `pages/exhibition.html?id=how-many` | ✅ hero gallery | 1 (hero only — אין עוד צילומי תערוכה) |
| `pages/events/*.html` slideshows | ⏳ candidate (קיים פתרון יעודי עם peek משני הצדדים) |
| dynamic image strips ב-press-1 וכו' | ⏳ candidate |

### 16.8 הוספת תמונות לתערוכה

עדכן `data/exhibitions.json::gallery_images[]` עם `{src, alt}`. הסקריפט ב-`exhibition.html` בונה את ה-`<img>` ילדים אוטומטית. **שכפול חובה ל-fallback JSON** המובנה ב-HTML (קיים מבנה לשני המקורות).

### 16.9 אסור

- אל תכפול לוגיקת carousel חדשה — תשתמש ב-`<image-gallery>`.
- אל תוסיף `z-index` ל-`<image-gallery>` עצמו — שובר את ה-stacking של arrows/dots.
- אל תזין `<img>` חיצוני עם `position: absolute` בתוך — הוא ייצא מ-track flow.

---

## 16א. STACKED GALLERY — peek/main 3D stack ✅

קומפוננטה ל-stack של 2 פריטים (תמונה או וידאו) במצב 3D — אחד "main" (קדמי, גדול) ואחד "peek" (אחורי, קטן, חתוך משמאל). משמשת לסקשן `קול קורא` בהומפייג' ול-mobile gallery ב-`pages/opencall.html`. במקום ליצור מימדים חדשים פר דף, **תמיד תוריד את ה-`--sg-*` vars** כדי להתאים לעיצוב.

### 16א.1 קבצים

- `components/stacked-gallery.css` — base layout + 3 מצבים (swap/lightbox/static) + info bar אופציונלי.
- `components/stacked-gallery.js` — singleton; ב-swap mode מטפל בקליק על peek + סנכרון info bar; אוטו-play/pause לוידאו לפי main/peek.

### 16א.2 הוספה לדף

```html
<link rel="stylesheet" href="<rel>/components/stacked-gallery.css">
...
<script src="<rel>/components/stacked-gallery.js" defer></script>
```

### 16א.3 מצבים (class על `.stacked-gallery`)

| Class | התנהגות |
|---|---|
| `sg-mode-swap` | קליק על peek → swap עם main; קליק על main → ניווט (`<a href>`) |
| `sg-mode-lightbox` | passive; מאצילים ל-artwork-lightbox דרך `data-artwork-src` על כל פריט |
| `sg-mode-static` | רק ויזואלי, אין אינטראקציה |

### 16א.4 markup בסיסי

```html
<div class="stacked-gallery sg-mode-swap" data-active="<id>">
  <div class="sg-stack">
    <a class="sg-item is-main"
       href="..."
       data-id="<id>"
       data-info-status="online"
       data-info-date="23.4.2026"
       data-info-location="tel aviv">
      <img src="..." alt="">    <!-- או <video muted playsinline loop> -->
    </a>
    <a class="sg-item is-peek" ...>...</a>
  </div>
  <!-- אופציונלי — מסיר את הסקשן הזה לכליל ה-3 טקסטים אינו רלוונטי -->
  <div class="sg-info">
    <span data-info="status"></span>
    <span data-info="date"></span>
    <span data-info="location"></span>
  </div>
</div>
```

### 16א.5 קסטומיזציה לפי דף (CSS vars)

ברירת המחדל מתאימה ל-homepage (Figma `landing::144:38`). לדפים אחרים, קבע משתנים פר-class scoped:

```css
.oc-mobile-gallery{
  --sg-stage-h: 443px;
  --sg-main-w: 216px;  --sg-main-h: 378px;
  --sg-main-x: 87px;   --sg-main-y: 33px;
  --sg-peek-w: 117px;  --sg-peek-h: 204px;
  --sg-peek-x: -58px;  --sg-peek-y: 120px;
  --sg-peek-opacity: .6;
}
```

זמינים: `--sg-stage-h`, `--sg-stage-bg`, `--sg-main-{w,h,x,y,z}`, `--sg-peek-{w,h,x,y,z,opacity}`, `--sg-transition-dur`, `--sg-transition-ease`.

### 16א.6 וידאו

`<video>` בתוך `.sg-item`. הקומפוננטה מפעילה אוטומטית כש-`is-main` ומשתיקה כש-`is-peek`. ל-mobile autoplay: `muted` + `playsinline` (הקומפוננטה דואגת לזה ב-JS, אבל הוסף ב-attribute לאיכות initial render).

הערה: ה-`artwork-lightbox` הנוכחי תומך רק ב-`<img>`. אם פריט הוא וידאו ועובדים ב-`sg-mode-lightbox`, ה-lightbox לא יציג נכון. במקרה הזה תשתמש ב-`sg-mode-swap`.

### 16א.7 info bar אופציונלי

הוסף או השמט את `.sg-info`. כל span עם `data-info="<key>"` מתעדכן מ-`data-info-<key>` על ה-main item שפעיל. ה-key הוא חופשי (אבל קונבנציה: `status/date/location`).

### 16א.8 רינדור דינמי

אם הקומפוננטה נכנסת ל-DOM אחרי DOMContentLoaded (למשל ב-`opencall.html` שטוען JSON), קרא:

```js
if (window.StackedGallery) window.StackedGallery.refresh();
if (window.ArtworkLightbox) window.ArtworkLightbox.refreshFocusable();
```

### 16א.9 שילובים

| דף | מצב | הערות |
|---|---|---|
| `index.html` (mobile-cta) | `sg-mode-swap` | 2 opencalls; info bar — status/date/location |
| `pages/opencall.html` (mobile) | `sg-mode-lightbox` | gallery images; **ללא info bar**; class wrapper `.oc-mobile-gallery` קובע את ה-vars |

### 16א.10 אסור

- אל תיצור 3D stack ייעודי לכל דף — תשתמש בקומפוננטה.
- אל תקשיח positioning ב-CSS של הדף — תקבע vars במקום `left/top/width/height` ידנית.
- אל תשים `data-artwork-src` על פריט וידאו (lightbox לא מציג video).

---

## 16ב. TRIPTYCH GALLERY — coverflow 1-main + 2-peeks ✅

קומפוננטה לקרוסלת "coverflow": תמונה מרכזית גדולה + שתי תמונות peek בצדדים, dots מתחת. שונה מ-`<image-gallery>` (שמראה שקופית אחת בכל פעם) ושונה מ-`stacked-gallery` (שני פריטים בלבד עם hover-swap). משתמשים בה כש-Figma מראה carousel עם 3 שקופיות גלויות + dots — הפטרן של דף about + slideshow band ב-/events/ktuba.

### 16ב.1 קבצים

- `components/triptych-gallery.css` — base layout + 3 מצבים (is-center / is-prev / is-next / is-hidden) + dots. CSS vars ל-customization פר-דף.
- `components/triptych-gallery.js` — boot על כל `.tri`, event delegation על frame, swipe + arrows + keyboard. API ב-`window.TriptychGallery`.

### 16ב.2 הוספה לדף

```html
<link rel="stylesheet" href="<rel>/components/triptych-gallery.css">
...
<section class="my-section">
  <div class="tri" data-tri-loop="true">
    <div class="tri-frame">
      <img class="tri-slide" src="..." alt="..." draggable="false">
      <img class="tri-slide" src="..." alt="..." draggable="false" loading="lazy">
      <!-- N slides total -->
    </div>
    <div class="tri-dots" role="tablist" aria-label="gallery navigation">
      <button type="button" class="tri-dot is-on" role="tab" aria-selected="true"></button>
      <button type="button" class="tri-dot" role="tab" aria-selected="false"></button>
      <!-- N dots total -->
    </div>
  </div>
</section>
<script src="<rel>/components/triptych-gallery.js" defer></script>
```

`<rel>` = `..` מ-`pages/`, `../..` מ-`pages/events/` או `pages/press/`.

### 16ב.3 התנהגות

- **קליק על peek** = הסיבוב במצב prev/next מתאים (peek שמאלי → previous; peek ימני → next).
- **קליק על main** = ללא פעולה (`cursor:default`).
- **dots** = jump לשקופית.
- **swipe / drag** = prev/next, threshold 12% מ-width או 40px.
- **חיצים במקלדת** (← → Home End) — צריך focus על ה-section או על ה-`.tri` (tabIndex מוגדר אוטומטית).
- **loop** = ברירת מחדל true. `data-tri-loop="false"` ל-stop בקצוות.

### 16ב.4 CSS vars לחילופי דף

ברירת המחדל מתאימה ל-about. לקסטומיזציה (לדוגמה ל-/events/ktuba slideshow band) קבע vars ב-class wrapper:

```css
.event-slideshow .tri{
  --tri-max-w: 1248px;
  --tri-bg: transparent;
}
.event-slideshow .tri-frame{height:841px;aspect-ratio:auto}
.event-slideshow .tri-slide.is-center{width:481px;height:841px}
.event-slideshow .tri-slide.is-prev,
.event-slideshow .tri-slide.is-next{width:302px;height:528px;opacity:.6}
.event-slideshow .tri-slide.is-prev{left:calc(50% - 392px)}
.event-slideshow .tri-slide.is-next{left:calc(50% + 392px)}
```

זמינים: `--tri-max-w`, `--tri-aspect`, `--tri-center-{w,h}`, `--tri-peek-{w,h,left,right,opacity,opacity-hover}`, `--tri-bg`, `--tri-dot-{w,h,gap,color,active,hover}`, `--tri-transition`.

### 16ב.5 API

```js
window.TriptychGallery.refresh();   // re-boot all .tri (after dynamic injection)
window.TriptychGallery.init(elem);  // boot a specific .tri element
elem.addEventListener('tri:change', e => console.log(e.detail.index));
```

### 16ב.6 שילובים

| דף | סטטוס | תיאור |
|---|---|---|
| `pages/about.html` | ✅ | 7 פורטרטים של ארז (Section 2) — peek-main-peek קלאסי |
| `pages/events/ktuba.html` | ✅ | slideshow band — 3 צילומים אמיתיים + 4 dots placeholder (סך הכל 7 dots ב-Figma) |
| כל דף עתידי שמראה 1 main + 2 peeks ב-Figma | ⏳ | תשתמש בקומפוננטה. |

### 16ב.7 אסור

- אל תכתוב לוגיקת `.atc-*` חדשה — הקומפוננטה היא הסטנדרט.
- אל תשים `position:absolute` ידני על `.tri-slide` — ה-modifier classes (`is-center/prev/next/hidden`) מטפלים בזה.
- אל תוסיף יותר dots מ-slides (האחדה automatique לא בודקת — סוכן צריך לסנכרן ידנית).

---

## 17. ARTIST LINKING — הנחייה קריטית (אסור לשבור) 🔴

> **כל אזכור של אומן באתר — שם, תמונה, או קלף — חייב להיות קישור לדף האומן שלו.** זה כלל-ברזל, לא suggestion. כל סוכן שמוסיף תוכן או מרנדר נתוני אומן חייב לוודא שהאומן clickable. נכשל בזה = הדף לא נחשב מוכן.

### 17.1 על מי חל הכלל?

על כל אומן שיש לו רשומה ב-`data/artists.json` עם `slug` קיים. נכון ל-2026-05-11 יש 18 אומנים רשומים:

```
zohar-ron, eitan-goldson, tanya-shin, nir-giorgio-levin, elsa-ars-brush,
gal-polk, zohar-shtrit, hila-loterstein, sami-david, risa-oz,
zohar-ron-dan-ben-ari, adi-duak, alon, noemi-safir, yarden-amir,
anat-wegier, liel-salman, tal-nehoray
```

**אומנים שאינם רשומים** (אורחים שמופיעים בתערוכות אבל אין להם דף — `holy kadosh`, `costa magarakis`, `maya nachum levy`, `la raz porta`, `dan ben-ari` בנפרד, `racheli reuven`, `raz ronen`): להשאיר כטקסט רגיל. אל תקשר ל-`/artists/<slug>.html` שלא קיים.

### 17.2 איפה חובה לקשר

| מקום | מה לקשר | איך |
|---|---|---|
| גריד אומנים (`pages/works.html`) | תמונה + שם | `<a href="artists/<slug>.html">` סביב התמונה ועוד סביב השם |
| Featured artists בהומפייג' (`index.html` `our artists`) | פורטרט + שם | `<a class="artist" href="pages/artists/<slug>.html">` סביב הקלף השלם |
| Artist strip בדף תערוכה (`pages/exhibition.html`) | תמונה + שם | קלף `<a class="card is-linked">` (אם יש slug ב-JSON או ב-`_ARTIST_SLUGS` map) |
| תמונת אומן בכתבה (`pages/press/*.html`) | התמונה | `<a class="artist-img-link" href="../artists/<slug>.html">` סביב `<img>` בלבד (לא סביב כל `<figure>` — נדמיון anchors) |
| `<figcaption>` שמזכיר אומן | השם בלבד | `<a class="artist-link" href="../artists/<slug>.html">` סביב המופע הראשון של השם |
| פסקת body שמזכירה אומן (`<p>...האומנת X...`) | כל מופע של שם אומן | `<a class="artist-link">` |
| `<aside>`, `pull-quote`, `caption` כלשהו | אותו דבר | `<a class="artist-link">` |
| Lightbox כותרת | טקסט שמכיל שם אומן | קשר את השם |

### 17.3 איזה CSS להשתמש?

הוגדר ב-`pages/press/*.html` וב-`pages/works.html` (להעתיק לכל דף חדש שמוסיף artist linking — או להעביר ל-`components/site-chrome.css` בעתיד):

```css
a.artist-link{
  color:inherit;text-decoration:underline;
  text-decoration-color:rgba(27,27,27,.25);
  text-underline-offset:3px;
  transition:text-decoration-color .2s,opacity .2s;
}
a.artist-link:hover{text-decoration-color:currentColor;opacity:.75}
a.artist-img-link{display:block;color:inherit;text-decoration:none}
a.artist-img-link img{transition:filter .25s}
a.artist-img-link:hover img{filter:brightness(.96)}
```

### 17.4 ולמה לא lightbox?

ב-`/works.html` ההחלטה הקדומה הייתה image-click → lightbox. שונתה ב-2026-05-11: image-click → artist page. Lightbox נשמר רק כשהוא חושף תוכן שאין דרך אחרת להגיע אליו (למשל artwork details בדף האומן עצמו ב-`pages/artists/artist.html`). **בכל מקום אחר באתר, image of an artist → artist page.**

### 17.5 נתיבים יחסיים (השוואה לפי depth)

| מאיפה | href לדף `alon` |
|---|---|
| `index.html` (root) | `pages/artists/alon.html` |
| `pages/works.html` | `artists/alon.html` |
| `pages/about.html` | `artists/alon.html` |
| `pages/press/walla.html` | `../artists/alon.html` |
| `pages/events/loneliness.html` | `../artists/alon.html` |
| `pages/exhibition.html` (rendered) | `../artists/alon.html` |
| בתוך `pages/artists/X.html` (לאומן אחר) | `Y.html` |

### 17.6 רנדור דינמי מ-JSON

אם דף מרנדר תוכן אומנים מ-JSON (כמו `exhibition.html` שטוען `data/exhibitions.json`):

1. **הוסף שדה `slug` לכל אומן ב-JSON.** הסיבה: רנדור ללא slug חייב לעשות name→slug lookup — שביר, ושוכח אומנים שלא קיים להם slug.
2. **בקוד הרנדור:** אם `a.slug` קיים → ייצר `<a href="...artists/${a.slug}.html">`. אם null → ייצר `<div>` רגיל. אסור לקשר ל-`/artists/holy-kadosh.html` שלא קיים.
3. **דוגמה:** ראה `pages/exhibition.html` — שורות `_ARTIST_SLUGS` + `linkable ? 'a' : 'div'`.

### 17.7 לפני שאתה מסיים משימה

מנהל בדיקה (חובה):

```bash
# 1. כל תמונה לאומן עטופה ב-anchor?
python3 -c "
import re, pathlib
for p in pathlib.Path('.').rglob('*.html'):
    if '/pages/artists/' in str(p): continue
    h=p.read_text(encoding='utf-8')
    for m in re.finditer(r'<img[^>]+src=\"([^\"]*(?:/artists/[a-z-]+/|/works/grid/|/exhibitions/[a-z-]+/artists/)[^\"]*)\"[^>]*>', h):
        pre=h[max(0,m.start()-400):m.start()]
        oa=pre.rfind('<a ')
        ca=pre.rfind('</a>')
        ok=oa>ca and 'artists/' in pre[oa:]
        if not ok: print('UNWRAPPED:', p, m.start())
"
# expected output: (empty)

# 2. גרפ בעברית — שמות שמופיעים חופשי בלי anchor?
# (לא קל לאוטומציה; eyeball test על דף חדש)
```

### 17.8 לקח לסוכנים — אל תוסיף "סטטי טקסט עם שם אומן" בלי לקשר

חוסר קישור = בעיה ב-UX (משתמש לא מבין שהשם clickable) **וגם** ב-SEO (Google לא מקשר בין הדפים). **תמיד** לקשר. גם בכותרת. גם ב-alt. גם ב-aria-label.

חריגים יחידים:
- שם אומן בתוך עצם דף האומן (`pages/artists/<slug>.html`) — לא מקשר לעצמו.
- אומן שאינו רשום (`holy kadosh` וכו') — להשאיר טקסט.
- שם הבעלים/founder (`ארז זילינסקי רוזן`) — מקושר ל-`pages/about.html`, לא ל-`/artists/`.

---

> *"Yes, the files are everywhere — but the system is in your head. Document it."*
