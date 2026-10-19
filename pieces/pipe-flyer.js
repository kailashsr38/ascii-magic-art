/* pipe-flyer: a little bird flapping through gaps in endless pipes. */
import { Grid, palette, gradient, KEYS, rng, clamp, bigText } from "../lib/kit.js";

const SKY = gradient(["#4ab8d8", "#7fd0e6", "#b8e8f0"], 8);                   // 0-7
const PIPE = ["#a8f070", "#6cc83a", "#3f9a22", "#24661a", "#7fe04a"];        // 8-c
const MISC = ["#ffd23a", "#ff7a2a", "#ffffff", "#e8f8fa", "#c8eef4", "#8fd0a0", "#5ab070", "#dec890", "#c8a860", "#8a6a3a", "#2a2a2a", "#9ad8e6"]; // d-o

export const meta = {
  slug: "pipe-flyer",
  name: "Pipe Flyer",
  category: "arcade",
  note: "A little bird flaps its way through gaps in an endless row of pipes, starting over when it clips one.",
  tags: ["bird", "game", "arcade", "endless", "retro"],
  cols: 72, rows: 28, fps: 30,
  palette: palette([...SKY, ...PIPE, ...MISC]),
};

const GROUND = 24, BX = 16, PW = 6, GAP = 8, SPACING = 26;
const BIRD = [["▝▄▄ ", " ██▶"], [" ▄▄ ", "▗██▶"]];

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

function newFlight(st) {
  st.wx = 0; st.y = 11; st.vy = 0; st.dead = 0; st.score = 0; st.flap = 0;
  st.pipes = [];
  for (let i = 0; i < 5; i++) addPipe(st, 50 + i * SPACING);
}
function addPipe(st, x) {
  const prev = st.pipes.length ? st.pipes[st.pipes.length - 1].gy : 10;
  const gy = clamp(Math.round(prev + (st.r() - 0.5) * 12), 3, GROUND - GAP - 3);
  st.pipes.push({ x, gy, miss: st.pipes.length + (st.score || 0) > 6 && st.r() < 0.07 ? (st.r() < 0.5 ? -4 : 4) : 0, passed: false });
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(30, 30 * 120, (round) => {
    const st = { r: rng(3 + round * 211), best: 0 };
    newFlight(st); return st;
  }, (st) => {
    if (st.dead) {
      if (st.y < GROUND - 2) { st.vy = Math.min(1, st.vy + 0.06); st.y = Math.min(GROUND - 2, st.y + st.vy); }
      if (++st.dead > 70) newFlight(st);
      return;
    }
    st.wx += 0.5;
    const next = st.pipes.find((p) => p.x + PW > st.wx + BX - 1);
    const target = next.gy + GAP * 0.6 + next.miss;
    if (st.y > target && st.vy > -0.05) { st.vy = -0.62; st.flap = 6; }
    st.vy = Math.min(0.9, st.vy + 0.055);
    st.y += st.vy;
    if (st.flap > 0) st.flap--;
    for (const p of st.pipes) if (!p.passed && p.x + PW < st.wx + BX) { p.passed = true; st.score++; st.best = Math.max(st.best, st.score); }
    if (st.pipes[0].x < st.wx - 10) { st.pipes.shift(); addPipe(st, st.pipes[st.pipes.length - 1].x + SPACING); }
    // collision with pipes, ceiling or ground
    const top = st.y, bot = st.y + 1.6;
    if (bot >= GROUND || top < 0) st.dead = 1;
    for (const p of st.pipes) {
      const px = p.x - st.wx;
      if (BX + 3.5 > px && BX < px + PW && (top < p.gy || bot > p.gy + GAP)) st.dead = 1;
    }
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    const sx = st.wx;
    for (let y = 0; y < GROUND; y++) for (let x = 0; x < cols; x++) g.set(x, y, "░", KEYS[Math.min(7, Math.floor((y / GROUND) * 8))]);
    // clouds and a city line in the back, slow parallax
    for (let c = 0; c < 5; c++) {
      const cx = ((c * 23 - sx * 0.2) % (cols + 16) + cols + 16) % (cols + 16) - 8;
      const cy = 3 + (c * 5) % 7;
      g.text(Math.round(cx), cy, " ▄██▄▄ ", "g"); g.text(Math.round(cx), cy + 1, "▀▀▀▀▀▀▀", "h");
    }
    for (let x = 0; x < cols; x++) {
      const wx = Math.floor(x + sx * 0.35);
      const h = 2 + (((Math.floor(wx / 5) * 2654435761) >>> 0) % 5);
      for (let k = 0; k < h; k++) g.set(x, GROUND - 1 - k, (k % 2 && wx % 5 === 2) ? "▪" : "█", (k % 2 && wx % 5 === 2) ? "f" : "o");
      const b = 1 + Math.round(1 + Math.sin((x + sx * 0.6) * 0.5) * 0.9);
      for (let k = 0; k < b; k++) g.set(x, GROUND - 1 - k, k === b - 1 ? "▄" : "█", k === b - 1 ? "i" : "j");
    }
    // pipes with shaded columns and caps
    for (const p of st.pipes) {
      const px = Math.round(p.x - sx);
      for (let y = 0; y < GROUND; y++) {
        if (y >= p.gy && y < p.gy + GAP) continue;
        const cap = y === p.gy - 1 || y === p.gy + GAP;
        const x0 = cap ? px - 1 : px, w = cap ? PW + 2 : PW;
        for (let i = 0; i < w; i++) {
          const f = i / (w - 1);
          g.set(x0 + i, y, "█", KEYS[8 + (f < 0.2 ? 0 : f < 0.5 ? 1 : f < 0.8 ? 2 : 3)]);
        }
        if (cap) { g.set(x0, y, "█", "8"); g.set(x0 + w - 1, y, "█", "b"); }
      }
    }
    // ground with moving stripes
    for (let y = GROUND; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y === GROUND) { g.set(x, y, "▀", "c"); continue; }
      const s = (x + Math.floor(sx) + y) % 6 < 3;
      g.set(x, y, y === GROUND + 1 ? (s ? "╱" : "▓") : "▓", y === GROUND + 1 ? (s ? "k" : "l") : y === GROUND + 2 ? "l" : "m");
    }
    // the bird, tilting by its fall
    const by = Math.round(st.y);
    const fr = st.dead ? 1 : st.flap > 2 ? 0 : 1;
    BIRD[fr].forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") g.set(BX + i, by + r, row[i], row[i] === "▶" ? "e" : row[i] === "▝" || row[i] === "▗" ? "f" : "d"); });
    if (!st.dead) g.set(BX + 2, by, "▄", "d");
    const s = String(st.score);
    bigText(g, Math.floor(cols / 2 - s.length * 2) + 1, 2, s, "n");
    bigText(g, Math.floor(cols / 2 - s.length * 2), 1, s, "f");
    g.text(cols - 11, 0, " BEST " + String(Math.min(999, st.best)).padStart(3, "0") + " ", "f");
    if (st.dead > 20) { g.box(cols / 2 - 9, 10, 18, 3, "double", "f"); g.text(cols / 2 - 8, 11, "   GAME  OVER   ", "f"); }
    return g.frame();
  };
}
