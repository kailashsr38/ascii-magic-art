/* eid-moon: a new crescent moon and twinkling stars over domes and minarets with warmly lit windows. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#040820", "#0a1a44", "#1a2e66", "#3a3a80", "#7a4a8a", "#c86a7a", "#f0a070"], 12);  // 0..11
const MOON = gradient(["#c89a3a", "#f2cf6a", "#fff0b8", "#fffbe8"], 4);                       // 12..15
const CITY = gradient(["#05060f", "#0b0d1e", "#14172e", "#20243e"], 4);                       // 16..19
const NAMED = ["#ffcf6a", "#ffa83a", "#7a5a2a", "#d8b45a", "#e8eef8", "#8a94b8", "#4a5a8a", "#ffe9a8"];
// 20 window, 21 window warm, 22 window dim, 23 gold finial, 24 star, 25 star dim, 26 rim light, 27 fairy light
const pal = palette([...SKY, ...MOON, ...CITY, ...NAMED]);

export const meta = {
  slug: "eid-moon",
  name: "Eid Crescent",
  category: "occasions",
  note: "A slim new crescent and twinkling stars rise over a skyline of domes and minarets with warmly lit windows.",
  tags: ["eid", "crescent", "moon", "night", "skyline", "hero"],
  cols: 100, rows: 36, fps: 15,
  palette: pal,
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(1447);
  const mx = 76, my = 9, MR = 9;
  const stars = Array.from({ length: 90 }, () => [Math.floor(r() * cols), Math.floor(r() * 22), r() * 6.28, 0.8 + r() * 1.6]);
  // build the skyline once into a mask: 0 sky, 1 building, 2 window, 3 finial, 4 rim
  const mask = new Uint8Array(cols * rows), wph = new Float32Array(cols * rows);
  const put = (x, y, v) => { if (x >= 0 && y >= 0 && x < cols && y < rows) mask[x + y * cols] = v; };
  // low buildings
  let x = 0;
  while (x < cols) {
    const w = 6 + Math.floor(r() * 8), top = 27 + Math.floor(r() * 4);
    for (let i = 0; i < w; i++) for (let y = top; y < rows; y++) put(x + i, y, 1);
    for (let i = 2; i < w - 1; i += 3) for (let y = top + 2; y < rows - 1; y += 3) if (r() < 0.55) { put(x + i, y, 2); put(x + i, y + 1, 2); }
    x += w;
  }
  // domes: [cx, base, rx, ry]
  const domes = [[22, 24, 9, 7], [50, 22, 12, 9], [70, 25, 7, 6], [8, 27, 5, 4], [90, 26, 6, 5]];
  for (const [cx, base, rx, ry] of domes) {
    for (let y = base - ry; y <= base; y++) {
      const dy = (base - y) / ry;
      const w = rx * Math.sqrt(Math.max(0, 1 - dy * dy)) * (1 + 0.25 * Math.sin(dy * Math.PI) * (1 - dy));
      for (let i = Math.ceil(cx - w); i <= Math.floor(cx + w); i++) put(i, y, i > cx + w - 1.5 ? 4 : 1);
    }
    for (let y = base + 1; y < rows; y++) for (let i = cx - rx; i <= cx + rx; i++) put(i, y, 1);   // drum and hall
    for (let i = cx - rx + 2; i <= cx + rx - 2; i += 3) { put(i, base + 3, 2); put(i, base + 4, 2); put(i, base + 5, 2); }
    put(cx, base - ry - 1, 1); put(cx, base - ry - 2, 3);
  }
  // minarets: [x, top]
  for (const [mxx, top] of [[34, 8], [66, 11], [4, 15], [96, 14]]) {
    for (let y = top; y < rows; y++) for (let i = -1; i <= 1; i++) put(mxx + i, y, i === 1 ? 4 : 1);
    for (const by of [top + 5, top + 11]) for (let i = -2; i <= 2; i++) put(mxx + i, by, 1);
    put(mxx, top - 1, 1); put(mxx, top - 2, 3);
    put(mxx, top + 3, 2); put(mxx, top + 8, 2);
  }
  for (let i = 0; i < wph.length; i++) wph[i] = r() * 6.28;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let xx = 0; xx < cols; xx++) {
      const m = mask[xx + y * cols];
      if (m === 0) {
        const glow = Math.exp(-Math.hypot((xx - mx) * 0.5, y - my) / 6);
        const n = fbm(xx * 0.04 + t * 0.02, y * 0.13, 3);
        const v = clamp(0.05 + (y / 30) ** 1.4 * 0.95 + (n - 0.5) * 0.25 + glow * 0.3);
        g.set(xx, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(11, Math.floor(v * 12))]);
      } else if (m === 1) g.set(xx, y, "█", KEYS[16 + (y < 26 ? 1 : 0) + ((xx + y) % 7 === 0 ? 1 : 0)]);
      else if (m === 4) g.set(xx, y, "▓", KEYS[19]);
      else if (m === 2) { const b = Math.sin(t * 0.6 + wph[xx + y * cols]); g.set(xx, y, "█", KEYS[b > -0.6 ? (b > 0.5 ? 20 : 21) : 22]); }
      else if (m === 3) g.set(xx, y, "◆", KEYS[23]);
    }
    for (const [sx, sy, ph, sp] of stars) {
      if (mask[sx + sy * cols]) continue;
      const b = Math.sin(t * sp + ph);
      if (b > -0.2) g.set(sx, sy, b > 0.85 ? "*" : b > 0.4 ? "+" : "·", KEYS[b > 0.4 ? 24 : 25]);
    }
    // the crescent
    for (let y = 0; y < 20; y++) for (let xx = mx - 20; xx <= mx + 20; xx++) {
      const d1 = Math.hypot((xx - mx) / MR, (y - my) / (MR * 0.5));
      const d2 = Math.hypot((xx - mx + 3.6) / (MR * 0.92), (y - my + 1.2) / (MR * 0.46));
      if (d1 < 1 && d2 > 1) g.set(xx, y, "█", KEYS[12 + Math.min(3, Math.floor((d2 - 1) * 5 + 1))]);
    }
    // a bright star beside the moon
    const s = 0.5 + 0.5 * Math.sin(t * 1.7);
    g.set(mx - 8, my - 1, "*", KEYS[15]);
    if (s > 0.3) { g.set(mx - 9, my - 1, "─", KEYS[14]); g.set(mx - 7, my - 1, "─", KEYS[14]); }
    if (s > 0.6) { g.set(mx - 8, my - 2, "│", KEYS[14]); g.set(mx - 8, my, "│", KEYS[14]); }
    // a festive string of lights drooping across the rooftops
    for (let xx = 0; xx < cols; xx++) {
      const y = Math.round(29 + 1.5 * Math.sin((xx % 25) / 25 * Math.PI));
      if (xx % 2 === 0) g.set(xx, y, (xx / 2 + Math.floor(t * 3)) % 3 === 0 ? "●" : "•", KEYS[(xx / 2 + Math.floor(t * 3)) % 3 === 0 ? 27 : 21]);
    }
    return g.frame();
  };
}
