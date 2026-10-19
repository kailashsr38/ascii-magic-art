/* block-drop: a falling-block puzzle that places its own pieces and clears lines. */
import { Grid, palette, KEYS, rng } from "../lib/kit.js";

const PIECE_COL = ["#4fd8e8", "#ffd84a", "#c46cf0", "#5ee06a", "#ff5a5a", "#4f7cff", "#ff9a3a"];
const PIECE_DIM = ["#2a8a96", "#a88c26", "#7a3c9a", "#2f8f3a", "#a83030", "#2c4aa8", "#a85e1e"];
const UI = ["#0d1117", "#161b22", "#30363d", "#e6edf3", "#8b949e", "#ffffff"];

export const meta = {
  slug: "block-drop",
  name: "Block Drop",
  category: "arcade",
  note: "A falling-block puzzle that plays itself, sliding each piece into place and clearing full lines.",
  tags: ["blocks", "puzzle", "game", "arcade", "retro", "loader"],
  cols: 40, rows: 24, fps: 20,
  palette: palette([...PIECE_COL, ...PIECE_DIM, ...UI]),
};

const U = (i) => KEYS[14 + i];
const BW = 10, BH = 20;
// shapes as rotation lists of [x,y] cells
const SHAPES = [
  [[0, 1], [1, 1], [2, 1], [3, 1]],           // I
  [[1, 0], [2, 0], [1, 1], [2, 1]],           // O
  [[1, 0], [0, 1], [1, 1], [2, 1]],           // T
  [[1, 0], [2, 0], [0, 1], [1, 1]],           // S
  [[0, 0], [1, 0], [1, 1], [2, 1]],           // Z
  [[0, 0], [0, 1], [1, 1], [2, 1]],           // J
  [[2, 0], [0, 1], [1, 1], [2, 1]],           // L
];
const rot = (cells, n) => {
  let c = cells;
  for (let i = 0; i < n; i++) c = c.map(([x, y]) => [2 - y + (c.length && cells === SHAPES[0] ? 1 : 0), x]);
  const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1]));
  return c.map(([x, y]) => [x - mx, y - my]);
};
const ROTS = SHAPES.map((s, i) => {
  const out = [], seen = new Set();
  for (let n = 0; n < 4; n++) {
    const r = rot(s, n), key = JSON.stringify(r.slice().sort());
    if (!seen.has(key)) { seen.add(key); out.push(r); }
  }
  return out;
});

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

const fits = (b, cells, px, py) => cells.every(([x, y]) => {
  const X = px + x, Y = py + y;
  return X >= 0 && X < BW && Y < BH && (Y < 0 || b[Y * BW + X] === 0);
});

function evaluate(b) {
  const h = new Array(BW).fill(0); let holes = 0, lines = 0;
  for (let y = 0; y < BH; y++) {
    let full = true;
    for (let x = 0; x < BW; x++) if (!b[y * BW + x]) full = false;
    if (full) lines++;
  }
  for (let x = 0; x < BW; x++) {
    let seen = false;
    for (let y = 0; y < BH; y++) {
      if (b[y * BW + x]) { if (!seen) { h[x] = BH - y; seen = true; } }
      else if (seen) holes++;
    }
  }
  let agg = 0, bump = 0;
  for (let x = 0; x < BW; x++) { agg += h[x]; if (x) bump += Math.abs(h[x] - h[x - 1]); }
  return -0.51 * agg + 0.76 * lines - 0.36 * holes * 2 - 0.18 * bump;
}

function plan(st) {
  let best = null;
  const cand = ROTS[st.piece];
  for (let r = 0; r < cand.length; r++) {
    const cells = cand[r];
    const w = Math.max(...cells.map((c) => c[0])) + 1;
    for (let px = 0; px + w <= BW; px++) {
      if (!fits(st.board, cells, px, 0)) continue;
      let py = 0;
      while (fits(st.board, cells, px, py + 1)) py++;
      const b = st.board.slice();
      for (const [x, y] of cells) if (py + y >= 0) b[(py + y) * BW + px + x] = 1;
      const s = evaluate(b) + (st.r() - 0.5) * 0.3;
      if (!best || s > best.s) best = { s, r, px };
    }
  }
  return best;
}

function nextFromBag(st) {
  if (!st.bag.length) { st.bag = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = Math.floor(st.r() * (i + 1)); [st.bag[i], st.bag[j]] = [st.bag[j], st.bag[i]]; } }
  return st.bag.pop();
}

function spawn(st) {
  st.piece = st.next; st.next = nextFromBag(st);
  st.rot = 0; st.px = 3; st.py = -1;
  const target = plan(st);
  if (!target || !fits(st.board, ROTS[st.piece][0], st.px, st.py)) { st.over = 1; return; }
  st.target = target;
}

function newGame(st) {
  st.board = new Uint8Array(BW * BH); st.bag = []; st.score = 0; st.lines = 0; st.over = 0; st.clearing = null;
  st.next = nextFromBag(st); spawn(st);
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(20, 20 * 150, (round) => {
    const st = { r: rng(77 + round * 131), best: 0 };
    newGame(st); return st;
  }, (st) => {
    if (st.over) { if (++st.over > 50) newGame(st); return; }
    if (st.clearing) {
      if (++st.clearing.t > 6) {
        const keep = [];
        for (let y = 0; y < BH; y++) if (!st.clearing.rows.includes(y)) keep.push(st.board.slice(y * BW, y * BW + BW));
        st.board.fill(0);
        const off = BH - keep.length;
        keep.forEach((row, i) => st.board.set(row, (i + off) * BW));
        st.clearing = null; spawn(st);
      }
      return;
    }
    const tg = st.target;
    const cells = ROTS[st.piece][st.rot];
    if (st.rot !== tg.r) { st.rot = tg.r; if (!fits(st.board, ROTS[st.piece][st.rot], st.px, st.py)) st.px = Math.min(st.px, BW - 4); return; }
    if (st.px !== tg.px) {
      const nx = st.px + Math.sign(tg.px - st.px);
      if (fits(st.board, cells, nx, st.py)) { st.px = nx; return; }
    }
    if (fits(st.board, cells, st.px, st.py + 1)) { st.py++; return; }
    // lock
    for (const [x, y] of cells) { if (st.py + y < 0) { st.over = 1; return; } st.board[(st.py + y) * BW + st.px + x] = st.piece + 1; }
    const full = [];
    for (let y = 0; y < BH; y++) { let f = true; for (let x = 0; x < BW; x++) if (!st.board[y * BW + x]) f = false; if (f) full.push(y); }
    if (full.length) {
      st.lines += full.length; st.score += [0, 100, 300, 500, 800][full.length];
      st.best = Math.max(st.best, st.score);
      st.clearing = { rows: full, t: 0 };
    } else spawn(st);
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, " ", U(0));
    const ox = 2, oy = 2;
    g.box(ox - 1, oy - 1, BW * 2 + 2, BH + 2, "heavy", U(2));
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const v = st.board[y * BW + x];
      const flash = st.clearing && st.clearing.rows.includes(y);
      if (flash) g.text(ox + x * 2, oy + y, "██", st.clearing.t % 2 ? U(5) : U(3));
      else if (v) g.text(ox + x * 2, oy + y, "▓█", KEYS[v - 1]);
      else g.text(ox + x * 2, oy + y, " ·", U(1));
    }
    if (!st.over && !st.clearing) {
      const cells = ROTS[st.piece][st.rot];
      // ghost where it will land
      let gy = st.py; while (fits(st.board, cells, st.px, gy + 1)) gy++;
      for (const [x, y] of cells) if (gy + y >= 0) g.text(ox + (st.px + x) * 2, oy + gy + y, "░░", KEYS[7 + st.piece]);
      for (const [x, y] of cells) if (st.py + y >= 0) g.text(ox + (st.px + x) * 2, oy + st.py + y, "▓█", KEYS[st.piece]);
    }
    const px = ox + BW * 2 + 3;
    g.text(px, 1, "NEXT", U(4));
    g.box(px, 2, 12, 5, "round", U(2));
    for (const [x, y] of ROTS[st.next][0]) g.text(px + 2 + x * 2, 3 + y + (st.next === 0 ? 0 : 1) - (st.next === 0 ? 0 : 0), "▓█", KEYS[st.next]);
    g.text(px, 8, "SCORE", U(4)); g.text(px, 9, String(st.score).padStart(6, "0"), U(3));
    g.text(px, 11, "LINES", U(4)); g.text(px, 12, String(st.lines).padStart(3, " "), U(3));
    g.text(px, 14, "BEST", U(4)); g.text(px, 15, String(st.best).padStart(6, "0"), U(3));
    g.text(px, 17, "LEVEL", U(4)); g.text(px, 18, String(1 + Math.floor(st.lines / 10)).padStart(2, " "), U(3));
    if (st.over) {
      g.box(ox + 2, oy + 8, 16, 3, "double", U(5));
      g.text(ox + 3, oy + 9, "  GAME  OVER  ", U(5));
      for (let y = BH - 1; y >= BH - Math.min(BH, st.over); y--) for (let x = 0; x < BW; x++) if (st.board[y * BW + x]) g.text(ox + x * 2, oy + y, "▒▒", U(2));
    }
    return g.frame();
  };
}
