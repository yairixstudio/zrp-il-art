# artist-linking.md — Artist Linking (כלל-ברזל) 🔴

> **קרא את הקובץ הזה כש:** אתה מוסיף או מרנדר תוכן שמזכיר אומן — שם, תמונה, פורטרט, פסקה ב-press article, caption, alt text, פסקת body כלשהי. **חובה לפני סיום משימה** שמגעת באומן.

---

## 0. הכלל

**כל אזכור של אומן באתר — שם, תמונה, או קלף — חייב להיות קישור לדף האומן שלו.** זה כלל-ברזל, לא suggestion. נכשל בזה = הדף לא נחשב מוכן.

חוסר קישור = בעיה ב-UX (משתמש לא מבין שהשם clickable) **וגם** ב-SEO (Google לא מקשר בין הדפים).

---

## 1. על מי חל הכלל?

על כל אומן שיש לו רשומה ב-`data/artists.json` עם `slug` קיים. נכון ל-2026-05-12 יש 22 אומנים רשומים:

```
zohar-ron, eitan-goldson, tanya-shin, nir-giorgio-levin, elsa-ars-brush,
gal-polk, zohar-shtrit, hila-loterstein, sami-david, risa-oz,
zohar-ron-dan-ben-ari, adi-duak, alon, noemi-safir, yarden-amir,
anat-wegier, liel-salman, tal-nehoray,
holy-kadosh, costa-magarakis, maya-nachum-levy, la-raz-porta
```

**אומנים שאינם רשומים** (אורחים בתערוכות אבל אין להם דף — `dan ben-ari` בנפרד, `racheli reuven`, `raz ronen`): להשאיר כטקסט רגיל. **אל תקשר ל-`/artists/<slug>.html` שלא קיים.**

> **2026-05-12 update:** 4 אומנים שלא היו רשומים (`holy-kadosh`, `costa-magarakis`, `maya-nachum-levy`, `la-raz-porta`) קיבלו עכשיו דפים מלאים מתוך Figma `artist-pages-lonely` (`XhGH289YTRcW811wrufRJz::235:874`) ולכן הם כעת חובה לקישור.

---

## 2. איפה חובה לקשר

| מקום | מה לקשר | איך |
|---|---|---|
| גריד אומנים (`pages/works.html`) | תמונה + שם | `<a href="artists/<slug>.html">` סביב התמונה ועוד סביב השם |
| Featured artists בהומפייג' | פורטרט + שם | `<a class="artist" href="pages/artists/<slug>.html">` סביב הקלף השלם |
| Artist strip בדף תערוכה | תמונה + שם | קלף `<a class="card is-linked">` (slug ב-JSON או `_ARTIST_SLUGS` map) |
| תמונת אומן בכתבה (press) | התמונה | `<a class="artist-img-link" href="../artists/<slug>.html">` סביב `<img>` בלבד (לא `<figure>`) |
| `<figcaption>` שמזכיר אומן | השם בלבד | `<a class="artist-link" href="../artists/<slug>.html">` סביב המופע הראשון |
| פסקת body (`<p>...האומנת X...`) | כל מופע של שם | `<a class="artist-link">` |
| `<aside>`, `pull-quote`, `caption` | אותו דבר | `<a class="artist-link">` |
| Lightbox כותרת | טקסט שמכיל שם אומן | קשר את השם |

---

## 3. CSS להעתקה

הוגדר ב-`pages/press/*.html` וב-`pages/works.html`. (בעתיד להעביר ל-`components/site-chrome.css`.)

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

---

## 4. למה לא lightbox?

ב-`/works.html` ההחלטה הקדומה הייתה image-click → lightbox. שונתה 2026-05-11: image-click → artist page. Lightbox נשמר רק כשהוא חושף תוכן שאין דרך אחרת להגיע אליו (artwork details בדף האומן ב-`pages/artists/artist.html`). **בכל מקום אחר, image of an artist → artist page.**

---

## 5. נתיבים יחסיים (לדף `alon`)

| מאיפה | href |
|---|---|
| `index.html` (root) | `pages/artists/alon.html` |
| `pages/works.html` | `artists/alon.html` |
| `pages/about.html` | `artists/alon.html` |
| `pages/press/walla.html` | `../artists/alon.html` |
| `pages/events/loneliness.html` | `../artists/alon.html` |
| `pages/exhibition.html` (rendered) | `../artists/alon.html` |
| בתוך `pages/artists/X.html` (לאומן אחר) | `Y.html` |

---

## 6. רנדור דינמי מ-JSON

אם דף מרנדר תוכן אומנים מ-JSON (כמו `exhibition.html` שטוען `data/exhibitions.json`):

1. **הוסף `slug` לכל אומן ב-JSON.** רנדור ללא slug → name→slug lookup שביר, שוכח אומנים.
2. **בקוד הרנדור:** אם `a.slug` קיים → `<a href="...artists/${a.slug}.html">`. אם null → `<div>` רגיל. אסור לקשר ל-`/artists/holy-kadosh.html` שלא קיים.
3. **דוגמה:** `pages/exhibition.html` — `_ARTIST_SLUGS` + `linkable ? 'a' : 'div'`.

---

## 7. בדיקה לפני סיום (חובה)

```bash
# כל תמונה לאומן עטופה ב-anchor?
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

# שמות עבריים בלי anchor — eyeball test על דף חדש.
```

---

## 8. חריגים יחידים

- שם אומן בתוך עצם דף האומן (`pages/artists/<slug>.html`) — לא מקשר לעצמו.
- אומן שאינו רשום (`racheli reuven`, `raz ronen`, `dan ben-ari` בנפרד) — להשאיר טקסט.
- שם הבעלים/founder (`ארז זילינסקי רוזן`) → `pages/about.html`, לא `/artists/`.

---

## 9. תזכורת — תמיד לקשר

גם בכותרת. גם ב-alt. גם ב-aria-label. גם בקפשן. גם ב-aside. אל תוסיף "סטטי טקסט עם שם אומן" בלי לקשר.
