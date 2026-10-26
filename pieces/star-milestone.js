/* star-milestone: a repo star milestone, made to post: a gold star spins in, the count rolls up to it, confetti falls. Your repo, your number. */
import { Grid, palette, clamp, TAU } from "../lib/kit.js";

export const meta = {
  slug: "star-milestone",
  name: "Star Milestone",
  category: "occasions",
  note: "A gold star spins in, the star count rolls up to your milestone and confetti falls, with your repo name and a thank-you line you can change.",
  tags: ["github", "stars", "milestone", "readme", "celebration", "open-source", "thank-you", "counter"],
  cols: 100, rows: 34, fps: 30,
  loop: 10,  // seconds: exports start at 0 and run the whole story
  params: {
    stars: { label: "Stars", type: "number", default: 100, min: 1, max: 9999999 },
    repo: { label: "Repo", default: "kailashsr38/ascii-magic-art", max: 40 },
    thanks: { label: "Message", default: "Thank you for every star", max: 48 },
  },
  palette: palette([
    "#5a4410", "#8a6414", "#c08a1a", "#e8b423", "#ffd75e", "#fff2b8", // 0-5 star, dark to light
    "#e6edf3", "#8b949e", "#30363d",                                // 6-8 text, muted, borders
    "#ff7b72", "#79c0ff", "#7ee787", "#d2a8ff", "#ffa657", "#f778ba", // 9-e confetti
  ]),
};

/* A bold 6x8 digit font (strokes two pixels wide, so they hold up in the halftone looks),
 * drawn two cells wide per pixel so the digits read upright. */
const FONT = {
  "0": [" #### ", "##  ##", "##  ##", "##  ##", "##  ##", "##  ##", "##  ##", " #### "],
  "1": ["  ##  ", " ###  ", "####  ", "  ##  ", "  ##  ", "  ##  ", "  ##  ", "######"],
  "2": [" #### ", "##  ##", "    ##", "   ## ", "  ##  ", " ##   ", "##    ", "######"],
  "3": ["##### ", "    ##", "    ##", " #### ", "    ##", "    ##", "    ##", "##### "],
  "4": ["   ###", "  ####", " ## ##", "##  ##", "######", "    ##", "    ##", "    ##"],
  "5": ["######", "##    ", "##    ", "##### ", "    ##", "    ##", "##  ##", " #### "],
  "6": ["  ### ", " ##   ", "##    ", "##### ", "##  ##", "##  ##", "##  ##", " #### "],
  "7": ["######", "    ##", "   ## ", "   ## ", "  ##  ", "  ##  ", "  ##  ", "  ##  "],
  "8": [" #### ", "##  ##", "##  ##", " #### ", "##  ##", "##  ##", "##  ##", " #### "],
  "9": [" #### ", "##  ##", "##  ##", "##  ##", " #####", "    ##", "   ## ", " ###  "],
  ",": ["      ", "      ", "      ", "      ", "      ", "  ##  ", "  ##  ", " ##   "],
};
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const ease = (x) => 1 - (1 - clamp(x)) ** 3;
const hash = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

const LOOP = 10;            // seconds: spin in, count up, celebrate, hold
const COUNT = [0.4, 3.0];   // the roll-up window

export default function create(p = {}) {
  const P = meta.params;
  const stars = Math.max(1, Math.round(p.stars ?? P.stars.default));
  const repo = String(p.repo ?? P.repo.default);
  const thanks = String(p.thanks ?? P.thanks.default);
  const g = new Grid(meta.cols, meta.rows), W = meta.cols, H = meta.rows;

  // the star: a 5-point outline in unit space, filled per cell by point-in-polygon
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.42 : 1;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const inside = (x, y, P) => {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const SX = 50, SY = 8, R = 7.8; // centre and radius in rows (cells are twice as tall as wide)

  const drawStar = (t, ph) => {
    const pop = ph < 0.6 ? Math.sin(ease(ph / 0.6) * Math.PI * 0.5) * (1 + 0.25 * Math.sin(ease(ph / 0.6) * Math.PI)) : 1;
    // one full turn as it arrives, then a slow sway
    const ang = ph < 1.4 ? (1 - ease(ph / 1.4)) * TAU : Math.sin((t - 1.4) * 0.9) * 0.55;
    const cs = Math.cos(ang), r = R * pop;
    if (r < 0.5) return;
    const face = cs >= 0;
    for (let y = Math.floor(SY - r - 1); y <= SY + r + 1; y++) for (let x = Math.floor(SX - r * 2.2 - 2); x <= SX + r * 2.2 + 2; x++) {
      let hits = 0;
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const u = (x + ox - SX) / (r * 2) / (Math.abs(cs) < 0.08 ? 0.08 : Math.abs(cs)), v = (y + oy - SY) / r;
        if (inside(u, v, pts)) hits++;
      }
      if (!hits) continue;
      // light from the upper left; the back face is the darker gold
      const u = (x - SX) / (r * 2 * Math.max(0.08, Math.abs(cs))), v = (y - SY) / r;
      const lit = clamp(0.62 - u * 0.25 * (face ? 1 : -1) - v * 0.3 + (face ? 0.12 : -0.18), 0, 1);
      const k = face ? Math.round(1 + lit * 4) : Math.round(lit * 2.4);
      g.set(x, y, hits === 4 ? "█" : hits >= 2 ? "▓" : "▒", String(clamp(k, 0, 5)));
    }
  };

  const drawCount = (n) => {
    // two cells a pixel while it fits, one cell for very long counts
    const s = fmt(n), cw = s.length * 14 - 2 <= W - 4 ? 2 : 1, gap = cw + 1;
    const width = s.length * (6 * cw + gap) - gap;
    let x = Math.round((W - width) / 2);
    const y0 = 17;
    for (const ch of s) {
      (FONT[ch] || FONT["0"]).forEach((row, ry) => {
        const k = ry < 3 ? "5" : ry < 6 ? "4" : "3";
        for (let rx = 0; rx < 6; rx++) if (row[rx] === "#") for (let j = 0; j < cw; j++) g.set(x + rx * cw + j, y0 + ry, "█", k);
      });
      x += 6 * cw + gap;
    }
  };

  // the repo pill: "* Star | 100 | owner/repo", sized to its content
  const drawPill = (n) => {
    const count = fmt(n), room = W - 4 - (8 + count.length + 6);
    const name = repo.length > room ? repo.slice(0, Math.max(3, room - 2)) + ".." : repo;
    const inner = ` * Star │ ${count} │ ${name} `, w = inner.length + 2, x = Math.round((W - w) / 2), y = 28;
    g.box(x, y, w, 3, "round", "8");
    g.text(x + 1, y + 1, inner, "6");
    g.text(x + 2, y + 1, "*", "4");
    g.text(x + 9, y + 1, "│", "8"); g.text(x + 12 + count.length, y + 1, "│", "8");
    g.text(x + 11, y + 1, count, "4");
  };

  // confetti: pieces fall the whole loop, tumbling between glyphs
  const CONF = Array.from({ length: 70 }, (_, i) => ({ x: hash(i, 1) * W, v: 3 + hash(i, 2) * 5, ph: hash(i, 3) * H, sw: hash(i, 4) * TAU, c: "9abcde"[i % 6] }));
  const BITS = "▪■▫•";
  // the burst when the count lands
  const BURST = Array.from({ length: 36 }, (_, i) => ({ a: (i / 36) * TAU + hash(i, 5) * 0.2, s: 9 + hash(i, 6) * 14, c: "45abce"[i % 6] }));

  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    // confetti behind everything
    for (let i = 0; i < CONF.length; i++) {
      const c = CONF[i], y = ((c.ph + t * c.v) % (H + 4)) - 2, x = c.x + Math.sin(t * 1.3 + c.sw) * 2;
      g.set(x, y, BITS[Math.floor(t * 4 + i) % BITS.length], c.c);
    }
    drawStar(t, ph);
    // burst of sparks when the count lands
    const b = ph - COUNT[1];
    if (b > 0 && b < 1.4) {
      for (const p of BURST) {
        const d = ease(b / 1.4) * p.s, x = SX + Math.cos(p.a) * d * 2, y = SY + Math.sin(p.a) * d;
        g.set(x, y, b < 0.5 ? "*" : b < 0.95 ? "+" : "·", p.c);
      }
    }
    const n = Math.round(stars * ease((ph - COUNT[0]) / (COUNT[1] - COUNT[0])));
    drawCount(Math.max(0, n));
    const label = "S T A R S";
    g.text(Math.round((W - label.length) / 2), 26, label, "7");
    drawPill(Math.max(0, n));
    const msg = thanks.length > W - 4 ? thanks.slice(0, W - 6) + ".." : thanks;
    g.text(Math.round((W - msg.length) / 2), 32, msg, "6");
    return g.frame();
  };
}
