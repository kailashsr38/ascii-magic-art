/* cocktail-shake-pour: a steel shaker rattles hard, tips over and pours a coral cocktail into a coupe, then a lime wheel lands on the rim. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BAR = add(gradient(["#0a0608", "#1a0e12", "#2a161c", "#3e2028"], 5));
const SHELF = add(["#4a2a14", "#7a4a24"]);
const BOTTLES = add(["#1e6a3a", "#c8761e", "#8a1e2a", "#e8d8b0", "#2a4a8a", "#5a2a6a"]);
const STEEL = add(gradient(["#2e3238", "#58606a", "#8e96a2", "#c8d0da", "#f4f8fc"], 7));
const DRINK = add(gradient(["#a8203a", "#e04a50", "#ff7a6a", "#ffb49a", "#ffe0d0"], 6));
const GLASS = add(["#5a6a74", "#a8bcc8", "#eaf6fc"]);
const LIME = add(["#3a7a14", "#8ad03a", "#e4f8b0"]);
const COUNTER = add(gradient(["#140c08", "#2a1a10", "#46301e", "#6a4a2e"], 4));

export const meta = {
  slug: "cocktail-shake-pour",
  name: "Cocktail Shaker Pour",
  category: "food",
  note: "A frosted steel shaker rattles hard, tips over and pours a coral cocktail into a coupe glass, then a lime wheel lands on the rim.",
  tags: ["cocktail", "bar", "drink", "nightlife", "food", "hero"],
  cols: 70, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const counterY = 34;
  const bottles = [];
  for (const [sy, n] of [[9, 11], [18, 10]]) for (let i = 0; i < n; i++) bottles.push([3 + i * 6 + (sy === 18 ? 3 : 0), sy, 4 + ((i * 7 + sy) % 4), (i + sy) % 6]);
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    // choreography
    const shake = p < 4.2;
    const tipA = smooth(clamp((p - 4.2) / 0.8)) * (1 - smooth(clamp((p - 8.2) / 0.8)));
    const pouring = p > 4.9 && p < 8.2;
    const fill = clamp((p - 5) / 3.1);
    const slide = p > 10.8 ? smooth((p - 10.8) / 1.2) : 0;
    const inn = p < 0.7 ? 1 - smooth(p / 0.7) : 0;
    const gx = Math.round(40 + slide * 40 - inn * 40);
    // back bar with bottles on shelves
    for (let y = 0; y < counterY; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.25 + Math.exp(-Math.hypot((x - 40) / 30, (y - 14) / 14)) * 0.5 + fbm(x * 0.08, y * 0.2, 2) * 0.15);
      g.set(x, y, v > 0.5 ? "▓" : "▒", KEYS[BAR + Math.min(4, Math.floor(v * 5))]);
    }
    for (const sy of [9, 18]) for (let x = 0; x < cols; x++) g.set(x, sy + 1, "▀", KEYS[SHELF + 1]);
    for (const [bx, by, h, c] of bottles) {
      for (let y = by - h; y <= by; y++) {
        const neck = y < by - h + 2;
        for (let x = bx; x < bx + 4; x++) {
          if (neck && (x === bx || x === bx + 3)) continue;
          g.set(x, y, "█", KEYS[y === by - 1 && !neck ? BOTTLES + 3 : BOTTLES + c]);
        }
      }
    }
    // counter
    for (let y = counterY; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === counterY ? "▀" : "█", KEYS[COUNTER + (y === counterY ? 3 : y === counterY + 1 ? 2 : 1)]);
    // coupe glass
    const bowlTop = 24, bowlBot = 28;
    for (let y = bowlTop; y <= bowlBot; y++) {
      const f = (y - bowlTop) / (bowlBot - bowlTop);
      const w = 10 * Math.sqrt(1 - f * f * 0.85);
      const level = bowlBot - fill * (bowlBot - bowlTop - 0.5);
      for (let x = Math.floor(gx - w); x <= Math.ceil(gx + w); x++) {
        const u = (x - gx) / w;
        if (Math.abs(u) > 1) continue;
        const rim = Math.abs(u) > 0.88 || y === bowlBot;
        if (y >= level && !rim && fill > 0) g.set(x, y, "█", KEYS[DRINK + Math.min(5, Math.floor(clamp(0.55 - u * 0.3 + (y < level + 1 ? 0.35 : 0)) * 6))]);
        else g.set(x, y, rim ? "█" : "░", KEYS[GLASS + (rim ? (u < 0 ? 2 : 1) : 0)]);
      }
    }
    for (let y = bowlBot + 1; y < counterY - 1; y++) g.set(gx, y, "█", KEYS[GLASS + 1]);
    for (let x = gx - 5; x <= gx + 5; x++) g.set(x, counterY - 1, "▄", KEYS[GLASS + 2]);
    // lime wheel drops onto the rim
    if (p > 8.6) {
      const f = clamp((p - 8.6) / 0.5);
      const ly = Math.round(lerp(-3, bowlTop - 2, f * f)), lx = gx + 8;
      for (let y = ly; y < ly + 3; y++) for (let x = lx - 2; x <= lx + 2; x++) {
        const d = Math.hypot((x - lx) / 2.6, (y - ly - 1) / 1.4);
        if (d < 1) g.set(x, y, "█", KEYS[LIME + (d > 0.7 ? 0 : d < 0.3 ? 2 : 1)]);
      }
    }
    // shaker: a rotated tapered cylinder
    const sx = shake ? 26 + Math.sin(t * 17) * 1.5 : lerp(26, 30, tipA);
    const sy = shake ? 14 + Math.sin(t * 17 + 1.2) * 2.5 : lerp(14, 13, tipA);
    const ang = shake ? Math.sin(t * 17) * 0.18 : tipA * 2.25;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let y = 0; y < counterY; y++) for (let x = Math.max(0, Math.floor(sx - 16)); x <= Math.min(cols - 1, sx + 16); x++) {
      const dx = x - sx, dy = (y - sy) * 2;
      const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      if (v < -17 || v > 13) continue;
      let w = 5 - (13 - v) * 0.04;
      if (v < -9) w = v < -15 ? 1.6 : 3.6 - (v + 9) * -0.15;
      if (Math.abs(u) > w) continue;
      let lit = clamp(Math.sqrt(1 - (u / w) ** 2) * 0.55 + 0.25 - (u / w) * 0.3);
      if (Math.abs(v + 9) < 1) lit -= 0.35;
      if (Math.abs(u / w + 0.45) < 0.15) lit = 1;
      g.set(x, y, "█", KEYS[STEEL + Math.min(6, Math.max(0, Math.floor(lit * 7)))]);
    }
    // stream from the mouth of the shaker into the glass
    if (pouring) {
      const mx = sx + (-(-17) * sa) * 1, my = sy + (-17 * ca) / 2;
      const ex = gx - 2, ey = bowlBot - fill * 3;
      for (let i = 0; i <= 30; i++) {
        const f = i / 30;
        const x = Math.round(lerp(mx, ex, Math.sqrt(f))), y = Math.round(lerp(my, ey, f));
        g.set(x, y, "█", KEYS[DRINK + ((i + Math.floor(t * 20)) % 4 === 0 ? 4 : 2)]);
      }
    }
    return g.frame();
  };
}
