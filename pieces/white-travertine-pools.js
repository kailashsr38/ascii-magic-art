/* white-travertine-pools: white mineral terraces cascading down a hillside, every pool holding the sky, paragliders drifting over at sunset, hand-built.
 * Painted once: the warm evening sky, the plain far below with its town, and the terraces: rows of
 * scalloped white pools, each holding pale blue water, their walls hung with mineral drips. Each frame
 * trickles water over the lips, wades people through the pools and drifts paragliders across the sky. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, falls, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PLAIN = 2, WALL = 3, POOL = 4;

const base = new Canvas();
base.sky([[0, "#a0bce0"], [0.6, "#e8c0b8"], [1, "#ffd8a8"]], SKY, 0, 34);
base.glow(40, 28, 4, 24, "#fff4d8", 0.6, SKY);
// the plain far below, hazy, with the town's white specks
base.ridge({ base: 0.24, amp: 0.05, f: 3, seed: 4, top: "#7a6a84", bot: "#5e5270", depth: 6, m: PLAIN });
base.rect(0, 32, W, H, (x, y) => mix(hex("#c8b4a8"), hex("#a8a288"), clamp((y - 32) / 30 + fbm(x / 6, y / 2, 2, 3) * 0.3)), PLAIN);
for (let i = 0; i < 40; i++) base.put((i * 47) % W, 33 + ((i * 7) % 9), "#fff4e8", PLAIN);
// the terraces fill a wedge that widens toward us, falling away to the plain on the left
const edge = (y) => 96 - (y - 36) * 1.2;
const R = rng(7), ROWS = [];
for (let i = 0, y = 38; y < H + 6; i++) { ROWS.push(y); y += 4 + i * 1.5; }
for (let r = 0; r < ROWS.length; r++) {
  const y1n = ROWS[r + 1] ?? H + 10;
  for (let x = Math.floor(edge(ROWS[r])) - 6 - Math.floor(R() * 8); x < W; ) {
    const w = 8 + Math.floor(R() * 26) + r * 3, sag = 1 + R() * 2.5 + r * 0.5, y0 = ROWS[r] + Math.round((R() - 0.5) * 3), depth = Math.max(2, (y1n - y0) * 0.35);
    for (let xx = x; xx < x + w; xx++) {
      const u = (xx - x) / w, lip = y0 + Math.sin(u * Math.PI) * sag;
      for (let y = Math.floor(y0 - depth); y < lip; y++) base.put(xx, y, mix(hex("#d8f2fa"), hex("#9ad4ec"), clamp((y - y0 + depth) / depth)), POOL);
      base.put(xx, lip, "#ffffff", WALL);
      for (let y = Math.floor(lip) + 1; y < y1n + 3; y++) {
        const k = (y - lip) / (y1n + 3 - lip), drip = Math.sin(xx * 1.7 + Math.floor(y / 3) * 0.3) * 0.5 + noise2(xx / 1.5, y / 6, 3) * 0.6;
        base.put(xx, y, y - lip < 1.4 ? hex("#9a8494") : mix(hex("#fff6ec"), hex("#e0ccc0"), clamp(drip * 0.5 + k * 0.5)), WALL);
      }
    }
    x += w;
  }
}
// green scrub and rocks along the terraces' edge
for (let y = 38; y < H; y++) { const x = edge(y); for (let k = -6; k < 2; k++) if (noise2((x + k) / 2, y / 2, 5) > 0.35) base.put(x + k - 6, y, mix(hex("#a8b484"), hex("#8a9a6a"), noise2(x, y, 2)), PLAIN); }

balance(base, 0.35);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#2a2a2a", "#f08a5a", "#f2c84a", "#e86a7a", "#3a6aa8", "#e8c8a0", "#c8e8f8"] });

export const meta = {
  slug: "white-travertine-pools",
  name: "White Travertine Pools",
  category: "landscapes",
  note: "White mineral terraces cascade down a hillside, each scalloped pool holding the evening sky, as water trickles over the lips, people wade the pools and paragliders drift overhead.",
  tags: ["pamukkale", "travertine", "terraces", "pools", "turkey", "paragliders", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const TRICKLES = [[82, 2], [104, 3], [126, 2], [150, 3], [172, 2]];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // water trickling over the lips down the white walls
    for (const [x, w] of TRICKLES) for (let r = 2; r < ROWS.length - 1; r += 2) falls(f, t + r, x + r * 3, x + r * 3 + w, ROWS[r] + 1, ROWS[r + 1] - 2, { c: "#ffffff", c2: "#c8e8f8", speed: 10, only: WALL });
    // people wading through the pools, stepping slowly
    for (const [x0, r, c, ph] of [[96, 5, "#f08a5a", 0], [120, 6, "#3a6aa8", 2], [160, 4, "#e86a7a", 4], [140, 7, "#f2c84a", 1]]) {
      const x = x0 + Math.round(Math.sin(t * 0.15 + ph) * 8), y = ROWS[r] - 1;
      if (y > H) continue;
      person(f, x, y, { body: c, head: "#e8c8a0", legs: "#bce4f4", step: Math.floor(t * 1.5 + ph) });
    }
    // paragliders drifting down across the sky, canopies curved over their pilots
    for (let i = 0; i < 3; i++) {
      const p = ((t / 50) + i / 3) % 1, x = lerp(-20, W + 20, p), y = 8 + i * 6 + p * 10 + Math.sin(t * 0.8 + i) * 1;
      const c = ["#f08a5a", "#f2c84a", "#e86a7a"][i];
      for (let k = -4; k <= 4; k++) { f.put(x + k, y - 3 + Math.round((k * k) / 8), c); f.put(x + k, y - 2 + Math.round((k * k) / 8), c); }
      f.line(x - 4, y - 1, x, y + 4, "#2a2a2a", 1); f.line(x + 4, y - 1, x, y + 4, "#2a2a2a", 1); f.rect(x - 1, y + 4, x + 1, y + 6, "#2a2a2a");
    }
    return enc(f);
  };
}
