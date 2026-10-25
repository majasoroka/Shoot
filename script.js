const headImages = [
  'images/head1.png',
  'images/head2.png',
  'images/head3.png',
  'images/head4.png',
  'images/head5.png'
];

// Audio FX Synthesizer (No external mp3 files needed)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
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
  } else if (type === 'buy') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// State Variables
let points = 0;
let pointsMultiplier = 1;
let baseGameTime = 30;
let remainingTime = 30;
let targetSize = 80;
let headLingerTime = 1900;
let autoTurretActive = false;

let isGameActive = false;
let isPaused = false;

let gameTimer = null;
let spawnInterval = null;
let turretInterval = null;

// Upgrade Costs
let costs = {
  multiplier: 50,
  time: 75,
  size: 100,
  turret: 200,
  slow: 150,
  frenzy: 120
};

// DOM Elements
const pointsDisplay = document.getElementById('points-display');
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
const buySizeBtn = document.getElementById('buy-size');
const buyTurretBtn = document.getElementById('buy-turret');
const buySlowBtn = document.getElementById('buy-slow');
const buyFrenzyBtn = document.getElementById('buy-frenzy');

// Event Handlers
startBtn.addEventListener('click', startGame);
mainStartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

shopToggleBtn.addEventListener('click', openShop);
closeShopBtn.addEventListener('click', closeShop);

gameArea.addEventListener('pointerdown', (e) => {
  if (!isGameActive || isPaused) return;
  triggerGunshotFX(e.clientX, e.clientY);
  playSound('shoot');
});

// Upgrades Implementation
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

buyTimeBtn.addEventListener('click', () => {
  if (points >= costs.time) {
    points -= costs.time;
    remainingTime += 10; // Adds 10 seconds immediately!
    baseGameTime += 10;  // Extends base time for future rounds!
    costs.time = Math.floor(costs.time * 2);
    buyTimeBtn.innerText = `Buy (${costs.time} Pts)`;
    playSound('buy');
    updateUI();
  }
});

buySizeBtn.addEventListener('click', () => {
  if (points >= costs.size && targetSize < 140) {
    points -= costs.size;
    targetSize = Math.floor(targetSize * 1.25);
    costs.size = Math.floor(costs.size * 2);
    buySizeBtn.innerText = targetSize >= 140 ? 'MAXED' : `Buy (${costs.size} Pts)`;
    playSound('buy');
    updateUI();
  }
});

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

buySlowBtn.addEventListener('click', () => {
  if (points >= costs.slow) {
    points -= costs.slow;
    headLingerTime = 3500;
    buySlowBtn.innerText = 'ACTIVE';
    buySlowBtn.disabled = true;
    playSound('buy');
    updateUI();
  }
});

buyFrenzyBtn.addEventListener('click', () => {
  if (points >= costs.frenzy && isGameActive) {
    points -= costs.frenzy;
    for (let i = 0; i < 4; i++) {
      spawnTarget();
    }
    playSound('buy');
    updateUI();
  }
});

function updateUI() {
  pointsDisplay.innerText = points;
  multiplierDisplay.innerText = `${pointsMultiplier}x`;
  timeDisplay.innerText = `${remainingTime}s`;

  buyMultiplierBtn.disabled = points < costs.multiplier;
  buyTimeBtn.disabled = points < costs.time;
  buySizeBtn.disabled = points < costs.size || targetSize >= 140;
  buyTurretBtn.disabled = points < costs.turret || autoTurretActive;
  buySlowBtn.disabled = points < costs.slow || headLingerTime > 2000;
  buyFrenzyBtn.disabled = points < costs.frenzy || !isGameActive;
}

function openShop() {
  if (!isGameActive) return;
  isPaused = true;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (turretInterval) clearInterval(turretInterval);
  shopModal.classList.remove('hidden');
  updateUI();
}

function closeShop() {
  shopModal.classList.add('hidden');
  if (isGameActive) {
    isPaused = false;
    resumeTimers();
  }
}

function resumeTimers() {
  gameTimer = setInterval(() => {
    remainingTime--;
    timeDisplay.innerText = `${remainingTime}s`;
    if (remainingTime <= 0) endGame();
  }, 1000);

  spawnInterval = setInterval(spawnTarget, 850);
  if (autoTurretActive) startTurret();
}

function startGame() {
  isGameActive = true;
  isPaused = false;
  remainingTime = baseGameTime;
  updateUI();

  startScreen.classList.add('hidden');
  shopModal.classList.add('hidden');
  gameOverScreen.classList.add('hidden');

  clearTargets();
  resumeTimers();
}

function startTurret() {
  if (turretInterval) clearInterval(turretInterval);
  turretInterval = setInterval(autoShootTarget, 1500);
}

function triggerGunshotFX(x, y) {
  if (navigator.vibrate) navigator.vibrate(25);

  gameArea.classList.remove('recoil');
  void gameArea.offsetWidth;
  gameArea.classList.add('recoil');

  const rect = gameArea.getBoundingClientRect();
  const flashX = x - rect.left;
  const flashY = y - rect.top;

  muzzleFlash.style.left = `${flashX}px`;
  muzzleFlash.style.top = `${flashY}px`;
  muzzleFlash.classList.remove('active');
  void muzzleFlash.offsetWidth;
  muzzleFlash.classList.add('active');

  spawnParticles(flashX, flashY);
}

function spawnParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * 35;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

    gameArea.appendChild(p);
    setTimeout(() => p.remove(), 400);
  }
}

function spawnTarget() {
  if (!isGameActive || isPaused) return;
  if (document.querySelectorAll('.target-head:not(.shot)').length >= 5) return;

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
  const randomX = Math.floor(Math.random() * maxX) + 10;
  const randomY = Math.floor(Math.random() * maxY) + 10;

  target.style.left = `${randomX}px`;
  target.style.top = `${randomY}px`;

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

function hitTarget(target, clientX, clientY, isGolden) {
  target.classList.add('shot');
  playSound('hit');

  const hitPoints = (isGolden ? 30 : 10) * pointsMultiplier;
  points += hitPoints;
  updateUI();

  triggerGunshotFX(clientX, clientY);
  showHitPopup(clientX, clientY, `+${hitPoints}`, isGolden);

  setTimeout(() => {
    if (target.parentNode) target.remove();
  }, 350);
}

function showHitPopup(x, y, text, isGolden) {
  const rect = gameArea.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.classList.add('hit-popup');
  if (isGolden) popup.classList.add('gold');
  popup.innerText = text;

  popup.style.left = `${x - rect.left}px`;
  popup.style.top = `${y - rect.top}px`;

  gameArea.appendChild(popup);
  setTimeout(() => popup.remove(), 600);
}

function autoShootTarget() {
  if (!isGameActive || isPaused) return;
  const activeTargets = document.querySelectorAll('.target-head:not(.shot)');
  if (activeTargets.length > 0) {
    const target = activeTargets[0];
    const rect = target.getBoundingClientRect();
    hitTarget(target, rect.left + rect.width / 2, rect.top + rect.height / 2, target.classList.contains('golden'));
  }
}

function clearTargets() {
  const targets = document.querySelectorAll('.target-head');
  targets.forEach(t => t.remove());
}

function endGame() {
  isGameActive = false;
  isPaused = false;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (turretInterval) clearInterval(turretInterval);
  clearTargets();

  finalScoreDisplay.innerText = points;
  gameOverScreen.classList.remove('hidden');
}

updateUI();
