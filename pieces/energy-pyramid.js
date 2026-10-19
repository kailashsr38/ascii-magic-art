/* energy-pyramid: energy flowing up a food chain pyramid, with about 90 percent lost as heat at every step. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#070a10", "#0b1018", "#0f1620", "#131c28"], 4));
add("L0", gradient(["#1a4a1a", "#2a6a26", "#3a8a32", "#5aaa44"], 4));
add("L1", gradient(["#4a4a14", "#6a6a1e", "#8a8a2a", "#aaa838"], 4));
add("L2", gradient(["#5a3014", "#7a421c", "#9a5626", "#ba6a30"], 4));
add("L3", gradient(["#5a1420", "#7a1e2c", "#9a2a3a", "#ba3a48"], 4));
add("sun", ["#ffb52e", "#ffe680"]);
add("pk", ["#ffe680", "#ffffff"]);
add("heat", ["#ff6a3a", "#ffb08a"]);
add("ui", ["#ffffff", "#8b949e", "#0a0a0a", "#ffd166"]);

export const meta = {
  slug: "energy-pyramid",
  name: "Food Chain Energy Pyramid",
  category: "science",
  note: "Sunlight feeds the plants at the base of an energy pyramid and only about a tenth of the energy climbs to each level above, the rest drifting off as heat, with the kilojoules counted.",
  tags: ["ecology", "food-chain", "energy", "biology", "education", "science"],
  cols: 96, rows: 30, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const CX = 40;
const LV = [
  { y0: 21, y1: 26, name: "PRODUCERS", eg: "plants, algae", kj: "10,000 kJ" },
  { y0: 15, y1: 20, name: "PRIMARY CONSUMERS", eg: "herbivores: rabbit", kj: "1,000 kJ" },
  { y0: 9, y1: 14, name: "SECONDARY CONSUMERS", eg: "carnivores: fox", kj: "100 kJ" },
  { y0: 3, y1: 8, name: "TERTIARY", eg: "top predator: eagle", kj: "10 kJ" },
];
const halfW = (y) => 3 + (y - 2) * 1.32;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.12, y * 0.3, 3, 25);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.62 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // levels
    LV.forEach((L, i) => {
      for (let y = L.y0; y <= L.y1; y++) {
        const hw = halfW(y + 0.5);
        for (let x = Math.ceil(CX - hw); x <= CX + hw; x++) {
          const edge = x - (CX - hw) < 1 || CX + hw - x < 1 || y === L.y0;
          const v = tex[x + y * cols];
          g.set(x, y, edge ? "█" : v > 0.5 ? "▓" : "▒", K("L" + i, edge ? 3 : Math.min(2, Math.floor(v * 3))));
        }
      }
      g.text(CX + Math.ceil(halfW(L.y1)) + 3, L.y0 + 1, L.name, K("L" + i, 3));
      g.text(CX + Math.ceil(halfW(L.y1)) + 3, L.y0 + 2, L.eg, K("ui", 1));
      g.text(CX + Math.ceil(halfW(L.y1)) + 3, L.y0 + 3, "level " + (i + 1), K("ui", 1));
    });
    // energy packets: many start at the base, one in ten continues upward each level
    for (let k = 0; k < 40; k++) {
      const p = fract(t * 0.12 + k * 0.618);
      const climb = k % 10 === 0 ? (k % 100 === 0 ? 3 : 2) : k % 3 === 0 ? 1 : 0;
      // packet rises from the base through as many levels as it reaches, then leaves as heat
      const topY = LV[Math.min(3, climb)].y0 + 2;
      const yRise = 26 - p * 2 * (26 - topY);
      const x0 = CX - 10 + ((k * 7) % 21);
      if (p < 0.5) {
        const y = Math.max(topY, yRise);
        const lev = LV.findIndex((L) => y >= L.y0 && y <= L.y1);
        g.set(x0 * (1 - (lev > 0 ? lev * 0.2 : 0)) + CX * (lev > 0 ? lev * 0.2 : 0), y, "◆", K("pk", p > 0.4 ? 1 : 0));
      } else {
        const q = (p - 0.5) * 2, side = climb === 0 ? 1 : -1, reach = climb === 0 ? 5 : 10;
        const hx = CX + side * (halfW(topY) + 1 + q * reach), hy = topY - q * 3 + Math.sin(q * 9 + k) * 0.6;
        if (q < 0.9) g.set(hx, hy, q < 0.4 ? "~" : "°", K("heat", q < 0.5 ? 1 : 0));
      }
    }
    LV.forEach((L) => {
      const mid = Math.floor((L.y0 + L.y1) / 2);
      g.text(CX - Math.floor(L.kj.length / 2) - 1, mid, " " + L.kj + " ", K("ui", 0));
    });
    // sun feeding the producers
    for (let y = 24; y < 30; y++) for (let x = 0; x < 12; x++) {
      const d = Math.hypot(x - 4, (y - 27) * 2);
      if (d < 3.6) g.set(x, y, "█", K("sun", d < 2 ? 1 : 0));
    }
    for (let k = 0; k < 4; k++) g.set(9 + Math.floor(fract(t * 0.8 + k / 4) * 5), 26 - (k & 1), "→", K("sun", 1));
    g.text(1, 22, "SUNLIGHT", K("sun", 1));
    // labels
    g.text(1, 0, "ENERGY PYRAMID", K("ui", 0));
    g.text(1, 1, "the 10% rule", K("ui", 3));
    g.text(1, 6, "~ heat lost:", K("heat", 1));
    g.text(1, 7, "movement,", K("ui", 1));
    g.text(1, 8, "breathing,", K("ui", 1));
    g.text(1, 9, "waste, warmth", K("ui", 1));
    g.text(1, 12, "◆ energy", K("pk", 1));
    g.text(1, 13, "  passed up", K("ui", 1));
    g.text(16, 28, "only about 10% of the energy in one level is stored in the next", K("ui", 0));
    return g.frame();
  };
}
