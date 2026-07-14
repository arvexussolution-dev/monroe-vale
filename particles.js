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

    ctx.clearRect(0, 0, W, H);
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
