/* venice-gondola-canal: a canal between old palaces in late sun, a gondolier rowing through, hand-built.
 * Painted once: the sky, the stone bridge far down the canal, the palaces on both banks with their arched
 * windows, balconies and striped mooring poles, and the green water with their reflections. Each frame
 * adds the gondola and the gondolier's stroke, a water bus far off, pigeons and drifting cloud. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, arch, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, WALL = 2, WATER = 3;
const VX = 96;
// perspective along each bank: u = 0 at the near edge of the frame, 1 at the bridge
const L_X = (u) => lerp(-2, 74, u), R_X = (u) => lerp(W + 1, 118, u);
const TOPY = (u) => lerp(0, 40, u), WATY = (u) => lerp(84, 64, u);
const WL = 64; // where the banks meet the bridge

const base = new Canvas();
base.sky([[0, "#86a8d4"], [0.6, "#d4ccd8"], [1, "#f8d8b4"]], SKY, 0, 70);
// the stone bridge across the far end, one wide arch
base.rect(70, 52, 122, 66, (x, y) => mix(hex("#f6e6cc"), hex("#c8ac90"), clamp((x - 70) / 52 * 0.6 + (y - 52) / 30)), WALL);
base.rect(68, 49, 124, 52, "#e8d4b8", WALL);
for (let x = 70; x < 122; x += 4) base.rect(x, 46, x + 2, 49, "#e8d4b8", WALL);
base.each(VX - 16, 56, VX + 17, 67, (x, y) => (((x + 0.5 - VX) / 16) ** 2 + ((y + 0.5 - 67) / 10) ** 2 <= 1 ? hex("#dccad0") : null), WALL); // a low segmental arch, the far canal seen through it
// palaces on both banks, each its own colour, windows following the perspective
const R = rng(12), FACADE = ["#eaa878", "#d88a6a", "#f4cc94", "#cc7e6c", "#ecc8a6", "#dca4a0", "#f2dcc0", "#e8b4a0"];
for (const side of [-1, 1]) {
  const X = side < 0 ? L_X : R_X;
  let u = 0;
  while (u < 0.98) {
    const du = Math.min(0.98 - u, 0.13 + R() * 0.12), c = hex(FACADE[Math.floor(R() * FACADE.length)]);
    const lift = R() * 4, shade = side < 0 ? 0.08 : 0.3;
    // the facade: column by column between its two edges
    const xa = X(u), xb = X(u + du), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    for (let x = Math.floor(x0); x <= x1; x++) {
      const uu = lerp(u, u + du, (x - xa) / (xb - xa || 1)), top = TOPY(uu) - lift * (1 - uu), bot = WATY(uu);
      for (let y = Math.max(0, Math.floor(top)); y < bot; y++) {
        const n = noise2(x / 2, y / 2, 4) * 0.08, low = y > bot - 3 ? 0.35 : 0;
        base.put(x, y, mix(c, hex("#6a5058"), clamp(shade + n + low)), WALL);
      }
      base.put(x, Math.floor(top), mix(c, hex("#fff4e4"), 0.4), WALL); // the cornice catches the light
    }
    // windows: three columns, three rows, all on the same perspective
    for (const kx of [0.22, 0.5, 0.78]) for (const ky of [0.18, 0.42, 0.66]) {
      const uu = lerp(u, u + du, kx), x = X(uu), top = TOPY(uu) - lift * (1 - uu), hgt = WATY(uu) - top;
      const ww = Math.max(1, Math.round(4 * (1 - uu))), wh = Math.max(1, Math.round(hgt * 0.13));
      arch(base, x - ww / 2, top + hgt * ky, ww, wh, "#3a2a32", WALL);
      if (ky === 0.42 && ww > 2) base.rect(x - ww / 2 - 1, top + hgt * ky + wh, x + ww / 2 + 1, top + hgt * ky + wh + 1, "#f4ece0", WALL); // a balcony rail
    }
    u += du;
  }
}
// striped mooring poles standing in the water
for (const [u, side] of [[0.08, -1], [0.14, -1], [0.1, 1], [0.17, 1], [0.6, -1], [0.62, 1]]) {
  const x = Math.round((side < 0 ? L_X(u) : R_X(u)) - side * (6 - u * 5)), y0 = WATY(u) - 18 * (1 - u), y1 = WATY(u) + 6 * (1 - u);
  for (let y = Math.floor(y0); y < y1; y++) base.put(x, y, Math.floor(y / 3) % 2 ? "#f4f0e8" : "#2a5a9a", WALL);
}
// the water: every column mirrors what stands above its own water line, darkened, broken by slow ripples
const wl = new Float32Array(W);
for (let x = 0; x < W; x++) {
  let y = WL; while (y < H && base.maskAt(x, y) !== 0) y++;
  wl[x] = x < 70 || x > 122 ? y : 66;
}
const snap = new Canvas().copy(base);
for (let x = 0; x < W; x++) for (let y = Math.floor(wl[x]); y < H; y++) {
  const sy = Math.round(2 * wl[x] - y - 1 + Math.sin(y * 0.9 + x * 0.07) * 1.1);
  const refl = sy >= 0 ? snap.get(x, sy) : hex("#86a8d4");
  base.put(x, y, mix(refl, hex("#3e6a62"), clamp(0.42 + (y - wl[x]) / 70)), WATER);
}

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#14121a", "#f4f0e8", "#c83a3a", "#ffffff", "#e8c890", "#2a2a3a"] });

export const meta = {
  slug: "venice-gondola-canal",
  name: "Venice Gondola Canal",
  category: "cities",
  note: "A canal between old palaces in late sun, their colours mirrored in the green water as a gondolier rows through and pigeons cross the sky.",
  tags: ["venice", "gondola", "canal", "italy", "landmark", "halftone", "boats", "water"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.3, 0.22, 0.2, 1, "#f2e4d8", 0.5], [0.8, 0.18, 0.35, 0.8, "#e8d0c8", 0.6]], SKY, 0.7);
    // a water bus crossing under the bridge far off
    const vb = VX - 30 + across(t, 4, 0.2, 60, 6);
    f.rect(vb, 68, vb + 6, 70, "#f4f0e8"); f.rect(vb + 1, 67, vb + 4, 68, "#2a2a3a");
    // the gondola: long, black, curling at both ends, gliding toward us and back
    const ph = (t % 30) / 30, gx = lerp(40, 150, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2)), gy = 90, dir = ph < 0.5 ? 1 : -1;
    for (let i = -18; i <= 18; i++) { const lift = Math.pow(Math.abs(i) / 18, 4) * 4; f.put(gx + i, gy - lift, "#14121a"); f.put(gx + i, gy + 1 - lift * 0.6, "#14121a"); }
    f.put(gx + 18 * dir, gy - 5, "#e8c890"); f.put(gx + 18 * dir, gy - 6, "#e8c890"); // the ferro at the prow
    // passengers under a red cover, and the gondolier at the stern working the oar
    f.rect(gx - 4, gy - 4, gx + 4, gy - 1, "#c83a3a");
    const sx = gx - 12 * dir, stroke = Math.sin(t * 1.6);
    f.put(sx, gy - 8, "#e8c8a0"); f.rect(sx - 1, gy - 7, sx + 1, gy - 1, "#f4f0e8"); f.rect(sx - 1, gy - 5, sx + 1, gy - 4, "#2a5a9a");
    f.line(sx + dir * (1 + stroke), gy - 6, sx - dir * (3 - stroke * 3), gy + 3, "#5a3a2a", 1);
    birds(f, t, { n: 5, y: 14, period: 12, c: "#2a2a3a", only: SKY });
    return enc(f);
  };
}
