/* ============================================================
   EMBED IFRAME — art.zrp.co.il inside sales-site iframe
   ------------------------------------------------------------
   When the page runs inside an iframe (e.g. embedded on the
   commerce site), all links open in a new tab and height is
   posted to the parent for dynamic iframe sizing.

   Direct visits (window.self === window.top): no-op.

   Loaded from every page next to analytics.js / picture-upgrade.js.
   Parent must listen for postMessage { type: 'resize', source: 'zrp' }.
   ============================================================ */

(function () {
  'use strict';

  if (window.self === window.top) return;

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
    new MutationObserver(function () {
      applyTarget();
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  var lastHeight = 0;
  function sendHeight() {
    if (!document.body) return;
    var h = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    if (Math.abs(h - lastHeight) > 5) {
      lastHeight = h;
      window.parent.postMessage({ type: 'resize', height: h, source: 'zrp' }, '*');
    }
  }

  if ('ResizeObserver' in window && document.body) {
    new ResizeObserver(sendHeight).observe(document.body);
  } else {
    setInterval(sendHeight, 500);
  }

  window.addEventListener('load', function () {
    sendHeight();
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 2000);
  });
})();
