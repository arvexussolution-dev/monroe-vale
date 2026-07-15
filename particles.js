/* ============================================================
   MONROE & VALE — Particles (v5 consolidated)
   All particle / star / dust systems in one file.
   Budgets come from window.MV_PERF set by main.js.
   Everything is visibility-gated: no work when off-screen.
   ============================================================ */

(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var P = window.MV_PERF || { heroDust: 100, edgeStars: 60, cardDust: 32 };

  /* ---------- Utility ---------- */
  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function isNear(el, m) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.bottom > -m && r.top < window.innerHeight + m;
  }

  /* ==========================================================
     1. Hero gold dust — drifts toward viewer, dissolves on scroll
     ========================================================== */
  (function () {
    var canvas = document.getElementById('dustCanvas');
    var hero = document.getElementById('hero');
    if (!canvas || !hero) return;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    var W, H, cx, cy, d;
    function resize() {
      d = dpr();
      W = canvas.width  = Math.round(hero.clientWidth * d);
      H = canvas.height = Math.round(window.innerHeight * d);
      cx = W / 2; cy = H / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    var N = P.heroDust, ps = [];
    function spawn(p) {
      p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1;
      p.z = Math.random() * 0.9 + 0.1;
      p.s = Math.random() * 0.9 + 0.35;
      p.tw = Math.random() * 6.283;
      return p;
    }
    for (var i = 0; i < N; i++) ps.push(spawn({}));

    // Edge stars (twinkling gold in the side bands)
    var SN = P.edgeStars, stars = [];
    for (var si = 0; si < SN; si++) {
      stars.push({
        fx: si % 2 ? 0.85 + Math.random() * 0.15 : Math.random() * 0.15,
        fy: Math.random(), r: Math.random() * 1.1 + 0.35,
        tw: Math.random() * 6.283, sp: Math.random() * 0.9 + 0.4
      });
    }

    function heroProgress() {
      var r = hero.getBoundingClientRect();
      var total = hero.offsetHeight - window.innerHeight;
      return total <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / total));
    }

    var alpha = 0;
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!isNear(hero, 200)) return;
      var p = heroProgress();
      var target = p < 0.015 ? 1 : Math.max(0, 1 - (p - 0.015) / 0.065);
      alpha += (target - alpha) * 0.07;
      var starAlpha = Math.max(0, 1 - Math.max(0, (p - 0.8) / 0.2));

      ctx.clearRect(0, 0, W, H);

      // Edge stars
      if (starAlpha > 0.01) {
        for (var j = 0; j < stars.length; j++) {
          var st = stars[j];
          var tw = 0.55 + 0.45 * Math.sin(st.tw + now * 0.0009 * st.sp);
          ctx.beginPath();
          ctx.fillStyle = 'rgba(201,163,92,' + (starAlpha * 0.7 * tw).toFixed(3) + ')';
          ctx.arc(st.fx * W, st.fy * H, st.r * d, 0, 6.2832);
          ctx.fill();
        }
      }
      // Drift dust
      if (alpha > 0.01) {
        var f = Math.min(W, H) * 0.5;
        for (var i = 0; i < ps.length; i++) {
          var q = ps[i];
          q.z -= 0.0026 * q.s;
          if (q.z <= 0.06) { spawn(q); q.z = 1; }
          var px = cx + (q.x / q.z) * f, py = cy + (q.y / q.z) * f;
          if (px < -24 || px > W + 24 || py < -24 || py > H + 24) { spawn(q); q.z = 1; continue; }
          var depth = 1 - q.z;
          var tw2 = 0.75 + 0.25 * Math.sin(q.tw + now * 0.0011 * q.s);
          ctx.beginPath();
          ctx.fillStyle = 'rgba(201,163,92,' + (alpha * depth * 0.85 * tw2).toFixed(3) + ')';
          ctx.arc(px, py, (1.7 * d) * depth * q.s + 0.35, 0, 6.2832);
          ctx.fill();
        }
      }
    })(0);
  })();

  /* ==========================================================
     2. Edge stars on macro & engine stages
     ========================================================== */
  function edgeStars(sectionId, stageSel) {
    var section = document.getElementById(sectionId);
    var stage = section && section.querySelector(stageSel);
    if (!stage) return;
    var c = document.createElement('canvas');
    c.className = 'edge-stars';
    stage.appendChild(c);
    var ctx = c.getContext && c.getContext('2d');
    if (!ctx) return;
    var W = 0, H = 0, d2 = 1, SN2 = Math.round(P.edgeStars * 0.7), sts = [];
    for (var i = 0; i < SN2; i++) {
      sts.push({
        fx: i % 2 ? 0.85 + Math.random() * 0.15 : Math.random() * 0.15,
        fy: Math.random(), r: Math.random() * 1.1 + 0.35,
        tw: Math.random() * 6.283, sp: Math.random() * 0.9 + 0.4
      });
    }
    function size() {
      d2 = dpr();
      W = c.width  = Math.max(1, Math.round(stage.clientWidth * d2));
      H = c.height = Math.max(1, Math.round(window.innerHeight * d2));
    }
    size(); window.addEventListener('resize', size);
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!isNear(section, 100)) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < sts.length; i++) {
        var s = sts[i];
        var a = (0.5 + 0.5 * Math.sin(s.tw + now * 0.0009 * s.sp)) * 0.65;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(201,163,92,' + a.toFixed(3) + ')';
        ctx.arc(s.fx * W, s.fy * H, s.r * d2, 0, 6.2832);
        ctx.fill();
      }
    })(0);
  }
  edgeStars('macro', '.macro__stage');
  edgeStars('engine', '.engine__stage');

  /* ==========================================================
     3. Card hover dust (collection cards + spiral cards)
     ========================================================== */
  if (window.matchMedia('(hover: none)').matches) return;
  function attachDust(media) {
    var canvas = document.createElement('canvas');
    canvas.className = 'card-dust';
    media.appendChild(canvas);
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var ps = [], raf2 = null, active = false, W2 = 0, H2 = 0, cx2 = 0, cy2 = 0;
    var N2 = P.cardDust;
    function spawn(p, deep) {
      p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1;
      p.z = deep ? Math.random() * 0.9 + 0.1 : 0.95;
      p.s = Math.random() * 0.9 + 0.4;
      return p;
    }
    function size() {
      var d3 = dpr();
      W2 = canvas.width  = Math.max(1, Math.round(media.clientWidth * d3));
      H2 = canvas.height = Math.max(1, Math.round(media.clientHeight * d3));
      cx2 = W2 / 2; cy2 = H2 / 2;
    }
    function tick() {
      ctx.clearRect(0, 0, W2, H2);
      var f = Math.min(W2, H2) * 0.5, alive = false;
      for (var i = 0; i < ps.length; i++) {
        var q = ps[i]; q.z -= 0.012 * q.s;
        if (q.z <= 0.07) { if (active) spawn(q, false); else continue; }
        var px = cx2 + (q.x / q.z) * f, py = cy2 + (q.y / q.z) * f;
        if (px < -8 || px > W2 + 8 || py < -8 || py > H2 + 8) { if (active) spawn(q, false); continue; }
        alive = true;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(201,163,92,' + ((1 - q.z) * 0.85).toFixed(3) + ')';
        ctx.arc(px, py, (1 - q.z) * 2.1 + 0.3, 0, 6.2832);
        ctx.fill();
      }
      if (active || alive) raf2 = requestAnimationFrame(tick);
      else { raf2 = null; ctx.clearRect(0, 0, W2, H2); }
    }
    media.addEventListener('mouseenter', function () {
      active = true; size();
      if (!ps.length) for (var i = 0; i < N2; i++) ps.push(spawn({}, true));
      else ps.forEach(function (p) { spawn(p, true); });
      if (!raf2) raf2 = requestAnimationFrame(tick);
    });
    media.addEventListener('mouseleave', function () { active = false; });
  }
  // Attach after collection.js builds the DOM (run on next tick)
  setTimeout(function () {
    document.querySelectorAll('.wcard__media, .scard__media').forEach(attachDust);
  }, 100);
})();
