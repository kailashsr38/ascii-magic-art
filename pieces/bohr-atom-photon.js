/* bohr-atom-photon: a hydrogen electron absorbing a photon, jumping up a shell and falling back while emitting light, beside its energy levels. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#05040c", "#090716", "#0d0a20", "#120e2a"], 4));
add("shell", ["#2a2f4a", "#5a64a0", "#a8b4f0"]);
add("nuc", ["#ff5a4a", "#ffd0c0"]);
add("el", ["#4ae0ff", "#d0f8ff"]);
add("uv", ["#8a4aff", "#d0b0ff"]);
add("red", ["#ff3a3a", "#ffb0a0"]);
add("glow", gradient(["#140a10", "#2a1018", "#401420"], 3));
add("ui", ["#ffffff", "#8b949e", "#30363d", "#7ee787", "#ffd166"]);

export const meta = {
  slug: "bohr-atom-photon",
  name: "Bohr Atom Photon",
  category: "science",
  note: "A hydrogen electron absorbs an ultraviolet photon and leaps from shell 1 to shell 3, then drops back in two steps, giving out a red 656 nm photon and an ultraviolet one, tracked on an energy level diagram.",
  tags: ["atom", "quantum", "chemistry", "physics", "education", "science"],
  cols: 100, rows: 32, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const CX = 30, CY = 15;
const RAD = [0, 2.6, 5.4, 9.2, 13.4];           // shell radii in rows, growing roughly like n squared
const E = [0, -13.6, -3.4, -1.51, -0.85];
const PER = 14;
const LY = (n) => Math.round(4 + 24 * Math.sqrt(-E[n] / 13.6));

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.09, y * 0.22, 3, 17);
  const wave = (x0, y0, dx, dy, len, lam, ph, co) => {
    // a short wave packet travelling along (dx, dy)
    const nx = -dy, ny = dx;
    for (let s = 0; s < len; s += 0.5) {
      const env = Math.sin((s / len) * Math.PI);
      const o = Math.sin((s / lam) * TAU - ph) * 1.3 * env;
      const x = x0 + dx * s + nx * o * 2, y = y0 + dy * s * 0.5 + ny * o * 0.5;
      g.set(x, y, Math.abs(o) > 0.9 ? "●" : "•", co);
    }
  };
  return (t) => {
    g.clear();
    const T = t % PER;
    // electron level over time: 1 until 3 s, 3 until 7 s, 2 until 10.5 s, then 1
    const jumps = [[3, 1, 3], [7, 3, 2], [10.5, 2, 1]];
    let r = RAD[1], level = 1, moving = null;
    for (const [tj, a, b] of jumps) {
      if (T >= tj && T < tj + 0.5) { moving = [a, b, smooth((T - tj) / 0.5)]; r = RAD[a] + (RAD[b] - RAD[a]) * moving[2]; level = b; }
      else if (T >= tj + 0.5) { level = b; r = RAD[b]; }
    }
    if (!moving) r = RAD[level];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      const d = Math.hypot((x - CX) / 2, y - CY);
      if (d < 14) g.set(x, y, v > 0.5 ? "▒" : "░", K("glow", Math.min(2, Math.floor((1 - d / 14) * 3 + v * 0.8))));
      else g.set(x, y, v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // shells
    for (let n = 1; n <= 4; n++) {
      const R = RAD[n], m = Math.ceil(R * 14);
      for (let i = 0; i < m; i++) {
        const a = (i / m) * TAU;
        g.set(Math.round(CX + Math.cos(a) * R * 2), Math.round(CY + Math.sin(a) * R), i % 2 ? "·" : "•", K("shell", n === level && !moving ? 2 : 1));
      }
      g.text(Math.round(CX + R * 2 * 0.72) + 1, Math.round(CY - R * 0.72) - 1, "n=" + n, K("shell", 2));
    }
    // nucleus: one proton
    g.text(CX - 1, CY, "(+)", K("nuc", 1));
    g.set(CX - 1, CY, "(", K("nuc", 0)); g.set(CX + 1, CY, ")", K("nuc", 0));
    // electron: smaller shells go round faster
    const ang = t * (3.2 / Math.pow(r / RAD[1], 1.2));
    const ex = CX + Math.cos(ang) * r * 2, ey = CY + Math.sin(ang) * r;
    g.set(ex, ey, "●", K("el", 1));
    g.set(ex - Math.sin(ang) * 2 * 1.2, ey + Math.cos(ang) * 1.2 * 0.5, "•", K("el", 0));
    // photons
    if (T > 1 && T < 3.1) {
      const p = (T - 1) / 2.1, sx = CX - 30 + p * (30 - RAD[1] * 2), sy = CY + 2;
      wave(sx - 18, sy, 1, 0, 18, 2.2, t * 12, K("uv", 1));
    }
    if (T > 7.2 && T < 10) {
      const p = (T - 7.2) / 2.8, d = 6 + p * 34;
      wave(CX - d * 0.9, CY - d * 0.12, -0.99, -0.13, 18, 4.5, t * 9, K("red", 1));
    }
    if (T > 10.7 && T < 13.5) {
      const p = (T - 10.7) / 2.8, d = 4 + p * 34;
      wave(CX - d * 0.9, CY + d * 0.15, -0.99, 0.15, 18, 2.2, t * 12, K("uv", 1));
    }
    // energy level diagram
    const DX = 66;
    g.text(DX, 1, "ENERGY LEVELS (eV)", K("ui", 0));
    for (let n = 1; n <= 4; n++) {
      const y = LY(n);
      g.hline(DX, DX + 18, y, "─", K("shell", n === level ? 2 : 1));
      g.text(DX + 20, y, `n=${n} ${E[n].toFixed(2).padStart(6)}`, K("ui", n === level ? 0 : 1));
    }
    g.hline(DX, DX + 18, 3, "┄", K("ui", 2)); g.text(DX + 20, 3, "    0 eV free", K("ui", 1));
    const ey2 = moving ? LY(moving[0]) + (LY(moving[1]) - LY(moving[0])) * moving[2] : LY(level);
    g.set(DX + 9, Math.round(ey2), "●", K("el", 1));
    // transition arrows
    const arrow = (x, a, b, co) => { const y0 = LY(a), y1 = LY(b), s = Math.sign(y1 - y0); for (let y = y0 + s; y !== y1; y += s) g.set(x, y, "│", co); g.set(x, y1 - s, s > 0 ? "↓" : "↑", co); };
    if (T > 2.5 && T < 7) arrow(DX + 4, 1, 3, K("uv", 1));
    if (T > 6.5 && T < 10.5) arrow(DX + 13, 3, 2, K("red", 1));
    if (T > 10 && T < 13.6) arrow(DX + 15, 2, 1, K("uv", 1));
    // caption
    const cap = T < 3 ? ["Ground state, n=1. A 102.6 nm UV photon arrives:", "it carries exactly 12.09 eV, the gap from n=1 to n=3."]
      : T < 7 ? ["ABSORPTION: the electron jumps up to n=3.", "Excited states do not last long."]
      : T < 10.5 ? ["EMISSION: n=3 to n=2 releases 1.89 eV,", "a red photon of 656 nm (the H-alpha line)."]
      : ["EMISSION: n=2 to n=1 releases 10.20 eV,", "an ultraviolet photon of 121.6 nm."];
    g.text(1, rows - 2, cap[0].padEnd(62), K("ui", 4));
    g.text(1, rows - 1, cap[1].padEnd(62), K("ui", 0));
    g.text(1, 0, "HYDROGEN ATOM, BOHR MODEL", K("ui", 0));
    g.text(DX, 30, "● electron", K("el", 1));
    g.text(DX + 12, 30, "~ UV", K("uv", 1));
    g.text(DX + 18, 30, "~ red light", K("red", 1));
    return g.frame();
  };
}
