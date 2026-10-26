/* star-history-climb: a repo's star history drawing itself, climbing past milestones to your count. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "star-history-climb",
  name: "Star History Climb",
  category: "live-data",
  note: "A star history chart draws itself week by week, flagging each milestone as the line climbs to your repo's star count.",
  tags: ["github", "stars", "chart", "growth", "readme", "open-source", "dashboard", "milestone"],
  cols: 96, rows: 30, fps: 24,
  loop: 12,
  params: {
    stars: { label: "Stars", type: "number", default: 100, min: 10, max: 999999 },
    repo: { label: "Repo", default: "kailashsr38/ascii-magic-art", max: 40 },
  },
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#ffd75e", "#e8b423", "#7ee787", "#79c0ff", "#21262d", "#f0883e"]),
};

const fmt = (n) => (n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n));
const ease = (x) => 1 - (1 - clamp(x)) ** 2;
const LOOP = 12, DRAW = [0.6, 8.0];

export default function create(p = {}) {
  const P = meta.params;
  const total = Math.max(10, Math.round(p.stars ?? P.stars.default));
  const repo = String(p.repo ?? P.repo.default);
  const g = new Grid(meta.cols, meta.rows), W = meta.cols, H = meta.rows;
  const X0 = 9, X1 = W - 3, Y0 = 4, Y1 = H - 5; // plot box
  const N = X1 - X0 - 1;                       // one column a week

  // a believable history: a slow start, a launch spike, steady growth, a late burst
  const raw = [];
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const rate = 0.25 + (u > 0.32 && u < 0.38 ? 5 : 0) + u * 1.6 + (u > 0.85 ? 3 : 0) + Math.sin(i * 1.7) * 0.15;
    acc += Math.max(0.05, rate);
    raw.push(acc);
  }
  const series = raw.map((v) => Math.round((v / acc) * total));
  // milestones worth a flag: round numbers under the total
  const marks = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000].filter((m) => m <= total && m >= total / 20).slice(-3);
  const yOf = (v) => Y1 - 1 - (v / total) * (Y1 - Y0 - 2);

  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    const shown = Math.floor(ease((ph - DRAW[0]) / (DRAW[1] - DRAW[0])) * N);
    // title row
    const title = repo.length > W - 22 ? repo.slice(0, W - 24) + ".." : repo;
    g.text(2, 1, "*", "3"); g.text(4, 1, title, "0");
    const now = shown > 0 ? series[Math.min(N - 1, shown - 1)] : 0;
    const cnt = fmt(now) + " stars";
    g.text(W - 2 - cnt.length, 1, cnt, "3");
    // axes and grid
    for (let k = 0; k <= 4; k++) {
      const y = Math.round(yOf(total * (1 - k / 4)));
      g.hline(X0 + 1, X1 - 1, y, "┄", "7");
      const lab = fmt(Math.round(total * (1 - k / 4)));
      g.text(X0 - 1 - lab.length, y, lab, "1");
    }
    g.vline(X0, Y0 - 1, Y1 - 1, "│", "2"); g.hline(X0, X1 - 1, Y1, "─", "2"); g.set(X0, Y1, "└", "2");
    ["2y ago", "1y ago", "now"].forEach((s, i) => {
      const x = Math.round(X0 + 1 + (N - 1) * (i / 2)) - (i === 2 ? s.length - 1 : i === 1 ? 3 : 0);
      g.text(x, Y1 + 1, s, "1");
    });
    // the line, filled underneath with a soft shade
    for (let i = 0; i < shown; i++) {
      const x = X0 + 1 + i, y = yOf(series[i]), yi = Math.round(y);
      for (let yy = yi + 1; yy < Y1; yy++) g.set(x, yy, yy > Y1 - 3 ? "░" : "·", "4");
      const prev = i ? Math.round(yOf(series[i - 1])) : yi;
      for (let yy = Math.min(prev, yi); yy <= Math.max(prev, yi); yy++) g.set(x, yy, yy === yi ? "•" : "│", "3");
    }
    // milestone flags as the line passes them
    for (const m of marks) {
      const i = series.findIndex((v) => v >= m);
      if (i < 0 || i >= shown) continue;
      const x = X0 + 1 + i, y = Math.round(yOf(series[i]));
      // label up and to the left of the point, joined by a short leader
      const lab = `${fmt(m)}`, ly = Math.max(Y0, y - 2), lx = clamp(x - lab.length - 1, X0 + 2, X1 - lab.length - 2);
      g.text(lx, ly, lab, "8");
      if (y - 1 > ly) g.set(lx + lab.length, y - 1, "╲", "8");
    }
    // the head of the line, and a caption once it lands
    if (shown > 0 && shown < N) g.set(X0 + shown, Math.round(yOf(series[shown - 1])), "●", "5");
    if (ph > DRAW[1] + 0.3) {
      const msg = ` ${fmt(total)} stars, thank you `;
      g.text(Math.round((W - msg.length) / 2), H - 2, msg, "5");
    } else g.text(2, H - 2, "star history, weekly", "1");
    return g.frame();
  };
}
