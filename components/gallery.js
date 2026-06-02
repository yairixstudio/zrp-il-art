/* ============================================================
   <image-gallery> — reusable swipe-able image carousel.
   See components/gallery.css for the markup contract.

   API:
     element.goTo(i)
     element.next()
     element.prev()
     event: 'gallery:change' { detail: { index } }

   Attributes:
     data-fit="cover|contain"   (default cover)
     data-loop="true|false"     (default true; seamless wrap when true & 2+ slides)
     data-arrows="true|false"   (default true)
     data-dots="true|false"     (default true)
     data-counter="true|false"  (default false)

   Auto-injects components/gallery.css next to this script if not
   already loaded (so consumers only need <script src="gallery.js">).
   ============================================================ */
(function () {
  // ---- Auto-inject stylesheet ---------------------------------
  const scriptEl = document.currentScript;
  if (scriptEl && !document.querySelector('link[data-image-gallery-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = scriptEl.src.replace(/gallery\.js(?:\?.*)?$/, 'gallery.css');
    link.setAttribute('data-image-gallery-css', '');
    document.head.appendChild(link);
  }

  const SVG_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const SVG_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  class ImageGallery extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;
      this._rendered = true;
      this._build();
    }

    /** Rebuild from current child <img> elements. Useful when consumer mutates children after mount. */
    refresh() {
      this._rendered = false;
      this._build();
    }

    _build() {
      // Collect child <img> elements before wiping innerHTML.
      const imgs = Array.from(this.querySelectorAll(':scope > img'));
      // If there are direct <img> children, use them. Otherwise look for any img in subtree.
      const sourceImgs = imgs.length ? imgs : Array.from(this.querySelectorAll('img'));
      if (sourceImgs.length === 0) return; // nothing to render

      const loop    = this.dataset.loop    !== 'false';
      const arrows  = this.dataset.arrows  !== 'false';
      const dots    = this.dataset.dots    !== 'false';
      const counter = this.dataset.counter === 'true';

      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      if (this._track && this._infinite && this._boundTransitionEnd) {
        this._track.removeEventListener('transitionend', this._boundTransitionEnd);
      }

      this.innerHTML = '';

      const viewport = document.createElement('div');
      viewport.className = 'gal-viewport';

      const track = document.createElement('div');
      track.className = 'gal-track';

      sourceImgs.forEach((img, i) => {
        const slide = document.createElement('div');
        slide.className = 'gal-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', (i + 1) + ' / ' + sourceImgs.length);
        if (i > 0 && !img.loading) img.loading = 'lazy';
        img.draggable = false;
        slide.appendChild(img);
        track.appendChild(slide);
      });

      // Seamless loop: [clone last] + reals + [clone first] — avoids animating across the whole strip.
      const nReal = sourceImgs.length;
      const infinite = loop && nReal > 1;
      this._infinite = infinite;
      if (infinite) {
        const firstSlide = track.firstElementChild;
        const lastSlide = track.lastElementChild;
        track.insertBefore(lastSlide.cloneNode(true), firstSlide);
        track.appendChild(firstSlide.cloneNode(true));
      }

      viewport.appendChild(track);
      this.appendChild(viewport);

      this._track = track;
      this._viewport = viewport;
      this._n = nReal;
      this._idx = 0;
      /** Track index for translateX (includes clone slides when `_infinite`). */
      this._pos = infinite ? 1 : 0;
      this._loop = loop;

      if (infinite) {
        this._boundTransitionEnd = (e) => this._onTransitionEnd(e);
        this._track.addEventListener('transitionend', this._boundTransitionEnd);
      }

      if (this._n > 1) {
        if (arrows) {
          const prev = document.createElement('button');
          prev.type = 'button';
          prev.className = 'gal-arrow prev';
          prev.setAttribute('aria-label', 'previous image');
          prev.innerHTML = SVG_PREV;
          prev.addEventListener('click', () => this.prev());
          this.appendChild(prev);

          const next = document.createElement('button');
          next.type = 'button';
          next.className = 'gal-arrow next';
          next.setAttribute('aria-label', 'next image');
          next.innerHTML = SVG_NEXT;
          next.addEventListener('click', () => this.next());
          this.appendChild(next);

          this._prevBtn = prev;
          this._nextBtn = next;
        }

        if (dots) {
          const dotsWrap = document.createElement('div');
          dotsWrap.className = 'gal-dots';
          dotsWrap.setAttribute('role', 'tablist');
          dotsWrap.setAttribute('aria-label', 'gallery navigation');
          const dotEls = sourceImgs.map((_, i) => {
            const d = document.createElement('button');
            d.type = 'button';
            d.className = 'gal-dot' + (i === 0 ? ' is-on' : '');
            d.setAttribute('aria-label', 'slide ' + (i + 1));
            d.setAttribute('role', 'tab');
            d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
            d.addEventListener('click', () => this.goTo(i));
            dotsWrap.appendChild(d);
            return d;
          });
          this.appendChild(dotsWrap);
          this._dots = dotEls;
        }

        if (counter) {
          const c = document.createElement('div');
          c.className = 'gal-counter';
          c.setAttribute('aria-live', 'polite');
          this.appendChild(c);
          this._counter = c;
        }

        // Keyboard: arrows for navigation (LTR convention)
        if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
        this.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
          else if (e.key === 'Home')  { e.preventDefault(); this.goTo(0); }
          else if (e.key === 'End')   { e.preventDefault(); this.goTo(this._n - 1); }
        });

        // Pointer / touch swipe
        this._wireSwipe();

        // Re-render on viewport resize (so width recalcs correctly)
        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => this._render(true));
          ro.observe(viewport);
          this._ro = ro;
        } else {
          window.addEventListener('resize', () => this._render(true));
        }
      }

      this._render(true);
    }

    _wireSwipe() {
      const vp = this._viewport;
      const track = this._track;
      let startX = 0, deltaX = 0, isDown = false, w = 0, pid = null;

      vp.addEventListener('pointerdown', (e) => {
        // ignore non-primary buttons (e.g. right click)
        if (e.button && e.button !== 0) return;
        isDown = true;
        pid = e.pointerId;
        startX = e.clientX;
        deltaX = 0;
        w = vp.clientWidth || 1;
        track.classList.add('no-anim');
        vp.classList.add('is-dragging');
        try { vp.setPointerCapture(pid); } catch (_) {}
      });

      vp.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        deltaX = e.clientX - startX;
        const offset = -this._pos * w + deltaX;
        track.style.transform = 'translateX(' + offset + 'px)';
      });

      const end = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('no-anim');
        vp.classList.remove('is-dragging');
        try { vp.releasePointerCapture(pid); } catch (_) {}
        const threshold = Math.max(40, w * 0.12);
        if (deltaX > threshold) this.prev();
        else if (deltaX < -threshold) this.next();
        else this._render();
        deltaX = 0;
      };

      vp.addEventListener('pointerup', end);
      vp.addEventListener('pointercancel', end);
      vp.addEventListener('lostpointercapture', end);
    }

    goTo(i) {
      if (!this._n) return;

      if (this._infinite) {
        i = ((i % this._n) + this._n) % this._n;
        if (this._pos === this._n + 1 && i === 0) {
          this._snapCloneEnd();
          return;
        }
        if (this._pos === 0 && i === this._n - 1) {
          this._snapCloneStart();
          return;
        }
        if (i === this._idx && this._pos === i + 1) {
          this._render();
          return;
        }
        let target = i + 1;
        if (this._pos === this._n && i === 0) target = this._n + 1;
        else if (this._pos === 1 && i === this._n - 1) target = 0;
        const prevIdx = this._idx;
        this._idx = i;
        this._pos = target;
        this._render();
        if (prevIdx !== this._idx) {
          this.dispatchEvent(new CustomEvent('gallery:change', { detail: { index: i }, bubbles: true }));
        }
        return;
      }

      if (this._loop) {
        i = ((i % this._n) + this._n) % this._n;
      } else {
        if (i < 0) i = 0;
        if (i >= this._n) i = this._n - 1;
      }
      if (i === this._idx) {
        this._render();
        return;
      }
      this._idx = i;
      this._pos = i;
      this._render();
      this.dispatchEvent(new CustomEvent('gallery:change', { detail: { index: i }, bubbles: true }));
    }

    next() {
      if (!this._n) return;
      if (this._infinite) {
        if (this._idx < this._n - 1) {
          this.goTo(this._idx + 1);
        } else {
          this._idx = 0;
          this._pos = this._n + 1;
          this._pendingChange = 0;
          this._render();
          this._scheduleWrapFallback();
        }
        return;
      }
      this.goTo(this._idx + 1);
    }

    prev() {
      if (!this._n) return;
      if (this._infinite) {
        if (this._idx > 0) {
          this.goTo(this._idx - 1);
        } else {
          this._idx = this._n - 1;
          this._pos = 0;
          this._pendingChange = this._n - 1;
          this._render();
          this._scheduleWrapFallback();
        }
        return;
      }
      this.goTo(this._idx - 1);
    }

    _scheduleWrapFallback() {
      clearTimeout(this._wrapTimer);
      this._wrapTimer = setTimeout(() => this._completeWrap(), 400);
    }

    _completeWrap() {
      clearTimeout(this._wrapTimer);
      if (this._pos === this._n + 1) {
        this._pos = 1;
        this._finalizeSnapNoAnim();
      } else if (this._pos === 0) {
        this._pos = this._n;
        this._finalizeSnapNoAnim();
      }
      if (this._pendingChange !== undefined) {
        const idx = this._pendingChange;
        this._pendingChange = undefined;
        this.dispatchEvent(new CustomEvent('gallery:change', { detail: { index: idx }, bubbles: true }));
      }
    }

    _snapCloneEnd() {
      this._pos = 1;
      this._idx = 0;
      this._finalizeSnapNoAnim();
    }

    _snapCloneStart() {
      this._pos = this._n;
      this._idx = this._n - 1;
      this._finalizeSnapNoAnim();
    }

    _finalizeSnapNoAnim() {
      if (!this._track || !this._viewport) return;
      const w = this._viewport.clientWidth || 1;
      this._track.classList.add('no-anim');
      this._track.style.transform = 'translateX(' + (-this._pos * w) + 'px)';
      // eslint-disable-next-line no-unused-expressions
      this._track.offsetWidth;
      requestAnimationFrame(() => this._track.classList.remove('no-anim'));
    }

    _onTransitionEnd(e) {
      if (!this._infinite || e.target !== this._track) return;
      if (e.propertyName !== 'transform') return;
      if (this._pos === this._n + 1 || this._pos === 0) {
        this._completeWrap();
      }
    }

    _render(forceNoAnim) {
      if (!this._track || !this._viewport) return;
      const w = this._viewport.clientWidth;
      if (forceNoAnim) {
        this._track.classList.add('no-anim');
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        this._track.offsetWidth;
      }
      this._track.style.transform = 'translateX(' + (-this._pos * w) + 'px)';
      if (forceNoAnim) {
        // restore anim on next frame
        requestAnimationFrame(() => this._track.classList.remove('no-anim'));
      }
      if (this._dots) {
        this._dots.forEach((d, i) => {
          const on = i === this._idx;
          d.classList.toggle('is-on', on);
          d.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }
      if (this._counter) {
        this._counter.textContent = (this._idx + 1) + ' / ' + this._n;
      }
      if (this._prevBtn && this._nextBtn && !this._loop) {
        this._prevBtn.disabled = this._idx === 0;
        this._nextBtn.disabled = this._idx === this._n - 1;
      }
    }

    disconnectedCallback() {
      clearTimeout(this._wrapTimer);
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      if (this._track && this._infinite && this._boundTransitionEnd) {
        this._track.removeEventListener('transitionend', this._boundTransitionEnd);
      }
    }
  }

  if (!customElements.get('image-gallery')) {
    customElements.define('image-gallery', ImageGallery);
  }
})();
