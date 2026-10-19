/* sugarloaf-cable-car: Rio's bay with the domed granite peak and its cable car at golden hour, hand-built.
 * A static scene (sky, far mountains with the statue peak, the shore city, the low hill, the great
 * domed peak, the cables, the bay, a palm beach) is painted once; each frame adds the sun, drifting
 * cloud, two cable cars climbing and returning, sailboats, a launch with its wake, frigatebirds
 * and palm fronds swaying. */
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
  ["#4a5aa0", "#6a6aae", "#9a7ab0", "#c88aa4", "#f0a088", "#fcc488", 14],
  ["#fff6dc", "#ffe6a8", 2],
  ["#7a6aa4", "#8a78ae", "#a08cb8", 3],
  ["#34405e", "#3e4c68", "#4a5a72", 3],
  ["#c8a8b4", "#a88a9e", 2],
  ["#262a42", "#34384f", "#464866", "#686684", "#8a80a8", 5],
  ["#2a3c48", "#3a5058", 2],
  ["#2a3260", "#3a4074", "#4a4c86", "#62609a", "#8a74a4", 5],
  ["#f8c088", "#e0987a", 2],
  ["#c8bcc4", "#a898aa", 2],
  ["#e8c890", "#c84a3a", 2],
  ["#0e1020", "#161a2c", 2],
  ["#d898a0", "#f0b098", 2],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "sugarloaf-cable-car", name: "Sugarloaf Cable Car", category: "cities",
  note: "Rio's bay at golden hour, with cable cars climbing to the top of the domed granite peak, sailboats crossing, frigatebirds gliding and palms swaying on the beach.",
  tags: ["rio", "brazil", "bay", "cable-car", "sailboats", "golden-hour", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, FAR = 1, HILL = 2, ROCK = 3, WATER = 4, FORE = 5;
const HZ = 76;

export default function create() {
  const { rgb, layer, put, get } = makeCanvas();
  const SUN = [30, 46], SR = 7;
  // 1. sky
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#4a5aa0"], [0.25, "#6a6aae"], [0.48, "#9a7ab0"], [0.68, "#c88aa4"], [0.85, "#f0a088"], [1, "#fcc488"]], y / HZ);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    c = mix(c, hex("#fcc488"), clamp(1 - d / 50) * 0.55);
    put(x, y, c, SKY);
  }
  // 2. far mountains, hazy, with the steep statue peak on the left
  const farTop = (x) => 60 - 6 * fbm(x / 16, 2, 3, 3) - 4 * Math.sin(x / 21) - 30 * Math.exp(-(((x - 60) / 7) ** 2)) - 8 * Math.exp(-(((x - 74) / 10) ** 2));
  for (let x = 0; x < W; x++) for (let y = Math.floor(farTop(x)); y < HZ; y++) put(x, y, mix(hex("#a08cb8"), hex("#7a6aa4"), clamp((y - farTop(x)) / 22)), FAR);
  const STX = 60, STY = Math.floor(farTop(60)) - 1;
  for (let j = 0; j < 5; j++) put(STX, STY - j, hex("#5a5878"), FAR);
  for (let dx = -2; dx <= 2; dx++) put(STX + dx, STY - 3, hex("#5a5878"), FAR);
  // 3. nearer green hills on the left with the shore city at their feet
  const hillTop = (x) => 66 - 5 * Math.exp(-(((x - 22) / 18) ** 2)) - 2 * fbm(x / 6, 4, 3, 7);
  for (let x = 0; x < 92; x++) for (let y = Math.floor(hillTop(x)); y < HZ; y++) put(x, y, mix(hex("#4a5a72"), hex("#34405e"), clamp((y - hillTop(x)) / 8)), HILL);
  for (let x = 0; x < 90; x += 1) {
    const h = 1 + Math.floor(hash(x >> 1, 3) * 4), base = HZ;
    for (let y = base - h; y < base; y++) put(x, y, hash(x, y) < 0.18 ? hex("#e8c890") : x % 4 === 3 ? hex("#a88a9e") : hex("#c8a8b4"), HILL);
  }
  // 4. the low hill and the great domed peak
  const rockAt = (x, y, lit, n) => {
    let c = mix(hex("#34384f"), hex("#8a80a8"), clamp(lit));
    if (n > 0.62) c = mix(c, hex("#262a42"), 0.6);
    return c;
  };
  const UX = 106, UT = 54;
  for (let y = UT; y < HZ; y++) {
    const hw = 20 * Math.pow((y - UT + 1) / (HZ - UT), 0.38);
    for (let x = Math.floor(UX - hw); x <= UX + hw; x++) {
      const n = fbm(x / 4, y / 4, 3, 21), lit = 0.7 - (x - UX + hw) / (2 * hw) * 0.8;
      put(x, y, n > 0.48 ? (n > 0.6 ? hex("#3a5058") : hex("#2a3c48")) : rockAt(x, y, lit, n), ROCK);
    }
  }
  const PX = 148, PT = 16;
  const YC = PT + 24, dome = (y, R) => y < YC ? R * Math.sqrt(Math.max(0, 1 - ((YC - y) / (YC - PT)) ** 2)) : R + (y - YC) * 0.1;
  const hwL = (y) => dome(y, 19) + clamp((y - 62) / 14) * 4, hwR = (y) => dome(y, 15) + clamp((y - 64) / 12) * 3;
  for (let y = PT; y < HZ; y++) {
    const cx = PX + (y - PT) * 0.06;
    for (let x = Math.floor(cx - hwL(y)); x <= cx + hwR(y); x++) {
      const u = (x - (cx - hwL(y))) / Math.max(1, hwL(y) + hwR(y)), n = noise2(x / 1.6, y / 7, 5);
      let c = rockAt(x, y, 0.95 - u * 1.1 + (n - 0.5) * 0.3, 0);
      if (u > 0.12 && u < 0.9 && Math.sin(x * 1.3 + n * 4) > 0.75) c = mix(c, hex("#262a42"), 0.5); // vertical streaks
      const veg = fbm(x / 5, y / 4, 3, 31);
      if (y > 50 && veg > 0.5 - (y - 50) * 0.008) c = veg > 0.6 ? hex("#3a5058") : hex("#2a3c48");
      if (u < 0.08) c = hex("#8a80a8");
      put(x, y, c, ROCK);
    }
  }
  // 5. the cables: shore station to the low hill, the low hill to the summit
  const cables = [[[70, 70], [UX - 6, UT - 1]], [[UX + 6, UT - 1], [PX - 4, PT + 2]]];
  for (const [[x0, y0], [x1, y1]] of cables) {
    for (let s = 0; s <= 1; s += 0.003) { const x = lerp(x0, x1, s), y = lerp(y0, y1, s) + 4 * s * (1 - s) * 4; put(x, y, hex("#161a2c"), ROCK); }
    for (const [x, y] of [[x0, y0], [x1, y1]]) for (let dy = 0; dy < 3; dy++) for (let dx = -2; dx <= 2; dx++) put(x + dx, y + dy, hex("#0e1020"), ROCK);
  }
  // 6. the bay: sky mirrored and darkened, a path of sunlight
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / (H - HZ);
    let c = ramp([[0, "#8a74a4"], [0.15, "#62609a"], [0.45, "#4a4c86"], [0.75, "#3a4074"], [1, "#2a3260"]], v);
    const sy = HZ - 1 - (y - HZ) * 1.4;
    if (sy > 0 && fbm(x / 12, y * 0.9, 3, 9) > 0.5) c = mix(c, get(x, sy), 0.45 - v * 0.25);
    const w = 3 + v * 14;
    if (Math.abs(x - SUN[0]) < w && noise2(x / 3, y * 1.2, 7) > 0.42 + Math.abs(x - SUN[0]) / w * 0.3) c = mix(c, hex(v < 0.35 ? "#f8c088" : "#e0987a"), 0.85 - v * 0.35);
    put(x, y, c, WATER);
  }
  // 7. a dark beach in the bottom left corner
  const beach = (x) => 99 + x * 0.12 + 1.5 * Math.sin(x / 9);
  for (let x = 0; x < 72; x++) for (let y = Math.floor(beach(x)); y < H; y++) put(x, y, y < beach(x) + 1 ? hex("#161a2c") : hex("#0e1020"), FORE);

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const INK = hex("#0e1020"), INK2 = hex("#161a2c"), SAIL = hex("#c8bcc4"), SAIL2 = hex("#a898aa"), CAR = hex("#e8c890"), RED = hex("#c84a3a"), WAKE = hex("#8a74a4");
  const clouds = [[0.15, 0.3, 14, 1.3, "#d898a0", 0.5], [0.6, 0.22, 26, 1.1, "#f0b098", 0.4], [0.9, 0.35, 8, 1.4, "#d898a0", 0.55]];
  const palms = [[14, 26, 0], [30, 20, 1.7], [50, 14, 3.1]];

  return (t) => {
    F.begin();
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
    // cable cars: each runs up and back, easing at the stations
    cables.forEach(([[x0, y0], [x1, y1]], k) => {
      const p = ((t / (k ? 26 : 20)) + k * 0.3) % 2, s0 = p < 1 ? p : 2 - p, s = 0.06 + 0.88 * (s0 * s0 * (3 - 2 * s0));
      const x = Math.round(lerp(x0, x1, s)), y = Math.round(lerp(y0, y1, s) + 16 * s * (1 - s));
      add(x, y + 1, INK, 1); add(x, y + 2, INK, 1);
      for (let dx = -3; dx <= 3; dx++) for (let dy = 3; dy <= 6; dy++) add(x + dx, y + dy, dy === 3 || dy === 6 || Math.abs(dx) === 3 ? INK : dy === 4 ? CAR : RED, 1);
    });
    // sailboats drifting across the bay, and a launch with a wake
    for (let k = 0; k < 3; k++) {
      const sc = [0.6, 0.8, 1][k], by = [81, 88, 96][k], dir = k === 1 ? -1 : 1;
      const span = W + 40, bx = Math.round(dir > 0 ? ((t * (1 + k * 0.4) + k * 70) % span) - 20 : W + 20 - ((t * 1.2 + 50) % span));
      const hl = Math.round(8 * sc), mh = Math.round(14 * sc);
      for (let x = -hl; x <= hl; x++) { add(bx + x, by, INK2, 1, WATER); if (Math.abs(x) < hl - 1) add(bx + x, by + 1, INK, 1, WATER); }
      for (let j = 1; j <= mh; j++) {
        add(bx, by - j, INK2, 1, WATER);
        const w = Math.round((1 - j / mh) * hl * 0.9);
        for (let x = 1; x <= w; x++) add(bx + x * dir, by - j, x < 2 ? SAIL2 : SAIL, 1, WATER);
        const w2 = Math.round((1 - j / mh) * hl * 0.6);
        if (j > 1) for (let x = 1; x <= w2; x++) add(bx - x * dir, by - j, SAIL2, 1, WATER);
      }
      for (let j = 2; j < 6; j++) add(bx, by + j, SAIL2, 0.35 - j * 0.05, WATER);
    }
    const lx = Math.round(W + 20 - ((t * 5 + 100) % (W + 60))), ly = 101;
    for (let k = 1; k < 26; k++) { const sp = Math.floor(k / 5); add(lx + 7 + k, ly + 1 + sp, WAKE, 0.7 - k / 40, WATER); add(lx + 7 + k, ly - Math.min(sp, 1) + 1, WAKE, 0.4 - k / 70, WATER); }
    for (let x = 0; x < 9; x++) { add(lx + x, ly, INK, 1, WATER); if (x > 0 && x < 8) add(lx + x, ly + 1, INK, 1, WATER); }
    for (let x = 3; x < 7; x++) add(lx + x, ly - 1, SAIL2, 1, WATER);
    // frigatebirds gliding in slow circles, long angled wings
    for (let k = 0; k < 3; k++) {
      const a = t * (0.18 + k * 0.05) + k * 2.1, x = Math.round(120 + k * 18 + Math.cos(a) * (20 + k * 6)), y = Math.round(14 + k * 6 + Math.sin(a) * 5);
      const tilt = Math.round(Math.sin(a) * 1);
      add(x, y, INK, 1);
      for (let j = 1; j <= 4; j++) { const dy = j < 3 ? -1 : 0; add(x - j, y + dy - (j > 2 ? tilt : 0), INK, 1); add(x + j, y + dy + (j > 2 ? tilt : 0), INK, 1); }
      add(x - 5, y + 1, INK, 1); add(x + 5, y + 1, INK, 1);
    }
    // palms on the beach, fronds swaying in the sea breeze
    for (const [px, ph, o] of palms) {
      const base = Math.round(beach(px)), sway = Math.sin(t * 0.9 + o) * 1.5;
      let tx = px, ty = base;
      for (let j = 0; j < ph; j++) { const k = j / ph; tx = px + k * k * (6 + sway); ty = base - j; add(tx, ty, INK, 1); add(tx + 1, ty, INK2, 1); }
      for (let f = 0; f < 7; f++) {
        const ang = -Math.PI + (f / 6) * Math.PI + Math.sin(t * 1.3 + o + f) * 0.08, len = 9 + (f % 2) * 3;
        for (let j = 1; j <= len; j++) {
          const k = j / len, fx = tx + Math.cos(ang) * j, fy = ty + Math.sin(ang) * j * 0.6 + k * k * 5;
          add(fx, fy, INK, 1); if (k > 0.2 && k < 0.8) add(fx, fy + 1, INK2, 1);
        }
      }
    }
    return F.finish();
  };
}
