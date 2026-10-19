/* east-river-bridge-sunrise: a stone-towered suspension bridge and a city skyline at sunrise, hand-built.
 * A static scene (sunrise sky, the hazy skyline, the bridge with its gothic arched towers,
 * cable web and deck, the river) is painted once; each frame adds the sun, drifting cloud,
 * traffic on the deck, a tugboat with its smoke and wake, and gulls. */
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
  ["#3a3a78", "#5a4a8a", "#8a5a90", "#c06a88", "#e88a7c", "#f8aa78", "#fcc888", 14],
  ["#fff6dc", "#ffe6a8", 2],
  ["#5a3e6c", "#6a4a74", "#80587e", "#9a6a86", "#b47e8c", 5],
  ["#f0a878", "#d08870", 2],
  ["#140e1c", "#1e1626", "#2c2032", "#46303e", "#6a4448", 5],
  ["#1c1c44", "#2a2858", "#3a3470", "#4a3c7a", "#6a4c84", 5],
  ["#f8c088", "#e89878", 2],
  ["#f4c890", "#e83a3a", "#c84a3a", 3],
  ["#9a8a9a", "#b8a8b0", 2],
  ["#e0d0d8", 1],
  ["#d07a88", "#f0a090", 2],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "east-river-bridge-sunrise", name: "East River Bridge Sunrise", category: "cities",
  note: "A suspension bridge with gothic stone towers spans the river at sunrise in front of a hazy skyline, with traffic crossing, a tugboat pushing upstream and gulls overhead.",
  tags: ["new-york", "bridge", "sunrise", "skyline", "river", "tugboat", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, CITY = 1, WATER = 2, BRIDGE = 3;
const HZ = 79;
const deckY = (x) => lerp(88, 74, (x + 5) / 200);
const deckTh = (x) => lerp(5, 2, (x + 5) / 200);

export default function create() {
  const { rgb, layer, put, blend, get } = makeCanvas();
  const SUN = [112, 54], SR = 7;
  // 1. sunrise sky
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#3a3a78"], [0.22, "#5a4a8a"], [0.42, "#8a5a90"], [0.6, "#c06a88"], [0.75, "#e88a7c"], [0.88, "#f8aa78"], [1, "#fcc888"]], y / HZ);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.2);
    c = mix(c, hex("#fcc888"), clamp(1 - d / 50) * 0.55);
    put(x, y, c, SKY);
  }
  // 2. the skyline: hazy towers, a tall spire on the right, sunlit windows
  const towers = [];
  for (let x = -2; x < W;) {
    const w = 4 + Math.floor(hash(x, 1) * 8);
    let h = 8 + Math.floor(hash(x, 2) * 16 + 10 * Math.max(0, Math.sin((x - 100) / 30)));
    if (x > 128 && x < 175) h += 10;
    towers.push([x, w, h]);
    x += w + (hash(x, 3) < 0.25 ? 1 : 0);
  }
  towers.push([143, 7, 50]); // the spire tower
  for (const [x0, w, h] of towers) {
    const top = HZ - h, far = h < 20;
    for (let y = top; y < HZ; y++) for (let x = x0; x < x0 + w; x++) {
      const k = (y - top) / Math.max(1, h);
      put(x, y, x === x0 + w - 1 ? hex("#b47e8c") : mix(hex(far ? "#9a6a86" : "#80587e"), hex("#6a4a74"), k * 0.6), CITY);
    }
    for (let y = top + 2; y < HZ - 1; y += 3) for (let x = x0 + 1; x < x0 + w - 1; x += 2) if (hash(x * 7, y) < 0.3) put(x, y, hash(x, y) < 0.5 ? hex("#f0a878") : hex("#d08870"), CITY);
    if (h === 50) {
      for (let y = top - 6; y < top; y++) for (let x = x0 + 1 + Math.floor((top - y) / 3); x < x0 + w - 1 - Math.floor((top - y) / 3); x++) put(x, y, hex("#80587e"), CITY);
      for (let y = top - 16; y < top - 6; y++) put(x0 + 3, y, hex("#6a4a74"), CITY);
    }
  }
  // 3. the river: sky mirrored, darker below, a broken path of sunlight
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / (H - HZ);
    let c = ramp([[0, "#6a4c84"], [0.2, "#4a3c7a"], [0.55, "#3a3470"], [0.8, "#2a2858"], [1, "#1c1c44"]], v);
    const src = get(x, HZ - 1 - (y - HZ) * 2);
    if (fbm(x / 14, y * 0.8, 3, 5) > 0.55) c = mix(c, src, 0.35);
    const w = 3 + v * 12;
    if (Math.abs(x - SUN[0]) < w && noise2(x / 3, y * 1.2, 6) > 0.42 + Math.abs(x - SUN[0]) / w * 0.3) c = mix(c, hex(v < 0.3 ? "#f8c088" : "#e89878"), 0.85 - v * 0.3);
    put(x, y, c, WATER);
  }
  // 4. the bridge
  const ST = hex("#2c2032"), ST2 = hex("#46303e"), LIT = hex("#6a4448"), INK = hex("#140e1c"), CAB = hex("#1e1626");
  const tower = (cx, top, w, sc) => {
    const base = H + 2, dk = deckY(cx);
    for (let y = top; y < base; y++) for (let x = Math.round(cx - w / 2); x <= Math.round(cx + w / 2); x++) {
      const rx = x - (cx - w / 2);
      put(x, y, rx > w - 2.5 * sc ? LIT : rx < 1 ? ST2 : (Math.round(y) % Math.max(2, Math.round(6 * sc)) === 0 ? INK : ST), BRIDGE);
    }
    // cornice and cap
    for (let x = Math.round(cx - w / 2 - sc); x <= Math.round(cx + w / 2 + sc); x++) { put(x, top, ST2, BRIDGE); put(x, top + 1, INK, BRIDGE); put(x, top + Math.round(4 * sc), ST2, BRIDGE); }
  };
  // repaint what is seen through arches from a copy of the background
  const bg = rgb.slice(), bgL = layer.slice();
  const T1 = [52, 15, 24, 1], T2 = [160, 46, 11, 0.45];
  tower(...T1); tower(...T2);
  for (const [cx, top, w, sc] of [T1, T2]) {
    const aw = w * 0.27, gap = w * 0.12, aTop = top + 8 * sc, aBot = deckY(cx) - 0.5;
    for (const ax of [cx - gap / 2 - aw, cx + gap / 2]) for (let y = Math.floor(aTop); y < aBot; y++) for (let x = Math.floor(ax + 0.5); x < ax + aw - 0.3; x++) {
      const u = (x + 0.5 - ax) / aw, pointed = aTop + Math.pow(Math.abs(u - 0.5) * 2, 0.7) * aw * 0.9;
      if (y < pointed) continue;
      const i = y * W + x; rgb[i * 3] = bg[i * 3]; rgb[i * 3 + 1] = bg[i * 3 + 1]; rgb[i * 3 + 2] = bg[i * 3 + 2]; layer[i] = bgL[i];
    }
  }
  // deck with a truss band
  for (let x = 0; x < W; x++) {
    const y0 = deckY(x), th = deckTh(x);
    for (let y = Math.round(y0); y < y0 + th; y++) {
      const k = (y - y0) / th;
      put(x, y, k < 0.25 ? ST2 : (x + y) % 3 === 0 ? CAB : INK, BRIDGE);
    }
  }
  // main cables, suspenders and the diagonal stays
  const quad = (a, c, b, s) => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]];
  const line = (x0, y0, x1, y1, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5); for (let i = 0; i <= n; i++) blend(lerp(x0, x1, i / n), lerp(y0, y1, i / n), c, 0.8, BRIDGE); };
  const A = [T1[0] - 6, T1[1] + 1], B = [T1[0] + 6, T1[1] + 1], Cc = [T2[0] - 2.5, T2[1] + 1], D = [T2[0] + 2.5, T2[1] + 1];
  const spans = [[[-30, 78], [10, 66], A], [B, [106, 108], Cc], [D, [180, 62], [215, 54]]];
  for (const [a, c, b] of spans) {
    for (let s = 0; s <= 1; s += 0.002) { const [x, y] = quad(a, c, b, s); put(x, y, CAB, BRIDGE); put(x, y + 1, INK, BRIDGE); }
    let lastX = -99;
    for (let s = 0.01; s < 1; s += 0.002) {
      const [x, y] = quad(a, c, b, s), rx = Math.round(x);
      if (rx < 0 || rx >= W || rx - lastX < 3) continue;
      lastX = rx;
      if (Math.abs(rx - T1[0]) < 14 || Math.abs(rx - T2[0]) < 7) continue;
      for (let yy = Math.round(y) + 2; yy < deckY(rx); yy++) blend(rx, yy, ST2, 0.8, BRIDGE);
    }
  }
  for (let k = 1; k <= 6; k++) { line(B[0], B[1] + 2, B[0] + k * 8, deckY(B[0] + k * 8), ST2); line(A[0], A[1] + 2, A[0] - k * 8, deckY(A[0] - k * 8), ST2); }
  for (let k = 1; k <= 5; k++) { line(Cc[0], Cc[1] + 1, Cc[0] - k * 5, deckY(Cc[0] - k * 5), ST2); line(D[0], D[1] + 1, D[0] + k * 5, deckY(D[0] + k * 5), ST2); }
  // pier footings in the water
  for (const [cx, , w] of [T1, T2]) for (let y = Math.round(HZ + (cx < 100 ? 18 : 2)); y < H; y++) for (let x = Math.round(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) put(x, y, INK, BRIDGE);

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const HEAD = hex("#f4c890"), TAIL = hex("#e83a3a"), RED = hex("#c84a3a"), SMOKE = hex("#9a8a9a"), SMOKE2 = hex("#b8a8b0"), GULL = hex("#e0d0d8"), WAKE = hex("#f0a090");
  const cars = Array.from({ length: 16 }, (_, i) => ({ dir: i % 2, ph: hash(i, 4), sp: 9 + hash(i, 5) * 6 }));
  const clouds = [[0.2, 0.35, 12, 1.4, "#d07a88", 0.6], [0.7, 0.28, 22, 1.2, "#f0a090", 0.45], [0.95, 0.4, 34, 1.6, "#d07a88", 0.7], [0.45, 0.22, 40, 1.1, "#f0a090", 0.5]];
  const gulls = [[0, 0, 0], [9, 3, 1.4], [18, -2, 2.6], [5, 7, 3.3]];

  return (t) => {
    F.begin();
    // the sun clearing the skyline
    for (let y = SUN[1] - SR; y <= SUN[1] + SR; y++) for (let x = SUN[0] - SR; x <= SUN[0] + SR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SR) add(x, y, d < SR - 1.3 ? hex("#fff6dc") : hex("#ffe6a8"), 1, SKY);
    }
    for (const [u, len, cy, th, col, sp] of clouds) {
      const L = len * W, cx = ((((u * W + t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3, C = hex(col);
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.1 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, C, a * 0.75, SKY);
      }
    }
    // traffic on the deck: headlights coming in, tail lights heading out
    for (const c of cars) {
      const span = W + 20, p = ((c.ph * span + t * c.sp) % span), x = c.dir ? W + 10 - p : p - 10;
      const y = Math.round(deckY(x)) - 1, sc = lerp(1, 0.4, x / W);
      const len = Math.max(2, Math.round(4 * sc));
      for (let k = 0; k < len; k++) add(x + k, y, INK, 1, CITY), sc > 0.6 && add(x + k, y - 1, INK, 1, CITY);
      add(c.dir ? x : x + len - 1, y, c.dir ? HEAD : TAIL, 1, BRIDGE);
    }
    // tugboat pushing upstream, smoke from its stack and a wake behind
    const tx = Math.round(((t * 3 + 40) % (W + 60)) - 30), ty = 96;
    for (let k = 1; k < 30; k++) { const sp = Math.floor(k / 5); add(tx - k, ty + 1 + sp, WAKE, 0.6 - k / 55, WATER); add(tx - k, ty + 1 - Math.min(sp, 1), WAKE, 0.35 - k / 90, WATER); }
    for (let x = 0; x < 20; x++) for (let y = 0; y < 3; y++) if (x > y - 1 && x < 20 - y) add(tx + x, ty - y + 1, INK, 1, WATER);
    for (let x = 4; x < 13; x++) for (let y = 3; y < 7; y++) add(tx + x, ty - y + 1, y === 4 ? HEAD : RED, 1, WATER);
    for (let x = 6; x < 11; x++) add(tx + x, ty - 6, INK, 1, WATER);
    for (let y = 7; y < 10; y++) { add(tx + 8, ty - y, INK, 1, WATER); add(tx + 9, ty - y, INK, 1, WATER); }
    for (let p = 0; p < 7; p++) {
      const age = (t * 0.45 + p / 7) % 1, r = 0.8 + age * 2.6, px = tx + 8.5 - age * 18, py = ty - 11 - age * 12;
      for (let y = Math.floor(py - r); y <= py + r; y++) for (let x = Math.floor(px - r); x <= px + r; x++) { const d = Math.hypot(x - px, y - py) / r; if (d < 1) add(x, y, d < 0.5 ? SMOKE2 : SMOKE, (1 - age) * 0.6, WATER); }
    }
    // gulls wheeling over the river
    const gt = (t % 24) / 24, gx = lerp(W + 20, -30, gt), gy = 34 + Math.sin(gt * 7) * 6;
    for (const [ox, oy, ph] of gulls) {
      const x = Math.round(gx + ox + Math.sin(t * 0.7 + ph) * 2), y = Math.round(gy + oy), up = Math.sin(t * 6 + ph) > 0;
      add(x, y, GULL, 1); add(x - 1, y + (up ? -1 : 0), GULL, 1); add(x + 1, y + (up ? -1 : 0), GULL, 1); add(x - 2, y + (up ? -1 : 1), GULL, 1); add(x + 2, y + (up ? -1 : 1), GULL, 1);
    }
    return F.finish();
  };
}
