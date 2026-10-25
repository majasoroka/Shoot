const headImages = [
  'images/head1.png',
  'images/head2.png',
  'images/head3.png',
  'images/head4.png',
  'images/head5.png'
];

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'shoot') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === 'hit') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'crit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'buy') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'bomb') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

// Game State Variables
let points = 0;
let pointsMultiplier = 1;
let combo = 0;
let baseGameTime = 30;
let remainingTime = 30;
let targetSize = 75;
let headLingerTime = 1800;
let autoTurretActive = false;
let hasShield = false;
let hasCrit = false;

let isGameActive = false;
let isPaused = false;

let gameTimer = null;
let spawnInterval = null;
let turretInterval = null;
let moveInterval = null;

// Upgrade Costs
let costs = {
  multiplier: 50,
  time: 75,
  shield: 90,
  crit: 110,
  turret: 200,
  frenzy: 80
};

// DOM Elements
const pointsDisplay = document.getElementById('points-display');
const comboDisplay = document.getElementById('combo-display');
const multiplierDisplay = document.getElementById('multiplier-display');
const timeDisplay = document.getElementById('time-display');
const gameArea = document.getElementById('game-area');
const muzzleFlash = document.getElementById('muzzle-flash');
const startBtn = document.getElementById('start-btn');
const mainStartBtn = document.getElementById('main-start-btn');
const restartBtn = document.getElementById('restart-btn');
const shopToggleBtn = document.getElementById('shop-toggle-btn');
const closeShopBtn = document.getElementById('close-shop-btn');

const startScreen = document.getElementById('start-screen');
const shopModal = document.getElementById('shop-modal');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');

// Shop Buttons
const buyMultiplierBtn = document.getElementById('buy-multiplier');
const buyTimeBtn = document.getElementById('buy-time');
const buyShieldBtn = document.getElementById('buy-shield');
const buyCritBtn = document.getElementById('buy-crit');
const buyTurretBtn = document.getElementById('buy-turret');
const buyFrenzyBtn = document.getElementById('buy-frenzy');

// Event Listeners
if (startBtn) startBtn.addEventListener('click', startGame);
if (mainStartBtn) mainStartBtn.addEventListener('click', startGame);
if (restartBtn) restartBtn.addEventListener('click', startGame);

if (shopToggleBtn) shopToggleBtn.addEventListener('click', openShop);
if (closeShopBtn) closeShopBtn.addEventListener('click', closeShop);

if (gameArea) {
  gameArea.addEventListener('pointerdown', (e) => {
    if (!isGameActive || isPaused) return;
    triggerGunshotFX(e.clientX, e.clientY);
    playSound('shoot');
    // Miss penalty: reset combo if clicking empty background
    if (e.target === gameArea || e.target === muzzleFlash) {
      combo = 0;
      updateUI();
    }
  });
}

// Shop Upgrades
if (buyMultiplierBtn) {
  buyMultiplierBtn.addEventListener('click', () => {
    if (points >= costs.multiplier) {
      points -= costs.multiplier;
      pointsMultiplier *= 2;
      costs.multiplier = Math.floor(costs.multiplier * 2.5);
      buyMultiplierBtn.innerText = `Buy (${costs.multiplier} Pts)`;
      playSound('buy');
      updateUI();
    }
  });
}

if (buyTimeBtn) {
  buyTimeBtn.addEventListener('click', () => {
    if (points >= costs.time) {
      points -= costs.time;
      remainingTime += 10;
      baseGameTime += 10;
      costs.time = Math.floor(costs.time * 2);
      buyTimeBtn.innerText = `Buy (${costs.time} Pts)`;
      playSound('buy');
      updateUI();
    }
  });
}

if (buyShieldBtn) {
  buyShieldBtn.addEventListener('click', () => {
    if (points >= costs.shield && !hasShield) {
      points -= costs.shield;
      hasShield = true;
      buyShieldBtn.innerText = 'ACTIVE 🛡️';
      buyShieldBtn.disabled = true;
      playSound('buy');
      updateUI();
    }
  });
}

if (buyCritBtn) {
  buyCritBtn.addEventListener('click', () => {
    if (points >= costs.crit && !hasCrit) {
      points -= costs.crit;
      hasCrit = true;
      buyCritBtn.innerText = 'ACTIVE 💥';
      buyCritBtn.disabled = true;
      playSound('buy');
      updateUI();
    }
  });
}

if (buyTurretBtn) {
  buyTurretBtn.addEventListener('click', () => {
    if (points >= costs.turret && !autoTurretActive) {
      points -= costs.turret;
      autoTurretActive = true;
      buyTurretBtn.innerText = 'OWNED';
      playSound('buy');
      if (isGameActive && !isPaused) startTurret();
      updateUI();
    }
  });
}

if (buyFrenzyBtn) {
  buyFrenzyBtn.addEventListener('click', () => {
    if (points >= costs.frenzy && isGameActive && !isPaused) {
      points -= costs.frenzy;
      playSound('buy');
      // FIXED: Instant frenzy burst of 5 targets
      for (let i = 0; i < 5; i++) {
        spawnEntity(false);
      }
      updateUI();
    }
  });
}

function updateUI() {
  if (pointsDisplay) pointsDisplay.innerText = points;
  if (comboDisplay) comboDisplay.innerText = `${combo}x`;
  if (multiplierDisplay) multiplierDisplay.innerText = `${pointsMultiplier}x`;
  if (timeDisplay) timeDisplay.innerText = `${remainingTime}s`;

  if (buyMultiplierBtn) buyMultiplierBtn.disabled = points < costs.multiplier;
  if (buyTimeBtn) buyTimeBtn.disabled = points < costs.time;
  if (buyShieldBtn) buyShieldBtn.disabled = points < costs.shield || hasShield;
  if (buyCritBtn) buyCritBtn.disabled = points < costs.crit || hasCrit;
  if (buyTurretBtn) buyTurretBtn.disabled = points < costs.turret || autoTurretActive;
  if (buyFrenzyBtn) buyFrenzyBtn.disabled = points < costs.frenzy || !isGameActive;
}

function openShop() {
  if (!isGameActive) return;
  isPaused = true;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (turretInterval) clearInterval(turretInterval);
  if (moveInterval) clearInterval(moveInterval);
  if (shopModal) shopModal.classList.remove('hidden');
  updateUI();
}

function closeShop() {
  if (shopModal) shopModal.classList.add('hidden');
  if (isGameActive) {
    isPaused = false;
    resumeTimers();
  }
}

function resumeTimers() {
  gameTimer = setInterval(() => {
    remainingTime--;
    if (timeDisplay) timeDisplay.innerText = `${remainingTime}s`;
    if (remainingTime <= 0) endGame();
  }, 1000);

  spawnInterval = setInterval(() => spawnEntity(), 750);
  moveInterval = setInterval(moveTargets, 50); // Moving targets physics loop
  if (autoTurretActive) startTurret();
}

function startGame() {
  initAudio();
  isGameActive = true;
  isPaused = false;
  points = 0;
  combo = 0;
  pointsMultiplier = 1;
  remainingTime = baseGameTime;
  updateUI();

  if (startScreen) startScreen.classList.add('hidden');
  if (shopModal) shopModal.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');

  clearEntities();
  resumeTimers();
}

function startTurret() {
  if (turretInterval) clearInterval(turretInterval);
  turretInterval = setInterval(autoShootTarget, 1200);
}

function triggerGunshotFX(x, y) {
  if (navigator.vibrate) navigator.vibrate(25);

  if (gameArea) {
    gameArea.classList.remove('recoil');
    void gameArea.offsetWidth;
    gameArea.classList.add('recoil');

    const rect = gameArea.getBoundingClientRect();
    const flashX = x - rect.left;
    const flashY = y - rect.top;

    if (muzzleFlash) {
      muzzleFlash.style.left = `${flashX}px`;
      muzzleFlash.style.top = `${flashY}px`;
      muzzleFlash.classList.remove('active');
      void muzzleFlash.offsetWidth;
      muzzleFlash.classList.add('active');
    }

    spawnParticles(flashX, flashY, false);
  }
}

function spawnParticles(x, y, isBomb) {
  for (let i = 0; i < (isBomb ? 12 : 6); i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    if (isBomb) p.classList.add('bomb-part');
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = (isBomb ? 40 : 25) + Math.random() * 40;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

    gameArea.appendChild(p);
    setTimeout(() => p.remove(), 400);
  }
}

function spawnEntity(forceBombCheck = true) {
  if (!isGameActive || isPaused || !gameArea) return;
  if (gameArea.querySelectorAll('.target-head:not(.shot), .target-bomb').length >= 6) return;

  const isBomb = forceBombCheck && Math.random() < 0.22;

  if (isBomb) {
    const bomb = document.createElement('div');
    bomb.classList.add('target-bomb');
    bomb.innerHTML = '💣';

    const maxX = gameArea.clientWidth - 70;
    const maxY = gameArea.clientHeight - 70;
    bomb.style.left = `${Math.floor(Math.random() * maxX) + 10}px`;
    bomb.style.top = `${Math.floor(Math.random() * maxY) + 10}px`;

    bomb.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (isPaused) return;
      hitBomb(bomb, e.clientX, e.clientY);
    });

    gameArea.appendChild(bomb);

    setTimeout(() => {
      if (bomb.parentNode && !isPaused) bomb.remove();
    }, headLingerTime);

  } else {
    const target = document.createElement('img');
    const randomHead = headImages[Math.floor(Math.random() * headImages.length)];
    const isGolden = Math.random() < 0.15;

    target.src = randomHead;
    target.classList.add('target-head');
    if (isGolden) target.classList.add('golden');

    target.style.width = `${targetSize}px`;
    target.style.height = `${targetSize}px`;

    const maxX = gameArea.clientWidth - targetSize - 20;
    const maxY = gameArea.clientHeight - targetSize - 20;
    let posX = Math.floor(Math.random() * maxX) + 10;
    let posY = Math.floor(Math.random() * maxY) + 10;

    target.style.left = `${posX}px`;
    target.style.top = `${posY}px`;

    // Assign random drift velocity for moving target mechanics
    target.dataset.vx = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.2);

    target.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (target.classList.contains('shot') || isPaused) return;
      hitTarget(target, e.clientX, e.clientY, isGolden);
    });

    gameArea.appendChild(target);

    setTimeout(() => {
      if (target.parentNode && !target.classList.contains('shot') && !isPaused) {
        target.remove();
      }
    }, headLingerTime);
  }
}

// Move targets smoothly left & right across the arena
function moveTargets() {
  if (!isGameActive || isPaused || !gameArea) return;
  const targets = gameArea.querySelectorAll('.target-head:not(.shot)');
  const maxW = gameArea.clientWidth - targetSize;

  targets.forEach(t => {
    let currentLeft = parseFloat(t.style.left) || 0;
    let vx = parseFloat(t.dataset.vx) || 1;

    currentLeft += vx;
    if (currentLeft <= 5 || currentLeft >= maxW - 5) {
      t.dataset.vx = -vx; // Bounce off walls
    }
    t.style.left = `${currentLeft}px`;
  });
}

function hitTarget(target, clientX, clientY, isGolden) {
  target.classList.add('shot');
  combo++;
  
  let isCrit = hasCrit && Math.random() < 0.25;
  let basePoints = isGolden ? 30 : 10;
  let comboBonus = Math.floor(combo / 3); // Extra bonus every 3 combo streak
  let hitPoints = (basePoints + comboBonus) * pointsMultiplier;

  if (isCrit) {
    hitPoints *= 3;
    playSound('crit');
  } else {
    playSound('hit');
  }

  points += hitPoints;
  updateUI();

  triggerGunshotFX(clientX, clientY);
  
  if (isCrit) {
    showPopup(clientX, clientY, `CRIT! +${hitPoints}`, 'crit');
  } else {
    showPopup(clientX, clientY, `+${hitPoints}`, isGolden ? 'gold' : '');
  }

  setTimeout(() => {
    if (target.parentNode) target.remove();
  }, 350);
}

function hitBomb(bomb, clientX, clientY) {
  bomb.remove();
  combo = 0; // Reset combo streak

  if (hasShield) {
    hasShield = false;
    playSound('buy');
    updateUI();
    showPopup(clientX, clientY, 'SHIELD BLOCKED!', 'shield');
    return;
  }

  playSound('bomb');
  if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

  points = 0; // Wipe out score penalty
  updateUI();

  gameArea.classList.remove('danger-flash');
  void gameArea.offsetWidth;
  gameArea.classList.add('danger-flash');

  const rect = gameArea.getBoundingClientRect();
  spawnParticles(clientX - rect.left, clientY - rect.top, true);
  showPopup(clientX, clientY, 'BOOM! 0 PTS!', 'penalty');
}

function showPopup(x, y, text, customClass) {
  const rect = gameArea.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.classList.add('hit-popup');
  if (customClass) popup.classList.add(customClass);
  popup.innerText = text;

  popup.style.left = `${x - rect.left}px`;
  popup.style.top = `${y - rect.top}px`;

  gameArea.appendChild(popup);
  setTimeout(() => popup.remove(), 600);
}

function autoShootTarget() {
  if (!isGameActive || isPaused || !gameArea) return;
  const activeTargets = gameArea.querySelectorAll('.target-head:not(.shot)');
  if (activeTargets.length > 0) {
    const target = activeTargets[0];
    const rect = target.getBoundingClientRect();
    hitTarget(target, rect.left + rect.width / 2, rect.top + rect.height / 2, target.classList.contains('golden'));
  }
}

function clearEntities() {
  if (!gameArea) return;
  const entities = gameArea.querySelectorAll('.target-head, .target-bomb');
  entities.forEach(e => e.remove());
}

function endGame() {
  isGameActive = false;
  isPaused = false;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (turretInterval) clearInterval(turretInterval);
  if (moveInterval) clearInterval(moveInterval);
  clearEntities();

  if (finalScoreDisplay) finalScoreDisplay.innerText = points;
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}

updateUI();
