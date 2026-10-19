/* chai-stall-dawn: a roadside chai stall at dawn, the vendor pouring tea from a height, hand-built.
 * A static scene (dawn sky, hazy town and banyan tree, poles and wires, the dusty
 * road, the stall with its blue tarp, shelves and counter) is painted once; each
 * frame adds the stove flame, steam rising from the kettle, the vendor's pour,
 * customers sipping and a scooter passing on the road. */
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
  ["#6a78a8", "#8a88b0", "#b494b0", "#d8a0a0", "#ecb094", "#f4c094", 10],
  ["#5a5a80", "#6e6a8c", "#847a98", "#9a8aa0", 5],
  ["#a88874", "#c09c84", "#d4b090", 4],
  ["#2a1a14", "#5a3a24", "#8a6440", "#b08458", "#c89a68", 6],
  ["#3a6aa8", "#4a8ac4", "#6aa4d4", 3],
  ["#0e0a10", "#1a141c", "#2a222c", 3],
  ["#c8501c", "#e87a28", "#ffb04a", 3],
  ["#fff0c8", "#fffaf0", 2],
  ["#6a6a72", "#92929a", "#b8b8c0", 3],
  ["#9a5a2a", "#c08048", 2],
  ["#c8c0b8", "#a83a30", "#3a7a5a", "#d8a030", 4],
  ["#d8ccd4", 1],
]);

export const meta = {
  slug: "chai-stall-dawn", name: "Roadside Chai Dawn", category: "india",
  note: "At first light a chai vendor pours tea from a height while steam rises from the kettle, customers sip and a scooter putters past.",
  tags: ["chai", "tea", "dawn", "street", "india", "halftone", "cozy", "morning"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const GR = 72, CT = 76; // ground line, counter top
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  // 1. dawn sky with a hazy low sun
  for (let y = 0; y < GR; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#6a78a8"], [0.3, "#8a88b0"], [0.55, "#b494b0"], [0.75, "#d8a0a0"], [1, "#f4c094"]], y / 62);
    const d = Math.hypot(x - 44, (y - 50) * 1.1);
    c = mix(c, hex("#f4c094"), clamp(1 - d / 34) * 0.6);
    if (d < 7) c = mix(hex("#f4c094"), hex("#ecb094"), d / 7 * 0.4);
    put(x, y, c);
  }
  // 2. hazy town: rooftops, water tanks, a small temple, a banyan tree
  const R = rng(4);
  for (let x = 0; x < W;) {
    const w = 8 + Math.floor(R() * 12), top = 50 + Math.floor(R() * 10);
    rect(x, top, x + w, GR, hex(R() > 0.5 ? "#9a8aa0" : "#847a98"));
    if (R() > 0.6) rect(x + 2, top - 3, x + 5, top, hex("#847a98"));
    x += w;
  }
  for (let y = 36; y < 52; y++) { const w = (y - 36) * 0.45; rect(84 - w, y, 85 + w, y + 1, hex("#847a98")); } put(84, 35, hex("#847a98")); put(85, 34, hex("#c8501c"));
  for (let y = 22; y < GR; y++) for (let x = 0; x < 50; x++) {
    const d = Math.hypot((x - 18) / 1.4, y - 36), n = fbm(x / 5, y / 5, 3, 3);
    if (d < 16 + n * 6 - (y > 44 ? 40 : 0)) put(x, y, mix(hex("#5a5a80"), hex("#6e6a8c"), n));
  }
  for (let y = 40; y < GR; y++) rect(16 - (y > 64 ? 2 : 0), y, 21 + (y > 64 ? 2 : 0), y + 1, hex("#5a5a80"));
  for (const px of [62, 140]) rect(px, 18, px + 1, GR, hex("#5a5a80"));
  for (let x = 0; x < W; x++) { const sag = (u) => 4 * u * (1 - u); const u = ((x - 62) / 78 + 2) % 1; put(x, 20 + Math.round(sag(u) * 4), hex("#6e6a8c")); put(x, 23 + Math.round(sag(u) * 5), hex("#6e6a8c")); }
  // 3. the dusty road and the packed earth in front
  for (let y = GR; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - GR) / (H - GR);
    const c = y < 86 ? mix(hex("#c09c84"), hex("#a88874"), (y - GR) / 14) : mix(hex("#a88874"), hex("#8a6440"), v);
    put(x, y, mix(c, hex("#d4b090"), noise2(x / 7, y / 2, 6) * 0.3));
  }
  // 4. the stall: posts, blue tarp, back shelves, counter with a painted sign
  const tarp = [[94, 30], [192, 20], [192, 31], [98, 40]];
  for (let y = 18; y < 42; y++) for (let x = 92; x < W; x++) if (inPoly(x + 0.5, y + 0.5, tarp)) put(x, y, mix(hex("#6aa4d4"), hex("#3a6aa8"), clamp((y - 20) / 20 + noise2(x / 6, y, 2) * 0.3)));
  for (let x = 98; x < W; x += 3) put(x, Math.round(40 - (x - 98) * 0.106) + 1, hex("#3a6aa8"));
  rect(104, 32, 107, 100, hex("#5a3a24")); rect(184, 24, 187, 100, hex("#5a3a24"));
  for (let y = 38; y < CT; y++) for (let x = 107; x < 184; x++) put(x, y, mix(hex("#8a6440"), hex("#b08458"), clamp(1 - Math.hypot(x - 130, y - 70) / 50) + noise2(x / 2, y / 8, 4) * 0.2));
  for (const sy of [48, 60]) {
    rect(107, sy, 184, sy + 1, hex("#8a6440"));
    for (let x = 110; x < 182; x += 6) { const kind = Math.floor(R() * 4); const c = ["#d8a030", "#a83a30", "#3a7a5a", "#92929a"][kind]; rect(x, sy - 6, x + 4, sy, hex(c)); rect(x, sy - 7, x + 4, sy - 6, hex("#b8b8c0")); }
  }
  // biscuit packets hanging in strips from the tarp edge
  for (const hx of [112, 120, 172]) for (let k = 0; k < 4; k++) rect(hx, 40 + k * 3, hx + 3, 42 + k * 3, hex(k % 2 ? "#d8a030" : "#a83a30"));
  const VX = 150;
  // the vendor, behind the counter
  const vend = figure(put, VX, 92, 34, hex("#c8c0b8"));
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9.6) put(VX + dx, vend.head[1] + dy, hex(dy < -1 ? "#2a1a14" : "#c08048"));
  rect(VX - 3, vend.head[1] - 4, VX + 4, vend.head[1] - 2, hex("#c8501c")); // head cloth
  // counter
  rect(100, CT, 190, 101, hex("#8a6440"));
  rect(100, CT, 190, CT + 2, hex("#c89a68"));
  for (let x = 102; x < 190; x += 11) rect(x, CT + 2, x + 1, 101, hex("#5a3a24"));
  rect(112, 80, 154, 97, hex("#d8a030")); sign(put, 118, 83, "CHAI", hex("#2a1a14"), 2);
  rect(158, 80, 186, 97, hex("#3a7a5a")); sign(put, 161, 83, "TEA", hex("#d8a030"), 2);
  // stove and kettle on the counter, glasses in a tray
  rect(121, CT - 5, 135, CT, hex("#1a141c"));
  for (let y = 0; y < 8; y++) { const w = 6 - Math.abs(y - 4) * 0.5; rect(128 - w, CT - 14 + y, 128 + w, CT - 13 + y, hex(y < 2 ? "#b8b8c0" : y < 5 ? "#92929a" : "#6a6a72")); }
  for (let k = 0; k < 4; k++) put(135 + k, CT - 11 - k, hex("#92929a"));
  rect(126, CT - 16, 131, CT - 14, hex("#6a6a72"));
  for (let k = 0; k < 5; k++) { rect(164 + k * 3, CT - 4, 166 + k * 3, CT, hex("#b8b8c0")); rect(164 + k * 3, CT - 2, 166 + k * 3, CT, hex("#9a5a2a")); }
  // the bench on the left
  rect(26, 88, 60, 90, hex("#5a3a24")); rect(28, 90, 30, 98, hex("#2a1a14")); rect(56, 90, 58, 98, hex("#2a1a14"));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#1a141c"), INK2 = hex("#2a222c");
  const customers = [
    { x: 42, y: 88, h: 22, col: "#a83a30", sit: true, ph: 0.3 },
    { x: 70, y: 99, h: 32, col: "#c8c0b8", ph: 2.1 },
    { x: 86, y: 98, h: 30, col: "#3a7a5a", ph: 4.0 },
  ];
  return (t) => {
    out.set(base);
    // stove flame, the one bright point
    for (let yy = -6; yy <= 6; yy++) for (let xx = -9; xx <= 9; xx++) { const d = Math.hypot(xx, yy * 1.4); if (d < 9) add(128 + xx, CT - 5 + yy, hex("#e87a28"), (1 - d / 9) * 0.4); }
    for (let x = 123; x < 134; x++) { const h = 1 + Math.round(Math.sin(x * 1.7 + t * 9) * 0.5 + 0.5); for (let k = 0; k < h; k++) put(x, CT - 6 - k + 1, hex(k ? "#e87a28" : "#ffb04a")); }
    put(128, CT - 6, hex("#fffaf0")); put(127, CT - 6, hex("#fff0c8")); put(129, CT - 6, hex("#fff0c8"));
    // steam rising off the kettle, drifting and fading
    for (let i = 0; i < 26; i++) {
      const a = ((t * 0.45 + i / 26) % 1), y = CT - 17 - a * 30, x = 128 + Math.sin(a * 5 + t * 0.8 + i) * (1 + a * 5) + a * 6;
      const r = 1.6 + a * 3;
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = Math.hypot(xx, yy); if (d < r) add(x + xx, y + yy, hex("#d8ccd4"), Math.min(1, (1 - d / r) * 1.6 * (1 - a * 0.75))); }
    }
    // the pour: the kettle hand rises high, a long stream of tea, then lowers
    const p = (t % 3.2) / 3.2, lift = p < 0.25 ? p / 0.25 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
    const [sx, sy] = vend.shoulder, cupX = 158, cupY = CT - 6, potY = Math.round(lerp(CT - 10, CT - 34, lift)), potX = 160;
    for (let s = 0; s <= 12; s++) { put(lerp(sx + 2, potX - 2, s / 12), lerp(sy + 1, potY + 2, s / 12), hex("#2a1a14")); put(lerp(sx + 1, cupX - 1, s / 12), lerp(sy + 2, cupY + 2, s / 12), hex("#2a1a14")); }
    rect(potX - 3, potY - 1, potX + 3, potY + 4, hex("#92929a")); rect(potX - 3, potY - 1, potX + 3, potY, hex("#b8b8c0")); put(potX + 3, potY + 3, hex("#92929a"));
    rect(cupX - 1, cupY, cupX + 2, cupY + 4, hex("#b8b8c0")); rect(cupX - 1, cupY + 2, cupX + 2, cupY + 4, hex("#9a5a2a"));
    if (p > 0.22 && p < 0.74) for (let y = potY + 4; y < cupY; y++) { const u = (y - potY) / (cupY - potY); put(potX + 3 + Math.round(1 - u * 3.5), y, hex(y % 3 === Math.floor(t * 20) % 3 ? "#c08048" : "#9a5a2a")); }
    // a scooter puttering along the road with its rider
    const span = W + 70, x = ((t * 12 + 40) % span) - 35, y = 84;
    for (const wx of [x, x + 15]) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) put(wx + dx, y + dy, INK);
    rect(x + 1, y - 4, x + 16, y - 1, hex("#2a4a7a")); rect(x + 10, y - 7, x + 17, y - 3, hex("#2a4a7a")); rect(x + 15, y - 13, x + 17, y - 4, INK2); rect(x + 13, y - 14, x + 19, y - 13, INK2);
    put(x + 18, y - 10, hex("#ffb04a"));
    figure(put, x + 7, y - 4, 16, INK, 0); rect(x + 6, y - 6, x + 13, y - 4, INK); rect(x + 8, y - 13, x + 15, y - 12, INK);
    for (let k = 0; k < 6; k++) add(x - 3 - k * 1.5, y + 1 - (k % 2), hex("#d4b090"), 0.4 * (1 - k / 6));
    // customers holding glasses, now and then lifting them to drink
    for (const c of customers) {
      const col = hex(c.col);
      const f = figure(put, c.x, c.y, c.h, INK, 0);
      if (!c.sit) rect(c.x - 2, f.shoulder[1], c.x + 3, f.hip[1] + 1, col); else { rect(c.x - 2, f.shoulder[1], c.x + 3, c.y - 6, col); rect(c.x - 2, c.y - 6, c.x + 6, c.y - 4, INK); rect(c.x + 5, c.y - 4, c.x + 7, c.y + 4, INK); }
      const sip = clamp(Math.sin(t * 0.8 + c.ph) * 3 - 2, 0, 1);
      const hx = c.x + 4, hy = Math.round(lerp(f.hip[1] - 2, f.head[1] + 1, sip));
      for (let s = 0; s <= 6; s++) put(lerp(c.x + 2, hx, s / 6), lerp(f.shoulder[1] + 1, hy, s / 6), INK);
      rect(hx, hy - 2, hx + 2, hy + 1, hex("#b8b8c0")); put(hx, hy, hex("#9a5a2a")); put(hx + 1, hy, hex("#9a5a2a"));
    }
    return enc(out);
  };
}
