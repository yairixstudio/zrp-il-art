/* ============================================================
   PICTURE UPGRADE — wrap <img src="*.webp|*.png"> into a <picture>
   element with an AVIF <source>. Original PNGs are NOT deployed
   (kept in _originals/, gitignored); only WebP + AVIF ship.

   Authoring convention (preferred for performance — no JS hop):
     <img src="path/file.webp" ...>
   The script adds an AVIF source pointing to path/file.avif so
   modern browsers fetch AVIF, falling back to the WebP <img>.

   Legacy markup (`src="*.png"`) is still supported: the script
   rewrites src to .webp AND adds AVIF + WebP sources. New markup
   should use .webp directly so the browser can start the fetch
   before this script runs.

   Works for static markup AND for elements injected dynamically
   from JSON via JS — a MutationObserver picks them up.
   ============================================================ */
(function () {
  'use strict';
  if (window.__picUpgradeInit) return;
  window.__picUpgradeInit = true;

  // Match .webp OR .png at end of src (with optional query string).
  // Capture: 1=base path, 2=ext, 3=query.
  var RE = /^(.*)\.(webp|png)(\?.*)?$/i;

  function makePicture(img) {
    if (!img || img.tagName !== 'IMG') return;
    if (img.dataset.picDone === '1') return;
    if (img.parentNode && img.parentNode.tagName === 'PICTURE') {
      img.dataset.picDone = '1';
      return;
    }
    var src = img.getAttribute('src') || '';
    var m = src.match(RE);
    if (!m) { img.dataset.picDone = '1'; return; }
    var base = m[1];
    var ext = m[2].toLowerCase();
    var q = m[3] || '';
    var avif = base + '.avif' + q;
    var webp = base + '.webp' + q;

    var pic = document.createElement('picture');
    var sA = document.createElement('source');
    sA.srcset = avif; sA.type = 'image/avif';
    pic.appendChild(sA);

    // Legacy PNG src → also need an explicit WebP <source> AND rewrite img src.
    if (ext === 'png') {
      var sW = document.createElement('source');
      sW.srcset = webp; sW.type = 'image/webp';
      pic.appendChild(sW);
    }

    var parent = img.parentNode;
    if (!parent) { img.dataset.picDone = '1'; return; }
    parent.insertBefore(pic, img);
    // copy srcset if present (responsive cases) — replace .png with .webp
    var ss = img.getAttribute('srcset');
    if (ss) img.setAttribute('srcset', ss.replace(/\.png\b/gi, '.webp'));
    if (ext === 'png') img.setAttribute('src', webp);
    pic.appendChild(img);
    img.dataset.picDone = '1';
  }

  function upgradeAll(root) {
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    var imgs = scope.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) makePicture(imgs[i]);
  }

  function start() {
    upgradeAll(document);
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'attributes' && m.target && m.target.tagName === 'IMG') {
          var img = m.target;
          if (img.parentNode && img.parentNode.tagName === 'PICTURE') {
            var src = img.getAttribute('src') || '';
            var mm = src.match(RE);
            if (mm) {
              var base = mm[1], ext = mm[2].toLowerCase(), q = mm[3] || '';
              var avif = base + '.avif' + q, webp = base + '.webp' + q;
              var sources = img.parentNode.querySelectorAll('source');
              for (var s = 0; s < sources.length; s++) {
                var t = sources[s].type;
                if (t === 'image/avif') sources[s].srcset = avif;
                else if (t === 'image/webp') sources[s].srcset = webp;
              }
              if (ext === 'png') img.setAttribute('src', webp);
            }
          } else {
            img.dataset.picDone = '';
            makePicture(img);
          }
          continue;
        }
        var added = m.addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'IMG') makePicture(n);
          else if (n.querySelectorAll) upgradeAll(n);
        }
      }
    });
    var startObs = function () {
      if (document.body) {
        mo.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src']
        });
      } else {
        setTimeout(startObs, 10);
      }
    };
    startObs();
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);

  window.PictureUpgrade = { refresh: upgradeAll, upgrade: makePicture };
})();
