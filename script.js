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

let isAudioEnabled = localStorage.getItem('tactical_audio') !== 'false';

function playCustomAudio(audioObj) {
  if (!isAudioEnabled) return;
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
let laserSightActive = false;
let adrenalineActive = false;

let bgMoazUnlocked = false;
let bgGoatUnlocked = false;
let bgShakhtarUnlocked = false;
let currentBg = 'default';

// Localization & Game Modes
let currentLang = localStorage.getItem('tactical_lang') || 'en';
let gameMode = localStorage.getItem('tactical_gamemode') || 'levels';
let currentLevel = parseInt(localStorage.getItem('tactical_current_level') || '1', 10);
let currentObjective = { type: 'score', targetScore: 100, targetPolitician: -1, requiredHits: 0, maxAllowedHits: 999 };

let isGameActive = false;
let isPaused = false;
let gameTimer = null;
let spawnInterval = null;
let moveInterval = null;

let initialCosts = { multiplier: 50, time: 75, shield: 350, crit: 500, laser: 1200, adrenaline: 2500, bgMoaz: 5000, bgGoat: 10000, bgShakhtar: 20000 };
let costs = { ...initialCosts };

// Translations dictionary
const translations = {
  en: {
    level: "LEVEL",
    score: "SCORE",
    time: "TIME",
    upgradesBtn: "UPGRADES",
    startBtn: "START",
    deployBtn: "DEPLOY TO RANGE",
    lobbyTitle: "TACTICAL HEADSHOT RANGE",
    currentDeployment: "CURRENT DEPLOYMENT: LEVEL",
    currentMode: "CURRENT MODE: FREEPLAY",
    howToPlay: "HOW TO PLAY",
    tut1: "🎯 <b>Targets:</b> Tap/shoot enemy politicians and flags to rack up points and build combos.",
    tut2: "📋 <b>Level Objectives:</b> Meet the score or hit quotas before the timer runs out to clear the level!",
    tut3: "⚠️ <b>Warnings:</b> Avoid shooting civilians or hitting active bombs, or your stats will wipe!",
    tut4: "⚡ <b>Armory:</b> Spend points in Upgrades & Guns. Advancing levels or resetting wipes points & upgrades!",
    tutBtn: "GOT IT, LET'S SHOOT",
    settingsTitle: "SETTINGS & PROGRESS",
    langHeader: "Language",
    langDesc: "Choose your preferred language:",
    audioHeader: "Volume / Audio",
    audioDesc: "Toggle sound effects on or off.",
    soundOn: "SOUND: ON",
    soundOff: "SOUND: OFF",
    modeHeader: "Game Mode",
    modeLevels: "Current: Levels Mode",
    modeFreeplay: "Current: Freeplay Mode (No Levels)",
    switchFreeplay: "SWITCH TO FREEPLAY",
    switchLevels: "SWITCH TO LEVELS MODE",
    progHeader: "Progress Management",
    progDesc: "Reset level back to Level 1 (Wipes points & upgrades).",
    resetBtn: "RESET LEVEL TO 1",
    backBtn: "BACK",
    armoryTitle: "ARMORY & INTEL",
    gamePaused: "⏸️ GAME PAUSED",
    lobbyArmory: "⚡ LOBBY ARMORY (START A ROUND TO BUY)",
    tabUpgrades: "⚡ Upgrades",
    tabGuns: "🔫 Guns",
    resumeGame: "RESUME GAME",
    objHeader: "📋 LEVEL OBJECTIVES",
    trackerHeader: "🎯 Target Hit Tracker",
    roundComplete: "ROUND COMPLETE",
    levelCleared: "LEVEL CLEARED!",
    levelFailed: "LEVEL FAILED",
    nextLevel: "NEXT LEVEL",
    retryLevel: "RETRY LEVEL",
    playAgain: "PLAY AGAIN",
    personalBest: "PERSONAL BEST",
    buy: "Buy",
    equip: "Equip",
    equipped: "Equipped",
    unavailable: "Unavailable",
    active: "ACTIVE",
    shieldBlocked: "SHIELD BLOCKED!",
    boomWiped: "BOOM! STATS WIPED!",
    critText: "CRIT!",
    flagText: "FLAG!",
    // Upgrades
    upgMultName: "Double Multiplier", upgMultDesc: "Doubles score payout per hit.",
    upgTimeName: "Extra Time (+10s)", upgTimeDesc: "Adds +10s to active round timer.",
    upgShieldName: "Bomb Shield", upgShieldDesc: "Blocks 1 accidental bomb explosion.",
    upgCritName: "Critical Strike", upgCritDesc: "25% chance for 3x critical point hits.",
    upgLaserName: "Laser Sight", upgLaserDesc: "Increases critical strike chance to 50%.",
    upgAdrenalineName: "Adrenaline Shot", upgAdrenalineDesc: "Permanently boosts current multiplier by +2x.",
    upgMoazName: "Background of Moaz", upgMoazDesc: "Changes arena background to Moaz.",
    upgGoatName: "Background of the goat", upgGoatDesc: "Changes arena background to the best person in history.",
    upgShakhtarName: "Shakhtar Background", upgShakhtarDesc: "Changes arena background to FC Shakhtar Donetsk.",
    // Guns
    gun0Name: "Standard Pistol", gun0Desc: "Owned (Starter)",
    gun1Name: "Compact Sidearm", gun1Desc: "Upgraded Sidearm",
    gun2Name: "Tactical Carbine", gun2Desc: "Mid-tier Rifle",
    gun3Name: "Holographic SMG", gun3Desc: "High-rate Fire",
    gun4Name: "Heavy Assaulter", gun4Desc: "Heavy Duty",
    gun5Name: "Cyberpunk Rifle", gun5Desc: "Futuristic Tech",
    gun6Name: "Advanced Marksman", gun6Desc: "Elite Precision",
    gun7Name: "Heavy RPG", gun7Desc: "Most Expensive"
  },
  uk: {
    level: "РІВЕНЬ",
    score: "РАХУНОК",
    time: "ЧАС",
    upgradesBtn: "ПОКРАЩЕННЯ",
    startBtn: "ПОЧАТИ",
    deployBtn: "ВИЙТИ НА ПОЛІГОН",
    lobbyTitle: "ТАКТИЧНИЙ ТИР",
    currentDeployment: "ПОТОЧНИЙ РІВЕНЬ:",
    currentMode: "РЕЖИМ: ВІЛЬНА ГРА",
    howToPlay: "ЯК ГРАТИ",
    tut1: "🎯 <b>Цілі:</b> Стріляйте по політиках і прапорах для балів і комбо.",
    tut2: "📋 <b>Цілі рівня:</b> Досягніть рахунку до закінчення часу, щоб пройти рівень!",
    tut3: "⚠️ <b>Попередження:</b> Уникайте цивільних та бомб, інакше прогрес буде скинуто!",
    tut4: "⚡ <b>Арсенал:</b> Витрачайте бали на покращення. Новий рівень або скидання очищає бали та покращення!",
    tutBtn: "ЗРОЗУМІЛО, ПОГНАЛИ",
    settingsTitle: "НАЛАШТУВАННЯ ТА ПРОГРЕС",
    langHeader: "Мова",
    langDesc: "Оберіть мову гри:",
    audioHeader: "Гучність / Звук",
    audioDesc: "Увімкнути або вимкнути звукові ефекти.",
    soundOn: "ЗВУК: УВІМК.",
    soundOff: "ЗВУК: ВИМК.",
    modeHeader: "Режим гри",
    modeLevels: "Поточний: Рівні",
    modeFreeplay: "Поточний: Вільна гра",
    switchFreeplay: "ПЕРЕКЛЮЧИТИ НА ВІЛЬНУ ГРУ",
    switchLevels: "ПЕРЕКЛЮЧИТИ НА РІВНІ",
    progHeader: "Керування прогресом",
    progDesc: "Скинути рівень до 1 (Очищає бали та покращення).",
    resetBtn: "СКИНУТИ РІВЕНЬ ДО 1",
    backBtn: "НАЗАД",
    armoryTitle: "АРСЕНАЛ І ІНФО",
    gamePaused: "⏸️ ГРУ ПРИЗУПИНЕНО",
    lobbyArmory: "⚡ АРСЕНАЛ (ПОЧНІТЬ РАУНД ДЛЯ КУПІВЛІ)",
    tabUpgrades: "⚡ Покращення",
    tabGuns: "🔫 Зброя",
    resumeGame: "ПОВЕРНУТИСЬ ДО ГРИ",
    objHeader: "📋 ЦІЛІ РІВНЯ",
    trackerHeader: "🎯 Трекер влучань",
    roundComplete: "РАУНД ЗАВЕРШЕНО",
    levelCleared: "РІВЕНЬ ПРОЙДЕНО!",
    levelFailed: "РІВЕНЬ ПРОВАЛЕНО",
    nextLevel: "НАСТУПНИЙ РІВЕНЬ",
    retryLevel: "ПОВТОРИТИ РІВЕНЬ",
    playAgain: "ГРАТИ ЗНОВУ",
    personalBest: "РЕКОРД",
    buy: "Купити",
    equip: "Екіпірувати",
    equipped: "Екіпіровано",
    unavailable: "Недоступно",
    active: "АКТИВНО",
    shieldBlocked: "ЩИТ ЗАХИСТИВ!",
    boomWiped: "БУМ! СТАТИСТИКУ СКИНУТО!",
    critText: "КРИТ!",
    flagText: "ПРАПОР!",
    // Upgrades
    upgMultName: "Подвійний множник", upgMultDesc: "Подвоює очки за влучання.",
    upgTimeName: "Додатковий час (+10с)", upgTimeDesc: "Додає 10 секунд до таймера.",
    upgShieldName: "Щит від бомб", upgShieldDesc: "Блокує вибух бомби 1 раз.",
    upgCritName: "Критичний удар", upgCritDesc: "25% шанс на потрійні очки.",
    upgLaserName: "Лазерний приціл", upgLaserDesc: "Підвищує шанс криту до 50%.",
    upgAdrenalineName: "Адреналін", upgAdrenalineDesc: "Постійно підвищує множник на +2x.",
    upgMoazName: "Фон Моаза", upgMoazDesc: "Змінює фон арени на Моаза.",
    upgGoatName: "Фон найкращої людини", upgGoatDesc: "Змінює фон на найкращу людину в історії.",
    upgShakhtarName: "Фон Шахтаря", upgShakhtarDesc: "Змінює фон на ФК Шахтар Донецьк.",
    // Guns
    gun0Name: "Стандартний пістолет", gun0Desc: "Початкова",
    gun1Name: "Компактний пістолет", gun1Desc: "Покращена",
    gun2Name: "Тактичний карабін", gun2Desc: "Середня гвинтівка",
    gun3Name: "Голографічний ПП", gun3Desc: "Швидкострільна",
    gun4Name: "Важкий штурмовик", gun4Desc: "Важке озброєння",
    gun5Name: "Кіберпанк гвинтівка", gun5Desc: "Футуристична",
    gun6Name: "Елітний снайпер", gun6Desc: "Висока точність",
    gun7Name: "Важкий РПГ", gun7Desc: "Найдорожча"
  },
  pt: {
    level: "NÍVEL",
    score: "PONTOS",
    time: "TEMPO",
    upgradesBtn: "MELHORIAS",
    startBtn: "INICIAR",
    deployBtn: "IR PARA O CAMPO",
    lobbyTitle: "ESTANDE TÁTICO",
    currentDeployment: "NÍVEL ATUAL:",
    currentMode: "MODO: JOGO LIVRE",
    howToPlay: "COMO JOGAR",
    tut1: "🎯 <b>Alvos:</b> Atire em políticos e bandeiras para acumular pontos e combos.",
    tut2: "📋 <b>Objetivos:</b> Alcance a pontuação antes do tempo acabar para vencer o nível!",
    tut3: "⚠️ <b>Avisos:</b> Evite civis ou bombas, ou suas estatísticas serão resetadas!",
    tut4: "⚡ <b>Arsenal:</b> Gaste pontos em melhorias. Trocar de nível ou resetar apaga pontos e melhorias!",
    tutBtn: "ENTENDI, VAMO ATIRAR",
    settingsTitle: "CONFIGURAÇÕES E PROGRESSO",
    langHeader: "Idioma",
    langDesc: "Escolha seu idioma preferido:",
    audioHeader: "Volume / Áudio",
    audioDesc: "Ativar ou desativar efeitos sonoros.",
    soundOn: "SOM: LIGADO",
    soundOff: "SOM: DESLIGADO",
    modeHeader: "Modo de Jogo",
    modeLevels: "Atual: Modo Níveis",
    modeFreeplay: "Atual: Jogo Livre (Sem Níveis)",
    switchFreeplay: "MUDAR PARA JOGO LIVRE",
    switchLevels: "MUDAR PARA MODO NÍVEIS",
    progHeader: "Gerenciamento de Progresso",
    progDesc: "Resetar nível para o Nível 1 (Apaga pontos e melhorias).",
    resetBtn: "RESETAR PARA O NÍVEL 1",
    backBtn: "VOLTAR",
    armoryTitle: "ARSENAL E INTEL",
    gamePaused: "⏸️ JOGO PAUSADO",
    lobbyArmory: "⚡ ARSENAL (INICIE UMA PARTIDA PARA COMPRAR)",
    tabUpgrades: "⚡ Melhorias",
    tabGuns: "🔫 Armas",
    resumeGame: "RETOMAR JOGO",
    objHeader: "📋 OBJETIVOS DO NÍVEL",
    trackerHeader: "🎯 Rastreador de Alvos",
    roundComplete: "RODADA COMPLETA",
    levelCleared: "NÍVEL CONCLUÍDO!",
    levelFailed: "NÍVEL FALHOU",
    nextLevel: "PRÓXIMO NÍVEL",
    retryLevel: "TENTAR NOVAMENTE",
    playAgain: "JOGAR DE NOVO",
    personalBest: "RECORDE PESSOAL",
    buy: "Comprar",
    equip: "Equipar",
    equipped: "Equipado",
    unavailable: "Indisponível",
    active: "ATIVO",
    shieldBlocked: "ESCUDO BLOQUEU!",
    boomWiped: "BOOM! ESTATÍSTICAS ZERADAS!",
    critText: "CRÍTICO!",
    flagText: "BANDEIRA!",
    // Upgrades
    upgMultName: "Multiplicador Duplo", upgMultDesc: "Dobrar pontos por acerto.",
    upgTimeName: "Tempo Extra (+10s)", upgTimeDesc: "Adiciona +10s ao temporizador.",
    upgShieldName: "Escudo de Bomba", upgShieldDesc: "Bloqueia 1 explosão de bomba.",
    upgCritName: "Ataque Crítico", upgCritDesc: "25% de chance de 3x pontos.",
    upgLaserName: "Mira Laser", upgLaserDesc: "Aumenta chance de crítico para 50%.",
    upgAdrenalineName: "Injeção de Adrenalina", upgAdrenalineDesc: "Aumenta permanentemente o multiplicador em +2x.",
    upgMoazName: "Fundo do Moaz", upgMoazDesc: "Muda o fundo da arena para o Moaz.",
    upgGoatName: "Fundo da Lenda", upgGoatDesc: "Muda o fundo para a melhor pessoa da história.",
    upgShakhtarName: "Fundo do Shakhtar", upgShakhtarDesc: "Muda o fundo para o FC Shakhtar Donetsk.",
    // Guns
    gun0Name: "Pistola Padrão", gun0Desc: "Adquirida (Inicial)",
    gun1Name: "Arma Compacta", gun1Desc: "Arma Aprimorada",
    gun2Name: "Carabina Tática", gun2Desc: "Rifle Intermediário",
    gun3Name: "SMG Holográfica", gun3Desc: "Alta Cadência",
    gun4Name: "Assaltante Pesado", gun4Desc: "Pesado",
    gun5Name: "Rifle Cyberpunk", gun5Desc: "Tecnologia Futurista",
    gun6Name: "Atirador de Elite", gun6Desc: "Precisão Elite",
    gun7Name: "RPG Pesado", gun7Desc: "Mais Caro"
  },
  ar: {
    level: "المستوى",
    score: "النقاط",
    time: "الوقت",
    upgradesBtn: "الترقيات",
    startBtn: "ابدأ",
    deployBtn: "انطلق للساحة",
    lobbyTitle: "رماية التكتيكية",
    currentDeployment: "المستوى الحالي:",
    currentMode: "الوضع: اللعب الحر",
    howToPlay: "كيفية اللعب",
    tut1: "🎯 <b>الأهداف:</b> اضغط على السياسيين الأعداء والأعلام لجمع النقاط.",
    tut2: "📋 <b>أهداف المستوى:</b> حقق النقاط المطلوبة قبل نفاد الوقت لاجتياز المستوى!",
    tut3: "⚠️ <b>تحذيرات:</b> تجنب إطلاق النار على المدنيين أو القنابل وإلا ستفقد تقدمك!",
    tut4: "⚡ <b>الترقيات:</b> انفق النقاط لشراء الترقيات. التقدم لمستوى جديد يعيد تعيين النقاط والترقيات!",
    tutBtn: "فهمت، هيا لنبدأ",
    settingsTitle: "الإعدادات والتقدم",
    langHeader: "اللغة",
    langDesc: "اختر لغتك المفضلة:",
    audioHeader: "مستوى الصوت / الصوت",
    audioDesc: "تشغيل أو إيقاف المؤثرات الصوتية.",
    soundOn: "الصوت: تشغيل",
    soundOff: "الصوت: إيقاف",
    modeHeader: "وضع اللعب",
    modeLevels: "الحالي: وضع المستويات",
    modeFreeplay: "الحالي: اللعب الحر (بدون مستويات)",
    switchFreeplay: "التحويل للعب الحر",
    switchLevels: "التحويل لوضع المستويات",
    progHeader: "إدارة التقدم",
    progDesc: "إعادة تعيين المستوى إلى 1 (يمسح النقاط والترقيات).",
    resetBtn: "إعادة تعيين المستوى إلى 1",
    backBtn: "رجوع",
    armoryTitle: "الترسانة",
    gamePaused: "⏸️ اللعبة متوقفة",
    lobbyArmory: "⚡ الترسانة (ابدأ جولة للشراء)",
    tabUpgrades: "⚡ الترقيات",
    tabGuns: "🔫 الأسلحة",
    resumeGame: "استئناف اللعبة",
    objHeader: "📋 أهداف المستوى",
    trackerHeader: "🎯 متتبع الإصابات",
    roundComplete: "انتهت الجولة",
    levelCleared: "تم اجتياز المستوى!",
    levelFailed: "فشل المستوى",
    nextLevel: "المستوى التالي",
    retryLevel: "إعادة المحاولة",
    playAgain: "العب مجدداً",
    personalBest: "أفضل رقم قياسي",
    buy: "شراء",
    equip: "تجهيز",
    equipped: "مجهز",
    unavailable: "غير متوفر",
    active: "نشط",
    shieldBlocked: "تم صد القنبلة بالدرع!",
    boomWiped: "بوم! تم مسح النقاط!",
    critText: "ضربة حرجة!",
    flagText: "علم!",
    // Upgrades
    upgMultName: "مضاعف النقاط", upgMultDesc: "يضاعف النقاط لكل إصابة.",
    upgTimeName: "وقت إضافي (+10ث)", upgTimeDesc: "يضيف 10 ثوانٍ للوقت.",
    upgShieldName: "درع القنابل", upgShieldDesc: "يحجب انفجار قنبلة واحدة.",
    upgCritName: "ضربة حرجة", upgCritDesc: "فرصة 25% لمضاعفة النقاط 3 أضعاف.",
    upgLaserName: "منظار ليزر", upgLaserDesc: "يزيد فرصة الضربات الحرجة إلى 50%.",
    upgAdrenalineName: "حقنة أدرينالين", upgAdrenalineDesc: "يزيد مضاعف النقاط الحالي بـ +2x.",
    upgMoazName: "خلفية معاذ", upgMoazDesc: "يغير خلفية الساحة إلى معاذ.",
    upgGoatName: "خلفية الأسطورة", upgGoatDesc: "يغير الخلفية إلى أفضل شخصية.",
    upgShakhtarName: "خلفية شاختار", upgShakhtarDesc: "يغير الخلفية إلى نادي شاختار دونيتسك.",
    // Guns
    gun0Name: "مسدس قياسي", gun0Desc: "مملوك (أساسي)",
    gun1Name: "مسدس مدمج", gun1Desc: "مسدس مطور",
    gun2Name: "كاربين تكتيكي", gun2Desc: "بندقية متوسطة",
    gun3Name: "رشاش هولوغرافي", gun3Desc: "سرعة إطلاق عالية",
    gun4Name: "مهاجم ثقيل", gun4Desc: "خدمة شاقة",
    gun5Name: "بندقية سيبربانك", gun5Desc: "تكنولوجيا مستقبلية",
    gun6Name: "قناص متقدم", gun6Desc: "دقة فائقة",
    gun7Name: "آر بي جي ثقيل", gun7Desc: "الأغلى سعراً"
  }
};

// DOM Elements
let pointsDisplay, comboDisplay, multiplierDisplay, timeDisplay, levelDisplay, hudLevelBox, gameArea, muzzleFlash, weaponGun, currentGunImg;
let mainStartBtn, restartBtn, shopToggleBtn, closeShopBtn, settingsToggleBtn, closeSettingsBtn, resetLevelBtn, toggleGamemodeBtn, toggleAudioBtn;
let startScreen, shopModal, settingsModal, tutorialModal, closeTutorialBtn, gameOverScreen, gameOverTitle, finalScoreDisplay, personalBestDisplay, shopStatusNotice, lobbyLevelInfo, objectiveText, gamemodeDesc;
let tabUpgradesBtn, tabGunsBtn, sectionUpgrades, sectionGuns;
let buyMultiplierBtn, buyTimeBtn, buyShieldBtn, buyCritBtn, buyLaserBtn, buyAdrenalineBtn, buyBgMoazBtn, buyBgGoatBtn, buyBgShakhtarBtn;
let langEnBtn, langUkBtn, langPtBtn, langArBtn;

window.addEventListener('DOMContentLoaded', () => {
  pointsDisplay = document.getElementById('points-display');
  comboDisplay = document.getElementById('combo-display');
  multiplierDisplay = document.getElementById('multiplier-display');
  timeDisplay = document.getElementById('time-display');
  levelDisplay = document.getElementById('level-display');
  hudLevelBox = document.getElementById('hud-level-box');
  gameArea = document.getElementById('game-area');
  muzzleFlash = document.getElementById('muzzle-flash');
  weaponGun = document.getElementById('weapon-gun');
  currentGunImg = document.getElementById('current-gun-img');

  mainStartBtn = document.getElementById('main-start-btn');
  restartBtn = document.getElementById('restart-btn');
  shopToggleBtn = document.getElementById('shop-toggle-btn');
  closeShopBtn = document.getElementById('close-shop-btn');
  settingsToggleBtn = document.getElementById('settings-toggle-btn');
  closeSettingsBtn = document.getElementById('close-settings-btn');
  resetLevelBtn = document.getElementById('reset-level-btn');
  toggleGamemodeBtn = document.getElementById('toggle-gamemode-btn');
  toggleAudioBtn = document.getElementById('toggle-audio-btn');

  startScreen = document.getElementById('start-screen');
  shopModal = document.getElementById('shop-modal');
  settingsModal = document.getElementById('settings-modal');
  tutorialModal = document.getElementById('tutorial-modal');
  closeTutorialBtn = document.getElementById('close-tutorial-btn');
  gameOverScreen = document.getElementById('game-over-screen');
  gameOverTitle = document.getElementById('game-over-title');
  finalScoreDisplay = document.getElementById('final-score');
  personalBestDisplay = document.getElementById('personal-best');
  shopStatusNotice = document.getElementById('shop-status-notice');
  lobbyLevelInfo = document.getElementById('lobby-level-info');
  objectiveText = document.getElementById('objective-text');
  gamemodeDesc = document.getElementById('gamemode-desc');

  tabUpgradesBtn = document.getElementById('tab-upgrades-btn');
  tabGunsBtn = document.getElementById('tab-guns-btn');
  sectionUpgrades = document.getElementById('section-upgrades');
  sectionGuns = document.getElementById('section-guns');

  buyMultiplierBtn = document.getElementById('buy-multiplier');
  buyTimeBtn = document.getElementById('buy-time');
  buyShieldBtn = document.getElementById('buy-shield');
  buyCritBtn = document.getElementById('buy-crit');
  buyLaserBtn = document.getElementById('buy-laser');
  buyAdrenalineBtn = document.getElementById('buy-adrenaline');
  buyBgMoazBtn = document.getElementById('buy-bg-moaz');
  buyBgGoatBtn = document.getElementById('buy-bg-goat');
  buyBgShakhtarBtn = document.getElementById('buy-bg-shakhtar');

  langEnBtn = document.getElementById('lang-en-btn');
  langUkBtn = document.getElementById('lang-uk-btn');
  langPtBtn = document.getElementById('lang-pt-btn');
  langArBtn = document.getElementById('lang-ar-btn');

  if (!localStorage.getItem('tactical_tutorial_seen')) {
    if (tutorialModal) tutorialModal.classList.remove('hidden');
  }

  if (closeTutorialBtn) {
    closeTutorialBtn.addEventListener('click', () => {
      if (tutorialModal) tutorialModal.classList.add('hidden');
      localStorage.setItem('tactical_tutorial_seen', 'true');
    });
  }

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
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
  if (resetLevelBtn) resetLevelBtn.addEventListener('click', resetProgress);
  if (toggleGamemodeBtn) toggleGamemodeBtn.addEventListener('click', toggleGameMode);
  if (toggleAudioBtn) toggleAudioBtn.addEventListener('click', toggleAudio);

  if (langEnBtn) langEnBtn.addEventListener('click', () => setLanguage('en'));
  if (langUkBtn) langUkBtn.addEventListener('click', () => setLanguage('uk'));
  if (langPtBtn) langPtBtn.addEventListener('click', () => setLanguage('pt'));
  if (langArBtn) langArBtn.addEventListener('click', () => setLanguage('ar'));

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
      buyMultiplierBtn.innerText = `${t('buy')} (${costs.multiplier} Pts)`;
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
      buyTimeBtn.innerText = `${t('buy')} (${costs.time} Pts)`;
      updateUI();
    }
  });

  if (buyShieldBtn) buyShieldBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.shield && !hasShield) {
      points -= costs.shield;
      hasShield = true;
      buyShieldBtn.innerText = `${t('active')} 🛡️`;
      buyShieldBtn.disabled = true;
      updateUI();
    }
  });

  if (buyCritBtn) buyCritBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.crit && !hasCrit) {
      points -= costs.crit;
      hasCrit = true;
      buyCritBtn.innerText = `${t('active')} 💥`;
      buyCritBtn.disabled = true;
      updateUI();
    }
  });

  if (buyLaserBtn) buyLaserBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.laser && !laserSightActive) {
      points -= costs.laser;
      laserSightActive = true;
      buyLaserBtn.innerText = `${t('active')} 🎯`;
      buyLaserBtn.disabled = true;
      updateUI();
    }
  });

  if (buyAdrenalineBtn) buyAdrenalineBtn.addEventListener('click', () => {
    if (!isGameActive) return;
    if (points >= costs.adrenaline && !adrenalineActive) {
      points -= costs.adrenaline;
      adrenalineActive = true;
      pointsMultiplier += 2;
      buyAdrenalineBtn.innerText = `${t('active')} 💉`;
      buyAdrenalineBtn.disabled = true;
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

  applyLocalization();
  setupLevelObjectives();
  updateGameModeUI();
  updateAudioUI();
  updateUI();
});

function t(key) {
  return translations[currentLang][key] || translations['en'][key] || key;
}

function setLanguage(langCode) {
  currentLang = langCode;
  localStorage.setItem('tactical_lang', langCode);
  applyLocalization();
  setupLevelObjectives();
  updateGameModeUI();
  updateAudioUI();
  updateUI();
}

function applyLocalization() {
  document.getElementById('lbl-level').innerText = t('level');
  document.getElementById('lbl-score').innerText = t('score');
  document.getElementById('lbl-time').innerText = t('time');
  document.getElementById('shop-toggle-btn').innerText = t('upgradesBtn');
  document.getElementById('start-btn').innerText = t('startBtn');
  document.getElementById('txt-lobby-title').innerText = t('lobbyTitle');
  document.getElementById('main-start-btn').innerText = t('deployBtn');

  document.getElementById('txt-tut-title').innerText = t('howToPlay');
  document.getElementById('txt-tut-1').innerHTML = t('tut1');
  document.getElementById('txt-tut-2').innerHTML = t('tut2');
  document.getElementById('txt-tut-3').innerHTML = t('tut3');
  document.getElementById('txt-tut-4').innerHTML = t('tut4');
  document.getElementById('close-tutorial-btn').innerText = t('tutBtn');

  document.getElementById('txt-settings-title').innerText = t('settingsTitle');
  document.getElementById('txt-lang-header').innerText = t('langHeader');
  document.getElementById('txt-lang-desc').innerText = t('langDesc');
  document.getElementById('txt-audio-header').innerText = t('audioHeader');
  document.getElementById('txt-audio-desc').innerText = t('audioDesc');
  document.getElementById('txt-mode-header').innerText = t('modeHeader');
  document.getElementById('txt-prog-header').innerText = t('progHeader');
  document.getElementById('txt-prog-desc').innerText = t('progDesc');
  document.getElementById('reset-level-btn').innerText = t('resetBtn');
  document.getElementById('close-settings-btn').innerText = t('backBtn');

  document.getElementById('txt-shop-title').innerText = t('armoryTitle');
  document.getElementById('tab-upgrades-btn').innerText = t('tabUpgrades');
  document.getElementById('tab-guns-btn').innerText = t('tabGuns');
  document.getElementById('close-shop-btn').innerText = t('resumeGame');

  document.getElementById('txt-obj-header').innerText = t('objHeader');
  document.getElementById('txt-tracker-header').innerText = t('trackerHeader');
  document.getElementById('restart-btn').innerText = t('nextLevel');
  document.getElementById('lbl-final-score').innerText = t('score');
  document.getElementById('lbl-best-score').innerText = t('personalBest');

  // Upgrades
  document.getElementById('upg-name-mult').innerText = t('upgMultName'); document.getElementById('upg-desc-mult').innerText = t('upgMultDesc');
  document.getElementById('upg-name-time').innerText = t('upgTimeName'); document.getElementById('upg-desc-time').innerText = t('upgTimeDesc');
  document.getElementById('upg-name-shield').innerText = t('upgShieldName'); document.getElementById('upg-desc-shield').innerText = t('upgShieldDesc');
  document.getElementById('upg-name-crit').innerText = t('upgCritName'); document.getElementById('upg-desc-crit').innerText = t('upgCritDesc');
  document.getElementById('upg-name-laser').innerText = t('upgLaserName'); document.getElementById('upg-desc-laser').innerText = t('upgLaserDesc');
  document.getElementById('upg-name-adrenaline').innerText = t('upgAdrenalineName'); document.getElementById('upg-desc-adrenaline').innerText = t('upgAdrenalineDesc');
  document.getElementById('upg-name-moaz').innerText = t('upgMoazName'); document.getElementById('upg-desc-moaz').innerText = t('upgMoazDesc');
  document.getElementById('upg-name-goat').innerText = t('upgGoatName'); document.getElementById('upg-desc-goat').innerText = t('upgGoatDesc');
  document.getElementById('upg-name-shakhtar').innerText = t('upgShakhtarName'); document.getElementById('upg-desc-shakhtar').innerText = t('upgShakhtarDesc');

  // Guns
  for (let i = 0; i < 8; i++) {
    document.getElementById(`gun-name-${i}`).innerText = t(`gun${i}Name`);
    document.getElementById(`gun-desc-${i}`).innerText = t(`gun${i}Desc`);
  }

  // Highlight active language button
  [langEnBtn, langUkBtn, langPtBtn, langArBtn].forEach(b => { if(b) b.style.border = "1px solid #1f2c3e"; });
  if (currentLang === 'en' && langEnBtn) langEnBtn.style.border = "2px solid #00ffcc";
  if (currentLang === 'uk' && langUkBtn) langUkBtn.style.border = "2px solid #00ffcc";
  if (currentLang === 'pt' && langPtBtn) langPtBtn.style.border = "2px solid #00ffcc";
  if (currentLang === 'ar' && langArBtn) langArBtn.style.border = "2px solid #00ffcc";

  updateAudioUI();
}

function setupLevelObjectives() {
  if (gameMode === 'freeplay') {
    currentObjective = {
      type: 'freeplay',
      targetScore: Infinity,
      targetPolitician: -1,
      requiredHits: 0,
      maxAllowedHits: 999,
      description: t('currentMode')
    };
    if (objectiveText) objectiveText.innerText = currentObjective.description;
    if (lobbyLevelInfo) lobbyLevelInfo.innerText = t('currentMode');
    return;
  }

  let targetScore;
  if (currentLevel <= 5) {
    targetScore = currentLevel * 500;
  } else if (currentLevel <= 15) {
    targetScore = 2500 * Math.pow(1.8, currentLevel - 5);
  } else {
    targetScore = 150000 * Math.pow(2.4, currentLevel - 15);
  }
  targetScore = Math.round(targetScore);

  if (currentLevel % 5 === 0) {
    let politicianIndex = (currentLevel / 5) % headNames.length;
    let requiredHits = 5 + (currentLevel * 2);
    currentObjective = {
      type: 'quota_min',
      targetScore: targetScore,
      targetPolitician: politicianIndex,
      requiredHits: requiredHits,
      maxAllowedHits: 999,
      description: `Lvl ${currentLevel}: Reach ${targetScore.toLocaleString()} Pts & hit ${headNames[politicianIndex]} ${requiredHits}x.`
    };
  } else if (currentLevel % 7 === 0) {
    let politicianIndex = currentLevel % headNames.length;
    let maxHits = Math.max(3, 15 - Math.floor(currentLevel / 3));
    currentObjective = {
      type: 'quota_cap',
      targetScore: targetScore,
      targetPolitician: politicianIndex,
      requiredHits: 0,
      maxAllowedHits: maxHits,
      description: `Lvl ${currentLevel}: Reach ${targetScore.toLocaleString()} Pts. Max hits on ${headNames[politicianIndex]}: ${maxHits}!`
    };
  } else {
    currentObjective = {
      type: 'score',
      targetScore: targetScore,
      targetPolitician: -1,
      requiredHits: 0,
      maxAllowedHits: 999,
      description: `Level ${currentLevel}: Reach ${targetScore.toLocaleString()} Pts.`
    };
  }

  if (objectiveText) objectiveText.innerText = currentObjective.description;
  if (lobbyLevelInfo) lobbyLevelInfo.innerText = `${t('currentDeployment')} ${currentLevel}`;
  if (levelDisplay) levelDisplay.innerText = currentLevel;
}

function openSettings() {
  if (isGameActive) {
    isPaused = true;
    clearInterval(gameTimer);
    clearInterval(spawnInterval);
    if (moveInterval) clearInterval(moveInterval);
  }
  updateGameModeUI();
  updateAudioUI();
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
  if (confirm(t('progDesc'))) {
    currentLevel = 1;
    localStorage.setItem('tactical_current_level', currentLevel);
    
    // Wipes points & upgrades on reset
    points = 0;
    pointsMultiplier = 1;
    hasShield = false;
    hasCrit = false;
    laserSightActive = false;
    adrenalineActive = false;
    ownedGuns = [true, false, false, false, false, false, false, false];
    currentEquippedGun = 0;
    if (currentGunImg) currentGunImg.src = gunsData[0].file;
    costs = { ...initialCosts };

    setupLevelObjectives();
    updateUI();
    closeSettings();
  }
}

function toggleGameMode() {
  if (gameMode === 'levels') {
    gameMode = 'freeplay';
  } else {
    gameMode = 'levels';
  }
  localStorage.setItem('tactical_gamemode', gameMode);
  setupLevelObjectives();
  updateGameModeUI();
  updateUI();
}

function toggleAudio() {
  isAudioEnabled = !isAudioEnabled;
  localStorage.setItem('tactical_audio', isAudioEnabled);
  updateAudioUI();
}

function updateAudioUI() {
  if (toggleAudioBtn) {
    toggleAudioBtn.innerText = isAudioEnabled ? t('soundOn') : t('soundOff');
    toggleAudioBtn.style.backgroundColor = isAudioEnabled ? "#00ffcc" : "#ff0055";
    toggleAudioBtn.style.color = isAudioEnabled ? "#08090c" : "#ffffff";
  }
}

function updateGameModeUI() {
  if (gameMode === 'freeplay') {
    if (gamemodeDesc) gamemodeDesc.innerText = t('modeFreeplay');
    if (toggleGamemodeBtn) toggleGamemodeBtn.innerText = t('switchLevels');
    if (hudLevelBox) hudLevelBox.style.display = 'none';
  } else {
    if (gamemodeDesc) gamemodeDesc.innerText = t('modeLevels');
    if (toggleGamemodeBtn) toggleGamemodeBtn.innerText = t('switchFreeplay');
    if (hudLevelBox) hudLevelBox.style.display = 'flex';
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
      btn.innerText = t('unavailable');
      btn.disabled = true;
      btn.classList.remove('equipped-status');
      continue;
    }

    if (currentEquippedGun === i) {
      btn.innerText = t('equipped');
      btn.disabled = true;
      btn.classList.add('equipped-status');
    } else if (ownedGuns[i]) {
      btn.innerText = t('equip');
      btn.disabled = false;
      btn.classList.remove('equipped-status');
    } else {
      const price = gunsData[i].price;
      btn.innerText = `${t('buy')} (${price.toLocaleString()} Pts)`;
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
    if (buyMultiplierBtn) { buyMultiplierBtn.disabled = true; buyMultiplierBtn.innerText = t('unavailable'); }
    if (buyTimeBtn) { buyTimeBtn.disabled = true; buyTimeBtn.innerText = t('unavailable'); }
    if (buyShieldBtn) { buyShieldBtn.disabled = true; buyShieldBtn.innerText = t('unavailable'); }
    if (buyCritBtn) { buyCritBtn.disabled = true; buyCritBtn.innerText = t('unavailable'); }
    if (buyLaserBtn) { buyLaserBtn.disabled = true; buyLaserBtn.innerText = t('unavailable'); }
    if (buyAdrenalineBtn) { buyAdrenalineBtn.disabled = true; buyAdrenalineBtn.innerText = t('unavailable'); }
    if (buyBgMoazBtn) { buyBgMoazBtn.disabled = true; buyBgMoazBtn.innerText = t('unavailable'); }
    if (buyBgGoatBtn) { buyBgGoatBtn.disabled = true; buyBgGoatBtn.innerText = t('unavailable'); }
    if (buyBgShakhtarBtn) { buyBgShakhtarBtn.disabled = true; buyBgShakhtarBtn.innerText = t('unavailable'); }
  } else {
    if (buyMultiplierBtn) buyMultiplierBtn.disabled = points < costs.multiplier;
    if (buyTimeBtn) buyTimeBtn.disabled = points < costs.time;
    if (buyShieldBtn) buyShieldBtn.disabled = points < costs.shield || hasShield;
    if (buyCritBtn) buyCritBtn.disabled = points < costs.crit || hasCrit;
    if (buyLaserBtn) buyLaserBtn.disabled = points < costs.laser || laserSightActive;
    if (buyAdrenalineBtn) buyAdrenalineBtn.disabled = points < costs.adrenaline || adrenalineActive;

    if (bgMoazUnlocked) {
      if (currentBg === 'moaz') {
        buyBgMoazBtn.innerText = t('equipped');
        buyBgMoazBtn.disabled = true;
        buyBgMoazBtn.classList.add('equipped-status');
      } else {
        buyBgMoazBtn.innerText = t('equip');
        buyBgMoazBtn.disabled = false;
        buyBgMoazBtn.classList.remove('equipped-status');
      }
    } else {
      buyBgMoazBtn.innerText = `${t('buy')} (${costs.bgMoaz} Pts)`;
      buyBgMoazBtn.disabled = points < costs.bgMoaz;
      buyBgMoazBtn.classList.remove('equipped-status');
    }

    if (bgGoatUnlocked) {
      if (currentBg === 'goat') {
        buyBgGoatBtn.innerText = t('equipped');
        buyBgGoatBtn.disabled = true;
        buyBgGoatBtn.classList.add('equipped-status');
      } else {
        buyBgGoatBtn.innerText = t('equip');
        buyBgGoatBtn.disabled = false;
        buyBgGoatBtn.classList.remove('equipped-status');
      }
    } else {
      buyBgGoatBtn.innerText = `${t('buy')} (${costs.bgGoat} Pts)`;
      buyBgGoatBtn.disabled = points < costs.bgGoat;
      buyBgGoatBtn.classList.remove('equipped-status');
    }

    if (bgShakhtarUnlocked) {
      if (currentBg === 'shakhtar') {
        buyBgShakhtarBtn.innerText = t('equipped');
        buyBgShakhtarBtn.disabled = true;
        buyBgShakhtarBtn.classList.add('equipped-status');
      } else {
        buyBgShakhtarBtn.innerText = t('equip');
        buyBgShakhtarBtn.disabled = false;
        buyBgShakhtarBtn.classList.remove('equipped-status');
      }
    } else {
      buyBgShakhtarBtn.innerText = `${t('buy')} (${costs.bgShakhtar} Pts)`;
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
    if (shopStatusNotice) shopStatusNotice.innerText = t('gamePaused');
  } else {
    if (shopStatusNotice) shopStatusNotice.innerText = t('lobbyArmory');
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

function resetRunStats() {
  points = 0;
  pointsMultiplier = 1;
  combo = 0;
  baseGameTime = 30;
  remainingTime = 30;
  costs = { ...initialCosts };
  hasShield = false;
  hasCrit = false;
  laserSightActive = false;
  adrenalineActive = false;
  bgMoazUnlocked = false;
  bgGoatUnlocked = false;
  bgShakhtarUnlocked = false;
  currentBg = 'default';
  ownedGuns = [true, false, false, false, false, false, false, false];
  currentEquippedGun = 0;
  if (currentGunImg) currentGunImg.src = gunsData[0].file;
  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  hitCounts.flag = [0, 0];
  if (gameArea) gameArea.style.backgroundImage = "";
}

function startGame() {
  isGameActive = true;
  isPaused = false;
  resetRunStats();

  if (buyMultiplierBtn) buyMultiplierBtn.innerText = `${t('buy')} (${costs.multiplier} Pts)`;
  if (buyTimeBtn) buyTimeBtn.innerText = `${t('buy')} (${costs.time} Pts)`;
  if (buyShieldBtn) { buyShieldBtn.innerText = `${t('buy')} (${costs.shield} Pts)`; buyShieldBtn.disabled = false; }
  if (buyCritBtn) { buyCritBtn.innerText = `${t('buy')} (${costs.crit} Pts)`; buyCritBtn.disabled = false; }
  if (buyLaserBtn) { buyLaserBtn.innerText = `${t('buy')} (${costs.laser} Pts)`; buyLaserBtn.disabled = false; }
  if (buyAdrenalineBtn) { buyAdrenalineBtn.innerText = `${t('buy')} (${costs.adrenaline} Pts)`; buyAdrenalineBtn.disabled = false; }
  
  if (buyBgMoazBtn) { buyBgMoazBtn.innerText = `${t('buy')} (${costs.bgMoaz} Pts)`; buyBgMoazBtn.disabled = false; buyBgMoazBtn.classList.remove('equipped-status'); }
  if (buyBgGoatBtn) { buyBgGoatBtn.innerText = `${t('buy')} (${costs.bgGoat} Pts)`; buyBgGoatBtn.disabled = false; buyBgGoatBtn.classList.remove('equipped-status'); }
  if (buyBgShakhtarBtn) { buyBgShakhtarBtn.innerText = `${t('buy')} (${costs.bgShakhtar} Pts)`; buyBgShakhtarBtn.disabled = false; buyBgShakhtarBtn.classList.remove('equipped-status'); }

  setupLevelObjectives();
  updateGameModeUI();
  updateAudioUI();
  updateUI();

  if (startScreen) startScreen.classList.add('hidden');
  if (shopModal) shopModal.classList.add('hidden');
  if (settingsModal) settingsModal.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');

  clearEntities();
  resumeTimers();
}

function checkInstantLevelPass() {
  if (gameMode !== 'levels' || !isGameActive) return;

  let scorePassed = points >= currentObjective.targetScore;
  let quotaMet = true;

  if (currentObjective.type === 'quota_min') {
    let hits = hitCounts.head[currentObjective.targetPolitician];
    if (hits < currentObjective.requiredHits) quotaMet = false;
  }

  if (scorePassed && quotaMet) {
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

    if (gameOverTitle) gameOverTitle.innerText = `🎉 ${t('levelCleared')}`;
    if (restartBtn) restartBtn.innerText = t('nextLevel');
    currentLevel++;
    localStorage.setItem('tactical_current_level', currentLevel);

    // Wipes points & upgrades for the next level
    resetRunStats();

    if (finalScoreDisplay) finalScoreDisplay.innerText = points;
    if (personalBestDisplay) personalBestDisplay.innerText = personalBest;
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    setupLevelObjectives();
  }
}

function checkLevelCompletion() {
  if (gameMode === 'freeplay') {
    endGame(t('roundComplete'));
    return;
  }

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
    failReason = `${t('levelFailed')}: Need ${currentObjective.targetScore.toLocaleString()} Pts`;
  } else if (currentObjective.type === 'quota_min') {
    let hits = hitCounts.head[currentObjective.targetPolitician];
    if (hits < currentObjective.requiredHits) {
      passed = false;
      failReason = `${t('levelFailed')}: Quota not met (${hits}/${currentObjective.requiredHits})`;
    }
  } else if (currentObjective.type === 'quota_cap') {
    let hits = hitCounts.head[currentObjective.targetPolitician];
    if (hits > currentObjective.maxAllowedHits) {
      passed = false;
      failReason = `${t('levelFailed')}: Hit cap exceeded (${hits}/${currentObjective.maxAllowedHits})`;
    }
  }

  let personalBest = parseInt(localStorage.getItem('tactical_high_score') || '0', 10);
  if (points > personalBest) {
    personalBest = points;
    localStorage.setItem('tactical_high_score', personalBest);
  }

  if (passed) {
    if (gameOverTitle) gameOverTitle.innerText = t('levelCleared');
    if (restartBtn) restartBtn.innerText = t('nextLevel');
    currentLevel++;
    localStorage.setItem('tactical_current_level', currentLevel);
    resetRunStats();
  } else {
    if (gameOverTitle) gameOverTitle.innerText = failReason;
    if (restartBtn) restartBtn.innerText = t('retryLevel');
    resetRunStats();
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

  let critChance = laserSightActive ? 0.50 : (hasCrit ? 0.25 : 0);
  let isCrit = Math.random() < critChance;
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
        endGame(`${t('levelFailed')}: EXCEEDED HIT CAP`);
      }, 200);
      return;
    }
  }

  updateUI();
  checkInstantLevelPass();

  triggerGunshotFX(clientX, clientY);
  
  if (isCrit) showPopup(clientX, clientY, `${t('critText')} +${hitPoints}`, 'crit');
  else showPopup(clientX, clientY, `+${hitPoints}`, isGolden ? 'gold' : '');

  setTimeout(() => { if (target.parentNode) target.remove(); }, 350);
}

function hitPenaltyHead(target, clientX, clientY) {
  target.classList.add('shot');
  combo = 0;
  playCustomAudio(bombSound);
  if (isAudioEnabled && navigator.vibrate) navigator.vibrate([200, 100, 200]);

  triggerGunshotFX(clientX, clientY);
  gameArea.classList.remove('danger-flash');
  void gameArea.offsetWidth;
  gameArea.classList.add('danger-flash');

  const rect = gameArea.getBoundingClientRect();
  spawnBloodSplatter(clientX - rect.left, clientY - rect.top, true);

  setTimeout(() => {
    if (target.parentNode) target.remove();
    endGame("GAME OVER BITCH, DON’Т SHOOT ME");
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
  checkInstantLevelPass();

  triggerGunshotFX(clientX, clientY);
  showPopup(clientX, clientY, `${t('flagText')} +${flagPoints} & MULT+1!`, 'flag');

  setTimeout(() => { if (flag.parentNode) flag.remove(); }, 350);
}

function hitBomb(bomb, clientX, clientY) {
  bomb.remove();
  combo = 0;

  if (hasShield) {
    hasShield = false;
    updateUI();
    showPopup(clientX, clientY, t('shieldBlocked'), 'shield');
    return;
  }

  playCustomAudio(bombSound);
  if (isAudioEnabled && navigator.vibrate) navigator.vibrate([150, 50, 150]);

  points = 0;
  hitCounts.head = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  hitCounts.flag = [0, 0];
  updateUI();

  gameArea.classList.remove('danger-flash');
  void gameArea.offsetWidth;
  gameArea.classList.add('danger-flash');

  const rect = gameArea.getBoundingClientRect();
  spawnBloodSplatter(clientX - rect.left, clientY - rect.top, true);
  showPopup(clientX, clientY, t('boomWiped'), 'penalty');
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

function endGame(titleText = t('roundComplete')) {
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

  if (gameOverTitle) gameOverTitle.innerText = titleText;
  if (restartBtn) restartBtn.innerText = gameMode === 'levels' ? t('retryLevel') : t('playAgain');
  if (finalScoreDisplay) finalScoreDisplay.innerText = points;
  if (personalBestDisplay) personalBestDisplay.innerText = personalBest;
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}
