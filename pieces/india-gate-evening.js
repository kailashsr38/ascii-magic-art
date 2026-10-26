/* india-gate-evening: the great memorial arch at dusk, its lamps coming on, families on the lawns and balloon sellers along the avenue, hand-built.
 * Painted once: the dusk sky, the arch of pale sandstone with its cornice and dome-topped crown, the
 * canopy behind it, the long avenue and the lawns either side with their lamp posts. Each frame walks
 * families along the avenue, bobs the balloon sellers' bunches, lights the lamps one by one, runs the
 * fountain and flies birds home. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ARCH = 2, TREES = 3, LAWN = 4, ROAD = 5;
const CX = 96, GROUND = 70;

const base = new Canvas();
base.sky([[0, "#3a4a80"], [0.5, "#9a7aa8"], [0.85, "#f0a88a"], [1, "#ffd0a0"]], SKY, 0, GROUND + 1);
// the trees along the avenue, dark and low
for (let x = 0; x < W; x++) { const top = GROUND - 6 - fbm(x / 5, 2, 3, 4) * 6; for (let y = Math.floor(top); y < GROUND + 1; y++) base.put(x, y, mix(hex("#4a4a5a"), hex("#3a3a4a"), (y - top) / 12), TREES); }
// the arch: tall piers, the vaulted opening, the cornice and the stepped crown with its shallow dome
base.rect(CX - 22, 20, CX + 23, GROUND + 1, (x, y) => mix(hex("#f4e0c8"), hex("#c0a088"), clamp((x - CX + 22) / 45 * 0.8 + (Math.sin(y * 1.1) > 0.85 ? 0.08 : 0))), ARCH);
for (let y = 32; y < GROUND + 1; y++) for (let x = CX - 10; x <= CX + 10; x++) { if (y < 42 && Math.hypot(x - CX, y - 42) > 10) continue; base.put(x, y, mix(hex("#9a7a8a"), hex("#6a5a6a"), (y - 32) / 40), ARCH); }
base.rect(CX - 24, 26, CX + 25, 29, "#fff0dc", ARCH);
base.rect(CX - 16, 14, CX + 17, 20, (x) => mix(hex("#f4e0c8"), hex("#c0a088"), (x - CX + 16) / 33), ARCH);
base.rect(CX - 10, 10, CX + 11, 14, (x) => mix(hex("#f4e0c8"), hex("#c0a088"), (x - CX + 10) / 21), ARCH);
base.ellipse(CX, 10, 7, 3, "#e8d4bc", ARCH);
for (const x of [CX - 18, CX + 14]) base.rect(x, 34, x + 4, 36, "#8a6a7a", ARCH);
// the lawns and the long avenue running toward us
base.rect(0, GROUND, W, H, (x, y) => mix(hex("#6a8a5a"), hex("#3a5a3a"), clamp((y - GROUND) / 40 + fbm(x / 6, y / 3, 2, 3) * 0.2)), LAWN);
base.poly([[CX - 24, GROUND], [CX + 25, GROUND], [CX + 70, H], [CX - 70, H]], (x, y) => mix(hex("#c8b8b0"), hex("#9a8a90"), (y - GROUND) / 38), ROAD);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#ffd27a", "#fff4c8", "#e86a7a", "#f2c84a", "#3a6aa8", "#8ad06a", "#2a2630", "#e8c8a0"] });

export const meta = {
  slug: "india-gate-evening",
  name: "India Gate Evening",
  category: "india",
  note: "The great memorial arch glows at dusk as its lamps come on, families stroll the long avenue and balloon sellers' bunches bob over the lawns.",
  tags: ["india-gate", "delhi", "memorial", "arch", "dusk", "families", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const LAMPS = [[20, 78], [44, 74], [148, 74], [172, 78], [8, 92], [184, 92]];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // lamp posts lighting up one after another as the dusk deepens, then all off at the loop
    const lit = Math.floor((t % 30) / 3);
    LAMPS.forEach(([x, y], i) => {
      f.rect(x, y - 12, x + 1, y, "#2a2630");
      if (i < lit) { f.glow(x, y - 13, 1, 6, "#ffd27a", 0.5); f.put(x, y - 13, "#fff4c8"); } else f.put(x, y - 13, "#9a8a90");
    });
    // the fountain jets in front of the arch
    for (const fx of [CX - 34, CX + 34]) for (let k = 0; k < 10; k++) { const s = ((t * 1.2 + k / 10) % 1), h = Math.sin(s * Math.PI) * 8; f.add(fx + (s - 0.5) * 6, GROUND + 2 - h, "#ffffff", 0.75); }
    // families strolling along the avenue
    for (let i = 0; i < 8; i++) {
      const p = ((t / 30) + i / 8) % 1, up = i % 2 === 0, u = up ? p : 1 - p, y = Math.round(lerp(H - 2, GROUND + 4, u)), x = CX + (i % 4 - 1.5) * lerp(30, 12, u);
      person(f, x, y, { body: ["#e86a7a", "#ffffff", "#f2c84a", "#3a6aa8"][i % 4], head: "#5a4040", legs: "#2a2630", step: Math.floor(t * 3 + i) });
    }
    // balloon sellers with their bobbing bunches
    for (const [x, y] of [[30, 96], [160, 98]]) {
      person(f, x, y, { body: "#ffffff", head: "#5a4040", step: 0 });
      for (let k = 0; k < 6; k++) { const bx = x + (k - 2.5) * 2 + Math.sin(t * 1.5 + k) * 0.8, by = y - 12 - (k % 2) * 2 + Math.sin(t * 2 + k * 1.3) * 0.8; f.line(x, y - 3, bx, by + 1, "#9a8a90", 1); f.ellipse(bx, by, 1.2, 1.5, ["#e86a7a", "#f2c84a", "#8ad06a", "#3a6aa8", "#ffffff", "#e86a7a"][k]); }
    }
    birds(f, t, { n: 7, y: 14, period: 16, c: "#2a2630", only: SKY });
    return enc(f);
  };
}
