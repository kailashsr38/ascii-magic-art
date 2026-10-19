/* tea-pour-height: a silver teapot is raised high as it pours a long amber stream into a small glass, foam rising and steam curling. */
import { Grid, palette, gradient, KEYS, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TILE = add(["#0c2a36", "#14404c", "#1c5058", "#e8dcc0", "#7a6a3a", "#0a2430"]);
const SILVER = add(gradient(["#3a3e44", "#6a7078", "#9ea6b0", "#d0d8e0", "#ffffff"], 7));
const TEA = add(gradient(["#5a2008", "#8a3a10", "#b8621c", "#e0922e", "#f8c46a"], 6));
const FOAM = add(["#e8c890", "#fff0d0"]);
const GLASS = add(["#7a9aa8", "#c4dce4", "#ffffff"]);
const GOLD = add(["#8a5a14", "#d49a2a", "#f8d06a"]);
const TRAY = add(gradient(["#5a4a2a", "#9a8250", "#d4bc80", "#f4e4b0"], 4));
const MINT = add(["#2a7a2a", "#6ac04a"]);
const STEAM = add(["#7a8a8a", "#b8c4c4", "#eef4f4"]);

export const meta = {
  slug: "tea-pour-height",
  name: "Tea Poured From Height",
  category: "food",
  note: "A silver teapot is lifted high as it pours a long amber stream of mint tea into a small gold-rimmed glass, foam rising and steam curling.",
  tags: ["tea", "mint tea", "pour", "drink", "cafe", "food"],
  cols: 60, rows: 40, fps: 24,
  palette: palette(P),
};

const PER = 11;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const trayY = 35;
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const tilt = smooth(clamp((p - 0.6) / 0.6)) * (1 - smooth(clamp((p - 7.4) / 0.6)));
    const rise = smooth(clamp((p - 1.2) / 2.5)) * (1 - smooth(clamp((p - 6.4) / 1.2)));
    const pouring = tilt > 0.8;
    const fill = clamp((p - 1.3) / 6.3);
    const slide = p > 9.8 ? smooth((p - 9.8) / 1.2) : 0;
    const inn = p < 0.6 ? 1 - smooth(p / 0.6) : 0;
    const gx = Math.round(38 + slide * 30 - inn * 30);
    // patterned tiles: an eight point star lattice
    for (let y = 0; y < trayY; y++) for (let x = 0; x < cols; x++) {
      const cx = ((x % 12) + 12) % 12 - 6, cy = (((y * 2) % 12) + 12) % 12 - 6;
      const star = Math.max(Math.abs(cx), Math.abs(cy)) < 3.2 || Math.abs(cx) + Math.abs(cy) < 4.6;
      const ring = Math.abs(Math.max(Math.abs(cx), Math.abs(cy)) - 3.6) < 0.6 && !star;
      g.set(x, y, "█", KEYS[TILE + (star ? ((x / 12 | 0) + (y / 6 | 0)) % 2 ? 2 : 1 : ring ? 4 : 0)]);
    }
    // brass tray
    for (let y = trayY; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", KEYS[TRAY + (y === trayY ? 3 : y === trayY + 1 ? 2 : (x + y) % 9 === 0 ? 0 : 1)]);
    // tea glass with gold band, filling, a foam cap and mint inside
    const top = 25, bot = trayY - 1, level = bot - fill * (bot - top - 1.2);
    for (let y = top; y <= bot; y++) {
      const w = 4.2 - (y - top) * 0.12;
      for (let x = Math.floor(gx - w); x <= Math.ceil(gx + w); x++) {
        const u = (x - gx) / w;
        if (Math.abs(u) > 1) continue;
        const wall = Math.abs(u) > 0.8;
        if (y === top + 2 || y === bot - 1) { g.set(x, y, "█", KEYS[GOLD + (u < 0 ? 2 : 1)]); continue; }
        if (y >= level && !wall) {
          const surf = y < level + 1 && fill > 0.25;
          g.set(x, y, "█", KEYS[surf ? FOAM + (u < 0 ? 1 : 0) : TEA + Math.min(5, Math.floor(clamp(0.5 - u * 0.25 + (y - level) * -0.02) * 6))]);
        } else g.set(x, y, wall ? "█" : "░", KEYS[GLASS + (wall ? (u < 0 ? 2 : 1) : 0)]);
      }
    }
    if (fill > 0.3) { g.set(gx + 1, Math.max(top, Math.round(level) - 1), "█", KEYS[MINT + 1]); g.set(gx + 2, Math.max(top, Math.round(level) - 2), "▀", KEYS[MINT]); }
    // teapot: high and to the left, lifted as it pours
    const px = 15, py = Math.round(lerp(17, 7, rise)), lean = tilt;
    for (let y = py - 6; y <= py + 6; y++) for (let x = px - 11; x <= px + 11; x++) {
      const yy = y - Math.round((x - px) * lean * 0.12);
      const d = Math.hypot((x - px) / 10, (yy - py - 0.5) / 5.4);
      if (d < 1) {
        const lit = clamp(Math.sqrt(1 - d * d) * 0.6 + 0.2 - (x - px) * 0.04 - (yy - py) * 0.04);
        g.set(x, y, "█", KEYS[SILVER + Math.min(6, Math.floor(lit * 7))]);
      }
    }
    // lid dome and finial
    for (let x = px - 5; x <= px + 5; x++) g.set(x, py - 5 - Math.round((x - px) * lean * 0.12), "▄", KEYS[SILVER + 4]);
    for (let x = px - 3; x <= px + 3; x++) g.set(x, py - 6 - Math.round((x - px) * lean * 0.12), "▄", KEYS[SILVER + 5]);
    g.set(px, py - 7, "●", KEYS[SILVER + 6]);
    // handle on the left
    for (let y = py - 3; y <= py + 4; y++) g.set(px - 12 - (Math.abs(y - py) < 2 ? 1 : 0), y, "█", KEYS[SILVER + 2]);
    // long curved spout reaching right, dipping as the pot tilts
    let spx = px + 9, spy = py + 3;
    for (let i = 0; i < 9; i++) {
      spx += 1; spy += i < 4 ? -0.7 : -0.15 + lean * 0.55;
      g.set(Math.round(spx), Math.round(spy), "█", KEYS[SILVER + 3]);
      g.set(Math.round(spx), Math.round(spy) + 1, "▀", KEYS[SILVER + 1]);
    }
    // the long amber stream from spout to glass
    if (pouring) {
      const ex = gx, ey = level - 0.5;
      const sx = Math.round(spx) + 1, sy = Math.round(spy);
      for (let y = sy; y <= ey; y++) {
        const f = (y - sy) / Math.max(1, ey - sy);
        const x = Math.round(lerp(sx, ex, Math.sqrt(f)) + Math.sin(y * 0.5 + t * 5) * 0.3);
        g.set(x, y, "█", KEYS[TEA + 3 + ((y + Math.floor(t * 24)) % 5 === 0 ? 2 : 1)]);
      }
      for (let k = -1; k <= 1; k++) if (Math.sin(t * 13 + k * 2) > 0.2) g.set(gx + k * 2, Math.round(level) - 1, "°", KEYS[FOAM + 1]);
    }
    // steam rising off the glass
    for (let k = 0; k < 7; k++) {
      const a = (t * 0.45 + k / 7) % 1;
      const x = gx - 3 + (k * 3) % 7 + Math.sin(a * 6 + k) * 1.5, y = top - 1 - a * 9;
      if (fill > 0.2) g.set(x, y, a < 0.4 ? "▒" : "░", KEYS[STEAM + (a < 0.4 ? 2 : 1)]);
    }
    return g.frame();
  };
}
