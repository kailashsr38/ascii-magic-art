/* repo-star-button: a repository header where a cursor clicks Star and the count ticks over to your number. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "repo-star-button",
  name: "Star Button Click",
  category: "screens",
  note: "A repository header with Watch, Fork and Star buttons: the cursor glides over, clicks Star, and the count ticks over to your number.",
  tags: ["github", "stars", "button", "repo", "readme", "open-source", "cursor", "ui"],
  cols: 84, rows: 22, fps: 30,
  loop: 8,
  params: {
    stars: { label: "Stars", type: "number", default: 100, min: 1, max: 9999999 },
    repo: { label: "Repo", default: "kailashsr38/ascii-magic-art", max: 40 },
    about: { label: "Description", default: "Animated ASCII art for web pages, READMEs and terminals.", max: 76 },
  },
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#ffd75e", "#79c0ff", "#7ee787", "#161b22", "#f0f6fc", "#d2a8ff", "#ff7b72"]),
};

const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));
const LOOP = 8;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; };

export default function create(p = {}) {
  const P = meta.params;
  const target = Math.max(1, Math.round(p.stars ?? P.stars.default));
  const repo = String(p.repo ?? P.repo.default);
  const about = String(p.about ?? P.about.default);
  const g = new Grid(meta.cols, meta.rows), W = meta.cols;
  const [owner, name] = repo.includes("/") ? [repo.slice(0, repo.indexOf("/")), repo.slice(repo.indexOf("/") + 1)] : ["", repo];

  const button = (x, y, label, count, on) => {
    const inner = ` ${label} │ ${count} `, w = inner.length + 2;
    g.box(x, y, w, 3, "round", on ? "3" : "2");
    g.text(x + 1, y + 1, inner, on ? "3" : "0");
    g.set(x + label.length + 3, y + 1, "│", on ? "3" : "2");
    return w;
  };

  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    const clicked = ph > 3.2 && ph < 7.4;
    // header: owner / name, Public pill
    const shown = (owner ? owner + " / " : "") + name, nm = shown.length > W - 16 ? shown.slice(0, W - 18) + ".." : shown;
    g.text(2, 1, "■", "1"); g.text(4, 1, nm, "4");
    if (owner) g.text(4, 1, owner, "0"), g.text(4 + owner.length + 1, 1, "/", "1");
    g.box(5 + nm.length, 0, 8, 3, "round", "2"); g.text(6 + nm.length, 1, "Public", "1");
    g.text(2, 3, about.length > W - 4 ? about.slice(0, W - 6) + ".." : about, "1");
    g.hline(0, W - 1, 4, "─", "2");
    // buttons, right aligned
    // laid out from the right edge, sized for the wider "Starred" state so nothing jumps
    const count = clicked ? target : Math.max(0, target - 1);
    const starW = "* Starred".length + fmt(Math.max(target, 1)).length + 7;
    const starX = W - 2 - starW, forkX = starX - 1 - ("Fork".length + 1 + 7), watchX = forkX - 1 - ("Watch".length + 1 + 7);
    button(watchX, 6, "Watch", "4", false);
    button(forkX, 6, "Fork", "9", false);
    button(starX, 6, clicked ? "* Starred" : "* Star", fmt(count), clicked);
    // tabs and a README peek
    const tabs = ["<> Code", "Issues 3", "Pull requests 1", "Actions", "Insights"];
    let tx = 2;
    tabs.forEach((s, i) => { g.text(tx, 10, s, i === 0 ? "0" : "1"); if (i === 0) g.hline(tx, tx + s.length - 1, 11, "━", "3"); tx += s.length + 3; });
    g.hline(0, W - 1, 11, "─", "2"); g.hline(2, 8, 11, "━", "3");
    g.box(2, 13, W - 4, 8, "light", "2");
    g.text(4, 14, "README.md", "0");
    g.text(4, 16, "# " + (name.length > W - 14 ? name.slice(0, W - 16) + ".." : name), "7");
    g.text(4, 18, "MIT licensed. Stars keep it going.", "1");
    // the burst when it lands
    if (clicked && ph < 4.3) {
      const b = (ph - 3.2) / 1.1, cx = starX + 3, cy = 7;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2, d = 1 + b * 5;
        const x = cx + Math.cos(a) * d * 2, y = cy + Math.sin(a) * d * 0.6;
        if (g.get(x, y) === " ") g.set(x, y, b < 0.5 ? "*" : "·", k % 2 ? "3" : "8"); // sparks never cut a border
      }
    }
    // the cursor: in from the bottom left, onto Star, click, then away to the right
    const A = [10, 21], B = [starX + 3, 7], C = [W - 18, 21];
    const at = ph < 1 ? A : ph < 3 ? [lerp(A[0], B[0], ease((ph - 1) / 2)), lerp(A[1], B[1], ease((ph - 1) / 2))]
      : ph < 5 ? B : ph < 6.5 ? [lerp(B[0], C[0], ease((ph - 5) / 1.5)), lerp(B[1], C[1], ease((ph - 5) / 1.5))] : C;
    const cxp = Math.round(at[0]), cyp = Math.round(at[1]);
    const press = ph > 3.05 && ph < 3.35;
    // the pointer floats over the page, but never breaks a box edge
    const free = (x, y) => !"─│┌┐└┘╭╮╰╯━".includes(g.get(x, y));
    if (free(cxp, cyp)) g.set(cxp, cyp, press ? "◆" : "▲", "7");
    if (free(cxp + 1, cyp + 1)) g.set(cxp + 1, cyp + 1, "▘", "7");
    return g.frame();
  };
}
