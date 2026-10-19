/* train-at-dusk: a lit passenger train crossing a stone viaduct over a misty valley at dusk. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#141a40", "#2e2e6a", "#6a3a7a", "#c45a6a", "#f2945a", "#ffcf7a"], 16));
const HILL = add(["#3a2e5a", "#2a2448", "#1c1a36", "#121226"]);
const STONE = add(gradient(["#1a1424", "#2e2236", "#4a3646", "#6a4e5a"], 5));
const TRAIN = add(["#0c0c16", "#1a1a2a", "#ffd27a", "#fff2c0", "#ff5a3a", "#fffbe8"]);
const MIST = add(["#6a5a8a", "#9a86aa"]);
const RIVER = add(gradient(["#0e1030", "#2a2a5a", "#c47a6a", "#ffc07a"], 5));

export const meta = {
  slug: "train-at-dusk",
  name: "Train at Dusk",
  category: "landscapes",
  note: "A passenger train with glowing windows crosses a stone viaduct over a misty valley at dusk.",
  tags: ["train", "dusk", "bridge", "travel", "wallpaper", "hero"],
  cols: 104, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const deck = 19;
  const hills = [0, 1, 2].map((i) => Array.from({ length: cols }, (_, x) => 13 + i * 4 + Math.round(fbm(x * (0.03 + i * 0.015), i * 5, 3, 2 + i) * (7 - i) - 3)));
  const span = 13, pierW = 3;
  return (t) => {
    g.clear();
    // dusk sky
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.025 + t * 0.03, y * 0.3, 3, 7);
      const v = clamp(y / 20 + (c - 0.5) * 0.3 + Math.exp(-(((x - 80) / 30) ** 2)) * 0.1);
      g.set(x, y, c > 0.62 ? "▓" : v > 0.75 ? "█" : "▒", KEYS[SKY + clamp(Math.floor(v * 16), 0, 15)]);
    }
    g.set(18, 3, Math.sin(t * 1.3) > -0.5 ? "*" : "·", KEYS[TRAIN + 5]);
    // layered hills receding into haze
    hills.forEach((h, i) => {
      for (let x = 0; x < cols; x++) for (let y = h[x]; y < rows; y++) g.set(x, y, y === h[x] ? "▄" : "█", KEYS[HILL + i]);
    });
    // valley floor: a river catching the last light, and a band of mist
    for (let y = 29; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = fbm(x * 0.08 - t * 0.3, y * 0.6, 2, 9);
      const glow = Math.exp(-(((x - 80) / 25) ** 2));
      const v = clamp(0.25 + (w - 0.5) * 0.6 + glow * 0.4 * (w > 0.5 ? 1 : 0.3));
      g.set(x, y, w > 0.6 ? "≈" : v > 0.45 ? "▓" : "▒", KEYS[RIVER + clamp(Math.floor(v * 5), 0, 4)]);
    }
    for (let y = 24; y < 31; y++) for (let x = 0; x < cols; x++) {
      const m = fbm(x * 0.06 + t * 0.15, y * 0.4, 3, 21) * Math.exp(-(((y - 27) / 3) ** 2));
      if (m > 0.42) g.set(x, y, m > 0.55 ? "▒" : "░", KEYS[MIST + (m > 0.55 ? 1 : 0)]);
    }
    // the viaduct: deck, parapet and arches on piers
    for (let y = deck; y < rows; y++) for (let x = 0; x < cols; x++) {
      const lx = ((x + 4) % span);
      const inPier = lx < pierW;
      const ac = pierW + (span - pierW) / 2, hw = (span - pierW) / 2;
      const u = (lx - ac) / hw;
      const crown = deck + 3;
      const archTop = crown + (1 - Math.sqrt(Math.max(0, 1 - u * u))) * 4;
      const open = !inPier && y > archTop;
      if (open) continue;
      const brick = (y + (Math.floor(x / 2) % 2)) % 2 === 0;
      const edge = !inPier && y < archTop + 1 && y >= archTop - 0.5;
      const v = y <= deck + 1 ? 3 : edge ? 3 : inPier && lx === 0 ? 3 : brick ? 1 : 2;
      g.set(x, y, y === deck ? "▀" : edge ? "▄" : brick ? "▓" : "█", KEYS[STONE + v]);
    }
    for (let x = 0; x < cols; x++) g.set(x, deck - 1, x % 3 === 0 ? "╥" : "─", KEYS[STONE + 2]);
    // the train: a locomotive and lit carriages, looping across
    const cars = 6, carW = 14, len = cars * carW + 12;
    const tx = Math.round(((t * 9 + 75) % (cols + len + 10)) - len);
    const ty = deck - 4;
    for (let c = 0; c < cars; c++) {
      const x0 = tx + c * carW;
      for (let x = x0; x < x0 + carW - 1; x++) {
        g.set(x, ty, "▄", KEYS[TRAIN + 1]);
        const lx = x - x0;
        const win = lx >= 2 && lx <= carW - 4 && lx % 3 !== 1;
        const flick = Math.sin(t * 0.5 + c * 1.7 + lx) > -0.9;
        g.set(x, ty + 1, "█", KEYS[win && flick ? TRAIN + 2 + ((c + lx) % 5 === 0 ? 1 : 0) : TRAIN + 1]);
        g.set(x, ty + 2, lx % 4 === 1 ? "o" : "▀", KEYS[TRAIN]);
      }
      g.set(x0 + carW - 1, ty + 1, "═", KEYS[TRAIN]);
    }
    const lx0 = tx + cars * carW;
    g.text(lx0, ty - 1, "    ▄▄", KEYS[TRAIN]);
    g.text(lx0, ty, "▄▄▄▄██▄▄▄", KEYS[TRAIN + 1]);
    g.text(lx0, ty + 1, "█████████▙", KEYS[TRAIN + 1]);
    g.set(lx0 + 6, ty + 1, "▪", KEYS[TRAIN + 2]);
    g.text(lx0, ty + 2, "▀o▀▀o▀▀o▀▀", KEYS[TRAIN]);
    g.set(lx0 + 10, ty + 1, "●", KEYS[TRAIN + 5]);
    for (let i = 0; i < 8; i++) g.set(lx0 + 11 + i, ty + 1, i < 3 ? "═" : "─", KEYS[TRAIN + (i < 4 ? 3 : 2)]);
    g.set(lx0 + 1, ty - 1, Math.sin(t * 6) > 0 ? "•" : "·", KEYS[TRAIN + 4]);
    // window light spilling onto the parapet
    for (let x = Math.max(0, tx); x < Math.min(cols, lx0); x++) if ((x - tx) % 3 !== 1) g.set(x, deck - 1, "─", KEYS[TRAIN + 2]);
    return g.frame();
  };
}
