/* terraced-lakes-falls: a wall of waterfalls pouring from one turquoise lake into the next through an autumn forest, hand-built.
 * Painted once: the sky, hills of autumn forest in orange, gold and green, the upper lake's turquoise
 * band, the cliff of moss and travertine below it hung with curtains of falls, the lower lake, and a
 * wooden boardwalk across the foreground. Each frame pours the falls, churns white water where they
 * land, walks people along the boardwalk, paddles ducks across and drops leaves. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, falls, snow, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FOREST = 2, LAKE = 3, CLIFF = 4, FALL = 5, WALK = 6;
const UP = 32, LIP = 42, LO = 60;

const base = new Canvas();
base.sky([[0, "#88b4e0"], [1, "#e4eef4"]], SKY, 0, 30);
// the autumn forest on the hills behind: a mottle of green, gold, orange and rust
const crest = base.ridge({ base: 0.2, amp: 0.08, f: 3, seed: 2, top: "#c0cc9c", bot: "#a8b888", depth: 20, m: FOREST });
const AUT = ["#b4cc80", "#f8dc84", "#f8c090", "#ecac80", "#d4e094"].map(hex);
const autumn = (x, y) => { const n = fbm(x / 4, y / 3, 3, 5), k = Math.floor(clamp(n * 1.2 - 0.1) * 4.99); return mix(AUT[k], hex("#5a6a44"), noise2(x / 2, y / 2, 9) > 0.56 ? 0.55 : 0); };
for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.floor(crest[x])); y < UP + 2; y++) base.put(x, y, autumn(x, y), FOREST);
// the upper lake: a turquoise band, pale where it shallows at the lip
const upTop = (x) => UP + fbm(x / 10, 1, 2, 4) * 3, lip = (x) => LIP + Math.sin(x / 11) * 1.2 + fbm(x / 6, 2, 2, 6) * 2;
for (let x = 0; x < W; x++) for (let y = Math.floor(upTop(x)); y < lip(x); y++) base.put(x, y, mix(hex("#7ad0cc"), hex("#c8f4e8"), clamp((y - upTop(x)) / (lip(x) - upTop(x)))), LAKE);
// the sunlit moss and travertine slope the water spills down
for (let x = 0; x < W; x++) for (let y = Math.floor(lip(x)); y < LO + 2; y++) base.put(x, y, noise2(x / 2, y / 2, 3) > 0.66 ? hex("#6a8a5a") : mix(hex("#cce098"), hex("#a0bc78"), clamp((y - lip(x)) / 18 + fbm(x / 3, y / 3, 2, 8) * 0.4)), CLIFF);
// the falls: short spills of many widths, some starting below the lip where the water finds a channel
const FALLS = [[6, 3, 0], [18, 6, 2], [33, 2, 5], [42, 8, 0], [60, 4, 4], [72, 2, 1], [82, 10, 0], [100, 3, 6], [110, 6, 1], [126, 2, 3], [136, 9, 0], [154, 4, 5], [166, 6, 2], [182, 3, 0]];
for (const [x, w, d] of FALLS) for (let xx = x; xx < x + w; xx++) base.rect(xx, lip(xx) - 1 + d, xx + 1, LO + 1, "#d8f0ec", FALL);
// autumn trees standing on the slope between the falls, some in front of them
for (let i = 0; i < 22; i++) { const x = 2 + i * 9 + (i % 3) * 2, y = LIP + 6 + ((i * 7) % 12); base.ellipse(x, y, 3 + (i % 3), 3, AUT[(i * 3) % 5], CLIFF); base.ellipse(x + 1, y + 1, 2, 1.6, mix(AUT[(i * 3) % 5], hex("#8a7a5a"), 0.3), CLIFF); }
// the lower lake mirroring the falls and the slope, deepening to turquoise toward us
const snap = new Canvas().copy(base);
base.rect(0, LO, W, H, (x, y) => mix(snap.get(x, 2 * LO - y - 1), hex("#6ac8c4"), clamp(0.35 + (y - LO) / 50)), LAKE);
// the boardwalk across the foreground, on posts
const BW = [[0, 92], [62, 84], [120, 96], [192, 88]];
for (let i = 0; i < BW.length - 1; i++) { base.line(BW[i][0], BW[i][1] + 1, BW[i + 1][0], BW[i + 1][1] + 1, "#8a6a4a", 1, WALK); base.line(BW[i][0], BW[i][1], BW[i + 1][0], BW[i + 1][1], "#e8cca0", 1, WALK); }
for (let x = 4; x < W; x += 8) { const i = Math.min(2, Math.floor(x / 64)), u = (x - BW[i][0]) / (BW[i + 1][0] - BW[i][0]), y = lerp(BW[i][1], BW[i + 1][1], u); base.rect(x, y + 2, x + 1, y + 4, "#8a6a4a", WALK); }

balance(base, 0.35);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#eef8f8", "#a9d8dc", "#2a2a2a", "#3a6a4a", "#f2c84a", "#e86a4a", "#3a6aa8"] });

export const meta = {
  slug: "terraced-lakes-falls",
  name: "Terraced Lakes Falls",
  category: "landscapes",
  note: "Turquoise lakes step down through an autumn forest, waterfalls pouring over the mossy lips between them, as walkers cross the wooden boardwalk and leaves drift down.",
  tags: ["plitvice", "lakes", "waterfalls", "autumn", "forest", "boardwalk", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const along = (p) => { const i = Math.min(2, Math.floor(p * 3)), u = p * 3 - i; return [lerp(BW[i][0], BW[i + 1][0], u), lerp(BW[i][1], BW[i + 1][1], u)]; };

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    for (const [x, w, d] of FALLS) falls(f, t, x, x + w, LIP - 1 + d, LO + 1, { c: "#ffffff", c2: "#a9d8dc", speed: 20, only: FALL });
    // white water where the falls land
    for (const [x, w] of FALLS) for (let k = -1; k < w + 2; k++) { f.add(x + k, LO + 1 + Math.round(Math.sin(t * 6 + k) * 0.6), "#ffffff", 0.8, LAKE); f.add(x + k, LO + 2, "#eef8f8", 0.5, LAKE); }
    // walkers along the boardwalk
    for (let i = 0; i < 4; i++) { const [x, y] = along(((t / 40) + i * 0.09) % 1); person(f, x, y - 1, { body: ["#e86a4a", "#3a6aa8", "#f2c84a", "#ffffff"][i], head: "#e8c8a0", step: Math.floor(t * 3 + i) }); }
    // ducks paddling across the lowest lake, a small wake behind each
    for (let i = 0; i < 2; i++) { const x = ((t * 1.6 + i * 70) % (W + 20)) - 10, y = 102 + i * 3; f.rect(x, y - 1, x + 3, y + 1, "#3a6a4a"); f.put(x + 3, y - 2, "#3a6a4a"); f.put(x + 4, y - 2, "#f2c84a"); for (let k = 1; k < 7; k++) f.add(x - k, y + 1 + (k % 2), "#eef8f8", 0.5 * (1 - k / 7), LAKE); }
    // leaves drifting down
    snow(f, t, { n: 40, c: "#f0a068", speed: 4, sway: 3, seed: 3, a: 1 });
    return enc(f);
  };
}
