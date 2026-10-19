/* porch-wind-chimes: copper wind chimes swinging under a porch roof as gusts blow leaves across the garden. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#3a4a7a", "#6a6a9a", "#b47a8a", "#f4a47a", "#ffd09a"], 10));
const HILL = add(["#1a2a24", "#24382e", "#30483a"]);
const GARDEN = add(gradient(["#0e1e14", "#1a3020", "#28482c", "#3a6038"], 6));
const ROOF = add(gradient(["#1e120a", "#3a2214", "#5a361e", "#7a4c2a"], 5));
const COPPER = add(gradient(["#4a1e0a", "#8a3e1a", "#c4683a", "#f0a070", "#ffd8b4"], 8));
const STRING = add(["#c8b48a"]);
const WOODK = add(["#6a4220", "#9a6432"]);
const LEAF = add(["#e8a03a", "#c86a2a", "#a8c04a", "#f4d06a"]);
const RING = add(["#ffd8b4", "#f4a070"]);

export const meta = {
  slug: "porch-wind-chimes",
  name: "Porch Wind Chimes",
  category: "things",
  note: "Copper wind chimes hang from a porch roof at sunset, swinging and knocking together in the gusts while leaves blow across the garden behind.",
  tags: ["wind chimes", "porch", "breeze", "garden", "calm", "wallpaper"],
  cols: 72, rows: 36, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(8);
  const leaves = Array.from({ length: 22 }, () => [R() * cols, R() * rows, 0.6 + R() * 0.8, R() * TAU, Math.floor(R() * 4)]);
  const tubes = [
    { dx: -14, len: 9, ph: 0.0 }, { dx: -9, len: 12, ph: 1.3 }, { dx: -4, len: 14, ph: 2.1 },
    { dx: 3, len: 13, ph: 0.7 }, { dx: 8, len: 11, ph: 2.9 }, { dx: 13, len: 8, ph: 1.8 },
  ];
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = y / 24;
    let ch = "█", co = KEYS[SKY + Math.min(9, Math.floor(v * 10))];
    const hill = 22 + Math.sin(x * 0.08) * 2 + fbm(x * 0.05, 1, 3, 2) * 4;
    if (y > hill) { ch = "█"; co = KEYS[HILL + Math.min(2, Math.floor((y - hill) / 3))]; }
    const bush = 28 + fbm(x * 0.12, 3, 3, 5) * 5;
    if (y > bush) { const n = noise2(x * 0.4, y * 0.6, 7); ch = n > 0.5 ? "▓" : "█"; co = KEYS[GARDEN + Math.min(5, Math.floor(n * 4 + (y - bush) * 0.3))]; }
    bg.push([ch, co]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const gust = 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.45) * 0.7 + Math.sin(t * 1.3) * 0.3);
    // leaves blown by the wind
    for (const [lx, ly, sp, ph, k] of leaves) {
      const x = ((lx + t * sp * 9 * (0.5 + gust)) % (cols + 10) + cols + 10) % (cols + 10) - 5;
      const y = ly + Math.sin(t * 1.5 + ph) * 2 + t * sp * 0.6 % rows;
      g.set(x, ((y % rows) + rows) % rows, Math.floor(t * 6 + ph) % 2 ? "◆" : "▲", KEYS[LEAF + k]);
    }
    // porch roof and beam
    for (let y = 0; y < 4; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === 3 ? "▀" : (x + y * 3) % 9 === 0 ? "▓" : "█", KEYS[ROOF + (y === 3 ? 4 : 1 + (y % 2))]);
    for (let x = 0; x < cols; x += 12) g.text(x, 4, "▐▌", KEYS[ROOF + 2]);
    // chime: hook, top disc, tubes, clapper and sail
    const cx = 36, topY = 8;
    const sway = Math.sin(t * 1.1) * 0.06 * gust;
    g.line(cx, 4, cx + sway * 30, topY - 1, "│", KEYS[STRING]);
    const ox = cx + sway * 40;
    g.text(Math.round(ox) - 16, topY, "▄".repeat(33), KEYS[WOODK + 1]);
    g.text(Math.round(ox) - 16, topY + 1, "▀".repeat(33), KEYS[WOODK]);
    const clapA = Math.sin(t * 1.9 + 0.4) * 0.22 * gust;
    const cpx = ox + Math.sin(clapA) * 16, cpy = topY + 12;
    const hits = [];
    tubes.forEach((tb, i) => {
      const a = Math.sin(t * (1.6 + i * 0.13) + tb.ph) * 0.1 * gust + sway;
      const ax = ox + tb.dx, ay = topY + 2;
      const sl = 3;
      const sx = ax + Math.sin(a) * sl * 2, sy = ay + sl;
      g.line(ax, ay, sx, sy, "│", KEYS[STRING]);
      for (let k = 0; k < tb.len; k++) {
        const x = sx + Math.sin(a) * k * 2, y = sy + k;
        for (let w = 0; w < 2; w++) g.set(x + w, y, "█", KEYS[COPPER + Math.min(7, (w ? 2 : 5) - (k > tb.len - 2 ? 1 : 0) + (k < 2 ? 1 : 0))]);
        g.set(x - 1, y, "▐", KEYS[COPPER + 1]);
        if (Math.abs(x + 0.5 - cpx) < 2.6 && Math.abs(x + 0.5 - cpx) > 1.6 && Math.abs(y - cpy) < 1) hits.push([x, y]);
      }
    });
    g.line(ox, topY + 2, cpx, cpy, "│", KEYS[STRING]);
    g.text(Math.round(cpx) - 2, Math.round(cpy), "▄██▄", KEYS[WOODK + 1]);
    g.text(Math.round(cpx) - 2, Math.round(cpy) + 1, "▀██▀", KEYS[WOODK]);
    const sx = cpx + Math.sin(clapA * 1.4) * 6, sy = cpy + 7;
    g.line(cpx, cpy + 2, sx, sy, "│", KEYS[STRING]);
    for (let y = 0; y < 5; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) <= 2 - Math.abs(y - 2) * 0.6) g.set(sx + x + Math.sin(t * 2) * (y / 4), sy + y, "█", KEYS[WOODK + (x < 0 ? 0 : 1)]);
    // ring marks when the clapper touches a tube
    for (const [hx, hy] of hits.slice(0, 2)) for (let k = 1; k <= 3; k++) {
      g.set(hx - k * 2 - 1, hy - k * 0.6, "(", KEYS[RING + (k > 1 ? 1 : 0)]);
      g.set(hx + k * 2 + 2, hy - k * 0.6, ")", KEYS[RING + (k > 1 ? 1 : 0)]);
    }
    return g.frame();
  };
}
