/* rangoli-powder-bloom: a symmetric rangoli drawing itself ring by ring in coloured powder on a red oxide floor. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract, TAU } from "../lib/kit.js";

const FLOOR = gradient(["#2a0a08", "#4a140e", "#6e2214", "#8e3420"], 8);                 // 0..7
const NAMED = {
  white: "#fff6e6", chalk: "#d8c8b8", yellow: "#ffd21a", orange: "#ff8a10", red: "#ff2a2a",
  magenta: "#ff2a9a", pink: "#ff8ac8", purple: "#a440ff", blue: "#2a8cff", teal: "#14d2c0",
  green: "#3ad24a", lime: "#b8f040", skin: "#b0703c", skinD: "#7a4424", skinL: "#d8925a",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[8 + i]));

export const meta = {
  slug: "rangoli-powder-bloom",
  name: "Rangoli Powder Bloom",
  category: "india",
  note: "A symmetric rangoli draws itself ring by ring in bright coloured powder, trickled from a pinching hand onto a red oxide floor.",
  tags: ["rangoli", "india", "festival", "pattern", "hero", "wallpaper"],
  cols: 96, rows: 38, fps: 20,
  palette: palette([...FLOOR, ...Object.values(NAMED)]),
};

const SH = " ░▒▓█";
// ring outer edges (normalised radius); the pattern draws inside out
const RINGS = [0.1, 0.24, 0.31, 0.5, 0.57, 0.8, 0.88, 1.0];
const SCHEMES = [
  ["yellow", "magenta", "orange", "green", "blue", "red", "teal", "purple"],
  ["orange", "blue", "yellow", "magenta", "green", "purple", "pink", "teal"],
  ["white", "green", "red", "yellow", "purple", "orange", "lime", "magenta"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 48, cy = 19, R = 34;
  const P = 16, DRAW = 11, HOLD = 3.6;
  // static floor
  const floor = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = fbm(x * 0.12, y * 0.25, 3, 4), grout = x % 16 === 0 || y % 8 === 0;
    const v = clamp(0.42 + (n - 0.5) * 0.35);
    floor.push(grout ? ["░", KEYS[1]] : [n > 0.55 ? "▓" : "█", KEYS[2 + Math.min(4, Math.floor(v * 6))]]);
  }
  const ringOf = (r) => { for (let i = 0; i < RINGS.length; i++) if (r < RINGS[i]) return i; return -1; };

  function motif(ring, r, th, S) {
    const c = (i) => K[S[i % S.length]];
    switch (ring) {
      case 0: return r < 0.045 ? ["●", K.white] : ["█", c(0)];
      case 1: {
        const p = (r - 0.1) / 0.14;
        const w = Math.abs(Math.cos(4 * th));
        return w > p * 0.8 + 0.1 ? [w > 0.85 ? "█" : "▓", c(1)] : ["▒", c(2)];
      }
      case 2: return [Math.floor((th / TAU) * 24 + 24) % 2 ? "◆" : "•", K.white];
      case 3: {
        const p = (r - 0.31) / 0.19;
        const a = (th / TAU) * 16 + 16, idx = Math.floor(a), w = Math.abs(fract(a) - 0.5) * 2;
        if (w < (1 - p) * 0.9 + 0.08) return [w < 0.35 ? "█" : "▓", idx % 2 ? c(3) : c(4)];
        return ["▒", c(5)];
      }
      case 4: return [Math.floor((th / TAU) * 40 + 40) % 2 ? "●" : "•", Math.floor((th / TAU) * 40 + 40) % 4 < 2 ? K.yellow : K.white];
      case 5: {
        const p = (r - 0.57) / 0.23;
        const a = (th / TAU) * 8 + 8.5, w = Math.abs(fract(a) - 0.5) * 2;
        if (w < (1 - p) * 0.95) return [p > 0.75 ? "▓" : "█", p > 0.75 ? c(6) : c(1)];
        const b = (th / TAU) * 8 + 8, wb = Math.abs(fract(b) - 0.5) * 2;
        if (wb < (1 - p) * 0.55) return ["▓", c(7)];
        return ["▒", c(2)];
      }
      case 6: return [Math.floor((th / TAU) * 48 + 48) % 3 === 0 ? "◆" : "▓", Math.floor((th / TAU) * 48 + 48) % 3 === 0 ? K.white : c(4)];
      case 7: {
        const a = (th / TAU) * 24 + 24, bump = 1 - Math.abs(fract(a) - 0.5) * 2;
        const edge = 0.88 + 0.12 * (0.3 + 0.7 * bump);
        if (r > edge) return null;
        return r > edge - 0.035 ? ["▒", K.white] : ["▓", Math.floor(a) % 2 ? c(0) : c(3)];
      }
    }
    return null;
  }

  return (t) => {
    g.clear();
    const tt = t + 7, n = Math.floor(tt / P), lt = tt - n * P;
    const S = SCHEMES[n % SCHEMES.length];
    // progress through rings: p in 0..RINGS.length (fractional part sweeps the angle)
    let prog;
    if (lt < DRAW) prog = (lt / DRAW) * RINGS.length;
    else if (lt < DRAW + HOLD) prog = RINGS.length;
    else prog = RINGS.length * (1 - (lt - DRAW - HOLD) / (P - DRAW - HOLD)); // swept away from the rim
    const sweeping = lt >= DRAW + HOLD;
    const curRing = Math.floor(prog), frac = prog - curRing;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      const dx = x - cx, dy = (y - cy) * 2.1;
      const r = Math.hypot(dx, dy) / R;
      let th = Math.atan2(dx, -dy);                   // 0 at the top, symmetric left and right
      const ring = r < 1 ? ringOf(r) : -1;
      let shown = false;
      if (ring >= 0) {
        if (sweeping) shown = r < prog / RINGS.length;
        else shown = ring < curRing || (ring === curRing && Math.abs(th) / Math.PI < frac);
      }
      if (shown) {
        const m = motif(ring, r, th, S);
        if (m) { g.set(x, y, m[0], m[1]); continue; }
      } else if (ring >= 0 && ring <= curRing + 1 && !sweeping) {
        // faint chalk guide circles ahead of the powder
        const edge = RINGS[ring];
        if (Math.abs(r - edge) < 0.012) { g.set(x, y, "·", K.chalk); continue; }
      }
      g.set(x, y, floor[i][0], floor[i][1]);
    }
    // the hand trickling powder at the drawing front
    if (!sweeping && lt < DRAW) {
      const ring = Math.min(RINGS.length - 1, curRing);
      const r0 = ring === 0 ? 0 : RINGS[ring - 1];
      const rm = ((r0 + RINGS[ring]) / 2) * R;
      const side = Math.floor(lt * 1.3) % 2 ? 1 : -1;
      const a = frac * Math.PI * side;
      const px = Math.round(cx + Math.sin(a) * rm), py = Math.round(cy - (Math.cos(a) * rm) / 2.1);
      const col = K[S[(ring + 1) % S.length]];
      g.set(px, py, "●", col);
      for (let k = 1; k <= 3; k++) g.set(px + (k === 2 ? 1 : 0), py - k, k % 2 ? "•" : "·", col);
      const hx = px - 1, hy = py - 7;
      g.text(hx - 1, hy, "▄██▄", K.skinD);
      g.text(hx - 2, hy + 1, "▐████▌", K.skin);
      g.text(hx - 1, hy + 2, "████", K.skinL);
      g.text(hx, hy + 3, "▀▀", K.skin);
      g.set(hx + 3, hy + 3, "▀", K.skinD);
      for (let k = 1; k <= 4; k++) g.text(hx - 2 + k, hy - k, "███", k > 2 ? K.skinD : K.skin);
    }
    // a sweeping broom of powder dust at the rim while it is cleared
    if (sweeping) {
      const rr = (prog / RINGS.length) * R;
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * TAU + lt;
        g.set(cx + Math.cos(a) * (rr + 1 + (k % 3)), cy + (Math.sin(a) * (rr + 1)) / 2.1, k % 2 ? "░" : "·", K[S[k % S.length]]);
      }
    }
    return g.frame();
  };
}
