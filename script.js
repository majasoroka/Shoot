// Target image paths
const headImages = [
  'images/head1.png',
  'images/head2.png',
  'images/head3.png',
  'images/head4.png',
  'images/head5.png'
];

// Game State Variables
let points = 0;
let pointsMultiplier = 1;
let baseGameTime = 30;
let remainingTime = 30;
let targetSize = 80; // in pixels
let isGameActive = false;
let gameTimer = null;
let spawnInterval = null;

// Upgrade Costs & Levels
let costs = {
  multiplier: 50,
  time: 75,
  size: 100
};

// DOM Elements
const pointsDisplay = document.getElementById('points-display');
const multiplierDisplay = document.getElementById('multiplier-display');
const timeDisplay = document.getElementById('time-display');
const gameArea = document.getElementById('game-area');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');

// Shop Buttons
const buyMultiplierBtn = document.getElementById('buy-multiplier');
const buyTimeBtn = document.getElementById('buy-time');
const buySizeBtn = document.getElementById('buy-size');

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

buyMultiplierBtn.addEventListener('click', () => {
  if (points >= costs.multiplier) {
    points -= costs.multiplier;
    pointsMultiplier *= 2;
    costs.multiplier = Math.floor(costs.multiplier * 2.5);
    buyMultiplierBtn.innerText = `Buy (${costs.multiplier} Points)`;
    updateUI();
  }
});

buyTimeBtn.addEventListener('click', () => {
  if (points >= costs.time) {
    points -= costs.time;
    baseGameTime += 10;
    costs.time = Math.floor(costs.time * 2);
    buyTimeBtn.innerText = `Buy (${costs.time} Points)`;
    updateUI();
  }
});

buySizeBtn.addEventListener('click', () => {
  if (points >= costs.size && targetSize < 160) {
    points -= costs.size;
    targetSize = Math.floor(targetSize * 1.25);
    costs.size = Math.floor(costs.size * 2);
    buySizeBtn.innerText = targetSize >= 160 ? 'MAXED OUT' : `Buy (${costs.size} Points)`;
    updateUI();
  }
});

function updateUI() {
  pointsDisplay.innerText = points;
  multiplierDisplay.innerText = `${pointsMultiplier}x`;
  timeDisplay.innerText = remainingTime;

  // Enable/Disable Upgrade Buttons
  buyMultiplierBtn.disabled = points < costs.multiplier;
  buyTimeBtn.disabled = points < costs.time;
  buySizeBtn.disabled = points < costs.size || targetSize >= 160;
}

function startGame() {
  isGameActive = true;
  remainingTime = baseGameTime;
  updateUI();

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');

  // Clear existing targets
  clearTargets();

  // Timer countdown
  gameTimer = setInterval(() => {
    remainingTime--;
    timeDisplay.innerText = remainingTime;

    if (remainingTime <= 0) {
      endGame();
    }
  }, 1000);

  // Target spawner
  spawnTarget();
  spawnInterval = setInterval(spawnTarget, 900);
}

function spawnTarget() {
  if (!isGameActive) return;

  // Limit max active targets on screen to 4
  if (document.querySelectorAll('.target-head').length >= 4) return;

  const target = document.createElement('img');
  const randomHead = headImages[Math.floor(Math.random() * headImages.length)];
  
  target.src = randomHead;
  target.classList.add('target-head');
  target.style.width = `${targetSize}px`;
  target.style.height = `${targetSize}px`;

  // Random positioning inside game area
  const maxX = gameArea.clientWidth - targetSize;
  const maxY = gameArea.clientHeight - targetSize;
  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);

  target.style.left = `${randomX}px`;
  target.style.top = `${randomY}px`;

  // Shooting logic
  target.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    points += 10 * pointsMultiplier;
    updateUI();
    target.remove();
  });

  gameArea.appendChild(target);

  // Auto-despawn target after 1.8 seconds if not shot
  setTimeout(() => {
    if (target.parentNode) {
      target.remove();
    }
  }, 1800);
}

function clearTargets() {
  const targets = document.querySelectorAll('.target-head');
  targets.forEach(t => t.remove());
}

function endGame() {
  isGameActive = false;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  clearTargets();

  finalScoreDisplay.innerText = points;
  gameOverScreen.classList.remove('hidden');
}

// Initial UI Refresh
updateUI();
