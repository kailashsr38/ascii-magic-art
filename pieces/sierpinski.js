/* sierpinski: the chaos game filling in a Sierpinski triangle one dot at a time. */
import { Grid, palette, rng } from "../lib/kit.js";

const pal = palette([
  "#ff5a7a", "#ff8a5a", "#ffc23f",   // 0-2 top corner family
  "#3fe0a0", "#3fd0e0", "#5aa0ff",   // 3-5 left corner family
  "#b07aff", "#e07aff", "#ff7ad0",   // 6-8 right corner family
  "#ffffff", "#5a5a7a",              // 9 marker, a guide
]);

export const meta = {
  slug: "sierpinski",
  name: "Sierpinski Triangle",
  category: "algorithms",
  note: "The chaos game at work: a point hops halfway to random corners and a Sierpinski triangle appears out of the noise.",
  tags: ["fractal", "chaos-game", "math", "wallpaper"],
  cols: 80, rows: 36, fps: 24,
  palette: pal,
};

const N = 40000, BUILD = 11, HOLD = 2.5, P = BUILD + HOLD;
const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const DW = cols * 2, DH = rows * 2;
  const V = [[DW / 2, 1], [6, DH - 2], [DW - 6, DH - 2]];
  const r = rng(42);
  const cell = new Int32Array(N), bit = new Uint8Array(N), col = new Uint8Array(N);
  const px = new Float32Array(N), py = new Float32Array(N), vk = new Uint8Array(N);
  let x = DW / 2, y = DH / 2, prev = 0;
  for (let i = 0; i < N; i++) {
    const k = Math.floor(r() * 3);
    x = (x + V[k][0]) / 2; y = (y + V[k][1]) / 2;
    const cx = Math.floor(x / 2), cy = Math.floor(y / 2);
    cell[i] = cx + cy * cols; bit[i] = 1 << ((Math.floor(x) & 1) + (Math.floor(y) & 1) * 2);
    col[i] = k * 3 + prev; prev = k; px[i] = x; py[i] = y; vk[i] = k;
  }
  const mask = new Uint8Array(cols * rows), cc = new Uint8Array(cols * rows);
  return (t) => {
    const c = t % P;
    const f = Math.min(1, c / BUILD);
    const n = Math.max(40, Math.floor(N * f * f));
    mask.fill(0);
    for (let i = 20; i < n; i++) { mask[cell[i]] |= bit[i]; cc[cell[i]] = col[i]; }
    g.clear();
    for (let i = 0; i < mask.length; i++) if (mask[i]) { g.ch[i] = QUAD[mask[i]]; g.co[i] = String(cc[i]); }
    // faint outline of the big triangle
    for (let s = 0; s < 3; s++) {
      const [ax, ay] = V[s], [bx, by] = V[(s + 1) % 3];
      for (let q = 0; q <= 1; q += 0.004) {
        const ix = Math.floor((ax + (bx - ax) * q) / 2), iy = Math.floor((ay + (by - ay) * q) / 2);
        if (g.get(ix, iy) === " ") g.set(ix, iy, "·", "a");
      }
    }
    // the hopping point, with a line toward the corner it is jumping to
    if (c < BUILD) {
      const i = n - 1;
      const k = vk[Math.min(N - 1, i + 1)];
      g.line(px[i] / 2, py[i] / 2, V[k][0] / 2, V[k][1] / 2, (lx, ly) => (g.get(lx, ly) === " " ? "·" : g.get(lx, ly)), "9");
      g.set(px[i] / 2, py[i] / 2, "●", "9");
      for (const [vx, vy] of V) g.set(vx / 2, vy / 2, "◆", "9");
    }
    return g.frame();
  };
}
