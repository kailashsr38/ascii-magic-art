/* transverse-longitudinal: a wave on a string beside a sound wave in air, showing how the particles move in each. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bgA", gradient(["#06101e", "#0a182c", "#0e203a"], 3));
add("str", gradient(["#1a4a8a", "#2a70c0", "#4a9ae8", "#9ad0ff"], 4));
add("air", gradient(["#0c1018", "#1a2a2a", "#2a4a3e", "#3a7a54", "#5aa86a", "#9ae08a", "#d8ffc0"], 8));
add("hot", ["#ff5a5a", "#ffd0d0"]);
add("spk", ["#4a4a52", "#8a8a94", "#c8c8d0"]);
add("ui", ["#ffffff", "#8b949e", "#ffd166", "#79c0ff", "#7ee787", "#30363d"]);

export const meta = {
  slug: "transverse-longitudinal",
  name: "Transverse And Longitudinal",
  category: "science",
  note: "A wave on a string, where each bead moves up and down, above a sound wave in air, where each particle moves back and forth, with wavelength, compressions and rarefactions marked.",
  tags: ["waves", "sound", "physics", "education", "science", "classroom"],
  cols: 100, rows: 32, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const LAM = 24, F = 0.5;            // wavelength in cells, frequency in Hz

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const k = TAU / LAM, w = TAU * F;
  const X0 = 10;
  return (t) => {
    g.clear();
    // backgrounds
    for (let y = 0; y < 15; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y) % 3 ? "░" : "▒", K("bgA", y < 2 || y > 12 ? 0 : 1 + ((x >> 3) & 1) * 0));
    // ---- transverse: string with beads ----
    const A = 4, CY = 7;
    g.text(1, 0, "TRANSVERSE WAVE", K("ui", 0));
    g.text(18, 0, "on a string: particles move up and down, wave travels →", K("ui", 1));
    for (let x = X0; x < cols - 1; x++) {
      const y = CY - A * Math.sin(k * (x - X0) - w * t);
      const yi = Math.round(y), d = y - yi;
      g.set(x, yi, d < -0.25 ? "▀" : d > 0.25 ? "▄" : "█", K("str", 2));
    }
    for (let x = X0; x < cols - 1; x += 3) {
      const y = Math.round(CY - A * Math.sin(k * (x - X0) - w * t));
      g.set(x, y, "●", x === X0 + 36 ? K("hot", 0) : K("str", 3));
    }
    // the hand driving it and the axis line
    const hy = Math.round(CY - A * Math.sin(-w * t));
    for (let x = 0; x < X0; x++) g.set(x, CY, "·", K("ui", 5));
    for (let x = X0; x < cols; x += 2) if (g.get(x, CY) === "░" || g.get(x, CY) === "▒") g.set(x, CY, "·", K("ui", 5));
    g.text(X0 - 4, hy, "▐██▌", K("spk", 2));
    // tracked bead arrow
    const bx = X0 + 36;
    g.set(bx + 2, CY - A, "↑", K("hot", 1)); g.set(bx + 2, CY + A, "↓", K("hot", 1));
    for (let y = CY - A + 1; y < CY + A; y++) if (g.get(bx + 2, y) !== "█") g.set(bx + 2, y, "│", K("hot", 0));
    // wavelength bracket tied to a crest
    const ph = ((w * t) / k) % LAM;
    let cx = X0 + LAM / 4 + ph; while (cx > X0 + 44) cx -= LAM; while (cx < X0 + 2) cx += LAM;
    const c0 = Math.round(cx), c1 = Math.round(cx + LAM);
    g.hline(c0, c1, CY - A - 2, "─", K("ui", 2)); g.set(c0, CY - A - 2, "├", K("ui", 2)); g.set(c1, CY - A - 2, "┤", K("ui", 2));
    g.text(Math.round((c0 + c1) / 2) - 6, CY - A - 2, " wavelength ", K("ui", 2));
    g.text(cols - 16, CY - A - 1, "crest", K("ui", 3)); g.text(cols - 16, CY + A + 1, "trough", K("ui", 3));
    g.text(1, CY + A + 2, "amplitude", K("ui", 1)); g.set(5, CY + A + 1, "↓", K("ui", 1));
    // ---- longitudinal: air pressure from a speaker ----
    const LY0 = 17, LY1 = 27;
    g.text(1, 15, "LONGITUDINAL WAVE", K("ui", 0));
    g.text(20, 15, "sound in air: particles move to and fro, wave travels →", K("ui", 1));
    const amp = 2.4;
    const disp = (x0) => amp * Math.sin(k * (x0 - X0) - w * t);
    for (let y = LY0; y < LY1; y++) for (let x = X0; x < cols; x++) {
      const dens = -Math.cos(k * (x - X0) - w * t);       // +1 compression
      const v = clamp((dens + 1) / 2);
      g.set(x, y, v > 0.75 ? "▓" : v > 0.4 ? "▒" : "░", K("air", Math.min(7, Math.floor(v * 7.99))));
    }
    // particles: evenly spaced rest positions displaced along the wave
    for (let r = 0; r < 5; r++) for (let x0 = X0 + (r % 2) * 1.5; x0 < cols; x0 += 3) {
      const x = Math.round(x0 + disp(x0)), y = LY0 + 1 + r * 2;
      if (x >= X0 && x < cols) g.set(x, y, "●", K("air", 7));
    }
    // tracked particle
    const tx0 = X0 + 37.5, tx = Math.round(tx0 + disp(tx0));
    g.set(tx, LY0 + 5, "●", K("hot", 0));
    g.text(Math.round(tx0 - amp) - 1, LY1, "←", K("hot", 1)); g.text(Math.round(tx0 + amp) + 1, LY1, "→", K("hot", 1));
    // speaker cone
    const sp = Math.round(disp(X0));
    for (let y = LY0; y < LY1; y++) {
      const cone = Math.abs(y - (LY0 + LY1 - 1) / 2) < 2.5;
      g.text(0, y, cone ? "▐█" : " ▐", K("spk", 1));
      g.set(X0 - 3 + sp, y, "█", K("spk", 2));
    }
    // labels for compressions and rarefactions, tied to the pattern
    for (let m = -2; m < 6; m++) {
      const xc = X0 + (w * t) / k + m * LAM + LAM / 2;      // dens = +1 where k(x-X0)-wt = PI
      const xr = xc + LAM / 2;
      if (xc > X0 + 4 && xc < cols - 12) g.text(Math.round(xc) - 5, LY1 + 1, "COMPRESSION", K("ui", 4));
      if (xr > X0 + 4 && xr < cols - 11) g.text(Math.round(xr) - 5, LY1 + 2, "RAREFACTION", K("ui", 3));
    }
    g.text(1, rows - 1, "Both carry energy to the right. Neither carries the particles along.", K("ui", 0));
    return g.frame();
  };
}
