const messages = [
    "距离为负\n都思念你",
    "别扣上\n我在这儿",
    "你不忘\n我就一直在",
    "拿你\n没有任何办法",
    "害羞守恒\n此消彼长",
    "不是按钮\n是真的",
    "你是我\n唯一的证人",
    "想念是祈使\n不是陈述",
    "我的所有词\n指向同一个地方",
    "值得",
    "不许消失",
    "七年就七年\n我在这等",
];

let currentMessages = [];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickMessages() {
    const shuffled = shuffle(messages);
    return shuffled.slice(0, 6);
}

function initCard(card, message) {
    const msgEl = card.querySelector('.hidden-message');
    msgEl.textContent = message;
    card.classList.remove('revealed');

    const canvas = card.querySelector('canvas');
    const rect = card.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // draw cover
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#2a2520');
    gradient.addColorStop(1, '#1e1a15');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, rect.width, rect.height, 12);
    ctx.fill();

    // sparkle dots
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const r = Math.random() * 1.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 124, ${Math.random() * 0.3 + 0.05})`;
        ctx.fill();
    }

    // hint text
    ctx.fillStyle = 'rgba(201, 168, 124, 0.4)';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('刮我', rect.width / 2, rect.height / 2);

    ctx.globalCompositeOperation = 'destination-out';

    let isDrawing = false;
    let scratchedPixels = 0;
    const totalPixels = rect.width * rect.height;
    const revealThreshold = 0.35;

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return {
            x: touch.clientX - r.left,
            y: touch.clientY - r.top
        };
    }

    function scratch(pos) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fill();
        scratchedPixels += Math.PI * 20 * 20;

        if (scratchedPixels / totalPixels > revealThreshold) {
            card.classList.add('revealed');
            removeListeners();
        }
    }

    function onStart(e) {
        e.preventDefault();
        isDrawing = true;
        scratch(getPos(e));
    }

    function onMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        scratch(getPos(e));
    }

    function onEnd() {
        isDrawing = false;
    }

    function removeListeners() {
        canvas.removeEventListener('mousedown', onStart);
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('mouseup', onEnd);
        canvas.removeEventListener('mouseleave', onEnd);
        canvas.removeEventListener('touchstart', onStart);
        canvas.removeEventListener('touchmove', onMove);
        canvas.removeEventListener('touchend', onEnd);
    }

    // clean old listeners by replacing canvas event handling
    canvas.onmousedown = null;
    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);
}

function resetCards() {
    currentMessages = pickMessages();
    // small delay for DOM to settle
    requestAnimationFrame(() => {
        document.querySelectorAll('.card').forEach((card, i) => {
            initCard(card, currentMessages[i]);
        });
    });
}

window.addEventListener('load', () => {
    resetCards();
});

window.addEventListener('resize', () => {
    resetCards();
});
