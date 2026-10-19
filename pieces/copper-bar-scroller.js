/* copper-bar-scroller: a demoscene intro with copper bars, a wobbling logo, a parallax starfield and a big sine scroller. */
import { Grid, palette, gradient, rng, KEYS } from "../lib/kit.js";

const BARS = [["#200008", "#a01030", "#ff6070", "#fff0f0"], ["#201400", "#a06a00", "#ffc040", "#fffbe8"], ["#002010", "#008a40", "#50ff90", "#f0fff4"], ["#000a28", "#1040b0", "#60a0ff", "#f0f6ff"]];
const all = [];
BARS.forEach((s) => all.push(...gradient(s, 5)));               // 0..19
all.push(...gradient(["#ff3cac", "#ffb03a", "#f6ff5a", "#3cffb0", "#3cb8ff", "#b05cff"], 12)); // 20..31 logo rainbow
all.push(...gradient(["#ffffff", "#9ad8ff", "#3a7aff"], 5));  // 32..36 scroller
all.push("#2a2a3a", "#6a6a8a", "#c0c0e0");                       // 37..39 stars

export const meta = {
  slug: "copper-bar-scroller",
  name: "Copper Bar Demo",
  category: "retro",
  note: "A demoscene intro with glowing copper bars swinging past each other, a rainbow logo wobbling line by line, parallax stars and a big sine wave scroller.",
  tags: ["retro", "demoscene", "intro", "scroller", "hero", "wallpaper"],
  cols: 100, rows: 34, fps: 30,
  palette: palette(all),
};

const F = {
  A: "01110,10001,11111,10001,10001", B: "11110,10001,11110,10001,11110", C: "01111,10000,10000,10000,01111", D: "11110,10001,10001,10001,11110",
  E: "11111,10000,11110,10000,11111", F: "11111,10000,11110,10000,10000", G: "01111,10000,10011,10001,01111", H: "10001,10001,11111,10001,10001",
  I: "11111,00100,00100,00100,11111", J: "00111,00010,00010,10010,01100", K: "10010,10100,11000,10100,10010", L: "10000,10000,10000,10000,11111",
  M: "10001,11011,10101,10001,10001", N: "10001,11001,10101,10011,10001", O: "01110,10001,10001,10001,01110", P: "11110,10001,11110,10000,10000",
  Q: "01110,10001,10101,10010,01101", R: "11110,10001,11110,10010,10001", S: "01111,10000,01110,00001,11110", T: "11111,00100,00100,00100,00100",
  U: "10001,10001,10001,10001,01110", V: "10001,10001,10001,01010,00100", W: "10001,10001,10101,11011,10001", X: "10001,01010,00100,01010,10001",
  Y: "10001,01010,00100,00100,00100", Z: "11111,00010,00100,01000,11111", " ": "00000,00000,00000,00000,00000", "!": "00100,00100,00100,00000,00100",
  ".": "00000,00000,00000,00000,00100", "-": "00000,00000,01110,00000,00000",
};
const MSG = "    GREETINGS FROM THE NIGHT SHIFT CREW ... ALL TEXT, NO PIXELS ... HELLO TO EVERY SCENER STILL CODING AFTER MIDNIGHT ... ";
const K = (i) => KEYS[i];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const R = rng(3);
  const stars = Array.from({ length: 90 }, () => [R() * W, Math.floor(R() * H), Math.floor(R() * 3)]);
  // message as bitmap columns
  const cols = [];
  for (const c of MSG) { const rows = (F[c] || F[" "]).split(","); for (let x = 0; x < 5; x++) cols.push(rows.map((r) => r[x] === "1")); cols.push([false, false, false, false, false]); }
  const LOGO = "NOVA";
  const logoCols = [];
  for (const c of LOGO) { const rows = F[c].split(","); for (let x = 0; x < 5; x++) logoCols.push(rows.map((r) => r[x] === "1")); logoCols.push([false, false, false, false, false]); }
  const PERIOD = (cols.length * 2) / 16;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // stars
    for (const [x, y, l] of stars) {
      const sx = ((x - t * (l + 1) * 6) % W + W) % W;
      g.set(sx, y, l === 2 ? "•" : l === 1 ? "·" : ".", K(37 + l));
    }
    // copper bars: back ones first, sorted by depth
    const bars = [0, 1, 2, 3].map((i) => {
      const a = t * 1.6 + i * (Math.PI / 2);
      return { i, y: 15 + Math.sin(a) * 9, z: Math.cos(a) };
    }).sort((a, b) => a.z - b.z);
    for (const b of bars) {
      for (let d = -2; d <= 2; d++) {
        const y = Math.round(b.y) + d;
        const lvl = 4 - Math.abs(d) * 2 + (b.z > 0 ? 0 : -1);
        const k = b.i * 5 + Math.max(0, Math.min(4, lvl));
        for (let x = 0; x < W; x++) g.set(x, y, Math.abs(d) === 2 ? "▓" : "█", K(k));
      }
    }
    // logo: big letters, each row wobbling sideways
    const LS = 3, LH = 5 * 1;
    const lw = logoCols.length * LS;
    for (let r = 0; r < 5; r++) for (let sub = 0; sub < 2; sub++) {
      const y = 1 + r * 2 + sub;
      const wob = Math.round(Math.sin(t * 2.5 + r * 0.35) * 3);
      const x0 = Math.floor((W - lw) / 2) + wob;
      for (let c = 0; c < logoCols.length; c++) if (logoCols[c][r]) for (let q = 0; q < LS; q++) {
        const x = x0 + c * LS + q;
        g.set(x, y, "█", K(20 + Math.floor((((x + t * 20) / 6) % 12 + 12) % 12)));
      }
      void LH;
    }
    // sine scroller: each font pixel 2 wide, 2 tall
    const off = lt * 16;
    const base = 20;
    for (let x = 0; x < W; x++) {
      const ci = Math.floor((x + off) / 2) % cols.length;
      const col = cols[ci];
      const dy = Math.round(Math.sin((x + off * 0.0) * 0.09 + t * 2.4) * 2.5);
      for (let r = 0; r < 5; r++) if (col[r]) for (let s = 0; s < 2; s++) {
        const y = base + r * 2 + dy + s;
        g.set(x, y, "█", K(32 + Math.min(4, r)));
      }
    }
    g.hline(0, W - 1, H - 1, "▀", K(36));
    return g.frame();
  };
}
