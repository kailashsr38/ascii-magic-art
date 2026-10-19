/* headphones-sound-waves: a pair of over-ear headphones with sound rings rolling out of the cups and a waveform playing between them. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#0a0618", "#1a0e36", "#2a1458", "#3e1a6e", "#56207a"], 6));
const SHELL = add(gradient(["#5a0e2a", "#a01a44", "#e0305e", "#ff6a8a", "#ffb0c4"], 6));
const PAD = add(gradient(["#08080c", "#16161e", "#262632", "#3a3a4a"], 4));
const MET = add(gradient(["#4a4e58", "#8a909e", "#c8ccd4", "#f0f4f8"], 4));
const RING = add(["#3ad8ff", "#5aa0ff", "#8a6aff", "#c85aff", "#ff5ad8"]);
const WAVE = add(["#7affc8", "#3ad8ff", "#ffffff"]);

export const meta = {
  slug: "headphones-sound-waves",
  name: "Headphones Sound Waves",
  category: "music",
  note: "Glossy over-ear headphones float in a violet glow, sound rings rolling out of each cup while a waveform plays across the space between them.",
  tags: ["headphones", "audio", "listening", "podcast", "hero", "wallpaper"],
  cols: 84, rows: 32, fps: 30,
  palette: palette(P),
};

const CX = 42, CY = 18, BRX = 27, BRY = 15;
const CUPS = [[15, 21], [69, 21]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const sky = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.2 + Math.exp(-Math.hypot((x - CX) / 40, (y - 18) / 16)) * 0.55 + (fbm(x * 0.06, y * 0.12, 3, 1) - 0.5) * 0.35);
    sky.push(KEYS[SKY + Math.min(5, Math.floor(v * 6))]);
  }
  return (t) => {
    for (let i = 0; i < sky.length; i++) { g.ch[i] = "░"; g.co[i] = sky[i]; }
    const beat = (t * 100) / 60, ph = beat % 1, kick = Math.exp(-ph * 5);
    // sound rings out of each cup
    for (let k = 0; k < 6; k++) {
      const age = (beat * 0.5 + k / 6) % 1;
      const r = 7 + age * 26;
      CUPS.forEach(([cx, cy], side) => {
        for (let a = -1.25; a <= 1.25; a += 0.025) {
          const x = side ? cx + Math.cos(a) * r : cx - Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * 0.5;
          if (g.get(x, y) !== "░") continue;
          g.set(x, y, age < 0.35 ? "█" : age < 0.65 ? "▓" : "▒", KEYS[RING + Math.min(4, Math.floor(age * 5))]);
        }
      });
    }
    // waveform between the cups
    for (let x = 25; x <= 59; x++) {
      const env = Math.sin(((x - 25) / 34) * Math.PI);
      const v = env * (Math.sin(x * 0.55 - t * 9) * 0.6 + Math.sin(x * 1.3 - t * 15) * 0.25 + (noise2(x * 0.3, t * 4) - 0.5) * 0.6) * (0.6 + kick * 0.6);
      const h = Math.round(Math.abs(v) * 6);
      for (let q = -h; q <= h; q++) g.set(x, 21 - q, Math.abs(q) === h && h > 0 ? (q < 0 ? "▀" : "▄") : "█", Math.abs(q) > 3 ? KEYS[WAVE + 2] : Math.abs(q) > 1 ? KEYS[WAVE + 1] : KEYS[WAVE]);
    }
    // headband
    for (let a = Math.PI * 1.04; a <= Math.PI * 1.96; a += 0.004) {
      const x = CX + Math.cos(a) * BRX * 0.95, y = CY + Math.sin(a) * BRY;
      const lit = clamp(0.5 - Math.cos(a) * 0.3);
      g.set(x, y - 1, "▄", KEYS[SHELL + Math.min(5, Math.floor(lit * 6) + 1)]);
      g.set(x, y, "█", KEYS[SHELL + Math.min(5, Math.floor(lit * 6))]);
      g.set(x, y + 1, "█", KEYS[PAD + 2]);
      g.set(x, y + 2, "▀", KEYS[PAD + 1]);
    }
    // sliders
    for (const [cx] of CUPS) for (let y = 10; y <= 14; y++) { g.set(cx - 1, y, "█", KEYS[MET + 2]); g.set(cx, y, "█", KEYS[MET + 1]); g.set(cx + 1, y, "▌", KEYS[MET]); }
    // cups
    CUPS.forEach(([cx, cy], side) => {
      for (let y = cy - 7; y <= cy + 7; y++) for (let x = cx - 9; x <= cx + 9; x++) {
        const dx = (x - cx) / 8.5, dy = (y - cy) / 7.2;
        const d = Math.pow(Math.abs(dx), 3) + Math.pow(Math.abs(dy), 3);
        if (d > 1) continue;
        const inner = side ? dx < -0.55 : dx > 0.55;
        if (inner) { g.set(x, y, "█", KEYS[PAD + Math.min(3, Math.floor((1 - d) * 3 + 0.5))]); continue; }
        const lit = clamp(0.55 - dx * 0.25 - dy * 0.3 + (1 - d) * 0.25 + (d > 0.8 ? -0.25 : 0));
        g.set(x, y, lit > 0.75 ? "▓" : "█", KEYS[SHELL + Math.min(5, Math.floor(lit * 6))]);
      }
      // logo-free accent ring and a pulsing LED
      const ox = side ? cx + 2 : cx - 2;
      for (let a = 0; a < TAU; a += 0.1) g.set(ox + Math.cos(a) * 4, cy + Math.sin(a) * 2.2, "·", KEYS[SHELL + 4]);
      g.set(ox, cy, "●", kick > 0.5 ? KEYS[WAVE] : KEYS[SHELL + 1]);
    });
    // cable from the left cup
    for (let y = 28; y < rows; y++) g.set(13 + Math.round(Math.sin(y * 0.6 + t) * 0.6), y, "█", KEYS[PAD + 2]);
    return g.frame();
  };
}
