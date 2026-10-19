/* goa-shack-sunset: a beach shack under coconut palms at sunset on the Goan coast, hand-built.
 * A static scene (sunset sky and sun, the sea and its reflected path, the sand, the
 * thatched shack with its lamps and sign) is painted once; each frame adds waves
 * rolling in and washing up the sand, palms swaying, a fishing boat crossing,
 * people strolling the shore and birds. */
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
  ["#3a2a5a", "#7a3a6a", "#c04a5a", "#e8704a", "#f89a48", "#fbb860", 11],
  ["#ffd480", "#fff0c8", "#fffaf0", 3],
  ["#2a2a5a", "#4a3a6a", "#7a4a6a", "#a85a5a", "#d07a5a", 6],
  ["#e8b8a0", "#d0a090", 2],
  ["#6a4252", "#8a5a5a", "#b07060", "#c88a60", "#d8a070", 5],
  ["#140c14", "#24141e", "#3a2028", 3],
  ["#5a3a2a", "#7a5030", 2],
  ["#ffb050", "#e88a30", 2],
  ["#c83a2a", "#2a8ab0", "#e8c040", 3],
]);

export const meta = {
  slug: "goa-shack-sunset", name: "Goa Shack Sunset", category: "india",
  note: "Waves roll up the sand below swaying coconut palms as the sun sets behind a fishing boat and the beach shack lights its lamps.",
  tags: ["goa", "beach", "sunset", "palms", "sea", "india", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const HZ = 54, SUN = [84, 44], SR = 8;
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  // 1. sunset sky
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#3a2a5a"], [0.3, "#7a3a6a"], [0.55, "#c04a5a"], [0.78, "#e8704a"], [1, "#f89a48"]], y / HZ);
    c = mix(c, hex("#fbb860"), Math.pow(clamp(1 - Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3) / 44), 1.5) * 0.75);
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SR) c = hex(d < SR - 1.5 ? "#fff0c8" : "#ffd480");
    put(x, y, c);
  }
  put(SUN[0], SUN[1] - 1, hex("#fffaf0")); put(SUN[0] + 1, SUN[1] - 1, hex("#fffaf0")); put(SUN[0], SUN[1], hex("#fffaf0"));
  // streaks of cloud across the sun
  for (const [cy, x0, x1] of [[38, 40, 130], [47, 60, 150], [26, 10, 90]]) for (let x = x0; x < x1; x++) { const a = Math.sin(((x - x0) / (x1 - x0)) * Math.PI); put(x, cy, mix(C.get(x, cy), hex("#7a3a6a"), a * 0.8)); if (a > 0.5) put(x, cy + 1, mix(C.get(x, cy + 1), hex("#c04a5a"), (a - 0.5))); }
  // 2. the sea, warm near the horizon, with the sun's reflected path
  for (let y = HZ; y < 82; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / 28;
    let c = mix(hex("#a85a5a"), hex("#2a2a5a"), Math.pow(v, 0.7));
    const path = Math.abs(x - SUN[0]) < 3 + v * 10 && noise2(x / 3, y * 1.4, 5) > 0.42;
    if (path) c = mix(c, hex("#fbb860"), 0.75 - v * 0.4);
    put(x, y, c);
  }
  // 3. the sand: wet and reflective near the water, dry further up
  for (let y = 78; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - 78) / 30;
    let c = mix(hex("#8a5a5a"), hex("#c88a60"), clamp(v * 1.6));
    if (y < 88 && Math.abs(x - SUN[0]) < 6 + (y - 78)) c = mix(c, hex("#e8704a"), 0.35 * (1 - (y - 78) / 10));
    put(x, y, mix(c, hex("#d8a070"), noise2(x / 5, y / 2, 4) * 0.25));
  }
  // 4. the shack on the right: thatched roof, posts, lit interior, sign, lamps
  const roof = [[124, 46], [188, 38], [196, 50], [118, 58]];
  for (let y = 36; y < 60; y++) for (let x = 118; x < W; x++) if (inPoly(x + 0.5, y + 0.5, roof)) put(x, y, mix(hex("#7a5030"), hex("#5a3a2a"), ((x + y * 2) % 4 < 2 ? 0.2 : 0.7)));
  for (let x = 118; x < W; x += 2) put(x, Math.round(58 - (x - 118) * 0.1) + 1, hex("#5a3a2a")); // frayed thatch edge
  for (let y = 56; y < 90; y++) for (let x = 128; x < W; x++) if (y > 58 - (x - 118) * 0.1) put(x, y, mix(hex("#7a5030"), hex("#ffb050"), clamp(0.75 - Math.abs(y - 74) / 30 + noise2(x / 3, y / 3, 2) * 0.2)));
  for (const px of [126, 150, 172, 190]) rect(px, 54 - Math.round((px - 126) * 0.1), px + 2, 94, hex("#24141e"));
  rect(126, 86, W, 88, hex("#3a2028")); // counter
  rect(140, 59, 176, 72, hex("#e8c040")); sign(put, 143, 61, "CAFE", hex("#c83a2a"), 2);
  for (const lx of [134, 182]) { rect(lx, 74, lx + 1, 77, hex("#24141e")); rect(lx - 1, 77, lx + 2, 80, hex("#ffb050")); }
  // tables and chairs on the sand in front of the shack
  for (const tx of [118, 140, 164]) { rect(tx, 94, tx + 9, 95, hex("#24141e")); rect(tx + 4, 95, tx + 5, 100, hex("#24141e")); for (const cx of [tx - 3, tx + 11]) { rect(cx, 96, cx + 2, 97, hex("#24141e")); rect(cx, 97, cx + 1, 100, hex("#24141e")); } }
  // diners at the tables
  for (const [dx, dy] of [[116, 96], [151, 96], [176, 96]]) figure(put, dx, dy, 11, hex("#24141e"), 0, { skirt: true });

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#140c14"), FOAM = hex("#e8b8a0"), FOAM2 = hex("#d0a090");
  const palm = (bx, by, h, lean, t, ph) => {
    // a curved trunk, then fronds that sway together in the breeze
    let x = bx, y = by;
    for (let k = 0; k < h; k++) { const f = k / h; x = bx + lean * f * f * h * 0.5; y = by - k; put(x, y, INK); put(x + 1, y, INK); if (k < h * 0.4) put(x - 1, y, INK); }
    const sway = Math.sin(t * 0.9 + ph) * 0.18 + Math.sin(t * 2.1 + ph) * 0.05;
    for (let fi = 0; fi < 9; fi++) {
      const a = -Math.PI / 2 + (fi - 4) * 0.42 + sway * (1 + Math.abs(fi - 4) * 0.2), L = 14 + (fi % 3) * 3;
      for (let r = 1; r < L; r++) {
        const droop = (r / L) ** 2 * 7;
        const fx = x + Math.cos(a) * r * 1.2, fy = y + Math.sin(a) * r * 0.7 + droop;
        put(fx, fy, INK); put(fx, fy - 1, INK); if (r > 2 && r < L - 1) { put(fx, fy + 1, INK); put(fx + 1, fy + 2, INK); put(fx - 1, fy + 2, INK); }
      }
    }
    for (const [cx, cy] of [[-1, 2], [1, 2], [0, 3]]) put(x + cx, y + cy, hex("#3a2028")); // coconuts
  };
  const walkers = [{ sp: 2.4, ph: 70, h: 15 }, { sp: 2.2, ph: 80, h: 14 }, { sp: -1.8, ph: 120, h: 16 }];
  return (t) => {
    out.set(base);
    // waves: crest lines rolling in toward the shore, spacing growing as they near
    const shore = 81 + 2.5 * Math.sin(t * 0.7) + 1;
    for (let k = 0; k < 7; k++) {
      const u = ((t * 0.07 + k / 7) % 1), y = HZ + 2 + u * u * (shore - HZ - 2);
      for (let x = 0; x < W; x++) {
        if (noise2(x / (4 + u * 10), k * 7.3 + Math.floor(t * 0.07 + k / 7) * 3, 6) < 0.4 - u * 0.3) continue;
        add(x, y, FOAM, 0.35 + u * 0.5);
        if (u > 0.6) add(x, y + 1, FOAM2, (u - 0.6) * 1.2);
      }
    }
    // the wash: foam edge climbing and sliding back on the sand, with a wet sheen behind it
    for (let x = 0; x < W; x++) {
      const e = shore + Math.sin(x / 11 + t * 0.7) * 1.2 + noise2(x / 6, t * 0.3, 2) * 1.5;
      for (let y = Math.floor(e) - 2; y <= e; y++) add(x, y, FOAM, y === Math.floor(e) ? 0.85 : 0.45);
      for (let y = Math.floor(e) - 6; y < e - 2; y++) add(x, y, hex("#7a4a6a"), 0.3);
    }
    // the fishing boat crossing slowly with its outrigger, a fisherman standing
    const bx = ((t * 3 + 120) % (W + 60)) - 30, by = 62;
    for (let i = 0; i < 20; i++) { const u = i / 19, rise = Math.round(Math.pow(Math.abs(u - 0.5) * 2, 3) * 2); for (let k = -rise; k < 3; k++) put(bx + i, by + k, k === 1 ? hex("#c83a2a") : k === 0 || k === -rise ? hex("#2a8ab0") : INK); }
    for (let i = 2; i < 18; i++) put(bx + i, by + 5, INK); put(bx + 4, by + 4, INK); put(bx + 15, by + 4, INK);
    figure(put, Math.round(bx + 12), by - 1, 9, INK, 0); rect(Math.round(bx + 5), by - 4, Math.round(bx + 9), by, hex("#3a2028"));
    for (let k = 0; k < 14; k++) add(bx + 3 + k, by + 3, hex("#7a4a6a"), 0.4);
    // birds
    for (let i = 0; i < 4; i++) { const x = ((t * 5 + i * 9) % (W + 30)) - 15, y = 18 + i * 3 + Math.sin(t + i) * 2, up = Math.sin(t * 8 + i * 1.3) > 0; put(x, y, INK); put(x - 1, y - (up ? 1 : 0), INK); put(x + 1, y - (up ? 1 : 0), INK); }
    // people strolling along the wet sand
    for (const w of walkers) {
      const span = W + 30, x = w.sp > 0 ? ((t * w.sp + w.ph) % span) - 15 : span - 15 - ((t * -w.sp + w.ph) % span);
      const y = 92;
      figure(put, Math.round(x), y, w.h, INK, Math.sin(t * 4.5 + w.ph));
      for (let k = 1; k < 5; k++) add(Math.round(x), y + k, hex("#6a4252"), 0.5 * (1 - k / 5)); // reflection on wet sand
    }
    // palms framing the left side and over the shack, swaying
    palm(12, H, 62, 1.2, t, 0);
    palm(36, H, 46, -0.6, t, 1.1);
    palm(186, 96, 54, -1.1, t, 2.3);
    return enc(out);
  };
}
