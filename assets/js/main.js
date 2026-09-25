/* =========================================================
   Selene ｜ 鄭雅美 個人網站 — 互動與動效
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 捲動淡入 ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    // 同一區塊內的元素依序延遲，形成節奏感
    var groups = {};
    reveals.forEach(function (el) {
      var key = el.closest('section') ? el.closest('section').id : 'x';
      groups[key] = (groups[key] || 0);
      el.style.setProperty('--d', (groups[key] * 0.13) + 's');
      groups[key] += 1;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2. 側欄目前位置 ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function markActive() {
    var y = window.scrollY + window.innerHeight * 0.34;
    var current = sections[0];
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s; });
    links.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id);
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { markActive(); ticking = false; });
    }
  }, { passive: true });
  markActive();

  /* ---------- 3. 作品分類切換（淡出淡入） ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var works = Array.prototype.slice.call(document.querySelectorAll('.work'));
  var emptyTip = document.getElementById('worksEmpty');

  function applyFilter(cat) {
    var shown = 0;

    works.forEach(function (w) {
      var hit = (cat === 'all' || w.getAttribute('data-cat') === cat);
      if (hit) shown++;
      w.classList.add('is-hiding');
    });

    window.setTimeout(function () {
      works.forEach(function (w) {
        var hit = (cat === 'all' || w.getAttribute('data-cat') === cat);
        w.hidden = !hit;
      });
      // 強制回流後再淡入，確保過場順暢
      void document.getElementById('worksGrid').offsetHeight;

      works.forEach(function (w, i) {
        if (!w.hidden) {
          window.setTimeout(function () { w.classList.remove('is-hiding'); }, reduce ? 0 : i * 90);
        }
      });

      if (emptyTip) emptyTip.hidden = shown !== 0;
    }, reduce ? 0 : 380);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (chip.classList.contains('is-on')) return;
      chips.forEach(function (c) {
        c.classList.remove('is-on');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('is-on');
      chip.setAttribute('aria-selected', 'true');
      applyFilter(chip.getAttribute('data-cat'));
    });
  });

  /* ---------- 4. 燈箱（放大 + 前後切換） ---------- */
  var box = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var btnClose = document.getElementById('lbClose');
  var btnPrev = document.getElementById('lbPrev');
  var btnNext = document.getElementById('lbNext');
  var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));

  var list = [];
  var idx = 0;
  var lastFocus = null;

  function collect() {
    list = works.filter(function (w) { return !w.hidden; }).map(function (w) {
      var a = w.querySelector('[data-lightbox]');
      var img = w.querySelector('img');
      var h3 = w.querySelector('h3');
      return {
        src: a.getAttribute('href'),
        alt: img ? img.getAttribute('alt') : '',
        cap: h3 ? h3.textContent : ''
      };
    });
  }

  function render() {
    var it = list[idx];
    if (!it) return;
    lbImg.src = it.src;
    lbImg.alt = it.alt;
    lbCap.textContent = it.cap + '　' + (idx + 1) + ' / ' + list.length;
  }

  function open(i) {
    collect();
    if (!list.length) return;
    lastFocus = document.activeElement;
    idx = i;
    render();
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(function () { box.classList.add('is-open'); });
    btnClose.focus();
  }

  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      box.hidden = true;
      lbImg.src = '';
    }, reduce ? 0 : 520);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(d) {
    if (!list.length) return;
    idx = (idx + d + list.length) % list.length;
    // 切換時先淡出再換圖，再淡入
    lbImg.style.transition = 'opacity .3s ease';
    lbImg.style.opacity = '0';
    window.setTimeout(function () {
      render();
      lbImg.style.opacity = '1';
    }, reduce ? 0 : 300);
  }

  triggers.forEach(function (a, i) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      // 依「目前可見的作品」定位索引
      var card = a.closest('.work');
      collect();
      var pos = list.findIndex(function (it) { return it.src === a.getAttribute('href'); });
      open(pos >= 0 ? pos : 0);
      void card;
      void i;
    });
  });

  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', function () { step(-1); });
  if (btnNext) btnNext.addEventListener('click', function () { step(1); });

  if (box) {
    box.addEventListener('click', function (ev) {
      if (ev.target === box) close();
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (!box || box.hidden) return;
    if (ev.key === 'Escape') close();
    else if (ev.key === 'ArrowLeft') step(-1);
    else if (ev.key === 'ArrowRight') step(1);
  });
})();
