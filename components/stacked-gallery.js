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

  function pauseInlineItem(item){
    if (!item) return;
    var vid = item.querySelector('video.sg-inline-video');
    if (vid && !vid.paused){
      try { vid.pause(); } catch(_){}
    }
    item.classList.remove('is-inline-playing');
  }

  function pauseInlineVideosExcept(activeVideo){
    Array.prototype.forEach.call(document.querySelectorAll('.sg-item.is-inline-playing'), function(item){
      var vid = item.querySelector('video.sg-inline-video');
      if (vid !== activeVideo) pauseInlineItem(item);
    });
  }

  function stopAllOtherVideos(activeVideo){
    Array.prototype.forEach.call(document.querySelectorAll('video'), function(vid){
      if (vid === activeVideo) return;
      if (!vid.paused){
        try { vid.pause(); } catch(_){}
      }
      var item = vid.closest && vid.closest('.sg-item.is-inline-playing');
      if (item) item.classList.remove('is-inline-playing');
    });
  }

  function syncVideo(stack){
    items(stack).forEach(function(el){
      // Inline user-play videos (e.g. opencall mobile) — not ambient stack playback.
      var vid = el.querySelector('video:not(.sg-inline-video)');
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

    function swap(after){
      if (busy) return;
      var all = items(stack);
      if (all.length !== 2) return;
      busy = true;
      all.forEach(pauseInlineItem);
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
      setTimeout(function(){
        busy = false;
        if (typeof after === 'function') after(newMain);
      }, 600);
    }

    function playInlineVideo(item){
      if (!item) return;
      var video = item.querySelector('video.sg-inline-video');
      if (!video) return;
      var src = item.getAttribute('data-artwork-video');
      if (src && video.getAttribute('src') !== src){
        video.src = src;
        video.load();
      }
      stopAllOtherVideos(video);
      pauseInlineVideosExcept(video);
      item.classList.add('is-inline-playing');
      try {
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function(){});
      } catch(_){}
    }

    function activateItem(item, after){
      if (!item) return;
      if (item.classList.contains('is-main')){
        if (typeof after === 'function') after(item);
        return;
      }
      if (item.classList.contains('is-peek')) swap(after);
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
    // lightbox/static: non-video clicks (if any) are handled by artwork-lightbox.js delegation.
    // Inline videos still need center-before-play behavior.

    stack.addEventListener('click', function(e){
      var item = e.target.closest('.sg-item[data-artwork-video]');
      if (!item || !stack.contains(item)) return;
      if (!item.hasAttribute('data-artwork-skip')) return;
      var video = item.querySelector('video.sg-inline-video');
      if (!video) return;
      if (item.classList.contains('is-inline-playing') && (e.target === video || video.contains(e.target))){
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      activateItem(item, playInlineVideo);
    }, true);

    Array.prototype.forEach.call(stack.querySelectorAll('video.sg-inline-video'), function(video){
      if (video.__sgInlineBound) return;
      video.__sgInlineBound = true;
      video.addEventListener('play', function(){
        var item = video.closest('.sg-item');
        stopAllOtherVideos(video);
        pauseInlineVideosExcept(video);
        if (item) item.classList.add('is-inline-playing');
      });
      video.addEventListener('pause', function(){
        var item = video.closest('.sg-item');
        if (item) item.classList.remove('is-inline-playing');
      });
      video.addEventListener('ended', function(){
        var item = video.closest('.sg-item');
        if (item) item.classList.remove('is-inline-playing');
      });
    });

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

  document.addEventListener('play', function(e){
    var active = e.target;
    if (!active || active.tagName !== 'VIDEO') return;
    stopAllOtherVideos(active);
  }, true);

  window.StackedGallery = {
    refresh: bindAll,
    init:    bindInstance,
    pauseInlineVideosExcept: pauseInlineVideosExcept
  };
})();
