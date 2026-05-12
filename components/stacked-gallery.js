/* ============================================================
   STACKED GALLERY — peek/main multistate behavior
   Usage: see ../components/stacked-gallery.css header + CLAUDE.md §15.

   Modes (class on .stacked-gallery):
     sg-mode-swap     — peek click swaps; main click follows its <a href>
     sg-mode-lightbox — passive; relies on artwork-lightbox.js delegation
                        (each .sg-item needs data-artwork-src or data-artwork-id)
     sg-mode-static   — no interaction

   Each .sg-item may contain <img>, <video>, or both. When an item becomes
   main, contained <video> plays (muted/playsinline); when peek, pauses.

   Optional info bar: <div class="sg-info"><span data-info="X">…</span>…</div>
   Each span gets text from active main's data-info-X attribute.

   Public API: window.StackedGallery.refresh() — re-bind after dynamic DOM updates
   ============================================================ */
(function(){
  'use strict';

  if (window.__sgInit) return;
  window.__sgInit = true;

  function modeOf(root){
    if (root.classList.contains('sg-mode-lightbox')) return 'lightbox';
    if (root.classList.contains('sg-mode-static'))   return 'static';
    return 'swap';
  }

  function items(stack){
    return Array.prototype.slice.call(stack.querySelectorAll('.sg-item'));
  }

  function syncVideo(stack){
    items(stack).forEach(function(el){
      var vid = el.querySelector('video');
      if (!vid) return;
      if (el.classList.contains('is-main')){
        try {
          vid.muted = true;
          vid.playsInline = true;
          vid.setAttribute('playsinline','');
          var p = vid.play();
          if (p && typeof p.catch === 'function') p.catch(function(){});
        } catch(_){}
      } else {
        try { vid.pause(); } catch(_){}
      }
    });
  }

  function updateInfoFrom(infoEl, mainEl){
    if (!infoEl || !mainEl) return;
    infoEl.classList.add('is-changing');
    setTimeout(function(){
      var spans = infoEl.querySelectorAll('[data-info]');
      Array.prototype.forEach.call(spans, function(span){
        var key = span.getAttribute('data-info');
        if (!key) return;
        var camel = 'info' + key.charAt(0).toUpperCase() + key.slice(1);
        var val = mainEl.dataset[camel];
        span.textContent = (val == null) ? '' : val;
      });
      infoEl.classList.remove('is-changing');
    }, 180);
  }

  function bindInstance(root){
    if (root.__sgBound) return;
    root.__sgBound = true;

    var stack = root.querySelector('.sg-stack');
    if (!stack) return;
    var info  = root.querySelector('.sg-info');
    var mode  = modeOf(root);
    var busy  = false;

    function swap(){
      if (busy) return;
      var all = items(stack);
      if (all.length !== 2) return;
      busy = true;
      all.forEach(function(el){
        el.classList.toggle('is-main');
        el.classList.toggle('is-peek');
      });
      var newMain = stack.querySelector('.sg-item.is-main');
      if (newMain){
        var id = newMain.dataset.id || newMain.getAttribute('data-active') || '';
        if (id) root.dataset.active = id;
        updateInfoFrom(info, newMain);
        syncVideo(stack);
      }
      setTimeout(function(){ busy = false; }, 600);
    }

    if (mode === 'swap'){
      stack.addEventListener('click', function(e){
        var peek = e.target.closest('.sg-item.is-peek');
        if (peek){ e.preventDefault(); swap(); }
      });
      stack.addEventListener('keydown', function(e){
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var ae = document.activeElement;
        var peek = ae && ae.closest && ae.closest('.sg-item.is-peek');
        if (peek){ e.preventDefault(); swap(); }
      });

      // Swipe left/right to swap (touch + pointer)
      var startX = 0, startY = 0, swiping = false;
      stack.addEventListener('pointerdown', function(e){
        startX = e.clientX; startY = e.clientY; swiping = true;
      });
      stack.addEventListener('pointermove', function(e){
        if (!swiping) return;
        if (Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY) * 1.2){
          e.preventDefault();
        }
      });
      stack.addEventListener('pointerup', function(e){
        if (!swiping) return;
        swiping = false;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 30) swap();
      });
      stack.addEventListener('pointercancel', function(){ swiping = false; });
      stack.style.touchAction = 'pan-y';
    }
    // lightbox/static: no swap binding; clicks (if any) are handled by
    // artwork-lightbox.js delegation on document.

    // Initial state
    var firstMain = stack.querySelector('.sg-item.is-main');
    if (firstMain && info) updateInfoFrom(info, firstMain);
    syncVideo(stack);
  }

  function bindAll(){
    var roots = document.querySelectorAll('.stacked-gallery');
    Array.prototype.forEach.call(roots, bindInstance);
  }

  if (document.readyState !== 'loading') bindAll();
  else document.addEventListener('DOMContentLoaded', bindAll);

  window.StackedGallery = {
    refresh: bindAll,
    init:    bindInstance
  };
})();
