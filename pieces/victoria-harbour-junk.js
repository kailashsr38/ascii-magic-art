/* victoria-harbour-junk: Hong Kong's harbour at night with a red-sailed junk crossing, hand-built.
 * A static scene (night sky, moon, the peak behind the city, the dense tower skyline with lit
 * windows, a faceted glass tower, the waterfront lights and their reflections) is painted once;
 * each frame adds drifting cloud, the junk with its battened red sails, and two harbour ferries. */
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
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  const get = (x, y) => { x = clamp(Math.round(x), 0, W - 1); y = clamp(Math.round(y), 0, H - 1); const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  return { rgb, layer, put, blend, get };
}
// Per frame: a working copy, a depth-aware blend, and the conversion to text.
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
  const add = (x, y, c, a, upTo = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = y * W + x;
    if (layer[i] > upTo) return;
    if (a >= 1) { out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2]; return; }
    out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
  };
  const rect = (x0, y0, x1, y1, c, upTo) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) add(x, y, c, 1, upTo); };
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
  return { out, add, rect, begin, finish };
}


const ANCHORS = [
  ["#3a4a9a", "#4a5aa8", "#5a6ab4", "#7076bc", "#8a80c0", "#a88cc4", "#c098c0", 12],
  ["#fff6e0", "#ece0c4", 2],
  ["#8a94d0", 1],
  ["#2e3670", "#363e7a", "#424a88", 3],
  ["#0c0e24", "#141834", "#1e2444", "#2a3056", 4],
  ["#d0b078", "#a88a60", "#8098c8", "#5a70a0", "#d05a98", "#40b0c0", 6],
  ["#1e2858", "#283468", "#34407a", "#46528e", "#5e64a4", 5],
  ["#f45a3c", "#c8402e", "#7a2020", "#6a3020", "#4a2418", 5],
  ["#2a7a5a", "#1e5a44", "#c8c8c0", "#e8d090", 4],
  ["#6a72b4", "#8088c0", 2],
  ["#9aa6d0", 1],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "victoria-harbour-junk", name: "Victoria Harbour Junk", category: "cities",
  note: "Hong Kong's towers glow below the dark peak at night as a junk with red battened sails crosses the harbour and two ferries ply between the shores.",
  tags: ["hong-kong", "night", "harbour", "skyline", "junk", "ferry", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, PEAK = 1, CITY = 2, WATER = 3;
const HZ = 75;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const MOON = [164, 15], MR = 5;
  // 1. night sky with the city's glow low down
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#3a4a9a"], [0.25, "#4a5aa8"], [0.45, "#5a6ab4"], [0.6, "#7076bc"], [0.72, "#8a80c0"], [0.85, "#a88cc4"], [1, "#c098c0"]], y / HZ);
    const d = Math.hypot(x - MOON[0], y - MOON[1]);
    c = mix(c, hex("#8a94d0"), clamp(1 - (d - MR) / 20) * 0.6);
    if (d < MR) c = d < MR - 1.2 ? hex("#fff6e0") : hex("#ece0c4");
    put(x, y, c, SKY);
  }
  // 2. the peak: a dark ridge behind the city, with a few lights up its slopes
  const ridge = (x) => 50 - 22 * Math.exp(-(((x - 66) / 34) ** 2)) - 10 * Math.exp(-(((x - 140) / 26) ** 2)) - 3 * fbm(x / 8, 2, 3, 6);
  for (let x = 0; x < W; x++) for (let y = Math.floor(ridge(x)); y < HZ; y++) put(x, y, y < ridge(x) + 1 ? hex("#424a88") : fbm(x / 3, y / 3, 2, 8) > 0.6 ? hex("#363e7a") : hex("#2e3670"), PEAK);
  for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 1) * W), y = Math.floor(ridge(x) + 3 + hash(i, 2) * 14); if (y < HZ) put(x, y, hash(i, 3) < 0.6 ? hex("#b89a6a") : hex("#6a80b0"), PEAK); }
  // 3. the tower skyline along the waterfront, back row first
  const WIN = ["#d0b078", "#a88a60", "#8098c8", "#5a70a0"].map(hex);
  const tower = (x0, w, h, seed, back) => {
    const top = HZ - h;
    for (let y = top; y < HZ; y++) for (let x = x0; x < x0 + w; x++) put(x, y, x === x0 ? hex(back ? "#2a3056" : "#1e2444") : hex(back ? "#1e2444" : "#141834"), CITY);
    const cool = hash(seed, 4) < 0.4, gx = hash(seed, 5) < 0.5 ? 2 : 3;
    for (let y = top + 2; y < HZ - 1; y += 2) for (let x = x0 + 1; x < x0 + w - 1; x += gx) if (hash(x * 13 + seed, y) < (back ? 0.35 : 0.55)) put(x, y, WIN[(cool ? 2 : 0) + (hash(x, y * 3) < 0.6 ? 0 : 1)], CITY);
    if (hash(seed, 6) < 0.25 && w > 4) for (let y = top + 3; y < top + 3 + Math.min(14, h - 6); y++) put(x0 + w - 2, y, hash(seed, 7) < 0.5 ? hex("#d05a98") : hex("#40b0c0"), CITY);
  };
  for (let x = -2, i = 0; x < W; i++) { const w = 4 + Math.floor(hash(i, 11) * 6), h = 14 + Math.floor(hash(i, 12) * 22 + 10 * Math.exp(-(((x - 96) / 50) ** 2))); tower(x, w, h, i + 100, true); x += w; }
  for (let x = -1, i = 0; x < W; i++) { const w = 5 + Math.floor(hash(i, 21) * 8), h = 8 + Math.floor(hash(i, 22) * 18); tower(x, w, h, i, false); x += w + 1; }
  // the tall tower on the right and the faceted glass tower in the middle
  tower(150, 9, 58, 777, false);
  for (let y = HZ - 62; y < HZ - 58; y++) for (let x = 152; x < 157; x++) put(x, y, hex("#20264a"), CITY);
  const BX = 88, BW = 14, BT = HZ - 54;
  for (let y = BT; y < HZ; y++) {
    const k = (y - BT) / (HZ - BT), hw = BW / 2;
    // stepped slanted roofline: each quarter ends at a different height
    for (let x = BX - hw; x < BX + hw; x++) {
      const q = Math.floor((x - BX + hw) / (BW / 4)), qTop = BT + [10, 0, 5, 16][q] + ((x - BX + hw) % (BW / 4)) * [1.2, -0.8, 1, -1][q];
      if (y < qTop) continue;
      let c = hex("#10142c");
      const u = ((x - BX + hw) + (y - BT) * 0.6) % 8, v = ((x - BX + hw) - (y - BT) * 0.6 + 80) % 8;
      if (u < 0.9 || v < 0.9) c = hex("#9aa6d0");
      else if ((x + y) % 3 === 0) c = hex("#6a80b0");
      put(x, y, c, CITY);
    }
    if (k < 0.02) { put(BX - 2, y - 6, hex("#9aa6d0"), CITY); }
  }
  for (let j = 1; j < 8; j++) { put(BX - 1, BT - j, hex("#20264a"), CITY); put(BX + 1, BT - j + 2, hex("#20264a"), CITY); }
  // waterfront promenade lights
  for (let x = 0; x < W; x++) put(x, HZ - 1, x % 3 === 0 ? hex("#d0b078") : hex("#181c38"), CITY);
  // 4. the harbour: dark water with long broken reflections of the lights
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / (H - HZ);
    put(x, y, ramp([[0, "#5e64a4"], [0.15, "#46528e"], [0.45, "#34407a"], [0.8, "#283468"], [1, "#1e2858"]], v), WATER);
  }
  for (let x = 0; x < W; x++) {
    // pick the brightest window colour in the column of the skyline and stretch it into the water
    let best = null, bl = 0;
    for (let y = HZ - 30; y < HZ; y++) { const i = (y * W + x) * 3, l = rgb[i] + rgb[i + 1] + rgb[i + 2]; if (layer[y * W + x] === CITY && l > bl) { bl = l; best = [rgb[i], rgb[i + 1], rgb[i + 2]]; } }
    if (!best || bl < 300) continue;
    for (let y = HZ; y < H; y++) {
      const v = (y - HZ) / (H - HZ);
      if (noise2(x * 0.9, y * 0.7, 3) > 0.42 + v * 0.3) blend(x, y, best, 0.6 * (1 - v), WATER);
    }
  }
  for (let y = HZ; y < H; y++) { const v = (y - HZ) / (H - HZ), w = 1 + v * 4; for (let x = Math.floor(MOON[0] - w); x <= MOON[0] + w; x++) if (noise2(x / 2, y * 1.1, 9) > 0.5) blend(x, y, hex("#ece0c4"), 0.4 - v * 0.25, WATER); }

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const SAIL = hex("#f45a3c"), SAIL2 = hex("#c8402e"), BATTEN = hex("#7a2020"), HULL = hex("#4a2418"), HULL2 = hex("#6a3020"), MAST = hex("#4a2418");
  const GREEN = hex("#2a7a5a"), GREEN2 = hex("#1e5a44"), WHITE = hex("#c8c8c0"), LAMP = hex("#e8d090"), INK = hex("#0a0c1e"), WAKE = hex("#6a72b4");
  const clouds = [[0.1, 0.4, 8, 1.4, 0.4], [0.5, 0.3, 18, 1.2, 0.3], [0.85, 0.35, 30, 1.6, 0.5]];
  // one battened sail: a fan with a curved leech, battens every few rows
  const sail = (mx, foot, h, w, sway) => {
    for (let j = 0; j < h; j++) {
      const k = j / h, y = foot - j;
      const wide = w * (0.55 + 0.45 * Math.sin(Math.PI * (0.2 + 0.8 * k))) * (k > 0.85 ? (1 - k) / 0.15 * 0.6 + 0.4 : 1);
      const back = Math.round(wide * 0.25 + sway * k), front = Math.round(wide * 0.75 - sway * k);
      for (let x = -back; x <= front; x++) add(mx + x, y, j % 4 === 0 ? BATTEN : x < 0 ? SAIL2 : SAIL, 1, WATER);
    }
  };

  return (t) => {
    F.begin();
    for (const [u, len, cy, th, sp] of clouds) {
      const L = len * W, cx = ((((u * W - t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3;
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.09 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, a > 0.6 ? hex("#8088c0") : hex("#6a72b4"), a * 0.8, SKY);
      }
    }
    // far ferry heading left
    const fx = Math.round(W + 20 - ((t * 2.4 + 30) % (W + 50))), fy = 82;
    for (let k = 1; k < 18; k++) add(fx + 16 + k, fy + 1 + Math.floor(k / 6), WAKE, 0.7 - k / 30, WATER);
    for (let x = 0; x < 16; x++) { add(fx + x, fy, GREEN2, 1, WATER); if (x > 0 && x < 15) add(fx + x, fy - 1, GREEN, 1, WATER); }
    for (let x = 2; x < 14; x++) { add(fx + x, fy - 2, x % 2 ? LAMP : WHITE, 1, WATER); add(fx + x, fy - 3, WHITE, 1, WATER); add(fx + x, fy - 4, x % 2 ? GREEN : LAMP, 1, WATER); }
    for (let x = 4; x < 12; x++) add(fx + x, fy - 5, WHITE, 1, WATER);
    // near ferry heading right, lower in the frame
    const gx = Math.round(((t * 3.1 + 140) % (W + 60)) - 40), gy = 104;
    for (let k = 1; k < 26; k++) add(gx - k, gy + Math.floor(k / 7), WAKE, 0.7 - k / 40, WATER);
    for (let x = 0; x < 24; x++) { add(gx + x, gy, GREEN2, 1, WATER); add(gx + x, gy + 1, INK, 1, WATER); if (x > 0 && x < 23) add(gx + x, gy - 1, GREEN, 1, WATER); }
    for (let x = 3; x < 21; x++) { add(gx + x, gy - 2, x % 3 ? LAMP : WHITE, 1, WATER); add(gx + x, gy - 3, WHITE, 1, WATER); add(gx + x, gy - 4, x % 3 ? LAMP : GREEN, 1, WATER); add(gx + x, gy - 5, WHITE, 1, WATER); }
    for (let x = 6; x < 18; x++) add(gx + x, gy - 6, GREEN, 1, WATER);
    // the junk crossing right to left, sails leaning with the wind
    const jx = Math.round(W + 40 - ((t * 1.8 + 120) % (W + 90))), jy = 96, sway = Math.sin(t * 0.6) * 1.2;
    for (let k = 1; k < 30; k++) { const sp = Math.floor(k / 6); add(jx + 18 + k, jy + 1 + sp, WAKE, 0.6 - k / 50, WATER); add(jx + 18 + k, jy + 1 - Math.min(sp, 1), WAKE, 0.4 - k / 70, WATER); }
    for (let x = -18; x <= 20; x++) {
      const rise = x > 12 ? Math.round((x - 12) * 0.5) : x < -12 ? Math.round((-12 - x) * 0.3) : 0;
      for (let y = 0; y < 4 + rise; y++) add(jx + x, jy - y + 1, y === 3 + rise ? HULL2 : HULL, 1, WATER);
    }
    for (let j = 0; j < 30; j++) add(jx, jy - 3 - j, MAST, 1, WATER);
    for (let j = 0; j < 20; j++) add(jx - 13, jy - 3 - j, MAST, 1, WATER);
    for (let j = 0; j < 14; j++) add(jx + 13, jy - 3 - j, MAST, 1, WATER);
    sail(jx - 13, jy - 4, 18, 9, sway);
    sail(jx, jy - 4, 27, 12, sway);
    sail(jx + 13, jy - 4, 13, 7, sway);
    for (let y = 2; y < 8; y++) add(jx + 1, jy + y, SAIL2, 0.35 - y * 0.04, WATER);
    return F.finish();
  };
}
