/* lorenz-attractor: the Lorenz butterfly turning in 3D, a glowing comet tracing its two wings in braille dots. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const TRAIL = gradient(["#3a1050", "#7a1a8a", "#c02a8a", "#f05a6a", "#ff9a4a", "#ffd27a", "#ffffff"], 14);
const FAINT = gradient(["#2c3a6a", "#3e5090", "#5a70b4", "#8098d4"], 4);
const all = [...TRAIL, ...FAINT, "#0a0c18", "#5a6478"];
const NT = TRAIL.length;

export const meta = {
  slug: "lorenz-attractor",
  name: "Lorenz Butterfly",
  category: "algorithms",
  note: "The Lorenz attractor turns slowly in 3D while a glowing comet traces its two butterfly wings, the full orbit drawn faintly behind in braille dots.",
  tags: ["chaos", "attractor", "lorenz", "braille", "math", "hero"],
  cols: 84, rows: 34, fps: 30,
  palette: palette(all),
};

const N = 9000, TL = 1300, RATE = 260;
const BIT = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
  let x = 0.1, y = 0, z = 0;
  const dt = 0.0065;
  const d = (x, y, z) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];
  for (let i = -800; i < N; i++) {
    // RK2 is plenty at this step size
    const k1 = d(x, y, z);
    const k2 = d(x + k1[0] * dt / 2, y + k1[1] * dt / 2, z + k1[2] * dt / 2);
    x += k2[0] * dt; y += k2[1] * dt; z += k2[2] * dt;
    if (i >= 0) { px[i] = x; py[i] = y; pz[i] = z; }
  }
  const DW = cols * 2, DH = rows * 4;
  const mask = new Uint8Array(cols * rows), lvl = new Int16Array(cols * rows);
  const S = 2.7;
  return (t) => {
    mask.fill(0); lvl.fill(-1);
    const a = 0.25 + 0.5 * Math.sin(t * 0.21), ca = Math.cos(a), sa = Math.sin(a);
    const tilt = 0.25 * Math.sin(t * 0.13);
    const plot = (i, L) => {
      const X = px[i] * ca + py[i] * sa, Dp = -px[i] * sa + py[i] * ca;
      const dx = Math.floor(DW / 2 + X * S);
      const dy = Math.floor(DH - 6 - (pz[i] - 4 + Dp * tilt) * S * 1.08);
      if (dx < 0 || dy < 0 || dx >= DW || dy >= DH) return;
      const c = (dx >> 1) + (dy >> 2) * cols;
      mask[c] |= BIT[dy & 3][dx & 1];
      if (L > lvl[c]) lvl[c] = L;
    };
    // faint full orbit, shaded by depth
    for (let i = 0; i < N; i += 2) {
      const Dp = -px[i] * sa + py[i] * ca;
      plot(i, Math.min(3, Math.max(0, Math.floor((Dp + 22) / 11))));
    }
    // bright comet trail
    const head = Math.floor(t * RATE) % N;
    for (let k = TL; k >= 0; k--) {
      const i = (head - k + N) % N;
      plot(i, 100 + Math.floor((1 - k / TL) * (NT - 1)));
    }
    for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
      const c = xx + yy * cols;
      if (!mask[c]) { g.set(xx, yy, (xx + yy * 3) % 9 ? " " : "·", KEYS[NT + 4]); continue; }
      const L = lvl[c];
      g.set(xx, yy, String.fromCharCode(0x2800 + mask[c]), L >= 100 ? KEYS[L - 100] : KEYS[NT + L]);
    }
    // head marker
    const i = head;
    const X = px[i] * ca + py[i] * sa, Dp = -px[i] * sa + py[i] * ca;
    g.set(Math.floor((DW / 2 + X * S) / 2), Math.floor((DH - 6 - (pz[i] - 4 + Dp * tilt) * S * 1.08) / 4), "●", KEYS[NT - 1]);
    g.text(1, 0, "dx/dt = 10(y-x)  dy/dt = x(28-z)-y  dz/dt = xy-8z/3", KEYS[NT + 5]);
    return g.frame();
  };
}
