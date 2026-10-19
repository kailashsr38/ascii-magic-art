/* vector-space-duel: a vector display space duel, two ships circling a star and trading torpedoes on a phosphor screen. */
import { Grid, palette, rng, TAU } from "../lib/kit.js";

export const meta = {
  slug: "vector-space-duel",
  name: "Vector Space Duel",
  category: "retro",
  note: "Two wireframe ships circle a flickering star on a green vector display, firing torpedoes, leaving phosphor trails, until one breaks apart and respawns.",
  tags: ["retro", "vector", "arcade", "space", "game", "hero"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(["#1a5a2a", "#2ec456", "#7aff9a", "#e0ffe6", "#ffffff", "#1c1e22", "#2a2d33", "#3a3e46", "#0a0c0e"]),
};

const BIT = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];
const WEDGE = [[9, 0], [-6, -5], [-3, 0], [-6, 5], [9, 0]];
const NEEDLE = [[10, 0], [-7, -2], [-7, 2], [10, 0]];
const PERIOD = 16, HIT = 8.4, RESPAWN = 11.5;
const DIG = { 0: [[0, 0], [3, 0], [3, 5], [0, 5], [0, 0]], 1: [[1.5, 0], [1.5, 5]], 2: [[0, 0], [3, 0], [3, 2.5], [0, 2.5], [0, 5], [3, 5]] };

export default function create() {
  const W = meta.cols, H = meta.rows, PWd = W * 2, PHt = H * 4;
  const g = new Grid(W, H);
  const bits = new Uint8Array(W * H), lev = new Uint8Array(W * H);
  const R = rng(5);
  const stars = Array.from({ length: 160 }, () => [R() * PWd, R() * PHt]);
  const CX = PWd / 2, CY = PHt / 2;
  const plot = (x, y, l) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= PWd || y >= PHt) return;
    const i = (x >> 1) + (y >> 2) * W;
    bits[i] |= BIT[y & 3][x & 1];
    if (l > lev[i]) lev[i] = l;
  };
  const seg = (x0, y0, x1, y1, l) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) plot(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, l);
  };
  const poly = (pts, x, y, a, l, s = 1) => {
    const c = Math.cos(a), sn = Math.sin(a);
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      seg(x + (ax * c - ay * sn) * s, y + (ax * sn + ay * c) * s, x + (bx * c - by * sn) * s, y + (bx * sn + by * c) * s, l);
    }
  };
  // ship state at time lt
  const shipA = (lt) => { const a = lt * 0.55; return [CX + Math.cos(a) * 62, CY + Math.sin(a) * 40, a + Math.PI / 2 + 0.25 * Math.sin(lt * 1.3)]; };
  const shipB = (lt) => { const a = -lt * 0.42 + 2.2; return [CX + Math.cos(a) * 78, CY + Math.sin(a) * 50, a - Math.PI / 2 + 0.2 * Math.sin(lt)]; };
  const torps = (lt) => {
    const out = [];
    for (let f = 0.5; f < PERIOD; f += 1.6) {
      for (const [who, off] of [["A", 0], ["B", 0.8]]) {
        const ft = f + off, age = lt - ft;
        if (age < 0 || age > 1.3) continue;
        const bAlive = !(ft > HIT - 1.3 && ft < RESPAWN);
        if (who === "B" && !bAlive) continue;
        const [sx, sy] = who === "A" ? shipA(ft) : shipB(ft);
        const [tx, ty] = who === "A" ? shipB(ft + 1.3) : shipA(ft + 1.3);
        const k = age / 1.3;
        if (who === "A" && ft > HIT - 1.4 && ft <= HIT - 1.3 + 0.01) { /* the killing shot */ }
        out.push([sx + (tx - sx) * k * 0.92, sy + (ty - sy) * k * 0.92]);
      }
    }
    return out;
  };
  const scene = (lt, l) => {
    const [ax, ay, aa] = shipA(lt);
    poly(WEDGE, ax, ay, aa, l, 2); poly(WEDGE, ax + 1, ay, aa, l, 2);
    if (Math.floor(lt * 20) % 3) seg(ax - Math.cos(aa) * 7, ay - Math.sin(aa) * 7, ax - Math.cos(aa) * (14 + (Math.floor(lt * 30) % 6)), ay - Math.sin(aa) * (14 + (Math.floor(lt * 30) % 6)), l);
    const bDead = lt > HIT && lt < RESPAWN;
    if (!bDead) {
      const [bx, by, ba] = shipB(lt);
      const grow = lt >= RESPAWN && lt < RESPAWN + 0.5 ? (lt - RESPAWN) / 0.5 : 1;
      poly(NEEDLE, bx, by, ba, l, grow * 2); poly(NEEDLE, bx + 1, by, ba, l, grow * 2);
      poly([[-7, -2], [-10, -5]], bx, by, ba, l, grow * 2); poly([[-7, 2], [-10, 5]], bx, by, ba, l, grow * 2);
    }
    for (const [x, y] of torps(lt)) { for (let q = 0; q < 4; q++) plot(x + (q & 1), y + (q >> 1), l); plot(x - 1, y, l); plot(x + 2, y + 1, l); }
  };
  return (t) => {
    g.clear();
    bits.fill(0); lev.fill(0);
    const lt = t % PERIOD;
    for (const [x, y] of stars) plot(x, y, 1);
    // the star: rays rotating and flickering in length
    const fr = Math.floor(t * 30);
    for (let i = 0; i < 4; i++) {
      const a = t * 1.7 + (i * TAU) / 8;
      const L = 7 + ((fr * 7 + i * 13) % 6);
      seg(CX - Math.cos(a) * L, CY - Math.sin(a) * L, CX + Math.cos(a) * L, CY + Math.sin(a) * L, 4);
    }
    // phosphor trail: older positions dimmer
    scene(lt - 0.16, 1);
    scene(lt - 0.08, 2);
    scene(lt, 4);
    // explosion of ship B
    if (lt > HIT && lt < RESPAWN) {
      const k = lt - HIT;
      const [bx, by] = shipB(HIT);
      const RR = rng(99);
      for (let i = 0; i < 14; i++) {
        const a = RR() * TAU, sp = 6 + RR() * 16, rot = RR() * 6;
        const x = bx + Math.cos(a) * sp * k, y = by + Math.sin(a) * sp * k;
        const L = 4 + RR() * 5;
        if (k < 2.6) seg(x - Math.cos(rot * k) * L, y - Math.sin(rot * k) * L, x + Math.cos(rot * k) * L, y + Math.sin(rot * k) * L, k < 1.2 ? 4 : 2);
      }
    }
    // score in vector digits
    const sa = lt > HIT ? 1 : 0;
    poly(DIG[sa], 14, 8, 0, 3, 1.4); poly(DIG[0], PWd - 20, 8, 0, 3, 1.4);
    // draw cells
    for (let i = 0; i < W * H; i++) if (bits[i]) { g.ch[i] = String.fromCharCode(0x2800 + bits[i]); g.co[i] = String(lev[i] - 1 < 0 ? 0 : lev[i] - 1); }
    // tube bezel: rounded mask
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ex = (x - W / 2 + 0.5) / (W / 2), ey = (y - H / 2 + 0.5) / (H / 2);
      const d = ex ** 4 + ey ** 4;
      if (d > 1) g.set(x, y, "█", "6");
      else if (d > 0.86) g.set(x, y, "▓", "7");
    }
    return g.frame();
  };
}
