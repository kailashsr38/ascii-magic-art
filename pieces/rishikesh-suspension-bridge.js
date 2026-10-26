/* rishikesh-suspension-bridge: the iron suspension bridge across the green Ganga between forested hills, temples on the bank, hand-built.
 * Painted once: the morning sky, steep forested hills, the many-storeyed temple tower on the far bank,
 * the jade-green river with white rapids, the bridge's towers and sweeping cables. Each frame walks
 * pilgrims and a cow across the bridge, runs rafts down the rapids and swings monkeys on the cables. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, TEMPLE = 3, RIVER = 4, BRIDGE = 5;
const DECK = 58, T1 = 18, T2 = 176;

const base = new Canvas();
base.sky([[0, "#7aa8d8"], [0.7, "#c4d8ea"], [1, "#eef0e8"]], SKY, 0, 30);
base.ridge({ base: 0.26, amp: 0.12, f: 2.5, seed: 4, top: "#8aa878", bot: "#5a7a52", depth: 30, m: HILL });
base.ridge({ base: 0.4, amp: 0.1, f: 3, seed: 9, top: "#5a8a4a", bot: "#2e5a32", depth: 30, m: HILL });
// the temple tower on the far bank: thirteen storeys, cream and orange, flags on top
for (let k = 0; k < 11; k++) {
  const hw = 12 - k * 0.7, y0 = 66 - (k + 1) * 4.2;
  base.rect(130 - hw, y0, 130 + hw + 1, y0 + 4.2, (x, y) => (y - y0 < 1 ? hex("#e8783a") : mix(hex("#fff4e0"), hex("#c8a890"), clamp((x - 130 + hw) / (2 * hw)))), TEMPLE);
  for (let x = 130 - hw + 2; x < 130 + hw - 1; x += 3) base.put(x, y0 + 2, "#8a5a4a", TEMPLE);
}
base.rect(128, 12, 133, 20, "#e8783a", TEMPLE);
// the river: jade green with white rapids around the rocks
base.rect(0, 66, W, H, (x, y) => {
  const rapid = fbm(x / 8, y / 2, 3, 6) > 0.62 + (y - 66) / 200;
  return rapid ? hex("#f4fcf8") : mix(hex("#5ac0a0"), hex("#1e7a6a"), clamp((y - 66) / 40 + noise2(x / 6, y / 3, 4) * 0.2));
}, RIVER);
for (const [x, y, r] of [[30, 84, 4], [150, 96, 5], [90, 102, 3]]) base.ellipse(x, y, r * 1.4, r * 0.6, "#6a6a62", RIVER);
// the bridge: two tall towers, the main cables sagging between them, hangers, the deck
for (const tx of [T1, T2]) { base.rect(tx - 3, 22, tx + 4, 70, (x) => mix(hex("#f4f0e8"), hex("#a8a4a0"), clamp((x - tx + 3) / 7)), BRIDGE); base.rect(tx - 4, 22, tx + 5, 25, "#e8783a", BRIDGE); }
const cable = (x) => 26 + Math.pow((x - (T1 + T2) / 2) / ((T2 - T1) / 2), 2) * -24 + 24 + 6;
for (let x = T1; x <= T2; x++) {
  const cy = 30 + (1 - Math.pow((x - (T1 + T2) / 2) / ((T2 - T1) / 2), 2)) * 22;
  base.put(x, cy, "#3a3a42", BRIDGE);
  if ((x - T1) % 4 === 0) base.rect(x, cy, x + 1, DECK, "#6a6a72", BRIDGE);
}
base.rect(T1, DECK, T2, DECK + 2, "#5a5a62", BRIDGE);
for (let x = T1; x < T2; x += 2) base.put(x, DECK - 2, "#8a8a92", BRIDGE);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 48, extras: ["#ff8a3a", "#ffffff", "#e84a3a", "#f2c84a", "#3a6ab8", "#f4f0e8", "#5a4a3a"] });

export const meta = {
  slug: "rishikesh-suspension-bridge",
  name: "Rishikesh Suspension Bridge",
  category: "india",
  note: "The iron suspension bridge spans the jade-green Ganga between forested hills and a towering temple as pilgrims and a cow cross, rafts shoot the rapids and monkeys swing on the cables.",
  tags: ["rishikesh", "ganga", "bridge", "temple", "rafting", "himalaya", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 26, y1: 46, c: "#f4f0e8", a: 0.35, speed: 0.03, scale: 26, cut: 0.5 });
    // pilgrims in saffron and a cow crossing the bridge
    for (const [ph, c, dir] of [[0, "#ff8a3a", 1], [0.3, "#ffffff", -1], [0.55, "#ff8a3a", 1], [0.8, "#e84a3a", -1]]) {
      const u = across(t, 3, ph, T2 - T1, 0), x = T1 + (dir > 0 ? u : T2 - T1 - u);
      person(f, x, DECK - 1, { body: c, head: "#8a5a3a", step: Math.floor(t * 4 + ph * 9) });
    }
    const cx = T1 + across(t, 1.6, 0.4, T2 - T1, 0);
    f.rect(cx, DECK - 4, cx + 6, DECK - 1, "#f4f0e8"); f.rect(cx + 6, DECK - 5, cx + 8, DECK - 3, "#f4f0e8"); f.put(cx, DECK, "#5a4a3a"); f.put(cx + 5, DECK, "#5a4a3a");
    // rafts with paddlers in helmets running the rapids
    for (const [ph, y] of [[0.1, 80], [0.6, 96]]) {
      const x = across(t, 9, ph);
      f.rect(x, y, x + 12, y + 3, "#e84a3a"); for (let k = 0; k < 4; k++) { f.put(x + 2 + k * 3, y - 1, "#f2c84a"); f.put(x + 2 + k * 3, y - 2, "#3a6ab8"); f.line(x + 2 + k * 3, y, x + k * 3 + (Math.sin(t * 6 + k) > 0 ? 0 : 4), y + 4, "#5a4a3a", 1); }
    }
    // a monkey swinging along the main cable
    const mp = (t % 18) / 18, mx = lerp(T1 + 10, T2 - 10, mp), my = 30 + (1 - Math.pow((mx - (T1 + T2) / 2) / ((T2 - T1) / 2), 2)) * 22;
    f.rect(mx - 1, my + 1, mx + 1, my + 4, "#8a6a4a"); f.line(mx + 1, my + 3, mx + 4, my + 6 + Math.sin(t * 3), "#8a6a4a", 1);
    birds(f, t, { n: 5, y: 12, period: 16, c: "#5a4a3a", only: SKY });
    return enc(f);
  };
}
