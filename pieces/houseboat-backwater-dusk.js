/* houseboat-backwater-dusk: a thatched rice-barge houseboat gliding down the palm-lined backwaters at dusk, a fisherman casting a net, hand-built.
 * Painted once: the dusk sky, the far bank of coconut palms leaning over the water, the near bank with a
 * village path, and the still canal mirroring it all. Each frame glides the houseboat along with its
 * curved thatch roof and lit windows, casts the fisherman's net from his canoe, sways the palms and adds
 * egrets. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, palm, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, BANK = 2, WATER = 3;
const WL = 62;

const base = new Canvas();
base.sky([[0, "#4a5a98"], [0.45, "#c88aa8"], [0.8, "#f8a878"], [1, "#ffd498"]], SKY, 0, WL);
base.glow(130, 50, 5, 34, "#fff0c4", 0.6, SKY);
// the far bank: a low strip of green and a crowd of palms leaning out
base.rect(0, WL - 6, W, WL + 1, (x, y) => mix(hex("#6a7a4a"), hex("#3a4a32"), (y - WL + 6) / 7), BANK);
for (let i = 0; i < 16; i++) palm(base, 4 + i * 12 + (i % 3) * 3, WL - 4, 18 + (i % 4) * 4, { lean: (i % 2 ? 0.25 : -0.15), c: "#2e3a2a", fronds: 7 });
// the canal: dusk mirrored, the sun's path, the near bank at the bottom
const snap = new Canvas().copy(base);
base.rect(0, WL, W, 96, (x, y) => mix(snap.get(x, 2 * WL - y - 1 + Math.round(Math.sin(y * 0.8 + x * 0.05) * 0.6)), hex("#4a4a72"), clamp(0.25 + (y - WL) / 60)), WATER);
base.rect(0, 96, W, H, (x, y) => mix(hex("#5a6a3a"), hex("#2e3a24"), clamp((y - 96) / 12 + fbm(x / 4, y / 2, 2, 5) * 0.4)), BANK);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#1e1814", "#c89a5a", "#8a5a32", "#ffd27a", "#ffffff", "#e8e0d0"] });

export const meta = {
  slug: "houseboat-backwater-dusk",
  name: "Houseboat Backwater Dusk",
  category: "india",
  note: "A thatched rice-barge houseboat glides down the palm-lined backwaters at dusk, its windows lit, as a fisherman casts his net from a canoe and egrets fly home.",
  tags: ["kerala", "backwaters", "houseboat", "palms", "dusk", "canal", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the houseboat: long hull, a curved woven-thatch roof, lit windows, gliding right to left
    const x = W - across(t, 3.5, 0.4, W, 50), y = 80;
    for (let k = 3; k < 30; k++) f.add(x + 40 + k, y + 1, "#e8e0d0", (1 - k / 30) * 0.4, WATER);
    for (let i = -2; i <= 42; i++) { const lift = i < 4 ? (4 - i) * 0.8 : i > 38 ? (i - 38) * 0.6 : 0; f.rect(x + i, y - 2 - lift, x + i + 1, y + 1, "#8a5a32"); }
    for (let i = 2; i <= 38; i++) { const arc = Math.sin(((i - 2) / 36) * Math.PI) * 4; f.rect(x + i, y - 10 - arc, x + i + 1, y - 7, i % 3 ? "#c89a5a" : "#a8783e"); }
    for (let i = 5; i < 36; i += 4) f.rect(x + i, y - 6, x + i + 2, y - 3, "#ffd27a");
    // a fisherman in his canoe casting the net in a wide circle
    const cx = 50, cy = 90, p = (t % 6) / 6;
    f.rect(cx - 8, cy, cx + 9, cy + 1, "#1e1814");
    f.rect(cx, cy - 6, cx + 1, cy, "#1e1814"); f.put(cx, cy - 7, "#1e1814");
    if (p > 0.2 && p < 0.75) { const r = (p - 0.2) * 22; for (let a = 0; a < 24; a++) f.add(cx + 4 + Math.cos(a / 3.8) * r * 1.5, cy - 4 + Math.sin(a / 3.8) * r * 0.4 + (p - 0.2) * 8, "#e8e0d0", 0.7); }
    const sw = Math.sin(t * 0.8) * 0.7;
    palm(f, 182, 100, 30, { lean: -0.3, c: "#1e1814", sway: sw, fronds: 8 });
    birds(f, t, { n: 5, y: 34, period: 13, c: "#ffffff", only: SKY });
    return enc(f);
  };
}
