/* lungs-breathing: two lungs inflating and deflating as the diaphragm moves, air flowing in and out of the trachea. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#0e0a12", "#160f1c", "#1e1426", "#261a30"], 4));
add("lung", gradient(["#5a1e34", "#7e2c48", "#a23e5c", "#c45a72", "#e2808e", "#f6b0b4"], 8));
add("air", ["#7ad8ff", "#c8f0ff"]);
add("co2", ["#9a9aa8", "#d0d0dc"]);
add("tube", ["#d8c8b8", "#f4ece0", "#a89888"]);
add("dia", gradient(["#6a1a1a", "#9a2e26", "#c2483a"], 3));
add("rib", ["#3a3040", "#5a4a5e"]);
add("ui", ["#ffffff", "#9a8ea4", "#7ee787", "#ffd166"]);

export const meta = {
  slug: "lungs-breathing",
  name: "Breathing Lungs",
  category: "science",
  note: "The diaphragm pulls down and the lungs swell as fresh air rushes in through the trachea, then it relaxes and stale air is pushed back out, with every part labelled.",
  tags: ["lungs", "breathing", "anatomy", "biology", "education", "science"],
  cols: 92, rows: 32, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const PER = 5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.22, y * 0.45, 3, 8);
  const CX = 46;
  // bronchial tree segments, built once: [x0, y0, x1, y1, depth]
  const segs = [];
  const branch = (x, y, a, len, d) => {
    if (d > 4) return;
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len * 0.5;
    segs.push([x, y, x1, y1, d]);
    branch(x1, y1, a - 0.45, len * 0.62, d + 1);
    branch(x1, y1, a + 0.45, len * 0.62, d + 1);
  };
  branch(CX - 1, 10, Math.PI * 0.78, 13, 0);
  branch(CX + 1, 10, Math.PI * 0.22, 12, 0);
  return (t) => {
    g.clear();
    const ph = fract(t / PER);
    const b = 0.5 - 0.5 * Math.cos(ph * TAU);           // 0 empty, 1 full
    const inhaling = ph < 0.5;
    const dia = (x) => 24 + 2.5 * b - (5 - 3 * b) * Math.max(0, 1 - ((x - CX) / 36) ** 2);
    const s = 0.88 + 0.14 * b;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.55 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // ribs behind
    for (let r = 0; r < 6; r++) {
      const yy = 7 + r * 3.4;
      for (let x = 10; x < 82; x++) {
        if (Math.abs(x - CX) < 4) continue;
        const y = yy + ((x - CX) / 36) ** 2 * 4 + 1.5 * b * (r / 6);
        g.set(x, y, "▀", K("rib", r & 1));
      }
    }
    // lungs
    for (let y = 2; y < rows; y++) for (let x = 6; x < 86; x++) {
      if (y >= dia(x) - 0.5) continue;
      const right = x < CX;                   // the body's right lung sits on the viewer's left
      const cx = right ? 29 : 63, rx = (right ? 16 : 15) * s, ry = 12.5 * s, cy = 14.5 + 2.5 * b;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      let q = dx * dx + (dy < 0 ? dy * dy * 1.15 : dy * dy * 0.6);
      if (Math.abs(x - CX) < 4) continue;
      if (!right && Math.hypot((x - 50) / 7, (y - 21) / 4) < 1) continue;  // cardiac notch
      if (q > 1) continue;
      const v = tex[x + y * cols];
      const edge = q > 0.86;
      const lv = clamp((1 - q) * 3 + v * 3.5 + b * 1.2, 0, 7.9);
      g.set(x, y, edge ? "█" : v > 0.5 ? "▓" : "▒", K("lung", edge ? 2 : Math.floor(lv)));
    }
    // bronchial tree
    for (const [x0, y0, x1, y1, d] of segs) {
      const sx = (x) => CX + (x - CX) * s, sy = (y) => 10 + (y - 10) * (0.9 + 0.12 * b);
      g.line(sx(x0), sy(y0), sx(x1), sy(y1), d < 2 ? "█" : d < 3 ? "▓" : "░", K("tube", d < 2 ? 1 : 2));
    }
    // trachea
    for (let y = 0; y < 11; y++) {
      g.text(CX - 2, y, "▐", K("tube", 2)); g.text(CX + 2, y, "▌", K("tube", 2));
      g.text(CX - 1, y, y % 2 ? "███" : "▀▀▀", K("tube", y % 2 ? 1 : 0));
    }
    // diaphragm
    for (let x = 4; x < 88; x++) {
      const y = dia(x);
      g.set(x, y, "█", K("dia", 2)); g.set(x, y + 1, "▓", K("dia", 1)); g.set(x, y + 2, "░", K("dia", 0));
    }
    // air moving in or out of the trachea and main bronchi
    const flow = Math.sin(ph * TAU);                 // + in, - out
    for (let k = 0; k < 7; k++) {
      const p = fract(k / 7 + t * 0.9 * Math.sign(flow || 1));
      if (Math.abs(flow) < 0.15) continue;
      const y = Math.floor(p * 11);
      g.set(CX, y, "●", inhaling ? K("air", 1) : K("co2", 1));
      if (y > 0) g.set(CX, y - (inhaling ? 1 : -1), "•", inhaling ? K("air", 0) : K("co2", 0));
    }
    // labels
    g.text(CX + 4, 1, "TRACHEA", K("ui", 0));
    g.text(CX + 4, 8, "BRONCHUS", K("ui", 0));
    g.text(2, 1, "RIGHT LUNG", K("ui", 0));
    g.text(cols - 11, 1, "LEFT LUNG", K("ui", 0));
    g.text(2, 2, "3 lobes", K("ui", 1));
    g.text(cols - 11, 2, "2 lobes", K("ui", 1));
    g.text(2, 27, "DIAPHRAGM", K("dia", 2));
    const st = inhaling ? "INHALE: diaphragm contracts and flattens, air rushes in" : "EXHALE: diaphragm relaxes and domes up, air is pushed out";
    g.text(Math.floor((cols - st.length) / 2), rows - 2, st, inhaling ? K("air", 1) : K("ui", 3));
    const BW = 20, m = Math.round(b * BW);
    g.text(2, rows - 1, "lung volume ", K("ui", 1));
    for (let i = 0; i < BW; i++) g.set(14 + i, rows - 1, i < m ? "█" : "░", i < m ? K("lung", 6) : K("rib", 1));
    g.text(36, rows - 1, `${(2.4 + b * 0.5).toFixed(1)} L`, K("ui", 0));
    return g.frame();
  };
}
