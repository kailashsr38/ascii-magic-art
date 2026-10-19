/* circuit-trace: copper circuit traces with pads and vias, signals racing along them. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const GR = gradient(["#123321", "#1f6f43", "#2ea043", "#7ee787", "#e6ffed"], 8);  // 0..7
const CY = gradient(["#12283a", "#1f5f8f", "#58a6ff", "#a5d6ff", "#f0f8ff"], 8);  // 8..15
const pal = palette([...GR, ...CY, "#9e6a03", "#d29922", "#f2cc60", "#30363d"]); // g h i copper, j dim

export const meta = {
  slug: "circuit-trace",
  name: "Circuit Trace",
  category: "frames",
  note: "A strip of circuit board traces with copper pads and vias, green and blue signals racing along them.",
  tags: ["divider", "circuit", "tech", "readme", "hardware", "dashboard"],
  cols: 96, rows: 8, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(11);
  const paths = [];   // each: { cells: [[x,y,ch]], speed, phase, fam }
  for (let lane = 0; lane < 4; lane++) {
    const y0 = lane * 2;
    let x = Math.floor(r() * 3);
    while (x < cols - 6) {
      const len = 18 + Math.floor(r() * 30);
      const end = Math.min(cols - 1, x + len);
      const cells = [[x, y0, "●"]];
      let cx = x + 1, y = y0, lastBack = -99;
      while (cx < end) {
        if (y === y0 && cx + 6 < end && cx > lastBack + 5 && r() < 0.12) {
          const back = Math.min(end - 2, cx + 3 + Math.floor(r() * 8));
          cells.push([cx, y0, "┐"], [cx, y0 + 1, "└"]);
          for (let k = cx + 1; k < back; k++) cells.push([k, y0 + 1, r() < 0.06 ? "○" : "─"]);
          cells.push([back, y0 + 1, "┘"], [back, y0, "┌"]);
          cx = back + 1; lastBack = back;
          continue;
        }
        cells.push([cx, y0, r() < 0.05 ? "○" : "─"]);
        cx++;
      }
      cells.push([end, y0, "●"]);
      paths.push({ cells, speed: 14 + r() * 18, phase: r() * 100, fam: r() < 0.35 ? 8 : 0, n: 1 + Math.floor(r() * 2) });
      x = end + 2 + Math.floor(r() * 3);
    }
  }
  return (t) => {
    g.clear();
    for (const p of paths) {
      const L = p.cells.length;
      const lit = new Float32Array(L);
      for (let s = 0; s < p.n; s++) {
        const span = L + 12;
        const head = ((t * p.speed + p.phase + s * span / p.n) % span) - 2;
        for (let i = 0; i < L; i++) {
          const d = head - i;
          if (d >= 0 && d < 7) lit[i] = Math.max(lit[i], 1 - d / 7);
        }
      }
      p.cells.forEach(([x, y, ch], i) => {
        const v = lit[i];
        if (ch === "●" || ch === "○") g.set(x, y, ch, v > 0.3 ? KEYS[p.fam + 4 + Math.floor(v * 3.9)] : ch === "●" ? "h" : "g");
        else if (v > 0.9 && (ch === "─")) g.set(x, y, "■", KEYS[p.fam + 7]);
        else g.set(x, y, ch, KEYS[p.fam + Math.min(7, 1 + Math.floor(v * 7))]);
      });
    }
    return g.frame();
  };
}
