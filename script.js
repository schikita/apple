/* ============================================================
   Яблочная история — interactions (pure JS)
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll progress bar ---------- */
  const progress = document.getElementById('scrollProgress');
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (max <= 0) { progress.style.width = '0%'; return; }
    progress.style.width = (h.scrollTop / max) * 100 + '%';
  }

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById('siteNav');
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }

  function onScroll() {
    updateProgress();
    updateNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu toggle ---------- */
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  toggle.addEventListener('click', function () {
    const open = menu.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Count-up numbers ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = target * eased;
      let text;
      if (decimals > 0) {
        text = val.toFixed(decimals).replace('.', ',');
      } else {
        text = Math.round(val).toLocaleString('ru-RU');
      }
      el.textContent = text + suffix;
      if (p < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- IntersectionObservers ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    // Reveal on scroll
    const revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

    // Count-up numbers when they enter viewport
    const countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(function (el) { countObs.observe(el); });

    // Active nav link based on scroll position
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');
    const sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });

    sections.forEach(function (s) { sectionObs.observe(s); });
  } else {
    // Fallback: show everything, set final numbers immediately
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      let text;
      if (decimals > 0) {
        text = parseFloat(el.dataset.count).toFixed(decimals).replace('.', ',');
      } else {
        text = parseInt(el.dataset.count, 10).toLocaleString('ru-RU');
      }
      el.textContent = text + (el.dataset.suffix || '');
    });
  }
})();

/* ============================================================
   Photo carousel (pure JS) — 3 rotating images
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCarousel(root) {
    const slides = Array.from(root.querySelectorAll('.carousel-slide'));
    const dots = Array.from(root.querySelectorAll('.carousel-dot'));
    const prev = root.querySelector('.carousel-prev');
    const next = root.querySelector('.carousel-next');
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) { s.classList.toggle('is-active', j === index); });
      dots.forEach(function (d, j) { d.classList.toggle('is-active', j === index); });
    }
    function nextSlide() { show(index + 1); }
    function prevSlide() { show(index - 1); }
    function start() {
      if (!reduce && slides.length > 1 && !timer) { timer = setInterval(nextSlide, 5000); }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (next) next.addEventListener('click', function () { nextSlide(); restart(); });
    if (prev) prev.addEventListener('click', function () { prevSlide(); restart(); });
    dots.forEach(function (d, j) {
      d.addEventListener('click', function () { show(j); restart(); });
    });

    start();
  }

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
})();

/* ============================================================
   Horizontal gallery carousel (pure JS)
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initGallery(root) {
    const track = root.querySelector('.gallery-track');
    const slides = Array.from(root.querySelectorAll('.gallery-slide'));
    const dots = Array.from(root.querySelectorAll('.gallery-dot'));
    const prev = root.querySelector('.gallery-prev');
    const next = root.querySelector('.gallery-next');
    if (!track || !slides.length) return;

    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach(function (d, j) { d.classList.toggle('is-active', j === index); });
    }
    function nextSlide() { show(index + 1); }
    function prevSlide() { show(index - 1); }
    function start() {
      if (!reduce && slides.length > 1 && !timer) { timer = setInterval(nextSlide, 5000); }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (next) next.addEventListener('click', function () { nextSlide(); restart(); });
    if (prev) prev.addEventListener('click', function () { prevSlide(); restart(); });
    dots.forEach(function (d, j) {
      d.addEventListener('click', function () { show(j); restart(); });
    });

    start();
  }

  document.querySelectorAll('[data-gallery]').forEach(initGallery);
})();

/* ============================================================
   Marquee carousel + lightbox (pure JS)
   ============================================================ */
(function () {
  'use strict';

  // Duplicate marquee items for a seamless infinite loop
  var track = document.getElementById('marqueeTrack');
  if (track && track.children.length) {
    var items = Array.from(track.children);
    items.forEach(function (it) { track.appendChild(it.cloneNode(true)); });
  }

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Фото';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.marquee-item').forEach(function (item) {
    item.addEventListener('click', function () {
      var img = item.querySelector('img');
      var full = item.getAttribute('data-full') || (img ? img.src : '');
      var alt = img ? img.alt : 'Фото';
      openLightbox(full, alt);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();
