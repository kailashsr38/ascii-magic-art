/* snowy-cabin: a log cabin in snowy woods at dusk, warm window, chimney smoke and falling snow. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#121638", "#2c2c62", "#5a4280", "#a8608a", "#f0967a"], 10));
const SNOW = grp(gradient(["#3a4878", "#6a7cb0", "#a8b8e0", "#e4ecff"], 8));
const WARM = grp(gradient(["#a8708a", "#e8a070", "#ffd08a"], 4));
const PINE = grp(["#07121a", "#10242a", "#1c3a38"]);
const LOG = grp(gradient(["#2a140c", "#4a2614", "#6e3a1c", "#8a5028"], 5));
const ROOF = grp(["#22141a", "#3a2024"]);
const WIN = grp(gradient(["#d87a20", "#ffb040", "#ffe08a"], 4));
const STONE = grp(["#3a3a48", "#5a5a6a"]);
const SMOKE = grp(gradient(["#5a5878", "#8a86a8", "#b8b4cc"], 5));
const FLAKE = grp(["#c8d4f0", "#ffffff"]);

export const meta = {
  slug: "snowy-cabin",
  name: "Snowy Cabin",
  category: "landscapes",
  note: "A log cabin glows in snowy woods at dusk while chimney smoke curls up and snow keeps falling.",
  tags: ["winter", "snow", "cabin", "cozy", "christmas", "wallpaper"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const GROUND = 20;

function pine(g, px, base, h, shade) {
  for (let j = 0; j < h; j++) {
    const y = base - j, rel = (h - j) / h;
    const half = Math.floor(rel * h * 0.42 * (0.75 + 0.25 * ((h - j) % 3) / 2));
    for (let i = -half; i <= half; i++) {
      const snowy = ((h - j) % 3 === 0 && i < half - 1) || j === h - 1;
      g.set(px + i, y, snowy ? "▓" : "█", snowy ? SNOW(0.55 + shade * 0.3) : PINE(i < 0 ? 0 : 1));
    }
  }
  g.set(px, base + 1, "█", LOG(0)); g.set(px, base, "█", LOG(0));
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(17);
  const stars = Array.from({ length: 25 }, () => [Math.floor(r() * cols), Math.floor(r() * 7), r() * TAU]);
  const backPines = [];
  for (let x = 1; x < cols; x += 3 + Math.floor(r() * 4)) if (x < 30 || x > 66) backPines.push([x, 4 + Math.floor(r() * 4)]);
  const flakes = Array.from({ length: 150 }, () => [r() * cols, r() * rows, 1.5 + r() * 2.5, r() * TAU, r() < 0.35 ? 1 : 0]);
  const CX0 = 34, CX1 = 62, WALL = 23, FLOOR = 31;
  const winX = 39, winW = 8, winY = 25, doorX = 51;

  return (t) => {
    g.clear();
    const flick = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 2.3);
    // dusk sky
    for (let y = 0; y < GROUND; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(Math.pow(y / GROUND, 1.3) + (fbm(x * 0.04 - t * 0.03, y * 0.25, 3, 2) - 0.5) * 0.3);
      g.set(x, y, v > 0.35 ? "█" : "▓", SKY(v));
    }
    for (const [x, y, p] of stars) if (Math.sin(t * 1.5 + p) > -0.2) g.set(x, y, "·", FLAKE(1));
    // far snowy hill line
    for (let x = 0; x < cols; x++) {
      const top = GROUND - 3 - 3 * fbm(x * 0.05, 1, 3, 8);
      for (let y = Math.ceil(top); y < GROUND; y++) g.set(x, y, "█", SNOW(0.35 + (y - top) * 0.06));
    }
    for (const [x, h] of backPines) pine(g, x, GROUND, h, 0.2);
    // snowy ground with a warm pool of light under the window
    for (let y = GROUND; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.08, y * 0.3, 3, 4);
      const spill = Math.exp(-(((x - winX - winW / 2) / 10) ** 2) - ((y - 33) / 3) ** 2) * flick;
      if (spill > 0.3 && y > FLOOR) g.set(x, y, spill > 0.6 ? "█" : "▓", WARM(spill));
      else g.set(x, y, n > 0.55 ? "▓" : "█", SNOW(clamp(0.45 + (y - GROUND) * 0.03 + (n - 0.5) * 0.7)));
    }
    // cabin walls of stacked logs
    for (let y = WALL; y <= FLOOR; y++) for (let x = CX0; x <= CX1; x++) {
      const end = x === CX0 || x === CX1;
      const v = ((y - WALL) % 2 ? 0.3 : 0.65) + noise2(x * 0.4, y, 5) * 0.3;
      g.set(x, y, end ? "●" : (y - WALL) % 2 ? "═" : "█", LOG(end ? 0.9 : v));
    }
    // roof with a thick snow load
    for (let j = 0; j < 8; j++) {
      const y = WALL - 1 - j, inset = j * 2;
      for (let x = CX0 - 3 + inset; x <= CX1 + 3 - inset; x++) {
        const snowDepth = j >= 5 || x < CX0 - 1 + inset || x > CX1 + 1 - inset || j === 0;
        if (j === 0) g.set(x, y, "▀", ROOF(1));
        else g.set(x, y, snowDepth || noise2(x * 0.5, j, 3) > 0.35 ? "█" : "▓", snowDepth || noise2(x * 0.5, j, 3) > 0.35 ? SNOW(0.7 + j * 0.04) : ROOF(0));
      }
    }
    // icicles along the eave
    for (let x = CX0 - 2; x <= CX1 + 2; x += 3) g.set(x, WALL, "▼", SNOW(0.9));
    // chimney
    for (let y = WALL - 9; y < WALL - 3; y++) for (let x = 55; x <= 57; x++) g.set(x, y, (x + y) % 2 ? "▓" : "█", STONE((x + y) % 2));
    g.text(55, WALL - 10, "▄▄▄", SNOW(1));
    // window and door
    for (let y = winY; y < winY + 4; y++) for (let x = winX; x < winX + winW; x++) {
      const bar = x === winX + winW / 2 || y === winY + 2;
      g.set(x, y, bar ? (x === winX + winW / 2 && y === winY + 2 ? "┼" : x === winX + winW / 2 ? "│" : "─") : "█", bar ? LOG(0) : WIN(clamp(flick * 0.8 + noise2(x, y + t * 3, 2) * 0.3)));
    }
    for (let y = winY - 1; y < FLOOR + 1; y++) for (let x = doorX; x < doorX + 6; x++) g.set(x, y, x === doorX + 4 && y === winY + 3 ? "•" : "▓", x === doorX + 4 && y === winY + 3 ? WIN(1) : LOG(0.1));
    // smoke drifting from the chimney
    for (let y = 0; y < WALL - 10; y++) {
      const up = WALL - 11 - y, cx = 56 + up * 0.9 + Math.sin(t * 0.8 + y * 0.4) * (0.5 + up * 0.15), w = 1 + up * 0.35;
      for (let x = Math.floor(cx - w * 2); x <= cx + w * 2; x++) {
        const n = fbm(x * 0.2 - t * 0.3, y * 0.4 + t * 0.9, 3, 9);
        const dd = n * 1.2 - Math.abs(x - cx) / (w * 2) - up * 0.025;
        if (dd > 0.1) g.set(x, y, sh(0.3 + dd * 1.5), SMOKE(clamp(dd * 1.4)));
      }
    }
    // foreground pines frame the cabin
    pine(g, 6, rows - 3, 22, 0.4); pine(g, 18, rows - 1, 15, 0.3); pine(g, 86, rows - 2, 24, 0.4); pine(g, 74, rows - 4, 13, 0.3);
    // snowfall
    for (const [x0, y0, sp, ph, big] of flakes) {
      const y = (y0 + t * sp) % rows;
      const x = (((x0 + Math.sin(t * 0.9 + ph) * 1.5 + t * 0.6) % cols) + cols) % cols;
      g.set(x, y, big ? "●" : "•", FLAKE(big));
    }
    return g.frame();
  };
}
