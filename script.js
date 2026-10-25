const headImages = [
  'images/head1.png',
  'images/head2.png',
  'images/head3.png',
  'images/head4.png',
  'images/head5.png',
  'images/head6.png',
  'images/head7.png',
  'images/head8.png',
  'images/head9.png'
];

const flagImages = [
  'images/flag1.png',
  'images/flag2.png'
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

// Realistic gunshot audio generator using white-noise buffers and deep bass punch
function playGunshotSound(isBomb = false) {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  if (isBomb) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampValueAtTime(20, now + 0.5);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
    return;
  }

  // Gunshot transient noise buffer
  const bufferSize = audioCtx.sampleRate * 0.18;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampValueAtTime(100, now + 0.18);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.9, now);
  gain.gain.exponentialRampValueAtTime(0.01, now + 0.18);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(now);
  noise.stop(now + 0.18);
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
const weaponGun = document.getElementById('weapon-gun');

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
    playGunshotSound(false);
    if (e.target === gameArea || e.target === muzzleFlash || e.target === weaponGun) {
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
      playGunshotSound(false);
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
      playGunshotSound(false);
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
      playGunshotSound(false);
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
      playGunshotSound(false);
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
      playGunshotSound(false);
      if (isGameActive && !isPaused) startTurret();
      updateUI();
    }
  });
}

// FIXED TARGET FRENZY BUTTON HOOK
if (buyFrenzyBtn) {
  buyFrenzyBtn.addEventListener('click', () => {
    if (points >= costs.frenzy && isGameActive && !isPaused) {
      points -= costs.frenzy;
      playGunshotSound(false);
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
  moveInterval = setInterval(moveTargets, 50);
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
  if (navigator.vibrate) navigator.vibrate(30);

  if (gameArea) {
    gameArea.classList.remove('recoil');
    void gameArea.offsetWidth;
    gameArea.classList.add('recoil');

    if (weaponGun) {
      weaponGun.classList.remove('fire');
      void weaponGun.offsetWidth;
      weaponGun.classList.add('fire');
    }

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

    spawnBloodSplatter(flashX, flashY, false);
  }
}

function spawnBloodSplatter(x, y, isBomb) {
  for (let i = 0; i < (isBomb ? 14 : 8); i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    if (isBomb) p.classList.add('bomb-part');
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = (isBomb ? 45 : 30) + Math.random() * 45;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

    gameArea.appendChild(p);
    setTimeout(() => p.remove(), 450);
  }
}

function spawnEntity(forceBombCheck = true) {
  if (!isGameActive || isPaused || !gameArea) return;
  if (gameArea.querySelectorAll('.target-head:not(.shot), .target-flag:not(.shot), .target-bomb').length >= 6) return;

  const randRoll = Math.random();
  const isBomb = forceBombCheck && randRoll < 0.20;
  const isFlag = !isBomb && randRoll < 0.35;

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

  } else if (isFlag) {
    const flag = document.createElement('img');
    const randomFlag = flagImages[Math.floor(Math.random() * flagImages.length)];
    flag.src = randomFlag;
    flag.classList.add('target-flag');

    flag.style.width = `${targetSize}px`;
    flag.style.height = `${targetSize}px`;

    const maxX = gameArea.clientWidth - targetSize - 20;
    const maxY = gameArea.clientHeight - targetSize - 20;
    let posX = Math.floor(Math.random() * maxX) + 10;
    let posY = Math.floor(Math.random() * maxY) + 10;

    flag.style.left = `${posX}px`;
    flag.style.top = `${posY}px`;
    flag.dataset.vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.0);

    flag.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (flag.classList.contains('shot') || isPaused) return;
      hitFlag(flag, e.clientX, e.clientY);
    });

    gameArea.appendChild(flag);

    setTimeout(() => {
      if (flag.parentNode && !flag.classList.contains('shot') && !isPaused) {
        flag.remove();
      }
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

function moveTargets() {
  if (!isGameActive || isPaused || !gameArea) return;
  const entities = gameArea.querySelectorAll('.target-head:not(.shot), .target-flag:not(.shot)');
  const maxW = gameArea.clientWidth - targetSize;

  entities.forEach(t => {
    let currentLeft = parseFloat(t.style.left) || 0;
    let vx = parseFloat(t.dataset.vx) || 1;

    currentLeft += vx;
    if (currentLeft <= 5 || currentLeft >= maxW - 5) {
      t.dataset.vx = -vx;
    }
    t.style.left = `${currentLeft}px`;
  });
}

function hitTarget(target, clientX, clientY, isGolden) {
  target.classList.add('shot');
  combo++;
  
  let isCrit = hasCrit && Math.random() < 0.25;
  let basePoints = isGolden ? 30 : 10;
  let comboBonus = Math.floor(combo / 3);
  let hitPoints = (basePoints + comboBonus) * pointsMultiplier;

  if (isCrit) {
    hitPoints *= 3;
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

function hitFlag(flag, clientX, clientY) {
  flag.classList.add('shot');
  combo++;

  let flagPoints = 50 * pointsMultiplier;
  points += flagPoints;
  pointsMultiplier += 1;
  updateUI();

  triggerGunshotFX(clientX, clientY);
  showPopup(clientX, clientY, `FLAG! +${flagPoints} & MULT+1!`, 'flag');

  setTimeout(() => {
    if (flag.parentNode) flag.remove();
  }, 350);
}

function hitBomb(bomb, clientX, clientY) {
  bomb.remove();
  combo = 0;

  if (hasShield) {
    hasShield = false;
    updateUI();
    showPopup(clientX, clientY, 'SHIELD BLOCKED!', 'shield');
    return;
  }

  playGunshotSound(true);
  if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

  points = 0;
  updateUI();

  gameArea.classList.remove('danger-flash');
  void gameArea.offsetWidth;
  gameArea.classList.add('danger-flash');

  const rect = gameArea.getBoundingClientRect();
  spawnBloodSplatter(clientX - rect.left, clientY - rect.top, true);
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
  const activeTargets = gameArea.querySelectorAll('.target-head:not(.shot), .target-flag:not(.shot)');
  if (activeTargets.length > 0) {
    const target = activeTargets[0];
    const rect = target.getBoundingClientRect();
    hitTarget(target, rect.left + rect.width / 2, rect.top + rect.height / 2, target.classList.contains('golden'));
  }
}

function clearEntities() {
  if (!gameArea) return;
  const entities = gameArea.querySelectorAll('.target-head, .target-flag, .target-bomb');
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
