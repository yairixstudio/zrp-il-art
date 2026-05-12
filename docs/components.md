# components.md — Shared UI Components

> **קרא את הקובץ הזה כש:** אתה רואה ב-Figma carousel/slideshow/lightbox/gallery, מוסיף `data-artwork-*` attributes, צריך להציג רצף תמונות, או כשמשנים stacking של overlay מעל תמונה. **לפני שאתה כותב לוגיקת carousel חדשה — חובה לקרוא** (כלל זהב: אסור לכפול קומפוננטה קיימת).

> **מפת החלטה לפי Figma:**
> - תמונה אחת + נקודות ניווט (1 visible) → `<image-gallery>` (§2).
> - תמונה מרכזית גדולה + 2 peek בצדדים + dots → `.tri` triptych (§4).
> - 2 פריטים, אחד גדול אחד קטן/חתוך, swap בלחיצה → `.stacked-gallery` (§3).
> - לחיצה על artwork פותחת תמונה במסך מלא → `data-artwork-*` + lightbox (§1).

---

## 1. ARTWORK LIGHTBOX ✅

**ה-frames `1213:2725` (gallery-desktop), `1213:2820` (gallery1), `1213:2854` (gallery2) אינם דפים** — שלושת המצבים של lightbox לתמונת **יצירת אומנות**.

### 1.1 קבצים

- `components/artwork-lightbox.css` — responsive (desktop: caption מתחת, chevrons 48×48; mobile: overlay מלא, chevrons 24×24).
- `components/artwork-lightbox.js` — singleton, event delegation על `document.click`. API ב-`window.ArtworkLightbox`.

### 1.2 הוספה לדף

```html
<link rel="stylesheet" href="<rel>/components/artwork-lightbox.css">
...
<script src="<rel>/components/artwork-lightbox.js" defer></script>
```
`<rel>` = `..` מ-`pages/`, `../..` מ-`pages/artists/`.

### 1.3 סימון תמונות (3 דרכים, לפי קדימות)

| Attribute | מתי |
|---|---|
| `data-artwork-id="<id>"` | יש entry ב-`data/works.json` |
| `data-artwork-src` + `data-artwork-title` + `data-artwork-artist` | inline |
| אין `data-artwork-*` | לא ייפתח (portrait, gallery hero, Instagram, press cover) |

**אופציונלי:**

| Attribute | תוצאה |
|---|---|
| `data-artwork-alt="<text>"` | פיסקה קצרה מתחת לתמונה ברוחב התמונה. השמטה ⇒ לא מוצג. |
| `data-artwork-link="<href>"` | כפתור מרובע מתחת, **ברוחב התמונה** (מחושב ב-JS אחרי load). |
| `data-artwork-link-label="<text>"` | טקסט הכפתור. ברירת מחדל: `"מעבר ליצירה"`. עברית מזוהה אוטומטית. |

### 1.4 גלריית prev/next

עוטף קבוצה ב-`data-artwork-gallery`. prev/next מסתובב בתוך ה-container. ללא wrapper — כל הדף.

```html
<section class="grid" data-artwork-gallery>
  <a data-artwork-src="..." data-artwork-title="..."><img></a>
</section>
```

### 1.5 תכונות

קליק / Enter / Space פותחים. חיצים — prev/next. Esc — סוגר. Swipe במובייל. Focus trap + body scroll lock + focus restore. Preload הבאה/קודמת.

### 1.6 API

```js
window.ArtworkLightbox.open(elOrId)
window.ArtworkLightbox.close()
window.ArtworkLightbox.refreshFocusable()  // אחרי injection דינמי (רק לנגישות-מקלדת; click עובד דרך delegation)
```

### 1.7 אסור

- אל תבנה lightbox חדש.
- `data-artwork-*` רק על יצירות אומנות. **לא** portrait, gallery hero, Instagram, press cover.
- ב-`exhibition.html` thumbs של "artists" = portraits → לא lightbox.

### 1.8 שילובים

| דף | סטטוס |
|---|---|
| `pages/works.html` | ✅ 12 cards (`data-artwork-gallery` על `.grid`) |
| `pages/artists/artist.html` | ✅ render dynamic של `.works-grid` |
| `pages/exhibition.html` | ❌ thumbs = portraits |
| `index.html` | ❌ tiles = typography |

### 1.9 TODO

- שדות `title`, `year`, `dimensions`, `medium` ב-`data/works.json` וב-`artists.json::works[]`.
- FbEzmel ל-`.alb` font-stack כשנדרש caption עברי.

---

## 2. IMAGE GALLERY — `<image-gallery>` ✅

קומפוננטה שמייתרת slideshows סטטיים. **כלל אצבע:** Figma מראה תמונה אחת + dots → תשתמש ב-`<image-gallery>` (תמיד carousel).

### 2.1 קבצים

- `components/gallery.css` — viewport, slides, arrows, dots, counter; responsive.
- `components/gallery.js` — custom element `<image-gallery>`. אוטו-זריקת CSS אם לא נטען.

### 2.2 שימוש בסיסי

```html
<link rel="stylesheet" href="<rel>/components/gallery.css">
...
<image-gallery aria-label="exhibition gallery">
  <img src="..." alt="">
  <img src="..." alt="">
</image-gallery>
<script src="<rel>/components/gallery.js" defer></script>
```

הקומפוננטה ממלאת את ה-parent (width:100%; height:100%). ה-`<img>` ילדים הם source of truth — JS אוסף אותם וגורר ל-slides. **graceful degradation:** אם JS לא רץ — `<img>` רגילים.

### 2.3 Attributes

| Attribute | Default | מה זה עושה |
|---|---|---|
| `data-fit="cover\|contain"` | `cover` | object-fit |
| `data-loop="true\|false"` | `true` | last → first |
| `data-arrows="true\|false"` | `true` | חיצים דסקטופ (hover/focus) |
| `data-dots="true\|false"` | `true` | נקודות ניווט |
| `data-counter="true\|false"` | `false` | "3 / 8" בפינה |
| `aria-label="..."` | — | נגישות |

### 2.4 פיצ'רים

- **Swipe** עם Pointer Events. threshold 12% מ-width או 40px.
- **חיצים** (← →) במקלדת, **Home/End** לקצוות.
- **לחיצה על dot** — jump.
- **ResizeObserver** — שומר transform נכון בכל שינוי width.
- **Lazy loading** — `loading="lazy"` על תמונה 2+ אוטומטית.

### 2.5 API

```js
const g = document.querySelector('image-gallery');
g.goTo(0); g.next(); g.prev(); g.refresh();
g.addEventListener('gallery:change', e => console.log(e.detail.index));
```

### 2.6 Stacking עם overlay טקסט (חשוב!)

כש-overlay טקסט יושב מעל גלריה (כמו `.ex-hero .overlay`), כדי שה-dots/arrows יישארו לחיצים:

- **אל תיתן ל-`<image-gallery>` `z-index`** (יישבר ה-stacking context הפנימי).
- ה-`.overlay` עם `pointer-events:none` ו-children `pointer-events:auto`.
- gradient רקע על pseudo `::after` של ה-parent ב-`z-index:1; pointer-events:none`.
- ה-arrows/dots (z:2) יישבו אוטומטית מעל ה-gradient.

### 2.7 שילובים

| דף | סטטוס | תמונות |
|---|---|---|
| `pages/exhibition.html?id=loneliness` | ✅ hero gallery | 8 |
| `pages/exhibition.html?id=how-many` | ✅ hero gallery | 1 |
| events/*.html slideshows | ⏳ candidate (כרגע triptych) |

### 2.8 הוספת תמונות לתערוכה

עדכן `data/exhibitions.json::gallery_images[]` עם `{src, alt}`. **שכפול חובה ל-fallback JSON** המובנה ב-HTML.

### 2.9 אסור

- אל תכפול לוגיקת carousel חדשה — תשתמש ב-`<image-gallery>`.
- אל תוסיף `z-index` ל-`<image-gallery>` עצמו.
- אל תזין `<img>` חיצוני עם `position:absolute` בתוך.

---

## 3. STACKED GALLERY — `.stacked-gallery` (peek/main 3D) ✅

קומפוננטה ל-stack של 2 פריטים — אחד "main" (קדמי, גדול) ואחד "peek" (אחורי, קטן, חתוך משמאל). משמשת ל-`קול קורא` בהומפייג' ול-mobile gallery ב-opencall. **תמיד תוריד את ה-`--sg-*` vars** להתאמה.

### 3.1 קבצים

- `components/stacked-gallery.css` — base + 3 מצבים (swap/lightbox/static) + info bar אופציונלי.
- `components/stacked-gallery.js` — singleton; ב-swap mode מטפל בקליק על peek + סנכרון info bar; אוטו-play/pause לוידאו.

### 3.2 מצבים (class על `.stacked-gallery`)

| Class | התנהגות |
|---|---|
| `sg-mode-swap` | קליק על peek → swap עם main; קליק על main → ניווט (`<a href>`) |
| `sg-mode-lightbox` | passive; מאצילים ל-artwork-lightbox דרך `data-artwork-src` |
| `sg-mode-static` | רק ויזואלי |

### 3.3 markup

```html
<div class="stacked-gallery sg-mode-swap" data-active="<id>">
  <div class="sg-stack">
    <a class="sg-item is-main" href="..." data-id="<id>"
       data-info-status="online" data-info-date="23.4.2026" data-info-location="tel aviv">
      <img src="..." alt=""> <!-- או <video muted playsinline loop> -->
    </a>
    <a class="sg-item is-peek" ...>...</a>
  </div>
  <!-- אופציונלי -->
  <div class="sg-info">
    <span data-info="status"></span>
    <span data-info="date"></span>
    <span data-info="location"></span>
  </div>
</div>
```

### 3.4 קסטומיזציה (CSS vars)

ברירת מחדל ל-homepage. לדפים אחרים — vars scoped:

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

### 3.5 וידאו

`<video>` בתוך `.sg-item`. הקומפוננטה מפעילה כש-`is-main`, משתיקה כש-`is-peek`. ל-mobile autoplay: `muted` + `playsinline` ב-attribute.

**זהירות:** `artwork-lightbox` תומך רק ב-`<img>`. וידאו + `sg-mode-lightbox` = לא יציג. תשתמש ב-`sg-mode-swap`.

### 3.6 info bar אופציונלי

הוסף/השמט את `.sg-info`. כל span עם `data-info="<key>"` מתעדכן מ-`data-info-<key>` על main item.

### 3.7 רינדור דינמי

אחרי הזרקה ל-DOM:

```js
if (window.StackedGallery) window.StackedGallery.refresh();
if (window.ArtworkLightbox) window.ArtworkLightbox.refreshFocusable();
```

### 3.8 שילובים

| דף | מצב |
|---|---|
| `index.html` (mobile-cta) | `sg-mode-swap`, 2 opencalls + info bar |
| `pages/opencall.html` (mobile) | `sg-mode-lightbox`, gallery images, ללא info bar, `.oc-mobile-gallery` |

### 3.9 אסור

- אל תיצור 3D stack ייעודי.
- אל תקשיח positioning ב-CSS של הדף — תקבע vars במקום `left/top/width/height` ידני.
- אל תשים `data-artwork-src` על וידאו.

---

## 4. TRIPTYCH GALLERY — `.tri` (1 main + 2 peeks coverflow) ✅

קרוסלת coverflow: תמונה מרכזית גדולה + שתי peek בצדדים + dots. שונה מ-`<image-gallery>` (1 visible) ומ-`stacked-gallery` (2 items hover-swap). **כלל אצבע:** Figma מראה 3 שקופיות גלויות + dots → `.tri`.

### 4.1 קבצים

- `components/triptych-gallery.css` — base + 4 מצבים (is-center / is-prev / is-next / is-hidden) + dots. CSS vars לקסטומיזציה.
- `components/triptych-gallery.js` — boot על כל `.tri`, swipe + arrows + keyboard. API ב-`window.TriptychGallery`.

### 4.2 שימוש

```html
<link rel="stylesheet" href="<rel>/components/triptych-gallery.css">
...
<section class="my-section">
  <div class="tri" data-tri-loop="true">
    <div class="tri-frame">
      <img class="tri-slide" src="..." alt="..." draggable="false">
      <img class="tri-slide" src="..." alt="..." draggable="false" loading="lazy">
    </div>
    <div class="tri-dots" role="tablist" aria-label="gallery navigation">
      <button type="button" class="tri-dot is-on" role="tab" aria-selected="true"></button>
      <button type="button" class="tri-dot" role="tab" aria-selected="false"></button>
    </div>
  </div>
</section>
<script src="<rel>/components/triptych-gallery.js" defer></script>
```

`<rel>` = `..` מ-`pages/`, `../..` מ-`pages/events/` או `pages/press/`.

### 4.3 התנהגות

- **קליק על peek** = move to prev/next.
- **קליק על main** = ללא פעולה (`cursor:default`).
- **dots** = jump.
- **swipe / drag** = prev/next, threshold 12% או 40px.
- **חיצים במקלדת** (← → Home End) — צריך focus.
- **loop** = ברירת מחדל true. `data-tri-loop="false"` לעצירה בקצוות.

### 4.4 קסטומיזציה (CSS vars)

```css
.event-slideshow .tri{ --tri-max-w: 1248px; --tri-bg: transparent; }
.event-slideshow .tri-frame{ height:841px; aspect-ratio:auto }
.event-slideshow .tri-slide.is-center{ width:481px; height:841px }
.event-slideshow .tri-slide.is-prev,
.event-slideshow .tri-slide.is-next{ width:302px; height:528px; opacity:.6 }
.event-slideshow .tri-slide.is-prev{ left:calc(50% - 392px) }
.event-slideshow .tri-slide.is-next{ left:calc(50% + 392px) }
```

זמינים: `--tri-max-w`, `--tri-aspect`, `--tri-center-{w,h}`, `--tri-peek-{w,h,left,right,opacity,opacity-hover}`, `--tri-bg`, `--tri-dot-{w,h,gap,color,active,hover}`, `--tri-transition`.

### 4.5 API

```js
window.TriptychGallery.refresh();   // re-boot all .tri (after dynamic injection)
window.TriptychGallery.init(elem);  // boot specific .tri
elem.addEventListener('tri:change', e => console.log(e.detail.index));
```

### 4.6 שילובים

| דף | תיאור |
|---|---|
| `pages/about.html` | 7 פורטרטים של ארז (Section 2) — peek-main-peek קלאסי |
| `pages/events/ktuba.html` | slideshow band — 3 צילומים אמיתיים + 4 dots placeholder (סך 7 dots) |

### 4.7 אסור

- אל תכתוב לוגיקת `.atc-*` חדשה.
- אל תשים `position:absolute` ידני על `.tri-slide` — ה-modifier classes מטפלים.
- אל תוסיף יותר dots מ-slides (אין auto-sync — סוכן צריך לסנכרן ידנית).

---

## 5. Share + Bookmark (built into site-chrome)

מומומש בתוך `components/site-chrome.{js,css}`. כל דף press/event שמכיל `<site-header>` מקבל בחינם:
1. אייקון סימנייה בהידר עם count badge (default `display:none`, מופיע רק עם `.has-items` class).
2. modal עם רשימת saved.
3. toast לפידבק.

הדף עצמו רק מציין item דרך `data-item-id`/`data-item-title`/`data-item-date` על `[data-bookmark-toggle]` + `[data-share-btn]` ליד.

לוגיקה: `localStorage["zr-bookmarks"]` = JSON array `{id,title,url,date}`. share button משתמש ב-`navigator.share()` נתיב ראשי, fallback ל-`navigator.clipboard.writeText()` עם toast "LINK COPIED".

האייקון יושב ב-`position:absolute; right:100%` של `.nav-right` — דסקטופ משמאל ל-nav-links, מובייל משמאל להמבורגר. מאחר ו-absolute, show/hide לא מזיז שום אלמנט.
