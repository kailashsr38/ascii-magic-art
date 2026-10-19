/* heatmap-grid: a contribution style calendar heatmap filling in day by day. */
import { Grid, palette, rng, fbm } from "../lib/kit.js";

export const meta = {
  slug: "heatmap-grid",
  name: "Contribution Heatmap",
  category: "live-data",
  note: "A year of daily activity filling in square by square, from quiet grey to bright green, with a running total.",
  tags: ["heatmap", "calendar", "activity", "readme", "profile", "dashboard"],
  cols: 112, rows: 14, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#21262d", "#0e4429", "#006d32", "#26a641", "#39d353", "#ffffff", "#30363d"]),
};

const WEEKS = 52;
const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const r = rng(42);
  const lvl = [], cnt = [];
  for (let d = 0; d < WEEKS * 7; d++) {
    const w = Math.floor(d / 7), dow = d % 7;
    const base = fbm(w * 0.18, 0.3, 3, 8);
    const weekend = dow === 0 || dow === 6 ? 0.45 : 1;
    const v = base * weekend * (0.5 + r());
    const L = v < 0.22 ? 0 : v < 0.38 ? 1 : v < 0.55 ? 2 : v < 0.75 ? 3 : 4;
    lvl.push(L);
    cnt.push(L === 0 ? 0 : Math.round(L * 2.4 + r() * 3 * L));
  }
  const total = [];
  let s = 0;
  for (const c of cnt) total.push((s += c));
  const X0 = 6, Y0 = 3;
  return (t) => {
    g.clear();
    const N = WEEKS * 7, speed = 60;
    const P = N / speed + 3;
    const lt = t % P;
    const upto = Math.min(N, Math.floor(lt * speed));
    const shown = upto > 0 ? total[upto - 1] : 0;
    g.text(X0, 0, shown.toLocaleString("en-US") + " contributions in the last year", "0");
    for (let m = 0; m < 12; m++) g.text(X0 + Math.round(m * (WEEKS / 12) * 2), 2, MONTHS[m], "1");
    ["", "Mon", "", "Wed", "", "Fri", ""].forEach((l, i) => l && g.text(1, Y0 + i, l, "1"));
    for (let d = 0; d < N; d++) {
      const w = Math.floor(d / 7), dow = d % 7;
      const x = X0 + w * 2, y = Y0 + dow;
      if (d < upto) {
        const fresh = upto - d;
        g.set(x, y, "■", fresh < 3 ? "7" : String(2 + lvl[d]));
      } else g.set(x, y, "■", "2");
    }
    const y = Y0 + 8;
    g.text(X0, y, "Learn how we count contributions", "1");
    const lx = meta.cols - 26;
    g.text(lx, y, "Less", "1");
    for (let k = 0; k < 5; k++) g.set(lx + 5 + k * 2, y, "■", String(2 + k));
    g.text(lx + 16, y, "More", "1");
    // streak readout
    let streak = 0;
    for (let d = upto - 1; d >= 0 && cnt[d] > 0; d--) streak++;
    g.text(X0, y + 2, "current streak", "1");
    g.text(X0 + 15, y + 2, String(streak).padStart(3) + " days", "6");
    g.text(X0 + 28, y + 2, "busiest day", "1");
    const best = Math.max(0, ...cnt.slice(0, Math.max(1, upto)));
    g.text(X0 + 40, y + 2, String(best).padStart(2) + " commits", "0");
    return g.frame();
  };
}
