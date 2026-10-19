/* river-bridge-taxis: yellow taxis crossing a giant steel cantilever bridge over a wide river at dusk, hand-built.
 * A static scene (dusk sky and low sun, the far bank, the bridge's towers, chords,
 * lattice and deck lamps, the river) is painted once; each frame adds the yellow
 * taxis and buses crossing behind the lattice, walkers on the footway, the bridge's
 * reflection broken by moving ripple lines, and country boats drifting below. */
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
  ["#3e2c5c", "#6a3a6a", "#a84e66", "#e0704e", "#f0a050", "#f8c070", 11],
  ["#ffd890", "#fff0c8", "#fffaf0", 3],
  ["#141220", "#24203a", "#3a3050", 3],
  ["#4a3050", "#6a3a58", 2],
  ["#3a2a4a", "#6a3a5a", "#a0505a", "#d07058", 5],
  ["#e8c020", "#b89018", 2],
  ["#ffb050", "#e09060", 2],
  ["#2a1a20", "#5a3a2a", 2],
  ["#c83a2a", "#d8ccb0", 2],
]);

export const meta = {
  slug: "river-bridge-taxis", name: "River Bridge Taxis", category: "india",
  note: "Yellow taxis stream across a giant steel cantilever bridge as the sun sets over the wide river and country boats drift below.",
  tags: ["kolkata", "bridge", "taxi", "river", "dusk", "india", "halftone", "city"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const WL = 74, DECK = 66, SUN = [96, 30], SR = 6;
const LT = 40, RT = 152;
const topChord = (x) => {
  if (x < LT) return 14 + ((LT - x) / LT) * 44;
  if (x > RT) return 14 + ((x - RT) / (W - RT)) * 44;
  return 44 - 30 * Math.pow(Math.abs(x - 96) / 56, 1.4);
};
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  const steel = new Uint8Array(W * H);
  // 1. dusk sky with the low sun
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#3e2c5c"], [0.25, "#6a3a6a"], [0.5, "#a84e66"], [0.75, "#e0704e"], [1, "#f0a050"]], y / WL);
    c = mix(c, hex("#f8c070"), Math.pow(clamp(1 - Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3) / 44), 1.6) * 0.8);
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SR) c = hex(d < SR - 1.5 ? "#fff0c8" : "#ffd890");
    put(x, y, c);
  }
  put(SUN[0], SUN[1] - 1, hex("#fffaf0")); put(SUN[0] - 1, SUN[1] - 1, hex("#fffaf0"));
  // 2. the far bank: low city, a domed building, chimneys
  const R = rng(5);
  for (let x = 0; x < W;) { const w = 4 + Math.floor(R() * 9), h = 2 + Math.floor(R() * 5); rect(x, WL - h, x + w, WL, hex(R() < 0.5 ? "#6a3a58" : "#4a3050")); x += w; }
  for (let y = -5; y <= 0; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y * 2.2 < 36) put(70 + x, WL - 6 + y, hex("#4a3050"));
  rect(126, WL - 12, 128, WL, hex("#4a3050")); rect(176, WL - 10, 178, WL, hex("#4a3050"));
  // 3. the river
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - WL) / (H - WL);
    put(x, y, mix(ramp([[0, "#e0704e"], [0.35, "#d07058"], [0.7, "#a0505a"], [1, "#6a3a5a"]], v), hex("#f0a050"), clamp(1 - Math.abs(x - SUN[0]) / (8 + v * 20)) * 0.45 * (1 - v)));
  }
  // 4. the bridge: towers, top chord, deck, lattice
  const S = (x, y, c = "#141220") => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; put(x, y, hex(c)); steel[y * W + x] = 1; };
  const line = (x0, y0, x1, y1, c) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) S(lerp(x0, x1, i / n), lerp(y0, y1, i / n), c); };
  for (const tx of [LT, RT]) {
    for (let y = 8; y < WL + 4; y++) { const w = 3 + (y - 8) * 0.05; for (let x = Math.floor(tx - w); x <= tx + w; x++) if (Math.abs(x - tx) > w - 1.2 || y % 8 < 1) S(x, y); }
    for (let y = 10; y < DECK; y += 8) line(tx - 3, y, tx + 3, y + 8);
    rect(tx - 6, WL - 1, tx + 7, WL + 5, hex("#24203a")); // pier
  }
  for (let x = 0; x < W; x++) { S(x, topChord(x)); S(x, topChord(x) + 1); S(x, DECK); S(x, DECK + 1); S(x, DECK + 3); }
  for (let x = 4; x <= W; x += 14) {
    const t0 = topChord(x), t1 = topChord(x + 14);
    line(x, t0, x, DECK);
    if (Math.floor(x / 14) % 2) line(x, t0, x + 14, DECK); else line(x + 14, t1, x, DECK);
    const mid = (t0 + DECK) / 2; line(x, mid, x + 14, (t1 + DECK) / 2);
  }
  // deck lamps
  const LAMPS = []; for (let x = 4; x < W; x += 16) LAMPS.push(x);
  for (const x of LAMPS) { put(x, DECK - 5, hex("#ffb050")); }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#141220"), YEL = hex("#e8c020"), YEL2 = hex("#b89018");
  const taxi = (x, y, dir) => {
    // the rounded old-style taxi: bulbous roof, long bonnet, yellow all over
    const L = 14, X = (u) => Math.round(dir > 0 ? x + u : x + L - u);
    for (let u = 0; u < L; u++) {
      const f = u / L, roof = f > 0.25 && f < 0.7 ? 4 + (f > 0.32 && f < 0.62 ? 1 : 0) : f > 0.05 && f < 0.95 ? 2 : 1;
      for (let k = 0; k < roof + 1; k++) put(X(u), y - 1 - k, k === 0 ? YEL2 : (k >= 3 && f > 0.3 && f < 0.66 && (u % 4 !== 0)) ? INK : YEL);
    }
    put(X(2), y, INK); put(X(3), y, INK); put(X(10), y, INK); put(X(11), y, INK);
    put(X(L - 1), y - 2, hex("#fff0c8"));
  };
  const bus = (x, y, dir) => {
    for (let u = 0; u < 22; u++) for (let k = 0; k < 7; k++) put(x + u, y - 1 - k, k > 2 && k < 6 && u % 3 && u > 1 && u < 21 ? hex("#ffb050") : hex(k < 2 ? "#d8ccb0" : "#c83a2a"));
    for (const u of [4, 17]) { put(x + u, y, INK); put(x + u + 1, y, INK); }
  };
  const BOATS = [{ y: 86, sp: 1.6, ph: 30 }, { y: 98, sp: -1.1, ph: 140 }];
  return (t) => {
    out.set(base);
    // traffic on the deck: taxis both ways, a bus now and then
    const span = W + 40;
    for (let k = 0; k < 5; k++) taxi(((t * 10 + k * 46) % span) - 20, DECK - 1, 1);
    for (let k = 0; k < 4; k++) taxi(span - 20 - ((t * 8 + k * 57 + 20) % span), DECK - 1, -1);
    bus(((t * 7 + 120) % (W + 60)) - 40, DECK - 1, 1);
    // walkers on the footway along the lower edge
    for (let k = 0; k < 6; k++) { const dir = k % 2 ? -1 : 1, x = dir > 0 ? ((t * 2 + k * 37) % span) - 20 : span - 20 - ((t * 1.7 + k * 37) % span); const xi = Math.round(x), st = Math.sin(t * 5 + k) > 0; rect(xi, DECK - 5, xi + 1, DECK - 1, INK); put(xi, DECK - 6, INK); put(xi + (st ? -1 : 1), DECK - 1, INK); }
    // the near lattice stays in front of the traffic
    for (let y = 8; y <= DECK + 3; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (steel[i]) { const j = i * 3; out[j] = base[j]; out[j + 1] = base[j + 1]; out[j + 2] = base[j + 2]; } }
    // lamp glow
    for (const x of LAMPS) for (let yy = -4; yy <= 4; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.hypot(xx, yy); if (d < 5) add(x + xx, DECK - 5 + yy, hex("#ffb050"), (1 - d / 5) * 0.35); }
    // the reflection: the bridge and sky mirrored, broken by ripple lines drifting toward us
    for (let y = WL + 4; y < H; y++) {
      const k = (y - WL) / (H - WL), sy = 2 * WL - y + 4;
      if (sy < 0) break;
      const ripple = Math.sin((1 / (k + 0.06)) * 8 - t * 2.6), dx = Math.round(Math.sin(y * 1.1 - t * 2) * (0.5 + k * 2));
      if (ripple > 0.7) continue;
      for (let x = 0; x < W; x++) { const xs = clamp(x + dx, 0, W - 1); if (!steel[sy * W + xs]) continue; add(x, y, INK, 0.55 * (1 - k)); }
    }
    // country boats drifting, a boatman poling
    for (const b of BOATS) {
      const x = b.sp > 0 ? ((t * b.sp + b.ph) % (W + 40)) - 20 : W + 20 - ((t * -b.sp + b.ph) % (W + 40));
      const L = 22, y = b.y;
      for (let u = 0; u < L; u++) { const f = u / (L - 1), rise = Math.round(Math.pow(Math.abs(f - 0.5) * 2, 2.5) * 3); for (let k = -rise; k < 2; k++) put(x + u, y + k, k === -rise ? hex("#5a3a2a") : hex("#2a1a20")); }
      for (let u = 6; u < 15; u++) for (let k = 0; k < 3; k++) if (Math.hypot(u - 10.5, k * 1.6) < 5) put(x + u, y - 3 + k, hex("#2a1a20")); // the hood
      const px = Math.round(x + 18); figure(put, px, y - 1, 10, hex("#2a1a20"), 0);
      const pole = Math.sin(t * 1.2 + b.ph) * 2; for (let k = 0; k < 14; k++) put(px + 1 + Math.round(pole * (k / 14)) + Math.round(k * 0.3), y - 9 + k, hex("#2a1a20"));
      for (let u = 2; u < L - 2; u++) add(x + u, y + 2, hex("#3a2a4a"), 0.5);
    }
    return enc(out);
  };
}
