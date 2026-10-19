/* rain-cloud-rainbow: a gloomy little cloud rains on a meadow, then cheers up, turns white and pushes out a rainbow. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKYG = add(gradient(["#2a3442", "#3a4656", "#4c5a6c", "#606e80"], 6));
const SKYB = add(gradient(["#3a8ad8", "#5aa4e4", "#84c0f0", "#b4dcf8"], 6));
const HILL = add(gradient(["#1e4a22", "#2a6a2a", "#3e8a34", "#5aa840", "#80c458"], 6));
const CLOUDG = add(gradient(["#3e4450", "#585e6c", "#727a88", "#8c94a2"], 6));
const CLOUDW = add(gradient(["#b8c4d4", "#d4dce8", "#ecf0f8", "#ffffff"], 6));
const RAIN = add(["#7ab0e8", "#b4d8ff"]);
const BOW = add(["#ff4a4a", "#ff9a3a", "#ffe04a", "#5ad05a", "#4aa0ff", "#8a5aff"]);
const FACE = add(["#1a1e2a", "#ff8aa0", "#ffffff"]);
const SUN = add(["#ffd24a", "#fff0a0"]);
const FLOW = add(["#ff6aa4", "#ffd84a", "#ffffff"]);

export const meta = {
  slug: "rain-cloud-rainbow",
  name: "Raincloud Cheers Up",
  category: "mascots",
  note: "A gloomy little cloud rains on a green meadow until it cheers up, turns fluffy white and pushes a rainbow out across the sky.",
  tags: ["cloud", "rainbow", "mascot", "weather", "cute", "empty-state"],
  cols: 64, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const LOOP = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hill = (x) => 23 + Math.sin(x * 0.09) * 1.5 + Math.sin(x * 0.21 + 1) * 0.7;
  const sky = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) sky[x + y * cols] = clamp(y / 23 + (fbm(x * 0.07, y * 0.15, 3, 4) - 0.5) * 0.3);
  const r = rng(5);
  const drops = Array.from({ length: 26 }, () => [r() * 22 - 11, r(), 0.8 + r() * 0.4]);
  const flowers = [[6, 26], [12, 28], [50, 27], [57, 25], [44, 29], [20, 25]];
  return (t) => {
    const p = t % LOOP;
    // mood: 0 rainy grey, 1 sunny
    const mood = p < 4.5 ? 0 : p < 5.5 ? smooth(p - 4.5) : p < 10.8 ? 1 : 1 - smooth((p - 10.8) / 1.2);
    const bow = p < 5.6 ? 0 : p < 7.6 ? smooth((p - 5.6) / 2) : p < 10.4 ? 1 : 1 - smooth((p - 10.4) / 0.8);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      if (y >= hill(x)) {
        const n = noise2(x * 0.5, y * 1.1, 2);
        const v = clamp(0.25 + mood * 0.35 + (y - hill(x)) * -0.04 + (n - 0.5) * 0.4);
        g.ch[i] = n > 0.65 ? "▓" : "█"; g.co[i] = KEYS[HILL + Math.min(5, Math.floor(v * 6))];
      } else {
        const v = sky[i];
        const blue = mood > 0.5;
        g.ch[i] = v > 0.55 ? "▓" : "█";
        g.co[i] = KEYS[(blue ? SKYB : SKYG) + Math.min(5, Math.floor(v * 6))];
      }
    }
    for (const [fx, fy] of flowers) if (mood > 0.3) g.set(fx, fy, "●", KEYS[FLOW + (fx % 3)]);
    const cx = 24 + Math.sin(t * 0.5) * 2, cy = 8 + Math.sin(t * 1.1) * 0.4;
    // sun peeks out when happy
    if (mood > 0.2) {
      const sx = 54, sy = 4 + (1 - mood) * 3;
      ell(g, sx, sy, 4.5, 2.4, (x, y, dx) => g.set(x, y, "█", KEYS[SUN + (dx < 0 ? 1 : 0)]));
      for (let k = 0; k < 8; k++) { const a = k * 0.785 + t * 0.3; g.set(sx + Math.cos(a) * 7, sy + Math.sin(a) * 3.6, "▪", KEYS[SUN]); }
    }
    // rainbow arc behind the cloud, growing outward from the cloud
    if (bow > 0) {
      const ax = 44, ay = 26;
      for (let b = 0; b < 6; b++) {
        const rx = 19 - b * 1.1, ry = 15 - b;
        for (let a = Math.PI; a <= Math.PI * 2; a += 0.01) {
          const f = (a - Math.PI) / Math.PI;
          if (f > bow) continue;
          const x = ax + Math.cos(a) * rx, y = ay + Math.sin(a) * ry;
          if (y < hill(Math.round(x))) g.set(x, y, "█", KEYS[BOW + b]);
        }
      }
    }
    // rain
    if (mood < 0.6) for (const [dx, ph, sp] of drops) {
      const u = (t * sp * 1.2 + ph) % 1;
      const x = cx + dx, y = cy + 4 + u * (hill(Math.round(x)) - cy - 4);
      g.set(x, y, mood < 0.3 ? "│" : "╎", KEYS[RAIN + (u < 0.5 ? 1 : 0)]);
      if (u > 0.92) g.text(Math.round(x) - 1, Math.round(hill(Math.round(x))) - 1, "·.·", KEYS[RAIN + 1]);
    }
    // cloud body: puffs
    const C = mood > 0.5 ? CLOUDW : CLOUDG;
    const puffs = [[-9, 1.2, 6, 3.4], [9, 1.2, 6, 3.4], [-3.5, -1.6, 7, 4.2], [4.5, -1, 6.5, 3.8], [0, 1.6, 12, 3.4]];
    for (const [ox, oy, rx, ry] of puffs) ell(g, cx + ox, cy + oy, rx, ry, (x, y, dx, dy, d) => {
      const lit = clamp(0.55 - dy * 0.35 - dx * 0.15 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, d > 0.85 ? "▓" : "█", KEYS[C + Math.min(5, Math.floor(lit * 6))]);
    });
    // face
    const fy = Math.round(cy + 1);
    const blink = Math.abs((t % 3.7) - 2.5) < 0.12;
    for (const ex of [cx - 4.5, cx + 4.5]) {
      const X = Math.round(ex - 1);
      if (mood < 0.5) { g.text(X, fy - 1, ex < cx ? "▄▀▀" : "▀▀▄", KEYS[FACE]); if (!blink) g.text(X, fy, "▄█▄", KEYS[FACE]); }
      else if (blink) g.text(X, fy, "▀▀▀", KEYS[FACE]);
      else { g.text(X, fy - 1, "▄█▄", KEYS[FACE]); g.text(X, fy, "▀█▀", KEYS[FACE]); g.set(X, fy - 1, "▄", KEYS[FACE + 2]); }
    }
    if (mood < 0.5) { g.text(Math.round(cx - 1.5), fy + 2, "▄▀▀▄", KEYS[FACE]); g.set(Math.round(cx + 6), fy + 1 + (Math.floor(t * 2) % 2), "▼", KEYS[RAIN + 1]); }
    else { g.text(Math.round(cx - 7.5), fy + 1, "▄▄", KEYS[FACE + 1]); g.text(Math.round(cx + 6), fy + 1, "▄▄", KEYS[FACE + 1]); g.text(Math.round(cx - 2), fy + 2, "▀▄▄▄▀", KEYS[FACE]); }
    return g.frame();
  };
}
