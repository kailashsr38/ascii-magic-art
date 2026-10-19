/* dino-runner: a runner sprinting across the desert, jumping cacti until it trips. */
import { Grid, palette, gradient, KEYS, rng, clamp, fbm } from "../lib/kit.js";

const SKY = gradient(["#5aa8e0", "#9bd0ee", "#f6e0b0", "#ffc98a"], 10);      // 0-9
const MESA = ["#c8865a", "#a8643e", "#7a4428"];                                 // a-c
const SAND = gradient(["#e8b878", "#c89458", "#9a6a3a"], 5);                   // d-h
const MISC = ["#3fae4e", "#24803a", "#3a2a20", "#ffffff", "#fff2a8", "#ff7a3a", "#2a2a5a", "#f0f0f0"]; // i-p

export const meta = {
  slug: "dino-runner",
  name: "Desert Runner",
  category: "arcade",
  note: "A runner sprints across the desert at ever faster speed, jumping cacti until a mistimed leap ends the run.",
  tags: ["runner", "game", "arcade", "desert", "endless", "404"],
  cols: 84, rows: 24, fps: 30,
  palette: palette([...SKY, ...MESA, ...SAND, ...MISC]),
};

const GY = 18, RX = 12;
const RUN = [[" ● ", "/█\\", "/ \\"], [" ● ", "<█/", " |\\"], [" ● ", "/█>", "/| "]];
const JUMP = [" ● ", "\\█/", "/ \\"];
const CACTI = [["▖█▗", "▀█▀", " █ "], [" █ ▖", "▙█▟▘", " █  ", " █  "], ["▖█▗▖█▗", "▀█▀▀█▀", " █  █ "]];

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

function newRun(st) {
  st.wx = 0; st.speed = 0.75; st.y = 0; st.vy = 0; st.dead = 0; st.score = 0;
  st.obs = []; st.next = 60;
  st.slip = st.r();
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sim = makeSim(30, 30 * 120, (round) => {
    const st = { r: rng(61 + round * 409), best: 0, runs: 1 };
    newRun(st); return st;
  }, (st) => {
    if (st.dead) { if (++st.dead > 60) { st.runs++; newRun(st); } return; }
    st.wx += st.speed; st.speed = Math.min(1.7, st.speed + 0.0006);
    st.score = Math.floor(st.wx / 2); st.best = Math.max(st.best, st.score);
    while (st.next < st.wx + cols + 10) {
      const type = st.r() < 0.5 ? 0 : st.r() < 0.6 ? 1 : 2;
      st.obs.push({ x: st.next, type, late: st.r() < 0.09 ? 3 + st.r() * 3 : 0 });
      st.next += 22 + st.r() * 30 + st.speed * 10;
    }
    st.obs = st.obs.filter((o) => o.x > st.wx - 10);
    // jump decision: leap when the next cactus is just the right distance ahead
    const ahead = st.obs.find((o) => o.x + CACTI[o.type][0].length > st.wx + RX);
    if (ahead && st.y === 0) {
      const d = ahead.x - (st.wx + RX + 3);
      if (d < st.speed * 6 - ahead.late && d > -2) st.vy = 1.05;
    }
    if (st.y > 0 || st.vy > 0) { st.y += st.vy; st.vy -= 0.085; if (st.y <= 0) { st.y = 0; st.vy = 0; } }
    // collision
    for (const o of st.obs) {
      const ox = o.x - st.wx, w = CACTI[o.type][0].length, h = CACTI[o.type].length;
      if (ox < RX + 2.5 && ox + w > RX + 0.5 && st.y < h - 0.3) { st.dead = 1; break; }
    }
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    const sx = st.wx;
    // sky
    for (let y = 0; y < GY; y++) for (let x = 0; x < cols; x++) {
      const v = y / GY;
      g.set(x, y, "░", KEYS[Math.min(9, Math.floor(v * 10))]);
    }
    // sun
    for (let y = 1; y < 6; y++) for (let x = 60; x < 72; x++) if (Math.hypot((x - 66) / 2, y - 3.2) < 2.4) g.set(x, y, "█", "m");
    // clouds drift slowly
    for (let c = 0; c < 4; c++) {
      const cx = ((c * 31 - sx * 0.1) % (cols + 20) + cols + 20) % (cols + 20) - 10;
      g.text(Math.round(cx), 2 + c % 3 * 2, "▄▟██▙▄", "l"); g.text(Math.round(cx) + 1, 3 + c % 3 * 2, "▀▀▀▀", "l");
    }
    // distant mesas, parallax
    for (let x = 0; x < cols; x++) {
      const h1 = Math.floor(fbm((x + sx * 0.25) * 0.04, 1, 3) * 9) - 1;
      for (let k = 0; k < h1; k++) g.set(x, GY - 1 - k, k === h1 - 1 ? "▄" : "█", k === h1 - 1 ? "a" : "b");
      const h2 = Math.floor(fbm((x + sx * 0.5) * 0.07, 7, 2) * 5) - 1;
      for (let k = 0; k < h2; k++) g.set(x, GY - 1 - k, k === h2 - 1 ? "▄" : "█", "c");
    }
    // ground
    for (let y = GY; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wx = Math.floor(x + sx);
      const h = ((wx * 374761393 + y * 668265263) >>> 0) % 23;
      if (y === GY) g.set(x, y, "▀", "f");
      else g.set(x, y, h === 0 ? "▪" : h < 3 ? "·" : "█", h === 0 ? "k" : h < 3 ? KEYS[13 + Math.min(4, y - GY + 1)] : KEYS[13 + Math.min(4, y - GY - 1)]);
    }
    // cacti
    for (const o of st.obs) {
      const ox = Math.round(o.x - sx), art = CACTI[o.type];
      art.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") g.set(ox + i, GY - art.length + r, row[i], r === 0 ? "i" : "j"); });
    }
    // runner
    const ry = GY - 3 - Math.round(st.y);
    const spr = st.dead ? [" x ", "\\█/", "/ \\"] : st.y > 0 ? JUMP : RUN[Math.floor(st.wx / 2.2) % 3];
    spr.forEach((row, r) => { for (let i = 0; i < 3; i++) if (row[i] !== " ") g.set(RX + i, ry + r, row[i], r === 0 ? "n" : "o"); });
    if (st.y === 0 && !st.dead && Math.floor(st.wx) % 3 === 0) g.set(RX - 1, GY - 1, "·", "e");
    const hud = " HI " + String(Math.min(99999, st.best)).padStart(5, "0") + "  " + String(Math.min(99999, st.score)).padStart(5, "0") + " ";
    g.text(cols - 27, 0, hud, "p");
    g.text(0, 0, " RUN " + String(st.runs % 100).padStart(2, "0") + " ", "p");
    if (st.dead) {
      g.box(cols / 2 - 9, 7, 18, 3, "double", "k");
      g.text(cols / 2 - 8, 8, "   GAME  OVER   ", "k");
    }
    return g.frame();
  };
}
