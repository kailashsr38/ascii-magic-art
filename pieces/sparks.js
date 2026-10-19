/* sparks: an angle grinder cutting a steel bar on a workbench, a fan of sparks arcing and bouncing off the floor. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const WALL = grp(gradient(["#1a100a", "#3a2416", "#6a4026", "#a06636", "#d89a52", "#f4c47a"], 12));
const SPARK = grp(["#8a1e06", "#c8400c", "#f07a1a", "#ffae2e", "#ffdc6a", "#fff6d0"]);
const STEEL = grp(gradient(["#22282e", "#4a535e", "#7d8894", "#b8c2cc", "#eef2f6"], 8));
const BODY = grp(["#0e3a40", "#17666e", "#26969c", "#5ccad0"]);
const GRIP = grp(["#121214", "#2c2c32", "#4a4a52"]);
const WOOD = grp(gradient(["#2a160a", "#5a3418", "#8c5a2c", "#c08a4c"], 6));
const FLOOR = grp(gradient(["#161210", "#2e2620", "#544334", "#8a6a4c"], 6));
const LAMP = grp(["#ffe6a0", "#fffbe8"]);
const DISC = grp(["#3a3632", "#6a625a", "#9a9086"]);

export const meta = {
  slug: "sparks",
  name: "Grinder Sparks",
  category: "demoscene",
  note: "An angle grinder bites into a steel bar on a workbench, throwing a bright fan of sparks that arc down and bounce across the floor.",
  tags: ["sparks", "workshop", "grinder", "particles", "fire", "hero"],
  cols: 96, rows: 36, fps: 30,
  palette: palette(P),
};

const H = (n, k) => {
  let h = (n * 374761393 + k * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const DX = 44, DY = 17, DR = 12;        // disc centre and radius (in columns)
const BAR = 23;                         // top surface of the steel bar
const FL = 32;                          // floor line
const BENCH = 26;                       // bench top
const CX = DX + 1, CY = BAR;            // where the disc meets the steel

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const RATE = 420, GRAV = 62, LIFE = 2.2;

  // spark position after age a, with up to two bounces on the floor
  const pos = (vx, vy, a, out) => {
    let x = CX, y = CY, t = a;
    for (let b = 0; b < 3; b++) {
      const disc = vy * vy + 2 * GRAV * (FL - y);
      const th = (-vy + Math.sqrt(Math.max(0, disc))) / GRAV;
      if (t < th || b === 2) {
        out[0] = x + vx * t; out[1] = Math.min(FL, y + vy * t + 0.5 * GRAV * t * t);
        out[2] = vx; out[3] = vy + GRAV * t; return b;
      }
      x += vx * th; y = FL; t -= th;
      vy = -(vy + GRAV * th) * 0.38; vx *= 0.6;
    }
    return 2;
  };
  const o = [0, 0, 0, 0];

  return (t) => {
    g.clear();
    const flick = 0.8 + 0.2 * Math.sin(t * 37) * Math.sin(t * 23 + 1);

    // workshop wall: planks, a pegboard, warm lamp light and the orange glow of the cut
    for (let y = 0; y < FL; y++) for (let x = 0; x < cols; x++) {
      const cone = y > 4 ? Math.exp(-Math.max(0, Math.abs(x - 78) * 0.5 - (y - 4) * 0.45) / 3) * Math.exp(-(y - 4) / 30) : 0;
      const lampD = Math.hypot((x - 78) * 0.5, y - 3);
      const cutD = Math.hypot((x - CX) * 0.5, y - CY);
      let v = 0.2 + cone * 0.28 + Math.exp(-lampD / 4) * 0.3 + Math.exp(-cutD / 8) * 0.45 * flick + (y / FL) * 0.08;
      const plank = x % 12 === 0;
      const peg = x > 56 && x < 92 && y > 9 && y < 22 && x % 3 === 0 && y % 2 === 0;
      v += (fbm(x * 0.4, y * 0.1, 2, 5) - 0.5) * 0.12;
      if (plank) g.set(x, y, "▌", WALL(v - 0.12));
      else if (peg) g.set(x, y, "·", WALL(v - 0.2));
      else g.set(x, y, v > 0.7 ? "█" : v > 0.38 ? "▓" : "▒", WALL(v));
    }
    // tools hanging on the pegboard: a wrench, a hammer, a saw
    const tl = WALL(0.08);
    for (let y = 11; y < 20; y++) g.set(62, y, "█", tl);
    g.text(61, 10, "▄█▄", tl); g.text(61, 20, "▀▄▀", tl);
    for (let y = 11; y < 21; y++) g.set(70, y, "▐", tl);
    g.text(67, 10, "▄████▄", tl);
    g.fill(77, 11, 9, 4, "█", tl); g.text(77, 15, "▀▀▀▀▀▀▀▀▀", tl); g.text(85, 11, "██", tl); g.text(86, 12, "█▌", tl);
    // shelf with jars above the bench
    g.hline(2, 30, 6, "▀", WOOD(0.9));
    for (let i = 0; i < 6; i++) g.text(4 + i * 4, 4, "▄▄", i % 2 ? STEEL(0.5) : WOOD(0.55)), g.text(4 + i * 4, 5, "██", i % 2 ? STEEL(0.4) : WOOD(0.5));
    // hanging lamp and its cone of light
    g.vline(78, 0, 1, "│", GRIP(1));
    g.text(74, 2, "▄█████▄", GRIP(1)); g.text(73, 3, "▀▀▀▀▀▀▀▀▀", GRIP(2)); g.text(75, 4, "▀███▀", LAMP(1));

    // floor, lit by the sparks landing on it
    for (let y = FL; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.abs(x - 66) / 26;
      const v = clamp(0.25 + (y - FL) * 0.06 + Math.exp(-d * d) * 0.5 * flick + (fbm(x * 0.2, y * 0.8, 2, 8) - 0.5) * 0.2);
      g.set(x, y, y === FL ? "▀" : v > 0.55 ? "▓" : "▒", FLOOR(y === FL ? v + 0.2 : v));
    }

    // workbench
    for (let x = 0; x < 40; x++) {
      g.set(x, BENCH, "▀", WOOD(0.95));
      g.set(x, BENCH + 1, "█", WOOD(0.65));
      g.set(x, BENCH + 2, "▀", WOOD(0.35));
    }
    for (const lx of [3, 34]) for (let y = BENCH + 3; y < FL; y++) g.text(lx, y, "██", WOOD(0.3));
    // vice holding the bar
    g.fill(28, BAR + 1, 6, 2, "█", GRIP(1)); g.text(27, BAR - 1, "▄▄▄▄▄▄▄▄", GRIP(2)); g.text(26, BENCH - 1, "▄██████▄", GRIP(1));
    g.text(30, BENCH + 1, "═╪═", STEEL(0.6));

    // the steel bar, from the vice out past the disc, with a glowing kerf
    for (let x = 6; x < 60; x++) for (let y = BAR; y <= BAR + 2; y++) {
      const v = y === BAR ? 0.92 : y === BAR + 1 ? 0.62 : 0.35;
      const heat = Math.exp(-Math.abs(x - CX) / 2.2);
      if (heat > 0.55) g.set(x, y, "█", SPARK(clamp(0.45 + heat * 0.6 - (y - BAR) * 0.15)));
      else if (heat > 0.25) g.set(x, y, "▓", SPARK(0.2 + heat * 0.4));
      else g.set(x, y, y === BAR ? "▀" : "█", STEEL(v));
    }
    g.set(60, BAR, "▌", STEEL(0.8)); g.set(60, BAR + 1, "▌", STEEL(0.5)); g.set(60, BAR + 2, "▌", STEEL(0.3));
    for (let x = 6; x < 26; x++) g.set(x, BENCH - 1, "▄", STEEL(0.25));

    // gear head, motor body with vents, rear grip, side handle and cord
    g.fill(DX - 6, DY - 7, 11, 5, "█", STEEL(0.5));
    g.text(DX - 6, DY - 7, "▄▄▄▄▄▄▄▄▄▄▄", STEEL(0.85));
    for (let y = DY - 6; y <= DY - 3; y++) g.set(DX + 4, y, "▐", STEEL(0.3));
    for (let y = DY - 9; y <= DY - 1; y++) for (let x = DX - 34; x < DX - 6; x++) {
      const top = y === DY - 9, bot = y === DY - 1;
      const vent = x > DX - 15 && x < DX - 8 && (x % 2 === 0) && y > DY - 8 && y < DY - 2;
      const stripe = y === DY - 5;
      const shade = top ? 3 : bot ? 0 : y < DY - 6 ? 2 : 1;
      if (vent) g.set(x, y, "║", GRIP(0));
      else if (stripe) g.set(x, y, "█", SPARK(0.55));
      else g.set(x, y, top ? "▄" : bot ? "▀" : "█", BODY(shade / 3));
    }
    for (let y = DY - 8; y <= DY - 2; y++) for (let x = DX - 46; x < DX - 34; x++) {
      const r = (x - (DX - 46)) / 12;
      if (y === DY - 8 || y === DY - 2) { if (r > 0.25) g.set(x, y, y === DY - 8 ? "▄" : "▀", GRIP(1)); }
      else g.set(x, y, (x + y) % 3 === 0 ? "▓" : "█", GRIP(y < DY - 5 ? 2 : 1));
    }
    for (let y = DY - 15; y <= DY - 8; y++) g.text(DX - 2, y, "██", GRIP(y < DY - 13 ? 2 : 1));
    g.text(DX - 3, DY - 16, "▄██▄", GRIP(2));
    for (let x = 0; x < DX - 46; x++) g.set(x, DY - 5 + Math.round(Math.sin(x * 0.35) * 0.6 + (DX - 46 - x) * 0.12), "─", GRIP(0));

    // the spinning disc with streaks that rotate, under a half guard
    const spin = t * 9;
    for (let y = DY - Math.ceil(DR / 2); y <= DY + Math.ceil(DR / 2); y++) for (let x = DX - DR; x <= DX + DR; x++) {
      const ex = (x - DX) / DR, ey = (y - DY) / (DR / 2);
      const d = Math.hypot(ex, ey);
      if (d > 1.02) continue;
      const ang = Math.atan2(ey, ex);
      const guard = ang < -0.9 && ang > -Math.PI + 0.2 && d > 0.62;   // a guard over the rear rim
      if (guard) { g.set(x, y, d > 0.9 ? "▀" : "█", d > 0.9 ? STEEL(1) : STEEL(0.62)); continue; }
      if (d < 0.2) { g.set(x, y, "█", STEEL(1)); continue; }
      if (d < 0.32) { g.set(x, y, "█", STEEL(0.6)); continue; }
      const streak = Math.sin(ang * 4 - spin) > 0.55;
      if (d > 0.86) g.set(x, y, "█", y >= DY + 3 ? SPARK(0.6 + 0.3 * flick) : STEEL(0.85));
      else g.set(x, y, streak ? "▓" : "█", streak ? DISC(2) : DISC(0));
    }
    // sparks: tangential spray from the contact point, falling with gravity and bouncing
    const i1 = Math.floor(t * RATE), i0 = Math.floor((t - LIFE) * RATE);
    for (let i = i0; i <= i1; i++) {
      const a = t - i / RATE;
      if (a < 0) continue;
      const r1 = H(i, 1), r2 = H(i, 2), r3 = H(i, 3);
      const life = LIFE * (0.35 + 0.65 * r3);
      if (a > life) continue;
      const ang = -0.95 + r1 * 1.25;                      // a fan from up and right to down and right
      const sp = 30 + r2 * 50;
      const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp * 0.75;
      const heat = (1 - (a / life) ** 2) * (0.55 + 0.5 * H(i, 4));
      const bounced = pos(vx, vy, a, o);
      const x = o[0], y = o[1];
      if (x >= cols + 2) continue;
      // streak behind the head along the motion direction
      const len = Math.min(5, 1 + Math.hypot(o[2], o[3] * 2) * 0.05);
      const nx = o[2], ny = o[3];
      const m = Math.hypot(nx, ny) || 1;
      const ch = Math.abs(ny / m) < 0.35 ? "─" : (ny > 0) === (nx > 0) ? "\\" : "/";
      for (let k = Math.ceil(len); k >= 0; k--) {
        const sx = x - (nx / m) * k * 1.2, sy = y - (ny / m) * k * 0.6;
        const c = clamp(heat * 1.1 - k * 0.14 - bounced * 0.1);
        if (c < 0.12) break;
        g.set(sx, sy, k === 0 ? (c > 0.5 ? "●" : "•") : ch, SPARK(0.2 + c * (k === 0 ? 0.68 : 0.55)));
      }
    }
    // white-hot core at the cut
    g.set(CX, CY - 1, "█", SPARK(1)); g.set(CX + 1, CY - 1, "█", SPARK(1)); g.set(CX + 2, CY - 1, "▓", SPARK(0.85));
    g.set(CX - 1, CY - 1, "▓", SPARK(0.8));
    return g.frame();
  };
}
