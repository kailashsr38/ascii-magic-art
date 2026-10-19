/* radar-chart-morph: a spider chart comparing two skill profiles, the shapes morphing as the candidates change. */
import { Grid, palette, clamp, smooth, TAU } from "../lib/kit.js";

export const meta = {
  slug: "radar-chart-morph",
  name: "Radar Skill Profile",
  category: "live-data",
  note: "A spider chart compares two engineers across six skills, the blue and orange shapes morphing smoothly as each new pair of profiles loads.",
  tags: ["radar", "spider", "chart", "dashboard", "data", "compare"],
  cols: 76, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#30363d", "#484f58", "#1f6feb", "#9e5a1e", "#0d2a4a", "#3a2410"]),
};

const AX = ["Frontend", "Backend", "DevOps", "Data", "Design", "Testing"];
const SETS = [
  [["A. Rivera", [0.92, 0.55, 0.35, 0.4, 0.85, 0.6]], ["J. Okafor", [0.4, 0.9, 0.8, 0.7, 0.25, 0.75]]],
  [["M. Chen", [0.6, 0.7, 0.95, 0.55, 0.3, 0.85]], ["S. Patel", [0.75, 0.45, 0.3, 0.92, 0.6, 0.5]]],
  [["L. Novak", [0.35, 0.85, 0.6, 0.88, 0.2, 0.65]], ["D. Kim", [0.88, 0.6, 0.5, 0.3, 0.92, 0.7]]],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 26, cy = 14, R = 21;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i / 6) * TAU; return [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R * 0.5]; };
  const inPoly = (x, y, P) => {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
    }
    return c;
  };
  const STEP = 4;
  return (t) => {
    g.clear();
    const k = Math.floor(t / STEP), f = smooth(clamp(((t % STEP) - 2.6) / 1.2));
    const A = SETS[k % 3], B = SETS[(k + 1) % 3];
    const vals = [0, 1].map((s) => AX.map((_, i) => A[s][1][i] + (B[s][1][i] - A[s][1][i]) * f));
    const names = [0, 1].map((s) => (f < 0.5 ? A[s][0] : B[s][0]));
    const polys = vals.map((v) => v.map((r, i) => pt(i, r)));
    // fills first, overlap gets its own tone
    for (let y = 0; y < rows; y++) for (let x = 0; x < 54; x++) {
      const a = inPoly(x + 0.5, y + 0.5, polys[0]), b = inPoly(x + 0.5, y + 0.5, polys[1]);
      if (a && b) g.set(x, y, "▒", "6");
      else if (a) g.set(x, y, "░", "3");
      else if (b) g.set(x, y, "░", "4");
    }
    // web rings and spokes
    for (let ring = 1; ring <= 4; ring++) for (let i = 0; i < 6; i++) {
      const p = pt(i, ring / 4), q = pt(i + 1, ring / 4);
      const n = 40;
      for (let s = 0; s <= n; s++) {
        const x = Math.round(p[0] + (q[0] - p[0]) * (s / n)), y = Math.round(p[1] + (q[1] - p[1]) * (s / n));
        if (g.get(x, y) === " ") g.set(x, y, "·", "7");
      }
    }
    for (let i = 0; i < 6; i++) {
      const p = pt(i, 1);
      for (let s = 1; s <= 30; s++) {
        const x = Math.round(cx + (p[0] - cx) * (s / 30)), y = Math.round(cy + (p[1] - cy) * (s / 30));
        if (g.get(x, y) === " ") g.set(x, y, "·", "8");
      }
    }
    // outlines and vertices
    polys.forEach((P, s) => {
      for (let i = 0; i < 6; i++) g.line(P[i][0], P[i][1], P[(i + 1) % 6][0], P[(i + 1) % 6][1], "•", s ? "4" : "3");
      for (const p of P) g.set(p[0], p[1], "●", s ? "4" : "3");
    });
    // axis labels
    AX.forEach((name, i) => {
      const [x, y] = pt(i, 1.12);
      const lx = Math.round(x - (Math.cos(-Math.PI / 2 + (i / 6) * TAU) < -0.2 ? name.length : Math.cos(-Math.PI / 2 + (i / 6) * TAU) > 0.2 ? 0 : name.length / 2));
      g.text(Math.max(0, lx), Math.round(y), name, "0");
    });
    // legend and score table
    const L = 55;
    g.text(L, 1, "Skill profile", "0");
    g.hline(L, cols - 2, 2, "─", "7");
    g.text(L, 3, "■ ", "3"); g.text(L + 2, 3, names[0].padEnd(10), "0");
    g.text(L, 4, "■ ", "4"); g.text(L + 2, 4, names[1].padEnd(10), "0");
    AX.forEach((name, i) => {
      const y = 6 + i * 2;
      g.text(L, y, name, "1");
      const a = Math.round(vals[0][i] * 100), b = Math.round(vals[1][i] * 100);
      g.text(L + 9, y, String(a).padStart(3), "3");
      g.text(L + 14, y, String(b).padStart(3), "4");
      const d = a - b;
      g.text(L + 18, y, (d >= 0 ? "+" : "") + d, d >= 0 ? "2" : "5");
      g.text(L, y + 1, "┄".repeat(20), "7");
    });
    const avg = (v) => Math.round((v.reduce((p, c) => p + c, 0) / 6) * 100);
    g.text(L, 19 + 4, "avg", "1"); g.text(L + 9, 23, String(avg(vals[0])).padStart(3), "3"); g.text(L + 14, 23, String(avg(vals[1])).padStart(3), "4");
    g.text(L, 25, "profiles " + ((k % 3) + 1) + "/3", "8");
    return g.frame();
  };
}
