/* alpine-lake-village: a village of painted houses and a white spire on a still mountain lake, hand-built.
 * Painted once: the sky, steep wooded mountains plunging into the lake, the village of tall houses with
 * dark roofs along the shore, the church with its needle spire, all mirrored in the water. Each frame
 * adds a wooden boat rowing across with its ripples, swans, mist on the slopes and birds. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, VILL = 3, LAKE = 4;
const WL = 74;

const base = new Canvas();
base.sky([[0, "#7aa8d4"], [0.7, "#c8dcec"], [1, "#eef2f0"]], SKY, 0, 40);
// steep mountains: snowy far summit, dark forested near slopes
base.ridge({ base: 0.32, amp: 0.2, f: 2.2, seed: 6, top: "#f4f6f8", bot: "#9aa8b8", depth: 12, m: MTN });
for (let x = 0; x < W; x++) {
  const top = 20 + Math.pow(Math.abs(x - 100) / 100, 0.7) * -14 + 34 + fbm(x / 9, 2, 3, 3) * 10 - (x < 60 ? (60 - x) * 0.5 : 0);
  for (let y = Math.floor(top); y < WL; y++) {
    const n = fbm(x / 4, y / 4, 4, 8);
    base.put(x, y, mix(mix(hex("#6a8a6a"), hex("#2e4a36"), clamp((y - top) / 30)), hex("#1e3a2a"), clamp(n - 0.5) * 1.5), MTN);
  }
}
// the village along the shore: tall narrow houses, white and ochre and pink, dark steep roofs
const R = rng(8), COLS = ["#fffaf2", "#f4dcb0", "#f0c8b8", "#e8e4d8", "#f8e8a8"];
for (let x = 30; x < 170; ) {
  const w = 6 + Math.floor(R() * 5), h = 8 + Math.floor(R() * 8), y = WL - Math.floor(R() * 4) - (x < 70 ? (70 - x) * 0.25 : 0);
  const c = hex(COLS[Math.floor(R() * COLS.length)]);
  base.rect(x, y - h, x + w, WL + 1, (xx) => mix(c, hex("#8a8a90"), clamp((xx - x) / w * 0.5)), VILL);
  base.poly([[x - 1, y - h], [x + w + 1, y - h], [x + w / 2, y - h - 5]], (xx) => mix(hex("#5a4a48"), hex("#2a2428"), clamp((xx - x) / w)), VILL);
  for (let yy = y - h + 2; yy < WL - 2; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) base.put(xx, yy, "#4a4048", VILL);
  x += w + (R() < 0.2 ? 2 : 0);
}
// the church: white tower and needle spire
base.rect(118, 44, 125, WL - 6, (x) => mix(hex("#ffffff"), hex("#b8b8c0"), clamp((x - 118) / 7)), VILL);
base.poly([[117, 44], [126, 44], [121.5, 22]], (x) => mix(hex("#6a6a7a"), hex("#3a3a48"), clamp((x - 117) / 9)), VILL);
base.rect(120, 49, 123, 53, "#3a3040", VILL);
// the lake: a near-perfect mirror, a touch darker
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1 + Math.round(Math.sin(y * 0.7 + x * 0.03) * 0.6)), hex("#2e4a5a"), clamp(0.3 + (y - WL) / 90)), LAKE);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#5a3a2a", "#1e1e28", "#e8eef0", "#f4f0e8"] });

export const meta = {
  slug: "alpine-lake-village",
  name: "Alpine Lake Village",
  category: "cities",
  note: "Painted houses and a white needle spire line a still mountain lake, mirrored perfectly as a wooden boat rows across and swans glide by.",
  tags: ["hallstatt", "austria", "alps", "lake", "village", "reflection", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 36, y1: 58, c: "#f4f0e8", a: 0.45, speed: 0.04, scale: 26, cut: 0.5 });
    // a wooden boat rowing across, rings of ripples behind
    const x = across(t, 3.5, 0.2), y = 90, stroke = Math.sin(t * 2.2);
    for (let k = 1; k < 4; k++) { const r = ((t * 2 + k * 3) % 9) + 2; for (let a = 0; a < 20; a++) f.add(x - 8 - k * 3 + Math.cos(a) * r, y + Math.sin(a) * r * 0.25, "#e8eef0", 0.25 * (1 - r / 11), LAKE); }
    f.rect(x - 7, y - 1, x + 8, y + 1, "#5a3a2a"); f.put(x + 8, y - 2, "#5a3a2a");
    f.rect(x - 1, y - 5, x + 1, y - 1, "#e84a3a"); f.put(x, y - 6, "#f0d0b0");
    f.line(x - 1, y - 3, x - 6 - stroke * 2, y + 2, "#1e1e28", 1); f.line(x + 1, y - 3, x + 6 + stroke * 2, y + 2, "#1e1e28", 1);
    for (const [ph, yy] of [[0.5, 100], [0.58, 103]]) { const sx = across(t, 1.5, ph); f.rect(sx, yy - 1, sx + 4, yy + 1, "#ffffff"); f.rect(sx + 4, yy - 4, sx + 5, yy - 1, "#ffffff"); }
    birds(f, t, { n: 4, y: 14, period: 17, c: "#1e1e28", only: SKY });
    return enc(f);
  };
}
