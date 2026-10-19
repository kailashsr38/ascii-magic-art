/* aurora-cabin-snowfall: northern lights over a snowy log cabin, hand-built.
 * A static scene (night sky and stars, snowy peaks, the pine belt, snowfields, the
 * cabin and the big foreground pines) is painted once; each frame adds the aurora
 * curtains folding slowly across the sky, chimney smoke, lit windows and falling snow. */
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
  ["#0a1430", "#12224a", "#1c3460", "#284870", "#365a7c", 10],
  ["#d8e4ff", "#a8b8e0", 2],
  ["#2a6a6a", "#30a088", "#50d098", "#8affb8", "#d0ffe0", 10],
  ["#5a3a8a", "#8a50b0", "#b070c0", 3],
  ["#1e2c4a", "#2e4060", "#5a7090", "#8aa0c0", 4],
  ["#06101a", "#0c1824", "#14222e", 3],
  ["#6a80a4", "#8aa0c4", "#a8bcd8", "#c8d8ec", "#e4eefa", 8],
  ["#2a1a14", "#6a4a34", "#8a6448", 3],
  ["#fff0c0", "#ffc860", "#e09040", 3],
  ["#c09a8a", "#9a8a98", 2],
  ["#7a8aa4", "#a0acc0", 2],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "aurora-cabin-snowfall", name: "Aurora Cabin Snowfall", category: "landscapes",
  note: "Green northern lights fold slowly over a snowy log cabin with lit windows, chimney smoke and gently falling snow.",
  tags: ["aurora", "northern-lights", "cabin", "snow", "winter", "night", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, PEAK = 1, PINE = 2, SNOW = 3, CABIN = 4, FORE = 5;

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  // 1. night sky and fixed stars
  for (let y = 0; y < 70; y++) for (let x = 0; x < W; x++) put(x, y, ramp([[0, "#0a1430"], [0.35, "#12224a"], [0.65, "#1c3460"], [0.85, "#284870"], [1, "#365a7c"]], y / 66), SKY);
  let sd = 11;
  const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 110; i++) put(Math.floor(r() * W), Math.floor(Math.pow(r(), 1.3) * 58), r() > 0.8 ? hex("#d8e4ff") : hex("#a8b8e0"), SKY);
  // 2. snowy peaks
  const peak = (x) => 60 - 12 * Math.max(0, 1 - Math.abs(x - 40) / 34) - 16 * Math.max(0, 1 - Math.abs(x - 132) / 40) - 8 * Math.max(0, 1 - Math.abs(x - 186) / 22) + 2 * fbm(x / 6, 1, 3, 3);
  for (let x = 0; x < W; x++) for (let y = Math.floor(peak(x)); y < 72; y++) {
    const snowy = y < peak(x) + 6 + 3 * noise2(x / 2, 4) && fbm(x / 3, y / 2, 2, 7) > 0.38;
    const lit = Math.sin(x / 5 + y * 0.3) > 0 ? 1 : 0;
    put(x, y, snowy ? (lit ? hex("#8aa0c0") : hex("#5a7090")) : y < peak(x) + 10 ? hex("#2e4060") : hex("#1e2c4a"), PEAK);
  }
  // 3. the pine belt across the valley
  for (let x = 0; x < W; x++) for (let y = 66; y < 76; y++) put(x, y, hex("#0c1824"), PINE);
  for (let i = 0; i < 70; i++) {
    const px = Math.floor(r() * W), h = 6 + Math.floor(r() * 9), base = 70 + Math.floor(r() * 4);
    for (let j = 0; j < h; j++) { const w = Math.round((h - j) * 0.3); for (let x = px - w; x <= px + w; x++) put(x, base - j, j % 3 === 2 && x === px - w ? hex("#5a7090") : hex("#0c1824"), PINE); }
  }
  // 4. snowfields, rolling drifts, brighter toward us
  const field = (x) => 74 + 2 * Math.sin(x / 23) + 1.5 * fbm(x / 9, 6, 3, 9);
  for (let x = 0; x < W; x++) for (let y = Math.floor(field(x)); y < H; y++) {
    const k = (y - field(x)) / 34, drift = Math.sin(x / 14 + y * 0.35 + fbm(x / 20, y / 10, 2, 4) * 3);
    let c = ramp([[0, "#5a7090"], [0.3, "#6a80a4"], [0.7, "#8aa0c4"], [1, "#a8bcd8"]], k);
    if (drift > 0.75) c = mix(c, hex("#c8d8ec"), 0.45); else if (drift < -0.8) c = mix(c, hex("#6a80a4"), 0.4);
    put(x, y, c, SNOW);
  }
  // 5. the cabin: log walls, a steep snowy roof, chimney, door and two windows
  const CX = 74, GY = 88;
  for (let y = 74; y <= GY; y++) for (let x = 52; x <= 96; x++) put(x, y, (y - 74) % 3 === 2 ? hex("#2a1a14") : x < 60 ? hex("#8a6448") : hex("#6a4a34"), CABIN);
  for (let y = 56; y <= 75; y++) {
    const hw = (y - 56) * 1.35;
    for (let x = Math.round(CX - hw - 3); x <= Math.round(CX + hw + 3); x++) {
      const edge = (y - 56) * 1.35 + 3 - Math.abs(x - CX);
      put(x, y, edge < 4 || y > 72 ? (x < CX ? hex("#e4eefa") : hex("#c8d8ec")) : (y - 56) % 3 === 2 ? hex("#2a1a14") : hex("#6a4a34"), CABIN);
    }
  }
  for (let y = 59; y <= 66; y++) for (let x = 86; x <= 89; x++) put(x, y, y === 59 ? hex("#e4eefa") : hex("#2a1a14"), CABIN);
  for (let y = 80; y <= GY; y++) for (let x = 72; x <= 77; x++) put(x, y, hex("#2a1a14"), CABIN);
  const windows = [[57, 77], [83, 77]];
  // warm light spilling on the snow in front
  for (const [wx] of windows) for (let y = GY + 1; y < GY + 9; y++) for (let x = wx - 6; x <= wx + 10; x++) {
    const a = clamp(1 - Math.abs(x - wx - 2) / 9) * clamp(1 - (y - GY) / 9) * 0.5;
    if (a > 0) { const i = (y * W + x) * 3; put(x, y, mix([rgb[i], rgb[i + 1], rgb[i + 2]], hex("#c09a8a"), a), SNOW); }
  }
  // 6. big pines in the foreground corners, snow on the boughs
  const pine = (px, base, h, w) => {
    for (let j = 0; j < h; j++) {
      const tier = (j % 7) / 7, hw = Math.round((1 - j / h) * w * (0.6 + tier * 0.5));
      for (let x = px - hw; x <= px + hw; x++) put(x, base - j, tier < 0.15 && Math.abs(x - px) > 1 ? hex("#a8bcd8") : hex("#06101a"), FORE);
    }
    for (let j = 0; j < 4; j++) put(px, base + j, hex("#06101a"), FORE);
  };
  pine(10, 104, 64, 13); pine(26, 108, 40, 9); pine(182, 106, 70, 14); pine(166, 108, 36, 8);

  const F = makeFrame(rgb, layer, PAL);
  const { add } = F;
  const flakes = Array.from({ length: 150 }, (_, i) => ({ x: ((i * 131) % 197) - 2, ph: ((i * 71) % 173) / 173, v: 0.04 + (i % 5) * 0.012, a: 1 + (i % 3), big: i % 6 === 0 }));
  const AUR = ["#2a6a6a", "#30a088", "#50d098", "#8affb8", "#d0ffe0"].map(hex), PINK = hex("#8a50b0");
  const ray = new Float32Array(W), base = new Float32Array(W);

  return (t) => {
    F.begin();
    // aurora: a folded curtain whose rays slide along it and whose hem slowly ripples
    for (let x = 0; x < W; x++) {
      base[x] = 30 + 7 * Math.sin(x / 38 + t * 0.06) + 4 * Math.sin(x / 15 - t * 0.11) + 3 * Math.sin(x / 61 + 2);
      ray[x] = clamp(0.3 + clamp(fbm(x / 3.2 + t * 0.35, t * 0.04, 3, 21) * 1.8 - 0.5) * 0.8) * (0.78 + 0.22 * Math.sin(x / 50 + t * 0.03 + 1));
    }
    for (let x = 0; x < W; x++) {
      const b = base[x], I = ray[x];
      if (I < 0.03) continue;
      for (let y = Math.max(0, Math.floor(b - 34)); y <= b + 2; y++) {
        const up = b - y;
        const a = (up < 0 ? clamp(1 + up / 2.5) : Math.exp(-up / 15)) * I * 1.5;
        if (a < 0.04) continue;
        const c = up < 3 ? AUR[3] : up < 12 ? mix(AUR[3], AUR[2], (up - 3) / 9) : up < 22 ? mix(AUR[2], AUR[1], (up - 12) / 10) : mix(AUR[1], PINK, clamp((up - 22) / 10));
        add(x, y, a > 1.05 && up < 4 ? AUR[4] : c, clamp(a), SKY);
      }
    }
    // chimney smoke drifting up and to the right
    for (let j = 0; j < 14; j++) {
      const a = (t * 0.12 + j / 14) % 1, px = 87.5 + a * 22 + Math.sin(t * 0.5 + j) * 1.5 * a, py = 57 - a * 30, rad = 1.2 + a * 4;
      for (let y = Math.floor(py - rad); y <= py + rad; y++) for (let x = Math.floor(px - rad); x <= px + rad; x++) {
        const d = Math.hypot(x - px, y - py) / rad;
        if (d < 1) add(x, y, hex("#a0acc0"), (1 - d) * (1 - a * 0.8) * 0.85, PEAK);
      }
    }
    // lit windows with a fire's soft flicker
    windows.forEach(([x, y], i) => {
      const f = 0.85 + 0.15 * Math.sin(t * 6.1 + i * 2) * Math.sin(t * 2.3 + i);
      for (let yy = y; yy < y + 7; yy++) for (let xx = x; xx < x + 7; xx++) add(xx, yy, xx === x + 3 || yy === y + 3 ? hex("#2a1a14") : mix(hex("#e09040"), hex("#fff0c0"), f * 0.8), 1);
    });
    // snow falling, swaying
    for (const fl of flakes) {
      const p = (fl.ph + t * fl.v) % 1, y = -2 + p * (H + 4), x = fl.x + Math.sin(t * 0.8 + fl.ph * 12) * fl.a + p * 6;
      add(x, y, hex("#e4eefa"), 0.9);
      if (fl.big) add(x + 1, y, hex("#c8d8ec"), 0.7);
    }
    return F.finish();
  };
}
