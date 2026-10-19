/* autumn-harvest: pumpkins and a hay bale before a swaying wheat field at sunset, leaves tumbling down. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#3a1a4a", "#7a2a4a", "#c84a3a", "#f08a3a", "#ffc860", "#fff0b0"], 12); // 0..11
const WHEAT = gradient(["#6a4a12", "#a8781e", "#d8a832", "#f4d060", "#fff0a0"], 6);        // 12..17
const LEAF = ["#c8281e", "#e8601a", "#f0a01e", "#8a3a14", "#ffd040"];                       // 18..22
const PUMP = gradient(["#5a1e04", "#a03a08", "#e0600e", "#ff8a24", "#ffb860"], 6);         // 23..28
const SOIL = gradient(["#1e1008", "#3a2010", "#5a3418", "#7a4a22"], 4);                      // 29..32
const NAMED = ["#2a1a10", "#4a2a14", "#3a5a1a", "#5a7a24", "#c8a050", "#e8c870", "#8a6a2a", "#2a0e1a"];
// 33 trunk dark, 34 trunk, 35 stem dark, 36 stem, 37 hay, 38 hay lit, 39 hay dark, 40 far trees
const pal = palette([...SKY, ...WHEAT, ...LEAF, ...PUMP, ...SOIL, ...NAMED]);

export const meta = {
  slug: "autumn-harvest",
  name: "Autumn Harvest",
  category: "occasions",
  note: "Pumpkins and a hay bale sit before a wheat field swaying in the sunset while autumn leaves tumble down.",
  tags: ["autumn", "fall", "harvest", "pumpkin", "thanksgiving", "wallpaper"],
  cols: 96, rows: 34, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const TUMBLE = "◆►▼◄▲";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(31);
  const HZ = 14, FIELD = 24;
  const leaves = Array.from({ length: 46 }, () => [r() * cols, r(), 0.05 + r() * 0.06, r() * 6.28, Math.floor(r() * 5)]);
  const pumpkins = [[30, 30, 6, 3], [44, 31, 9, 4], [58, 30, 5, 2.6], [14, 31, 4, 2.2]];
  return (t) => {
    g.clear();
    // sunset sky
    for (let y = 0; y < HZ + 2; y++) for (let x = 0; x < cols; x++) {
      const sun = Math.exp(-Math.hypot((x - 60) * 0.5, y - 12) / 4);
      const n = fbm(x * 0.04 + t * 0.03, y * 0.25, 3);
      const v = clamp(y / (HZ + 2) * 0.8 + (n - 0.5) * 0.25 + sun * 0.5);
      g.set(x, y, n > 0.6 ? "▓" : "█", KEYS[Math.min(11, Math.floor(v * 12))]);
    }
    for (let y = 8; y < HZ + 1; y++) for (let x = 52; x < 69; x++) if (Math.hypot((x - 60) * 0.5, y - 12) < 3.4) g.set(x, y, "█", KEYS[11]);
    // far tree line in autumn colours
    for (let x = 0; x < cols; x++) {
      const top = Math.round(HZ - 1 - 2.5 * fbm(x * 0.15, 1, 3));
      for (let y = top; y < HZ + 2; y++) {
        const n = fbm(x * 0.3, y * 0.6, 2);
        g.set(x, y, y === top ? "▄" : "█", n > 0.6 ? KEYS[18] : n > 0.45 ? KEYS[40] : KEYS[21]);
      }
    }
    // wheat field, swaying in waves
    for (let y = HZ + 1; y < FIELD + 2; y++) for (let x = 0; x < cols; x++) {
      const sway = Math.sin(x * 0.18 - t * 2 + y * 0.3) + 0.5 * Math.sin(x * 0.07 + t);
      const depth = (y - HZ) / (FIELD - HZ);
      const v = clamp(0.3 + depth * 0.25 + sway * 0.22 + (fbm(x * 0.2, y * 0.5, 2) - 0.5) * 0.25);
      const head = (x * 3 + y * 7) % 11 === 0;
      let ch = head ? (sway > 0.5 ? "╱" : sway < -0.5 ? "╲" : "│") : sway > 0.6 ? "▓" : "█";
      if (y === HZ + 1) ch = sway > 0 ? "▲" : "▄";
      g.set(x, y, ch, KEYS[12 + Math.min(5, Math.max(0, Math.floor(v * 6) + (head ? 2 : -1)))]);
    }
    // soil
    for (let y = FIELD + 2; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.2, y * 0.5, 2);
      g.set(x, y, SH[2 + Math.min(2, Math.floor(n * 3))], KEYS[29 + Math.min(3, Math.floor(n * 4))]);
    }
    // big tree on the right, shedding leaves
    for (let y = 10; y < rows; y++) for (let x = 84; x < 89; x++) g.set(x, y, x === 84 ? "▓" : "█", KEYS[x > 86 ? 33 : 34]);
    for (let y = 0; y < 16; y++) for (let x = 70; x < cols; x++) {
      const d = Math.hypot((x - 86) * 0.5, (y - 5) * 1.0);
      const n = fbm(x * 0.2 + t * 0.1, y * 0.35, 3);
      if (d + (n - 0.5) * 6 < 7.5) g.set(x, y, n > 0.55 ? "▓" : "█", KEYS[n > 0.62 ? 22 : n > 0.5 ? 20 : n > 0.4 ? 18 : 21]);
    }
    // hay bale
    for (let y = 25; y < 32; y++) for (let x = 66; x < 82; x++) {
      const end = x < 69;
      const tex = (x + y * 3) % 4 === 0;
      g.set(x, y, end ? (Math.hypot((x - 67) * 0.5, y - 28.5) < 1.2 ? "●" : "▓") : tex ? "≡" : "█", KEYS[end ? 39 : tex ? 38 : 37]);
    }
    // pumpkins, ribbed and lit from the sunset side
    for (const [cx, cy, rx, ry] of pumpkins) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const u = (x - cx) / rx, w = (y - cy) / ry;
        const d = Math.hypot(u, w);
        if (d >= 1) continue;
        const rib = Math.abs(Math.cos(Math.asin(clamp(u, -0.999, 0.999)) * (rx > 6 ? 3.5 : 2.5)));
        const v = clamp(Math.sqrt(1 - d * d) * 0.7 + rib * 0.3 + u * 0.15 - w * 0.1);
        g.set(x, y, rib < 0.22 ? "▓" : "█", KEYS[23 + Math.min(5, Math.floor(v * 6))]);
      }
      g.set(cx, Math.floor(cy - ry) - 1, "█", KEYS[36]); g.set(cx + 1, Math.floor(cy - ry) - 1, "▄", KEYS[35]);
    }
    // tumbling leaves
    for (const [x0, ph, sp, sw, c] of leaves) {
      const p = (t * sp + ph) % 1;
      const y = p * (rows + 2) - 1;
      const x = (x0 - p * 18 + Math.sin(t * 1.4 + sw) * 2.5 + cols * 2) % cols;
      g.set(x, y, TUMBLE[Math.floor(t * 4 + sw * 3) % 5], KEYS[18 + c]);
    }
    return g.frame();
  };
}
