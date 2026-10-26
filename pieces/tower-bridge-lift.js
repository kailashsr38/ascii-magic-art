/* tower-bridge-lift: the twin-towered bridge at golden hour, its decks lifting to let a tall ship through, hand-built.
 * Painted once: the sky, the far bank, the river, the two stone towers with their turrets and the high
 * walkways, the blue suspension chains to each bank. Each frame raises and lowers the two road decks,
 * sails a tall ship through, and adds gulls and cloud. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, BANK = 2, RIVER = 3, BRIDGE = 4;
const DECK = 64, TL = 64, TR = 128, TW = 13; // deck height, tower centres and half-width of each tower

const base = new Canvas();
base.sky([[0, "#5a6aa0"], [0.45, "#c8909c"], [0.75, "#f6b07a"], [1, "#ffd296"]], SKY, 0, 72);
base.glow(100, 40, 4, 40, "#fff0c4", 0.45, SKY);
// the far bank: low warehouses and trees
for (let x = 0; x < W; x++) { const h = 4 + Math.floor(fbm(x / 6, 1, 3, 8) * 8); base.rect(x, 72 - h, x + 1, 73, (xx, y) => mix(hex("#8a7a8a"), hex("#6a5e74"), (y - 60) / 13), BANK); }
// the river
base.rect(0, 72, W, H, (x, y) => {
  const u = (y - 72) / (H - 72), path = Math.exp(-((x - 100) ** 2) / (50 + u * 700));
  const ripple = Math.sin(y * 1.9 + Math.sin(x * 0.15) * 2) > 0.65 ? 0.07 : 0;
  return mix(mix(hex("#d09a90"), hex("#6a6a8a"), clamp(u * 1.2)), hex("#ffd8a0"), clamp(path * 0.6 + ripple));
}, RIVER);
// the towers: stone, gothic windows, pointed turrets at the corners and a steep roof
const tower = (cx) => {
  base.rect(cx - TW, 28, cx + TW + 1, 78, (x, y) => mix(hex("#f4dcb8"), hex("#9a8078"), clamp((x - cx + TW) / (2 * TW) + noise2(x / 2, y / 2, 5) * 0.12)), BRIDGE);
  for (const dx of [-TW, TW - 3]) { base.rect(cx + dx, 18, cx + dx + 4, 28, (x) => mix(hex("#f0d4b0"), hex("#a08480"), clamp((x - cx + TW) / (2 * TW))), BRIDGE); base.poly([[cx + dx - 1, 18], [cx + dx + 5, 18], [cx + dx + 2, 10]], "#5a6a8a", BRIDGE); }
  base.poly([[cx - TW + 3, 28], [cx + TW - 2, 28], [cx, 14]], (x) => mix(hex("#7a8aa8"), hex("#4a5a7a"), clamp((x - cx + TW) / (2 * TW))), BRIDGE);
  for (const y of [34, 46]) for (const dx of [-6, 3]) { base.rect(cx + dx, y, cx + dx + 3, y + 7, "#5a4a52", BRIDGE); base.put(cx + dx + 1, y - 1, "#5a4a52", BRIDGE); }
  base.rect(cx - TW - 1, 76, cx + TW + 2, 82, "#7a6a6a", BRIDGE); // the pier
};
tower(TL); tower(TR);
// the high walkways between the towers
for (const y of [28, 31]) base.rect(TL + TW, y, TR - TW, y + 2, (x) => (x % 4 < 2 ? hex("#6a8ab8") : hex("#f0ece4")), BRIDGE);
// suspension chains down to each bank, and the side spans
for (const [x0, x1] of [[0, TL - TW], [TR + TW, W]]) {
  const left = x0 === 0;
  for (let x = x0; x < x1; x++) {
    const u = left ? 1 - x / x1 : (x - x0) / (x1 - x0), y = lerp(30, 58, Math.sqrt(u));
    base.rect(x, y, x + 1, y + 2, "#5a7ab0", BRIDGE);
    if (x % 6 === 0) base.rect(x, y + 2, x + 1, DECK, "#4a6a9a", BRIDGE);
  }
  base.rect(x0, DECK, x1, DECK + 3, "#7a6a72", BRIDGE);
}

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#f2ece4", "#3a2a26", "#2a2230", "#7a6a72", "#c8a878"] });

export const meta = {
  slug: "tower-bridge-lift",
  name: "Tower Bridge Lift",
  category: "cities",
  note: "The twin-towered bridge at golden hour lifts its two road decks to let a tall ship sail through, then lowers them again as gulls wheel over the river.",
  tags: ["london", "bridge", "thames", "england", "landmark", "golden-hour", "halftone", "ship"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const LOOP = 24;

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.3, 0.16, 1.2, "#f2b090", 0.4], [0.75, 0.28, 0.28, 1, "#c48aa0", 0.35]], SKY, 0.7);
    // the bascules: up from 4 s to 18 s, easing, a quarter turn about each tower's inner face
    const ph = t % LOOP, up = ph < 4 ? 0 : ph < 7 ? (ph - 4) / 3 : ph < 15 ? 1 : ph < 18 ? 1 - (ph - 15) / 3 : 0;
    const ang = (Math.PI / 2.4) * (up * up * (3 - 2 * up)), L = (TR - TL - 2 * TW) / 2;
    // the tall ship, passing while the bridge is open
    const sp = clamp((ph - 6.5) / 9.5), sx = lerp(-40, W + 40, sp);
    if (ph > 6.5 && ph < 16) {
      // a tall ship: dark hull with a raked bow, three masts, square sails with gaps between them
      for (let i = -16; i <= 15; i++) { const d = i > 10 ? i - 10 : 0; f.rect(sx + i, 82 + d * 0.5, sx + i + 1, 87, "#3a2a26"); }
      f.line(sx + 15, 82, sx + 24, 78, "#3a2a26", 1); // the bowsprit
      for (const [mx, mh] of [[-9, 30], [1, 36], [10, 26]]) {
        f.rect(sx + mx, 82 - mh, sx + mx + 1, 82, "#3a2a26");
        for (let k = 0; k < 3; k++) { const y0 = 82 - mh + 3 + k * 8; for (let r = 0; r < 6; r++) { const w = (5 - k) * (0.75 + 0.25 * Math.sin((r / 5) * Math.PI)); f.rect(sx + mx - w + 1, y0 + r, sx + mx + w + 1, y0 + r + 1, r === 5 ? "#c8a878" : "#f2ece4"); } }
      }
    }
    for (const [px, dir] of [[TL + TW, 1], [TR - TW, -1]]) {
      for (let s = 0; s <= L; s++) {
        const x = px + dir * Math.cos(ang) * s, y = DECK - Math.sin(ang) * s;
        f.rect(x, y, x + 1, y + 3, s % 5 === 0 ? "#c8a878" : "#7a6a72");
      }
    }
    birds(f, t, { n: 5, y: 22, period: 16, c: "#2a2230", only: SKY });
    return enc(f);
  };
}
