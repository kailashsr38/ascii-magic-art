/* rocket-launch: a rocket ignites at dusk and climbs out of a billowing cloud of smoke and flame. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#070b22", "#161d4a", "#33306e", "#6a3c78", "#b0546a", "#ec8a52", "#ffc070"], 14));
add("star", ["#c0c8ff"]);
add("ground", gradient(["#05060c", "#0e1018", "#1a1a26", "#2a2630"], 4));
add("hull", gradient(["#4a5060", "#8a92a2", "#c8ced8", "#f2f4f8"], 6));
add("red", ["#7a1a14", "#c83a28", "#ff6a4a"]);
add("fire", gradient(["#8a1a04", "#e0500a", "#ff9a20", "#ffd860", "#fff8e0"], 8));
add("smoke", gradient(["#2a2a34", "#56545e", "#8a8690", "#bcb6b8", "#e6e0dc"], 8));
add("lit", gradient(["#6a3a24", "#b8682e", "#f0a050", "#ffd8a0"], 6));
add("tower", ["#2a2e3a", "#4a5060", "#c8302a"]);

export const meta = {
  slug: "rocket-launch",
  name: "Rocket Launch",
  category: "cosmos",
  note: "A rocket ignites on the pad at dusk and climbs away on a column of flame, leaving a billowing cloud behind.",
  tags: ["rocket", "launch", "liftoff", "hero", "startup", "loader"],
  cols: 96, rows: 40, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";
const PER = 13;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const GY = 34, RX = 52, RH = 20;
  const r = rng(31);
  const stars = Array.from({ length: 60 }, () => [Math.floor(r() * cols), Math.floor(r() * 14), r() * TAU]);
  // half-width of the rocket by row from the nose
  const hw = (i) => (i < 6 ? 0.4 + i * 0.5 : i >= RH - 4 ? 3 + (i - (RH - 4)) * 0.9 : 3);
  const hills = Array.from({ length: cols }, (_, x) => Math.round(GY - 2 - 2.5 * fbm(x * 0.05, 3, 3, 6)));

  return (t) => {
    g.clear();
    const lt = t % PER;
    const ign = clamp((lt - 1.2) / 0.6);
    const rise = lt > 2.4 ? 0.95 * (lt - 2.4) ** 2 : 0;
    const base = GY - 1 - rise;              // row of the rocket's tail
    const fade = clamp((PER - lt) / 2.2);
    const smokeR = (lt < 1.2 ? 0 : Math.min(34, 2 + 6.5 * (lt - 1.2))) * fade;
    const flick = 0.5 + 0.5 * Math.sin(t * 37) * Math.sin(t * 23);
    const glow = ign * (base > -6 ? 1 : 0.4) * fade;
    // sky
    for (let y = 0; y < GY; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / GY + (fbm(x * 0.04 + t * 0.02, y * 0.2, 3, 2) - 0.5) * 0.25);
      const fl = glow * Math.exp(-Math.hypot((x - RX) / 2, y - Math.max(base + 3, 4)) / 10) * 0.6;
      g.set(x, y, v + fl > 0.55 ? "▓" : v > 0.25 ? "▒" : "░", K("sky", Math.min(13, Math.floor(clamp(v + fl) * 14))));
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 1.3 + ph) > -0.2) g.set(sx, sy, "·", K("star", 0));
    // ground and distant hills
    for (let x = 0; x < cols; x++) {
      for (let y = hills[x]; y < rows; y++) {
        const lit = glow * Math.exp(-Math.hypot((x - RX) / 2.5, y - GY) / 4) * (y >= GY ? 0.9 : 0.4);
        if (lit > 0.2) g.set(x, y, "▒", K("lit", Math.min(5, Math.floor(lit * 6))));
        else g.set(x, y, y >= GY ? "█" : "▓", K("ground", y >= GY ? Math.min(3, 1 + Math.floor((y - GY) / 2)) : 0));
      }
    }
    // launch tower with cross bracing and a swing arm
    for (let y = 9; y < GY; y++) {
      g.set(41, y, "║", K("tower", 1)); g.set(45, y, "║", K("tower", 1));
      g.text(42, y, (y % 2 ? "╲ ╱" : " ╳ "), K("tower", 0));
    }
    g.text(41, 8, "╔═══╗", K("tower", 1));
    g.set(43, 7, "●", K("tower", Math.floor(t * 2) % 2 ? 2 : 0));
    if (lt < 2.2) g.text(46, 16, "════", K("tower", 1));
    // exhaust column: smoke left along the flight path
    if (lt > 2.4) {
      for (let y = Math.max(0, Math.floor(base + 3)); y < GY; y++) {
        const age = Math.max(0, lt - 2.4 - Math.sqrt(Math.max(0, GY - 1 - y) / 0.95));
        const w = 0.8 + age * 1.6;
        for (let x = Math.floor(RX - w - 2); x <= RX + w + 2; x++) {
          const n = fbm(x * 0.25, y * 0.3 + t * 0.6, 3, 4);
          const d = Math.abs(x + 0.5 - RX) / w;
          const D = (1 - d) * (0.6 + n * 0.8) * fade * clamp(1.3 - age * 0.12);
          if (D > 0.15) {
            const hot = Math.exp(-(y - base - 3) / 4) * ign;
            g.set(x, y, SH[Math.min(3, Math.floor(D * 4))], hot > 0.35 ? K("fire", Math.min(7, Math.floor(hot * 7))) : K("smoke", Math.min(7, Math.floor(2 + D * 5))));
          }
        }
      }
    }
    // ground cloud rolling out both ways
    if (smokeR > 0) {
      for (let y = Math.floor(GY - smokeR * 0.45 - 2); y < GY + 2; y++) for (let x = Math.floor(RX - smokeR - 3); x <= RX + smokeR + 3; x++) {
        if (y < 0 || y >= rows) continue;
        const side = x < RX ? -1 : 1;
        const n = fbm(x * 0.13 - side * lt * 0.25, y * 0.28 - lt * 0.15, 4, 9);
        const d = Math.hypot((x - RX) / smokeR, (GY - y) / (smokeR * 0.42 + 2));
        const D = (1 - d) * 1.6 + (n - 0.5) * 1.3;
        if (D > 0.2) {
          const warm = glow * Math.exp(-Math.hypot((x - RX) / 3, (y - GY) * 1.5) / 6);
          g.set(x, y, SH[Math.min(3, Math.floor(D * 3))], warm > 0.3 ? K("lit", Math.min(5, Math.floor(warm * 7))) : K("smoke", Math.min(7, Math.floor(1 + n * 7))));
        }
      }
    }
    // the rocket
    const top = Math.floor(base - RH + 1);
    for (let i = 0; i < RH; i++) {
      const y = top + i;
      if (y < 0 || y >= rows) continue;
      const w = hw(i);
      for (let x = Math.floor(RX - w); x <= Math.ceil(RX + w - 1); x++) {
        const u = (x + 0.5 - RX) / Math.max(1, w);
        if (Math.abs(u) > 1.05) continue;
        const shade = clamp(0.75 - u * 0.55 + (i < 6 ? 0.1 : 0));
        const fin = i >= RH - 4 && Math.abs(x + 0.5 - RX) > 3;
        let col = K("hull", Math.min(5, Math.floor(shade * 6)));
        if (fin || (i >= 6 && i <= 7) || (i >= RH - 6 && i <= RH - 5)) col = K("red", Math.min(2, Math.floor(shade * 3)));
        let ch = i === 0 ? "▲" : "█";
        if (fin && (x === Math.floor(RX - w) || x === Math.ceil(RX + w - 1))) ch = x < RX ? "▟" : "▙";
        if (i === 9 && Math.abs(x + 0.5 - RX) < 1) { ch = "●"; col = K("red", 2); }
        g.set(x, y, ch, col);
      }
    }
    // flame
    if (ign > 0) {
      const len = (3 + ign * 5 + flick * 2) * (lt > 2.4 ? 1.25 : 1);
      for (let j = 0; j < len; j++) {
        const y = Math.floor(base + 1 + j);
        if (y < 0 || y >= rows) continue;
        const f = j / len;
        const w = 2.6 * (1 - f * 0.8) + flick * 0.5;
        for (let x = Math.floor(RX - w); x <= RX + w; x++) {
          const d = Math.abs(x + 0.5 - RX) / w;
          const v = clamp((1 - f) * (1.15 - d) + (fbm(x * 0.6, y * 0.6 - t * 9, 2, 3) - 0.5) * 0.5);
          if (v > 0.12) g.set(x, y, SH[Math.min(3, Math.floor(v * 4.5))], K("fire", Math.min(7, Math.floor(v * 9))));
        }
      }
    }
    return g.frame();
  };
}
