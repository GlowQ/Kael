const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const stars = [];
for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random(),
    y: Math.random() * 0.7,
    r: Math.random() * 1.2 + 0.3,
    twinkle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005
  });
}

class Particle {
  constructor(x, y, angle, speed, color, life, size, trail) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.trail = trail || false;
    this.history = [];
    this.gravity = 0.02;
    this.friction = 0.99;
  }
  update() {
    if (this.trail) {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > 16) this.history.shift();
    }
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
  draw() {
    const alpha = Math.max(this.life / this.maxLife, 0);
    if (this.trail && this.history.length > 1) {
      for (let i = 0; i < this.history.length - 1; i++) {
        const a = (i / this.history.length) * alpha * 0.4;
        ctx.beginPath();
        ctx.arc(this.history[i].x, this.history[i].y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('α', a.toString());
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace('α', alpha.toString());
    ctx.fill();

    if (alpha > 0.5) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace('α', (alpha * 0.15).toString());
      ctx.fill();
    }
  }
}

class Firework {
  constructor(x, targetY) {
    this.x = x;
    this.y = H;
    this.targetY = targetY;
    this.speed = 4 + Math.random() * 2;
    this.done = false;
    this.trail = [];
  }
  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();
    this.y -= this.speed;
    if (this.y <= this.targetY) {
      this.done = true;
    }
  }
  draw() {
    for (let i = 0; i < this.trail.length; i++) {
      const a = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, 1.5 * a, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 180, 80, ${a * 0.6})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 100, 1)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 180, 80, 0.2)';
    ctx.fill();
  }
}

const particles = [];
const fireworks = [];

const orangePalette = [
  'rgba(255, 140, 50, α)',
  'rgba(255, 180, 70, α)',
  'rgba(255, 120, 30, α)',
  'rgba(255, 200, 100, α)',
  'rgba(255, 100, 20, α)',
  'rgba(255, 160, 60, α)',
  'rgba(230, 90, 20, α)',
  'rgba(255, 220, 150, α)',
];

function explodeStar(x, y) {
  const arms = 6;
  const particlesPerArm = 12;
  const color = orangePalette[Math.floor(Math.random() * orangePalette.length)];
  const color2 = orangePalette[Math.floor(Math.random() * orangePalette.length)];

  for (let a = 0; a < arms; a++) {
    const baseAngle = (a / arms) * Math.PI * 2 - Math.PI / 2;
    for (let i = 0; i < particlesPerArm; i++) {
      const spread = (Math.random() - 0.5) * 0.3;
      const speed = 2.5 + Math.random() * 4;
      const c = i < particlesPerArm / 2 ? color : color2;
      particles.push(new Particle(
        x, y,
        baseAngle + spread,
        speed,
        c,
        80 + Math.random() * 50,
        2.5 + Math.random() * 2,
        true
      ));
    }
  }

  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    particles.push(new Particle(
      x, y,
      angle,
      speed,
      'rgba(255, 220, 180, α)',
      40 + Math.random() * 30,
      1.5 + Math.random(),
      false
    ));
  }
}

function explodeCircle(x, y) {
  const count = 80;
  const color = orangePalette[Math.floor(Math.random() * orangePalette.length)];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 3 + Math.random() * 3;
    particles.push(new Particle(
      x, y, angle, speed, color,
      70 + Math.random() * 40,
      2.5 + Math.random() * 2,
      true
    ));
  }
}

function explodeBurst(x, y) {
  const layers = 3;
  for (let l = 0; l < layers; l++) {
    const count = 20 + l * 15;
    const color = orangePalette[Math.floor(Math.random() * orangePalette.length)];
    const baseSpeed = 1.5 + l * 1.2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + l * 0.2;
      const speed = baseSpeed + Math.random() * 1;
      particles.push(new Particle(
        x, y, angle, speed, color,
        40 + l * 15 + Math.random() * 20,
        1.5 + Math.random(),
        true
      ));
    }
  }
}

const explodeTypes = [explodeStar, explodeCircle, explodeBurst];

let lastLaunch = 0;
let launchInterval = 800;

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#05051a');
  grad.addColorStop(0.4, '#0a0a2e');
  grad.addColorStop(0.7, '#101040');
  grad.addColorStop(1, '#1a1020');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawStars(time) {
  for (const s of stars) {
    const alpha = 0.3 + 0.4 * Math.sin(s.twinkle + time * s.speed);
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
    ctx.fill();
  }
}

function drawCityline() {
  ctx.fillStyle = '#0d0d15';
  const baseY = H * 0.88;

  const buildings = [
    { x: 0, w: 40, h: 60 },
    { x: 35, w: 25, h: 90 },
    { x: 55, w: 50, h: 45 },
    { x: 100, w: 30, h: 110 },
    { x: 125, w: 45, h: 70 },
    { x: 165, w: 20, h: 130 },
    { x: 180, w: 55, h: 55 },
    { x: 230, w: 35, h: 95 },
    { x: 260, w: 25, h: 65 },
    { x: 280, w: 50, h: 80 },
    { x: 325, w: 30, h: 120 },
    { x: 350, w: 40, h: 50 },
    { x: 385, w: 55, h: 100 },
    { x: 435, w: 25, h: 70 },
    { x: 455, w: 45, h: 85 },
    { x: 495, w: 30, h: 140 },
    { x: 520, w: 50, h: 60 },
    { x: 565, w: 35, h: 105 },
    { x: 595, w: 40, h: 75 },
    { x: 630, w: 25, h: 90 },
  ];

  const scale = W / 650;
  for (const b of buildings) {
    ctx.fillRect(b.x * scale, baseY - b.h * scale * 0.6, b.w * scale, b.h * scale * 0.6 + H - baseY);
    const winColor = 'rgba(255, 200, 100, 0.15)';
    for (let wy = baseY - b.h * scale * 0.6 + 8; wy < baseY - 5; wy += 12) {
      for (let wx = b.x * scale + 5; wx < (b.x + b.w) * scale - 5; wx += 10) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = winColor;
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }
    ctx.fillStyle = '#0d0d15';
  }

  ctx.fillStyle = '#080810';
  ctx.fillRect(0, baseY, W, H - baseY);
}

let time = 0;
function animate() {
  time++;
  drawSky();
  drawStars(time);
  drawCityline();

  if (time - lastLaunch > launchInterval / 16) {
    if (Math.random() < 0.025) {
      const x = W * 0.15 + Math.random() * W * 0.7;
      const targetY = H * 0.1 + Math.random() * H * 0.35;
      fireworks.push(new Firework(x, targetY));
      lastLaunch = time;
      launchInterval = 600 + Math.random() * 1200;
    }
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].draw();
    if (fireworks[i].done) {
      const f = fireworks[i];
      const type = explodeTypes[Math.floor(Math.random() * explodeTypes.length)];
      type(f.x, f.y);
      fireworks.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

animate();
