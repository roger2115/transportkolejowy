// ============================================================
// AUDIO ENGINE
// ============================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx;

function initAudio() {
  if (!ctx) ctx = new AudioCtx();
}

function playClick(freq = 800, dur = 0.04, vol = 0.08) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + dur);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(); osc.stop(ctx.currentTime + dur);
}

function playBeep(freq = 440, dur = 0.1, vol = 0.07) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(); osc.stop(ctx.currentTime + dur);
}

function playTransition() {
  if (!ctx) return;
  [600, 800, 1000].forEach((f, i) => setTimeout(() => playBeep(f, 0.07, 0.06), i * 40));
}

function playBoot() {
  if (!ctx) return;
  [200, 300, 400, 600, 800, 1200].forEach((f, i) => setTimeout(() => playBeep(f, 0.1, 0.05), i * 80));
}

function playTypeSound() {
  if (!ctx) return;
  playClick(600 + Math.random() * 400, 0.025, 0.05);
}

// ============================================================
// BOOT SEQUENCE
// ============================================================
const bootLines = [
  '> INICJALIZACJA SYSTEMU BRIEFINGU...',
  '> ŁADOWANIE MODUŁÓW DANYCH...',
  '> WERYFIKACJA DOSTĘPU: PUBLICZNY',
  '> ŁĄCZENIE Z BAZĄ DANYCH PKP PLK S.A...',
  '> POBIERANIE DANYCH INFRASTRUKTURY...',
  '> KALIBRACJA INTERFEJSU HUD...',
  '> SPRAWDZANIE INTEGRALNOŚCI DANYCH...',
  '> WSZYSTKIE SYSTEMY GOTOWE.',
  '> URUCHAMIANIE BRIEFINGU OPERACYJNEGO...',
];

async function runBoot() {
  const el = document.getElementById('boot-text');
  const bar = document.getElementById('boot-bar-fill');
  const status = document.getElementById('boot-status');

  for (let i = 0; i < bootLines.length; i++) {
    await typeText(el, bootLines[i] + '\n', 16);
    playTypeSound();
    bar.style.width = ((i + 1) / bootLines.length * 100) + '%';
    status.textContent = bootLines[i].replace('> ', '');
    await sleep(100);
  }

  await sleep(400);
  playBoot();
  await sleep(700);

  const screen = document.getElementById('boot-screen');
  screen.style.transition = 'opacity 0.5s';
  screen.style.opacity = '0';
  await sleep(500);
  screen.style.display = 'none';
  document.getElementById('main').classList.remove('hidden');

  startClock();
  activateSection(0);
  animateHeader();
  setTimeout(randomGlitch, 4000);
  startTrainAnimation();
  startBaitPulses();
}

function typeText(el, text, delay = 30) {
  return new Promise(resolve => {
    let i = 0;
    function next() {
      if (i < text.length) {
        el.textContent += text[i++];
        el.scrollTop = el.scrollHeight;
        setTimeout(next, delay + Math.random() * 8);
      } else resolve();
    }
    next();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// CLOCK
// ============================================================
function startClock() {
  const el = document.getElementById('clock');
  function update() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('pl-PL', { hour12: false }) + ' // ' + now.toLocaleDateString('pl-PL');
  }
  update();
  setInterval(update, 1000);
}

// ============================================================
// SECTIONS
// ============================================================
const sections = ['intro','network','infra','mgmt','passenger','carriers','cargo','types','pros','cons'];
let currentIdx = 0;

// Map section labels
const mapLabels = {
  intro:     'POLSKA // PRZEGLĄD OGÓLNY',
  network:   'POLSKA // SIEĆ KOLEJOWA',
  infra:     'POLSKA // INFRASTRUKTURA',
  mgmt:      'POLSKA // ZARZĄDZANIE PKP PLK',
  passenger: 'POLSKA // RUCH PASAŻERSKI',
  carriers:  'POLSKA // PRZEWOŹNICY',
  cargo:     'POLSKA // TRANSPORT TOWAROWY',
  types:     'POLSKA // TABOR KOLEJOWY',
  pros:      'POLSKA // ANALIZA POZYTYWNA',
  cons:      'POLSKA // ANALIZA RYZYKA',
};

// City highlights per section
const sectionCities = {
  intro:     ['WARSZAWA','GDAŃSK','KRAKÓW','WROCŁAW','POZNAŃ'],
  network:   ['WARSZAWA','GDAŃSK','KRAKÓW','WROCŁAW','POZNAŃ','ŁÓDŹ','KATOWICE','LUBLIN','BIAŁYSTOK','SZCZECIN','RZESZÓW'],
  infra:     ['WARSZAWA','KRAKÓW'],
  mgmt:      ['WARSZAWA'],
  passenger: ['WARSZAWA','GDAŃSK','KRAKÓW','WROCŁAW','POZNAŃ','ŁÓDŹ'],
  carriers:  ['WARSZAWA','ŁÓDŹ','KATOWICE','POZNAŃ'],
  cargo:     ['GDAŃSK','SZCZECIN','KATOWICE','WARSZAWA'],
  types:     ['WARSZAWA','KRAKÓW','GDAŃSK','WROCŁAW'],
  pros:      ['WARSZAWA','GDAŃSK','KRAKÓW','WROCŁAW','POZNAŃ','ŁÓDŹ','KATOWICE','LUBLIN','BIAŁYSTOK','SZCZECIN','RZESZÓW'],
  cons:      ['WARSZAWA'],
};

function activateSection(idx) {
  if (idx < 0 || idx >= sections.length) return;

  const prev = document.querySelector('.section.active');
  if (prev) {
    prev.classList.add('exit');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('exit'), 350);
  }

  const next = document.getElementById('sec-' + sections[idx]);
  if (!next) return;

  setTimeout(() => {
    next.classList.add('active');
    restartAnimations(next);
    startCounters(next);
  }, 120);

  document.querySelectorAll('.nav-item').forEach((li, i) => li.classList.toggle('active', i === idx));

  currentIdx = idx;
  const pct = Math.round(((idx + 1) / sections.length) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';

  // Update map
  const sectionKey = sections[idx];
  document.getElementById('map-section-label').textContent = mapLabels[sectionKey] || 'POLSKA // SIEĆ KOLEJOWA';
  document.getElementById('ms-active').textContent = 'AKTYWNA SEKCJA: ' + String(idx + 1).padStart(2, '0');
  highlightMapCities(sectionCities[sectionKey] || []);

  playTransition();
}

function highlightMapCities(activeCities) {
  // Dim all
  document.querySelectorAll('#poland-map .city-dots circle').forEach(c => { c.style.opacity = '0.25'; });
  document.querySelectorAll('#poland-map .city-dots text').forEach(t => { t.style.opacity = '0.25'; });
  // Brighten active
  activeCities.forEach(city => {
    document.querySelectorAll('#poland-map .city-dots text').forEach(t => {
      if (t.textContent.trim() === city) {
        t.style.opacity = '1';
        t.style.filter = 'drop-shadow(0 0 4px currentColor)';
        let el = t.previousElementSibling;
        while (el) { el.style.opacity = '1'; el = el.previousElementSibling; if (!el || el.tagName !== 'circle') break; }
        // just brighten all circles near this text
        const siblings = t.parentElement.querySelectorAll('circle');
        siblings.forEach(s => { if (Math.abs(parseFloat(s.getAttribute('cx')) - parseFloat(t.getAttribute('x'))) < 30) s.style.opacity = '1'; });
      }
    });
  });
}

function restartAnimations(section) {
  const els = section.querySelectorAll('.stat-item,.spec-card,.carrier-card,.type-card,.pro-item,.con-item,.org-node,.text-block p,.icon-badge,.ct-item');
  els.forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
  });
  // Re-trigger header line
  const hdr = section.querySelector('.sec-header');
  if (hdr) {
    hdr.style.setProperty('--line', '0');
    const after = hdr;
    after.style.animation = 'none';
    after.offsetHeight;
    after.style.animation = '';
  }
}

// ============================================================
// COUNTERS — quieter tick sound
// ============================================================
function startCounters(section) {
  section.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const duration = 1200; // ms
    const steps = 50;
    const stepVal = target / steps;
    const stepTime = duration / steps;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      current = Math.min(Math.round(stepVal * tick), target);
      el.textContent = current.toLocaleString('pl-PL');
      // Very quiet tick — only every 5 steps
      if (tick % 5 === 0) playClick(300 + (current / target) * 300, 0.02, 0.02);
      if (current >= target) clearInterval(interval);
    }, stepTime);
  });
}

// ============================================================
// TRAIN ANIMATION ON MAP
// ============================================================
const trainRoutes = [
  [{x:185,y:128},{x:185,y:100},{x:185,y:70},{x:185,y:58}],
  [{x:185,y:128},{x:185,y:160},{x:185,y:190},{x:185,y:218}],
  [{x:185,y:128},{x:155,y:138},{x:125,y:146},{x:100,y:152}],
  [{x:185,y:128},{x:165,y:158},{x:148,y:188},{x:130,y:228}],
  [{x:185,y:218},{x:205,y:228},{x:238,y:238}],
  [{x:185,y:58},{x:210,y:56},{x:238,y:54}],
  [{x:100,y:152},{x:62,y:96}],
];
let trainRouteIdx = 0;
let trainPosIdx = 0;

function startTrainAnimation() {
  const dot = document.getElementById('train-dot');
  const ring = document.getElementById('train-dot-ring');
  if (!dot) return;

  function moveTrain() {
    const route = trainRoutes[trainRouteIdx];
    const pos = route[trainPosIdx];
    dot.setAttribute('cx', pos.x);
    dot.setAttribute('cy', pos.y);
    if (ring) { ring.setAttribute('cx', pos.x); ring.setAttribute('cy', pos.y); }

    trainPosIdx++;
    if (trainPosIdx >= route.length) {
      trainPosIdx = 0;
      trainRouteIdx = (trainRouteIdx + 1) % trainRoutes.length;
      setTimeout(moveTrain, 600);
    } else {
      setTimeout(moveTrain, 350);
    }
  }
  moveTrain();
}

// ============================================================
// BAIT BUTTON RANDOM PULSES
// ============================================================
function startBaitPulses() {
  const baits = document.querySelectorAll('.bait-btn');
  function pulse() {
    const btn = baits[Math.floor(Math.random() * baits.length)];
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 700);
    setTimeout(pulse, 4000 + Math.random() * 8000);
  }
  setTimeout(pulse, 6000);
}

// ============================================================
// GLITCH
// ============================================================
function randomGlitch() {
  const title = document.querySelector('.section.active .sec-title');
  if (title) {
    title.classList.add('glitch-flash');
    setTimeout(() => title.classList.remove('glitch-flash'), 250);
    if (Math.random() > 0.75) playBeep(150 + Math.random() * 80, 0.04, 0.02);
  }
  setTimeout(randomGlitch, 3500 + Math.random() * 8000);
}

// ============================================================
// HEADER TYPEWRITER
// ============================================================
function animateHeader() {
  const el = document.getElementById('header-type');
  const text = 'TRANSPORT KOLEJOWY // BRIEFING OPERACYJNY';
  let i = 0;
  function next() {
    if (i < text.length) {
      el.textContent += text[i++];
      playTypeSound();
      setTimeout(next, 35 + Math.random() * 15);
    }
  }
  next();
}

// ============================================================
// NAV EVENTS
// ============================================================
document.querySelectorAll('.nav-item').forEach((li, i) => {
  li.addEventListener('click', () => { initAudio(); playClick(900, 0.04, 0.07); activateSection(i); });
});

document.getElementById('btn-next').addEventListener('click', () => { initAudio(); playClick(1000, 0.04, 0.07); activateSection(currentIdx + 1); });
document.getElementById('btn-prev').addEventListener('click', () => { initAudio(); playClick(700, 0.04, 0.07); activateSection(currentIdx - 1); });

document.addEventListener('keydown', e => {
  initAudio();
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { playClick(1000, 0.03, 0.06); activateSection(currentIdx + 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { playClick(700, 0.03, 0.06); activateSection(currentIdx - 1); }
});

document.addEventListener('click', e => {
  initAudio();
  if (!e.target.closest('.nav-item') && !e.target.closest('.nav-btn')) {
    playClick(600 + Math.random() * 200, 0.025, 0.05);
  }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });
  runBoot();
});
