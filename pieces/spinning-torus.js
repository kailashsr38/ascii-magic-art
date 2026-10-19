/* spinning-torus: a lit ring turning on two axes. */
import { Grid, TAU, RAMPS, ramp } from "../lib/kit.js";

export const meta = {
  slug: "spinning-torus",
  name: "Spinning Torus",
  category: "solids",
  note: "A lit ring turning slowly on two axes, shaded with a classic character ramp.",
  tags: ["3d", "loader", "hero", "terminal"],
  cols: 48, rows: 24, fps: 30,
};

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const R1 = 1, R2 = 2.1, K2 = 6;
  const K1 = (meta.cols * K2 * 0.36) / (R1 + R2);
  const L = [0, 0.7071, -0.7071];
  return (t) => {
    g.clear();
    const A = t * 0.9, B = t * 0.45;
    const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
    for (let th = 0; th < TAU; th += 0.08) {
      const ct = Math.cos(th), st = Math.sin(th);
      for (let ph = 0; ph < TAU; ph += 0.03) {
        const cp = Math.cos(ph), sp = Math.sin(ph);
        const h = R2 + R1 * ct;
        const x = h * (cB * cp + sA * sB * sp) - R1 * st * cA * sB;
        const y = h * (sB * cp - sA * cB * sp) + R1 * st * cA * cB;
        const z = K2 + cA * h * sp + R1 * st * sA;
        const ooz = 1 / z;
        const nx = ct * (cB * cp + sA * sB * sp) - st * cA * sB;
        const ny = ct * (sB * cp - sA * cB * sp) + st * cA * cB;
        const nz = cA * ct * sp + st * sA;
        const lum = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        g.setZ(meta.cols / 2 + K1 * ooz * x, meta.rows / 2 - K1 * 0.5 * ooz * y, ooz, ramp(0.08 + lum * 0.92, RAMPS.soft));
      }
    }
    return g.frame();
  };
}
