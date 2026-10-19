/* cake-icing-turntable: a layer cake spins on a turntable as a spatula smooths pink icing round its side, then rosettes are piped along the top. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#7ac0b0", "#94d0c0", "#b0e0d2", "#ccefe4"], 5));
const TABLE = add(gradient(["#c89a6a", "#e0b88a", "#f2d4ac"], 3));
const STAND = add(["#a8b0b8", "#d8e0e8", "#ffffff", "#7a8490"]);
const SPONGE = add(gradient(["#a8641e", "#d0903a", "#ecbc66", "#f8dc96"], 5));
const ICING = add(gradient(["#d0507a", "#ee7a9e", "#ffa4c0", "#ffcadc", "#fff0f6"], 7));
const CREAM = add(["#f4e8dc", "#fffaf4", "#ffffff"]);
const BERRY = add(["#8a0a1a", "#e02a3a", "#ff7a7a"]);
const STEEL = add(["#6a7280", "#b4bcc8", "#f0f4f8"]);
const HANDLE = add(["#2a1a10", "#5a3a22"]);

export const meta = {
  slug: "cake-icing-turntable",
  name: "Cake Icing Turntable",
  category: "food",
  note: "A layer cake turns on a cake stand as a steel spatula smooths pink icing around its side, then cream rosettes and berries appear along the top.",
  tags: ["cake", "baking", "dessert", "birthday", "food", "loader"],
  cols: 66, rows: 36, fps: 24,
  palette: palette(P),
};

const PER = 15, W = 1.0;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = 16, topY = 12, ry = 3.4, baseY = 26, tableY = 32;
  const thS = 1.15;            // spatula angle on screen (front right)
  const T0 = 1.2;              // icing starts
  const NR = 14;               // rosettes
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const slideIn = p < 1 ? 1 - smooth(p) : 0, slideOut = p > 14 ? smooth(p - 14) : 0;
    const cx = Math.round(33 - slideIn * 50 + slideOut * 50);
    const rot = W * t;
    const cover = clamp(W * (p - T0) / TAU) * TAU;
    const lamS0 = thS - W * (t - (p - T0));            // spatula longitude when icing began
    const piping = p > 7.8 && p < 13;
    const nRos = p < 7.8 ? 0 : Math.min(NR, Math.floor((p - 7.8) / 0.35));
    const iced = (lam) => cover > 0 && ((((lamS0 - lam) % TAU) + TAU) % TAU) <= cover;
    // mint kitchen and a wooden table
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < tableY) {
        const v = clamp(0.35 + Math.exp(-Math.hypot((x - 33) / 30, (y - 12) / 14)) * 0.5 + (fbm(x * 0.06, y * 0.12, 2) - 0.5) * 0.25);
        g.set(x, y, v > 0.6 ? "█" : "▓", KEYS[WALL + Math.min(4, Math.floor(v * 5))]);
      } else g.set(x, y, y === tableY ? "▀" : "█", KEYS[TABLE + (y === tableY ? 2 : (x + y * 3) % 11 === 0 ? 0 : 1)]);
    }
    // turntable: pedestal and a spinning plate with tick marks
    for (let y = baseY + 2; y < tableY; y++) { const w = y === tableY - 1 ? 9 : 3; for (let x = cx - w; x <= cx + w; x++) g.set(x, y, "█", KEYS[STAND + (x < cx ? 1 : 0)]); }
    for (let y = baseY; y <= baseY + 2; y++) for (let x = cx - R - 4; x <= cx + R + 4; x++) {
      const u = (x - cx) / (R + 4);
      if (Math.abs(u) > 1) continue;
      const th = Math.asin(u), lam = th - rot;
      const tick = y === baseY + 1 && Math.abs(Math.sin(lam * 6)) < 0.18;
      g.set(x, y, "█", KEYS[tick ? STAND + 3 : STAND + (y === baseY + 2 ? 0 : u < 0 ? 2 : 1)]);
    }
    // cake side: sponge with crumb, pink icing where the spatula has passed
    for (let y = topY; y < baseY; y++) for (let x = cx - R; x <= cx + R; x++) {
      const u = (x - cx) / R;
      const th = Math.asin(clamp(u, -1, 1)), lam = th - rot;
      const below = y - topY > ry * Math.sqrt(Math.max(0, 1 - u * u)) - 0.5;
      if (!below) continue;
      const shade = Math.sqrt(1 - u * u) * 0.5 + 0.3 - u * 0.25;
      if (iced(lam)) {
        const streak = Math.sin(lam * 9 + y * 0.2) * 0.06;
        g.set(x, y, "█", KEYS[ICING + Math.min(6, Math.floor(clamp(shade + streak) * 7))]);
      } else {
        const layer = (y - topY) % 5 === 4;
        const crumb = Math.sin(lam * 23 + y * 3.1) > 0.7;
        g.set(x, y, "█", KEYS[layer ? CREAM : SPONGE + Math.min(4, Math.floor(clamp(shade + (crumb ? 0.25 : 0)) * 5))]);
      }
    }
    // iced top
    for (let y = Math.floor(topY - ry); y <= Math.ceil(topY + ry); y++) for (let x = cx - R; x <= cx + R; x++) {
      const e = ((x - cx) / R) ** 2 + ((y - topY) / ry) ** 2;
      if (e <= 1) g.set(x, y, "█", KEYS[ICING + (e > 0.75 ? 4 : 5 + (x < cx ? 1 : 0))]);
    }
    // rosettes piped round the rim, turning with the cake
    for (let k = 0; k < nRos; k++) {
      const lam = -k * (TAU / NR) + 0.4;
      const th = lam + rot;
      const s = Math.sin(th), c = Math.cos(th);
      const x = Math.round(cx + s * (R - 2)), y = Math.round(topY + c * (ry - 0.6));
      g.set(x, y - 1, "█", KEYS[CREAM + 2]); g.set(x - 1, y, "█", KEYS[CREAM + 1]); g.set(x, y, "█", KEYS[CREAM + 2]); g.set(x + 1, y, "█", KEYS[CREAM]);
      if (k % 2 === 0) g.set(x, y - 2, "█", KEYS[BERRY + (c > 0 ? 2 : 1)]);
    }
    // spatula pressed against the side
    if (p > T0 - 0.4 && p < 7.6) {
      const sx = Math.round(cx + Math.sin(thS) * R) + 1;
      for (let y = topY + 2; y < baseY; y++) g.set(sx, y, "█", KEYS[STEEL + (y % 3 === 0 ? 2 : 1)]);
      g.line(sx, topY + 2, sx + 8, topY - 7, "█", KEYS[STEEL + 0]);
      g.line(sx + 8, topY - 7, sx + 13, topY - 12, "█", KEYS[HANDLE + 1]);
      g.line(sx + 9, topY - 7, sx + 14, topY - 12, "▓", KEYS[HANDLE]);
    }
    // piping bag over the rim
    if (piping) {
      const lam = -Math.min(NR - 1, nRos) * (TAU / NR) + 0.4, th = lam + rot;
      const bx = Math.round(cx + Math.sin(th) * (R - 2)), by = Math.round(topY + Math.cos(th) * (ry - 0.6)) - 3;
      for (let j = 0; j < 8; j++) {
        const w = Math.floor(j / 2.2);
        for (let x = -w; x <= w; x++) g.set(bx + x + Math.floor(j * 0.6), by - j, "█", KEYS[j === 0 ? STEEL + 2 : CREAM + (x < 0 ? 2 : 0)]);
      }
    }
    return g.frame();
  };
}
