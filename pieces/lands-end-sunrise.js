/* lands-end-sunrise: sunrise at the land's end where three seas meet, a rock memorial and a towering stone statue on islets offshore, the crowd watching from the shore, hand-built.
 * Painted once: the sunrise sky glowing gold at the horizon, the sun just risen, the sea with the sun's
 * road across it, two rocky islets, one with the pillared memorial hall and its tower, one with the
 * great standing statue on its pedestal, the shore rocks where the crowd stands. Each frame rolls the
 * waves onto the rocks, ferries a boat out to the memorial, moves the crowd, lifts the sun's glow and
 * flies birds across. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, surf, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ISLE = 2, SEA = 3, SHORE = 4;
const HOR = 54, SX = 96;

const base = new Canvas();
base.sky([[0, "#5a6aa8"], [0.5, "#d8a0a8"], [0.85, "#ffc888"], [1, "#fff0c0"]], SKY, 0, HOR + 1);
base.glow(SX, HOR - 4, 6, 40, "#fff4d0", 0.7, SKY);
// the sea, the sun's road across it
base.rect(0, HOR, W, H, (x, y) => { const u = (y - HOR) / 54, road = Math.exp(-((x - SX) ** 2) / (20 + u * 700)); return mix(mix(hex("#d8a8a0"), hex("#6a7aa0"), clamp(u * 1.4)), hex("#fff0c0"), clamp(road * (Math.sin(y * 2.1) > -0.3 ? 0.9 : 0.4))); }, SEA);
// the islets: low rocks
for (const [cx, w, top] of [[50, 30, 60], [140, 22, 62]]) for (let x = cx - w; x <= cx + w; x++) { const y0 = top - Math.max(0, 1 - Math.abs(x - cx) / w) * 4 + fbm(x / 3, cx, 2, 3) * 2; for (let y = Math.floor(y0); y < HOR + 10; y++) base.put(x, y, mix(hex("#7a6a70"), hex("#4a3e48"), clamp((y - y0) / 12)), ISLE); }
// the memorial: a pillared hall, its tiered tower, a smaller shrine beside it
base.rect(36, 48, 66, 58, "#9a8088", ISLE);
for (let x = 37; x < 66; x += 3) base.rect(x, 50, x + 1, 58, "#6a5460", ISLE);
for (let k = 0; k < 4; k++) base.rect(42 + k * 2, 44 - k * 4, 60 - k * 2, 48 - k * 4, k % 2 ? "#8a7078" : "#a08890", ISLE);
base.ellipse(51, 30, 3, 2, "#a08890", ISLE); base.put(51, 27, "#d8a040", ISLE);
base.rect(28, 52, 34, 58, "#8a7078", ISLE); base.poly([[27, 52], [35, 52], [31, 47]], "#8a7078", ISLE);
// the statue: a tall standing figure in robes on a high pedestal, one hand raised
base.rect(134, 50, 146, 62, "#7a6a70", ISLE);
base.rect(136, 24, 144, 50, (x) => mix(hex("#a08890"), hex("#6a5460"), (x - 136) / 8), ISLE);
base.ellipse(140, 20, 3, 4, "#9a8088", ISLE); base.rect(139, 15, 141, 17, "#9a8088", ISLE);
base.line(144, 30, 148, 24, "#8a7078", 2, ISLE); base.rect(147, 21, 149, 24, "#8a7078", ISLE);
// the shore rocks in front, where the crowd stands
for (let x = 0; x < W; x++) { const top = 94 + Math.sin(x / 9) * 2 + fbm(x / 4, 5, 2, 4) * 3; for (let y = Math.floor(top); y < H; y++) base.put(x, y, mix(hex("#8a7a78"), hex("#5a4a4a"), clamp((y - top) / 10 + noise2(x / 2, y / 2, 3) * 0.3)), SHORE); }

balance(base, 0.4);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#fff4d0", "#2a2228", "#f2c84a", "#e86a7a", "#f4f0e8", "#3a6aa8", "#f08a5a"] });

export const meta = {
  slug: "lands-end-sunrise",
  name: "Lands End Sunrise",
  category: "india",
  note: "The sun rises where three seas meet at the land's end, a rock memorial and a towering stone statue on islets offshore as a ferry heads out and the crowd watches from the shore.",
  tags: ["kanyakumari", "sunrise", "memorial", "statue", "three-seas", "tamil-nadu", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the sun's disc just clear of the sea, its glow breathing out as it climbs
    const up = ((t % 40) / 40) * 3;
    f.glow(SX, HOR - 4 - up, 4, 6 + up * 2, "#fff4d0", 0.8, SKY);
    surf(f, t, HOR + 14, 94, { foam: "#f4f0e8", n: 4, period: 5.5, only: SEA, wob: 2 });
    // spray on the islet rocks
    for (const [cx, ph] of [[50, 0], [140, 2.5]]) { const q = ((t + ph) % 5) / 5; if (q > 0.6) for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI, r = (q - 0.6) * 20; f.add(cx + Math.cos(a) * r * 1.6, HOR + 9 - Math.sin(a) * r * 0.6, "#ffffff", (1 - q) * 2); } }
    // the ferry heading out to the memorial and back (30 s)
    const p = (t % 30) / 30, u = p < 0.5 ? p * 2 : 2 - p * 2, x = lerp(110, 64, u), y = lerp(86, 66, u), dir = p < 0.5 ? -1 : 1;
    f.rect(x - 7, y - 1, x + 7, y + 1, "#f4f0e8"); f.rect(x - 5, y - 4, x + 4, y - 1, "#3a6aa8"); f.rect(x - 7, y + 1, x + 7, y + 2, "#2a2228");
    for (let k = 1; k < 12; k++) f.add(x - dir * (7 + k * 1.4), y + 1 + (k % 2), "#ffffff", (1 - k / 12) * 0.5, SEA);
    // the crowd along the shore, shifting and turning
    for (let i = 0; i < 16; i++) { const x = 6 + i * 12 + Math.round(Math.sin(t * 0.3 + i * 2) * 2), y = 97 + (i % 3); person(f, x, y, { body: ["#f08a5a", "#ffffff", "#e86a7a", "#f2c84a", "#3a6aa8"][i % 5], head: "#2a2228", legs: "#2a2228", step: Math.floor(t * 0.8 + i) }); }
    birds(f, t, { n: 6, y: 26, period: 15, c: "#2a2228", only: SKY });
    return enc(f);
  };
}
