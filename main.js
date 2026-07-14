/* ============================================================
   MONROE & VALE — Eclipse
   Scroll engine: Lenis smooth scroll + three scroll-scrubbed
   video stages. Each stage scrubs video.currentTime immediately,
   and in the background extracts a frame cache into canvases;
   once cached, scrubbing switches to canvas frames (buttery).
   ============================================================ */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  window.__lenis = lenis;

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------------- Section pin lengths ----------------
     Each pinned section gets extra scroll length via a spacer:
     section height = 100vh * (1 + data-scrub-len).            */
  document.querySelectorAll('[data-scrub-len]').forEach(function (sec) {
    var len = parseFloat(sec.getAttribute('data-scrub-len')) || 2;
    sec.style.height = (100 * (1 + len)) + 'vh';
  });

  /* Progress 0..1 of a pinned section (sticky stage) */
  function pinProgress(sec) {
    var rect = sec.getBoundingClientRect();
    var total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }

  /* ---------------- Video scrub stage ---------------- */
  function ScrubStage(sectionId, videoId, canvasId, src, opts) {
    this.section = document.getElementById(sectionId);
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.sources = Array.isArray(src) ? src.filter(Boolean) : [src];
    this.srcIndex = 0;
    src = this.sources[0];
    this.opts = opts || {};
    this.frames = [];        // cached ImageBitmap/canvas frames
    this.frameCount = 0;
    this.targetFrames = this.opts.frames || 96;
    this.ready = false;      // metadata loaded
    this.cached = false;     // frame cache complete
    this.caching = false;
    this.progress = 0;
    this.smooth = 0;
    this.lastDrawn = -1;
    this.duration = 0;

    this.video.src = src;
    this.video.load();

    var self = this;
    ScrubStage.queue = ScrubStage.queue || [];
    // If a source fails (e.g. local file not uploaded yet),
    // quietly fall through to the next one in the chain.
    this.video.addEventListener('error', function () {
      self.srcIndex++;
      if (self.srcIndex < self.sources.length) {
        self.video.src = self.sources[self.srcIndex];
        self.video.load();
      }
    });
    this.video.addEventListener('loadedmetadata', function () {
      self.duration = self.video.duration || 0;
      self.ready = true;
      self.resize();
      // Nudge decode so first paint is instant
      try { self.video.currentTime = 0.001; } catch (e) {}
      if (ScrubStage.queue.indexOf(self) === -1) {
        ScrubStage.queue.push(self);
        if (ScrubStage.queue.length === 1) self.startCache();
      }
    });
    window.addEventListener('resize', function () { self.resize(); });
  }

  ScrubStage.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.section.clientWidth, h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.lastDrawn = -1; // force redraw
  };

  /* Background frame extraction: seek through the video once,
     drawing each frame into its own offscreen canvas. drawImage
     works even for cross-origin video without CORS headers (the
     canvas is tainted but still displays), so this never breaks.
     Runs while the user can already scrub the raw <video>. */
  /* The cache never touches the visible <video>: a hidden clone
     seeks through the file (the browser shares the download), so
     the on-screen video stays free to follow the user's scroll.
     Only when the whole cache is ready does the canvas take over. */
  ScrubStage.prototype.startCache = function () {
    if (this.caching || this.cached || prefersReduced) return;
    this.caching = true;

    var self = this, i = 0, n = this.targetFrames;

    var v = document.createElement('video');
    v.muted = true;
    v.setAttribute('playsinline', '');
    v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
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
      } else {
        self.frames = []; // incomplete cache is worse than none
      }
      try { v.removeAttribute('src'); v.load(); v.remove(); } catch (e) {}
      // Hand the cache slot to the next stage in the queue
      var q = ScrubStage.queue, at = q.indexOf(self);
      if (at > -1 && q[at + 1]) q[at + 1].startCache();
    }

    var metaGuard = setTimeout(function () { finish(false); }, 15000);
    v.addEventListener('error', function () { clearTimeout(metaGuard); finish(false); });
    v.addEventListener('loadedmetadata', function () {
      clearTimeout(metaGuard);
      var cap = self.opts.frameWidth || 1024;
      var fw = Math.min(v.videoWidth || 1280, cap);
      var fh = Math.round(fw * ((v.videoHeight || 720) / (v.videoWidth || 1280)));
      var dur = v.duration || self.duration || 0;

      function grab() {
        if (i >= n) { finish(true); return; }
        var t = (i / (n - 1)) * Math.max(0, dur - 0.05);
        var done = false;
        var guard = setTimeout(function () { onSeek(); }, 1200); // never stall the loop
        function onSeek() {
          if (done) return; done = true;
          clearTimeout(guard);
          v.removeEventListener('seeked', onSeek);
          try {
            var c = document.createElement('canvas');
            c.width = fw; c.height = fh;
            c.getContext('2d').drawImage(v, 0, 0, fw, fh);
            self.frames[i] = c;
          } catch (e) {
            finish(false); return; // keep direct video scrubbing
          }
          i++; grab();
        }
        v.addEventListener('seeked', onSeek);
        try { v.currentTime = t; } catch (e) { finish(false); clearTimeout(guard); }
      }
      grab();
    });
  };

  ScrubStage.prototype.update = function () {
    if (!this.ready) return;
    this.progress = pinProgress(this.section);
    this.smooth = prefersReduced ? this.progress : lerp(this.smooth, this.progress, 0.12);

    if (this.cached && this.frames.length) {
      var idx = Math.round(this.smooth * (this.frames.length - 1));
      if (idx !== this.lastDrawn && this.frames[idx]) {
        this.drawCover(this.frames[idx]);
        this.lastDrawn = idx;
      }
    } else {
      // Cache not ready yet — scrub the visible video directly.
      // Never queue seeks on top of each other; that is what janks.
      var t = this.smooth * Math.max(0, this.duration - 0.05);
      var vd = this.video;
      if (!vd.seeking && vd.readyState >= 2 && Math.abs((vd.currentTime || 0) - t) > 0.06) {
        try {
          if (vd.fastSeek) vd.fastSeek(t); else vd.currentTime = t;
        } catch (e) {}
      }
    }
  };

  ScrubStage.prototype.drawCover = function (bmp) {
    var cw = this.canvas.width, ch = this.canvas.height;
    var bw = bmp.width, bh = bmp.height;
    var scale = Math.max(cw / bw, ch / bh);
    var dw = bw * scale, dh = bh * scale;
    this.ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  /* ---------------- Build the three stages ---------------- */
  var CFG = window.MV_MEDIA || {};
  function pick(local, remote) {
    // Prefer a local file in ./assets if the user downloaded clips; fall back to CDN.
    return local ? local : remote;
  }

  var heroPoster = document.getElementById('heroPoster');
  if (heroPoster && (CFG.posterLocal || CFG.poster)) {
    heroPoster.src = pick(CFG.posterLocal, CFG.poster);
  }

  var stages = [];
  // Low-power machines get fewer, lighter frames — smoothness first.
  var LOWPOWER = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                 (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  if (CFG.orbit)   stages.push(new ScrubStage('hero',   'heroVideo',   'heroCanvas',   [CFG.orbitLocal, CFG.orbit],   { frames: LOWPOWER ? 56 : 84, frameWidth: LOWPOWER ? 896 : 1024 }));
  if (CFG.macro)   stages.push(new ScrubStage('macro',  'macroVideo',  'macroCanvas',  [CFG.macroLocal, CFG.macro],   { frames: LOWPOWER ? 36 : 56, frameWidth: LOWPOWER ? 768 : 960 }));
  if (CFG.engine)  stages.push(new ScrubStage('engine', 'engineVideo', 'engineCanvas', [CFG.engineLocal, CFG.engine], { frames: LOWPOWER ? 36 : 56, frameWidth: LOWPOWER ? 768 : 960 }));

  /* ---------------- Meridian progress ---------------- */
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

  /* ---------------- Pinned text choreography ---------------- */
  function stagger(els, p, seg) {
    // Distribute elements across progress; each fades in then out.
    var n = els.length;
    els.forEach(function (el, i) {
      var start = i / n, end = (i + 1) / n;
      var local = clamp((p - start) / (end - start), 0, 1);
      var inA = clamp(local / 0.25, 0, 1);
      var outA = seg === 'hold' && i === n - 1 ? 0 : clamp((local - 0.75) / 0.25, 0, 1);
      var a = inA * (1 - outA);
      el.style.opacity = a;
      el.style.transform = 'translateY(' + (24 * (1 - inA) - 12 * outA) + 'px)';
      el.style.filter = el.hasAttribute('data-line') ? 'blur(' + (6 * (1 - inA)) + 'px)' : '';
    });
  }

  var darkSec = document.getElementById('dark');
  var darkLines = Array.prototype.slice.call(document.querySelectorAll('[data-line]'));
  var macroSec = document.getElementById('macro');
  var macroWords = Array.prototype.slice.call(document.querySelectorAll('[data-word]'));
  var engineSec = document.getElementById('engine');
  var specs = Array.prototype.slice.call(document.querySelectorAll('[data-spec]'));

  function updateSpecs(p) {
    // Specs slide in one by one across the last 60% of the pin.
    specs.forEach(function (el, i) {
      var start = 0.35 + i * 0.18;
      var a = clamp((p - start) / 0.14, 0, 1);
      el.style.opacity = a;
      el.style.transform = 'translateX(' + (26 * (1 - a)) + 'px)';
    });
  }

  /* ---------------- Main rAF loop ---------------- */
  function frame() {
    stages.forEach(function (s) { s.update(); });
    meridianFill.style.height = (docProgress() * 100) + '%';
    stagger(darkLines, pinProgress(darkSec), 'hold');
    stagger(macroWords, pinProgress(macroSec), 'hold');
    updateSpecs(pinProgress(engineSec));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------------- IntersectionObserver reveals ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  /* ---------------- Hero title tracking-in ---------------- */
  var heroTitle = document.getElementById('heroTitle');
  var tins = heroTitle.querySelectorAll('.tin');
  tins.forEach(function (t, i) { t.style.transitionDelay = (0.4 + i * 0.06) + 's'; });

  /* ---------------- Loader ---------------- */
  var loader = document.getElementById('loader');
  var loaderBar = document.getElementById('loaderBar');
  var loadT = 0;
  var loadTimer = setInterval(function () {
    // Progress driven by first video readiness, softened
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
  // Hard fallback: never trap the user behind the loader
  setTimeout(function () {
    clearInterval(loadTimer);
    loader.classList.add('is-done');
    heroTitle.classList.add('is-in');
  }, 7000);

  /* ---------------- Waitlist form ---------------- */
  var form = document.getElementById('waitlistForm');
  var ok = document.getElementById('waitlistOk');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('waitlistEmail');
    if (!email.value || email.value.indexOf('@') < 1) { email.focus(); return; }
    form.style.display = 'none';
    ok.classList.add('is-in');
  });
})();
