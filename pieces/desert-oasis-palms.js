/* desert-oasis-palms: a ring of date palms around a turquoise pool deep in golden dunes, a traveller leading camels down to the water, hand-built.
 * Painted once: the hot pale sky, great dunes with sharp crests and shadowed lee faces, the green pool
 * fringed with reeds and mirrored palms, and the palms themselves. Each frame walks the traveller and
 * camels down the dune, blows sand off the crests, sways the palms, ripples the pool and flies a hawk. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, palm, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, DUNE = 2, POOL = 3, REED = 4;

const base = new Canvas();
base.sky([[0, "#7aa8d8"], [0.7, "#d8e0e0"], [1, "#f4ead4"]], SKY, 0, 60);
// the dunes: sharp crests, lit faces gold, lee faces in warm shadow
const DUNES = [[56, 18, 150, 0.55, "#fce4b4", "#e8b88c"], [66, 26, 40, 0.4, "#fcdca4", "#e4b084"], [80, 20, 170, 0.5, "#f8d49c", "#dca87c"]];
for (const [base0, h, cx, k, lit, sh] of DUNES) {
  const crest = (x) => { const u = (x - cx) / (W * k); return base0 - h * Math.exp(-u * u * 3) - fbm(x / 20, base0, 2, 3) * 3; };
  for (let x = 0; x < W; x++) {
    const c = crest(x), py = crest(cx);
    // the slip face: everything right of the ridge line running down from the peak lies in shadow
    for (let y = Math.floor(c); y < H; y++) { const ridge = cx + (y - py) * 1.1 + Math.sin(y / 5) * 2, lee = clamp((x - ridge) / 3 + 0.5); base.put(x, y, mix(mix(hex(lit), hex(sh), lee), hex("#d8b080"), clamp((y - c) / 40) * 0.5), DUNE); }
  }
}
// the oasis pool, mirrored sky, reeds round its edge
for (let y = 82; y < 100; y++) for (let x = 50; x < 150; x++) {
  const d = Math.hypot((x - 100) / 46, (y - 91) / 7) + fbm(x / 8, y / 3, 2, 4) * 0.12;
  if (d < 1) base.put(x, y, mix(hex("#b8ece0"), hex("#6ac0c4"), clamp((y - 84) / 14)), POOL);
  else if (d < 1.15) base.put(x, y, noise2(x, y, 3) > 0.4 ? hex("#7aa050") : hex("#5a8040"), REED);
}

balance(base, 0.3);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#2a2420", "#3a5a2a", "#5a7a3a", "#5a3a28", "#3a6aa8", "#e8c8a0", "#fff4dc"] });

export const meta = {
  slug: "desert-oasis-palms",
  name: "Desert Oasis Palms",
  category: "landscapes",
  note: "Date palms ring a turquoise pool deep in the golden dunes as a traveller leads camels down to the water and the wind lifts sand off the crests.",
  tags: ["oasis", "desert", "palms", "dunes", "sahara", "camels", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const PALMS = [[56, 88, 22, 0.3], [70, 84, 28, -0.1], [84, 83, 18, 0.2], [122, 83, 24, -0.25], [138, 86, 30, 0.15], [148, 90, 20, -0.3]];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // sand streaming off the dune crests in the wind
    for (const [base0, h, cx] of DUNES.slice(0, 2)) for (let k = 0; k < 24; k++) { const s = ((t * 0.6 + k / 24) % 1), x = cx - 4 + s * 30 + Math.sin(k) * 3, y = base0 - h - 1 - s * 4 + Math.sin(k * 2) * 1.5; f.add(x, y, "#fff4dc", (1 - s) * 0.55); }
    // the palms' reflections, then the palms swaying
    for (const [x, y, h, lean] of PALMS) palm(f, x, y, h, { c: "#3a5a2a", lean, sway: Math.sin(t * 0.9 + x) * 1.4 });
    for (let x = 50; x < 150; x++) for (let y = 84; y < 100; y++) if (f.maskAt(x, y) === POOL) { const src = f.get(x, 2 * 84 - y - 4); if (src[1] < 110) f.add(x, y, "#3a5a2a", 0.4, POOL); }
    // ripples on the pool where a camel drinks
    for (let k = 0; k < 16; k++) { const r = ((t * 3) % 10) + 1, a = (k / 16) * Math.PI * 2; f.add(108 + Math.cos(a) * r * 2, 86 + Math.sin(a) * r * 0.4, "#ffffff", 0.45 * (1 - r / 11), POOL); }
    // the traveller and two camels coming down the dune to the water (30 s)
    const p = Math.min(1, (t % 36) / 28);
    for (let i = 0; i < 3; i++) {
      const u = clamp(p - i * 0.08), x = lerp(186, 112, u) + i * 0, y = lerp(56, 84, u) + 0, step = u < 1 ? Math.floor(t * 3 + i) : 0;
      const xx = Math.round(x + i * 10), yy = Math.round(y + i * 1);
      if (i === 0) { f.rect(xx, yy - 6, xx + 1, yy - 1, "#fff4dc"); f.rect(xx, yy - 8, xx + 1, yy - 6, "#3a6aa8"); f.put(xx + (step % 2), yy, "#2a2420"); continue; }
      f.ellipse(xx, yy - 6, 4, 2, "#5a3a28"); f.ellipse(xx, yy - 8, 2, 1.4, "#5a3a28");
      f.line(xx - 3, yy - 6, xx - 6, yy - 10, "#5a3a28", 1); f.rect(xx - 8, yy - 11, xx - 5, yy - 10, "#5a3a28");
      for (const [lx, ph] of [[-3, 0], [-1, 1], [2, 1], [3, 0]]) f.line(xx + lx, yy - 5, xx + lx + ((step + ph) % 2 ? 1 : -1), yy, "#5a3a28", 1);
    }
    // a hawk circling high
    const ha = t * 0.4, hx = 60 + Math.cos(ha) * 30, hy = 14 + Math.sin(ha) * 5;
    f.put(hx, hy, "#2a2420"); f.put(hx - 1, hy, "#2a2420"); f.put(hx + 1, hy, "#2a2420"); f.put(hx - 2, hy - 1, "#2a2420"); f.put(hx + 2, hy - 1, "#2a2420");
    return enc(f);
  };
}
