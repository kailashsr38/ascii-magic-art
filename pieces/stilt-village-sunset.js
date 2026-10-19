/* stilt-village-sunset: a fishing village of thatched huts on stilts over still water at sunset, hand-built.
 * A static scene (sky, low sun, hills, the water with its reflected sky and sun
 * path, huts, stilts, boardwalk and a palm) is painted once; each frame adds
 * ripple lines, two boats rowing home with their wakes, cooking smoke and birds. */
import { fbm, noise2, clamp, lerp, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const ANCHORS = [
  ["#b84e48", "#d86a4e", "#ec8a56", "#f6a862", "#ffc884", 9],
  ["#ffe0a0", "#fff0c8", "#fffbe8", 3],
  ["#8e4466", "#ac5468", "#cc726c", 3],
  ["#6a3e60", "#7a4a6a", "#8e5a76", 3],
  ["#4e2a48", "#6e3854", "#944a5c", "#bc6460", "#d88262", "#f0a070", 9],
  ["#f2b46a", "#ffd48c", 2],
  ["#1a0c16", "#2a1420", "#3c2030", 3],
  ["#9a7a8e", "#b494a0", "#caa8aa", 3],
  ["#ffb050", 1],
  ["#e09078", "#f2b48a", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "stilt-village-sunset", name: "Stilt Village Sunset", category: "landscapes",
  note: "Thatched huts stand on stilts over calm water as the sun sets, while two fishing boats row home, smoke rises and birds fly over.",
  tags: ["sunset", "village", "fishing", "boats", "water", "halftone", "wallpaper", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";
const SKY = 1, HILL = 2, WATER = 3, HUT = 4;

const C = Object.fromEntries(Object.entries({
  sun: "#fffbe8", sun2: "#fff0c8", glow: "#ffe0a0", cl: "#8e4466", cl2: "#ac5468", cl3: "#cc726c", hill: "#7a4a6a", hill2: "#6a3e60",
  w0: "#4e2a48", w1: "#6e3854", w2: "#944a5c", path: "#f2b46a", path2: "#ffd48c", sil: "#1a0c16", sil2: "#2a1420", sil3: "#3c2030",
  smoke: "#9a7a8e", smoke2: "#b494a0", win: "#ffb050",
}).map(([k, v]) => [k, hex(v)]));

const HOR = 60;

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };
  const SUN = [132, 52], SR = 8;
  const skyAt = (x, y) => {
    const v = y / HOR;
    let c = v < 0.55 ? mix(hex("#b84e48"), hex("#ec8a56"), v / 0.55) : mix(hex("#ec8a56"), hex("#ffc884"), (v - 0.55) / 0.45);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    return mix(c, C.glow, clamp(1 - (d - SR) / 36) ** 1.6 * 0.7);
  };
  // 1. sky, sun, long cloud bands
  for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    put(x, y, d < SR ? (d < SR - 1.5 ? C.sun : C.sun2) : skyAt(x, y), SKY);
  }
  // 2. low hills on the horizon, left and far right
  for (let x = 0; x < W; x++) {
    const top = HOR - Math.max(0, 7 * Math.sin((x - 10) / 34) + 3 * fbm(x / 9, 1, 3, 5) - 1) - (x > 160 ? (x - 160) * 0.12 : 0);
    for (let y = Math.floor(top); y < HOR; y++) put(x, y, y < top + 2 ? C.hill : C.hill2, HILL);
  }
  // 3. water: reflected sky, darker and deeper toward the viewer, with a sun path
  const base = new Float32Array(W * H * 3);
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HOR) / (H - HOR);
    let c = mix(skyAt(x, HOR - 1 - (y - HOR) * 0.9), C.w1, 0.15 + v * 0.45);
    const pw = 5 + v * 14, dx = Math.abs(x - SUN[0]);
    const streak = dx < pw && noise2(x / 6, y * 1.7, 3) > 0.35 + dx / pw * 0.5;
    if (streak) c = v < 0.35 ? C.path2 : C.path;
    put(x, y, c, WATER);
    const i = (y * W + x) * 3; base[i] = c[0]; base[i + 1] = c[1]; base[i + 2] = c[2];
  }
  // 4. the village: huts on stilts, boardwalk, a palm
  const hutShapes = [];
  const hut = (x0, x1, floor, wallH, roofH, stiltTo, winX) => {
    const cx = (x0 + x1) / 2, roofBase = floor - wallH;
    for (let y = roofBase; y < floor; y++) for (let x = x0; x <= x1; x++) put(x, y, x < x0 + 2 ? C.sil3 : C.sil2, HUT);
    for (let y = roofBase - roofH; y <= roofBase; y++) {
      const v = (roofBase - y) / roofH, hw = (x1 - x0) / 2 + 3 - v * ((x1 - x0) / 2 + 2);
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) put(x, y, C.sil, HUT);
    }
    for (let x = x0 - 2; x <= x1 + 2; x++) put(x, floor, C.sil, HUT);
    for (let x = x0; x <= x1; x += 4) for (let y = floor; y <= stiltTo; y++) put(x, y, C.sil, HUT);
    if (winX !== undefined) for (let y = floor - wallH + 2; y < floor - 1; y++) for (let x = winX; x < winX + 3; x++) put(x, y, C.win, HUT);
    hutShapes.push([cx, roofBase - roofH]);
  };
  hut(4, 36, 76, 12, 15, 92, 24);
  hut(46, 66, 68, 8, 10, 79, 57);
  hut(72, 88, 66, 7, 8, 75);
  hut(94, 106, 64, 5, 6, 70, 99);
  // boardwalk joining them
  for (let x = 36; x <= 96; x++) {
    const y = Math.round(x < 46 ? lerp(76, 70, (x - 36) / 10) : x < 72 ? 70 : lerp(68, 65, (x - 72) / 24));
    put(x, y, C.sil, HUT);
    if (x % 5 === 0) for (let yy = y; yy < y + 7 - (x - 36) * 0.05; yy++) put(x, yy, C.sil, HUT);
  }
  // palm leaning over the near hut
  const px = (s) => lerp(40, 30, s) + Math.sin(s * 2.4) * 4, py = (s) => lerp(92, 22, s);
  for (let s = 0; s <= 1; s += 0.01) for (let k = -1; k <= 0; k++) put(px(s) + k, py(s), C.sil, HUT);
  const TX = px(1), TY = py(1);
  for (const [ang, len] of [[-2.7, 20], [-2.2, 17], [-0.5, 21], [-0.1, 18], [-1.6, 9], [0.4, 15], [2.7, 15]]) {
    for (let s = 0; s <= 1; s += 0.02) {
      const x = TX + Math.cos(ang) * len * s, y = TY + Math.sin(ang) * len * s * 0.8 + s * s * len * 0.45;
      put(x, y, C.sil, HUT); if (s < 0.75) put(x, y + 1, C.sil, HUT);
    }
  }
  // reflections of huts and stilts in the water below them
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (mask[i] !== WATER) continue;
    for (let k = 1; k < 20; k++) {
      const sy = y - k * 2; if (sy < HOR) break;
      const j = sy * W + x;
      if (mask[j] === HUT && mask[(sy + 1) * W + x] === WATER && y - sy < 22) {
        const c = mix(base.subarray(i * 3, i * 3 + 3), C.sil2, 0.65);
        put(x, y, c, WATER); base[i * 3] = c[0]; base[i * 3 + 1] = c[1]; base[i * 3 + 2] = c[2];
        break;
      }
    }
  }

  const out = new Float32Array(W * H * 3), adj = new Int8Array(W * H), keyCache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = keyCache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    keyCache.set(k, best);
    return best;
  };
  const birds = [[0, 0, 0], [-4, -2, 1], [-4, 2, 2], [-8, -4, 0.5], [-8, 4, 1.5], [-12, 6, 2.5]];
  const chimneys = [[20, 46], [56, 49]];

  return (t) => {
    out.set(rgb); adj.fill(0);
    const add = (x, y, c, a, only, lv) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (only && mask[i] !== only) return;
      if (!only && mask[i] === HUT) return;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
      if (lv) adj[i] = lv;
    };
    // drifting cloud bands
    const clouds = [[0.15, 70, 14, 1.2, C.cl, 0.5], [0.7, 90, 24, 1.6, C.cl2, 0.8], [0.45, 60, 36, 1, C.cl3, 0.65], [0.95, 50, 8, 0.9, C.cl, 0.4]];
    for (const [u, L, cy, th, col, sp] of clouds) {
      const span = W + L * 2, cx = ((((u * W - t * sp) % span) + span) % span) - L;
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.12 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.4 * (0.4 + along)));
        if (a > 0.05) add(x, y, col, a * 0.85, SKY);
      }
    }
    // ripple lines sliding toward the viewer, darker troughs on the water
    for (let y = HOR + 1; y < H; y++) {
      const ph = 40 / (y - HOR + 4) - t * 0.5, s = Math.sin(ph * 6.28 + noise2(0, y, 2) * 2);
      if (s < 0.82) continue;
      for (let x = 0; x < W; x++) {
        if (noise2(x / 9 + y, t * 0.4, 6) < 0.45) continue;
        add(x, y, C.w1, 0.4, WATER, -1);
      }
    }
    // two boats rowing home toward the village, the near one larger, each with a V wake
    const boats = [[40, 92, 1.0, 0], [60, 72, 0.55, 22]];
    for (const [period, by, sc, off] of boats) {
      const u = ((t + off) % period) / period, bx = lerp(W + 30, 60, u);
      const L = Math.round(22 * sc);
      for (let k = 1; k < 30 * sc; k++) {
        const wy = Math.round(by + 1 + k * 0.12 * sc * 3), spread = k * 0.9;
        if (wy >= H) break;
        add(bx + L / 2 + k * 1.6, wy - Math.round(k * 0.25 * sc), C.w2, 0.6 * (1 - k / (30 * sc)), WATER, 1);
        add(bx + L / 2 + k * 1.6, by + 1 + Math.round(k * 0.12 * sc), C.w1, 0.5 * (1 - k / (30 * sc)), WATER);
      }
      for (let x = 0; x < L; x++) {
        const curve = Math.round(((x - L / 2) / (L / 2)) ** 2 * 2 * sc);
        for (let y = by - Math.round(2 * sc) + curve; y <= by; y++) add(bx + x, y, C.sil, 1);
      }
      // rower standing at the stern, pole sweeping
      const rx = bx + L - 4 * sc, hgt = Math.round(9 * sc);
      for (let y = by - hgt; y < by - 1; y++) add(rx, y, C.sil, 1);
      add(rx, by - hgt - 1, C.sil, 1); add(rx + 1, by - hgt, C.sil, 1); add(rx - 1, by - hgt, C.sil, 1);
      const sw = Math.sin(t * 1.6 + off) * 0.5;
      for (let s = 0; s < 14 * sc; s++) add(rx + 1 + s * (0.5 + sw * 0.3), by - hgt + 2 + s, C.sil, 1);
      // seated fisher at the bow
      for (let y = by - Math.round(4 * sc); y < by - 1; y++) add(bx + 5 * sc, y, C.sil, 1);
    }
    // cooking smoke from two roofs, rising and leaning with the breeze
    for (const [cx, cy] of chimneys) for (let k = 0; k < 16; k++) {
      const a = ((t * 0.5 + k / 16) % 1), y = cy - a * 30, x = cx + a * a * 18 + Math.sin(a * 6 + t * 0.7) * 1.5;
      const r = 1 + a * 3.5, al = (1 - a) * 0.55;
      for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        const d = Math.hypot(xx - x, yy - y);
        if (d < r) add(xx, yy, a < 0.4 ? C.smoke : C.smoke2, al * clamp(r - d), SKY);
      }
    }
    // birds flying home in a loose V
    const bt = (t % 24) / 24, fx = lerp(-20, W + 30, bt), fy = 18 + Math.sin(bt * 5) * 3;
    for (const [dx, dy, ph] of birds) {
      const x = Math.round(fx + dx), y = Math.round(fy + dy), up = Math.sin(t * 8 + ph) > 0;
      add(x, y, C.sil, 1, SKY); add(x - 1, y + (up ? -1 : 0), C.sil, 1, SKY); add(x + 1, y + (up ? -1 : 0), C.sil, 1, SKY);
    }

    const text = [], color = [];
    for (let y = 0; y < H; y++) {
      let tr = "", cr = "";
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, r = out[i], g = out[i + 1], b = out[i + 2];
        const k = nearest(r, g, b), Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const lv = Y > 0.86 ? 7 : clamp(Math.round(5 + (Y - LUM[k]) * 12) + adj[y * W + x], 2, 6);
        tr += LEVELS[lv]; cr += KEYS[k];
      }
      text.push(tr); color.push(cr);
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
}
