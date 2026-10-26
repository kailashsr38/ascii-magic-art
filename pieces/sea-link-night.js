/* sea-link-night: a cable-stayed bridge sweeping across the bay at night, its fans of cables lit, headlights and tail lights streaming along the deck, hand-built.
 * Painted once: the night sky with a low glow over the city, the skyline of lit towers along the far
 * shore, the bridge's tall pylons with their fanned cables, the curving deck, and the dark bay holding
 * every light in long broken reflections. Each frame streams the traffic both ways, blinks the
 * aviation lights on the pylons, glides a fishing boat's lamp across the water and drifts the clouds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, clouds, windows, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CITY = 2, BRIDGE = 3, BAY = 4;
const WL = 66;
const deck = (x) => 54 + Math.pow((x - 96) / 120, 2) * 14;
const PYLONS = [62, 132];

const base = new Canvas();
base.sky([[0, "#1a2240"], [0.7, "#3a3a64"], [1, "#8a6a7a"]], SKY, 0, WL + 1);
// the far city: towers of lit windows along the shore
for (let x = 0; x < W; ) {
  const w = 4 + ((x * 7) % 9), h = 6 + ((x * 13) % 22);
  base.rect(x, WL - h, x + w, WL + 1, "#4a4a6a", CITY);
  windows(base, x + 1, WL - h + 1, x + w - 1, WL, { lit: "#ffd27a", dark: "#3a3a5a", gx: 2, gy: 2, on: 0.45, seed: x });
  x += w + 1;
}
// the pylons: tall inverted-Y towers, and the fans of cables from their tops to the deck
for (const px of PYLONS) {
  base.line(px - 4, deck(px), px, 12, "#c8c4d8", 2, BRIDGE); base.line(px + 4, deck(px), px, 12, "#c8c4d8", 2, BRIDGE);
  base.rect(px - 1, 8, px + 1, 14, "#c8c4d8", BRIDGE);
  for (let k = 1; k <= 9; k++) for (const s of [-1, 1]) { const ax = px + s * k * 6.5; base.line(px, 14 + k * 1.5, ax, deck(ax), "#b8b0d0", 1, BRIDGE); }
}
// the deck sweeping across, its edge lit
for (let x = 0; x < W; x++) { base.rect(x, deck(x), x + 1, deck(x) + 2, "#5a5a7a", BRIDGE); base.put(x, deck(x), "#e8e0f0", BRIDGE); }
// the dark bay with long broken reflections of the lights
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => { const src = snap.get(x + Math.round(Math.sin(y * 1.7) * 1.5), 2 * WL - y - 1), lum = (src[0] + src[1] + src[2]) / 765; return mix(hex("#2a2a48"), src, Math.sin(y * 2.3 + x * 0.1) > -0.2 ? clamp(lum * 0.9) : 0.1); }, BAY);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#fff4d8", "#ff8a7a", "#ffd27a", "#ff6a5a", "#8ab0ff", "#e8e0f0"] });

export const meta = {
  slug: "sea-link-night",
  name: "Sea Link Night",
  category: "india",
  note: "A cable-stayed bridge sweeps across the bay at night, its fans of cables lit, as headlights and tail lights stream along the deck past the glittering city towers.",
  tags: ["sea-link", "mumbai", "bridge", "cable-stayed", "night", "traffic", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.4, 0.12, 1.2, "#4a4a6a", 0.5], [0.7, 0.3, 0.2, 1, "#5a4a6a", 0.4]], SKY, 0.6);
    // traffic: white headlights coming toward us on one lane, red tail lights going away on the other
    for (let i = 0; i < 14; i++) {
      const outbound = i % 2 === 0, sp = 14 + (i % 4) * 3, x = outbound ? ((t * sp + i * 29) % (W + 20)) - 10 : W + 10 - ((t * sp + i * 29) % (W + 20));
      const y = deck(x) + (outbound ? 1 : 0), c = outbound ? "#ff8a7a" : "#fff4d8";
      f.put(x, y, c); f.put(x + 1, y, c);
      for (let k = 1; k < 4; k++) f.add(x - (outbound ? k : -k), y, c, 0.5 - k * 0.12);
      f.add(x, WL + (WL - y) + 1, c, 0.35, BAY); f.add(x, WL + (WL - y) + 3, c, 0.2, BAY);
    }
    // aviation lights blinking on the pylon tops
    for (const [i, px] of PYLONS.entries()) if (Math.floor(t * 1.2 + i * 0.5) % 2 === 0) { f.glow(px, 7, 0, 3, "#ff6a5a", 0.6); f.put(px, 7, "#ff8a7a"); }
    // a fishing boat's lamp gliding across the bay, its light trailing in the water
    const bx = W + 10 - ((t * 3) % (W + 20)), by = 92;
    f.rect(bx - 4, by, bx + 4, by + 1, "#3a3a5a"); f.put(bx, by - 2, "#ffd27a"); f.glow(bx, by - 2, 0, 3, "#ffd27a", 0.5);
    for (let k = 1; k < 10; k++) f.add(bx + (Math.sin(k * 2) * 1), by + 1 + k, "#ffd27a", 0.4 * (1 - k / 10), BAY);
    return enc(f);
  };
}
