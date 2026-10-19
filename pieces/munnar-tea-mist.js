/* munnar-tea-mist: tea estate hills in drifting morning mist with pickers working the rows, hand-built.
 * A static scene (pale morning sky and sun, misty far ranges, the mid hill with its
 * estate bungalow and shade trees, the near hill clipped into rows of tea bushes) is
 * painted once; each frame adds mist drifting through the valleys and the pickers
 * moving along the rows with baskets on their backs, plucking leaves. */
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
  ["#8aa4b8", "#9cb2c0", "#b0c0c4", "#c4c8bc", "#d8cca8", "#e4d0a0", 9],
  ["#fff4d8", "#fffaf0", 2],
  ["#7a94a0", "#6e8894", "#627c88", "#5a7078", 4],
  ["#4a7a44", "#5e9050", "#74a45a", 3],
  ["#1e3a1e", "#2e5a2a", "#4a8a34", "#6aa840", "#8ac050", 6],
  ["#14281a", "#2a4a2a", 2],
  ["#d0d8d8", "#b8c4c8", 2],
  ["#d0302a", "#e8a020", "#c02a8a", "#2a6ac0", 4],
  ["#8a6a40", "#a88050", 2],
  ["#3a2a20", "#1a1410", 2],
  ["#b8402a", "#d0c8b8", 2],
]);

export const meta = {
  slug: "munnar-tea-mist", name: "Tea Hills Mist", category: "india",
  note: "Morning mist drifts over hills clipped into rows of tea as pickers in bright saris work along the bushes with baskets on their backs.",
  tags: ["tea", "plantation", "hills", "mist", "morning", "india", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SUN = [152, 20], SR = 5;
const farTop = (x) => 30 + 10 * fbm(x / 34, 2, 3, 3) - 9 * Math.max(0, 1 - Math.abs(x - 52) / 40);
const midTop = (x) => 46 + 8 * Math.sin(x / 38 + 1) + 3 * fbm(x / 16, 4, 3, 5);
const nearTop = (x) => 66 + 9 * Math.sin(x / 46 - 0.6) + 2 * fbm(x / 12, 6, 2, 9);
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  const layer = new Uint8Array(W * H); // 0 sky, 1 far, 2 mid, 3 near
  // 1. pale morning sky, warm round the sun
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#8aa4b8"], [0.5, "#9cb2c0"], [1, "#b0c0c4"]], y / 50);
    c = mix(c, hex("#e4d0a0"), Math.pow(clamp(1 - Math.hypot(x - SUN[0], y - SUN[1]) / 34), 1.6) * 0.8);
    if (Math.hypot(x - SUN[0], y - SUN[1]) < SR) c = hex("#fff4d8");
    put(x, y, c);
  }
  put(SUN[0], SUN[1], hex("#fffaf0")); put(SUN[0] - 1, SUN[1], hex("#fffaf0"));
  // 2. far ranges, blue in the haze
  for (let x = 0; x < W; x++) for (let y = Math.floor(farTop(x)); y < H; y++) { put(x, y, mix(hex("#7a94a0"), hex("#627c88"), clamp((y - farTop(x)) / 16))); layer[y * W + x] = 1; }
  // 3. the mid hill: tea rows, shade trees and the estate bungalow
  const rows = (x, y, top, k, c0, c1, c2) => {
    const d = y - top, u = d / (k + d * 0.05), f = u - Math.floor(u);
    const tuft = noise2(x / 1.6, y * 0.9, 3);
    if (f < 0.22) return hex(c0);
    return mix(hex(c1), hex(c2), clamp(Math.sin(f * Math.PI) * 0.8 + tuft * 0.4 - 0.2));
  };
  for (let x = 0; x < W; x++) for (let y = Math.floor(midTop(x)); y < H; y++) { put(x, y, rows(x, y, midTop(x), 1.6, "#4a7a44", "#5e9050", "#74a45a")); layer[y * W + x] = 2; }
  const R = rng(6);
  const oak = (bx, by, h, dark) => {
    for (let k = 0; k < h; k++) put(bx + Math.round(Math.sin(k * 0.3) * 0.5), by - k, hex(dark));
    for (let k = 0; k < 4; k++) { const cy = by - h + k * 3, w = 2 + (k % 2); for (let x = -w; x <= w; x++) if (R() > 0.2) put(bx + x, cy, hex(dark)); for (let x = -w + 1; x < w; x++) put(bx + x, cy + 1, hex(dark)); }
  };
  for (let x = 6; x < W; x += 9 + Math.floor(R() * 8)) oak(x, Math.round(midTop(x)) + 4 + Math.floor(R() * 6), 9 + Math.floor(R() * 5), "#2a4a2a");
  // the bungalow on the mid hill
  const BX = 64, BY = Math.round(midTop(64)) + 4;
  rect(BX, BY - 5, BX + 14, BY, hex("#d0c8b8")); for (let k = 0; k < 4; k++) rect(BX - 1 + k, BY - 6 - k, BX + 15 - k, BY - 5 - k, hex("#b8402a"));
  rect(BX + 3, BY - 3, BX + 5, BY, hex("#3a2a20")); rect(BX + 9, BY - 4, BX + 11, BY - 2, hex("#3a2a20"));
  // 4. the near hill: big rows of clipped tea and a footpath down through them
  for (let x = 0; x < W; x++) for (let y = Math.floor(nearTop(x)); y < H; y++) { put(x, y, rows(x, y, nearTop(x), 2.4, "#1e3a1e", "#4a8a34", "#8ac050")); layer[y * W + x] = 3; }
  oak(28, Math.round(nearTop(28)) + 10, 30, "#14281a"); oak(176, Math.round(nearTop(176)) + 8, 26, "#14281a");

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#1a1410"), SKIN = hex("#3a2a20");
  const SARI = ["#d0302a", "#e8a020", "#c02a8a", "#2a6ac0", "#e8a020"].map(hex);
  const pickers = [
    { x0: 40, d: 10, h: 17, sp: 0.9, ph: 0 },
    { x0: 92, d: 18, h: 22, sp: -0.7, ph: 1.6 },
    { x0: 150, d: 8, h: 15, sp: 0.6, ph: 3.1 },
    { x0: 70, d: 30, h: 28, sp: 0.5, ph: 4.4 },
    { x0: 58, d: 2, h: 9, sp: -0.5, ph: 2.2 },
  ];
  return (t) => {
    out.set(base);
    // mist drifting through the valleys, thickest low in each band
    for (let y = 26; y < 92; y++) {
      for (let x = 0; x < W; x++) {
        const L = (y * W + x), lay = L >= 0 ? (y > nearTop(x) ? 3 : y > midTop(x) ? 2 : y > farTop(x) ? 1 : 0) : 0;
        let a = 0;
        if (lay === 1 || (lay === 2 && y < midTop(x) + 8)) { const n = fbm(x / 30 - t * 0.12, y / 6, 3, 2); a = clamp((n - 0.42) * 2.4) * clamp(1 - Math.abs(y - midTop(x) + 2) / 14); }
        if ((lay === 2 && y > nearTop(x) - 10) || (lay === 3 && y < nearTop(x) + 6)) { const n = fbm(x / 26 + t * 0.09, y / 5 + 9, 3, 7); a = Math.max(a, clamp((n - 0.45) * 2.2) * clamp(1 - Math.abs(y - nearTop(x)) / 12)); }
        if (a > 0.02) add(x, y, hex("#d0d8d8"), a * 0.85);
      }
    }
    // pickers moving slowly along their rows, waist deep in the tea
    for (let i = 0; i < pickers.length; i++) {
      const p = pickers[i], span = 60, x = Math.round(p.x0 + (((t * p.sp + p.ph * 7) % span + span) % span) - span / 2);
      const y = Math.round(nearTop(x) + p.d), dir = p.sp > 0 ? 1 : -1, col = SARI[i];
      const f = figure(put, x, y, p.h, col, 0, { skirt: true });
      rect(x - 1, f.shoulder[1], x + 2, f.shoulder[1] + Math.max(2, Math.round(p.h * 0.12)), hex(i % 2 ? "#d0c8b8" : "#2a6ac0"));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) < 2 || p.h > 20) put(x + dx, f.head[1] + dy, dy < 0 ? INK : SKIN);
      // the basket hanging on the back from a head strap
      const bw = Math.max(2, Math.round(p.h * 0.18)), bh = Math.max(3, Math.round(p.h * 0.32)), bx = x - dir * (bw + 1);
      rect(Math.min(bx, bx - dir * bw), f.shoulder[1], Math.max(bx, bx - dir * bw) + 1, f.shoulder[1] + bh, hex("#a88050"));
      for (let k = 0; k < bh; k += 2) put(bx - dir * Math.floor(bw / 2), f.shoulder[1] + k, hex("#8a6a40"));
      put(x - dir, f.head[1] - 1, hex("#8a6a40"));
      // plucking arm reaching down into the bushes and back
      const reach = (Math.sin(t * 2.6 + p.ph) + 1) / 2, ax = x + dir * Math.round(2 + reach * p.h * 0.15), ay = Math.round(f.hip[1] + reach * p.h * 0.1);
      const n = 6; for (let k = 0; k <= n; k++) put(lerp(f.shoulder[0] + dir, ax, k / n), lerp(f.shoulder[1] + 1, ay, k / n), SKIN);
      // bushes in front cover the legs
      const cut = f.hip[1] + 1;
      for (let yy = cut; yy <= y; yy++) for (let xx = x - bw - 4; xx <= x + bw + 4; xx++) { if (xx < 0 || xx >= W) continue; const i3 = (yy * W + xx) * 3; out[i3] = base[i3]; out[i3 + 1] = base[i3 + 1]; out[i3 + 2] = base[i3 + 2]; }
    }
    return enc(out);
  };
}
