/* phosphor-scope-xy: a vintage round-tube oscilloscope in X-Y mode, blue-white trace with a yellow afterglow, knobs turning between ratios. */
import { Grid, palette, TAU } from "../lib/kit.js";

export const meta = {
  slug: "phosphor-scope-xy",
  name: "Round Tube XY Scope",
  category: "retro",
  note: "A vintage round-tube oscilloscope in X-Y mode, its blue-white beam tracing a slowly rotating figure that leaves a yellow afterglow while the operator turns the frequency knobs.",
  tags: ["retro", "oscilloscope", "electronics", "lab", "signal", "hero"],
  cols: 100, rows: 34, fps: 30,
  palette: palette(["#3a3a10", "#7a7a20", "#c8c84a", "#bfe8ff", "#ffffff", "#1a3a2a", "#2e5a44", "#5a5a50", "#8a8678", "#c8c2b0", "#2a2a28", "#3c3c38", "#121410",
    "#ff5a3a", "#5a1a10", "#e6e0cc"]),
};

const BIT = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];
const RATIOS = [[1, 2], [2, 3], [3, 4], [1, 3], [3, 5]];
const SEG = 7;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const CX = 34, CY = 16.5, RX = 29, RY = 14.5;
  const bits = new Uint8Array(W * H), lev = new Uint8Array(W * H);
  const plot = (px, py, l) => {
    const x = Math.round(px), y = Math.round(py);
    if (x < 0 || y < 0 || x >= W * 2 || y >= H * 4) return;
    const i = (x >> 1) + (y >> 2) * W;
    bits[i] |= BIT[y & 3][x & 1];
    if (l > lev[i]) lev[i] = l;
  };
  const PERIOD = SEG * RATIOS.length;
  const trace = (tt, l) => {
    const lt = ((tt % PERIOD) + PERIOD) % PERIOD;
    const si = Math.floor(lt / SEG), k = (lt % SEG) / SEG;
    const [a, b] = RATIOS[si];
    const ph = tt * 0.9;
    const amp = k < 0.08 ? k / 0.08 : k > 0.92 ? (1 - k) / 0.08 : 1;
    for (let i = 0; i < 700; i++) {
      const s = (i / 700) * TAU;
      const x = Math.sin(a * s + ph), y = Math.sin(b * s);
      plot((CX + x * (RX - 6) * amp) * 2, (CY + y * (RY - 3) * amp) * 4, l);
    }
  };
  return (t) => {
    g.clear();
    bits.fill(0); lev.fill(0);
    const lt = t % PERIOD;
    const si = Math.floor(lt / SEG), k = (lt % SEG) / SEG;
    // cabinet
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, (x * 7 + y * 3) % 23 === 0 ? "▓" : "█", "8");
    for (let x = 0; x < W; x++) { g.set(x, 0, "▀", "9"); g.set(x, H - 1, "▄", "7"); }
    // tube bezel and face
    for (let y = 0; y < H; y++) for (let x = 0; x < 68; x++) {
      const dx = (x - CX + 0.5) / RX, dy = (y - CY + 0.5) / RY;
      const r = Math.hypot(dx, dy);
      if (r < 1) g.set(x, y, " ", "c");
      else if (r < 1.07) g.set(x, y, "█", "a");
      else if (r < 1.14) g.set(x, y, "▓", "7");
    }
    // graticule
    for (let gx = -4; gx <= 4; gx++) for (let gy = -3; gy <= 3; gy++) {
      const x = Math.round(CX + gx * 5.5), y = Math.round(CY + gy * 3.5);
      const dx = (x - CX + 0.5) / RX, dy = (y - CY + 0.5) / RY;
      if (Math.hypot(dx, dy) < 0.95) g.set(x, y, "+", "5");
    }
    for (let x = Math.round(CX - RX * 0.9); x <= CX + RX * 0.9; x++) if (g.get(x, Math.round(CY)) === " ") g.set(x, Math.round(CY), "·", "5");
    for (let y = Math.round(CY - RY * 0.9); y <= CY + RY * 0.9; y++) if (g.get(CX, y) === " ") g.set(CX, y, "·", "5");
    // the beam with its afterglow
    trace(t - 0.24, 1);
    trace(t - 0.16, 2);
    trace(t - 0.08, 3);
    trace(t, 4);
    for (let i = 0; i < W * H; i++) if (bits[i]) {
      const x = i % W, y = (i / W) | 0;
      const dx = (x - CX + 0.5) / RX, dy = (y - CY + 0.5) / RY;
      if (Math.hypot(dx, dy) >= 1) continue;
      g.ch[i] = String.fromCharCode(0x2800 + bits[i]);
      g.co[i] = "01234"[lev[i] - 1] || "4";
    }
    // control panel
    const PX = 70;
    g.fill(PX, 2, 28, 30, " ");
    g.box(PX, 2, 28, 30, "heavy", "7");
    g.text(PX + 2, 2, " X-Y MODE ", "f");
    const [a, b] = RATIOS[si];
    const turning = k > 0.9 || k < 0.1;
    const knob = (x, y, label, ang) => {
      const p = ["(|)", "(/)", "(-)", "(\\)"][((Math.round(ang) % 4) + 4) % 4];
      g.text(x, y, p, "9");
      g.text(x - 1, y + 1, label, "8");
    };
    const kAng = si * 3 + (turning ? Math.floor(t * 8) : 0);
    knob(PX + 4, 4, "CH1 FREQ", kAng);
    knob(PX + 17, 4, "CH2 FREQ", kAng + 1);
    knob(PX + 4, 8, "VOLTS", 1);
    knob(PX + 17, 8, "VOLTS", 1);
    knob(PX + 4, 12, "INTENS", 2);
    knob(PX + 17, 12, "FOCUS", 3);
    g.text(PX + 3, 16, "CH1 " + String(220 * a).padStart(4) + " Hz", "f");
    g.text(PX + 3, 17, "CH2 " + String(220 * b).padStart(4) + " Hz", "f");
    g.text(PX + 3, 18, "RATIO " + a + ":" + b, turning ? "2" : "3");
    g.text(PX + 3, 19, "PHASE " + String(Math.round(((t * 0.9 * 180) / Math.PI) % 360)).padStart(3) + "°", "9");
    g.text(PX + 3, 22, "CH1", "8"); g.text(PX + 9, 22, "CH2", "8"); g.text(PX + 15, 22, "EXT", "8");
    g.text(PX + 3, 23, "(●)", "9"); g.text(PX + 9, 23, "(●)", "9"); g.text(PX + 15, 23, "(●)", "7");
    g.text(PX + 3, 26, "POWER", "8");
    g.text(PX + 10, 26, "●", "d");
    g.text(PX + 3, 28, "▐████▌ ▐████▌", "7");
    g.text(PX + 3, 29, " X-Y    DUAL", "9");
    return g.frame();
  };
}
