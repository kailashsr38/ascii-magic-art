/* popcorn-pot-pop: a steel pot on a gas flame, the lid rattling as popcorn bursts out and piles up on the stovetop. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TILE = add(gradient(["#3a1e14", "#5e3020", "#80452c", "#a65e3a"], 5));
const STEEL = add(gradient(["#24282e", "#454b55", "#6e7682", "#a2aab6", "#d8dee6", "#ffffff"], 8));
const STOVE = add(["#08080a", "#16161a", "#26262c", "#3c3c44"]);
const FLAME = add(["#1a3aa8", "#3a7aff", "#9ad0ff"]);
const CORN = add(["#c89a3a", "#f2d27a", "#fff4d6", "#ffffff"]);
const HANDLE = add(["#0c0c0e", "#26262c"]);
const STEAM = add(["#7a6a62", "#b8aca4", "#ece4dc"]);

export const meta = {
  slug: "popcorn-pot-pop",
  name: "Popcorn Pot",
  category: "food",
  note: "A steel pot sits on a blue gas flame, the lid rattling as fluffy popcorn bursts out in arcs and piles up across the stovetop.",
  tags: ["popcorn", "movie night", "snack", "kitchen", "food", "loader"],
  cols: 76, rows: 36, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(4);
  const cx = 38, rimY = 17, potW = 15, groundY = 29, GR = 46;
  const corn = [];
  while (corn.length < 46) {
    const x0 = cx + (R() - 0.5) * 18, y0 = rimY - 1;
    const vy = 16 + R() * 10, vx = (R() < 0.5 ? -1 : 1) * (7 + R() * 14);
    const tl = (vy + Math.sqrt(vy * vy + 2 * GR * (groundY - y0))) / GR;
    const lx = x0 + vx * tl;
    if (Math.abs(lx - cx) < potW + 4 || lx < 1 || lx > cols - 3) continue;
    corn.push({ x0, y0, vx, vy, tl, lx: Math.round(lx), per: 4 + R() * 5, ph: R(), sh: R() < 0.5 });
  }
  const heights = new Int8Array(cols);
  return (t) => {
    // warm tiled wall
    for (let y = 0; y < groundY; y++) for (let x = 0; x < cols; x++) {
      const grout = y % 4 === 3 || (x + (Math.floor(y / 4) % 2) * 4) % 8 === 0;
      const v = clamp(0.35 + fbm(x * 0.05, y * 0.1, 2) * 0.4 - (grout ? 0.25 : 0) + Math.exp(-Math.hypot((x - cx) / 30, (y - 10) / 12)) * 0.25);
      g.set(x, y, grout ? "▒" : "█", KEYS[TILE + Math.min(4, Math.floor(v * 5))]);
    }
    // stovetop
    for (let y = groundY; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === groundY ? "▀" : "█", KEYS[STOVE + (y === groundY ? 3 : y < groundY + 3 ? 1 : 0)]);
    // gas flame ring under the pot
    for (let x = cx - 12; x <= cx + 12; x++) {
      const f = noise2(x * 0.6, t * 6, 2);
      g.set(x, groundY - 1, f > 0.55 ? "▲" : "█", KEYS[FLAME + (f > 0.6 ? 2 : f > 0.35 ? 1 : 0)]);
    }
    for (let x = cx - 14; x <= cx + 14; x++) g.set(x, groundY, "█", KEYS[STOVE + 2]);
    // steam puffs escaping the lid
    for (let k = 0; k < 10; k++) {
      const a = (t * 0.35 + k / 10) % 1;
      const x = cx - 10 + (k * 7) % 21 + Math.sin(a * 6 + k) * 2, y = rimY - 5 - a * 11;
      g.set(x, y, a < 0.4 ? "▓" : a < 0.7 ? "▒" : "░", KEYS[STEAM + (a < 0.4 ? 2 : a < 0.7 ? 1 : 0)]);
    }
    // pot body
    for (let y = rimY; y < groundY - 1; y++) for (let x = cx - potW; x <= cx + potW; x++) {
      const u = (x - cx) / potW;
      let v = clamp(Math.sqrt(1 - u * u) * 0.55 + 0.25 - u * 0.25);
      if (Math.abs(u + 0.5) < 0.07) v = 1;
      if (y === rimY) v = 0.9;
      g.set(x, y, y === rimY ? "▄" : "█", KEYS[STEEL + Math.min(7, Math.floor(v * 8))]);
    }
    for (const s of [-1, 1]) { g.text(s < 0 ? cx - potW - 6 : cx + potW + 1, rimY + 2, "██████", KEYS[HANDLE + 1]); }
    // popcorn mound bubbling up in the open pot
    for (let x = cx - potW + 1; x <= cx + potW - 1; x++) {
      const hgt = 1 + Math.floor(noise2(x * 0.4, t * 3, 5) * 3 * (1 - Math.abs(x - cx) / potW * 0.6));
      for (let k = 0; k < hgt; k++) g.set(x, rimY - k, "█", KEYS[CORN + ((x + k + Math.floor(t * 4)) % 3 === 0 ? 1 : 2)]);
    }
    // lid, lifted and rattling
    const jig = Math.sin(t * 23) * 0.5 + Math.sin(t * 37) * 0.5;
    const ly = rimY - 4 + Math.round(jig * 0.6), tilt = jig > 0 ? 1 : 0;
    for (let x = cx - potW - 1; x <= cx + potW + 1; x++) {
      const yy = ly + (x > cx ? -tilt : 0) + (Math.abs(x - cx) > potW - 2 ? 1 : 0);
      g.set(x, yy, "█", KEYS[STEEL + (x < cx - 6 ? 6 : x < cx + 4 ? 5 : 3)]);
    }
    g.text(cx - 2, ly - 1 - (tilt ? 0 : 0), "▄██▄", KEYS[HANDLE + 1]);
    // popcorn: flying arcs out of the pot, then resting in piles
    heights.fill(0);
    for (const c of corn) {
      const a = ((t / c.per + c.ph) % 1) * c.per;
      if (a < c.tl) {
        const x = c.x0 + c.vx * a, y = c.y0 - c.vy * a + 0.5 * GR * a * a;
        g.set(x, y, "█", KEYS[CORN + 3]); g.set(x + 1, y, c.sh ? "▓" : "█", KEYS[CORN + 1]);
      } else {
        const h = Math.max(heights[c.lx], heights[c.lx + 1] || 0);
        heights[c.lx] = h + 1; heights[c.lx + 1] = h + 1;
        g.set(c.lx, groundY - 1 - h, "█", KEYS[CORN + (h % 2 ? 2 : 3)]); g.set(c.lx + 1, groundY - 1 - h, "█", KEYS[CORN + (c.sh ? 1 : 2)]);
      }
    }
    return g.frame();
  };
}
