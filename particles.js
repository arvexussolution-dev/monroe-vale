/* ============================================================
   MONROE & VALE — Hero dust
   A quiet field of gold dust drifting toward the viewer while
   the page is at rest; it dissolves as soon as scrolling begins
   and the orbit scrub takes over.
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('dustCanvas');
  var hero = document.getElementById('hero');
  if (!canvas || !hero) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx || prefersReduced) { canvas.style.display = 'none'; return; }

  var W, H, cx, cy, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.round(hero.clientWidth * dpr);
    H = canvas.height = Math.round(window.innerHeight * dpr);
    cx = W / 2; cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  var N = 150, ps = [];
  // Static twinkling stars concentrated in the left/right edge bands
  var SN = 96, stars = [];
  for (var si = 0; si < SN; si++) {
    var leftBand = si % 2 === 0;
    stars.push({
      // 0..0.15 of width on the left, 0.85..1 on the right
      fx: leftBand ? Math.random() * 0.15 : 0.85 + Math.random() * 0.15,
      fy: Math.random(),
      r: Math.random() * 1.1 + 0.35,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.9 + 0.4
    });
  }
  function spawn(p) {
    p.x = Math.random() * 2 - 1;
    p.y = Math.random() * 2 - 1;
    p.z = Math.random() * 0.9 + 0.1;
    p.s = Math.random() * 0.9 + 0.35;   // per-particle speed/size character
    p.tw = Math.random() * Math.PI * 2; // twinkle phase
    return p;
  }
  for (var i = 0; i < N; i++) ps.push(spawn({}));

  var alpha = 0;
  function heroProgress() {
    var rect = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  function tick(now) {
    var p = heroProgress();
    // Fully present at rest; dissolved by 8% of the hero pin.
    var target = p < 0.015 ? 1 : Math.max(0, 1 - (p - 0.015) / 0.065);
    alpha += (target - alpha) * 0.07;

    // Edge stars live for the whole hero pin, fading only near its end
    var starAlpha = Math.max(0, 1 - Math.max(0, (p - 0.8) / 0.2));

    ctx.clearRect(0, 0, W, H);
    if (starAlpha > 0.01 && !document.hidden) {
      for (var sj = 0; sj < stars.length; sj++) {
        var st = stars[sj];
        var stw = 0.55 + 0.45 * Math.sin(st.tw + now * 0.0009 * st.sp);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(201,163,92,' + (starAlpha * 0.75 * stw).toFixed(3) + ')';
        ctx.arc(st.fx * W, st.fy * H, st.r * dpr, 0, 6.2832);
        ctx.fill();
      }
    }
    if (alpha > 0.01 && !document.hidden) {
      var f = Math.min(W, H) * 0.5;
      for (var i = 0; i < ps.length; i++) {
        var q = ps[i];
        q.z -= 0.0026 * q.s;             // drift toward the viewer
        if (q.z <= 0.06) { spawn(q); q.z = 1; }
        var px = cx + (q.x / q.z) * f;
        var py = cy + (q.y / q.z) * f;
        if (px < -24 || px > W + 24 || py < -24 || py > H + 24) { spawn(q); q.z = 1; continue; }
        var depth = 1 - q.z;
        var tw = 0.75 + 0.25 * Math.sin(q.tw + now * 0.0011 * q.s);
        var r = (1.7 * dpr) * depth * q.s + 0.35;
        var a = alpha * depth * 0.85 * tw;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(201,163,92,' + a.toFixed(3) + ')';
        ctx.arc(px, py, r, 0, 6.2832);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ============================================================
   Card hover dust — on collection-card hover, a small field of
   gold particles rushes toward the visitor inside the card.
   ============================================================ */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; // touch devices skip hover FX

  function attach(media) {
    var canvas = document.createElement('canvas');
    canvas.className = 'card-dust';
    media.appendChild(canvas);
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    var ps = [], raf = null, active = false, W = 0, H = 0, cx = 0, cy = 0;
    function spawn(p, deep) {
      p.x = Math.random() * 2 - 1;
      p.y = Math.random() * 2 - 1;
      p.z = deep ? Math.random() * 0.9 + 0.1 : 0.95;
      p.s = Math.random() * 0.9 + 0.4;
      return p;
    }
    function size() {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.max(1, Math.round(media.clientWidth * d));
      H = canvas.height = Math.max(1, Math.round(media.clientHeight * d));
      cx = W / 2; cy = H / 2;
    }
    function tick(now) {
      ctx.clearRect(0, 0, W, H);
      var f = Math.min(W, H) * 0.5;
      var alive = false;
      for (var i = 0; i < ps.length; i++) {
        var q = ps[i];
        q.z -= 0.011 * q.s;                       // faster than the hero — a rush
        if (q.z <= 0.07) { if (active) { spawn(q, false); } else { continue; } }
        var px = cx + (q.x / q.z) * f, py = cy + (q.y / q.z) * f;
        if (px < -12 || px > W + 12 || py < -12 || py > H + 12) {
          if (active) { spawn(q, false); } continue;
        }
        alive = true;
        var depth = 1 - q.z;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(201,163,92,' + (depth * 0.9).toFixed(3) + ')';
        ctx.arc(px, py, depth * 2.1 + 0.3, 0, 6.2832);
        ctx.fill();
      }
      if (active || alive) { raf = requestAnimationFrame(tick); }
      else { raf = null; ctx.clearRect(0, 0, W, H); }
    }
    media.addEventListener('mouseenter', function () {
      active = true;
      size();
      if (!ps.length) for (var i = 0; i < 42; i++) ps.push(spawn({}, true));
      else ps.forEach(function (p) { spawn(p, true); });
      if (!raf) raf = requestAnimationFrame(tick);
    });
    media.addEventListener('mouseleave', function () { active = false; });
  }

  document.querySelectorAll('.wcard__media, .scard__media').forEach(attach);
})();
