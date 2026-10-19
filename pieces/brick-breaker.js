/* brick-breaker: a paddle that aims its own shots, clearing a rainbow wall brick by brick. */
import { Grid, palette, KEYS, rng, clamp } from "../lib/kit.js";

const ROWC = ["#ff5a5a", "#ff9a3a", "#ffd84a", "#5ee06a", "#4fd8e8", "#7a8cff"];
const ROWD = ["#a83030", "#a85e1e", "#a88c26", "#2f8f3a", "#2a8a96", "#4a52a8"];
const UI = ["#0b0d14", "#161a26", "#3a4152", "#e6edf3", "#8b949e", "#ffffff", "#c9d1d9"];

export const meta = {
  slug: "brick-breaker",
  name: "Brick Breaker",
  category: "arcade",
  note: "A paddle that aims its own shots, chipping away at a rainbow wall of bricks until it is gone.",
  tags: ["bricks", "game", "arcade", "retro", "loader"],
  cols: 62, rows: 26, fps: 30,
  palette: palette([...ROWC, ...ROWD, ...UI]),
};

const U = (i) => KEYS[12 + i];
const W = 62, H = 26, L = 1, R = 61, TOP = 2, PY = 24, BRW = 5, NBX = 12, NBY = 6, BY0 = 4;

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

function newWall(st) { st.bricks = new Uint8Array(NBX * NBY).fill(1); st.left = NBX * NBY; }
function newBall(st) { st.bx = st.px + st.pw / 2; st.by = PY - 1; st.vx = (st.r() < 0.5 ? -1 : 1) * 0.45; st.vy = -0.5; st.wait = 30; }
function newGame(st) { st.score = 0; st.lives = 3; st.px = 26; st.pw = 9; st.over = 0; newWall(st); newBall(st); }

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(30, 30 * 180, (round) => {
    const st = { r: rng(5 + round * 313), best: 0 };
    newGame(st); st.aim = 0; return st;
  }, (st) => {
    if (st.over) { if (++st.over > 70) newGame(st); return; }
    // paddle AI: get under the ball, offset so the bounce heads at remaining bricks
    let target = st.bx;
    if (st.vy > 0) {
      const tt = (PY - 1 - st.by) / st.vy;
      let x = st.bx + st.vx * tt - L - 0.5; const span = R - L - 1.5;
      x = ((x % (2 * span)) + 2 * span) % (2 * span); if (x > span) x = 2 * span - x;
      target = x + L + 0.5;
    }
    const want = target - st.pw / 2 - st.aim;
    const sp = 0.9;
    st.px = clamp(st.px + clamp(want - st.px, -sp, sp), L, R - st.pw);
    if (st.wait > 0) { st.wait--; st.bx = st.px + st.pw / 2; return; }
    for (let sub = 0; sub < 2; sub++) {
      st.bx += st.vx / 2; st.by += st.vy / 2;
      if (st.bx < L + 0.5) { st.bx = L + 0.5; st.vx = Math.abs(st.vx); }
      if (st.bx > R - 0.5) { st.bx = R - 0.5; st.vx = -Math.abs(st.vx); }
      if (st.by < TOP + 0.5) { st.by = TOP + 0.5; st.vy = Math.abs(st.vy); }
      const cx = Math.floor((st.bx - 1) / BRW), cy = Math.floor(st.by) - BY0;
      if (cy >= 0 && cy < NBY && cx >= 0 && cx < NBX && st.bricks[cy * NBX + cx]) {
        st.bricks[cy * NBX + cx] = 0; st.left--; st.score += (NBY - cy) * 10;
        st.best = Math.max(st.best, st.score);
        st.vy = -st.vy;
        if (!st.left) { newWall(st); newBall(st); return; }
      }
      if (st.vy > 0 && st.by >= PY - 0.5 && st.by < PY + 0.5 && st.bx >= st.px - 0.5 && st.bx <= st.px + st.pw + 0.5) {
        const off = (st.bx - (st.px + st.pw / 2)) / (st.pw / 2);
        st.vx = clamp(off * 0.7, -0.75, 0.75); if (Math.abs(st.vx) < 0.12) st.vx = st.vx < 0 ? -0.12 : 0.12;
        st.vy = -Math.sqrt(Math.max(0.2, 0.62 - st.vx * st.vx)) ;
        st.by = PY - 0.6;
        st.aim = (st.r() - 0.5) * st.pw * (st.r() < 0.1 ? 2.6 : 0.9);
      }
      if (st.by > H) { st.lives--; if (st.lives <= 0) { st.over = 1; return; } newBall(st); return; }
    }
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x * 3 + y * 5) % 11 === 0 ? "·" : " ", U(1));
    g.text(1, 0, "SCORE " + String(st.score).padStart(5, "0"), U(3));
    g.text(20, 0, "BEST " + String(st.best).padStart(5, "0"), U(4));
    g.text(cols - 10, 0, "BALLS " + "●".repeat(Math.max(0, st.lives)).padEnd(3, " "), U(3));
    g.hline(0, cols - 1, 1, "▄", U(2));
    g.vline(0, 2, rows - 1, "▐", U(2)); g.vline(cols - 1, 2, rows - 1, "▌", U(2));
    for (let y = 0; y < NBY; y++) for (let x = 0; x < NBX; x++) {
      if (!st.bricks[y * NBX + x]) continue;
      g.text(1 + x * BRW, BY0 + y, "████", KEYS[y]);
      g.set(1 + x * BRW + 4, BY0 + y, "▌", KEYS[6 + y]);
    }
    g.text(Math.round(st.px), PY, "▀".repeat(st.pw), U(5));
    g.set(st.bx, st.by, "●", U(5));
    if (st.over) {
      g.box(cols / 2 - 8, 14, 16, 3, "double", U(3));
      g.text(cols / 2 - 7, 15, "  GAME  OVER  ", U(3));
    }
    return g.frame();
  };
}
