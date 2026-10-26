/* limestone-bay-junks: a bay of tall limestone islands fading into morning haze, junk boats with ribbed sails crossing the jade water, hand-built.
 * Painted once: the pale hazy sky, rank after rank of steep forested limestone islands, the far ones
 * blue and faint and the near ones green and undercut at the waterline, and the jade water mirroring
 * them. Each frame sails the junks with their wakes, paddles a kayak past, drifts the mist between the
 * islands and flies birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, KARST = 2, SEA = 3;
const WL = 64;

const base = new Canvas();
base.sky([[0, "#a8bcd0"], [0.7, "#dce4e4"], [1, "#eef0e8"]], SKY, 0, WL + 1);
base.glow(150, 22, 6, 30, "#fff8e8", 0.5, SKY);
// the islands, rank by rank from the haze: each a cluster of steep-sided, round-topped humps,
// forest-green and lit from the left, pale cliff showing where the rock breaks through, notched at the waterline
function rank(far, list, seed) {
  const lit = mix(hex("#7a9884"), hex("#d0d8de"), far), sh = mix(hex("#4a6a5c"), hex("#bcc6d0"), far);
  const top = new Float32Array(W).fill(WL), lo = new Float32Array(W).fill(W), hi = new Float32Array(W).fill(-1);
  for (const [cx, w, h] of list) for (let x = Math.floor(cx - w / 2); x <= cx + w / 2; x++) {
    if (x < 0 || x >= W) continue;
    const u = (x - cx) / (w / 2), y = WL - h * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3)), 0.4) - fbm(x / 3, seed, 2, seed) * 2;
    if (y < top[x]) { top[x] = y; lo[x] = cx - w / 2; hi[x] = cx + w / 2; }
  }
  for (let x = 0; x < W; x++) {
    if (top[x] >= WL - 1) continue;
    const u = (x - lo[x]) / (hi[x] - lo[x] + 0.01), streak = Math.sin(x * 1.9 + seed) > 0.7 ? 0.12 : 0;
    for (let y = Math.floor(top[x]); y < WL; y++) {
      if (y > WL - 3 && (u < 0.12 || u > 0.88)) continue;
      base.put(x, y, mix(mix(lit, sh, clamp(u * 0.8 + streak + (y - top[x]) / 120)), hex("#eef0ec"), clamp((y - WL + 14) / 20) * 0.5), KARST);
    }
  }
}
rank(0.85, [[18, 26, 20], [44, 14, 26], [86, 34, 18], [128, 18, 24], [160, 30, 21], [186, 16, 25]], 1);
rank(0.55, [[4, 22, 30], [62, 20, 32], [74, 12, 24], [118, 28, 28], [140, 14, 34]], 2);
rank(0.25, [[36, 34, 40], [52, 16, 46], [172, 30, 44], [188, 18, 52]], 3);
// the jade bay, bright with the sky, the islands' reflections soft in it
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => { const src = snap.get(x, 2 * WL - y - 1), isl = snap.maskAt(x, 2 * WL - y - 1) === KARST; const water = mix(hex("#dce6e2"), hex("#9ab8b2"), clamp((y - WL) / 44)); return isl ? mix(water, src, clamp(0.45 - (y - WL) / 60)) : water; }, SEA);

balance(base, 0.4);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f4f4ee", "#e89a72", "#d8805a", "#3a2a22", "#f2c84a", "#e86a4a"] });

export const meta = {
  slug: "limestone-bay-junks",
  name: "Limestone Bay Junks",
  category: "landscapes",
  note: "Junk boats with ribbed orange sails cross a jade bay between tall limestone islands that fade rank after rank into the morning haze, a kayak paddling past.",
  tags: ["ha-long-bay", "vietnam", "limestone", "islands", "junk-boats", "bay", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a junk under sail: dark hull with a raised stern, three battened sails
function junk(f, x, y, s) {
  f.rect(x - 9 * s, y - 2 * s, x + 9 * s, y, "#3a2a22"); f.rect(x + 6 * s, y - 4 * s, x + 10 * s, y - 2 * s, "#3a2a22");
  for (const [dx, hh] of [[-5, 12], [1, 16], [6, 10]]) {
    const sx = x + dx * s, top = y - 2 * s - hh * s;
    f.rect(sx, top, sx + 1, y - 2 * s, "#3a2a22");
    for (let yy = Math.floor(top); yy < y - 3 * s; yy++) {
      const w = 3 * s + (yy - top) * 0.25, rib = Math.floor((yy - top) / (2.4 * s)) % 2 === 0 && (yy - top) % (2.4 * s) < 1;
      f.rect(sx - w * 0.3, yy, sx + w, yy + 1, rib ? "#d8805a" : "#e89a72");
    }
  }
  for (let k = 1; k < 18; k++) f.add(x - 9 * s - k * 1.4, y + (k % 3 === 0 ? 1 : 0), "#f4f4ee", (1 - k / 18) * 0.5, SEA);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 46, y1: 66, c: "#f4f4ee", a: 0.55, speed: 0.05, scale: 26, cut: 0.42, only: KARST });
    // junks sailing: a far one small, a near one large, at their own speeds
    junk(f, ((t * 1.2 + 60) % (W + 50)) - 25, 70, 0.6);
    junk(f, ((t * 2.2 + 110) % (W + 70)) - 35, 92, 1.1);
    // a kayak paddling the other way, paddle blades dipping
    const kx = W + 10 - ((t * 4) % (W + 20)), ky = 80, dip = Math.sin(t * 5);
    f.rect(kx - 4, ky, kx + 4, ky + 1, "#f2c84a"); f.put(kx, ky - 1, "#e86a4a"); f.put(kx, ky - 2, "#e8c8a0");
    f.line(kx - 3, ky - 1 + dip, kx + 3, ky - 1 - dip, "#3a2a22", 1);
    birds(f, t, { n: 4, y: 20, period: 16, c: "#4a5a5a", only: SKY });
    return enc(f);
  };
}
