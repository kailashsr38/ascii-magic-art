/* espresso-pour: a chrome espresso machine pulling a double shot into a glass cup, crema rising and steam drifting. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TILE = add(["#2e6a6a", "#286060", "#163a3c", "#3a7a78"]);
const COUNTER = add(gradient(["#1a1a1e", "#2a2a30", "#3a3a42"], 3));
const CHROME = add(gradient(["#3a3e46", "#5e646e", "#8a909c", "#b8bec8", "#e4e8ee", "#ffffff"], 8));
const RED = add(["#8a1a1a", "#c42a2a", "#e85a4a"]);
const COFFEE = add(["#1e0c04", "#3a1a08", "#5a2e10", "#8a5428", "#c4884a", "#e8b47a"]);
const GLASS = add(["#8aa4b4", "#c4d8e4", "#ffffff"]);
const STEAM = add(["#e4e8ec", "#c4c8cc", "#a4a8ac"]);
const GAUGE = add(["#f4f0e4", "#1a1a1a", "#e83a3a", "#3ab44a"]);
const CUP = add(["#f4f0ea", "#d4d0c8", "#a8a49c"]);

export const meta = {
  slug: "espresso-pour",
  name: "Espresso Machine Pour",
  category: "things",
  note: "A chrome espresso machine pulls a double shot into a glass cup, twin streams pouring, crema rising, the pressure gauge climbing and steam drifting from the wand.",
  tags: ["coffee", "espresso", "cafe", "kitchen", "morning", "loader"],
  cols: 72, rows: 34, fps: 24,
  palette: palette(P),
};

const PER = 11;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(5);
  const puffs = Array.from({ length: 18 }, () => [R(), R() * TAU, 0.6 + R() * 0.8]);
  return (t) => {
    g.clear();
    const p = ((t % PER) + PER) % PER;
    const pour = p > 1.2 && p < 7.5 ? 1 : 0;
    const level = clamp((p - 1.6) / 6);
    const slide = p > 9.2 ? smooth((p - 9.2) / 1.8) : 0;
    // subway tile wall
    for (let y = 0; y < 29; y++) for (let x = 0; x < cols; x++) {
      const row = Math.floor(y / 2), off = row % 2 ? 3 : 0;
      const grout = y % 2 === 1 || (x + off) % 6 === 0;
      g.set(x, y, grout ? "▒" : "█", KEYS[TILE + (grout ? 2 : (x + row) % 5 === 0 ? 3 : (row % 3 === 0 ? 1 : 0))]);
    }
    for (let y = 29; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === 29 ? "▀" : "█", KEYS[COUNTER + (y === 29 ? 2 : y > 31 ? 0 : 1)]);
    // machine body
    const L = 8, Rr = 62;
    for (let y = 5; y < 29; y++) for (let x = L; x <= Rr; x++) {
      const u = (x - L) / (Rr - L);
      const v = clamp(0.42 + Math.cos(u * Math.PI * 2.2) * 0.2 - (y > 15 && y < 27 ? 0.25 : 0));
      g.set(x, y, "█", KEYS[CHROME + Math.min(7, Math.floor(v * 8))]);
    }
    // red side panels and top rail
    for (let y = 5; y < 15; y++) { g.text(L, y, "██", KEYS[RED + 1]); g.text(Rr - 1, y, "██", KEYS[RED + 1]); }
    g.hline(L - 1, Rr + 1, 4, "▄", KEYS[CHROME + 6]);
    for (let x = L; x <= Rr; x += 2) g.set(x, 3, "╥", KEYS[CHROME + 4]);
    // cups warming on top
    for (const cx of [14, 22, 46, 54]) { g.text(cx, 1, "▄▄▄", KEYS[CUP]); g.text(cx, 2, "███", KEYS[CUP + 1]); g.set(cx + 3, 2, ")", KEYS[CUP + 2]); }
    // pressure gauge
    const gx = 18, gy = 10;
    for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 6; x <= gx + 6; x++) {
      const d = Math.hypot(x + 0.5 - gx, (y + 0.5 - gy) * 2);
      if (d < 5.2) g.set(x, y, "█", KEYS[GAUGE]);
      else if (d < 6.4) g.set(x, y, "█", KEYS[CHROME + 6]);
    }
    for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.8 + k * 0.175); g.set(gx + Math.cos(a) * 4.3, gy + Math.sin(a) * 2.2, "█", KEYS[k > 6 ? GAUGE + 2 : k > 3 ? GAUGE + 3 : GAUGE + 1]); }
    const pr = pour ? clamp((p - 1.2) * 1.5) * 0.85 + Math.sin(t * 9) * 0.02 : clamp(1 - (p - 7.5) * 0.7) * 0.85 * (p > 7.5 ? 1 : 0);
    const na = Math.PI * (0.8 + pr * 1.4);
    g.line(gx, gy, gx + Math.cos(na) * 3.6, gy + Math.sin(na) * 1.8, "█", KEYS[GAUGE + 2]);
    g.set(gx, gy, "●", KEYS[GAUGE + 1]);
    
    // buttons
    ["●", "●", "●"].forEach((b, i) => g.set(46 + i * 4, 9, b, KEYS[i === 1 && pour ? GAUGE + 3 : RED + 2]));
    g.text(44, 11, "1x  2x  HOT", KEYS[CHROME + 1]);
    // group head and portafilter
    const hx = 35;
    g.text(hx - 6, 15, "▀█████████████▀", KEYS[CHROME + 6]);
    g.text(hx - 4, 16, "█████████", KEYS[CHROME + 3]);
    g.text(hx - 5, 17, "▀▀▀▀▀▀▀▀▀▀▀", KEYS[CHROME + 5]);
    g.text(hx - 22, 16, "▄▄▄▄▄▄▄▄▄▄▄▄█", KEYS[COFFEE]);
    g.text(hx - 24, 16, "◄■", KEYS[COFFEE + 1]);
    g.text(hx - 2, 18, "▀▄ ▄▀", KEYS[CHROME + 4]);
    // drip tray
    for (let x = 18; x <= 52; x++) { g.set(x, 27, x % 2 ? "▄" : "█", KEYS[CHROME + 5]); g.set(x, 28, "▀", KEYS[CHROME + 2]); }
    // the cup on the tray (slides out and a fresh one slides in)
    const cupX = Math.round(hx - 6 + (p > 9.2 ? slide * 40 : 0)) - (p < 1.2 ? Math.round((1 - smooth(p / 1.2)) * 30) : 0);
    const lvl = p > 9.2 ? 1 : level;
    for (let y = 21; y <= 26; y++) for (let x = cupX; x < cupX + 12; x++) {
      const wall = x === cupX || x === cupX + 11 || y === 26;
      const fillTop = 26 - lvl * 4.6;
      let ch = "░", co = KEYS[GLASS];
      if (wall) { ch = "█"; co = KEYS[GLASS + (x === cupX ? 2 : 1)]; }
      else if (y >= fillTop) {
        const top = y < fillTop + 1;
        ch = "█"; co = KEYS[COFFEE + (top ? 5 : y < fillTop + 2 ? 4 : 1 + ((x + y) % 2))];
      }
      g.set(x, y, ch, co);
    }
    g.text(cupX + 12, 22, "▀▄", KEYS[GLASS + 1]); g.text(cupX + 12, 24, "▄▀", KEYS[GLASS + 1]);
    // twin streams
    if (pour || (p > 7.5 && p < 8.2)) {
      const thin = p > 7.5;
      for (const sx of [hx - 1, hx + 1]) for (let y = 19; y < 26 - lvl * 4.6; y++) {
        const wob = Math.sin(y * 1.3 + t * 18 + sx) > 0.6 ? 1 : 0;
        if (thin && (y + Math.floor(t * 20)) % 3) continue;
        g.set(sx, y, thin ? "·" : "│", KEYS[COFFEE + 2 + wob]);
      }
    }
    // steam wand and drifting steam
    g.line(58, 16, 60, 25, "█", KEYS[CHROME + 4]);
    g.set(60, 26, "▼", KEYS[CHROME + 3]);
    for (const [ph, sp, s] of puffs) {
      const a = (t * 0.25 * s + ph) % 1;
      const x = 63 + a * 6 + Math.sin(a * 6 + sp) * 2, y = 25 - a * 22;
      g.set(x, y, a < 0.3 ? "▓" : a < 0.6 ? "▒" : "░", KEYS[STEAM + (a < 0.4 ? 0 : a < 0.7 ? 1 : 2)]);
      g.set(x + 1, y, "░", KEYS[STEAM + 2]);
    }
    return g.frame();
  };
}
