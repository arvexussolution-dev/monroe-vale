/* ============================================================
   MONROE & VALE — Eclipse  (v5 performance rewrite)
   -----------------------------------------------------------
   Key changes vs v4:
   • Only ONE video loads at start (the hero orbit). Macro and
     engine videos are lazy — they do not touch the network
     until the user scrolls near them.
   • Direct video seeking is GONE. The visible <video> just
     plays once into a poster, then hides. Scrubbing only ever
     uses cached canvas frames or — until the cache finishes —
     holds the poster/first‑frame still. Result: zero seek jank.
   • A single consolidated rAF drives everything.
   • Particle budgets live in this file so they can be tuned in
     one place (see PERF object).
   ============================================================ */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Perf knobs (exported for particles.js) ---------- */
  var LP = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
           (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  window.MV_PERF = {
    lowPower: LP,
    heroDust: LP ? 60 : 120,
    edgeStars: LP ? 40 : 72,
    cardDust: LP ? 24 : 42,
    heroFrames: LP ? 40 : 72,
    clipFrames: LP ? 28 : 48,
    frameWidth: LP ? 768 : 960
  };

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, smoothWheel: true, touchMultiplier: 1.2 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  window.__lenis = lenis;

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- Pin lengths ---------- */
  document.querySelectorAll('[data-scrub-len]').forEach(function (sec) {
    var len = parseFloat(sec.getAttribute('data-scrub-len')) || 2;
    sec.style.height = (100 * (1 + len)) + 'vh';
  });

  function pinProgress(sec) {
    var rect = sec.getBoundingClientRect();
    var total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }

  /* ============================================================
     ScrubStage — lazy, cache-only, no direct seeks
     ============================================================ */
  function ScrubStage(sectionId, videoId, canvasId, srcs, opts) {
    this.section  = document.getElementById(sectionId);
    this.video    = document.getElementById(videoId);
    this.canvas   = document.getElementById(canvasId);
    this.ctx      = this.canvas.getContext('2d');
    this.srcs     = (Array.isArray(srcs) ? srcs : [srcs]).filter(Boolean);
    this.opts     = opts || {};
    this.frames   = [];
    this.frameCount = 0;
    this.targetFrames = this.opts.frames || 48;
    this.cached   = false;
    this.caching  = false;
    this.progress = 0;
    this.smooth   = 0;
    this.lastDrawn = -1;
    this.duration = 0;
    this.loaded   = false;  // true once we start loading this stage
    this.ready    = false;
    window.addEventListener('resize', this.resize.bind(this));
  }

  /* Lazy init: don't touch the network until called */
  ScrubStage.prototype.load = function () {
    if (this.loaded) return;
    this.loaded = true;
    // The video element itself is never shown to the user: the canvas
    // above it is the only thing on screen. This lets us play it
    // silently to harvest frames without any visible playback.
    this.video.style.opacity = '0';
    var self = this, idx = 0;
    function tryNext() {
      if (idx >= self.srcs.length) return; // all failed — poster stays
      self.video.src = self.srcs[idx];
      self.video.load();
    }
    this.video.addEventListener('error', function () { idx++; tryNext(); });
    this.video.addEventListener('loadedmetadata', function () {
      self.duration = self.video.duration || 0;
      self.ready = true;
      self.resize();
      self.startCache();
    });
    // Paint whatever the video currently shows until the cache lands.
    this.video.addEventListener('loadeddata', function () {
      try { self.drawCover(self.video); } catch (e) {}
    });
    tryNext();
  };

  ScrubStage.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.section.clientWidth, h = window.innerHeight;
    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.lastDrawn = -1;
  };

  /* Cache runs on a hidden clone — never blocks the UI thread's
     compositing. The visible video is paused and invisible. */
  /* Preferred path: let the video PLAY once, silently and hidden,
     grabbing frames as they decode. Playback decoding is what
     browsers optimise for — it never stalls the main thread the way
     random seeking does. Requires requestVideoFrameCallback. */
  ScrubStage.prototype.startCache = function () {
    if (this.caching || this.cached || prefersReduced) return;
    this.caching = true;
    var self = this;

    var vv = this.video;
    if (typeof vv.requestVideoFrameCallback === 'function') {
      var n2 = this.targetFrames;
      var cap2 = this.opts.frameWidth || 960;
      var fw2 = Math.min(vv.videoWidth || 1280, cap2);
      var fh2 = Math.round(fw2 * ((vv.videoHeight || 720) / (vv.videoWidth || 1280)));
      var dur2 = vv.duration || 8;
      var slots = new Array(n2);
      var got = 0;

      vv.muted = true;
      vv.playbackRate = 2;               // finish the sweep quickly
      var playing = vv.play();
      if (playing && playing.catch) playing.catch(function () { self.cloneCache(); });

      var onFrame = function (now, meta) {
        var t = meta && typeof meta.mediaTime === 'number' ? meta.mediaTime : vv.currentTime;
        var slot = Math.round((t / Math.max(0.001, dur2)) * (n2 - 1));
        if (slot >= 0 && slot < n2 && !slots[slot]) {
          try {
            var c = document.createElement('canvas');
            c.width = fw2; c.height = fh2;
            c.getContext('2d').drawImage(vv, 0, 0, fw2, fh2);
            slots[slot] = c; got++;
          } catch (e) {}
        }
        if (vv.ended || got >= n2) { finishPlay(); return; }
        vv.requestVideoFrameCallback(onFrame);
      };
      vv.requestVideoFrameCallback(onFrame);

      var playGuard = setTimeout(function () { finishPlay(); }, 25000);
      function finishPlay() {
        clearTimeout(playGuard);
        try { vv.pause(); } catch (e) {}
        // Fill any gaps by holding the previous frame
        var last = null, filled = 0;
        for (var k = 0; k < n2; k++) {
          if (slots[k]) { last = slots[k]; filled++; }
          else if (last) slots[k] = last;
        }
        for (var k2 = n2 - 1; k2 >= 0; k2--) {
          if (!slots[k2] && slots[k2 + 1]) slots[k2] = slots[k2 + 1];
        }
        if (filled >= Math.max(6, n2 * 0.5)) {
          self.frames = slots;
          self.cached = true;
          self.caching = false;
          self.frameCount = slots.length;
          self.lastDrawn = -1;
          var stage = self.section.querySelector('.hero__stage, .macro__stage, .engine__stage');
          if (stage) stage.classList.add('stage-ready');
          vv.style.display = 'none';
        } else {
          self.caching = false;
          self.cloneCache();               // playback sweep failed — try seeking
        }
      }
      return;
    }
    this.caching = false;
    this.cloneCache();
  };

  /* Fallback for browsers without requestVideoFrameCallback */
  ScrubStage.prototype.cloneCache = function () {
    if (this.caching || this.cached || prefersReduced) return;
    this.caching = true;
    var self = this, i = 0, n = this.targetFrames;

    var v = document.createElement('video');
    v.muted = true; v.setAttribute('playsinline', '');
    v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
    v.src = this.video.currentSrc || this.video.src;
    document.body.appendChild(v);
    v.load();

    function finish(ok) {
      self.cached = ok && self.frames.length >= 2;
      self.caching = false;
      self.frameCount = self.frames.length;
      self.lastDrawn = -1;
      if (self.cached) {
        var stage = self.section.querySelector('.hero__stage, .macro__stage, .engine__stage');
        if (stage) stage.classList.add('stage-ready');
        // Hide the real video entirely — canvas owns this stage now
        self.video.style.display = 'none';
      } else {
        self.frames = [];
      }
      try { v.removeAttribute('src'); v.load(); v.remove(); } catch (e) {}
    }

    var metaGuard = setTimeout(function () { finish(false); }, 20000);
    v.addEventListener('error', function () { clearTimeout(metaGuard); finish(false); });
    v.addEventListener('loadedmetadata', function () {
      clearTimeout(metaGuard);
      var cap = self.opts.frameWidth || 960;
      var fw = Math.min(v.videoWidth || 1280, cap);
      var fh = Math.round(fw * ((v.videoHeight || 720) / (v.videoWidth || 1280)));
      var dur = v.duration || self.duration || 0;

      function grab() {
        if (i >= n) { finish(true); return; }
        var t = (i / (n - 1)) * Math.max(0, dur - 0.05);
        var done = false;
        var guard = setTimeout(onSeek, 1500);
        function onSeek() {
          if (done) return; done = true;
          clearTimeout(guard);
          v.removeEventListener('seeked', onSeek);
          try {
            var c = document.createElement('canvas');
            c.width = fw; c.height = fh;
            c.getContext('2d').drawImage(v, 0, 0, fw, fh);
            self.frames[i] = c;
          } catch (e) { finish(false); return; }
          i++;
          // Yield to the main thread every frame so scrolling stays smooth
          setTimeout(grab, 4);
        }
        v.addEventListener('seeked', onSeek);
        try { v.currentTime = t; } catch (e) { finish(false); clearTimeout(guard); }
      }
      grab();
    });
  };

  /* Update: canvas frames ONLY — never seeks the visible video */
  ScrubStage.prototype.update = function () {
    if (!this.loaded) return;
    this.progress = pinProgress(this.section);
    this.smooth = prefersReduced ? this.progress : lerp(this.smooth, this.progress, 0.12);

    if (this.cached && this.frames.length) {
      var idx = Math.round(this.smooth * (this.frames.length - 1));
      if (idx !== this.lastDrawn && this.frames[idx]) {
        this.drawCover(this.frames[idx]);
        this.lastDrawn = idx;
      }
    }
    // If not cached yet: first-frame poster stays. No seeking = no jank.
  };

  ScrubStage.prototype.drawCover = function (bmp) {
    var cw = this.canvas.width, ch = this.canvas.height;
    var bw = bmp.width || bmp.videoWidth || cw;
    var bh = bmp.height || bmp.videoHeight || ch;
    var scale = Math.max(cw / bw, ch / bh);
    var dw = bw * scale, dh = bh * scale;
    this.ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  /* ---------- Build stages (lazy: only hero loads immediately) ---------- */
  var CFG = window.MV_MEDIA || {};
  var P = window.MV_PERF;

  function setPoster(id, url) {
    var el = document.getElementById(id);
    if (el && url) el.src = url;
  }
  setPoster('heroPoster',   CFG.posterLocal || CFG.poster);
  setPoster('macroPoster',  CFG.macroPoster);
  setPoster('enginePoster', CFG.enginePoster);

  var stages = [];
  if (CFG.orbit || CFG.orbitLocal)
    stages.push(new ScrubStage('hero',   'heroVideo',  'heroCanvas',  [CFG.orbitLocal, CFG.orbit],   { frames: P.heroFrames, frameWidth: P.frameWidth }));
  if (CFG.macro || CFG.macroLocal)
    stages.push(new ScrubStage('macro',  'macroVideo', 'macroCanvas', [CFG.macroLocal, CFG.macro],   { frames: P.clipFrames, frameWidth: P.frameWidth }));
  if (CFG.engine || CFG.engineLocal)
    stages.push(new ScrubStage('engine', 'engineVideo','engineCanvas',[CFG.engineLocal, CFG.engine], { frames: P.clipFrames, frameWidth: P.frameWidth }));

  // Hero loads immediately; others wait until user scrolls near
  if (stages[0]) stages[0].load();

  /* ---------- Meridian progress ---------- */
  var meridianFill = document.getElementById('meridianFill');
  var ticksWrap = document.getElementById('meridianTicks');
  for (var i = 0; i <= 12; i++) {
    var tick = document.createElement('i');
    tick.style.top = (i / 12 * 100) + '%';
    if (i % 3 === 0) tick.className = 'is-hour';
    ticksWrap.appendChild(tick);
  }
  function docProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - window.innerHeight;
    return max > 0 ? clamp((window.scrollY || h.scrollTop) / max, 0, 1) : 0;
  }

  /* ---------- Pinned text choreography ---------- */
  function stagger(els, p) {
    var n = els.length;
    els.forEach(function (el, i) {
      var start = i / n, end = (i + 1) / n;
      var local = clamp((p - start) / (end - start), 0, 1);
      var inA = clamp(local / 0.25, 0, 1);
      var outA = i === n - 1 ? 0 : clamp((local - 0.75) / 0.25, 0, 1);
      var a = inA * (1 - outA);
      el.style.opacity = a;
      el.style.transform = 'translateY(' + (24 * (1 - inA) - 12 * outA) + 'px)';
      el.style.filter = el.hasAttribute('data-line') ? 'blur(' + (6 * (1 - inA)) + 'px)' : '';
    });
  }

  var darkSec   = document.getElementById('dark');
  var darkLines = [].slice.call(document.querySelectorAll('[data-line]'));
  var macroSec  = document.getElementById('macro');
  var macroWords= [].slice.call(document.querySelectorAll('[data-word]'));
  var engineSec = document.getElementById('engine');
  var specs     = [].slice.call(document.querySelectorAll('[data-spec]'));

  function updateSpecs(p) {
    specs.forEach(function (el, i) {
      var start = 0.35 + i * 0.18;
      var a = clamp((p - start) / 0.14, 0, 1);
      el.style.opacity = a;
      el.style.transform = 'translateX(' + (26 * (1 - a)) + 'px)';
    });
  }

  /* ============================================================
     SINGLE rAF — everything in one loop, visibility-gated
     ============================================================ */
  var VH = window.innerHeight;
  window.addEventListener('resize', function () { VH = window.innerHeight; });

  function isNear(el, margin) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.bottom > -margin && r.top < VH + margin;
  }

  function mainLoop() {
    // Meridian (always)
    meridianFill.style.height = (docProgress() * 100) + '%';

    // Lazy-load stages when they approach the viewport
    for (var si = 0; si < stages.length; si++) {
      var s = stages[si];
      if (!s.loaded && isNear(s.section, VH * 1.5)) s.load();
      if (isNear(s.section, VH * 0.5)) s.update();
    }

    // Text choreography — only when visible
    if (isNear(darkSec, 200))   stagger(darkLines, pinProgress(darkSec));
    if (isNear(macroSec, 200))  stagger(macroWords, pinProgress(macroSec));
    if (isNear(engineSec, 200)) updateSpecs(pinProgress(engineSec));

    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);

  /* ---------- IO reveals ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  /* ---------- Hero title tracking-in ---------- */
  var heroTitle = document.getElementById('heroTitle');
  heroTitle.querySelectorAll('.tin').forEach(function (t, i) {
    t.style.transitionDelay = (0.4 + i * 0.06) + 's';
  });

  /* ---------- Loader ---------- */
  var loader = document.getElementById('loader');
  var loaderBar = document.getElementById('loaderBar');
  var loadT = 0;
  var loadTimer = setInterval(function () {
    var v = document.getElementById('heroVideo');
    var target = v && v.readyState >= 2 ? 100 : Math.min(loadT + 4, 82);
    loadT = lerp(loadT, target, 0.2);
    loaderBar.style.width = loadT + '%';
    if (loadT > 99) {
      clearInterval(loadTimer);
      loader.classList.add('is-done');
      heroTitle.classList.add('is-in');
    }
  }, 80);
  setTimeout(function () {
    clearInterval(loadTimer);
    loader.classList.add('is-done');
    heroTitle.classList.add('is-in');
  }, 7000);

  /* ---------- Waitlist ---------- */
  var form = document.getElementById('waitlistForm');
  var ok   = document.getElementById('waitlistOk');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('waitlistEmail');
    if (!email.value || email.value.indexOf('@') < 1) { email.focus(); return; }
    form.style.display = 'none';
    ok.classList.add('is-in');
  });
})();
