# conventions.md — Assets, Tokens, RTL, Casing, Responsive

> **קרא את הקובץ הזה כש:** אתה כותב CSS חדש, נוגע ב-typography/colors, מסדר טקסט עברי/אנגלי, מטפל ב-`text-transform`, מוסיף תמונה חדשה לפרויקט, או בונה responsive layout. אם אתה רק מעדכן JSON או טקסט — לא חובה.

---

## 1. Asset Conventions

**פורמטים בשרת:** רק **`.webp`** ו-**`.avif`** ב-`images/`. המקור הגולמי (`.png` עם שקיפות, `.jpg` של צילומים) חי ב-`_originals/` שמוסתר ב-`.gitignore`. הצמד `{name}.webp` + `{name}.avif` נוצר מ-`_originals/{name}.png` באמצעות convert pipeline (לא checked-in). דפים מצביעים תמיד ל-`.webp`; `components/picture-upgrade.js` מוסיף `<source type="image/avif">` ב-runtime.

| תוכן | תיקייה | שמות בשרת | הערות |
|---|---|---|---|
| Hero של דף | `images/<category>/<slug>/` | `hero.webp` + `hero.avif` | |
| Portrait של אומן | `images/artists/<slug>/` | `portrait.webp` + `portrait.avif` | square. **אל תדרוס** — שמור `portrait-v2.{webp,avif}` אם הצילום שונה. |
| Works של אומן | `images/artists/<slug>/works/` | `01.{webp,avif}`... | ממוספר |
| Works grid | `images/works/grid/` | `<artist-slug>.{webp,avif}` | flat |
| Gallery interior | `images/galleries/<slug>/` | `interior-01.{webp,avif}`... | |
| Exhibition stills | `images/exhibitions/<slug>/gallery/` | `01.{webp,avif}`... | |
| Press cover | `images/press/` | `<slug>-cover.{webp,avif}` | flat |
| Press inline | `images/press/<slug>/` | `00-hero-*.{webp,avif}`, `01-*.{webp,avif}`... | subfolder לכתבות long-form. **walla/press-1/time-out כבר קיימים — `ls` קודם.** |
| Event cover | `images/events/` | `<slug>-cover.{webp,avif}` | flat — homepage thumb only |
| Event page images | `images/events/<slug>/` | `hero.{webp,avif}`, `invite-*.{webp,avif}`, `atmosphere.{webp,avif}`, `opening-*.{webp,avif}` | **קיים:** `images/events/loneliness/` (22). אל תוריד מחדש. |
| Open call | `images/opencalls/<slug>/` | `hero.{webp,avif}`, `gallery-01.{webp,avif}`... | subfolder per slug |
| Instagram | `images/instagram/` | `1.{webp,avif}`-`9.{webp,avif}` | |

**Logo:** `images/brand/logo.svg`. **איקונים:** inline SVG ב-HTML. **וידאו:** `.mp4` H.264 + `-movflags +faststart`, **`-an`** (אין אודיו ברוב הוידאו דקורטיבי), CRF 28-30, fps≤24, רוחב≤1080.

**לפני כל הורדה — `ls images/<category>/<slug>/` קודם.** רוב התמונות הקיימות מ-press/about/events כבר במקום.

### 1.1 Perf checklist ל-`<img>` (חובה, ראה CLAUDE.md §8.11)

```html
<!-- LCP (img ראשון בדף) -->
<img src="path/file.webp" alt="…" width="1200" height="800" fetchpriority="high" decoding="async">

<!-- כל שאר ה-imgs -->
<img src="path/file.webp" alt="…" width="800" height="600" loading="lazy" decoding="async">
```

- `src` תמיד `.webp` (לא `.png` — הקובץ לא קיים בשרת).
- `width`/`height` = הפיקסלים האמיתיים של הקובץ. `sips -g pixelWidth -g pixelHeight <path>` ב-macOS.
- `decoding="async"` לכל img (אין חיסרון).
- `loading="lazy"` לכל img חוץ מה-LCP.
- ה-LCP מקבל `fetchpriority="high"`.

ל-imgs שנבנים ב-JS (carousels, dynamic grids) — אותו checklist מיושם ב-JS template.

---

## 2. Naming & Slugs

- **slug = id = שם תיקייה** (kebab-case, ASCII).
- אומנים: `firstname-lastname` בלי תארים (`nir-giorgio-levin`).
- תערוכות: שם מקוצר באנגלית (`loneliness`, `how-many`).
- גלריות: `medina`, `dizengoff`, `flea-market`.
- מאמרים: `<source>-<topic>`.

**שינוי slug בדיעבד אסור** אחרי פרסום. alias ב-JSON אם חייב.

---

## 3. Design Tokens (אסור לשנות)

### 3.1 צבעים

```css
--white:#FFFFFF; --ink:#1B1B1B; --bg-grey:#EEF0EF;
--grey-mid:#808080; --artist:#828282; --copy-grey:#6B7280;
--sep:#EFEFEF; --divider:#D8D8D8;  /* about, artist bio split */
--slide-active:#515151;             /* triptych dots */
--link:#2D3BD5;                     /* press inline links */
/* Overlays */
rgba(27,27,27,0.55)   /* gallery 'coming soon' desktop */
rgba(27,27,27,0.6)    /* mobile coming-soon */
linear-gradient(180deg, rgba(102,102,102,0) 0%, rgba(0,0,0,0.8) 81%)
```

### 3.2 פונטים

- **Copperplate** (`./פונטים/Copperplate*.{otf,ttf}`) — אנגלית. 300/400/700/900.
- **FbEzmel** (`./פונטים/FbEzmel-*.otf`) — עברית. 300/400.
- **Inter** (Google) — רק לכפתור `SUBSCRIBE` (12px, ls 10%, 400).

תמיד `@font-face` בקובץ. **אסור Google substitutes** (Cormorant/Frank Ruhl).

### 3.3 Spacing / Layout

- Desktop max-width **1440px**, padding **96px**.
- Tablet (≤1100): 48px.
- Mobile (≤768): 16px.
- Small mobile (≤400): 16px + font scale.
- **Border-radius: 0** בכל מקום. **אין shadows.**

### 3.4 Typography scales

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

**אל תעגל ערכים לא-עגולים** מ-Figma (`497.78`, `191.52`, `18.99`, `121.52`, `12.66`, `6.33`...).

---

## 4. RTL (עברית)

- `dir="rtl"` או `direction:rtl` **+** `text-align:right`. רק אחד מהם לא מספיק.
- ב-flex container עם RTL children: לעיתים `align-items:flex-end` הוא מה שמיישר (text-align לא מצביע).
- תאריכים/מספרים/מילים-לועזיות בתוך עברית: `<bdi>` או div עם `direction:ltr`.
- `\n` ו-`\L` ממחרוזות Figma → `<br>`.

---

## 5. Casing & Font — ⚠️ כלל גלובלי קריטי

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
- פונט אנגלי שאינו Copperplate (Solway, Inter, Times, system serif...). היחיד שמותר חוץ מ-Copperplate: **Inter בלבד לכפתור SUBSCRIBE**.
- `font-family: var(--heb)` על אלמנט שמכיל אנגלית טהורה.
- `.heb` עוטף עם אנגלית בתוך — האנגלית **חייבת** `<span class="lat">` שמחזיר Copperplate+uppercase.

**מותר:**
- `text-transform: none` על אלמנט עם **מספרים בלבד** (תאריכים, שעות, מספרי דגם).
- שמות קבצים, paths, slugs, IDs ב-JSON — lowercase תמיד (לא טקסט שמוצג).
- source strings ב-JSON/HTML יכולים להישאר Title Case לקריאות — ה-CSS משנה רינדור.
- **עברית פטורה** (אין uppercase/lowercase).

**בדיקה לסוכן (מצפים לפלט ריק):**
```bash
grep -rn "text-transform[: ]*\(lowercase\|capitalize\)" --include="*.html" --include="*.css" .
grep -rn "font-family.*\(Solway\|Times New Roman[^,]\|serif$\)" --include="*.html" --include="*.css" . | grep -v "var(--cop)\|var(--heb)"
```

### 5.1 Lang-aware rendering ל-JSON-driven text (חובה)

**הבעיה:** עברית fonts (FbEzmel) ללא Latin glyphs. כשמזריקים מ-JSON טקסט אנגלי לאלמנט מבוסס `var(--heb)` → האנגלית נופלת ל-serif fallback של המערכת (David Libre / Times) ו"נראית בלי פונט". אותו דבר ההפך — אנגלית-בלבד בכלי שמסומן `var(--cop)` עם טקסט עברי תקבל גליפים כפויים.

**הכלל:** לכל אלמנט שמרנדר ערכים מ-JSON שעלולים להיות עברית **או** אנגלית (titles, names, descriptions, captions, alt-text, bookmark titles) — תזהה את השפה בזמן render והחל class מתאים.

**הדפוס:**
```js
// Hebrew letters proper (alef-tav + finals); excludes punctuation like ״ ׳.
var HEB_LETTERS = /[א-ת]/;
function langClass(s){ return HEB_LETTERS.test(s||"") ? "is-he" : "is-en"; }
// בעת הרינדור:
'<div class="title '+langClass(w.title)+'">'+escapeHtml(w.title)+'</div>'
```

```css
.title{font-size:16px;color:var(--ink);text-align:center}
.title.is-he{font-family:var(--heb);direction:rtl;text-transform:none}
.title.is-en{font-family:var(--cop);direction:ltr;text-transform:uppercase;letter-spacing:.04em}
```

**מימושים קיימים:** `pages/artists/artist.html` (`.work .title/.sub`), `components/artwork-lightbox.{js,css}` (`.alb-title`, `.alb-alt`), `components/site-chrome.{js,css}` (`.bm-title`). אם נדבק אתר רנדר חדש מ-JSON עם content שעלול להיות אנגלית — השתמש באותו דפוס.

**גרשיים עבריים `״` `׳`** (U+05F4 / U+05F3) — לא letters. כותרת `״DON'T LOSE YOUR HEAD״` תזוהה כ-`is-en` והעטיפה הגרפית תישמר. זה הנכון: התוכן הוא אנגלי.

**Inline `<span class="lat">` בתוך JSON titles** (לקטעי לועזית בכותרת עברית): renderer של artist.html יודע לעבור דרך `escapeHtml` ולשמר את ה-tag הזה בלבד (`titleHtml()` helper). אם מוסיפים render חדש שמקבל ערך שעלול להכיל `<span class="lat">` — תעתיק את ה-helper.

---

## 6. Responsive Breakpoints

```css
/* Default: 1440px desktop */
@media (max-width: 1100px) { /* tablet */ }
@media (max-width: 768px)  { /* mobile */ }
@media (max-width: 400px)  { /* small mobile */ }
```

**מובייל ≠ דסקטופ מצומצם.** המעצב מוסיף sections ייחודיים, מסדר אחרת, או משנה overlay. תמיד בדוק **שני frames** לפני CSS.

**Mobile horizontal-scroll מ-titles גדולים** (לקח 2026-05-11):
- `html{overflow-x:clip}` + `body{overflow-x:clip;max-width:100vw}` (`overflow-x:hidden` רק על body לא תמיד מספיק).
- `font-size:clamp(min, vw-value, max)` במקום fixed-px ל-text ≥48px. ה-`vw-value` ≈ `figma_px / figma_viewport × 100`.
- `white-space:nowrap` למילים שאסור שיתפצלו + `max-width:100%;overflow:hidden` על הקונטיינר.
