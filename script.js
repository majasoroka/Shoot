const headImages = [
  'images/head1.png',
  'images/head2.png',
  'images/head3.png',
  'images/head4.png',
  'images/head5.png'
];

// State Variables
let points = 0;
let pointsMultiplier = 1;
let baseGameTime = 30;
let remainingTime = 30;
let targetSize = 80;
let autoTurretActive = false;
let turretInterval = null;

let isGameActive = false;
let gameTimer = null;
let spawnInterval = null;

// Upgrade Costs
let costs = {
  multiplier: 50,
  time: 75,
  size: 100,
  turret: 200
};

// DOM Elements
const pointsDisplay = document.getElementById('points-display');
const multiplierDisplay = document.getElementById('multiplier-display');
const timeDisplay = document.getElementById('time-display');
const gameArea = document.getElementById('game-area');
const muzzleFlash = document.getElementById('muzzle-flash');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');

// Shop Buttons
const buyMultiplierBtn = document.getElementById('buy-multiplier');
const buyTimeBtn = document.getElementById('buy-time');
const buySizeBtn = document.getElementById('buy-size');
const buyTurretBtn = document.getElementById('buy-turret');

// Event Handlers for Touch and Mouse
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// General Shoot Recoil Effect on Miss Click Inside Arena
gameArea.addEventListener('pointerdown', (e) => {
  if (!isGameActive) return;
  triggerGunshotFX(e.clientX, e.clientY);
});

// Shop Listeners
buyMultiplierBtn.addEventListener('click', () => {
  if (points >= costs.multiplier) {
    points -= costs.multiplier;
    pointsMultiplier *= 2;
    costs.multiplier = Math.floor(costs.multiplier * 2.5);
    buyMultiplierBtn.innerText = `Buy (${costs.multiplier} Pts)`;
    updateUI();
  }
});

buyTimeBtn.addEventListener('click', () => {
  if (points >= costs.time) {
    points -= costs.time;
    baseGameTime += 10;
    costs.time = Math.floor(costs.time * 2);
    buyTimeBtn.innerText = `Buy (${costs.time} Pts)`;
    updateUI();
  }
});

buySizeBtn.addEventListener('click', () => {
  if (points >= costs.size && targetSize < 140) {
    points -= costs.size;
    targetSize = Math.floor(targetSize * 1.25);
    costs.size = Math.floor(costs.size * 2);
    buySizeBtn.innerText = targetSize >= 140 ? 'MAXED' : `Buy (${costs.size} Pts)`;
    updateUI();
  }
});

buyTurretBtn.addEventListener('click', () => {
  if (points >= costs.turret && !autoTurretActive) {
    points -= costs.turret;
    autoTurretActive = true;
    buyTurretBtn.innerText = 'OWNED';
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
}

function startGame() {
  isGameActive = true;
  remainingTime = baseGameTime;
  updateUI();

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');

  clearTargets();

  // Timer loop
  gameTimer = setInterval(() => {
    remainingTime--;
    timeDisplay.innerText = `${remainingTime}s`;
    if (remainingTime <= 0) endGame();
  }, 1000);

  // Spawner loop
  spawnTarget();
  spawnInterval = setInterval(spawnTarget, 850);

  // Auto Turret loop
  if (autoTurretActive) {
    turretInterval = setInterval(autoShootTarget, 1800);
  }
}

function triggerGunshotFX(x, y) {
  // Mobile Haptic Feedback
  if (navigator.vibrate) {
    navigator.vibrate(25);
  }

  // Recoil Screen Shake
  gameArea.classList.remove('recoil');
  void gameArea.offsetWidth; // force DOM reflow
  gameArea.classList.add('recoil');

  // Muzzle flash positioning
  const rect = gameArea.getBoundingClientRect();
  const flashX = x - rect.left;
  const flashY = y - rect.top;

  muzzleFlash.style.left = `${flashX}px`;
  muzzleFlash.style.top = `${flashY}px`;
  muzzleFlash.classList.remove('active');
  void muzzleFlash.offsetWidth;
  muzzleFlash.classList.add('active');
}

function spawnTarget() {
  if (!isGameActive) return;
  if (document.querySelectorAll('.target-head:not(.shot)').length >= 4) return;

  const target = document.createElement('img');
  const randomHead = headImages[Math.floor(Math.random() * headImages.length)];
  const isGolden = Math.random() < 0.15; // 15% chance for a golden bonus target

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

  // Direct touch listener for fast iPhone response
  target.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (target.classList.contains('shot')) return;

    hitTarget(target, e.clientX, e.clientY, isGolden);
  });

  gameArea.appendChild(target);

  setTimeout(() => {
    if (target.parentNode && !target.classList.contains('shot')) {
      target.remove();
    }
  }, 1900);
}

function hitTarget(target, clientX, clientY, isGolden) {
  target.classList.add('shot');

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
  if (!isGameActive) return;
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
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (turretInterval) clearInterval(turretInterval);
  clearTargets();

  finalScoreDisplay.innerText = points;
  gameOverScreen.classList.remove('hidden');
}

updateUI();
