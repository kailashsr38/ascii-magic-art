/* gradient-descent: plain and momentum optimisers stepping down a contour map of a stretched bowl, with their loss curves. */
import { Grid, palette, gradient, clamp } from "../lib/kit.js";

export const meta = {
  slug: "gradient-descent",
  name: "Gradient Descent Contours",
  category: "explainers",
  note: "Two optimisers walk down a contour map of a stretched loss bowl, plain gradient descent zigzagging across the valley while momentum curves smoothly to the minimum, with their loss curves drawn alongside.",
  tags: ["machine-learning", "optimization", "math", "diagram", "education", "chart"],
  cols: 104, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681", ...gradient(["#3d3470", "#6a58c4", "#8f7ff0", "#5fc4d0", "#a8f0b4"], 10)]),
};
const LV = "cdefghijkl";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const PW = 64, PH = 29;
  const ang = 0, ca = Math.cos(ang), sa = Math.sin(ang);
  const f = (x, y) => { const u = x * ca + y * sa, v = -x * sa + y * ca; return 0.25 * u * u + 1.5 * v * v; };
  const grad = (x, y) => {
    const u = x * ca + y * sa, v = -x * sa + y * ca;
    const du = 0.5 * u, dv = 3 * v;
    return [du * ca - dv * sa, du * sa + dv * ca];
  };
  // domain
  const X0 = -6, X1 = 6, Y0 = -2.9, Y1 = 2.9;
  const toCell = (x, y) => [Math.round(((x - X0) / (X1 - X0)) * (PW - 1)), Math.round(((Y1 - y) / (Y1 - Y0)) * (PH - 1)) + 1];
  // static contour rings, drawn parametrically as ellipses
  const contour = new Array(PW * PH).fill(null);
  const RINGS = 6;
  for (let k = 1; k <= RINGS; k++) {
    const lv = 8 * (k / RINGS) ** 2;
    const au = Math.sqrt(lv / 0.25), bv = Math.sqrt(lv / 1.5);
    for (let s = 0; s < 720; s++) {
      const th = (s / 720) * Math.PI * 2;
      const u = au * Math.cos(th), v = bv * Math.sin(th);
      const x = u * ca - v * sa, y = u * sa + v * ca;
      const i = Math.round(((x - X0) / (X1 - X0)) * (PW - 1)), j = Math.round(((Y1 - y) / (Y1 - Y0)) * (PH - 1));
      if (i < 0 || j < 0 || i >= PW || j >= PH) continue;
      contour[i + j * PW] = ["·", LV[9 - Math.min(9, Math.round((k - 1) * 9 / (RINGS - 1)))]];
    }
  }
  // paths from three starting points
  const STARTS = [[-5.2, 1.0], [5.0, -1.3], [-4.6, -1.7]];
  const N = 36;
  const runs = STARTS.map(([sx, sy]) => {
    const gd = [[sx, sy]], mo = [[sx, sy]];
    let x = sx, y = sy;
    for (let k = 0; k < N; k++) { const [gx, gy] = grad(x, y); x -= 0.6 * gx; y -= 0.6 * gy; gd.push([x, y]); }
    x = sx; y = sy; let vx = 0, vy = 0;
    for (let k = 0; k < N; k++) { const [gx, gy] = grad(x, y); vx = 0.7 * vx - 0.1 * gx; vy = 0.7 * vy - 0.1 * gy; x += vx; y += vy; mo.push([x, y]); }
    return { gd, mo, lg: gd.map(([a, b]) => f(a, b)), lm: mo.map(([a, b]) => f(a, b)) };
  });
  const STEP = 0.3, RUN = N * STEP + 2.5;
  return (t) => {
    g.clear();
    const ri = Math.floor(t / RUN) % runs.length, rt = t % RUN;
    const R = runs[ri];
    const k = Math.min(N, Math.floor(rt / STEP));
    // contours
    for (let j = 0; j < PH; j++) for (let i = 0; i < PW; i++) {
      const c = contour[i + j * PW];
      if (c) g.set(i, j + 1, c[0], c[1]);
    }
    const [mx, my] = toCell(0, 0);
    g.set(mx, my, "×", "8");
    // trails
    const trail = (P, co, head) => {
      for (let s = 1; s <= k; s++) {
        const [ax, ay] = toCell(...P[s - 1]), [bx, by] = toCell(...P[s]);
        g.line(ax, ay, bx, by, "·", co);
      }
      for (let s = 0; s <= k; s++) { const [cx, cy] = toCell(...P[s]); g.set(cx, cy, "•", co); }
      const [hx, hy] = toCell(...P[k]);
      g.set(hx, hy, head, "8");
    };
    trail(R.gd, "5", "●");
    trail(R.mo, "9", "◆");
    const [sx, sy] = toCell(...R.gd[0]);
    g.text(Math.max(0, Math.min(PW - 6, sx - 2)), sy - 1 < 1 ? sy + 1 : sy - 1, "start", "0");
    g.text(1, 0, "loss surface  f(w1, w2)", "0");
    // right panel: loss chart
    const CX = 68, CW = 34, CY = 3, CH = 14;
    g.box(CX - 1, CY - 2, CW + 2, CH + 5, "round", "b");
    g.text(CX + 1, CY - 2, " loss per step (log) ", "0");
    const lmaxL = Math.log(Math.max(R.lg[0], R.lm[0]) + 1e-3), lminL = Math.log(1e-3);
    const ly = (v) => CY + Math.round((1 - (Math.log(v + 1e-3) - lminL) / (lmaxL - lminL)) * (CH - 1));
    for (let s = 0; s <= k; s++) {
      const x = CX + Math.round((s / N) * (CW - 1));
      g.set(x, ly(R.lg[s]), "•", "5");
      g.set(x, ly(R.lm[s]), "•", "9");
    }
    g.hline(CX, CX + CW - 1, CY + CH, "─", "2");
    g.text(CX, CY + CH + 1, "0", "1"); g.text(CX + CW - 3, CY + CH + 1, String(N), "1");
    // legend and stats
    g.text(CX, 21, "●", "5"); g.text(CX + 2, 21, "gradient descent", "0"); g.text(CX + 20, 21, "lr 0.6", "1");
    g.text(CX, 22, "◆", "9"); g.text(CX + 2, 22, "momentum", "0"); g.text(CX + 20, 22, "beta 0.7", "1");
    g.text(CX, 24, "step", "1"); g.text(CX + 6, 24, String(k).padStart(2) + " / " + N, "0");
    g.text(CX, 25, "loss", "1");
    g.text(CX + 6, 25, R.lg[k].toFixed(3), "5"); g.text(CX + 16, 25, R.lm[k].toFixed(3), "9");
    const [gx, gy] = grad(...R.gd[k]);
    g.text(CX, 26, "|grad|", "1"); g.text(CX + 7, 26, Math.hypot(gx, gy).toFixed(2), "0");
    if (k >= N) g.text(CX, 28, "✓ both reached the minimum ×", "4");
    else g.text(CX, 28, "narrow valley: plain steps zigzag", "1");
    return g.frame();
  };
}
