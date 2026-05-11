/* ============================================================
   PICTURE UPGRADE — auto-wrap <img src="*.png"> into <picture>
   with AVIF + WebP sources at the same path. Original PNGs are
   removed from the deployed images/ dir (kept locally in
   _originals/, gitignored). Modern browsers fetch AVIF first,
   then WebP, then the <img> src (also WebP).
   Works for static markup and for elements injected dynamically
   from JSON via JS — a MutationObserver picks them up.
   ============================================================ */
(function () {
  'use strict';
  if (window.__picUpgradeInit) return;
  window.__picUpgradeInit = true;

  function makePicture(img) {
    if (!img || img.tagName !== 'IMG') return;
    if (img.dataset.picDone === '1') return;
    // already inside <picture>? leave alone but mark.
    if (img.parentNode && img.parentNode.tagName === 'PICTURE') {
      img.dataset.picDone = '1';
      return;
    }
    var src = img.getAttribute('src') || '';
    var m = src.match(/^(.*)\.png(\?.*)?$/i);
    if (!m) { img.dataset.picDone = '1'; return; }
    var base = m[1];
    var q = m[2] || '';
    var avif = base + '.avif' + q;
    var webp = base + '.webp' + q;

    var pic = document.createElement('picture');
    var sA = document.createElement('source');
    sA.srcset = avif; sA.type = 'image/avif';
    var sW = document.createElement('source');
    sW.srcset = webp; sW.type = 'image/webp';
    pic.appendChild(sA);
    pic.appendChild(sW);

    var parent = img.parentNode;
    if (!parent) { img.dataset.picDone = '1'; return; }
    parent.insertBefore(pic, img);
    // copy srcset if present (responsive cases) — replace .png with .webp
    var ss = img.getAttribute('srcset');
    if (ss) img.setAttribute('srcset', ss.replace(/\.png\b/gi, '.webp'));
    img.setAttribute('src', webp);
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
        // src attribute changed on an existing <img>?
        if (m.type === 'attributes' && m.target && m.target.tagName === 'IMG') {
          // src changed — rebuild picture wrapper
          var img = m.target;
          // if already wrapped, update sibling <source> srcsets
          if (img.parentNode && img.parentNode.tagName === 'PICTURE') {
            var src = img.getAttribute('src') || '';
            var mm = src.match(/^(.*)\.png(\?.*)?$/i);
            if (mm) {
              var base = mm[1], q = mm[2] || '';
              var avif = base + '.avif' + q, webp = base + '.webp' + q;
              var sources = img.parentNode.querySelectorAll('source');
              for (var s = 0; s < sources.length; s++) {
                var t = sources[s].type;
                if (t === 'image/avif') sources[s].srcset = avif;
                else if (t === 'image/webp') sources[s].srcset = webp;
              }
              img.setAttribute('src', webp);
            }
          } else {
            // not yet wrapped — wrap now
            img.dataset.picDone = '';
            makePicture(img);
          }
          continue;
        }
        // new nodes added?
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
