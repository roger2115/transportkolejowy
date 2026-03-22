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
  activateSection(1); // start on intro (idx 1)
  setTimeout(randomGlitch, 4000);
  // map removed — no train animation
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
  const dp = document.getElementById('dp-clock');
  function update() {
    const now = new Date();
    const t = now.toLocaleTimeString('pl-PL', { hour12: false });
    if (el) el.textContent = t + ' // ' + now.toLocaleDateString('pl-PL');
    if (dp) dp.textContent = t;
  }
  update();
  setInterval(update, 1000);
}

// ============================================================
// SECTIONS
// ============================================================
const sections = ['eggs','intro','network','infra','mgmt','passenger','carriers','cargo','types','pros','cons','quiz','snake'];
let currentIdx = 1; // start on intro

// Map section labels
const mapLabels = {
  eggs:      'DOSTĘP ZASTRZEŻONY // UTAJNIONE',
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
  quiz:      'POLSKA // WERYFIKACJA WIEDZY',
  snake:     'POLSKA // SYMULATOR CIUCHCI',
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
  quiz:      ['WARSZAWA','GDAŃSK','KRAKÓW','WROCŁAW','POZNAŃ'],
  snake:     ['WARSZAWA','GDAŃSK','KRAKÓW','WROCŁAW','POZNAŃ','ŁÓDŹ','KATOWICE','LUBLIN','BIAŁYSTOK','SZCZECIN','RZESZÓW'],
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
  const pct = idx === 0 ? 0 : Math.round((idx / (sections.length - 1)) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';

  // Update map
  const sectionKey = sections[idx];
  document.getElementById('map-section-label').textContent = mapLabels[sectionKey] || 'POLSKA // SIEĆ KOLEJOWA';
  document.getElementById('ms-active').textContent = String(idx + 1).padStart(2, '0');
  // map removed

  playTransition();

  // Show/hide map score panels
  document.getElementById('quiz-map-score').style.display = sections[idx] === 'quiz' ? 'flex' : 'none';
  document.getElementById('snake-map-score').style.display = sections[idx] === 'snake' ? 'flex' : 'none';

  // Pause snake if leaving
  if (sections[idx] !== 'snake' && snakeRunning) snakePause();
}

function highlightMapCities(activeCities) { /* map removed */ }

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
  [{x:196,y:118},{x:188,y:88},{x:180,y:58},{x:174,y:38}],
  [{x:196,y:118},{x:196,y:148},{x:196,y:178},{x:196,y:210}],
  [{x:196,y:118},{x:160,y:128},{x:128,y:134},{x:96,y:138}],
  [{x:196,y:118},{x:168,y:148},{x:148,y:168}],
  [{x:196,y:118},{x:220,y:138},{x:244,y:158},{x:256,y:178}],
  [{x:196,y:210},{x:216,y:218},{x:240,y:228}],
  [{x:174,y:38},{x:206,y:40},{x:240,y:42}],
  [{x:96,y:138},{x:56,y:80}],
  [{x:118,y:210},{x:158,y:236},{x:196,y:210}],
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
// BAIT BUTTON RANDOM PULSES — no-op, eggs are now invisible
// ============================================================
function startBaitPulses() {
  // eggs are invisible hotspots, no pulse needed
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
  // Don't navigate sections when snake is active
  if (sections[currentIdx] === 'snake') return;
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
  runBoot().then(() => {
    animateHeader();
    setTimeout(randomGlitch, 4000);
    // map removed — no train animation
    startBaitPulses();
    initQuiz();
    initSnake();
  });
});

// ============================================================
// QUIZ ENGINE
// ============================================================
const quizQuestions = [
  {
    q: 'Ile kilometrów linii kolejowych liczy polska sieć kolejowa?',
    a: ['ok. 18 500 km', 'ok. 12 000 km', 'ok. 25 000 km', 'ok. 8 000 km'],
    c: 0, exp: 'Polska sieć kolejowa liczy ok. 18 513 km linii.'
  },
  {
    q: 'Jaki jest standardowy rozstaw szyn na polskiej kolei?',
    a: ['1520 mm', '1435 mm', '1000 mm', '1668 mm'],
    c: 1, exp: '1435 mm to europejski standard normalnotorowy.'
  },
  {
    q: 'Który przewoźnik obsługuje pociągi Pendolino (EIP) w Polsce?',
    a: ['PolRegio', 'Koleje Mazowieckie', 'PKP Intercity', 'Koleje Śląskie'],
    c: 2, exp: 'PKP Intercity obsługuje pociągi EIP na tabor ED250 Pendolino.'
  },
  {
    q: 'Jakie napięcie zasilania stosuje się w sieci trakcyjnej na większości linii w Polsce?',
    a: ['25 kV AC', '15 kV AC', '3 kV DC', '750 V DC'],
    c: 2, exp: 'Większość polskiej sieci trakcyjnej zasilana jest napięciem 3 kV DC.'
  },
  {
    q: 'Kto jest głównym zarządcą infrastruktury kolejowej w Polsce?',
    a: ['PKP Cargo S.A.', 'PKP Intercity S.A.', 'UTK', 'PKP Polskie Linie Kolejowe S.A.'],
    c: 3, exp: 'PKP PLK S.A. zarządza infrastrukturą kolejową w Polsce.'
  },
  {
    q: 'Jaka jest maksymalna prędkość pociągów na Centralnej Magistrali Kolejowej (CMK)?',
    a: ['160 km/h', '200 km/h', '250 km/h', '120 km/h'],
    c: 1, exp: 'Na CMK pociągi Pendolino osiągają prędkość do 200 km/h.'
  },
  {
    q: 'Który przewoźnik towarowy jest największy w Polsce i drugi w UE?',
    a: ['DB Cargo Polska', 'CTL Logistics', 'PKP Cargo S.A.', 'Lotos Kolej'],
    c: 2, exp: 'PKP Cargo S.A. to największy kolejowy przewoźnik towarowy w Polsce.'
  },
  {
    q: 'Co oznacza skrót ETCS w kontekście kolei?',
    a: ['European Train Control System', 'Electric Traction Control System', 'Express Train Corridor Standard', 'European Track Classification System'],
    c: 0, exp: 'ETCS — European Train Control System — europejski system sterowania ruchem.'
  },
  {
    q: 'Ile pasażerów rocznie korzysta z kolei w Polsce?',
    a: ['ok. 100 mln', 'ok. 500 mln', 'ok. 280 mln', 'ok. 50 mln'],
    c: 2, exp: 'Rocznie z kolei korzysta ponad 280 milionów pasażerów.'
  },
  {
    q: 'Który przewoźnik obsługuje połączenia regionalne w województwie śląskim?',
    a: ['Koleje Wielkopolskie', 'Łódzka Kolej Aglomeracyjna', 'Koleje Mazowieckie', 'Koleje Śląskie'],
    c: 3, exp: 'Koleje Śląskie obsługują połączenia w aglomeracji śląskiej.'
  },
];

let quizState = { idx: 0, score: 0, timer: null, timerVal: 15, answers: [], active: false };

function initQuiz() {
  document.getElementById('quiz-start-btn').addEventListener('click', startQuiz);
  document.getElementById('quiz-retry-btn').addEventListener('click', startQuiz);
}

function startQuiz() {
  initAudio();
  quizState = { idx: 0, score: 0, timer: null, timerVal: 15, answers: [], active: true };
  document.getElementById('quiz-intro').classList.add('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-game').classList.remove('hidden');
  document.getElementById('quiz-pill').textContent = '● AKTYWNY';
  showQuestion();
}

function showQuestion() {
  const q = quizQuestions[quizState.idx];
  document.getElementById('q-num').textContent = `${quizState.idx + 1}/10`;
  document.getElementById('q-score').textContent = quizState.score;
  document.getElementById('quiz-question-text').textContent = q.q;
  document.getElementById('quiz-feedback').classList.add('hidden');
  document.getElementById('quiz-score-label').textContent = `QUIZ: ${quizState.score}/10`;

  const answersEl = document.getElementById('quiz-answers');
  answersEl.innerHTML = '';
  const keys = ['A', 'B', 'C', 'D'];
  q.a.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer';
    btn.innerHTML = `<span class="ans-key">${keys[i]}</span>${ans}`;
    btn.addEventListener('click', () => selectAnswer(i));
    answersEl.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  clearInterval(quizState.timer);
  quizState.timerVal = 15;
  const timerEl = document.getElementById('q-timer');
  const fillEl = document.getElementById('q-timer-fill');
  timerEl.textContent = 15;
  timerEl.classList.remove('danger');
  fillEl.classList.remove('danger');
  fillEl.style.transition = 'none';
  fillEl.style.width = '100%';
  setTimeout(() => {
    fillEl.style.transition = 'width 15s linear';
    fillEl.style.width = '0%';
  }, 50);

  quizState.timer = setInterval(() => {
    quizState.timerVal--;
    timerEl.textContent = quizState.timerVal;
    if (quizState.timerVal <= 5) {
      timerEl.classList.add('danger');
      fillEl.classList.add('danger');
      playBeep(300, 0.1, 0.04);
    }
    if (quizState.timerVal <= 0) {
      clearInterval(quizState.timer);
      timeOut();
    }
  }, 1000);
}

function timeOut() {
  quizState.answers.push(false);
  revealAnswer(-1);
  showFeedback(false, '⏱ CZAS MINĄŁ — ' + quizQuestions[quizState.idx].exp);
  setTimeout(nextQuestion, 2200);
}

function selectAnswer(i) {
  if (!quizState.active) return;
  clearInterval(quizState.timer);
  const correct = quizQuestions[quizState.idx].c === i;
  quizState.answers.push(correct);
  if (correct) { quizState.score++; playBeep(880, 0.15, 0.07); }
  else { playBeep(180, 0.2, 0.06); }
  revealAnswer(i);
  showFeedback(correct, correct ? '✓ POPRAWNIE! ' + quizQuestions[quizState.idx].exp : '✗ BŁĄD — ' + quizQuestions[quizState.idx].exp);
  setTimeout(nextQuestion, 2000);
}

function revealAnswer(selected) {
  const btns = document.querySelectorAll('.quiz-answer');
  const correct = quizQuestions[quizState.idx].c;
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    else if (i === selected) btn.classList.add('wrong');
  });
}

function showFeedback(ok, text) {
  const el = document.getElementById('quiz-feedback');
  el.textContent = text;
  el.className = ok ? 'ok' : 'bad';
  el.classList.remove('hidden');
}

function nextQuestion() {
  quizState.idx++;
  if (quizState.idx >= quizQuestions.length) {
    endQuiz();
  } else {
    showQuestion();
  }
}

function endQuiz() {
  quizState.active = false;
  document.getElementById('quiz-game').classList.add('hidden');
  document.getElementById('quiz-result').classList.remove('hidden');
  document.getElementById('qr-pts').textContent = quizState.score;
  document.getElementById('quiz-pill').textContent = '● ZAKOŃCZONY';

  const ranks = ['DEBIUTANT','PASAŻER','KONDUKTOR','MASZYNISTA','DYREKTOR PKP'];
  const rank = ranks[Math.floor(quizState.score / 2.1)];
  document.getElementById('qr-rank').textContent = '// RANGA: ' + rank;

  const bd = document.getElementById('qr-breakdown');
  bd.innerHTML = '';
  quizState.answers.forEach((ok, i) => {
    const d = document.createElement('div');
    d.className = 'qr-dot ' + (ok ? 'ok' : 'bad');
    d.textContent = i + 1;
    bd.appendChild(d);
  });

  if (quizState.score >= 8) playBoot();
  else playBeep(440, 0.3, 0.06);
}

// ============================================================
// SNAKE ENGINE — CIUCHCIA
// ============================================================
const CELL = 20;
const COLS = 24;
const ROWS = 18;
let snakeRunning = false;
let snakePaused = false;
let snakeLoop = null;
let snake = [], dir = {x:1,y:0}, nextDir = {x:1,y:0};
let wagon = null, score = 0, best = 0, speed = 200;

function initSnake() {
  document.getElementById('snake-start-btn').addEventListener('click', startSnake);
  document.addEventListener('keydown', snakeKey);
  drawSnakeIdle();
}

function snakeKey(e) {
  const arrowKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  // Block scroll always when on snake section
  if (sections[currentIdx] === 'snake' && arrowKeys.includes(e.key)) e.preventDefault();
  if (sections[currentIdx] !== 'snake') return;
  const map = {
    ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
    w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0},
    W:{x:0,y:-1}, S:{x:0,y:1}, A:{x:-1,y:0}, D:{x:1,y:0},
  };
  if (e.key === 'Enter') {
    if (!snakeRunning) startSnake();
    else togglePause();
    return;
  }
  if (map[e.key]) {
    const nd = map[e.key];
    if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
  }
}

function startSnake() {
  initAudio();
  snake = [{x:6,y:9},{x:5,y:9},{x:4,y:9}];
  dir = {x:1,y:0}; nextDir = {x:1,y:0};
  score = 0; speed = 200;
  document.getElementById('s-wagons').textContent = 0;
  document.getElementById('s-speed').textContent = 'WOLNA';
  document.getElementById('snake-overlay').classList.add('hidden');
  snakeRunning = true; snakePaused = false;
  spawnWagon();
  clearInterval(snakeLoop);
  snakeLoop = setInterval(snakeTick, speed);
  document.getElementById('snake-pill').textContent = '● JEDZIE';
}

function togglePause() {
  snakePaused = !snakePaused;
  document.getElementById('snake-pill').textContent = snakePaused ? '● PAUZA' : '● JEDZIE';
}

function snakePause() {
  snakePaused = true;
  document.getElementById('snake-pill').textContent = '● PAUZA';
}

function spawnWagon() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  wagon = pos;
}

function snakeTick() {
  if (snakePaused) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { gameOver(); return; }
  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) { gameOver(); return; }

  snake.unshift(head);

  if (head.x === wagon.x && head.y === wagon.y) {
    score++;
    document.getElementById('s-wagons').textContent = score;
    document.getElementById('snake-score-label').textContent = 'WAGONY: ' + score;
    playBeep(660, 0.08, 0.06);
    spawnWagon();
    // Speed up every 5 wagons
    if (score % 5 === 0) {
      speed = Math.max(80, speed - 20);
      clearInterval(snakeLoop);
      snakeLoop = setInterval(snakeTick, speed);
      const spd = speed >= 160 ? 'WOLNA' : speed >= 120 ? 'ŚREDNIA' : speed >= 100 ? 'SZYBKA' : 'EKSPRES';
      document.getElementById('s-speed').textContent = spd;
      playBeep(880, 0.1, 0.07);
    }
  } else {
    snake.pop();
  }

  drawSnake();
}

function gameOver() {
  clearInterval(snakeLoop);
  snakeRunning = false;
  if (score > best) { best = score; document.getElementById('s-best').textContent = best; }
  playBeep(200, 0.4, 0.08);
  setTimeout(() => playBeep(150, 0.3, 0.06), 200);

  const overlay = document.getElementById('snake-overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div id="snake-overlay-title">💥 WYKOLEJENIE!</div>
    <div id="snake-gameover-score">WAGONY: ${score} &nbsp;|&nbsp; REKORD: ${best}</div>
    <div id="snake-overlay-sub">Pociąg wypadł z torów.</div>
    <button class="quiz-start-btn" id="snake-start-btn">↺ JEDŹ PONOWNIE</button>
  `;
  document.getElementById('snake-start-btn').addEventListener('click', startSnake);
  document.getElementById('snake-pill').textContent = '● WYKOLEJENIE';
  drawSnake();
}

function drawSnakeIdle() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050a06';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx);
}

function drawSnake() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050a06';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx);

  // Draw wagon (pickup)
  if (wagon) {
    const wx = wagon.x * CELL, wy = wagon.y * CELL;
    // Wagon shape
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.fillRect(wx + 2, wy + 4, CELL - 4, CELL - 8);
    // Wheels
    ctx.fillStyle = '#ffaa00';
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(wx + 5, wy + CELL - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx + CELL - 5, wy + CELL - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    // Pulse ring
    ctx.strokeStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1;
    ctx.strokeRect(wx + 1, wy + 1, CELL - 2, CELL - 2);
    ctx.shadowBlur = 0;
  }

  // Draw snake (train)
  snake.forEach((seg, i) => {
    const sx = seg.x * CELL, sy = seg.y * CELL;
    if (i === 0) {
      // Locomotive head
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 12;
      ctx.fillRect(sx + 1, sy + 2, CELL - 2, CELL - 4);
      // Chimney
      ctx.fillStyle = '#00cc66';
      ctx.fillRect(sx + 3, sy, 4, 4);
      // Window
      ctx.fillStyle = '#001a0e';
      ctx.fillRect(sx + CELL - 7, sy + 4, 5, 5);
      // Wheels
      ctx.fillStyle = '#00ff88';
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(sx + 5, sy + CELL - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + CELL - 5, sy + CELL - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Wagon body
      const alpha = Math.max(0.3, 1 - i * 0.04);
      ctx.fillStyle = `rgba(0,${Math.floor(180 - i * 4)},${Math.floor(100 - i * 2)},${alpha})`;
      ctx.shadowColor = '#00cc66';
      ctx.shadowBlur = 4;
      ctx.fillRect(sx + 2, sy + 4, CELL - 4, CELL - 8);
      // Wheels
      ctx.fillStyle = `rgba(0,200,100,${alpha})`;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(sx + 4, sy + CELL - 4, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + CELL - 4, sy + CELL - 4, 2, 0, Math.PI * 2); ctx.fill();
      // Connector
      if (i < snake.length - 1) {
        const ns = snake[i + 1];
        ctx.strokeStyle = `rgba(0,150,80,${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + CELL / 2, sy + CELL / 2);
        ctx.lineTo(ns.x * CELL + CELL / 2, ns.y * CELL + CELL / 2);
        ctx.stroke();
      }
    }
  });

  // Score overlay
  ctx.fillStyle = 'rgba(0,255,136,0.6)';
  ctx.font = '10px monospace';
  ctx.fillText(`WAGONY: ${score}`, 6, 14);
}

function drawGrid(ctx) {
  ctx.strokeStyle = '#0d2010';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke();
  }
  // Track lines
  ctx.strokeStyle = '#0a1a0e';
  ctx.lineWidth = 1;
  for (let y = 0; y < ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL + CELL / 2); ctx.lineTo(COLS * CELL, y * CELL + CELL / 2); ctx.stroke();
  }
}

// ============================================================
// INIT QUIZ + SNAKE — called from main DOMContentLoaded above
// ============================================================
