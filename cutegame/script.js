const game = {
  score: 0,
  lives: 5,
  combo: 0,
  maxCombo: 0,
  bestScore: 0,
  speed: 2,
  spawnRate: 1200,
  running: false,
  playerX: 0,
  items: [],
  animFrame: null,
  spawnTimer: null,
  difficultyTimer: null,
  touchStartX: 0,
  lastTime: 0
};

// 掉落物类型
const ITEMS = {
  good: [
    { emoji: '🍓', points: 10, name: '草莓' },
    { emoji: '🍰', points: 15, name: '蛋糕' },
    { emoji: '🧁', points: 15, name: '杯子蛋糕' },
    { emoji: '🍡', points: 10, name: '团子' },
    { emoji: '🍪', points: 10, name: '饼干' },
    { emoji: '🫧', points: 20, name: '泡泡' },
    { emoji: '🌸', points: 25, name: '樱花' },
    { emoji: '💌', points: 30, name: '情书' },
    { emoji: '🎀', points: 20, name: '蝴蝶结' },
  ],
  bad: [
    { emoji: '🌧️', points: -5, name: '雨滴' },
    { emoji: '🧅', points: -5, name: '洋葱' },
  ],
  special: [
    { emoji: '💎', points: 50, name: '宝石' },
    { emoji: '🌈', points: 40, name: '彩虹' },
  ]
};

const endMessages = [
  '你好厉害！再来一次嘛～',
  '哇，接了好多！哥哥给你鼓掌',
  '小手好灵活哦',
  '下次一定更厉害！',
  '好可爱的成绩～',
];

const comboMessages = [
  '', '', '',
  '不错哦！',
  '好厉害！',
  '连击！',
  '超级连击！！',
  '无敌了！！！',
  '逆天！！！！',
];

const $ = id => document.getElementById(id);
const container = $('game-container');

function init() {
  // 读取最高分
  try {
    game.bestScore = parseInt(localStorage.getItem('bunny-best') || '0');
  } catch(e) {
    game.bestScore = 0;
  }

  // 生成背景云
  createClouds();

  // 绑定事件
  $('start-btn').addEventListener('click', startGame);
  $('restart-btn').addEventListener('click', restartGame);

  // 键盘控制
  document.addEventListener('keydown', e => {
    if (!game.running) return;
    const step = 30;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      game.playerX = Math.max(0, game.playerX - step);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      game.playerX = Math.min(window.innerWidth - 80, game.playerX + step);
    }
    $('player').style.left = game.playerX + 'px';
  });

  // 鼠标控制
  document.addEventListener('mousemove', e => {
    if (!game.running) return;
    game.playerX = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - 40));
    $('player').style.left = game.playerX + 'px';
  });

  // 触摸控制
  document.addEventListener('touchmove', e => {
    if (!game.running) return;
    e.preventDefault();
    const touch = e.touches[0];
    game.playerX = Math.max(0, Math.min(window.innerWidth - 80, touch.clientX - 40));
    $('player').style.left = game.playerX + 'px';
  }, { passive: false });
}

function createClouds() {
  const clouds = ['☁️', '✨', '🌙'];
  for (let i = 0; i < 6; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'bg-cloud';
    cloud.textContent = clouds[i % clouds.length];
    cloud.style.top = (Math.random() * 60 + 5) + '%';
    cloud.style.animationDuration = (Math.random() * 20 + 25) + 's';
    cloud.style.animationDelay = -(Math.random() * 30) + 's';
    cloud.style.fontSize = (Math.random() * 2 + 2) + 'rem';
    container.appendChild(cloud);
  }
}

function startGame() {
  $('start-screen').style.display = 'none';
  $('end-screen').classList.remove('show');

  game.score = 0;
  game.lives = 5;
  game.combo = 0;
  game.maxCombo = 0;
  game.speed = 2;
  game.spawnRate = 1200;
  game.running = true;
  game.items = [];

  game.playerX = window.innerWidth / 2 - 40;
  $('player').style.left = game.playerX + 'px';
  $('player').style.display = 'block';

  updateUI();

  // 开始生成掉落物
  scheduleSpawn();

  // 难度递增
  game.difficultyTimer = setInterval(() => {
    game.speed = Math.min(6, game.speed + 0.15);
    game.spawnRate = Math.max(400, game.spawnRate - 30);
  }, 3000);

  // 游戏循环
  game.lastTime = performance.now();
  game.animFrame = requestAnimationFrame(gameLoop);
}

function restartGame() {
  // 清除残留物
  document.querySelectorAll('.falling-item, .score-popup, .sparkle').forEach(el => el.remove());
  startGame();
}

function scheduleSpawn() {
  if (!game.running) return;
  spawnItem();
  game.spawnTimer = setTimeout(scheduleSpawn, game.spawnRate + Math.random() * 300);
}

function spawnItem() {
  const rand = Math.random();
  let pool;
  if (rand < 0.05) {
    pool = ITEMS.special;
  } else if (rand < 0.18) {
    pool = ITEMS.bad;
  } else {
    pool = ITEMS.good;
  }

  const type = pool[Math.floor(Math.random() * pool.length)];
  const el = document.createElement('div');
  el.className = 'falling-item';
  el.textContent = type.emoji;

  const x = Math.random() * (window.innerWidth - 50);
  el.style.left = x + 'px';
  el.style.top = '-40px';

  container.appendChild(el);

  game.items.push({
    el,
    x,
    y: -40,
    type,
    speed: game.speed + Math.random() * 0.8,
    alive: true
  });
}

function gameLoop(now) {
  if (!game.running) return;

  const dt = Math.min((now - game.lastTime) / 16, 3); // 归一化到约60fps
  game.lastTime = now;

  const playerLeft = game.playerX;
  const playerRight = game.playerX + 80;
  const playerTop = window.innerHeight - 110;
  const bottomLine = window.innerHeight + 20;

  for (let i = game.items.length - 1; i >= 0; i--) {
    const item = game.items[i];
    if (!item.alive) continue;

    item.y += item.speed * dt;
    item.el.style.top = item.y + 'px';

    const itemCenterX = item.x + 16;
    const itemBottom = item.y + 32;

    // 检测接住
    if (itemBottom >= playerTop && itemBottom <= playerTop + 50 &&
        itemCenterX >= playerLeft - 10 && itemCenterX <= playerRight + 10) {
      item.alive = false;
      catchItem(item);
    }
    // 掉出屏幕
    else if (item.y > bottomLine) {
      item.alive = false;
      missItem(item);
    }
  }

  // 清理死掉的
  game.items = game.items.filter(item => item.alive);

  game.animFrame = requestAnimationFrame(gameLoop);
}

function catchItem(item) {
  const isBad = ITEMS.bad.includes(item.type);
  const isSpecial = ITEMS.special.includes(item.type);

  if (isBad) {
    game.combo = 0;
    game.lives = Math.max(0, game.lives - 1);
    item.el.classList.add('missed');
    showScorePopup(item.x, item.y, item.type.points, false);
    game.score = Math.max(0, game.score + item.type.points);
  } else {
    game.combo++;
    if (game.combo > game.maxCombo) game.maxCombo = game.combo;

    const comboMultiplier = game.combo >= 8 ? 3 : game.combo >= 5 ? 2 : 1;
    const points = item.type.points * comboMultiplier;
    game.score += points;

    item.el.classList.add('caught');
    showScorePopup(item.x, item.y, points, isSpecial || comboMultiplier > 1);
    createSparkles(item.x + 16, item.y + 16);
  }

  // combo 显示
  const comboEl = $('combo-display');
  if (game.combo >= 3) {
    const msgIdx = Math.min(game.combo, comboMessages.length - 1);
    comboEl.textContent = `${game.combo} 连击！${comboMessages[msgIdx]}`;
    comboEl.classList.add('show');
  } else {
    comboEl.classList.remove('show');
  }

  setTimeout(() => { if (item.el.parentNode) item.el.remove(); }, 400);

  updateUI();

  if (game.lives <= 0) {
    endGame();
  }
}

function missItem(item) {
  const isBad = ITEMS.bad.includes(item.type);

  if (!isBad) {
    // 漏掉好东西
    game.combo = 0;
    $('combo-display').classList.remove('show');
  }

  if (item.el.parentNode) item.el.remove();
}

function showScorePopup(x, y, points, isBonus) {
  const popup = document.createElement('div');
  popup.className = 'score-popup' + (isBonus ? ' bonus' : '');
  popup.textContent = (points > 0 ? '+' : '') + points;
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  container.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

function createSparkles(x, y) {
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    const angle = (Math.PI * 2 / 6) * i;
    const dist = 20 + Math.random() * 20;
    s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    s.style.background = ['#ff4081', '#e040fb', '#ffab40', '#fff', '#7c4dff', '#18ffff'][i];
    container.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }
}

function updateUI() {
  $('score-display').textContent = '🍰 ' + game.score;
  $('lives-display').textContent = '💗'.repeat(game.lives) + '🤍'.repeat(Math.max(0, 5 - game.lives));
}

function endGame() {
  game.running = false;
  clearTimeout(game.spawnTimer);
  clearInterval(game.difficultyTimer);
  cancelAnimationFrame(game.animFrame);

  $('player').style.display = 'none';

  // 清除残留掉落物
  document.querySelectorAll('.falling-item').forEach(el => el.remove());

  // 更新最高分
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    try {
      localStorage.setItem('bunny-best', game.bestScore.toString());
    } catch(e) {}
  }

  $('final-score').textContent = '得分：' + game.score;
  $('best-score').textContent = '最高：' + game.bestScore;
  $('max-combo-display').textContent = '最大连击：' + game.maxCombo;
  $('end-message').textContent = endMessages[Math.floor(Math.random() * endMessages.length)];
  $('end-screen').classList.add('show');
}

// 启动
init();
