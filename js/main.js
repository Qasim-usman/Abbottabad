/* ==========================================================================
   ABBOTTABAD — THE CITY OF PINES · main.js
   Vanilla JavaScript, zero dependencies, no build step.
   --------------------------------------------------------------------------
   Organised as small named modules. Each one bails out quietly when its
   markup is not on the page, so this single file serves all eight pages.

   0  Helpers            $ $$ on clamp lerp reduced-motion touch
   1  Ticker             one shared requestAnimationFrame loop
   2  Theme              dark mode, localStorage, prefers-color-scheme
   3  Nav                active link, mobile drawer, focus trap, scroll lock
   4  Progress           scroll progress bar
   5  Reveal             one IntersectionObserver for every [data-reveal]
   6  Counters           count-up numbers when they enter view
   7  Parallax           cheap transform-only parallax
   8  Marquee            seamless ticker duplication
   9  HeroWords          per-word mask reveal on load
   10 Skeletons          image skeleton -> loaded
   11 HStrip             pinned horizontal "Top Places" strip
   12 Filters            places.html chunky filters
   13 Modal              accessible dialog (focus trap, Esc, focus return)
   14 Lightbox          gallery.html lightbox (arrows, swipe, counter)
   15 FormValidate       contact.html client-side validation
   16 BackToTop          sticker button after 600px
   17 PageWipe           accent panel wipe between pages
   18 SmoothScroll       inertial rAF + lerp wheel scrolling (desktop only)
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     0. HELPERS
     ====================================================================== */
  var doc  = document;
  var html = doc.documentElement;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }
  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); }
  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqCoarse = window.matchMedia('(hover: none), (pointer: coarse)');
  function reduced() { return mqReduce.matches; }
  function coarse()  { return mqCoarse.matches; }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
    ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* Keep Tab inside a container. Returns a release() function. */
  function trapFocus(container) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var items = $$(FOCUSABLE, container).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
      });
      if (!items.length) return;
      var first = items[0];
      var last  = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return function () { container.removeEventListener('keydown', onKey); };
  }

  /* Body scroll lock, reference counted so drawer + modal can nest safely. */
  var locks = 0;
  function lockScroll() {
    if (++locks !== 1) return;
    var gap = window.innerWidth - html.clientWidth;
    if (gap > 0) doc.body.style.paddingRight = gap + 'px';
    doc.body.classList.add('is-locked');
  }
  function unlockScroll() {
    if (locks === 0 || --locks !== 0) return;
    doc.body.classList.remove('is-locked');
    doc.body.style.paddingRight = '';
  }

  /* ======================================================================
     1. TICKER — a single rAF loop shared by every scroll-driven module.
     It sleeps ~0.7s after the last scroll/resize so an idle page costs
     nothing, and any module can call ticker.wake() to keep it alive.
     ====================================================================== */
  var ticker = (function () {
    var subs = [], running = false, credit = 0;
    function frame(now) {
      for (var i = 0; i < subs.length; i++) subs[i](now);
      if (credit-- > 0) { requestAnimationFrame(frame); } else { running = false; }
    }
    return {
      add: function (fn) { subs.push(fn); this.wake(); },
      wake: function (frames) {
        credit = Math.max(credit, frames || 45);
        if (!running && subs.length) { running = true; requestAnimationFrame(frame); }
      }
    };
  })();

  on(window, 'scroll', function () { ticker.wake(); }, { passive: true });
  on(window, 'resize', function () { ticker.wake(); });

  /* ======================================================================
     2. THEME — dark mode toggle.
     The <head> inline script has already applied the stored/system theme so
     there is never a flash; this module only wires the button.
     ====================================================================== */
  var Theme = {
    KEY: 'ab-theme',
    init: function () {
      var self = this;
      var btn = $('#themeToggle');
      var sys = window.matchMedia('(prefers-color-scheme: dark)');

      this.sync(html.getAttribute('data-theme') || 'light');

      on(btn, 'click', function () {
        var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(self.KEY, next); } catch (e) {}
        self.apply(next);
      });

      /* follow the OS until the visitor makes an explicit choice */
      on(sys, 'change', function (e) {
        var saved = null;
        try { saved = localStorage.getItem(self.KEY); } catch (err) {}
        if (!saved) self.apply(e.matches ? 'dark' : 'light');
      });
    },
    apply: function (mode) {
      var self = this;
      if (!reduced()) {
        doc.body.classList.add('theme-anim');
        clearTimeout(this._t);
        this._t = setTimeout(function () { doc.body.classList.remove('theme-anim'); }, 340);
      }
      html.setAttribute('data-theme', mode);
      this.sync(mode);
    },
    sync: function (mode) {
      var btn = $('#themeToggle');
      var dark = mode === 'dark';
      if (btn) {
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        var t = $('.theme-toggle__txt', btn);
        if (t) t.textContent = dark ? 'Light' : 'Dark';
      }
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#111111' : '#FFFDF7');
    }
  };

  /* ======================================================================
     3. NAV — active page marker + mobile drawer.
     The drawer list is cloned from the real nav list, so the markup is only
     written once per page and can never drift out of sync.
     ====================================================================== */
  var Nav = {
    init: function () {
      this.markActive();
      this.buildDrawer();
      this.wireDrawer();
    },

    markActive: function () {
      var here = location.pathname.split('/').pop().toLowerCase() || 'index.html';
      $$('.nav__link').forEach(function (a) {
        var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
        if (href === here || (here === '' && href === 'index.html')) {
          a.setAttribute('aria-current', 'page');
        }
      });
    },

    buildDrawer: function () {
      var list = $('#drawerList');
      var src = $('.nav__list');
      if (!list || !src || list.children.length) return;
      $$('.nav__link', src).forEach(function (a) {
        var li = doc.createElement('li');
        var link = doc.createElement('a');
        link.className = 'drawer__link';
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        if (a.hasAttribute('aria-current')) link.setAttribute('aria-current', 'page');
        li.appendChild(link);
        list.appendChild(li);
      });
    },

    wireDrawer: function () {
      var self = this;
      var drawer = $('#drawer');
      var burger = $('#burger');
      if (!drawer || !burger) return;

      this.drawer = drawer;
      this.burger = burger;
      this.backdrop = doc.createElement('div');
      this.backdrop.className = 'drawer__backdrop';
      this.backdrop.hidden = true;
      doc.body.appendChild(this.backdrop);

      on(burger, 'click', function () { self.toggle(); });
      on($('#drawerClose'), 'click', function () { self.close(); });
      on(this.backdrop, 'click', function () { self.close(); });
      on(doc, 'keydown', function (e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });
      on(drawer, 'click', function (e) {
        if (e.target.closest('a')) self.close(true);
      });
      /* if the viewport grows into desktop layout, drop the drawer */
      on(window.matchMedia('(min-width: 1024px)'), 'change', function (e) {
        if (e.matches && self.isOpen) self.close(true);
      });
    },

    toggle: function () { this.isOpen ? this.close() : this.open(); },

    open: function () {
      var self = this;
      this.lastFocus = doc.activeElement;
      this.drawer.hidden = false;
      this.backdrop.hidden = false;
      /* next frame so the transform transition actually runs */
      requestAnimationFrame(function () {
        self.drawer.classList.add('is-open');
        self.backdrop.classList.add('is-open');
      });
      this.burger.setAttribute('aria-expanded', 'true');
      this.isOpen = true;
      lockScroll();
      this.release = trapFocus(this.drawer);
      var first = $('#drawerClose') || $('.drawer__link', this.drawer);
      if (first) first.focus();
    },

    close: function (skipFocus) {
      var self = this;
      if (!this.isOpen) return;
      this.drawer.classList.remove('is-open');
      this.backdrop.classList.remove('is-open');
      this.burger.setAttribute('aria-expanded', 'false');
      this.isOpen = false;
      unlockScroll();
      if (this.release) { this.release(); this.release = null; }
      setTimeout(function () {
        if (self.isOpen) return;
        self.drawer.hidden = true;
        self.backdrop.hidden = true;
      }, reduced() ? 0 : 300);
      if (!skipFocus && this.lastFocus) this.lastFocus.focus();
    }
  };

  /* ======================================================================
     4. PROGRESS — slim scroll bar pinned to the top of the viewport.
     ====================================================================== */
  var Progress = {
    init: function () {
      var bar = $('#progressBar');
      if (!bar) return;
      var last = -1;
      ticker.add(function () {
        var max = doc.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? clamp(window.pageYOffset / max, 0, 1) : 0;
        if (Math.abs(p - last) < 0.0015) return;
        last = p;
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      });
    }
  };

  /* ======================================================================
     5. REVEAL — one IntersectionObserver for the whole page.
     data-reveal="up|left|right|scale|mask"   direction
     data-reveal-delay="120"                  per-element delay in ms
     data-stagger="70" on a container          auto-staggers its children
     Elements reveal once. Several belts and braces make sure content can
     never stay invisible if the observer misbehaves.
     ====================================================================== */
  var Reveal = {
    init: function () {
      var els = $$('[data-reveal]');
      if (!els.length) return;

      function show(el) { el.classList.add('is-visible'); }
      function showAll() { els.forEach(show); }

      if (reduced() || !('IntersectionObserver' in window)) { showAll(); return; }

      /* staggered entrances: 60-80ms offsets down each grid */
      $$('[data-stagger]').forEach(function (box) {
        var step = parseInt(box.getAttribute('data-stagger'), 10) || 70;
        $$('[data-reveal]', box).forEach(function (el, i) {
          if (!el.hasAttribute('data-reveal-delay')) {
            el.style.setProperty('--rd', (i * step) + 'ms');
          }
        });
      });
      els.forEach(function (el) {
        var d = el.getAttribute('data-reveal-delay');
        if (d) el.style.setProperty('--rd', parseInt(d, 10) + 'ms');
      });

      var fired = false;
      var io = new IntersectionObserver(function (entries) {
        fired = true;
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          show(en.target);
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

      els.forEach(function (el) { io.observe(el); });

      /* safety net 1: if the observer never fires, show everything */
      setTimeout(function () { if (!fired) showAll(); }, 2500);

      /* safety net 2: reveal anything that is in view or already scrolled
         past. Observers can stall — a throttled or backgrounded tab stops
         delivering records — and nothing may ever scroll back to trigger
         them. This runs on load, on scroll and when the tab is shown, and
         unhooks itself as soon as the last element is visible. */
      var pending = els.length;
      function sweep() {
        pending = 0;
        els.forEach(function (el) {
          if (el.classList.contains('is-visible')) return;
          if (el.getBoundingClientRect().top < window.innerHeight * 1.05) show(el);
          else pending++;
        });
        if (!pending) stopSweeping();
      }

      var sweepTimer = 0;
      function queueSweep() {
        if (sweepTimer) return;
        sweepTimer = setTimeout(function () { sweepTimer = 0; sweep(); }, 150);
      }
      function stopSweeping() {
        window.removeEventListener('scroll', queueSweep);
        window.removeEventListener('resize', queueSweep);
        doc.removeEventListener('visibilitychange', sweep);
      }

      on(window, 'scroll', queueSweep, { passive: true });
      on(window, 'resize', queueSweep);
      on(doc, 'visibilitychange', sweep);
      on(window, 'load', function () { setTimeout(sweep, 300); });
      setTimeout(sweep, 1200);
    }
  };

  /* ======================================================================
     6. COUNTERS — data-count="1853" counts up once, when it enters view.
     data-count-suffix / -prefix / -decimals / -group="off" / -duration
     ====================================================================== */
  var Counters = {
    init: function () {
      var els = $$('[data-count]');
      if (!els.length) return;

      function render(el, value) {
        var dec = parseInt(el.getAttribute('data-count-decimals'), 10) || 0;
        var group = el.getAttribute('data-count-group') !== 'off';
        var n = dec ? value.toFixed(dec) : String(Math.round(value));
        if (group) {
          n = Number(n).toLocaleString('en-US', {
            minimumFractionDigits: dec, maximumFractionDigits: dec
          });
        }
        el.textContent = (el.getAttribute('data-count-prefix') || '') + n +
                         (el.getAttribute('data-count-suffix') || '');
      }

      function run(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        if (reduced()) { render(el, target); return; }
        var dur = parseInt(el.getAttribute('data-count-duration'), 10) || 1500;
        var t0 = 0;
        function step(now) {
          if (!t0) t0 = now;
          var p = clamp((now - t0) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - p, 3);   /* ease-out cubic */
          render(el, target * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          run(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      els.forEach(function (el) { io.observe(el); });
      setTimeout(function () {
        els.forEach(function (el) { if (el.textContent.trim() === '') run(el); });
      }, 2500);
    }
  };

  /* ======================================================================
     7. PARALLAX — data-parallax="0.2" moves at 0.2x scroll speed.
     transform: translate3d only, inside the shared rAF loop, and switched
     off entirely for reduced motion and touch devices.
     ====================================================================== */
  var Parallax = {
    init: function () {
      var els = $$('[data-parallax]');
      if (!els.length || reduced() || coarse()) return;
      var items = els.map(function (el) {
        return {
          el: el,
          k: parseFloat(el.getAttribute('data-parallax')) || 0.2,
          top: el.getBoundingClientRect().top + window.pageYOffset
        };
      });
      on(window, 'resize', function () {
        items.forEach(function (it) {
          it.el.style.transform = '';
          it.top = it.el.getBoundingClientRect().top + window.pageYOffset;
        });
      });

      ticker.add(function () {
        var y = window.pageYOffset;
        var vh = window.innerHeight;
        items.forEach(function (it) {
          /* skip anything far outside the viewport */
          if (it.top - y > vh * 1.5 || it.top - y < -vh * 2) return;
          var d = (y - it.top + vh * 0.5) * it.k;
          it.el.style.transform = 'translate3d(0,' + d.toFixed(2) + 'px,0)';
        });
      });
    }
  };

  /* ======================================================================
     8. MARQUEE — duplicate the track once so the CSS keyframe (which pans
     to -50%) loops seamlessly. The copy is hidden from screen readers.
     ====================================================================== */
  var Marquee = {
    init: function () {
      $$('.marquee__track').forEach(function (track) {
        if (track.getAttribute('data-cloned')) return;
        var copy = track.cloneNode(true);
        while (copy.firstChild) {
          var node = copy.firstChild;
          if (node.nodeType === 1) node.setAttribute('aria-hidden', 'true');
          track.appendChild(node);
        }
        track.setAttribute('data-cloned', 'true');
      });
    }
  };

  /* ======================================================================
     9. HERO WORDS — split [data-split] text into masked words and slide
     them up on load. Falls back to plain visible text without JS.
     ====================================================================== */
  var HeroWords = {
    init: function () {
      var targets = $$('[data-split]');
      if (!targets.length) return;
      var i = 0;
      targets.forEach(function (el) {
        var step = parseInt(el.getAttribute('data-split-step'), 10) || 90;
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        words.forEach(function (w, wi) {
          var outer = doc.createElement('span');
          outer.className = 'mask mask--inline';
          var inner = doc.createElement('span');
          inner.className = 'mask__i';
          inner.textContent = w;
          inner.style.setProperty('--md', (i * step) + 'ms');
          i++;

          outer.appendChild(inner);
          el.appendChild(outer);
          if (wi < words.length - 1) el.appendChild(doc.createTextNode(' '));
        });
      });
      /* one frame later so the initial translated state is painted first */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          $$('[data-split-root]').forEach(function (r) { r.classList.add('is-ready'); });
          html.classList.add('is-ready');
        });
      });
    }
  };

  /* ======================================================================
     10. SKELETONS — flat placeholder block until the photo has decoded, so
     nothing pops or shifts. width/height in the markup reserves the box.
     ====================================================================== */
  var Skeletons = {
    init: function () {
      $$('.frame > img').forEach(function (img) {
        function done() {
          img.classList.add('is-loaded');
          var frame = img.parentElement;
          if (frame) frame.classList.add('is-ready');
        }
        if (img.complete && img.naturalWidth > 0) { done(); return; }
        on(img, 'load', done);
        on(img, 'error', function () {
          /* keep the striped placeholder, but never hide the frame */
          var frame = img.parentElement;
          if (frame) frame.classList.add('has-error');
        });
      });
    }
  };

  /* ======================================================================
     11. HSTRIP — the one sticky, scroll-driven section: a horizontal strip
     of Top Places that pans sideways while the section is pinned.
     Only upgraded on wide, fine-pointer, motion-friendly viewports; every
     other visitor gets the plain snap scroller that is in the markup.
     ====================================================================== */
  var HStrip = {
    init: function () {
      var strip = $('[data-hstrip]');
      if (!strip) return;
      var pin = $('.hstrip__pin', strip);
      var track = $('.hstrip__track', strip);
      if (!pin || !track) return;
      var mq = window.matchMedia('(min-width: 1024px)');
      var active = false, span = 0;

      function measure() {
        if (!active) return;
        span = Math.max(0, track.scrollWidth - pin.clientWidth + 48);
        /* the taller the spacer, the slower the pan — 1.1x feels natural */
        strip.style.setProperty('--pin-h', (span * 1.1 + pin.clientHeight) + 'px');
      }

      function enable() {
        if (active) return;
        active = true;
        strip.classList.add('is-pinned');
        measure();
        ticker.wake();
      }
      function disable() {
        if (!active) return;
        active = false;
        strip.classList.remove('is-pinned');
        strip.style.removeProperty('--pin-h');
        track.style.transform = '';
      }
      function decide() {
        if (mq.matches && !reduced() && !coarse()) enable(); else disable();
      }

      decide();
      on(mq, 'change', decide);
      on(mqReduce, 'change', decide);
      on(window, 'resize', measure);
      on(window, 'load', measure);

      ticker.add(function () {
        if (!active || span <= 0) return;
        var box = strip.getBoundingClientRect();
        var total = strip.offsetHeight - pin.clientHeight;
        if (total <= 0) return;
        var p = clamp(-box.top / total, 0, 1);
        track.style.transform = 'translate3d(' + (-p * span).toFixed(2) + 'px,0,0)';
      });
    }
  };

  /* ======================================================================
     12. FILTERS — places.html. Chunky toggles that animate cards out and
     back in, keep aria-pressed in sync, announce the result count and show
     a styled empty state.
     ====================================================================== */
  var Filters = {
    init: function () {
      var root = $('[data-filters]');
      if (!root) return;
      var chips = $$('.chip', root);
      var grid = $('#placeGrid');
      if (!chips.length || !grid) return;

      var items = $$('.filterable', grid);
      var live = $('#filterStatus');
      var empty = $('#placeEmpty');
      var active = [];

      /* show each chip how many places it holds */
      chips.forEach(function (chip) {
        var cat = chip.getAttribute('data-cat');
        var slot = $('.chip__count', chip);
        if (!slot) return;
        var n = cat === 'all' ? items.length : items.filter(function (it) {
          return (it.getAttribute('data-cats') || '').split(/\s+/).indexOf(cat) > -1;
        }).length;
        slot.textContent = '(' + n + ')';
      });

      function keep(item) {
        if (!active.length) return true;
        var cats = (item.getAttribute('data-cats') || '').split(/\s+/);
        return active.some(function (c) { return cats.indexOf(c) > -1; });
      }

      function apply() {
        var shown = 0;
        items.forEach(function (item) {
          var want = keep(item);
          if (want) {
            item.classList.remove('is-hiding');
            item.style.transitionDelay = (shown % 8) * 40 + 'ms';
            shown++;
            if (item.hidden) {
              item.hidden = false;
              item.classList.add('is-entering');
              requestAnimationFrame(function () {
                requestAnimationFrame(function () { item.classList.remove('is-entering'); });
              });
            }
          } else if (!item.hidden) {
            item.style.transitionDelay = '0ms';
            item.classList.add('is-hiding');
            setTimeout(function () {
              if (!item.classList.contains('is-hiding')) return;
              item.hidden = true;
              item.classList.remove('is-hiding');
            }, reduced() ? 0 : 200);
          }
        });
        if (empty) empty.hidden = shown > 0;
        if (live) {
          live.textContent = shown === items.length
            ? 'Showing all ' + items.length + ' places.'
            : 'Showing ' + shown + ' of ' + items.length + ' places.';
        }
      }

      function syncChips() {
        chips.forEach(function (chip) {
          var cat = chip.getAttribute('data-cat');
          var pressed = cat === 'all' ? active.length === 0 : active.indexOf(cat) > -1;
          chip.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        });
      }

      chips.forEach(function (chip) {
        on(chip, 'click', function () {
          var cat = chip.getAttribute('data-cat');
          if (cat === 'all') {
            active = [];
          } else {
            var i = active.indexOf(cat);
            if (i > -1) active.splice(i, 1); else active.push(cat);
          }
          syncChips();
          apply();
        });
      });

      /* reset chip is optional markup */
      on($('#filterReset'), 'click', function () {
        active = []; syncChips(); apply();
      });

      syncChips();
      apply();
    }
  };

  /* ======================================================================
     13. MODAL — accessible dialog used by the places cards.
     A trigger carries data-modal-open="<template id>"; the template holds
     the rich detail. Focus is trapped, Escape closes, focus returns to the
     trigger, and the page behind is scroll-locked.
     ====================================================================== */
  var Modal = {
    init: function () {
      var self = this;
      var modal = $('#modal');
      if (!modal) return;
      this.modal = modal;
      this.box = $('.modal__box', modal);
      this.titleEl = $('#modalTitle');
      this.bodyEl = $('#modalBody');
      modal.hidden = true;

      on(doc, 'click', function (e) {
        var trigger = e.target.closest('[data-modal-open]');
        if (trigger) { e.preventDefault(); self.open(trigger); return; }
        if (e.target.closest('[data-modal-close]')) { e.preventDefault(); self.close(); }
      });
      on(doc, 'keydown', function (e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });
    },

    open: function (trigger) {
      var self = this;
      var src = doc.getElementById(trigger.getAttribute('data-modal-open'));
      if (!src || !this.bodyEl) return;

      this.lastFocus = trigger;
      this.bodyEl.innerHTML = '';
      var clone = src.cloneNode(true);
      clone.removeAttribute('hidden');
      clone.removeAttribute('id');
      clone.classList.remove('place__extra');
      this.bodyEl.appendChild(clone);
      if (this.titleEl) {
        this.titleEl.textContent = trigger.getAttribute('data-modal-title') ||
                                   src.getAttribute('data-title') || 'Details';
      }

      this.modal.hidden = false;
      requestAnimationFrame(function () { self.modal.classList.add('is-open'); });
      this.isOpen = true;
      lockScroll();
      this.release = trapFocus(this.modal);
      var close = $('[data-modal-close]', this.modal);
      if (close) close.focus();
      if (this.box) this.box.scrollTop = 0;
    },

    close: function () {
      var self = this;
      if (!this.isOpen) return;
      this.modal.classList.remove('is-open');
      this.isOpen = false;
      unlockScroll();
      if (this.release) { this.release(); this.release = null; }
      setTimeout(function () {
        if (self.isOpen) return;
        self.modal.hidden = true;
        if (self.bodyEl) self.bodyEl.innerHTML = '';
      }, reduced() ? 0 : 300);
      if (this.lastFocus) this.lastFocus.focus();
    }
  };

  /* ======================================================================
     14. LIGHTBOX — gallery.html. The triggers are plain <a href="photo">
     links, so without JS they simply open the image file. With JS they open
     an overlay with arrow-key navigation, swipe support and a counter.
     ====================================================================== */
  var Lightbox = {
    init: function () {
      var self = this;
      var box = $('#lightbox');
      var links = $$('[data-lb]');
      if (!box || !links.length) return;

      this.box = box;
      this.links = links;
      this.img = $('#lbImage');
      this.cap = $('#lbCaption');
      this.counter = $('#lbCounter');
      this.figure = $('.lightbox__figure', box);
      box.hidden = true;

      links.forEach(function (link, i) {
        on(link, 'click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
          e.preventDefault();
          self.open(i);
        });
      });

      on($('#lbPrev'), 'click', function () { self.step(-1); });
      on($('#lbNext'), 'click', function () { self.step(1); });
      on($('#lbClose'), 'click', function () { self.close(); });
      on(box, 'click', function (e) {
        if (e.target === box || e.target.classList.contains('lightbox__stage')) self.close();
      });
      on(doc, 'keydown', function (e) {
        if (!self.isOpen) return;
        if (e.key === 'Escape') { self.close(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); self.step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); self.step(-1); }
      });

      /* swipe: horizontal drags over 45px flip the image */
      var x0 = null, y0 = null;
      var stage = $('.lightbox__stage', box);
      on(stage, 'touchstart', function (e) {
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      }, { passive: true });
      on(stage, 'touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        var dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) self.step(dx < 0 ? 1 : -1);
        x0 = y0 = null;
      });
    },

    render: function () {
      var link = this.links[this.i];
      var img = $('img', link);
      var src = link.getAttribute('href');
      var cap = link.getAttribute('data-lb-caption') ||
                (img ? img.getAttribute('alt') : '') || '';
      if (this.img) { this.img.src = src; this.img.alt = cap; }
      if (this.cap) this.cap.textContent = cap;
      if (this.counter) this.counter.textContent = (this.i + 1) + ' / ' + this.links.length;
    },

    open: function (i) {
      var self = this;
      this.i = i;
      this.lastFocus = doc.activeElement;
      this.render();
      this.box.hidden = false;
      requestAnimationFrame(function () { self.box.classList.add('is-open'); });
      this.isOpen = true;
      lockScroll();
      this.release = trapFocus(this.box);
      var close = $('#lbClose');
      if (close) close.focus();
    },

    step: function (dir) {
      var self = this;
      var n = this.links.length;
      this.i = (this.i + dir + n) % n;
      if (reduced()) { this.render(); return; }
      this.box.classList.add('is-swapping');
      setTimeout(function () {
        self.render();
        self.box.classList.remove('is-swapping');
      }, 140);
    },

    close: function () {
      var self = this;
      if (!this.isOpen) return;
      this.box.classList.remove('is-open');
      this.isOpen = false;
      unlockScroll();
      if (this.release) { this.release(); this.release = null; }
      setTimeout(function () { if (!self.isOpen) self.box.hidden = true; }, reduced() ? 0 : 300);
      if (this.lastFocus) this.lastFocus.focus();
    }
  };

  /* ======================================================================
     15. FORM VALIDATE — contact.html. Bold red error blocks, inline and
     announced through aria-live. Nothing is sent anywhere: it is a demo.
     ====================================================================== */
  var FormValidate = {
    init: function () {
      var form = $('#contactForm');
      if (!form) return;
      /* With JS available we take over validation entirely, so the browser's own
         bubbles do not pre-empt our error blocks. Without JS the attribute is
         never added and native validation still protects the form. */
      form.setAttribute('novalidate', 'novalidate');
      var status = $('#formStatus');
      var fields = $$('[data-validate]', form);

      function fail(field, msg) {
        var wrap = field.closest('.field');
        var block = $('.error-block', wrap);
        wrap.classList.add('has-error');
        field.setAttribute('aria-invalid', 'true');
        if (block) block.textContent = msg;
      }

      function pass(field) {
        var wrap = field.closest('.field');
        wrap.classList.remove('has-error');
        field.setAttribute('aria-invalid', 'false');
      }

      function check(field) {
        var v = (field.value || '').trim();
        var label = field.getAttribute('data-label') || 'This field';
        if (field.hasAttribute('required') && !v) {
          fail(field, label + ' is required.');
          return false;
        }
        if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
          fail(field, 'Enter an email address that looks like name@example.com.');
          return false;
        }
        var min = parseInt(field.getAttribute('minlength'), 10);
        if (min && v && v.length < min) {
          fail(field, label + ' needs at least ' + min + ' characters (you typed ' + v.length + ').');
          return false;
        }
        pass(field);
        return true;
      }

      fields.forEach(function (field) {
        on(field, 'blur', function () { if (field.value.trim() !== '') check(field); });
        on(field, 'input', function () {
          if (field.closest('.field').classList.contains('has-error')) check(field);
        });
      });

      on(form, 'submit', function (e) {
        e.preventDefault();
        var bad = fields.filter(function (f) { return !check(f); });
        if (bad.length) {
          status.className = 'form__status form__status--bad';
          status.textContent = bad.length === 1
            ? 'One field needs attention — see the message below it.'
            : bad.length + ' fields need attention — see the messages below them.';
          bad[0].focus();
          return;
        }
        var btn = $('#contactSubmit');
        if (btn) btn.classList.add('is-loading');
        status.className = 'form__status';
        status.textContent = 'Checking your message…';
        setTimeout(function () {
          if (btn) btn.classList.remove('is-loading');
          status.className = 'form__status form__status--ok';
          status.textContent = 'Looks good! This demo form has no backend, so nothing was sent — ' +
            'wire it to Formspree, Netlify Forms or your own endpoint to go live.';
          form.reset();
        }, 900);
      });
    }
  };

  /* ======================================================================
     16. BACK TO TOP — sticker button that fades in after 600px.
     ====================================================================== */
  var BackToTop = {
    init: function () {
      var btn = $('#toTop');
      if (!btn) return;
      var shown = false;
      ticker.add(function () {
        var want = window.pageYOffset > 600;
        if (want === shown) return;
        shown = want;
        btn.classList.toggle('is-in', want);
        btn.setAttribute('tabindex', want ? '0' : '-1');
      });
      on(btn, 'click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
        var skip = $('.skip');
        if (skip) skip.focus({ preventScroll: true });
      });
    }
  };

  /* ======================================================================
     17. PAGE WIPE — a brief accent panel wipe on internal navigation.
     Built in JS only, so without JS links behave completely normally.
     ====================================================================== */
  var PageWipe = {
    init: function () {
      if (reduced()) return;
      var panel = doc.createElement('div');
      panel.className = 'wipe';
      panel.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(panel);

      /* uncover on arrival */
      panel.classList.add('is-in');
      requestAnimationFrame(function () {
        panel.classList.remove('is-in');
        panel.classList.add('is-out');
        setTimeout(function () { panel.classList.remove('is-out'); }, 420);
      });

      on(doc, 'click', function (e) {
        var a = e.target.closest('a');
        if (!a || e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        if (a.hasAttribute('data-no-wipe') || a.hasAttribute('data-lb')) return;
        var url = a.getAttribute('href') || '';
        if (!url || url.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(url)) return;
        if (a.origin !== location.origin) return;
        if (a.pathname === location.pathname) return;   /* same page anchor */

        e.preventDefault();
        panel.classList.remove('is-out');
        panel.classList.add('is-in');
        setTimeout(function () { location.href = a.href; }, 300);
      });

      /* coming back through the cache should never leave the panel up */
      on(window, 'pageshow', function (ev) {
        if (ev.persisted) { panel.classList.remove('is-in'); panel.classList.remove('is-out'); }
      });
    }
  };

  /* ======================================================================
     18. SMOOTH SCROLL — lightweight inertial wheel scrolling.
     Instead of transforming a wrapper (which would break position: sticky
     and anchor offsets) this eases the real scroll position with lerp, so
     sticky headers, hash links and the scrollbar all keep working.
     Off for reduced motion, touch/coarse pointers and narrow viewports.
     ====================================================================== */
  var SmoothScroll = {
    init: function () {
      var mq = window.matchMedia('(min-width: 1024px)');
      var enabled = false, target = 0, current = 0, animating = false;

      function maxScroll() {
        return Math.max(0, doc.documentElement.scrollHeight - window.innerHeight);
      }
      function sync() { target = current = window.pageYOffset; }

      function frame() {
        if (!enabled) { animating = false; return; }
        current = lerp(current, target, 0.14);
        if (Math.abs(target - current) < 0.4) { current = target; animating = false; }
        jump(Math.round(current));
        if (animating) requestAnimationFrame(frame);
      }

      function onWheel(e) {
        if (!enabled) return;
        if (e.ctrlKey) return;                                   /* pinch zoom */
        if (e.target.closest('[data-native-scroll], .modal, .lightbox, .drawer, .hstrip__pin')) return;
        if (doc.body.classList.contains('is-locked')) return;
        var d = e.deltaMode === 1 ? e.deltaY * 18 : (e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
        e.preventDefault();
        target = clamp(target + d, 0, maxScroll());
        if (!animating) { animating = true; requestAnimationFrame(frame); }
      }

      /* jump without triggering the CSS smooth-scroll a second time */
      function jump(y) {
        selfScroll = true;
        try {
          window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        } catch (err) {
          html.style.scrollBehavior = 'auto';
          window.scrollTo(0, y);
          html.style.scrollBehavior = '';
        }
      }
      var selfScroll = false;

      function enable() {
        if (enabled) return;
        enabled = true;
        sync();
        window.addEventListener('wheel', onWheel, { passive: false });
      }
      function disable() {
        if (!enabled) return;
        enabled = false;
        animating = false;
        window.removeEventListener('wheel', onWheel, { passive: false });
      }
      function decide() {
        /* native scrolling wins on touch, on reduced motion and on phones */
        if (mq.matches && !reduced() && !coarse()) enable(); else disable();
      }

      /* keep our target in step with anchors, keyboard and scrollbar drags */
      on(window, 'scroll', function () {
        if (selfScroll) { selfScroll = false; return; }
        if (!animating) sync();
      }, { passive: true });
      on(window, 'resize', sync);
      on(window, 'hashchange', function () { setTimeout(sync, 600); });
      on(doc, 'keydown', function (e) {
        if (/^(Page|Arrow|Home|End|Space| )/.test(e.key)) setTimeout(sync, 0);
      });

      decide();
      on(mq, 'change', decide);
      on(mqReduce, 'change', decide);
      on(mqCoarse, 'change', decide);
    }
  };

  /* ======================================================================
     BOOT — every module is optional and fails quietly if its markup is
     missing, so one file can serve all eight pages.
     ====================================================================== */
  function boot() {
    /* footer year, meta-free and translation-free */
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    var modules = [Theme, Nav, Progress, Reveal, Counters, Parallax, Marquee,
                   HeroWords, Skeletons, HStrip, Filters, Modal, Lightbox,
                   FormValidate, BackToTop, PageWipe, SmoothScroll];

    modules.forEach(function (m) {
      try { m.init(); }
      catch (err) {
        /* one broken module must never take the page down */
        if (window.console) console.warn('[abbottabad] module failed:', err);
      }
    });

    /* if anything above threw before revealing, force content visible */
    setTimeout(function () {
      if ($$('[data-reveal]:not(.is-visible)').length && !$('.is-visible')) {
        $$('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
      }
    }, 3000);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
