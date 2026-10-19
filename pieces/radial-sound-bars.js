/* radial-sound-bars: a circular audio visualiser, spectrum bars radiating from a spinning disc that swells on every kick. */
import { Grid, palette, gradient, KEYS, noise2, clamp, rng, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#05040a", "#0c0a1a", "#16122c", "#221a40"], 4));
const HUE = add(["#ff3a6a", "#ff6a3a", "#ffa83a", "#ffe03a", "#b8ff3a", "#5aff6a", "#3affb0", "#3ae8ff", "#3aa8ff", "#5a6aff", "#9a5aff", "#d85aff", "#ff5ad8", "#ff3a9a"]);
const HUED = add(["#6a1a2e", "#6a2e1a", "#6a4a1a", "#6a5e1a", "#4e6a1a", "#2a6a2e", "#1a6a4e", "#1a5e6a", "#1a4a6a", "#2a2e6a", "#422a6a", "#5a2a6a", "#6a2a5a", "#6a1a42"]);
const DISC = add(["#0a0a0e", "#1e1e26", "#34343e", "#f4f0e8", "#ff5a7a"]);
const UI = add(["#ffffff", "#c8c8d8"]);

export const meta = {
  slug: "radial-sound-bars",
  name: "Radial Sound Bars",
  category: "music",
  note: "A circular audio visualiser where rainbow spectrum bars radiate from a spinning record, the ring swelling on each kick as sparks fly outward.",
  tags: ["visualiser", "spectrum", "circle", "audio", "hero", "wallpaper"],
  cols: 84, rows: 38, fps: 30,
  palette: palette(P),
};

const CX = 42, CY = 19, NB = 56, BPM = 124;

function band(k, t) {
  const beat = (t * BPM) / 60, ph = beat % 1;
  const kick = Math.exp(-ph * 5);
  const sn = Math.floor(beat) % 2 ? Math.exp(-ph * 7) : 0;
  const hat = Math.exp(-((beat * 2) % 1) * 9);
  const f = k / (NB / 2); // 0 low .. 1 high
  let v = 0.2 + (1 - f) * 0.25;
  v += kick * Math.exp(-f * 6) * 0.7 + sn * Math.exp(-((f - 0.45) ** 2) * 20) * 0.45 + hat * Math.exp(-((f - 0.85) ** 2) * 30) * 0.35;
  v += (noise2(k * 0.5, t * 3.3, 2) - 0.5) * 0.4;
  return clamp(v, 0.05, 1);
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(8);
  const sparks = Array.from({ length: 40 }, () => [R() * TAU, R(), 0.5 + R() * 0.8, Math.floor(R() * 14)]);
  return (t) => {
    const beat = (t * BPM) / 60, ph = beat % 1, kick = Math.exp(-ph * 5);
    const R0 = 8 + kick * 1.2, MAXL = 9.5;
    const vals = new Float32Array(NB), pk = new Float32Array(NB);
    for (let b = 0; b < NB; b++) {
      const k = b < NB / 2 ? b : NB - 1 - b;
      vals[b] = band(k, t);
      let p = 0; for (let s = 0; s < 10; s++) p = Math.max(p, band(k, t - s * 0.06) - s * 0.012);
      pk[b] = p;
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = (x - CX) / 2, dy = y - CY, r = Math.hypot(dx, dy);
      const a = (Math.atan2(dx, -dy) + TAU) % TAU;
      const fb = (a / TAU) * NB, b = Math.floor(fb) % NB, frac = fb - Math.floor(fb);
      const hue = (Math.floor((a / TAU) * 14 * 2) % 14 + 14) % 14;
      const L = vals[b] * MAXL;
      if (r < R0 - 0.6) {
        // spinning record
        const ang = Math.atan2(dy, dx) - t * 3.5;
        if (r < 3) g.set(x, y, "█", Math.cos(ang) > 0.6 ? KEYS[DISC + 3] : KEYS[DISC + 4]);
        else g.set(x, y, Math.sin(r * 4) > 0.5 ? "▓" : "█", KEYS[DISC + (Math.cos(ang * 2) > 0.7 ? 2 : r % 2 > 1 ? 1 : 0)]);
      } else if (r < R0) g.set(x, y, "█", KEYS[UI + 1]);
      else if (r - R0 < L && frac < 0.72) {
        const u = (r - R0) / MAXL;
        g.set(x, y, u > 0.75 ? "▓" : "█", KEYS[(u > 0.35 ? HUE : HUED) + hue]);
      } else if (Math.abs(r - R0 - pk[b] * MAXL - 0.5) < 0.5 && frac < 0.72) g.set(x, y, "▀", KEYS[HUE + hue]);
      else {
        const v = clamp(0.55 - r / 30 + kick * 0.1);
        g.set(x, y, v > 0.3 ? "▒" : "░", KEYS[BG + Math.min(3, Math.floor(v * 4))]);
      }
    }
    // sparks thrown out on the beat
    for (const [a0, off, sp, h] of sparks) {
      const age = (beat * 0.5 + off) % 1;
      const rr = R0 + MAXL * 0.6 + age * 24 * sp;
      const x = CX + Math.sin(a0) * rr * 2, y = CY - Math.cos(a0) * rr;
      if (g.inside(x, y)) g.set(x, y, age < 0.5 ? "●" : "•", KEYS[(age < 0.6 ? HUE : HUED) + h]);
    }
    return g.frame();
  };
}
