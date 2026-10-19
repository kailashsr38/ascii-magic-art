/* sizzling-skewer-grill: kebab skewers turning over glowing charcoal, flames licking up, fat spitting and smoke rolling off. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const NIGHT = add(gradient(["#0a0606", "#1a0e0a", "#2e1810", "#48240e"], 5));
const FIRE = add(gradient(["#3a0804", "#8a1a06", "#d8400c", "#ff8a1e", "#ffd04a", "#fff6c0"], 10));
const IRON = add(gradient(["#121216", "#2a2a32", "#464652", "#6e6e7c", "#a8a8b6"], 5));
const MEAT = add(gradient(["#2a0e06", "#5a220e", "#8e3e1a", "#c06a34", "#e09a5a"], 6));
const RED = add(["#6a0a08", "#b81e14", "#f04a2c"]);
const GREEN = add(["#1a4a10", "#3a8a1e", "#78c83a"]);
const ONION = add(["#a89870", "#e4d8b8", "#fff8e8"]);
const STEEL = add(["#7a808a", "#c4cad2", "#ffffff"]);
const SMOKE = add(gradient(["#3a3532", "#66605c", "#9a9490", "#d0cac4"], 5));

export const meta = {
  slug: "sizzling-skewer-grill",
  name: "Sizzling Skewer Grill",
  category: "food",
  note: "Three kebab skewers of meat, peppers and onion turn over glowing charcoal while flames lick up, fat spits and smoke rolls away.",
  tags: ["grill", "barbecue", "kebab", "fire", "summer", "food"],
  cols: 90, rows: 34, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(11);
  const kinds = ["meat", "red", "meat", "onion", "meat", "green", "meat", "red", "meat"];
  const skewers = [0, 1, 2].map((i) => ({ y: 9 + i * 5, x0: 12 + i * 2, ph: i * 1.3, sp: 0.9 + i * 0.25, order: kinds.slice(i % 3).concat(kinds.slice(0, i % 3)) }));
  const spits = Array.from({ length: 34 }, () => ({ x: 14 + R() * 62, ph: R(), per: 0.8 + R() * 1.4, vx: (R() - 0.5) * 10, vy: 8 + R() * 9 }));
  const top = 23;
  return (t) => {
    // night backyard with drifting smoke
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const glow = Math.exp(-Math.hypot((x - 45) / 40, (y - 22) / 10));
      const v = clamp(0.08 + glow * 0.75 + fbm(x * 0.06, y * 0.15, 2) * 0.15);
      g.set(x, y, v > 0.45 ? "▒" : "░", KEYS[NIGHT + Math.min(4, Math.floor(v * 5))]);
      if (y < 12) {
        let s = 0;
        for (let k = 0; k < 3; k++) {
          const hgt = (12 - y) / 12;
          const xc = 22 + k * 23 + Math.sin(y * 0.3 + t * 1.2 + k * 2) * (1 + hgt * 4) + hgt * 10;
          s += Math.exp(-(((x - xc) / (2 + hgt * 6)) ** 2)) * fbm(x * 0.12, y * 0.25 + t * 0.9, 2, k) * (1.2 - hgt * 0.6);
        }
        if (s > 0.18) g.set(x, y, s > 0.5 ? "▓" : s > 0.32 ? "▒" : "░", KEYS[SMOKE + Math.min(4, Math.floor(s * 5))]);
      }
    }
    // flames licking up from the coals, behind the skewers
    for (let x = 8; x <= 82; x++) {
      const hgt = Math.max(0, fbm(x * 0.16, t * 2.4, 3) - 0.3) * 44 * (0.6 + 0.4 * Math.sin(x * 0.3 + t * 3));
      for (let k = 0; k < hgt; k++) {
        const y = top - 1 - k;
        if (y < 4) break;
        const heat = 1 - k / Math.max(1, hgt);
        g.set(x, y, heat > 0.5 ? "█" : heat > 0.25 ? "▓" : "▒", KEYS[FIRE + 2 + Math.min(7, Math.floor(heat * 7))]);
      }
    }
    // grill box with glowing coals in the top
    for (let y = top; y < rows - 2; y++) for (let x = 6; x <= 84; x++) {
      if (y <= top + 3) {
        const n = fbm(x * 0.25, y * 0.7 + t * 0.4, 3) + 0.15 * noise2(x * 0.5, t * 3, 7);
        const v = clamp((n - 0.25) * 1.6);
        g.set(x, y, "█", KEYS[FIRE + Math.min(9, Math.floor(v * 10))]);
      } else {
        let v = clamp(0.45 - (y - top) * 0.03 + (Math.abs(x - 14) < 2 ? 0.4 : 0) - (x > 70 ? 0.15 : 0));
        if (y === top + 4) v = 0.8;
        if (y > top + 5 && y < top + 8 && x > 30 && x < 60 && x % 3 === 0) v = 0;
        g.set(x, y, "█", KEYS[IRON + Math.min(4, Math.floor(v * 5))]);
      }
    }
    for (const lx of [10, 80]) for (let y = rows - 2; y < rows; y++) g.set(lx, y, "█", KEYS[IRON + 2]);
    // grate bars
    for (let x = 6; x <= 84; x++) if (x % 3 === 0) for (let y = top - 1; y <= top; y++) g.set(x, y, "▓", KEYS[IRON + 1]);
    g.hline(5, 85, top, "▀", KEYS[IRON + 3]);
    // skewers, each chunk turning so its char stripes and lit face roll round
    skewers.forEach((s, si) => {
      const rot = t * s.sp + s.ph;
      g.hline(s.x0 - 6, s.x0 + 72, s.y, "─", KEYS[STEEL + 1]);
      const hc = "│/─\\"[Math.floor(rot * 4 / TAU * 2) & 3];
      g.set(s.x0 + 73, s.y - 1, hc, KEYS[STEEL + 2]); g.set(s.x0 + 73, s.y, "●", KEYS[STEEL]); g.set(s.x0 + 73, s.y + 1, hc, KEYS[STEEL + 2]);
      s.order.forEach((kind, ci) => {
        const cx0 = s.x0 + ci * 7 + (kind === "meat" ? 0 : 1), w = kind === "meat" ? 7 : 5;
        for (let dy = -1; dy <= 1; dy++) for (let dx = 0; dx < w; dx++) {
          const x = cx0 + dx, y = s.y + dy;
          const face = (dy + 1) / 2;
          const turn = Math.sin(rot * 2 + face * 2.4 + ci);
          const lit = clamp(0.5 + turn * 0.3 - dy * 0.15 + (dx === 0 || dx === w - 1 ? -0.2 : 0));
          const charred = Math.sin((dx + ci) * 1.7 + rot * 3 + dy * 2) > 0.75;
          let k;
          if (kind === "meat") k = MEAT + (charred ? 0 : Math.min(5, 1 + Math.floor(lit * 5)));
          else if (kind === "red") k = RED + (charred ? 0 : lit > 0.55 ? 2 : 1);
          else if (kind === "green") k = GREEN + (charred ? 0 : lit > 0.55 ? 2 : 1);
          else k = ONION + (charred ? 0 : lit > 0.5 ? 2 : 1);
          g.set(x, y, "█", KEYS[k]);
        }
      });
    });
    // spitting fat: sparks flying up in arcs and falling back
    for (const sp of spits) {
      const a = ((t / sp.per + sp.ph) % 1) * sp.per;
      const x = sp.x + sp.vx * a, y = top - 3 - sp.vy * a + 14 * a * a;
      if (y < top - 1 && y > 0) g.set(x, y, a < sp.per * 0.3 ? "•" : a < sp.per * 0.6 ? "·" : "'", KEYS[FIRE + (a < sp.per * 0.4 ? 9 : 7)]);
    }
    return g.frame();
  };
}
