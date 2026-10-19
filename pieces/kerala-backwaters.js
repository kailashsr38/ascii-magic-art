/* kerala-backwaters: a thatched houseboat gliding along palm-lined backwaters. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#3a78b8", "#78aad8", "#c8dce4", "#f8e4b0"], 10));
const FAR = grp(["#123018", "#1e4a24", "#2e6a30"]);
const WATER = grp(gradient(["#0e2e2a", "#1e4e44", "#3a7a68", "#7aaea0", "#c8dcc8"], 12));
const LEAF = grp(gradient(["#0a3214", "#1a5a22", "#3a8a2e", "#7cc048"], 6));
const TRUNK = grp(["#3a2a1a", "#6a5030"]);
const STRAW = grp(gradient(["#8a5a20", "#c08a38", "#e8b860", "#ffe09a"], 6));
const WOOD = grp(["#1e0e06", "#3e2010", "#6a3a1a"]);
const WIN = grp(["#120a06", "#ffc860"]);
const BANK = grp(["#1a3a14", "#2e5a1e", "#4a7a2a"]);
const FOAM = grp(["#a8c8c0", "#e8f4f0"]);

export const meta = {
  slug: "kerala-backwaters",
  name: "Kerala Backwaters",
  category: "landscapes",
  note: "A thatched houseboat glides along calm green backwaters lined with leaning coconut palms.",
  tags: ["india", "river", "boat", "palms", "tropical", "wallpaper"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

const HZ = 13;
const BOAT = [
  "     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄       ",
  "   ▄███████████████████▄     ",
  " ▄██▓█▓█▓█▓█▓█▓█▓█▓█▓███▄    ",
  "▐█ ▪ █ ▪ █ ▪ █ ▪ █ ▪ █ ▪ ██▌  ",
  "▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀",
];

function palm(g, bx, by, lean, h, ph, t) {
  const sway = Math.sin(t * 1.1 + ph) * 0.5;
  let tx = bx, ty = by;
  for (let j = 0; j < h; j++) {
    const f = j / h;
    tx = bx + lean * j * (0.6 + f) + f * f * sway; ty = by - j * 0.8;
    g.set(tx, ty, "█", TRUNK(j % 2)); g.set(tx + Math.sign(lean), ty, "▓", TRUNK(0));
  }
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + 0.3 + Math.sin(t * 1.4 + k + ph) * 0.07;
    const len = 8 + (k % 3);
    for (let s = 1; s <= len; s++) {
      const fx = tx + Math.cos(a) * s * 1.7 + sway * s * 0.08, fy = ty + Math.sin(a) * s * 0.45 + 0.04 * s * s;
      g.set(fx, fy, "█", LEAF(clamp(0.2 + (1 - s / len) * 0.5 + (Math.sin(a) < 0 ? 0.3 : 0))));
      if (s > 2 && s < len - 1) g.set(fx, fy + 1, "▓", LEAF(0.15));
    }
  }
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(8);
  const farTop = Float32Array.from({ length: cols }, (_, x) => HZ - 2 - 2.5 * fbm(x * 0.12, 1, 3, 4));
  const crowns = Array.from({ length: 14 }, () => [Math.floor(r() * cols), HZ - 5 - Math.floor(r() * 3)]);
  const weeds = Array.from({ length: 14 }, () => [r() * 140, HZ + 4 + r() * 18, 0.5 + r()]);

  return (t) => {
    g.clear();
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / HZ * 0.9 + (fbm(x * 0.04 - t * 0.03, y * 0.3, 3, 2) - 0.5) * 0.3);
      g.set(x, y, v > 0.4 ? "█" : "▓", SKY(v));
    }
    // far bank: a dense wall of palms
    for (let x = 0; x < cols; x++) for (let y = Math.ceil(farTop[x]); y <= HZ; y++) g.set(x, y, noise2(x * 0.5, y, 2) > 0.6 ? "▓" : "█", FAR(y === Math.ceil(farTop[x]) ? 2 : 1));
    for (const [cx, cy] of crowns) {
      for (let j = cy; j < farTop[cx]; j++) g.set(cx, j, "│", TRUNK(0));
      g.text(cx - 2, cy, "╲▄█▄╱", FAR(2)); g.text(cx - 3, cy + 1, "╱ ", FAR(1)); g.text(cx + 2, cy + 1, " ╲", FAR(1));
    }
    // water: reflections of the bank and sky, slow ripples
    for (let y = HZ + 1; y < rows; y++) {
      const d = (y - HZ) / (rows - HZ);
      for (let x = 0; x < cols; x++) {
        const w = fbm(x * 0.06 + t * 0.08, y * 0.7, 3, 6);
        const rip = Math.sin(x * 0.25 + y * 1.6 - t * 1.2 + w * 3);
        let v;
        if (y < HZ + 5) v = clamp(0.1 + (w - 0.5) * 0.4 + (y - HZ) * 0.03);
        else v = clamp(0.35 + d * 0.35 + (w - 0.5) * 0.5);
        g.set(x, y, rip > 0.85 ? "▀" : w > 0.6 ? "▓" : "█", WATER(rip > 0.85 ? v + 0.25 : v));
      }
    }
    for (const [p, wy, sp] of weeds) {
      const wx = ((p + t * sp * 0.6) % 140) - 20;
      g.text(wx, wy, "▄█▄", LEAF(0.5)); g.set(wx + 1, wy - 1, "•", LEAF(0.9));
    }
    // the houseboat
    const bx = ((t * 3.2 + 46) % (cols + 40)) - 34, by = 25;
    for (let k = 0; k < 18; k++) {
      const wx = bx - 2 - k * 1.6, wy = by + 4 + (k % 2 ? 0.6 : -0.3) * (k / 6);
      g.set(wx, wy, "≈", FOAM(k < 6 ? 1 : 0)); g.set(wx, wy + k / 7 + 1, "~", FOAM(0));
    }
    BOAT.forEach((line, j) => {
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === " " && !(j === 3 && i > 0 && i < 26)) continue;
        let col;
        if (j <= 2) col = ch === "▓" ? STRAW(0.3) : STRAW(clamp(0.5 + (2 - j) * 0.2 - i * 0.01));
        else if (j === 3) col = ch === "▪" ? WIN((Math.floor(t * 0.5) + i) % 3 === 0 ? 1 : 0) : ch === " " ? WOOD(0) : WOOD(2);
        else col = WOOD(1);
        g.set(bx + i, by + j, ch === " " ? "█" : ch, col);
      }
      // reflection of the hull
      if (j === 4) for (let i = 1; i < line.length - 1; i++) if (Math.sin(i * 0.9 + t * 3) > -0.3) g.set(bx + i, by + 5, "▒", WOOD(1));
    });
    // near banks with palms leaning over the water
    for (let x = 0; x < 18; x++) for (let y = Math.floor(33 - x * 0.35); y < rows; y++) g.set(x, y, "█", BANK(clamp(0.3 + noise2(x * 0.4, y, 7) * 0.7)));
    for (let x = 84; x < cols; x++) for (let y = Math.floor(33 - (x - 84) * 0.3); y < rows; y++) g.set(x, y, "█", BANK(clamp(0.3 + noise2(x * 0.4, y, 7) * 0.7)));
    palm(g, 3, 35, 0.45, 30, 0, t);
    palm(g, 13, 34, 0.8, 24, 2, t);
    palm(g, 96, 34, -0.6, 28, 4, t);
    return g.frame();
  };
}
