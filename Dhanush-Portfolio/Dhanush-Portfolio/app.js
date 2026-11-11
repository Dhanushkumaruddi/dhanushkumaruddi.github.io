(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ── pull cord: lights on / off ── */
  const cord = $('#cord'), flash = $('.flash'), meta = $('meta[name="theme-color"]');
  const syncCord = () => {
    const dark = root.dataset.theme === 'dark';
    cord.setAttribute('aria-pressed', String(dark));
    cord.setAttribute('aria-label', dark ? 'Switch the lights on' : 'Switch the lights off');
    if (meta) meta.content = dark ? '#1b1d18' : '#efebe3';
  };
  const click = () => {
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = click.ctx || (click.ctx = new C());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1800;
      g.gain.setValueAtTime(.04, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .05);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .06);
    } catch (e) {}
  };
  const toggle = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    cord.classList.remove('is-pulled'); void cord.offsetWidth; cord.classList.add('is-pulled');
    click();
    setTimeout(() => {
      root.dataset.theme = next;
      try { localStorage.setItem('dk-theme', next); } catch (e) {}
      syncCord();
      if (!reduce) { flash.className = 'flash'; void flash.offsetWidth; flash.className = 'flash ' + (next === 'dark' ? 'is-off' : 'is-on'); }
    }, reduce ? 0 : 180);
  };
  let dragY = null, moved = false;
  cord.addEventListener('pointerdown', e => { dragY = e.clientY; moved = false; cord.setPointerCapture(e.pointerId); });
  cord.addEventListener('pointermove', e => {
    if (dragY == null) return;
    const d = clamp(e.clientY - dragY, 0, 70);
    if (d > 6) moved = true;
    cord.style.transform = `translateY(${d}px)`;
  });
  const release = e => {
    if (dragY == null) return;
    const d = e.clientY - dragY; dragY = null;
    cord.style.transform = '';
    if (moved && d > 30) toggle();
    else if (!moved) toggle();
  };
  cord.addEventListener('pointerup', release);
  cord.addEventListener('pointercancel', () => { dragY = null; cord.style.transform = ''; });
  cord.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  syncCord();
  setTimeout(() => { cord.classList.add('is-hinting'); setTimeout(() => cord.classList.remove('is-hinting'), 3500); }, 1800);

  /* ── clock (Hyderabad) ── */
  const t = $('#clockTime'), d = $('#clockDate');
  const tick = () => {
    const now = new Date();
    t.textContent = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    d.textContent = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
  };
  tick(); setInterval(tick, 15000);
  $('#year').textContent = new Date().getFullYear();

  /* ── flip calendar of roles ── */
  const roles = ['CA Article Trainee', 'CA & CMA Inter Qualified', 'Audit & Tax Trainee', 'Finance Problem-Solver', 'AI Tool Builder'];
  const page = $('#flipPage'), ft = $('#flipText'), fc = $('#flipCount');
  let ri = 0;
  const flip = () => {
    ri = (ri + 1) % roles.length;
    page.classList.remove('is-flipping'); void page.offsetWidth; page.classList.add('is-flipping');
    setTimeout(() => { ft.textContent = roles[ri]; fc.textContent = `0${ri + 1} / 0${roles.length}`; }, reduce ? 0 : 120);
  };
  let flipTimer = setInterval(flip, 2600);
  $('#flip').addEventListener('click', () => { clearInterval(flipTimer); flip(); flipTimer = setInterval(flip, 2600); });

  /* ── ability card ── */
  const ab = $('#abilityBtn'), ac = $('#abilityCard');
  ab.addEventListener('click', () => {
    const open = ac.hidden; ac.hidden = !open; ab.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => { if (!ac.hidden && !ac.contains(e.target) && e.target !== ab) { ac.hidden = true; ab.setAttribute('aria-expanded', 'false'); } });

  /* ── nav: menu, hide on scroll down, current link ── */
  const nav = $('#nav'), menu = $('#menu'), links = $('#navLinks');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); links.classList.toggle('is-open', open);
    menu.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu');
  });
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); };

  /* ── pinned sections helper ── */
  const progress = el => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight), 0, 1);
  };

  /* ── doors ── */
  const doorsSec = $('#doors'), doors = $$('.door'), infos = $$('.info'), dots = $$('#doorDots i');
  let activeDoor = -1;
  const setDoor = i => {
    if (i === activeDoor) return; activeDoor = i;
    doors.forEach((dr, k) => {
      const off = k - i;
      dr.style.setProperty('--off', off);
      dr.style.setProperty('--s', off === 0 ? 1 : .8);
      dr.style.setProperty('--o', Math.abs(off) > 1 ? 0 : off === 0 ? 1 : .5);
      dr.style.setProperty('--b', off === 0 ? 1 : .6);
      dr.style.zIndex = 10 - Math.abs(off);
      dr.classList.toggle('is-active', off === 0);
      dr.tabIndex = off === 0 ? 0 : -1;
    });
    infos.forEach((n, k) => n.classList.toggle('is-on', k === i));
    dots.forEach((n, k) => n.classList.toggle('is-on', k === i));
  };
  setDoor(0);
  doors.forEach((dr, k) => dr.addEventListener('click', () => {
    if (k !== activeDoor) { goDoor(k); return; }
    enterRoom(dr);
  }));
  const goDoor = k => {
    const top = doorsSec.offsetTop + (doorsSec.offsetHeight - innerHeight) * ((k + .5) / doors.length);
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[data-door]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); closeMenu(); goDoor(+a.dataset.door); }));

  /* ── room ── */
  const room = $('#room'), body = $('#roomBody'), zoom = $('#zoom'), zd = $('#zoomDoor');
  let lastDoor = null, savedY = 0;
  const enterRoom = dr => {
    lastDoor = dr; savedY = scrollY;
    const open = () => {
      body.replaceChildren($('#room-' + dr.dataset.room).content.cloneNode(true));
      room.hidden = false; room.classList.remove('is-in'); void room.offsetWidth; room.classList.add('is-in');
      room.scrollTop = 0;
      document.body.style.overflow = 'hidden';
      $('#roomBack').focus({ preventScroll: true });
      $$('.typed', body).forEach(typeIt);
      setTimeout(() => zoom.classList.remove('is-going'), 250);
    };
    if (reduce) return open();
    zd.style.setProperty('--zoom', getComputedStyle(dr).getPropertyValue('--door'));
    zoom.classList.remove('is-going'); void zoom.offsetWidth; zoom.classList.add('is-going');
    setTimeout(open, 820);
  };
  const leaveRoom = () => {
    if (room.hidden) return;
    room.hidden = true; body.replaceChildren();
    document.body.style.overflow = '';
    scrollTo({ top: savedY, behavior: 'auto' });
    if (lastDoor) lastDoor.focus({ preventScroll: true });
  };
  $('#roomBack').addEventListener('click', leaveRoom);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { leaveRoom(); closeMenu(); }
    if (e.key === 'Tab' && !room.hidden) {
      const f = $$('a[href], button', room); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function typeIt(el) {
    const text = el.dataset.typed; let i = 0;
    if (reduce) { el.textContent = text; return; }
    const step = () => {
      if (room.hidden) return;
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(step, 70);
      else setTimeout(() => { i = 0; step(); }, 2200);
    };
    step();
  }

  /* ── story: the year rolls back ── */
  const storySec = $('#story'), items = $$('#storyList li'), reel = $('#yearReel');
  const years = [...new Set(items.map(li => li.dataset.year))];
  reel.innerHTML = years.map(y => `<span>${y}</span>`).join('');
  const ticks = $('#dialTicks');
  let tk = '';
  for (let a = 0; a < 120; a++) {
    const long = a % 10 === 0, r1 = 196, r2 = long ? 172 : 184;
    const ang = a * 3 * Math.PI / 180;
    tk += `<line${long ? ' class="long"' : ''} x1="${(200 + r1 * Math.cos(ang)).toFixed(1)}" y1="${(200 + r1 * Math.sin(ang)).toFixed(1)}" x2="${(200 + r2 * Math.cos(ang)).toFixed(1)}" y2="${(200 + r2 * Math.sin(ang)).toFixed(1)}"/>`;
  }
  ticks.innerHTML = tk;
  const dial = $('.dial');
  let activeStory = -1;
  const setStory = (i, p) => {
    dial.style.transform = `rotate(${-p * 140}deg)`;
    if (i === activeStory) return; activeStory = i;
    const li = items[i];
    items.forEach((n, k) => n.classList.toggle('is-on', k === i));
    const shift = -items.slice(0, i).reduce((s, n) => s + n.offsetHeight, 0);
    items.forEach(n => n.style.setProperty('--shift', shift + 'px'));
    const yi = years.indexOf(li.dataset.year);
    reel.style.transform = `translateY(${-yi * reel.firstElementChild.offsetHeight}px)`;
    $('#yearRange').textContent = li.dataset.range;
    $('#yearCount').textContent = '0' + (i + 1);
    $('#yearBar').style.width = ((i + 1) / items.length * 100) + '%';
  };

  /* ── scroll loop ── */
  let lastY = 0, ticking = false;
  const sections = ['home', 'doors', 'story', 'contact'].map(id => document.getElementById(id));
  const navAs = $$('#navLinks a');
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !links.classList.contains('is-open'));
    lastY = y;
    const dp = progress(doorsSec);
    setDoor(clamp(Math.floor(dp * doors.length), 0, doors.length - 1));
    const sp = progress(storySec);
    setStory(clamp(Math.floor(sp * items.length), 0, items.length - 1), sp);
    let cur = sections[0];
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s; });
    navAs.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + cur.id && (cur.id !== 'doors' || +a.dataset.door === activeDoor)));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { activeStory = -1; onScroll(); });
  onScroll();
})();

/* ═════════ v2.1: loader, reveals, counters, stacking cards, cursor, magnetic buttons, tilt, dust ═════════ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* loader: the lamp switches on (once per visit) */
  const loader = $('#loader');
  let seen = false; try { seen = sessionStorage.getItem('dk-seen') === '1'; } catch (e) {}
  if (reduce || seen) loader.classList.add('is-gone');
  else {
    document.body.classList.add('is-loading');
    setTimeout(() => loader.classList.add('is-lit'), 450);
    setTimeout(() => { loader.classList.add('is-done'); document.body.classList.remove('is-loading'); }, 1500);
    setTimeout(() => loader.classList.add('is-gone'), 2600);
    try { sessionStorage.setItem('dk-seen', '1'); } catch (e) {}
  }

  /* headline words rise into place */
  const wrapWords = el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  };
  const reveals = $$('.reveal');
  reveals.forEach(wrapWords);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .3 });
  reveals.forEach(r => io.observe(r));

  /* counters */
  const fmt = (v, dec) => v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const count = el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = pre + fmt(end, dec) + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const step = now => {
      const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + fmt(end * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  $$('[data-count]').forEach(c => cio.observe(c));

  /* scroll progress + stacking cards */
  const bar = $('#progressBar'), cards = $$('.stack-card');
  cards.forEach((c, i) => c.style.setProperty('--n', i));
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (reduce) return;
    cards.forEach((c, i) => {
      const next = cards[i + 1]; if (!next) return;
      const dist = next.getBoundingClientRect().top - c.getBoundingClientRect().top;
      const p = clamp(1 - dist / c.offsetHeight, 0, 1);
      c.style.transform = `scale(${1 - p * .06})`;
      c.style.filter = `brightness(${1 - p * .3})`;
    });
  };
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();

  if (!reduce && fine) {
    /* custom cursor */
    const cur = $('#cursor'), label = $('#cursorLabel');
    document.body.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    const loop = () => { cx += (x - cx) * .22; cy += (y - cy) * .22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('pointerover', e => {
      const door = e.target.closest('.door'), cord = e.target.closest('#cord'), act = e.target.closest('a, button');
      let text = '';
      if (door) text = door.classList.contains('is-active') ? 'Enter' : 'Look';
      else if (cord) text = 'Pull';
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-big', !text && !!act);
    });

    /* magnetic buttons */
    $$('.btn, .back, .ability').forEach(b => {
      b.classList.add('magnetic');
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .35}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
    $$('.btn, .back, .ability').forEach(b => { b.style.transition = 'translate .35s cubic-bezier(.2,.8,.2,1), transform .25s, background .3s, color .3s'; });

    /* photo follows the mouse a little */
    const hero = $('#home'), img = $('.hero-photo img');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      img.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 4}deg) translate(${px * 14}px, ${py * 8}px)`;
    });
    hero.addEventListener('pointerleave', () => { img.style.transform = ''; });
  }

  /* dust floating in the lamp light (dark mode only) */
  if (!reduce) {
    const cv = $('#dust'), ctx = cv.getContext('2d');
    let w, h, dpr, parts = [];
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, w * h / 16000));
      parts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .4, vx: (Math.random() - .5) * .18, vy: -Math.random() * .25 - .05, a: Math.random() * Math.PI * 2 }));
    };
    size(); addEventListener('resize', size);
    const draw = () => {
      if (root.dataset.theme === 'dark' && !document.hidden) {
        ctx.clearRect(0, 0, w, h);
        const lx = w * .78, ly = h * .18;
        parts.forEach(p => {
          p.a += .01; p.x += p.vx + Math.sin(p.a) * .12; p.y += p.vy;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          const d = Math.hypot(p.x - lx, p.y - ly), glow = clamp(1 - d / (Math.max(w, h) * .75), .08, 1);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 214, 150, ${glow * .55})`; ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    };
    draw();
  }
})();
