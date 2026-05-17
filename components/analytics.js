/* ============================================================
   ANALYTICS — Google Analytics 4 + Microsoft Clarity
   ------------------------------------------------------------
   Single shared loader for the whole site. Loaded from every
   page next to picture-upgrade.js and embed-iframe.js. Fill in the two IDs below,
   commit, and tracking is live on all 35 pages.

   Empty string in either ID = that service is disabled, no
   network request is made and no globals are created.

   GA4 ID format:     'G-XXXXXXXXXX'   (from analytics.google.com → Admin → Data Streams)
   Clarity ID format: 'abcd123xyz'     (from clarity.microsoft.com → Settings → Setup)
   ============================================================ */

(function () {
  'use strict';

  // ─── EDIT THESE TWO LINES ─────────────────────────────────
  var GA4_MEASUREMENT_ID = 'G-ZBT78P0935';  // e.g. 'G-ABC1234XYZ'
  var CLARITY_PROJECT_ID = 'wsgj0fdy8p';  // e.g. 'qwerty1234'
  // ──────────────────────────────────────────────────────────

  // Don't run in local file:// previews (no real visitor data,
  // and Clarity will spam errors). Comment out if you DO want
  // to test locally.
  if (location.protocol === 'file:') return;

  /* ---------- Google Analytics 4 ---------- */
  if (GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID.indexOf('G-') === 0) {
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
    document.head.appendChild(ga);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      // Anonymize IP is on by default in GA4. Page_view auto-sent.
      // Add custom params here if needed later.
    });
  }

  /* ---------- Microsoft Clarity ---------- */
  if (CLARITY_PROJECT_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
  }
})();
