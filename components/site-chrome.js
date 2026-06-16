/* ============================================================
   SITE CHROME — single source of truth for site header & footer.
   Usage in any HTML page:
     <site-header></site-header>
     ...page content...
     <site-footer></site-footer>
     <script src="<relative path to>/components/site-chrome.js" defer></script>

   The script computes the site root from its own URL, so paths
   inside the header/footer work from any depth (root, /about/,
   /artists/<slug>/, /press/<slug>/) and on any host (file://,
   github.io/repo/).
   ============================================================ */

(function () {
  // ---- Newsletter signup endpoint (Wix Velo http-function) ---
  // Runs on the site's own Wix server (zrp.co.il). Adds {email} to the Wix
  // contact list via appendOrCreateContact. Source: newsletter-backend/wix-velo/.
  const NEWSLETTER_ENDPOINT = 'https://zrp.co.il/_functions/subscribe';

  // ---- Resolve site root from this script's own URL ----------
  const scriptEl = document.currentScript;
  const scriptUrl = new URL(scriptEl.src, location.href);
  // components/site-chrome.js -> site root is one level up.
  const ROOT = new URL('../', scriptUrl);

  function abs(path) {
    return new URL(path, ROOT).href;
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  const LATIN_RUN = /[A-Za-z][A-Za-z0-9@&'’._?!:,;()/" -]*[A-Za-z0-9?!)]|[A-Za-z]/g;
  function restoreLatSpans(s) {
    return escapeHtml(s).replace(
      /&lt;span class=&quot;lat&quot;&gt;([\s\S]*?)&lt;\/span&gt;/g,
      '<span class="lat">$1</span>'
    );
  }
  function mixedHtml(s) {
    return restoreLatSpans(s).split(/(<span class="lat">[\s\S]*?<\/span>)/g).map(function (part) {
      if (/^<span class="lat">/.test(part)) return part;
      const entities = [];
      const safePart = part.replace(/&(?:[a-zA-Z]+|#\d+|#x[0-9A-Fa-f]+);/g, function (entity) {
        const token = '\x00' + entities.length + '\x00';
        entities.push(entity);
        return token;
      });
      return safePart.replace(LATIN_RUN, function (match) {
        return '<span class="lat">' + match + '</span>';
      }).replace(/\x00(\d+)\x00/g, function (_, idx) { return entities[Number(idx)]; });
    }).join('');
  }

  // ---- Inject shared stylesheet (idempotent) -----------------
  if (!document.querySelector('link[data-site-chrome-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = abs('components/site-chrome.css?v=6');
    link.setAttribute('data-site-chrome-css', '');
    document.head.appendChild(link);
  }

  // ---- Inject favicon links (idempotent) ---------------------
  if (!document.querySelector('link[data-site-chrome-icon]')) {
    const icons = [
      { rel: 'icon',             type: 'image/png', sizes: '16x16',  href: 'favicon-16.png' },
      { rel: 'icon',             type: 'image/png', sizes: '32x32',  href: 'favicon-32.png' },
      { rel: 'icon',             type: 'image/png', sizes: '192x192', href: 'favicon.png' },
      { rel: 'shortcut icon',                                          href: 'favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: 'apple-touch-icon.png' }
    ];
    icons.forEach(function (cfg) {
      const link = document.createElement('link');
      link.rel = cfg.rel;
      if (cfg.type)  link.type  = cfg.type;
      if (cfg.sizes) link.sizes = cfg.sizes;
      link.href = abs(cfg.href);
      link.setAttribute('data-site-chrome-icon', '');
      document.head.appendChild(link);
    });
  }

  // ---- Header markup -----------------------------------------
  function headerHTML() {
    return (
      '<header class="nav">' +
        '<div class="nav-inner">' +
          '<button class="hamburger" aria-label="menu" aria-expanded="false" aria-controls="primary-nav">' +
            '<svg class="hamburger-figma" viewBox="0 0 24 24" fill="#1B1B1B" aria-hidden="true"><path d="M3 4H21V6H3V4ZM3 11H15V13H3V11ZM3 18H21V20H3V18Z"/></svg>' +
            '<svg class="hamburger-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" stroke="#1B1B1B" stroke-width="1.5" fill="none"/></svg>' +
            '<span class="hamburger-bars"><span></span><span></span><span></span></span>' +
          '</button>' +
          '<a href="' + abs('') + '" class="logo" aria-label="home" data-nav="home">' +
            '<img class="logo-svg" src="' + abs('images/header:footer:general/logo.svg') + '" alt="Zielinski &amp; Rozen" width="177" height="37" decoding="async">' +
          '</a>' +
          '<div class="nav-right">' +
            '<button class="hd-bookmark" type="button" data-bookmark-open aria-label="saved posts" aria-haspopup="dialog">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>' +
              '<span class="hd-bookmark-count" data-bookmark-count>0</span>' +
            '</button>' +
            '<ul class="nav-links" id="primary-nav" lang="en">' +
              '<li class="nav-close-item" role="presentation">' +
                '<button class="nav-close" type="button" aria-label="close menu">' +
                  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>' +
                '</button>' +
              '</li>' +
              '<li><a href="' + abs('') + '#opencall" data-nav="opencall">open call</a></li>' +
              '<li><a href="' + abs('') + '#exhibitions" data-nav="exhibitions">exhibitions</a></li>' +
              '<li><a href="' + abs('works/') + '" data-nav="works">the art works</a></li>' +
              '<li><a href="' + abs('artists/') + '" data-nav="artists">the artists</a></li>' +
              '<li><a href="' + abs('') + '#galleries" data-nav="galleries">the galleries</a></li>' +
              '<li><a href="' + abs('about/') + '" data-nav="about">about</a></li>' +
              '<li><a href="' + abs('') + '#press" data-nav="press">press &amp; events</a></li>' +
              '<li class="nav-zrp-cta-item" role="presentation">' +
                '<a class="nav-zrp-cta" href="https://zrp.co.il" target="_blank" rel="noopener" aria-label="the official site — zrp.co.il">' +
                  '<img class="nav-zrp-cta-logo" src="' + abs('images/header:footer:general/logo.svg') + '" alt="Zielinski &amp; Rozen" width="177" height="37" decoding="async" loading="lazy">' +
                  '<span class="nav-zrp-cta-label">the official site</span>' +
                '</a>' +
              '</li>' +
            '</ul>' +
            '<div class="bm-backdrop" data-bookmark-backdrop hidden></div>' +
            '<aside class="bookmark-modal" data-bookmark-modal hidden role="dialog" aria-label="saved posts">' +
              '<div class="bm-head"><h3>MY LIST</h3><button data-bookmark-close type="button" aria-label="close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
              '<ul data-bookmark-list></ul>' +
              '<div class="bm-empty" data-bookmark-empty>אין פוסטים שמורים עדיין</div>' +
            '</aside>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  // ---- Footer markup -----------------------------------------
  // Layout follows Figma desktop (119:2504) + mobile (119:2610):
  //   Desktop: newsletter (300px col, left) | footer-right (column, right):
  //     Frame 180 (meta links row) → Frame 181 (gallery links row) →
  //     Margin (copyright, right-aligned) → Frame 184 (4 social icons row, gap 36)
  //   Mobile: newsletter → compact mirrored links/galleries/social → copyright.
  function footerHTML() {
    var igFb =
      '<a href="https://www.instagram.com/erezzielinskirozen/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.44.41a4.07 4.07 0 011.51.98c.46.46.77.93.98 1.51.17.47.36 1.27.41 2.44.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.41 2.44a4.07 4.07 0 01-.98 1.51 4.07 4.07 0 01-1.51.98c-.47.17-1.27.36-2.44.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.44-.41a4.07 4.07 0 01-1.51-.98 4.07 4.07 0 01-.98-1.51c-.17-.47-.36-1.27-.41-2.44C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.41-2.44a4.07 4.07 0 01.98-1.51 4.07 4.07 0 011.51-.98c.47-.17 1.27-.36 2.44-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.77 5.77 0 00-2.13 1.38A5.77 5.77 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.47 1.38 2.13a5.77 5.77 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.77 5.77 0 002.13-1.38 5.77 5.77 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.77 5.77 0 00-1.38-2.13A5.77 5.77 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" fill="currentColor"/><path d="M12 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8z" fill="currentColor"/><circle cx="18.41" cy="5.59" r="1.44" fill="currentColor"/></svg></a>' +
      '<a href="https://web.facebook.com/ZielinskiRozen/" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M24 12a12 12 0 10-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0024 12z"/></svg></a>';

    return (
      '<footer class="footer">' +
        '<div class="newsletter">' +
          '<h2>Stay Informed</h2>' +
          '<form onsubmit="event.preventDefault()" novalidate>' +
            '<textarea class="newsletter-email" name="email" rows="1" inputmode="email" autocomplete="email" placeholder="Email Address" aria-label="Email Address" spellcheck="false"></textarea>' +
            // Honeypot — hidden from humans; bots that fill it are silently dropped.
            '<div aria-hidden="true" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden">' +
              '<label>Website<input type="text" class="newsletter-hp" name="website" tabindex="-1" autocomplete="off"></label>' +
            '</div>' +
            '<button type="submit">SUBSCRIBE</button>' +
            '<label class="newsletter-consent">' +
              '<input type="checkbox" class="newsletter-consent-cb" name="consent" id="newsletter-consent-cb" required aria-required="true">' +
              '<span class="newsletter-consent-text">קראתי ואני מסכים/ה ל<a href="' + abs('privacy/') + '">מדיניות הפרטיות</a> ולקבלת דיוור מ<span class="lat">Zielinski &amp; Rozen</span> (כולל אתר הבשמים <span class="lat">zrp.co.il</span>) <span class="newsletter-consent-req">(חובה)</span></span>' +
            '</label>' +
            '<p class="newsletter-status" data-newsletter-status role="status" aria-live="polite"></p>' +
          '</form>' +
        '</div>' +
        '<div class="footer-right">' +
          '<nav class="footer-menu" aria-label="footer links">' +
            '<div class="footer-row">' +
              '<a href="' + abs('contact/') + '">יצירת קשר</a>' +
              '<a href="' + abs('accessibility/') + '">הצהרת נגישות</a>' +
              '<a href="' + abs('privacy/') + '">מדיניות פרטיות</a>' +
            '</div>' +
            '<div class="footer-row">' +
              '<a href="' + abs('') + '#galleries">גלריית כיכר המדינה</a>' +
              '<a href="' + abs('') + '#galleries">גלריית כיכר דיזינגוף</a>' +
              '<a href="' + abs('') + '#galleries">גלריית שוק הפשפשים</a>' +
            '</div>' +
          '</nav>' +
          '<p class="footer-copy">© 2026 THE art GALLERY<br>ZiELINSKI &amp; ROZEN ALL RIGHTS RESERVED.</p>' +
          '<div class="footer-icons">' + igFb +
          '</div>' +
        '</div>' +
        '<div class="footer-mobile-extra">' +
          '<nav class="footer-mobile-mini" aria-label="footer links mobile">' +
            '<div class="footer-mobile-row">' +
              '<a href="' + abs('contact/') + '">יצירת קשר</a>' +
              '<a href="' + abs('privacy/') + '">מדיניות פרטיות</a>' +
              '<a href="' + abs('accessibility/') + '">הצהרת נגישות</a>' +
            '</div>' +
            '<div class="footer-mobile-row">' +
              '<a href="' + abs('') + '#galleries">גלריית כיכר המדינה</a>' +
              '<a href="' + abs('') + '#galleries">גלריית כיכר דיזינגוף</a>' +
              '<a href="' + abs('') + '#galleries">גלריית שוק הפשפשים</a>' +
            '</div>' +
          '</nav>' +
          '<div class="footer-icons footer-icons--mobile">' + igFb +
          '</div>' +
          '<p class="footer-copy footer-copy--mobile">© 2026 THE art GALLERY ZiELINSKI &amp; ROZEN ALL RIGHTS RESERVED.</p>' +
        '</div>' +
      '</footer>' +
      '<div class="footer-sponsor">' +
        '<span class="footer-sponsor-label">sponsored by</span>' +
        '<a class="footer-sponsor-logo" href="https://zrp.co.il" target="_blank" rel="noopener" aria-label="sponsored by Zielinski &amp; Rozen — zrp.co.il">' +
          '<img src="' + abs('images/header:footer:general/sponsor-logo.svg') + '" alt="Zielinski &amp; Rozen" width="107" height="32" decoding="async" loading="lazy">' +
        '</a>' +
      '</div>'
    );
  }

  // ---- Logo destination chooser ------------------------------
  // Clicking the header logo opens a small, friendly chooser:
  //   "art gallery home"  (this site)   |   "perfume brand home" (zrp.co.il)
  // Progressive enhancement: the logo stays a real <a href> to the gallery
  // home, so with JS off (or modifier-click) it just navigates there.
  function logoChooserHTML() {
    return (
      '<div class="logo-choose-backdrop" data-logo-choose-backdrop hidden></div>' +
      '<div class="logo-choose-wrap" data-logo-choose-wrap hidden>' +
        '<div class="logo-choose-unit">' +
          '<button class="logo-choose-close" type="button" data-logo-choose-close aria-label="סגירה">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" width="28" height="28"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
          '<div class="logo-choose" data-logo-choose role="dialog" aria-modal="true" aria-label="לאן להגיע">' +
            '<p class="logo-choose-q">לאן תרצו להגיע?</p>' +
            '<div class="logo-choose-opts">' +
              '<a class="logo-choose-opt" href="' + abs('') + '" data-logo-choose-go="art">' +
                '<span class="logo-choose-opt-en">THE art GALLERY</span>' +
                '<span class="logo-choose-opt-he">אתר הגלריות</span>' +
              '</a>' +
              '<a class="logo-choose-opt" href="https://zrp.co.il" target="_blank" rel="noopener" data-logo-choose-go="perfume">' +
                '<span class="logo-choose-opt-en">ZIELINSKI &amp; ROZEN</span>' +
                '<span class="logo-choose-opt-he">מותג הבישום</span>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function wireLogoChooser(root) {
    var logo = root.querySelector('a.logo');
    if (!logo) return;
    // Inject the chooser once at body level (fixed positioning → location-agnostic).
    if (!document.querySelector('[data-logo-choose]')) {
      var holder = document.createElement('div');
      holder.innerHTML = logoChooserHTML();
      while (holder.firstChild) document.body.appendChild(holder.firstChild);
    }
    var wrap = document.querySelector('[data-logo-choose-wrap]');
    var modal = document.querySelector('[data-logo-choose]');
    var backdrop = document.querySelector('[data-logo-choose-backdrop]');
    var closeBtn = document.querySelector('[data-logo-choose-close]');
    if (!wrap || !modal || !backdrop) return;

    var lastFocus = null;
    var scrollLockY = 0;
    function preventTouchMove(e) {
      if (wrap.hidden) return;
      e.preventDefault();
    }
    function lockScroll() {
      scrollLockY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollLockY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
    }
    function unlockScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.removeEventListener('touchmove', preventTouchMove);
      window.scrollTo(0, scrollLockY);
    }
    function open() {
      lastFocus = document.activeElement;
      lockScroll();
      backdrop.hidden = false;
      wrap.hidden = false;
      requestAnimationFrame(function () {
        backdrop.classList.add('is-open');
        wrap.classList.add('is-open');
      });
      var first = modal.querySelector('.logo-choose-opt');
      if (first) first.focus();
    }
    function close() {
      unlockScroll();
      backdrop.classList.remove('is-open');
      wrap.classList.remove('is-open');
      var done = function () {
        wrap.hidden = true;
        backdrop.hidden = true;
        wrap.removeEventListener('transitionend', done);
      };
      wrap.addEventListener('transitionend', done);
      setTimeout(function () { if (!wrap.classList.contains('is-open')) { wrap.hidden = true; backdrop.hidden = true; } }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    logo.addEventListener('click', function (e) {
      // Respect modifier-clicks / middle-click → let the browser do its thing.
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    // Selecting an option navigates normally → just close the overlay state.
    modal.querySelectorAll('[data-logo-choose-go]').forEach(function (opt) {
      opt.addEventListener('click', function () { close(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap && !wrap.hidden) { e.stopPropagation(); close(); }
    });
  }

  // ---- Wiring: hamburger toggle ------------------------------
  function wireHamburger(root) {
    const nav = root.querySelector('.nav');
    const btn = nav && nav.querySelector('.hamburger');
    const links = nav && nav.querySelector('.nav-links');
    const closeBtn = nav && nav.querySelector('.nav-close');
    const openCallLink = nav && nav.querySelector('a[data-nav="opencall"]');
    if (!nav || !btn || !links) return;

    function syncOpenCallHref() {
      if (!openCallLink) return;
      openCallLink.href = abs('') + (window.innerWidth <= 768 ? '#mobile-cta' : '#opencall');
    }

    var savedScrollY = 0;
    function setOpen(open) {
      var wasOpen = nav.classList.contains('is-open');
      if (open === wasOpen) return;
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Scroll-lock: body.menu-open is position:fixed, so we must preserve the
      // page's scroll offset on open and restore it on close (iOS-safe lock).
      if (open) {
        savedScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = (-savedScrollY) + 'px';
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
        document.body.style.top = '';
        window.scrollTo(0, savedScrollY);
      }
    }
    syncOpenCallHref();
    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();   // don't bubble to the .nav-links link handler
        setOpen(false);
      });
    }
    links.addEventListener('click', function (e) {
      if (e.target.closest('.nav-close')) return;   // close button handled above
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
      e.stopPropagation();
      setOpen(false);
    });
    window.addEventListener('resize', function () {
      syncOpenCallHref();
      if (window.innerWidth > 768) setOpen(false);
    });
  }

  // ---- Auto-mark active link based on current URL ------------
  function markActive(root) {
    // The current page key is derived from location.pathname.
    // Returns one of: home, opencall, exhibitions, works,
    // galleries, about, press — or null if no match.
    const path = location.pathname;
    // Strip trailing slash for matching; consider /about/ same as /about.
    const trimmed = path.replace(/\/+$/, '');
    const last = trimmed.split('/').pop() || '';
    let key = null;
    // Home: empty path or root-level index.html (legacy)
    if (path === '/' || path === '' || last === '' || last === 'index.html') {
      key = 'home';
    } else if (path.indexOf('/exhibitions/') !== -1) {
      key = 'exhibitions';
    } else if (path.indexOf('/opencalls/') !== -1 || path.indexOf('/opencall/') !== -1) {
      key = 'opencall';
    } else if (last === 'works' || path.indexOf('/works/') !== -1) {
      key = 'works';
    } else if (last === 'about' || path.indexOf('/about/') !== -1) {
      key = 'about';
    } else if (path.indexOf('/artists/') !== -1) {
      // Both the /artists/ index and individual artist sub-pages highlight "the artists".
      key = 'artists';
    } else if (path.indexOf('/press/') !== -1 || path.indexOf('/events/') !== -1) {
      key = 'press';
    }
    if (!key) return;
    const link = root.querySelector('.nav-links a[data-nav="' + key + '"]');
    if (link) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  }

  // ---- A11y: site-wide skip link + main landmark id ----------
  // Injects a "skip to content" link as the first child of <body> (off-screen
  // until focused, so visually nothing changes). Targets the page's <main> —
  // creates an id on it if missing. If no <main> exists, falls back to the
  // first <section> or to the first sibling AFTER the site-header.
  function ensureSkipLink() {
    // If page already provides a skip link, don't add another.
    if (document.querySelector('.skip-link')) return;
    // Resolve target element
    var target = document.querySelector('main');
    if (!target) {
      // Fallback: first <section> or <article> after the header
      target = document.querySelector('site-header ~ section, site-header ~ article, site-header ~ div');
    }
    if (target && !target.id) target.id = 'main';
    if (target) target.setAttribute('tabindex', target.getAttribute('tabindex') || '-1');
    var a = document.createElement('a');
    a.className = 'skip-link';
    a.setAttribute('data-zr-skip', '');
    a.href = '#' + (target ? target.id || 'main' : 'main');
    a.textContent = 'SKIP TO CONTENT';
    document.body.insertBefore(a, document.body.firstChild);
  }

  // ---- Bookmark + Share (page-level + header) ----------------
  const BM_KEY = 'zr-bookmarks';
  function bmLoad() {
    try { return JSON.parse(localStorage.getItem(BM_KEY)) || []; }
    catch (e) { return []; }
  }
  function bmSave(list) { localStorage.setItem(BM_KEY, JSON.stringify(list)); }
  function bmFindIdx(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  function ensureToast() {
    var t = document.querySelector('[data-share-status]');
    if (t) return t;
    t = document.createElement('div');
    t.className = 'share-status';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.setAttribute('data-share-status', '');
    document.body.appendChild(t);
    return t;
  }
  function toast(msg) {
    var t = ensureToast();
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  function pageItem() {
    // Resolve the current page's "saveable item" from a [data-bookmark-toggle] element on the page,
    // OR from a <meta name="zr:item" content="id|title|date"> in <head>.
    var btn = document.querySelector('[data-bookmark-toggle]');
    if (btn && btn.dataset.itemId) {
      return {
        id: btn.dataset.itemId,
        title: btn.dataset.itemTitle || document.title,
        url: location.href,
        date: btn.dataset.itemDate || ''
      };
    }
    var meta = document.querySelector('meta[name="zr:item"]');
    if (meta) {
      var parts = (meta.getAttribute('content') || '').split('|');
      if (parts[0]) {
        return { id: parts[0], title: parts[1] || document.title, url: location.href, date: parts[2] || '' };
      }
    }
    return null;
  }

  function refreshCount() {
    var n = bmLoad().length;
    var hdBtn = document.querySelector('[data-bookmark-open]');
    if (hdBtn) hdBtn.classList.toggle('has-items', n > 0);
    var countEl = document.querySelector('[data-bookmark-count]');
    if (countEl) countEl.textContent = n;
    // If no items, also force-close any open modal
    var modal = document.querySelector('[data-bookmark-modal]');
    var backdrop = document.querySelector('[data-bookmark-backdrop]');
    if (n === 0) { if (modal) modal.hidden = true; if (backdrop) backdrop.hidden = true; }
  }

  function refreshToggle() {
    var btn = document.querySelector('[data-bookmark-toggle]');
    var item = pageItem();
    if (!btn || !item) return;
    var saved = bmFindIdx(bmLoad(), item.id) >= 0;
    btn.classList.toggle('is-saved', saved);
    btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
    var lbl = btn.querySelector('[data-bookmark-label]');
    if (lbl) lbl.textContent = saved ? 'SAVED' : 'SAVE';
  }

  function renderList() {
    var listEl = document.querySelector('[data-bookmark-list]');
    var emptyEl = document.querySelector('[data-bookmark-empty]');
    if (!listEl) return;
    var list = bmLoad();
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.hidden = list.length > 0;
    list.forEach(function (it) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = it.url;
      var t = document.createElement('span');
      var titleText = it.title || it.id;
      // Hebrew letters (alef-tav, excl. punctuation) → FbEzmel; otherwise → Copperplate UPPER.
      var isHe = /[א-ת]/.test(titleText || '');
      t.className = 'bm-title ' + (isHe ? 'is-he' : 'is-en');
      t.innerHTML = mixedHtml(titleText);
      a.appendChild(t);
      var rm = document.createElement('button');
      rm.className = 'bm-remove';
      rm.type = 'button';
      rm.setAttribute('aria-label', 'remove');
      rm.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>';
      rm.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var l = bmLoad();
        var idx = bmFindIdx(l, it.id);
        if (idx >= 0) { l.splice(idx, 1); bmSave(l); }
        refreshCount();
        refreshToggle();
        renderList();
      });
      a.appendChild(rm);
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }

  function sharePayloads() {
    var item = pageItem() || {};
    var url = location.href;
    var title = document.title || '';
    var text = item.title || title;
    return [
      { title: title, url: url, text: text },
      { title: title, url: url },
      { url: url }
    ];
  }

  function canShareData(data) {
    return !navigator.canShare || navigator.canShare(data);
  }

  async function sharePage() {
    var url = location.href;
    if (navigator.share) {
      var payloads = sharePayloads();
      for (var i = 0; i < payloads.length; i++) {
        var data = payloads[i];
        if (!canShareData(data)) continue;
        try {
          await navigator.share(data);
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast('LINK COPIED');
        return;
      } catch (e) { /* fall through */ }
    }
    toast('SHARE NOT SUPPORTED');
  }

  function wireShareButtons() {
    document.querySelectorAll('[data-share-btn]').forEach(function (btn) {
      if (btn.dataset.shareWired) return;
      btn.dataset.shareWired = '1';
      btn.addEventListener('click', function () {
        sharePage();
      });
    });
  }

  function wireBookmark(root) {
    var hdBtn = root.querySelector('[data-bookmark-open]');
    var modal = root.querySelector('[data-bookmark-modal]');
    var closeBtn = root.querySelector('[data-bookmark-close]');
    var backdrop = root.querySelector('[data-bookmark-backdrop]');
    function showModal() { modal.hidden = false; if (backdrop) backdrop.hidden = false; }
    function hideModal() { modal.hidden = true; if (backdrop) backdrop.hidden = true; }
    if (hdBtn && modal) {
      hdBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        renderList();
        if (modal.hidden) showModal(); else hideModal();
      });
      if (closeBtn) closeBtn.addEventListener('click', hideModal);
      if (backdrop) backdrop.addEventListener('click', hideModal);
      document.addEventListener('click', function (e) {
        if (!modal.hidden && !modal.contains(e.target) && !hdBtn.contains(e.target)) hideModal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hideModal();
      });
    }
    // Page-level toggle button (lives outside the chrome — query whole document)
    var toggleBtn = document.querySelector('[data-bookmark-toggle]');
    if (toggleBtn && !toggleBtn.dataset.bmWired) {
      toggleBtn.dataset.bmWired = '1';
      toggleBtn.addEventListener('click', function () {
        var item = pageItem();
        if (!item || !item.id) return;
        var list = bmLoad();
        var idx = bmFindIdx(list, item.id);
        if (idx >= 0) { list.splice(idx, 1); toast('REMOVED FROM SAVED'); }
        else { list.push(item); toast('SAVED'); }
        bmSave(list);
        refreshCount();
        refreshToggle();
        renderList();
      });
    }
    wireShareButtons();
    refreshCount();
    refreshToggle();
  }

  function wireNewsletter(root) {
    var field = root.querySelector('.newsletter-email');
    var form = root.querySelector('.newsletter form');
    var consentBox = root.querySelector('.newsletter-consent-cb');
    var statusEl = root.querySelector('[data-newsletter-status]');
    if (!field) return;
    field.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (field.form && field.form.requestSubmit) field.form.requestSubmit();
      }
    });
    field.addEventListener('input', function () {
      field.value = field.value.replace(/[\r\n]+/g, ' ');
    });
    if (form) {
      var submitBtn = form.querySelector('button[type="submit"]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!statusEl) return;
        statusEl.classList.remove('is-ok', 'is-err');
        var email = (field.value || '').trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          statusEl.textContent = 'יש להזין כתובת דוא"ל תקינה.';
          statusEl.classList.add('is-err');
          field.focus();
          return;
        }
        if (consentBox && !consentBox.checked) {
          statusEl.textContent = 'יש לאשר את מדיניות הפרטיות.';
          statusEl.classList.add('is-err');
          consentBox.focus();
          return;
        }
        statusEl.textContent = 'שולח…';
        if (submitBtn) submitBtn.disabled = true;
        var hpField = form.querySelector('.newsletter-hp');
        fetch(NEWSLETTER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            consent: true,
            website: hpField ? hpField.value : ''
          })
        })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
              return { ok: res.ok && data && data.ok, data: data };
            });
          })
          .then(function (r) {
            if (submitBtn) submitBtn.disabled = false;
            if (!r.ok) {
              statusEl.classList.add('is-err');
              statusEl.textContent = 'אירעה תקלה ברישום. נסו שוב מאוחר יותר.';
              return;
            }
            statusEl.classList.add('is-ok');
            statusEl.textContent = 'תודה — נרשמת לרשימת התפוצה.';
            field.value = '';
            if (consentBox) consentBox.checked = false;
          })
          .catch(function () {
            if (submitBtn) submitBtn.disabled = false;
            statusEl.classList.add('is-err');
            statusEl.textContent = 'אירעה תקלה ברישום. נסו שוב מאוחר יותר.';
          });
      });
    }
  }

  // ---- Custom elements ---------------------------------------
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = '1';
      this.innerHTML = headerHTML();
      wireHamburger(this);
      markActive(this);
      wireBookmark(this);
      wireLogoChooser(this);
      ensureSkipLink();
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = '1';
      this.innerHTML = footerHTML();
      wireNewsletter(this);
    }
  }

  customElements.define('site-header', SiteHeader);
  customElements.define('site-footer', SiteFooter);
  wireShareButtons();

  // ---- Boot sequencer ----------------------------------------
  // Wait for: chrome hydration + web fonts + optional dynamic data,
  // then reveal body. Safety timeouts cap every wait.
  function chromeReady() {
    return new Promise(function (resolve) {
      function check() {
        var h = document.querySelector('site-header');
        var f = document.querySelector('site-footer');
        var hOk = !h || h.dataset.rendered === '1';
        var fOk = !f || f.dataset.rendered === '1';
        if (hOk && fOk) return resolve();
        requestAnimationFrame(check);
      }
      check();
    });
  }
  function fontsReady() {
    if (document.fonts && document.fonts.ready) return document.fonts.ready;
    return Promise.resolve();
  }
  function dataReady() {
    return new Promise(function (resolve) {
      if (!document.body.classList.contains('is-loading-data')) return resolve();
      var obs = new MutationObserver(function () {
        if (!document.body.classList.contains('is-loading-data')) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    });
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]);
  }
  function reveal() {
    if (document.body.classList.contains('is-ready')) return;
    // Two RAFs: let freshly-rendered content lay out before opacity flips.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('is-ready');
      });
    });
  }
  function startBoot() {
    var ceiling = new Promise(function (r) { setTimeout(r, 1500); });
    Promise.race([
      Promise.all([
        withTimeout(chromeReady(), 1200),
        withTimeout(fontsReady(), 1200),
        withTimeout(dataReady(), 1200)
      ]),
      ceiling
    ]).then(function () {
      wireShareButtons();
      reveal();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBoot);
  } else {
    startBoot();
  }
  window.SiteBoot = { reveal: reveal };
})();
