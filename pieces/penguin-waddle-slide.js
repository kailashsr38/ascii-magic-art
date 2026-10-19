/* penguin-waddle-slide: a penguin waddles across the ice, flops on its belly and slides down into the sea. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#0e2a5a", "#22488e", "#3c6ab0", "#6a92cc", "#94b4dc"], 10));
const BERG = add(gradient(["#7a9ccc", "#b4ccec", "#e4eefc", "#ffffff"], 6));
const ICE = add(gradient(["#7a94c0", "#a4bcdc", "#cadcf0", "#eef4ff"], 8));
const SEA = add(gradient(["#06203e", "#0c3460", "#164c84", "#2a6aa8"], 6));
const FOAM = add(["#c4dcf4", "#ffffff"]);
const PEN = add(["#0e1018", "#1e2230", "#343a4c", "#f4f6fa", "#c8ccd8", "#ff9a1a", "#ffd23a", "#ffffff"]);

export const meta = {
  slug: "penguin-waddle-slide",
  name: "Penguin Belly Slide",
  category: "animals",
  note: "A penguin waddles across the ice shelf past its friends, flops onto its belly and toboggans down the slope into the sea with a splash.",
  tags: ["penguin", "antarctic", "ice", "animals", "funny", "loader"],
  cols: 92, rows: 32, fps: 24,
  palette: palette(P),
};

const PER = 11;
const groundY = (x) => (x < 52 ? 23 : x < 76 ? 23 + smooth((x - 52) / 24) * 5 : 28);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const ell = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) fn(x, y, dx, dy);
    }
  };
  // standing penguin facing dir, feet at (x, y), tilt rocks the body
  const stand = (x, y, dir, tilt, step, flap, scale = 1, look = 0) => {
    const H = 8 * scale, W = 3.4 * scale;
    for (let j = 0; j < H; j++) {
      const yy = y - 1 - j;
      const u = j / H;
      const off = tilt * (j / H) * 2;
      const w = W * (u < 0.65 ? Math.sqrt(1 - ((u - 0.35) / 0.42) ** 2 * 0.7) : 0.62 + (0.75 - u) * 0.5);
      for (let i = Math.floor(-w); i <= Math.ceil(w); i++) {
        const xx = x + off + i;
        const front = i * dir > w * 0.05 - (u < 0.72 ? w * 0.55 : -1);
        const k = u > 0.72 ? (i * dir > w * 0.25 ? 2 : 0) : front ? 3 : i * dir < -w * 0.6 ? 0 : 1;
        g.set(xx, yy, "█", KEYS[PEN + k]);
      }
    }
    const hy = y - 1 - H * 0.83, hx = x + tilt * 1.7;
    g.set(hx + dir * (W * 0.45 + look), hy, "●", KEYS[PEN + 7]);
    g.set(hx + dir * (W * 0.62 + 1 + look), hy + 0.6, dir > 0 ? "►" : "◄", KEYS[PEN + 5]);
    g.set(hx + dir * (W * 0.62 + look), hy + 0.6, "█", KEYS[PEN + 5]);
    g.set(hx + dir * W * 0.2, hy + 1.2, "▄", KEYS[PEN + 6]);
    // flipper
    const fx = x + tilt - dir * 0.5, fy = y - H * 0.55;
    g.line(fx, fy, fx - dir * (1 + flap * 1.5), fy + 2.5 - flap * 1.5, "█", KEYS[PEN + 1]);
    // feet
    g.text(x - 1 + (step > 0 ? 1 : 0), y - 0.5, dir > 0 ? "▀▀▄" : "▄▀▀", KEYS[PEN + 5]);
  };
  const R = rng(3);
  const flakes = Array.from({ length: 50 }, () => [R() * cols, R() * rows, 0.6 + R()]);
  return (t) => {
    g.clear();
    const SEAY = 28;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", KEYS[SKY + Math.min(9, Math.floor((y / SEAY) * 10))]);
    // distant icebergs on the horizon drift slowly
    for (let x = 0; x < cols; x++) {
      const wx = x + t * 0.6;
      const h = Math.max(0, fbm(wx * 0.04, 2, 3, 4) - 0.36) * 30;
      for (let y = Math.floor(SEAY - h); y < SEAY; y++) g.set(x, y, y < SEAY - h + 1.5 ? "█" : "▓", KEYS[BERG + Math.min(5, Math.floor(clamp(0.9 - (y - (SEAY - h)) * 0.06 + noise2(wx * 0.3, y * 0.3, 1) * 0.3) * 6))]);
    }
    for (let y = SEAY; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wv = Math.sin(x * 0.35 - t * 2.5 + y * 0.8);
      g.set(x, y, wv > 0.7 ? "▀" : "█", KEYS[wv > 0.7 ? FOAM : SEA + 1 + Math.floor((wv + 1) * 1.4)]);
    }
    // the ice shelf with its slope down to the water
    for (let x = 0; x < 80; x++) {
      const gy = groundY(x);
      for (let y = Math.floor(gy); y < rows; y++) {
        if (x >= 76 && y < SEAY) continue;
        const v = clamp(0.95 - (y - gy) * 0.07 - noise2(x * 0.2, y * 0.5, 2) * 0.25);
        const cliff = x > 74;
        g.set(x, y, cliff ? "▓" : "█", KEYS[ICE + (y < gy + 1 ? 7 : Math.min(7, Math.floor(v * 8)))]);
      }
    }
    // friends standing on the left, turning their heads
    stand(10, 23, 1, 0, 0, 0.1, 0.9, Math.sin(t * 0.7) > 0.3 ? -1 : 0);
    stand(19, 23.4, -1, 0, 0, 0.1 + Math.max(0, Math.sin(t * 2.2)) * 0.6, 0.8, 0);
    // the hero
    const p = ((t % PER) + PER) % PER;
    if (p < 6) {
      const x = 22 + p * 5;
      const ph = p * 7;
      stand(x, 23, 1, Math.sin(ph) * 0.5, Math.sin(ph), Math.abs(Math.sin(ph)) * 0.6);
    } else if (p < 6.6) {
      const u = (p - 6) / 0.6;
      const x = 52 + u * 3;
      ell(x, 21.5 + u * 0.8, 4 + u * 2, 3.5 - u * 1.2, (xx, yy, dx, dy) => g.set(xx, yy, "█", KEYS[PEN + (dy > 0.2 ? 3 : 0)]));
      g.set(x + 4 + u * 2, 21 + u, "►", KEYS[PEN + 5]);
    } else if (p < 8.8) {
      const u = (p - 6.6) / 2.2;
      const x = 55 + smooth(u) * 22 + u * 2;
      const y = groundY(x) - 1.2;
      const ang = (groundY(x + 1) - groundY(x - 1)) / 2;
      for (let k = -6; k <= 6; k++) for (let w = -1; w <= 0; w++) {
        const xx = x + k, yy = y + k * ang + w;
        g.set(xx, yy, "█", KEYS[PEN + (w === 0 ? 3 : k > 4 ? 0 : 1)]);
      }
      g.set(x + 6, y + 6 * ang - 1, "●", KEYS[PEN + 7]);
      g.set(x + 7, y + 7 * ang - 0.5, "►", KEYS[PEN + 5]);
      g.text(x - 8, y - 6 * ang, "▀▄", KEYS[PEN + 5]);
      g.line(x - 1, y - 1.5, x - 4, y - 2.6, "█", KEYS[PEN + 1]);
      for (let k = 1; k <= 6; k++) g.set(x - 6 - k * 1.5, groundY(x - 6 - k * 1.5) - 0.2 - (k % 2), k < 3 ? "*" : "·", KEYS[FOAM + (k < 3 ? 1 : 0)]);
    } else {
      const u = (p - 8.8) / (PER - 8.8);
      const x = 80 + u * 6;
      if (u < 0.6) {
        for (let k = 0; k < 14; k++) {
          const a = (k / 13) * Math.PI;
          const r = 2 + u * 14;
          g.set(x + Math.cos(a) * r, 28 - Math.sin(a) * r * 0.45 * (1 - u), u < 0.3 ? "█" : "▒", KEYS[FOAM + (k % 2)]);
        }
        g.text(x - 3, 28, "≈≈≈≈≈≈", KEYS[FOAM + 1]);
      } else {
        // head bobbing back up
        const hx = 82 + (u - 0.6) * 10;
        g.text(hx, 28.6, "▄█▄", KEYS[PEN]); g.set(hx + 2, 28.6, "●", KEYS[PEN + 7]); g.set(hx + 3, 29, "►", KEYS[PEN + 5]);
        g.text(hx - 2, 29.6, "≈≈≈≈≈≈", KEYS[FOAM]);
      }
    }
    for (const [fx, fy, sp] of flakes) {
      const y = (fy + t * sp * 1.8) % rows, x = (fx + Math.sin(t + fy) * 1.2 + cols) % cols;
      const i = Math.floor(x) + Math.floor(y) * cols;
      if (y < 21) g.co[i] = KEYS[FOAM + 1];
    }
    return g.frame();
  };
}
