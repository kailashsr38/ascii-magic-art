/* lightning-storm: rolling storm clouds over dark hills, slanting rain and branching bolts that light the sky. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#07060f", "#151325", "#2a2742", "#4a4568", "#7f78a2", "#c9c2e8", "#f4f0ff"], 18));
const HILL = add(gradient(["#030508", "#0b1218", "#1b2a33", "#3e5868"], 6));
const RAIN = add(gradient(["#4c5878", "#8f9cc0", "#d0d8f0"], 3));
const BOLT = add(["#b49cff", "#e8e0ff", "#ffffff", "#fff6c8"]);

export const meta = {
  slug: "lightning-storm",
  name: "Lightning Storm",
  category: "weather",
  note: "Storm clouds churn over dark hills while branching bolts crack down and flash the whole sky.",
  tags: ["storm", "lightning", "weather", "rain", "dramatic", "wallpaper"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const PERIOD = 2.0;

function bolt(idx, cols, top, ground) {
  const r = rng(idx * 7919 + 13);
  const segs = [];
  const x0 = 12 + r() * (cols - 24);
  const walk = (x, y, len, bias, main) => {
    for (let s = 0; s < len && y < ground; s++) {
      const step = Math.round((r() - 0.5) * 3.4 + bias);
      const nx = x + step;
      segs.push([Math.round(x), y, step, main]);
      if (main && r() < 0.2) walk(nx, y + 1, 3 + Math.floor(r() * 7), r() < 0.5 ? -1.2 : 1.2, false);
      x = nx; y += 1;
    }
    return x;
  };
  walk(x0, top, 99, (r() - 0.5) * 0.6, true);
  return { segs, x0 };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const top = 11, ground = 28;
  const r = rng(3);
  const hill = Array.from({ length: cols }, (_, x) => ground - Math.floor(fbm(x * 0.035, 4, 4, 6) * 5));
  const drops = Array.from({ length: 340 }, () => [r() * (cols + 30), r(), 0.45 + r() * 0.35, r()]);
  const cache = new Map();
  const getBolt = (i) => { if (!cache.has(i)) { if (cache.size > 8) cache.clear(); cache.set(i, bolt(i, cols, top, ground)); } return cache.get(i); };
  return (t) => {
    g.clear();
    const idx = Math.floor(t / PERIOD), lt = t - idx * PERIOD;
    const b = getBolt(idx);
    const on = (lt < 0.07) || (lt > 0.13 && lt < 0.2) || (lt > 0.27 && lt < 0.4);
    const F = on ? 1 : Math.exp(-(lt - 0.4) * 5) * 0.4 * (lt > 0.4 ? 1 : 0);
    for (let y = 0; y < ground; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.035 + t * 0.07, y * 0.15 - t * 0.03, 4, 1);
      const cloud = clamp((c - 0.35) * 1.6 + (1 - y / (top + 3)) * 0.5);
      const near = Math.exp(-Math.abs(x - b.x0) / 30);
      let v = y < top + 3 ? 0.2 + cloud * 0.42 : 0.26 + (y - top) / ground * 0.1 + (c - 0.5) * 0.2;
      v = clamp(v + F * (0.25 + 0.4 * near) * (y < top + 3 ? cloud + 0.3 : 0.12));
      g.set(x, y, SH[1 + Math.min(3, Math.floor((y < top + 3 ? cloud : v) * 4))], KEYS[SKY + Math.min(17, Math.floor(v * 18))]);
    }
    for (let x = 0; x < cols; x++) for (let y = hill[x]; y < rows; y++) {
      const n = noise2(x * 0.5, y * 0.8, 2);
      const v = clamp((y - hill[x] < 1 ? 0.3 : 0.1) + n * 0.25 + F * 0.4);
      g.set(x, y, n > 0.6 ? "▓" : "█", KEYS[HILL + Math.min(5, Math.floor(v * 6))]);
      if (y === hill[x] && n > 0.5) g.set(x, y - 1, n > 0.75 ? "|" : ",", KEYS[HILL + 1 + Math.floor(F * 3)]);
    }
    for (const [dx, dy, sp, ph] of drops) {
      const y = ((dy + t * sp * 3.3) % 1) * (ground + 4) + 2;
      const x = Math.round(dx - y * 0.45);
      for (let k = 0; k < 2; k++) {
        const yy = Math.floor(y - k);
        if (yy < top || yy >= hill[Math.max(0, Math.min(cols - 1, x))]) continue;
        g.set(Math.round(dx - yy * 0.45), yy, "/", KEYS[RAIN + (k ? 0 : 1) + (F > 0.5 ? 1 : 0)]);
      }
    }
    if (on || lt < 0.5) {
      const fade = on ? 0 : 1;
      for (const [x, y, step, main] of b.segs) {
        const ch = step < 0 ? "/" : step > 0 ? "\\" : "|";
        g.set(x, y, ch, KEYS[BOLT + (main ? (on ? 2 : 1) : fade ? 0 : 1)]);
        if (main && on) { g.set(x - 1, y, "▒", KEYS[BOLT]); g.set(x + 1, y, "▒", KEYS[BOLT]); g.set(x, y, "█", KEYS[BOLT + 2]); }
        else if (main) g.set(x, y, "▓", KEYS[BOLT + 1]);
      }
      if (on) { const last = b.segs.filter((s) => s[3]).pop(); if (last) g.text(last[0] - 2, last[1], "\\*|*/", KEYS[BOLT + 3]); }
    }
    return g.frame();
  };
}
