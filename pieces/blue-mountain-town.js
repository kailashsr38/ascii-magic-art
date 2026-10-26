/* blue-mountain-town: a lane of blue-washed walls and stairs in the mountain town, flowerpots and a sleeping cat, hand-built.
 * Painted once: the strip of sky between the walls, the lane of stairs climbing away, every wall and
 * door in a different blue, arches over the lane, potted geraniums on the steps. Each frame adds a
 * cat waking and walking down the steps, a cloth awning swaying and a passer-by at the top. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, arch, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, WALL = 2, STEP = 3;
const VX = 100, VY = 34;

const base = new Canvas();
base.sky([[0, "#7ab4e8"], [1, "#d8ecf8"]], SKY, 0, 40);
// walls on both sides, receding to the top of the stairs, every one a different blue, sunlit on the left
const blue = (k, lit) => mix(mix(hex("#a8d0f4"), hex("#3a7ac8"), k), hex("#ffffff"), lit);
base.fill((x, y) => {
  const left = x < VX - (VY - y) * 0.6 - 18, right = x > VX + (VY - y) * 0.6 + 18;
  if (!(left || right) && y < VY + 16) return null;
  const k = 0.25 + noise2(x / 22, y / 30, 3) * 0.55, n = noise2(x / 2, y / 2, 7) * 0.06;
  return blue(k, clamp((left ? 0.25 : 0.05) + n));
}, WALL);
// the lane: stairs climbing to the far wall, a low arch over them
base.poly([[VX - 18, VY + 16], [VX + 18, VY + 16], [W * 0.78, H], [W * 0.18, H]], (x, y) => {
  const step = Math.floor(Math.pow((y - VY - 16) / (H - VY - 16), 0.7) * 16), riser = ((y - VY) * 0.55) % 1 < 0.3;
  return mix(blue(0.15, 0.3), hex("#5a8ac8"), riser ? 0.55 : 0.05) ;
}, STEP);
base.rect(VX - 24, VY - 6, VX + 25, VY + 16, (x, y) => blue(0.4, 0.15), WALL);
arch(base, VX - 12, VY, 24, 16, "#2a5a9a", WALL);
base.rect(VX - 5, VY + 6, VX + 6, VY + 16, "#1e4a8a", WALL); // the far door
// doors and windows in the side walls
for (const [x, y, w, h, c] of [[10, 52, 16, 30, "#1e5aa8"], [160, 50, 18, 32, "#2a6ab8"], [40, 30, 8, 10, "#1e4a8a"], [150, 26, 8, 10, "#1e4a8a"], [56, 46, 10, 20, "#14408a"], [134, 44, 10, 22, "#14408a"]]) {
  arch(base, x, y, w, h, c, WALL);
  base.rect(x, y + h - 1, x + w, y + h + 1, "#e8f2fc", WALL);
}
// potted geraniums up the steps and on the walls
const POTS = [[30, 96], [44, 88], [150, 92], [164, 100], [70, 66], [128, 64], [20, 40], [176, 36]];
for (const [x, y] of POTS) { base.rect(x - 2, y - 2, x + 3, y + 2, "#d8783a", STEP); base.ellipse(x + 0.5, y - 4, 3, 2.2, (xx, yy) => ((xx + yy) % 3 ? hex("#e83a4a") : hex("#3a8a3a")), STEP); }

balance(base, 0.45);
const PAL = fitPalette(base, { n: 50, extras: ["#2a2a2a", "#f4f0e8", "#e83a4a", "#f2c84a", "#c84a8a"] });

export const meta = {
  slug: "blue-mountain-town",
  name: "Blue Mountain Town",
  category: "cities",
  note: "A lane of blue-washed walls and stairs climbs through the mountain town past potted geraniums as a cat strolls down the steps and an awning sways.",
  tags: ["chefchaouen", "morocco", "blue", "town", "stairs", "landmark", "halftone", "cat"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // a striped cloth awning over a doorway, swaying
    const sw = Math.round(Math.sin(t * 1.4) * 1.5);
    for (let i = 0; i < 18; i++) for (let j = 0; j < 4; j++) f.put(160 + i, 46 + j + (j === 3 ? sw : 0), Math.floor(i / 3) % 2 ? "#f2c84a" : "#c84a8a");
    // the cat walking down the steps toward us, then back up (24 s)
    const p = (t % 24) / 24, u = p < 0.5 ? p * 2 : 2 - p * 2, s = lerp(0.6, 1.6, u), x = lerp(VX + 6, 120, u), y = lerp(VY + 22, 100, u);
    const dir = p < 0.5 ? 1 : -1;
    f.rect(x - 3 * s, y - 2 * s, x + 3 * s, y, "#2a2a2a");
    f.rect(x + dir * 3 * s, y - 3.5 * s, x + dir * 4.5 * s, y - 1.5 * s, "#2a2a2a");
    f.put(x + dir * 4 * s, y - 4 * s, "#2a2a2a"); f.line(x - dir * 3 * s, y - 2 * s, x - dir * 5 * s, y - 4 * s - Math.sin(t * 3), "#2a2a2a", 1);
    // a passer-by crossing the top of the stairs
    const px = VX - 16 + ((t * 3) % 34);
    person(f, px, VY + 15, { body: "#f4f0e8", head: "#c89a7a", step: Math.floor(t * 4) });
    return enc(f);
  };
}
