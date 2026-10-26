/* himalayan-flower-valley: a high alpine meadow thick with wildflowers below snow peaks, a stream running through and trekkers on the trail, hand-built.
 * Painted once: the deep blue mountain sky, the snow peaks with their glaciers, the dark fir slopes, and
 * the meadow sloping down to us spread with pink, yellow, blue and white flowers, the stream winding
 * through it. Each frame runs the stream, drifts the clouds over the peaks, flutters butterflies over
 * the flowers, walks trekkers up the trail and sways the flower heads. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, person, pine, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PEAK = 2, FIR = 3, MEADOW = 4, STREAM = 5, TRAIL = 6;

const base = new Canvas();
base.sky([[0, "#4a7ac8"], [0.7, "#9ac0e4"], [1, "#d8e8f4"]], SKY, 0, 50);
// snow peaks: white faces, blue shadow sides, rock showing below the snow line
const pk = base.ridge({ base: 0.44, amp: 0.36, f: 3, seed: 7, top: "#ffffff", bot: "#c8d4e4", depth: 16, m: PEAK });
for (let x = 1; x < W - 1; x++) for (let y = Math.floor(pk[x]); y < 56; y++) {
  const xs = Math.max(1, Math.min(W - 2, Math.round(x - (y - pk[x]) * 0.7))), slope = pk[xs + 1] - pk[xs - 1], rock = y > 42 + noise2(x / 3, y / 4, 3) * 8, shade = clamp(0.5 + slope * 0.8);
  base.put(x, y, rock ? mix(hex("#9a9aa8"), hex("#7a7a8a"), noise2(x / 2, y / 2, 5)) : mix(mix(hex("#ffffff"), hex("#a8bcd8"), shade), hex("#d8e4f0"), clamp((y - pk[x]) / 30)), PEAK);
}
// the fir slopes on either side, dark
for (const [x0, x1, dir] of [[0, 70, 1], [130, W, -1]]) for (let x = x0; x < x1; x++) {
  const u = dir > 0 ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0), top = 44 + u * 20;
  for (let y = Math.floor(top); y < 70; y++) base.put(x, y, mix(hex("#5a7a5e"), hex("#46664e"), noise2(x / 2, y / 2, 4)), FIR);
}
for (let i = 0; i < 26; i++) { const x = i < 13 ? i * 5 + 2 : 130 + (i - 13) * 5 + 2, u = i < 13 ? i / 13 : 1 - (i - 13) / 13; pine(base, x, 46 + u * 20, 8 + (i % 3) * 2, "#3a5a44", FIR); }
// the meadow: green sloping down to us, sprinkled with flowers that grow bigger toward the front
const COLS = ["#f8a8c8", "#f8e070", "#a8c0f8", "#ffffff", "#f8b8a0", "#d0b0f0"].map(hex);
base.rect(0, 56, W, H, (x, y) => mix(hex("#a8cc78"), hex("#6a9a50"), clamp((y - 56) / 60 + fbm(x / 8, y / 4, 2, 3) * 0.3)), MEADOW);
for (let i = 0; i < 900; i++) {
  const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * W, y = 58 + Math.pow(Math.sin(i * 78.233) * 0.5 + 0.5, 0.7) * 50, c = COLS[Math.floor(fbm(x / 20, y / 10, 2, 9) * 6 + (i % 2)) % 6];
  base.put(x, y, c, MEADOW); if (y > 80) base.put(x + 1, y, c, MEADOW); if (y > 94) { base.put(x, y - 1, c, MEADOW); base.put(x + 1, y - 1, c, MEADOW); }
}
// the stream winding down from the glacier, and the trail beside it
const sx = (y) => 100 + Math.sin(y / 7) * 10 + (y - 56) * 0.9;
for (let y = 56; y < H; y++) { const w = 1 + (y - 56) * 0.07; base.rect(sx(y) - w, y, sx(y) + w, y + 1, "#a8d4ec", STREAM); }
const tx = (y) => 70 - Math.sin(y / 9) * 8 - (y - 60) * 0.7;
for (let y = 60; y < H; y++) { const w = 0.5 + (y - 60) * 0.05; base.rect(tx(y) - w, y, tx(y) + w, y + 1, "#d8c8a8", TRAIL); }

balance(base, 0.4);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#2a2a2a", "#e86a4a", "#3a6aa8", "#f2c84a", "#e8c8a0", "#f8a8c8", "#a8c0f8", "#f8e070"] });

export const meta = {
  slug: "himalayan-flower-valley",
  name: "Himalayan Flower Valley",
  category: "india",
  note: "A high alpine meadow thick with pink, yellow, blue and white wildflowers runs down from the snow peaks, a glacier stream winding through it as trekkers climb the trail and butterflies flutter.",
  tags: ["valley-of-flowers", "himalaya", "uttarakhand", "meadow", "wildflowers", "trek", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.2, 0.14, 5, "#ffffff", 0.6, "#dce4f0"], [0.65, 0.08, 6, "#ffffff", 0.45, "#dce4f0"]], SKY);
    // the stream running: bright flecks travelling down it
    for (let y = 56; y < H; y++) { const s = Math.sin((y - t * 10) * 0.7) * 0.5 + 0.5; if (s > 0.7) f.add(sx(y) + Math.sin(y * 3) * 0.5, y, "#ffffff", 0.85, STREAM); }
    // trekkers climbing the trail, packs on (40 s)
    for (let i = 0; i < 3; i++) { const p = ((t / 40) + i * 0.06) % 1, y = Math.round(lerp(H - 2, 62, p)); person(f, tx(y), y, { body: ["#e86a4a", "#3a6aa8", "#f2c84a"][i], head: "#e8c8a0", step: Math.floor(t * 2 + i) }); f.put(tx(y) + 1, y - 2, "#2a2a2a"); }
    // butterflies fluttering over the flowers
    for (let i = 0; i < 6; i++) { const x = 30 + i * 28 + Math.sin(t * 0.7 + i * 2) * 10, y = 80 + Math.sin(t * 1.1 + i) * 8 + (i % 3) * 6, open = Math.sin(t * 14 + i) > 0, c = ["#f8e070", "#ffffff", "#f8a8c8"][i % 3]; f.put(x, y, "#2a2a2a"); if (open) { f.put(x - 1, y - 1, c); f.put(x + 1, y - 1, c); } else { f.put(x - 1, y, c); f.put(x + 1, y, c); } }
    // the nearest flower heads swaying
    for (let x = 2; x < W; x += 5) { const y = 104 - (x * 3) % 6, sw = Math.round(Math.sin(t * 1.4 + x * 0.2)), c = ["#f8a8c8", "#f8e070", "#a8c0f8", "#ffffff"][x % 4]; f.line(x, H, x + sw, y, "#5a8a44", 1); f.rect(x + sw - 1, y - 2, x + sw + 1, y, c); }
    return enc(f);
  };
}
