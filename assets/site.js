(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;
  var anim = !reduce && 'IntersectionObserver' in window;
  if (anim) doc.classList.add('js-anim');

  /* ---------- nav ---------- */
  var nav = document.getElementById('nav'), btn = document.getElementById('menuBtn');
  if (btn) {
    btn.addEventListener('click', function () { var o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    nav.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });
  }
  window.addEventListener('scroll', function () { nav && nav.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });

  /* ---------- contact form: every enquiry goes to finance@qorinai.ai via the visitor's mail app ---------- */
  var form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault(); if (!form.reportValidity()) return;
    var v = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
    var subject = 'Enquiry via qorinai.ai — ' + (v('need') || 'General') + (v('company') ? ' — ' + v('company') : '');
    var body = ['Name: ' + v('name'), 'Company: ' + v('company'), 'Work email: ' + v('email'), 'I need to: ' + v('need'), 'Scale: ' + v('scale'), '', v('message')].join('\n');
    window.location.href = 'mailto:finance@qorinai.ai?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    document.getElementById('sent').hidden = false; form.querySelector('button[type=submit]').disabled = true;
  });

  /* ---------- homepage video: autoplays muted; sound only when the visitor clicks the button ---------- */
  var fv = document.getElementById('flagshipVideo');
  if (fv) {
    var btn = document.getElementById('soundBtn');
    function setBtn() { if (btn) btn.textContent = fv.muted ? '🔇  Click for sound' : '🔊  Sound on'; }
    fv.muted = true; setBtn();
    // load the 20 MB file only when the player scrolls near the viewport, then autoplay muted
    var loadVideo = function () { if (fv.dataset.src) { fv.autoplay = true; fv.src = fv.dataset.src; delete fv.dataset.src; fv.addEventListener('canplay', function () { var pp = fv.play(); if (pp && pp.catch) pp.catch(function () {}); }, { once: true }); fv.load(); } };
    var nearView = function () { var r = fv.getBoundingClientRect(); return r.top < innerHeight + 400 && r.bottom > -400; };
    var check = function () { if (fv.dataset.src && nearView()) { loadVideo(); window.removeEventListener('scroll', check); } };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en, o) { en.forEach(function (e) { if (e.isIntersecting) { loadVideo(); o.disconnect(); } }); }, { rootMargin: '400px 0px' }).observe(fv);
    }
    window.addEventListener('scroll', check, { passive: true });
    setTimeout(check, 1500);
    if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); fv.muted = !fv.muted; if (!fv.muted) fv.play(); setBtn(); });
  }

  /* ---------- hero headline: word-by-word rise ---------- */
  var title = document.getElementById('heroTitle');
  if (title) {
    var words = title.textContent.trim().split(/\s+/);
    title.innerHTML = words.map(function (w, i) {
      var cls = /^(AI|GPU\.?)$/.test(w) ? ' class="ai"' : '';
      return '<span class="w"><i' + cls + ' style="--d:' + (0.15 + i * 0.06).toFixed(2) + 's">' + w + '</i></span>';
    }).join(' ');
  }

  /* ---------- hero canvas: flowing point field ---------- */
  var cv = document.getElementById('field');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W, H, pts = [], t = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), mx = -1e4, my = -1e4;
    function size() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gap = W > 900 ? 34 : 26; pts = [];
      for (var y = -gap; y < H + gap; y += gap) for (var x = -gap; x < W + gap; x += gap) pts.push({ x: x, y: y, p: Math.random() * 6.28 });
    }
    size(); window.addEventListener('resize', size);
    cv.parentElement.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.parentElement.addEventListener('pointerleave', function () { mx = my = -1e4; });
    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += reduce ? 0 : 0.008;
      var cx = W * 0.68, cy = H * 0.42;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx * dx + dy * dy);
        var wave = Math.sin(d * 0.012 - t * 2.2 + p.p * 0.15) * 0.5 + 0.5;          // ripple from the core
        var band = Math.sin(p.y * 0.006 + p.x * 0.003 + t) * 0.5 + 0.5;               // slow diagonal drift
        var a = 0.06 + wave * 0.32 * band;
        var mdx = p.x - mx, mdy = p.y - my, md = mdx * mdx + mdy * mdy;
        var lift = md < 40000 ? (1 - md / 40000) : 0;                                  // pointer halo
        var r = 1 + wave * 1.4 + lift * 2.2;
        var ox = Math.cos(p.p + t) * 3 * band, oy = Math.sin(p.p + t * 0.8) * 3;
        ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy, r, 0, 6.283);
        ctx.fillStyle = lift > 0.05 ? 'rgba(36,180,232,' + (0.35 + lift * 0.6) + ')' : 'rgba(' + (wave > 0.7 ? '36,180,232' : '150,165,180') + ',' + a + ')';
        ctx.fill();
      }
      // core glow
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.45);
      g.addColorStop(0, 'rgba(36,180,232,0.16)'); g.addColorStop(1, 'rgba(36,180,232,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (!reduce) requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------- chain grid: signal travels link to link ---------- */
  var grid = document.getElementById('chainGrid');
  if (grid) {
    var lis = grid.querySelectorAll('li'), gi = -1, timer = null;
    function stepChain() {
      if (gi >= 0) { lis[gi].classList.remove('active'); lis[gi].classList.add('done'); }
      gi = (gi + 1) % lis.length;
      if (gi === 0) lis.forEach(function (l) { l.classList.remove('done'); });
      lis[gi].classList.add('active');
    }
    function startChain() { if (!timer && !reduce) { stepChain(); timer = setInterval(stepChain, 1500); } }
    function stopChain() { if (timer) { clearInterval(timer); timer = null; } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { grid.classList.add('in'); setTimeout(startChain, 500); } else stopChain(); }); }, { threshold: 0.2 }).observe(grid);
      setTimeout(function () { if (grid.getBoundingClientRect().top < innerHeight) { grid.classList.add('in'); startChain(); } }, 900);
    } else { grid.classList.add('in'); startChain(); }
  }

  /* ---------- marquee: duplicate for seamless loop ---------- */
  var mq = document.getElementById('marquee');
  if (mq) mq.innerHTML += mq.innerHTML;

  /* ---------- chain slider: buttons + drag ---------- */
  var row = document.getElementById('chainRow');
  if (row) {
    document.querySelectorAll('.row-nav button').forEach(function (b) {
      b.addEventListener('click', function () { row.scrollBy({ left: (parseInt(b.dataset.dir, 10) || 1) * 340, behavior: 'smooth' }); });
    });
    var down = false, sx = 0, sl = 0, moved = false;
    row.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = e.clientX; sl = row.scrollLeft; row.classList.add('drag'); });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; row.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { down = false; row.classList.remove('drag'); });
    row.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  }

  /* ---------- spotlight: pointer-following glow on cards ---------- */
  document.querySelectorAll('.spotlight, .link-card').forEach(function (el) {
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });

  if (!anim) return;

  /* ---------- scroll reveal ---------- */
  var sel = '.card, .step, .proj, .tier, .metric, .hw, .tl li, .why3 > div, .cmp, .partner, .faq details, .table-scroll, .photo-strip, .share > div, .h2, .lede, .eyebrow, .statement, .feat li, .loc, .link-card, .row-head, .hw-note, .cat > *';
  var items = document.querySelectorAll(sel);
  items.forEach(function (el) {
    if (el.closest('.hero') || el.closest('.page-hero') || el.closest('[data-no-reveal]')) return;
    el.classList.add('rv');
    var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty('--d', Math.min(sib, 8) * 0.08 + 's');
  });
  document.querySelectorAll('.tier .bar i').forEach(function (b) { b.dataset.w = b.style.width; b.style.width = '0%'; });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; el.classList.add('in'); io.unobserve(el);
      var b = el.querySelector('.bar i'); if (b && b.dataset.w) b.style.width = b.dataset.w;
      countUp(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  // safety nets: reveal anything already in view if the observer is late (hidden tab, bfcache), never leave content hidden
  function sweep() {
    document.querySelectorAll('.rv:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.05 && r.bottom > 0) { el.classList.add('in'); var b = el.querySelector('.bar i'); if (b && b.dataset.w) b.style.width = b.dataset.w; countUp(el); }
    });
  }
  window.addEventListener('scroll', sweep, { passive: true });
  document.addEventListener('visibilitychange', sweep);
  setTimeout(sweep, 800);
  setTimeout(function () { document.querySelectorAll('.rv:not(.in)').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight * 1.5) el.classList.add('in'); }); }, 4000);

  /* ---------- count-up ---------- */
  document.querySelectorAll('.fact b, .metric b, .proj .big b, .tier b').forEach(function (el) { io.observe(el); });
  var countSel = '.fact b, .metric b, .proj .big b, .tier b';
  function countUp(el) {
    if (el.dataset.counted || !el.matches(countSel)) return;
    var m = /^([^\d]*)(\d[\d,]*\.?\d*)(.*)$/s.exec(el.textContent.trim());
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length;
    if (isNaN(target) || target === 0) return;
    el.dataset.counted = '1';
    var html = el.innerHTML, start = performance.now(), dur = 1300;
    var em = el.querySelector('em'); var emHtml = em ? em.outerHTML : '';
    function fmt(v) { return v.toLocaleString('en-AU', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    (function tick(t) {
      var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      var txt = m[1] + fmt(target * e) + (em ? m[3].replace(em.textContent, '') : m[3]);
      el.innerHTML = em ? txt + emHtml : txt;
      if (p < 1) requestAnimationFrame(tick); else el.innerHTML = html;
    })(start);
  }
})();
