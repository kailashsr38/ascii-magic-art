/* readme-badges: the badge row at the top of a README, values updating live. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "readme-badges",
  name: "README Badge Row",
  category: "screens",
  note: "A README's badge row where build turns passing, coverage climbs, downloads tick up and the star count rolls over.",
  tags: ["readme", "badges", "github", "ci", "coverage", "open-source", "status", "header"],
  cols: 92, rows: 14, fps: 24,
  loop: 10,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#3fb950", "#d29922", "#1f6feb", "#8957e5", "#da3633", "#ffd75e", "#0d1117"]),
};

const LOOP = 10;
const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

export default function create() {
  const g = new Grid(meta.cols, meta.rows), W = meta.cols;
  // a two-part badge: grey label, coloured value, drawn as a solid bar with the text knocked out
  const badge = (x, y, label, value, vc) => {
    const lw = label.length + 2, vw = value.length + 2;
    for (let i = 0; i < lw; i++) g.set(x + i, y, "▄", "2"), g.set(x + i, y + 2, "▀", "2"), g.set(x + i, y + 1, " ");
    for (let i = 0; i < vw; i++) g.set(x + lw + i, y, "▄", vc), g.set(x + lw + i, y + 2, "▀", vc);
    g.text(x + 1, y + 1, label, "0");
    g.text(x + lw + 1, y + 1, value, "0"); // white on the colour bars, so every value reads
    return lw + vw;
  };
  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    g.text(2, 1, "# ascii-magic-art", "0");
    g.text(2, 2, "Animated ASCII art for web pages, READMEs and terminals.", "1");
    // values over the loop
    const passing = ph > 2.2;
    const cov = Math.min(98, 81 + Math.floor(Math.max(0, ph - 1) * 4));
    const dl = 18200 + Math.floor(ph * 37);
    const stars = ph < 6 ? 99 : 100;
    let x = 2;
    x += badge(x, 4, "build", passing ? "passing" : "running", passing ? "3" : "4") + 2;
    x += badge(x, 4, "coverage", cov + "%", cov > 95 ? "3" : cov > 85 ? "4" : "7") + 2;
    x += badge(x, 4, "npm", "v1.1.0", "5") + 2;
    badge(x, 4, "license", "MIT", "5");
    x = 2;
    x += badge(x, 8, "downloads", fmtK(dl) + "/month", "6") + 2;
    x += badge(x, 8, "stars", String(stars), ph > 6 && ph < 7.2 ? "8" : "4") + 2;
    badge(x, 8, "pieces", "734", "3");
    g.hline(2, W - 3, 12, "─", "2");
    return g.frame();
  };
}
