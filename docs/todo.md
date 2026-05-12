# todo.md — Known Gaps & TODO

> **קרא את הקובץ הזה כש:** אתה בודק אם משימה כבר נעשתה, מקבל בקשה הקשורה ל-assets חסרים (logo/placeholder hero), placeholder data, או infrastructure שעוד לא קיים. **בסוף משימה — סמן `[x]` ל-TODO שסגרת ועדכן אם נדבק שמשהו חסר.**

---

## פתוח

- [ ] **Dizengoff archive thumbs** — `archive_thumbnails.tabs[0]` עדיין `_placeholder:true`. כשהגלריה תיפתח ויהיו צילומים מהתערוכה — לעדכן את 4 ה-`image` paths ב-`data/exhibitions.json` *ובמקביל* ב-fallback inline JSON ב-`index.html` (id=`fallback-archive`).
- [ ] `images/brand/logo.svg` עוד לא קיים.
- [ ] `images/galleries/flea-market/hero.png` — placeholder (עותק של dizengoff).
- [ ] 5 דפי-אומן (`zohar-ron`, `eitan-goldson`, `zohar-shtrit`, `hila-loterstein`, `adi-duak`) — placeholder בלי Figma design.
- [ ] Newsletter form — `event.preventDefault()` בלבד (אין backend).
- [ ] Contact + Accessibility — אין Figma.
- [ ] meta tags / OG / favicon.
- [ ] i18n switcher — data תומך (`*_he`/`*_en`), אין UI.
- [ ] JSON Schema validators ב-`data/_schema/`.
- [ ] **Build step:** הטמעת JSON אוטומטית כ-fallback בכל דף דינמי (כיום ידני).
- [ ] **Partial loader** ל-nav/footer כשנעבור 8 דפים.
- [ ] **Routing decision:** static multi-file vs SPA. **המלצה:** static פשוט עד שמשהו ידרוש דינמיקה.
- [ ] שדות `title`, `year`, `dimensions`, `medium` ב-`data/works.json` וב-`artists.json::works[]`.
- [ ] FbEzmel ל-`components/artwork-lightbox.css` font-stack כשנדרש caption עברי.

---

## סגור

- [x] **ארכיון תערוכות בהומפייג': התאמת thumbs ↔ exhibition_id** (2026-05-11): `archive_thumbnails` הפך ל-array של tabs פר-גלריה. medina → loneliness (4 thumbs אמיתיים). dizengoff → how-many (4 thumbs placeholder).
