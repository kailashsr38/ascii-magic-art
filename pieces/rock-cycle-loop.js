/* rock-cycle-loop: a grain of rock travelling the rock cycle, through magma, igneous, sediment, sedimentary and metamorphic stages. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, fract, smooth } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#140e0c", "#1e1612", "#2a1e18", "#38281e"], 4));
add("mag", gradient(["#5a0e04", "#a0240a", "#e0501a", "#ff9a2a", "#ffe07a"], 6));
add("ign", ["#4a4a52", "#8a8a94", "#e8a0a0", "#f0f0f0", "#1a1a1e"]);
add("sed", gradient(["#6a4a26", "#9a7040", "#c49a5a", "#e2c08a"], 4));
add("met", gradient(["#2a2a3a", "#4a4a62", "#7a7a94", "#c0c0d4"], 4));
add("arrow", ["#8a7a60", "#ffd166"]);
add("ui", ["#e6edf3", "#8b949e", "#ffffff", "#7ee787"]);

export const meta = {
  slug: "rock-cycle-loop",
  name: "Rock Cycle Loop",
  category: "science",
  note: "A rock grain travels the rock cycle: magma cools into igneous rock, weathers into sediment, is pressed into sedimentary rock, squeezed into metamorphic rock and melts again.",
  tags: ["rock-cycle", "geology", "earth-science", "diagram", "education", "science"],
  cols: 96, rows: 32, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const NODES = [
  { name: "MAGMA", x: 37, y: 0 },
  { name: "IGNEOUS ROCK", x: 72, y: 9 },
  { name: "SEDIMENT", x: 60, y: 23 },
  { name: "SEDIMENTARY ROCK", x: 14, y: 23 },
  { name: "METAMORPHIC ROCK", x: 2, y: 9 },
];
const BW = 22, BH = 9;
const PROC = [
  ["cooling and", "crystallising"],
  ["weathering", "and erosion"],
  ["compaction and", "cementation"],
  ["heat and", "pressure"],
  ["melting", ""],
];
const PLACE = [[61, 3], [83, 19], [39, 28], [3, 19], [18, 3]];
const DESC = [
  ["Molten rock cools.", "Crystals grow and lock", "together: granite, basalt."],
  ["Rain, ice and wind break", "rock into grains that", "rivers carry away."],
  ["Layers of sediment pile", "up, are squeezed and", "glued into sandstone."],
  ["Buried deep, heat and", "pressure fold the rock", "into marble or schist."],
  ["Deeper still, the rock", "melts back into magma", "and the cycle restarts."],
];
const STEP = 4;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.2, y * 0.4, 3, 9);
  const r = rng(12);
  const crystals = Array.from({ length: 80 }, () => [Math.floor(r() * (BW - 2)), Math.floor(r() * (BH - 3)), Math.floor(r() * 5)]);
  const grains = Array.from({ length: 30 }, () => [r() * (BW - 2), r(), r()]);
  const anchor = (i) => [NODES[i].x + BW / 2, NODES[i].y + BH / 2];
  const edgePt = (i, j) => {
    // point on box i's border facing box j
    const [ax, ay] = anchor(i), [bx, by] = anchor(j);
    const dx = bx - ax, dy = (by - ay) * 2;
    const sx = (BW / 2 + 1) / Math.abs(dx || 1e-6), sy = (BH + 2) / Math.abs(dy || 1e-6);
    const s = Math.min(sx, sy);
    return [ax + dx * s, ay + (dy * s) / 2];
  };
  const texture = (i, x, y, t) => {
    const ix = NODES[i].x + 1 + x, iy = NODES[i].y + 2 + y, v = tex[ix + iy * cols];
    if (i === 0) {
      const m = fbm(x * 0.25 + t * 0.6, y * 0.5 - t * 0.4, 3, 2);
      return [m > 0.55 ? "█" : m > 0.4 ? "▓" : "▒", K("mag", clamp(Math.floor(m * 6), 0, 5))];
    }
    if (i === 1) return ["▒", K("ign", v > 0.5 ? 1 : 0)];
    if (i === 2) return [v > 0.7 ? "·" : " ", K("sed", 2)];
    if (i === 3) { const b = Math.floor((y + v * 0.8) * 1.3) % 4; return [b % 2 ? "▓" : "▒", K("sed", b)]; }
    const w = Math.floor((y + Math.sin(x * 0.55 + y) * 0.9 + 4) * 1.1) % 4;
    return [w % 2 ? "≈" : "▓", K("met", w)];
  };
  return (t) => {
    g.clear();
    const T = t % (STEP * 5), cur = Math.floor(T / STEP), f = (T - cur * STEP) / STEP;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // arrows between nodes
    for (let i = 0; i < 5; i++) {
      const j = (i + 1) % 5, [x0, y0] = edgePt(i, j), [x1, y1] = edgePt(j, i);
      const active = i === cur;
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0) * 2));
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
        const on = active && fract(k / 6 - t * 1.5) < 0.35;
        g.set(x, y, k === n ? "●" : on ? "•" : "·", K("arrow", on || (k === n && active) ? 1 : 0));
      }
      if (active && f < 0.7) {
        const p = smooth(f / 0.7), x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p;
        g.set(x, y, "◆", K("ui", 2)); g.set(x - 1, y, "(", K("arrow", 1)); g.set(x + 1, y, ")", K("arrow", 1));
      }
      const [px, py] = PLACE[i];
      g.text(px, py, PROC[i][0], K(active ? "arrow" : "ui", 1));
      if (PROC[i][1]) g.text(px, py + 1, PROC[i][1], K(active ? "arrow" : "ui", 1));
    }
    // boxes
    for (let i = 0; i < 5; i++) {
      const { name, x, y } = NODES[i];
      const here = (i === (cur + 1) % 5 && f >= 0.7) || (i === cur && f < 0.15);
      g.fill(x + 1, y + 1, BW - 2, BH - 2, " ");
      g.box(x, y, BW, BH, here ? "double" : "round", K("ui", here ? 2 : 1));
      g.text(x + 1 + Math.floor((BW - 2 - name.length) / 2), y + 1, name, K("ui", here ? 2 : 0));
      for (let yy = 0; yy < BH - 3; yy++) for (let xx = 0; xx < BW - 2; xx++) {
        const [ch, co] = texture(i, xx, yy, t);
        g.set(x + 1 + xx, y + 2 + yy, ch, co);
      }
      if (i === 1) for (const [cx, cy, c] of crystals) if (c > 1) g.set(x + 1 + cx, y + 2 + cy, c === 4 ? "■" : "▪", K("ign", c));
      if (i === 2) for (const [gx, ph, s] of grains) {
        const p = fract(t * (0.15 + s * 0.2) + ph), yy = Math.min(BH - 4, Math.floor(p * 1.6 * (BH - 3)));
        g.set(x + 1 + Math.floor(gx), y + 2 + yy, s > 0.6 ? "•" : s > 0.3 ? "o" : "·", K("sed", 1 + Math.floor(s * 3)));
      }
    }
    // centre caption
    g.text(40, 11, "THE ROCK CYCLE", K("ui", 2));
    DESC[cur].forEach((s, k) => g.text(Math.floor(47 - s.length / 2), 13 + k, s, K("ui", 0)));
    g.text(38, 17, `step ${cur + 1} of 5: ${PROC[cur][0].split(" ")[0]}`.padEnd(20), K("ui", 3));
    return g.frame();
  };
}
