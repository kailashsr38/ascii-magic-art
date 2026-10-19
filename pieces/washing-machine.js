/* washing-machine: a front loader tumbling a load of clothes, then draining and spinning hard. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const WALL = gradient(["#0f1a24", "#1c2c3a", "#2a4050"], 5);             // 0-4
const BODY = gradient(["#7d8794", "#b8c0ca", "#e4e9ef", "#ffffff"], 8);  // 5-c
const CHROME = gradient(["#30363e", "#6a727e", "#c4cad2", "#f2f6fa"], 6); // d-i
const pal = palette([
  ...WALL, ...BODY, ...CHROME,
  "#0d1822", "#163a5a", "#2f78b0", "#7cc8f0", // j drum dark, k water deep, l water, m foam blue
  "#ff4a5a", "#ffd23f", "#3a8cff", "#4ad07a", "#ff8ad0", "#f4f4f4", // n-s clothes
  "#5aff8a", "#2a3038",                       // t display, u panel dark
]);

export const meta = {
  slug: "washing-machine",
  name: "Washing Machine",
  category: "things",
  note: "A front loading washer tumbling a colourful load through soapy water, then draining and spinning fast.",
  tags: ["laundry", "home", "loader", "spin", "hero"],
  cols: 58, rows: 38, fps: 30,
  palette: pal,
};

const WASH = 9, DRAIN = 1.5, SPIN = 4.5, P = WASH + DRAIN + SPIN;
const omega = (c) => {
  if (c < WASH) { const k = c % 3; return (Math.floor(c / 3) % 2 ? -1 : 1) * (k < 2.4 ? 2.6 : 0); }
  if (c < WASH + DRAIN) return 0.8;
  const s = (c - WASH - DRAIN) / SPIN;
  return 22 * Math.min(1, s * 3) * Math.min(1, (1 - s) * 5);
};
const integrate = (a, b) => { let s = 0; for (let x = a; x < b; x += 0.02) s += omega(x) * Math.min(0.02, b - x); return s; };
const FULL = integrate(0, P);
const CLOTHES = "nopqrs";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  return (t) => {
    const c = t % P;
    const ang = FULL * Math.floor(t / P) + integrate(0, c);
    const w = omega(c);
    const spin = c >= WASH + DRAIN;
    const shake = spin && w > 12 ? (Math.sin(t * 47) > 0 ? 1 : 0) : 0;
    const water = c < WASH ? 0.45 : c < WASH + DRAIN ? 0.45 * (1 - (c - WASH) / DRAIN) : 0;
    // wall and floor
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(fbm(x * 0.07, y * 0.15, 3) * 0.7 + 0.1);
      g.set(x, y, y > 35 ? "▓" : v > 0.5 ? "▒" : "░", y > 35 ? "1" : KEYS[Math.min(4, Math.floor(v * 5))]);
    }
    const ox = 6 + shake;
    // cabinet
    for (let y = 1; y <= 35; y++) for (let x = ox; x <= ox + 45; x++) {
      const u = (x - ox) / 45;
      const l = clamp(0.85 - u * 0.35 - (y > 33 ? 0.4 : 0) + (x === ox ? 0.15 : 0) - (x === ox + 45 ? 0.3 : 0));
      g.set(x, y, "█", KEYS[5 + Math.min(7, Math.floor(l * 8))]);
    }
    // control panel
    for (let x = ox + 1; x <= ox + 44; x++) g.set(x, 8, "▄", "7");
    for (let y = 3; y <= 6; y++) for (let x = ox + 3; x <= ox + 10; x++) {
      if (Math.hypot((x - ox - 6.5) / 3.6, (y - 4.5) / 1.8) <= 1) g.set(x, y, "█", x < ox + 6 ? "h" : "f");
    }
    const knob = ang * 0.02;
    g.set(Math.round(ox + 6.5 + Math.cos(knob) * 2), Math.round(4.5 + Math.sin(knob)), "●", "u");
    for (let x = ox + 14; x <= ox + 25; x++) for (let y = 3; y <= 6; y++) g.set(x, y, "█", "u");
    const left = Math.max(0, Math.ceil((P - c) * 4));
    g.text(ox + 16, 4, `0:${String(left).padStart(2, "0")}`, "t");
    g.text(ox + 16, 5, spin ? "SPIN" : c < WASH ? "WASH" : "RINSE", "m");
    for (let k = 0; k < 4; k++) g.text(ox + 29 + k * 4, 4, "▄▄", k === (spin ? 3 : c < WASH ? 1 : 2) ? "t" : "e");
    // door: chrome ring, glass, drum, water and clothes
    const dx0 = ox + 22.5, dy0 = 22, R = 19;
    for (let y = 11; y <= 33; y++) for (let x = ox; x <= ox + 45; x++) {
      const u = (x - dx0) / R, v = (y - dy0) / (R * 0.5);
      const d = Math.hypot(u, v);
      if (d > 1) continue;
      if (d > 0.84) { g.set(x, y, "█", KEYS[13 + Math.min(5, Math.floor(clamp(0.6 - (u + v) * 0.35) * 6))]); continue; }
      if (d > 0.79) { g.set(x, y, "█", "e"); continue; }
      const a = Math.atan2(v, u);
      // drum with perforations that turn
      const holes = (Math.floor(((a - ang) / TAU) * 24 + 100) + Math.floor(d * 9)) % 2 === 0 && d > 0.5;
      let ch = holes ? "▒" : "░", co = holes ? "e" : "j";
      // water, sloshing with the drum
      const wl = 1 - water * 2 + Math.sin(u * 4 + t * 3) * 0.05 + w * 0.01 * u;
      if (water > 0 && v > wl) {
        const foam = Math.abs(v - wl) < 0.08;
        ch = foam ? "▓" : "▒"; co = foam ? "m" : (noise2(x * 0.3, y * 0.6 + t * 2, 3) > 0.55 ? "l" : "k");
      }
      g.set(x, y, ch, co);
    }
    // clothes
    const n = 7;
    for (let i = 0; i < n; i++) {
      let px, py;
      if (spin) {
        const a = ang + (i / n) * TAU;
        const rr = 0.62;
        px = Math.cos(a) * rr; py = Math.sin(a) * rr;
      } else {
        const dir = w >= 0 ? 1 : -1;
        const u = (((ang / TAU) * 0.9 + i / n) % 1 + 1) % 1;
        if (u < 0.6) {
          const a = (u / 0.6) * 2.0;
          px = Math.sin(a) * 0.58 * dir; py = Math.cos(a) * 0.58;
        } else {
          const f = (u - 0.6) / 0.4;
          const sx = Math.sin(2.0) * 0.58 * dir, sy = Math.cos(2.0) * 0.58;
          px = sx * (1 - f) + 0.05 * dir * f; py = sy + (0.6 - sy) * f * f;
        }
      }
      const bx = dx0 + px * R, by = dy0 + py * R * 0.5;
      const col = CLOTHES[i % CLOTHES.length];
      const sw = spin && w > 8 ? 3.6 : 2.6, sh = spin && w > 8 ? 1.1 : 1.5;
      for (let y = Math.floor(by - sh); y <= Math.ceil(by + sh); y++) for (let x = Math.floor(bx - sw); x <= Math.ceil(bx + sw); x++) {
        const q = Math.hypot((x - bx) / sw, (y - by) / sh);
        if (q <= 1 && Math.hypot((x - dx0) / R, (y - dy0) / (R * 0.5)) < 0.78) g.set(x, y, q < 0.6 ? "█" : "▓", col);
      }
    }
    // bubbles while washing
    if (water > 0.2) for (let b = 0; b < 8; b++) {
      const k = ((t * 0.7 + b * 0.37) % 1);
      const x = Math.round(dx0 - 9 + ((b * 5) % 18) + Math.sin(t * 2 + b) * 1.5);
      const y = Math.round(dy0 + 6 - k * 6);
      g.set(x, y, k > 0.5 ? "°" : "o", "m");
    }
    // glass glint and handle
    g.set(Math.round(dx0 - 8), dy0 - 5, "▀", "i"); g.set(Math.round(dx0 - 9), dy0 - 4, "▀", "i");
    for (let y = 19; y <= 25; y++) g.set(ox + 42, y, "█", "g");
    return g.frame();
  };
}
