/* pendulum-wall-clock: a tall wooden regulator clock, brass pendulum swinging behind glass and chiming on the hour. */
import { Grid, palette, gradient, KEYS, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(["#1e2a3a", "#26364a", "#30425a", "#3c5070"]);
const WOOD = add(gradient(["#1e0c04", "#3a1a0a", "#5a2c14", "#7a4020", "#9a5630", "#c07a48"], 10));
const FACE = add(["#f4ecd8", "#dcd0b4", "#1a120a", "#8a6a3a"]);
const BRASS = add(gradient(["#5a3e10", "#9a7020", "#d4a838", "#ffe8a0"], 6));
const GLASS = add(["#2a1a12", "#3a2618", "#4a3420"]);
const RED = add(["#c83a2a"]);
const SOUND = add(["#ffe8a0", "#d4a838", "#8a6a3a"]);

export const meta = {
  slug: "pendulum-wall-clock",
  name: "Pendulum Wall Clock",
  category: "things",
  note: "A tall wooden regulator clock hangs on a dark blue wall, its brass pendulum swinging behind the glass, second hand ticking and chimes ringing out on the hour.",
  tags: ["clock", "pendulum", "time", "vintage", "chime", "loader"],
  cols: 60, rows: 42, fps: 24,
  palette: palette(P),
};

const HOUR = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 30;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const mx = ((x % 12) + 12) % 12 - 6, my = ((y % 8) + 8) % 8 - 4 + (Math.floor(x / 12) % 2) * 0;
      const dam = Math.abs(mx) * 0.5 + Math.abs(my) < 3 && Math.abs(mx) * 0.5 + Math.abs(my) > 1.8;
      g.set(x, y, dam ? "▓" : "█", KEYS[WALL + (dam ? 3 : (y + Math.floor(x / 3)) % 7 === 0 ? 1 : 0)]);
    }
    const p = ((t % HOUR) + HOUR) % HOUR;
    // crown
    for (let y = 1; y <= 5; y++) {
      const w = 6 + (y - 1) * 3.2;
      for (let x = Math.ceil(cx - w); x <= cx + w; x++) g.set(x, y, y === 5 ? "▀" : "█", KEYS[WOOD + (y === 5 ? 8 : 4 + ((x + y) % 3 === 0 ? 1 : 0))]);
    }
    g.text(cx - 1, 0, "▄█▄", KEYS[BRASS + 3]);
    // case
    for (let y = 6; y <= 38; y++) for (let x = cx - 15; x <= cx + 15; x++) {
      const edge = Math.abs(x - cx) > 13 || y === 6 || y === 38 || y === 21;
      const n = noise2(x * 0.4, y * 0.15, 3);
      g.set(x, y, edge ? "█" : Math.sin(y * 0.9 + n * 4) > 0.75 ? "▓" : "█", KEYS[WOOD + (edge ? 6 : 2 + Math.floor(n * 4))]);
    }
    for (let x = cx - 16; x <= cx + 16; x++) { g.set(x, 39, "▀", KEYS[WOOD + 7]); g.set(x, 21, "▄", KEYS[WOOD + 8]); }
    g.text(cx - 3, 40, "▀▄▄▄▀", KEYS[WOOD + 5]);
    // face with roman-style ticks
    const fy = 13.5, fr = 11.5;
    for (let y = 7; y <= 20; y++) for (let x = cx - 13; x <= cx + 13; x++) {
      const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - fy) * 2);
      if (d <= fr) g.set(x, y, "█", KEYS[FACE + (d > fr - 1 ? 1 : 0)]);
      else if (d <= fr + 1.3) g.set(x, y, "█", KEYS[BRASS + 3 - (y > fy ? 1 : 0)]);
    }
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      g.set(cx + Math.cos(a) * (fr - 2), fy + Math.sin(a) * (fr - 2) / 2, "█", KEYS[FACE + (h % 3 === 0 ? 2 : 3)]);
    }
    g.text(cx - 1, fy - 4, "XII", KEYS[FACE + 2]);
    g.text(cx - 2, fy + 3, "VI", KEYS[FACE + 2]);
    // hands: seconds tick once per second, the minute hand sweeps to the hour
    const sec = Math.floor(t) % 60;
    const mins = p / HOUR;
    const hr = Math.floor(t / HOUR);
    const sa = (sec / 60) * TAU - Math.PI / 2, ma = mins * TAU - Math.PI / 2, ha = (((hr + 2) % 12) + mins) / 12 * TAU - Math.PI / 2;
    g.line(cx, fy, cx + Math.cos(ha) * 5, fy + Math.sin(ha) * 2.5, "█", KEYS[FACE + 2]);
    g.line(cx, fy, cx + Math.cos(ma) * 8.5, fy + Math.sin(ma) * 4.2, "▓", KEYS[FACE + 2]);
    g.line(cx, fy, cx + Math.cos(sa) * 9, fy + Math.sin(sa) * 4.5, "·", KEYS[RED]);
    g.set(cx, fy, "●", KEYS[BRASS + 2]);
    // glass door and pendulum
    for (let y = 23; y <= 36; y++) for (let x = cx - 11; x <= cx + 11; x++) {
      const frame = Math.abs(x - cx) === 11 || y === 23 || y === 36;
      g.set(x, y, frame ? "█" : "▓", KEYS[frame ? BRASS + 1 : GLASS + ((x + y) % 5 === 0 ? 2 : (x - y) % 9 === 0 ? 1 : 0)]);
    }
    const sw = Math.sin(t * Math.PI / 1.0) * 0.16;
    const L = 22;
    const bx = cx + Math.sin(sw) * L, by = 21 + Math.cos(sw) * L * 0.5;
    g.line(cx, 21, bx, by - 1, sw > 0.05 ? "\\" : sw < -0.05 ? "/" : "│", KEYS[BRASS + 2]);
    g.line(cx + 1, 21, bx + 1, by - 1, sw > 0.05 ? "\\" : sw < -0.05 ? "/" : "│", KEYS[BRASS + 1]);
    for (let y = -2; y <= 2; y++) for (let x = -4; x <= 4; x++) {
      const d = Math.hypot(x / 4.4, y / 2.4);
      if (d > 1) continue;
      g.set(bx + x, by + y, "█", KEYS[BRASS + Math.min(5, Math.floor(clamp(0.9 - (x + y * 2) * 0.08 - d * 0.3) * 6))]);
    }
    // chimes: on the hour the hammer rings and sound rings spread out
    if (p < 2.4) {
      for (let k = 0; k < 3; k++) {
        const a = ((p * 1.6 + k / 3) % 1);
        const r = 17 + a * 10;
        for (const s of [-1, 1]) for (let j = -3; j <= 3; j++) {
          const yy = 12 + j * 1.6 * (1 + a * 0.4);
          const xx = cx + s * (r - Math.abs(j) * 0.6);
          if (xx >= 0 && xx < cols) g.set(xx, yy, s > 0 ? ")" : "(", KEYS[SOUND + Math.min(2, Math.floor(a * 3))]);
        }
      }
      const strike = Math.floor(p * 2.5) % 2;
      g.text(cx - 3, 22, strike ? "▄█▄█▄" : "▀█▀█▀", KEYS[BRASS + 3]);
    }
    return g.frame();
  };
}
