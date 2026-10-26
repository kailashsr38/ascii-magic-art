/* black-sand-falls: a tall waterfall pouring off a green cliff onto a black sand plain under a pale northern sky, hand-built.
 * Painted once: the pale sky, the mossy cliff with its dark rock face and the notch the river pours
 * through, the black sand plain and the braided river crossing it. Each frame pours the water and its
 * spray, walks a hiker toward the falls and flies fulmars along the cliff. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, falls, mist, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CLIFF = 2, FALL = 3, SAND = 4, RIVER = 5;
const TOP = 20, FOOT = 78, FX = 104, FW = 10;

const base = new Canvas();
base.sky([[0, "#a8b8cc"], [0.7, "#d8e0e8"], [1, "#eef0f0"]], SKY, 0, TOP + 10);
// the cliff: a long green-topped wall of dark basalt, deeply grooved
for (let x = 0; x < W; x++) {
  const top = TOP + fbm(x / 12, 1, 3, 4) * 8 + (x < 20 ? (20 - x) * 0.6 : 0) + (x > 170 ? (x - 170) * 0.8 : 0);
  for (let y = Math.floor(top); y < FOOT; y++) {
    const d = y - top, groove = Math.sin(x * 0.9 + noise2(x / 6, y / 8, 3) * 3) > 0.4 ? 0.2 : 0;
    const moss = d < 5 + fbm(x / 4, y / 4, 2, 7) * 6;
    base.put(x, y, moss ? mix(hex("#a8c070"), hex("#5a7a42"), clamp(d / 8)) : mix(hex("#6a6a72"), hex("#2e2e36"), clamp(groove + d / 90 + noise2(x / 3, y / 3, 8) * 0.25)), CLIFF);
  }
}
// the notch where the river leaves the top, and the face behind the falls
base.rect(FX - FW, TOP - 2, FX + FW, FOOT, "#3a3a42", FALL);
// the black sand plain, the braided river running out toward us
base.rect(0, FOOT, W, H, (x, y) => mix(hex("#4a4a50"), hex("#1e1e24"), clamp((y - FOOT) / 30 + noise2(x / 4, y / 2, 5) * 0.25)), SAND);
for (let y = FOOT; y < H; y++) {
  const u = (y - FOOT) / (H - FOOT), cx = FX + Math.sin(u * 5) * 14 + u * 20, w = 6 + u * 18;
  for (let k = 0; k < 3; k++) { const bx = cx + (k - 1) * w * 0.6 + Math.sin(y * 0.3 + k) * 2; base.rect(bx - 2 - u * 2, y, bx + 2 + u * 2, y + 1, mix(hex("#c8d8e4"), hex("#8aa0b0"), u), RIVER); }
}

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#eef6ff", "#a9c8dc", "#e84a3a", "#ffd23a", "#1a1a20"] });

export const meta = {
  slug: "black-sand-falls",
  name: "Black Sand Falls",
  category: "landscapes",
  note: "A tall waterfall pours off a mossy green cliff onto a black sand plain under a pale northern sky as a hiker in a red jacket walks toward the spray.",
  tags: ["iceland", "waterfall", "cliff", "black-sand", "north", "nature", "halftone", "spray"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    falls(f, t, FX - FW + 2, FX + FW - 2, TOP - 1, FOOT + 2, { c: "#ffffff", c2: "#a9c8dc", speed: 30, only: FALL });
    mist(f, t, { y0: FOOT - 18, y1: FOOT + 14, c: "#eef6ff", a: 0.8, speed: -0.08, scale: 12, cut: 0.35 });
    // a hiker walking in toward the falls
    const p = (t % 30) / 30, x = lerp(30, FX - 22, p), y = Math.round(lerp(104, 86, p));
    person(f, x, y, { body: "#e84a3a", head: "#ffd23a", step: Math.floor(t * 3) });
    // fulmars gliding along the cliff face
    for (let i = 0; i < 3; i++) {
      const x2 = ((t * (8 + i * 3) + i * 60) % (W + 30)) - 15, y2 = 36 + i * 8 + Math.sin(t + i) * 3;
      f.put(x2, y2, "#ffffff"); f.put(x2 - 1, y2 - 1, "#ffffff"); f.put(x2 + 1, y2 - 1, "#ffffff"); f.put(x2 - 2, y2, "#ffffff"); f.put(x2 + 2, y2, "#ffffff");
    }
    return enc(f);
  };
}
