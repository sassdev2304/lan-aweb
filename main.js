/* Lança Web · scroll timeline (page-local, no shared engine available) */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- name → the visitor's own site (signature move) ---------- */
  const input = $('#bizname');
  let bizName = 'Sua Empresa';
  const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'suaempresa';
  function setName() {
    bizName = input.value.trim() || 'Sua Empresa';
    $$('.js-name').forEach(el => (el.textContent = bizName));
    $$('.js-slug').forEach(el => (el.textContent = slugify(bizName)));
    typedLen = -1;
    tick();
  }
  input.addEventListener('input', setName);
  try { const saved = sessionStorage.getItem('lw-name'); if (saved) { input.value = saved; } } catch (e) {}
  input.addEventListener('change', () => { try { sessionStorage.setItem('lw-name', input.value); } catch (e) {} });

  // styled copy of the mini-site, stacked over the wireframe
  const wire = $('.ms--wire');
  const styled = wire.cloneNode(true);
  styled.className = 'ms ms--styled';
  wire.parentNode.appendChild(styled);

  /* ---------- act 2: split lines into words ---------- */
  const words = [];
  $$('#lateLines .ln').forEach(ln => {
    const parts = ln.textContent.trim().split(/\s+/);
    ln.textContent = '';
    parts.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w;
      ln.appendChild(s);
      if (i < parts.length - 1) ln.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  });

  /* ---------- act measurement ---------- */
  const acts = $$('[data-act]');
  const hero = $('.act--hero'), late = $('.act--late'), peak = $('.act--peak'), rail = $('.act--rail');
  function measure() {
    acts.forEach(a => { a._top = a.getBoundingClientRect().top + scrollY; a._h = a.offsetHeight; });
    fitIframes();
  }

  /* ---------- rail iframes: scale a 1280px desktop into the device ---------- */
  const viewports = $$('.viewport');
  function fitIframes() {
    viewports.forEach(v => { v._s = v.clientWidth / 1280; v._room = Math.max(0, 2600 * v._s - v.clientHeight); });
  }

  /* ---------- per-frame update ---------- */
  let typedLen = -1, peakState = { l: 0 };
  function tick() {
    const y = scrollY, vh = innerHeight;
    acts.forEach(a => {
      a._p = RM ? 1 : clamp((y - a._top) / Math.max(1, a._h - vh));
      a.style.setProperty('--p', a._p.toFixed(4));
    });

    // act 2 words
    const lp = late._p;
    words.forEach((w, i) => {
      const t = (i / words.length) * 0.78;
      const o = RM ? 1 : seg(lp, t, t + 0.07);
      w.style.opacity = (0.08 + o * 0.92).toFixed(3);
      w.style.transform = `translateY(${((1 - o) * 0.18).toFixed(3)}em)`;
    });
    late.style.setProperty('--note', seg(lp, 0.82, 0.95).toFixed(3));

    // act 4 peak
    const p = peak._p;
    peak.style.setProperty('--f', seg(p, 0, 0.04).toFixed(3));
    peak.style.setProperty('--wipe', (RM ? 1 : seg(p, 0.55, 0.7)).toFixed(4));
    peak.style.setProperty('--live', seg(p, 0.72, 0.76).toFixed(3));
    const l = RM ? 0 : seg(p, 0.8, 0.97);
    const le = l * l * (3 - 2 * l); // smoothstep
    peak.style.setProperty('--l', le.toFixed(4));
    peak.style.setProperty('--ld', (RM ? 1 : seg(p, 0.86, 0.95)).toFixed(3));
    peakState.l = l;
    $$('[data-at]', peak).forEach(el => el.classList.toggle('on', RM || p >= parseFloat(el.dataset.at)));
    const n = RM ? bizName.length : Math.round(seg(p, 0.12, 0.3) * bizName.length);
    if (n !== typedLen) { typedLen = n; $$('.js-type', peak).forEach(el => (el.textContent = bizName.slice(0, n))); }

    // act 5 rail
    if (!RM) {
      const track = $('.track', rail);
      const max = track.scrollWidth - innerWidth;
      const rp = seg(rail._p, 0.04, 0.96);
      track.style.transform = `translate3d(${(-rp * max).toFixed(1)}px,0,0)`;
      // each embedded site scrolls itself while its panel crosses the screen
      viewports.forEach(v => {
        const r = v.getBoundingClientRect();
        const local = clamp(1 - (r.left + r.width / 2) / innerWidth); // 0 entering right → 1 leaving left
        v.firstElementChild.style.transform = `translateY(${(-local * v._room).toFixed(1)}px) scale(${v._s})`;
      });
    } else {
      viewports.forEach(v => (v.firstElementChild.style.transform = `scale(${v._s})`));
    }
  }

  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; tick(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); tick(); resizeWorld(); });

  /* ---------- act 1: the search that doesn't find you (time-based) ---------- */
  const q = $('#q'), query = 'o que você vende perto de mim', results = $$('.results li');
  if (RM) { q.textContent = query; results.forEach(r => r.classList.add('on')); }
  else {
    let i = 0;
    setTimeout(function type() {
      q.textContent = query.slice(0, ++i);
      if (i < query.length) setTimeout(type, 45 + Math.random() * 50);
      else results.forEach((r, k) => setTimeout(() => r.classList.add('on'), 350 + k * 380 + (k === 3 ? 450 : 0)));
    }, 700);
  }

  /* ---------- close: pointer tilts the mark ---------- */
  const mark = $('#mark');
  let mx = 0, my = 0;
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
    if (!RM) { mark.style.setProperty('--rx', `${(mx * 30).toFixed(1)}deg`); mark.style.setProperty('--ry', `${(-my * 30).toFixed(1)}deg`); }
  }, { passive: true });

  /* ---------- leaving without contact ---------- */
  const title = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Seu concorrente já tem site.' : title;
  });

  /* ---------- the world: one continuous ascent ---------- */
  const cv = $('#world'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, stars = [];
  function resizeWorld() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR;
    const count = Math.round(Math.min(260, (innerWidth * innerHeight) / 5200));
    stars = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, r: Math.random() < 0.08 ? 1.6 : 0.9 }));
  }
  function draw(t) {
    const docH = document.documentElement.scrollHeight - innerHeight;
    const alt = clamp(scrollY / Math.max(1, docH));
    ctx.fillStyle = '#010715';
    ctx.fillRect(0, 0, W, H);

    // horizon: city glow that falls away as we climb
    const gy = H * 0.94 + scrollY * DPR * 0.55;
    if (gy < H * 1.8) {
      const g = ctx.createLinearGradient(0, gy - H * 0.7, 0, gy);
      g.addColorStop(0, 'rgba(19,83,180,0)');
      g.addColorStop(1, 'rgba(19,83,180,0.32)');
      ctx.fillStyle = g; ctx.fillRect(0, gy - H * 0.7, W, H * 0.7);
      ctx.fillStyle = 'rgba(90,184,255,0.25)'; ctx.fillRect(0, gy, W, 1 * DPR);
    }
    // high-altitude haze toward the end
    const top = ctx.createRadialGradient(W * 0.8, -H * 0.1, 0, W * 0.8, -H * 0.1, H * 1.1);
    top.addColorStop(0, `rgba(47,123,255,${(0.05 + alt * 0.12).toFixed(3)})`);
    top.addColorStop(1, 'rgba(47,123,255,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);

    const warp = Math.sin(peakState.l * Math.PI);
    const drift = RM ? 0 : t * 0.006;
    const vis = 0.3 + alt * 0.9;
    for (const s of stars) {
      const y = ((s.y * H + (scrollY * 0.35 + drift) * s.z * DPR + peakState.l * H * 2.2 * s.z) % H + H) % H;
      const x = s.x * W + mx * 14 * s.z * DPR;
      const a = Math.min(1, vis * s.z);
      if (warp > 0.02) {
        ctx.strokeStyle = `rgba(150,200,255,${a.toFixed(3)})`;
        ctx.lineWidth = s.r * DPR;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - warp * 160 * s.z * DPR); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(210,228,255,${a.toFixed(3)})`;
        ctx.fillRect(x, y, s.r * DPR, s.r * DPR);
      }
    }
    if (!document.hidden) requestAnimationFrame(draw);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(draw); });

  resizeWorld();
  if (input.value) setName();
  addEventListener('load', () => { measure(); tick(); });
  measure(); tick();
  requestAnimationFrame(draw);
})();
