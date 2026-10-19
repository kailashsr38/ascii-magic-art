/* sea-torii-sunset: a shrine gate standing in the sea as the sun sets through it, hand-built.
 * A static scene (sunset sky, far islands, the gate, the sea with the sun's path and
 * the gate's reflection, shore rocks) is painted once; each frame adds the sun, waves
 * rolling in as moving crest lines, foam at the posts and a flock of gulls. */
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
function buildPalette(anchors) {
  const pal = [];
  for (const a of anchors) {
    const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
    for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); pal.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
  }
  return pal;
}
function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const LEVELS = "▁▂▃▄▅▆▇█";
// The painted picture: rgb plus a layer id per cell (0 = sky, larger = nearer).
function makeCanvas() {
  const rgb = new Float32Array(W * H * 3), layer = new Uint8Array(W * H);
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  return { rgb, layer, put, blend };
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

const ANCHORS = [
  ["#7a3e72", "#a85a80", "#b85e80", "#c25a7a", "#e0707a", "#f5886c", "#ff9c64", "#ffb060", "#ffc470", "#ffd488", 16],
  ["#fff6d8", "#ffe6a0", "#ffd27a", 3],
  ["#5a2a52", "#6e3258", "#84405e", 3],
  ["#2a0c12", "#3e1218", "#5a1a1c", "#7a2420", "#a03224", 6],
  ["#ffbe7a", "#f59a6c", "#e07a6a", "#c0606a", "#9a4a64", "#74385a", "#52284a", 12],
  ["#ffcf7a", "#f8b060", "#f0a070", 3],
  ["#1a0a14", "#24101c", 2],
  ["#ffe8d0", "#f8c8b0", 2],
  ["#9a4a6a", "#b85a70", 2],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "sea-torii-sunset", name: "Sea Torii Sunset", category: "landscapes",
  note: "A shrine gate stands in the sea as the sun sets between its posts, with waves rolling in and gulls crossing the sky.",
  tags: ["sunset", "japan", "torii", "sea", "waves", "birds", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, ISLE = 1, SEA = 2, GATE = 3, ROCK = 4;
const HOR = 58, CX = 96, BASE = 88;

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  const SUN = [CX, 51], SUNR = 9;
  // 1. sky: purple overhead to gold at the horizon, warm glow round the sun
  for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#a85a80"], [0.2, "#b85e80"], [0.38, "#c25a7a"], [0.55, "#e0707a"], [0.7, "#f5886c"], [0.84, "#ff9c64"], [1, "#ffb060"]], y / HOR);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.6);
    c = mix(c, hex("#ffc470"), clamp(1 - d / 64) * 0.6);
    put(x, y, c, SKY);
  }
  // thin static cloud bars catching the light
  const bars = [[40, 30, 46], [150, 24, 38], [118, 38, 30], [20, 44, 34], [170, 46, 26]];
  for (const [cx, cy, L] of bars) for (let x = cx - L / 2; x < cx + L / 2; x++) {
    const a = clamp(1 - Math.abs(x - cx) / (L / 2)) * 1.6, w = Math.round(1 + a);
    for (let y = cy; y < cy + w; y++) { const i = (y * W + Math.round(x)) * 3; if (x >= 0 && x < W) put(x, y, mix([rgb[i], rgb[i + 1], rgb[i + 2]], Math.abs(cx - CX) < 40 ? hex("#ffd488") : hex("#9a4a6a"), clamp(a) * 0.6), SKY); }
  }
  // 2. far islands on the horizon
  const isle = (x) => {
    const l = 50 + (x / 52) ** 2 * 7 - 2 * fbm(x / 9, 3, 3, 5), r = 52 + ((W - x) / 46) ** 2 * 6 - 2 * fbm(x / 8, 7, 3, 9);
    return Math.min(x < 60 ? l : 99, x > 140 ? r : 99);
  };
  for (let x = 0; x < W; x++) for (let y = Math.floor(isle(x)); y < HOR; y++) put(x, y, mix(hex("#84405e"), hex("#5a2a52"), clamp((y - isle(x)) / 5)), ISLE);
  // 3. sea, warm near the horizon and dark close in, with the sun's path
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y - HOR) / (H - HOR);
    let c = ramp([[0, "#ffbe7a"], [0.12, "#f59a6c"], [0.3, "#e07a6a"], [0.55, "#c0606a"], [0.8, "#9a4a64"], [1, "#74385a"]], k);
    const sd = Math.abs(x - CX) / (6 + k * 26), band = noise2(x / 7, y * 0.9, 3);
    if (sd < 1) c = mix(c, hex("#ffcf7a"), (1 - sd * sd) * (band > 0.4 ? 0.8 : 0.35) * (1 - k * 0.4));
    put(x, y, c, SEA);
  }
  // 4. the gate: two posts, the lower beam, the centre strut and the curved top beams
  const gateCol = (x, y) => (noise2(x / 2, y / 2, 4) > 0.75 ? hex("#3e1218") : hex("#2a0c12"));
  const rect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, gateCol(x, y), GATE); };
  for (const px of [76, 116]) for (let y = 22; y <= BASE; y++) { const w = 3 + (y - 22) / 60; for (let x = Math.round(px - w); x <= Math.round(px + w - 1); x++) put(x, y, gateCol(x, y), GATE); }
  rect(62, 33, 130, 36);      // lower beam
  rect(94, 22, 98, 33);       // centre strut
  for (let x = 54; x <= 138; x++) {
    const u = Math.abs(x - CX) / 42, lift = Math.pow(u, 3) * 5;
    for (let y = Math.round(15 - lift); y <= Math.round(19 - lift * 0.8); y++) put(x, y, gateCol(x, y), GATE);  // top beam
    if (u < 0.88) for (let y = 20; y <= 22; y++) put(x, y, gateCol(x, y), GATE);                                  // second beam
  }
  // red rim light on the sun-facing edges
  for (let y = 14; y <= BASE; y++) for (let x = 54; x <= 138; x++) {
    const i = y * W + x;
    if (layer[i] === GATE && (layer[i - 1] !== GATE || layer[i + 1] !== GATE) && Math.hypot(x - SUN[0], y - SUN[1]) < 46) put(x, y, hex("#7a2420"), GATE);
  }
  // reflection of the posts below the waterline, wavering
  for (let y = BASE + 1; y < H; y++) for (const px of [76, 116]) {
    const wob = Math.round(Math.sin(y * 1.3) * 1.2);
    for (let x = px - 3; x <= px + 3; x++) { const i = (y * W + x + wob) * 3; put(x + wob, y, mix([rgb[i], rgb[i + 1], rgb[i + 2]], hex("#24101c"), 0.65), SEA); }
  }
  // 5. shore rocks in the bottom corners
  const rockL = [[0, 84], [10, 82], [22, 88], [34, 92], [46, 100], [52, H], [0, H]];
  const rockR = [[W, 92], [182, 90], [172, 96], [160, 102], [154, H], [W, H]];
  for (let y = 80; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(x + 0.5, y + 0.5, rockL) || inPoly(x + 0.5, y + 0.5, rockR)) {
    const n = fbm(x / 4, y / 4, 3, 11);
    put(x, y, n > 0.58 ? hex("#3e1218") : hex("#1a0a14"), ROCK);
  }

  const F = makeFrame(rgb, layer, PAL);
  const { add } = F;
  const waves = Array.from({ length: 11 }, (_, i) => ({ ph: i / 11, s: i * 3.7 }));
  const gulls = Array.from({ length: 6 }, (_, i) => ({ dx: i * 7 + (i % 2) * 3, dy: (i % 3) * 3 - i, ph: i * 1.1 }));
  const DARK = hex("#24101c"), TROUGH = hex("#74385a");

  return (t) => {
    F.begin();
    // the sun, cut by the horizon
    for (let y = SUN[1] - SUNR; y <= SUN[1] + SUNR; y++) for (let x = SUN[0] - SUNR; x <= SUN[0] + SUNR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SUNR) add(x, y, d < SUNR - 2 ? hex("#fff6d8") : hex("#ffe6a0"), 1, SKY);
    }
    // waves rolling in: crest lines move down the sea, spreading as they come near
    for (const wv of waves) {
      const p = (wv.ph + t * 0.045) % 1, yb = HOR + 1 + (H - HOR) * Math.pow(p, 1.7);
      const amp = 0.3 + p * 2.2, thick = p > 0.55 ? 2 : 1;
      for (let x = 0; x < W; x++) {
        const y = Math.round(yb + Math.sin(x * (0.16 - p * 0.1) + wv.s + t * 0.4) * amp);
        const brk = noise2(x / (4 + p * 10), wv.s, 7);
        if (brk < 0.3) continue;
        const sun = clamp(1 - Math.abs(x - CX) / (10 + p * 30));
        const lc = mix(hex("#ffc89a"), hex("#ffe6a0"), sun);
        for (let k = 0; k < thick; k++) add(x, y - k, lc, 0.55 + p * 0.35, SEA);
        add(x, y + 1, TROUGH, 0.45 + p * 0.3, SEA);
        if (p > 0.6) add(x, y + 2, TROUGH, 0.4, SEA);
      }
    }
    // foam rings at the posts and along the rocks
    for (const px of [76, 116]) for (let k = 0; k < 2; k++) {
      const p = (t * 0.5 + k * 0.5) % 1, r = 4 + p * 9;
      for (let x = Math.round(px - r); x <= px + r; x++) add(x, BASE + 1 + Math.round(p * 2), hex("#ffe8d0"), (1 - p) * 0.8, SEA);
    }
    for (let x = 0; x < W; x++) {
      const surf = 0.5 + 0.5 * Math.sin(t * 0.9 + x * 0.05);
      for (let y = 80; y < H; y++) { const i = y * W + x; if (layer[i] === ROCK) { if (layer[i - W] !== ROCK && surf > 0.45) add(x, y - 1, hex("#f8c8b0"), surf * 0.7, SEA); break; } }
    }
    // gulls crossing right to left
    const gt = ((t + 1) % 26) / 26, gx = lerp(W + 20, -50, gt), gy = 22 + Math.sin(gt * 7) * 3;
    for (const b of gulls) {
      const x = Math.round(gx + b.dx), y = Math.round(gy + b.dy + Math.sin(t * 1.5 + b.ph)), f = Math.sin(t * 7 + b.ph);
      const up = f > 0.3 ? -1 : f < -0.3 ? 1 : 0;
      add(x, y, DARK, 1, SKY); add(x - 1, y + Math.min(0, up), DARK, 1, SKY); add(x + 1, y + Math.min(0, up), DARK, 1, SKY);
      add(x - 2, y + up, DARK, 1, SKY); add(x + 2, y + up, DARK, 1, SKY);
    }
    return F.finish();
  };
}
