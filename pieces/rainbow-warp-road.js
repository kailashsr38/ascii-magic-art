/* rainbow-warp-road: a rainbow striped highway curves away through deep space at warp speed, stars streaking past. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const HUE = ["#ff3a4a", "#ff8a2a", "#ffd83a", "#4ae86a", "#2ac0ff", "#4a6aff", "#b04aff"];
const DARK = HUE.map((h) => gradient(["#000000", h], 5)[2]);
const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("hi", HUE); add("lo", DARK);
add("neb", gradient(["#03020a", "#0a0620", "#160a36", "#24104a", "#3a1660", "#5a2070"], 6));
add("star", ["#6a6a9a", "#c8c8ff", "#ffffff"]);
add("rail", ["#c8d8ff", "#ffffff"]);
add("under", ["#0a0418", "#1a0a30"]);

export const meta = {
  slug: "rainbow-warp-road",
  name: "Rainbow Warp Road",
  category: "demoscene",
  note: "A rainbow striped highway snakes away through deep space at warp speed, its colour bands rushing underfoot as stars streak past.",
  tags: ["rainbow", "road", "space", "racing", "retro", "hero"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const NS = 140;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hz = 10, F = 13, W = 3.2;
  const r = rng(9);
  const sa = new Float32Array(NS), sz = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { sa[i] = r() * TAU; sz[i] = r(); }
  const neb = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) neb[x + y * cols] = fbm(x * 0.045, y * 0.1, 4, 3);
  return (t) => {
    const D = t * 6;
    const curv = Math.sin(t * 0.35) * 0.9 + Math.sin(t * 0.13) * 0.5;
    const vy = hz - 1 - Math.sin(t * 0.27) * 0.8;
    const vx = cols / 2 + curv * 10;
    // nebula backdrop drifting slowly sideways
    const shift = Math.floor(t * 2);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = neb[((x + shift) % cols) + y * cols];
      const v = clamp((n - 0.35) * 2.2);
      g.set(x, y, v > 0.6 ? "▒" : v > 0.3 ? "░" : (x * 7 + y * 5) % 6 ? "·" : " ", K("neb", Math.min(5, Math.floor(v * 6))));
    }
    // streaking stars flying out of the vanishing point
    for (let i = 0; i < NS; i++) {
      const z = 1 - ((sz[i] + t * 0.35) % 1);
      const rr = 0.04 / (z + 0.02);
      const ca = Math.cos(sa[i]), s = Math.sin(sa[i]);
      const x1 = vx + ca * rr * cols, y1 = vy + s * rr * cols * 0.5;
      const rr2 = rr * 0.82;
      const x2 = vx + ca * rr2 * cols, y2 = vy + s * rr2 * cols * 0.5;
      const lv = z < 0.3 ? 2 : z < 0.65 ? 1 : 0;
      g.line(x2, y2, x1, y1, lv === 2 ? "─" : "·", K("star", lv));
      g.set(x1, y1, lv ? "•" : "·", K("star", lv));
    }
    // the road, one depth per row
    for (let y = hz; y < rows; y++) {
      const dy = y - hz + 0.4;
      const z = F / dy;
      const fr = clamp(1 - (dy - 0.4) / (rows - hz)); const xc = cols / 2 + curv * 10 * fr * fr;
      const w = (W * 6.2) / z;
      const band = Math.floor(z * 1.6 + D) & 1;
      for (let x = 0; x < cols; x++) {
        const u = (x + 0.5 - xc) / w;
        if (Math.abs(u) > 1.08) continue;
        if (Math.abs(u) > 0.97) { g.set(x, y, "█", K("rail", band)); continue; }
        const hi = Math.min(6, Math.floor(((u + 0.97) / 1.94) * 7));
        const dash = (Math.floor(z * 1.6 + D) % 4 === 0) && Math.abs(((u + 0.97) / 1.94) * 7 - hi - 0.5) < 0.12;
        g.set(x, y, dash ? "▒" : band ? "█" : "▓", K(band ? "hi" : "lo", hi));
      }
      // shadow under the floating road
      if (y + 1 < rows) for (let x = Math.floor(xc - w * 0.9); x < xc + w * 0.9; x++) if (g.get(x, y + 1) !== "█" && g.get(x, y + 1) !== "▓") g.set(x, y + 1, "░", K("under", 1));
    }
    return g.frame();
  };
}
