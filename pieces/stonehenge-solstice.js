/* stonehenge-solstice: the stone circle at dawn on the solstice, the sun rising through a gap, hand-built.
 * Painted once: the dawn sky, the low sun, the plain, the outer ring of sarsens with their lintels and the
 * tall inner trilithons. Each frame adds ground mist drifting through the stones, rooks and grazing sheep. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, clouds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, LAND = 2, STONE = 3;
const HOR = 66, SUN = [118, 63];

const base = new Canvas();
base.sky([[0, "#5a5f8e"], [0.3, "#9a7ea0"], [0.55, "#e89a8a"], [0.8, "#ffc684"], [1, "#ffe2a6"]], SKY, 0, HOR + 1);
base.glow(SUN[0], SUN[1], 5, 44, "#fff3cc", 0.7, SKY);
// the plain, gold-green in the low light, darker toward us
base.rect(0, HOR, W, H, (x, y) => {
  const n = fbm(x / 10, y / 3, 3, 4), u = (y - HOR) / (H - HOR);
  return mix(mix(hex("#c8b878"), hex("#6a7a3e"), clamp(u * 1.3)), hex("#4a5a2c"), clamp(n - 0.45) * 0.8);
}, LAND);
// the ring, seen from a little above: back stones high and small, front ones low and big
const N = 22, FALLEN = [5, 13, 17, 19];
const ring = [];
for (let i = 0; i < N; i++) {
  const a = (i / N) * Math.PI * 2 + 0.1;
  ring.push({ i, a, x: 96 + Math.cos(a) * 68, y: 74 + Math.sin(a) * 9, front: Math.sin(a), up: !FALLEN.includes(i) });
}
const stoneCol = (xx, y, x, w) => {
  const rim = xx > x + w / 2 - 1.2 ? 0.45 : 0; // the edge facing the sun catches it
  const n = noise2(xx / 1.6, y / 1.6, 8) * 0.25 + fbm(xx / 4, y / 4, 2, 3) * 0.2;
  return mix(mix(hex("#6e6672"), hex("#a0948a"), n), hex("#ffcf94"), rim);
};
const stone = (x, by, w, h) => {
  for (let y = Math.floor(by - h); y <= by; y++) for (let xx = Math.floor(x - w / 2); xx <= x + w / 2; xx++) base.put(xx, y, stoneCol(xx, y, x, w), STONE);
};
const size = (s) => { const k = (s.front + 1) / 2; return [lerp(4, 7, k), lerp(11, 19, k)]; };
// back half first, with continuous lintels joining neighbours along the top
const back = ring.filter((s) => s.front < 0.25).sort((p, q) => p.y - q.y);
for (const s of back) if (s.up) { const [w, h] = size(s); stone(s.x, s.y, w, h); }
for (let i = 0; i < N; i++) {
  const p = ring[i], q = ring[(i + 1) % N];
  if (p.front >= 0.25 || q.front >= 0.25 || !p.up || !q.up) continue;
  const [, hp] = size(p), [, hq] = size(q);
  for (let k = 0; k <= 1; k++) base.line(p.x - 2, p.y - hp - 1 + k, q.x + 2, q.y - hq - 1 + k, k ? "#7a7068" : "#b8a896", 1, STONE);
}
// the great inner trilithons, the sun between the middle pair, then the front of the ring
for (const [x, w, h] of [[84, 6, 25], [96, 6, 28], [131, 6, 24], [143, 6, 22]]) stone(x, 76, w, h);
for (const [x0, x1, h] of [[81, 99, 28], [128, 146, 24]]) for (let x = x0; x <= x1; x++) for (let y = 76 - h - 3; y < 76 - h; y++) base.put(x, y, mix(hex("#8a8078"), hex("#c0b09c"), noise2(x, y, 4) * 0.5 + (y === 76 - h - 3 ? 0.4 : 0)), STONE);
for (const s of ring.filter((s) => s.front >= 0.25).sort((p, q) => p.y - q.y)) {
  const [w, h] = size(s);
  if (s.up) stone(s.x, s.y, w, h);
  else for (let x = Math.floor(s.x - h / 2); x < s.x + h / 2; x++) for (let y = s.y - 3; y <= s.y; y++) base.put(x, y, stoneCol(x, y, s.x, h), STONE); // fallen, lying in the grass
}
// the heel stone out on the plain, and long shadows toward us
stone(170, 92, 7, 14);
for (let y = 80; y < H; y++) for (let x = 0; x < W; x++) if (base.maskAt(x, y) === LAND && noise2(x / 3, 1, 2) > 0.7 && (x * 7 + y) % 9 === 0) base.add(x, y, "#3e4a24", 0.3);

balance(base);
const PAL = fitPalette(base, { n: 54, extras: ["#f6f0e2", "#1e1a1c", "#efe6d4"] });

export const meta = {
  slug: "stonehenge-solstice",
  name: "Stonehenge Solstice Dawn",
  category: "cities",
  note: "The ancient stone circle at dawn on the solstice, the sun rising through its stones while ground mist drifts between them and sheep graze the plain.",
  tags: ["stonehenge", "solstice", "dawn", "england", "landmark", "wonder", "halftone", "mist"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const SHEEP = [[20, 98, 0.0], [44, 102, 1.3], [160, 100, 2.1], [182, 96, 0.7]];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.15, 0.35, 0.18, 1.2, "#e8a6a0", 0.4], [0.6, 0.28, 0.3, 1, "#b590a8", 0.3], [0.9, 0.22, 0.12, 0.8, "#ffd6a8", 0.5]], SKY, 0.7);
    mist(f, t, { y0: 60, y1: 82, c: "#f6e8d8", a: 0.5, speed: 0.07, scale: 26, cut: 0.46 });
    birds(f, t, { n: 5, y: 22, period: 17, c: "#1e1a1c", only: SKY });
    // sheep grazing: woolly blobs that inch along with their heads down
    for (const [x0, y, ph] of SHEEP) {
      const x = Math.round(x0 + Math.sin(t * 0.08 + ph) * 6), down = Math.sin(t * 0.9 + ph * 3) > 0;
      f.rect(x - 2, y - 2, x + 3, y, "#efe6d4");
      f.put(x - 3, y - (down ? 0 : 1), "#1e1a1c"); f.put(x - 2, y + 1, "#1e1a1c"); f.put(x + 2, y + 1, "#1e1a1c");
    }
    return enc(f);
  };
}
