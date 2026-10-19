/* venn-diagram: three overlapping round circles with each region highlighting in turn. */
import { Grid, palette, TAU, clamp } from "../lib/kit.js";

export const meta = {
  slug: "venn-diagram",
  name: "Venn Diagram",
  category: "explainers",
  note: "Three overlapping circles, corrected to stay round, with each region and overlap lighting up in turn and naming what lives there.",
  tags: ["venn", "sets", "diagram", "overlap", "slides"],
  cols: 84, rows: 28, fps: 20,
  palette: palette([
    "#e6edf3", "#8b949e", "#30363d",
    "#24527f", "#79c0ff",          // A blue
    "#22592f", "#7ee787",          // B green
    "#6e4219", "#ffa657",          // C orange
    "#22605c", "#56d4dd",          // A+B teal
    "#523a72", "#d2a8ff",          // A+C purple
    "#5e5618", "#f2cc60",          // B+C yellow
    "#6e5e5e", "#ffffff",          // all
  ]),
};

const SETS = [["Design", "4"], ["Code", "6"], ["Data", "8"]];
// region mask -> [dim key, bright key, label]
const REGION = {
  1: ["3", "4", "Design only", "brand, layout, type"], 2: ["5", "6", "Code only", "apps, tooling"], 4: ["7", "8", "Data only", "reports, pipelines"],
  3: ["9", "a", "Design + Code", "front end, prototypes"], 5: ["b", "c", "Design + Data", "dashboards, charts"],
  6: ["d", "e", "Code + Data", "machine learning"], 7: ["f", "g", "All three", "the sweet spot"],
};
const ORDER = [1, 3, 2, 6, 4, 5, 7];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = 8.6;
  const C = [[24, 9.5], [38, 9.5], [31, 16.5]].map(([x, y]) => [x, y]);
  // circle centres in "square" units: x is halved
  const CS = C.map(([x, y]) => [x / 2, y]);
  const mask = new Uint8Array(cols * rows), edge = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < 60; x++) {
    let m = 0, e = 0;
    CS.forEach(([cx, cy], i) => {
      const d = Math.hypot((x + 0.5) / 2 - cx, y + 0.5 - cy);
      if (d < R) m |= 1 << i;
      if (Math.abs(d - R) < 0.42) e |= 1 << i;
    });
    mask[x + y * cols] = m; edge[x + y * cols] = e;
  }
  return (t) => {
    g.clear();
    const STEP = 1.8;
    const k = Math.floor(t / STEP) % ORDER.length;
    const active = ORDER[k];
    const pulse = clamp(((t % STEP) / STEP) * 4);
    for (let y = 0; y < rows; y++) for (let x = 0; x < 60; x++) {
      const i = x + y * cols, m = mask[i];
      if (edge[i]) {
        const which = edge[i] & 1 ? 0 : edge[i] & 2 ? 1 : 2;
        g.set(x, y, "•", SETS[which][1]);
        continue;
      }
      if (!m) continue;
      const [dim, hi] = REGION[m];
      if (m === active) g.set(x, y, pulse < 1 && (x + y) % 2 ? "▓" : "█", hi);
      else g.set(x, y, "▒", dim);
    }
    // set labels outside the circles
    g.text(6, 2, "Design", "4");
    g.text(50, 2, "Code", "6");
    g.text(41, 26, "Data", "8");
    // label inside the active region at its centroid
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < 60; x++) if (mask[x + y * cols] === active && !edge[x + y * cols]) { sx += x; sy += y; n++; }
    if (n) g.set(Math.round(sx / n), Math.round(sy / n), "●", "g");
    // side panel
    const lx = 62;
    g.text(lx, 2, "Skills overlap", "0");
    g.hline(lx, cols - 2, 3, "─", "2");
    ORDER.forEach((m, j) => {
      const on = m === active;
      const y = 5 + j * 2;
      g.text(lx, y, "■", REGION[m][1]);
      g.text(lx + 2, y, REGION[m][2], on ? "0" : "1");
      if (on) g.text(lx - 2, y, "►", REGION[m][1]);
    });
    g.text(lx, 20, REGION[active][2], REGION[active][1]);
    g.text(lx, 21, REGION[active][3], "1");
    return g.frame();
  };
}
