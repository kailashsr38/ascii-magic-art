/* mandelbrot-zoom: a smooth colour dive into the seahorse valley of the Mandelbrot set and back out. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const CYCLE = [
  ...gradient(["#0a0a3a", "#1c3aa0", "#2fa8e0", "#bff4ff"], 8),
  ...gradient(["#fff6c0", "#ffc040", "#e0501a", "#7a1040"], 8),
  ...gradient(["#5a0a5a", "#2a0a6a", "#0a0a3a"], 8),
];
const pal = palette([...CYCLE, "#0b0b26"]); // last key = interior
const NC = CYCLE.length;
const IN = KEYS[NC];

export const meta = {
  slug: "mandelbrot-zoom",
  name: "Mandelbrot Zoom",
  category: "algorithms",
  note: "A smooth colour zoom into the seahorse valley of the Mandelbrot set, diving deep and drifting back out.",
  tags: ["fractal", "math", "zoom", "wallpaper", "hero"],
  cols: 84, rows: 36, fps: 24,
  palette: pal,
};

const P = 26;
const TX = -0.7566, TY = 0.1;
const CX0 = -0.65, CY0 = 0, W0 = 1.75;
const ZMAX = Math.log(W0 / 0.014);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const L2 = Math.log(2);
  return (t) => {
    const z = ZMAX * (0.5 - 0.5 * Math.cos((TAU * t) / P));
    const w = W0 * Math.exp(-z);
    const k = w / W0;
    const ccx = TX + (CX0 - TX) * k, ccy = TY + (CY0 - TY) * k;
    const step = (2 * w) / cols;
    const maxIt = Math.floor(80 + z * 30);
    const shift = t * 0.35;
    for (let y = 0; y < rows; y++) {
      const ci = ccy + (y - rows / 2 + 0.5) * step * 2;
      for (let x = 0; x < cols; x++) {
        const cr = ccx + (x - cols / 2 + 0.5) * step;
        // skip the main cardioid and period-2 bulb
        const q = (cr - 0.25) ** 2 + ci * ci;
        if (q * (q + (cr - 0.25)) < 0.25 * ci * ci || (cr + 1) ** 2 + ci * ci < 0.0625) { g.set(x, y, "█", IN); continue; }
        let zr = 0, zi = 0, i = 0, zr2 = 0, zi2 = 0;
        while (i < maxIt && zr2 + zi2 < 256) { zi = 2 * zr * zi + ci; zr = zr2 - zi2 + cr; zr2 = zr * zr; zi2 = zi * zi; i++; }
        if (i >= maxIt) { g.set(x, y, "█", IN); continue; }
        const nu = i + 1 - Math.log(Math.log(zr2 + zi2) / 2 / L2) / L2;
        const v = Math.log(nu + 1) * 0.42 + shift;
        const ci2 = Math.floor((((v % 1) + 1) % 1) * NC);
        const dens = clamp(nu / 30);
        g.set(x, y, dens < 0.08 ? "░" : dens < 0.18 ? "▒" : dens < 0.35 ? "▓" : "█", KEYS[ci2]);
      }
    }
    return g.frame();
  };
}
