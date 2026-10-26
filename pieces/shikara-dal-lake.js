/* shikara-dal-lake: painted shikaras gliding across the mirror lake past houseboats, snow peaks and chinar trees in autumn, hand-built.
 * Painted once: the morning sky, the snow-capped ranges, the far shore with its poplars and chinars in
 * autumn red, the line of carved wooden houseboats, the still lake mirroring it all and lotus leaves
 * in front. Each frame paddles the shikaras across with their canopies and ripples, and adds birds. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, SHORE = 3, BOATS = 4, LAKE = 5;
const WL = 66;

const base = new Canvas();
base.sky([[0, "#6a9ad0"], [0.7, "#c4d8ea"], [1, "#eef0ec"]], SKY, 0, 50);
base.ridge({ base: 0.36, amp: 0.14, f: 3, seed: 8, top: "#ffffff", bot: "#a8b4c8", depth: 12, m: MTN });
base.ridge({ base: 0.48, amp: 0.06, f: 3, seed: 3, top: "#8a96b0", bot: "#6a7a94", depth: 12, m: MTN });
// the far shore: poplars and chinars in autumn
const R = rng(6);
for (let x = 0; x < W; x++) for (let y = 50; y < WL - 6; y++) if (fbm(x / 4, y / 3, 3, 9) > 0.5 - (y - 50) / 40) base.put(x, y, mix(hex(R() < 0.5 ? "#ffa860" : "#f07a4a"), hex("#a86a3a"), clamp((y - 50) / 16)), SHORE);
for (let i = 0; i < 16; i++) { const x = 4 + i * 12 + Math.floor(R() * 5); for (let y = 0; y < 16; y++) { const w = Math.max(0.5, (16 - y) * 0.13); for (let d = -Math.floor(w); d <= w; d++) base.put(x + d, WL - 6 - y, "#c8a83a", SHORE); } }
// the houseboats: long carved wooden hulls with roofs and verandas
for (let x = 2; x < W; x += 38) {
  base.rect(x, WL - 8, x + 32, WL - 2, (xx, y) => mix(hex("#e8b888"), hex("#a8724e"), clamp((y - WL + 8) / 6 + ((xx % 4) === 0 ? 0.25 : 0))), BOATS);
  base.poly([[x - 1, WL - 8], [x + 33, WL - 8], [x + 30, WL - 12], [x + 2, WL - 12]], "#b88a6a", BOATS);
  for (let xx = x + 2; xx < x + 30; xx += 4) base.rect(xx, WL - 7, xx + 2, WL - 5, "#ffe0a0", BOATS);
  base.rect(x - 2, WL - 2, x + 34, WL, "#6a4a32", BOATS);
}
// the lake: a mirror, cooler toward us, lotus leaves near the front
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1 + Math.round(Math.sin(y * 0.6 + x * 0.04) * 0.5)), hex("#4a7a8a"), clamp(0.3 + (y - WL) / 70)), LAKE);
for (let i = 0; i < 50; i++) { const x = (i * 41) % W, y = 94 + ((i * 7) % 14); base.ellipse(x, y, 3, 1.2, i % 4 ? "#5a8a4a" : "#f0a0b0", LAKE); }

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#e84a3a", "#ffd27a", "#3a7ab8", "#1e1820", "#f4ece0", "#5a3a28"] });

export const meta = {
  slug: "shikara-dal-lake",
  name: "Shikara Dal Lake",
  category: "india",
  note: "Painted shikaras glide across the mirror lake past carved wooden houseboats, autumn chinars and snow peaks, their boatmen paddling through the morning stillness.",
  tags: ["srinagar", "kashmir", "dal-lake", "shikara", "houseboats", "autumn", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a shikara: long low hull with upswept ends, a canopy on four posts, the boatman at the stern
function shikara(f, x, y, dir, t, c) {
  for (let i = -14; i <= 14; i++) { const lift = Math.pow(Math.abs(i) / 14, 3) * 3; f.put(x + i, y - lift, "#5a3a28"); f.put(x + i, y + 1 - lift * 0.5, "#5a3a28"); }
  f.rect(x - 6, y - 8, x + 7, y - 6, c);
  for (const i of [-6, -2, 3, 6]) f.rect(x + i, y - 6, x + i + 1, y - 1, "#ffd27a");
  f.rect(x - 5, y - 3, x + 6, y - 1, "#f4ece0");
  const sx = x - 11 * dir, st = Math.sin(t * 1.8);
  f.rect(sx, y - 6, sx + 1, y - 1, "#1e1820"); f.put(sx, y - 7, "#e8c8a8");
  f.line(sx, y - 4, sx - dir * (2 + st * 2), y + 3, "#1e1820", 1);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 44, y1: 60, c: "#f4ece0", a: 0.35, speed: 0.03, scale: 28, cut: 0.5 });
    for (const [ph, y, dir, c] of [[0.1, 80, 1, "#e84a3a"], [0.55, 90, -1, "#3a7ab8"]]) {
      const u = across(t, 3, ph), x = dir > 0 ? u : W - u;
      for (let k = 3; k < 22; k++) f.add(x - dir * k, y + 1, "#f4ece0", (1 - k / 22) * 0.4, LAKE);
      shikara(f, x, y, dir, t, c);
    }
    birds(f, t, { n: 5, y: 16, period: 16, c: "#1e1820", only: SKY });
    return enc(f);
  };
}
