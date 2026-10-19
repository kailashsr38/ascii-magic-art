/* gem-cascade: a match-three gem board that picks its own swaps, clears lines and cascades new gems down. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const GEM = add(["#ff3a5a", "#ffd23a", "#3ae07a", "#3a8aff", "#c05aff", "#f4f4f4"]);
const GEMD = add(["#a81a34", "#b48a14", "#1a8a44", "#1a4ab4", "#7a2ab4", "#a4a8b4"]);
const GEMH = add(["#ffb4c4", "#fff4b0", "#b4ffd0", "#b4d4ff", "#ecc4ff", "#ffffff"]);
const BOARD = add(["#1a1030", "#24183e", "#3a2a5e", "#5a4a8a"]);
const BG = add(gradient(["#0a0618", "#160c2a", "#24123e"], 5));
const UI = add(["#e6edf3", "#8b949e", "#ffd166", "#ff7b72", "#7ee787", "#ffffff"]);

export const meta = {
  slug: "gem-cascade",
  name: "Gem Cascade",
  category: "arcade",
  note: "A match-three board that plays itself, swapping gems into lines, clearing them in bursts and letting new gems cascade down into combos.",
  tags: ["match three", "puzzle", "gems", "game", "casual", "loader"],
  cols: 60, rows: 24, fps: 20,
  palette: palette(P),
};

const N = 8, CW = 4, CH = 2, OX = 3, OY = 3;
const SPR = [
  ["▄█▄", "▀█▀"], ["▐█▌", "▐█▌"], ["/█\\", "\\█/"], ["▟█▙", "▜█▛"], [" ▲ ", "▟█▙"], ["▄●▄", "▀▀▀"],
];

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
function matches(b) {
  const m = new Uint8Array(N * N);
  let any = false;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = b[y * N + x]; if (v < 0) continue;
    if (x <= N - 3 && b[y * N + x + 1] === v && b[y * N + x + 2] === v) { m[y * N + x] = m[y * N + x + 1] = m[y * N + x + 2] = 1; any = true; }
    if (y <= N - 3 && b[(y + 1) * N + x] === v && b[(y + 2) * N + x] === v) { m[y * N + x] = m[(y + 1) * N + x] = m[(y + 2) * N + x] = 1; any = true; }
  }
  return any ? m : null;
}
function fresh(r) {
  const b = new Int8Array(N * N);
  do { for (let i = 0; i < N * N; i++) b[i] = Math.floor(r() * 6); } while (matches(b) || !swaps(b).length);
  return b;
}
function swaps(b) {
  const out = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const x2 = x + dx, y2 = y + dy; if (x2 >= N || y2 >= N) continue;
    const c = b.slice(); const a = y * N + x, d = y2 * N + x2;
    [c[a], c[d]] = [c[d], c[a]];
    const m = matches(c); if (m) out.push([a, d, m.reduce((s, v) => s + v, 0)]);
  }
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(20, 20 * 90, (round) => {
    const r = rng(300 + round * 11);
    const st = { r, b: fresh(r), phase: "think", tm: 0, score: 0, combo: 0, best: 0, moves: 0, cur: 27, fx: [], drop: new Float32Array(N * N) };
    return st;
  }, (st) => {
    st.tm++;
    st.fx = st.fx.filter((f) => ++f.age < 12);
    if (st.phase === "think") {
      if (!st.plan) {
        const opts = swaps(st.b);
        if (!opts.length) { st.b = fresh(st.r); return; }
        opts.sort((a, b) => b[2] - a[2]);
        st.plan = opts[Math.floor(st.r() * Math.min(4, opts.length))];
      }
      const tx = st.plan[0] % N, ty = Math.floor(st.plan[0] / N);
      const cx = st.cur % N, cy = Math.floor(st.cur / N);
      if (st.tm % 2 === 0 && (cx !== tx || cy !== ty)) st.cur = (cy + Math.sign(ty - cy)) * N + cx + (cy === ty ? Math.sign(tx - cx) : 0);
      else if (cx === tx && cy === ty && st.tm > 6) { st.phase = "swap"; st.tm = 0; }
    } else if (st.phase === "swap") {
      if (st.tm >= 6) {
        const [a, d] = st.plan; [st.b[a], st.b[d]] = [st.b[d], st.b[a]];
        st.moves++; st.combo = 0; st.plan = null; st.phase = "match"; st.tm = 0; st.m = matches(st.b);
      }
    } else if (st.phase === "match") {
      if (st.tm >= 8) {
        st.combo++;
        let n = 0;
        for (let i = 0; i < N * N; i++) if (st.m[i]) { st.fx.push({ i, age: 0, v: st.b[i] }); st.b[i] = -1; n++; }
        const pts = n * 10 * st.combo; st.score += pts; st.best = Math.max(st.best, st.combo);
        st.pop = { pts, age: 0, i: st.m.indexOf(1) };
        st.drop.fill(0);
        for (let x = 0; x < N; x++) {
          let w = N - 1;
          for (let y = N - 1; y >= 0; y--) { const v = st.b[y * N + x]; if (v >= 0) { st.b[w * N + x] = v; st.drop[w * N + x] = w - y; w--; } }
          const fill = w + 1;
          for (let y = w; y >= 0; y--) { st.b[y * N + x] = Math.floor(st.r() * 6); st.drop[y * N + x] = fill + 1; }
        }
        st.phase = "fall"; st.tm = 0;
      }
    } else if (st.phase === "fall") {
      let moving = false;
      for (let i = 0; i < N * N; i++) if (st.drop[i] > 0) { st.drop[i] = Math.max(0, st.drop[i] - 0.5); moving = true; }
      if (!moving) { st.m = matches(st.b); st.phase = st.m ? "match" : "think"; st.tm = 0; }
    }
    if (st.pop) st.pop.age++;
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y) % 4 ? "▓" : "▒", KEYS[BG + Math.floor((1 - y / rows) * 3) + ((x >> 3) + (y >> 2)) % 2]);
    g.box(OX - 2, OY - 1, N * CW + 3, N * CH + 2, "double", KEYS[BOARD + 3]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (let j = 0; j < CH; j++) g.text(OX - 1 + x * CW, OY + y * CH + j, "    ".slice(0, x === N - 1 ? 5 : 4), KEYS[BOARD]);
    for (let y = 0; y < N * CH; y++) for (let x = 0; x < N * CW + 1; x++) {
      const cx = Math.floor(x / CW), cy = Math.floor(y / CH);
      g.set(OX - 1 + x, OY + y, "█", KEYS[BOARD + ((cx + cy) % 2)]);
    }
    const swapping = st.phase === "swap" && st.plan;
    for (let i = 0; i < N * N; i++) {
      const v = st.b[i]; if (v < 0) continue;
      let gx = i % N, gy = Math.floor(i / N) - (st.phase === "fall" ? st.drop[i] : 0);
      if (swapping && (i === st.plan[0] || i === st.plan[1])) {
        const o = i === st.plan[0] ? st.plan[1] : st.plan[0];
        const u = st.tm / 6;
        gx += ((o % N) - gx) * u; gy += (Math.floor(o / N) - Math.floor(i / N)) * u;
      }
      if (gy < -0.6) continue;
      const flash = st.phase === "match" && st.m && st.m[i] && st.tm % 4 < 2;
      const sx = Math.round(OX + gx * CW), sy = Math.round(OY + gy * CH);
      for (let j = 0; j < 2; j++) {
        const row = SPR[v][j];
        for (let k = 0; k < 3; k++) if (row[k] !== " " && sy + j >= OY) g.set(sx + k, sy + j, row[k], KEYS[flash ? GEMH + v : k === 1 && j === 0 ? GEMH + v : j === 1 && k !== 1 ? GEMD + v : GEM + v]);
      }
    }
    for (const f of st.fx) {
      const x = OX + (f.i % N) * CW + 1, y = OY + Math.floor(f.i / N) * CH;
      const r = f.age * 0.5;
      const ch = f.age < 4 ? "*" : f.age < 8 ? "+" : "·";
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) {
        const sx = Math.round(x + dx * r * 2), sy = Math.round(y + dy * r);
        if (sx < OX - 1 || sx > OX - 2 + N * CW || sy < OY || sy > OY + N * CH - 1) continue;
        g.set(sx, sy, ch, KEYS[(f.age < 5 ? GEMH : GEM) + f.v]);
      }
    }
    if (st.phase === "think" || st.phase === "swap") {
      const x = OX - 1 + (st.cur % N) * CW, y = OY + Math.floor(st.cur / N) * CH;
      const on = Math.floor(t * 5) % 2 === 0 || st.phase === "swap";
      if (on) { g.set(x, y, "┌", KEYS[UI + 5]); g.set(x + 4, y, "┐", KEYS[UI + 5]); g.set(x, y + 1, "└", KEYS[UI + 5]); g.set(x + 4, y + 1, "┘", KEYS[UI + 5]); }
    }
    if (st.pop && st.pop.age < 16) {
      const lbl = "+" + st.pop.pts;
      const x = Math.min(OX + (st.pop.i % N) * CW, OX - 1 + N * CW - lbl.length), y = Math.max(OY, OY + Math.floor(st.pop.i / N) * CH - Math.floor(st.pop.age / 4));
      g.text(x, y, "+" + st.pop.pts, KEYS[UI + 2]);
    }
    const px = OX + N * CW + 4;
    g.box(px - 1, 2, cols - px - 1, 20, "round", KEYS[BOARD + 3]);
    g.text(px + 1, 3, "SCORE", KEYS[UI + 1]);
    g.text(px + 1, 4, String(st.score).padStart(7, "0"), KEYS[UI + 5]);
    g.text(px + 1, 6, "MOVES", KEYS[UI + 1]); g.text(px + 9, 6, String(st.moves).padStart(3, " "), KEYS[UI]);
    g.text(px + 1, 7, "BEST  x" + st.best, KEYS[UI + 1]);
    const showCombo = st.combo > 1 && (st.phase === "match" || st.phase === "fall");
    g.text(px + 1, 9, showCombo ? ("COMBO x" + st.combo).padEnd(10, " ") : "          ", KEYS[UI + 3]);
    g.text(px + 1, 11, "LEVEL GOAL", KEYS[UI + 1]);
    const goal = Math.min(1, (st.score % 3000) / 3000);
    g.text(px + 1, 12, "█".repeat(Math.round(goal * 14)).padEnd(14, "░"), KEYS[UI + 4]);
    g.text(px + 1, 14, "GEMS", KEYS[UI + 1]);
    for (let i = 0; i < 6; i++) { g.text(px + 1 + (i % 3) * 5, 15 + Math.floor(i / 3) * 3, SPR[i][0], KEYS[GEM + i]); g.text(px + 1 + (i % 3) * 5, 16 + Math.floor(i / 3) * 3, SPR[i][1], KEYS[GEMD + i]); }
    return g.frame();
  };
}
