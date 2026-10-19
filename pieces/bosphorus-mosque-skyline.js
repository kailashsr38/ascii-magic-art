/* bosphorus-mosque-skyline: Istanbul's skyline of domes and minarets over the Bosphorus at sunset, hand-built.
 * A static scene (sunset sky, the old city hill, the great mosque with its cascading domes and
 * four minarets, a smaller mosque, the stone tower, the strait) is painted once; each frame adds
 * the sun, drifting cloud, two ferries crossing with smoke and wakes, and gulls. */
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
  ["#2a2a68", "#4a3a7c", "#7a4a88", "#b05a80", "#de7470", "#f49a68", "#fbbe74", 14],
  ["#fff4d4", "#ffe0a0", 2],
  ["#140c1c", "#1e1428", "#2c1e34", "#4a2e48", 4],
  ["#e89a5a", "#b8704a", 2],
  ["#1a1840", "#2a2456", "#3e2e68", "#5a3a74", "#7e4a7a", 6],
  ["#f8b878", "#e08a6a", 2],
  ["#c8bcc0", "#a89aa8", "#c84a3a", 3],
  ["#6a5a70", "#8a7a8c", 2],
  ["#c86a7a", "#e8907a", 2],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "bosphorus-mosque-skyline", name: "Bosphorus Mosque Skyline", category: "cities",
  note: "Istanbul's domes and slender minarets stand against a sunset over the Bosphorus, with ferries crossing the strait and gulls wheeling overhead.",
  tags: ["istanbul", "turkey", "sunset", "mosque", "ferry", "gulls", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, CITY = 1, WATER = 2;
const HZ = 72;

export default function create() {
  const { rgb, layer, put, get } = makeCanvas();
  const SUN = [156, 52], SR = 6;
  const S0 = hex("#140c1c"), S1 = hex("#1e1428"), S2 = hex("#2c1e34"), RIM = hex("#4a2e48");
  // 1. sunset sky
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#2a2a68"], [0.2, "#4a3a7c"], [0.4, "#7a4a88"], [0.58, "#b05a80"], [0.74, "#de7470"], [0.88, "#f49a68"], [1, "#fbbe74"]], y / HZ);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    c = mix(c, hex("#fbbe74"), clamp(1 - d / 48) * 0.5);
    put(x, y, c, SKY);
  }
  // 2. the old city hill with rows of houses and a few lit windows
  const hill = (x) => HZ - 3 - 8 * Math.exp(-(((x - 96) / 60) ** 2)) - 2 * fbm(x / 7, 3, 3, 4);
  for (let x = 0; x < W; x++) {
    const top = Math.round(hill(x) - (hash(x >> 2, 1) < 0.5 ? 2 : 0));
    for (let y = top; y < HZ + 1; y++) put(x, y, y === top ? S2 : S1, CITY);
  }
  for (let y = 60; y < HZ; y += 2) for (let x = 1; x < W; x += 3) if (y > hill(x) + 1 && hash(x, y) < 0.18) put(x, y, hash(y, x) < 0.5 ? hex("#e89a5a") : hex("#b8704a"), CITY);
  // shapes
  const dome = (cx, cy, rx, ry) => {
    for (let y = Math.floor(cy - ry); y <= cy; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) put(x, y, d > 0.72 && x > cx ? RIM : d > 0.8 ? S1 : S0, CITY);
    }
    put(cx, cy - ry - 1, S1, CITY); put(cx, cy - ry - 2, S1, CITY); put(cx, cy - ry - 3, S0, CITY);
  };
  const box = (x0, y0, x1, y1, c = S0) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c, CITY); };
  const minaret = (x, top, base) => {
    box(x - 1, top + 5, x + 1, base, S0);
    box(x - 2, base - 6, x + 2, base, S0);
    for (const by of [top + 12, top + 22, top + 32]) if (by < base - 8) { box(x - 2, by, x + 2, by + 1, S0); put(x - 3, by, S1, CITY); put(x + 3, by, S1, CITY); }
    for (let j = 0; j < 7; j++) { const w = j < 3 ? 1 : 0; box(x - w, top + 5 - j, x + w, top + 5 - j, S0); }
    put(x, top - 3, S1, CITY);
    for (let y = top + 6; y < base - 6; y++) put(x + 1, y, S2, CITY);
  };
  // 3. the great mosque: body, cascading domes, four minarets
  const MX = 100;
  box(MX - 36, 56, MX + 36, HZ, S0);
  for (let x = MX - 36; x <= MX + 36; x += 3) { put(x, 59, S2, CITY); put(x, 63, hex("#b8704a"), CITY); }
  dome(MX - 27, 56, 5, 4); dome(MX + 27, 56, 5, 4); dome(MX - 20, 56, 4, 3); dome(MX + 20, 56, 4, 3);
  box(MX - 20, 50, MX + 20, 56, S0);
  dome(MX - 15, 51, 9, 7); dome(MX + 15, 51, 9, 7);
  box(MX - 15, 44, MX + 15, 50, S1);
  for (let x = MX - 13; x <= MX + 13; x += 3) { put(x, 46, hex("#e89a5a"), CITY); put(x, 47, hex("#b8704a"), CITY); }
  dome(MX, 44, 16, 13);
  minaret(MX - 42, 12, HZ); minaret(MX + 42, 12, HZ); minaret(MX - 31, 22, 58); minaret(MX + 31, 22, 58);
  // 4. a smaller mosque on the left and the round stone tower on the right
  box(14, 60, 48, HZ, S0); box(22, 54, 40, 60, S1); dome(31, 54, 9, 8); dome(19, 60, 4, 3); dome(43, 60, 4, 3);
  minaret(10, 30, HZ); minaret(52, 30, HZ);
  const TX = 176;
  box(TX - 5, 42, TX + 5, HZ, S0);
  for (let y = 44; y < HZ - 2; y += 5) put(TX + 1, y, hex("#e89a5a"), CITY);
  box(TX - 6, 41, TX + 6, 42, S1);
  for (let j = 0; j < 11; j++) { const w = Math.round(6 - j * 0.55); box(TX - w, 40 - j, TX + w, 40 - j, S0); }
  put(TX, 28, S1, CITY); put(TX, 27, S1, CITY);
  // 5. the strait: sky mirrored and darkened, a broken path of sunlight
  for (let y = HZ + 1; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / (H - HZ);
    let c = ramp([[0, "#7e4a7a"], [0.15, "#5a3a74"], [0.45, "#3e2e68"], [0.75, "#2a2456"], [1, "#1a1840"]], v);
    const src = get(x, HZ - 1 - (y - HZ) * 1.6);
    if (fbm(x / 12, y * 0.9, 3, 9) > 0.52) c = mix(c, src, 0.5 - v * 0.3);
    const w = 3 + v * 14;
    if (Math.abs(x - SUN[0]) < w && noise2(x / 3, y * 1.2, 7) > 0.42 + Math.abs(x - SUN[0]) / w * 0.3) c = mix(c, hex(v < 0.35 ? "#f8b878" : "#e08a6a"), 0.85 - v * 0.35);
    put(x, y, c, WATER);
  }

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const WHITE = hex("#c8bcc0"), GREY = hex("#a89aa8"), RED = hex("#c84a3a"), SMOKE = hex("#6a5a70"), SMOKE2 = hex("#8a7a8c"), GULL = hex("#dcd0cc"), WAKE = hex("#e08a6a");
  const clouds = [[0.1, 0.3, 14, 1.3, "#c86a7a", 0.5], [0.5, 0.25, 26, 1.1, "#e8907a", 0.4], [0.85, 0.35, 8, 1.5, "#c86a7a", 0.6], [0.65, 0.2, 38, 1, "#e8907a", 0.45]];
  const ferry = (fx, fy, dir, sc) => {
    const L = Math.round(30 * sc), hH = Math.max(2, Math.round(3 * sc));
    for (let k = 1; k < 40 * sc; k++) { const sp = Math.floor(k / (6 * sc)); add(fx - dir * (k + (dir > 0 ? 0 : L)), fy + 1 + sp, WAKE, 0.6 - k / (70 * sc), WATER); }
    for (let x = 0; x < L; x++) for (let y = 0; y < hH; y++) if (x > y && x < L - y) add(fx + (dir > 0 ? x : -x), fy - y + 1, S0, 1, WATER);
    const d0 = Math.round(L * 0.15), d1 = Math.round(L * 0.85);
    for (let x = d0; x < d1; x++) { const X = fx + (dir > 0 ? x : -x); add(X, fy - hH + 1, WHITE, 1, WATER); add(X, fy - hH, x % 2 ? S1 : WHITE, 1, WATER); add(X, fy - hH - 1, WHITE, 1, WATER); }
    for (let x = d0 + 3; x < d1 - 3; x++) { const X = fx + (dir > 0 ? x : -x); add(X, fy - hH - 2, x % 2 ? S1 : GREY, 1, WATER); add(X, fy - hH - 3, WHITE, 1, WATER); }
    const fxn = fx + dir * Math.round(L * 0.5);
    for (let y = 4; y < 7; y++) { add(fxn, fy - hH - y, y === 6 ? S0 : RED, 1, WATER); add(fxn + 1, fy - hH - y, y === 6 ? S0 : RED, 1, WATER); }
    for (let p = 0; p < 7; p++) {
      const age = (t0 * 0.4 + p / 7 + sc) % 1, r = 0.8 + age * 3 * sc, px = fxn - dir * age * 20 * sc, py = fy - hH - 8 - age * 10 * sc;
      for (let y = Math.floor(py - r); y <= py + r; y++) for (let x = Math.floor(px - r); x <= px + r; x++) { const d = Math.hypot(x - px, y - py) / r; if (d < 1) add(x, y, d < 0.5 ? SMOKE2 : SMOKE, (1 - age) * 0.7, WATER); }
    }
  };
  let t0 = 0;
  const gulls = Array.from({ length: 6 }, (_, i) => ({ cx: 30 + i * 28 + hash(i, 1) * 10, cy: 20 + hash(i, 2) * 30, r: 8 + hash(i, 3) * 10, sp: 0.25 + hash(i, 4) * 0.2, ph: i * 1.7 }));

  return (t) => {
    F.begin();
    t0 = t;
    for (let y = SUN[1] - SR; y <= SUN[1] + SR; y++) for (let x = SUN[0] - SR; x <= SUN[0] + SR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SR) add(x, y, d < SR - 1.3 ? hex("#fff4d4") : hex("#ffe0a0"), 1, SKY);
    }
    for (const [u, len, cy, th, col, sp] of clouds) {
      const L = len * W, cx = ((((u * W + t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3, C = hex(col);
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.1 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, C, a * 0.75, SKY);
      }
    }
    // two ferries: a far one heading left, a near one heading right
    ferry(Math.round(W + 30 - ((t * 2.2 + 60) % (W + 70))), 80, -1, 0.6);
    ferry(Math.round(((t * 3.4 + 20) % (W + 80)) - 40), 97, 1, 1);
    // gulls circling, wings beating
    for (const g of gulls) {
      const a = t * g.sp + g.ph, x = Math.round(g.cx + Math.cos(a) * g.r * 1.6), y = Math.round(g.cy + Math.sin(a) * g.r * 0.5), up = Math.sin(t * 7 + g.ph) > 0;
      add(x, y, GULL, 1); add(x - 1, y + (up ? -1 : 0), GULL, 1); add(x + 1, y + (up ? -1 : 0), GULL, 1); add(x - 2, y + (up ? -1 : 1), GULL, 1); add(x + 2, y + (up ? -1 : 1), GULL, 1);
    }
    return F.finish();
  };
}
