/* spider-web: a spider spins an orb web at dusk, spoke by spoke and then round and round, until dew glints on it. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#06060e", "#0e1020", "#1a1a34", "#2a2444", "#3e3050", "#56405a"], 12));
const LEAF = add(gradient(["#081208", "#12240e", "#1e3a16", "#2e5220"], 4));
const TWIG = add(["#2a1a10", "#4a321e"]);
const SILK = add(["#5a6478", "#9aa4bc", "#d4dcee", "#ffffff"]);
const DEW = add(["#a8f0ff", "#ffffff"]);
const SPIDER = add(["#1a0e06", "#5a3412", "#b8742a", "#f0b050"]);

export const meta = {
  slug: "spider-web",
  name: "Spider Web",
  category: "animals",
  note: "A spider spins an orb web at dusk, spoke by spoke and then round and round, until dew glints along the finished threads.",
  tags: ["spider", "web", "halloween", "night", "loader", "404"],
  cols: 84, rows: 36, fps: 20,
  palette: palette(P),
};

const CYCLE = 22, NS = 16, TURNS = 9;
const SH = " ░▒▓█";
const segCh = (dx, dy) => { const a = Math.atan2(dy * 2, dx); const s = Math.abs(Math.sin(a)), c = Math.abs(Math.cos(a)); return s < 0.38 ? "─" : c < 0.38 ? "│" : (dx > 0) === (dy > 0) ? "\\" : "/"; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 42, cy = 17;
  const r = rng(66);
  const spokes = Array.from({ length: NS }, (_, i) => {
    const a = (i / NS) * TAU + (r() - 0.5) * 0.12;
    return { a, R: 15.5 + r() * 2.5 };
  });
  const pt = (i, rad) => { const s = spokes[((i % NS) + NS) % NS]; return [cx + Math.cos(s.a) * rad * 2.1, cy + Math.sin(s.a) * rad]; };
  const M = NS * TURNS;
  const spiral = Array.from({ length: M + 1 }, (_, k) => { const f = k / M; return pt(k, spokes[k % NS].R * (0.95 - f * 0.8)); });
  const dew = Array.from({ length: 40 }, () => [Math.floor(r() * M), r() * TAU]);
  const drawSeg = (x0, y0, x1, y1, key) => g.line(x0, y0, x1, y1, segCh(x1 - x0, y1 - y0), key);
  const spider = (x, y, t) => {
    const step = Math.floor(t * 8) % 2;
    g.text(x - 3, y - 1, step ? "╲╲ ╱╱" : "╲│ │╱", KEYS[SPIDER + 1]);
    g.text(x - 2, y, "(", KEYS[SPIDER + 1]); g.text(x + 2, y, ")", KEYS[SPIDER + 1]);
    g.set(x - 1, y, "●", KEYS[SPIDER + 2]); g.set(x, y, "●", KEYS[SPIDER + 3]); g.set(x + 1, y, "●", KEYS[SPIDER + 2]);
    g.text(x - 3, y + 1, step ? "╱╱ ╲╲" : "╱│ │╲", KEYS[SPIDER + 1]);
  };
  return (t) => {
    g.clear();
    const p = (t + 12) % CYCLE;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.05 + t * 0.02, y * 0.1, 3, 2);
      const bok = noise2(x * 0.15, y * 0.3, 9);
      const v = clamp(0.2 + (1 - y / rows) * 0.45 + (n - 0.5) * 0.5 + (bok > 0.8 ? 0.2 : 0));
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 3.6))], KEYS[BG + Math.min(11, Math.floor(v * 12))]);
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const e = Math.min(x / 2, cols / 2 - x / 2, y, rows - y);
      const n = fbm(x * 0.12, y * 0.25, 3, 5);
      if (e + (n - 0.5) * 8 < 2.5) g.set(x, y, n > 0.55 ? "▓" : "█", KEYS[LEAF + Math.min(3, Math.floor(n * 4))]);
    }
    for (let k = 0; k < 18; k++) g.set(2 + k, 1 + Math.floor(k * 0.35), "▀", KEYS[TWIG + 1]);
    for (let k = 0; k < 18; k++) g.set(cols - 3 - k, rows - 2 - Math.floor(k * 0.3), "▄", KEYS[TWIG + 1]);
    const spokeT = 7, spiralT = 11;
    const fade = p > CYCLE - 1.2 ? (CYCLE - p) / 1.2 : 1;
    const silk = KEYS[SILK + (fade > 0.6 ? 1 : 0)];
    const spokesDone = Math.min(NS, (p / spokeT) * NS);
    let sx = cx, sy = cy;
    for (let i = 0; i < Math.ceil(spokesDone); i++) {
      const f = Math.min(1, spokesDone - i);
      const [ex, ey] = pt(i, spokes[i].R * f);
      drawSeg(cx, cy, ex, ey, silk);
      if (f < 1) { const back = f; [sx, sy] = [ex, ey]; }
    }
    if (p >= spokeT) {
      const k = Math.min(M, Math.floor(((p - spokeT) / spiralT) * M));
      for (let j = 0; j < k; j++) drawSeg(spiral[j][0], spiral[j][1], spiral[j + 1][0], spiral[j + 1][1], KEYS[SILK + (fade > 0.6 ? 2 : 0)]);
      if (k < M) [sx, sy] = spiral[k];
      else { sx = cx; sy = cy; }
      if (k >= M) for (const [d, ph] of dew) {
        const s = Math.sin(t * 2 + ph);
        g.set(spiral[d][0], spiral[d][1], s > 0.6 ? "●" : "°", KEYS[DEW + (s > 0.6 ? 1 : 0)]);
      }
    }
    for (let i = 0; i < NS; i += 4) if (i < spokesDone) { const [ex, ey] = pt(i, spokes[i].R); g.set(ex, ey, "+", KEYS[SILK + 2]); }
    g.set(cx, cy, "◆", KEYS[SILK + 3]);
    if (fade > 0.3) spider(Math.round(sx), Math.round(sy), t);
    return g.frame();
  };
}
