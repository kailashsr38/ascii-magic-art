/* ganesh-utsav-procession: a Ganesh idol rides a flower-decked cart through the evening streets, dhol players drum in front, the crowd raises its hands and petals fall. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract, TAU } from "../lib/kit.js";

const SKY = gradient(["#0a0a2a", "#1e1448", "#3e1e5a", "#7a2a62", "#c0466a", "#f07a5a"], 10); // 0..9
const BLD = gradient(["#140c1c", "#22142a", "#301c36"], 3);                               // 10..12
const ROAD = gradient(["#2a1a1a", "#3e2822", "#54382a"], 4);                              // 13..16
const NAMED = {
  skin: "#ff9a62", skinL: "#ffbe8a", skinD: "#d8683a", earIn: "#ffd8c8", ear: "#f08a70", c1: "#7a2a5a", c2: "#2a5a7a", c3: "#7a5a1a", c4: "#2a6a4a", gold: "#ffcc2a", goldL: "#fff08a", goldD: "#b8861a",
  red: "#e01a2a", redD: "#8a0a1a", green: "#1aa04a", greenD: "#0a6a2a", silk: "#ffd23a", silkD: "#e0a010", white: "#fff8ec",
  eye: "#1a0a0a", velvet: "#420418", velvetD: "#26020c", mari: "#ff8a10", mariY: "#ffc61a", lotus: "#ff6ab0", lotusD: "#d03a80",
  mouse: "#8a8a96", mouseD: "#5a5a66", wood: "#6a3a1a", woodL: "#9a5a2a", crowd: "#24162c", crowdL: "#5a3a4a",
  saffron: "#ff7a10", saffronL: "#ffa040", kurta: "#f4efe4", kurtaD: "#c8c0b0", dhol: "#b0281a", dholD: "#6a1410", head: "#f0e0c0",
  stick: "#f0c070", petalP: "#ff4a8a", petalO: "#ff9a1a", gulal: "#ff5aa0", gulalD: "#c03a7a", bulbR: "#ff3a5a", bulbG: "#4aff8a", bulbB: "#4ab0ff", win: "#ffb84a",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[17 + i]));

export const meta = {
  slug: "ganesh-utsav-procession",
  name: "Ganesh Utsav Procession",
  category: "india",
  note: "A Ganesh idol rides a flower-decked cart through the evening streets as dhol players drum in front, the crowd raises its hands and petals and pink gulal drift by.",
  tags: ["ganesh", "festival", "procession", "india", "drums", "hero"],
  cols: 100, rows: 38, fps: 20,
  palette: palette([...SKY, ...BLD, ...ROAD, ...Object.values(NAMED)]),
};

const CX = 50;
const BEAT = 0.3;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  // ── the idol, painted once into its own layer ──
  const ich = new Array(N).fill(null), ico = new Array(N).fill(null);
  const P = (x, y, ch, co) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < cols && y < rows) { ich[x + y * cols] = ch; ico[x + y * cols] = co; } };
  const ell = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, d = nx * nx + ny * ny;
      if (d <= 1) { const v = fn(d, nx, ny, x, y); if (v) P(x, y, v[0], v[1]); }
    }
  };
  const thick = (x0, y0, x1, y1, co, w = 2) => { for (let k = 0; k < w; k++) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1; for (let i = 0; i <= n; i++) P(x0 + ((x1 - x0) * i) / n + k, y0 + ((y1 - y0) * i) / n, "█", co); } };
  // aura arch with velvet behind
  ell(CX, 16, 19, 11, (d, nx, ny, x, y) => {
    if (y > 27) return null;
    if (d > 0.84) return [(x + y) % 2 ? "█" : "▓", (x % 3 === 0) ? K.mari : K.gold];
    if (d > 0.76) return ["█", K.goldD];
    return [(x + y) % 5 === 0 ? "▓" : "█", ny < 0 ? K.velvet : K.velvetD];
  });
  // ears
  for (const s of [-1, 1]) ell(CX + s * 10, 12.5, 5, 4.2, (d) => (d > 0.78 ? ["█", K.goldD] : d > 0.3 ? ["█", K.ear] : ["█", K.earIn]));
  // shawl and torso
  ell(CX, 20.5, 9.5, 4.8, (d, nx) => ["█", nx < -0.4 ? K.skinD : K.skin]);
  ell(CX, 22, 6.5, 2.8, (d) => ["█", d < 0.15 ? K.skinD : K.skinL]);
  thick(CX - 9, 16, CX - 7, 24, K.green); thick(CX + 7, 16, CX + 9, 24, K.greenD);
  // sacred thread
  for (let i = 0; i <= 10; i++) P(CX - 5 + i, 17 + i * 0.7, "█", K.goldL);
  // arms: upper ones raised holding a lotus and an axe, lower ones blessing and holding sweets
  thick(CX - 9, 18, CX - 14, 13, K.skin); thick(CX + 8, 18, CX + 13, 13, K.skin);
  P(CX - 15, 13, "█", K.gold); P(CX - 14, 13, "█", K.gold); P(CX + 13, 13, "█", K.gold); P(CX + 14, 13, "█", K.gold);
  ell(CX - 15, 11, 2.5, 1.5, (d, nx, ny) => ["█", ny < 0 ? K.lotus : K.lotusD]);
  P(CX - 15, 9, "▲", K.lotus); P(CX - 17, 10, "▲", K.lotusD); P(CX - 13, 10, "▲", K.lotusD);
  for (let y = 7; y <= 12; y++) P(CX + 14, y, "█", K.wood);
  P(CX + 13, 7, "▄", K.goldL); P(CX + 15, 7, "█", K.goldL); P(CX + 16, 7, "▀", K.goldL); P(CX + 15, 8, "▀", K.gold);
  thick(CX - 9, 21, CX - 12, 23, K.skin);
  ell(CX - 13, 21.5, 2, 1.8, (d) => ["█", d < 0.2 ? K.red : K.skinL]);
  thick(CX + 8, 21, CX + 11, 23, K.skin);
  for (let x = CX + 10; x <= CX + 15; x++) { P(x, 24, "▀", K.gold); P(x, 23, "█", (x % 2) ? K.goldL : K.white); }
  P(CX + 11, 22, "▲", K.white); P(CX + 13, 22, "▲", K.goldL); P(CX + 12, 21, "▲", K.white);
  // garland of marigolds
  for (let i = 0; i <= 26; i++) { const s = i / 26; P(CX - 8 + s * 16, 16.5 + Math.sin(s * Math.PI) * 7, "█", i % 3 === 0 ? K.red : i % 2 ? K.mari : K.mariY); }
  // seated legs in yellow silk
  ell(CX, 26, 14, 2.6, (d, nx, ny) => ["█", ny > 0.5 ? K.red : d > 0.7 ? K.silkD : K.silk]);
  P(CX - 12, 26, "█", K.skin); P(CX - 11, 26, "█", K.skin); P(CX + 11, 26, "█", K.skin); P(CX + 12, 26, "█", K.skin);
  // head
  ell(CX, 12, 6.6, 4, (d, nx) => ["█", d > 0.78 ? K.skinD : d < 0.3 ? K.skinL : K.skin]);
  for (let x = CX - 6; x <= CX + 6; x++) P(x, 16, x % 2 ? "█" : "▓", x % 2 ? K.gold : K.red);
  P(CX - 3, 11, "█", K.white); P(CX - 2, 11, "█", K.eye); P(CX + 2, 11, "█", K.eye); P(CX + 3, 11, "█", K.white);
  P(CX, 10, "█", K.red); P(CX, 9, "▄", K.white);
  // trunk curling to one side
  const trunk = [[CX - 1, 13, 3], [CX - 1, 14, 3], [CX - 1, 15, 3], [CX, 16, 3], [CX + 1, 17, 3], [CX + 2, 18, 3], [CX + 4, 18, 2], [CX + 5, 17, 2], [CX + 5, 16, 1]];
  trunk.forEach(([x, y, w], i) => { for (let k = 0; k < w; k++) P(x + k, y, "█", i % 2 ? K.skinD : K.skin); });
  P(CX - 3, 14, "█", K.white); P(CX + 3, 14, "▀", K.white);
  // crown
  for (let y = 5; y <= 9; y++) { const w = [1, 3, 4, 5, 6][y - 5]; for (let x = CX - w; x <= CX + w; x++) P(x, y, "█", (x + y) % 2 ? K.gold : K.goldL); }
  P(CX, 4, "▲", K.goldL); P(CX - 3, 8, "█", K.red); P(CX, 7, "█", K.green); P(CX + 3, 8, "█", K.red); P(CX, 8, "█", K.red);
  // mouse at the base
  P(CX + 16, 27, "▄", K.mouse); P(CX + 17, 27, "█", K.mouse); P(CX + 18, 27, "█", K.mouseD); P(CX + 19, 27, "▄", K.mouse);
  P(CX + 15, 26, "▄", K.mouseD); P(CX + 20, 27, "▄", K.mouseD);
  // cart: platform, marigold strands, wheels drawn per frame
  for (let x = CX - 22; x <= CX + 22; x++) {
    P(x, 28, "▀", K.goldL);
    for (let y = 29; y <= 32; y++) P(x, y, "█", y === 32 ? K.redD : K.red);
    const len = 1 + ((x * 7) % 4);
    if (x % 2 === 0) for (let k = 0; k < len; k++) P(x, 29 + k, "█", k % 2 ? K.mariY : K.mari);
  }

  // ── background buildings, scrolling ──
  const r = rng(14);
  const Wd = 220, tops = new Int16Array(Wd), sh = new Int8Array(Wd), st = new Int16Array(Wd);
  for (let x = 0; x < Wd;) { const w = 10 + Math.floor(r() * 12), top = 9 + Math.floor(r() * 8), c = Math.floor(r() * 3); for (let i = 0; i < w && x + i < Wd; i++) { tops[x + i] = top; sh[x + i] = c; st[x + i] = x; } x += w; }
  const petals = Array.from({ length: 50 }, () => ({ x: r() * cols, sp: 3 + r() * 3, ph: r(), c: r() < 0.5, sw: r() * 6 }));
  const crowd = Array.from({ length: 22 }, (_, i) => ({ x: 2 + i * 4.6 + r() * 2, h: 22 + Math.floor(r() * 3), ph: r() * 6, up: r() < 0.6, col: ["c1", "c2", "c3", "c4", "crowd"][Math.floor(r() * 5)] }));
  const drummers = [8, 23, 77, 92].map((x, i) => ({ x, ph: i * 0.7 }));

  return (t) => {
    g.clear();
    // dusk sky with drifting gulal haze
    for (let y = 0; y < 30; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.04 - t * 0.08, y * 0.15, 3, 2);
      const v = clamp(y / 26 + (n - 0.5) * 0.3);
      g.set(x, y, n > 0.62 ? "▓" : "█", KEYS[Math.min(9, Math.floor(v * 10))]);
      if (y > 12) {
        const h = fbm(x * 0.06 - t * 0.35, y * 0.2 + t * 0.05, 3, 9);
        if (h > 0.56) g.set(x, y, h > 0.64 ? "▓" : "▒", h > 0.64 ? K.gulal : K.gulalD);
      }
    }
    // buildings with lit windows and bulb strings
    const off = t * 2.2;
    for (let x = 0; x < cols; x++) {
      const wx = ((Math.floor(x + off) % Wd) + Wd) % Wd, top = tops[wx], lx = wx - st[wx];
      for (let y = top; y < 30; y++) {
        const ly = y - top, win = lx % 4 >= 1 && lx % 4 <= 2 && ly % 4 === 2 && fract(Math.sin(wx * 3.1 + ly * 1.7) * 999) > 0.55;
        g.set(x, y, "█", win ? K.win : KEYS[10 + sh[wx]]);
      }
      g.set(x, top + 1 + Math.round(Math.sin(((wx % 10) / 10) * Math.PI) * 1.5), wx % 2 ? "●" : "▪", K[["bulbR", "gold", "bulbG", "bulbB"][(wx >> 1) % 4]]);
    }
    // road
    for (let y = 30; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm((x + t * 4) * 0.12, y * 0.4, 2, 4);
      g.set(x, y, n > 0.6 ? "▓" : "█", KEYS[13 + Math.min(3, Math.floor(clamp(0.2 + (y - 30) / 10 + (n - 0.5) * 0.4) * 4))]);
    }
    // crowd behind the cart, hands raised and swaying
    for (const c of crowd) {
      const bob = Math.sin(t * 4 + c.ph) > 0 ? 0 : 1, x = Math.round(c.x), y = c.h + bob;
      g.text(x, y, "▄▄", K.crowdL); g.fill(x - 1, y + 1, 4, 30 - y, "█", K[c.col]);
      if (c.up) { const sw = Math.round(Math.sin(t * 3 + c.ph) * 1.2); g.line(x - 1, y + 1, x - 2 + sw, y - 3, "█", K.crowdL); g.line(x + 2, y + 1, x + 3 + sw, y - 3, "█", K.crowdL); }
    }
    // the idol and cart (moves gently with the cart)
    const sway = Math.sin(t * 2.2) > 0.6 ? 1 : 0;
    for (let i = 0; i < N; i++) if (ich[i] !== null) { const y = Math.floor(i / cols); g.set(i % cols, y - sway * (y < 28 ? 0 : 0), ich[i], ico[i]); }
    // wheels with turning spokes
    for (const wxc of [CX - 15, CX + 15]) {
      for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; g.set(wxc + Math.cos(a) * 4, 33 + Math.sin(a) * 2.2, "█", K.wood); }
      for (let k = 0; k < 3; k++) { const a = t * 2.5 + (k * Math.PI) / 3; g.line(wxc - Math.cos(a) * 3, 33 - Math.sin(a) * 1.6, wxc + Math.cos(a) * 3, 33 + Math.sin(a) * 1.6, "█", K.woodL); }
      g.set(wxc, 33, "●", K.gold);
    }
    // dhol players up front
    const beat = Math.floor(t / BEAT), bs = t - beat * BEAT;
    for (const d of drummers) {
      const hit = (bs + d.ph * 0.1) % BEAT < 0.09, b = hit ? 1 : 0;
      const x = d.x, y = 24 + b;
      g.text(x - 1, y, "▄██▄", K.saffronL); g.text(x - 2, y + 1, "██████", K.saffron); g.set(x + 4, y + 2, "█", K.saffron); g.set(x + 4, y + 3, "▀", K.saffron);
      g.text(x - 1, y + 2, "████", K.skinD); g.text(x - 1, y + 3, "▀██▀", K.skinD);
      g.fill(x - 3, y + 4, 8, 6, "█", K.kurta); g.vline(x + 4, y + 4, y + 9, "▓", K.kurtaD);
      g.line(x - 2, y + 10, x - 3, rows - 1, "█", K.kurtaD); g.line(x + 3, y + 10, x + 4, rows - 1, "█", K.kurtaD);
      for (let yy = y + 6; yy <= y + 10; yy++) for (let xx = x - 5; xx <= x + 6; xx++) {
        const edge = xx === x - 5 || xx === x + 6;
        g.set(xx, yy, "█", edge ? K.head : (xx + yy) % 3 === 0 ? K.gold : yy === y + 6 || yy === y + 10 ? K.dholD : K.dhol);
      }
      const sx = hit ? x + 6 : x + 8, sy = hit ? y + 7 : y + 3;
      g.line(x + 3, y + 5, sx, sy, "█", K.skinD); g.line(sx, sy, sx - 1, sy - 3, "█", K.stick);
      const lx = hit ? x - 6 : x - 8, ly = hit ? y + 8 : y + 4;
      g.line(x - 2, y + 5, lx, ly, "█", K.skinD); g.line(lx, ly, lx + 1, ly - 3, "│", K.stick);
    }
    // petals falling
    for (const p of petals) {
      const y = fract(t / (rows / p.sp) + p.ph) * rows;
      const xx = (((p.x + Math.sin(t * 1.4 + p.sw) * 2 - t) % cols) + cols) % cols;
      g.set(xx, y, (Math.floor(t * 3 + p.sw) % 2) ? "■" : "▪", p.c ? K.petalP : K.petalO);
    }
    return g.frame();
  };
}
