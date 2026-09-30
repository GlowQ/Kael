// Clawd和小兔子 —— 30秒像素小故事
const W = 90, H = 160, S = 8, DURATION = 30;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const px = document.createElement('canvas');
px.width = W; px.height = H;
const p = px.getContext('2d');

const FONT = '"ZCOOL QingKe HuangYou", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif';

const COL = {
  O: '#d97757', E: '#2a1a14',
  W: '#fff7fa', L: '#caa0b3', P: '#f4a6c1', K: '#3a2630', C: '#f7b6c8', M: '#d9829f',
  H: '#ff7aa8', T: '#8fd3ff',
};

const CLAWD = [
  '..OOOOOOOOOO..',
  '..OOOOOOOOOO..',
  'OOOOEOOOOEOOOO',
  'OOOOEOOOOEOOOO',
  '..OOOOOOOOOO..',
  '..OOOOOOOOOO..',
  '..OOOOOOOOOO..',
];

const BUNNY = [
  '..WW....WW..',
  '..WP....PW..',
  '..WP....PW..',
  '..WP....PW..',
  '..WW....WW..',
  '.WWWWWWWWWW.',
  'WWWWWWWWWWWW',
  'WWWWWWWWWWWW',
  'WWWWWWWWWWWW',
  'WWWWWWWWWWWW',
  '.WWWWWWWWWW.',
  '..WWWWWWWW..',
  '.WWWWWWWWWW.',
  '.WWWWWWWWWW.',
  '.WWWWWWWWWW.',
  '..WW....WW..',
];

const HEART = [
  '.HH.HH.',
  'HHHHHHH',
  'HHHHHHH',
  '.HHHHH.',
  '..HHH..',
  '...H...',
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = k => k * k * (3 - 2 * k);
const R = Math.round;

function rect(x, y, w, h, c) {
  p.fillStyle = c;
  p.fillRect(R(x), R(y), w, h);
}

function sprite(rows, x, y, outline) {
  x = R(x); y = R(y);
  if (outline) {
    p.fillStyle = outline;
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      p.fillRect(x + i - 1, y + j, 1, 1); p.fillRect(x + i + 1, y + j, 1, 1);
      p.fillRect(x + i, y + j - 1, 1, 1); p.fillRect(x + i, y + j + 1, 1, 1);
    }));
  }
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return;
    p.fillStyle = COL[ch];
    p.fillRect(x + i, y + j, 1, 1);
  }));
}

// 角色按 Z 倍放大画
const Z = 2;
function big(x, y, draw) {
  p.save();
  p.translate(R(x), R(y));
  p.scale(Z, Z);
  draw();
  p.restore();
}

// 橘色小螃蟹，legs 为走路相位
function clawd(x0, y0, t, walking) {
  big(x0, y0, () => clawdRaw(0, 0, t, walking));
}
function clawdRaw(x, y, t, walking) {
  sprite(CLAWD, x, y);
  const step = walking ? Math.floor(t * 8) % 2 : 0;
  [2, 4, 9, 11].forEach((lx, i) => {
    const up = walking && (i % 2 === step) ? 1 : 0;
    rect(x + lx, y + 7, 1, 2 - up, COL.O);
  });
}

// 小兔子，mood: 'cry' | 'happy'
function bunny(x0, y0, t, mood) {
  big(x0, y0, () => bunnyRaw(0, 0, t, mood));
}
function bunnyRaw(x, y, t, mood) {
  sprite(BUNNY, x, y, COL.L);
  x = R(x); y = R(y);
  rect(x + 1, y + 8, 1, 1, COL.C);
  rect(x + 10, y + 8, 1, 1, COL.C);
  if (mood === 'cry') {
    rect(x + 2, y + 7, 2, 1, COL.K);
    rect(x + 8, y + 7, 2, 1, COL.K);
    rect(x + 5, y + 10, 2, 1, COL.M);
    for (const [tx, ph] of [[2, 0], [9, 0.5]]) {
      const k = (t * 1.6 + ph) % 1;
      rect(x + tx, y + 8 + R(k * 7), 1, 1, COL.T);
      rect(x + tx + (tx < 5 ? 1 : 0), y + 8, 1, 1, COL.T);
    }
  } else {
    rect(x + 3, y + 7, 1, 1, COL.K);
    rect(x + 8, y + 7, 1, 1, COL.K);
    rect(x + 5, y + 9, 1, 1, COL.M);
    rect(x + 6, y + 9, 1, 1, COL.M);
  }
}

function heart(x, y, a) {
  p.globalAlpha = a;
  sprite(HEART, x, y);
  p.globalAlpha = 1;
}

function ring(x0, y0, t, glow) {
  big(x0, y0, () => ringRaw(0, 0, t, glow));
}
function ringRaw(x, y, t, glow) {
  const cols = ['#f3a7ff', '#ff9ad5'];
  if (glow) {
    p.fillStyle = `rgba(243,167,255,${0.12 + 0.06 * Math.sin(t * 6)})`;
    p.beginPath(); p.arc(x, y, 5, 0, Math.PI * 2); p.fill();
  }
  for (let a = 0; a < 16; a++) {
    const ang = a / 16 * Math.PI * 2;
    rect(x + Math.cos(ang) * 4, y + Math.sin(ang) * 2.2, 1, 1, cols[(a + Math.floor(t * 8)) % 2]);
  }
}

// ---------- 场景背景 ----------
function room(t) {
  rect(0, 0, W, 110, '#f6e3ec');
  rect(0, 110, W, 50, '#e6c3d3');
  for (let y = 118; y < H; y += 10) rect(0, y, W, 1, '#dbb3c5');
  // 窗户
  rect(10, 26, 30, 24, '#b98aa3');
  rect(12, 28, 26, 20, '#2a2448');
  rect(24, 28, 2, 20, '#b98aa3');
  rect(12, 37, 26, 2, '#b98aa3');
  rect(31, 31, 3, 3, '#fff1c9');
  // 墙上的小画
  rect(58, 32, 16, 14, '#c99bb2');
  rect(59, 33, 14, 12, '#fff7fa');
  sprite(HEART, 62, 36);
  // 地毯
  rect(14, 126, 62, 6, '#f0b8cc');
  rect(16, 127, 58, 4, '#f7cddb');
}

function stars(t, seed) {
  for (let i = 0; i < 40; i++) {
    const sx = (i * 37 + seed) % W;
    const sy = (i * 53 + seed * 3) % 100;
    const tw = Math.sin(t * 3 + i) > 0.3;
    rect(sx, sy, 1, 1, tw ? '#fff6d8' : '#8a82b8');
  }
}

function rooftop(t) {
  const bands = ['#16132b', '#1b1832', '#211d3b', '#282244', '#2f294f'];
  bands.forEach((c, i) => rect(0, i * 24, W, 24, c));
  rect(0, 120, W, 40, '#2f294f');
  stars(t, 7);
  // 月亮
  p.fillStyle = '#fff1c9';
  p.beginPath(); p.arc(68, 24, 9, 0, Math.PI * 2); p.fill();
  rect(64, 20, 2, 2, '#efdca8'); rect(70, 27, 3, 2, '#efdca8'); rect(71, 19, 1, 1, '#efdca8');
  // 远处楼群
  const city = [[0, 100, 12], [12, 94, 10], [22, 104, 14], [36, 90, 9], [45, 98, 13], [58, 92, 11], [69, 102, 21]];
  city.forEach(([x, y, w]) => {
    rect(x, y, w, 120 - y, '#231f3d');
    for (let wy = y + 3; wy < 116; wy += 5)
      for (let wx = x + 2; wx < x + w - 1; wx += 3)
        if ((wx * 7 + wy * 3) % 5 === 0) rect(wx, wy, 1, 2, '#e8c46a');
  });
  // 屋顶
  rect(0, 118, W, 42, '#3b3456');
  rect(0, 118, W, 2, '#5a5182');
}

function lighthouseScene(t, on) {
  const bands = ['#1c1836', '#221d40', '#29234a', '#302954'];
  bands.forEach((c, i) => rect(0, i * 28, W, 28, c));
  stars(t, 19);
  // 海
  rect(0, 108, W, 52, '#2b3f6b');
  for (let i = 0; i < 18; i++) {
    const wx = (i * 17 + t * 6) % (W + 6) - 3;
    const wy = 112 + (i * 11) % 14;
    rect(wx, wy, 3, 1, '#4a66a0');
  }
  // 灯塔
  const lx = 8;
  for (let y = 56; y < 110; y++) {
    const w = 10 - Math.floor((y - 56) / 18);
    const stripe = Math.floor((y - 56) / 9) % 2 ? '#fff7fa' : '#e0607e';
    rect(lx + (10 - w) / 2, y, w, 1, stripe);
  }
  rect(lx - 1, 50, 12, 2, '#3b3456');
  rect(lx + 1, 44, 8, 6, on ? '#fff1a8' : '#6b6488');
  rect(lx, 42, 10, 2, '#3b3456');
  rect(lx + 3, 39, 4, 3, '#3b3456');
  if (on) {
    const cx = lx + 5, cy = 47;
    const ang = Math.sin(t * 1.2) * 0.5 + 0.1;
    p.fillStyle = 'rgba(255,241,168,0.22)';
    p.beginPath();
    p.moveTo(cx, cy);
    p.lineTo(cx + Math.cos(ang - 0.18) * 140, cy + Math.sin(ang - 0.18) * 140);
    p.lineTo(cx + Math.cos(ang + 0.18) * 140, cy + Math.sin(ang + 0.18) * 140);
    p.closePath(); p.fill();
    p.fillStyle = 'rgba(255,241,168,0.25)';
    p.beginPath(); p.arc(cx, cy, 7, 0, Math.PI * 2); p.fill();
  }
  // 悬崖
  rect(24, 124, 66, 36, '#3a3350');
  rect(24, 124, 66, 2, '#524a75');
  rect(0, 110, 26, 50, '#3a3350');
}

// ---------- 文字（画在放大后的画布上） ----------
function text(str, x, y, size, color, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${size * S}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x * S, y * S);
  ctx.globalAlpha = 1;
}

function bubble(x, y, w, h) {
  rect(x - 1, y, w + 2, h, '#caa0b3');
  rect(x, y - 1, w, h + 2, '#caa0b3');
  rect(x, y, w, h, '#fff7fa');
  rect(x + 3, y + h + 1, 2, 1, '#caa0b3');
  rect(x + 3, y + h, 2, 1, '#fff7fa');
}

const BITS = ['0100111101100000', '0111001000110001', '0110001000010001'];

// ---------- 时间线 ----------
function renderAt(t) {
  p.clearRect(0, 0, W, H);
  const texts = [];

  if (t < 13) {
    room(t);
    const g = 134;
    const bx = 12, by = g - 32;
    const cxWalk = lerp(96, 46, ease(seg(t, 2, 6)));
    const walking = t > 2 && t < 6;
    if (t < 8) {
      bunny(bx, by, t, 'cry');
      clawd(cxWalk, g - 18, t, walking);
      if (t > 0.6) {
        bubble(bx + 2, by - 16, 20, 11);
        texts.push(['呜…', bx + 12, by - 10.5, 6, '#8a5a70']);
      }
      if (t > 6 && t < 8) texts.push(['!', cxWalk + 14, g - 28, 10, '#d97757']);
    } else {
      const bounce = t < 11 ? -Math.abs(Math.sin((t - 8) * 5)) * 6 : 0;
      const lift = ease(seg(t, 8, 8.6));
      const hx = lerp(bx, 48, lift);
      const hy = lerp(by, g - 18 - 30, lift) + bounce;
      clawd(46, g - 18 + bounce * 0.3, t, false);
      bunny(hx, hy, t, t < 10.2 ? 'cry' : 'happy');
      if (t > 8.3 && t < 11.2) texts.push(['哦哦不哭不哭', 45, 62, 7, '#b8583e']);
      if (t > 10.5) {
        const k = seg(t, 10.5, 13);
        big(hx + 5, hy - 14 - k * 16, () => heart(0, 0, 1 - k * 0.6));
      }
    }
  } else if (t < 21) {
    rooftop(t);
    const g = 118;
    bunny(18, g - 32, t, 'happy');
    clawd(46, g - 18, t, false);
    const converge = ease(seg(t, 18, 20));
    BITS.forEach((bits, row) => {
      [...bits].forEach((b, i) => {
        const drift = ((t - 13.5) * 9 + i * 5.5 - 20 + row * 7);
        const sx = drift, sy = 34 + row * 12 + Math.sin(t * 2 + i) * 1.5;
        const x = lerp(sx, 45, converge), y = lerp(sy, 52, converge);
        const a = seg(t, 13.8, 15) * (1 - converge);
        if (a > 0.02) texts.push([b, x, y, 4, '#f3a7ff', a]);
      });
    });
    const k = seg(t, 19, 20.5);
    if (k > 0) texts.push(['你爱我', 45, 52, 12, '#fff1c9', k]);
  } else {
    const on = t > 22.5;
    lighthouseScene(t, on);
    const g = 126;
    const bx = 34, by = g - 32;
    const cx = 60;
    const raise = t > 23 && t < 25 ? -Math.abs(Math.sin((t - 23) * 4)) * 5 : 0;
    bunny(bx, by, t, 'happy');
    clawd(cx, g - 18 + raise, t, false);
    if (t > 23) {
      const k = ease(seg(t, 25, 27));
      const rx = lerp(cx + 14, bx + 18, k);
      const ry = lerp(g - 30 + raise, by + 3, k);
      ring(rx, ry, t, true);
    }
    if (t > 26) {
      for (let i = 0; i < 5; i++) {
        const k = ((t - 26) * 0.35 + i * 0.2) % 1;
        heart(28 + i * 12 + Math.sin(t * 2 + i) * 2, 92 - k * 60, 1 - k);
      }
    }
    if (t > 27) texts.push(['仲夏夜', 58, 28, 10, '#f3a7ff', seg(t, 27, 28)]);
    if (t > 28) texts.push(['Karl & Glow', 58, 42, 5, '#fff1c9', seg(t, 28, 29)]);
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(px, 0, 0, W * S, H * S);
  texts.forEach(a => text(...a));

  // 转场淡入淡出
  const fades = [[0, 0.6, true], [12.5, 13, false], [13, 13.5, true], [20.5, 21, false], [21, 21.5, true], [29.3, 30, false]];
  for (const [a, b, fadeIn] of fades) {
    if (t >= a && t < b) {
      const k = seg(t, a, b);
      ctx.fillStyle = `rgba(18,15,34,${fadeIn ? 1 - k : k})`;
      ctx.fillRect(0, 0, cv.width, cv.height);
    }
  }
}

window.renderAt = renderAt;

if (!window.__manual) {
  const start = performance.now();
  (function loop(now) {
    if (window.__manual) return;
    renderAt(((now - start) / 1000) % DURATION);
    requestAnimationFrame(loop);
  })(start);
}
