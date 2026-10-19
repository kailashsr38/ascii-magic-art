/* harbour-sails-opera: an opera house of shell roofs in a harbour at sunset, hand-built picture scene. Static: sky, sun, city, arch bridge, water, opera house. Per frame: ripples and two ferries with wakes. */
import { fbm, noise2, clamp, lerp, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const HX = new Map();
const hex = (h) => { let v = HX.get(h); if (!v) { v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); HX.set(h, v); } return v; };
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ramp = (stops, t) => {
  t = clamp(t);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(hex(stops[i - 1][1]), hex(stops[i][1]), (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  return hex(stops[stops.length - 1][1]);
};
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
// Palette: hand-picked anchors, filled in with steps between.
function buildPal(anchors) {
  const P = [];
  for (const a of anchors) {
    const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
    for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); P.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
  }
  return P;
}
function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };
const LEVELS = "▁▂▃▄▅▆▇█";
// The painted picture: rgb plus a layer id per cell (0 = sky, larger = nearer).
function makeCanvas() {
  const rgb = new Float32Array(W * H * 3), layer = new Uint8Array(W * H);
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; if (L !== undefined) layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  return { rgb, layer, put, blend };
}
// Per frame: a working copy, a layer-aware blend, and the conversion to text.
function makeFrame(rgb, layer, PAL) {
  const out = new Float32Array(W * H * 3), cache = new Map();
  const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = cache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    cache.set(k, best);
    return best;
  };
  // add: blend colour c by a at x,y, only where the painted layer is at or behind `upTo`
  const add = (x, y, c, a = 1, upTo = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (layer[i] > upTo) return;
    out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
  };
  const begin = () => out.set(rgb);
  const finish = () => {
    const text = [], color = [];
    for (let y = 0; y < H; y++) {
      let tr = "", cr = "";
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, r = clamp(out[i], 0, 255), g = clamp(out[i + 1], 0, 255), b = clamp(out[i + 2], 0, 255);
        const k = nearest(r, g, b), Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const lv = Y > 0.86 ? 7 : clamp(Math.round(5 + (Y - LUM[k]) * 12), 3, 6);
        tr += LEVELS[lv]; cr += KEYS[k];
      }
      text.push(tr); color.push(cr);
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
  return { out, add, begin, finish };
}

const PAL = buildPal([
  ["#3e4a80", "#7a6a98", "#c47a8a", "#e8956e", "#f6b276", "#f8c890", 12],
  ["#fff4da", "#ffe0a8", 2],
  ["#1a1628", "#2a2440", "#3e3658", 3],
  ["#6a5a80", "#887098", "#f0b060", 3],
  ["#f2d4b4", "#e0bc9c", "#c49e86", "#a08070", 4],
  ["#b88a74", "#8a6658", 2],
  ["#2e3a68", "#4a4a7a", "#7a5a80", "#b0707a", 4],
  ["#2e6a4a", "#e0d0b0", "#c8a040", 3],
  ["#d8b8a8", 1],
]);

export const meta = {
  slug: "harbour-sails-opera", name: "Harbour Sails Opera", category: "cities",
  note: "An opera house of white shell roofs sits on its point in a wide harbour at sunset, with a steel arch bridge behind and green ferries crossing with their wakes.",
  tags: ["harbour", "opera-house", "bridge", "sunset", "ferry", "city", "landmark", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, CITY = 1, BRIDGE = 2, WATER = 3, OPERA = 4;
const HOR = 58;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const SUN = [92, 38], SUNR = 5;
  // 1. sunset sky, gold low on the left where the sun sits
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#3e4a80"], [0.3, "#7a6a98"], [0.55, "#c47a8a"], [0.75, "#e8956e"], [0.9, "#f6b276"], [1, "#f8c890"]], y / HOR);
    c = mix(c, hex("#f8c890"), clamp(1 - Math.hypot(x - SUN[0], (y - SUN[1]) * 1.4) / 55) * 0.6);
    put(x, y, c, SKY);
  }
  for (let y = 10; y < 44; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 40, y / 3, 3, 3);
    if (n > 0.58) blend(x, y, hex("#e8956e"), clamp((n - 0.58) * 4) * 0.5);
  }
  // the sun, the one bright point
  for (let y = SUN[1] - 7; y <= SUN[1] + 7; y++) for (let x = SUN[0] - 7; x <= SUN[0] + 7; x++) {
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SUNR) put(x, y, d < SUNR - 1.3 ? hex("#fff4da") : hex("#ffe0a8"));
  }
  // 2. far city towers across the water, hazy, a few windows lit
  const R = (a, b) => hash(a, b);
  for (let i = 0; i < 26; i++) {
    const bx = Math.round(96 + R(i, 1) * 96), bw = 3 + Math.round(R(i, 2) * 5), bh = 5 + Math.round(R(i, 3) * R(i, 3) * 9);
    for (let y = HOR - bh; y < HOR; y++) for (let x = bx; x < bx + bw; x++) {
      const win = (x - bx) % 2 === 1 && (y % 3 === 0) && R(x * 7 + y, i) > 0.82;
      put(x, y, win ? hex("#f0b060") : mix(hex("#887098"), hex("#6a5a80"), (x - bx) / bw), CITY);
    }
  }
  // the far shore, low hills right across the harbour
  for (let x = 0; x < W; x++) { const top = HOR - 3 - 2.5 * fbm(x / 14, 4, 3, 5); for (let y = Math.floor(top); y < HOR; y++) if (layer[y * W + x] === SKY) put(x, y, mix(hex("#887098"), hex("#6a5a80"), (y - top) / 3), CITY); }
  // low headland on the right
  for (let x = 120; x < W; x++) { const top = HOR - 2 - 2 * fbm(x / 8, 1, 3, 2); for (let y = Math.floor(top); y < HOR; y++) put(x, y, hex("#6a5a80"), CITY); }
  // 3. the arch bridge on the left: two pylons, a deck and a steel arch with hangers
  const DK = hex("#2a2440"), DK2 = hex("#1a1628"), DK3 = hex("#3e3658");
  const DECK = 47, A0 = 4, A1 = 82, AP = 22;
  const archY = (x, off) => DECK + 9 - (DECK + 9 - AP - off) * Math.sqrt(Math.max(0, 1 - ((x - (A0 + A1) / 2) / ((A1 - A0) / 2)) ** 2));
  for (let x = A0; x <= A1; x++) {
    const yt = archY(x, 0), yb = archY(x, 4);
    for (let y = Math.floor(yt); y <= yb; y++) {
      const tr = Math.abs(((x - A0) % 6) - (y - yt) * 1.4) < 0.8 || y === Math.floor(yt) || y === Math.floor(yb);
      if (tr) put(x, y, DK, BRIDGE);
    }
    if (x % 4 === 0 && yb < DECK) for (let y = Math.floor(yb); y < DECK; y++) put(x, y, DK3, BRIDGE);
  }
  for (let x = -2; x < 100; x++) { put(x, DECK, DK2, BRIDGE); put(x, DECK + 1, DK, BRIDGE); }
  for (const px of [0, 78]) for (let y = DECK - 9; y < HOR; y++) for (let x = px; x < px + 8; x++) {
    const c = y < DECK - 7 ? DK2 : (x - px) % 7 === 0 ? DK2 : DK3;
    put(x, y, c, BRIDGE);
  }
  for (let x = 86; x < 100; x++) for (let y = DECK + 2; y < HOR; y++) if ((x - 86) % 5 === 0 || y === DECK + 2) put(x, y, DK, BRIDGE);
  // 4. the harbour: reflected sky, darker, with the sun's path
  const sky0 = rgb.slice();
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HOR) / (H - HOR), sy = clamp(2 * HOR - y, 0, HOR - 1), i = (sy * W + x) * 3;
    let c = mix([sky0[i], sky0[i + 1], sky0[i + 2]], ramp([[0, "#b0707a"], [0.4, "#7a5a80"], [1, "#4a4a7a"]], v), 0.5 + v * 0.3);
    const sw = 3 + v * 14;
    if (Math.abs(x - SUN[0]) < sw) c = mix(c, hex("#f6b276"), (1 - Math.abs(x - SUN[0]) / sw) * 0.6 * (1 - v));
    put(x, y, c, WATER);
  }
  // 5. the opera house: a podium on its point, and white shells pointing out over the water
  for (let y = 64; y < 73; y++) {
    const x0 = 92 + (y - 64) * 0.8, x1 = 186;
    for (let x = Math.floor(x0); x < x1; x++) put(x, y, y < 66 ? hex("#e0bc9c") : y % 2 ? hex("#b88a74") : hex("#8a6658"), OPERA);
  }
  for (let y = 73; y < 76; y++) for (let x = 99; x < 190; x++) put(x, y, hex("#8a6658"), OPERA);
  // a shell: tip overhanging forward, a concave front edge down to its foot, a convex back
  // arching down to the rear foot. dir 1 points left (toward the water), -1 points right.
  const shell = (xt, yt, xf, xr, yb, dir = 1) => {
    const P = [];
    for (let k = 0; k <= 14; k++) { const u = k / 14; P.push([xt + (xf - xt) * Math.pow(u, 0.6), lerp(yt, yb, u)]); }
    for (let k = 14; k >= 0; k--) { const s2 = k / 14; P.push([lerp(xt, xr, s2), yt + (yb - yt) * Math.pow(s2, 1.7)]); }
    const lo = Math.min(xt, xf, xr) - 1, hi = Math.max(xt, xf, xr) + 1;
    for (let y = Math.floor(yt); y <= yb; y++) for (let x = Math.floor(lo); x <= hi; x++) {
      if (!inPoly(x + 0.5, y + 0.5, P)) continue;
      const s2 = (x - xt) / (xr - xt), back = yt + (yb - yt) * Math.pow(clamp(s2), 1.7);
      const u = (y - yt) / (yb - yt), fx = xt + (xf - xt) * Math.pow(u, 0.6), dFront = (x - fx) * dir;
      let c = mix(hex("#f2d4b4"), hex("#c49e86"), clamp(u * 0.5 + (dir < 0 ? 0.35 : 0)));
      if (Math.abs(((y - back) / 2.6) % 1) < 0.2 && y - back > 2) c = mix(c, hex("#a08070"), 0.35);
      if (dFront < 1.6 && u > 0.1) c = mix(hex("#c49e86"), hex("#a08070"), clamp(u * 1.5));
      if (y - back < 1) c = hex("#f2d4b4");
      if (y - back < 1 && Math.abs(x - xt) > 1 && s2 > 0.15) c = mix(c, hex("#e0bc9c"), 0.5);
      put(x, y, c, OPERA);
    }
    // a dark seam along the back edge so overlapping shells separate
    for (let k = 0; k <= 40; k++) { const s2 = k / 40, x = lerp(xt, xr, s2), y = yt + (yb - yt) * Math.pow(s2, 1.7); if (s2 > 0.08) put(x, y + 1, hex("#a08070"), OPERA); }
  };
  // the low base the shells stand on
  for (let y = 54; y < 64; y++) for (let x = 104; x < 184; x++) put(x, y, (x % 4 === 0 && y > 57) ? hex("#8a6658") : mix(hex("#c49e86"), hex("#b88a74"), (y - 54) / 10), OPERA);
  // the rear hall first, then the main hall from back to front, then the small restaurant shells
  shell(178, 42, 172, 152, 64, -1);
  shell(158, 40, 163, 178, 64); shell(147, 46, 152, 166, 64);
  shell(150, 32, 143, 126, 64, -1);
  shell(124, 22, 131, 154, 64); shell(111, 32, 117, 138, 64); shell(100, 45, 105, 122, 64);
  shell(182, 54, 185, 190, 64);
  // the opera house's reflection
  for (let y = 76; y < 100; y++) for (let x = 92; x < 190; x++) {
    const sy = 2 * 75 - y, i = sy * W + x;
    if (sy > 0 && layer[i] === OPERA) blend(x, y, [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]], 0.35 * (1 - (y - 76) / 24));
  }

  const F = makeFrame(rgb, layer, PAL);
  const HULL = hex("#2e6a4a"), CAB = hex("#e0d0b0"), TRIM = hex("#c8a040"), WIN = hex("#2a2440"), WAKE = hex("#d8b8a8");
  const ripples = Array.from({ length: 70 }, (_, i) => [hash(i, 31), hash(i, 32), hash(i, 33)]);
  const ferry = (x0, base, len, dir, t) => {
    const h = len * 0.32;
    // wake trailing behind
    for (let k = 1; k < len * 2.2; k++) {
      const x = x0 + (dir > 0 ? -k : len + k), spread = Math.min(2.5, k / 10);
      F.add(x, base + 1, WAKE, 0.7 * (1 - k / (len * 2.2)), WATER);
      F.add(x, base + 1 + spread, WAKE, 0.4 * (1 - k / (len * 2.2)), WATER);
    }
    for (let i = 0; i <= len; i++) {
      const u = i / len, x = x0 + i, end = Math.min(u, 1 - u) * len;
      const hullTop = base - h * 0.35;
      for (let y = Math.floor(hullTop); y <= base; y++) if (y - hullTop < end * 0.9 + 1) F.add(x, y, y === Math.floor(hullTop) ? TRIM : mix(HULL, hex("#1a1628"), (y - hullTop) / (h * 0.6)));
      if (u > 0.12 && u < 0.88) for (let y = Math.floor(base - h * 0.75); y < hullTop; y++) F.add(x, y, (y === Math.floor(base - h * 0.55) && i % 3 !== 0) ? WIN : CAB);
      if (u > 0.36 && u < 0.64) for (let y = Math.floor(base - h); y < base - h * 0.75; y++) F.add(x, y, CAB);
    }
    for (let y = Math.floor(base - h * 1.3); y < base - h; y++) F.add(x0 + len * 0.5, y, HULL);
  };
  return (t) => {
    F.begin();
    for (const [a, b, c] of ripples) {
      const v = b * b, y = Math.floor(HOR + 1 + v * (H - HOR - 2)), L = 2 + v * 9, x0 = ((a * W - t * (0.6 + v * 2)) % W + W) % W;
      for (let k = 0; k < L; k++) F.add((x0 + k) % W, y, c > 0.4 ? hex("#2e3a68") : hex("#b0707a"), 0.45 * Math.sin((k / L) * Math.PI), WATER);
    }
    // two ferries crossing in opposite directions
    const P1 = 38, p1 = (((t + 8) % P1) + P1) % P1 / P1, P2 = 30, p2 = (((t + 21) % P2) + P2) % P2 / P2;
    ferry(lerp(W + 60, -60, p1), 84, 28, -1, t);
    ferry(lerp(-90, W + 50, p2), 100, 40, 1, t);
    return F.finish();
  };
}
