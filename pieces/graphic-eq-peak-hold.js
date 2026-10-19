/* graphic-eq-peak-hold: a rack graphic equaliser, LED bars bouncing to a beat with peak hold markers that hang and fall. */
import { Grid, palette, gradient, KEYS, noise2, clamp, fbm } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const PANEL = add(gradient(["#0e1014", "#1a1d24", "#262a33", "#353a45"], 5));
const LIT = add(gradient(["#1fd65a", "#5ff05a", "#b8f03a", "#f0e03a", "#ffb030", "#ff6a30", "#ff2e3a"], 20));
const DIM = add(gradient(["#0c2a16", "#1c2e12", "#33300e", "#3a1c12", "#3a0e14"], 20));
const UI = add(["#e6edf3", "#8b949e", "#484f58", "#ffffff", "#79c0ff", "#ffd84a", "#c8ccd4", "#6a707e"]);

export const meta = {
  slug: "graphic-eq-peak-hold",
  name: "Graphic EQ Peak Hold",
  category: "music",
  note: "A rack mounted graphic equaliser whose LED bars jump to a kick, snare and hats while peak hold markers hang at the top and drift back down.",
  tags: ["equaliser", "spectrum", "audio", "led", "hero", "dashboard"],
  cols: 92, rows: 30, fps: 30,
  palette: palette(P),
};

const NB = 26, SEGS = 20, BX = 9, BY = 4;
const FREQ = ["25", "40", "63", "100", "160", "250", "400", "630", "1k", "1k6", "2k5", "4k", "6k3", "10k", "16k"];

function level(b, t) {
  const beat = t * 2.1;
  const ph = beat % 1, bar = Math.floor(beat);
  const kick = Math.exp(-ph * 5) * (bar % 4 === 3 && ph > 0.5 ? 0.6 : 1);
  const sn = bar % 2 ? Math.exp(-ph * 6) : 0;
  const hp = (beat * 2) % 1, hat = Math.exp(-hp * 9);
  const k = b / (NB - 1);
  let v = 0.25 + 0.2 * (1 - k);
  v += kick * Math.exp(-k * 9) * 0.75;
  v += sn * Math.exp(-((k - 0.45) ** 2) * 18) * 0.55;
  v += hat * Math.exp(-((k - 0.85) ** 2) * 30) * 0.45;
  v += (noise2(b * 0.45, t * 3.2, 7) - 0.5) * 0.45;
  v += 0.12 * Math.sin(t * 0.7 + b * 0.4);
  return clamp(v, 0.03, 1);
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.35 + (fbm(x * 0.6, y * 0.05, 2, 3) - 0.5) * 0.5 - y * 0.008);
    bg.push(KEYS[PANEL + Math.min(3, Math.floor(v * 4))]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = "░"; g.co[i] = bg[i]; }
    // rack ears and screws
    for (let y = 0; y < rows; y++) { g.set(0, y, "█", KEYS[PANEL + 3]); g.set(1, y, "▓", KEYS[PANEL + 2]); g.set(cols - 1, y, "█", KEYS[PANEL + 3]); g.set(cols - 2, y, "▓", KEYS[PANEL + 2]); }
    for (const y of [2, rows - 3]) { g.set(0, y, "●", KEYS[UI + 7]); g.set(cols - 1, y, "●", KEYS[UI + 7]); }
    g.text(4, 1, "GRAPHIC EQUALISER", KEYS[UI]);
    g.text(23, 1, "26 BAND  ·  STEREO LINK", KEYS[UI + 1]);
    g.text(cols - 19, 1, "PEAK HOLD", KEYS[UI + 5]);
    g.set(cols - 8, 1, "●", Math.floor(t * 2) % 2 ? KEYS[UI + 5] : KEYS[UI + 2]);
    g.hline(3, cols - 4, 2, "─", KEYS[UI + 2]);
    // dB scale
    const DB = ["+12", " +6", "  0", " -6", "-12", "-18", "-24"];
    for (let i = 0; i < DB.length; i++) g.text(3, BY + Math.round(i * (SEGS - 1) / (DB.length - 1)), DB[i], KEYS[UI + 1]);
    for (let b = 0; b < NB; b++) {
      const v = level(b, t);
      let pk = 0;
      for (let k = 0; k < 24; k++) {
        const dt = k * 0.06;
        pk = Math.max(pk, level(b, t - dt) - Math.max(0, dt - 0.5) * 0.9);
      }
      const n = Math.round(v * SEGS), pn = Math.min(SEGS, Math.max(n, Math.round(pk * SEGS)));
      const x = BX + b * 3;
      for (let s = 0; s < SEGS; s++) {
        const y = BY + SEGS - 1 - s;
        const on = s < n;
        const isPk = s === pn - 1 && pn > n;
        const co = on || isPk ? KEYS[LIT + s] : KEYS[DIM + s];
        const ch = isPk ? "▀" : "▄";
        g.set(x, y, ch, isPk ? KEYS[UI + 3] : co);
        g.set(x + 1, y, ch, isPk ? KEYS[UI + 3] : co);
      }
      if (b % 2 === 0) { const lb = FREQ[b / 2] || ""; g.text(x + 1 - Math.floor(lb.length / 2), BY + SEGS + 1, lb, KEYS[UI + 1]); }
    }
    // footer: knobs and readouts
    const fy = rows - 3;
    g.hline(3, cols - 4, fy - 1, "─", KEYS[UI + 2]);
    const knob = (x, lbl, a) => {
      const p = ["/", "-", "\\", "|"][Math.floor(((a % 1) + 1) % 1 * 4)];
      g.text(x, fy, "(" + p + ")", KEYS[UI + 6]); g.text(x + 4, fy, lbl, KEYS[UI + 1]);
    };
    knob(4, "INPUT", 0.12); knob(16, "RANGE 12", 0.3); knob(31, "OUTPUT", 0.2);
    const lv = level(2, t), rv = level(4, t + 0.1);
    g.text(46, fy, "L", KEYS[UI]); g.text(46, fy + 1, "R", KEYS[UI]);
    for (let i = 0; i < 24; i++) {
      g.set(48 + i, fy, i < lv * 24 ? "■" : "·", i < lv * 24 ? KEYS[LIT + Math.floor(i * 0.8)] : KEYS[UI + 2]);
      g.set(48 + i, fy + 1, i < rv * 24 ? "■" : "·", i < rv * 24 ? KEYS[LIT + Math.floor(i * 0.8)] : KEYS[UI + 2]);
    }
    g.text(cols - 17, fy, "BYPASS", KEYS[UI + 1]); g.set(cols - 10, fy, "●", KEYS[UI + 2]);
    g.text(cols - 17, fy + 1, "LINK", KEYS[UI + 1]); g.set(cols - 10, fy + 1, "●", KEYS[UI + 4]);
    return g.frame();
  };
}
