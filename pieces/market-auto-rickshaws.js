/* market-auto-rickshaws: auto-rickshaws and motorbikes threading a busy bazaar street, hand-built.
 * A static scene (warm afternoon sky, two-storey shop row with balconies and tangled
 * wires, painted signboards, awnings and goods, the pavement and road) is painted
 * once; each frame adds auto-rickshaws and bikes in two lanes, shoppers walking,
 * a cow flicking its tail and laundry swinging on a balcony. */
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
  ["#d89a68", "#e8b070", "#f0c48a", 4],
  ["#c87a7a", "#a85e62", "#6a9ab8", "#4e7a98", "#d8b050", "#b08c3a", "#7aa878", "#5a8a5a", 8],
  ["#140e10", "#241a1a", "#3a2c28", "#54403a", 4],
  ["#c03a2a", "#e8c040", "#d8d0c0", "#2a5aa0", "#2a8a4a", 5],
  ["#1e6a38", "#3aa060", "#c8a030", 3],
  ["#8a8078", "#6a625c", "#a89888", "#bcae9c", 4],
  ["#c03a7a", "#e07a28", "#2a8a8a", 3],
  ["#ffc868", "#fff0c8", "#fffaf0", 3],
  ["#9a6a4a", "#7a5a48", 2],
]);

export const meta = {
  slug: "market-auto-rickshaws", name: "Bazaar Rickshaw Rush", category: "india",
  note: "Green and yellow auto-rickshaws and motorbikes weave along a busy bazaar street past the chai, tailor and sweet shops.",
  tags: ["auto-rickshaw", "bazaar", "market", "street", "traffic", "india", "halftone", "city"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const PAVE = 64, ROAD = 70;
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  // 1. warm afternoon sky
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) put(x, y, ramp([[0, "#e8b070"], [1, "#f0c48a"]], y / 20));
  // 2. the shop row: four buildings, upper storey with balconies and windows
  const SHOPS = [
    { x0: 0, x1: 40, top: 6, wall: "#c87a7a", wall2: "#a85e62", sign: "CHAI", bg: "#e8c040", fg: "#241a1a" },
    { x0: 40, x1: 94, top: 2, wall: "#6a9ab8", wall2: "#4e7a98", sign: "TAILOR", bg: "#d8d0c0", fg: "#2a5aa0" },
    { x0: 94, x1: 150, top: 8, wall: "#d8b050", wall2: "#b08c3a", sign: "SWEETS", bg: "#c03a2a", fg: "#e8c040" },
    { x0: 150, x1: 192, top: 4, wall: "#7aa878", wall2: "#5a8a5a", sign: "CLOTH", bg: "#2a8a4a", fg: "#d8d0c0" },
  ];
  for (const s of SHOPS) {
    for (let y = s.top; y < PAVE; y++) for (let x = s.x0; x < s.x1; x++) put(x, y, mix(hex(s.wall), hex(s.wall2), noise2(x / 4, y / 4, 2) * 0.5));
    rect(s.x0, s.top, s.x1, s.top + 1, hex(s.wall2));
    // upper windows with shutters and a balcony rail
    for (let x = s.x0 + 4; x < s.x1 - 6; x += 12) { rect(x, s.top + 4, x + 6, 20, hex("#3a2c28")); rect(x - 1, s.top + 3, x + 7, s.top + 4, hex(s.wall2)); rect(x + 2, s.top + 5, x + 4, 19, hex("#241a1a")); }
    rect(s.x0 + 2, 20, s.x1 - 2, 21, hex("#241a1a")); for (let x = s.x0 + 2; x < s.x1 - 2; x += 2) put(x, 19, hex("#241a1a"));
    // signboard
    const w = signW(s.sign, 2), sx = Math.round((s.x0 + s.x1) / 2 - w / 2);
    rect(s.x0 + 2, 22, s.x1 - 2, 35, hex(s.bg)); rect(s.x0 + 2, 34, s.x1 - 2, 35, hex("#3a2c28"));
    sign(put, sx, 24, s.sign, hex(s.fg), 2);
    // the shop opening, dark inside, striped awning above
    rect(s.x0 + 3, 40, s.x1 - 3, PAVE, hex("#241a1a"));
    for (let x = s.x0 + 1; x < s.x1 - 1; x++) for (let y = 36; y < 40; y++) put(x + (y - 36) * 0, y, hex(Math.floor((x - s.x0) / 3) % 2 ? s.bg : "#d8d0c0"));
    for (let x = s.x0 + 1; x < s.x1 - 1; x += 3) put(x, 40, hex(s.bg));
  }
  // goods: chai glasses and a kettle, tailor's cloth on hangers, sweet trays, fabric rolls
  rect(6, 52, 34, 54, hex("#9a6a4a")); for (let x = 8; x < 32; x += 3) rect(x, 49, x + 2, 52, hex("#d8d0c0"));
  rect(22, 44, 30, 49, hex("#8a8078"));
  for (let x = 48; x < 90; x += 6) { const c = ["#c03a7a", "#e07a28", "#2a8a8a", "#e8c040"][(x / 6) % 4 | 0]; rect(x, 43, x + 1, 44, hex("#8a8078")); rect(x - 2, 44, x + 3, 56, hex(c)); }
  for (const ty of [48, 54, 60]) { rect(104, ty, 144, ty + 2, hex("#bcae9c")); for (let x = 106; x < 142; x += 3) rect(x, ty - 2, x + 2, ty, hex(["#e8c040", "#e07a28", "#d8d0c0", "#c03a7a"][(x + ty) % 4])); }
  for (let k = 0; k < 6; k++) for (let y = 44 + k * 3; y < 46 + k * 3; y++) for (let x = 156; x < 186; x++) put(x, y, hex(["#c03a7a", "#2a8a8a", "#e07a28", "#e8c040", "#2a5aa0", "#c03a2a"][k]));
  // 3. pavement and road
  for (let y = PAVE; y < H; y++) for (let x = 0; x < W; x++) {
    let c;
    if (y < ROAD) c = mix(hex("#bcae9c"), hex("#a89888"), (y - PAVE) / 6);
    else c = mix(hex("#a89888"), hex("#8a8078"), (y - ROAD) / (H - ROAD));
    put(x, y, mix(c, hex("#6a625c"), noise2(x / 6, y / 3, 5) * 0.3));
  }
  rect(0, ROAD, W, ROAD + 1, hex("#6a625c"));
  for (let x = 0; x < W; x += 16) rect(x, 89, x + 8, 90, hex("#d8d0c0"));
  // 4. tangled overhead wires and a pole
  rect(150, 0, 152, PAVE, hex("#241a1a"));
  for (let k = 0; k < 6; k++) for (let x = 0; x < W; x++) { const u = x / W, y = 6 + k * 1.6 + Math.sin(u * Math.PI * (1 + k % 3)) * (3 + k) + (x > 150 ? 0 : 0); put(x, y, hex("#241a1a")); }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#140e10"), INK2 = hex("#241a1a"), HUB = hex("#8a8078");
  const wheel = (cx, cy, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = dx * dx + dy * dy; if (d <= r * r + 0.5) put(cx + dx, cy + dy, d < 1.5 ? HUB : INK); } };
  const auto = (x0, y, s, dir, t, seed) => {
    const L = Math.round(30 * s), X = (u) => (dir > 0 ? x0 + u : x0 + L - u);
    const bodyTop = y - Math.round(9 * s), roofTop = y - Math.round(22 * s), bounce = Math.round(Math.sin(t * 9 + seed) * 0.4);
    for (let u = 0; u < L; u++) {
      const f = u / L;
      // lower body, the nose sloping down to the single front wheel
      const top = f > 0.8 ? bodyTop + Math.round((f - 0.8) * 22 * s) : bodyTop;
      if (f > 0.03) for (let yy = top; yy < y - 2; yy++) put(X(u), yy + bounce, yy <= top + 1 ? hex("#3aa060") : hex("#1e6a38"));
      // canopy: a yellow roof rounded down over the back, open sides
      if (f < 0.8) {
        const rt = roofTop + (f < 0.22 ? Math.round(Math.pow((0.22 - f) / 0.22, 2) * 7 * s) : 0);
        const th = Math.round(3.5 * s);
        for (let yy = rt; yy < rt + th; yy++) put(X(u), yy + bounce, hex(yy === rt ? "#e8c040" : "#c8a030"));
        for (let yy = rt + th; yy < bodyTop; yy++) if (f < 0.12 || f > 0.72) put(X(u), yy + bounce, f < 0.12 ? hex("#c8a030") : hex("#3a2c28"));
      }
    }
    // driver and passengers
    const head = (u, h) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(X(u) + dx, bodyTop - Math.round(h * s) + dy + bounce, INK); };
    head(L * 0.64, 6); head(L * 0.3, 5.5); if (seed % 2) head(L * 0.42, 5);
    rect(Math.min(X(L * 0.64 - 1), X(L * 0.64 + 1)), bodyTop - Math.round(5 * s) + bounce, Math.max(X(L * 0.64 - 1), X(L * 0.64 + 1)) + 1, bodyTop + bounce, hex("#d8d0c0"));
    wheel(X(L * 0.22), y - 1, Math.max(2, Math.round(2.6 * s)));
    wheel(X(L * 0.9), y - 1, Math.max(2, Math.round(2.2 * s)));
    put(X(L - 1), bodyTop + Math.round(5 * s) + bounce, hex("#ffc868"));
    for (let k = 0; k < L - 4; k += 2) add(X(k + 2), y + 1, INK, 0.35);
  };
  const bike = (x, y, dir, t, col) => {
    wheel(x, y - 1, 2); wheel(x + 12 * dir, y - 1, 2);
    rect(Math.min(x, x + 12 * dir), y - 5, Math.max(x, x + 12 * dir) + 1, y - 3, INK2);
    rect(Math.min(x + 3 * dir, x + 7 * dir), y - 7, Math.max(x + 3 * dir, x + 7 * dir) + 1, y - 5, hex(col));
    const f = figure(put, x + 5 * dir, y - 4, 14, INK, 0);
    rect(x + 3 * dir, f.shoulder[1], x + 3 * dir + 4, f.hip[1], hex(col));
    for (let k = 0; k < 6; k++) put(x + 5 * dir + k * dir, f.shoulder[1] + 1 + k * 0.3, INK);
  };
  const SHIRT = ["#c03a7a", "#e07a28", "#2a8a8a", "#d8d0c0", "#2a5aa0", "#c03a2a", "#e8c040"];
  const walkers = Array.from({ length: 7 }, (_, i) => ({ sp: (i % 2 ? -1 : 1) * (2.2 + (i % 3) * 0.5), ph: i * 29, col: SHIRT[i], y: PAVE + 2 + (i % 4), h: 16 + (i % 3), sari: i % 3 === 1 }));

  return (t) => {
    out.set(base);
    // the bare bulb in the sweet shop, the one bright point
    const BX = 124, BY = 44;
    for (let yy = -10; yy <= 12; yy++) for (let xx = -14; xx <= 14; xx++) { const d = Math.hypot(xx, yy); if (d < 14) add(BX + xx, BY + yy, hex("#ffc868"), (1 - d / 14) * 0.35); }
    rect(BX, 40, BX + 1, BY - 1, INK2); put(BX, BY - 1, hex("#fff0c8")); put(BX, BY, hex("#fffaf0")); put(BX - 1, BY, hex("#fff0c8")); put(BX + 1, BY, hex("#fff0c8"));
    // laundry swinging on the blue house's balcony
    for (let k = 0; k < 4; k++) { const sw = Math.round(Math.sin(t * 1.4 + k) * 1.2); rect(50 + k * 9 + sw, 12, 55 + k * 9 + sw, 19, hex(["#c03a7a", "#e8c040", "#d8d0c0", "#e07a28"][k])); }
    // shoppers on the pavement
    for (const w of walkers) {
      const span = W + 30, x = w.sp > 0 ? ((t * w.sp + w.ph) % span) - 15 : span - 15 - ((t * -w.sp + w.ph) % span);
      const f = figure(put, Math.round(x), w.y, w.h, INK, Math.sin(t * 5 + w.ph), { skirt: w.sari });
      rect(Math.round(x) - 1, f.shoulder[1], Math.round(x) + 2, f.hip[1] + (w.sari ? 4 : 0), hex(w.col));
    }
    // a cow standing at the kerb, flicking its tail
    const CX = 34, CY = ROAD + 4;
    rect(CX, CY - 9, CX + 18, CY - 3, hex("#d8d0c0")); rect(CX + 4, CY - 8, CX + 9, CY - 5, hex("#bcae9c"));
    rect(CX + 17, CY - 11, CX + 22, CY - 6, hex("#d8d0c0")); put(CX + 17, CY - 12, hex("#3a2c28")); put(CX + 20, CY - 12, hex("#3a2c28")); put(CX + 21, CY - 7, hex("#3a2c28"));
    for (const lx of [CX + 1, CX + 4, CX + 13, CX + 16]) rect(lx, CY - 3, lx + 2, CY + 1, hex("#bcae9c"));
    const tail = Math.sin(t * 2.2) * 3; for (let k = 0; k < 6; k++) put(CX - 1 + tail * (k / 6) * 0.6, CY - 9 + k, hex("#54403a"));
    // traffic: autos and bikes going right in the far lane, left in the near lane
    auto(((t * 14) % (W + 80)) - 50, 84, 0.85, 1, t, 1);
    bike(((t * 20 + 110) % (W + 80)) - 50, 84, 1, t, "#c03a2a");
    auto(((t * 14 + 160) % (W + 80)) - 50, 84, 0.85, 1, t, 2);
    auto(W + 20 - ((t * 18 + 40) % (W + 90)), 104, 1.15, -1, t, 3);
    bike(W + 20 - ((t * 24 + 150) % (W + 90)), 104, -1, t, "#2a5aa0");
    auto(W + 20 - ((t * 18 + 140) % (W + 90)), 104, 1.15, -1, t, 5);
    return enc(out);
  };
}
