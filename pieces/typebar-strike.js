/* typebar-strike: a close-up of a typewriter, typebars swinging up from the basket to strike the paper letter by letter. */
import { Grid, palette, gradient, KEYS, noise2, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const DARK = add(gradient(["#08090c", "#121418", "#1c1f26", "#282c36"], 5));
const PAPER = add(["#f4f0e4", "#e4dcc8", "#c8bea4"]);
const INK = add(["#1a1a24", "#3a3a4a"]);
const PLATEN = add(["#0c0c0e", "#26262c", "#4a4a54", "#8a8a96"]);
const STEEL = add(gradient(["#3a3e48", "#646a78", "#9aa2b0", "#d4dae4", "#ffffff"], 6));
const RIB = add(["#c42a2a", "#1a1a1a", "#7a1a1a"]);
const KEY = add(["#1e2a24", "#2e3e34", "#e8e0c8", "#8a7a5a", "#4a5a4e"]);
const BODY = add(gradient(["#123024", "#1e4836", "#2a5e48"], 4));

export const meta = {
  slug: "typebar-strike",
  name: "Typebar Close-Up",
  category: "things",
  note: "A close-up inside a typewriter: one typebar after another swings up from the fanned basket to strike the ribbon, and letters appear on the paper as the carriage steps along.",
  tags: ["typewriter", "writing", "vintage", "mechanical", "type", "hero"],
  cols: 86, rows: 32, fps: 30,
  palette: palette(P),
};

const TEXT = "the quick brown fox jumps over the lazy dog. ";
const STEP = 0.2;
const NB = 25;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SX = 43, SY = 9;           // strike point
  const PX = 43, PY = 30;          // centre of the basket arc
  const bars = [];
  for (let i = 0; i < NB; i++) {
    const a = Math.PI * (1.1 + (i / (NB - 1)) * 0.8);
    const pivot = [PX + Math.cos(a) * 38, PY + 2 + Math.sin(a) * 10];
    const rest = [pivot[0] + (SX - pivot[0]) * 0.22, pivot[1] + (SY + 1 - pivot[1]) * 0.22];
    bars.push({ pivot, rest });
  }
  const letterBar = (c) => (c.charCodeAt(0) * 7) % NB;
  return (t) => {
    g.clear();
    const n = Math.floor(t / STEP), f = (t % STEP) / STEP;
    const idx = n % (TEXT.length * 3);
    const line = Math.floor(idx / TEXT.length) % 3;
    const col = idx % TEXT.length;
    const ch = TEXT[col];
    // background body
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.2 + noise2(x * 0.08, y * 0.2, 2) * 0.3 + (y > 18 ? 0.3 : 0));
      g.set(x, y, y > 18 ? "█" : "▓", y > 18 ? KEYS[BODY + Math.min(2, Math.floor(v * 3))] : KEYS[DARK + Math.min(4, Math.floor(v * 5))]);
    }
    // paper with typed text, carriage moves so the strike point stays fixed
    const carriage = col + (f > 0.6 ? smooth((f - 0.6) / 0.4) : 0);
    const px0 = SX - carriage;
    for (let y = 0; y <= SY; y++) for (let x = 0; x < cols; x++) {
      const pxl = x - px0;
      if (pxl < -4 || pxl > TEXT.length + 4) continue;
      g.set(x, y, "█", KEYS[PAPER + (pxl < -3 || pxl > TEXT.length + 3 ? 1 : 0)]);
    }
    const lines = [];
    for (let l = 0; l <= line; l++) lines.push(l < line ? TEXT : TEXT.slice(0, col + (f > 0.45 ? 1 : 0)));
    lines.forEach((s, k) => {
      const y = SY - (line - k) * 2;
      for (let i = 0; i < s.length; i++) if (s[i] !== " ") g.set(px0 + i, y, s[i], KEYS[INK + ((i * 7 + k) % 5 === 0 ? 1 : 0)]);
    });
    // platen roller below the paper line
    for (let y = SY + 1; y <= SY + 3; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", KEYS[PLATEN + (y === SY + 1 ? 2 : y === SY + 2 ? 1 : 0)]);
    for (let x = 0; x < cols; x += 6) g.set(x + (n % 6), SY + 2, "─", KEYS[PLATEN + 3]);
    // ribbon guide lifts at the strike
    const lift = f < 0.5 ? smooth(f / 0.5) : smooth((1 - f) / 0.5);
    const ry = Math.round(SY + 2 - lift * 1.6);
    g.text(SX - 4, ry, "▄▄▄▄▄▄▄▄▄", KEYS[RIB]);
    g.text(SX - 4, ry + 1, "▀▀▀▀▀▀▀▀▀", KEYS[RIB + 1]);
    g.text(SX - 5, ry, "▐", KEYS[STEEL + 3]); g.text(SX + 5, ry, "▌", KEYS[STEEL + 3]);
    // segment ring
    for (let x = SX - 10; x <= SX + 10; x++) g.set(x, SY + 5, "▀", KEYS[STEEL + 2]);
    // typebars
    const active = ch === " " ? -1 : letterBar(ch);
    const swing = f < 0.45 ? smooth(f / 0.45) : smooth(1 - (f - 0.45) / 0.55);
    for (let i = 0; i < NB; i++) {
      const b = bars[i];
      let [tx, ty] = b.rest;
      if (i === active) {
        const u = 0.22 + swing * 0.78;
        const bow = Math.sin(swing * Math.PI) * 3;
        tx = b.pivot[0] + (SX - b.pivot[0]) * u; ty = b.pivot[1] + (SY + 1 - b.pivot[1]) * u - bow;
      }
      const hot = i === active;
      g.line(b.pivot[0], b.pivot[1], tx, ty, (x, y) => (hot ? "█" : "▓"), KEYS[STEEL + (hot ? 4 : 1 + (i % 2))]);
      g.text(Math.round(tx) - 1, Math.round(ty), "▄█▄", KEYS[STEEL + (hot ? 5 : 3)]);
      g.set(b.pivot[0], b.pivot[1], "●", KEYS[STEEL + 2]);
    }
    if (active >= 0 && f > 0.4 && f < 0.55) {
      g.text(SX - 2, SY - 1, "\\ | /", KEYS[PAPER]);
    }
    // a row of keys at the bottom, the pressed key dips
    const keysRow = "qwertyuiopasdfghjklzxcvbnm";
    for (let i = 0; i < 13; i++) {
      const slot = ch === " " ? -1 : letterBar(ch) % 13;
      const k = i === slot ? ch : keysRow[(i * 2 + 1) % 26];
      const down = i === slot && f < 0.6;
      const x = 4 + i * 6.3, y = 29 + (down ? 1 : 0);
      g.text(x, y - 1, "▄▄▄▄", KEYS[KEY + 4]);
      g.text(x, y, "█" + k.toUpperCase() + "██", KEYS[KEY + 2]);
      g.set(x + 1, y, k.toUpperCase(), KEYS[KEY + 3]);
    }
    return g.frame();
  };
}
