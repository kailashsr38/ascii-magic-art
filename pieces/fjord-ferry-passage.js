/* fjord-ferry-passage: a ferry sailing up a deep fjord between vertical cliffs, waterfalls ribboning down and a red farmhouse on a ledge, hand-built.
 * Painted once: the bright sky, cliff walls plunging on both sides fading into blue distance, ribbon
 * waterfalls, a green ledge with a red farmhouse, and the dark still fjord mirroring the walls. Each
 * frame sails the ferry up the fjord with its wake, pours the waterfalls and flies gulls. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, falls, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CLIFF = 2, FALL = 3, LEDGE = 4, FJORD = 5;
const WL = 70;

const base = new Canvas();
base.sky([[0, "#4a8ad8"], [0.7, "#a8cce8"], [1, "#e4ecf0"]], SKY, 0, 40);
// the far end of the fjord: hazy mountains closing it, snow on top
base.ridge({ base: 0.34, amp: 0.08, f: 4, seed: 11, top: "#e8eef4", bot: "#b8c4d8", depth: 10, m: CLIFF });
base.rect(0, 52, W, WL, (x, y) => mix(hex("#b8c4d8"), hex("#9aa8c0"), (y - 52) / 18), CLIFF);
// cliff walls: near ones dark and steep, far ones blue in the haze, meeting toward the middle
for (const [side, depth] of [[-1, 2], [1, 2], [-1, 1], [1, 1], [-1, 0], [1, 0]]) {
  const edge = side < 0 ? [40, 66, 80][2 - depth] : [152, 126, 112][2 - depth], top = [6, 18, 30][2 - depth];
  const c1 = ["#5a6a5a", "#7a8a9a", "#a8b4c8"][2 - depth], c2 = ["#2e3e32", "#5a6a7a", "#8a98b0"][2 - depth];
  for (let x = 0; x < W; x++) {
    const inside = side < 0 ? x < edge + (WL - 20) * 0.1 : x > edge;
    if (!inside) continue;
    const d = side < 0 ? edge - x : x - edge;
    const t0 = top + Math.max(0, 10 - d) * 3 + fbm(x / 7, depth, 3, 4 + depth) * 6;
    for (let y = Math.floor(t0); y < WL; y++) base.put(x, y, mix(mix(hex(c1), hex(c2), clamp((y - t0) / 50)), hex("#ffffff"), y < t0 + 3 && depth === 2 ? 0 : 0), CLIFF);
  }
}
// two ribbon waterfalls down the near walls
for (const x of [24, 168]) base.rect(x, 12, x + 2, WL, "#3a4a42", FALL);
// a green ledge with a red farmhouse partway up the left wall
base.ellipse(30, 40, 12, 2.5, "#7aa85a", LEDGE);
base.rect(26, 33, 34, 39, "#c83a2a", LEDGE); base.poly([[25, 33], [35, 33], [30, 29]], "#4a3a32", LEDGE); base.rect(29, 35, 31, 37, "#ffffff", LEDGE);
// the fjord: dark green-blue, the walls mirrored
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1 + Math.round(Math.sin(y * 0.7 + x * 0.04) * 0.6)), hex("#1e3a4a"), clamp(0.4 + (y - WL) / 60)), FJORD);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#eef6ff", "#a9c8dc", "#c83a2a", "#1e1e2a", "#f4f0e8"] });

export const meta = {
  slug: "fjord-ferry-passage",
  name: "Fjord Ferry Passage",
  category: "landscapes",
  note: "A ferry sails up a deep fjord between plunging cliff walls as ribbon waterfalls pour down them and a red farmhouse clings to a green ledge high above.",
  tags: ["norway", "fjord", "ferry", "cliffs", "waterfall", "nature", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    for (const x of [24, 168]) falls(f, t, x, x + 2, 12, WL + 1, { c: "#ffffff", c2: "#a9c8dc", speed: 24, only: FALL });
    // the ferry coming up the fjord toward the far end, shrinking (24 s)
    const p = (t % 24) / 24, s = lerp(1.3, 0.35, p), x = lerp(70, 98, p), y = lerp(100, 74, p);
    for (let k = 1; k < 16; k++) { const a = (1 - k / 16) * 0.5; f.add(x - k * 0.8 * s, y + k * 1.2 * s, "#f4f0e8", a, FJORD); f.add(x + 12 * s + k * 0.8 * s, y + k * 1.2 * s, "#f4f0e8", a, FJORD); }
    f.rect(x, y - 4 * s, x + 12 * s, y, "#ffffff"); f.rect(x, y - 1 * s, x + 12 * s, y, "#c83a2a");
    f.rect(x + 2 * s, y - 8 * s, x + 9 * s, y - 4 * s, "#f4f0e8"); f.rect(x + 7 * s, y - 11 * s, x + 9 * s, y - 8 * s, "#1e1e2a");
    birds(f, t, { n: 5, y: 26, period: 14, c: "#ffffff", only: [SKY, CLIFF], spread: 1.3 });
    return enc(f);
  };
}
