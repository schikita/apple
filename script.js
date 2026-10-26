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

/* ============================================================
   Mini-game: collect apples (pure JS canvas)
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('gameScore');
  var timeEl = document.getElementById('gameTime');
  var startBtn = document.getElementById('gameStart');

  var W = canvas.width, H = canvas.height;
  var GROUND_H = 90;
  var TREES = [];
  var apples = [];
  var score = 0;
  var timeLeft = 60;
  var running = false;
  var lastT = 0;
  var spawnAcc = 0;
  var elapsed = 0;

  function buildTrees() {
    TREES = [];
    var n = 5;
    for (var i = 0; i < n; i++) {
      var x = (i + 0.5) * (W / n);
      TREES.push({
        x: x,
        baseY: H - GROUND_H,
        canopyY: H - GROUND_H - 140,
        canopyR: 54 + (i % 2) * 14
      });
    }
  }

  function spawnApple(now) {
    var tree = TREES[Math.floor(Math.random() * TREES.length)];
    var angle = (Math.random() - 0.5) * 1.2;
    var ox = Math.cos(angle) * (tree.canopyR * 0.7);
    var oy = Math.sin(angle) * (tree.canopyR * 0.55) - tree.canopyR * 0.18;
    var y = tree.canopyY + oy;
    apples.push({
      x: tree.x + ox,
      y: y,
      startY: y,
      state: 'green',
      greenTime: 2200 + Math.random() * 3600,
      born: now,
      fallStart: 0,
      fallDur: 2400,
      radius: 16,
      collected: false
    });
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8ec7ef');
    g.addColorStop(0.7, '#cfe4f2');
    g.addColorStop(1, '#dff0d8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // sun
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.beginPath(); ctx.arc(W - 80, 70, 40, 0, Math.PI * 2); ctx.fill();
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    [[120, 70], [410, 50], [720, 92]].forEach(function (c) {
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 52, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c[0] + 32, c[1] - 12, 34, 18, 0, 0, Math.PI * 2); ctx.fill();
    });
    // ground
    ctx.fillStyle = '#6aa84f';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.fillStyle = '#5b9440';
    ctx.fillRect(0, H - GROUND_H + 20, W, GROUND_H - 20);
    ctx.strokeStyle = '#4c8a34';
    ctx.lineWidth = 2;
    for (var i = 0; i < W; i += 12) {
      ctx.beginPath(); ctx.moveTo(i, H - GROUND_H); ctx.lineTo(i + 4, H - GROUND_H - 10); ctx.stroke();
    }
  }

  function drawTree(t) {
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(t.x - 14, t.baseY - 120, 28, 120);
    ctx.fillStyle = '#3f7d3a';
    ctx.beginPath(); ctx.arc(t.x, t.canopyY, t.canopyR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4f9a48';
    ctx.beginPath(); ctx.arc(t.x - t.canopyR * 0.3, t.canopyY - t.canopyR * 0.25, t.canopyR * 0.7, 0, Math.PI * 2); ctx.fill();
  }

  function drawApple(a) {
    var color = a.state === 'green' ? '#7cb342' : a.state === 'red' ? '#c62828' : '#8d6e63';
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(a.x - 5, a.y - 6, a.radius * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(a.x, a.y - a.radius); ctx.quadraticCurveTo(a.x + 4, a.y - a.radius - 8, a.x + 9, a.y - a.radius - 6); ctx.stroke();
    ctx.fillStyle = '#6a8f5f';
    ctx.beginPath(); ctx.ellipse(a.x + 10, a.y - a.radius - 2, 9, 4, -0.4, 0, Math.PI * 2); ctx.fill();
  }

  function gameLoop(now) {
    if (!running) return;
    var dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    elapsed += dt;
    var speed = 1 + (elapsed / 60) * 1.3;

    spawnAcc += dt * (1.1 + elapsed / 16);
    while (spawnAcc > 1) { spawnApple(now); spawnAcc -= 1; }

    apples.forEach(function (a) {
      if (a.collected) return;
      if (a.state === 'green') {
        if ((now - a.born) >= a.greenTime) {
          a.state = 'red';
          a.fallStart = now;
          a.startY = a.y;
        }
      } else if (a.state === 'red') {
        var ft = now - a.fallStart;
        var p = Math.min(ft / (a.fallDur / speed), 1);
        a.y = a.startY + p * (H - GROUND_H + 34 - a.startY);
        a.x += Math.sin(now / 90 + a.fallStart) * 0.25;
        if (ft >= 3000) a.state = 'brown';
      } else if (a.state === 'brown') {
        var ft2 = now - a.fallStart;
        var p2 = Math.min(ft2 / (a.fallDur / speed), 1);
        a.y = a.startY + p2 * (H - GROUND_H + 34 - a.startY);
      }
    });

    apples = apples.filter(function (a) {
      if (a.collected) return false;
      if (a.state === 'brown' && (now - a.fallStart) > 7000) return false;
      return true;
    });

    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; endGame(); return; }

    drawBackground();
    TREES.forEach(drawTree);
    apples.forEach(drawApple);

    if (scoreEl) scoreEl.textContent = score;
    if (timeEl) timeEl.textContent = Math.ceil(timeLeft);

    requestAnimationFrame(gameLoop);
  }

  function endGame() {
    running = false;
    if (startBtn) startBtn.textContent = 'Играть снова';
    drawBackground();
    TREES.forEach(drawTree);
    apples.forEach(drawApple);
    ctx.fillStyle = 'rgba(20,26,18,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Comfortaa, sans-serif';
    ctx.fillText('Время вышло!', W / 2, H / 2 - 16);
    ctx.font = '26px Comfortaa, sans-serif';
    ctx.fillText('Очки: ' + score, W / 2, H / 2 + 32);
    ctx.textAlign = 'left';
  }

  function startGame() {
    apples = [];
    score = 0;
    timeLeft = 60;
    elapsed = 0;
    spawnAcc = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (timeEl) timeEl.textContent = '60';
    buildTrees();
    running = true;
    lastT = performance.now();
    if (startBtn) startBtn.textContent = 'Заново';
    requestAnimationFrame(gameLoop);
  }

  canvas.addEventListener('click', function (e) {
    if (!running) return;
    var rect = canvas.getBoundingClientRect();
    var sx = (e.clientX - rect.left) * (W / rect.width);
    var sy = (e.clientY - rect.top) * (H / rect.height);
    var hit = null;
    for (var i = apples.length - 1; i >= 0; i--) {
      var a = apples[i];
      if (Math.hypot(a.x - sx, a.y - sy) < a.radius + 8) { hit = a; break; }
    }
    if (hit) {
      if (hit.state === 'red') { score += 1; hit.collected = true; }
      else if (hit.state === 'brown') { score -= 1; hit.collected = true; }
    }
  });

  if (startBtn) startBtn.addEventListener('click', startGame);

  buildTrees();
  drawBackground();
  TREES.forEach(drawTree);
})();
