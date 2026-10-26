/* charles-bridge-dawn: the old stone bridge with its statues and gate tower at dawn, the castle on the hill, hand-built.
 * Painted once: the dawn sky, the castle and cathedral spires on the far hill, the river, the arched
 * bridge with its row of statues and the gothic tower at its end. Each frame adds mist on the river,
 * early walkers crossing the bridge, swans and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, person, across, arch, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FAR = 2, RIVER = 3, BRIDGE = 4;
const DECK = 66;

const base = new Canvas();
base.sky([[0, "#7a8ab8"], [0.5, "#d8b0b8"], [0.85, "#ffd0a8"], [1, "#ffe4c0"]], SKY, 0, 62);
base.glow(150, 50, 4, 36, "#fff4d8", 0.55, SKY);
// the castle hill: long palace front, the cathedral's spires, roofs and trees below
base.ridge({ base: 0.56, amp: 0.04, f: 2, seed: 3, top: "#a8a0b8", bot: "#8a84a0", depth: 10, m: FAR });
base.rect(24, 40, 118, 52, (x) => mix(hex("#e8dcd8"), hex("#a89cb0"), clamp((x - 24) / 94)), FAR);
for (let x = 26; x < 116; x += 4) base.rect(x, 43, x + 2, 46, "#7a7090", FAR);
for (const [x, h] of [[70, 34], [78, 30], [88, 24]]) { base.rect(x, 52 - h, x + 4, 52, "#9a92a8", FAR); base.poly([[x - 1, 52 - h], [x + 5, 52 - h], [x + 2, 52 - h - 10]], "#7a7290", FAR); }
for (let x = 0; x < W; x++) for (let y = 52; y < 62; y++) if (fbm(x / 4, y / 3, 3, 5) > 0.45) base.put(x, y, mix(hex("#b89aa0"), hex("#7a7088"), (y - 52) / 10), FAR);
// the river
base.rect(0, 62, W, H, (x, y) => {
  const u = (y - 62) / (H - 62), path = Math.exp(-((x - 150) ** 2) / (40 + u * 900));
  return mix(mix(hex("#d8b4b4"), hex("#6a7090"), clamp(u * 1.1)), hex("#ffe0b8"), clamp(path * 0.7 + (Math.sin(y * 2 + Math.sin(x * 0.2)) > 0.65 ? 0.08 : 0)));
}, RIVER);
// the bridge: a long deck on arches, parapet, statues on the parapet, the gothic tower at the near end
base.rect(0, DECK - 2, 168, DECK + 6, (x, y) => mix(hex("#c8b0a8"), hex("#7a6a74"), clamp((y - DECK + 2) / 10 + noise2(x / 2, y / 2, 3) * 0.15)), BRIDGE);
for (let x = -6; x < 168; x += 24) arch(base, x, DECK + 6, 18, 12, "#5a5068", BRIDGE);
base.rect(0, DECK + 6, 168, DECK + 7, "#8a7a80", BRIDGE);
for (let x = 6; x < 160; x += 16) { // statues: dark baroque figures on plinths
  base.rect(x - 1, DECK - 5, x + 2, DECK - 2, "#6a5a66", BRIDGE);
  base.rect(x - 1, DECK - 12, x + 2, DECK - 5, "#3a3240", BRIDGE); base.put(x, DECK - 13, "#3a3240", BRIDGE); base.put(x + 2, DECK - 9, "#3a3240", BRIDGE);
}
base.rect(162, 26, 186, DECK + 8, (x, y) => mix(hex("#a89098"), hex("#4a4050"), clamp((x - 162) / 24 * 0.8 + noise2(x / 2, y / 2, 4) * 0.1)), BRIDGE);
base.poly([[160, 26], [188, 26], [174, 8]], (x) => mix(hex("#6a6a88"), hex("#3a3a52"), clamp((x - 160) / 28)), BRIDGE);
for (const x of [161, 186]) base.poly([[x - 2, 26], [x + 3, 26], [x + 0.5, 16]], "#4a4a62", BRIDGE);
arch(base, 168, 50, 12, DECK - 46, "#2a2232", BRIDGE);
for (const y of [32, 40]) base.rect(170, y, 178, y + 4, "#3a3242", BRIDGE);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#fff8ec", "#1e1a24", "#ffffff", "#c84a3a", "#2a4a7a"] });

export const meta = {
  slug: "charles-bridge-dawn",
  name: "Charles Bridge Dawn",
  category: "cities",
  note: "The old stone bridge with its row of statues and gothic gate tower at dawn, the castle on the hill beyond, mist on the river and the first walkers crossing.",
  tags: ["prague", "bridge", "czech", "castle", "dawn", "landmark", "halftone", "river"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 64, y1: 90, c: "#fff8ec", a: 0.55, speed: 0.05, scale: 26, cut: 0.44 });
    for (const [ph, c, dir] of [[0.1, "#c84a3a", 1], [0.5, "#2a4a7a", -1], [0.75, "#fff8ec", 1]]) {
      const u = across(t, 3, ph, 168, 10), x = dir > 0 ? u : 168 - u;
      person(f, x, DECK - 3, { body: c, head: "#f0d0b0", step: Math.floor(t * 4 + ph * 9) });
    }
    // swans gliding on the river
    for (const [ph, y] of [[0.2, 92], [0.65, 100]]) {
      const x = across(t, 2, ph);
      f.rect(x, y - 1, x + 4, y + 1, "#ffffff"); f.rect(x + 4, y - 4, x + 5, y - 1, "#ffffff"); f.put(x + 5, y - 4, "#c84a3a");
    }
    birds(f, t, { n: 5, y: 18, period: 15, c: "#1e1a24", only: SKY });
    return enc(f);
  };
}
