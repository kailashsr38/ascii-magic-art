/* elephants-at-waterhole: a herd of elephants walking down to a waterhole on the golden savanna, flat-topped acacias behind, hand-built.
 * Painted once: the warm late-afternoon sky, the far blue hills, the long grass plain with its acacias,
 * the waterhole holding the sky, and the bank of trampled earth. Each frame walks the herd across behind
 * the water, swings their trunks, has one at the edge drink and another spray water over its back,
 * drifts clouds and flies birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, puffs, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, PLAIN = 3, TREE = 4, WATER = 5, BANK = 6;
const HOR = 56;

const base = new Canvas();
base.sky([[0, "#6a9ad0"], [0.6, "#e8d0b0"], [1, "#ffe0a8"]], SKY, 0, HOR + 1);
base.ridge({ base: 0.5, amp: 0.05, f: 2, seed: 6, top: "#9aa0b8", bot: "#8a90a8", depth: 8, m: HILL });
// the grass plain, golden, streaked
base.rect(0, HOR, W, H, (x, y) => mix(hex("#f0d090"), hex("#c8a060"), clamp((y - HOR) / 50 + (Math.sin(x * 0.8 + y * 3) > 0.7 ? 0.12 : 0) + fbm(x / 8, y / 3, 2, 5) * 0.2)), PLAIN);
// acacias: thin trunks, flat spreading crowns
for (const [x, y, r] of [[22, HOR + 2, 14], [150, HOR + 1, 10], [178, HOR + 3, 16], [70, HOR, 7]]) {
  base.line(x, y, x - 2, y - r * 0.9, "#3a2e26", 1, TREE); base.line(x, y - r * 0.5, x + r * 0.4, y - r * 0.9, "#3a2e26", 1, TREE);
  for (let k = 0; k < 3; k++) base.ellipse(x - r * 0.3 + k * r * 0.35, y - r * 0.95 - (k === 1 ? 1 : 0), r * 0.55, 1.8, mix(hex("#5a7a3a"), hex("#3a5a2a"), k / 2), TREE);
}
// the waterhole: an oval of sky-blue water, a ring of dark mud around it
for (let y = 74; y < 100; y++) for (let x = 40; x < 170; x++) {
  const d = Math.hypot((x - 104) / 60, (y - 86) / 10) + fbm(x / 10, y / 4, 2, 3) * 0.15;
  if (d < 1.12) base.put(x, y, d < 1 ? mix(hex("#c8dcec"), hex("#8ab0d0"), clamp((y - 76) / 20)) : hex("#8a6a4a"), d < 1 ? WATER : BANK);
}

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#a8a09c", "#7a706c", "#5a5250", "#eef6ff", "#2a2420"] });

export const meta = {
  slug: "elephants-at-waterhole",
  name: "Elephants At Waterhole",
  category: "landscapes",
  note: "Elephants gather at a waterhole on the golden savanna, one drinking and one spraying water over its back, as the rest of the herd walks past under the flat-topped acacias.",
  tags: ["elephants", "savanna", "waterhole", "safari", "acacia", "wildlife", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// an elephant side-on, facing right: body, head, big ear, trunk swinging, four legs stepping
function elephant(f, x, y, s, step, swing, spray, t) {
  const c = "#a8a09c", d = "#7a706c";
  f.ellipse(x, y - 9 * s, 9 * s, 6 * s, c);
  f.ellipse(x - 2 * s, y - 12 * s, 6 * s, 3 * s, "#b8b0aa");
  f.ellipse(x + 9 * s, y - 11 * s, 4 * s, 4.5 * s, c);
  f.ellipse(x + 7 * s, y - 10 * s, 3 * s, 4.5 * s, d);
  const tx = x + 12 * s + swing * s, ty = y - 2 * s;
  f.line(x + 12 * s, y - 9 * s, tx, ty, c, Math.max(1, Math.round(2 * s)));
  f.put(x + 10 * s, y - 12 * s, "#2a2420");
  for (const [lx, ph] of [[-6, 0], [-3, 1], [3, 1], [6, 0]]) { const lift = (step + ph) % 2 ? 1 : 0; f.rect(x + lx * s - s, y - 5 * s, x + lx * s + s, y - lift, lx % 2 ? d : c); }
  f.line(x - 9 * s, y - 9 * s, x - 11 * s, y - 4 * s, d, 1);
  if (spray) for (let k = 0; k < 18; k++) { const a = -1.2 - (k / 18) * 1.8, r = (t * 6 + k * 1.7) % 14; f.add(tx + Math.cos(a) * r, ty - 2 + Math.sin(a) * r * 1.2 + r * r * 0.03, "#eef6ff", 0.8 * (1 - r / 14)); }
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.3, 0.12, 5, "#ffffff", 0.5, "#e8d8d0"], [0.8, 0.2, 4, "#ffffff", 0.4, "#e8d8d0"]], SKY);
    // the herd crossing the plain behind the water, one after another, wrapping round (50 s)
    for (const [i, s, yy] of [[0, 0.8, 76], [1, 0.75, 75], [2, 0.45, 77], [3, 0.8, 76]]) {
      const x = ((t * 4 + i * 26 + 40) % (W + 80)) - 40;
      elephant(f, Math.round(x), yy, s, Math.floor(t * 2 + i), Math.sin(t * 1.6 + i) * 2, false, t);
    }
    // two standing at the water's edge: one dipping its trunk to drink, the other spraying its back (8 s)
    const sp = (t % 8) / 8;
    elephant(f, 60, 92, 1.2, 0, sp < 0.5 ? 1 : 3, sp > 0.55 && sp < 0.95, t);
    elephant(f, 136, 96, 1.1, 0, Math.sin(t * 0.8) * 2 + 2, false, t);
    // ripples spreading from the drinking trunk
    for (let k = 0; k < 20; k++) { const r = ((t * 4) % 12) + 2, a = (k / 20) * Math.PI * 2; f.add(152 + Math.cos(a) * r * 1.8, 92 + Math.sin(a) * r * 0.4, "#ffffff", 0.5 * (1 - r / 14), WATER); }
    birds(f, t, { n: 6, y: 22, period: 17, c: "#2a2420", only: SKY });
    return enc(f);
  };
}
