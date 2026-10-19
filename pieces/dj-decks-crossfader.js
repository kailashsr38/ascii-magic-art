/* dj-decks-crossfader: two turntables and a mixer seen from above, the crossfader sliding between decks under scrolling waveforms. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const DESK = add(gradient(["#0c0d10", "#16181d", "#20232a", "#2c3038"], 4));
const VIN = add(gradient(["#121216", "#1e1e26", "#2c2c38", "#40404e", "#5a5a6c", "#9a9ab0"], 6));
const MET = add(gradient(["#3a3e48", "#6a707e", "#a8b0bc", "#e8eef4"], 5));
const A = add(["#3ad0ff", "#1a6a8a", "#a0f0ff"]);
const B = add(["#ff5ab0", "#8a2a5e", "#ffb0e0"]);
const UI = add(["#e6edf3", "#8b949e", "#484f58", "#ffd84a", "#ff3a3a", "#5aff7a", "#ff9a3a"]);
const LED = add(gradient(["#22d36a", "#f0d43a", "#ff3a3a"], 8));

export const meta = {
  slug: "dj-decks-crossfader",
  name: "DJ Decks Crossfader",
  category: "music",
  note: "Two turntables spin either side of a mixer while the crossfader slides from one deck to the other and both waveforms scroll past the playhead.",
  tags: ["dj", "turntables", "mixer", "vinyl", "party", "hero"],
  cols: 110, rows: 34, fps: 30,
  palette: palette(P),
};

const xfade = (t) => {
  const p = (t % 16) / 16;
  if (p < 0.3) return 0.05;
  if (p < 0.45) return 0.05 + 0.9 * smooth((p - 0.3) / 0.15);
  if (p < 0.8) return 0.95;
  return 0.95 - 0.9 * smooth((p - 0.8) / 0.2);
};
const wave = (i, s) => {
  const beat = ((i % 16) + 16) % 16;
  return clamp(0.25 + noise2(i * 0.35, s) * 0.5 + (beat < 2 ? 0.45 : beat === 8 || beat === 9 ? 0.25 : 0));
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bg.push(KEYS[DESK + Math.min(3, Math.floor(clamp(0.4 + (fbm(x * 0.08, y * 0.16, 2) - 0.5) * 0.6) * 4))]);
  const deck = (cx, cy, rot, C, pitch, tx) => {
    const rx = 17, ry = 9.5;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.hypot(dx, dy);
      if (d > 1.1) continue;
      const a = Math.atan2(dy, dx);
      if (d > 1.0) {
        const dots = Math.floor(((a - rot * 0.98) / TAU) * 48 + 480) % 2 === 0;
        g.set(x, y, dots ? "▪" : "█", dots ? KEYS[MET + 3] : KEYS[MET + 1]);
        continue;
      }
      if (d < 0.32) {
        const la = (((a - rot) % TAU) + TAU) % TAU;
        g.set(x, y, "█", d < 0.08 ? KEYS[MET + 3] : la < 0.7 ? KEYS[C + 2] : d > 0.26 ? KEYS[C + 1] : KEYS[C]);
        continue;
      }
      const sheen = Math.pow(Math.max(0, Math.cos(a * 2 + 0.8)), 5) * 0.6;
      const tex = noise2(Math.cos(a - rot) * d * 6 + 9, Math.sin(a - rot) * d * 6, 3);
      const v = clamp(0.18 + sheen + (tex - 0.5) * 0.3 + (Math.sin(d * 90) > 0.6 ? 0.12 : 0));
      g.set(x, y, v > 0.45 ? "▓" : v > 0.28 ? "▒" : "█", KEYS[VIN + Math.min(5, Math.floor(v * 6))]);
    }
    // tonearm from top right
    const px = cx + rx + 1, py = cy - ry + 1;
    const sx = cx + rx * 0.62, sy = cy + ry * 0.12;
    g.fill(px - 1, py - 1, 3, 2, "█", KEYS[MET + 2]);
    g.line(px, py, sx, sy, "▓", KEYS[MET + 3]);
    g.set(sx, sy, "█", KEYS[MET]); g.set(sx - 1, sy, "█", KEYS[MET]);
    // pitch fader
    g.vline(tx, cy - 7, cy + 7, "│", KEYS[UI + 2]);
    g.set(tx - 1, cy, "=", KEYS[UI + 1]);
    const py2 = Math.round(cy + pitch * 7);
    g.text(tx - 1, py2, "▬▬▬".replace(/▬/g, "█"), KEYS[MET + 2]);
    g.text(tx - 1, cy - 9, "PIT", KEYS[UI + 1]);
  };
  const strip = (y, pos, C, gain) => {
    for (let x = 2; x < cols - 2; x++) {
      const i = Math.floor(pos + (x - 55) * 0.5);
      const a = wave(i, C) * gain;
      const hot = (x === 55);
      const co = hot ? KEYS[UI] : x < 55 ? KEYS[C + 1] : KEYS[C];
      g.set(x, y, a > 0.55 ? "▄" : " ", co);
      g.set(x, y + 1, a > 0.15 ? "█" : "─", a > 0.15 ? co : KEYS[UI + 2]);
      g.set(x, y + 2, a > 0.55 ? "▀" : " ", co);
      if ((((i % 16) + 16) % 16) === 0 && (x * 2 + Math.floor(pos * 2)) % 2 === 0 && a <= 0.55) g.set(x, y, "·", KEYS[UI + 1]);
    }
  };
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = "▒"; g.co[i] = bg[i]; }
    const x = xfade(t);
    const posA = t * 8, posB = t * 8 + 5;
    g.fill(1, 0, cols - 2, 8, " ", KEYS[DESK]);
    strip(0, posA, A, 0.6 + 0.4 * (1 - x));
    strip(4, posB, B, 0.6 + 0.4 * x);
    g.vline(55, 0, 7, "│", KEYS[UI]);
    g.text(2, 3, " A  124.0 BPM  -2:41 ", KEYS[A]);
    g.text(cols - 23, 3, " B  124.0 BPM  -4:07 ", KEYS[B]);
    g.hline(0, cols - 1, 7, "▀", KEYS[MET]);
    deck(22, 21, t * TAU * 0.55, A, -0.2, 43);
    deck(88, 21, t * TAU * 0.55 + 2, B, 0.15, 67);
    // mixer
    const mx = 46, mw = 19;
    g.fill(mx, 9, mw, 24, "█", KEYS[DESK + 2]);
    g.box(mx, 9, mw, 24, "light", KEYS[MET + 1]);
    const knob = (kx, ky, a, co) => { g.text(kx, ky, "(" + ["\\", "|", "/", "-"][Math.floor(((a % 1) + 1) % 1 * 4)] + ")", co); };
    const labels = ["HI", "MID", "LOW"];
    for (let r = 0; r < 3; r++) {
      knob(mx + 2, 11 + r * 2, 0.15 + r * 0.1 + (r === 2 ? (1 - x) * 0.25 : 0), KEYS[A]);
      knob(mx + mw - 5, 11 + r * 2, 0.4 - r * 0.08 + (r === 2 ? x * 0.25 : 0), KEYS[B]);
      g.text(mx + 8, 11 + r * 2, labels[r].padEnd(3), KEYS[UI + 1]);
    }
    const beat = Math.exp(-((t * 2.067) % 1) * 4);
    const lv = [clamp((0.5 + beat * 0.5) * (1.05 - x * 0.9)), clamp((0.5 + beat * 0.5) * (0.15 + x * 0.9))];
    for (let c = 0; c < 2; c++) {
      const fx = c ? mx + mw - 5 : mx + 2;
      g.vline(fx + 1, 18, 27, "│", KEYS[UI + 2]);
      g.text(fx, 19, "███", c ? KEYS[B] : KEYS[A]);
      for (let s = 0; s < 10; s++) g.set(mx + 8 + c * 2, 27 - s, "▄", s < lv[c] * 10 ? KEYS[LED + Math.floor(s * 0.8)] : KEYS[DESK + 1]);
    }
    g.text(mx + 7, 28, "CUE", KEYS[UI + 1]);
    // crossfader
    g.hline(mx + 2, mx + mw - 3, 30, "─", KEYS[UI + 2]);
    g.set(mx + 1, 30, "A", KEYS[A]); g.set(mx + mw - 2, 30, "B", KEYS[B]);
    const cxp = Math.round(mx + 2 + x * (mw - 7));
    g.text(cxp, 30, "███", KEYS[UI + 3]);
    g.text(mx + 4, 31, "X FADER", KEYS[UI + 1]);
    g.set(43, 10, "●", x < 0.5 ? KEYS[UI + 5] : KEYS[UI + 2]);
    g.set(67, 10, "●", x > 0.5 ? KEYS[UI + 5] : KEYS[UI + 2]);
    return g.frame();
  };
}
