/* bat-cave-dusk: a colony of bats pouring out of a cliff cave at dusk in a long swirling ribbon. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#140c2a", "#2a1440", "#4a1e52", "#7a2e58", "#b44a5a", "#e87a52", "#ffb45a"], 14));
const MOON = add(["#fff4d4", "#e8d8b0"]);
const ROCK = add(gradient(["#0a0610", "#160e1e", "#24182c", "#34243a"], 6));
const CAVE = add(["#020104", "#0a0610"]);
const TREE = add(["#06040a", "#100a16"]);
const BAT = add(["#05030a", "#1a1020", "#3a2a40"]);

export const meta = {
  slug: "bat-cave-dusk",
  name: "Bats Leaving the Cave",
  category: "animals",
  note: "At dusk a colony of bats pours from a cave in the cliff and streams into the orange sky in a long swirling ribbon.",
  tags: ["bats", "dusk", "cave", "halloween", "animals", "wallpaper"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CX = 24, CY = 20;
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(y / rows * 1.05 + (x / cols) * 0.12);
    let ch = "█", co = KEYS[SKY + Math.min(13, Math.floor(v * 14))];
    const md = Math.hypot((x - 78) / 2, y - 6);
    if (md < 3) co = KEYS[MOON + (md > 2.3 ? 1 : 0)];
    // the cliff on the left
    const cliffEdge = 40 - y * 0.25 + (fbm(y * 0.2, 1, 3, 2) - 0.5) * 8;
    const top = 9 + (fbm(x * 0.06, 3, 3, 4)) * 5;
    if (x < cliffEdge && y > top - (x < 10 ? 3 : 0)) {
      const n = fbm(x * 0.15, y * 0.3, 3, 7);
      ch = n > 0.55 ? "▓" : "█"; co = KEYS[ROCK + Math.min(5, Math.floor(n * 6 + (x / cliffEdge) * 1.5))];
      const cd = Math.hypot((x - CX) / 6.5, (y - CY) / 3.6);
      if (cd < 1 + (noise2(x * 0.4, y * 0.6, 9) - 0.5) * 0.3) { ch = "█"; co = KEYS[CAVE + (cd > 0.85 ? 1 : 0)]; }
    }
    // tree line along the bottom
    const th = 25.5 + Math.abs((x % 6) - 2.5) * 1.1 + noise2(x * 0.15, 2, 5) * 2.5;
    if (y > th && x > 20) { ch = "█"; co = KEYS[TREE + ((x + y) % 3 === 0 ? 1 : 0)]; }
    bg.push([ch, co]);
  }
  const N = 170;
  const R = rng(21);
  const bats = Array.from({ length: N }, (_, i) => ({ off: R() * 9, lane: (R() - 0.5) + (R() - 0.5) * 0.6, lane2: R() - 0.5, ph: R() * TAU, sp: 0.85 + R() * 0.3 }));
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    for (const b of bats) {
      const a = (((t * 0.11 * b.sp + b.off / 9) % 1) + 1) % 1;
      // ribbon: out of the cave, curling up and away to the upper right
      const s = a * 1.15;
      const rx = CX + 4 + s * 76 + Math.sin(s * 6 + t * 0.4) * 5 * s;
      const ry = CY - s * 13 - Math.sin(s * 3.2) * 5 + Math.cos(s * 6 + t * 0.5) * 3 * s;
      const spread = 1.2 + s * 7;
      const x = rx + b.lane * spread * 2.2 + Math.sin(t * 2 + b.ph) * 0.8;
      const y = ry + b.lane2 * spread * 1.1 + Math.cos(t * 2.3 + b.ph) * 0.5;
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
      const flap = Math.floor(t * 12 + b.ph * 3) % 2;
      const near = s < 0.12 && b.ph < 2.5;
      if (near) {
        g.text(Math.round(x) - 1, Math.round(y), flap ? "\\▼/" : "▄▼▄", KEYS[BAT + (s < 0.1 ? 2 : 0)]);
      } else g.set(x, y, flap ? "v" : "w", KEYS[BAT + (s > 0.9 ? 2 : s > 0.6 ? 1 : 0)]);
    }
    return g.frame();
  };
}
