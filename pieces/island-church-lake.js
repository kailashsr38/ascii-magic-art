/* island-church-lake: a tiny island with its white church and tall bell tower in an emerald lake, a castle on the cliff, hand-built.
 * Painted once: the sky and the alps, the wooded shores, the castle on its cliff, the green lake, the
 * island with its trees, stairs, church and tower, mirrored. Each frame adds the wooden ferry boats
 * with their awnings plying to the island, a bell-tower flag and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, tree, flag, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, SHORE = 3, ISLE = 4, LAKE = 5;
const WL = 70, IX = 100;

const base = new Canvas();
base.sky([[0, "#5a94d0"], [0.7, "#a8cce8"], [1, "#e4eef4"]], SKY, 0, 50);
base.ridge({ base: 0.38, amp: 0.14, f: 3, seed: 9, top: "#f4f6fa", bot: "#9aaac0", depth: 10, m: MTN });
base.ridge({ base: 0.52, amp: 0.08, f: 4, seed: 4, top: "#6a8a6a", bot: "#3e5a42", depth: 18, m: SHORE });
// the castle on its cliff at the right
for (let x = 150; x < W; x++) for (let y = 44 + Math.floor((x - 150) * 0.1); y < WL; y++) base.put(x, y, mix(hex("#c8b8a8"), hex("#6a6460"), clamp(noise2(x / 3, y / 3, 5) * 0.6 + (y - 44) / 50)), SHORE);
base.rect(160, 34, 184, 46, (x) => mix(hex("#fff4e8"), hex("#b8aaa0"), clamp((x - 160) / 24)), SHORE);
base.poly([[158, 34], [186, 34], [172, 27]], "#c86a4a", SHORE); base.rect(176, 26, 181, 34, "#e8dcd0", SHORE);
// the green lake
base.rect(0, WL, W, H, (x, y) => mix(hex("#7ac8b0"), hex("#3a8a80"), clamp((y - WL) / 40)), LAKE);
// the island: trees, stairs up from the water, the church and its tall tower
base.ellipse(IX, WL + 1, 40, 7, (x, y) => mix(hex("#7a8a6a"), hex("#4a5a42"), clamp((y - WL + 5) / 8)), ISLE);
for (const [x, r] of [[72, 8], [84, 9], [122, 8], [134, 7], [64, 6]]) tree(base, x, WL - 2, r, { trunk: "#3a2a22", dark: "#3e6a3e", light: "#8ab05a", seed: x, m: ISLE });
base.rect(IX - 14, 48, IX + 14, WL - 2, (x) => mix(hex("#ffffff"), hex("#c8c4c8"), clamp((x - IX + 10) / 22)), ISLE);
base.poly([[IX - 15, 48], [IX + 15, 48], [IX, 39]], (x) => mix(hex("#e87a5a"), hex("#a84a3a"), clamp((x - IX + 11) / 24)), ISLE);
base.rect(IX + 15, 26, IX + 23, WL - 2, (x) => mix(hex("#ffffff"), hex("#c8c4c8"), clamp((x - IX - 15) / 8)), ISLE);
base.poly([[IX + 14, 26], [IX + 24, 26], [IX + 19, 8]], (x) => mix(hex("#e87a5a"), hex("#a84a3a"), clamp((x - IX - 14) / 10)), ISLE);
base.rect(IX + 18, 30, IX + 20, 35, "#4a4048", ISLE);
for (let k = 0; k < 6; k++) base.rect(IX - 4 + k, WL - 1 - k, IX + 4 - k, WL - k, "#e8e0d4", ISLE); // the stairs
// everything mirrored in the lake
const snap = new Canvas().copy(base);
for (let x = 0; x < W; x++) for (let y = WL + 1; y < H; y++) {
  const sy = 2 * WL - y + 1;
  if (sy < 0 || snap.maskAt(x, sy) === LAKE) continue;
  base.put(x, y, mix(snap.get(x, sy), snap.get(x, y), clamp(0.45 + (y - WL) / 60)), LAKE);
}

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#5a3a2a", "#e8c84a", "#d84a3a", "#1e1e2a"] });

export const meta = {
  slug: "island-church-lake",
  name: "Island Church Lake",
  category: "cities",
  note: "A tiny island with a white church and tall bell tower sits in an emerald lake below the alps and a cliff-top castle as wooden ferry boats row out to it.",
  tags: ["bled", "slovenia", "lake", "island", "church", "alps", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a pletna: long wooden boat with a striped awning and an oarsman standing at the stern
function pletna(f, x, y, dir, t) {
  f.rect(x - 9, y - 1, x + 10, y + 1, "#5a3a2a"); f.put(x + 10 * dir, y - 2, "#5a3a2a");
  for (let i = -6; i <= 6; i++) f.rect(x + i, y - 5, x + i + 1, y - 4, Math.floor((i + 6) / 2) % 2 ? "#e8c84a" : "#d84a3a");
  for (const i of [-6, 6]) f.rect(x + i, y - 4, x + i + 1, y - 1, "#5a3a2a");
  const sx = x - 9 * dir; f.rect(sx, y - 5, sx + 1, y - 1, "#1e1e2a"); f.put(sx, y - 6, "#f0d0b0");
  f.line(sx, y - 3, sx - dir * (2 + Math.sin(t * 2) * 2), y + 2, "#1e1e2a", 1);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.26, 0.12, 1, "#ffffff", 0.4], [0.7, 0.2, 0.2, 0.8, "#ffffff", 0.3]], SKY, 0.6);
    pletna(f, across(t, 3, 0.15), 88, 1, t);
    pletna(f, W - across(t, 2.4, 0.6), 98, -1, t + 1);
    flag(f, t, IX + 19, 2, 5, 3, "#ffffff", { c2: "#2a4ab8", pole: "#1e1e2a" });
    birds(f, t, { n: 5, y: 12, period: 15, c: "#1e1e2a", only: SKY });
    return enc(f);
  };
}
