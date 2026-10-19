/* ladakh-crag-monastery: a whitewashed monastery stacked up a rocky crag in the high desert, prayer flags flapping, hand-built.
 * A static scene (deep blue high sky, snow peaks, bare ochre mountains, the crag with
 * the monastery's whitewashed and maroon-banded buildings, chortens) is painted once;
 * each frame adds drifting cloud, a vulture circling and strings of prayer flags
 * rippling in the wind. */
import { fbm, noise2, clamp, lerp, rng, KEYS } from "../lib/kit.js";

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
const LEVELS = "▁▂▃▄▅▆▇█";
// each cell -> nearest palette key + a level char for its brightness against that key
function encoder(PAL) {
  const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
  const cache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = cache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    cache.set(k, best);
    return best;
  };
  return (out) => {
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
}
// a float RGB canvas with put (opaque) and add (blend) helpers
function canvas() {
  const rgb = new Float32Array(W * H * 3);
  const put = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2]; };
  const add = (x, y, c, a) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = (y * W + x) * 3; rgb[i] += (c[0] - rgb[i]) * a; rgb[i + 1] += (c[1] - rgb[i + 1]) * a; rgb[i + 2] += (c[2] - rgb[i + 2]) * a; };
  const get = (x, y) => { x = clamp(Math.floor(x), 0, W - 1); y = clamp(Math.floor(y), 0, H - 1); const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x1; x++) put(x, y, c); };
  return { rgb, put, add, get, rect };
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };
// a standing or walking person, feet on row y, h cells tall; step in -1..1 swings the legs
function figure(put, x, y, h, c, step = 0, o = {}) {
  const legH = Math.max(2, Math.round(h * 0.4)), headR = Math.max(1, Math.round(h * 0.09)), bodyH = h - legH - headR * 2;
  const bw = Math.max(1, Math.round(h * 0.1));
  for (let k = 0; k < legH; k++) {
    const f = k / legH;
    if (o.skirt) { const sw = bw + Math.round(f * 1.2); for (let dx = -sw; dx <= sw; dx++) put(x + dx, y - legH + k, c); }
    else { put(x - 1 + step * f, y - legH + k, c); put(x + 1 - step * f, y - legH + k, c); put(x, y - legH, c); }
  }
  for (let k = 0; k < bodyH; k++) for (let dx = -bw; dx <= bw; dx++) put(x + dx, y - legH - k - 1, c);
  const hy = y - legH - bodyH - headR;
  for (let dy = -headR; dy <= headR; dy++) for (let dx = -headR; dx <= headR; dx++) if (dx * dx + dy * dy <= headR * headR + 0.6) put(x + dx, hy + dy, c);
  return { shoulder: [x, y - legH - bodyH + 1], head: [x, hy], hip: [x, y - legH] };
}
// 3x5 capitals for shop signs
const F5 = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", K: "101101110101101",
  L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
  R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", W: "1000110001101011010101010",
  Y: "101101010010010", " ": "000000000000000",
};
function sign(put, x, y, s, c, k = 1) { for (const ch of s) { const g = F5[ch] || F5[" "], gw = g.length / 5; for (let i = 0; i < g.length; i++) if (g[i] === "1") for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) put(x + (i % gw) * k + a, y + Math.floor(i / gw) * k + b, c); x += (gw + 1) * k; } return x; }
const signW = (s, k = 1) => [...s].reduce((w, ch) => w + ((F5[ch] || F5[" "]).length / 5 + 1) * k, -k);
const PAL = buildPal([
  ["#3a70c8", "#4a7ece", "#5a8cd4", "#7aa8e0", "#a8c8ea", 8],
  ["#c8d4e4", "#a8b8d0", 2],
  ["#d0d8e0", "#b0bccc", "#8a9ab4", "#6a7a98", 4],
  ["#e8c088", "#d0a870", "#b08a5c", "#8e6c48", "#5e4430", 6],
  ["#c8c2b8", "#a8a298", "#86827a", 3],
  ["#8a2a2a", "#5a1e22", 2],
  ["#141010", 1],
  ["#d8a030", "#fff0c8", "#fffaf0", 3],
  ["#2a6ad0", "#d8d8d0", "#c83a2a", "#2a9a4a", "#e8c030", 5],
]);

export const meta = {
  slug: "ladakh-crag-monastery", name: "Crag Monastery Flags", category: "india",
  note: "A whitewashed monastery climbs a rocky crag below snow peaks in the high desert while strings of prayer flags ripple in the wind.",
  tags: ["ladakh", "monastery", "prayer-flags", "mountains", "himalaya", "india", "halftone", "landmark"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put, add, rect } = C;
  const sky = new Uint8Array(W * H);
  // 1. deep blue high-altitude sky
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { put(x, y, ramp([[0, "#3a70c8"], [0.4, "#5a8cd4"], [0.75, "#7aa8e0"], [1, "#a8c8ea"]], y / 56)); sky[y * W + x] = 1; }
  // 2. snow peaks: ridged, lit from the left
  const peak = (x) => 52 - 26 * Math.max(0, 1 - Math.abs(x - 40) / 46) - 20 * Math.max(0, 1 - Math.abs(x - 158) / 40) - 6 * fbm(x / 9, 2, 3, 4);
  for (let x = 0; x < W; x++) for (let y = Math.floor(peak(x)); y < H; y++) {
    const slope = peak(x + 1) - peak(x - 1), snow = y < 46 + 6 * noise2(x / 5, 1, 3) - (y - peak(x)) * 0.2;
    const lit = slope > 0 ? 0.9 : 0.35;
    put(x, y, snow ? mix(hex("#6a7a98"), hex("#d0d8e0"), lit + noise2(x / 3, y / 2, 2) * 0.2) : hex("#6a7a98"));
    sky[y * W + x] = 0;
  }
  // 3. bare ochre mountains in front
  const brown = (x) => 60 + 8 * Math.sin(x / 23 + 2) - 6 * fbm(x / 14, 5, 3, 6);
  for (let x = 0; x < W; x++) for (let y = Math.floor(brown(x)); y < H; y++) {
    const slope = brown(x + 1) - brown(x - 1), n = fbm(x / 7, y / 5, 3, 8);
    put(x, y, mix(hex(slope > 0 ? "#e8c088" : "#d0a870"), hex("#b08a5c"), clamp((y - brown(x)) / 50 + (n - 0.5) * 0.6)));
    sky[y * W + x] = 0;
  }
  // 4. the crag: a steep rock pinnacle, lit on its left face
  const crag = [[44, H], [62, 82], [74, 62], [86, 44], [96, 32], [106, 34], [118, 50], [130, 66], [146, 84], [160, H]];
  for (let y = 28; y < H; y++) for (let x = 40; x < 164; x++) if (inPoly(x + 0.5, y + 0.5, crag)) {
    const n = fbm(x / 4, y / 4, 3, 11), face = x < 101 ? 0.65 : 0.25;
    put(x, y, mix(hex("#8e6c48"), hex("#e8c088"), clamp(face + (n - 0.5) * 0.9)));
    sky[y * W + x] = 0;
  }
  // 5. the monastery: whitewashed blocks stacked up the crag, maroon parapet bands, dark windows
  const B = [[88, 30, 112, 44], [76, 42, 98, 53], [102, 44, 124, 55], [66, 54, 90, 64], [94, 56, 116, 66], [118, 58, 138, 68], [58, 66, 80, 76], [84, 68, 108, 78], [112, 70, 134, 80], [136, 72, 150, 82]];
  for (const [x0, y0, x1, y1] of B) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const u = (x - x0) / (x1 - x0); put(x, y, hex(u > 0.78 ? "#86827a" : u > 0.6 ? "#a8a298" : "#c8c2b8")); }
    rect(x0, y0, x1, y0 + 2, hex("#8a2a2a")); rect(x0 - 1, y0 - 1, x1 + 1, y0, hex("#5a1e22"));
    for (let y = y0 + 4; y < y1 - 2; y += 4) for (let x = x0 + 3; x < x1 - 3; x += 6) { rect(x, y + 1, x + 2, y + 3, hex("#141010")); rect(x - 1, y, x + 3, y + 1, hex("#8a2a2a")); }
  }
  // the top shrine: a maroon prayer hall, a victory banner and a gilded finial
  rect(94, 24, 106, 31, hex("#8a2a2a")); rect(93, 23, 107, 24, hex("#d8a030")); rect(98, 26, 102, 31, hex("#141010"));
  rect(90, 26, 92, 31, hex("#5a1e22")); rect(108, 26, 110, 31, hex("#5a1e22"));
  rect(99, 19, 101, 23, hex("#d8a030")); put(100, 18, hex("#fffaf0")); put(99, 18, hex("#fff0c8")); put(100, 17, hex("#fff0c8"));
  // stairs zig-zagging up between the buildings
  for (let k = 0; k < 30; k++) put(70 + k * 0.6 + (Math.floor(k / 6) % 2 ? 6 - (k % 6) : k % 6), 88 - k * 0.9, hex("#c8c2b8"));
  // chortens at the foot: white stupas
  const chorten = (cx, by, s) => {
    rect(cx - 3 * s, by - 2 * s, cx + 3 * s + 1, by, hex("#c8c2b8"));
    for (let y = 0; y < 3 * s; y++) { const w = Math.round(Math.sqrt(Math.max(0, (3 * s) ** 2 - (y - 1.5 * s) ** 2 * 1.6)) * 0.8); rect(cx - w, by - 2 * s - y - 1, cx + w + 1, by - 2 * s - y, hex(y > s ? "#c8c2b8" : "#a8a298")); }
    rect(cx, by - 7 * s, cx + 1, by - 5 * s, hex("#d8a030"));
  };
  chorten(24, 96, 2); chorten(36, 98, 1); chorten(170, 98, 2); chorten(182, 99, 1);
  // ground in front
  for (let y = 96; y < H; y++) for (let x = 0; x < W; x++) if (!(x > 44 && x < 160 && y < 100)) put(x, y, mix(hex("#d0a870"), hex("#b08a5c"), noise2(x / 4, y / 2, 12) * 0.7));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#141010"), STR = hex("#3e2c20");
  const FLAGS = ["#2a6ad0", "#d8d8d0", "#c83a2a", "#2a9a4a", "#e8c030"].map(hex);
  const strings = [
    { x0: -2, y0: 14, x1: 86, y1: 26, sag: 10, n: 13, ph: 0 },
    { x0: 194, y0: 22, x1: 112, y1: 30, sag: 8, n: 12, ph: 1.5 },
    { x0: -2, y0: 58, x1: 52, y1: 92, sag: 6, n: 8, ph: 3 },
    { x0: 194, y0: 64, x1: 150, y1: 94, sag: 5, n: 7, ph: 4.5 },
  ];
  return (t) => {
    out.set(base);
    // clouds drifting over the peaks
    for (let y = 2; y < 40; y++) for (let x = 0; x < W; x++) { if (!sky[y * W + x]) continue; const n = fbm(x / 22 - t * 0.2, y / 6, 3, 3); if (n > 0.6) add(x, y, hex(n > 0.68 ? "#c8d4e4" : "#a8b8d0"), clamp((n - 0.6) * 4) * 0.85); }
    // a vulture circling high over the crag
    const va = t * 0.35, vx = 100 + Math.cos(va) * 40, vy = 12 + Math.sin(va) * 6, tilt = Math.cos(va);
    for (let k = -5; k <= 5; k++) put(vx + k, vy + Math.abs(k) * 0.25 * (k * tilt > 0 ? 1.4 : 0.6), INK);
    put(vx, vy + 1, INK); put(vx + 1, vy + 1, INK);
    // prayer flags: square flags hanging below each string, rippling with a wave that runs down it
    for (const s of strings) {
      const pts = 120;
      for (let i = 0; i <= pts; i++) { const u = i / pts, x = lerp(s.x0, s.x1, u), y = lerp(s.y0, s.y1, u) + Math.sin(u * Math.PI) * s.sag + Math.sin(t * 2 + u * 9 + s.ph) * 0.5; put(x, y, STR); put(x, y + 1, STR); }
      for (let k = 0; k < s.n; k++) {
        const u = (k + 0.5) / s.n, x = lerp(s.x0, s.x1, u), y = lerp(s.y0, s.y1, u) + Math.sin(u * Math.PI) * s.sag + Math.sin(t * 2 + u * 9 + s.ph) * 0.5;
        const wave = Math.sin(t * 6 - k * 0.9 + s.ph), lift = Math.sin(t * 4.3 - k * 1.3 + s.ph);
        const fw = 5 + Math.round(wave), fh = 6 - Math.round(Math.max(0, lift) * 2);
        const col = FLAGS[k % 5];
        for (let j = 0; j < fh; j++) {
          const sk = Math.round(wave * j * 0.5); // the free edge swings
          for (let i = 0; i < fw; i++) put(Math.round(x) - 1 + i + sk, Math.round(y) + 1 + j, (i + j) % 3 === 0 ? mix(col, hex("#141010"), 0.15) : col);
        }
      }
    }
    return enc(out);
  };
}
