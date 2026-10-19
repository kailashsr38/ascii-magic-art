/* rotary-phone: an old desk telephone whose finger wheel turns and springs back as a number is dialled. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const WALL = gradient(["#1c1410", "#2e2018", "#40302a"], 5);              // 0-4
const SHELL = gradient(["#3a0a0e", "#6e1418", "#a8222a", "#e05050", "#ff9a90"], 10); // 5-e
const pal = palette([
  ...WALL, ...SHELL,
  "#f2ead6", "#c8bc9e", "#2a2a2a",            // f plate cream, g plate shade, h digits
  "#c8ccd4", "#7a808c", "#3a3e48", "#eef2f8", // i chrome, j chrome mid, k chrome dark, l chrome light
  "#ffd84a", "#5a3a20", "#8a5a30",            // m highlight, n desk, o desk light
]);

export const meta = {
  slug: "rotary-phone",
  name: "Rotary Phone",
  category: "things",
  note: "A red desk telephone whose finger wheel turns to the stop and springs back as a number is dialled.",
  tags: ["retro", "phone", "vintage", "contact", "hero"],
  cols: 76, rows: 38, fps: 30,
  palette: pal,
};

const NUMBER = "5550147";
const DEG = Math.PI / 180;
const STOP = 60 * DEG;
// hole k (1..10, where 10 is the 0) rests at this angle; dialling turns it clockwise to the stop
const holeAngle = (k) => STOP - (60 + (k - 1) * 30) * DEG;
const sweep = (k) => (60 + (k - 1) * 30) * DEG;

// a timeline of dialling: turn forward, spring back, short pause
const STEPS = [];
let T0 = 1.2;
for (const ch of NUMBER) {
  const k = ch === "0" ? 10 : +ch;
  const fwd = sweep(k) / (260 * DEG), back = sweep(k) / (420 * DEG);
  STEPS.push({ k, ch, start: T0, fwd, back });
  T0 += fwd + 0.15 + back + 0.35;
}
const PERIOD = T0 + 3;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 38, cy = 22, RD = 22, RH = 16.5, HR = 3.1;
  return (t) => {
    const c = t % PERIOD;
    let rot = 0, active = -1, dialled = 0;
    for (let i = 0; i < STEPS.length; i++) {
      const s = STEPS[i];
      const e = c - s.start;
      if (e < 0) break;
      if (e < s.fwd) { rot = sweep(s.k) * (e / s.fwd); active = s.k; }
      else if (e < s.fwd + 0.15) { rot = sweep(s.k); active = s.k; }
      else if (e < s.fwd + 0.15 + s.back) { rot = sweep(s.k) * (1 - (e - s.fwd - 0.15) / s.back); dialled = i + 1; }
      else dialled = i + 1;
    }
    // wall and desk
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y >= 34) { g.set(x, y, "▓", (x + y * 3) % 7 === 0 ? "o" : "n"); continue; }
      const v = clamp(fbm(x * 0.06, y * 0.14, 3) * 0.7 + Math.exp(-Math.hypot((x - cx) / 40, (y - 14) / 16)) * 0.3);
      g.set(x, y, v > 0.5 ? "▒" : "░", KEYS[Math.min(4, Math.floor(v * 5))]);
    }
    // body: a wide shell that rises to the cradle
    for (let y = 6; y <= 34; y++) {
      const s = (y - 6) / 28;
      const half = 18 + Math.sqrt(s) * 17;
      for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
        const u = (x - cx) / half;
        if (Math.abs(u) > 1) continue;
        const l = clamp(0.55 - u * 0.3 + (1 - s) * 0.25 - Math.abs(u) ** 6 * 0.4 + (y === 34 ? -0.4 : 0));
        g.set(x, y, "█", KEYS[5 + Math.min(9, Math.floor(l * 10))]);
      }
    }
    // handset resting on the cradle
    for (let x = cx - 26; x <= cx + 26; x++) {
      const u = Math.abs(x - cx) / 26;
      const top = u > 0.72 ? 1 : 3;
      for (let y = top; y <= 5; y++) {
        const l = clamp(0.75 - (y - top) * 0.12 - (x - cx) / 80);
        g.set(x, y, "█", KEYS[5 + Math.min(9, Math.floor(l * 10))]);
      }
    }
    // dial plate, finger wheel with holes, number card in the middle
    for (let y = cy - 12; y <= cy + 12; y++) for (let x = cx - RD - 1; x <= cx + RD + 1; x++) {
      const dx = x - cx, dy = (y - cy) * 2;
      const d = Math.hypot(dx, dy);
      if (d > RD + 0.8) continue;
      const a = Math.atan2(dy, dx);
      if (d > RD - 0.6) { g.set(x, y, "█", "k"); continue; }
      let inHole = false;
      for (let k = 1; k <= 10; k++) {
        const ha = holeAngle(k) + rot;
        const hx = Math.cos(ha) * RH, hy = Math.sin(ha) * RH;
        const hd = Math.hypot(dx - hx, dy - hy);
        if (hd < HR) { inHole = true; g.set(x, y, "█", active === k ? "m" : hd > HR - 0.9 ? "g" : "f"); break; }
      }
      if (inHole) continue;
      if (d < 7.5) { g.set(x, y, "█", "f"); continue; }
      if (d < 8.5) { g.set(x, y, "█", "j"); continue; }
      const l = clamp(0.55 - Math.cos(a + 0.8) * 0.3 + (d > RD - 2 ? 0.2 : 0));
      g.set(x, y, "█", l > 0.7 ? "l" : l > 0.45 ? "i" : "j");
    }
    // digits printed on the plate, visible through the holes at rest
    for (let k = 1; k <= 10; k++) {
      const ha = holeAngle(k);
      const hx = cx + Math.cos(ha) * RH, hy = cy + (Math.sin(ha) * RH) / 2;
      const ix = Math.round(hx), iy = Math.round(hy);
      const ch = g.co[ix + iy * cols];
      if (ch === "f" || ch === "m") g.set(ix, iy, String(k % 10), "h");
    }
    // finger stop
    const fx = cx + Math.cos(STOP) * (RD - 1), fy = cy + (Math.sin(STOP) * (RD - 1)) / 2;
    g.text(Math.round(fx) - 1, Math.round(fy), "▄█▀", "l");
    // number card
    const shown = NUMBER.slice(0, dialled);
    const label = (shown.slice(0, 3) + (shown.length > 3 ? "-" + shown.slice(3) : "")).padEnd(8, "_");
    g.text(cx - 4, cy, label, "h");
    g.text(cx - 3, cy - 1, "DIAL", "g");
    if (dialled === NUMBER.length && c > T0 + 0.6 && Math.floor(c * 3) % 2 === 0) {
      g.text(cx - 32, 12, "RING", "m"); g.text(cx + 29, 12, "RING", "m");
    }
    return g.frame();
  };
}
