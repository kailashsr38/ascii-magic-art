/* prism-dispersion: white light refracting through a glass prism and fanning out into a spectrum, traced with Snell's law. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#05060a", "#090b12", "#0d101a", "#121622"], 4));
add("glass", gradient(["#12303a", "#1a4a58", "#2a6a7a", "#5aa0b0", "#c8f0f8"], 5));
add("white", ["#9aa0aa", "#ffffff"]);
const SPEC = [["#ff2a2a", "#ff9a9a"], ["#ff8a1a", "#ffc890"], ["#ffe01a", "#fff4a0"], ["#2ad84a", "#a0f8b0"], ["#2a8aff", "#a0ccff"], ["#5a3aff", "#b0a0ff"], ["#a83aff", "#dcb0ff"]];
SPEC.forEach((c, i) => add("s" + i, c));
add("ui", ["#ffffff", "#8b949e", "#4a5260"]);

export const meta = {
  slug: "prism-dispersion",
  name: "Prism Dispersion",
  category: "science",
  note: "A beam of white light bends as it enters and leaves a glass prism, and because violet bends more than red it fans out into the colours of the spectrum on a screen.",
  tags: ["light", "optics", "refraction", "rainbow", "education", "science"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const NAMES = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
const IOR = [1.44, 1.48, 1.52, 1.56, 1.6, 1.64, 1.68];   // exaggerated so the fan is visible

function refract(d, N, eta) {
  const cosi = -(N[0] * d[0] + N[1] * d[1]);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  const a = eta * cosi - Math.sqrt(k);
  return [eta * d[0] + a * N[0], eta * d[1] + a * N[1]];
}
function hit(p, d, a, b) {
  // ray p + s d against segment a-b; returns s
  const ex = b[0] - a[0], ey = b[1] - a[1];
  const den = d[0] * ey - d[1] * ex;
  const s = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den;
  return s;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // square coordinates: X = column, Y = row * 2
  const A = [38, 4], B = [17, 40.4], C = [59, 40.4];
  const nL = [-0.866, -0.5], nR = [0.866, -0.5];
  const P = [A[0] + 0.55 * (B[0] - A[0]), A[1] + 0.55 * (B[1] - A[1])];
  const d0 = [Math.cos(-0.45), Math.sin(-0.45)];
  const SCREEN = 90;
  const rays = IOR.map((n) => {
    const din = refract(d0, nL, 1 / n);
    const s = hit(P, din, A, C);
    const Q = [P[0] + din[0] * s, P[1] + din[1] * s];
    const dout = refract(din, [-nR[0], -nR[1]], n);
    const s2 = (SCREEN - Q[0]) / dout[0];
    return { Q, din, dout, end: [SCREEN, Q[1] + dout[1] * s2] };
  });
  const yAt = (r, x) => (x < r.Q[0] ? P[1] + r.din[1] * ((x - P[0]) / r.din[0]) : r.Q[1] + r.dout[1] * ((x - r.Q[0]) / r.dout[0]));
  const inside = (x, Y) => {
    const s = (p, q) => (q[0] - p[0]) * (Y - p[1]) - (q[1] - p[1]) * (x - p[0]);
    const a = s(A, B), b = s(B, C), c = s(C, A);
    return (a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0);
  };
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.1, y * 0.25, 3, 13);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // prism body
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const Y = y * 2 + 1;
      if (!inside(x + 0.5, Y)) continue;
      const edge = !inside(x - 0.5, Y) || !inside(x + 1.5, Y) || !inside(x + 0.5, Y + 2.2);
      const v = tex[x + y * cols];
      g.set(x, y, edge ? "█" : v > 0.55 ? "▓" : "▒", K("glass", edge ? 3 : Math.min(2, Math.floor(v * 3))));
    }
    // normals at the two faces
    for (const [p, n] of [[P, nL], [rays[3].Q, nR]]) for (let s = -9; s <= 9; s += 1.5) {
      if (Math.abs(s) < 1) continue;
      g.set(Math.round(p[0] + n[0] * s), Math.round((p[1] + n[1] * s) / 2), "·", K("ui", 1));
    }
    // incoming white beam with light pulses
    for (let x = 0; x <= P[0]; x++) {
      const Y = P[1] + d0[1] * ((x - P[0]) / d0[0]);
      const on = fract(x / 10 - t * 1.4) < 0.4;
      g.set(x, Math.round(Y / 2), "━", K("white", on ? 1 : 0));
    }
    g.text(0, Math.round((P[1] + d0[1] * (-P[0] / d0[0])) / 2), "▐█", K("white", 1));
    // inside the glass: thin coloured rays
    for (let i = 0; i < 7; i += 3) for (let x = Math.ceil(P[0]); x <= rays[i].Q[0]; x++) g.set(x, Math.round(yAt(rays[i], x) / 2), "─", K("s" + i, 1));
    // the fan after the prism, filled between neighbouring colours
    const x0 = Math.ceil(Math.max(...rays.map((r) => r.Q[0])));
    for (let x = x0; x <= SCREEN; x++) {
      const ys = rays.map((r) => (x >= r.Q[0] ? yAt(r, x) / 2 : null));
      for (let i = 6; i >= 0; i--) {
        if (ys[i] === null) continue;
        const ya = i === 0 ? ys[0] - 0.5 : ys[i - 1] !== null ? (ys[i - 1] + ys[i]) / 2 : ys[i];
        const yb = i === 6 ? ys[6] + 0.5 : ys[i + 1] !== null ? (ys[i] + ys[i + 1]) / 2 : ys[i];
        const on = fract((x - x0) / 9 - t * 1.4) < 0.4;
        for (let y = Math.round(Math.min(ya, yb)); y <= Math.round(Math.max(ya, yb)); y++) g.set(x, y, x === SCREEN ? "█" : on ? "▓" : "▒", K("s" + i, on || x === SCREEN ? 1 : 0));
      }
    }
    // screen and colour names
    for (let y = 0; y < rows; y++) if (g.get(SCREEN, y) !== "█") g.set(SCREEN, y, "│", K("ui", 2));
    rays.forEach((r, i) => g.text(SCREEN + 2, Math.round(r.end[1] / 2), NAMES[i], K("s" + i, 1)));
    // labels
    g.text(1, 1, "DISPERSION OF WHITE LIGHT", K("ui", 0));
    g.text(1, 2, "by a glass prism", K("ui", 1));
    g.text(1, 21, "WHITE LIGHT", K("white", 1));
    g.text(32, 22, "GLASS PRISM", K("glass", 4));
    g.text(62, 9, "red bends least", K("s0", 1));
    g.text(62, 26, "violet bends most", K("s6", 1));
    g.text(Math.round(P[0]) - 15, Math.round(P[1] / 2) - 5, "normal", K("ui", 1));
    g.text(80, 1, "SCREEN", K("ui", 0));
    g.text(1, rows - 1, "slower light in glass bends more: n(violet) > n(red); spread exaggerated", K("ui", 1));
    return g.frame();
  };
}
