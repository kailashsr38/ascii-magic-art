/* tokyo-crossing: a busy night scramble crossing, crowds streaming under glowing billboards. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#06061a", "#1a1236", "#341a48"], 4));
const BLDG = grp(["#0c0e1c", "#161a2c", "#22263c"]);
const WIN = grp(["#2a2a3a", "#ffd58a", "#9ae0ff"]);
const ADS = [
  grp(gradient(["#3a0a3a", "#d02aa0", "#ff7ae0"], 4)),
  grp(gradient(["#06303a", "#10b0d0", "#7af4ff"], 4)),
  grp(gradient(["#3a2000", "#e08a10", "#ffd060"], 4)),
  grp(gradient(["#3a0612", "#e0283c", "#ff8a96"], 4)),
  grp(gradient(["#0a3010", "#2ac040", "#a0ff9a"], 4)),
];
const ASPH = grp(gradient(["#0a0b14", "#141624", "#1e2234"], 4));
const STRIPE = grp(["#8a8ea4", "#d8dae4"]);
const WALK = grp(["#5a5e74", "#9a9eb4"]);
const HEAD = grp(["#1a1414", "#e0b090"]);
const CLOTH = grp(["#ff4a5a", "#ffd23a", "#f4f4f8", "#3a8aff", "#2a2a36", "#ff8a2a", "#7ae07a", "#c86ae0"]);
const SIG = grp(["#3aff8a", "#ff3a3a"]);

export const meta = {
  slug: "tokyo-crossing",
  name: "Tokyo Crossing",
  category: "landscapes",
  note: "Crowds stream across a scramble crossing at night beneath walls of glowing, flickering billboards.",
  tags: ["city", "night", "crowd", "neon", "street", "wallpaper"],
  cols: 100, rows: 38, fps: 24,
  palette: palette(P),
};

const STREET = 15;
const words = ["SALE", "NEW", "LIVE", "OPEN", "24H", "MUSIC", "GAMES", "CAFE"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(77);
  // building blocks and their windows
  const bmask = new Int8Array(cols * STREET);
  for (let x = 0; x < cols;) {
    const w = 6 + Math.floor(r() * 10), top = Math.floor(r() * 5);
    for (let i = x; i < Math.min(cols, x + w); i++) for (let y = top; y < STREET; y++) bmask[i + y * cols] = (i - x) % 3 === 1 && y % 2 === 1 ? 2 : 1;
    x += w;
  }
  const ads = [
    { x: 2, y: 2, w: 16, h: 6, c: 0, kind: "bars" },
    { x: 22, y: 1, w: 14, h: 5, c: 2, kind: "word" },
    { x: 40, y: 2, w: 20, h: 6, c: 1, kind: "wave" },
    { x: 64, y: 1, w: 12, h: 5, c: 3, kind: "word" },
    { x: 80, y: 3, w: 18, h: 6, c: 4, kind: "bars" },
    { x: 24, y: 8, w: 30, h: 3, c: 2, kind: "ticker" },
    { x: 62, y: 8, w: 14, h: 4, c: 0, kind: "word" },
  ];
  const ticker = "  NEW ARRIVALS  *  LIVE TONIGHT  *  OPEN LATE  *  FREE WIFI  *";
  // walking routes across the crossing: [x0, y0, x1, y1]
  const routes = [
    [-3, 20, 103, 20], [103, 21, -3, 21], [-3, 32, 103, 32], [103, 33, -3, 33],
    [10, 16, 10, 37], [12, 37, 12, 16], [88, 16, 88, 37], [90, 37, 90, 16],
    [8, 17, 92, 36], [92, 17, 8, 36], [90, 36, 10, 17],
  ];
  const people = Array.from({ length: 120 }, () => {
    const rt = routes[Math.floor(r() * routes.length)];
    const len = Math.hypot(rt[2] - rt[0], (rt[3] - rt[1]) * 2);
    return { rt, sp: (3 + r() * 3) / len, p: r(), off: (r() - 0.5) * 2.5, c: Math.floor(r() * 8) / 7, hair: r() < 0.8 ? 0 : 1 };
  });

  return (t) => {
    g.clear();
    // skyline, windows
    for (let y = 0; y < STREET; y++) for (let x = 0; x < cols; x++) {
      const m = bmask[x + y * cols];
      if (!m) g.set(x, y, "▓", SKY(y / STREET));
      else if (m === 2) {
        const on = noise2(x * 0.7, y * 0.9 + Math.floor(t * 0.3), 5) > 0.45;
        g.set(x, y, on ? "▪" : "·", WIN(on ? ((x + y) % 5 === 0 ? 1 : 0.5) : 0));
      } else g.set(x, y, "█", BLDG((x * 3 + y) % 7 === 0 ? 1 : 0));
    }
    // billboards, each with its own animation
    ads.forEach((a, ai) => {
      const C = ADS[a.c];
      g.box(a.x, a.y, a.w, a.h, "light", C(0.4));
      for (let j = 1; j < a.h - 1; j++) for (let i = 1; i < a.w - 1; i++) {
        const x = a.x + i, y = a.y + j;
        let v = 0;
        if (a.kind === "bars") v = 0.5 + 0.5 * Math.sin(i * 0.6 - t * 4 + j * 0.8 + ai);
        else if (a.kind === "wave") v = 0.5 + 0.5 * Math.sin(Math.hypot(i - a.w / 2, (j - a.h / 2) * 2) * 0.9 - t * 5);
        else v = 0.15;
        g.set(x, y, v > 0.66 ? "█" : v > 0.33 ? "▓" : "▒", C(v));
      }
      if (a.kind === "word") {
        const wd = words[(Math.floor(t * 0.5) + ai) % words.length];
        const flash = Math.floor(t * 2 + ai) % 4 !== 0;
        g.text(a.x + Math.floor((a.w - wd.length) / 2), a.y + Math.floor(a.h / 2), wd, C(flash ? 1 : 0.5));
      }
      if (a.kind === "ticker") {
        const off = Math.floor(t * 8);
        for (let i = 1; i < a.w - 1; i++) g.set(a.x + i, a.y + 1, ticker[(i + off) % ticker.length], C(1));
      }
    });
    // street, sidewalks, crossings
    for (let y = STREET; y < rows; y++) for (let x = 0; x < cols; x++) {
      const glow = Math.exp(-(y - STREET) / 4) * 0.6;
      const side = y < STREET + 2 || y > rows - 2;
      let ch = "█", col = ASPH(clamp(0.2 + glow + noise2(x * 0.3, y * 0.7, 3) * 0.3));
      if (side) { ch = "▓"; col = WALK(y === STREET ? 1 : 0); }
      else if ((y >= 19 && y <= 22) || (y >= 31 && y <= 34)) { if (x % 4 < 2) { ch = "█"; col = STRIPE(1); } }
      else if ((x >= 7 && x <= 14) || (x >= 85 && x <= 92)) { if (y % 2 === 0) { ch = "█"; col = STRIPE(0); } }
      else {
        // diagonal scramble stripes
        const d1 = (x - 8) * 0.5 - (y - 17) * 1.05, d2 = (92 - x) * 0.5 - (y - 17) * 1.05;
        if ((Math.abs(d1) < 1.6 || Math.abs(d2) < 1.6) && Math.floor((x + y * 2) / 2) % 2 === 0) { ch = "▓"; col = STRIPE(0); }
      }
      g.set(x, y, ch, col);
    }
    // walk signals
    const walk = 1;
    for (const [sx, sy] of [[5, STREET - 3], [94, STREET - 3]]) { g.set(sx, sy, "█", BLDG(2)); g.set(sx, sy + 1, "■", SIG(walk ? 0 : 1)); g.set(sx, sy + 2, "│", WALK(1)); }
    // the crowd, sorted top to bottom so nearer walkers overlap farther ones
    const pos = people.map((pp) => {
      const [x0, y0, x1, y1] = pp.rt;
      const u = (t * pp.sp + pp.p) % 1;
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
      return [x0 + dx * u + (-dy / l) * pp.off * 1.5, y0 + dy * u + (dx / l) * pp.off * 0.6, pp, u];
    }).sort((a, b) => a[1] - b[1]);
    for (const [x, y, pp, u] of pos) {
      if (y < STREET + 1) continue;
      const step = Math.floor(u * 400 + pp.p * 10) % 2;
      g.set(x, y - 1, "●", HEAD(pp.hair));
      g.set(x, y, step ? "▙" : "▟", CLOTH(pp.c));
    }
    return g.frame();
  };
}
