const headImages = [
  'images/head1.png', // 0: Putin (Russia)
  'images/head2.png', // 1: Trump
  'images/head3.png', // 2: Eduardo Bolsonaro
  'images/head4.png', // 3: Flávio Bolsonaro
  'images/head5.png', // 4: Jair Bolsonaro
  'images/head6.png', // 5: Ben Gvir (Israel)
  'images/head7.png', // 6: Rupert Lowe
  'images/head8.png', // 7: Nigel Farage
  'images/head9.png'  // 8: Netanyahu (Israel)
];

const flagImages = [
  'images/flag1.png', // 0: Israel Flag
  'images/flag2.png'  // 1: Russia Flag
];

// Load Custom Audio Files
const gunshotSound = new Audio('audio/gunshot.mp3');
const bombSound = new Audio('audio/bomb.mp3');
const israelSound = new Audio('audio/israel.mp3');
const russiaSound = new Audio('audio/russia.mp3');

// Array of all sounds to easily stop them all at once
const allSounds = [gunshotSound, bombSound, israelSound, russiaSound];

// Helper to stop all playing audio and play the new one cleanly
function playCustomAudio(audioObj) {
  // Stop all other audio tracks immediately
  allSounds.forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });

  // Play the requested sound
  audioObj.currentTime = 0;
  audioObj.play().catch(e => console.log("Audio play blocked or file missing:", e));
}

// Tracking shots for each target
let hitCounts = {
  head: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  flag: [0, 0]
};

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
  turret: 200
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
    playCustomAudio(gunshotSound);
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
      playCustomAudio(gunshotSound);
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
      playCustomAudio(gunshotSound);
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
      playCustomAudio(gunshotSound);
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
      playCustomAudio(gunshotSound);
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
      playCustomAudio(gunshotSound);
      if (isGameActive && !isPaused) startTurret();
      updateUI();
    }
  });
}

function updateUI() {
  if (pointsDisplay) pointsDisplay.innerText = points;
  if (comboDisplay) comboDisplay.innerText = `${combo}x`;
  if (multiplierDisplay) multiplierDisplay.innerText = `${pointsMultiplier}x`;
  if (timeDisplay) timeDisplay.innerText = `${remainingTime}s`;

  for (let i = 0; i < 9; i++) {
    const el = document.getElementById(`count-head${i}`);
    if (el) el.innerText = hitCounts.head[i];
  }
  for (let i = 0; i < 2; i++) {
    const el = document.getElementById(`count-flag${i}`);
    if (el) el.innerText = hitCounts.flag[i];
  }

  if (buyMultiplierBtn) buyMultiplierBtn.disabled = points < costs.multiplier;
  if (buyTimeBtn) buyTimeBtn.disabled = points < costs.time;
  if (buyShieldBtn) buyShieldBtn.disabled = points < costs.shield || hasShield;
  if (buyCritBtn) buyCritBtn.disabled = points < costs.crit || hasCrit;
  if (buyTurretBtn) buyTurretBtn.disabled = points < costs.turret || autoTurretActive;
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
  isGameActive = true;
  isPaused = false;
  points = 0;
  combo = 0;
  pointsMultiplier = 1;
  remainingTime = baseGameTime;
  
  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  hitCounts.flag = [0, 0];

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
  if (navigator.vibrate) navigator.vibrate(35);

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
  for (let i = 0; i < (isBomb ? 18 : 12); i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    if (isBomb) p.classList.add('bomb-part');
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = (isBomb ? 55 : 35) + Math.random() * 55;
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
    const flagIndex = Math.floor(Math.random() * flagImages.length);
    const flag = document.createElement('img');
    flag.src = flagImages[flagIndex];
    flag.classList.add('target-flag');
    flag.dataset.flagIndex = flagIndex;

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
      hitFlag(flag, e.clientX, e.clientY, flagIndex);
    });

    gameArea.appendChild(flag);

    setTimeout(() => {
      if (flag.parentNode && !flag.classList.contains('shot') && !isPaused) {
        flag.remove();
      }
    }, headLingerTime);

  } else {
    const headIndex = Math.floor(Math.random() * headImages.length);
    const target = document.createElement('img');
    target.src = headImages[headIndex];
    target.classList.add('target-head');
    target.dataset.headIndex = headIndex;

    const isGolden = Math.random() < 0.15;
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
      hitTarget(target, e.clientX, e.clientY, isGolden, headIndex);
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

function hitTarget(target, clientX, clientY, isGolden, headIndex) {
  target.classList.add('shot');
  combo++;
  hitCounts.head[headIndex]++;

  // Play respective audio and immediately cut off any previous audio
  if (headIndex === 0) {
    playCustomAudio(russiaSound); // Putin
  } else if (headIndex === 5 || headIndex === 8) {
    playCustomAudio(israelSound); // Ben Gvir or Netanyahu
  } else {
    playCustomAudio(gunshotSound);
  }

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

function hitFlag(flag, clientX, clientY, flagIndex) {
  flag.classList.add('shot');
  combo++;
  hitCounts.flag[flagIndex]++;

  if (flagIndex === 0) {
    playCustomAudio(israelSound); // Israel Flag
  } else if (flagIndex === 1) {
    playCustomAudio(russiaSound); // Russia Flag
  }

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

  playCustomAudio(bombSound);
  if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

  points = 0;
  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  hitCounts.flag = [0, 0];
  updateUI();

  gameArea.classList.remove('danger-flash');
  void gameArea.offsetWidth;
  gameArea.classList.add('danger-flash');

  const rect = gameArea.getBoundingClientRect();
  spawnBloodSplatter(clientX - rect.left, clientY - rect.top, true);
  showPopup(clientX, clientY, 'BOOM! STATS WIPED!', 'penalty');
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
    const headIdx = parseInt(target.dataset.headIndex) || 0;
    hitTarget(target, rect.left + rect.width / 2, rect.top + rect.height / 2, target.classList.contains('golden'), headIdx);
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
