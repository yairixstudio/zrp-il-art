# SEO Layer — Zielinski & Rozen

> שכבת SEO **head-only** לכל 167 הדפים. **עקרון ברזל:** הכלים כאן נוגעים **אך ורק ב-`<head>`** — לעולם לא ב-`<body>`, לא בטקסט נראה, לא בעיצוב. כל פלט יושב בין `<!-- SEO:auto:start -->` ל-`<!-- SEO:auto:end -->` (אידמפוטנטי).

## מה הוזרק לכל דף (בתוך `<head>` בלבד)
- `<link rel="canonical">` — URL מוחלט תחת `https://art.zrp.co.il`
- `<meta name="robots">` — `index,follow,max-image-preview:large,max-snippet:-1` (ו-`noindex,follow` ל-`404.html`)
- `<meta name="theme-color">` + 4 קישורי **favicon** (הקבצים כבר היו בשורש; לא היו מקושרים)
- **Open Graph** — `og:site_name/locale/type/title/description/url/image` (+`image:width/height/alt`)
- **Twitter** — `summary_large_image` (`twitter:title/description/image`)
- **JSON-LD** (schema.org): `Organization`+`WebSite` (בית), `ProfilePage`+`Person` (אומנים/אוצרת), `VisualArtwork` (יצירות), `ExhibitionEvent`/`Event`, `NewsArticle` (עיתונות), `BreadcrumbList` בכל דף-עומק
- כותרת/תיאור ייחודיים לדפים שהיו גנריים (אומנים/תערוכות/אוצרת), ותיאורי עריכה דו-לשוניים ל-22 דפים מרכזיים

## תמונות שיתוף (`/og/`)
`images/**/*.jpg` חסום ב-`.gitignore` (images = WebP+AVIF בלבד), אבל רשתות חברתיות (פייסבוק/לינקדאין/וואטסאפ) **לא** מציגות WebP בתצוגה מקדימה. לכן `og:image`/`twitter:image` מצביעים ל-**JPG** ב-`/og/` (תיקיית שורש שאינה חסומה). 159 קבצים, שמות שטוחים (`og/works-v2-alon-1.jpg`).

## קבצי שורש
- `robots.txt` — מאפשר הכל, חוסם `/trash/`, מצביע ל-sitemap
- `sitemap.xml` — 166 URLs (כל הדפים פרט ל-404), `lastmod` מ-git log

## רגנרציה (כשמוסיפים דף/יצירה/אומן)
```bash
python3 tools/seo/og_gen.py     # מייצר JPG חדשים ל-/og/ + tools/seo/og-dims.json
python3 tools/seo/inject.py     # מזריק/מעדכן את בלוק ה-SEO בכל הדפים (אידמפוטנטי)
# לרענן sitemap: ראה הסקריפט ב-git history של הקומיט הזה (תחת tools/seo או /tmp)
```
- מקור התוכן: `data/*.json` (אותו schema של הדפים). שדה חסר → להוסיף ל-JSON.
- תוכן עריכה ידני (כותרות/תיאורים מנוסחים): `tools/seo/overrides.json` (`{route: {title?, description}}`).
- `inject.py` קורא overrides + og-dims מ-`tools/seo/` (fallback ל-`/tmp/`).

## אימות (חובה אחרי כל ריצה)
1. **גוף לא נגע:** לכל דף, ה-SEO block כולו בתוך `<head>`, והסרתו משאירה את הגוף byte-identical.
2. כל JSON-LD תקין (parse), canonical/og:url נכונים, `og:image` מצביע לקובץ קיים ולא-חסום, אין `&amp;amp;` (escape כפול).
3. אין כפילות marker/canonical.

נבנה ואומת ב-2026-06-16 (multi-agent: 22 סוכני עריכה + 14 סוכני אימות אדוורסרי + ביקורת-שלמות; 0 ממצאים קריטיים).
