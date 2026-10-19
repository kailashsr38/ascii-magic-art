/* rooftop-kite-sunset: the winter kite festival over a dense city of flat rooftops at sunset, hand-built.
 * A static scene (sunset sky and sun, three bands of rooftops with water tanks,
 * stairwells and parapets, the near terraces) is painted once; each frame adds kites
 * swooping on their strings, the people on the roofs tugging them, and pigeons. */
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
  ["#3a2a5a", "#6a3a6e", "#a84a6a", "#d8604a", "#f08a3a", "#f8b050", 11],
  ["#d88a7a", "#b86a6e", "#9a5a6a", "#7a4a62", 5],
  ["#3e2a40", "#2e2034", 3],
  ["#1a1220", "#120c16", 2],
  ["#c86a4a", "#e08a50", 2],
  ["#ff4a3a", "#f0c020", "#ff4aa8", "#3ac060", "#4a9aff", "#f07a1a", "#b06aff", 7],
  ["#f0d0b0", 1],
  ["#ffc868", "#fff0c8", "#fffaf0", 3],
]);

export const meta = {
  slug: "rooftop-kite-sunset", name: "Rooftop Kite Sunset", category: "india",
  note: "On the winter kite festival, people on crowded city rooftops tug their strings as bright paper kites swoop across the sunset.",
  tags: ["kites", "uttarayan", "rooftops", "sunset", "festival", "india", "halftone", "celebration"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SUN = [140, 50], SR = 8;
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  // 1. sunset sky
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#3a2a5a"], [0.22, "#6a3a6e"], [0.45, "#a84a6a"], [0.65, "#d8604a"], [0.85, "#f08a3a"], [1, "#f8b050"]], y / 66);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.2);
    c = mix(c, hex("#f8b050"), clamp(1 - d / 46) * 0.5);
    put(x, y, c);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - SUN[0], y - SUN[1]); if (d < SR) put(x, y, hex(d < SR - 1.5 ? "#fff0c8" : "#ffc868")); }
  put(SUN[0], SUN[1] - 2, hex("#fffaf0")); put(SUN[0] - 1, SUN[1] - 2, hex("#fffaf0"));
  // 2. three bands of flat rooftops, far to near
  const R = rng(17);
  const band = (y0, y1, hmin, hmax, wmin, wmax, col, rim, tanks) => {
    for (let x = -4; x < W;) {
      const w = wmin + Math.floor(R() * (wmax - wmin)), top = y0 + Math.floor(R() * (y1 - y0)) - Math.floor(R() * (hmax - hmin));
      for (let y = top; y < H; y++) for (let xx = x; xx < x + w; xx++) put(xx, y, hex(y === top && rim ? rim : col));
      if (tanks && R() < 0.45) { const tx = x + 1 + Math.floor(R() * Math.max(1, w - 5)); rect(tx, top - 4, tx + 4, top, hex(col)); rect(tx, top - 4, tx + 4, top - 3, hex(rim || col)); }
      if (tanks && R() < 0.3) { const sx = x + w - 6; rect(sx, top - 5, sx + 5, top, hex(col)); }
      if (R() < 0.3) for (let k = 0; k < 2; k++) put(x + 2 + k * 3, top - 1, hex(col)); // parapet posts
      x += w;
    }
  };
  band(60, 66, 0, 4, 6, 12, "#d88a7a", "#f08a3a", true);
  band(68, 74, 0, 6, 8, 16, "#b86a6e", "#e08a50", true);
  band(76, 82, 0, 6, 10, 20, "#9a5a6a", "#e08a50", true);
  // windows in the mid band, a few lit
  for (let k = 0; k < 40; k++) { const x = Math.floor(R() * W), y = 80 + Math.floor(R() * 20); put(x, y, hex(R() < 0.4 ? "#e08a50" : "#3e2a40")); put(x + 1, y, hex("#3e2a40")); }
  // 3. the near terraces: left and right, with parapets, a stairwell and a water tank
  const NL = 86, NR = 90;
  for (let y = NL; y < H; y++) for (let x = 0; x < 84; x++) put(x, y, y === NL ? hex("#e08a50") : y < NL + 3 ? hex("#3e2a40") : mix(hex("#2e2034"), hex("#1a1220"), (y - NL) / 22));
  for (let y = NR; y < H; y++) for (let x = 118; x < W; x++) put(x, y, y === NR ? hex("#e08a50") : y < NR + 3 ? hex("#3e2a40") : mix(hex("#2e2034"), hex("#1a1220"), (y - NR) / 18));
  rect(150, NR - 12, 168, NR, hex("#2e2034")); rect(150, NR - 12, 168, NR - 11, hex("#c86a4a")); rect(153, NR - 9, 158, NR, hex("#120c16")); // stairwell with door
  rect(176, NR - 9, 186, NR - 2, hex("#1a1220")); rect(176, NR - 9, 186, NR - 8, hex("#c86a4a")); for (const lx of [177, 184]) rect(lx, NR - 2, lx + 1, NR, hex("#1a1220"));
  for (let x = 0; x < 84; x += 6) rect(x, NL - 2, x + 1, NL, hex("#2e2034")); rect(0, NL - 2, 84, NL - 1, hex("#2e2034"));
  // drying line on the left terrace
  for (let x = 6; x < 40; x++) put(x, NL - 11 + Math.round(Math.sin((x - 6) / 34 * Math.PI) * 2), hex("#2e2034"));
  rect(5, NL - 12, 6, NL, hex("#1a1220")); rect(40, NL - 12, 41, NL, hex("#1a1220"));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#120c16"), STR = hex("#f0d0b0");
  const KC = ["#ff4a3a", "#f0c020", "#ff4aa8", "#3ac060", "#4a9aff", "#f07a1a", "#b06aff"].map(hex);
  // fliers: hand anchor; their kites fly on figure-of-eight paths
  const FL = [
    { x: 22, y: NL, h: 18, kx: 66, ky: 16, ax: 14, ay: 5, w: 0.5, ph: 0, c: 0, s: 1.7 },
    { x: 58, y: NL, h: 17, kx: 104, ky: 30, ax: 10, ay: 4, w: 0.65, ph: 2, c: 1, s: 1.4 },
    { x: 140, y: NR, h: 18, kx: 86, ky: 22, ax: 12, ay: 6, w: 0.45, ph: 4, c: 2, s: 1.8 },
    { x: 172, y: NR - 9, h: 15, kx: 150, ky: 12, ax: 9, ay: 4, w: 0.7, ph: 1, c: 3, s: 1.3 },
  ];
  // far kites: tied to the distant roofs
  const FAR = Array.from({ length: 7 }, (_, i) => ({ x: 14 + i * 28 + (i % 2 ? 30 : -24), y: 62 + (i % 3) * 3, kx: 14 + i * 28, ky: 8 + ((i * 11) % 30), ax: 4 + (i % 3) * 2, ay: 2 + (i % 2), w: 0.4 + (i % 4) * 0.12, ph: i * 1.3, c: (i + 4) % 7, s: 0.8 + (i % 3) * 0.2 }));
  const kite = (kx, ky, s, tilt, col) => {
    const a = 5 * s, b = 6 * s, ca = Math.cos(tilt), sa = Math.sin(tilt);
    const P = [[0, -b], [a, -b * 0.15], [0, b], [-a, -b * 0.15]].map(([u, v]) => [kx + u * ca - v * sa, ky + u * sa + v * ca]);
    for (let y = Math.floor(ky - b - 1); y <= ky + b + 1; y++) for (let x = Math.floor(kx - b - 1); x <= kx + b + 1; x++) if (inPoly(x + 0.5, y + 0.5, P)) put(x, y, col);
    // spars
    for (let k = -b; k <= b; k += 0.5) put(kx - k * sa, ky + k * ca, mix(col, hex("#f0d0b0"), 0.5));
    // tail ribbon
    for (let k = 1; k < 5 * s + 2; k++) put(P[2][0] + Math.sin(k * 0.9 + tilt * 6) * 0.8 - sa * k, P[2][1] + k * ca * 0.8, col);
    return P[2];
  };
  const string = (x0, y0, x1, y1, sag, a) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.1);
    for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag; add(x, y, STR, a); }
  };
  return (t) => {
    out.set(base);
    for (const k of FAR) {
      const p = t * k.w + k.ph, kx = k.kx + Math.sin(p) * k.ax, ky = k.ky + Math.sin(2 * p) * k.ay;
      const tail = kite(kx, ky, k.s, Math.sin(p) * 0.4, KC[k.c]);
      string(tail[0], tail[1], k.x, k.y, 4, 0.3);
    }
    // pigeons wheeling over the roofs
    for (let i = 0; i < 6; i++) {
      const a = t * 0.5 + i * 0.35, x = 96 + Math.cos(a) * 38, y = 44 + Math.sin(a) * 8 + (i % 2) * 2, up = Math.sin(t * 10 + i) > 0;
      put(x, y, INK); put(x - 1, y - (up ? 1 : 0), INK); put(x + 1, y - (up ? 1 : 0), INK);
    }
    for (const f of FL) {
      const p = t * f.w + f.ph, kx = f.kx + Math.sin(p) * f.ax, ky = f.ky + Math.sin(2 * p) * f.ay;
      const tug = Math.max(0, Math.sin(t * 2.4 + f.ph * 3)) ;
      const fig = figure(put, f.x, f.y, f.h, INK, 0);
      const hx = f.x + (kx > f.x ? 3 : -3), hy = fig.head[1] - 2 - Math.round(tug * 3);
      for (let s = 0; s <= 6; s++) { put(lerp(fig.shoulder[0], hx, s / 6), lerp(fig.shoulder[1], hy, s / 6), INK); put(lerp(fig.shoulder[0], f.x - (hx - f.x) * 0.3, s / 6), lerp(fig.shoulder[1], fig.hip[1] - 1, s / 6), INK); }
      const tail = kite(kx, ky + tug * 1.5, f.s, Math.sin(p) * 0.5, KC[f.c]);
      string(tail[0], tail[1], hx, hy, 6 - tug * 3, 0.55);
    }
    return enc(out);
  };
}
