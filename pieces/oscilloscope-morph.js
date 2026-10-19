/* oscilloscope-morph: a bench oscilloscope tracing a wave that morphs from sine to square to saw to triangle. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const CASE = add(gradient(["#1a1d22", "#2a2e36", "#3c414b", "#555b67"], 4));
const SCR = add(["#030805", "#071209", "#0c1e10", "#14321a"]);
const PH = add(["#2a8a4a", "#5aff8a", "#c8ffd8", "#1a5a2e"]);
const UI = add(["#e6edf3", "#8b949e", "#484f58", "#ffd84a", "#79c0ff", "#ff7b72", "#c8ccd4", "#7ee787"]);

export const meta = {
  slug: "oscilloscope-morph",
  name: "Oscilloscope Wave Morph",
  category: "music",
  note: "A bench oscilloscope traces a green phosphor wave that morphs smoothly between sine, square, saw and triangle while the readouts follow along.",
  tags: ["oscilloscope", "waveform", "synth", "signal", "hero", "terminal"],
  cols: 86, rows: 30, fps: 30,
  palette: palette(P),
};

const SX = 4, SY = 2, SW = 60, SH = 24; // screen in cells: 10 x 8 divisions of 6 x 3
const SHAPES = ["SINE", "SQUARE", "SAW", "TRIANGLE"];
const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];
const wav = (k, p) => {
  const f = ((p % 1) + 1) % 1;
  if (k === 0) return Math.sin(f * TAU);
  if (k === 1) { const s = Math.sin(f * TAU); return Math.tanh(s * 14); }
  if (k === 2) return 1 - 2 * f;
  return f < 0.5 ? 4 * f - 1 : 3 - 4 * f;
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const dots = new Uint8Array(SW * SH);
  const base = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.45 + (fbm(x * 0.07, y * 0.3, 2, 6) - 0.5) * 0.5);
    base.push(KEYS[CASE + Math.min(3, Math.floor(v * 4))]);
  }
  const PW = SW * 2, PHh = SH * 4;
  const plot = (px, py) => {
    if (px < 0 || py < 0 || px >= PW || py >= PHh) return;
    const cx = px >> 1, cy = py >> 2;
    dots[cx + cy * SW] |= BITS[py & 3][px & 1];
  };
  const state = (t) => {
    const cyc = t / 3.5, i = Math.floor(cyc) % 4, f = cyc % 1;
    const m = smooth(clamp((f - 0.6) / 0.4));
    return [i, (i + 1) % 4, m];
  };
  return (t) => {
    for (let i = 0; i < base.length; i++) { g.ch[i] = "▓"; g.co[i] = base[i]; }
    // bezel and screen
    g.fill(SX - 2, SY - 1, SW + 4, SH + 2, "█", KEYS[CASE]);
    g.box(SX - 2, SY - 1, SW + 4, SH + 2, "round", KEYS[CASE + 3]);
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const d = Math.hypot((x - SW / 2) / SW, (y - SH / 2) / SH);
      g.set(SX + x, SY + y, "░", KEYS[SCR + (d < 0.3 ? 1 : 0)]);
    }
    // graticule
    for (let y = 0; y <= SH; y += 3) for (let x = 0; x < SW; x++) if (x % 2 === 0) g.set(SX + x, SY + Math.min(SH - 1, y), y === SH / 2 ? "·" : "·", KEYS[SCR + (y === 12 ? 3 : 2)]);
    for (let x = 0; x <= SW; x += 6) for (let y = 0; y < SH; y++) g.set(SX + Math.min(SW - 1, x), SY + y, x === 30 ? "┊" : "·", KEYS[SCR + (x === 30 ? 3 : 2)]);
    // trace, with a fainter persistence ghost
    const [a, b, m] = state(t);
    const cycles = 2.5 + 0.5 * Math.sin(t * 0.25);
    const amp = 0.78 + 0.08 * Math.sin(t * 0.6);
    for (const [layer, tt] of [[1, t - 0.12], [0, t]]) {
      dots.fill(0);
      const [a2, b2, m2] = layer ? state(tt) : [a, b, m];
      let prev = null;
      for (let px = 0; px < PW; px++) {
        const p = (px / PW) * cycles + tt * 0.05;
        const v = (wav(a2, p) * (1 - m2) + wav(b2, p) * m2) * amp;
        const py = Math.round((PHh - 1) / 2 - v * (PHh / 2 - 3));
        if (prev !== null) { const s = Math.sign(py - prev) || 1; for (let q = prev; q !== py; q += s) plot(px, q); }
        plot(px, py); plot(px, py + 1); prev = py;
      }
      for (let i = 0; i < dots.length; i++) if (dots[i]) {
        const x = SX + (i % SW), y = SY + Math.floor(i / SW);
        if (layer) { g.set(x, y, String.fromCharCode(0x2800 + dots[i]), KEYS[PH + 3]); }
        else {
          g.set(x, y, String.fromCharCode(0x2800 + dots[i]), KEYS[PH + 1]);
          // glow on the cells above and below
          for (const dy of [-1, 1]) { const j = i + dy * SW; if (j >= 0 && j < dots.length && !dots[j] && g.get(x, y + dy) === "░") g.set(x, y + dy, "░", KEYS[SCR + 3]); }
        }
      }
    }
    g.text(SX + 1, SY, "CH1", KEYS[UI + 3]);
    g.text(SX + SW - 9, SY, "TRIG'D", KEYS[UI + 7]);
    const name = m > 0.5 ? SHAPES[b] : SHAPES[a];
    // readouts under the screen
    g.text(SX, SY + SH + 1, `1.00V/div  500us/div  TRIG ↑ 0.00V`, KEYS[UI + 1]);
    // side panel
    const px = SX + SW + 4;
    g.text(px, 1, "WAVE", KEYS[UI + 1]);
    SHAPES.forEach((s, i) => {
      const on = s === name;
      g.text(px, 2 + i, (on ? "► " : "  ") + s.padEnd(8), on ? KEYS[PH + 1] : KEYS[UI + 2]);
    });
    const hz = (220 * cycles / 2.5).toFixed(1).padStart(6);
    g.box(px - 1, 7, 18, 4, "light", KEYS[UI + 2]);
    g.text(px, 8, "FREQ", KEYS[UI + 1]); g.text(px + 6, 8, hz + " Hz", KEYS[UI + 3]);
    g.text(px, 9, "VPP ", KEYS[UI + 1]); g.text(px + 6, 9, (amp * 8).toFixed(2).padStart(6) + " V ", KEYS[UI + 4]);
    const knob = (x, y, a2, lbl) => {
      g.text(x, y, "╭─╮", KEYS[UI + 6]); g.text(x, y + 1, "│" + ["\\", "|", "/", "-"][Math.floor(((a2 % 1) + 1) % 1 * 4)] + "│", KEYS[UI + 6]); g.text(x, y + 2, "╰─╯", KEYS[UI + 6]);
      g.text(x - 1, y + 3, lbl, KEYS[UI + 1]);
    };
    knob(px + 1, 12, 0.2, "VOLT"); knob(px + 10, 12, 0.6, "TIME");
    knob(px + 1, 18, (t * 0.05) % 1, "POS"); knob(px + 10, 18, 0.85, "TRIG");
    g.text(px, 24, "CH1", KEYS[UI + 3]); g.set(px + 4, 24, "●", KEYS[UI + 3]);
    g.text(px + 7, 24, "CH2", KEYS[UI + 2]); g.set(px + 11, 24, "●", KEYS[UI + 2]);
    g.text(px, 26, "RUN", KEYS[UI + 7]); g.set(px + 4, 26, "●", Math.floor(t * 2) % 2 ? KEYS[UI + 7] : KEYS[PH + 3]);
    return g.frame();
  };
}
