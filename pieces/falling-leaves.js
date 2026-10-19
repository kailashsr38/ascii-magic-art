/* falling-leaves: autumn leaves tumbling and drifting down from a golden tree onto a carpet of fallen leaves. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#f0c48a", "#f4d8a8", "#f8e8c8", "#e8d8c0"], 8));
const HAZE = add(gradient(["#d8a878", "#c48e60", "#a87448"], 3));
const CANOPY = add(gradient(["#7a2a10", "#b4401a", "#d8661e", "#eea030", "#f6c84a"], 10));
const BARK = add(gradient(["#2a1a10", "#4a2e1a", "#6a4628"], 3));
const LITTER = add(gradient(["#4a2010", "#7a3418", "#a8501e", "#c8762a", "#d8a03a"], 10));
const LEAF = add(["#d83a1a", "#ee6a1e", "#f6a02a", "#f6d040", "#a8401a", "#c88a2a"]);

export const meta = {
  slug: "falling-leaves",
  name: "Falling Leaves",
  category: "weather",
  note: "Autumn leaves tumble and drift down from a golden tree in a warm haze onto a carpet of fallen leaves.",
  tags: ["autumn", "leaves", "fall", "seasonal", "calm", "wallpaper"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const SPIN = ["◆", "►", "-", "◄", "◆", "/", "|", "\\"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const ground = 28;
  const r = rng(51);
  const far = Array.from({ length: cols }, (_, x) => 14 + Math.floor(fbm(x * 0.06, 2, 3, 4) * 8));
  const leaves = Array.from({ length: 64 }, () => ({ x: r() * cols * 1.2 - 10, ph: r(), fall: 5 + r() * 6, sw: 2 + r() * 5, f: 0.6 + r() * 1.2, spin: 4 + r() * 8, k: Math.floor(r() * 6), big: r() < 0.55 }));
  return (t) => {
    g.clear();
    for (let y = 0; y < ground; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.04 + t * 0.03, y * 0.15, 3, 1);
      const v = clamp(0.2 + (y / ground) * 0.6 + (c - 0.5) * 0.4);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(c * 4))], KEYS[SKY + Math.min(7, Math.floor(v * 8))]);
    }
    for (let x = 0; x < cols; x++) for (let y = far[x]; y < ground; y++) {
      g.set(x, y, y === far[x] ? "▄" : "█", KEYS[HAZE + Math.min(2, Math.floor((y - far[x]) / 5))]);
      if (y === far[x] && x % 9 === 3) g.set(x, y - 1, "▲", KEYS[HAZE]);
    }
    for (let y = 8; y < ground; y++) for (let x = 10; x <= 15; x++) g.set(x + Math.floor((ground - y) * 0.05), y, x === 10 ? "▓" : "█", KEYS[BARK + (x > 13 ? 2 : x > 11 ? 1 : 0)]);
    for (let k = 0; k < 14; k++) g.set(16 + k, 9 - Math.floor(k * 0.35), "▀", KEYS[BARK + 1]);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 52; x++) {
      const d = Math.hypot((x - 14) / 2.4, (y - 3) * 1.1);
      const n = fbm(x * 0.18 + Math.sin(t * 0.8) * 0.15, y * 0.35, 3, 9);
      if (d / 11 + (0.5 - n) * 0.9 < 1) {
        const v = clamp(n * 1.2 - y * 0.02 + 0.1);
        g.set(x, y, n > 0.62 ? "@" : n > 0.5 ? "%" : n > 0.4 ? "▓" : "&", KEYS[CANOPY + Math.min(9, Math.floor(v * 10))]);
      }
    }
    for (let y = ground; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.8, y * 1.5, 6);
      const m = noise2(x * 0.15, y * 0.4, 7);
      const v = clamp(m * 0.8 + (y - ground) * -0.05 + 0.2);
      g.set(x, y, n > 0.7 ? "◆" : n > 0.45 ? "▓" : n > 0.25 ? "▒" : "%", KEYS[LITTER + Math.min(9, Math.floor((v + n * 0.3) * 8))]);
    }
    for (const L of leaves) {
      const a = (t / L.fall + L.ph) % 1;
      const y = -2 + a * (ground + 3);
      const x = L.x + a * 18 + Math.sin(t * L.f + L.ph * TAU) * L.sw;
      const s = SPIN[Math.floor(t * L.spin + L.ph * 8) & 7];
      g.set(x, y, s, KEYS[LEAF + L.k]);
      if (L.big) g.set(x + 1, y, s === "◆" ? "◄" : s === "►" ? "◆" : s, KEYS[LEAF + L.k]);
    }
    return g.frame();
  };
}
