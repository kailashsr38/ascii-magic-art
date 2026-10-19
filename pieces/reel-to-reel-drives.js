/* reel-to-reel-drives: a row of mainframe tape drives, reels jerking forward in read bursts and rewinding with vacuum column loops bobbing. */
import { Grid, palette, rng, TAU } from "../lib/kit.js";

export const meta = {
  slug: "reel-to-reel-drives",
  name: "Mainframe Tape Drives",
  category: "retro",
  note: "Three mainframe tape drives side by side, their reels starting and stopping in read bursts, tape packs shifting from reel to reel and loops bobbing in the vacuum columns.",
  tags: ["retro", "mainframe", "tape", "computer history", "wallpaper", "machines"],
  cols: 118, rows: 34, fps: 24,
  palette: palette(["#c8ccd4", "#9aa0aa", "#6a707a", "#4a4e58", "#30333a", "#1c1e24", "#5a3a22", "#7a5030", "#9a6a40", "#3a2616",
    "#e6edf3", "#7ee787", "#16401c", "#f2cc60", "#4a3c10", "#ff7b72", "#4a1a16", "#a8b4c8", "#2a2e38", "#79c0ff"]),
};

const PERIOD = 20, DT = 0.02, N = PERIOD / DT;
const RMIN = 2.4, RMAX = 7.6, FL = 8.2;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // per unit: precomputed position and reel angles over one period
  const units = [0, 1, 2].map((u) => {
    const R = rng(11 + u * 7);
    const vel = new Float32Array(N);
    // read bursts for 16 s
    let i = 0;
    while (i < 16 / DT) {
      const run = Math.floor((0.3 + R() * 0.9) / DT), stop = Math.floor((0.15 + R() * 0.6) / DT);
      const dir = R() < 0.15 ? -1 : 1;
      for (let k = 0; k < run && i < N; k++) vel[i++] = dir * (0.018 + R() * 0.01);
      for (let k = 0; k < stop && i < N; k++) vel[i++] = 0;
    }
    let p = 0.08;
    for (let k = 0; k < i; k++) p += vel[k] * DT * 2;
    const back = (p - 0.08) / (3 / DT) / (DT * 2);
    const offset = Math.floor(u * 0.7 / DT);
    for (let k = 0; k < 3 / DT && i < N; k++) vel[i++] = -back;
    while (i < N) vel[i++] = 0;
    const pos = new Float32Array(N), aL = new Float32Array(N), aR = new Float32Array(N);
    p = 0.08; let al = 0, ar = 0;
    for (let k = 0; k < N; k++) {
      const j = (k + offset) % N;
      const v = vel[j];
      p += v * DT * 2;
      const rl = Math.sqrt(RMIN * RMIN + (1 - p) * (RMAX * RMAX - RMIN * RMIN));
      const rr = Math.sqrt(RMIN * RMIN + p * (RMAX * RMAX - RMIN * RMIN));
      al += (v * 900 * DT) / rl; ar += (v * 900 * DT) / rr;
      pos[k] = p; aL[k] = al; aR[k] = ar;
    }
    const v2 = new Float32Array(N);
    for (let k = 0; k < N; k++) v2[k] = vel[(k + offset) % N];
    return { pos, aL, aR, vel: v2 };
  });
  const reel = (cx, cy, pack, ang) => {
    for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 9; x <= cx + 9; x++) {
      const dx = x - cx, dy = (y - cy) * 2;
      const r = Math.hypot(dx, dy);
      if (r > FL) continue;
      const a = Math.atan2(dy, dx) - ang;
      let ch, co;
      if (r < 1.2) { ch = "●"; co = "a"; }
      else if (r < RMIN) {
        const notch = (((a * 3) / TAU) % 1 + 1) % 1 < 0.2;
        ch = "█"; co = notch ? "4" : "1";
      } else if (r < pack) {
        const ringy = Math.floor(r * 2) % 3 === 0;
        const mark = Math.abs(Math.sin(a / 2)) < 0.06;
        ch = mark ? "▒" : ringy ? "▓" : "█"; co = mark ? "8" : r > pack - 0.6 ? "8" : ringy ? "6" : "7";
      } else {
        const spoke = ((((a * 3) / TAU) % 1 + 1) % 1) < 0.22;
        ch = r > FL - 0.8 ? "█" : spoke ? "▓" : "░"; co = r > FL - 0.8 ? "2" : spoke ? "h" : "3";
      }
      g.set(x, y, ch, co);
    }
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const k = Math.min(N - 1, Math.floor(lt / DT));
    // floor and wall
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, (x * 5 + y * 3) % 11 === 0 ? "▓" : "█", "5");
    units.forEach((u, ui) => {
      const x0 = 1 + ui * 39, w = 37;
      g.fill(x0, 0, w, H, "█", "4");
      for (let y = 0; y < H; y++) { g.set(x0, y, "▌", "3"); g.set(x0 + w - 1, y, "▐", "3"); }
      // header with lamps
      const moving = u.vel[k] !== 0;
      const rew = u.vel[k] < -0.01;
      g.fill(x0 + 1, 0, w - 2, 3, " ");
      g.text(x0 + 2, 1, "UNIT " + (181 + ui), "0");
      g.text(x0 + 12, 1, "●", moving ? "b" : "c"); g.text(x0 + 14, 1, "SEL", "1");
      g.text(x0 + 19, 1, "●", "d"); g.text(x0 + 21, 1, "RDY", "1");
      g.text(x0 + 26, 1, "●", rew ? "f" : "g"); g.text(x0 + 28, 1, "REW", "1");
      // glass door with reels
      g.fill(x0 + 1, 3, w - 2, 13, " ");
      for (let y = 4; y < 15; y++) for (let x = x0 + 2; x < x0 + w - 2; x++) if ((x + y) % 9 === 0) g.set(x, y, "·", "i");
      const p = u.pos[k];
      const rl = Math.sqrt(RMIN * RMIN + (1 - p) * (RMAX * RMAX - RMIN * RMIN));
      const rr = Math.sqrt(RMIN * RMIN + p * (RMAX * RMAX - RMIN * RMIN));
      const cyR = 9, cL = x0 + 9, cR = x0 + w - 10;
      reel(cL, cyR, rl, u.aL[k]);
      reel(cR, cyR, rr, -u.aR[k]);
      // vacuum columns
      const ph = p * 60 + ui;
      const dL = 0.5 + 0.35 * Math.sin(ph), dR = 0.5 - 0.35 * Math.sin(ph * 1.3 + 1);
      const col = (x, depth) => {
        for (let y = 17; y < 30; y++) { g.set(x, y, "▐", "2"); g.set(x + 4, y, "▌", "2"); for (let i = 1; i < 4; i++) g.set(x + i, y, "░", "i"); }
        const bot = 17 + Math.round(depth * 11);
        for (let y = 17; y < bot; y++) { g.set(x + 1, y, "█", "8"); g.set(x + 3, y, "█", "8"); g.set(x + 2, y, " "); }
        g.text(x + 1, bot, "▀▀▀", "8");
      };
      col(x0 + 7, dL); col(x0 + w - 12, dR);
      // tape from reels down to columns and the head between them
      g.set(cL - 1 + Math.round(rl), 14, "│", "7"); g.set(cL - 1 + Math.round(rl), 15, "│", "7"); g.set(cL - 1 + Math.round(rl), 16, "╲", "7");
      g.set(cR + 1 - Math.round(rr), 14, "│", "7"); g.set(cR + 1 - Math.round(rr), 15, "│", "7"); g.set(cR + 1 - Math.round(rr), 16, "╱", "7");
      g.text(x0 + 13, 18, "▐████▌", "1");
      g.text(x0 + 14, 19, "HEAD", "5");
      g.hline(x0 + 9, x0 + 12, 17, "─", "7"); g.hline(x0 + w - 13, x0 + w - 10, 17, "─", "7");
      g.text(x0 + 13, 17, "──────", "7");
      // controls and footage counter
      g.text(x0 + 13, 22, String(Math.floor(p * 2400)).padStart(4, "0") + " FT", moving ? "d" : "0");
      const btn = [["LOAD", "1"], ["START", moving && !rew ? "b" : "1"], ["REW", rew ? "f" : "1"]];
      btn.forEach(([n, c], i) => { g.text(x0 + 2 + i * 12, 31, "▐" + "█".repeat(n.length) + "▌", c === "1" ? "3" : c); g.text(x0 + 3 + i * 12, 32, n, "1"); });
    });
    return g.frame();
  };
}
