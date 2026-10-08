/* =========================================================
   US CLINIC — интерактив. Vanilla JS, без зависимостей.
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
  if (STATIC) root.classList.add('is-static');
  if (params.has('full')) root.classList.add('is-full');

  /* фиксированная высота hero на мобильных (без прыжков при скрытии адресной строки) */
  root.style.setProperty('--hero-h', window.innerHeight + 'px');
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (STATIC) return;
    if (Math.abs(window.innerWidth - lastW) > 40) { root.style.setProperty('--hero-h', window.innerHeight + 'px'); lastW = window.innerWidth; }
  });

  /* ---------- split text ---------- */
  d.querySelectorAll('.split').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var o = d.createElement('span'); o.className = 'w';
      var s = d.createElement('span'); s.textContent = w; s.style.setProperty('--i', i);
      o.appendChild(s); el.appendChild(o);
      if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
    });
  });
  // задержка по строкам заголовка
  d.querySelectorAll('h1, h2').forEach(function (h) {
    h.querySelectorAll('.split').forEach(function (s, i) { s.style.setProperty('--sd', (i * 140) + 'ms'); });
  });

  /* ---------- stagger ---------- */
  d.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.querySelectorAll('[data-reveal]'), function (c, i) { c.style.setProperty('--d', (i % 8) * 90 + 'ms'); });
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

  /* ---------- preloader + hero intro ---------- */
  function heroIntro() {
    root.classList.add('is-loaded');
    var hero = d.querySelector('.hero');
    setTimeout(function () {
      hero.querySelectorAll('.split, [data-reveal]').forEach(function (el, i) {
        if (el.matches('[data-reveal]')) el.style.setProperty('--d', (500 + i * 110) + 'ms');
        el.classList.add('in');
      });
    }, reduce ? 0 : 450);
  }
  if (reduce) heroIntro();
  else {
    var started = Date.now();
    var go = function () { setTimeout(heroIntro, Math.max(0, 1300 - (Date.now() - started))); };
    if (d.readyState === 'complete') go(); else window.addEventListener('load', go);
    setTimeout(function () { if (!root.classList.contains('is-loaded')) heroIntro(); }, 4000); // страховка
  }

  /* ---------- header / progress / mobile bar / parallax ---------- */
  var hdr = d.getElementById('hdr'), bar = d.querySelector('.progress span'), mbar = d.getElementById('mbar');
  var plx = Array.prototype.slice.call(d.querySelectorAll('[data-parallax]'));
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
    hdr.classList.toggle('is-scrolled', y > 40);
    if (!d.body.classList.contains('is-locked')) hdr.classList.toggle('is-hidden', y > 600 && y > lastY + 4);
    if (y < lastY - 4) hdr.classList.remove('is-hidden');
    lastY = y;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (mbar) mbar.classList.toggle('is-on', y > window.innerHeight * 0.7);
    if (!reduce) {
      var vh = window.innerHeight;
      plx.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var off = (r.top + r.height / 2 - vh / 2) * k;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

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
    var start = window.scrollY, dist = top - start, dur = Math.min(1600, 600 + Math.abs(dist) * 0.25), t0 = null;
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
    mnav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); mnav.setAttribute('aria-hidden', 'true'); body.classList.remove('is-locked');
  }
  burger.addEventListener('click', function () {
    var open = !mnav.classList.contains('is-open');
    mnav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', String(open)); mnav.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('is-locked', open); hdr.classList.remove('is-hidden');
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

  /* ---------- курсор ---------- */
  var cursor = d.querySelector('.cursor');
  if (finePointer && !reduce && cursor) {
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

  /* ---------- магнитные кнопки + подсветка ---------- */
  if (finePointer && !reduce) {
    d.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        b.style.setProperty('--mx', x + 'px'); b.style.setProperty('--my', y + 'px');
        b.style.transform = 'translate(' + ((x - r.width / 2) * .22).toFixed(1) + 'px,' + ((y - r.height / 2) * .3).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
    /* лёгкий 3D-наклон и золотая обводка карточек */
    d.querySelectorAll('.tilt').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    });
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
    el.addEventListener('pointerdown', function (e) {
      dragging = true; el.classList.add('is-drag'); self.set(fromEvent(e));
      startX = e.clientX; startY = e.clientY; locked = e.pointerType === 'mouse';
      if (locked) el.setPointerCapture(e.pointerId);
    });
    var startX = 0, startY = 0, locked = false;
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
      if (e.key === 'ArrowLeft') { self.set(target - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { self.set(target + 5); e.preventDefault(); }
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
          if (img.complete && img.naturalWidth) { /* из кэша */ }
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
    var main = new Compare(d.getElementById('cmpMain'));
    var lbCmp = new Compare(d.getElementById('cmpLb'));
    var thumbs = d.getElementById('baThumbs'), catEl = d.getElementById('baCat'), idxEl = d.getElementById('baIdx'), totEl = d.getElementById('baTotal');
    var list = [], idx = 0, catName = '';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function show(i, quiet) {
      idx = (i + list.length) % list.length;
      main.load(list[idx]); idxEl.textContent = pad(idx + 1);
      Array.prototype.forEach.call(thumbs.children, function (t, k) { t.classList.toggle('is-active', k === idx); });
      if (!quiet) { main.jump(50); }
    }
    function setCat(btn) {
      var cat = btn.getAttribute('data-cat'); catName = btn.textContent;
      tabs.querySelectorAll('button').forEach(function (b) { var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
      list = G.filter(function (g) { return g.cat === cat; });
      catEl.textContent = catName; totEl.textContent = pad(list.length);
      thumbs.innerHTML = '';
      list.forEach(function (g, k) {
        var t = d.createElement('button'); t.setAttribute('aria-label', catName + ', работа ' + (k + 1));
        t.innerHTML = '<picture><source srcset="assets/ba/' + g.id + '-after-t.webp" type="image/webp"><img src="assets/ba/' + g.id + '-after-t.jpg" alt="" loading="lazy"></picture>';
        t.addEventListener('click', function () { show(k); });
        thumbs.appendChild(t);
      });
      d.getElementById('baPrev').parentElement.style.visibility = list.length > 1 ? '' : 'hidden';
      show(0);
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { setCat(b); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); } });
    d.getElementById('baPrev').addEventListener('click', function () { show(idx - 1); });
    d.getElementById('baNext').addEventListener('click', function () { show(idx + 1); });
    setCat(tabs.querySelector('.is-active') || tabs.querySelector('button'));
    // подсказка-движение, когда слайдер появляется в зоне видимости
    if ('IntersectionObserver' in window) {
      var hIO = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { setTimeout(main.hint, 700); hIO.disconnect(); } }, { threshold: .6 });
      hIO.observe(main.el);
    }
    // свайп по слайдеру не листает; свайп по миниатюрам — да
    /* лайтбокс */
    var lb = d.getElementById('lb'), lbCap = d.getElementById('lbCap');
    function lbShow() { lbCmp.load(list[idx]); lbCmp.jump(50); lbCap.textContent = catName + ' · ' + pad(idx + 1) + ' / ' + pad(list.length); }
    function lbOpen() { lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); body.classList.add('is-locked'); lbShow(); setTimeout(function () { lbCmp.el.focus(); lbCmp.hint(); }, 500); }
    function lbClose() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); body.classList.remove('is-locked'); show(idx, true); }
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
  if (pt) pt.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var k = b.getAttribute('data-p');
    pt.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
    d.querySelectorAll('.plist').forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-p') === k); });
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  });

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
      var ok = true;
      var nameOk = form.elements.name.value.trim().length > 1;
      var phoneOk = phone.value.replace(/\D/g, '').length === 11;
      var consentOk = form.elements.consent.checked;
      form.elements.name.closest('.field').classList.toggle('is-error', !nameOk);
      phone.closest('.field').classList.toggle('is-error', !phoneOk);
      form.querySelector('.check').classList.toggle('is-error', !consentOk);
      ok = nameOk && phoneOk && consentOk;
      if (!ok) { msg.textContent = 'Пожалуйста, заполните имя, телефон и подтвердите согласие.'; return; }
      var data = { name: form.elements.name.value.trim(), phone: phone.value, service: form.elements.service.value, consent: true, page: location.href };
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      if (!FORM_ENDPOINT) {
        // TODO: демо-режим — удалите после подключения FORM_ENDPOINT
        console.info('[US CLINIC] Заявка (FORM_ENDPOINT не задан):', data);
        msg.textContent = 'Спасибо! Заявка принята. Мы свяжемся с вами для подтверждения записи.';
        form.reset(); btn.disabled = false; return;
      }
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); msg.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами для подтверждения записи.'; form.reset(); })
        .catch(function () { msg.textContent = 'Не удалось отправить заявку. Позвоните нам: +7 (926) 999-99-55.'; })
        .then(function () { btn.disabled = false; });
    });
  }
})();
