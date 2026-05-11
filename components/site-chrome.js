/* ============================================================
   SITE CHROME — single source of truth for site header & footer.
   Usage in any HTML page:
     <site-header></site-header>
     ...page content...
     <site-footer></site-footer>
     <script src="<relative path to>/components/site-chrome.js" defer></script>

   The script computes the site root from its own URL, so paths
   inside the header/footer work from any depth (root, /pages/,
   /pages/artists/) and on any host (file://, github.io/repo/).
   ============================================================ */

(function () {
  // ---- Resolve site root from this script's own URL ----------
  const scriptEl = document.currentScript;
  const scriptUrl = new URL(scriptEl.src, location.href);
  // components/site-chrome.js -> site root is one level up.
  const ROOT = new URL('../', scriptUrl);

  function abs(path) {
    return new URL(path, ROOT).href;
  }

  // ---- Inject shared stylesheet (idempotent) -----------------
  if (!document.querySelector('link[data-site-chrome-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = abs('components/site-chrome.css');
    link.setAttribute('data-site-chrome-css', '');
    document.head.appendChild(link);
  }

  // ---- Header markup -----------------------------------------
  function headerHTML() {
    return (
      '<header class="nav">' +
        '<div class="nav-inner">' +
          '<button class="hamburger" aria-label="menu" aria-expanded="false" aria-controls="primary-nav">' +
            '<svg class="hamburger-figma" viewBox="0 0 24 24" fill="#1B1B1B" aria-hidden="true"><path d="M3 4H21V6H3V4ZM3 11H15V13H3V11ZM3 18H21V20H3V18Z"/></svg>' +
            '<span class="hamburger-bars"><span></span><span></span><span></span></span>' +
          '</button>' +
          '<a href="' + abs('index.html') + '" class="logo" aria-label="home" data-nav="home">' +
            '<img class="logo-svg" src="' + abs('images/brand/logo.svg') + '" alt="Zielinski &amp; Rozen" width="177" height="37">' +
            '<span class="mark">ZIELINSKI&nbsp;&amp;&nbsp;ROZEN</span>' +
          '</a>' +
          '<div class="nav-right">' +
            '<button class="hd-bookmark" type="button" data-bookmark-open aria-label="saved posts" aria-haspopup="dialog">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>' +
              '<span class="hd-bookmark-count" data-bookmark-count>0</span>' +
            '</button>' +
            '<ul class="nav-links" id="primary-nav">' +
              '<li class="nav-close-item" role="presentation">' +
                '<button class="nav-close" type="button" aria-label="close menu">' +
                  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>' +
                '</button>' +
              '</li>' +
              '<li><a href="' + abs('index.html') + '#opencall" data-nav="opencall">open call</a></li>' +
              '<li><a href="' + abs('index.html') + '#exhibitions" data-nav="exhibitions">exhibitions</a></li>' +
              '<li><a href="' + abs('pages/works.html') + '" data-nav="works">the art works</a></li>' +
              '<li><a href="' + abs('index.html') + '#galleries" data-nav="galleries">the galleries</a></li>' +
              '<li><a href="' + abs('pages/about.html') + '" data-nav="about">about</a></li>' +
              '<li><a href="' + abs('index.html') + '#press" data-nav="press">press &amp; events</a></li>' +
            '</ul>' +
            '<aside class="bookmark-modal" data-bookmark-modal hidden role="dialog" aria-label="saved posts">' +
              '<div class="bm-head"><h3>SAVED</h3><button data-bookmark-close type="button" aria-label="close">×</button></div>' +
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
  //   Mobile: newsletter + centered copyright only (no links, no icons).
  function footerHTML() {
    return (
      '<footer class="footer">' +
        '<div class="newsletter">' +
          '<h3>Stay Informed</h3>' +
          '<form onsubmit="event.preventDefault()">' +
            '<textarea class="newsletter-email" name="email" rows="1" inputmode="email" autocomplete="email" placeholder="Email Address" aria-label="Email Address" spellcheck="false"></textarea>' +
            '<button type="submit">SUBSCRIBE</button>' +
          '</form>' +
        '</div>' +
        '<div class="footer-right">' +
          '<nav class="footer-menu" aria-label="footer links">' +
            '<div class="footer-row">' +
              '<a href="#">יצירת קשר</a>' +
              '<a href="#">הצהרת נגישות</a>' +
            '</div>' +
            '<div class="footer-row">' +
              '<a href="' + abs('index.html') + '#galleries">גלריית כיכר המדינה</a>' +
              '<a href="' + abs('index.html') + '#galleries">גלריית כיכר דיזינגוף</a>' +
              '<a href="' + abs('index.html') + '#galleries">גלריית שוק הפשפשים</a>' +
            '</div>' +
          '</nav>' +
          '<p class="footer-copy">© 2026 THE art GALLERY<br>ZiELINSKI &amp; ROZEN ALL RIGHTS RESERVED.</p>' +
          '<div class="footer-icons">' +
            '<a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>' +
            '<a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z"/></svg></a>' +
            '<a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.6s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C16.4 4 12 4 12 4s-4.4 0-7.8.3c-.4.1-1.4.1-2.3 1-.7.7-.9 2.3-.9 2.3S.7 9.5.7 11.4v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 8 .3 8 .3s4.4 0 7.8-.3c.4-.1 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.8C23.2 9.5 23 7.6 23 7.6zM9.5 15.4V8.7l5.8 3.4-5.8 3.3z"/></svg></a>' +
            '<a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 6.7a4.8 4.8 0 01-2.8-1 4.8 4.8 0 01-1.9-3.4h-3.3v13.4a2.9 2.9 0 11-2.1-2.8V9.5a6.2 6.2 0 105.4 6.2V9.4a8.1 8.1 0 004.7 1.5V7.6a4.8 4.8 0 010-.9z"/></svg></a>' +
          '</div>' +
        '</div>' +
        '<p class="footer-copy footer-copy--mobile">© 2026 THE art GALLERY ZiELINSKI &amp; ROZEN ALL RIGHTS RESERVED.</p>' +
      '</footer>'
    );
  }

  // ---- Wiring: hamburger toggle ------------------------------
  function wireHamburger(root) {
    const nav = root.querySelector('.nav');
    const btn = nav && nav.querySelector('.hamburger');
    const links = nav && nav.querySelector('.nav-links');
    const closeBtn = nav && nav.querySelector('.nav-close');
    if (!nav || !btn || !links) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
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
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) setOpen(false);
    });
  }

  // ---- Auto-mark active link based on current URL ------------
  function markActive(root) {
    // The current page key is derived from location.pathname.
    // Returns one of: home, opencall, exhibitions, works,
    // galleries, about, press — or null if no match.
    const path = location.pathname;
    const file = path.split('/').pop() || 'index.html';
    let key = null;
    if (file === '' || file === 'index.html') {
      // Home page; sub-section anchors handled below.
      key = 'home';
    } else if (file === 'exhibition.html') {
      key = 'exhibitions';
    } else if (file === 'works.html') {
      key = 'works';
    } else if (file === 'about.html') {
      key = 'about';
    } else if (file === 'opencall.html') {
      key = 'opencall';
    } else if (path.indexOf('/artists/') !== -1) {
      // Artist sub-pages aren't a primary nav target; leave inactive.
      key = null;
    } else if (path.indexOf('/press/') !== -1) {
      key = 'press';
    }
    if (!key) return;
    const link = root.querySelector('.nav-links a[data-nav="' + key + '"]');
    if (link) link.classList.add('active');
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
    if (n === 0 && modal) modal.hidden = true;
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
      t.className = 'bm-title';
      t.textContent = it.title || it.id;
      a.appendChild(t);
      var rm = document.createElement('button');
      rm.className = 'bm-remove';
      rm.type = 'button';
      rm.setAttribute('aria-label', 'remove');
      rm.textContent = '×';
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

  function wireBookmark(root) {
    var hdBtn = root.querySelector('[data-bookmark-open]');
    var modal = root.querySelector('[data-bookmark-modal]');
    var closeBtn = root.querySelector('[data-bookmark-close]');
    if (hdBtn && modal) {
      hdBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        renderList();
        modal.hidden = !modal.hidden;
      });
      if (closeBtn) closeBtn.addEventListener('click', function () { modal.hidden = true; });
      document.addEventListener('click', function (e) {
        if (!modal.hidden && !modal.contains(e.target) && !hdBtn.contains(e.target)) modal.hidden = true;
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') modal.hidden = true;
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
    // Page-level share button(s)
    document.querySelectorAll('[data-share-btn]').forEach(function (btn) {
      if (btn.dataset.shareWired) return;
      btn.dataset.shareWired = '1';
      btn.addEventListener('click', async function () {
        var item = pageItem() || {};
        var data = { title: document.title, url: location.href, text: item.title || '' };
        if (navigator.share) {
          try { await navigator.share(data); } catch (e) { /* user cancel — silent */ }
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          try { await navigator.clipboard.writeText(location.href); toast('LINK COPIED'); }
          catch (e) { toast('SHARE NOT SUPPORTED'); }
        } else {
          toast('SHARE NOT SUPPORTED');
        }
      });
    });
    refreshCount();
    refreshToggle();
  }

  function wireNewsletter(root) {
    var field = root.querySelector('.newsletter-email');
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
})();
