(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const body = document.body;

  /* ---------- linha do rasgo: irregular, igual para as duas metades ---------- */
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pts = [];
  let x = 50;
  for (let y = -1, i = 0; y <= 101; y += 1.1 + rnd() * 0.9, i++) {
    x += (rnd() - .5) * 1.8 + (50 - x) * .08;           // deriva lenta, puxada para o centro
    const jag = (i % 2 ? 1 : -1) * (0.15 + rnd() * .45); // serrilhado fino da fibra
    pts.push({ x: x + jag, y, f: 3 + rnd() * 9 });
  }
  pts[pts.length - 1].y = 101;

  const line = pts.map(p => `${p.x.toFixed(2)}% ${p.y.toFixed(2)}%`).join(',');
  const fib = s => pts.map(p => `calc(${p.x.toFixed(2)}% ${s} ${p.f.toFixed(1)}px) ${p.y.toFixed(2)}%`);

  const L = document.querySelector('.half--l'), R = document.querySelector('.half--r');
  if (L && R) {
    L.querySelector('.half__face').style.clipPath = `polygon(0% -1%, ${line}, 0% 101%)`;
    R.querySelector('.half__face').style.clipPath = `polygon(100% -1%, ${line}, 100% 101%)`;
    L.querySelector('.half__fiber').style.clipPath = `polygon(0% -1%, ${fib('+').join(',')}, 0% 101%)`;
    R.querySelector('.half__fiber').style.clipPath = `polygon(100% -1%, ${fib('-').join(',')}, 100% 101%)`;
    document.querySelector('.crack path').setAttribute('d', 'M' + pts.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L'));
  }

  /* ---------- palavras do Ato 2 ---------- */
  const kin = document.querySelector('[data-kinetic]');
  const words = [];
  if (kin) {
    const txt = kin.textContent.trim().split(/\s+/);
    kin.textContent = '';
    txt.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w;
      kin.append(s, i < txt.length - 1 ? ' ' : '');
      words.push(s);
    });
  }

  /* ---------- entradas simples (Ato 6) ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-in]').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 90}ms`;
    io.observe(el);
  });

  /* ---------- driver de rolagem ---------- */
  const pins = [...document.querySelectorAll('[data-pin]')];
  const tearSec = document.querySelector('.act-tear');
  const tearStage = tearSec.querySelector('.tear');
  const track = document.querySelector('.rail__track');
  const foot = document.querySelector('.reveal__foot');
  const progress = el => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : (r.top < 0 ? 1 : 0);
  };

  let ticking = false;
  function update() {
    ticking = false;
    const tr = tearSec.getBoundingClientRect();
    const pt = progress(tearSec);
    body.classList.toggle('lit', reduced ? tr.top < innerHeight * .5 : (pt > .5 || tr.bottom < innerHeight));
    if (reduced) return;

    pins.forEach(el => {
      const p = progress(el);
      if (el.classList.contains('act-search')) {
        const n = Math.round(seg(p, .04, .86) * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      } else if (el === tearSec) {
        const crack = ease(seg(p, 0, .12));
        const open = ease(seg(p, .08, .36));
        const part = ease(seg(p, .34, .74));
        const theta = open * 3.2 + part * 7;
        const tx = part * 64, ty = part * 10;
        L.style.transform = `translate3d(${-tx}vw, ${ty}vh, 0) rotate(${-theta}deg)`;
        R.style.transform = `translate3d(${tx}vw, ${ty * 1.25}vh, 0) rotate(${theta}deg)`;
        const s = tearStage.style;
        s.setProperty('--crack', (1 - crack).toFixed(3));
        s.setProperty('--fiber', clamp(open * 5).toFixed(3));
        s.setProperty('--open', (open * .3 + part * .7).toFixed(3));
        s.setProperty('--glow', part.toFixed(3));
        const sub = ease(seg(p, .74, .88));
        s.setProperty('--sub', sub.toFixed(3));
        foot.inert = sub < .5;
        const gone = part >= 1;
        L.style.visibility = R.style.visibility = gone ? 'hidden' : '';
      } else if (el.classList.contains('act-rail')) {
        const dist = Math.max(0, track.offsetWidth - innerWidth);
        track.style.transform = `translate3d(${(-ease(seg(p, .06, .94)) * dist).toFixed(1)}px,0,0)`;
      }
    });
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
})();
