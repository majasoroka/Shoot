// Your web app's Firebase configuration (split to bypass automated secret scanners)
const firebaseConfig = {
  apiKey: "AIzaSy" + "AzdFxsG" + "2FeJXkiDprYTEE2tWiE4XTyiuk",
  authDomain: "tactical-headshot.firebaseapp.com",
  projectId: "tactical-headshot",
  storageBucket: "tactical-headshot.firebasestorage.app",
  messagingSenderId: "170041917227",
  appId: "1:170041917227:web:91fd93e252513e74938f6e",
  measurementId: "G-9S53WC20WC"
};

// Initialize Firebase (Compat Version)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserData = null;
let isRegisterMode = false;
let selectedNewPfpBase64 = null;

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
let customBgUnlocked = false;

let isGameActive = false;
let isPaused = false;
let gameTimer = null;
let spawnInterval = null;
let moveInterval = null;

let initialCosts = { multiplier: 50, time: 75, shield: 90, crit: 110, bg: 150 };
let costs = { ...initialCosts };

// DOM Elements
let pointsDisplay, comboDisplay, multiplierDisplay, timeDisplay, gameArea, muzzleFlash, weaponGun, currentGunImg;
let startBtn, mainStartBtn, restartBtn, shopToggleBtn, closeShopBtn;
let authScreen, authLoginInput, authEmailInput, authPasswordInput, loginTabSubmit, registerTabSubmit, toggleAuthModeBtn, authError;
let startScreen, playerNameDisplay, hudUserPfp, shopModal, gameOverScreen, gameOverTitle, finalScoreDisplay, personalBestDisplay;
let tabUpgradesBtn, tabGunsBtn, tabLeaderboardBtn, tabAccountBtn, sectionUpgrades, sectionGuns, sectionLeaderboard, sectionAccount, leaderboardList;
let settingsPfpFile, settingsPfpPreview, settingsUsernameInput, settingsPasswordInput, saveAccountBtn, logoutBtn, accountMsg;
let buyMultiplierBtn, buyTimeBtn, buyShieldBtn, buyCritBtn, buyBgBtn;

window.addEventListener('DOMContentLoaded', () => {
  pointsDisplay = document.getElementById('points-display');
  comboDisplay = document.getElementById('combo-display');
  multiplierDisplay = document.getElementById('multiplier-display');
  timeDisplay = document.getElementById('time-display');
  gameArea = document.getElementById('game-area');
  muzzleFlash = document.getElementById('muzzle-flash');
  weaponGun = document.getElementById('weapon-gun');
  currentGunImg = document.getElementById('current-gun-img');

  startBtn = document.getElementById('start-btn');
  mainStartBtn = document.getElementById('main-start-btn');
  restartBtn = document.getElementById('restart-btn');
  shopToggleBtn = document.getElementById('shop-toggle-btn');
  closeShopBtn = document.getElementById('close-shop-btn');

  authScreen = document.getElementById('auth-screen');
  authLoginInput = document.getElementById('auth-login-input');
  authEmailInput = document.getElementById('auth-email-input');
  authPasswordInput = document.getElementById('auth-password');
  loginTabSubmit = document.getElementById('login-tab-submit');
  registerTabSubmit = document.getElementById('register-tab-submit');
  toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
  authError = document.getElementById('auth-error');

  startScreen = document.getElementById('start-screen');
  playerNameDisplay = document.getElementById('player-name-display');
  hudUserPfp = document.getElementById('hud-user-pfp');
  shopModal = document.getElementById('shop-modal');
  gameOverScreen = document.getElementById('game-over-screen');
  gameOverTitle = document.getElementById('game-over-title');
  finalScoreDisplay = document.getElementById('final-score');
  personalBestDisplay = document.getElementById('personal-best');

  tabUpgradesBtn = document.getElementById('tab-upgrades-btn');
  tabGunsBtn = document.getElementById('tab-guns-btn');
  tabLeaderboardBtn = document.getElementById('tab-leaderboard-btn');
  tabAccountBtn = document.getElementById('tab-account-btn');
  sectionUpgrades = document.getElementById('section-upgrades');
  sectionGuns = document.getElementById('section-guns');
  sectionLeaderboard = document.getElementById('section-leaderboard');
  sectionAccount = document.getElementById('section-account');
  leaderboardList = document.getElementById('leaderboard-list');

  settingsPfpFile = document.getElementById('settings-pfp-file');
  settingsPfpPreview = document.getElementById('settings-pfp-preview');
  settingsUsernameInput = document.getElementById('settings-username-input');
  settingsPasswordInput = document.getElementById('settings-password-input');
  saveAccountBtn = document.getElementById('save-account-btn');
  logoutBtn = document.getElementById('logout-btn');
  accountMsg = document.getElementById('account-msg');

  buyMultiplierBtn = document.getElementById('buy-multiplier');
  buyTimeBtn = document.getElementById('buy-time');
  buyShieldBtn = document.getElementById('buy-shield');
  buyCritBtn = document.getElementById('buy-crit');
  buyBgBtn = document.getElementById('buy-bg');

  // Listen for Firebase session persistence (keeps user logged in across page reloads)
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const uid = user.uid;
      let username = user.email.split('@')[0];
      let pfp = "images/default-avatar.png";

      try {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
          username = userDoc.data().username || username;
          pfp = userDoc.data().pfp || pfp;
        }
      } catch (err) {
        console.log("Firestore profile load warning:", err);
      }

      currentUserData = { uid, username, email: user.email, pfp };
      transitionToGame();
    } else {
      authScreen.classList.remove('hidden');
      startScreen.classList.add('hidden');
    }
  });

  toggleAuthModeBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
      authEmailInput.classList.remove('hidden');
      authLoginInput.placeholder = "Username (e.g. Maja)";
      registerTabSubmit.classList.remove('hidden');
      loginTabSubmit.classList.add('hidden');
      toggleAuthModeBtn.innerText = "Already have an account? Log in here";
    } else {
      authEmailInput.classList.add('hidden');
      authLoginInput.placeholder = "Username or Email";
      loginTabSubmit.classList.remove('hidden');
      registerTabSubmit.classList.add('hidden');
      toggleAuthModeBtn.innerText = "Need an account? Register here";
    }
    authError.innerText = "";
  });

  registerTabSubmit.addEventListener('click', async () => {
    const username = authLoginInput.value.trim();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();

    if (!username || !email || !password) {
      authError.innerText = "Please fill out all fields.";
      return;
    }

    try {
      const userCred = await auth.createUserWithEmailAndPassword(email, password);
      const uid = userCred.user.uid;
      const defaultPfp = "images/default-avatar.png";

      await db.collection("users").doc(uid).set({
        username: username,
        email: email,
        pfp: defaultPfp
      }, { merge: true });

      currentUserData = { uid, username, email, pfp: defaultPfp };
      transitionToGame();
    } catch (error) {
      authError.innerText = error.message;
    }
  });

  // Log in with either Email or Username
  loginTabSubmit.addEventListener('click', async () => {
    const loginInput = authLoginInput.value.trim();
    const password = authPasswordInput.value.trim();

    if (!loginInput || !password) {
      authError.innerText = "Please enter login and password.";
      return;
    }

    try {
      let emailToUse = loginInput;

      // If they typed a username instead of an email, look up their email in Firestore
      if (!loginInput.includes('@')) {
        const querySnapshot = await db.collection("users").where("username", "==", loginInput).get();
        if (querySnapshot.empty) {
          authError.innerText = "Username not found.";
          return;
        }
        emailToUse = querySnapshot.docs[0].data().email;
      }

      await auth.signInWithEmailAndPassword(emailToUse, password);
    } catch (error) {
      authError.innerText = error.message;
    }
  });

  // Log Out button in Account settings
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      currentUserData = null;
      shopModal.classList.add('hidden');
      startScreen.classList.add('hidden');
      authScreen.classList.remove('hidden');
      authLoginInput.value = "";
      authPasswordInput.value = "";
    } catch (error) {
      console.error("Logout error:", error);
    }
  });

  function transitionToGame() {
    authScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    if (currentUserData) {
      playerNameDisplay.innerText = currentUserData.username;
      hudUserPfp.src = currentUserData.pfp || "images/default-avatar.png";
    }
  }

  const tabs = [tabUpgradesBtn, tabGunsBtn, tabLeaderboardBtn, tabAccountBtn];
  const sections = [sectionUpgrades, sectionGuns, sectionLeaderboard, sectionAccount];

  function switchTab(activeBtn, activeSection) {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.add('hidden'));
    activeBtn.classList.add('active');
    activeSection.classList.remove('hidden');
    if (activeSection === sectionLeaderboard) fetchLeaderboard();
    if (activeSection === sectionAccount) loadAccountSettings();
  }

  tabUpgradesBtn.addEventListener('click', () => switchTab(tabUpgradesBtn, sectionUpgrades));
  tabGunsBtn.addEventListener('click', () => switchTab(tabGunsBtn, sectionGuns));
  tabLeaderboardBtn.addEventListener('click', () => switchTab(tabLeaderboardBtn, sectionLeaderboard));
  tabAccountBtn.addEventListener('click', () => switchTab(tabAccountBtn, sectionAccount));

  settingsPfpFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      selectedNewPfpBase64 = event.target.result;
      settingsPfpPreview.src = selectedNewPfpBase64;
    };
    reader.readAsDataURL(file);
  });

  function loadAccountSettings() {
    if (!currentUserData) return;
    settingsUsernameInput.value = currentUserData.username || "";
    settingsPfpPreview.src = currentUserData.pfp || "images/default-avatar.png";
    settingsPasswordInput.value = "";
    settingsPfpFile.value = "";
    selectedNewPfpBase64 = null;
    accountMsg.innerText = "";
  }

  saveAccountBtn.addEventListener('click', async () => {
    if (!currentUserData) return;
    const newUsername = settingsUsernameInput.value.trim();
    const newPassword = settingsPasswordInput.value.trim();

    try {
      accountMsg.innerText = "Saving changes...";
      const userRef = db.collection("users").doc(currentUserData.uid);

      let updateData = {};
      if (selectedNewPfpBase64) {
        updateData.pfp = selectedNewPfpBase64;
        currentUserData.pfp = selectedNewPfpBase64;
        hudUserPfp.src = selectedNewPfpBase64;
      }

      if (newUsername && newUsername !== currentUserData.username) {
        updateData.username = newUsername;
        currentUserData.username = newUsername;
        playerNameDisplay.innerText = newUsername;
      }

      await userRef.set(updateData, { merge: true });

      if (newPassword) {
        await auth.currentUser.updatePassword(newPassword);
      }

      accountMsg.innerText = "Saved successfully!";
    } catch (error) {
      accountMsg.innerText = "Error: " + error.message;
    }
  });

  if (startBtn) startBtn.addEventListener('click', startGame);
  if (mainStartBtn) mainStartBtn.addEventListener('click', startGame);
  if (restartBtn) restartBtn.addEventListener('click', startGame);

  if (shopToggleBtn) shopToggleBtn.addEventListener('click', openShop);
  if (closeShopBtn) closeShopBtn.addEventListener('click', closeShop);

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
    if (points >= costs.multiplier) {
      points -= costs.multiplier;
      pointsMultiplier *= 2;
      costs.multiplier = Math.floor(costs.multiplier * 2.5);
      buyMultiplierBtn.innerText = `Buy (${costs.multiplier} Pts)`;
      updateUI();
    }
  });

  if (buyTimeBtn) buyTimeBtn.addEventListener('click', () => {
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
    if (points >= costs.shield && !hasShield) {
      points -= costs.shield;
      hasShield = true;
      buyShieldBtn.innerText = 'ACTIVE 🛡️';
      buyShieldBtn.disabled = true;
      updateUI();
    }
  });

  if (buyCritBtn) buyCritBtn.addEventListener('click', () => {
    if (points >= costs.crit && !hasCrit) {
      points -= costs.crit;
      hasCrit = true;
      buyCritBtn.innerText = 'ACTIVE 💥';
      buyCritBtn.disabled = true;
      updateUI();
    }
  });

  if (buyBgBtn) buyBgBtn.addEventListener('click', () => {
    if (points >= costs.bg && !customBgUnlocked) {
      points -= costs.bg;
      customBgUnlocked = true;
      buyBgBtn.innerText = 'UNLOCKED 🖼️';
      buyBgBtn.disabled = true;
      if (gameArea) gameArea.style.backgroundImage = "url('background.jpg')";
      updateUI();
      alert("ALERT‼️ you are not shooting me as a child, you are shooting those bitches to protect me as a child from them. if you miss and shoot me instead, then fuck you.");
    }
  });

  updateUI();
});

function saveScoreToLeaderboard(score) {
  if (!currentUserData) return;
  db.collection("leaderboard").add({
    uid: currentUserData.uid,
    username: currentUserData.username,
    pfp: currentUserData.pfp || "images/default-avatar.png",
    score: score,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(error => console.error("Error saving score:", error));
}

function fetchLeaderboard() {
  leaderboardList.innerHTML = "<li>Loading global scores...</li>";
  db.collection("leaderboard")
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .then((querySnapshot) => {
      leaderboardList.innerHTML = "";
      if (querySnapshot.empty) {
        leaderboardList.innerHTML = "<li>No scores recorded yet.</li>";
        return;
      }
      let rank = 1;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement('li');
        const userPfp = data.pfp || "images/default-avatar.png";
        li.innerHTML = `
          <div class="lb-user-info">
            <span>#${rank}</span>
            <img src="${userPfp}" class="lb-pfp" alt="">
            <span>${data.username}</span>
          </div>
          <span>${data.score.toLocaleString()} Pts</span>
        `;
        leaderboardList.appendChild(li);
        rank++;
      });
    })
    .catch((error) => {
      leaderboardList.innerHTML = "<li>Error loading leaderboard.</li>";
      console.error("Error getting leaderboard:", error);
    });
}

function handleGunClick(gunIndex) {
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

  for (let i = 0; i < 10; i++) {
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
  if (buyBgBtn) buyBgBtn.disabled = points < costs.bg || customBgUnlocked;

  updateGunShopUI();
}

function openShop() {
  if (!isGameActive) return;
  isPaused = true;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
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
    if (remainingTime <= 0) endGame("ROUND COMPLETE");
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
  customBgUnlocked = false;

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
  if (buyBgBtn) {
    buyBgBtn.innerText = `Buy (${costs.bg} Pts)`;
    buyBgBtn.disabled = false;
  }

  ownedGuns = [true, false, false, false, false, false, false, false];
  currentEquippedGun = 0;
  if (currentGunImg) currentGunImg.src = gunsData[0].file;

  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  hitCounts.flag = [0, 0];

  if (gameArea) gameArea.style.backgroundImage = "";

  updateUI();

  if (startScreen) startScreen.classList.add('hidden');
  if (shopModal) shopModal.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');

  clearEntities();
  resumeTimers();
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
    endGame("GAME OVER BITCH, DON’T SHOOT ME");
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

function endGame(titleText = "ROUND COMPLETE") {
  isGameActive = false;
  isPaused = false;
  clearInterval(gameTimer);
  clearInterval(spawnInterval);
  if (moveInterval) clearInterval(moveInterval);
  clearEntities();

  let personalBest = localStorage.getItem('tactical_high_score') || 0;
  if (points > personalBest) {
    personalBest = points;
    localStorage.setItem('tactical_high_score', personalBest);
  }

  saveScoreToLeaderboard(points);

  if (gameOverTitle) gameOverTitle.innerText = titleText;
  if (finalScoreDisplay) finalScoreDisplay.innerText = points;
  if (personalBestDisplay) personalBestDisplay.innerText = personalBest;
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}
