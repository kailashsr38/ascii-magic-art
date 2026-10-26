/* sea-cliff-puffins: puffins on a grassy clifftop above the sea with their bright beaks, more whirring in from the waves, hand-built.
 * Painted once: the bright sky, the sea far below with a sea stack, the sheer cliff face streaked white,
 * and the green clifftop with sea pinks. Each frame waddles and turns the puffins on the edge, flies others
 * in fast whirring arcs, breaks surf around the stack and drifts cloud. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, surf, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SEA = 2, CLIFF = 3, TOP = 4;
const HOR = 40, EDGE = 74;

const base = new Canvas();
base.sky([[0, "#4a8ad0"], [0.7, "#9ac4e4"], [1, "#e0ecf4"]], SKY, 0, HOR + 1);
base.rect(0, HOR, W, EDGE, (x, y) => mix(hex("#5a9ac0"), hex("#2a5a8a"), clamp((y - HOR) / 40)), SEA);
// a sea stack far out, streaked with birds' white
for (let y = 44; y < 66; y++) { const w = 6 + (y - 44) * 0.25; base.rect(150 - w, y, 150 + w, y + 1, (x) => mix(hex("#8a8478"), hex("#4a463e"), clamp((x - 150 + w) / (2 * w) + (Math.sin(x * 2 + y) > 0.7 ? -0.3 : 0))), CLIFF); }
base.ellipse(150, 44, 6, 2, "#6a9a4a", CLIFF);
// the cliff face falling away on the right, the grassy top in front
for (let x = 70; x < W; x++) for (let y = 66; y < EDGE + 4; y++) base.put(x, y, mix(hex("#9a9488"), hex("#4a463e"), clamp((y - 66) / 12 + (Math.sin(x * 0.7) > 0.6 ? 0.3 : 0))), CLIFF);
base.rect(0, EDGE, W, H, (x, y) => mix(hex("#8ac05a"), hex("#4a7a32"), clamp((y - EDGE) / 34 + fbm(x / 3, y / 2, 3, 8) * 0.4)), TOP);
for (let x = 0; x < W; x++) { const y = EDGE + Math.sin(x * 0.12) * 1.5; base.rect(x, y - 1, x + 1, y + 1, "#a8d070", TOP); }
for (let i = 0; i < 60; i++) { const x = (i * 37) % W, y = EDGE + 4 + ((i * 13) % 28); base.put(x, y, "#f4a0c0", TOP); base.put(x + 1, y, "#f4a0c0", TOP); }

balance(base, 0.5);
const PAL = fitPalette(base, { n: 46, extras: ["#ffffff", "#141418", "#ff7a2a", "#f2c84a", "#f4f8f8", "#e8eef4", "#c8c8d0"] });

export const meta = {
  slug: "sea-cliff-puffins",
  name: "Sea Cliff Puffins",
  category: "landscapes",
  note: "Puffins with bright orange beaks stand and turn on a grassy clifftop above the sea, more whirring in from the waves past a sea stack ringed with surf.",
  tags: ["puffins", "sea-cliff", "seabirds", "coast", "scotland", "iceland", "wildlife", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a puffin standing: black back, white face and belly, the triangular orange beak
function puffin(f, x, y, s, facing) {
  f.ellipse(x, y - 5 * s, 3 * s, 4.5 * s, "#141418");
  f.ellipse(x + facing * 0.8 * s, y - 4 * s, 1.8 * s, 3.4 * s, "#ffffff");
  f.ellipse(x + facing * 0.6 * s, y - 9 * s, 2.4 * s, 2.2 * s, "#ffffff");
  f.rect(x - 1 * s, y - 11.2 * s, x + 1.2 * s, y - 10.4 * s, "#141418");
  f.put(x + facing * 1.2 * s, y - 9.2 * s, "#141418");
  f.poly([[x + facing * 2 * s, y - 10 * s], [x + facing * 5 * s, y - 9 * s], [x + facing * 2 * s, y - 7.6 * s]], "#ff7a2a");
  f.rect(x - 1.5 * s, y, x - 0.5 * s, y + 0.8 * s, "#ff7a2a"); f.rect(x + 0.5 * s, y, x + 1.5 * s, y + 0.8 * s, "#ff7a2a");
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.2, 0.18, 6, "#ffffff", 1, "#e8eef4"], [0.7, 0.12, 5, "#ffffff", 0.8, "#e8eef4"]], SKY);
    surf(f, t, 56, 66, { foam: "#f4f8f8", n: 3, period: 4.5, only: SEA, wob: 2 });
    // puffins on the clifftop, turning their heads and shuffling
    for (const [x0, y, s, ph] of [[34, 98, 2.4, 0], [62, 92, 1.8, 1.7], [92, 102, 2.8, 3.1], [128, 90, 1.6, 4.4]]) {
      const facing = Math.sin(t * 0.6 + ph) > 0 ? 1 : -1, x = x0 + Math.round(Math.sin(t * 0.2 + ph) * 3);
      puffin(f, x, y, s, facing);
    }
    // more puffins whirring in on fast wingbeats
    for (let i = 0; i < 4; i++) {
      const p = ((t / 6 + i / 4) % 1), x = lerp(W + 10, 20, p), y = 50 + Math.sin(p * Math.PI) * -14 + i * 4, up = Math.sin(t * 24 + i) > 0;
      f.rect(x, y, x + 3, y + 2, "#141418"); f.put(x - 1, y + 1, "#ff7a2a"); f.put(x + 1, y + (up ? -2 : 3), "#141418"); f.put(x + 2, y + (up ? -2 : 3), "#141418");
    }
    return enc(f);
  };
}
