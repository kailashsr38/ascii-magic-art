/* doughnut-glazing-line: plain doughnuts ride a bakery conveyor under a curtain of pink glaze and come out shiny and sprinkled. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#2a1e2a", "#3a2a3a", "#4e384c", "#664a60"], 5));
const STEEL = add(gradient(["#2a2e34", "#4e545e", "#7a828e", "#b0b8c4", "#e4eaf0"], 6));
const DOUGH = add(gradient(["#7a4214", "#b0681e", "#d8963e", "#f0c070"], 5));
const GLAZE = add(gradient(["#b0306a", "#e0508e", "#ff86b4", "#ffc4dc", "#fff2f8"], 6));
const SPR = add(["#3ad0ff", "#ffe04a", "#7aff6a", "#ffffff", "#ff6a3a"]);
const BELT = add(["#1a1a1e", "#2a2a30", "#3e3e46"]);
const LAMP = add(["#ffd88a", "#fff4d8"]);

export const meta = {
  slug: "doughnut-glazing-line",
  name: "Doughnut Glazing Line",
  category: "food",
  note: "Plain ring doughnuts ride a bakery conveyor under a falling curtain of pink glaze and roll out shiny, dripping and covered in sprinkles.",
  tags: ["doughnuts", "bakery", "factory", "conveyor", "dessert", "banner"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(P),
};

const SPACING = 16;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(8);
  const beltY = 21, curtainX = 46, cw = 8;
  const sprinkles = Array.from({ length: 16 }, () => [R() * 2 - 1, R() * 2 - 1, Math.floor(R() * 5)]);
  const N = Math.ceil((cols + 30) / SPACING);
  const L = N * SPACING;
  return (t) => {
    const shift = t * 6;
    // bakery wall with hanging lamps
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let v = clamp(0.25 + fbm(x * 0.05, y * 0.12, 2) * 0.3);
      for (const lx of [16, 50, 84]) v += Math.exp(-Math.hypot((x - lx) / 14, (y - 4) / 6)) * 0.4;
      g.set(x, y, v > 0.55 ? "▓" : "▒", KEYS[WALL + Math.min(4, Math.floor(clamp(v) * 5))]);
    }
    for (const lx of [16, 84]) { g.set(lx, 0, "│", KEYS[STEEL + 2]); g.text(lx - 2, 1, "▄███▄", KEYS[STEEL + 1]); g.text(lx - 1, 2, "▀▀▀", KEYS[LAMP + 1]); }
    // belt
    for (let y = beltY; y <= beltY + 2; y++) for (let x = 0; x < cols; x++) {
      const seg = ((x - Math.floor(shift)) % 4 + 4) % 4 === 0;
      g.set(x, y, y === beltY ? "▀" : "█", KEYS[y === beltY ? STEEL + 3 : BELT + (seg ? 0 : 1)]);
    }
    for (let y = beltY + 3; y < rows; y++) for (let x = 0; x < cols; x++) {
      const leg = x % 24 === 4 || x % 24 === 5;
      g.set(x, y, "█", KEYS[y === beltY + 3 ? STEEL + 4 : leg ? STEEL + 2 : STEEL + (y === rows - 1 ? 0 : 1)]);
    }
    // glazer: a steel hood with a nozzle bar
    for (let y = 3; y <= 9; y++) for (let x = curtainX - cw - 4; x <= curtainX + cw + 4; x++) {
      const u = (x - curtainX) / (cw + 4);
      g.set(x, y, "█", KEYS[STEEL + Math.min(5, Math.floor(clamp(0.6 - u * 0.3 - (y === 9 ? 0.3 : 0) + (y === 3 ? 0.3 : 0)) * 6))]);
    }
    for (let y = 3; y < beltY; y++) { g.set(curtainX - cw - 5, y, "█", KEYS[STEEL + 2]); g.set(curtainX + cw + 5, y, "█", KEYS[STEEL + 0]); }
    // doughnuts riding the belt
    for (let i = 0; i < N; i++) {
      const dx = ((i * SPACING + shift) % L) - 22;
      const px = Math.round(dx);
      if (px < -10 || px > cols + 9) continue;
      // glaze coverage: 0 before the curtain, 1 after
      const cover = clamp((dx - (curtainX - cw)) / (cw * 2));
      const dy = beltY - 3;
      for (let y = dy - 2; y <= dy + 2; y++) for (let x = px - 8; x <= px + 8; x++) {
        const ex = (x - px) / 7.5, ey = (y - dy) / 2.6;
        const d = Math.hypot(ex, ey), hole = Math.hypot(ex / 0.32, ey / 0.38);
        if (d > 1 || hole < 1) continue;
        const glazed = x < px + 8 - (1 - cover) * 16 + 0 && cover > 0 && y < dy + 2;
        const lit = clamp(0.55 - ex * 0.25 - ey * 0.35);
        if (glazed) g.set(x, y, "█", KEYS[GLAZE + Math.min(5, Math.floor(lit * 6))]);
        else g.set(x, y, "█", KEYS[DOUGH + Math.min(4, Math.floor(clamp(lit + (y === dy + 2 ? -0.3 : 0)) * 5))]);
      }
      if (cover >= 1) {
        for (const [a, b, k] of sprinkles) {
          const x = Math.round(px + a * 6.5), y = Math.round(dy + b * 1.8);
          if (Math.hypot(a / 0.36, b / 0.42) > 1 && Math.hypot(a, b) < 0.9) g.set(x, y, "█", KEYS[SPR + k]);
        }
        // a drip or two running off the edge
        const dl = Math.min(2, Math.floor(((dx - curtainX - cw) / 6) % 3));
        for (let k = 0; k < dl; k++) { g.set(px - 4, dy + 2 + k, "█", KEYS[GLAZE + 2]); g.set(px + 5, dy + 2 + (k ? 0 : 0), "█", KEYS[GLAZE + 1]); }
      }
    }
    // falling curtain of glaze
    for (let y = 10; y < beltY; y++) for (let x = curtainX - cw; x <= curtainX + cw; x++) {
      const streak = Math.sin(x * 1.7 + 3) * 0.5 + Math.sin((y - t * 14) * 0.9 + x * 2.1) * 0.5;
      g.set(x, y, "█", KEYS[GLAZE + (streak > 0.6 ? 4 : streak > 0 ? 3 : 2)]);
    }
    // glaze splashing where the curtain hits the belt
    for (let x = curtainX - cw; x <= curtainX + cw; x++) g.set(x, beltY - 1 + (Math.sin(x * 2 + t * 9) > 0.5 ? 0 : 0), Math.sin(x * 2 + t * 9) > 0.5 ? "▄" : "█", KEYS[GLAZE + 1]);
    return g.frame();
  };
}
