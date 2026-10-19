/* water-cycle-diagram: evaporation, condensation, precipitation, runoff and groundwater, all moving and labelled. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#0b2a5a", "#1a4f8f", "#3a7cc0", "#78b0de", "#b4d8f0"], 8));
add("sea", gradient(["#0a3a6a", "#0f5590", "#1c74b4", "#3a98d4", "#8ccff0"], 6));
add("land", gradient(["#2e6a2a", "#4a8a34", "#6aa840", "#8a8a5a"], 4));
add("rock", ["#6a6a72", "#8e8e96", "#eef4ff"]);
add("soil", gradient(["#3a2614", "#5a3a1e", "#7a5430", "#94703e"], 4));
add("gw", ["#2a6aa8", "#5ab0f0"]);
add("sun", ["#ffb52e", "#ffe680", "#fff6c8"]);
add("cloud", ["#9aa8ba", "#d6dee8", "#ffffff"]);
add("vap", ["#d0ecff", "#ffffff"]);
add("rain", ["#7cc8ff", "#cfeaff"]);
add("tree", ["#1e5a26", "#3a8a3a"]);
add("ui", ["#ffffff", "#ffe066", "#0a1428"]);

export const meta = {
  slug: "water-cycle-diagram",
  name: "Water Cycle Diagram",
  category: "science",
  note: "Water evaporates from the sea, condenses into a cloud, rains on the mountains and runs back to the sea above and below ground, with every stage labelled.",
  tags: ["water-cycle", "weather", "earth-science", "education", "science", "classroom"],
  cols: 100, rows: 34, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const SEA = 22;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const surf = new Float32Array(cols);
  for (let x = 0; x < cols; x++) {
    const u = (x - 82) / 17;
    surf[x] = x < 41 ? 99 : Math.round(SEA - 16 * Math.exp(-u * u) - 2.2 * fbm(x * 0.15, 0, 2, 3) + (x < 45 ? 1 : 0));
  }
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.12, y * 0.25, 3, 7);
  const r = rng(5);
  const vap = Array.from({ length: 26 }, (_, i) => [5 + i * 1.3, r(), r() * 6]);
  const drops = Array.from({ length: 34 }, () => [r(), r(), 0.8 + r() * 0.5]);
  const trees = [48, 51, 53, 56, 59, 62];
  const label = (x, y, s, co = K("ui", 0)) => g.text(x, y, s, co);
  return (t) => {
    g.clear();
    // sky
    for (let y = 0; y < SEA; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.55 ? "▒" : "░", K("sky", Math.min(7, Math.floor((y / SEA) * 6 + v * 2))));
    }
    // sun
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7, (y - 3) * 2);
      if (d < 4.2) g.set(x, y, "█", K("sun", d < 2.4 ? 2 : 1));
      else if (d < 6.5 && (Math.round(Math.atan2(y - 3, x - 7) * 2.5 + t * 0.5) & 1)) g.set(x, y, "·", K("sun", 0));
    }
    // sea
    for (let y = SEA; y < rows; y++) for (let x = 0; x < 46; x++) {
      if (x >= 41 && y >= surf[x]) continue;
      const w = Math.sin(x * 0.5 - t * 2 + y * 0.8) + Math.sin(x * 0.23 + t * 1.3);
      const d = (y - SEA) / (rows - SEA);
      g.set(x, y, y === SEA ? (w > 0.6 ? "▀" : "▄") : w > 0.8 ? "▒" : "▓", K("sea", clamp(Math.floor(5 - d * 5 + (y === SEA ? 1 : 0)), 0, 5)));
    }
    // land, rock, snow, soil
    for (let x = 41; x < cols; x++) {
      const s = surf[x];
      for (let y = Math.max(0, s); y < rows; y++) {
        const v = tex[x + y * cols], dep = y - s;
        if (dep === 0) g.set(x, y, s < 9 ? "█" : s < 14 ? "▓" : "█", s < 9 ? K("rock", 2) : s < 14 ? K("rock", 1) : K("land", Math.min(3, Math.floor(v * 4))));
        else if (dep < 3 && s >= 14) g.set(x, y, v > 0.5 ? "▓" : "▒", K("land", dep === 1 ? 1 : 0));
        else if (y >= 27 && y <= 29) g.set(x, y, v > 0.5 ? "▒" : "░", K("gw", 0));
        else g.set(x, y, v > 0.55 ? "▓" : "▒", y < 20 ? K("rock", v > 0.5 ? 1 : 0) : K("soil", Math.min(3, Math.floor(v * 4))));
      }
    }
    // trees and transpiration
    for (const tx of trees) {
      const s = surf[tx];
      g.set(tx, s - 1, "▲", K("tree", 1)); g.set(tx, s, "█", K("tree", 0));
      const p = fract(t * 0.35 + tx * 0.37);
      g.set(tx, s - 2 - Math.floor(p * 4), p < 0.5 ? "°" : "·", K("vap", 0));
    }
    // evaporation
    for (const [x0, ph, w] of vap) {
      const p = fract(t * 0.18 + ph);
      const x = x0 + p * 22 + Math.sin(p * 9 + w) * 1.2, y = SEA - 1 - p * 15;
      if (y < 7) continue;
      g.set(x, y, p < 0.35 ? "~" : p < 0.7 ? "°" : "·", K("vap", p < 0.5 ? 1 : 0));
    }
    // cloud
    const ccx = 63 + 2.5 * Math.sin(t * 0.25);
    for (let y = 1; y < 10; y++) for (let x = 44; x < 84; x++) {
      const dx = x - ccx, dy = (y - 5) * 2.4;
      const b = 1 - Math.hypot(dx / 15, dy / 8) + 0.35 * (fbm(x * 0.2 - t * 0.3, y * 0.4, 2, 4) - 0.5);
      if (b > 0) g.set(x, y, b > 0.3 ? "█" : b > 0.15 ? "▓" : "▒", K("cloud", y > 6 ? 0 : b > 0.3 ? 2 : 1));
    }
    // rain
    for (const [rx, ph, sp] of drops) {
      const x = Math.round(ccx - 10 + rx * 20), top = 9, bot = surf[x] - 1;
      const y = top + fract(t * sp + ph) * (bot - top);
      g.set(x, y, "│", K("rain", 1));
      g.set(x, y - 1, "╎", K("rain", 0));
    }
    // runoff river and infiltration
    for (let x = 44; x < 76; x++) g.set(x, surf[x] - 0, "▄", K("sea", 3));
    for (let k = 0; k < 8; k++) {
      const x = Math.round(76 - fract(t * 0.12 + k / 8) * 32);
      g.set(x, surf[x], "◄", K("vap", 1));
    }
    for (let k = 0; k < 5; k++) {
      const x = 58 + k * 4, y = 22 + Math.floor(fract(t * 0.4 + k * 0.3) * 5);
      g.set(x, Math.max(surf[x] + 1, y), "↓", K("gw", 1));
    }
    for (let k = 0; k < 10; k++) g.set(Math.round(96 - fract(t * 0.08 + k / 10) * 52), 28, "←", K("gw", 1));
    // labels
    label(80, 0, "THE WATER CYCLE", K("ui", 1));
    label(17, 12, "EVAPORATION ↑");
    label(46, 0, "CONDENSATION");
    label(85, 3, "PRECIPITATION");
    label(30, 16, "TRANSPIRATION →");
    label(58, 21, "RUNOFF ←");
    label(67, 24, "INFILTRATION", K("ui", 0));
    label(14, 27, "COLLECTION", K("ui", 0));
    label(56, 31, "GROUNDWATER FLOW", K("ui", 0));
    return g.frame();
  };
}
