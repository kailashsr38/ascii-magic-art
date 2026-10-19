/* countdown-timer: big digits counting from 10 to 0 inside a sweeping ring, then GO. */
import { Grid, palette, TAU } from "../lib/kit.js";

/* 5x5 block font, drawn fresh for this piece. */
const FONT = {
  A: " ### |#   #|#####|#   #|#   #", B: "#### |#   #|#### |#   #|#### ", C: " ####|#    |#    |#    | ####",
  D: "#### |#   #|#   #|#   #|#### ", E: "#####|#    |#### |#    |#####", F: "#####|#    |#### |#    |#    ",
  G: " ####|#    |#  ##|#   #| ####", H: "#   #|#   #|#####|#   #|#   #", I: "#####|  #  |  #  |  #  |#####",
  J: "  ###|    #|    #|#   #| ### ", K: "#   #|#  # |###  |#  # |#   #", L: "#    |#    |#    |#    |#####",
  M: "#   #|## ##|# # #|#   #|#   #", N: "#   #|##  #|# # #|#  ##|#   #", O: " ### |#   #|#   #|#   #| ### ",
  P: "#### |#   #|#### |#    |#    ", Q: " ### |#   #|# # #|#  # | ## #", R: "#### |#   #|#### |#  # |#   #",
  S: " ####|#    | ### |    #|#### ", T: "#####|  #  |  #  |  #  |  #  ", U: "#   #|#   #|#   #|#   #| ### ",
  V: "#   #|#   #|#   #| # # |  #  ", W: "#   #|#   #|# # #|## ##|#   #", X: "#   #| # # |  #  | # # |#   #",
  Y: "#   #| # # |  #  |  #  |  #  ", Z: "#####|   # |  #  | #   |#####",
  0: " ### |#   #|#   #|#   #| ### ", 1: "  #  | ##  |  #  |  #  | ### ", 2: " ### |#   #|  ## | #   |#####",
  3: "#### |    #| ### |    #|#### ", 4: "#   #|#   #|#####|    #|    #", 5: "#####|#    |#### |    #|#### ",
  6: " ### |#    |#### |#   #| ### ", 7: "#####|    #|   # |  #  |  #  ", 8: " ### |#   #| ### |#   #| ### ",
  9: " ### |#   #| ####|    #| ### ", "!": "  #  |  #  |  #  |     |  #  ", "?": " ### |#   #|  ## |     |  #  ",
  ".": "     |     |     |     |  #  ", ",": "     |     |     |  #  | #   ", ":": "     |  #  |     |  #  |     ",
  "-": "     |     | ### |     |     ", "#": " # # |#####| # # |#####| # # ", ">": "#    | #   |  #  | #   |#    ",
  "'": "  #  |  #  |     |     |     ", " ": "     |     |     |     |     ",
};
const GL = {};
for (const k in FONT) GL[k] = FONT[k].split("|");
const glyph = (c) => GL[c] || GL[" "];

export const meta = {
  slug: "countdown-timer",
  name: "Countdown Timer",
  category: "lettering",
  note: "Big digits count down from ten inside a ring that drains every second, then GO bursts out in green.",
  tags: ["countdown", "timer", "launch", "hero", "loader"],
  cols: 56, rows: 26, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#ffa657", "#ff7b72", "#7ee787", "#1d3b2a", "#1c2a3f"]),
};

const CYC = 13.5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 27.5, cy = 12.5, RX = 25, RY = 12;
  // ring cells, precomputed with their angle (0 at top, clockwise)
  const ring = [], ticks = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const d = Math.hypot(dx / RX, dy / RY);
    let a = Math.atan2(dx, -dy * 2) / TAU; if (a < 0) a += 1;
    if (d > 0.86 && d <= 1.0) ring.push([x, y, a]);
    else if (d > 0.76 && d <= 0.81) ticks.push([x, y, a]);
  }
  const big = (s, co, sx, sy, yy) => {
    const w = s.length * 6 * sx - sx;
    const x0 = Math.round(cx - w / 2);
    [...s].forEach((c, k) => {
      const gl = glyph(c);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#")
        for (let u = 0; u < sx; u++) for (let v = 0; v < sy; v++) g.set(x0 + (k * 6 + i) * sx + u, yy + j * sy + v, "█", co);
    });
  };
  return (t) => {
    g.clear();
    const tt = ((t % CYC) + CYC) % CYC;
    if (tt < 11) {
      const n = 10 - Math.floor(tt), f = 1 - (tt % 1);
      const hot = n <= 3 ? (n === 0 ? "5" : "4") : "3";
      for (const [x, y, a] of ring) g.set(x, y, a < f ? "█" : "░", a < f ? hot : "2");
      for (const [x, y, a] of ticks) if (Math.round(a * 60) % 5 === 0) g.set(x, y, "·", "1");
      big(String(n), n <= 3 ? hot : "0", 2, 2, 6);
      g.text(Math.round(cx - 3.5), 18, "SECONDS", "1");
    } else {
      const k = tt - 11;
      const pulse = Math.floor(k * 6) % 2;
      for (const [x, y, a] of ring) g.set(x, y, "█", pulse ? "6" : "7");
      // burst rays
      for (let r = 0; r < 3; r++) {
        const rad = ((k * 0.9 + r * 0.33) % 1);
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * TAU;
          const rr = 0.25 + rad * 0.55;
          g.set(cx + Math.cos(a) * RX * rr, cy + Math.sin(a) * RY * rr, rad > 0.6 ? "·" : "•", rad > 0.6 ? "7" : "6");
        }
      }
      big("GO", "6", 2, 2, 8);
      g.text(Math.round(cx - 3), 20, "LIFTOFF", "6");
    }
    return g.frame();
  };
}
