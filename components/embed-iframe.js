/* ============================================================
   EMBED IFRAME — art.zrp.co.il inside sales-site iframe
   ------------------------------------------------------------
   When the page runs inside an iframe (e.g. embedded on the
   commerce site), all links open in a new tab and height is
   posted to the parent for dynamic iframe sizing.

   Direct visits (window.self === window.top): no-op.

   Height uses the lowest visible in-flow pixel (bounding rect),
   not scrollHeight — avoids 100vh shells, fixed overlays, and
   sticky nav inflating or clipping the reported size.

   Parent must listen for postMessage { type: 'resize', source: 'zrp' }.

   Debug: add ?zrp_embed_debug=1 to log scroll vs content metrics.
   ============================================================ */

(function () {
  'use strict';

  if (window.self === window.top) return;

  var THRESHOLD = 5;
  var DEBOUNCE_MS = 80;
  var LATE_DELAYS = [1000, 3000, 5000];

  var EXCLUDE_SELECTOR =
    '.lb, .bm-backdrop, .bookmark-modal, .share-status, ' +
    '.nav-links, [data-zrp-embed-ignore]';

  var DEBUG =
    typeof location !== 'undefined' &&
    /(?:\?|&)zrp_embed_debug=1(?:&|$)/.test(location.search);

  /* ---------- link targets (unchanged behaviour) ---------- */

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTarget);
  } else {
    applyTarget();
  }

  if ('MutationObserver' in window) {
    new MutationObserver(applyTarget).observe(document.documentElement, {
      childList: true,
      subtree: true,
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

  function elementBottom(el, scrollY, includeMarginBottom) {
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return 0;
    var bottom = rect.bottom + scrollY;
    if (includeMarginBottom) {
      bottom += parseFloat(getComputedStyle(el).marginBottom) || 0;
    }
    return bottom;
  }

  function getRealHeight() {
    var body = document.body;
    if (!body) return 0;

    var scrollY = window.scrollY || window.pageYOffset || 0;
    var maxBottom = 0;

    var footer = document.querySelector('site-footer .footer, footer.footer');
    if (footer && !isExcludedFromHeight(footer)) {
      maxBottom = Math.max(maxBottom, elementBottom(footer, scrollY, true));
    }

    var nodes = body.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (isExcludedFromHeight(el)) continue;
      var bottom = elementBottom(el, scrollY, false);
      if (bottom > maxBottom) maxBottom = bottom;
    }

    if (maxBottom < 1) {
      maxBottom = Math.max(
        body.scrollHeight,
        document.documentElement.scrollHeight
      );
    }

    return Math.ceil(maxBottom);
  }

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

  var lastHeight = 0;
  var debounceTimer = null;
  var rafId = null;

  function sendHeightNow() {
    if (!document.body) return;
    var h = getRealHeight();
    if (Math.abs(h - lastHeight) <= THRESHOLD) return;
    lastHeight = h;
    window.parent.postMessage(
      { type: 'resize', height: h, source: 'zrp' },
      '*'
    );
    if (DEBUG) {
      console.log('[zrp-embed]', {
        reported: h,
        contentBottom: h,
        scroll: getScrollMetrics(),
      });
    }
  }

  function scheduleSendHeight() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () {
        rafId = null;
        requestAnimationFrame(sendHeightNow);
      });
    }, DEBOUNCE_MS);
  }

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
  }

  function onReady() {
    applyTarget();
    watchImages();
    scheduleSendHeight();
    scheduleLatePasses();
    if (DEBUG) {
      console.log('[zrp-embed] initial metrics', {
        real: getRealHeight(),
        scroll: getScrollMetrics(),
        footer: (function () {
          var f = document.querySelector('site-footer .footer, footer.footer');
          if (!f) return null;
          var r = f.getBoundingClientRect();
          return {
            bottom: r.bottom + (window.scrollY || 0),
            marginBottom: getComputedStyle(f).marginBottom,
          };
        })(),
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
    document.fonts.ready.then(scheduleSendHeight);
  }

  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      scheduleSendHeight();
      watchImages();
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
