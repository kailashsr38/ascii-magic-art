/* frog-hop-crossing: a frog that plays itself across a busy road and a log-filled river to its lily pad homes. */
import { Grid, palette, gradient, KEYS, rng, noise2 } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WATER = add(gradient(["#06204a", "#0b3a7a", "#1660b0", "#3a8ad8"], 6));
const ROAD = add(["#1c1d22", "#2a2c33", "#3a3d46", "#e8c84a", "#d8dce4"]);
const GRASS = add(gradient(["#123a14", "#1f5a1e", "#2f7a2a", "#4a9a36"], 5));
const FLOWER = add(["#f4e04a", "#f07ab4", "#ffffff"]);
const LOG = add(["#4a2a12", "#6e4220", "#9a6232", "#c88a4e", "#e8b478"]);
const TURT = add(["#1a5a2a", "#2e8a3e", "#5ac05a", "#c84a3a"]);
const CAR = add(["#e84a4a", "#4a8ae8", "#f4b03a", "#c86ae8", "#3ad0c0", "#f0f0f0"]);
const CARD = add(["#8a2424", "#244a8a", "#9a6a1a", "#6a3a8a", "#1a7a70", "#9a9aa4"]);
const GLASS = add(["#9ad8f4", "#1a1a20", "#fff4a0"]);
const FROG = add(["#7af04a", "#2a9a2a", "#ffffff", "#101010"]);
const UI = add(["#e6edf3", "#8b949e", "#ff5a4f", "#ffd166", "#0a0c10"]);

export const meta = {
  slug: "frog-hop-crossing",
  name: "Frog Hop Crossing",
  category: "arcade",
  note: "A self-playing frog hops between speeding cars and rides logs and turtles across the river to fill its five lily pad homes.",
  tags: ["frog", "game", "arcade", "retro", "road", "river"],
  cols: 64, rows: 28, fps: 20,
  palette: palette(P),
};

const W = 64, RATE = 20, DT = 1 / RATE;
const SLOTS = [6, 19, 32, 45, 58];
// lane: [speed cols/s, item length, count, kind]  lanes 1-5 river, 7-11 road
const LANES = {
  1: [3, 12, 3, "log"], 2: [-4, 7, 4, "turt"], 3: [5.5, 17, 2, "log"], 4: [-3, 10, 3, "turt"], 5: [2.5, 11, 3, "log"],
  7: [-6, 5, 3, "car"], 8: [4, 10, 2, "truck"], 9: [-9, 4, 2, "car"], 10: [3, 6, 3, "car"], 11: [-5, 5, 3, "car"],
};
const mod = (a, n) => ((a % n) + n) % n;

function items(L) {
  const [v, len, n] = LANES[L];
  const out = [];
  for (let i = 0; i < n; i++) out.push({ off: (i * W) / n + ((L * 7 + i * 13) % 5), len, ci: (L + i) % 6 });
  return out;
}
const ITEMS = {};
for (const k in LANES) ITEMS[k] = items(+k);

function covered(L, x, t) {
  const [v, len] = LANES[L];
  for (const it of ITEMS[L]) {
    const p = mod(it.off + v * t, W);
    if (mod(x - p, W) < len) return true;
  }
  return false;
}
const river = (L) => L >= 1 && L <= 5, road = (L) => L >= 7 && L <= 11;

function safe(L, x, t, ahead = 0.35) {
  if (x < 1.5 || x > W - 2.5) return false;
  for (let s = 0; s <= ahead + 1e-6; s += 0.05) {
    const tt = t + s;
    if (road(L)) { if (covered(L, x - 1, tt) || covered(L, x, tt) || covered(L, x + 1, tt)) return false; }
    else if (river(L)) { const xx = x + LANES[L][0] * s; if (!covered(L, xx, tt) || xx < 1.5 || xx > W - 2.5) return false; }
  }
  return true;
}

function makeSim(rate, roundSteps, init, step) {
  let st = null, round = -1, k = 0;
  return (t) => {
    const s = Math.max(0, Math.floor(t * rate));
    const r = Math.floor(s / roundSteps), want = s % roundSteps;
    if (r !== round || want < k) { st = init(r, r * roundSteps); round = r; k = 0; }
    while (k < want) { step(st, (r * roundSteps + k) / rate); k++; }
    return st;
  };
}
function resetFrog(st) { st.L = 12; st.x = 32; st.cool = 6; st.best = 12; st.clock = 0; }
function newGame(st) { st.homes = [0, 0, 0, 0, 0]; st.lives = 3; st.score = 0; resetFrog(st); }

function step(st, t) {
  if (st.dead) { if (++st.dead > 16) { st.dead = 0; if (--st.lives <= 0) newGame(st); else resetFrog(st); } return; }
  if (st.won) { if (++st.won > 24) { st.won = 0; st.homes = [0, 0, 0, 0, 0]; st.level++; resetFrog(st); } return; }
  st.clock++;
  if (st.clock > RATE * 30) { st.dead = 1; st.how = "hit"; return; }
  if (river(st.L)) st.x += LANES[st.L][0] * DT;
  const tn = t + DT;
  if (river(st.L) && (!covered(st.L, st.x, tn) || st.x < 1 || st.x > W - 2)) { st.dead = 1; st.how = "splash"; return; }
  if (road(st.L) && (covered(st.L, st.x - 1, tn) || covered(st.L, st.x, tn) || covered(st.L, st.x + 1, tn))) { st.dead = 1; st.how = "hit"; return; }
  if (st.cool > 0) { st.cool--; return; }
  const moves = [];
  if (st.L === 1) {
    let tgt = -1, bd = 99;
    SLOTS.forEach((sx, i) => { const d = Math.abs(sx - st.x) + (sx < st.x - 2 ? 20 : 0); if (!st.homes[i] && d < bd) { bd = d; tgt = i; } });
    if (bd >= 20) bd -= 20;
    if (tgt >= 0 && bd <= 1.6) {
      st.homes[tgt] = 1; st.score += 50 + Math.max(0, 300 - st.clock); st.cool = 4;
      if (st.homes.every((h) => h)) { st.won = 1; st.score += 1000; } else resetFrog(st);
      return;
    }
    if (tgt >= 0) { const d = Math.sign(SLOTS[tgt] - st.x) * 2; if (safe(1, st.x + d, tn, 0.2)) moves.push([1, d]); }
  } else if (safe(st.L - 1, st.x, tn) && (st.L !== 2 || SLOTS.some((sx, i) => !st.homes[i] && sx >= st.x - 2 && sx <= st.x + 22))) moves.push([st.L - 1, 0]);
  const here = st.L === 12 || st.L === 6 || safe(st.L, st.x, tn, 0.3);
  if (!moves.length && !here) {
    for (const [dl, dx] of [[0, -2], [0, 2], [1, 0], [-1, 0]]) {
      const L2 = st.L + dl; if (L2 > 12 || L2 < 1) continue;
      if (L2 === 12 || L2 === 6 || safe(L2, st.x + dx, tn, 0.3)) { moves.push([L2, dx]); break; }
    }
  }
  if (moves.length && st.r() < 0.8) {
    const [L2, dx] = moves[0];
    if (L2 < st.L) st.score += L2 < st.best ? 10 : 0;
    st.best = Math.min(st.best, L2);
    st.L = L2; st.x += dx; st.cool = 2 + Math.floor(st.r() * 3); st.hop = 3;
  }
  if (st.hop) st.hop--;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(RATE, RATE * 120, (r) => { const st = { r: rng(400 + r * 97), level: 1 }; newGame(st); return st; }, step);
  const k = (o, i) => KEYS[o + i];
  return (t) => {
    const st = sim(t);
    const tq = Math.floor(t * RATE) / RATE;
    g.clear();
    const Y = (L) => 1 + L * 2;
    for (let L = 0; L <= 12; L++) {
      const y0 = Y(L);
      for (let dy = 0; dy < 2; dy++) for (let x = 0; x < W; x++) {
        const y = y0 + dy;
        if (L === 0) {
          const bay = SLOTS.some((s) => Math.abs(x - s) <= 3);
          if (bay) g.set(x, y, dy ? "≈" : "~", k(WATER, 1 + dy));
          else g.set(x, y, (x + dy) % 3 ? "▓" : "█", k(GRASS, (x * 7 + dy) % 3));
        } else if (river(L)) {
          const n = noise2((x - LANES[L][0] * tq * 0.6) * 0.35, y * 0.7, 3);
          g.set(x, y, n > 0.62 ? "≈" : n > 0.4 ? "~" : "░", k(WATER, Math.min(5, 1 + Math.floor(n * 4.5))));
        } else if (road(L)) {
          g.set(x, y, "░", k(ROAD, 1));
          if (dy === 0 && L > 7 && x % 6 < 3) g.set(x, y, "─", k(ROAD, 3));
        } else {
          const f = (x * 31 + y * 17) % 23 === 0;
          g.set(x, y, f ? "*" : (x + y) % 2 ? "▒" : "▓", f ? k(FLOWER, (x + y) % 3) : k(GRASS, 1 + ((x * 3 + y) % 3)));
        }
      }
    }
    // lily pads and filled homes
    SLOTS.forEach((s, i) => {
      g.text(s - 2, Y(0), "▄██▄", k(TURT, 2));
      g.text(s - 2, Y(0) + 1, "▀██▀", k(TURT, 1));
      if (st.homes[i]) { g.text(s - 1, Y(0), "o█o", k(FROG, 0)); g.text(s - 1, Y(0) + 1, "/▀\\", k(FROG, 1)); }
    });
    for (const Ls in ITEMS) {
      const L = +Ls, [v, len, , kind] = LANES[L], y0 = Y(L);
      for (const it of ITEMS[L]) {
        const p = mod(it.off + v * tq, W);
        for (let i = 0; i < len; i++) {
          const x = Math.floor(mod(p + i, W));
          if (kind === "log") {
            const end = i === 0 || i === len - 1;
            g.set(x, y0, end ? "▄" : "▀", k(LOG, end ? 2 : 4));
            g.set(x, y0 + 1, end ? "@" : i % 5 === 2 ? "=" : "█", k(LOG, end ? 3 : 1 + (i % 2)));
            if (!end) g.set(x, y0, "█", k(LOG, 3 - (i % 3 === 0 ? 1 : 0)));
          } else if (kind === "turt") {
            const j = i % 4;
            const dive = L === 4 && Math.floor(tq / 2.5) % 3 === 2;
            if (j === 3) continue;
            g.set(x, y0, j === 1 ? "▓" : "▄", k(TURT, dive ? 0 : j === 1 ? 2 : 1));
            g.set(x, y0 + 1, j === 1 ? "█" : "▀", k(TURT, dive ? 0 : 1));
          } else {
            const ci = it.ci, front = v > 0 ? len - 1 : 0, back = v > 0 ? 0 : len - 1;
            let top = "█", bot = "█", ct = k(CAR, ci), cb = k(CARD, ci);
            if (i === front) { top = v > 0 ? "▙" : "▟"; bot = v > 0 ? "▛" : "▜"; }
            if (kind === "truck" && i < len - 3 && v > 0) { top = "▓"; ct = k(CARD, 5); cb = k(CAR, 5); bot = "█"; }
            if (i === (v > 0 ? len - 2 : 1) || (kind === "car" && i === Math.floor(len / 2))) { top = "▒"; ct = k(GLASS, 0); }
            g.set(x, y0, top, ct); g.set(x, y0 + 1, bot, cb);
            if (i === 1 || i === len - 2) g.set(x, y0 + 1, "●", k(GLASS, 1));
            if (i === front) g.set(x, y0 + 1, "▪", k(GLASS, 2));
            if (i === back) g.set(x, y0, "▪", k(UI, 2));
          }
        }
      }
    }
    // frog
    const fx = Math.round(st.x) - 1, fy = Y(st.L);
    if (st.dead) {
      if (st.how === "splash") { g.text(fx - 1, fy, "°o°o°", k(WATER, 5)); g.text(fx - 1, fy + 1, "≈≈≈≈≈", k(FROG, 2)); }
      else { g.text(fx, fy, "\\|/", k(UI, 2)); g.text(fx, fy + 1, "/X\\", k(UI, 3)); }
    } else if (!st.won) {
      if (st.hop) { g.text(fx, fy, "°█°", k(FROG, 0)); g.text(fx, fy + 1, "▀▀▀", k(FROG, 1)); }
      else { g.text(fx, fy, "o█o", k(FROG, 0)); g.text(fx, fy + 1, "/▀\\", k(FROG, 1)); }
      g.set(fx, fy, "o", k(FROG, 2)); g.set(fx + 2, fy, "o", k(FROG, 2));
    }
    // HUD
    for (let x = 0; x < cols; x++) { g.set(x, 0, " ", k(UI, 4)); g.set(x, rows - 1, " ", k(UI, 4)); }
    g.text(1, 0, "SCORE " + String(st.score).padStart(5, "0"), k(UI, 0));
    g.text(22, 0, "HOMES " + st.homes.map((h) => (h ? "■" : "□")).join(""), k(UI, 3));
    g.text(cols - 10, 0, "LEVEL " + String(st.level).padStart(2, "0"), k(UI, 1));
    g.text(1, rows - 1, "LIVES " + "♥".repeat(Math.max(0, st.lives)), k(UI, 2));
    const left = Math.max(0, 30 - Math.floor(st.clock / RATE));
    g.text(cols - 23, rows - 1, "TIME", k(UI, 1));
    g.text(cols - 18, rows - 1, "█".repeat(Math.ceil(left / 2)).padEnd(15, "░"), left < 10 ? k(UI, 2) : k(FROG, 0));
    if (st.won) { g.box(18, 12, 28, 3, "double", k(UI, 3)); g.text(19, 13, "   ALL FROGS HOME!  ", k(UI, 0)); }
    return g.frame();
  };
}
