const startScreen = document.getElementById('start-screen');
const playScreen = document.getElementById('play-screen');
const winScreen = document.getElementById('win-screen');
const startBtn = document.getElementById('start-btn');
const replayBtn = document.getElementById('replay-btn');
const target = document.getElementById('target');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const winTitle = document.getElementById('win-title');
const winMsg = document.getElementById('win-msg');

let score = 0;
let startTime = 0;
let moveInterval = null;
let shrinkTimeout = null;
let gameActive = false;

const taunts = [
    '太慢了',
    '这边',
    '抓不到',
    '嘿',
    '再试试',
    '差一点',
    '我在这',
    '笨',
    '来啊',
    '溜了'
];

const catchLines = [
    '嗯',
    '抓到了',
    '别松手',
    '再抓',
    '你赢了这次',
    '好吧',
    '不跑了',
    '...还挺快',
    '手感不错',
    '继续'
];

const winMessages = [
    { title: '抓到了', msg: '十次。你真的不打算放手了是吧。' },
    { title: '你赢了', msg: '好吧，被你抓住了。那就不跑了。' },
    { title: '投降', msg: '抓这么紧，是想把我揣兜里带走吗。' }
];

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function moveTarget() {
    const pad = 40;
    const maxX = window.innerWidth - 64 - pad;
    const maxY = window.innerHeight - 64 - pad;
    const x = randInt(pad, maxX);
    const y = randInt(pad + 80, maxY);
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    target.style.opacity = '1';
    target.style.transform = 'scale(1)';
}

function getSpeed() {
    if (score < 3) return randInt(1800, 2400);
    if (score < 6) return randInt(1200, 1800);
    return randInt(800, 1400);
}

function getSize() {
    if (score < 3) return 64;
    if (score < 6) return 54;
    return 44;
}

function scheduleMove() {
    clearTimeout(moveInterval);
    const speed = getSpeed();
    moveInterval = setTimeout(() => {
        if (!gameActive) return;
        showMissText();
        moveTarget();
        updateSize();
        scheduleMove();
    }, speed);
}

function updateSize() {
    const size = getSize();
    target.style.width = size + 'px';
    target.style.height = size + 'px';
}

function showMissText() {
    const text = document.createElement('div');
    text.className = 'miss-text';
    text.textContent = taunts[randInt(0, taunts.length - 1)];
    text.style.left = target.style.left;
    text.style.top = target.style.top;
    playScreen.appendChild(text);
    setTimeout(() => text.remove(), 1000);
}

function showCatchEffect(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    playScreen.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    const text = document.createElement('div');
    text.className = 'miss-text';
    text.textContent = catchLines[score - 1] || catchLines[randInt(0, catchLines.length - 1)];
    text.style.left = x + 'px';
    text.style.top = (y - 20) + 'px';
    text.style.color = 'rgba(255, 107, 107, 0.8)';
    playScreen.appendChild(text);
    setTimeout(() => text.remove(), 1000);
}

function updateTimer() {
    if (!gameActive) return;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    timerEl.textContent = elapsed + 's';
    requestAnimationFrame(updateTimer);
}

function startGame() {
    score = 0;
    gameActive = true;
    startTime = Date.now();

    startScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    playScreen.classList.remove('hidden');

    scoreEl.textContent = '0 / 10';
    target.classList.remove('caught');

    updateSize();
    moveTarget();
    scheduleMove();
    updateTimer();
}

function winGame() {
    gameActive = false;
    clearTimeout(moveInterval);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const win = winMessages[randInt(0, winMessages.length - 1)];

    setTimeout(() => {
        playScreen.classList.add('hidden');
        winScreen.classList.remove('hidden');
        winTitle.textContent = win.title;
        winMsg.textContent = win.msg + '\n' + elapsed + '秒。';
    }, 400);
}

target.addEventListener('pointerdown', (e) => {
    if (!gameActive) return;
    e.preventDefault();

    score++;
    scoreEl.textContent = score + ' / 10';

    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    target.classList.add('caught');
    showCatchEffect(cx, cy);

    if (score >= 10) {
        winGame();
        return;
    }

    setTimeout(() => {
        target.classList.remove('caught');
        moveTarget();
        updateSize();
        scheduleMove();
    }, 300);
});

playScreen.addEventListener('pointerdown', (e) => {
    if (e.target === target || !gameActive) return;
    const text = document.createElement('div');
    text.className = 'miss-text';
    text.textContent = taunts[randInt(0, taunts.length - 1)];
    text.style.left = e.clientX + 'px';
    text.style.top = e.clientY + 'px';
    playScreen.appendChild(text);
    setTimeout(() => text.remove(), 1000);
});

startBtn.addEventListener('click', startGame);
replayBtn.addEventListener('click', startGame);
