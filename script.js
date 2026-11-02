const headNames = [
  'Vladimir Putin 🇷🇺',       // 0
  'Donald Trump 🇺🇸',       // 1
  'Eduardo Bolsonaro 🇧🇷',  // 2
  'Flávio Bolsonaro 🇧🇷',   // 3
  'Jair Bolsonaro 🇧🇷',    // 4
  'Ben Gvir 🇮🇱',           // 5
  'Rupert Lowe 🇬🇧',         // 6
  'Nigel Farage 🇬🇧',        // 7
  'Benjamin Netanyahu 🇮🇱', // 8
  'Moaz'                   // 9
];

const headImages = [
  'images/head1.png',  // 0: Putin
  'images/head2.png',  // 1: Trump
  'images/head3.png',  // 2: Eduardo Bolsonaro
  'images/head4.png',  // 3: Flávio Bolsonaro
  'images/head5.png',  // 4: Jair Bolsonaro
  'images/head6.png',  // 5: Ben Gvir
  'images/head7.png',  // 6: Rupert Lowe
  'images/head8.png',  // 7: Nigel Farage
  'images/head9.png',  // 8: Netanyahu
  'images/head10.png'  // 9: Moaz
];

const penaltyHead = 'images/head11.png';
const flagImages = ['images/flag1.png', 'images/flag2.png'];

const gunsData = [
  { name: "Standard Pistol", price: 0, file: "guns/gun1.png" },
  { name: "Compact Sidearm", price: 5000, file: "guns/gun2.png" },
  { name: "Tactical Carbine", price: 15000, file: "guns/gun3.png" },
  { name: "Holographic SMG", price: 35000, file: "guns/gun4.png" },
  { name: "Heavy Assaulter", price: 70000, file: "guns/gun5.png" },
  { name: "Cyberpunk Rifle", price: 120000, file: "guns/gun6.png" },
  { name: "Advanced Marksman", price: 180000, file: "guns/gun7.png" },
  { name: "Heavy RPG", price: 250000, file: "guns/gun8.png" }
];

let ownedGuns = [true, false, false, false, false, false, false, false];
let currentEquippedGun = 0;

const gunshotSound = new Audio('audio/gunshot.mp3');
const bombSound = new Audio('audio/bomb.mp3');
const israelSound = new Audio('audio/israel.mp3');
const russiaSound = new Audio('audio/russia.mp3');
const moazSound = new Audio('audio/moaz.mp3');

const allSounds = [gunshotSound, bombSound, israelSound, russiaSound, moazSound];

function playCustomAudio(audioObj) {
  allSounds.forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
  audioObj.currentTime = 0;
  audioObj.play().catch(e => console.log("Audio play blocked or file missing:", e));
}

let hitCounts = { head: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], flag: [0, 0] };

let points = 0;
let pointsMultiplier = 1;
let combo = 0;
let baseGameTime = 30;
let remainingTime = 30;
let targetSize = 75;
let headLingerTime = 1800;
let hasShield = false;
let hasCrit = false;

let bgMoazUnlocked = false;
let bgGoatUnlocked = false;
let bgShakhtarUnlocked = false;
let currentBg = 'default';

// Level System
let currentLevel = parseInt(localStorage.getItem('tactical_current_level') || '1', 10);
let currentObjective = { type: 'score', targetScore: 100, targetPolitician: -1, requiredHits: 0, maxAllowedHits: 999 };

let isGameActive = false;
let isPaused = false;
let gameTimer = null;
let spawnInterval = null;
let moveInterval = null;

let initialCosts = { multiplier: 50, time: 75, shield: 90, crit: 110, bgMoaz: 150, bgGoat: 300, bgShakhtar: 450 };
let costs = { ...initialCosts };

// DOM Elements
let pointsDisplay, comboDisplay, multiplierDisplay, timeDisplay, levelDisplay, gameArea, muzzleFlash, weaponGun, currentGunImg;
let mainStartBtn, restartBtn, shopToggleBtn, closeShopBtn, settingsToggleBtn, lobbySettingsBtn, closeSettingsBtn, resetLevelBtn;
let startScreen, shopModal, settingsModal, gameOverScreen, gameOverTitle, finalScoreDisplay, personalBestDisplay, shopStatusNotice, lobbyLevelInfo, objectiveText;
let tabUpgradesBtn, tabGunsBtn, sectionUpgrades, sectionGuns;
let buyMultiplierBtn, buyTimeBtn, buyShieldBtn, buyCritBtn, buyBgMoazBtn, buyBgGoatBtn, buyBgShakhtarBtn;

window.addEventListener('DOMContentLoaded', () => {
  pointsDisplay = document.getElementById('points-display');
  comboDisplay = document.getElementById('combo-display');
  multiplierDisplay = document.getElementById('multiplier-display');
  timeDisplay = document.getElementById('time-display');
  levelDisplay = document.getElementById('level-display');
  gameArea = document.getElementById('game-area');
  muzzleFlash = document.getElementById('muzzle-flash');
  weaponGun = document.getElementById('weapon-gun');
  currentGunImg = document.getElementById('current-gun-img');

  mainStartBtn = document.getElementById('main-start-btn');
  restartBtn = document.getElementById('restart-btn');
  shopToggleBtn = document.getElementById('shop-toggle-btn');
  closeShopBtn = document.getElementById('close-shop-btn');
  settingsToggleBtn = document.getElementById('settings-toggle-btn');
  lobbySettingsBtn = document.getElementById('lobby-settings-btn');
  closeSettingsBtn = document.getElementById('close-settings-btn');
  resetLevelBtn = document.getElementById('reset-level-btn');

  startScreen = document.getElementById('start-screen');
  shopModal = document.getElementById('shop-modal');
  settingsModal = document.getElementById('settings-modal');
  gameOverScreen = document.getElementById('game-over-screen');
  gameOverTitle = document.getElementById('game-over-title');
  finalScoreDisplay = document.getElementById('final-score');
  personalBestDisplay = document.getElementById('personal-best');
  shopStatusNotice = document.getElementById('shop-status-notice');
  lobbyLevelInfo = document.getElementById('lobby-level-info');
  objectiveText = document.getElementById('objective-text');

  tabUpgradesBtn = document.getElementById('tab-upgrades-btn');
  tabGunsBtn = document.getElementById('tab-guns-btn');
  sectionUpgrades = document.getElementById('section-upgrades');
  sectionGuns = document.getElementById('section-guns');

  buyMultiplierBtn = document.getElementById('buy-multiplier');
  buyTimeBtn = document.getElementById('buy-time');
  buyShieldBtn = document.getElementById('buy-shield');
  buyCritBtn = document.getElementById('buy-crit');
  buyBgMoazBtn = document.getElementById('buy-bg-moaz');
  buyBgGoatBtn = document.getElementById('buy-bg-goat');
  buyBgShakhtarBtn = document.getElementById('buy-bg-shakhtar');

  const tabs = [tabUpgradesBtn, tabGunsBtn];
  const sections = [sectionUpgrades, sectionGuns];

  function switchTab(activeBtn, activeSection) {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.add('hidden'));
    activeBtn.classList.add('active');
    activeSection.classList.remove('hidden');
  }

  tabUpgradesBtn.addEventListener('click', () => switchTab(tabUpgradesBtn, sectionUpgrades));
  tabGunsBtn.addEventListener('click', () => switchTab(tabGunsBtn, sectionGuns));

  if (mainStartBtn) mainStartBtn.addEventListener('click', startGame);
  if (restartBtn) restartBtn.addEventListener('click', startGame);

  if (shopToggleBtn) shopToggleBtn.addEventListener('click', openShop);
  if (closeShopBtn) closeShopBtn.addEventListener('click', closeShop);

  if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', openSettings);
  if (lobbySettingsBtn) lobbySettingsBtn.addEventListener('click', openSettings);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
  if (resetLevelBtn) resetLevelBtn.addEventListener('click', resetProgress);

  for (let i = 0; i < 8; i++) {
    const btn = document.getElementById(i === 0 ? 'equip-gun-0' : `gun-btn-${i}`);
    if (btn) btn.addEventListener('click', () => handleGunClick(i));
  }

  if (gameArea) {
    gameArea.addEventListener('pointerdown', (e) => {
      if (!isGameActive || isPaused) return;
      triggerGunshotFX(e.clientX, e.clientY);
      playCustomAudio(gunshotSound);
      if (e.target === gameArea || e.target === muzzleFlash || e.target === weaponGun || e.target === currentGunImg) {
        combo = 0;
        updateUI();
      }
    });
  }

  if (buyMultiplierBtn) buyMultiplierBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.multiplier) {
      points -= costs.multiplier;
      pointsMultiplier *= 2;
      costs.multiplier = Math.floor(costs.multiplier * 2.5);
      buyMultiplierBtn.innerText = `Buy (${costs.multiplier} Pts)`;
      updateUI();
    }
  });

  if (buyTimeBtn) buyTimeBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.time) {
      points -= costs.time;
      remainingTime += 10;
      baseGameTime += 10;
      costs.time = Math.floor(costs.time * 2);
      buyTimeBtn.innerText = `Buy (${costs.time} Pts)`;
      updateUI();
    }
  });

  if (buyShieldBtn) buyShieldBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.shield && !hasShield) {
      points -= costs.shield;
      hasShield = true;
      buyShieldBtn.innerText = 'ACTIVE 🛡️';
      buyShieldBtn.disabled = true;
      updateUI();
    }
  });

  if (buyCritBtn) buyCritBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.crit && !hasCrit) {
      points -= costs.crit;
      hasCrit = true;
      buyCritBtn.innerText = 'ACTIVE 💥';
      buyCritBtn.disabled = true;
      updateUI();
    }
  });

  if (buyBgMoazBtn) buyBgMoazBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (bgMoazUnlocked) {
      currentBg = 'moaz';
      if (gameArea) gameArea.style.backgroundImage = "url('background_moaz.jpg')";
      updateUI();
    } else {
      if (points >= costs.bgMoaz) {
        points -= costs.bgMoaz;
        bgMoazUnlocked = true;
        currentBg = 'moaz';
        if (gameArea) gameArea.style.backgroundImage = "url('background_moaz.jpg')";
        updateUI();
      }
    }
  });

  if (buyBgGoatBtn) buyBgGoatBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (bgGoatUnlocked) {
      currentBg = 'goat';
      if (gameArea) gameArea.style.backgroundImage = "url('background.jpg')";
      updateUI();
    } else {
      if (points >= costs.bgGoat) {
        points -= costs.bgGoat;
        bgGoatUnlocked = true;
        currentBg = 'goat';
        if (gameArea) gameArea.style.backgroundImage = "url('background.jpg')";
        updateUI();
        alert("ALERT‼️ you are not shooting me as a child, you are shooting those bitches to protect me as a child from them. if you miss and shoot me instead, then fuck you.");
      }
    }
  });

  if (buyBgShakhtarBtn) buyBgShakhtarBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (bgShakhtarUnlocked) {
      currentBg = 'shakhtar';
      if (gameArea) gameArea.style.backgroundImage = "url('background_shakhtar.jpg')";
      updateUI();
    } else {
      if (points >= costs.bgShakhtar) {
        points -= costs.bgShakhtar;
        bgShakhtarUnlocked = true;
        currentBg = 'shakhtar';
        if (gameArea) gameArea.style.backgroundImage = "url('background_shakhtar.jpg')";
        updateUI();
      }
    }
  });

  setupLevelObjectives();
  updateUI();
});

function setupLevelObjectives() {
  let targetScore = 80 + (currentLevel * 35);
  
  if (currentLevel < 10) {
    currentObjective = {
      type: 'score',
      targetScore: targetScore,
      targetPolitician: -1,
      requiredHits: 0,
      maxAllowedHits: 999,
      description: `Reach ${targetScore} Points to clear Level ${currentLevel}.`
    };
  } else if (currentLevel < 20) {
    let politicianIndex = (currentLevel - 10) % headNames.length;
    let requiredHits = 3 + Math.floor((currentLevel - 10) / 2);
    currentObjective = {
      type: 'quota_min',
      targetScore: targetScore,
      targetPolitician: politicianIndex,
      requiredHits: requiredHits,
      maxAllowedHits: 999,
      description: `Reach ${targetScore} Pts AND hit ${headNames[politicianIndex]} at least ${requiredHits} times.`
    };
  } else {
    let politicianIndex = currentLevel % headNames.length;
    let maxHits = 2 + (currentLevel % 3);
    currentObjective = {
      type: 'quota_cap',
      targetScore: targetScore,
      targetPolitician: politicianIndex,
      requiredHits: 0,
      maxAllowedHits: maxHits,
      description: `Reach ${targetScore} Pts. WARNING: Do not hit ${headNames[politicianIndex]} more than ${maxHits} times!`
    };
  }

  if (objectiveText) objectiveText.innerText = currentObjective.description;
  if (lobbyLevelInfo) lobbyLevelInfo.innerText = `CURRENT DEPLOYMENT: LEVEL ${currentLevel}`;
  if (levelDisplay) levelDisplay.innerText = currentLevel;
}

function openSettings() {
  if (isGameActive) {
    isPaused = true;
    clearInterval(gameTimer);
    clearInterval(spawnInterval);
    if (moveInterval) clearInterval(moveInterval);
  }
  if (settingsModal) settingsModal.classList.remove('hidden');
}

function closeSettings() {
  if (settingsModal) settingsModal.classList.add('hidden');
  if (isGameActive) {
    isPaused = false;
    resumeTimers();
  }
}

function resetProgress() {
  if (confirm("Are you sure you want to reset all progress back to Level 1?")) {
    currentLevel = 1;
    localStorage.setItem('tactical_current_level', currentLevel);
    setupLevelObjectives();
    updateUI();
    closeSettings();
  }
}

function handleGunClick(gunIndex) {
  if (!isGameActive) return;
  if (ownedGuns[gunIndex]) {
    currentEquippedGun = gunIndex;
    if (currentGunImg) currentGunImg.src = gunsData[gunIndex].file;
  } else {
    const price = gunsData[gunIndex].price;
    if (points >= price) {
      points -= price;
      ownedGuns[gunIndex] = true;
      currentEquippedGun = gunIndex;
      if (currentGunImg) currentGunImg.src = gunsData[gunIndex].file;
      updateUI();
    }
  }
  updateGunShopUI();
}

function updateGunShopUI() {
  for (let i = 0; i < 8; i++) {
    const btn = document.getElementById(i === 0 ? 'equip-gun-0' : `gun-btn-${i}`);
    if (!btn) continue;

    if (!isGameActive) {
      btn.innerText = "Unavailable (Not in Round)";
      btn.disabled = true;
      btn.classList.remove('equipped-status');
      continue;
    }

    if (currentEquippedGun === i) {
      btn.innerText = "Equipped";
      btn.disabled = true;
      btn.classList.add('equipped-status');
    } else if (ownedGuns[i]) {
      btn.innerText = "Equip";
      btn.disabled = false;
      btn.classList.remove('equipped-status');
    } else {
      const price = gunsData[i].price;
      btn.innerText = `Buy (${price.toLocaleString()} Pts)`;
      btn.disabled = points < price;
      btn.classList.remove('equipped-status');
    }
  }
}

function updateUI() {
  if (pointsDisplay) pointsDisplay.innerText = points;
  if (comboDisplay) comboDisplay.innerText = `${combo}x`;
  if (multiplierDisplay) multiplierDisplay.innerText = `${pointsMultiplier}x`;
  if (timeDisplay) timeDisplay.innerText = `${remainingTime}s`;
  if (levelDisplay) levelDisplay.innerText = currentLevel;

  for (let i = 0; i < 10; i++) {
    const el = document.getElementById(`count-head${i}`);
    if (el) el.innerText = hitCounts.head[i];
  }
  for (let i = 0; i < 2; i++) {
    const el = document.getElementById(`count-flag${i}`);
    if (el) el.innerText = hitCounts.flag[i];
  }

  if (!isGameActive) {
    if (buyMultiplierBtn) { buyMultiplierBtn.disabled = true; buyMultiplierBtn.innerText = "Unavailable"; }
    if (buyTimeBtn) { buyTimeBtn.disabled = true; buyTimeBtn.innerText = "Unavailable"; }
    if (buyShieldBtn) { buyShieldBtn.disabled = true; buyShieldBtn.innerText = "Unavailable"; }
    if (buyCritBtn) { buyCritBtn.disabled = true; buyCritBtn.innerText = "Unavailable"; }
    if (buyBgMoazBtn) { buyBgMoazBtn.disabled = true; buyBgMoazBtn.innerText = "Unavailable"; }
    if (buyBgGoatBtn) { buyBgGoatBtn.disabled = true; buyBgGoatBtn.innerText = "Unavailable"; }
    if (buyBgShakhtarBtn) { buyBgShakhtarBtn.disabled = true; buyBgShakhtarBtn.innerText = "Unavailable"; }
  } else {
    if (buyMultiplierBtn) buyMultiplierBtn.disabled = points < costs.multiplier;
    if (buyTimeBtn) buyTimeBtn.disabled = points < costs.time;
    if (buyShieldBtn) buyShieldBtn.disabled = points < costs.shield || hasShield;
    if (buyCritBtn) buyCritBtn.disabled = points < costs.crit || hasCrit;

    if (bgMoazUnlocked) {
      if (currentBg === 'moaz') {
        buyBgMoazBtn.innerText = "Equipped";
        buyBgMoazBtn.disabled = true;
        buyBgMoazBtn.classList.add('equipped-status');
      } else {
        buyBgMoazBtn.innerText = "Equip";
        buyBgMoazBtn.disabled = false;
        buyBgMoazBtn.classList.remove('equipped-status');
      }
    } else {
      buyBgMoazBtn.innerText = `Buy (${costs.bgMoaz} Pts)`;
      buyBgMoazBtn.disabled = points < costs.bgMoaz;
      buyBgMoazBtn.classList.remove('equipped-status');
    }

    if (bgGoatUnlocked) {
      if (currentBg === 'goat') {
        buyBgGoatBtn.innerText = "Equipped";
        buyBgGoatBtn.disabled = true;
        buyBgGoatBtn.classList.add('equipped-status');
      } else {
        buyBgGoatBtn.innerText = "Equip";
        buyBgGoatBtn.disabled = false;
        buyBgGoatBtn.classList.remove('equipped-status');
      }
    } else {
      buyBgGoatBtn.innerText = `Buy (${costs.bgGoat} Pts)`;
      buyBgGoatBtn.disabled = points < costs.bgGoat;
      buyBgGoatBtn.classList.remove('equipped-status');
    }

    if (bgShakhtarUnlocked) {
      if (currentBg === 'shakhtar') {
        buyBgShakhtarBtn.innerText = "Equipped";
        buyBgShakhtarBtn.disabled = true;
        buyBgShakhtarBtn.classList.add('equipped-status');
      } else {
        buyBgShakhtarBtn.innerText = "Equip";
        buyBgShakhtarBtn.disabled = false;
        buyBgShakhtarBtn.classList.remove('equipped-status');
      }
    } else {
      buyBgShakhtarBtn.innerText = `Buy (${costs.bgShakhtar} Pts)`;
      buyBgShakhtarBtn.disabled = points < costs.bgShakhtar;
      buyBgShakhtarBtn.classList.remove('equipped-status');
    }
  }

  updateGunShopUI();
}

function openShop() {
  if (isGameActive) {
    isPaused = true;
    clearInterval(gameTimer);
    clearInterval(spawnInterval);
    if (moveInterval) clearInterval(moveInterval);
    if (shopStatusNotice) shopStatusNotice.innerText = "⏸️ GAME PAUSED";
  } else {
    if (shopStatusNotice) shopStatusNotice.innerText = "⚡ LOBBY ARMORY (START A ROUND TO BUY)";
  }

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
    if (remainingTime <= 0) checkLevelCompletion();
  }, 1000);

  spawnInterval = setInterval(() => spawnEntity(), 750);
  moveInterval = setInterval(moveTargets, 50);
}

function startGame() {
  isGameActive = true;
  isPaused = false;
  points = 0;
  combo = 0;
  pointsMultiplier = 1;
  baseGameTime = 30;
  remainingTime = 30;
  
  costs = { ...initialCosts };
  hasShield = false;
  hasCrit = false;
  bgMoazUnlocked = false;
  bgGoatUnlocked = false;
  bgShakhtarUnlocked = false;
  currentBg = 'default';

  if (buyMultiplierBtn) buyMultiplierBtn.innerText = `Buy (${costs.multiplier} Pts)`;
  if (buyTimeBtn) buyTimeBtn.innerText = `Buy (${costs.time} Pts)`;
  if (buyShieldBtn) {
    buyShieldBtn.innerText = `Buy (${costs.shield} Pts)`;
    buyShieldBtn.disabled = false;
  }
  if (buyCritBtn) {
    buyCritBtn.innerText = `Buy (${costs.crit} Pts)`;
    buyCritBtn.disabled = false;
  }
  if (buyBgMoazBtn) {
    buyBgMoazBtn.innerText = `Buy (${costs.bgMoaz} Pts)`;
    buyBgMoazBtn.disabled = false;
    buyBgMoazBtn.classList.remove('equipped-status');
  }
  if (buyBgGoatBtn) {
    buyBgGoatBtn.innerText = `Buy (${costs.bgGoat} Pts)`;
    buyBgGoatBtn.disabled = false;
    buyBgGoatBtn.classList.remove('equipped-status');
  }
  if (buyBgShakhtarBtn) {
    buyBgShakhtarBtn.innerText = `Buy (${costs.bgShakhtar} Pts)`;
    buyBgShakhtarBtn.disabled = false;
    buyBgShakhtarBtn.classList.remove('equipped-status');
  }

  ownedGuns = [true, false, false, false, false, false, false, false];
  currentEquippedGun = 0;
  if (currentGunImg) currentGunImg.src = gunsData[0].file;

  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  hitCounts.flag = [0, 0];

  if (gameArea) gameArea.style.backgroundImage = "";

  setupLevelObjectives();
  updateUI();

  if (startScreen) startScreen.classList.add('hidden');
  if (shopModal) shopModal.classList.add('hidden');
  if (settingsModal) settingsModal.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');

  clearEntities();
  resumeTimers();
}

function checkLevelCompletion() {
  isGameActive = false;
  isPaused = false;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (moveInterval) clearInterval(moveInterval);
  clearEntities();

  let passed = true;
  let failReason = "";

  if (points < currentObjective.targetScore) {
    passed = false;
    failReason = `FAILED: Need ${currentObjective.targetScore} Pts (Got ${points})`;
  } else if (currentObjective.type === 'quota_min') {
    let hits = hitCounts.head[currentObjective.targetPolitician];
    if (hits < currentObjective.requiredHits) {
      passed = false;
      failReason = `FAILED: Needed ${currentObjective.requiredHits} hits on ${headNames[currentObjective.targetPolitician]} (Got ${hits})`;
    }
  } else if (currentObjective.type === 'quota_cap') {
    let hits = hitCounts.head[currentObjective.targetPolitician];
    if (hits > currentObjective.maxAllowedHits) {
      passed = false;
      failReason = `FAILED: Exceeded max allowed hits on ${headNames[currentObjective.targetPolitician]} (${hits}/${currentObjective.maxAllowedHits})`;
    }
  }

  let personalBest = parseInt(localStorage.getItem('tactical_high_score') || '0', 10);
  if (points > personalBest) {
    personalBest = points;
    localStorage.setItem('tactical_high_score', personalBest);
  }

  if (passed) {
    if (gameOverTitle) gameOverTitle.innerText = `LEVEL ${currentLevel} CLEARED!`;
    if (restartBtn) restartBtn.innerText = "NEXT LEVEL";
    currentLevel++;
    localStorage.setItem('tactical_current_level', currentLevel);
  } else {
    if (gameOverTitle) gameOverTitle.innerText = failReason;
    if (restartBtn) restartBtn.innerText = "RETRY LEVEL";
  }

  if (finalScoreDisplay) finalScoreDisplay.innerText = points;
  if (personalBestDisplay) personalBestDisplay.innerText = personalBest;
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
  setupLevelObjectives();
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

  const randRoll = Math.random();
  const isBomb = forceBombCheck && randRoll < 0.18;
  const isPenalty = !isBomb && randRoll < 0.28;
  const isFlag = !isBomb && !isPenalty && randRoll < 0.42;

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
    setTimeout(() => { if (bomb.parentNode && !isPaused) bomb.remove(); }, headLingerTime);

  } else if (isPenalty) {
    const target = document.createElement('img');
    target.src = penaltyHead;
    target.classList.add('target-head', 'penalty-target');

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
      hitPenaltyHead(target, e.clientX, e.clientY);
    });

    gameArea.appendChild(target);
    setTimeout(() => { if (target.parentNode && !target.classList.contains('shot') && !isPaused) target.remove(); }, headLingerTime);

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
    setTimeout(() => { if (flag.parentNode && !flag.classList.contains('shot') && !isPaused) flag.remove(); }, headLingerTime);

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
    setTimeout(() => { if (target.parentNode && !target.classList.contains('shot') && !isPaused) target.remove(); }, headLingerTime);
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
    if (currentLeft <= 5 || currentLeft >= maxW - 5) t.dataset.vx = -vx;
    t.style.left = `${currentLeft}px`;
  });
}

function hitTarget(target, clientX, clientY, isGolden, headIndex) {
  target.classList.add('shot');
  combo++;
  hitCounts.head[headIndex]++;

  if (headIndex === 9) playCustomAudio(moazSound);
  else playCustomAudio(gunshotSound);

  let isCrit = hasCrit && Math.random() < 0.25;
  let basePoints = isGolden ? 30 : 10;
  let comboBonus = Math.floor(combo / 3);
  let hitPoints = (basePoints + comboBonus) * pointsMultiplier;

  if (isCrit) hitPoints *= 3;

  points += hitPoints;

  if (currentObjective.type === 'quota_cap' && headIndex === currentObjective.targetPolitician) {
    if (hitCounts.head[headIndex] > currentObjective.maxAllowedHits) {
      updateUI();
      triggerGunshotFX(clientX, clientY);
      setTimeout(() => {
        if (target.parentNode) target.remove();
        endGame();
      }, 200);
      return;
    }
  }

  updateUI();

  triggerGunshotFX(clientX, clientY);
  
  if (isCrit) showPopup(clientX, clientY, `CRIT! +${hitPoints}`, 'crit');
  else showPopup(clientX, clientY, `+${hitPoints}`, isGolden ? 'gold' : '');

  setTimeout(() => { if (target.parentNode) target.remove(); }, 350);
}

function hitPenaltyHead(target, clientX, clientY) {
  target.classList.add('shot');
  combo = 0;
  playCustomAudio(bombSound);
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  triggerGunshotFX(clientX, clientY);
  gameArea.classList.remove('danger-flash');
  void gameArea.offsetWidth;
  gameArea.classList.add('danger-flash');

  const rect = gameArea.getBoundingClientRect();
  spawnBloodSplatter(clientX - rect.left, clientY - rect.top, true);

  setTimeout(() => {
    if (target.parentNode) target.remove();
    endGame();
  }, 200);
}

function hitFlag(flag, clientX, clientY, flagIndex) {
  flag.classList.add('shot');
  combo++;
  hitCounts.flag[flagIndex]++;

  if (flagIndex === 0) playCustomAudio(israelSound);
  else if (flagIndex === 1) playCustomAudio(russiaSound);

  let flagPoints = 50 * pointsMultiplier;
  points += flagPoints;
  pointsMultiplier += 1;
  updateUI();

  triggerGunshotFX(clientX, clientY);
  showPopup(clientX, clientY, `FLAG! +${flagPoints} & MULT+1!`, 'flag');

  setTimeout(() => { if (flag.parentNode) flag.remove(); }, 350);
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
  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
  if (moveInterval) clearInterval(moveInterval);
  clearEntities();

  let personalBest = parseInt(localStorage.getItem('tactical_high_score') || '0', 10);
  if (points > personalBest) {
    personalBest = points;
    localStorage.setItem('tactical_high_score', personalBest);
  }

  if (gameOverTitle) gameOverTitle.innerText = `LEVEL ${currentLevel} FAILED`;
  if (restartBtn) restartBtn.innerText = "RETRY LEVEL";
  if (finalScoreDisplay) finalScoreDisplay.innerText = points;
  if (personalBestDisplay) personalBestDisplay.innerText = personalBest;
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}
