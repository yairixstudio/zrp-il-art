/* ============================================================
   TRIPTYCH GALLERY — coverflow carousel.
   Boots every `.tri` on DOMContentLoaded; observes for added ones.
   Each `.tri` is independent.
   Click on peek = rotate; click on dot = jump; drag/swipe also rotate.
   ============================================================ */
(function(){
  function init(section){
    if(section.__triInit) return;
    section.__triInit = true;

    var frame  = section.querySelector('.tri-frame');
    var slides = section.querySelectorAll('.tri-slide');
    var dots   = section.querySelectorAll('.tri-dot');
    if(!frame || !slides.length) return;

    var count = slides.length;
    var idx   = 0;
    var loop  = section.dataset.triLoop !== 'false';

    /* Caption element — auto-created if any slide has data-caption */
    var captionEl = null;
    if(Array.from(slides).some(function(s){ return s.dataset.caption; })){
      captionEl = document.createElement('div');
      captionEl.className = 'tri-caption';
      section.appendChild(captionEl);
    }

    function render(){
      slides.forEach(function(s,i){
        var rel = (i - idx + count) % count;
        s.classList.remove('is-center','is-prev','is-next','is-hidden');
        if(rel === 0) s.classList.add('is-center');
        else if(rel === 1) s.classList.add('is-next');
        else if(rel === count - 1) s.classList.add('is-prev');
        else s.classList.add('is-hidden');
      });
      dots.forEach(function(d,i){
        var on = i === idx;
        d.classList.toggle('is-on', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if(captionEl){
        var cs = slides[idx];
        var cap = cs.dataset.caption || '';
        var cap2 = cs.dataset.captionLine2 || '';
        var href = cs.dataset.captionHref;
        while(captionEl.firstChild) captionEl.removeChild(captionEl.firstChild);
        if(href && cap){
          var a = document.createElement('a');
          a.href = href;
          a.appendChild(document.createTextNode(cap));
          captionEl.appendChild(a);
          if(cap2){
            var s2 = document.createElement('span');
            s2.className = 'tri-caption-line2';
            s2.appendChild(document.createTextNode(cap2));
            captionEl.appendChild(s2);
          }
        } else if(cap || cap2){
          if(cap) captionEl.appendChild(document.createTextNode(cap));
          if(cap2){
            var s2b = document.createElement('span');
            s2b.className = 'tri-caption-line2';
            s2b.appendChild(document.createTextNode(cap2));
            captionEl.appendChild(s2b);
          }
        }
      }
      section.dispatchEvent(new CustomEvent('tri:change', {detail:{index:idx,count:count}}));
    }
    function go(n){
      if(loop) idx = (n + count) % count;
      else idx = Math.max(0, Math.min(count - 1, n));
      render();
    }

    /* Mouse/pen taps are resolved in endMouseDrag (pointerup) — we suppress the trailing click event so it
       doesn't double-fire. Touch taps are resolved in touchend. This handler is a fallback for envs
       without pointer events. */
    frame.addEventListener('click', function(e){
      if(noClick){ noClick = false; e.preventDefault(); e.stopPropagation(); return; }
      handleTap(e.target);
    });

    dots.forEach(function(d,i){ d.addEventListener('click', function(){ go(i); }); });

    section.tabIndex = section.tabIndex || 0;
    section.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); go(idx - 1); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); go(idx + 1); }
      else if(e.key === 'Home'){ e.preventDefault(); go(0); }
      else if(e.key === 'End'){ e.preventDefault(); go(count - 1); }
    });

    var startX = 0, moved = 0, swiping = false, dragging = false, noClick = false, downTarget = null;

    /* Resolve a click/tap on a slide to either rotate (peek) or navigate (center). Returns true if handled. */
    function handleTap(el){
      var s = el && el.closest ? el.closest('.tri-slide') : null;
      if(!s || !frame.contains(s)) return false;
      if(s.classList.contains('is-prev')){ go(idx - 1); return true; }
      if(s.classList.contains('is-next')){ go(idx + 1); return true; }
      if(s.classList.contains('is-center') && s.dataset.artistHref){
        window.location.href = s.dataset.artistHref; return true;
      }
      return false;
    }

    /* Mouse / pen: track press → release. Don't use setPointerCapture (it interferes with click events on
       peeks, especially when the peek visually overflows the frame's overflow:hidden box). We listen on
       document for move/up so a drag that ends outside the frame still resolves. */
    frame.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'touch') return;
      dragging = true; startX = e.clientX; moved = 0;
      downTarget = e.target;
    });
    document.addEventListener('pointermove', function(e){
      if(!dragging || e.pointerType === 'touch') return;
      moved = e.clientX - startX;
    });
    function endMouseDrag(e){
      if(!dragging) return;
      dragging = false;
      var w = frame.getBoundingClientRect().width;
      var swipeT = Math.max(40, w * 0.08);
      if(Math.abs(moved) > swipeT){
        go(idx + (moved < 0 ? 1 : -1));
        noClick = true; /* suppress synthetic click that may follow */
      } else {
        /* Small movement — treat as click; resolve via the original press target.
           Set noClick so the bubbling click event doesn't re-fire navigation. */
        if(handleTap(downTarget)) noClick = true;
      }
      downTarget = null;
      moved = 0;
    }
    document.addEventListener('pointerup', endMouseDrag);
    document.addEventListener('pointercancel', endMouseDrag);

    frame.addEventListener('touchstart', function(e){
      swiping = true; startX = e.touches[0].clientX; moved = 0; noClick = false;
    }, {passive:true});
    frame.addEventListener('touchmove', function(e){
      if(!swiping) return;
      moved = e.touches[0].clientX - startX;
      if(Math.abs(moved) > 8) e.preventDefault();
    }, {passive:false});
    frame.addEventListener('touchend', function(e){
      if(!swiping) return;
      swiping = false;
      var w = frame.getBoundingClientRect().width;
      var swipeT = Math.max(40, w * 0.08);
      if(Math.abs(moved) > swipeT){
        go(idx + (moved < 0 ? 1 : -1));
        noClick = true;
      } else {
        /* Anything that didn't cross swipe threshold counts as a tap (incl. small finger drift in the 8-swipeT range). */
        var t = e.changedTouches[0];
        var el = document.elementFromPoint(t.clientX, t.clientY);
        if(handleTap(el)) noClick = true;
      }
      moved = 0;
    });

    render();
  }

  function bootAll(){ document.querySelectorAll('.tri').forEach(init); }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }

  window.TriptychGallery = {
    init: init,
    refresh: bootAll
  };
})();
