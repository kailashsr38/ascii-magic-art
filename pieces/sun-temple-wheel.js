/* sun-temple-wheel: the giant carved stone chariot wheel of the sun temple at golden hour, the temple rising behind it, hand-built.
 * Painted once: the warm sky, the pyramidal temple roof in tiers, the carved platform, and in front the
 * great wheel with its thick rim, eight broad spokes, eight thin ones and the carved hub. Each frame moves
 * the shadows of the spokes as the sun sinks, adds parakeets darting and visitors pausing. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, TEMPLE = 2, WHEEL = 3, GROUND = 4;
const WX = 70, WY = 66, WR = 30; // the wheel's centre and radius

const base = new Canvas();
base.sky([[0, "#6a8ac0"], [0.6, "#f0b890"], [1, "#ffd8a8"]], SKY, 0, 70);
// the temple: tiered pyramidal roof, carved bands, behind and right of the wheel
const stone = (x, y, x0, x1) => mix(hex("#f0b880"), hex("#7a4a3a"), clamp((x - x0) / (x1 - x0) * 0.9 + noise2(x / 1.8, y / 1.8, 5) * 0.18));
for (let k = 0; k < 7; k++) {
  const hw = 46 - k * 5, y0 = 46 - k * 5;
  base.rect(118 - hw, y0, 118 + hw, y0 + 5, (x, y) => (y === y0 ? hex("#ffd8a8") : stone(x, y, 118 - hw, 118 + hw)), TEMPLE);
}
base.ellipse(118, 11, 8, 4, (x, y) => stone(x, y, 110, 126), TEMPLE);
base.rect(66, 51, 172, 92, (x, y) => mix(stone(x, y, 66, 172), hex("#c88a5e"), (y % 4 === 0) ? 0.35 : 0), TEMPLE); // the carved platform
// the wheel: thick rim, hub, spokes, everything carved and pitted
const inWheel = (x, y) => {
  const dx = x - WX, dy = y - WY, d = Math.hypot(dx, dy);
  if (d > WR) return null;
  const a = Math.atan2(dy, dx);
  if (d > WR - 5) return d > WR - 1 ? "rimEdge" : "rim";
  if (d < 6) return "hub";
  for (let k = 0; k < 16; k++) {
    const sa = (k / 16) * Math.PI * 2, wide = k % 2 === 0, diff = Math.abs(Math.atan2(Math.sin(a - sa), Math.cos(a - sa))) * d;
    if (diff < (wide ? 2.6 : 1.1)) return wide ? "spoke" : "thin";
  }
  return null;
};
for (let y = WY - WR; y <= WY + WR; y++) for (let x = WX - WR; x <= WX + WR; x++) {
  const part = inWheel(x, y);
  if (!part) continue;
  const carve = noise2(x / 1.3, y / 1.3, 9) * 0.3;
  const c = { rim: "#e8a870", rimEdge: "#ffd0a0", hub: "#d89a68", spoke: "#e0a070", thin: "#c8885e" }[part];
  base.put(x, y, mix(hex(c), hex("#5a3428"), clamp(carve + (x - WX) / (WR * 3))), WHEEL);
}
// the ground
base.rect(0, 92, W, H, (x, y) => mix(hex("#c8a078"), hex("#7a5a42"), clamp((y - 92) / 16 + noise2(x / 4, y / 2, 3) * 0.2)), GROUND);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#2a1810", "#3ac86a", "#e84a4a", "#ffffff", "#f2c84a"] });

export const meta = {
  slug: "sun-temple-wheel",
  name: "Sun Temple Chariot Wheel",
  category: "india",
  note: "The giant carved stone chariot wheel of the sun temple glows at golden hour, the shadows of its spokes turning across its face as parakeets dart past the tiered temple roof.",
  tags: ["konark", "odisha", "sun-temple", "wheel", "carving", "golden-hour", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the spoke shadows creeping round as the sun moves (a full sweep in 40 s)
    const sh = (t / 40) * 0.6;
    for (let y = WY - WR + 5; y <= WY + WR - 5; y++) for (let x = WX - WR + 5; x <= WX + WR - 5; x++) {
      if (f.maskAt(x, y) !== WHEEL) continue;
      const a = Math.atan2(y - WY, x - WX) - sh, d = Math.hypot(x - WX, y - WY);
      if (d > 6 && d < WR - 5 && Math.sin(a * 8) > 0.6) f.add(x + 1, y + 1, "#2a1810", 0.35);
    }
    // parakeets darting past
    for (let i = 0; i < 3; i++) {
      const x = ((t * 22 + i * 70) % (W + 40)) - 20, y = 24 + i * 9 + Math.sin(t * 3 + i) * 3;
      f.rect(x, y, x + 2, y + 1, "#3ac86a"); f.line(x - 1, y + 1, x - 4, y + 2, "#3ac86a", 1); f.put(x + 2, y, "#e84a4a");
    }
    for (const [ph, c] of [[0.2, "#f2c84a"], [0.7, "#ffffff"]]) person(f, across(t, 2.5, ph), 102, { body: c, head: "#8a5a3a", step: Math.floor(t * 4 + ph * 9) });
    return enc(f);
  };
}
