/* ============================================================
   EMBED IFRAME — art.zrp.co.il inside sales-site iframe
   ------------------------------------------------------------
   When the page runs inside an iframe (e.g. embedded on the
   commerce site), all links open in a new tab and height is
   posted to the parent for dynamic iframe sizing.

   Direct visits (window.self === window.top): no-op.

   Height is the lowest margin-box pixel of any in-flow element
   (not scrollHeight) — avoids 100vh shells, fixed overlays, and
   sticky nav inflating or clipping the reported size. Each
   element's own margin-bottom is added so the iframe always
   contains the full visual layout.

   Parent must listen for:
     postMessage { type: 'resize', height, source: 'zrp' }

   Parent origin discovery (in priority order):
     1. window.ZRP_EMBED_PARENT_ORIGIN
     2. <meta name="zrp-embed-parent" content="https://...">
     3. document.location.ancestorOrigins[0]   (Chromium/Safari)
     4. URL(document.referrer).origin
     5. '*' (last-resort fallback)

   Debug: add ?zrp_embed_debug=1 — every measurement logs
   reported vs visualBottom (footer) and the delta.
   ============================================================ */

(function () {
  'use strict';

  if (window.self === window.top) return;

  /* ---------- config ---------- */

  var THRESHOLD = 1;                 // 1px — parent has no inner scroll, accuracy matters
  var DEBOUNCE_EARLY_MS = 250;       // looser during initial paint
  var DEBOUNCE_LATE_MS = 80;         // tight after settle
  var EARLY_WINDOW_MS = 10000;       // first 10s use DEBOUNCE_EARLY_MS
  var LATE_DELAYS = [500, 1000, 2000, 3000, 5000, 8000];
  var FORCED_SAFETY_DELAYS = [2000, 5000];

  var EXCLUDE_SELECTOR =
    '.lb, .bm-backdrop, .bookmark-modal, .share-status, ' +
    '.nav-links, [data-zrp-embed-ignore]';

  var DEBUG =
    typeof location !== 'undefined' &&
    /(?:\?|&)zrp_embed_debug=1(?:&|$)/.test(location.search);

  var SCRIPT_START = Date.now();

  /* ---------- parent origin discovery ---------- */

  function discoverParentOrigin() {
    try {
      var override = window.ZRP_EMBED_PARENT_ORIGIN;
      if (typeof override === 'string' && /^https?:\/\//.test(override)) {
        return override;
      }
      var meta = document.querySelector('meta[name="zrp-embed-parent"]');
      if (meta) {
        var c = meta.getAttribute('content');
        if (c && /^https?:\/\//.test(c)) return c;
      }
      var ao = document.location && document.location.ancestorOrigins;
      if (ao && ao.length && /^https?:\/\//.test(ao[0])) {
        return ao[0];
      }
      var ref = document.referrer;
      if (ref) {
        try { return new URL(ref).origin; } catch (e) {}
      }
    } catch (e) {}
    return '*';
  }

  var PARENT_ORIGIN = discoverParentOrigin();

  /* ---------- link targets ---------- */

  function applyTarget() {
    if (!document.querySelector('base[data-zrp-embed]')) {
      var base = document.createElement('base');
      base.target = '_blank';
      base.setAttribute('data-zrp-embed', 'true');
      (document.head || document.documentElement).appendChild(base);
    }

    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') return;
      a.target = '_blank';
      var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (rel.indexOf('noopener') === -1) rel.push('noopener');
      if (rel.indexOf('noreferrer') === -1) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });
  }

  /* ---------- height measurement ---------- */

  function isExcludedFromHeight(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest(EXCLUDE_SELECTOR)) return true;

    var cs = getComputedStyle(el);
    var pos = cs.position;
    if (pos === 'fixed' || pos === 'sticky') return true;
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    if (parseFloat(cs.opacity) === 0 && cs.pointerEvents === 'none') return true;
    return false;
  }

  function marginBottomOf(el) {
    var mb = parseFloat(getComputedStyle(el).marginBottom);
    return isFinite(mb) ? mb : 0;
  }

  function getVisualFooterBottom() {
    var footer = document.querySelector(
      'site-footer .footer, footer.footer, site-footer, footer'
    );
    if (!footer) return 0;
    var rect = footer.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    return Math.ceil(rect.bottom + scrollY + marginBottomOf(footer));
  }

  /* Lowest visual pixel = max over all in-flow elements of
     (boundingRect.bottom + scrollY + own marginBottom). Adding
     marginBottom to every element is safe because we take MAX,
     not SUM — collapsed margins resolve to the larger value. */
  function getRealHeight() {
    var body = document.body;
    if (!body) return 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var maxBottom = 0;

    var de = document.documentElement;
    if (de) {
      var dr = de.getBoundingClientRect();
      maxBottom = Math.max(maxBottom, dr.bottom + scrollY + marginBottomOf(de));
    }
    var br = body.getBoundingClientRect();
    maxBottom = Math.max(maxBottom, br.bottom + scrollY + marginBottomOf(body));

    var nodes = body.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (isExcludedFromHeight(el)) continue;
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      var bottom = rect.bottom + scrollY + marginBottomOf(el);
      if (bottom > maxBottom) maxBottom = bottom;
    }

    if (maxBottom < 1) {
      maxBottom = Math.max(
        body.scrollHeight,
        de ? de.scrollHeight : 0
      );
    }

    return Math.ceil(maxBottom);
  }

  try { window.getRealHeight = getRealHeight; } catch (e) {}

  function getScrollMetrics() {
    var de = document.documentElement;
    var body = document.body;
    return {
      documentElementScrollHeight: de ? de.scrollHeight : 0,
      bodyScrollHeight: body ? body.scrollHeight : 0,
      documentElementOffsetHeight: de ? de.offsetHeight : 0,
      bodyOffsetHeight: body ? body.offsetHeight : 0,
    };
  }

  /* ---------- sending ---------- */

  var lastHeight = 0;
  var debounceTimer = null;
  var rafId = null;

  function postToParent(payload) {
    try {
      window.parent.postMessage(payload, PARENT_ORIGIN);
    } catch (e) {
      try { window.parent.postMessage(payload, '*'); } catch (e2) {}
    }
  }

  function sendHeightNow(opts) {
    if (!document.body) return;
    var force = !!(opts && opts.force);
    var label = (opts && opts.label) || 'auto';
    var h = getRealHeight();
    if (!force && Math.abs(h - lastHeight) <= THRESHOLD) return;
    lastHeight = h;

    postToParent({ type: 'resize', height: h, source: 'zrp' });

    if (DEBUG) {
      var visualBottom = getVisualFooterBottom();
      console.log('[zrp-embed]', {
        label: label,
        forced: force,
        reported: h,
        visualBottom: visualBottom || null,
        delta: visualBottom ? h - visualBottom : null,
        parentOrigin: PARENT_ORIGIN,
        scroll: getScrollMetrics(),
      });
    }
  }

  function currentDebounceMs() {
    return (Date.now() - SCRIPT_START) < EARLY_WINDOW_MS
      ? DEBOUNCE_EARLY_MS
      : DEBOUNCE_LATE_MS;
  }

  function scheduleSendHeight() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () {
        rafId = null;
        requestAnimationFrame(function () { sendHeightNow(); });
      });
    }, currentDebounceMs());
  }

  function forceSend(label) {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sendHeightNow({ force: true, label: label || 'forced' });
      });
    });
  }

  /* ---------- triggers ---------- */

  function watchImages() {
    document.querySelectorAll('img').forEach(function (img) {
      if (img.complete) return;
      img.addEventListener('load', scheduleSendHeight, { once: true });
      img.addEventListener('error', scheduleSendHeight, { once: true });
    });
  }

  function scheduleLatePasses() {
    LATE_DELAYS.forEach(function (ms) {
      setTimeout(scheduleSendHeight, ms);
    });
    FORCED_SAFETY_DELAYS.forEach(function (ms) {
      setTimeout(function () { forceSend('safety-' + ms + 'ms'); }, ms);
    });
  }

  function onReady() {
    applyTarget();
    watchImages();
    scheduleSendHeight();
    scheduleLatePasses();
    if (DEBUG) {
      console.log('[zrp-embed] ready', {
        parentOrigin: PARENT_ORIGIN,
        debounceEarly: DEBOUNCE_EARLY_MS,
        debounceLate: DEBOUNCE_LATE_MS,
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  window.addEventListener('load', function () {
    watchImages();
    scheduleSendHeight();
    scheduleLatePasses();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      scheduleSendHeight();
      setTimeout(function () { forceSend('fonts-ready+200ms'); }, 200);
    });
  }

  /* Re-measure when a nested iframe/lottie posts its own resize. */
  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (d && typeof d === 'object' && d.type === 'resize' && d.source !== 'zrp') {
      scheduleSendHeight();
    }
  });

  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      applyTarget();
      watchImages();
      scheduleSendHeight();
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open'],
    });
  }

  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(scheduleSendHeight);
    function observeResizeTargets() {
      if (document.documentElement) ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
      var main = document.getElementById('page');
      if (main) ro.observe(main);
      var sf = document.querySelector('site-footer');
      if (sf) ro.observe(sf);
    }
    if (document.body) {
      observeResizeTargets();
    } else {
      document.addEventListener('DOMContentLoaded', observeResizeTargets);
    }
  } else {
    setInterval(scheduleSendHeight, 500);
  }
})();
