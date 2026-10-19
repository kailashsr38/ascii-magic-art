/* scatter-plot: points landing one by one in a scatter plot, then a trend line drawing through them. */
import { Grid, palette, rng, clamp } from "../lib/kit.js";

export const meta = {
  slug: "scatter-plot",
  name: "Scatter Plot",
  category: "live-data",
  note: "Points landing one by one in a scatter plot of ad spend against revenue, then a fitted trend line drawing through them.",
  tags: ["scatter", "regression", "chart", "statistics", "dashboard"],
  cols: 72, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#d2a8ff", "#7ee787", "#ffa657", "#ffffff", "#1f6feb", "#f778ba"]),
};

const N = 64;
const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 8, X1 = cols - 3, Y0 = 2, Y1 = rows - 4;
  const W = X1 - X0 + 1, H = Y1 - Y0 + 1;
  const dots = new Uint8Array(W * H);
  const r = rng(11);
  const pts = [];
  for (let i = 0; i < N; i++) {
    const x = r();
    const noise = (r() + r() + r() - 1.5) * 0.28;
    const y = clamp(0.12 + x * 0.72 + noise, 0.02, 0.98);
    pts.push([x, y, r() < 0.5 ? 0 : 1]);
  }
  // least squares fit
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y; }
  const m = (N * sxy - sx * sy) / (N * sxx - sx * sx), b = (sy - m * sx) / N;
  const rr = (N * sxy - sx * sy) / Math.sqrt((N * sxx - sx * sx) * (N * syy - sy * sy));
  const cell = (x, y) => [X0 + Math.round(x * (W - 1)), Y1 - Math.round(y * (H - 1))];
  return (t) => {
    g.clear();
    dots.fill(0);
    const P = 11, lt = t % P;
    const shown = Math.min(N, Math.floor(lt * 11) + 1);
    const lineP = clamp((lt - 6.2) / 1.6);
    const fade = clamp((lt - 10.3) / 0.7);
    // axes and grid
    for (let k = 0; k <= 4; k++) {
      const y = Y1 - Math.round((k / 4) * (H - 1));
      g.text(0, y, ("$" + (k * 25) + "k").padStart(6), "1");
      g.set(X0 - 1, y, "┤", "1");
      for (let x = X0; x <= X1; x += 2) g.set(x, y, "·", "2");
      const x = X0 + Math.round((k / 4) * (W - 1));
      g.text(x - 2, Y1 + 2, ("$" + k * 5 + "k").padStart(4), "1");
      for (let yy = Y0; yy <= Y1; yy += 1) if (g.get(x, yy) === " ") g.set(x, yy, "┊", "2");
    }
    g.vline(X0 - 1, Y0, Y1, "│", "1"); g.set(X0 - 1, Y1 + 1, "└", "1");
    g.hline(X0, X1, Y1 + 1, "─", "1");
    // trend line in braille (sub-cell precision), drawn left to right
    if (lineP > 0 && fade < 1) {
      const DW = W * 2, DH = H * 4;
      for (let dx = 0; dx < DW * lineP; dx++) {
        const x = dx / (DW - 1), y = m * x + b;
        const dy = Math.round((1 - y) * (DH - 1));
        if (dy < 0 || dy >= DH) continue;
        dots[(dx >> 1) + (dy >> 2) * W] |= BITS[dy & 3][dx & 1];
      }
      for (let i = 0; i < W * H; i++) if (dots[i]) g.set(X0 + (i % W), Y0 + Math.floor(i / W), String.fromCharCode(0x2800 + dots[i]), "6");
    }
    // points
    for (let i = 0; i < shown; i++) {
      if (fade > 0 && i / N < fade) continue;
      const [x, y, grp] = pts[i];
      const [cx, cy] = cell(x, y);
      const age = (lt * 11) - i;
      g.set(cx, cy, "●", age < 1.5 ? "7" : grp ? "4" : "3");
      if (age < 1) { g.set(cx - 1, cy, "(", "1"); g.set(cx + 1, cy, ")", "1"); }
    }
    // header
    g.text(1, 0, "revenue vs ad spend", "0");
    g.text(23, 0, "●", "3"); g.text(25, 0, "search", "1");
    g.text(33, 0, "●", "4"); g.text(35, 0, "social", "1");
    g.text(cols - 26, 0, "n", "1"); g.text(cols - 24, 0, String(shown).padStart(2), "0");
    if (lineP > 0) {
      g.text(cols - 19, 0, "r", "1"); g.text(cols - 17, 0, rr.toFixed(2), "6");
      g.text(cols - 11, 0, "y=" + m.toFixed(2) + "x", "6");
    }
    g.text(cols - 16, rows - 1, "ad spend / week", "1");
    return g.frame();
  };
}
