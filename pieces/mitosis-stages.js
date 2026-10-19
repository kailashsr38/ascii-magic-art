/* mitosis-stages: one cell dividing through the six labelled stages of mitosis and cytokinesis. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#050b12", "#0a1824", "#102636", "#173345"], 6));
add("cyto", gradient(["#123c3c", "#1f5a54", "#2f7a6c", "#4a9a84", "#6cb89a"], 8));
add("mem", ["#9ff0cc", "#e0fff0"]);
add("nuc", gradient(["#2a2650", "#3c3672", "#544a96"], 3));
add("env", ["#b9a6ff"]);
add("chrA", ["#ff5d7a", "#ff9fb1"]);
add("chrB", ["#4cc3ff", "#a6e3ff"]);
add("spin", ["#c9a43a", "#ffd166"]);
add("pole", ["#ffffff"]);
add("ui", ["#6e7f8f", "#c8d6e2", "#ffffff", "#7ee787"]);

export const meta = {
  slug: "mitosis-stages",
  name: "Mitosis Stages",
  category: "science",
  note: "A cell copies itself through interphase, prophase, metaphase, anaphase, telophase and cytokinesis, each stage named and explained as the chromosomes move.",
  tags: ["biology", "cell", "mitosis", "education", "science", "classroom"],
  cols: 96, rows: 32, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const STAGES = ["INTERPHASE", "PROPHASE", "METAPHASE", "ANAPHASE", "TELOPHASE", "CYTOKINESIS"];
const CAPS = [
  "DNA has been copied; chromatin is loose inside the nucleus.",
  "Chromosomes condense and the nuclear envelope breaks down.",
  "Spindle fibres line the chromosomes up on the cell's equator.",
  "Sister chromatids are pulled apart to opposite poles.",
  "A nuclear envelope re-forms around each set of chromosomes.",
  "The cytoplasm pinches in two: two identical daughter cells.",
];
const STEP = 3.6;
const ss = (a, b, x) => smooth(clamp((x - a) / (b - a)));

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 48, cy = 15, RB = 15.5;
  const bgv = new Float32Array(cols * rows), cyv = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    bgv[x + y * cols] = fbm(x * 0.06, y * 0.13, 3, 3);
    cyv[x + y * cols] = fbm(x * 0.15, y * 0.3, 3, 9);
  }
  const F = new Float32Array(cols * rows);
  const META_Y = [-6, -2, 2, 6];
  const PRO = [[-5, -2], [4, -3], [-3, 2], [5, 2]];
  const chromatin = (ox, oy, rx, ry, t, seed) => {
    for (let y = Math.ceil(oy - ry); y <= oy + ry; y++) for (let x = Math.ceil(ox - rx); x <= ox + rx; x++) {
      const q = ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2;
      if (q > 0.8) continue;
      const v = fbm(x * 0.5 + seed, y * 0.9 + t * 0.15, 2, 5);
      if (v > 0.55) g.set(x, y, v > 0.63 ? "~" : "·", (x + y) & 1 ? K("chrA", 1) : K("chrB", 1));
    }
  };
  const nucleus = (ox, oy, rx, ry, a, fill) => {
    for (let y = Math.ceil(oy - ry - 1); y <= oy + ry + 1; y++) for (let x = Math.ceil(ox - rx - 1); x <= ox + rx + 1; x++) {
      const q = Math.sqrt(((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2);
      if (q < 0.9 && fill) g.set(x, y, "▒", K("nuc", q < 0.5 ? 2 : q < 0.75 ? 1 : 0));
      else if (q >= 0.9 && q < 1.12 && ((x * 7 + y * 3) % 10) / 10 < a) g.set(x, y, "●", K("env"));
    }
  };
  const sprite = (x, y, kind, ch) => {
    const k = ch % 2 ? "chrB" : "chrA";
    const S = kind === "X" ? ["╲ ╱", " █ ", "╱ ╲"] : kind === "<" ? [" ╱", "█ ", " ╲"] : ["╲ ", " █", "╱ "];
    const ox = kind === "X" ? -1 : kind === "<" ? 0 : -1;
    S.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") g.set(x + ox + i, y - 1 + r, row[i], K(k, row[i] === "█" ? 1 : 0)); });
  };
  return (t) => {
    g.clear();
    const P = (t % (STEP * 6)) / STEP;
    const si = Math.min(5, Math.floor(P));
    // cell outline as two merging blobs
    const S = 7 * ss(3, 4, P) + 12 * ss(4, 5, P) + 5 * ss(5, 6, P);
    const o = P < 4 ? 13 * ss(3, 4, P) : 13 + (S - 7) * 0.75;
    const poleX = Math.max(17 * ss(1, 2, P) + 2, o + 6);
    const poleY = cy - 7 * (1 - ss(1, 2, P));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx1 = x + 0.5 - (cx - S), dx2 = x + 0.5 - (cx + S), dy = (y + 0.5 - cy) * 2;
      F[x + y * cols] = (RB * RB) / (dx1 * dx1 + dy * dy + 0.01) + (RB * RB) / (dx2 * dx2 + dy * dy + 0.01);
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols, f = F[i];
      if (f < 1) {
        const v = bgv[i];
        g.set(x, y, v > 0.5 ? "▒" : "░", K("bg", Math.min(5, Math.floor(v * 7))));
        continue;
      }
      const edge = x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || F[i - 1] < 1 || F[i + 1] < 1 || F[i - cols] < 1 || F[i + cols] < 1;
      const edge2 = !edge && (F[i - 2] < 1 || F[i + 2] < 1);
      if (edge) g.set(x, y, "█", K("mem", 0));
      else if (edge2) g.set(x, y, "▓", K("cyto", 7));
      else {
        const v = cyv[i];
        g.set(x, y, v > 0.58 ? "▒" : "░", K("cyto", Math.min(7, Math.floor(clamp(v * 1.1 + 0.15 * Math.min(1, f / 3)) * 8))));
      }
    }
    // nucleus (interphase, prophase breaking down)
    const envA = 1 - ss(1.2, 1.9, P);
    if (P < 2) {
      nucleus(cx, cy, 10, 5, envA, P < 1.6);
      if (P < 1.3) {
        chromatin(cx, cy, 9.5, 4.6, t, 0);
        g.text(cx + 2, cy - 1, "●●", K("nuc", 2)); g.text(cx + 2, cy, "●●", K("nuc", 2));
      }
    }
    // spindle fibres
    if (P > 1.5 && P < 5.2) {
      const a = ss(1.5, 2.1, P) * (1 - ss(4.6, 5.2, P));
      for (let s = -1; s <= 1; s += 2) {
        const px = cx + s * poleX;
        META_Y.forEach((my, i) => {
          const tx = P < 3 ? cx - s * 1 : cx + s * o, ty = cy + my * (P < 3 ? 1 : 1 - 0.45 * ss(3, 4, P));
          const n = Math.ceil(Math.abs(tx - px));
          for (let k = 2; k < n; k += 2) if (k / n < a + 0.05) g.set(px + ((tx - px) * k) / n, poleY + ((ty - poleY) * k) / n, "·", K("spin", 1));
        });
      }
    }
    // centrosomes
    for (let s = -1; s <= 1; s += 2) {
      const px = cx + s * poleX;
      g.set(px, poleY, "*", K("pole"));
      g.set(px - 1, poleY, "·", K("spin", 1)); g.set(px + 1, poleY, "·", K("spin", 1));
      g.set(px, poleY - 1, "·", K("spin", 0)); g.set(px, poleY + 1, "·", K("spin", 0));
    }
    // chromosomes
    if (P >= 1.15 && P < 4.7) {
      for (let i = 0; i < 4; i++) {
        if (P < 3) {
          const m = ss(1.7, 2.5, P);
          const x = cx + PRO[i][0] * (1 - m), y = cy + PRO[i][1] * (1 - m) + META_Y[i] * m;
          sprite(Math.round(x), Math.round(y), "X", i);
        } else {
          const y = Math.round(cy + META_Y[i] * (1 - 0.45 * ss(3, 4, P)));
          if (o < 1) sprite(cx, y, "X", i);
          else { sprite(Math.round(cx - o), y, "<", i); sprite(Math.round(cx + o), y, ">", i); }
        }
      }
    }
    // daughter nuclei
    if (P > 4.2) {
      const a = ss(4.2, 4.8, P);
      for (let s = -1; s <= 1; s += 2) {
        nucleus(cx + s * o, cy, 7, 3.8, a, P > 4.7);
        if (P > 4.7) chromatin(cx + s * o, cy, 6.5, 3.4, t, s * 11);
      }
    }
    // labels
    g.text(2, 0, "MITOSIS", K("ui", 1));
    g.text(10, 0, `stage ${si + 1}/6`, K("ui", 0));
    const name = STAGES[si];
    g.text(cols - 2 - name.length, 0, name, K("ui", 2));
    const cap = CAPS[si];
    g.text(Math.floor((cols - cap.length) / 2), rows - 3, cap, K("ui", 1));
    let x = Math.floor((cols - 70) / 2);
    STAGES.forEach((s, k) => {
      g.text(x, rows - 1, s, K("ui", k === si ? 3 : 0));
      x += s.length;
      if (k < 5) { g.text(x, rows - 1, " → ", K("ui", 0)); x += 3; }
    });
    if (si === 2) {
      g.text(cx - 7, 2, "metaphase plate", K("ui", 1)); g.set(cx, 3, "↓", K("ui", 1));
      g.text(Math.round(cx - poleX) - 4, cy - 3, "spindle", K("spin", 1));
    }
    if (si === 0) g.text(cx - 3, cy + 6, "nucleus", K("env"));
    return g.frame();
  };
}
