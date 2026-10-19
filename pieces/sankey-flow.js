/* sankey-flow: a monthly budget sankey, income streams flowing through ribbons into spending categories. */
import { Grid, palette, clamp, smooth } from "../lib/kit.js";

export const meta = {
  slug: "sankey-flow",
  name: "Budget Sankey Flow",
  category: "live-data",
  note: "A monthly budget as a sankey diagram, three income streams pouring through curved ribbons into five spending categories, with money flowing along each band.",
  tags: ["sankey", "flow", "budget", "chart", "dashboard", "data"],
  cols: 96, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#7ee787", "#d2a8ff", "#30363d", "#2a64a0", "#2e7a48", "#634e9e", "#ffa657", "#ff7b72", "#56d4dd", "#f2cc60", "#f778ba", "#a5d6ff", "#bbf7c8", "#eadcff"]),
};

const SRC = [["Salary", 4200, "2", "6", "e"], ["Freelance", 1600, "3", "7", "f"], ["Dividends", 600, "4", "8", "g"]];
const DST = [["Rent", 1900, "9"], ["Groceries", 900, "a"], ["Transport", 450, "b"], ["Savings", 2200, "c"], ["Fun", 950, "d"]];

// who pays for what, per month
const M = [
  [1900, 650, 450, 900, 300],
  [0, 250, 0, 700, 650],
  [0, 0, 0, 600, 0],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const XL = 16, XR = 76, TOP = 2, H = rows - 4;
  return (t) => {
    g.clear();
    // monthly amounts drift a little so the ribbons breathe with real numbers
    const wob = (i, k) => 1 + 0.12 * Math.sin(t * 0.5 + i * 1.7 + k);
    const F = M.map((row, i) => row.map((v, j) => v * wob(i, j)));
    const src = F.map((row) => row.reduce((a, b) => a + b, 0));
    const dst = DST.map((_, j) => F.reduce((a, row) => a + row[j], 0));
    const ST = src.reduce((a, b) => a + b, 0), DT = ST;
    const gapL = 2, gapR = 1.5;
    const scL = (H - gapL * (SRC.length - 1)) / ST, scR = (H - gapR * (DST.length - 1)) / DT;
    // node positions
    const nl = [], nr = [];
    let y = TOP;
    src.forEach((s) => { nl.push([y, y + s * scL]); y += s * scL + gapL; });
    y = TOP;
    dst.forEach((d) => { nr.push([y, y + d * scR]); y += d * scR + gapR; });
    // ribbons
    const offL = nl.map((n) => n[0]), offR = nr.map((n) => n[0]);
    const ribbons = [];
    F.forEach((row, i) => row.forEach((f, j) => {
      const a0 = offL[i], a1 = a0 + f * scL; offL[i] = a1;
      const b0 = offR[j], b1 = b0 + f * scR; offR[j] = b1;
      if (f > 1) ribbons.push({ i, j, a0, a1, b0, b1 });
    }));
    for (const r of ribbons) {
      for (let x = XL + 2; x < XR - 1; x++) {
        const s = smooth((x - XL - 2) / (XR - XL - 3));
        const top = r.a0 + (r.b0 - r.a0) * s, bot = r.a1 + (r.b1 - r.a1) * s;
        for (let yy = Math.floor(top); yy < Math.ceil(bot); yy++) {
          const cover = Math.min(bot, yy + 1) - Math.max(top, yy);
          if (cover <= 0.15) continue;
          g.set(x, yy, cover > 0.5 ? "▒" : "░", SRC[r.i][3]);
        }
        // money moving along the band centre
        const mid = (top + bot) / 2;
        const phase = ((x - XL) * 0.25 - t * 3 + r.j * 1.3 + r.i * 0.7) % 5;
        if (phase > -0.5 && phase < 0 || (phase > 4.5)) g.set(x, Math.floor(mid), "•", SRC[r.i][4]);
      }
    }
    // nodes and labels
    nl.forEach(([a, b], i) => {
      for (let yy = Math.floor(a); yy < Math.ceil(b); yy++) g.text(XL, yy, "██", SRC[i][2]);
      const my = Math.floor((a + b) / 2);
      g.text(XL - 2 - SRC[i][0].length, my, SRC[i][0], "0");
      const v = "$" + Math.round(src[i]).toLocaleString("en-US");
      g.text(XL - 2 - v.length, my + 1, v, "1");
    });
    nr.forEach(([a], j) => {
      const b = a + dst[j] * scR;
      for (let yy = Math.floor(a); yy < Math.ceil(b); yy++) g.text(XR - 1, yy, "██", DST[j][2]);
      const my = Math.floor((a + b) / 2);
      g.text(XR + 2, my, DST[j][0], "0");
      const v = "$" + Math.round(dst[j]).toLocaleString("en-US");
      g.text(XR + 3 + DST[j][0].length, my, v, "1");
    });
    g.text(1, 0, "Where the money goes", "0");
    const tot = "income $" + Math.round(ST).toLocaleString("en-US") + "  ·  spent $" + Math.round(DT - dst[3]).toLocaleString("en-US");
    g.text(cols - tot.length - 1, 0, tot, "1");
    return g.frame();
  };
}
