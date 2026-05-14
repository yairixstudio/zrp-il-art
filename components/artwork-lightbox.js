/* ============================================================
   ARTWORK LIGHTBOX — shared behavior
   Usage: include in any page with
     <link rel="stylesheet" href="/components/artwork-lightbox.css">
     <script src="/components/artwork-lightbox.js" defer></script>
   Mark artwork images with `data-artwork-id` (looked up in works.json)
   or inline:
     <img data-artwork-title="..." data-artwork-artist="..." data-artwork-src="...">
   Group within a `[data-artwork-gallery]` container to scope prev/next.
   Excluded by convention: portrait, gallery-hero, instagram, press, event images.
   See CLAUDE.md §15.
   ============================================================ */
(function(){
  'use strict';

  if (window.__albInit) return;        // singleton guard
  window.__albInit = true;

  var WORKS_JSON_PATHS = [
    'data/works.json',
    '../data/works.json',
    '../../data/works.json'
  ];
  var worksIndex = null;               // {id: {title, artist, image, ...}}
  var worksReady = null;

  // --- locate works.json from any page depth ---
  function loadWorks(){
    if (worksReady) return worksReady;
    worksReady = (function tryNext(i){
      if (i >= WORKS_JSON_PATHS.length) return Promise.resolve({});
      return fetch(WORKS_JSON_PATHS[i])
        .then(function(r){ if (!r.ok) throw 0; return r.json(); })
        .then(function(j){
          var idx = {};
          (j.works || []).forEach(function(w){ idx[w.id] = w; });
          return idx;
        })
        .catch(function(){ return tryNext(i+1); });
    })(0);
    return worksReady;
  }

  // --- build DOM ---
  // Hebrew regex used to switch CTA font / direction
  var HEB_RE = /[֐-׿]/;
  var root, figure, imgWrap, imgEl, videoEl, altEl, ctaEl, captionEl, titleEl, artistEl, prevBtn, nextBtn, closeBtn;
  function escapeHtml(s){
    if(s==null) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(s){
    if(s==null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  var LATIN_RUN=/[A-Za-z][A-Za-z0-9@&'’._?!:,;()/" -]*[A-Za-z0-9?!)]|[A-Za-z]/g;
  function restoreLatSpans(s){
    return escapeHtml(s).replace(
      /&lt;span class=&quot;lat&quot;&gt;([\s\S]*?)&lt;\/span&gt;/g,
      '<span class="lat">$1</span>'
    );
  }
  function mixedHtml(s){
    return restoreLatSpans(s).split(/(<span class="lat">[\s\S]*?<\/span>)/g).map(function(part){
      if(/^<span class="lat">/.test(part)) return part;
      var entities=[];
      var safePart=part.replace(/&(?:[a-zA-Z]+|#\d+|#x[0-9A-Fa-f]+);/g,function(entity){
        var token="\x00"+entities.length+"\x00";
        entities.push(entity);
        return token;
      });
      return safePart.replace(LATIN_RUN,function(match){
        return '<span class="lat">'+match+'</span>';
      }).replace(/\x00(\d+)\x00/g,function(_,idx){return entities[Number(idx)];});
    }).join('');
  }
  function pauseOtherVideos(activeVideo){
    Array.prototype.forEach.call(document.querySelectorAll('video'), function(vid){
      if (vid === activeVideo) return;
      try { vid.pause(); } catch(_){}
      var item = vid.closest && vid.closest('.sg-item.is-inline-playing');
      if (item) item.classList.remove('is-inline-playing');
    });
  }
  function build(){
    root = document.createElement('div');
    root.className = 'alb';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.setAttribute('aria-label','Artwork viewer');
    // Close button lives at the .alb root (NOT inside .alb-figure) so it
    // never overlaps the image — see CLAUDE.md component notes.
    root.innerHTML =
      '<button class="alb-close" type="button" aria-label="Close">'+
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'+
      '</button>'+
      '<div class="alb-stage">'+
        '<button class="alb-nav prev" type="button" aria-label="Previous artwork">'+
          '<svg viewBox="0 0 14 24" aria-hidden="true"><path d="M13 1L2 12l11 11" fill="none" stroke="currentColor" stroke-width="2"/></svg>'+
        '</button>'+
        '<figure class="alb-figure">'+
          '<div class="alb-imgwrap">'+
            '<picture>'+
              '<source class="alb-avif" type="image/avif">'+
              '<source class="alb-webp" type="image/webp">'+
              '<img alt="" draggable="false">'+
            '</picture>'+
            '<video class="alb-video" controls playsinline preload="metadata" hidden></video>'+
            '<p class="alb-alt"></p>'+
            '<a class="alb-cta" href="#" target="_self" rel="noopener"></a>'+
          '</div>'+
          '<figcaption class="alb-caption">'+
            '<span class="alb-title"></span>'+
            '<span class="alb-artist"></span>'+
          '</figcaption>'+
        '</figure>'+
        '<button class="alb-nav next" type="button" aria-label="Next artwork">'+
          '<svg viewBox="0 0 14 24" aria-hidden="true"><path d="M13 1L2 12l11 11" fill="none" stroke="currentColor" stroke-width="2"/></svg>'+
        '</button>'+
      '</div>';
    document.body.appendChild(root);

    figure   = root.querySelector('.alb-figure');
    imgWrap  = root.querySelector('.alb-imgwrap');
    imgEl    = root.querySelector('.alb-figure img');
    videoEl  = root.querySelector('.alb-figure video');
    altEl    = root.querySelector('.alb-alt');
    ctaEl    = root.querySelector('.alb-cta');
    captionEl= root.querySelector('.alb-caption');
    titleEl  = root.querySelector('.alb-title');
    artistEl = root.querySelector('.alb-artist');
    prevBtn  = root.querySelector('.alb-nav.prev');
    nextBtn  = root.querySelector('.alb-nav.next');
    closeBtn = root.querySelector('.alb-close');

    prevBtn.addEventListener('click', function(){ nav(-1); });
    nextBtn.addEventListener('click', function(){ nav( 1); });
    closeBtn.addEventListener('click', close);
    // Resize the image-wrapper to the image's actual rendered width whenever
    // the image finishes loading OR the viewport changes — keeps the CTA
    // button width == image width.
    imgEl.addEventListener('load', fitWrapperToImage);
    videoEl.addEventListener('loadedmetadata', fitWrapperToImage);
    window.addEventListener('resize', fitWrapperToImage);
    // Backdrop click intentionally does NOT close — close only via X button or Escape.
    document.addEventListener('keydown', onKey);
    bindSwipe();
  }

  // Match the wrapper width to the image's *rendered* width (post-aspect/maxH
  // constraint) so [alt + CTA + caption] line up with the visible image edges.
  function fitWrapperToImage(){
    if (!imgWrap) return;
    requestAnimationFrame(function(){
      var active = (videoEl && !videoEl.hidden) ? videoEl : imgEl;
      if (!active) return;
      var w = active.getBoundingClientRect().width;
      if (w > 0) imgWrap.style.width = Math.round(w) + 'px';
    });
  }

  // --- collect siblings within current gallery scope ---
  var currentList = [];                // array of HTMLElements
  var currentIdx  = 0;
  var lastFocus   = null;

  function findScope(el){
    return el.closest('[data-artwork-gallery]') || document.body;
  }
  function collectArtworks(scope){
    return Array.prototype.slice.call(
      scope.querySelectorAll('[data-artwork-id], [data-artwork-title], [data-artwork-src]')
    );
  }

  // --- caption rendering: split artist into first / last for mobile bold/light ---
  // Hebrew letters proper (alef-tav + finals); excludes punctuation like ״ ׳.
  // Routes title/caption text to the right font in CSS (.is-he → FbEzmel, .is-en → Copperplate).
  var HEB_LETTERS = /[א-ת]/;
  function setCaption(work, srcEl){
    var title = (work && work.title) || srcEl.dataset.artworkTitle || srcEl.alt || '';
    var artist= (work && work.artist) || srcEl.dataset.artworkArtist || '';
    var href  = srcEl.dataset.artworkLink || '';
    var linkInCaption = !!(href && String(artist).trim());
    var line2 = (srcEl.dataset.artworkHeLine2 || '').trim();

    titleEl.innerHTML = linkInCaption
      ? ('<a class="alb-caption-link alb-caption-link--title" href="'+escapeAttr(href)+'">' + mixedHtml(title) + '</a>')
      : mixedHtml(title);
    titleEl.classList.toggle('is-he', HEB_LETTERS.test(title));
    titleEl.classList.toggle('is-en', !HEB_LETTERS.test(title));

    artistEl.innerHTML = '';
    artistEl.classList.toggle('has-he-line2', !!line2);
    if (!artist){ root.classList.add('no-caption'); return; }
    root.classList.remove('no-caption');

    var parts = artist.trim().split(/\s+/);
    if (linkInCaption){
      var a = document.createElement('a');
      a.className = 'alb-caption-link alb-caption-link--artist';
      a.setAttribute('href', href);
      if (parts.length === 1){
        a.textContent = artist;
      } else {
        var lastA = parts.pop();
        var firstA = parts.join(' ');
        var f = document.createElement('span'); f.className='first'; f.textContent=firstA;
        var l = document.createElement('span'); l.className='last';  l.textContent=lastA;
        a.appendChild(f); a.appendChild(l);
      }
      artistEl.appendChild(a);
    } else if (parts.length === 1){
      artistEl.textContent = artist;
    } else {
      var last = parts.pop();
      var first = parts.join(' ');
      var f2 = document.createElement('span'); f2.className='first'; f2.textContent=first;
      var l2 = document.createElement('span'); l2.className='last';  l2.textContent=last;
      artistEl.appendChild(f2); artistEl.appendChild(l2);
    }
    if (line2){
      var sub = document.createElement('span');
      sub.className = 'alb-artist-heline2';
      sub.textContent = line2;
      artistEl.appendChild(sub);
    }
  }

  function setImage(srcEl, work){
    var videoSrc = srcEl.dataset.artworkVideo || (work && work.video) || '';
    var alt = srcEl.alt || (work && work.title) || '';
    var picture = root.querySelector('.alb-figure picture');

    if (videoSrc){
      // VIDEO mode — show <video> with click-to-play (controls), hide <picture>.
      var poster = srcEl.dataset.artworkPoster || (work && work.poster) || srcEl.dataset.artworkSrc || '';
      pauseOtherVideos(videoEl);
      if (picture) picture.hidden = true;
      videoEl.hidden = false;
      videoEl.pause();
      if (poster) videoEl.poster = poster; else videoEl.removeAttribute('poster');
      // Only set src when changed, to avoid re-fetch on same-item nav.
      if (videoEl.getAttribute('src') !== videoSrc){
        videoEl.src = videoSrc;
        videoEl.load();
      }
      root.classList.add('is-video');
      fitWrapperToImage();
      return;
    }

    // IMAGE mode
    if (videoEl){
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl.hidden = true;
    }
    if (picture) picture.hidden = false;
    root.classList.remove('is-video');

    var src = (work && work.image) || srcEl.dataset.artworkSrc || srcEl.currentSrc || srcEl.src;
    // If src is a .png path, point <picture> sources at .avif/.webp siblings.
    var m = (src || '').match(/^(.*)\.png(\?.*)?$/i);
    var avifSrc = root.querySelector('.alb-avif');
    var webpSrc = root.querySelector('.alb-webp');
    if (m){
      var base = m[1], q = m[2] || '';
      if (avifSrc) avifSrc.srcset = base + '.avif' + q;
      if (webpSrc) webpSrc.srcset = base + '.webp' + q;
      imgEl.src = base + '.webp' + q;
    } else {
      if (avifSrc) avifSrc.srcset = '';
      if (webpSrc) webpSrc.srcset = '';
      imgEl.src = src;
    }
    imgEl.alt = alt;
  }

  // --- alt-text + CTA rendering (both optional per source element) ---
  // alt:  data-artwork-alt="..."         → renders below the image when present.
  // cta:  data-artwork-link="/path"      → renders a square button below (when no data-artwork-artist).
  //        If data-artwork-artist is set with the same link → artist/title names in caption are linked; no CTA.
  //       data-artwork-link-label="..."  → button text (default: "מעבר ליצירה").
  // he-line2: data-artwork-he-line2="..." → optional second Hebrew line under artist (e.g. collaborator).
  function setExtras(srcEl, work){
    // ALT
    var altText = srcEl.dataset.artworkAlt || (work && work.alt) || '';
    if (altText){
      altEl.innerHTML = mixedHtml(altText);
      altEl.classList.toggle('is-he', HEB_LETTERS.test(altText));
      altEl.classList.toggle('is-en', !HEB_LETTERS.test(altText));
      root.classList.add('has-alt');
    } else {
      altEl.textContent = '';
      root.classList.remove('has-alt');
    }

    // CTA — skipped when link pairs with data-artwork-artist (caption links replace "לדף האומן" pattern)
    var href  = srcEl.dataset.artworkLink || (work && work.link) || '';
    var label = srcEl.dataset.artworkLinkLabel || (work && work.link_label) || '';
    var artistForCta = (work && work.artist) || srcEl.dataset.artworkArtist || '';
    var skipCta = !!(href && String(artistForCta).trim());
    if (href && !skipCta){
      if (!label) label = 'מעבר ליצירה';
      ctaEl.textContent = label;
      ctaEl.setAttribute('href', href);
      ctaEl.classList.toggle('is-hebrew', HEB_RE.test(label));
      root.classList.add('has-cta');
    } else {
      ctaEl.removeAttribute('href');
      ctaEl.textContent = '';
      ctaEl.classList.remove('is-hebrew');
      root.classList.remove('has-cta');
    }

    // re-measure once styles are applied
    fitWrapperToImage();
  }

  // --- preload neighbors ---
  function preload(i){
    var el = currentList[i]; if (!el) return;
    // For video items, only the poster is worth preloading; the mp4 itself
    // is fetched on demand once the user navigates to it.
    var poster = el.dataset.artworkPoster;
    var src = poster || el.dataset.artworkSrc || el.currentSrc || el.src || '';
    if (!src || /\.(mp4|webm|mov)(\?|$)/i.test(src)) return;
    // browser will pick best from <picture>, but plain new Image() can't —
    // preload the webp variant since that's what will display in worst case.
    var pre = new Image();
    pre.src = src.replace(/\.png(\?|$)/i, '.webp$1');
  }

  function show(i){
    if (i < 0) i = currentList.length - 1;
    if (i >= currentList.length) i = 0;
    currentIdx = i;
    var srcEl = currentList[i];
    var id = srcEl.dataset.artworkId;
    loadWorks().then(function(idx){
      worksIndex = idx;
      var work = id ? idx[id] : null;
      setImage(srcEl, work);
      setCaption(work, srcEl);
      setExtras(srcEl, work);
    });
    preload(i+1); preload(i-1);
    updateNavState();
  }

  function updateNavState(){
    var single = currentList.length <= 1;
    prevBtn.style.display = nextBtn.style.display = single ? 'none' : '';
  }

  function open(srcEl){
    if (!root) build();
    var scope = findScope(srcEl);
    currentList = collectArtworks(scope);
    if (!currentList.length) return;
    currentIdx = currentList.indexOf(srcEl);
    if (currentIdx < 0) currentIdx = 0;
    lastFocus = document.activeElement;
    root.classList.add('is-open','has-caption');
    document.body.classList.add('alb-lock');
    show(currentIdx);
    setTimeout(function(){ closeBtn.focus(); }, 50);
  }
  function close(){
    if (!root) return;
    if (videoEl){ try { videoEl.pause(); } catch(_){} }
    root.classList.remove('is-open');
    document.body.classList.remove('alb-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function nav(delta){ show(currentIdx + delta); }

  function onKey(e){
    if (!root || !root.classList.contains('is-open')) return;
    if (e.key === 'Escape')     { close(); }
    else if (e.key === 'ArrowLeft')  { nav(-1); }
    else if (e.key === 'ArrowRight') { nav( 1); }
    else if (e.key === 'Tab')        { trapFocus(e); }
  }
  function trapFocus(e){
    var capLinks = Array.prototype.slice.call(root.querySelectorAll('.alb-caption a[href]'));
    var ctaActive = root.classList.contains('has-cta') ? ctaEl : null;
    var focusable = [closeBtn, prevBtn, nextBtn].concat(capLinks).concat(ctaActive ? [ctaActive] : []).filter(function(el){
      return el && el.offsetParent !== null;
    });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length-1];
    if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
  }

  // --- swipe (touch + pointer) ---
  function bindSwipe(){
    var startX=0, startY=0, dx=0, dy=0, active=false;
    figure.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) return;
      active=true; startX=e.touches[0].clientX; startY=e.touches[0].clientY; dx=0; dy=0;
    }, {passive:true});
    figure.addEventListener('touchmove', function(e){
      if (!active) return;
      dx = e.touches[0].clientX - startX;
      dy = e.touches[0].clientY - startY;
    }, {passive:true});
    figure.addEventListener('touchend', function(){
      if (!active) return; active=false;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
        nav(dx < 0 ? 1 : -1);
      }
    });
  }

  // --- delegate click handler ---
  function shouldIntercept(el){
    if (!el || el.nodeType !== 1) return null;
    // walk up to find an artwork-tagged element
    var target = el.closest('[data-artwork-id], [data-artwork-title], [data-artwork-src]');
    if (!target) return null;
    // exclude explicit opt-outs
    if (target.closest('[data-artwork-skip]')) return null;
    return target;
  }

  document.addEventListener('click', function(e){
    var t = shouldIntercept(e.target);
    if (!t) return;
    e.preventDefault();
    open(t);
  });

  // keyboard accessibility: open with Enter/Space on focused artwork
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = shouldIntercept(document.activeElement);
    if (!t) return;
    e.preventDefault();
    open(t);
  });

  // make non-link/button artwork elements focusable
  function makeFocusable(){
    var els = document.querySelectorAll('[data-artwork-id], [data-artwork-title], [data-artwork-src]');
    Array.prototype.forEach.call(els, function(el){
      if (el.tagName === 'A' || el.tagName === 'BUTTON') return;
      if (el.closest('a[href], button')) return;
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
      if (!el.hasAttribute('role'))     el.setAttribute('role','button');
    });
  }
  if (document.readyState !== 'loading') makeFocusable();
  else document.addEventListener('DOMContentLoaded', makeFocusable);

  // expose minimal API for programmatic open
  window.ArtworkLightbox = {
    open: function(elOrId){
      var el = typeof elOrId === 'string'
        ? document.querySelector('[data-artwork-id="'+elOrId+'"]')
        : elOrId;
      if (el) open(el);
    },
    close: close,
    refreshFocusable: makeFocusable
  };
})();
