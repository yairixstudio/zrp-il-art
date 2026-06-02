# lessons.md — Policies, Recurring Lessons, Recent

> **קרא את הקובץ הזה כש:** אתה מתחיל דף חדש (לבדוק אם יש לקח קרוב לתוכן שאתה בונה), נתקלת ב-Figma quirk, מקבל החלטה Static-vs-Dynamic, או רוצה לתעד לקח חדש. **בסיום משימה — תוסיף לקח ל-§3 רק אם הוא לא חלק מ-§2 (אם קיים — תחזק את הקיים).**

---

## 1. Static-vs-Dynamic Policy

ה-Figma הוא snapshot סטטי. **האתר לא.** לכל section, החלט:

**אינטראקטיבי (אסור לשלוח כתמונה שטוחה):**
- grids של artworks → **lightbox** (components.md §1).
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

---

## 2. Recurring Lessons (מאוחד — אם נתקלת בלקח קיים, חזק אותו; אל תכפיל)

### 2.1 Figma quirks

- **שמות nodes משקרים על device.** `the art works-phone` היה 1440, `artist1-13` הם 390. תמיד `absoluteBoundingBox.width`. 1440=desktop, 390=mobile.
- **שני קבצי Figma עם תוכן מראה.** `XhGH...::119:3` ≡ `Zn3N...::1213:3` (artist-alon). תאמת `fileKey` מה-URL.
- **JSON ענק → subagents חובה.** קריאה ישירה של frames גדולים נכשלת על token budget. דפי-יחיד קטנים (about) נכנסים ישירות.
- **`depth:1-2`** לסקירת canvas — מספיק בלי להציף קונטקסט.
- **`{ts1}/{ts2}/{ts3}/{ts4}` markers** = textCase metadata. רנדר כ-`<span class="lat">` (Copperplate Light), אלא אם זה לינק אמיתי → `<a>` עם `var(--link)`.
- **טעויות עיצוב ב-Figma** (כותרת loneliness בתוך how-many; caption של אומן אחד על תמונה של אחר; 4 imageRefs בערימה כאשר רק אחד רלוונטי) — **שיקול דעת**, בחר את המתאים לתמונה/JSON, לא מעתיק טעות.
- **`gap` שלילי** = `margin-top` שלילי על הילד (overlap מכוון בהומפייג').
- **`\n`/`\L`** → `<br>`.
- **figma_node_id מקבל משמעות רק יחד עם fileKey** — frames יכולים לעבור בין קבצים. אמת מה-URL.

### 2.2 Image handling

- **stacked imageRefs ב-fill** — רוב artist/hero images כוללים 2-4 imageRefs (אמיתית + Figma placeholders כמו `cb002e02e2090...`, `41074587...`, או hero של דף אחר). **בחר לפי סמנטיקה, לא לפי "אחרון בסטאק".** הורד רק את הרלוונטי.
- **`cropTransform` לא חובה** — `object-fit:cover` ב-CSS פותר. הוסף רק אם תוצאה ויזואלית שונה דרסטית.
- **בדוק קיום + hash compare לפני הנחת reuse.** ב-about, 7/7 התמונות היו חדשות למרות שצפיתי ל-hero משותף.
- **`portrait.png` קיים → אל תדרוס.** שמור figma version כ-`portrait-v2.png` ועדכן ב-`artists.json`.
- **נתיבי קבצים בעברית** (`url("פונטים/...")`) עובדים בדפדפנים מודרניים בלי URL-encoding.

### 2.3 Page architecture

- **Dynamic template + thin shells** לסטים גדולים. דפוס: `pages/<type>.html` קורא `?slug=`/`?id=` מ-URL + fetches JSON. shells per-slug `location.replace()`. דוגמאות: `pages/exhibition.html`, `pages/artists/artist.html`, `pages/opencall.html`. **כניסה חדשה = JSON entry, אין שינוי קוד.**
- **שדות אופציונליים ב-JSON** מאפשרים variant per slug בלי קוד-מותנה (`opencalls.json::emotional_triggers`, `gallery_images`). הרנדרר בודק קיום ומדלג בשקט.
- **fetch + inline JSON fallback.** ב-`file://` חלק מהדפדפנים חוסמים `fetch`. הטמע `<script type="application/json" id="fallback-...">`. **כשמעדכנים JSON — חייבים לעדכן גם fallback** עד שתהיה build infra.
- **Shared shell pattern** (nav+drawer+footer+JS): מועתק 1:1 בין דפים. אין partial loader. שינוי גלובלי = search-replace. **מעל 8 דפים — לעבור ל-partial loader.**
- **Hamburger drawer:** `.nav-links` הקיים *הוא* ה-drawer. אל תשכפל את הרשימה. `body.menu-open{overflow:hidden}`, `visibility:hidden` על drawer סגור (focus trap).
- **Logo → home בכל דף** עם `aria-label="home"`.
- **תוכן long-form (כתבות 5000+ מילים) נשאר ב-HTML**, רק meta ב-JSON. CMS עתידי יעביר.
- **דסקטופ + מובייל עם תוכן שונה → באתר חי, אחד.** Figma snapshot. הצג את כל התוכן בכל ה-viewports באופן רספונסיבי.
- **`exhibitions` ב-nav** מצביע ל-`pages/exhibition.html?id=loneliness`. כשייבנה `/exhibitions` index — search-replace בכל הדפים.

### 2.4 Lightbox

- **Event delegation** על `document.click` → תוכן מוזרק דינמית "תופס" בלי handlers. אחרי `innerHTML=...` קרא `ArtworkLightbox.refreshFocusable()` רק לנגישות-מקלדת.
- **font-stack של `.alb` הוא Copperplate בלבד** — עברית ב-caption נופלת ל-fallback מערכת. הוסף FbEzmel ב-`artwork-lightbox.css` אם נדרש.

### 2.5 Hebrew / data

- **שמות עבריים ב-Figma הם source of truth** ל-`name_he`. תמיד תמשוך, אל תשאיר null.
- **אומנים חדשים שמתגלים** בעת בנייה — עדכן `artists.json`, אל תתעלם.

---

## 3. New Lessons (template)

הוסף **רק** אם הוא לא חלק מ-§2. הפורמט: `**<topic>:** <one-line lesson>.` אם קיים — תחזק את ה-§2 הקיים.

---

## 4. Recent Lessons (timestamped)

- **2026-06-02 — Perf pass: defer + LCP priority (40 דפים):** (1) **`embed-iframe.js` חייב `defer`** — סקריפט sync בסוף body עדיין חוסם DOMContentLoaded; הוא no-op מחוץ ל-iframe אז defer = רווח נקי. (2) **LCP עם `loading="lazy"` = אנטי-פאטרן** — נמצא ב-22 דפי אומן (פורטרט יחיד), 2 opencalls (hero), ובגריד works כל 12 התמונות היו `fetchpriority="high"` (=אף אחת לא מועדפת). תוקן: רק תמונה ראשונה high, השאר lazy. דפוס: `(i?' loading="lazy"':' fetchpriority="high"')`. (3) **🔴 אסור `media="print"` async-CSS על קומפוננטה שנוגעת ב-DOM סטטי** — `artwork-lightbox.css` מכיל `[data-artwork-src]{cursor:zoom-in}`; טעינה מאוחרת = הסמן מופיע באיחור בחיבור איטי. נוסה ובוטל. גם stacked/triptych/gallery.css חייבים להישאר blocking (מעצבים HTML סטטי). (4) **🔴 Lighthouse על iCloud Drive = רעש קיצוני** — אותו קוד בדיוק נמדד LCP 8.9s→11.9s→33.1s בריצות עוקבות (sync I/O). להשוות מדידות רק back-to-back באותו חלון זמן, ולסמוך על הציון (P) יותר מאשר על LCP הסימולציה. (`/events/how-many/` — אירוע הפתיחה):** נבנה מ-Figma `landing` `433:2` (דסקטופ) + `433:179` (מובייל), על בסיס מבנה loneliness (האירוע התאום) אבל עם CSS נקי (בלי ה-legacy nav/footer שנשאר ב-loneliness). מבנה: hero (כותרת+מטא+טקסט אוצרותי | תמונה נקייה ללא overlay) → the invitation (triptych + 7 dots) → the atmosphere (תמונה עם gradient fade | רשימת 15 אומנים) → גלריה שנייה (3 dots) → moments from the opening (14 thumbs scroll-snap). **לקחים:** (1) **סדר מובייל שונה מדסקטופ בכמה רמות** — הטקסט אחרי גלריה 1, גלריה 2 לפני atmosphere; נפתר עם אותו דפוס `display:contents` + `order` מ-close-look. ה-atmosphere נשאר סקשן אטומי (label+image+artists בעמודה) כי האומנים צמודים לו בשני הסדרים. (2) **קישורי אומנים בעקבות exhibitions.json** — `דן בן-אבי` מקושר ל-`zohar-ron-dan-ben-ari` (דף השת"פ, לפי המיפוי בתערוכה); `רחלי ראובן` נשארת טקסט (לא רשומה). (3) **Reuse:** ה-hero של הדף = `event-how-many-2026-05-26-cover.webp` הקיים מההומפייג' (אומת RMSE), רק 20 תמונות חדשות ירדו (invite/atmosphere/second/opening-01..14) ל-`images/events/how-many/`.
- **2026-06-01 — Event page close-look (`/events/close-look/` — מבט מקרוב):** נבנה מ-Figma `landing` `420:1520` (דסקטופ) + `420:1625` (מובייל), על בסיס מבנה ktuba עם התאמות. **לקחים חדשים:** (1) **Reuse לפני הורדה** — 4 מתוך 5 ה-imageRefs בעיצוב היו תמונות שכבר קיימות באתר (hero ≈ `event-5-cover`, slides = `tanya-shin/work-01/02`, פורטרט = `portrait-v2`); אומתו עם `magick compare -metric RMSE` (<2% = זהה). הורדנו בפועל רק תמונה חדשה אחת. (2) **סדר sections שונה במובייל** (תמונה→כותרת→גלריה→טקסט→אומנים, הטקסט אחרי הגלריה!) נפתר עם `display:contents` על `.event-hero`/`.row`/`.text-col` במובייל + `order` על הילדים — DOM אחד, שני סדרים, בלי שכפול. (3) **Triptych עם fit שונה למרכז ולצדדים:** `.is-center{object-fit:contain;background:#F9F9F9}` + peeks `cover` (Figma מציג עבודה ריבועית במלואה במרכז). (4) **קישור אומן על slides:** עטיפת `<img class="tri-slide">` ב-`<a href="artist">` עובדת — הקומפוננטה עושה `preventDefault` על קליק-peek (סיבוב) ומאפשרת ניווט רק בקליק על המרכז; עומד בבדיקת artist-linking §7. (5) **Hero גרעיני (film grain) לא נדחס** — חיתוך מראש ל-3:4 (היחס הנראה בפועל) + `cwebp -q70 -sharp_yuv` הוריד 2.9MB→572KB.
- **2026-06-01 — Homepage `#press` full resync (nodes `428:430` / `428:253`):** הסקשן עבר לסדר ומדיה חדשים עם 8 כרטיסים (כולל `HOW MANY PARTNERS HAVE YOU HAD?` ב-`26.5.2026` והחזרת `דה פיינל קאונטדאון` ב-`31.12.2025`). כדי לשמור התאמה בין desktop/mobile בלי כפילות markup: שומרים סדר DOM לפי מובייל, ומפעילים `press-row--swap` רק על השורות שצריכות היפוך ויזואלי בדסקטופ.
- **2026-06-01 — Homepage `#press` new event card order:** כרטיס אירוע חדש ("מבט מקרוב: מפגש פתוח בתוך התערוכה | טניה שין", `2.6.2026`) נוסף מ-Figma (`XhGH...::428:445` דסקטופ, `XhGH...::427:128` מובייל) ונכנס **ראשון למעלה** בתוך `press-rows`. בהוספת כרטיסים מעל הרשימה: מעדכנים גם `data/press.json` (entity חדש) וגם `data/homepage.json::press_section.item_ids` לפני שינוי `index.html`.
- **2026-05-31 — Homepage `#press` time-out refresh:** כרטיס `time out | תרבות` עודכן מתוכן+מדיה של Figma (`XhGH...::412:583` דסקטופ, `XhGH...::412:996` מובייל). כשיש עדכון כרטיס בלבד (לא כתבת long-form חדשה), מעדכנים את ה-card ב-`index.html` ואת meta הרשומה ב-`data/press.json` (title/date/cover + figma_home_card_*), בלי לשנות את דף הכתבה.
- **2026-05-14 — Homepage `#tribe-teaser` mobile strip:** מדיה קנונית — Figma `250:98` (`XhGH289YTRcW811wrufRJz`). ארבע המוזאות **לא** `<a href>` — `div.tribe-thumb-card` עם `data-artwork-src`/`data-artwork-title` בלבד; **ללא** `data-artwork-link` ⇒ לייטבוקס בלי כפתור מעבר לתערוכה. `data-artwork-gallery="tribe-teaser"` ל-prev/next; ניווט לתערוכה רק דרך `.tribe-teaser-head`. תמונות ב-`images/homepage/tribe-teaser/thumb-*.webp`; meta ב-`homepage.json` (`figma_gallery_strip`, `gallery_images[]`).
- **2026-05-14 — `exhibition.html` curator band:** סקשן `.ex-curator` מתחת ל־`.ex-artists` כש־`exhibitions.json` מגדיר `curator_slug` (loneliness + how-many → `korin-avraham`). עיצוב משותף עם רצועת האומנים (178×148 דסקטופ, 96×80 מובייל); תוכן הכרטיס מ־`curators.json` (`portrait`, `badge_en`, שם). קישור ל־`pages/curators/<slug>.html`. Figma: `301:2` + `119:702` (`XhGH289YTRcW811wrufRJz`).
- **2026-05-14 — Curator profile (`/curators/korin-avraham`):** דף ב-`pages/curators/korin-avraham.html` מ-Figma `314:4` + `314:97` (`XhGH289YTRcW811wrufRJz`). נתוני אוצרת ב-`data/curators.json`; כרטיסי תערוכות נבנים מ-`exhibitions.json` + `galleries.json` (אין שכפול כותרות/מיקומים). אוברליי כרטיסים תואם ל-`exhibition.html` (Solway + FbEzmel + `hero_overlay_en_only` ל-how-many). מובייל: סדר כרטיסים how-many→loneliness ב-`order:-1` על `.cur-card--how-many`. פורטרט משתמש ב-`images/curators/korin-avraham/portrait.webp` (ייצוא מ-Figma node `314:122`; LCP + `fetchpriority="high"`).
- **2026-05-14 — `<image-gallery>` seamless loop:** ב-`components/gallery.js`, כש־`data-loop` פעיל (ברירת מחדל) ויש לפחות שני slides, נבנית מסילה `[clone של אחרון] + מקוריים + [clone של ראשון]`. המעבר אחרון↔ראשון הוא אנימציה של פריים אחד; ב־`transitionend` מתבצעת התאמת מיקום ללא transition כך שלא עוברים ויזואלית על כל הסט. `gallery:change` והנקודות נשארים מבוססי אינדקס לוגי (0…n−1).
- **2026-05-11 — Event page loneliness (`/events/loneliness`):** נבנה ב-`pages/events/loneliness.html` מ-Figma `1213:1873`+`1213:2099` (`Zn3N3mBQkbYER7tTJMbCcz`). 22 imageRefs ל-`images/events/loneliness/`. מבנה: hero בנד אפור עם image card + טקסט גוף ארוך, שני slideshows, atmosphere (image+artists list), 14-thumb opening grid. במובייל: hero → תמונה full-screen + טקסט אחרי, slideshow → 3 תמונות עם peek-from-sides (left:-74, right:315 — יוצא מ-viewport מכוון), moments grid → סקרול אופקי 200px cards.
- **2026-05-11 — Share + Bookmark feature:** ב-`components/site-chrome.{js,css}` (single source of truth). כל דף עם `<site-header>` מקבל בחינם: bookmark badge, modal saved list, toast. הדף רק מציין item דרך `data-item-*` על `[data-bookmark-toggle]` + `[data-share-btn]`. localStorage key `zr-bookmarks`. תיעוד מלא ב-components.md §5.
- **2026-05-11 — Header bookmark icon = position:absolute:** `position:absolute; right:100%` של `.nav-right`. Default `display:none`, מופיע רק עם `.has-items` (`refreshCount()` ב-site-chrome.js). show/hide לא מזיז שום אלמנט.
- **2026-05-11 — Reusable `<image-gallery>`:** ב-`components/gallery.{js,css}`. דף `exhibition.html` הוא הצרכן הראשון — `gallery_images[]` ב-JSON. **כלל אצבע:** Figma → תמונה אחת + dots → `<image-gallery>`. תיעוד: components.md §2.
- **2026-05-11 — Event page ktuba (`/events/ktuba`):** נבנה ב-`pages/events/ktuba.html` מ-Figma frames חדשים ב-`landing` (`XhGH289YTRcW811wrufRJz`): desktop `119:1651`, mobile `119:1509`. הגרסה הישנה ב-`Zn3N…::1213:1644/1502` נשמרה כ-legacy. 4 imageRefs ל-`images/events/ktuba/` + 10 portraits ל-`images/events/ktuba/artists/`. מבנה: hero grey-band עם image card 492×744 (`EXHIBITION VOLUME 1`) ו-title+meta+poem בעמודה השנייה; slideshow band peek-main-peek 7-dots; paragraph תיאור; artists strip 11 כרטיסים. במובייל: image card → full-width 520h למעלה, title+meta+poem מתחת.
- **2026-05-11 — Triptych Gallery component:** הוצא מ-about.html (היה inline `atc-*`) ל-`components/triptych-gallery.{css,js}`. צרכנים: `about.html` (7 פורטרטים) + `events/ktuba.html` (slideshow band, 7 dots על 3 צילומים אמיתיים). CSS vars לקסטומיזציה פר-דף. תיעוד: components.md §4.
- **2026-05-11 — Figma frame moves across files:** frames של ktuba הועברו מ-`Zn3N…` ל-`XhGH…` ע"י המעצב. **figma_node_id מקבל משמעות רק יחד עם fileKey.** sitemap שומר canonical + legacy. נוסף field `figma_file` ל-`data/events.json`.
- **2026-05-11 — Mobile horizontal-scroll מ-titles גדולים:** הומפייג' נתן scroll אופקי במובייל בגלל `.ex-now .titles .l` (91px) ו-`.exhibitions-titles .b` (58px). **פתרון:** (1) `html{overflow-x:clip}` + `body{overflow-x:clip;max-width:100vw}` — `overflow-x:hidden` רק על body לא תמיד מספיק. (2) `clamp(min, vw-value, max)` במקום fixed-px ל-≥48px. `vw-value` ≈ `figma_px / figma_viewport × 100`. (3) `white-space:nowrap` + `max-width:100%;overflow:hidden` על הקונטיינר. **חוק:** font-size ≥48px במובייל → תמיד clamp() + בדיקת word-width מול 320px.
- **2026-05-13 — Lang-aware font routing ל-JSON-driven text:** באג שהתגלה ב-`pages/artists/artist.html?slug=gal-polk` — כותרת work `״DON'T LOSE YOUR HEAD״` רוּנדרה ב-serif fallback של מערכת ההפעלה כי `.work .title` היה hardcoded `font-family:var(--heb)` ו-FbEzmel חסר Latin glyphs. אותה בעיה אותרה ב-`.alb-title`/`.alb-alt` (lightbox) וב-`.bm-title` (bookmark modal). **הפתרון:** זיהוי שפה בזמן render (regex `[א-ת]` — letters בלבד, גרשיים `״` לא נספרים) + class `is-he`/`is-en` שמפעיל font + direction + text-transform נכונים. דפוס מתועד ב-`docs/conventions.md §5.1` — להעתיק לכל renderer חדש מ-JSON. בנוסף, ב-`titleHtml()` ב-artist.html נוסף passthrough בטוח ל-`<span class="lat">` בלבד בתוך כותרות מ-JSON (טיפול ב-`la-raz-porta`, `zohar-shtrit` שמכילים markup מובנה). **חוק כללי:** כל אלמנט שמרנדר ערך מ-JSON שעלול להיות עברית **או** אנגלית — חובה lang-class. אסור להניח שפה.
- **2026-05-12 — Site-wide perf pass (כללי-זהב §8.11):** פעולות שביצעתי במכה אחת, כל אחת היא הרגל קבוע מהיום והלאה: (1) **Google Fonts הוסר** — Inter הוחלף ב-`var(--cop)` בכפתור Newsletter; חסך 3 בקשות חיצוניות חוסמות-render לכל דף. (2) **`src=*.png` הוחלף ב-`*.webp`** בכל ה-HTML/JSON — ה-PNG לא קיים בשרת (רק `_originals/` המקומי), אז קריאת `*.png` היתה 404 ואז JS היה ממיר. עכשיו הדפדפן מתחיל fetch מיד. עודכן `components/picture-upgrade.js` שיוסיף רק `<source type="image/avif">` כש-src כבר `.webp` (תאימות לאחור ל-`.png` נשמרה). (3) **`loading="lazy" decoding="async"`** נוסף לכל `<img>` חוץ מהראשון בדף (שמקבל `fetchpriority="high"` כי הוא ה-LCP). (4) **`width="N" height="N"`** הוזרק ל-102 imgs מהדימנשנים האמיתיים של הקובץ (`sips -g pixelWidth/pixelHeight`; SVG מ-`viewBox`). מונע CLS. (5) **`reel.mp4` נדחס** מ-18MB ל-11MB עם `ffmpeg -crf 30 -preset slower -vf fps=24 -an`. דפי-יחיד שמייצרים imgs ב-JS (artist.html, exhibition.html, opencall.html, ktuba artists strip) דורשים תיקון נפרד בקוד ה-JS — לא מכוסה ב-static rewrite.
- **2026-05-14 — `exhibition.html` artist strip href depth:** קישורי אומן רונדרו ב-JS עם `../artists/<slug>.html`. הקובץ נמצא ב-`pages/exhibition.html` (אותה רמת תיקייה כמו `works.html`), אז `..` יוצא לשורש האתר → בקשה ל-`/artists/...` שלא קיים (404). **תיקון:** `artists/<slug>.html` בלבד. דפים תחת `pages/press/` או `pages/events/` נשארים עם `../artists/` — זה נכון. ראה `docs/artist-linking.md` טבלת נתיבים.
