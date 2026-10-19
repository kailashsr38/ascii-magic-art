/* lunar-new-year: a red and gold dragon dance weaving down a street under rows of red lanterns. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#14020a", "#2e0612", "#4a0c1a", "#6a1424", "#8a2230"], 10);   // 0..9
const RED = gradient(["#4a0608", "#8a0e12", "#c81e1e", "#f0402a", "#ff7a4a"], 6);   // 10..15
const GOLD = gradient(["#6a4a08", "#b8860e", "#f0c020", "#ffe46a", "#fff6c8"], 6);  // 16..21
const NAMED = ["#1f7a3a", "#3ab05a", "#f4ead0", "#101010", "#2a0a0a", "#3a1410", "#5a2418", "#ffd84a", "#c8a050", "#1a1a2a"];
// 22 green dark, 23 green, 24 cream, 25 black, 26 street dark, 27 street, 28 street lit, 29 glow, 30 pole, 31 pants
const pal = palette([...SKY, ...RED, ...GOLD, ...NAMED]);

export const meta = {
  slug: "lunar-new-year",
  name: "Dragon Dance",
  category: "occasions",
  note: "A red and gold dragon weaves down a lantern-lit street on its dancers' poles to celebrate the lunar new year.",
  tags: ["lunar new year", "dragon", "lanterns", "festival", "hero", "celebration"],
  cols: 100, rows: 34, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const HEAD = [
  ["   ▄▲  ▄▲      ", "   GG  GG      "],
  [" ▄▄█████▄▄     ", " MMRRRRRMM     "],
  ["▄███●█████▄▄   ", "MRRRERRRRRRR   "],
  ["███████████████", "RRRRRRRRRRRRRRR"],
  ["███▀▀▀▀▀▀▀▀▀▀▀ ", "RRRRRRRRRRRRRR "],
  ["████▄▄▄▄▄▄▄▄▄▄ ", "RRRRWWWWWWWWGG "],
  [" ▀███████████▀ ", " GGGGGGGGGGGGG "],
  ["  ▀▀ ▀ ▀▀ ▀    ", "  MM M MM M    "],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(8);
  const lanterns = [6, 19, 32, 45, 58, 71, 84, 95].map((x, i) => ({ x, ph: r() * 6, drop: 3 + (i % 2) * 2 }));
  const sparks = Array.from({ length: 40 }, () => [r() * cols, r() * 18, r() * 6.28]);
  const STREET = 30, HX = 82;
  return (t) => {
    g.clear();
    const yc = (x) => 20 + 3.2 * Math.sin(x * 0.12 - t * 2.6) + 0.8 * Math.sin(x * 0.05 + t);
    // crimson night with drifting clouds
    for (let y = 0; y < STREET; y++) for (let x = 0; x < cols; x++) {
      let glow = 0;
      for (const l of lanterns) { const d = Math.hypot((x - l.x) * 0.5, y - l.drop - 2); if (d < 8) glow += Math.exp(-d / 2.5); }
      const n = fbm(x * 0.05 - t * 0.05, y * 0.14, 3);
      const swirl = Math.abs(Math.sin(n * 18)) < 0.12 && n > 0.55;
      const v = clamp(0.18 + y / STREET * 0.4 + (n - 0.5) * 0.45 + glow * 0.35);
      g.set(x, y, swirl ? "~" : SH[1 + Math.min(3, Math.floor(v * 4))], swirl ? KEYS[17] : KEYS[Math.min(9, Math.floor(v * 10))]);
    }
    for (const [x, y, ph] of sparks) { const b = Math.sin(t * 2 + ph); if (b > 0.4) g.set(x, y, b > 0.9 ? "*" : "·", KEYS[19]); }
    // street, lit warm in the middle
    for (let y = STREET; y < rows; y++) for (let x = 0; x < cols; x++) {
      const brick = (x + (y % 2) * 3) % 6 === 0;
      g.set(x, y, brick ? "▌" : "█", KEYS[brick ? 26 : y === STREET ? 28 : 27]);
    }
    // the string of lanterns
    for (let x = 0; x < cols; x++) g.set(x, Math.round(1 + 0.6 * Math.sin(x * 0.25)), "─", KEYS[17]);
    for (const l of lanterns) {
      const sw = Math.round(Math.sin(t * 1.1 + l.ph) * 0.8);
      const x = l.x + sw, y = l.drop;
      g.line(l.x, 1, x, y - 1, "│", KEYS[17]);
      g.text(x - 2, y, "▄███▄", KEYS[18]);
      for (let j = 1; j <= 4; j++) {
        const w = j === 1 || j === 4 ? 3 : 4;
        for (let i = -w; i <= w; i++) {
          const rib = i === 0 || Math.abs(i) === 2;
          const lit = 1 - Math.abs(i) / (w + 1);
          g.set(x + i, y + j, rib ? "│" : "█", rib ? KEYS[18] : KEYS[10 + Math.min(5, Math.floor(1 + lit * 4.5 + 0.3 * Math.sin(t * 6 + l.ph)))]);
        }
      }
      g.text(x - 2, y + 5, "▀███▀", KEYS[18]);
      g.set(x, y + 6, "│", KEYS[19]); g.set(x, y + 7, "▼", KEYS[13]);
    }
    // dancers' legs and poles
    for (let px = 8; px < HX; px += 10) {
      const by = Math.round(yc(px)) + 3;
      g.line(px, by, px, STREET - 3, "║", KEYS[30]);
      const step = Math.sin(t * 6 + px) > 0;
      g.text(px - 1, STREET - 3, "▄█▄", KEYS[13]);
      g.text(px - 1, STREET - 2, step ? "▌ ▐" : "▐ ▌", KEYS[31]);
      g.text(px - 1, STREET - 1, step ? "▀ ▀" : " ▀▀", KEYS[25]);
    }
    // the dragon's body, a weaving tube of scales with gold belly and green spines
    for (let x = 1; x < HX + 1; x++) {
      const c = yc(x);
      const taper = Math.min(1, x / 14);
      const half = 1.2 + 1.4 * taper;
      for (let y = Math.floor(c - half - 1); y <= Math.ceil(c + half); y++) {
        const v = (y - c) / half;
        if (v < -1.35 || v > 1) continue;
        if (v < -1) {                                   // spines along the back
          if (x % 3 === 0) g.set(x, y, "▲", KEYS[x % 6 === 0 ? 23 : 20]);
          continue;
        }
        const hoop = x % 9 === 0;
        if (hoop) { g.set(x, y, "█", KEYS[18 + (v < 0 ? 1 : 0)]); continue; }
        if (v > 0.45) { g.set(x, y, (x + y) % 2 ? "▓" : "█", KEYS[v > 0.75 ? 17 : 18]); continue; }
        const scale = ((x + Math.round(y) * 2) % 4) === 0;
        const lit = clamp(0.75 - Math.abs(v + 0.3) * 0.6);
        g.set(x, y, scale ? "◆" : "█", scale ? KEYS[19] : KEYS[10 + Math.min(5, Math.floor(lit * 6))]);
      }
    }
    // tail tuft
    const tc = Math.round(yc(1));
    g.text(0, tc - 2, "▓▒", KEYS[23]); g.text(0, tc + 1, "▓▒", KEYS[22]);
    // the head, bobbing with the body
    const hy = Math.round(yc(HX)) - 4;
    const jaw = Math.sin(t * 4) > 0.3 ? 1 : 0;
    HEAD.forEach(([chs, cos], j) => {
      const yy = hy + j + (j >= 5 ? jaw : 0);
      for (let i = 0; i < chs.length; i++) {
        if (chs[i] === " ") continue;
        const k = { G: 19, R: 12 + (j < 3 ? 1 : 0), M: 23, E: 21, W: 24 }[cos[i]];
        g.set(HX + i - 2, yy, chs[i], KEYS[k]);
      }
    });
    // mane flowing behind the head and whiskers in front
    for (let j = -3; j <= 3; j++) for (let i = 0; i < 6; i++) {
      const n = fbm(i * 0.5 - t * 2, j * 0.6 + t, 2);
      if (n > 0.45) g.set(HX - 4 - i, hy + 3 + j, n > 0.6 ? "▓" : "▒", KEYS[n > 0.55 ? 23 : 22]);
    }
    for (let i = 0; i < 6; i++) {
      const wy = hy + 4 + Math.round(Math.sin(t * 3 + i * 0.7) * 1.2 + i * 0.4);
      g.set(HX + 13 + Math.min(i, 4), wy, i % 2 ? "~" : "≈", KEYS[20]);
    }
    return g.frame();
  };
}
