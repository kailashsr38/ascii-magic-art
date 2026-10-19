/* festival-speaker-stack: a towering festival sound system at night, sub cones pumping, a line array hanging and lasers raking the crowd. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#04030a", "#0a0818", "#14102a", "#20183c", "#2e1e4a"], 5));
const CAB = add(["#08080a", "#141418", "#222228", "#34343c", "#5a5a66"]);
const CONE = add(gradient(["#0c0c10", "#1e1e28", "#34343f", "#50505f", "#7a7a92", "#c0c0d8"], 6));
const LAS = add(["#3aff6a", "#1a8a3a", "#3ad8ff", "#1a6a8a", "#ff3ad8", "#8a1a6a"]);
const MET = add(["#5a5e68", "#a8b0bc"]);
const CROWD = add(["#000000", "#0c0814"]);
const CONF = add(["#ff4a6a", "#ffd23a", "#3ad8ff", "#7aff6a", "#ff9a3a", "#c85aff"]);
const UI = add(["#ff3a3a", "#3aff6a", "#e6edf3", "#ffb03a"]);

export const meta = {
  slug: "festival-speaker-stack",
  name: "Festival Speaker Stack",
  category: "music",
  note: "A towering festival sound system at night, its big sub cones pumping on every kick beside a hanging line array while lasers rake over the crowd and confetti falls.",
  tags: ["festival", "speakers", "bass", "rave", "sound system", "hero"],
  cols: 92, rows: 36, fps: 30,
  palette: palette(P),
};

const BPM = 128;
// cabinets: [x, y, w, h, kind] kind 0 sub, 1 mid, 2 horn
const CABS = [
  [3, 26, 21, 9, 0], [25, 26, 21, 9, 0],
  [3, 17, 21, 9, 0], [25, 17, 21, 9, 0],
  [3, 10, 21, 7, 1], [25, 10, 21, 7, 1],
  [6, 4, 17, 6, 2], [27, 4, 17, 6, 2],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(17);
  const conf = Array.from({ length: 50 }, () => [R() * cols, R(), 0.6 + R() * 0.8, Math.floor(R() * 6), R() * TAU]);
  const crowd = [];
  for (let x = 46; x < cols + 3; x += 4 + Math.floor(R() * 3)) crowd.push([x, R(), R() < 0.5]);
  const cone = (cx, cy, rx, ry, push) => {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d > 1) continue;
      if (d > 0.86) { g.set(x, y, "█", KEYS[CAB + 3]); continue; }
      if (d > 0.76) { g.set(x, y, "█", KEYS[CONE + (push > 0.5 ? 2 : 1)]); continue; }
      const dd = d / (0.95 + push * 0.12);
      if (dd < 0.22) { g.set(x, y, "█", KEYS[CONE + 4 + (push > 0.5 ? 1 : 0)]); continue; }
      const lit = clamp(0.3 + (1 - dd) * 0.3 * (0.5 + push) - (y - cy) / ry * 0.15 + (Math.sin(dd * 26) > 0.5 ? 0.12 : 0));
      g.set(x, y, lit > 0.5 ? "▓" : "█", KEYS[CONE + Math.min(5, Math.floor(lit * 6))]);
    }
  };
  return (t) => {
    const beat = (t * BPM) / 60, ph = beat % 1, bar = Math.floor(beat / 4);
    const kick = Math.exp(-ph * 6);
    // night sky with fog
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.25 + (fbm(x * 0.05 + t * 0.12, y * 0.12, 3, 3) - 0.5) * 0.6 + (y / rows) * 0.25);
      g.set(x, y, v > 0.45 ? "▒" : "░", KEYS[SKY + Math.min(4, Math.floor(v * 5))]);
    }
    // lasers fanning from behind the crowd
    const lc = (bar % 3) * 2;
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + Math.sin(t * 0.8 + k * 0.6) * 0.9 + (k - 2.5) * 0.12;
      const ox = 72, oy = 24;
      for (let r = 2; r < 70; r += 0.5) {
        const x = ox + Math.cos(a) * r * 2, y = oy + Math.sin(a) * r;
        if (!g.inside(x, y)) break;
        g.set(x, y, r < 20 ? "█" : "▓", KEYS[LAS + lc + (r > 30 ? 1 : 0)]);
      }
    }
    // line array hanging from a truss
    for (let x = 48; x < cols; x++) { g.set(x, 0, "═", KEYS[MET]); g.set(x, 1, x % 2 ? "╱" : "╲", KEYS[MET]); }
    g.vline(66, 2, 3, "║", KEYS[MET + 1]);
    for (let i = 0; i < 7; i++) {
      const y = 4 + i * 2, off = Math.round((i * i) * 0.12);
      const x0 = 57 + off;
      for (let x = x0; x < x0 + 18; x++) { g.set(x, y, "█", KEYS[CAB + 1]); g.set(x, y + 1, (x - x0) % 3 === 1 ? "▪" : "▀", KEYS[(x - x0) % 3 === 1 ? CAB + 4 : CAB + 2]); }
      g.set(x0, y, "▐", KEYS[CAB + 3]); g.set(x0 + 17, y, "▌", KEYS[CAB + 3]);
    }
    // the stack
    for (const [x0, y0, w, h, kind] of CABS) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const edge = y === y0 || x === x0 || x === x0 + w - 1;
        g.set(x, y, edge ? "█" : "▓", KEYS[CAB + (edge ? 2 : 0)]);
      }
      g.text(x0, y0 + h - 1, "▀".repeat(w), KEYS[CAB + 3]);
      if (kind === 0) cone(x0 + w / 2 - 0.5, y0 + h / 2 - 0.5, 8.6, 3.9, kick);
      else if (kind === 1) { cone(x0 + 5.5, y0 + 3, 4.2, 2.2, kick * 0.6); cone(x0 + w - 6.5, y0 + 3, 4.2, 2.2, kick * 0.6); }
      else {
        for (let y = y0 + 1; y < y0 + h - 1; y++) {
          const k = (y - y0 - 1) / (h - 3);
          const hw = 2 + k * 5;
          for (let x = Math.round(x0 + w / 2 - hw); x <= Math.round(x0 + w / 2 + hw); x++) g.set(x, y, Math.abs(x - (x0 + w / 2)) > hw - 1 ? "█" : "▒", KEYS[Math.abs(x - (x0 + w / 2)) > hw - 1 ? CAB + 3 : CONE + 1]);
        }
      }
      g.set(x0 + 1, y0 + 1, "●", KEYS[MET]); g.set(x0 + w - 2, y0 + 1, "●", KEYS[MET]);
      if (kind === 1) g.set(x0 + w / 2, y0 + 1, "●", kick > 0.6 ? KEYS[UI] : KEYS[UI + 1]);
    }
    g.text(4, 35, "MAIN L   ·   4x SUB   ·   CH 1-2   ·   LIMIT", KEYS[MET]);
    // shock rings from the subs on each kick
    if (kick > 0.15) {
      const r = (1 - kick) * 9 + 9.5;
      for (const [cx, cy] of [[13, 21], [35, 21], [13, 30], [35, 30]]) for (let a = -0.9; a <= 0.9; a += 0.05) {
        const x = cx + Math.cos(a) * r * 2.4 + 0, y = cy + Math.sin(a) * r * 0.5;
        if (x > 46 && x < cols) g.set(x, y, "·", KEYS[CONE + 5]);
      }
    }
    // stage wash behind the crowd
    for (let y = 26; y < rows; y++) for (let x = 47; x < cols; x++) {
      const v = clamp(0.8 - (y - 26) * 0.06 + (fbm(x * 0.1 + t * 0.3, y * 0.3, 2, 5) - 0.5) * 0.5 + kick * 0.15);
      g.set(x, y, v > 0.55 ? "▓" : "▒", KEYS[LAS + lc + (v > 0.6 ? 0 : 1)]);
    }
    // crowd at the barrier
    for (const [x, p, hands] of crowd) {
      const jump = Math.max(0, Math.sin((beat + p * 0.3) * TAU)) > 0.7 ? 1 : 0;
      const top = 29 - jump + (p > 0.6 ? 1 : 0);
      for (let y = top; y < rows; y++) for (let k = -2; k <= 2; k++) if (y > top + 1 || Math.abs(k) < 2) g.set(x + k, y, "█", KEYS[CROWD]);
      g.set(x - 1, top, "▄", KEYS[CROWD]); g.set(x + 1, top, "▄", KEYS[CROWD]); g.set(x, top, "█", KEYS[CROWD]);
      if (hands) { g.line(x - 2, top + 2, x - 3, top - 3 - jump, "█", KEYS[CROWD]); g.line(x + 2, top + 2, x + 3, top - 3 - jump, "█", KEYS[CROWD]); }
    }
    // confetti
    for (const [x0, off, sp, c, w] of conf) {
      const fy = ((t * 0.12 * sp + off) % 1) * (rows + 4) - 2;
      const x = x0 + Math.sin(t * 1.5 + w) * 3;
      if (x > 46) g.set(x, fy, Math.floor(t * 4 + w) % 2 ? "▪" : "■", KEYS[CONF + c]);
    }
    return g.frame();
  };
}
