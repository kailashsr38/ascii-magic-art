/* oven-bread-rise: a loaf rises and browns behind a glowing oven window while the timer counts down and steam curls inside. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BODY = add(gradient(["#14141a", "#24242c", "#3a3a46", "#5a5a68", "#8a8a9a", "#c4c4d0"], 6));
const GLOW = add(gradient(["#2a0c04", "#5a1e08", "#8a3810", "#b85a1a", "#e08a2e", "#f8b85a"], 8));
const ELEM = add(["#6a0a04", "#d4300c", "#ff7a2a"]);
const DOUGH = add(gradient(["#e8d4b0", "#f2e2c4", "#fff4e0"], 3));
const CRUST = add(gradient(["#5a2a0c", "#8a4414", "#b8682a", "#dc9444", "#f2c070"], 6));
const TRAY = add(["#2a2a30", "#5a5a64"]);
const LED = add(["#3aff6a", "#0a2a12"]);
const STEAM = add(["#a8806a", "#d8c0a8", "#f4e8dc"]);
const WALL = add(gradient(["#d8d0c4", "#ece6dc", "#f8f4ee"], 3));

export const meta = {
  slug: "oven-bread-rise",
  name: "Oven Bread Rising",
  category: "food",
  note: "Through a glowing oven window a scored loaf rises and turns golden while the timer counts down and steam curls up inside.",
  tags: ["bread", "baking", "oven", "kitchen", "food", "loader"],
  cols: 80, rows: 36, fps: 20,
  palette: palette(P),
};

const PER = 14;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const ox = 8, oy = 3, ow = 64, oh = 31;      // oven front
  const wx = 15, wy = 11, ww = 50, wh = 15;    // window
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const bake = smooth(clamp((p - 0.6) / 11));
    const fog = Math.max(clamp((p - 12.6) / 0.9), 1 - clamp(p / 0.9));
    // kitchen wall tiles
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const grout = y % 3 === 2 || x % 8 === 0;
      g.set(x, y, grout ? "▒" : "█", KEYS[WALL + (grout ? 0 : (x + y) % 5 === 0 ? 2 : 1)]);
    }
    // oven body
    for (let y = oy; y < oy + oh; y++) for (let x = ox; x < ox + ow; x++) {
      const u = (x - ox) / ow;
      let v = clamp(0.35 + Math.cos(u * Math.PI * 1.2) * 0.1 - (y - oy) * 0.006);
      if (y === oy || x === ox || x === ox + ow - 1) v = 0.15;
      if (y === oy + 7) v = 0.75;
      g.set(x, y, "█", KEYS[BODY + Math.min(5, Math.floor(v * 6))]);
    }
    // control strip: dials and a timer
    const dial = (dx, a) => {
      for (let y = oy + 2; y <= oy + 5; y++) for (let x = dx - 3; x <= dx + 3; x++) {
        const d = Math.hypot((x - dx) / 3.2, (y - oy - 3.5) / 1.8);
        if (d < 1) g.set(x, y, "█", KEYS[BODY + (d > 0.7 ? 4 : 3)]);
      }
      g.set(Math.round(dx + Math.cos(a) * 2), Math.round(oy + 3.5 + Math.sin(a) * 1.1), "█", KEYS[ELEM + 1]);
    };
    dial(ox + 7, -2.4 + bake * 0.2); dial(ox + 16, -1.2);
    const secs = Math.max(0, Math.ceil((PER - 1.4 - p) * 10));
    const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
    for (let x = ox + 42; x <= ox + 57; x++) for (let y = oy + 2; y <= oy + 5; y++) g.set(x, y, "█", KEYS[LED + 1]);
    g.text(ox + 45, oy + 3, `${mm}:${ss}`, KEYS[LED]);
    g.text(ox + 52, oy + 3, "BAKE", KEYS[LED]);
    // door handle
    for (let x = wx + 2; x < wx + ww - 2; x++) g.set(x, oy + 9, "▄", KEYS[BODY + 5]);
    // window: glowing interior
    for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) {
      const frame = y === wy || y === wy + wh - 1 || x === wx || x === wx + ww - 1;
      if (frame) { g.set(x, y, "█", KEYS[BODY + 1]); continue; }
      const heat = Math.exp(-Math.hypot((x - wx - ww / 2) / 30, (y - wy - wh / 2) / 10));
      const v = clamp(heat * 0.7 + 0.15 + (fbm(x * 0.1, y * 0.3, 2) - 0.5) * 0.15);
      g.set(x, y, "█", KEYS[GLOW + Math.min(7, Math.floor(v * 8))]);
    }
    // heating elements, top and bottom
    for (let x = wx + 2; x < wx + ww - 2; x++) {
      const k = ELEM + (x % 4 === 0 ? 1 : 2);
      g.set(x, wy + 1, "▀", KEYS[k]);
      g.set(x, wy + wh - 2, "▄", KEYS[k]);
    }
    // tray and loaf rising
    const tray = wy + wh - 4;
    for (let x = wx + 6; x < wx + ww - 6; x++) g.set(x, tray, "▀", KEYS[TRAY + 1]);
    const lc = wx + ww / 2, lw = 15 + bake * 3, lh = 2 + bake * 5.5;
    for (let y = Math.floor(tray - lh - 1); y < tray; y++) for (let x = Math.floor(lc - lw - 1); x <= lc + lw + 1; x++) {
      const u = (x - lc) / lw, h = (tray - 0.5 - y) / lh;
      const shape = Math.pow(Math.max(0, 1 - Math.abs(u) ** 2.4), 0.5);
      if (h > shape || Math.abs(u) > 1) continue;
      const score = Math.abs(u * 3 - Math.round(u * 3)) < 0.07 * (1 + bake) && h > 0.5 && Math.abs(u) < 0.8;
      const lit = clamp(shape * 0.5 + 0.35 - u * 0.25 + h * 0.2);
      let k;
      if (score) k = bake > 0.4 ? DOUGH + 1 : DOUGH;
      else if (bake < 0.3) k = DOUGH + Math.min(2, Math.floor(lit * 3));
      else k = CRUST + Math.min(5, Math.floor(clamp(lit * 0.9 + (bake - 0.3) * 0.6 - 0.15) * 6));
      g.set(x, y, "█", KEYS[k]);
    }
    // steam wisps curling up inside the oven
    for (let k = 0; k < 9; k++) {
      const a = (t * 0.35 + k / 9) % 1;
      const x = lc - 12 + (k * 7) % 25 + Math.sin(a * 6 + k) * 2;
      const y = tray - lh - 1 - a * (tray - lh - wy - 2);
      if (y > wy + 1) g.set(x, y, a < 0.5 ? "▒" : "░", KEYS[STEAM + (a < 0.4 ? 2 : 1)]);
    }
    // window fogs over at the end of the bake and clears for the next loaf
    if (fog > 0.01) for (let y = wy + 1; y < wy + wh - 1; y++) for (let x = wx + 1; x < wx + ww - 1; x++) {
      const n = noise2(x * 0.15, y * 0.3 - t * 0.5, 5);
      if (n < fog * 1.2) g.set(x, y, n < fog * 0.7 ? "▓" : "▒", KEYS[STEAM + (n < fog * 0.6 ? 2 : 1)]);
    }
    // feet
    for (const fx of [ox + 3, ox + ow - 5]) g.text(fx, oy + oh, "██", KEYS[BODY]);
    return g.frame();
  };
}
