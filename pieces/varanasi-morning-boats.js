/* varanasi-morning-boats: rowing boats on the river at sunrise below the ghats, temples stacked up the bank, gulls in the mist, hand-built.
 * Painted once: the hazy sunrise sky and sun, the long stepped ghats with their palaces, temples and
 * spires stacked up the bank, the steps down to the water, the river with the sun's path. Each frame rows
 * the wooden boats across, flies gulls low over the water, drifts mist and adds bathers at the steps. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, across, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, GHAT = 2, RIVER = 3;
const WL = 70;

const base = new Canvas();
base.sky([[0, "#c8a8b8"], [0.6, "#f4c8a8"], [1, "#ffe0c0"]], SKY, 0, 50);
base.glow(150, 30, 6, 30, "#fff4d8", 0.65, SKY);
// the ghats: tall buildings stacked up the bank, every one a different faded colour, temple spires among them
const R = rng(27), COLS = ["#f4d8b8", "#e8b8a0", "#f0e0c8", "#e8c8a8", "#d8a890", "#f8e8c8", "#c8a8a0"];
for (let x = -4; x < W; ) {
  const w = 8 + Math.floor(R() * 12), h = 14 + Math.floor(R() * 22), c = hex(COLS[Math.floor(R() * COLS.length)]);
  const y0 = 56 - h;
  base.rect(x, y0, x + w, 58, (xx) => mix(c, hex("#8a7078"), clamp((xx - x) / w * 0.6)), GHAT);
  for (let yy = y0 + 3; yy < 54; yy += 5) for (let xx = x + 2; xx < x + w - 2; xx += 4) base.rect(xx, yy, xx + 2, yy + 3, "#6a5058", GHAT);
  if (R() < 0.35) { const sx = x + w / 2; for (let k = 0; k < 10; k++) base.rect(sx - (5 - k * 0.5), y0 - k, sx + (5 - k * 0.5) + 1, y0 - k + 1, mix(c, hex("#c8784a"), 0.3), GHAT); }
  if (R() < 0.3) base.rect(x + 1, y0 - 2, x + w - 1, y0, "#d8784a", GHAT);
  x += w;
}
// the steps running down to the water, umbrellas on the landings
for (let y = 58; y < WL; y++) base.rect(0, y, W, y + 1, (x) => mix(hex("#e8d4bc"), hex("#a8988a"), (y % 2) * 0.35 + noise2(x / 4, y, 3) * 0.1), GHAT);
for (let x = 10; x < W; x += 26) { base.line(x, 58, x, 63, "#5a4a42", 1, GHAT); base.ellipse(x, 57, 6, 2, "#c8a878", GHAT); }
// the river, wide and milky in the haze, the sun's path on it
base.rect(0, WL, W, H, (x, y) => {
  const u = (y - WL) / (H - WL), path = Math.exp(-((x - 150) ** 2) / (40 + u * 900));
  return mix(mix(hex("#e8c8b8"), hex("#8a8090"), clamp(u)), hex("#fff0d0"), clamp(path * 0.8 + (Math.sin(y * 2 + Math.sin(x * 0.18) * 2) > 0.68 ? 0.1 : 0)));
}, RIVER);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#1e1818", "#ffffff", "#e84a3a", "#f2c84a", "#5a3a2a", "#e8c8a8"] });

export const meta = {
  slug: "varanasi-morning-boats",
  name: "Varanasi Morning Boats",
  category: "india",
  note: "Wooden rowing boats cross the misty river at sunrise below the ghats, temples and palaces stacked up the bank as gulls skim the water and bathers step down.",
  tags: ["varanasi", "ganges", "ghats", "boats", "sunrise", "gulls", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

function rowboat(f, x, y, dir, t, s) {
  for (let i = -Math.round(12 * s); i <= 12 * s; i++) { const lift = Math.pow(Math.abs(i) / (12 * s), 3) * 2 * s; f.rect(x + i, y - lift, x + i + 1, y + 2 * s - lift * 0.5, "#5a3a2a"); }
  const st = Math.sin(t * 1.6);
  for (const [px, c] of [[-4 * s, "#e84a3a"], [2 * s, "#f2c84a"]]) { f.rect(x + px, y - 4 * s, x + px + 1.5 * s, y, c); f.put(x + px, y - 5 * s, "#e8c8a8"); }
  f.line(x - dir * 2 * s, y - 2 * s, x - dir * (2 + st * 4) * s, y + 4 * s, "#1e1818", 1);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 66, y1: 90, c: "#fff0e0", a: 0.5, speed: 0.05, scale: 28, cut: 0.45 });
    rowboat(f, across(t, 3, 0.1), 84, 1, t, 1);
    rowboat(f, W - across(t, 2.2, 0.55), 96, -1, t + 1, 1.3);
    rowboat(f, across(t, 1.8, 0.8), 76, 1, t + 2, 0.7);
    // gulls skimming low over the water in a loose flock
    for (let i = 0; i < 9; i++) {
      const x = ((t * 11 + i * 13) % (W + 40)) - 20, y = 74 + (i % 3) * 4 + Math.sin(t * 2 + i) * 2, up = Math.sin(t * 8 + i) > 0;
      f.put(x, y, "#ffffff"); f.put(x - 1, y - (up ? 1 : 0), "#ffffff"); f.put(x + 1, y - (up ? 1 : 0), "#ffffff");
    }
    for (const [x, c] of [[40, "#f2c84a"], [96, "#e84a3a"], [140, "#ffffff"]]) person(f, x + Math.round(Math.sin(t * 0.3 + x) * 2), 68, { body: c, head: "#c89a7a" });
    return enc(f);
  };
}
