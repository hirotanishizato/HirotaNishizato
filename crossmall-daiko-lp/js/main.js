/* =========================================================
   CROSS NAVI — interactions
   - モバイルメニュー / ヘッダー影 / FAQアコーディオン
   - スクロール出現アニメーション / フォーム(デモ) / プラン自動選択
   ========================================================= */
(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  var header = document.getElementById('header');
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      header.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    // close menu when a link is tapped
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        header.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Header shadow on scroll ---- */
  function onScroll() {
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // optional: close others for a cleaner accordion feel
      document.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Contact form (demo) ---- */
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  if (form) {
    // pre-select plan from URL ?plan=small|middle|max
    var params = new URLSearchParams(window.location.search);
    var plan = params.get('plan');
    var planSelect = document.getElementById('plan');
    if (plan && planSelect) {
      var map = { small: 'small', middle: 'middle', max: 'max' };
      if (map[plan]) planSelect.value = map[plan];
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // simple required validation
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        var valid = field.type === 'checkbox' ? field.checked : String(field.value).trim() !== '';
        field.style.borderColor = valid ? '' : '#e8693a';
        if (!valid) ok = false;
      });
      if (!ok) {
        var first = form.querySelector('[required]:invalid, [style*="rgb(232"]');
        if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      // demo: hide form, show success
      form.style.display = 'none';
      if (success) {
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ---- Update year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
