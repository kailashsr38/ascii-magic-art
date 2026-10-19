/* paddle-tennis: two computer paddles rallying a ball, keeping score and starting over at eleven. */
import { Grid, palette, KEYS, rng, bigText, clamp } from "../lib/kit.js";

const UI = ["#0a0c10", "#1b2230", "#3a4558", "#e6edf3", "#79c0ff", "#ffa657", "#ffffff", "#8b949e", "#2b3446"];

export const meta = {
  slug: "paddle-tennis",
  name: "Paddle Tennis",
  category: "arcade",
  note: "Two computer paddles rally a ball across a court, keeping score and starting a new match at eleven.",
  tags: ["game", "arcade", "retro", "tennis", "loader"],
  cols: 72, rows: 24, fps: 30,
  palette: palette(UI),
};

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

const W = 72, H = 24, TOP = 1, BOT = 22, PH = 4, LX = 3, RX = 68;

function serve(st, dir) {
  st.bx = W / 2; st.by = (TOP + BOT) / 2 + (st.r() - 0.5) * 8;
  const sp = 0.9;
  st.vx = sp * dir; st.vy = (st.r() - 0.5) * 0.7;
  st.wait = 25; st.trail = [];
  st.err = [(st.r() - 0.5) * 2, (st.r() - 0.5) * 2];
  st.lazy = [st.r() < 0.18, st.r() < 0.18];
}

// where the ball will be when it reaches column x, folding bounces off the walls
function predict(st, x) {
  if ((x - st.bx) * st.vx <= 0) return (TOP + BOT) / 2;
  const tt = (x - st.bx) / st.vx;
  let y = st.by + st.vy * tt - (TOP + 0.5);
  const span = BOT - TOP - 1.5;
  y = ((y % (2 * span)) + 2 * span) % (2 * span);
  if (y > span) y = 2 * span - y;
  return y + TOP + 0.5;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(30, 30 * 150, (round) => {
    const st = { r: rng(31 + round * 97), s: [0, 0], py: [11, 11], over: 0 };
    serve(st, st.r() < 0.5 ? 1 : -1);
    return st;
  }, (st) => {
    if (st.over) { if (++st.over > 90) { st.s = [0, 0]; st.over = 0; serve(st, 1); } return; }
    // paddles: move toward the predicted meeting point with a capped speed
    for (let i = 0; i < 2; i++) {
      const px = i ? RX : LX;
      const coming = i ? st.vx > 0 : st.vx < 0;
      let target = coming ? predict(st, px) + st.err[i] * (st.lazy[i] ? 3.2 : 1) : (TOP + BOT) / 2;
      const c = st.py[i] + PH / 2;
      const sp = st.lazy[i] ? 0.32 : 0.5;
      st.py[i] += clamp(target - c, -sp, sp);
      st.py[i] = clamp(st.py[i], TOP, BOT - PH);
    }
    if (st.wait > 0) { st.wait--; return; }
    st.trail.unshift([st.bx, st.by]); if (st.trail.length > 4) st.trail.pop();
    st.bx += st.vx; st.by += st.vy;
    if (st.by < TOP + 0.5) { st.by = 2 * (TOP + 0.5) - st.by; st.vy = -st.vy; }
    if (st.by > BOT - 0.5) { st.by = 2 * (BOT - 0.5) - st.by; st.vy = -st.vy; }
    for (let i = 0; i < 2; i++) {
      const px = i ? RX : LX;
      const crossing = i ? (st.bx >= px - 0.5 && st.vx > 0 && st.bx - st.vx < px - 0.5) : (st.bx <= px + 1.5 && st.vx < 0 && st.bx - st.vx > px + 1.5);
      if (crossing && st.by >= st.py[i] - 0.5 && st.by <= st.py[i] + PH + 0.5) {
        const off = (st.by - (st.py[i] + PH / 2)) / (PH / 2);
        st.vx = -st.vx * 1.04; st.vx = clamp(st.vx, -1.6, 1.6);
        st.vy = off * 0.75 + (st.r() - 0.5) * 0.15;
        st.bx = i ? px - 0.5 : px + 1.5;
        st.err[i ? 0 : 1] = (st.r() - 0.5) * 2;
        st.lazy[i ? 0 : 1] = st.r() < 0.2;
      }
    }
    if (st.bx < 0 || st.bx > W) {
      const winner = st.bx < 0 ? 1 : 0;
      st.s[winner]++;
      if (st.s[winner] >= 11) st.over = 1;
      serve(st, winner ? -1 : 1);
    }
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y) % 2 ? " " : "·", "1");
    g.hline(0, cols - 1, 0, "▀", "2"); g.hline(0, cols - 1, rows - 1, "▄", "2");
    for (let y = 1; y < rows - 1; y++) if (y % 2) g.set(cols / 2, y, "┃", "8");
    bigText(g, cols / 2 - 10, 2, String(st.s[0]).padStart(2, " "), "4");
    bigText(g, cols / 2 + 3, 2, String(st.s[1]).padEnd(2, " "), "5");
    for (let i = 0; i < 2; i++) {
      const px = i ? RX : LX;
      const y0 = Math.round(st.py[i]);
      for (let k = 0; k < PH; k++) g.text(px, y0 + k, "██", i ? "5" : "4");
    }
    st.trail.forEach(([x, y], i) => g.set(x, y, i < 2 ? "▪" : "·", "7"));
    if (st.wait <= 0 || Math.floor(t * 6) % 2) g.set(st.bx, st.by, "█", "6");
    if (st.over) {
      const msg = st.s[0] > st.s[1] ? " BLUE WINS " : " ORANGE WINS ";
      g.box(cols / 2 - 9, 15, 19, 3, "double", "3");
      g.text(cols / 2 - 8, 16, msg.padStart(Math.floor((17 + msg.length) / 2)).padEnd(17), "3");
    }
    return g.frame();
  };
}
