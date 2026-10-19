/* lunar-base: domes on the grey lunar plain, Earth hanging in a black sky, a rover rolling past. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SPACE = add(["#04050a", "#0a0c16", "#141828"]);
const STAR = add(["#5a6080", "#b8c0e0", "#ffffff"]);
const OCEAN = add(gradient(["#0b2350", "#1f5aa8", "#4f9be0"], 4));
const LAND = add(["#3f7a3a", "#8a8a4a"]);
const CLOUD = add(["#cfd8e6", "#ffffff"]);
const GROUND = add(gradient(["#1c1c22", "#3a3a42", "#6a6a74", "#a4a4ae", "#d6d6de"], 12));
const DOME = add(gradient(["#3a4252", "#7a8698", "#c4ccd8", "#f0f4fa"], 6));
const LIGHT = add(["#ffd36e", "#fff2c0", "#ff4a4a", "#5ad1ff"]);
const ROVER = add(["#e8e8ee", "#8a8a96", "#f2b84a"]);

export const meta = {
  slug: "lunar-base",
  name: "Lunar Base",
  category: "landscapes",
  note: "Habitat domes on the grey lunar plain with Earth hanging in a black sky and a rover rolling past.",
  tags: ["space", "moon", "sci-fi", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(12);
  const stars = Array.from({ length: 160 }, () => [Math.floor(r() * cols), Math.floor(r() * 20), r(), r() * 6.28]);
  const hz = (x) => 19 + Math.round(fbm(x * 0.05, 0.5, 3, 4) * 4 - 1.5 + Math.sin(x * 0.03) * 1.2);
  const H = Array.from({ length: cols }, (_, x) => hz(x));
  const craters = Array.from({ length: 9 }, () => [r() * cols, 23 + r() * 12, 2 + r() * 5]);
  const domes = [[24, 26, 12], [44, 25, 8], [72, 27, 14], [57, 24, 6]];
  const ex = 22, ey = 8, er = 10;
  return (t) => {
    g.clear();
    // space background, a dense faint dust of stars
    for (let y = 0; y < 24; y++) for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.5, y * 0.9, 3);
      g.set(x, y, n > 0.82 ? "·" : n > 0.55 ? "░" : " ", KEYS[SPACE + (n > 0.82 ? 2 : n > 0.55 ? 1 : 0)]);
      if (n <= 0.55) g.set(x, y, "░", KEYS[SPACE]);
    }
    for (const [sx, sy, b, ph] of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + ph);
      const v = b * 0.7 + tw * 0.3;
      g.set(sx, sy, v > 0.85 ? "*" : v > 0.5 ? "•" : "·", KEYS[STAR + (v > 0.8 ? 2 : v > 0.45 ? 1 : 0)]);
    }
    // Earth with slowly turning continents and clouds, lit from the right
    for (let y = ey - 6; y <= ey + 6; y++) for (let x = ex - 12; x <= ex + 12; x++) {
      const dx = (x - ex) / er, dy = (y - ey) / (er * 0.5);
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) { if (d2 < 1.25) g.set(x, y, "░", KEYS[OCEAN + 1]); continue; }
      const z = Math.sqrt(1 - d2);
      const lon = Math.atan2(dx, z) + t * 0.25, lat = dy;
      const light = clamp(dx * 0.45 + z * 0.7 + 0.15);
      const land = fbm(lon * 2.2 + 10, lat * 2.5, 3, 8);
      const cloud = fbm(lon * 3 + t * 0.1, lat * 5, 3, 21);
      let ch, co;
      if (cloud > 0.64) { ch = light > 0.5 ? "█" : "▓"; co = KEYS[CLOUD + (light > 0.6 ? 1 : 0)]; }
      else if (land > 0.55) { ch = light > 0.5 ? "▓" : "▒"; co = KEYS[LAND + (land > 0.66 ? 1 : 0)]; }
      else { ch = light > 0.6 ? "▓" : "▒"; co = KEYS[OCEAN + clamp(Math.floor(light * 4), 0, 3)]; }
      if (light < 0.18) { ch = "░"; co = KEYS[OCEAN]; }
      g.set(x, y, ch, co);
    }
    // the lunar plain, lit from the right, with craters and a far ridge
    for (let x = 0; x < cols; x++) for (let y = H[x]; y < rows; y++) {
      const d = (y - H[x]) / (rows - H[x]);
      const n = fbm(x * 0.12, y * 0.35, 4, 2);
      let v = 0.28 + d * 0.22 + (n - 0.5) * 0.45;
      for (const [cx, cy, cr] of craters) {
        const q = Math.hypot((x - cx) / cr, (y - cy) / (cr * 0.4));
        if (q < 1) v += (x - cx) > 0 ? 0.12 * (1 - q) : -0.22 * (1 - q);
        else if (q < 1.25) v += 0.08;
      }
      if (y === H[x]) v = 0.62;
      v = clamp(v);
      g.set(x, y, v > 0.8 ? "█" : v > 0.55 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[GROUND + clamp(Math.floor(v * 12), 0, 11)]);
    }
    // corridor tubes linking domes
    for (let x = 22; x <= 70; x++) { g.set(x, 27, "▄", KEYS[DOME + 2]); g.set(x, 28, "▀", KEYS[DOME + 1]); }
    // domes: lit geodesic hemispheres with warm windows
    for (const [cx, by, rad] of domes) {
      for (let y = by - Math.ceil(rad / 2); y <= by; y++) for (let x = cx - rad; x <= cx + rad; x++) {
        const dx = (x - cx) / rad, dy = (by - y) / (rad * 0.5);
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const z = Math.sqrt(1 - d2);
        const l = clamp(dx * 0.6 + dy * 0.3 + z * 0.4);
        const facet = ((x - cx + 40) % 3 === 0) || ((y + x) % 4 === 0);
        g.set(x, y, facet ? (l > 0.5 ? "▓" : "▒") : l > 0.55 ? "█" : "▓", KEYS[DOME + clamp(Math.floor(l * 6) - (facet ? 1 : 0), 0, 5)]);
      }
      for (let x = cx - rad + 2; x <= cx + rad - 2; x += 3) {
        const on = Math.sin(t * 0.7 + x * 1.3) > -0.7;
        g.set(x, by, on ? "▪" : "·", KEYS[LIGHT + (on ? 0 : 1)]);
      }
      g.hline(cx - rad - 1, cx + rad + 1, by + 1, "▀", KEYS[DOME]);
    }
    // antenna mast with a blinking beacon and a dish
    for (let y = 14; y < 25; y++) g.set(86, y, y % 2 ? "╫" : "║", KEYS[DOME + 2]);
    g.set(86, 13, Math.sin(t * 3.5) > 0 ? "●" : "•", KEYS[LIGHT + 2]);
    g.text(83, 18, "◄█", KEYS[DOME + 4]);
    // rover: crosses the foreground and loops, leaving tracks
    const span = cols + 30, rx = ((t * 6 + 45) % span) - 15, ry = 31;
    for (let x = -15; x < Math.floor(rx) - 8; x++) if (x % 2 === 0) g.set(x, ry + 2, "=", KEYS[GROUND + 3]);
    const bob = Math.sin(t * 9) > 0.6 ? -1 : 0;
    g.text(rx - 7, ry - 1 + bob, "  ▄▄█▀▀█▄", KEYS[ROVER]);
    g.text(rx - 7, ry + bob, "▄████████▄", KEYS[ROVER]);
    g.set(rx + 2, ry - 1 + bob, "▪", KEYS[ROVER + 2]);
    g.set(rx + 3, ry + bob, "►", KEYS[LIGHT + 1]);
    g.set(rx + 4, ry + bob, "─", KEYS[LIGHT]);
    g.set(rx + 5, ry + bob, "─", KEYS[LIGHT]);
    const sp = Math.floor(t * 8) % 2;
    for (const wx of [-6, -3, 0]) g.text(rx + wx, ry + 1, sp ? "◆" : "◇", KEYS[ROVER + 1]);
    // dust kicked up behind it
    for (let i = 0; i < 6; i++) g.set(rx - 9 - i, ry + 1 - (i % 2), i < 3 ? "▒" : "░", KEYS[GROUND + 6]);
    return g.frame();
  };
}
