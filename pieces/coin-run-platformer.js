/* coin-run-platformer: a side-scrolling runner that jumps gaps, stomps critters and grabs coins on its own. */
import { Grid, palette, gradient, KEYS, rng, noise2, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#2a5ac8", "#4a86e8", "#7ab4f4", "#b4dcff"], 8));
const HILL = add(["#2e7a5a", "#3a8a66", "#246048", "#58aa80"]);
const CLOUD = add(["#ffffff", "#dceaf8"]);
const GRASS = add(["#5ad04a", "#3aa83a", "#9af06a"]);
const DIRT = add(gradient(["#3a200e", "#6a3a1a", "#9a5a2a", "#c47e40"], 6));
const BRICK = add(["#c8642a", "#8a3a14", "#f4a06a"]);
const COIN = add(["#ffd84a", "#f4a81a", "#fff6b0"]);
const HERO = add(["#e83a3a", "#2a5ad8", "#f4c8a0", "#5a2a10", "#ffffff"]);
const ENEMY = add(["#8a4a2a", "#c87a4a", "#ffffff", "#1a0a0a"]);
const PIT = add(["#0a0a14", "#c8c8d8", "#1a1a2a"]);
const UI = add(["#ffffff", "#ffd84a", "#0a0e1a"]);

export const meta = {
  slug: "coin-run-platformer",
  name: "Coin Run Platformer",
  category: "arcade",
  note: "A side-scrolling hero runs on its own through grassy hills, jumping pits, landing on brick ledges, stomping critters and collecting coins.",
  tags: ["platformer", "game", "retro", "runner", "arcade", "hero"],
  cols: 80, rows: 24, fps: 30,
  palette: palette(P),
};

const RATE = 30, DT = 1 / RATE, SPEED = 11, G = 50, V0 = 22, ROUND = 60, LEN = Math.ceil(ROUND * SPEED) + 160;

function makeSim(rate, roundSteps, init, step) {
  let st = null, round = -1, k = 0;
  return (t) => {
    const s = Math.max(0, Math.floor(t * rate));
    const r = Math.floor(s / roundSteps), want = s % roundSteps;
    if (r !== round || want < k) { st = init(r); round = r; k = 0; }
    while (k < want) { step(st); k++; }
    return st;
  };
}

function buildLevel(r) {
  const hg = new Int8Array(LEN), pl = new Int8Array(LEN), coins = new Map(), enemies = [];
  let x = 0, h = 5;
  while (x < LEN) {
    const run = x === 0 ? 30 : 9 + Math.floor(r() * 14);
    for (let i = 0; i < run && x + i < LEN; i++) hg[x + i] = h;
    if (x > 0 && run > 12 && r() < 0.6) {
      const ph = h + 4, px = x + 3, pw = 5 + Math.floor(r() * 4);
      for (let i = 0; i < pw; i++) { pl[px + i] = ph; if (i % 2 === 0) coins.set((px + i) + "," + (ph + 2), 1); }
    } else if (x > 0 && run > 10) enemies.push({ x0: x + 3, x1: x + run - 3, x: x + run - 4, dir: -1, dead: 0, y: h });
    x += run;
    if (r() < 0.55) {
      const gap = 3 + Math.floor(r() * 4);
      for (let i = 0; i < gap; i++) coins.set((x + i) + "," + (h + 4 + (i > 0 && i < gap - 1 ? 1 : 0)), 1);
      x += gap;
      h = clamp(h + Math.floor(r() * 3) - 1, 3, 9);
    } else h = clamp(h + (r() < 0.5 ? 1 : -1) * (1 + Math.floor(r() * 2)), 3, 9);
  }
  return { hg, pl, coins, enemies };
}

function top(st, x, y) {
  const c = Math.floor(x + 1);
  let best = st.hg[c] || -9;
  for (const cc of [Math.floor(x), Math.floor(x + 2)]) best = Math.max(best, st.hg[cc] || -9);
  for (const cc of [Math.floor(x), Math.floor(x + 1), Math.floor(x + 2)]) { const p = st.pl[cc]; if (p && y >= p - 0.01 && p > best) best = p; }
  return best;
}

function step(st) {
  st.tick++;
  for (const e of st.enemies) {
    if (e.dead) { e.dead++; continue; }
    if (Math.abs(e.x - st.x) > 60) continue;
    e.x += e.dir * 3 * DT;
    if (e.x < e.x0 || e.x > e.x1) e.dir *= -1;
  }
  if (st.dead) { if (++st.dead > 40) { st.dead = 0; st.lives--; let nx = Math.floor(st.x) + 4; while (!st.hg[nx] || !st.hg[nx + 3]) nx++; st.x = nx; st.y = st.hg[nx + 1]; st.vy = 0; } return; }
  st.x += SPEED * DT;
  const ground = top(st, st.x, st.y);
  const grounded = st.vy <= 0 && Math.abs(st.y - ground) < 0.05;
  if (grounded) {
    const px = Math.floor(st.x + 1);
    let jump = false;
    for (let a = 2; a <= 3; a++) if (!st.hg[px + a] && !st.pl[px + a]) jump = true;
    for (let a = 1; a <= 4; a++) if ((st.hg[px + a] || 0) > st.y + 0.5) jump = true;
    for (const e of st.enemies) if (!e.dead && e.x - st.x > 2 && e.x - st.x < 6 && Math.abs(e.y - st.y) < 1) jump = true;
    for (let a = 3; a <= 6; a++) for (let dy = 2; dy <= 5; dy++) if (st.coins.has((px + a) + "," + Math.round(st.y + dy))) jump = true;
    if (jump) st.vy = V0;
  }
  st.vy -= G * DT;
  const ny = st.y + st.vy * DT;
  const t2 = top(st, st.x, st.y);
  if (ny <= t2 && (st.vy <= 0 || t2 - ny < 3)) { st.y = t2; st.vy = 0; }
  else st.y = ny;
  if (st.y < -2) { st.dead = 1; return; }
  for (let a = 0; a < 3; a++) for (let dy = 0; dy < 3; dy++) {
    const key = Math.floor(st.x + a) + "," + Math.floor(st.y + dy);
    if (st.coins.get(key) === 1) { st.coins.set(key, st.tick); st.score += 100; st.ncoins++; }
  }
  for (const e of st.enemies) if (!e.dead && Math.abs(e.x - (st.x + 0.5)) < 2 && st.y - e.y < 2 && st.y - e.y > -1) {
    if (st.vy < 0 || st.y > e.y + 0.3) { e.dead = 1; st.vy = V0 * 0.7; st.score += 200; }
  }
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(RATE, RATE * ROUND, (round) => {
    const r = rng(910 + round * 37);
    const lv = buildLevel(r);
    return { ...lv, x: 4, y: lv.hg[5], vy: 0, score: 0, ncoins: 0, lives: 3, tick: 0, dead: 0, world: 1 + (round % 4) };
  }, step);
  const BOT = rows - 1;
  return (t) => {
    const st = sim(t);
    const cam = st.x - 18;
    const ci = Math.floor(cam);
    g.clear();
    for (let y = 1; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wy = BOT - y;
      let ch = "█", co = KEYS[SKY + Math.min(7, Math.floor((y / rows) * 8))];
      const hx = x + cam * 0.3;
      const hill = 2 + fbm(hx * 0.05, 1, 3, 2) * 11;
      if (wy < hill) { const edge = hill - wy < 1; ch = edge ? "▄" : (Math.floor(hx) + y) % 7 === 0 ? "▒" : "█"; co = KEYS[HILL + (edge ? 3 : (Math.floor(hx * 0.2) % 2))]; if (edge) g.set(x, y, "█", co); }
      const cx = x + cam * 0.12 + t * 1.5;
      const cl = noise2(cx * 0.09, y * 0.35, 5);
      if (y > 1 && y < 9 && cl > 0.7) { ch = cl > 0.78 ? "█" : "▓"; co = KEYS[CLOUD + (cl > 0.78 ? 0 : 1)]; }
      if (!(wy < hill && hill - wy < 1)) g.set(x, y, ch, co);
    }
    for (let x = 0; x < cols; x++) {
      const wx = ci + x;
      const h = st.hg[wx] || 0;
      if (!h) {
        g.set(x, BOT, "▲", KEYS[PIT + 1]); g.set(x, BOT - 1, "░", KEYS[PIT + 2]);
      }
      for (let wy = 0; wy < h; wy++) {
        const y = BOT - wy;
        if (wy === h - 1) g.set(x, y, (wx % 3) ? "▀" : "█", KEYS[GRASS + (wx % 3 ? 0 : 1)]);
        else {
          const stone = (wx * 13 + wy * 7) % 11 === 0;
          g.set(x, y, stone ? "●" : (wx + wy) % 2 ? "▓" : "█", KEYS[DIRT + (stone ? 5 : 1 + ((wx * 3 + wy) % 3))]);
        }
      }
      if (h && st.hg[wx - 1] === 0 || h && !st.hg[wx + 1]) for (let wy = 0; wy < h - 1; wy++) g.set(x, BOT - wy, "▓", KEYS[DIRT]);
      const p = st.pl[wx];
      if (p) { g.set(x, BOT - p + 1, wx % 2 ? "▀" : "▀", KEYS[BRICK + (wx % 2)]); g.set(x, BOT - p + 1, (wx % 3) ? "▀" : "▙", KEYS[BRICK + (wx % 3 ? 0 : 2)]); }
    }
    for (const [key, v] of st.coins) {
      const [wx, wy] = key.split(",").map(Number);
      const x = wx - ci; if (x < 0 || x >= cols) continue;
      if (v === 1) g.set(x, BOT - wy, ["●", "●", "|", "o"][Math.floor(t * 8 + wx) % 4], KEYS[COIN + (Math.floor(t * 8 + wx) % 4 === 2 ? 1 : 0)]);
      else if (st.tick - v < 12) g.text(x - 1, BOT - wy - Math.floor((st.tick - v) / 3), "100", KEYS[COIN + 2]);
    }
    for (const e of st.enemies) {
      const x = Math.round(e.x - cam), y = BOT - e.y;
      if (x < -3 || x > cols) continue;
      if (e.dead) { if (e.dead < 20) g.text(x, y, "▄▄▄", KEYS[ENEMY]); continue; }
      const f = Math.floor(t * 6) % 2;
      g.text(x, y - 1, "▄█▄", KEYS[ENEMY + 1]);
      g.set(x + (e.dir < 0 ? 0 : 2), y - 1, "o", KEYS[ENEMY + 2]);
      g.text(x, y, f ? "▀█▄" : "▄█▀", KEYS[ENEMY]);
    }
    if (!st.dead || st.dead % 6 < 3) {
      const x = Math.round(st.x - cam), y = BOT - Math.floor(st.y);
      const air = Math.abs(st.vy) > 0.1;
      const leg = air ? "/ >" : ["/ \\", " | ", "/ \\", " |\\"][Math.floor(t * 10) % 4];
      g.text(x, y - 2, "▄█▄", KEYS[HERO]); g.set(x + 2, y - 2, "▄", KEYS[HERO]);
      g.set(x + 1, y - 2, "█", KEYS[HERO]);
      g.text(x, y - 1, "▐", KEYS[HERO + 2]); g.set(x + 1, y - 1, "█", KEYS[HERO + 1]); g.set(x + 2, y - 1, air ? "/" : "▌", KEYS[HERO + 2]);
      g.text(x, y, leg, KEYS[HERO + 3]);
      if (st.dead) g.text(x - 1, y - 3, "OUCH", KEYS[UI]);
    }
    for (let x = 0; x < cols; x++) g.set(x, 0, " ", KEYS[UI + 2]);
    g.text(1, 0, "SCORE " + String(st.score).padStart(6, "0"), KEYS[UI]);
    g.text(18, 0, "● x" + String(st.ncoins).padStart(2, "0"), KEYS[UI + 1]);
    g.text(30, 0, "WORLD 1-" + st.world, KEYS[UI]);
    g.text(46, 0, "LIVES " + "♥".repeat(Math.max(0, st.lives)), KEYS[HERO]);
    g.text(cols - 10, 0, "TIME " + String(Math.max(0, 300 - Math.floor(st.tick / RATE * 4))).padStart(3, "0"), KEYS[UI]);
    return g.frame();
  };
}
