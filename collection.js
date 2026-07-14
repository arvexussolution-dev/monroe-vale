/* ============================================================
   MONROE & VALE — Collection
   Spiral showcase (pinned, scroll-driven), full grid, watch
   detail modal, and a demo cart. Card images come from
   MV_MEDIA.watchImages when provided; otherwise an elegant
   procedural dial placeholder is generated per model.
   ============================================================ */

(function () {
  'use strict';

  var CFG = window.MV_MEDIA || {};
  var IMG = CFG.watchImages || {};
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; };
  var fmt = function (n) { return '$' + n.toLocaleString('en-US'); };

  /* ---------------- Procedural dial placeholder ---------------- */
  function dialSVG(o) {
    var ticks = '';
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      var x1 = 200 + Math.cos(a) * 108, y1 = 200 + Math.sin(a) * 108;
      var x2 = 200 + Math.cos(a) * (i % 3 === 0 ? 94 : 100);
      var y2 = 200 + Math.sin(a) * (i % 3 === 0 ? 94 : 100);
      ticks += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
        '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
        '" stroke="' + o.index + '" stroke-width="' + (i % 3 === 0 ? 3 : 1.4) + '"/>';
    }
    // Hands frozen at 10:08 — the watchmaker's smile
    var hourA = (10 + 8 / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    var minA = 8 / 60 * Math.PI * 2 - Math.PI / 2;
    var hands =
      '<line x1="200" y1="200" x2="' + (200 + Math.cos(hourA) * 58).toFixed(1) + '" y2="' + (200 + Math.sin(hourA) * 58).toFixed(1) + '" stroke="' + o.hand + '" stroke-width="6" stroke-linecap="round"/>' +
      '<line x1="200" y1="200" x2="' + (200 + Math.cos(minA) * 88).toFixed(1) + '" y2="' + (200 + Math.sin(minA) * 88).toFixed(1) + '" stroke="' + o.hand + '" stroke-width="3.4" stroke-linecap="round"/>';
    if (o.second) {
      var secA = 34 / 60 * Math.PI * 2 - Math.PI / 2;
      hands += '<line x1="200" y1="200" x2="' + (200 + Math.cos(secA) * 98).toFixed(1) + '" y2="' + (200 + Math.sin(secA) * 98).toFixed(1) + '" stroke="' + o.second + '" stroke-width="1.4"/>';
    }
    var s =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="' + o.bg + '"/>' +
      '<circle cx="200" cy="200" r="132" fill="none" stroke="' + o.caseC + '" stroke-width="9"/>' +
      '<circle cx="200" cy="200" r="124" fill="' + o.dial + '"/>' +
      ticks +
      '<text x="200" y="148" text-anchor="middle" font-family="Georgia,serif" font-size="13" letter-spacing="4" fill="' + o.text + '">MONROE &amp; VALE</text>' +
      '<text x="200" y="164" text-anchor="middle" font-family="Georgia,serif" font-size="7" letter-spacing="3.5" fill="' + o.sub + '">NEW YORK</text>' +
      hands +
      '<circle cx="200" cy="200" r="4.2" fill="' + o.index + '"/>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  /* ---------------- Catalog ---------------- */
  var CATALOG = [
    {
      id: 'eclipse', tag: 'Edition of 88', name: 'Eclipse Tourbillon', price: 48000,
      desc: 'The flagship tourbillon chronograph. Grade-5 titanium, 72 h reserve, 217 components.',
      story: 'Eight hundred hours in a dark room on Fifth Avenue. One movement, assembled by two hands, witnessed only by light. The Eclipse is not launched; it is released — eighty-eight times, and never again.',
      specs: ['42 mm · grade-5 titanium', 'Tourbillon chronograph', '72 h power reserve', '217 components', 'Sapphire, both sides', 'Edition of 88, hand-numbered'],
      img: IMG.eclipse || CFG.posterLocal || CFG.poster || null,
      pal: { bg: '#0b0a09', caseC: '#c9a35c', dial: '#0d0c0b', index: '#c9a35c', hand: '#ece5d8', text: '#ece5d8', sub: '#8f6f35' }
    },
    {
      id: 'hudson', tag: 'The daily classic', name: 'Hudson Automatic', price: 1290,
      desc: 'Inspired by the quiet strength of the Hudson River. Deep-blue dial, 41 mm steel, sapphire glass, 100 m.',
      story: 'The river does not hurry, and it is never late. The Hudson Automatic borrows that patience: a steel case drawn in one clean line, a dial the colour of deep water, a movement that winds itself on the way to work.',
      specs: ['41 mm · stainless steel', 'Automatic movement', 'Deep-blue dial', 'Sapphire glass', '100 m water resistance', 'Leather or steel strap'],
      img: IMG.hudson || null,
      pal: { bg: '#0d0f14', caseC: '#b9bdc4', dial: '#13233d', index: '#dfe3e8', hand: '#e8ecf1', text: '#dfe3e8', sub: '#8a93a1' }
    },
    {
      id: 'manhattan', tag: 'Limited series', name: 'Manhattan Reserve', price: 1890,
      desc: 'Black dial, gold detailing, black leather. 40 mm. A limited series for evenings that matter.',
      story: 'Some evenings are appointments with history. The Manhattan Reserve keeps them — a black dial edged in gold, sized for a cuff, made in a series small enough to stay a rumour.',
      specs: ['40 mm case', 'Automatic movement', 'Black dial · gold detailing', 'Black leather strap', 'Limited series'],
      img: IMG.manhattan || null,
      pal: { bg: '#0c0b0a', caseC: '#c9a35c', dial: '#0a0a0a', index: '#c9a35c', hand: '#c9a35c', text: '#ece5d8', sub: '#8f6f35' }
    },
    {
      id: 'pacific', tag: 'Sport chronograph', name: 'Pacific Chronograph', price: 1490,
      desc: 'Chronograph on a steel bracelet. 42 mm, 200 m. Built for the coast, at speed.',
      story: 'Built where the road meets the water. Two pushers, a steel bracelet, two hundred metres of indifference to weather. The Pacific times the moment and forgives the spray.',
      specs: ['42 mm · stainless steel', 'Chronograph function', 'Light-grey or blue dial', 'Steel bracelet', '200 m water resistance'],
      img: IMG.pacific || null,
      pal: { bg: '#0e1013', caseC: '#c2c7cd', dial: '#8e97a3', index: '#14181d', hand: '#14181d', text: '#14181d', sub: '#3d4753' }
    },
    {
      id: 'aspen', tag: 'The traveller', name: 'Aspen GMT', price: 1690,
      desc: 'Forest-green dial, two time zones, brown leather. Built for those who move between cities.',
      story: 'Two time zones, one life. The Aspen GMT holds home on a gold-tipped hand while you are somewhere else — forest-green, leather-strapped, unbothered by departure boards.',
      specs: ['41 mm · steel case', 'GMT — two time zones', 'Forest-green dial', 'Brown leather strap', 'Automatic movement'],
      img: IMG.aspen || null,
      pal: { bg: '#0b0d0b', caseC: '#b9bdc4', dial: '#1c3a2a', index: '#e8e2d4', hand: '#e8e2d4', text: '#e8e2d4', sub: '#c9a35c' }
    },
    {
      id: 'liberty', tag: '250 pieces', name: 'Liberty No. 01', price: 2450,
      desc: '250 pieces, each engraved. Dark dial, one discreet red detail, walnut presentation box.',
      story: 'Two hundred and fifty, each numbered by hand. A dark dial, one red heartbeat of a seconds hand, a walnut box that outlives the paperwork. Liberty No. 01 is the beginning we intend to be judged by.',
      specs: ['250 pieces · engraved case back', 'Automatic movement', 'Dark dial · red seconds detail', 'Walnut presentation box'],
      img: IMG.liberty || null,
      pal: { bg: '#0b0a0a', caseC: '#b9bdc4', dial: '#141314', index: '#ece5d8', hand: '#ece5d8', text: '#ece5d8', sub: '#7d7568', second: '#b3372f' }
    }
  ];
  CATALOG.forEach(function (w) {
    if (!w.img) w.img = dialSVG({
      bg: w.pal.bg, caseC: w.pal.caseC, dial: w.pal.dial, index: w.pal.index,
      hand: w.pal.hand, text: w.pal.text, sub: w.pal.sub, second: w.pal.second || null
    });
  });
  function byId(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }

  /* ---------------- Spiral showcase ---------------- */
  var showcase = document.getElementById('showcase');
  var stage = document.getElementById('spiralStage');
  var dotsWrap = document.getElementById('spiralDots');
  var scards = [], dots = [];

  if (showcase && stage && !prefersReduced) {
    showcase.style.height = '640vh';
    CATALOG.forEach(function (w) {
      var c = document.createElement('article');
      c.className = 'scard';
      c.innerHTML =
        '<div class="scard__media"><img src="' + w.img + '" alt="' + w.name + '"></div>' +
        '<p class="scard__idx">' + w.tag + '</p>' +
        '<h3 class="scard__name">' + w.name + '</h3>' +
        '<p class="scard__price">' + fmt(w.price) + '</p>' +
        '<p class="scard__hint">View details</p>';
      c.addEventListener('click', function () { openModal(w); });
      stage.appendChild(c);
      scards.push(c);
      var d = document.createElement('i');
      dotsWrap.appendChild(d);
      dots.push(d);
    });
  } else if (showcase && prefersReduced) {
    showcase.style.display = 'none';
  }

  function pinProgress(sec) {
    var rect = sec.getBoundingClientRect();
    var total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }

  /* Cards take turns spiralling into centre stage, hold, then
     spiral out while the next one arrives (overlapping windows). */
  function layoutSpiral() {
    if (!scards.length) return;
    var p = pinProgress(showcase);
    var phase = clamp(p / 0.92, 0, 1);          // last 8% = hand-off to grid
    var n = scards.length;
    var winW = 1.5 / n;                          // window width per card
    var stepGap = n > 1 ? (1 - winW) / (n - 1) : 0;
    var R = Math.min(window.innerWidth, window.innerHeight) * 0.72;

    scards.forEach(function (c, i) {
      var local = winW > 0 ? (phase - i * stepGap) / winW : 0;
      var o = 0, x = 0, y = 0, rot = 0, sc = 1;
      if (local > 0 && local < 1) {
        if (local < 0.32) {                      // spiral in: 1.5 turns collapsing
          var t = easeInOut(local / 0.32), a = 1 - t;
          var ang = -Math.PI * 3 * a;
          x = Math.cos(ang) * R * a;
          y = Math.sin(ang) * R * a * 0.6;
          rot = -a * 38;
          sc = 0.55 + 0.45 * t;
          o = t;
        } else if (local <= 0.68) {              // hold, centred
          o = 1;
        } else {                                 // spiral out, same rotation sense
          var t2 = easeInOut((local - 0.68) / 0.32);
          var ang2 = Math.PI * 3 * t2;
          x = Math.cos(ang2) * R * t2;
          y = Math.sin(ang2) * R * t2 * 0.6;
          rot = t2 * 38;
          sc = 1 - 0.42 * t2;
          o = 1 - t2;
        }
      }
      c.style.opacity = o.toFixed(3);
      c.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      c.style.zIndex = o > 0.5 ? 4 : 3;
      c.style.pointerEvents = (local > 0.32 && local <= 0.68) ? 'auto' : 'none';
      if (dots[i]) dots[i].className = (local > 0.05 && local < 0.95) ? 'on' : '';
    });

    var head = showcase.querySelector('.showcase__stage');
    if (head) head.style.opacity = (1 - clamp((p - 0.92) / 0.08, 0, 1) * 0.85).toFixed(3);
  }

  if (scards.length) {
    (function spiralLoop() {
      layoutSpiral();
      requestAnimationFrame(spiralLoop);
    })();
  }

  /* ---------------- Collection grid ---------------- */
  var grid = document.getElementById('collectionGrid');
  if (grid) {
    CATALOG.forEach(function (w) {
      var el = document.createElement('article');
      el.className = 'wcard';
      el.innerHTML =
        '<div class="wcard__media"><img src="' + w.img + '" alt="' + w.name + '" loading="lazy"></div>' +
        '<p class="wcard__idx">' + w.tag + '</p>' +
        '<h3 class="wcard__name">' + w.name + '</h3>' +
        '<p class="wcard__desc">' + w.desc + '</p>' +
        '<div class="wcard__row"><p class="wcard__price">' + fmt(w.price) + '</p>' +
        '<button class="wcard__add" data-add="' + w.id + '">Add to cart</button></div>';
      el.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.getAttribute && t.getAttribute('data-add')) {
          addToCart(t.getAttribute('data-add'));
        } else {
          openModal(w);
        }
      });
      grid.appendChild(el);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    grid.querySelectorAll('.wcard').forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Scroll lock (shared) ---------------- */
  var veil = document.getElementById('veil');
  function lock() {
    document.documentElement.classList.add('mv-lock');
    if (window.__lenis) window.__lenis.stop();
    veil.hidden = false;
    requestAnimationFrame(function () { veil.classList.add('is-open'); });
  }
  function unlock() {
    document.documentElement.classList.remove('mv-lock');
    if (window.__lenis) window.__lenis.start();
    veil.classList.remove('is-open');
    setTimeout(function () { veil.hidden = true; }, 500);
  }

  /* ---------------- Watch detail modal ---------------- */
  var modal = document.getElementById('watchModal');
  var mImg = document.getElementById('modalImg');
  var mIdx = document.getElementById('modalIdx');
  var mName = document.getElementById('modalName');
  var mStory = document.getElementById('modalStory');
  var mSpecs = document.getElementById('modalSpecs');
  var mPrice = document.getElementById('modalPrice');
  var mAdd = document.getElementById('modalAdd');
  var mClose = document.getElementById('modalClose');
  var currentWatch = null;
  var modalOpen = false;

  function openModal(w) {
    currentWatch = w;
    mImg.src = w.img;
    mImg.alt = w.name;
    mIdx.textContent = w.tag;
    mName.textContent = w.name;
    mStory.textContent = w.story;
    mSpecs.innerHTML = '';
    w.specs.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s;
      mSpecs.appendChild(li);
    });
    mPrice.textContent = fmt(w.price);
    mAdd.textContent = 'Add to cart';
    modal.hidden = false;
    modalOpen = true;
    lock();
    requestAnimationFrame(function () { if (modalOpen) modal.classList.add('is-open'); });
    mClose.focus();
  }
  function closeModal() {
    modalOpen = false;
    modal.classList.remove('is-open');
    setTimeout(function () { modal.hidden = true; }, 480);
    unlock();
  }
  mClose.addEventListener('click', closeModal);
  mAdd.addEventListener('click', function () {
    if (!currentWatch) return;
    addToCart(currentWatch.id);
    mAdd.textContent = 'Added ✓';
    setTimeout(function () { mAdd.textContent = 'Add to cart'; }, 1400);
  });

  /* ---------------- Demo cart ---------------- */
  var CART_KEY = 'mv_cart';
  var cart = {};
  try { cart = JSON.parse(window.localStorage.getItem(CART_KEY) || '{}') || {}; } catch (e) { cart = {}; }
  function saveCart() {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function cartCount() {
    return Object.keys(cart).reduce(function (s, k) { return s + cart[k]; }, 0);
  }
  function cartTotal() {
    return Object.keys(cart).reduce(function (s, k) {
      var w = byId(k);
      return s + (w ? w.price * cart[k] : 0);
    }, 0);
  }

  var cartBtn = document.getElementById('cartBtn');
  var cartBadge = document.getElementById('cartCount');
  var drawer = document.getElementById('cartDrawer');
  var cartItems = document.getElementById('cartItems');
  var cartFoot = document.getElementById('cartFoot');
  var cartTotalEl = document.getElementById('cartTotal');
  var cartOrder = document.getElementById('cartOrder');
  var cartDone = document.getElementById('cartDone');
  var cartDoneNo = document.getElementById('cartDoneNo');
  var cartClose = document.getElementById('cartClose');
  var drawerOpen = false;

  function renderBadge(pulse) {
    var n = cartCount();
    cartBadge.textContent = n;
    cartBadge.classList.toggle('has', n > 0);
    if (pulse && n > 0) {
      cartBadge.classList.remove('pulse');
      void cartBadge.offsetWidth; // restart animation
      cartBadge.classList.add('pulse');
    }
  }

  function renderCart() {
    cartItems.innerHTML = '';
    var ids = Object.keys(cart);
    if (!ids.length) {
      cartItems.innerHTML = '<p class="cart__empty">Your order is empty.<br>The collection is one scroll above.</p>';
    }
    ids.forEach(function (id) {
      var w = byId(id);
      if (!w) return;
      var row = document.createElement('div');
      row.className = 'citem';
      row.innerHTML =
        '<img class="citem__thumb" src="' + w.img + '" alt="">' +
        '<div><p class="citem__name">' + w.name + '</p>' +
        '<p class="citem__price">' + fmt(w.price) + '</p></div>' +
        '<div class="citem__qty">' +
        '<button data-dec="' + id + '" aria-label="Decrease">−</button>' +
        '<span>' + cart[id] + '</span>' +
        '<button data-inc="' + id + '" aria-label="Increase">+</button>' +
        '</div>' +
        '<button class="citem__rm" data-rm="' + id + '">Remove</button>';
      cartItems.appendChild(row);
    });
    cartTotalEl.textContent = fmt(cartTotal());
    cartOrder.disabled = !ids.length;
    renderBadge(false);
  }

  function addToCart(id, qty) {
    cart[id] = (cart[id] || 0) + (qty || 1);
    saveCart();
    renderCart();
    renderBadge(true);
  }

  cartItems.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var inc = t.getAttribute('data-inc'), dec = t.getAttribute('data-dec'), rm = t.getAttribute('data-rm');
    if (inc) { cart[inc]++; }
    else if (dec) { cart[dec]--; if (cart[dec] <= 0) delete cart[dec]; }
    else if (rm) { delete cart[rm]; }
    else return;
    saveCart();
    renderCart();
  });

  function openCart() {
    // Reset from a previous confirmation view
    cartDone.hidden = true;
    cartItems.style.display = '';
    cartFoot.style.display = '';
    renderCart();
    drawer.hidden = false;
    drawerOpen = true;
    lock();
    requestAnimationFrame(function () { if (drawerOpen) drawer.classList.add('is-open'); });
    cartClose.focus();
  }
  function closeCart() {
    drawerOpen = false;
    drawer.classList.remove('is-open');
    setTimeout(function () { drawer.hidden = true; }, 560);
    unlock();
  }
  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);

  cartOrder.addEventListener('click', function () {
    if (!cartCount()) return;
    cart = {};
    saveCart();
    renderBadge(false);
    cartItems.style.display = 'none';
    cartFoot.style.display = 'none';
    cartDoneNo.textContent = 'Order № MV-' + String(Math.floor(1000 + Math.random() * 9000));
    cartDone.hidden = false;
  });

  /* ---------------- Shared dismissal ---------------- */
  veil.addEventListener('click', function () {
    if (!modal.hidden) closeModal();
    if (!drawer.hidden) closeCart();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeModal();
    else if (!drawer.hidden) closeCart();
  });

  renderCart();
})();
