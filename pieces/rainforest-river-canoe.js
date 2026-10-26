/* rainforest-river-canoe: a dugout canoe gliding down a wide jungle river at morning, giant trees and hanging vines on the banks, macaws flying over, hand-built.
 * Painted once: the bright hazy sky, the walls of rainforest on both banks with emergent giants rising
 * above the canopy, vines hanging to the water, and the broad tea-brown river mirroring it all. Each
 * frame paddles the canoe downstream with its wake, flies a pair of macaws across, drifts the morning
 * mist off the water and swings a monkey on a vine. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, JUNGLE = 2, RIVER = 3;
const WL = 66, VX = 100;

const base = new Canvas();
base.sky([[0, "#8ab4d8"], [0.7, "#d8e4e4"], [1, "#eef2e8"]], SKY, 0, WL + 1);
// the forest walls: rounded crowns heaped on each other, lighter and bluer into the distance
const canopy = (x) => { const d = Math.abs(x - VX) / VX; return WL - 6 - d * 42 - fbm(x / 6, 1, 3, 3) * 6 - Math.abs(Math.sin(x / 5.5)) * 4 * d; };
for (let x = 0; x < W; x++) {
  const top = canopy(x), d = Math.abs(x - VX) / VX;
  for (let y = Math.floor(top); y < WL + 1; y++) {
    const n = noise2(x / 2.5, y / 2.5, 4), crown = fbm(x / 4, y / 4, 3, 6);
    base.put(x, y, mix(mix(hex("#a8cc78"), hex("#4a7a44"), clamp(crown * 1.2 + (n > 0.62 ? 0.4 : 0))), hex("#c8dcd0"), clamp(0.6 - d)), JUNGLE);
  }
}
// emergent giants: tall pale trunks with umbrella crowns above the canopy
for (const [x, top] of [[18, 6], [44, 16], [168, 10], [186, 4]]) {
  base.rect(x, top + 4, x + 2, canopy(x) + 6, "#d8ccb8", JUNGLE);
  for (let k = 0; k < 4; k++) base.ellipse(x - 6 + k * 4, top + 2 + (k % 2), 5, 3, k % 2 ? "#6a9a4a" : "#8ab860", JUNGLE);
}
// vines hanging to the water from the near crowns
for (const x of [8, 26, 34, 58, 150, 162, 178]) { const top = canopy(x) + 4; for (let y = top; y < WL + 2; y++) base.put(x + Math.sin(y / 4) * 0.8, y, "#3a5a32", JUNGLE); }
// the river, tea-brown, mirroring the forest
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1), hex("#b89a74"), clamp(0.45 + (y - WL) / 60)), RIVER);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#2a2420", "#5a3a28", "#e85a4a", "#3a7ad8", "#f2c84a", "#e8c8a0", "#f4f0e8"] });

export const meta = {
  slug: "rainforest-river-canoe",
  name: "Rainforest River Canoe",
  category: "landscapes",
  note: "A dugout canoe glides down a wide tea-brown river between walls of rainforest at morning as macaws fly over, the mist lifts off the water and a monkey swings on a vine.",
  tags: ["amazon", "rainforest", "river", "canoe", "macaws", "jungle", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: WL - 8, y1: WL + 10, c: "#f4f0e8", a: 0.6, speed: 0.05, scale: 22, cut: 0.38 });
    // the canoe coming down the river toward us, two paddlers stroking (30 s)
    const p = ((t + 8) % 30) / 30, s = lerp(0.5, 1.6, p), x = lerp(VX + 6, 60, p), y = lerp(WL + 4, 100, p), dip = Math.sin(t * 4);
    for (let k = 1; k < 16; k++) { f.add(x - 10 * s - k * 0.6, y - k * 0.8 * s * 0.4, "#f4f0e8", (1 - k / 16) * 0.5, RIVER); f.add(x + 10 * s + k * 0.6, y - k * 0.8 * s * 0.4, "#f4f0e8", (1 - k / 16) * 0.5, RIVER); }
    f.rect(x - 10 * s, y - 1.5 * s, x + 10 * s, y, "#5a3a28");
    for (const [dx, c] of [[-4, "#e85a4a"], [4, "#f2c84a"]]) {
      f.rect(x + dx * s - s, y - 5 * s, x + dx * s + s, y - 1.5 * s, c); f.rect(x + dx * s - s * 0.8, y - 7 * s, x + dx * s + s * 0.8, y - 5 * s, "#e8c8a0");
      f.line(x + dx * s + s, y - 4 * s, x + dx * s + 3 * s, y + dip * 2 * s, "#2a2420", 1);
    }
    // a pair of macaws flying across, long tails, red and blue (14 s)
    for (let i = 0; i < 2; i++) {
      const mx = lerp(-10, W + 10, ((t / 14) + i * 0.04) % 1), my = 16 + i * 4 + Math.sin(t * 2 + i) * 2, up = Math.sin(t * 10 + i) > 0;
      const c = i ? "#3a7ad8" : "#e85a4a";
      f.rect(mx, my, mx + 3, my + 1, c); f.line(mx - 1, my + 1, mx - 5, my + 3, c, 1); f.put(mx + 3, my - 1, "#f2c84a");
      f.line(mx + 1, my, mx - 1, my + (up ? -4 : 3), c, 1);
    }
    // a monkey swinging on a vine from the left bank
    const sw = Math.sin(t * 1.4) * 0.6, vx = 26 + Math.sin(sw) * 16, vy = canopy(26) + 4 + Math.cos(sw) * 16;
    f.line(26, canopy(26) + 4, vx, vy, "#3a5a32", 1); f.ellipse(vx, vy + 2, 1.6, 2, "#5a3a28"); f.put(vx, vy, "#5a3a28"); f.line(vx, vy + 3, vx + 3, vy + 5, "#5a3a28", 1);
    return enc(f);
  };
}
