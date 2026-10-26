/* amber-fort-elephants: the honey-coloured hill fort above its lake, painted elephants climbing the ramp to the gate, hand-built.
 * Painted once: the warm morning sky, the dry hills with the long wall snaking over their crests, the
 * fort's palace tiers with jharokha windows and domed chhatris, the walled ramp, the lake with its
 * geometric island garden, the fort mirrored. Each frame walks the elephants up the ramp, rows a boat
 * across the lake, flutters the flags and wheels the kites overhead. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, flag, dome, windows, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, WALL = 3, FORT = 4, RAMP = 5, SHORE = 6, LAKE = 7, GARDEN = 8;
const WL = 82;

const base = new Canvas();
base.sky([[0, "#6aa4dc"], [0.6, "#c8dcec"], [1, "#fff0d4"]], SKY, 0, 60);
// the dry Aravalli hills, the old wall riding their crests with its towers
const far = base.ridge({ base: 0.3, amp: 0.1, f: 3, seed: 8, top: "#e0d4b0", bot: "#c8bc94", depth: 20, m: HILL });
for (let x = 0; x < W; x++) { const y = Math.floor(far[x]); base.rect(x, y - 2, x + 1, y + 1, "#e0cc98", WALL); if (x % 4 === 0) base.put(x, y - 3, "#e0cc98", WALL); }
for (const x of [14, 46, 170]) { const y = Math.floor(far[x]); base.rect(x - 2, y - 6, x + 3, y + 1, "#d8c088", WALL); }
const near = base.ridge({ base: 0.5, amp: 0.1, f: 2.4, seed: 3, top: "#d0c494", bot: "#b0a478", depth: 40, m: HILL });
for (let x = 0; x < W; x++) { const y = Math.floor(near[x]); if (x < 40 || x > 158) { base.rect(x, y - 2, x + 1, y + 1, "#d8c088", WALL); if (x % 4 === 0) base.put(x, y - 3, "#d8c088", WALL); } }
// the fort: tiers of palace climbing the hill, parapets catching the light, rows of windows
for (const [x0, x1, y0, y1, c] of [[46, 152, 54, 78, "#e8c890"], [56, 142, 43, 56, "#f0d49c"], [68, 130, 33, 45, "#f4dcac"], [82, 116, 25, 35, "#f8e4bc"]]) {
  base.rect(x0, y0, x1, y1, (x, y) => mix(hex(c), hex("#b48c5e"), clamp(((y - y0) / (y1 - y0)) * 0.45 + (x - x0) / (x1 - x0) * 0.25)), FORT);
  base.rect(x0, y0, x1, y0 + 1, "#fff4dc", FORT);
  windows(base, x0 + 3, y0 + 4, x1 - 3, y1 - 3, { lit: "#6a4a32", dark: "#8a6a48", gx: 5, gy: 5, on: 0.75, seed: x0, w: 2, h: 2 });
}
for (const x of [46, 152]) base.rect(x - 4, 50, x + 4, 78, (xx, y) => mix(hex("#f0d49c"), hex("#a8845a"), clamp((xx - x + 4) / 8 * 0.5 + (y - 50) / 60)), FORT);
// domed chhatris on the roofs: pillared pavilions with white domes
for (const [cx, by, r] of [[90, 25, 4], [99, 23, 5], [108, 25, 4], [68, 33, 3], [130, 33, 3], [56, 43, 3], [142, 43, 3], [46, 50, 4], [152, 50, 4]]) {
  base.rect(cx - r + 1, by, cx + r, by + 3, "#e8cc98", FORT);
  for (let x = cx - r + 2; x < cx + r - 1; x += 2) base.rect(x, by + 1, x + 1, by + 3, "#7a5a3a", FORT);
  dome(base, cx, by, r, { c: "#fffaf0", shade: "#d0b088", finial: "#c89a40", m: FORT });
}
// the walled ramp zigzagging up from the shore to the gate
const PATH = [[2, 80], [44, 74], [22, 68], [50, 62]];
for (let i = 0; i < PATH.length - 1; i++) {
  base.line(PATH[i][0], PATH[i][1] + 2, PATH[i + 1][0], PATH[i + 1][1] + 2, "#a8885a", 2, RAMP);
  base.line(PATH[i][0], PATH[i][1], PATH[i + 1][0], PATH[i + 1][1], "#ead2a0", 2, RAMP);
}
base.rect(50, 58, 56, 64, "#6a4a32", RAMP);
// the shore, then the lake mirroring the fort
base.rect(0, 78, W, WL, (x, y) => mix(hex("#c8b080"), hex("#a08a60"), (y - 78) / 4), SHORE);
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1), hex("#a8c4c4"), clamp(0.3 + (y - WL) / 80)), LAKE);
// the island garden: a walled terrace with star-shaped beds
base.rect(118, 90, 178, 100, "#e0c890", GARDEN); base.rect(118, 99, 178, 101, "#a8885a", GARDEN);
for (let k = 0; k < 5; k++) { const cx = 124 + k * 12; base.poly([[cx, 91], [cx + 4, 95], [cx, 99], [cx - 4, 95]], "#6a9a4a", GARDEN); base.put(cx, 95, "#f2c84a", GARDEN); }

balance(base, 0.35);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#c8b0b0", "#8a7470", "#f08a64", "#f2c84a", "#f4f0e8", "#e85a4a", "#2a2620"] });

export const meta = {
  slug: "amber-fort-elephants",
  name: "Amber Fort Elephants",
  category: "india",
  note: "Painted elephants climb the walled ramp to a honey-coloured hill fort as a boat rows across the lake below, the old wall snaking over the hills and kites wheeling overhead.",
  tags: ["amber-fort", "jaipur", "rajasthan", "fort", "elephants", "india", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a point along the ramp, and which way it is heading
function along(p) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < PATH.length - 1; i++) { const d = Math.hypot(PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]); seg.push(d); total += d; }
  let s = p * total;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i]) { const u = s / seg[i], a = PATH[i], b = PATH[i + 1]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.sign(b[0] - a[0])]; }
    s -= seg[i];
  }
  return [PATH[3][0], PATH[3][1], 1];
}

// an elephant side-on: grey body, trunk, a red saddle cloth, a yellow howdah, the mahout on its neck
function elephant(f, x, y, dir, step) {
  const sk = "#a8908c";
  f.ellipse(x, y - 4, 4, 2.6, sk);
  f.ellipse(x + dir * 4, y - 5, 2, 2, sk);
  for (let k = 0; k < 4; k++) f.put(x + dir * (5 + (k > 2 ? 1 : 0)), y - 4 + k, sk);
  for (const [lx, ph] of [[-3, 0], [-1, 1], [2, 0], [3, 1]]) f.rect(x + lx, y - 2, x + lx + 1, y + ((step + ph) % 2 ? 0 : 1), sk);
  f.rect(x - 3, y - 7, x + 3, y - 4, "#e85a4a"); f.rect(x - 3, y - 4, x + 3, y - 3, "#f2c84a");
  f.rect(x - 2, y - 10, x + 2, y - 7, "#f2c84a"); f.rect(x - 2, y - 11, x + 2, y - 10, "#f08a64");
  f.put(x + dir * 3, y - 8, "#f4f0e8"); f.put(x + dir * 3, y - 9, "#f08a64");
  f.put(x + dir * 5, y - 5, "#f4f0e8");
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // three elephants plodding up the ramp, one behind the other (40 s)
    for (let i = 0; i < 3; i++) {
      const p = ((t / 40 + i * 0.13) % 1);
      const [x, y, dir] = along(p);
      elephant(f, Math.round(x), Math.round(y), dir, Math.floor(t * 2 + i));
    }
    // a boat rowing across the lake, its wake spreading behind (26 s)
    const bx = lerp(-12, W + 12, (t % 26) / 26), by = 94, ow = Math.sin(t * 3) > 0 ? 1 : 0;
    for (let k = 1; k < 14; k++) { f.add(bx - k * 1.6, by + k * 0.3, "#f4f0e8", (1 - k / 14) * 0.45, LAKE); f.add(bx - k * 1.6, by - k * 0.3 + 1, "#f4f0e8", (1 - k / 14) * 0.3, LAKE); }
    f.rect(bx - 5, by - 1, bx + 5, by + 1, "#6a4a32"); f.put(bx, by - 2, "#f4f0e8"); f.put(bx, by - 3, "#e85a4a");
    f.line(bx - 3, by - 2 + ow, bx + 3, by - ow, "#2a2620", 1);
    // flags on the high pavilions
    flag(f, t, 99, 13, 6, 3, "#f08a64", { pole: "#6a4a32", c2: "#f2c84a" });
    flag(f, t + 1.3, 46, 40, 5, 3, "#f08a64", { pole: "#6a4a32", c2: "#f2c84a" });
    // kites wheeling over the fort on a thermal
    for (let i = 0; i < 3; i++) {
      const a = t * 0.5 + i * 2.1, x = 100 + Math.cos(a) * (22 + i * 8), y = 12 + Math.sin(a) * 4 + i * 2, up = Math.sin(t * 2 + i) > 0.6;
      f.put(x, y, "#2a2620"); f.put(x - 1, y - (up ? 1 : 0), "#2a2620"); f.put(x + 1, y - (up ? 1 : 0), "#2a2620"); f.put(x - 2, y, "#2a2620"); f.put(x + 2, y, "#2a2620");
    }
    return enc(f);
  };
}
