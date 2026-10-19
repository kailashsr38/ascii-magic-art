/* snake-autoplay: a snake that steers itself to the food, growing until it traps itself. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const BODY = gradient(["#b6ff6a", "#46d160", "#1f8a52", "#11593f"], 12);   // 0-b
const UI = ["#0f2018", "#163024", "#2f4a3c", "#ff5a4f", "#ffd1cc", "#e6edf3", "#8b949e", "#ffd166"];

export const meta = {
  slug: "snake-autoplay",
  name: "Snake",
  category: "arcade",
  note: "A self-playing snake that hunts the food on its own and starts over when it traps itself.",
  tags: ["snake", "game", "arcade", "retro", "loader", "terminal"],
  cols: 56, rows: 20, fps: 15,
  palette: palette([...BODY, ...UI]),
};

const U = (i) => KEYS[12 + i];
const W = 26, Hh = 17;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// simulation that is a pure function of time: each round restarts from its own seed
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

function newGame(st) {
  const cx = 8, cy = 10;
  st.body = [[cx, cy], [cx - 1, cy], [cx - 2, cy]];
  st.dir = 0; st.score = 0; st.dead = 0;
  placeFood(st);
}
function placeFood(st) {
  const occ = new Set(st.body.map(([x, y]) => x + y * W));
  for (let tries = 0; tries < 2000; tries++) {
    const x = Math.floor(st.r() * W), y = Math.floor(st.r() * Hh);
    if (!occ.has(x + y * W)) { st.food = [x, y]; return; }
  }
  st.food = [0, 0];
}
function flood(st, sx, sy, occ) {
  const seen = new Uint8Array(W * Hh); const q = [sx + sy * W]; seen[sx + sy * W] = 1; let n = 0;
  while (q.length) {
    const c = q.pop(); n++;
    const x = c % W, y = (c / W) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue;
      const i = nx + ny * W;
      if (seen[i] || occ[i]) continue;
      seen[i] = 1; q.push(i);
    }
  }
  return n;
}
function choose(st) {
  const occ = new Uint8Array(W * Hh);
  st.body.forEach(([x, y], i) => { if (i < st.body.length - 1) occ[x + y * W] = 1; });
  const [hx, hy] = st.body[0];
  // breadth first search to the food
  const prev = new Int32Array(W * Hh).fill(-1);
  const start = hx + hy * W; prev[start] = start;
  const q = [start]; let found = -1;
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi]; const x = c % W, y = (c / W) | 0;
    if (x === st.food[0] && y === st.food[1]) { found = c; break; }
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue;
      const i = nx + ny * W;
      if (prev[i] >= 0 || occ[i]) continue;
      prev[i] = c; q.push(i);
    }
  }
  const options = [];
  for (let d = 0; d < 4; d++) {
    const nx = hx + DIRS[d][0], ny = hy + DIRS[d][1];
    if (nx < 0 || ny < 0 || nx >= W || ny >= Hh || occ[nx + ny * W]) continue;
    options.push([d, flood(st, nx, ny, occ)]);
  }
  if (!options.length) return st.dir;
  if (found >= 0) {
    let c = found;
    while (prev[c] !== start) c = prev[c];
    const nx = c % W, ny = (c / W) | 0;
    const d = DIRS.findIndex(([dx, dy]) => hx + dx === nx && hy + dy === ny);
    const opt = options.find((o) => o[0] === d);
    // only take the short path if it leaves room to live
    if (opt && opt[1] >= st.body.length * 0.6) return d;
  }
  options.sort((a, b) => b[1] - a[1] || (a[0] === st.dir ? -1 : 1));
  return options[0][0];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(14, 14 * 120, (round) => {
    const st = { r: rng(1000 + round * 7919), best: 0, games: 1 };
    newGame(st);
    return st;
  }, (st) => {
    if (st.dead) { if (++st.dead > 22) { st.games++; newGame(st); } return; }
    st.dir = choose(st);
    const [hx, hy] = st.body[0];
    const nx = hx + DIRS[st.dir][0], ny = hy + DIRS[st.dir][1];
    const hit = nx < 0 || ny < 0 || nx >= W || ny >= Hh || st.body.some(([x, y], i) => i < st.body.length - 1 && x === nx && y === ny);
    if (hit) { st.dead = 1; return; }
    st.body.unshift([nx, ny]);
    if (nx === st.food[0] && ny === st.food[1]) {
      st.score += 10; st.best = Math.max(st.best, st.score);
      if (st.body.length >= W * Hh - 1) { st.dead = 1; return; }
      placeFood(st);
    } else st.body.pop();
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    g.text(1, 0, "SCORE " + String(st.score).padStart(4, "0"), U(5));
    g.text(18, 0, "BEST " + String(st.best).padStart(4, "0"), U(6));
    g.text(cols - 12, 0, "GAME " + String(st.games).padStart(3, "0"), U(6));
    g.box(1, 1, W * 2 + 2, Hh + 2, "round", U(2));
    const ox = 2, oy = 2;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const alt = (x + y) % 2;
      g.text(ox + x * 2, oy + y, "░░", alt ? U(1) : U(0));
    }
    // food pulses
    const [fx, fy] = st.food;
    const pulse = Math.floor(t * 4) % 2;
    g.text(ox + fx * 2, oy + fy, pulse ? "██" : "▓▓", U(3));
    const n = st.body.length;
    const flash = st.dead && Math.floor(st.dead / 3) % 2 === 0;
    st.body.forEach(([x, y], i) => {
      const k = i === 0 ? 0 : 1 + Math.min(10, Math.floor((i / Math.max(1, n - 1)) * 10));
      const co = flash ? U(3) : KEYS[k];
      g.text(ox + x * 2, oy + y, i === 0 ? "██" : "▓▓", co);
    });
    if (st.dead) {
      const msg = " GAME OVER ";
      g.box(cols / 2 - 8, rows / 2 - 2, 16, 3, "double", U(7));
      g.text(cols / 2 - 7, rows / 2 - 1, " " + msg + "  ", U(7));
    }
    return g.frame();
  };
}
