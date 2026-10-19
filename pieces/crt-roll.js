/* crt-roll: an old CRT television showing a test card, rolling vertically with scanlines. */
import { Grid, palette, KEYS } from "../lib/kit.js";

// bars: white yellow cyan green magenta red blue, each bright then dim (scanline)
const BARS = ["#e8e8e8", "#e8e23a", "#3ae0e0", "#3ad84a", "#d84ad8", "#e04040", "#3a4ae8"];
const DIM = ["#9a9a9a", "#9a9626", "#269494", "#268f30", "#8f308f", "#942a2a", "#26308f"];
const MISC = ["#101014", "#2a2a30", "#5a5a64", "#f4f4f4", "#1a1a1e", "#3a3530", "#58524a", "#7a7266", "#c8b89a", "#3fe07a", "#ff5a3a"];

export const meta = {
  slug: "crt-roll",
  name: "CRT Test Card",
  category: "demoscene",
  note: "An old CRT television showing a colour test card, the picture rolling slowly with visible scanlines.",
  tags: ["crt", "tv", "retro", "test card", "glitch", "404"],
  cols: 90, rows: 34, fps: 24,
  palette: palette([...BARS, ...DIM, ...MISC]),
};

const M = (i) => KEYS[14 + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SX = 6, SY = 3, SW = 62, SH = 26;    // screen rectangle
  const hash = (x, y, s) => {
    let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // the test card as a function of picture coords (u across 0..SW, v down 0..H)
  const PH = SH + 4;   // picture height including the vertical blanking band
  const card = (u, v, t) => {
    if (v >= SH) return [" ", M(0)];                     // blanking bar
    const cx = SW / 2, cy = SH / 2;
    const dx = (u - cx) / 2, dy = v - cy;
    const r = Math.hypot(dx, dy);
    if (r > 8.6 && r < 9.6) return ["█", M(3)];          // centre circle
    if (v < 3 || v >= SH - 3) {                         // grey frame strips with ticks
      const tick = Math.floor(u) % 4 === 0;
      return [tick ? "█" : "▓", tick ? M(3) : M(2)];
    }
    if (v >= SH - 7) {                                   // lower strip: grey ramp then pluge
      const k = Math.max(0, Math.min(5, Math.floor((u / SW) * 6)));
      return [" ░▒▓██"[k], k > 3 ? M(3) : M(2)];
    }
    if (r < 8.6 && v >= cy - 1 && v <= cy) {
      const label = "  TEST  CARD  ";
      const i = Math.floor(u - cx + label.length / 2);
      if (i >= 0 && i < label.length && label[i] !== " " && v === Math.floor(cy) - 1) return [label[i], M(0)];
      return ["█", M(3)];
    }
    const bar = Math.max(0, Math.min(6, Math.floor((u / SW) * 7)));
    return ["█", KEYS[bar]];
  };
  return (t) => {
    g.clear();
    // room wall behind
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y * 3) % 7 === 0 ? "▒" : "░", M(4));
    // cabinet: wood box with a bezel
    g.fill(2, 1, 86, 31, "█", M(6));
    for (let y = 1; y < 32; y++) for (let x = 2; x < 88; x++) if ((x * 7 + y * 13) % 11 === 0) g.set(x, y, "▓", M(7));
    g.fill(4, 2, 66, 28, "█", M(1));
    g.box(4, 2, 66, 28, "round", M(2));
    // control panel
    g.fill(72, 3, 14, 26, "█", M(5));
    g.box(72, 3, 14, 26, "light", M(7));
    for (let k = 0; k < 2; k++) {
      const ky = 6 + k * 6;
      g.text(76, ky, "▄██▄", M(1)); g.text(76, ky + 1, "████", M(1)); g.text(76, ky + 2, "▀██▀", M(1));
      const a = t * (k ? -0.4 : 0.3) + k;
      g.set(77 + Math.round(Math.cos(a)), ky + 1 + Math.round(Math.sin(a) * 0.6), "●", M(3));
    }
    g.text(74, 19, "CH", M(8)); g.text(78, 19, "03", M(9));
    for (let i = 0; i < 4; i++) g.text(74, 22 + i, "══════════", M(7));
    g.set(84, 19, "●", Math.sin(t * 3) > 0 ? M(10) : M(5));
    // legs
    g.text(8, 32, "▐█▌", M(1)); g.text(80, 32, "▐█▌", M(1));
    // the picture: rolling, with scanlines and slight sideways wobble
    const roll = (t * 6) % PH;
    for (let y = 0; y < SH; y++) {
      const v = (y + roll) % PH;
      const wob = Math.round(Math.sin(t * 9 + y * 0.7) * 0.6);
      const scan = y % 2 === 1;
      for (let x = 0; x < SW; x++) {
        let [ch, co] = card(x - wob, Math.floor(v), t);
        // corners of the tube are rounded
        const ex = (x - SW / 2) / (SW / 2), ey = (y - SH / 2) / (SH / 2);
        if (ex * ex * ex * ex + ey * ey * ey * ey > 0.92) { g.set(SX + x, SY + y, " ", M(0)); continue; }
        if (scan && ch === "█") {
          const bi = KEYS.indexOf(co);
          if (bi >= 0 && bi < 7) co = KEYS[7 + bi];
          ch = "▓";
        }
        if (hash(x, y, Math.floor(t * 24)) > 0.985) { ch = "░"; co = M(3); }
        g.set(SX + x, SY + y, ch, co);
      }
    }
    return g.frame();
  };
}
