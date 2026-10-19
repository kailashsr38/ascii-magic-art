/* heart-blood-flow: a beating four-chamber heart with oxygen-poor and oxygen-rich blood circulating through it. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#12060a", "#1c0a10", "#260e16", "#30121c"], 4));
add("musc", gradient(["#5a1420", "#7a1e2c", "#9a2a38", "#b83a46"], 4));
add("blue", gradient(["#1a2a6a", "#2a4498", "#3e62c4", "#6a8ae8"], 4));
add("red", gradient(["#7a0e1a", "#a8162a", "#d42a3a", "#ff5a5a"], 4));
add("cell", ["#9ab8ff", "#ffb0b0"]);
add("lung", gradient(["#5a2a40", "#8a4a62", "#b07088"], 3));
add("body", gradient(["#3a2a1a", "#5a4228", "#7a5a38"], 3));
add("valve", ["#f0e0c0"]);
add("ui", ["#ffffff", "#c8b8c0", "#7ee787", "#ffd166"]);

export const meta = {
  slug: "heart-blood-flow",
  name: "Heart Blood Flow",
  category: "science",
  note: "A four-chamber heart beats as oxygen-poor blood is pumped to the lungs and oxygen-rich blood returns to be pumped out to the body, every chamber and vessel labelled.",
  tags: ["heart", "anatomy", "biology", "circulation", "education", "science"],
  cols: 100, rows: 34, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const BEAT = 60 / 72;

/** Polyline with cumulative lengths, sampled by 0..1. */
function poly(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] - pts[i - 1][1]) * 2));
  const tot = L[L.length - 1];
  return (p) => {
    const d = clamp(p) * tot;
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
  };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.15, y * 0.3, 3, 4);
  // chambers: [cx, cy, rx, ry, kind (0 atrium, 1 ventricle), side (0 right/blue, 1 left/red)]
  const CH = [[39, 11, 9, 4, 0, 0], [61, 11, 9, 4, 0, 1], [41, 21, 10, 6, 1, 0], [59, 21, 10, 6, 1, 1]];
  const blue = poly([[30, 33], [30, 20], [33, 12], [40, 12], [42, 20], [44, 23], [46, 17], [46, 5], [40, 3], [24, 3]]);
  const blue2 = poly([[33, 0], [33, 8], [37, 11], [41, 18], [44, 23], [46, 17], [46, 5], [52, 3], [56, 3]]);
  const red = poly([[64, 3], [64, 8], [61, 11], [60, 19], [57, 23], [54, 17], [53, 7], [53, 1], [70, 1], [88, 1], [88, 31]]);
  const red2 = poly([[76, 3], [70, 9], [62, 12], [59, 20], [56, 23], [54, 17], [53, 7], [53, 1], [88, 1], [88, 31], [70, 31]]);
  const tube = (pts, co, w = 1) => {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
        for (let a = -w; a <= w; a++) {
          if (x0 === x1) g.set(x + a, y, Math.abs(a) === w ? "▐" : "█", co);
          else g.set(x, y + (a > 0 ? 0 : 0), "█", co), g.set(x, y + a * 0.6, "█", co);
        }
      }
    }
  };
  return (t) => {
    g.clear();
    const ph = fract(t / BEAT);
    const atria = Math.max(0, Math.sin(clamp(ph / 0.25) * Math.PI));
    const vent = Math.max(0, Math.sin(clamp((ph - 0.25) / 0.35) * Math.PI));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.55 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // lungs on top, body below
    for (let x = 18; x < 82; x++) for (let y = 0; y < 3; y++) {
      if (y === 2 && (x < 22 || x > 78)) continue;
      g.set(x, y, tex[x + y * cols] > 0.5 ? "▓" : "▒", K("lung", Math.min(2, Math.floor(tex[x] * 3))));
    }
    for (let x = 24; x < 92; x++) for (let y = 31; y < 34; y++) g.set(x, y, tex[x + y * cols] > 0.5 ? "▓" : "▒", K("body", Math.min(2, Math.floor(tex[x + y * cols] * 3))));
    // vessels
    tube([[30, 33], [30, 20], [33, 14]], K("blue", 1));
    tube([[33, 0], [33, 9]], K("blue", 1));
    tube([[46, 18], [46, 4], [24, 4]], K("blue", 2));
    tube([[46, 4], [56, 4]], K("blue", 2));
    tube([[64, 3], [64, 8]], K("red", 1));
    tube([[76, 3], [76, 6], [70, 9]], K("red", 1));
    tube([[53, 18], [53, 1], [88, 1], [88, 31], [70, 31]], K("red", 2));
    // heart muscle and chambers
    const sc = CH.map((c) => 1 - 0.14 * (c[4] ? vent : atria));
    for (let y = 4; y < 31; y++) for (let x = 26; x < 74; x++) {
      let wall = false, inside = -1, depth = 0;
      for (let i = 0; i < 4; i++) {
        const [cx, cy, rx, ry, kind] = CH[i];
        const dx = (x - cx) / (rx * sc[i]), dy = (y - cy) / (ry * sc[i]) + (kind && y > cy ? (x - 50) * 0 : 0);
        let q = dx * dx + dy * dy;
        if (kind && y > cy) q = dx * dx * (1 + (y - cy) * 0.1) + dy * dy;
        if (q < 1) { inside = i; depth = 1 - q; }
        else if (q < 1.75) wall = true;
      }
      // apex
      const apex = y > 24 && Math.abs(x - 50) < (31 - y) * 3.2;
      if (inside >= 0) {
        const side = CH[inside][5], v = tex[x + y * cols];
        g.set(x, y, v > 0.5 ? "▓" : "▒", K(side ? "red" : "blue", Math.min(3, Math.floor(depth * 2 + v * 2))));
      } else if (wall || apex) g.set(x, y, "█", K("musc", Math.min(3, Math.floor(tex[x + y * cols] * 3 + (x < 50 ? 0 : 1)))));
    }
    // septum
    for (let y = 8; y < 28; y++) g.set(50, y, "█", K("musc", 3));
    // valves open and close with the beat
    const avOpen = atria > 0.1 || ph > 0.85;
    for (const vx of [40, 60]) g.text(vx - 2, 15, avOpen ? "▘  ▝" : "▀▀▀▀", K("valve"));
    g.text(45, 17, vent > 0.1 ? "▘▝" : "▀▀", K("valve"));
    g.text(52, 17, vent > 0.1 ? "▘▝" : "▀▀", K("valve"));
    // blood cells
    const speed = (p) => p + 0.04 * Math.sin(t * TAU / BEAT);
    for (let k = 0; k < 14; k++) {
      const p = fract(t * 0.07 + k / 14);
      const [bx, by] = (k & 1 ? blue : blue2)(speed(p));
      g.set(bx, by, "●", K("cell", 0));
      const [rx2, ry2] = (k & 1 ? red : red2)(speed(fract(p + 0.03)));
      g.set(rx2, ry2, "●", K("cell", 1));
    }
    // labels
    g.text(33, 8, "RIGHT ATRIUM", K("ui", 0));
    g.text(56, 8, "LEFT ATRIUM", K("ui", 0));
    g.text(34, 21, "RIGHT", K("ui", 0)); g.text(34, 22, "VENTRICLE", K("ui", 0));
    g.text(56, 21, "LEFT", K("ui", 0)); g.text(56, 22, "VENTRICLE", K("ui", 0));
    g.text(1, 3, "TO THE LUNGS ←", K("ui", 0));
    g.text(1, 5, "pulmonary artery", K("ui", 1));
    g.text(78, 5, "← FROM LUNGS", K("ui", 0));
    g.text(78, 6, "pulmonary vein", K("ui", 1));
    g.text(56, 1, "AORTA", K("ui", 0));
    g.text(90, 15, "TO", K("ui", 0)); g.text(90, 16, "BODY", K("ui", 0)); g.text(90, 17, "↓", K("ui", 0));
    g.text(1, 30, "FROM BODY ↑", K("ui", 0));
    g.text(1, 31, "vena cava", K("ui", 1));
    g.text(1, 12, "● oxygen-poor", K("cell", 0));
    g.text(1, 13, "● oxygen-rich", K("cell", 1));
    g.text(1, 17, "72 BPM", K("ui", 3));
    g.text(1, 18, vent > 0.05 ? "ventricles squeeze" : atria > 0.05 ? "atria squeeze     " : "chambers refill   ", K("ui", 2));
    g.text(1, 24, "front view:", K("ui", 1));
    g.text(1, 25, "the body's right", K("ui", 1));
    g.text(1, 26, "is on your left", K("ui", 1));
    g.text(82, 33, "BODY", K("ui", 0));
    g.text(44, 0, "LUNGS", K("ui", 0));
    return g.frame();
  };
}
