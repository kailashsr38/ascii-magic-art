/* ring-shadow-closeup: a close view of a ringed planet, its shadow sliding across the rings while the rings shade its banded clouds. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#010104", "#05060e", "#0a0c1a"], 4));
add("star", ["#8a90b0", "#e0e4ff"]);
add("body", gradient(["#120a04", "#3a2410", "#6e4a24", "#a87a44", "#d4aa70", "#ecd2a0", "#fff2d8"], 18));
add("ring", gradient(["#141210", "#3a3428", "#6e6450", "#a8987a", "#d6c8a8", "#f6eedc"], 14));
add("moon", gradient(["#1a1a1e", "#5a5a64", "#b8b8c4", "#f4f4fa"], 6));
export const meta = {
  slug: "ring-shadow-closeup",
  name: "Saturn Ring Shadow",
  category: "cosmos",
  note: "A close view of a ringed planet as the shadow of its globe slides across the rings, the rings throw thin bands of shade on its clouds and a small moon crosses.",
  tags: ["planet", "rings", "shadow", "space", "wallpaper", "hero"],
  cols: 104, rows: 38, fps: 24,
  palette: palette(all),
};
const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const S = 29, cx = 36, cy = 25;      // one planet radius is S columns; centre lower left
  const tilt = 0.46, roll = -0.24;
  const cT = Math.cos(tilt), sT = Math.sin(tilt), cR = Math.cos(roll), sR = Math.sin(roll);
  // ring plane normal in view space (camera looks along +z)
  const N = [-sR * cT, cR * cT, -sT];
  const n0 = Math.hypot(N[0], N[1], N[2]); N[0] /= n0; N[1] /= n0; N[2] /= n0;
  // in-plane axes
  const U = [cR, sR, 0];
  const W = [N[1] * U[2] - N[2] * U[1], N[2] * U[0] - N[0] * U[2], N[0] * U[1] - N[1] * U[0]];
  const prof = new Float32Array(400);
  for (let i = 0; i < 400; i++) {
    const f = i / 399;
    let d = 0.55 + 0.35 * noise2(f * 40, 0.5, 3) + 0.15 * Math.sin(f * 160);
    if (f > 0.5 && f < 0.56) d *= 0.06;
    if (f > 0.83 && f < 0.85) d *= 0.2;
    if (f < 0.04) d *= f / 0.04;
    if (f > 0.97) d *= (1 - f) / 0.03;
    prof[i] = clamp(d);
  }
  const R1 = 1.28, R2 = 2.35;
  const ringAt = (q, t) => {
    const r = Math.hypot(q[0], q[1], q[2]);
    if (r < R1 || r > R2) return 0;
    const f = (r - R1) / (R2 - R1);
    // clumps orbit faster nearer the planet
    const a = Math.atan2(q[0] * W[0] + q[1] * W[1] + q[2] * W[2], q[0] * U[0] + q[1] * U[1] + q[2] * U[2]);
    const clump = 0.85 + 0.15 * noise2((a + t * 0.25 / Math.pow(r, 1.5)) * 18, r * 30, 5);
    return prof[Math.floor(f * 399)] * clump;
  };
  const r = rng(9);
  const stars = new Uint8Array(cols * rows);
  for (let i = 0; i < 90; i++) stars[Math.floor(r() * cols) + Math.floor(r() * rows) * cols] = 1 + (r() < 0.25 ? 1 : 0);
  const PER = 16;
  return (t) => {
    g.clear();
    // the sun swings slowly so the globe's shadow sweeps along the rings and back
    const sa = 0.35 + 0.6 * Math.sin((t / PER) * TAU);
    let L = [Math.cos(sa) * 0.8, 0.3, -0.5 - 0.3 * Math.sin(sa)];
    const ln = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ln, L[1] / ln, L[2] / ln];
    // moon on an orbit in the ring plane, just outside the rings
    const ma = (t / PER) * TAU * 2 + 1;
    const mo = [(U[0] * Math.cos(ma) + W[0] * Math.sin(ma)) * 2.7, (U[1] * Math.cos(ma) + W[1] * Math.sin(ma)) * 2.7, (U[2] * Math.cos(ma) + W[2] * Math.sin(ma)) * 2.7];
    const MR = 0.09;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = (x + 0.5 - cx) / S, py = -((y + 0.5 - cy) * 2) / S;
      let best = Infinity, ch = "░", co = K("bg", Math.min(3, Math.floor((1 - y / rows) * 2 + (x / cols) * 2)));
      if (stars[x + y * cols]) { ch = "·"; co = K("star", stars[x + y * cols] - 1); }
      // globe
      const p2 = px * px + py * py;
      if (p2 < 1) {
        const pz = -Math.sqrt(1 - p2);
        const P = [px, py, pz];
        best = pz;
        let lam = Math.max(0, P[0] * L[0] + P[1] * L[1] + P[2] * L[2]);
        // shade from the rings: march toward the sun to the ring plane
        const den = L[0] * N[0] + L[1] * N[1] + L[2] * N[2];
        if (Math.abs(den) > 1e-3) {
          const s = -(P[0] * N[0] + P[1] * N[1] + P[2] * N[2]) / den;
          if (s > 0) lam *= 1 - 0.85 * ringAt([P[0] + L[0] * s, P[1] + L[1] * s, P[2] + L[2] * s], t);
        }
        // moon shadow on the clouds
        const mdx = P[0] - mo[0], mdy = P[1] - mo[1], mdz = P[2] - mo[2];
        const md = mdx * L[0] + mdy * L[1] + mdz * L[2];
        if (md < 0 && mdx * mdx + mdy * mdy + mdz * mdz - md * md < MR * MR) lam *= 0.1;
        // latitude from the ring-plane normal, bands drift at different speeds
        const lat = P[0] * N[0] + P[1] * N[1] + P[2] * N[2];
        const lon = Math.atan2(P[0] * W[0] + P[1] * W[1] + P[2] * W[2], P[0] * U[0] + P[1] * U[1] + P[2] * U[2]);
        const sp = 0.05 * Math.sin(lat * 9);
        const band = 0.5 + 0.28 * Math.sin(lat * 26 + 2 * fbm(lon * 3 + t * sp, lat * 8, 3, 2)) + 0.12 * Math.sin(lat * 61);
        const v = clamp((0.1 + lam * 0.9) * (0.6 + band * 0.6));
        ch = SH[Math.min(3, Math.floor(0.6 + v * 3.6))];
        co = K("body", Math.min(17, Math.floor(v * 18)));
      }
      // rings: intersect the view ray (x = px, y = py, z free) with the ring plane
      if (Math.abs(N[2]) > 1e-4) {
        const rz = -(px * N[0] + py * N[1]) / N[2];
        if (rz < best) {
          const Q = [px, py, rz];
          const dens = ringAt(Q, t);
          if (dens > 0.04) {
            let lam = 0.35 + 0.65 * Math.abs(L[0] * N[0] + L[1] * N[1] + L[2] * N[2]) * 1.6;
            // globe shadow: does the ray toward the sun hit the planet?
            const b = Q[0] * L[0] + Q[1] * L[1] + Q[2] * L[2];
            const c = Q[0] * Q[0] + Q[1] * Q[1] + Q[2] * Q[2] - 1;
            if (b < 0 && b * b - c > 0) lam *= 0.06;
            const v = clamp(dens * lam);
            const prev = ch;
            ch = SH[Math.min(3, Math.floor(dens * 4.2))];
            co = K("ring", Math.min(13, Math.floor(v * 14)));
            if (dens < 0.3 && p2 < 1) { ch = prev === "█" ? "▓" : prev; }   // thin ring lets the globe show
          }
        }
      }
      // the moon
      const mx = px - mo[0], my = py - mo[1];
      if (mx * mx + my * my < MR * MR && mo[2] < best) {
        const mz = -Math.sqrt(Math.max(0, MR * MR - mx * mx - my * my));
        const v = clamp(0.15 + ((mx * L[0] + my * L[1] + mz * L[2]) / MR) * 0.85);
        ch = "█"; co = K("moon", Math.min(5, Math.floor(v * 6)));
      }
      g.set(x, y, ch, co);
    }
    return g.frame();
  };
}
