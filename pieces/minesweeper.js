/* minesweeper: a mine field being cleared by a solver that flags what it can prove. */
import { Grid, palette, KEYS, rng } from "../lib/kit.js";

const NUM = ["#4f8cff", "#3fbf5a", "#ff5a5a", "#2a3fae", "#a8402a", "#2ab0b0", "#c9d1d9", "#8b949e"];
const UI = ["#0d1117", "#2d333b", "#444c56", "#768390", "#adbac7", "#e6edf3", "#ff4b4b", "#ffd84a", "#1c2128", "#ff9a3a"];

export const meta = {
  slug: "minesweeper",
  name: "Mine Sweeper",
  category: "arcade",
  note: "A mine field cleared by a solver that opens safe squares, flags the mines it can prove and guesses only when it must.",
  tags: ["mines", "puzzle", "game", "logic", "retro"],
  cols: 53, rows: 22, fps: 15,
  palette: palette([...NUM, ...UI]),
};

const U = (i) => KEYS[8 + i];
const W = 24, H = 16, MINES = 50;
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

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

const nb = (x, y) => N8.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < W && b < H);

function newGame(st) {
  st.mine = new Uint8Array(W * H); st.open = new Uint8Array(W * H); st.flag = new Uint8Array(W * H);
  st.num = new Uint8Array(W * H); st.state = 0; st.end = 0; st.time = 0; st.placed = false;
  st.cur = [Math.floor(W / 2), Math.floor(H / 2)]; st.queue = [];
  st.queue.push(["open", st.cur[0], st.cur[1]]);
}
function place(st, sx, sy) {
  let n = 0;
  while (n < MINES) {
    const x = Math.floor(st.r() * W), y = Math.floor(st.r() * H);
    if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
    if (st.mine[x + y * W]) continue;
    st.mine[x + y * W] = 1; n++;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) st.num[x + y * W] = nb(x, y).filter(([a, b]) => st.mine[a + b * W]).length;
  st.placed = true;
}
function reveal(st, x, y) {
  const stack = [[x, y]];
  while (stack.length) {
    const [a, b] = stack.pop(); const i = a + b * W;
    if (st.open[i] || st.flag[i]) continue;
    st.open[i] = 1;
    if (st.num[i] === 0 && !st.mine[i]) for (const p of nb(a, b)) stack.push(p);
  }
}
// find the next move: proven flags or opens first, else the least risky guess
function think(st) {
  const flags = [], opens = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = x + y * W;
    if (!st.open[i] || !st.num[i]) continue;
    const ns = nb(x, y);
    const hidden = ns.filter(([a, b]) => !st.open[a + b * W] && !st.flag[a + b * W]);
    const fl = ns.filter(([a, b]) => st.flag[a + b * W]).length;
    if (!hidden.length) continue;
    if (fl === st.num[i]) hidden.forEach((p) => opens.push(p));
    else if (fl + hidden.length === st.num[i]) hidden.forEach((p) => flags.push(p));
  }
  const near = (list) => list.sort((p, q) => Math.hypot(p[0] - st.cur[0], p[1] - st.cur[1]) - Math.hypot(q[0] - st.cur[0], q[1] - st.cur[1]))[0];
  if (flags.length) { const p = near(flags); return ["flag", p[0], p[1]]; }
  if (opens.length) { const p = near(opens); return ["open", p[0], p[1]]; }
  // guess: hidden cell with the lowest local risk
  let best = null, br = 9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = x + y * W;
    if (st.open[i] || st.flag[i]) continue;
    let risk = 0.2, any = false;
    for (const [a, b] of nb(x, y)) {
      const j = a + b * W;
      if (!st.open[j] || !st.num[j]) continue;
      const ns = nb(a, b);
      const hid = ns.filter(([c, d]) => !st.open[c + d * W] && !st.flag[c + d * W]).length;
      const fl = ns.filter(([c, d]) => st.flag[c + d * W]).length;
      risk = Math.max(risk, (st.num[j] - fl) / Math.max(1, hid)); any = true;
    }
    if (!any) risk = 0.25;
    risk += st.r() * 0.02;
    if (risk < br) { br = risk; best = [x, y]; }
  }
  return best ? ["open", best[0], best[1]] : null;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(9, 9 * 200, (round) => {
    const st = { r: rng(900 + round * 53), wins: 0, games: 0 };
    newGame(st); return st;
  }, (st) => {
    if (st.state) { if (++st.end > 40) { st.games++; newGame(st); } return; }
    st.time++;
    if (!st.target) st.target = think(st);
    if (!st.target) return;
    const [act, tx, ty] = st.target;
    // the cursor glides to the square before acting
    if (st.cur[0] !== tx || st.cur[1] !== ty) {
      const dx = Math.sign(tx - st.cur[0]), dy = Math.sign(ty - st.cur[1]);
      st.cur = [st.cur[0] + dx * Math.min(Math.abs(tx - st.cur[0]), 2), st.cur[1] + dy * Math.min(Math.abs(ty - st.cur[1]), 1)];
      return;
    }
    const i = tx + ty * W;
    if (act === "flag") st.flag[i] = 1;
    else {
      if (!st.placed) place(st, tx, ty);
      if (st.mine[i]) { st.state = 2; st.boom = i; }
      else reveal(st, tx, ty);
    }
    st.target = null;
    let left = 0;
    for (let j = 0; j < W * H; j++) if (!st.open[j] && !st.mine[j]) left++;
    if (!left && !st.state) { st.state = 1; st.wins++; }
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, " ", U(0));
    const ox = 3, oy = 4;
    g.box(1, 0, W * 2 + 3, 3, "round", U(2));
    const flags = st.flag.reduce((a, b) => a + b, 0);
    g.text(3, 1, "MINES " + String(MINES - flags).padStart(3, "0"), U(6));
    const face = st.state === 2 ? "(x_x)" : st.state === 1 ? "(B-)" : st.target && st.target[0] === "flag" ? "(o_o)" : "(^_^)";
    g.text(Math.floor(cols / 2) - 2, 1, face, U(7));
    g.text(cols - 14, 1, "TIME " + String(Math.floor(st.time / 9)).padStart(3, "0"), U(6));
    g.box(ox - 2, oy - 1, W * 2 + 3, H + 2, "heavy", U(2));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = x + y * W, px = ox + x * 2, py = oy + y;
      const showMine = st.state === 2 && st.mine[i];
      if (st.open[i]) {
        if (st.num[i]) g.set(px, py, String(st.num[i]), KEYS[st.num[i] - 1]);
        else g.set(px, py, "·", U(1));
      } else if (st.flag[i]) {
        g.set(px, py, "▶", st.state === 2 && !st.mine[i] ? U(3) : U(6));
      } else if (showMine) {
        g.set(px, py, "●", i === st.boom ? U(9) : U(5));
      } else {
        g.set(px, py, "■", (x + y) % 2 ? U(3) : U(4));
      }
    }
    if (!st.state) {
      const [cx, cy] = st.cur;
      g.set(ox + cx * 2 - 1, oy + cy, "[", U(7)); g.set(ox + cx * 2 + 1, oy + cy, "]", U(7));
    }
    if (st.state === 2) {
      const b = st.boom, bx = ox + (b % W) * 2, by = oy + Math.floor(b / W);
      const r = Math.min(3, Math.floor(st.end / 3));
      const bset = (x, y) => { if (x >= ox && x <= ox + (W - 1) * 2 && y >= oy && y < oy + H) g.set(x, y, "*", U(9)); };
      for (let k = 1; k <= r; k++) { bset(bx - k * 2, by); bset(bx + k * 2, by); bset(bx, by - k); bset(bx, by + k); }
      g.set(bx, by, "█", U(9));
    }
    g.text(3, rows - 1, "CLEARED " + String(st.wins).padStart(2, "0") + "   GAMES " + String(st.games + 1).padStart(2, "0"), U(3));
    return g.frame();
  };
}
