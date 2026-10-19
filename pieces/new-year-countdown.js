/* new-year-countdown: a big golden countdown from 5 to 0 over a city, then fireworks and HAPPY NEW YEAR. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract, TAU } from "../lib/kit.js";

const SKY = gradient(["#03040e", "#0a0f2a", "#161c48", "#2a2a66", "#4a3a80"], 8);   // 0..7
const CITY = gradient(["#05060c", "#0c0f1e", "#151a30", "#1f2642"], 4);             // 8..11
const WIN = ["#ffd56a", "#7a6a3a"];                                                 // 12, 13
const GOLD = gradient(["#8a5a12", "#d8961e", "#ffd04a", "#fff2b0", "#ffffff"], 6);  // 14..19
const FW = [];
for (const h of ["#ff3b6b", "#ffd23a", "#3bd1ff", "#7dff6a", "#d07dff", "#ff8a2a"]) FW.push(...gradient(["#2a1a3a", h, "#ffffff"], 4).slice(1)); // 20..37
const RAIN = gradient(["#ff5a7a", "#ffb03a", "#ffe94a", "#6aff8a", "#4ad8ff", "#a87dff", "#ff5a7a"], 12);     // 38..49
const pal = palette([...SKY, ...CITY, ...WIN, ...GOLD, ...FW, ...RAIN]);

export const meta = {
  slug: "new-year-countdown",
  name: "New Year Countdown",
  category: "occasions",
  note: "A big golden countdown from five to zero over a sleeping city, then fireworks burst and HAPPY NEW YEAR lights up.",
  tags: ["new year", "countdown", "fireworks", "celebration", "hero", "holiday"],
  cols: 100, rows: 34, fps: 24,
  palette: pal,
};

const DIG = {
  0: ["███", "█ █", "█ █", "█ █", "███"], 1: [" █ ", "██ ", " █ ", " █ ", "███"], 2: ["███", "  █", "███", "█  ", "███"],
  3: ["███", "  █", "███", "  █", "███"], 4: ["█ █", "█ █", "███", "  █", "  █"], 5: ["███", "█  ", "███", "  █", "███"],
};
const LET = {
  H: ["█   █", "█   █", "█████", "█   █", "█   █"], A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  P: ["████ ", "█   █", "████ ", "█    ", "█    "], Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"], E: ["█████", "█    ", "████ ", "█    ", "█████"],
  W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"], R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  " ": ["     ", "     ", "     ", "     ", "     "],
};
const SH = " ░▒▓█";
const LOOP = 14, COUNT = 6;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(2026);
  const skyline = [];
  let x = 0;
  while (x < cols) { const w = 5 + Math.floor(r() * 9), h = 3 + Math.floor(r() * 7); skyline.push([x, w, h, Math.floor(r() * 3)]); x += w; }
  const windows = [];
  for (const [bx, w, h] of skyline) for (let j = 1; j < h; j++) for (let i = 1; i < w - 1; i += 2) if (r() < 0.45) windows.push([bx + i, rows - h + j, r() * 6.28]);
  const bursts = Array.from({ length: 18 }, (_, i) => ({
    t0: COUNT - 0.4 + i * 0.4, x: 10 + r() * (cols - 20), y: 4 + r() * 12, h: Math.floor(r() * 6), n: 22 + Math.floor(r() * 10), sp: 0.8 + r() * 0.5, s: r() * 6,
  }));
  const glyph = (pat, x0, y0, sx, sy, key) => {
    for (let j = 0; j < pat.length * sy; j++) for (let i = 0; i < pat[0].length * sx; i++) {
      if (pat[Math.floor(j / sy)][Math.floor(i / sx)] !== " ") g.set(x0 + i, y0 + j, "█", key(i, j));
    }
  };
  return (t) => {
    g.clear();
    const lt = ((t % LOOP) + LOOP) % LOOP;
    const party = lt >= COUNT;
    // night sky, flashing with the fireworks
    let flash = 0;
    if (party) for (const b of bursts) { const a = lt - b.t0 - 0.6; if (a > 0 && a < 0.25) flash = Math.max(flash, 1 - a / 0.25); }
    for (let y = 0; y < rows; y++) for (let xx = 0; xx < cols; xx++) {
      const n = fbm(xx * 0.05 + t * 0.03, y * 0.14, 3);
      const v = clamp(0.3 + y / rows * 0.45 + (n - 0.5) * 0.45 + flash * 0.25);
      g.set(xx, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    // city skyline with twinkling windows
    for (const [bx, w, h, tone] of skyline) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(bx + i, rows - h + j, j === 0 ? "▄" : "█", KEYS[8 + tone + (j === 0 ? 1 : 0)]);
    for (const [wx, wy, ph] of windows) g.set(wx, wy, "▪", KEYS[Math.sin(t * 0.7 + ph) > -0.3 ? 12 : 13]);
    if (!party) {
      // the countdown: a big digit that pops in each second
      const k = Math.floor(lt), f = lt - k;
      const d = DIG[5 - k];
      const pop = f < 0.12 ? 1 : 0;
      const sx = 6 + pop, sy = 3 + pop;
      const x0 = Math.round(cols / 2 - (3 * sx) / 2), y0 = Math.round(11 - (5 * sy) / 2);
      glyph(d, x0, y0, sx, sy, (i, j) => KEYS[14 + Math.min(5, Math.max(0, Math.floor(5 - j / sy * 1.1 + (Math.sin(i * 0.4 - t * 6) > 0.85 ? 1 : 0))))]);
      // ticking ring of dots around the digit, emptying as the second runs
      for (let i = 0; i < 40; i++) {
        const a = i / 40 * TAU - Math.PI / 2;
        if (i / 40 > 1 - f) continue;
        g.set(cols / 2 + Math.cos(a) * 18, 11 + Math.sin(a) * 9, "•", KEYS[16]);
      }
    } else {
      // fireworks
      for (const b of bursts) {
        const a = lt - b.t0;
        if (a < 0) continue;
        if (a < 0.6) {                                                  // rocket rising
          const y = rows - 1 - (rows - 1 - b.y) * (a / 0.6);
          g.set(b.x, y, "│", KEYS[17]); g.set(b.x, y + 1, "·", KEYS[15]);
          continue;
        }
        const e = a - 0.6;
        if (e > 2.4) continue;
        const fade = 1 - e / 2.4;
        for (let i = 0; i < b.n; i++) {
          const ang = i / b.n * TAU + b.s;
          const v = b.sp * (0.85 + 0.15 * Math.sin(i * 3.7));
          for (let tr = 0; tr < 5; tr++) {
            const tt = Math.max(0, e - tr * 0.08);
            const px = b.x + Math.cos(ang) * v * 20 * (1 - Math.exp(-tt * 2.2));
            const py = b.y + Math.sin(ang) * v * 9.5 * (1 - Math.exp(-tt * 2.2)) + tt * tt * 1.6;
            const lv = Math.min(2, Math.floor(fade * 3.4) - (tr > 2 ? 1 : 0));
            if (lv < 0) continue;
            g.set(px, py, tr === 0 ? (fade > 0.5 ? "*" : "•") : tr < 3 ? "•" : "·", KEYS[20 + b.h * 3 + lv]);
          }
        }
      }
      // HAPPY / NEW YEAR, revealed letter by letter, rainbow shimmer
      const lines = [["HAPPY", 6], ["NEW YEAR", 13]];
      let idx = 0;
      for (const [word, y0] of lines) {
        const w = word.length * 12 - 2;
        let x0 = Math.round((cols - w) / 2);
        for (const c of word) {
          const show = lt - COUNT + 0.01 - idx * 0.06;
          if (show > 0 && c !== " ") {
            const lift = show < 0.15 ? -1 : 0;
            glyph(LET[c], x0, y0 + lift, 2, 1, (i, j) => KEYS[38 + Math.floor(fract((x0 + i) / 60 - t * 0.4 + j * 0.02) * 12) % 12]);
          }
          x0 += 12; idx++;
        }
      }
    }
    return g.frame();
  };
}
