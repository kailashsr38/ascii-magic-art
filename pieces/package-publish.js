/* package-publish: a package is packed, checked and published from the terminal, with a download graph waking up. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "package-publish",
  name: "Package Publish",
  category: "screens",
  note: "A terminal packs a package, lists its files, publishes it to the registry, and the weekly downloads graph beside it starts to climb.",
  tags: ["npm", "publish", "package", "terminal", "open-source", "release", "cli", "downloads"],
  cols: 96, rows: 26, fps: 30,
  loop: 13,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#7ee787", "#79c0ff", "#d2a8ff", "#ffa657", "#ff7b72", "#2ea043"]),
};

const LOOP = 13, CPS = 30;
const LINES = [
  ["$", "npm publish --access public"],
  ["o", "package: ascii-magic-art@1.1.0", "0"],
  ["o", "=== Tarball Contents ===", "4"],
  ["o", " 2.1kB  runtime/ascii.js", "1"],
  ["o", " 9.8kB  runtime/canvas.js", "1"],
  ["o", " 4.6kB  lib/kit.js", "1"],
  ["o", " 1.4MB  pieces/ (734 files)", "1"],
  ["o", "=== Tarball Details ===", "4"],
  ["o", "total files: 741", "1"],
  ["o", "+ ascii-magic-art@1.1.0", "3"],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows), W = meta.cols, H = meta.rows;
  const plan = [];
  let at = 0.5;
  for (const [k, s] of LINES) { const d = k === "$" ? s.length / CPS : 0.12; plan.push({ at, d }); at += d + (k === "$" ? 0.6 : 0.16); }
  const published = plan[plan.length - 1].at;
  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    // terminal, left
    const TW = 54;
    g.box(0, 0, TW, H, "round", "2");
    g.text(2, 0, " ● ● ● ", "2");
    let y = 2, cur = null;
    LINES.forEach(([k, s, c], i) => {
      if (ph < plan[i].at) return;
      if (k === "$") {
        const n = Math.min(s.length, Math.floor(((ph - plan[i].at) / plan[i].d) * s.length));
        g.text(2, y, "$", "5"); g.text(4, y, s.slice(0, n), "0");
        if (n < s.length) cur = [4 + n, y];
      } else g.text(2, y, s.slice(0, TW - 4), c);
      y++;
    });
    if (!cur && ph > published + 0.3) { g.text(2, y + 1, "$", "5"); cur = [4, y + 1]; }
    if (cur && Math.floor(t * 2.2) % 2 === 0) g.set(cur[0], cur[1], "█", "0");
    // registry card, right
    const X = TW + 2, CW = W - X;
    g.box(X, 0, CW, H, "round", "2");
    g.text(X + 2, 1, "ascii-magic-art", "0");
    const live = ph > published;
    g.text(X + 2, 2, live ? "1.1.0 • Public • just now" : "1.0.2 • Public", "1");
    g.hline(X + 1, X + CW - 2, 4, "─", "2");
    g.text(X + 2, 6, "Weekly Downloads", "1");
    // the graph: bars that grow once the new version is out
    const GX = X + 2, GW = CW - 4, GY = 9, GH = 12;
    const k = live ? clamp((ph - published) / 3) : 0;
    let last = 0;
    for (let i = 0; i < GW; i++) {
      const u = i / (GW - 1);
      const base = 0.25 + 0.2 * Math.sin(u * 9) * 0.3 + u * 0.25;
      const bump = u > 0.75 ? k * (u - 0.75) * 2.6 : 0;
      const v = clamp(base + bump, 0, 1), h = Math.round(v * GH);
      for (let j = 0; j < h; j++) g.set(GX + i, GY + GH - 1 - j, j === h - 1 ? "▄" : "█", u > 0.75 && live ? "3" : "8");
      last = v;
    }
    const n = Math.round(1400 + last * 3200);
    const num = n.toLocaleString("en-US");
    g.text(X + CW - 2 - num.length, 6, num, "0");
    g.hline(GX, GX + GW - 1, GY + GH, "─", "2");
    g.text(GX, GY + GH + 1, "Oct", "1"); g.text(GX + GW - 3, GY + GH + 1, "now", "1");
    return g.frame();
  };
}
