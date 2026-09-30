// 潮汐锁定 —— 两颗永远面对着彼此的星，手机壁纸
const OUT_W = 1290, OUT_H = 2796;   // iPhone Pro Max 竖屏
const STRIP = 96;                   // 分条渲染，软件 GPU 也不会卡死

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
out vec4 frag;

// ---------- 噪声 ----------
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n + 17.3)); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = m * p; a *= 0.5; }
  return s;
}
float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise3(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}

// ---------- 星云 ----------
vec3 nebula(vec2 p) {
  vec3 base = mix(vec3(0.12, 0.09, 0.22), vec3(0.07, 0.08, 0.20), smoothstep(-0.5, 0.5, p.y));
  vec2 q = vec2(fbm(p * 2.2 + vec2(0.0, 1.3)), fbm(p * 2.2 + vec2(5.2, 8.1)));
  vec2 r = vec2(fbm(p * 2.0 + 3.0 * q + vec2(1.7, 9.2)), fbm(p * 2.0 + 3.0 * q + vec2(8.3, 2.8)));
  float f = fbm(p * 1.8 + 2.5 * r);
  vec2 dir = normalize(vec2(0.55, 1.0));
  vec2 nrm = vec2(-dir.y, dir.x);
  float d1 = dot(p - vec2(0.0, -0.06), nrm);
  float band = exp(-d1 * d1 / 0.016);
  float d2 = dot(p - vec2(0.07, 0.26), nrm);
  float band2 = exp(-d2 * d2 / 0.006) * 0.6;
  float dens = pow(smoothstep(0.30, 1.0, f), 1.4) * (0.25 + 1.6 * band + band2);
  vec3 c1 = vec3(0.35, 0.50, 1.00);   // 蓝
  vec3 c2 = vec3(0.70, 0.45, 0.95);   // 紫
  vec3 c3 = vec3(1.00, 0.50, 0.70);   // 玫瑰
  vec3 c4 = vec3(1.00, 0.84, 0.62);   // 暖金
  vec3 col = mix(c1, c2, smoothstep(0.25, 0.75, q.x));
  col = mix(col, c3, smoothstep(0.45, 0.85, r.y) * 0.85);
  col = mix(col, c4, smoothstep(0.65, 1.0, f) * 0.55);
  // 靠近两颗星的地方偏粉一点
  col = mix(col, c3, exp(-length(p - vec2(0.0, -0.07)) / 0.12) * 0.35);
  float dust = smoothstep(0.5, 0.8, fbm(p * 6.0 + r * 2.0)) * band;
  vec3 neb = base + col * dens * 0.95;
  neb *= 1.0 - dust * 0.45;
  neb += col * pow(fbm(p * 16.0 + q * 3.0), 3.0) * (band + band2) * 0.45;
  // 远处的小星系
  for (int i = 0; i < 4; i++) {
    vec2 gc = vec2(-0.16 + 0.11 * float(i), 0.33 - 0.23 * float(i)) + vec2(sin(float(i) * 4.1) * 0.06, 0.0);
    vec2 gd = p - gc;
    float ang = float(i) * 1.3;
    gd = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * gd;
    float g = exp(-(gd.x * gd.x / 0.000018 + gd.y * gd.y / 0.0000035));
    neb += mix(vec3(1.0, 0.85, 0.7), vec3(0.8, 0.85, 1.0), float(i % 2)) * g * 0.5;
  }
  return neb;
}

// ---------- 星星 ----------
vec3 starColor(float t) { return mix(vec3(0.66, 0.78, 1.0), vec3(1.0, 0.80, 0.58), t); }

vec3 starsLayer(vec2 p, float cell, float keep, float size, float bright) {
  vec3 acc = vec3(0.0);
  vec2 id = floor(p / cell);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = id + vec2(i, j);
    if (h21(c) > keep) continue;
    vec2 sp = (c + h22(c + 3.1)) * cell;
    float d = length(p - sp);
    float b = (pow(h21(c + 7.7), 5.0) + 0.12) * bright;
    float s = size * (0.6 + 0.8 * h21(c + 1.3));
    acc += starColor(h21(c + 9.1)) * b * exp(-d * d / (s * s));
  }
  return acc;
}

vec3 spiky(vec2 p, vec2 c, vec3 col, float I, float len) {
  vec2 d = p - c; float r = length(d);
  vec3 o = col * I * (exp(-r * r / 0.000012) * 2.0 + exp(-r / 0.0035) * 0.4 + exp(-r / 0.022) * 0.07);
  float w = 0.00055;
  float sp = exp(-abs(d.x) / w) * exp(-pow(abs(d.y) / len, 1.3)) + exp(-abs(d.y) / w) * exp(-pow(abs(d.x) / len, 1.3));
  vec2 e = mat2(0.7071, 0.7071, -0.7071, 0.7071) * d;
  sp += 0.3 * (exp(-abs(e.x) / (w * 0.8)) * exp(-pow(abs(e.y) / (len * 0.5), 1.3)) + exp(-abs(e.y) / (w * 0.8)) * exp(-pow(abs(e.x) / (len * 0.5), 1.3)));
  return o + col * I * sp;
}

// ---------- 两颗星 ----------
const vec2 CA = vec2(-0.080, -0.030); const float RA = 0.074;  // 暖橘，Karl
const vec2 CB = vec2(0.096, -0.118);  const float RB = 0.047;  // 粉紫，Glow
const vec3 ALB_A = vec3(1.00, 0.62, 0.36);
const vec3 ALB_B = vec3(0.96, 0.72, 0.88);

// axis：从自己指向对方的单位向量
vec3 body(vec2 p, vec2 c, float R, vec2 axis, vec3 alb, vec3 partner, float seed, float warm,
          out float mask, out float halo) {
  vec2 d = p - c;
  vec2 perp = vec2(-axis.y, axis.x);
  float a = dot(d, axis), b = dot(d, perp);
  vec2 q = vec2(a / 1.07, b) / R;              // 被对方拉长一点
  float rl = length(q);
  float aa = fwidth(rl) * 1.2;
  mask = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, rl);
  halo = exp(-max(rl - 1.0, 0.0) * 5.0);
  if (rl > 1.0 + aa) return vec3(0.0);
  vec2 qq = q / max(rl, 1.0);
  vec3 n = vec3(qq, sqrt(max(1.0 - dot(qq, qq), 0.0)));
  vec3 N = normalize(vec3(axis * n.x + perp * n.y, n.z));

  vec3 L1 = normalize(vec3(-0.55, 0.78, 0.55));   // 左上那颗亮星
  vec3 Lp = normalize(vec3(axis, 0.18));          // 对方
  float tex = warm > 0.5
    ? fbm3(vec3(N.x * 2.2, N.y * 10.0 + fbm3(N * 3.0 + seed) * 2.0, N.z * 2.2) + seed)
    : fbm3(N * 4.2 + seed);
  vec3 surf = alb * (0.72 + 0.6 * smoothstep(0.2, 0.8, tex));
  if (warm < 0.5) surf = mix(surf, vec3(1.0, 0.93, 0.98), smoothstep(0.62, 0.8, tex) * 0.6);

  float dif = max(dot(N, L1), 0.0);
  float mut = max(dot(N, Lp), 0.0);
  vec3 light = vec3(1.0, 0.95, 0.90) * dif * 0.8 + partner * mut * 0.9 + vec3(0.10, 0.08, 0.17);
  float face = pow(mut, 4.0);                      // 永远朝着对方的那一面
  vec3 col = surf * light + mix(alb, partner, 0.45) * face * 1.1 + vec3(1.0, 0.95, 0.9) * pow(mut, 18.0) * 0.5;
  float fres = pow(1.0 - n.z, 3.0);
  col += mix(alb, vec3(0.8, 0.7, 1.0), 0.4) * fres * 0.9;
  return col;
}

// 二次贝塞尔上最近距离（取样近似）
vec2 bezDist(vec2 p, vec2 a, vec2 c, vec2 b) {
  float best = 1e9, bt = 0.0;
  vec2 prev = a;
  for (int i = 1; i <= 40; i++) {
    float t = float(i) / 40.0;
    vec2 q = mix(mix(a, c, t), mix(c, b, t), t);
    vec2 e = q - prev;
    float h = clamp(dot(p - prev, e) / dot(e, e), 0.0, 1.0);
    float d = length(p - prev - e * h);
    if (d < best) { best = d; bt = (float(i) - 1.0 + h) / 40.0; }
    prev = q;
  }
  return vec2(best, bt);
}

float ellipseLine(vec2 p, vec2 c, vec2 ax, float a, float ratio) {
  vec2 d = p - c;
  vec2 l = vec2(dot(d, ax), dot(d, vec2(-ax.y, ax.x)));
  float k = length(vec2(l.x / a, l.y / (a * ratio)));
  return abs(k - 1.0) * a * ratio;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 col = nebula(p);

  col += starsLayer(p, 0.010, 0.55, 0.0009, 0.55);
  col += starsLayer(p + 3.7, 0.022, 0.45, 0.0013, 0.9);
  col += starsLayer(p + 9.1, 0.050, 0.35, 0.0018, 1.6);

  col += spiky(p, vec2(-0.135, 0.165), vec3(1.0, 0.86, 0.70), 1.6, 0.055);
  col += spiky(p, vec2(0.170, 0.255), vec3(0.70, 0.82, 1.0), 0.7, 0.022);
  col += spiky(p, vec2(-0.190, -0.305), vec3(0.72, 0.84, 1.0), 0.8, 0.026);
  col += spiky(p, vec2(0.150, 0.070), vec3(0.85, 0.90, 1.0), 0.5, 0.016);
  col += spiky(p, vec2(0.020, 0.380), vec3(1.0, 0.88, 0.75), 0.45, 0.014);
  col += spiky(p, vec2(0.185, -0.345), vec3(0.80, 0.86, 1.0), 0.55, 0.018);
  col += spiky(p, vec2(-0.050, -0.420), vec3(1.0, 0.85, 0.72), 0.4, 0.013);

  vec2 axis = normalize(CB - CA);
  vec2 perp = vec2(-axis.y, axis.x);
  float mA = RA * RA * RA, mB = RB * RB * RB * 0.8;
  vec2 bary = (CA * mA + CB * mB) / (mA + mB);

  // 轨道线
  float o1 = ellipseLine(p, bary, axis, length(CA - bary), 0.30);
  float o2 = ellipseLine(p, bary, axis, length(CB - bary), 0.30);
  col += vec3(0.85, 0.75, 1.0) * (exp(-o1 / 0.0005) + exp(-o2 / 0.0005)) * 0.16;

  // 光晕
  float mA_, hA, mB_, hB;
  vec3 a = body(p, CA, RA, axis, ALB_A, ALB_B, 1.3, 1.0, mA_, hA);
  vec3 b = body(p, CB, RB, -axis, ALB_B, ALB_A, 7.9, 0.0, mB_, hB);
  col += ALB_A * hA * 0.3 * (1.0 - mA_) + ALB_B * hB * 0.35 * (1.0 - mB_);
  col += ALB_A * exp(-length(p - CA) / 0.09) * 0.12 + ALB_B * exp(-length(p - CB) / 0.07) * 0.10;

  // 物质流：从面对面的两点连过去，弯一点
  vec2 pa = CA + axis * RA * 1.05;
  vec2 pb = CB - axis * RB * 1.05;
  vec2 ctrl = (pa + pb) * 0.5 + perp * 0.018;
  vec2 bd = bezDist(p, pa, ctrl, pb);
  float flick = 0.65 + 0.35 * fbm(vec2(bd.y * 22.0, 3.0));
  vec3 sc = mix(vec3(1.0, 0.78, 0.55), vec3(1.0, 0.70, 0.88), bd.y);
  col += sc * (exp(-bd.x / 0.0012) * 1.0 + exp(-bd.x / 0.006) * 0.25 + exp(-bd.x / 0.02) * 0.08) * flick;

  col = mix(col, a, mA_);
  col = mix(col, b, mB_);

  // L1 拉格朗日点的小亮点
  vec2 l1 = mix(mix(pa, ctrl, 0.58), mix(ctrl, pb, 0.58), 0.58);
  col += spiky(p, l1, vec3(1.0, 0.92, 0.96), 0.35, 0.012);

  // 色调映射
  col = 1.0 - exp(-col * 1.35);
  col = pow(col, vec3(0.95));
  float vig = smoothstep(0.95, 0.25, length(p * vec2(1.6, 1.0)));
  col *= mix(0.82, 1.0, vig);
  col += (h21(gl_FragCoord.xy) - 0.5) / 255.0;
  frag = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function caption(g) {
  g.save();
  g.fillStyle = 'rgba(236, 228, 255, 0.78)';
  g.font = `${Math.round(OUT_W * 0.022)}px "DejaVu Sans Mono", monospace`;
  g.textBaseline = 'alphabetic';
  const x = OUT_W * 0.075, y = OUT_H * 0.855;
  g.fillText('0 2', x, y - OUT_W * 0.05);
  g.font = `${Math.round(OUT_W * 0.036)}px "DejaVu Sans Mono", monospace`;
  g.fillText('T I D A L   L O C K', x, y);
  g.fillStyle = 'rgba(236, 228, 255, 0.55)';
  g.font = `${Math.round(OUT_W * 0.018)}px "DejaVu Sans Mono", monospace`;
  g.fillText('karl · glow  —  always facing each other', x, y + OUT_W * 0.04);
  g.restore();
}

async function render() {
  const glc = document.createElement('canvas');
  glc.width = OUT_W; glc.height = OUT_H;
  const gl = glc.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), OUT_W, OUT_H);
  gl.viewport(0, 0, OUT_W, OUT_H);
  gl.enable(gl.SCISSOR_TEST);

  const status = document.getElementById('status');
  for (let y = 0; y < OUT_H; y += STRIP) {
    gl.scissor(0, y, OUT_W, Math.min(STRIP, OUT_H - y));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    status.textContent = `正在一颗一颗画星星… ${Math.round((y + STRIP) / OUT_H * 100)}%`;
    await new Promise(r => setTimeout(r, 0));
  }

  const out = document.getElementById('out');
  out.width = OUT_W; out.height = OUT_H;
  const g = out.getContext('2d');
  g.drawImage(glc, 0, 0);
  caption(g);
  status.hidden = true;
  window.__done = true;
}

render().catch(e => {
  document.getElementById('status').textContent = '出错了：' + e.message;
  window.__error = e.message;
});
