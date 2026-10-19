/* burger-assembly: a burger builds itself layer by layer, patty, cheese, lettuce, tomato and a sesame bun dropping onto the stack. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#3a0e0a", "#5e1a10", "#862a14", "#b0421c"], 6));
const BOARD = add(gradient(["#3a1e0a", "#6a3a18", "#9a5e2c", "#c4884a"], 5));
const BUN = add(gradient(["#7a3a0e", "#b4641e", "#dc9234", "#f2bc5a", "#fce0a0"], 8));
const SEED = add(["#fff6dc", "#e8d8b0"]);
const PATTY = add(gradient(["#1e0a04", "#3e1a0a", "#6a2e14", "#8e4420"], 5));
const CHEESE = add(["#e88a10", "#ffb42a", "#ffd65a"]);
const LETTUCE = add(["#2a6a1a", "#4ea42a", "#8ad84a"]);
const TOMATO = add(["#8a1210", "#d42a1e", "#ff6a4a"]);
const ONION = add(["#a86a9a", "#e8c8e0"]);
const STEAM = add(["#8a6a62", "#c8b4ac", "#f4ece8"]);

export const meta = {
  slug: "burger-assembly",
  name: "Burger Stack Build",
  category: "food",
  note: "A burger builds itself on a wooden board, patty, melting cheese, lettuce, tomato, onion and a sesame bun dropping onto the stack one by one.",
  tags: ["burger", "fast food", "diner", "food", "loader", "hero"],
  cols: 72, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 11;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(5);
  const seeds = Array.from({ length: 16 }, () => [R() * 1.6 - 0.8, R() * 0.7 + 0.1]);
  const boardY = 33, cx0 = 36, W = 20;
  // layers bottom to top: kind, thickness, start time
  const layers = [
    ["bottom", 3, 0.3], ["patty", 3, 1.1], ["cheese", 1, 1.9], ["lettuce", 1, 2.6],
    ["tomato", 2, 3.3], ["onion", 1, 4.0], ["top", 7, 4.8],
  ];
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const slide = p > 9.6 ? smooth((p - 9.6) / 1.4) : 0;
    const cx = Math.round(cx0 - slide * 62);
    // diner backdrop and board
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < boardY - 2) {
        const chk = (Math.floor(x / 4) + Math.floor(y / 2)) % 2;
        const v = clamp(0.15 + chk * 0.35 + Math.exp(-Math.hypot((x - 36) / 34, (y - 14) / 16)) * 0.4);
        g.set(x, y, y === 9 ? "▀" : "█", KEYS[y === 9 ? BOARD + 4 : BG + Math.min(5, Math.floor(v * 6))]);
      } else {
        const v = clamp(0.35 + fbm(x * 0.04, y * 1.1, 2) * 0.5 - (y - boardY) * 0.06);
        g.set(x, y, y === boardY - 2 ? "▄" : "█", KEYS[BOARD + Math.min(4, Math.floor(v * 5))]);
      }
    }
    let base = boardY - 2;
    for (const [kind, th, t0] of layers) {
      if (p < t0) break;
      const f = clamp((p - t0) / 0.4);
      const settle = f >= 1 ? Math.max(0, Math.sin((p - t0 - 0.4) * 16) * Math.exp(-(p - t0 - 0.4) * 7) * 1.2) : 0;
      const yb = Math.round(f < 1 ? base - (1 - f * f) * 26 : base - settle);
      const draw = (x, y, k, ch = "█") => g.set(x, y, ch, KEYS[k]);
      for (let j = 0; j < th; j++) {
        const y = yb - j;
        let w = W;
        if (kind === "bottom") w = W - (j === 0 ? 2 : 0);
        if (kind === "patty") w = W + 1 - (j === 0 || j === th - 1 ? 1 : 0);
        if (kind === "top") w = Math.round(W * Math.sqrt(Math.max(0, 1 - (j / th) ** 2)) + (j === 0 ? 0 : 0.5));
        for (let x = cx - w; x <= cx + w; x++) {
          const u = (x - cx) / Math.max(1, w);
          if (kind === "bottom") draw(x, y, BUN + (j === th - 1 ? 7 : clamp(0.6 - u * 0.25 - (j === 0 ? 0.3 : 0)) * 6 | 0));
          else if (kind === "patty") {
            const n = noise2(x * 0.7, y * 1.3, 4);
            draw(x, y, PATTY + Math.min(4, Math.floor(clamp(n * 0.9 + (j === th - 1 ? 0.25 : 0) - u * 0.1) * 5)));
          } else if (kind === "cheese") draw(x, y, CHEESE + (u < -0.3 ? 2 : 1));
          else if (kind === "lettuce") draw(x - 1 + Math.round(Math.sin(x * 0.9) * 1), y + (Math.sin(x * 1.3) > 0.4 ? 1 : 0), LETTUCE + (Math.sin(x * 0.7) > 0 ? 2 : 1));
          else if (kind === "tomato") draw(x, y, TOMATO + (j === th - 1 ? 2 : (x % 7 === 0 ? 0 : 1)));
          else if (kind === "onion") { if (x % 5 !== 0) draw(x, y, ONION + ((x % 5) % 2)); }
          else if (kind === "top") {
            const lit = clamp(Math.sqrt(Math.max(0, 1 - u * u)) * 0.5 + (j / th) * 0.3 - u * 0.25 + 0.25);
            draw(x, y, BUN + Math.min(7, Math.floor(lit * 8)));
          }
        }
        // cheese drapes over the patty edge as it melts
        if (kind === "cheese" && f >= 1) {
          const m = clamp((p - t0 - 0.4) / 1.6);
          for (const [dx, len] of [[-W + 1, 2], [-W + 6, 3], [W - 4, 2], [W - 1, 3], [-4, 2], [6, 2]]) {
            for (let k = 1; k <= Math.round(m * len); k++) draw(cx + dx, y + k, CHEESE + (k === Math.round(m * len) ? 0 : 1));
          }
        }
      }
      if (kind === "top") {
        for (const [u, v] of seeds) {
          const y = yb - Math.round(v * (th - 1));
          const lim = Math.sqrt(Math.max(0, 1 - (v * v))) * 0.85;
          if (Math.abs(u) < lim) draw(Math.round(cx + u * W), y, SEED + (u > 0.3 ? 1 : 0));
        }
      }
      if (f >= 1) base = (f >= 1 ? base : yb) - th;
    }
    // steam rising off the hot patty
    if (p > 1.5 && p < 9.6) for (let k = 0; k < 12; k++) {
      const a = (t * 0.4 + k / 12) % 1;
      const x = cx - 15 + (k * 11) % 31 + Math.sin(a * 6 + k) * 2;
      const y = base - 1 - a * 12;
      if (y > 0) g.set(x, y, a < 0.35 ? "▒" : "░", KEYS[STEAM + (a < 0.4 ? 2 : a < 0.7 ? 1 : 0)]);
    }
    return g.frame();
  };
}
