/* =========================================================
   US CLINIC — интерактив v4. Vanilla JS (+ Lenis для плавного скролла на десктопе).
   Всё работает и без анимаций: ?static, prefers-reduced-motion, сбой JS.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- НАСТРОЙКА ФОРМЫ ----------
     TODO: укажите адрес обработчика заявок (ваш backend, CRM-вебхук,
     Formspree/Getform, Telegram-бот и т.п.). Форма отправит POST JSON:
     { name, phone, service, consent, page }.
     Пока FORM_ENDPOINT пустой — заявка не уходит, показывается демо-сообщение. */
  var FORM_ENDPOINT = ''; // TODO: например 'https://your-domain.ru/api/lead'

  var d = document, root = d.documentElement, body = d.body;
  var params = new URLSearchParams(location.search);
  var STATIC = params.has('static');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conn = navigator.connection || {};
  var lowPower = !!conn.saveData || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4);
  var deskFX = finePointer && !reduce;
  if (STATIC) root.classList.add('is-static');
  if (params.has('full')) root.classList.add('is-full');
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* фиксированная высота hero на мобильных (без прыжков при скрытии адресной строки) */
  root.style.setProperty('--hero-h', window.innerHeight + 'px');
  var lastW = window.innerWidth;

  /* ---------- split text ---------- */
  d.querySelectorAll('.split').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = ''; el.classList.add('is-split');
    words.forEach(function (w, i) {
      var o = d.createElement('span'); o.className = 'w';
      var s = d.createElement('span'); s.textContent = w; s.style.setProperty('--i', i);
      o.appendChild(s); el.appendChild(o);
      if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
    });
  });
  d.querySelectorAll('h1, h2').forEach(function (h) {
    h.querySelectorAll('.split').forEach(function (s, i) { s.style.setProperty('--sd', (i * 140) + 'ms'); });
  });

  /* ---------- текст, который «проявляется» по мере скролла ---------- */
  var scrubs = [];
  if (!reduce) d.querySelectorAll('[data-scrub]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = d.createElement('span'); s.className = 'sw'; s.textContent = w; el.appendChild(s);
      if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
    });
    el.classList.add('is-scrub');
    scrubs.push({ el: el, w: el.querySelectorAll('.sw'), lit: -1 });
  });

  /* ---------- «перекат» текста в меню и на кнопках ---------- */
  if (finePointer) {
    d.querySelectorAll('.nav a').forEach(function (a) {
      var t = a.textContent.trim(); a.textContent = '';
      var r = d.createElement('span'); r.className = 'roll'; r.setAttribute('data-t', t);
      var s = d.createElement('span'); s.textContent = t; r.appendChild(s); a.appendChild(r);
    });
    d.querySelectorAll('.btn > span').forEach(function (sp) {
      var t = sp.textContent.trim(); sp.textContent = '';
      sp.classList.add('roll'); sp.setAttribute('data-t', t);
      var s = d.createElement('span'); s.textContent = t; sp.appendChild(s);
    });
  }

  /* ---------- stagger ---------- */
  d.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.querySelectorAll('[data-reveal]'), function (c, i) { c.style.setProperty('--d', (i % 8) * 90 + 'ms'); });
  });
  d.querySelectorAll('.plist').forEach(function (l) {
    Array.prototype.forEach.call(l.querySelectorAll('.prow'), function (r, i) { r.style.setProperty('--r', i); });
  });

  /* ---------- длина линий для draw ---------- */
  d.querySelectorAll('.draw path, .draw rect').forEach(function (p) {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2)); } catch (e) {}
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = d.querySelectorAll('[data-reveal], .split, .draw');
  function revealAll() { revealEls.forEach(function (el) { el.classList.add('in'); }); }
  if (reduce || !('IntersectionObserver' in window)) { revealAll(); }
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { if (!el.closest('.hero')) io.observe(el); });
  }

  /* ---------- плавный инерционный скролл (только десктоп с мышью) ---------- */
  var lenis = null;
  if (deskFX && typeof window.Lenis === 'function') {
    try {
      lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
      var lraf = function (t) { lenis.raf(t); requestAnimationFrame(lraf); };
      requestAnimationFrame(lraf);
    } catch (e) { lenis = null; }
  }
  function lockScroll(on) {
    body.classList.toggle('is-locked', on);
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
  }

  /* ---------- прелоадер + интро hero ---------- */
  var introDone = false;
  function heroIntro() {
    if (introDone) return; introDone = true;
    root.classList.add('is-loaded');
    var hero = d.querySelector('.hero');
    setTimeout(function () {
      hero.querySelectorAll('.split, [data-reveal]').forEach(function (el, i) {
        if (el.matches('[data-reveal]')) el.style.setProperty('--d', (500 + i * 110) + 'ms');
        el.classList.add('in');
      });
    }, reduce ? 0 : 450);
  }
  var pageLoaded = d.readyState === 'complete';
  window.addEventListener('load', function () { pageLoaded = true; });
  if (reduce) heroIntro();
  else {
    var seen = root.classList.contains('pl-fast');
    try { sessionStorage.setItem('usc-seen', '1'); } catch (e) {}
    var pre = d.querySelector('.preloader');
    var plNum = pre && pre.querySelector('.preloader__count b'), plLine = pre && pre.querySelector('.preloader__line');
    var MIN = seen ? 750 : 2000, t0 = performance.now(), shown = 0;
    var tick = function (now) {
      if (introDone) return;
      var el = now - t0, target = Math.min(1, el / MIN) * (pageLoaded ? 1 : 0.9);
      if (el > 4200) target = 1;
      shown += (target - shown) * 0.14; if (target - shown < 0.004) shown = target;
      if (plNum) plNum.textContent = Math.round(shown * 100);
      if (plLine) plLine.style.setProperty('--pl', shown.toFixed(3));
      if (shown >= 1) setTimeout(heroIntro, 160); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(heroIntro, 5000); // страховка
  }

  /* ---------- горизонтальная галерея услуг (десктоп) ---------- */
  var svcSec = d.getElementById('services');
  var HS = { on: false, dist: 0, top: 0, n: 12, idx: -1 };
  var svcPin, svcWrap, svcGrid, svcCount, svcTrack, svcBar;
  if (svcSec) {
    svcPin = svcSec.querySelector('.services__pin'); svcWrap = svcPin.querySelector('.wrap');
    svcGrid = svcSec.querySelector('.svc-grid'); svcBar = svcSec.querySelector('.services__bar');
    svcCount = svcSec.querySelector('.services__count b'); svcTrack = svcSec.querySelector('.services__track');
    HS.n = svcGrid.children.length;
  }
  function hsLayout() {
    if (!svcSec) return;
    var want = deskFX && window.innerWidth >= 1100 && window.innerHeight >= 620;
    if (want !== HS.on) {
      HS.on = want; svcSec.classList.toggle('is-hscroll', want);
      if (!want) { svcSec.style.height = ''; svcGrid.style.transform = ''; svcSec.style.removeProperty('--cw'); return; }
    }
    if (!want) return;
    var vh = window.innerHeight;
    svcGrid.style.transform = 'none';
    var cw = 330; svcSec.style.setProperty('--cw', cw + 'px');
    for (var k = 0; k < 2; k++) {
      var total = svcWrap.offsetHeight + svcBar.offsetHeight + 84 + 28 + 40;
      cw = clamp(cw - (total - vh) / 1.08, 240, 380);
      svcSec.style.setProperty('--cw', Math.round(cw) + 'px');
    }
    var padL = parseFloat(getComputedStyle(svcWrap).paddingLeft) || 40;
    var gl = svcGrid.getBoundingClientRect().left;
    HS.dist = Math.max(0, gl + svcGrid.offsetWidth - (window.innerWidth - padL));
    svcSec.style.height = (vh + HS.dist) + 'px';
    HS.top = svcSec.getBoundingClientRect().top + window.scrollY;
    HS.idx = -1;
  }
  function hsUpdate(y) {
    if (!HS.on) return;
    var p = HS.dist ? clamp((y - HS.top) / HS.dist, 0, 1) : 0;
    svcGrid.style.transform = 'translate3d(' + (-p * HS.dist).toFixed(1) + 'px,0,0)';
    svcTrack.style.setProperty('--sp', p.toFixed(4));
    var idx = Math.min(HS.n, 1 + Math.round(p * (HS.n - 1)));
    if (idx !== HS.idx) { HS.idx = idx; svcCount.textContent = pad2(idx); }
  }

  /* ---------- шапка / прогресс / параллакс / сцены по скроллу ---------- */
  var hdr = d.getElementById('hdr'), bar = d.querySelector('.progress span'), mbar = d.getElementById('mbar');
  var totop = d.querySelector('.totop'), totopBar = totop && totop.querySelector('.totop__bar');
  var heroEl = d.querySelector('.hero'), heroContent = d.querySelector('.hero__content'), heroDim = d.querySelector('.hero__dim'), heroPic = d.querySelector('.hero__frame picture');
  var ftr = d.querySelector('.ftr'), ftrMark = d.querySelector('.ftr__mark span');
  var plx = Array.prototype.slice.call(d.querySelectorAll('[data-parallax]'));
  var lastY = window.scrollY, ticking = false, heroOutDone = false;
  var mq = { dir: -1, boost: 0 };
  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight, h = root.scrollHeight - vh, p = h > 0 ? y / h : 0;
    var dy = y - lastY;
    hdr.classList.toggle('is-scrolled', y > 40);
    if (!body.classList.contains('is-locked')) hdr.classList.toggle('is-hidden', y > 600 && dy > 4);
    if (dy < -4) hdr.classList.remove('is-hidden');
    if (dy !== 0) { mq.dir = dy > 0 ? -1 : 1; mq.boost = Math.min(700, mq.boost + Math.abs(dy) * 5); }
    lastY = y;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (mbar) mbar.classList.toggle('is-on', y > vh * 0.7);
    if (totop) {
      totop.classList.toggle('is-on', y > vh * 0.8);
      if (totopBar) totopBar.style.strokeDashoffset = (150.8 * (1 - p)).toFixed(1);
    }
    if (!reduce) {
      plx.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var off = (r.top + r.height / 2 - vh / 2) * k;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      /* hero уходит в глубину: текст поднимается и гаснет, кадр приближается и темнеет */
      if (heroEl && window.innerWidth > 760) {
        var hh = heroEl.offsetHeight, q = clamp(y / hh, 0, 1);
        if (q < 1 || !heroOutDone) {
          heroContent.style.transform = 'translate3d(0,' + (-y * 0.22).toFixed(1) + 'px,0)';
          heroContent.style.opacity = (1 - clamp(q * 1.25, 0, 1)).toFixed(3);
          heroDim.style.opacity = (q * 0.75).toFixed(3);
          if (heroPic) heroPic.style.transform = 'scale(' + (1 + q * 0.08).toFixed(4) + ')';
          heroOutDone = q >= 1;
        }
      }
      hsUpdate(y);
      scrubs.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (r.top > vh || r.bottom < 0) { if (r.bottom < 0 && s.lit !== s.w.length) { s.lit = s.w.length; s.w.forEach(function (w) { w.classList.add('on'); }); } return; }
        var n = Math.round(clamp((vh * 0.9 - r.top) / (r.height + vh * 0.35), 0, 1) * s.w.length);
        if (n !== s.lit) { s.lit = n; Array.prototype.forEach.call(s.w, function (w, i) { w.classList.toggle('on', i < n); }); }
      });
      if (ftr && ftrMark) {
        var fr = ftr.getBoundingClientRect();
        if (fr.top < vh) ftrMark.style.setProperty('--fy', ((1 - clamp((vh - fr.top) / fr.height, 0, 1)) * 55).toFixed(1) + '%');
      }
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- активный пункт меню ---------- */
  var navLinks = d.querySelectorAll('.nav a');
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['services', 'results', 'prices', 'doctor', 'booking'].forEach(function (id) { var s = d.getElementById(id); if (s) secIO.observe(s); });
  }

  /* ---------- плавный скролл к якорям ---------- */
  function smoothTo(target) {
    var top = target === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 760 ? 64 : 76);
    if (reduce) { window.scrollTo(0, top); return; }
    var start = window.scrollY, dist = top - start, dur = Math.min(1700, 700 + Math.abs(dist) * 0.22);
    if (lenis) { lenis.scrollTo(top, { duration: dur / 1000, easing: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } }); return; }
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo(0, start + dist * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (a.hasAttribute('data-todo') || id === '#') { e.preventDefault(); return; }
    var t = id === '#top' ? 'top' : d.querySelector(id);
    if (!t) return;
    e.preventDefault(); closeMenu(); smoothTo(t);
    if (history.replaceState) history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
  });

  /* ---------- мобильное меню ---------- */
  var burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  function closeMenu() {
    if (!mnav.classList.contains('is-open')) return;
    mnav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); mnav.setAttribute('aria-hidden', 'true'); lockScroll(false);
  }
  burger.addEventListener('click', function () {
    var open = !mnav.classList.contains('is-open');
    mnav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', String(open)); mnav.setAttribute('aria-hidden', String(!open));
    lockScroll(open); hdr.classList.remove('is-hidden');
  });

  /* ---------- счётчики ---------- */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  var counters = d.querySelectorAll('[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    var cIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = +el.getAttribute('data-count'), nofmt = el.hasAttribute('data-nofmt');
        var from = nofmt ? to - 33 : 0, t0 = null; cIO.unobserve(el);
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 2200), v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4)));
          el.textContent = nofmt ? v : fmt(v);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: .6 });
    counters.forEach(function (c) { cIO.observe(c); });
  }

  /* ---------- золотая пыль в hero (canvas, лёгкая) ---------- */
  var dust = null;
  (function initDust() {
    var cv = d.querySelector('.hero__dust');
    if (!cv || reduce || !cv.getContext) return;
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var mobile = !finePointer || window.innerWidth < 760;
    var N = mobile ? (lowPower ? 14 : 24) : (lowPower ? 38 : 64);
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, P = [], running = false, visible = true, last = 0, mx = -1e4, my = -1e4;
    var sprite = d.createElement('canvas'); sprite.width = sprite.height = 64;
    var sg = sprite.getContext('2d'), g = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,246,220,1)'); g.addColorStop(.22, 'rgba(236,217,173,.55)'); g.addColorStop(1, 'rgba(201,169,110,0)');
    sg.fillStyle = g; sg.fillRect(0, 0, 64, 64);
    function size() {
      var r = cv.getBoundingClientRect();
      if (Math.abs(r.width - W) < 2 && Math.abs(r.height - H) < 2) return;
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, init) {
      p.x = mobile ? Math.random() * W : W * (.3 + .7 * Math.random());
      p.y = init ? Math.random() * H : H + 12;
      p.r = .5 + Math.pow(Math.random(), 3) * 2.4; p.vy = -(.06 + Math.random() * .28); p.vx = (Math.random() - .5) * .1;
      p.ph = Math.random() * 6.283; p.tw = .5 + Math.random() * 1.5; p.a = .25 + Math.random() * .6;
      return p;
    }
    size(); for (var i = 0; i < N; i++) P.push(spawn({}, true));
    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min(3, (t - last) / 16.67) : 1; last = t;
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.ph += .02 * dt * p.tw; p.x += (p.vx + Math.sin(p.ph) * .14) * dt; p.y += p.vy * dt;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { var f = (1 - d2 / 16000) * 1.1 * dt, dd = Math.sqrt(d2) + .01; p.x += dx / dd * f; p.y += dy / dd * f; }
        if (p.y < -14 || p.x < -14 || p.x > W + 14) spawn(p, false);
        var s = p.r * 6;
        ctx.globalAlpha = p.a * (.55 + .45 * Math.sin(p.ph * 1.7));
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      requestAnimationFrame(frame);
    }
    function setRun() {
      var v = visible && !d.hidden;
      if (v && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!v) running = false;
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRun(); }).observe(cv);
    d.addEventListener('visibilitychange', setRun);
    setRun();
    dust = {
      size: size,
      mouse: function (x, y) { var r = cv.getBoundingClientRect(); mx = x - r.left; my = y - r.top; },
      leave: function () { mx = my = -1e4; }
    };
  })();

  /* ---------- свет, следующий за курсором (hero и портрет) ---------- */
  function followLight(sec, onMove) {
    if (!sec || !deskFX) return;
    var raf = null, ex = 0, ey = 0;
    sec.addEventListener('mouseenter', function () { sec.classList.add('is-lit'); });
    sec.addEventListener('mouseleave', function () { sec.classList.remove('is-lit'); if (onMove) onMove(null); });
    sec.addEventListener('mousemove', function (e) {
      ex = e.clientX; ey = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        sec.querySelectorAll('.hero__light, .doctor__light').forEach(function (l) {
          var r = l.getBoundingClientRect();
          l.style.setProperty('--lx', (ex - r.left).toFixed(0) + 'px'); l.style.setProperty('--ly', (ey - r.top).toFixed(0) + 'px');
        });
        if (onMove) onMove(ex, ey);
      });
    }, { passive: true });
  }
  followLight(heroEl, function (x, y) { if (!dust) return; if (x == null) dust.leave(); else dust.mouse(x, y); });
  followLight(d.getElementById('doctor'));

  /* ---------- бегущая строка, реагирующая на скорость скролла ---------- */
  var mqTrack = d.querySelector('.marquee__track'), mqMeasure = function () {};
  if (mqTrack && !reduce) {
    mqTrack.classList.add('is-js');
    var mqX = 0, mqHalf = 0, mqOn = false, mqLast = 0;
    mqMeasure = function () { mqHalf = mqTrack.scrollWidth / 2; };
    mqMeasure();
    var mqFrame = function (t) {
      if (!mqOn) return;
      var dt = mqLast ? Math.min(.064, (t - mqLast) / 1000) : .016; mqLast = t;
      mqX += mq.dir * (48 + mq.boost) * dt;
      if (mqHalf > 0) { while (mqX <= -mqHalf) mqX += mqHalf; while (mqX > 0) mqX -= mqHalf; }
      mq.boost += (0 - mq.boost) * Math.min(1, dt * 2.6);
      var sk = (mq.dir < 0 ? 1 : -1) * Math.min(mq.boost / 140, 4);
      mqTrack.style.transform = 'translate3d(' + mqX.toFixed(1) + 'px,0,0) skewX(' + sk.toFixed(2) + 'deg)';
      requestAnimationFrame(mqFrame);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting && !d.hidden;
      if (v && !mqOn) { mqOn = true; mqLast = 0; requestAnimationFrame(mqFrame); } else if (!v) mqOn = false;
    }).observe(mqTrack.parentElement);
  }

  /* ---------- курсор ---------- */
  var cursor = d.querySelector('.cursor');
  if (deskFX && cursor) {
    root.classList.add('has-cursor');
    var dot = cursor.querySelector('.cursor__dot'), ring = cursor.querySelector('.cursor__ring'), label = ring.querySelector('em');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; cursor.classList.remove('is-hidden'); }, { passive: true });
    d.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    (function loop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)'; requestAnimationFrame(loop); })();
    d.addEventListener('mouseover', function (e) {
      var drag = e.target.closest('.cmp');
      cursor.classList.toggle('is-drag', !!drag); label.textContent = drag ? 'Тяните' : '';
      cursor.classList.toggle('is-link', !drag && !!e.target.closest('a, button, label, select, input'));
    });
  }

  /* ---------- магнитные кнопки + наклон карточек ---------- */
  if (deskFX) {
    d.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        b.style.setProperty('--mx', x + 'px'); b.style.setProperty('--my', y + 'px');
        b.style.transform = 'translate(' + ((x - r.width / 2) * .22).toFixed(1) + 'px,' + ((y - r.height / 2) * .3).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
    d.querySelectorAll('.tilt').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    });
  }

  /* ---------- скользящий индикатор вкладок ---------- */
  var indicators = [];
  function makeIndicator(tabsEl) {
    if (!tabsEl) return function () {};
    var ind = d.createElement('span'); ind.className = 'tabs__ind'; ind.setAttribute('aria-hidden', 'true');
    tabsEl.insertBefore(ind, tabsEl.firstChild); tabsEl.classList.add('has-ind');
    var move = function (anim) {
      var b = tabsEl.querySelector('button.is-active'); if (!b) return;
      ind.classList.toggle('is-anim', !!anim && !reduce);
      ind.style.width = b.offsetWidth + 'px'; ind.style.height = b.offsetHeight + 'px';
      ind.style.transform = 'translate(' + b.offsetLeft + 'px,' + b.offsetTop + 'px)';
    };
    indicators.push(move);
    return move;
  }

  /* ---------- слайдер до/после ---------- */
  function Compare(el) {
    var self = this, target = 50, cur = 50, raf = null, dragging = false;
    this.el = el;
    function render() {
      cur += (target - cur) * (reduce ? 1 : .2);
      if (Math.abs(target - cur) < .05) cur = target;
      el.style.setProperty('--pos', cur.toFixed(2) + '%');
      el.setAttribute('aria-valuenow', Math.round(cur));
      raf = cur !== target ? requestAnimationFrame(render) : null;
    }
    this.set = function (v) { target = Math.max(0, Math.min(100, v)); if (!raf) raf = requestAnimationFrame(render); };
    this.jump = function (v) { target = cur = v; el.style.setProperty('--pos', v + '%'); };
    function fromEvent(e) { var r = el.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    var startX = 0, startY = 0, locked = false;
    el.addEventListener('pointerdown', function (e) {
      dragging = true; el.classList.add('is-drag', 'is-touched'); self.set(fromEvent(e));
      startX = e.clientX; startY = e.clientY; locked = e.pointerType === 'mouse';
      if (locked) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (!locked) {
        var dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
        if (dx > 6 && dx > dy) { locked = true; try { el.setPointerCapture(e.pointerId); } catch (er) {} }
        else if (dy > 8) { dragging = false; el.classList.remove('is-drag'); return; }
      }
      self.set(fromEvent(e));
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { el.addEventListener(t, function () { dragging = false; el.classList.remove('is-drag'); }); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { self.set(target - 5); e.preventDefault(); el.classList.add('is-touched'); }
      if (e.key === 'ArrowRight') { self.set(target + 5); e.preventDefault(); el.classList.add('is-touched'); }
    });
    this.load = function (item) {
      var b = 'assets/ba/' + item.id;
      var pics = [[el.querySelector('.cmp__before'), b + '-before'], [el.querySelector('.cmp__after'), b + '-after']];
      el.classList.add('is-swapping');
      setTimeout(function () {
        var pending = 2;
        pics.forEach(function (p) {
          p[0].querySelector('source').srcset = p[1] + '.webp';
          var img = p[0].querySelector('img');
          var done = function () { if (--pending === 0) el.classList.remove('is-swapping'); };
          img.onload = done; img.onerror = done; img.src = p[1] + '.jpg';
        });
        setTimeout(function () { el.classList.remove('is-swapping'); }, 1200);
      }, reduce ? 0 : 220);
    };
    this.hint = function () {
      if (reduce) return;
      var seq = [[0, 32], [520, 68], [1100, 50]];
      seq.forEach(function (s) { setTimeout(function () { if (!dragging) self.set(s[1]); }, s[0]); });
    };
  }

  var G = window.GALLERY || [];
  var tabs = d.getElementById('baTabs');
  if (tabs && G.length) {
    var baInd = makeIndicator(tabs);
    var main = new Compare(d.getElementById('cmpMain'));
    var lbCmp = new Compare(d.getElementById('cmpLb'));
    var thumbs = d.getElementById('baThumbs'), catEl = d.getElementById('baCat'), idxEl = d.getElementById('baIdx'), totEl = d.getElementById('baTotal');
    var list = [], idx = 0, catName = '';
    var show = function (i, quiet) {
      idx = (i + list.length) % list.length;
      main.load(list[idx]); idxEl.textContent = pad2(idx + 1);
      Array.prototype.forEach.call(thumbs.children, function (t, k) { t.classList.toggle('is-active', k === idx); });
      if (!quiet) { main.jump(50); }
    };
    var setCat = function (btn, anim) {
      var cat = btn.getAttribute('data-cat'); catName = btn.textContent;
      tabs.querySelectorAll('button').forEach(function (b) { var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
      baInd(anim);
      list = G.filter(function (g) { return g.cat === cat; });
      catEl.textContent = catName; totEl.textContent = pad2(list.length);
      thumbs.innerHTML = '';
      list.forEach(function (g, k) {
        var t = d.createElement('button'); t.setAttribute('aria-label', catName + ', работа ' + (k + 1));
        t.innerHTML = '<picture><source srcset="assets/ba/' + g.id + '-after-t.webp" type="image/webp"><img src="assets/ba/' + g.id + '-after-t.jpg" alt="" loading="lazy"></picture>';
        t.addEventListener('click', function () { show(k); });
        thumbs.appendChild(t);
      });
      d.getElementById('baPrev').parentElement.style.visibility = list.length > 1 ? '' : 'hidden';
      show(0);
    };
    tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { setCat(b, true); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); } });
    d.getElementById('baPrev').addEventListener('click', function () { show(idx - 1); });
    d.getElementById('baNext').addEventListener('click', function () { show(idx + 1); });
    setCat(tabs.querySelector('.is-active') || tabs.querySelector('button'), false);
    if ('IntersectionObserver' in window) {
      var hIO = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { setTimeout(main.hint, 1300); hIO.disconnect(); } }, { threshold: .6 });
      hIO.observe(main.el);
    }
    /* лайтбокс */
    var lb = d.getElementById('lb'), lbCap = d.getElementById('lbCap');
    lb.setAttribute('data-lenis-prevent', '');
    var lbShow = function () { lbCmp.load(list[idx]); lbCmp.jump(50); lbCap.textContent = catName + ' · ' + pad2(idx + 1) + ' / ' + pad2(list.length); };
    var lbOpen = function () { lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); lockScroll(true); lbShow(); setTimeout(function () { lbCmp.el.focus(); lbCmp.hint(); }, 500); };
    var lbClose = function () { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lockScroll(false); show(idx, true); };
    d.getElementById('baZoom').addEventListener('click', lbOpen);
    d.getElementById('lbClose').addEventListener('click', lbClose);
    d.getElementById('lbPrev').addEventListener('click', function () { idx = (idx - 1 + list.length) % list.length; lbShow(); });
    d.getElementById('lbNext').addEventListener('click', function () { idx = (idx + 1) % list.length; lbShow(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) { if (e.key === 'Escape') closeMenu(); return; }
      if (e.key === 'Escape') lbClose();
      if (e.key === 'PageUp') d.getElementById('lbPrev').click();
      if (e.key === 'PageDown') d.getElementById('lbNext').click();
    });
  }

  /* ---------- вкладки прайса ---------- */
  var pt = d.getElementById('priceTabs');
  if (pt) {
    var ptInd = makeIndicator(pt);
    pt.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = b.getAttribute('data-p');
      pt.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
      ptInd(true);
      d.querySelectorAll('.plist').forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-p') === k); });
      b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- золотые искры ---------- */
  function burst(el) {
    if (reduce || !el) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 22; i++) (function () {
      var s = d.createElement('span'); s.className = 'burst';
      s.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; body.appendChild(s);
      var a = Math.random() * 6.283, dist = 50 + Math.random() * 130;
      var x = cx + Math.cos(a) * dist * 1.3, y = cy + Math.sin(a) * dist * .7 - 20;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        s.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px) scale(' + (.4 + Math.random()).toFixed(2) + ')'; s.style.opacity = '0';
      }); });
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1300);
    })();
  }

  /* ---------- форма ---------- */
  var form = d.getElementById('bookingForm');
  if (form) {
    var phone = form.elements.phone, msg = form.querySelector('.form__msg');
    phone.addEventListener('input', function () {
      var v = phone.value.replace(/\D/g, '');
      if (!v) { phone.value = ''; return; }
      if (v[0] === '8') v = '7' + v.slice(1);
      if (v[0] !== '7') v = '7' + v;
      v = v.slice(0, 11);
      var o = '+7';
      if (v.length > 1) o += ' (' + v.slice(1, 4);
      if (v.length >= 4) o += ') ' + v.slice(4, 7);
      if (v.length >= 7) o += '-' + v.slice(7, 9);
      if (v.length >= 9) o += '-' + v.slice(9, 11);
      phone.value = o;
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameOk = form.elements.name.value.trim().length > 1;
      var phoneOk = phone.value.replace(/\D/g, '').length === 11;
      var consentOk = form.elements.consent.checked;
      form.elements.name.closest('.field').classList.toggle('is-error', !nameOk);
      phone.closest('.field').classList.toggle('is-error', !phoneOk);
      form.querySelector('.check').classList.toggle('is-error', !consentOk);
      if (!(nameOk && phoneOk && consentOk)) { msg.textContent = 'Пожалуйста, заполните имя, телефон и подтвердите согласие.'; return; }
      var data = { name: form.elements.name.value.trim(), phone: phone.value, service: form.elements.service.value, consent: true, page: location.href };
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      if (!FORM_ENDPOINT) {
        // TODO: демо-режим — удалите после подключения FORM_ENDPOINT
        console.info('[US CLINIC] Заявка (FORM_ENDPOINT не задан):', data);
        msg.textContent = 'Спасибо! Заявка принята. Мы свяжемся с вами для подтверждения записи.';
        burst(btn); form.reset(); btn.disabled = false; return;
      }
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); msg.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами для подтверждения записи.'; burst(btn); form.reset(); })
        .catch(function () { msg.textContent = 'Не удалось отправить заявку. Позвоните нам: +7 (926) 999-99-55.'; })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- пересчёт раскладки ---------- */
  function relayout() {
    hsLayout(); mqMeasure();
    indicators.forEach(function (m) { m(false); });
    if (dust) dust.size();
    onScroll();
  }
  var rT = null;
  window.addEventListener('resize', function () {
    if (!STATIC && Math.abs(window.innerWidth - lastW) > 40) { root.style.setProperty('--hero-h', window.innerHeight + 'px'); lastW = window.innerWidth; }
    clearTimeout(rT); rT = setTimeout(relayout, 160);
  });
  window.addEventListener('load', relayout);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(relayout);
  relayout();
  window.__uscMain = 1; // скрипт отработал без ошибок — аварийный режим не нужен
})();
