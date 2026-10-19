/* lemonade-stand-pour: a striped lemonade stand on a sunny lawn, a pitcher tipping to fill a cup with ice and lemon slices. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#4aa8f0", "#6ec0f8", "#98d6ff", "#c8ecff"], 6));
const CLOUD = add(["#e8f4ff", "#ffffff"]);
const GRASS = add(gradient(["#2a7a1e", "#46a02a", "#6ac03a", "#94dc52"], 5));
const AWN = add(["#ffd22a", "#fff8e4", "#c89a10", "#e8e0c8"]);
const WOOD = add(gradient(["#6a3a14", "#9a5e28", "#c4864a", "#e4b07a"], 5));
const LEMONADE = add(gradient(["#e8c020", "#f8dc4a", "#fff07a", "#fffab8"], 5));
const GLASS = add(["#9ac0d0", "#d8f0f8", "#ffffff"]);
const LEMON = add(["#d4a80a", "#ffe03a", "#fff6b0", "#5a9a1a"]);
const SIGN = add(["#fff8e8", "#c81e2a", "#1a1a1a"]);
const ICE = add(["#d0eef8", "#ffffff"]);

export const meta = {
  slug: "lemonade-stand-pour",
  name: "Lemonade Stand Pour",
  category: "food",
  note: "A striped lemonade stand on a sunny lawn, a glass pitcher tipping to pour fresh lemonade over ice into a cup that is handed away and replaced.",
  tags: ["lemonade", "summer", "drink", "kids", "food", "hero"],
  cols: 84, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const groundY = 30, counterY = 21, sx0 = 12, sx1 = 72;
  const basket = [[17, 18], [21, 18], [25, 18], [19, 17], [23, 17]];
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const tilt = smooth(clamp((p - 0.9) / 0.7)) * (1 - smooth(clamp((p - 5) / 0.7)));
    const pouring = tilt > 0.7;
    const fill = clamp((p - 1.5) / 3.6);
    const away = p > 6.6 ? smooth((p - 6.6) / 1.2) : 0;
    const inn = p < 0.8 ? 1 - smooth(p / 0.8) : 0;
    const cupX = Math.round(50 + away * 40 + inn * 40);
    // sky with drifting clouds, lawn
    for (let y = 0; y < groundY; y++) for (let x = 0; x < cols; x++) {
      const cl = fbm(x * 0.05 - t * 0.15, y * 0.2, 3) - y * 0.012;
      const v = clamp(y / groundY);
      if (cl > 0.55) g.set(x, y, cl > 0.62 ? "█" : "▓", KEYS[CLOUD + (cl > 0.62 ? 1 : 0)]);
      else g.set(x, y, "█", KEYS[SKY + Math.min(5, Math.floor(v * 6))]);
    }
    for (let y = groundY; y < rows; y++) for (let x = 0; x < cols; x++) {
      const blade = Math.sin(x * 1.7 + y * 3.1) > 0.6;
      g.set(x, y, blade ? "▓" : "█", KEYS[GRASS + Math.min(4, Math.floor(clamp(0.5 - (y - groundY) * 0.08 + (blade ? 0.3 : 0)) * 5))]);
    }
    // stand: posts, striped awning with scalloped edge
    for (const px of [sx0 + 1, sx1 - 2]) for (let y = 6; y < groundY; y++) { g.set(px, y, "█", KEYS[WOOD + 2]); g.set(px + 1, y, "█", KEYS[WOOD + 1]); }
    for (let y = 2; y <= 7; y++) {
      const inset = 7 - y;
      for (let x = sx0 - 2 + inset; x <= sx1 + 1 - inset; x++) {
        const stripe = Math.floor((x - sx0) / 5) % 2;
        const scal = y === 7 && Math.sin((x - sx0) * 0.63) < 0;
        if (!scal) g.set(x, y, "█", KEYS[AWN + (stripe ? 1 : 0) + (y === 7 ? 2 : 0)]);
      }
    }
    // counter and front panel with a sign
    for (let y = counterY; y < groundY; y++) for (let x = sx0; x <= sx1; x++) {
      const plank = (y - counterY) % 3 === 2;
      g.set(x, y, "█", KEYS[y === counterY ? WOOD + 4 : WOOD + (plank ? 0 : 1 + ((x * 7 + y) % 9 === 0 ? 1 : 0))]);
    }
    const msg = "FRESH LEMONADE", mx = Math.round((sx0 + sx1) / 2 - msg.length / 2) - 2;
    for (let y = counterY + 2; y <= counterY + 4; y++) for (let x = mx - 2; x < mx + msg.length + 6; x++) g.set(x, y, "█", KEYS[SIGN]);
    g.text(mx, counterY + 3, msg, KEYS[SIGN + 1]);
    g.text(mx + msg.length + 1, counterY + 3, "50c", KEYS[SIGN + 2]);
    // basket of lemons
    for (let x = 15; x <= 28; x++) { g.set(x, 19, "█", KEYS[WOOD + 3]); g.set(x, 20, "█", KEYS[WOOD + 2]); }
    for (const [lx, ly] of basket) { g.text(lx - 1, ly, "███", KEYS[LEMON + 1]); g.set(lx + 1, ly, "█", KEYS[LEMON]); g.set(lx - 1, ly, "█", KEYS[LEMON + 2]); }
    // the cup: glass, ice, lemonade rising
    const ct = 14, cb = counterY - 1;
    const level = cb - fill * (cb - ct - 1);
    for (let y = ct; y <= cb; y++) {
      const w = 4 - (y - ct) * 0.12;
      for (let x = Math.floor(cupX - w); x <= Math.ceil(cupX + w); x++) {
        const u = (x - cupX) / w;
        if (Math.abs(u) > 1) continue;
        if (Math.abs(u) > 0.8 || y === cb) { g.set(x, y, "█", KEYS[GLASS + (u < 0 ? 2 : 1)]); continue; }
        const ice = (y === cb - 3 || y === cb - 4) && Math.abs(u) < 0.6 && (x + y) % 3 !== 0;
        if (ice) { g.set(x, y, "█", KEYS[ICE + ((x + y) % 2)]); continue; }
        if (y >= level) g.set(x, y, "█", KEYS[LEMONADE + Math.min(4, Math.floor(clamp(0.5 - u * 0.3 + (y < level + 1 ? 0.35 : 0)) * 5))]);

      }
    }
    if (fill > 0.9) { g.text(cupX + 2, ct - 1, "▄▄", KEYS[LEMON + 1]); g.set(cupX + 3, ct, "█", KEYS[LEMON + 2]); }
    // pitcher, tipping toward the cup
    const px = 33, py = 12;
    const ca = Math.cos(tilt * 0.9), sa = Math.sin(tilt * 0.9);
    let mouth = [px + 7, py - 8];
    for (let y = py - 12; y <= py + 10; y++) for (let x = px - 13; x <= px + 19; x++) {
      const dx = x - px, dy = (y - py) * 2;
      const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;   // pitcher frame, v down
      if (v < -16 || v > 14) continue;
      const w = 7 + (v + 16) * 0.05;
      if (Math.abs(u) > w) {
        if (u < -w && u > -w - 3 && v > -10 && v < 6 && (u < -w - 2 || v < -8 || v > 4)) g.set(x, y, "█", KEYS[GLASS + 1]);
        continue;
      }
      const edge = Math.abs(u) > w - 1.1 || v > 12.5;
      const liq = dy > -12 + tilt * 9;
      let k;
      if (edge) k = GLASS + (u < 0 ? 2 : 1);
      else if (liq) k = LEMONADE + Math.min(4, Math.floor(clamp(0.45 - u / w * 0.3) * 5));
      else k = GLASS;
      if (edge || liq) g.set(x, y, "█", KEYS[k]);
      if (v < -14 && u > w - 2) mouth = [x, y];
    }
    // lemon slices floating in the pitcher
    for (const [a, b] of [[-3, 2], [2, -2]]) {
      const dx = a * ca - b * 2 * sa, dy = (a * sa + b * 2 * ca) / 2;
      g.set(Math.round(px + dx), Math.round(py + dy), "█", KEYS[LEMON + 2]); g.set(Math.round(px + dx) + 1, Math.round(py + dy), "█", KEYS[LEMON + 1]);
    }
    // stream into the cup
    if (pouring && Math.abs(cupX - 50) < 2) {
      const [mx0, my0] = mouth;
      for (let y = my0 + 1; y < level; y++) {
        const f = (y - my0) / Math.max(1, level - my0);
        g.set(Math.round(lerp(mx0 + 1, cupX, Math.sqrt(f))), y, "█", KEYS[LEMONADE + ((y + Math.floor(t * 18)) % 3 === 0 ? 3 : 1)]);
      }
    }
    return g.frame();
  };
}
