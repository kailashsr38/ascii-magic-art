/* marine-drive-necklace: Mumbai's curved seafront promenade at night, its string of lamps sweeping round the bay, hand-built.
 * A static scene (night sky, moon, the bay, the curving road and promenade, the lamps and their
 * reflections, the buildings along the curve, the towers at the far point) is painted once;
 * each frame adds drifting cloud, cars streaming both ways along the curve and boats on the bay. */
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
  ["#121a44", "#1c2658", "#2a3672", "#3c4888", "#5a5a96", "#86689a", "#b07a84", "#d09078", 14],
  ["#fff6dc", "#efe0bc", 2],
  ["#4a4a78", "#6a6488", 2],
  ["#0a1030", "#121a40", "#1c2652", "#2a3466", "#40467a", "#5a5888", 7],
  ["#ffc070", "#e8a050", "#c07a40", "#8a5a3a", 5],
  ["#2a2a40", "#3c3c56", 2],
  ["#262840", "#3a3c56", 2],
  ["#06060f", "#0e0e1e", "#161628", "#20203a", "#2c2a44", 5],
  ["#e0a860", "#b88450", "#7a5a48", 3],
  ["#dcd0b4", "#ff3a2a", "#a02a2a", 3],
  ["#30305a", "#3e3a66", 2],
  ["#3a4278", "#4c5288", 2],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "marine-drive-necklace", name: "Marine Drive Necklace", category: "cities",
  note: "Mumbai's seafront road curves round the bay at night under a full moon, its string of lamps glowing as cars stream both ways and boats drift on the water.",
  tags: ["mumbai", "india", "night", "city", "promenade", "traffic", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, FAR = 1, SEA = 2, BLD = 3, ROAD = 4, POST = 5;
const HZ = 58;
const P0 = [182, 114], P1 = [160, 56], P2 = [-2, 62];
const bez = (s) => [(1 - s) ** 2 * P0[0] + 2 * (1 - s) * s * P1[0] + s * s * P2[0], (1 - s) ** 2 * P0[1] + 2 * (1 - s) * s * P1[1] + s * s * P2[1]];
const nor = (s) => {
  const dx = 2 * (1 - s) * (P1[0] - P0[0]) + 2 * s * (P2[0] - P1[0]), dy = 2 * (1 - s) * (P1[1] - P0[1]) + 2 * s * (P2[1] - P1[1]), l = Math.hypot(dx, dy);
  return [-dy / l, dx / l];
};
// world position u (0 near, 1 far) to curve parameter, and the perspective scale
const sOf = (u) => Math.pow(u, 0.62);
const scOf = (u) => 1 / (1 + 9 * u);
const uOf = (s) => Math.pow(s, 1 / 0.62);

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const MOON = [40, 15], MR = 5;
  // 1. night sky with a warm city glow low down, moon halo
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#121a44"], [0.25, "#1c2658"], [0.5, "#2a3672"], [0.68, "#3c4888"], [0.8, "#5a5a96"], [0.9, "#86689a"], [0.96, "#b07a84"], [1, "#d09078"]], y / HZ);
    const d = Math.hypot(x - MOON[0], y - MOON[1]);
    c = mix(c, hex("#6a6488"), clamp(1 - (d - MR) / 22) * 0.6);
    if (d < MR) c = d < MR - 1.2 ? hex("#fff6dc") : hex("#efe0bc");
    put(x, y, c, SKY);
  }
  // 2. distant city low on the horizon, inland behind the curve
  for (let x = 24; x < W; x++) {
    const h = Math.round(2 + 4 * fbm(x / 9, 3, 3, 5) + (hash(x >> 2, 7) < 0.2 ? 3 : 0));
    for (let y = HZ - h; y < HZ + 2; y++) put(x, y, y === HZ - h ? hex("#3e3a66") : hex("#30305a"), FAR);
  }
  // 3. the bay: dark water, a little lighter toward the horizon glow
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / (H - HZ);
    let c = ramp([[0, "#5a5888"], [0.1, "#40467a"], [0.35, "#2a3466"], [0.7, "#1c2652"], [1, "#121a40"]], v);
    if (fbm(x / 18, y * 0.7, 3, 11) > 0.6) c = mix(c, hex("#0a1030"), 0.5);
    put(x, y, c, SEA);
  }
  // moon path on the water, broken into dashes
  for (let y = HZ + 1; y < H; y++) {
    const v = (y - HZ) / (H - HZ), w = 2 + v * 5;
    for (let x = Math.floor(MOON[0] - w); x <= MOON[0] + w; x++) if (noise2(x / 2.5, y * 1.1, 4) > 0.5 + Math.abs(x - MOON[0]) / w * 0.25) blend(x, y, hex("#6a6488"), 0.85 - v * 0.4, SEA);
  }
  // 4. land beyond the road, then the buildings along the curve, far to near
  const rwOf = (u) => 18 * scOf(u), pwOf = (u) => 3 * scOf(u) + 0.6;
  for (let s = 0; s <= 1; s += 0.0006) {
    const u = uOf(s), sc = scOf(u), [px, py] = bez(s), [nx, ny] = nor(s);
    for (let o = rwOf(u); o < rwOf(u) + 60 * sc + 4; o += 0.5) { const qx = px + nx * o, qy = py + ny * o; if (qy >= HZ - 1) put(qx, qy, hex("#0e0e1e"), BLD); }
  }
  const R = (i) => hash(i, 77);
  // a back row of high-rises behind the seafront blocks
  for (let k = 0; k < 46; k++) {
    const s2 = 0.04 + (k / 46) * 0.96, u = uOf(s2), sc = scOf(u), [px, py] = bez(s2), [nx, ny] = nor(s2);
    const off = rwOf(u) + 16 * sc + hash(k, 5) * 10 * sc, bx = px + nx * off, by = py + ny * off;
    const bw = Math.max(2, Math.round((5 + hash(k, 6) * 6) * sc)), bh = Math.round((26 + hash(k, 8) * 30) * sc + 3);
    const x0 = Math.round(bx - bw / 2), x1 = x0 + bw, y0 = Math.round(by - bh);
    for (let y = y0; y <= by + 4; y++) for (let x = x0; x <= x1; x++) if (y < HZ + 30) put(x, y, x === x1 ? hex("#20203a") : hex("#0e0e1e"), BLD);
    for (let y = y0 + 2; y < by; y += 2) for (let x = x0 + 1; x < x1; x += 2) if (hash(x * 5 + k, y) < 0.35) put(x, y, hash(x, y) < 0.6 ? hex("#b88450") : hex("#7a5a48"), BLD);
    if (bh > 20) put(Math.round(bx), y0 - 1, hex("#a02a2a"), BLD);
  }
  let s = 1, idx = 0;
  while (s > 0.004) {
    const u = uOf(s), sc = scOf(u), [px, py] = bez(s), [nx, ny] = nor(s);
    const far = s > 0.86, tall = R(idx) < 0.16 || far;
    const bw = Math.max(2, Math.round((10 + R(idx + 50) * 8) * sc * (far ? 0.6 : 1)));
    const bh = Math.max(2, Math.round((12 + R(idx + 99) * 9) * sc * (tall ? (far ? 3.2 + R(idx) * 2 : 2) : 1)));
    const bx = px + nx * (rwOf(u) + 0.5), by = py + ny * (rwOf(u) + 0.5);
    const x0 = Math.round(bx - bw / 2), x1 = Math.round(bx + bw / 2), y0 = Math.round(by - bh), y1 = Math.round(by + 8 * sc);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, x === x0 ? hex("#2c2a44") : y === y0 ? hex("#2c2a44") : hex("#1a1a30"), BLD);
    // lit windows: a grid on the bigger blocks, a few dots on the far ones
    const g = sc > 0.42 ? 3 : 2;
    for (let y = y0 + 2; y < by - 1; y += g) for (let x = x0 + 1; x < x1; x += g) if (hash(x * 3 + idx, y) < (far ? 0.35 : 0.6)) { const h = hash(x, y * 7); put(x, y, h < 0.5 ? hex("#e0a860") : h < 0.8 ? hex("#b88450") : hex("#7a5a48"), BLD); }
    if (tall && far) put(Math.round(bx), y0 - 1, hex("#ff3a2a"), BLD);
    // step along the curve by about one building width
    let d = 0, [lx, ly] = [px, py];
    while (d < bw * (0.85 + R(idx + 7) * 0.4) && s > 0) { s -= 0.0008; const q = bez(s); d += Math.hypot(q[0] - lx, q[1] - ly); lx = q[0]; ly = q[1]; }
    idx++;
  }
  // 5. road and promenade on top
  for (let s2 = 0; s2 <= 1; s2 += 0.0004) {
    const u = uOf(s2), [px, py] = bez(s2), [nx, ny] = nor(s2), rw = rwOf(u), pw = pwOf(u);
    for (let o = -pw - 0.6; o <= rw; o += 0.4) {
      const c = o < -pw + 0.2 ? hex("#2a2a40") : o < 0 ? hex("#3c3c56") : o < 0.5 ? hex("#2a2a40") : hex(o > rw * 0.48 && o < rw * 0.52 ? "#3a3c56" : "#262840");
      put(px + nx * o, py + ny * o, c, o < 0 ? POST : ROAD);
    }
  }
  // 6. the lamps along the sea edge: posts, glowing heads, long reflections in the water
  const lamps = [];
  for (let i = 0; i <= 90; i++) {
    const u = i / 90, s2 = sOf(u), sc = scOf(u), [px, py] = bez(s2), [nx, ny] = nor(s2);
    const bx = px + nx * 0.3, by = py + ny * 0.3, h = Math.round(10 * sc + 1);
    for (let j = 1; j <= h; j++) put(bx, by - j, hex("#222438"), POST);
    lamps.push([Math.round(bx), Math.round(by - h - 1), sc]);
    // reflection: a broken streak below the sea wall
    const L = 4 + 22 * sc;
    for (let j = 2; j < L; j++) {
      const x = Math.round(bx - nx * (pwOf(u) + 1)), y = Math.round(by + j);
      if (y < H && layer[y * W + x] === SEA && noise2(x * 0.7, y * 0.9 + i, 2) > 0.36) blend(x, y, hex("#c07a40"), 0.75 * (1 - j / L), SEA);
    }
  }
  for (const [x, y, sc] of lamps) {
    const gr = 4 * sc + 1.6; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const d = Math.hypot(dx, dy); if (d < gr) blend(x + dx, y + dy, hex("#c07a40"), 0.7 * (1 - d / gr)); }
    put(x, y, hex("#ffc070"), POST);
    if (sc > 0.45) { put(x + 1, y, hex("#ffc070"), POST); put(x, y + 1, hex("#e8a050"), POST); put(x + 1, y + 1, hex("#e8a050"), POST); }
  }

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const HEAD = hex("#dcd0b4"), TAIL = hex("#ff3a2a"), TAIL2 = hex("#a02a2a"), BODY = hex("#06060f"), CLOUD = hex("#2e3060"), CLOUD2 = hex("#40406c"), HULL = hex("#06060f"), BLAMP = hex("#e8a050");
  const cars = Array.from({ length: 34 }, (_, i) => ({ lane: i % 2, ph: hash(i, 3), sp: 0.008 + hash(i, 9) * 0.006 }));
  const clouds = [[0.1, 0.36, 12, 1.4, 0.35], [0.55, 0.3, 20, 1.8, 0.25], [0.8, 0.22, 7, 1.1, 0.4], [0.35, 0.18, 30, 1.6, 0.3]];

  return (t) => {
    F.begin();
    // thin clouds drifting slowly left, passing over the moon
    for (const [u0, len, cy, th, sp] of clouds) {
      const L = len * W, cx = ((((u0 * W - t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3;
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.09 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, a > 0.6 ? CLOUD2 : CLOUD, a * 0.85, SKY);
      }
    }
    // cars: headlights coming toward us on the sea lane, tail lights going away on the inner lane
    for (const c of cars) {
      const u = c.lane ? (c.ph + t * c.sp) % 1 : 1 - ((c.ph + t * c.sp) % 1);
      const s2 = sOf(u), sc = scOf(u), [px, py] = bez(s2), [nx, ny] = nor(s2), rw = 18 * sc;
      const o = rw * (c.lane ? 0.74 : 0.26), x = px + nx * o, y = py + ny * o, sep = Math.max(1, 3 * sc);
      if (sc > 0.4) for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) add(x + dx * sc * 2, y + dy * sc * 2, BODY, 1, ROAD);
      const col = c.lane ? (sc > 0.25 ? TAIL : TAIL2) : HEAD;
      add(x - nx * sep * 0.5, y - ny * sep * 0.5, col, 1, ROAD);
      add(x + nx * sep * 0.5, y + ny * sep * 0.5, col, 1, ROAD);
      if (sc > 0.6) { add(x - nx * sep * 0.5 + 1, y - ny * sep * 0.5, col, 1, ROAD); add(x + nx * sep * 0.5 + 1, y + ny * sep * 0.5, col, 1, ROAD); }
    }
    // two small boats with a lamp each, drifting across the bay
    for (let k = 0; k < 2; k++) {
      const bx = Math.round(((t * (0.9 + k * 0.5) + k * 90) % (W + 40)) - 20), by = k ? 66 : 80, n = k ? 3 : 5;
      for (let x = -n; x <= n; x++) { add(bx + x, by, HULL, 1, SEA); if (Math.abs(x) < n - 1) add(bx + x, by + 1, HULL, 1, SEA); }
      for (let j = 1; j <= n - 1; j++) add(bx, by - j, HULL, 1, SEA);
      add(bx, by - n, BLAMP, 1, SEA);
      for (let j = 2; j < 7; j++) add(bx, by + j, BLAMP, 0.4 - j * 0.05, SEA);
    }
    return F.finish();
  };
}
