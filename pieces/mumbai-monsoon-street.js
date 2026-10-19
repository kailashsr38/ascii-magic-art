/* mumbai-monsoon-street: a monsoon downpour on a Mumbai street, hand-built.
 * A static scene (heavy grey sky, old balconied buildings, the railway bridge, the
 * wet road and pavement) is painted once; each frame adds drifting cloud, a local
 * train crossing the bridge, black and yellow taxis, people under umbrellas, the
 * falling rain and the street lamp's reflection on the wet road. */
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
  ["#4a5664", "#5e6a78", "#727e8a", "#86909a", "#98a0a6", 8],
  ["#2a3038", "#3a424c", "#4c5560", 4],
  ["#6a6458", "#8a7c62", "#a89470", "#8a6a50", 5],
  ["#0e1216", "#181e24", "#222a32", 3],
  ["#c88a3a", "#e8a848", "#ffc868", 3],
  ["#fff0c8", "#fffaf0", 2],
  ["#c8a018", "#e8bc24", 3],
  ["#6a2228", "#963630", "#c8bca0", "#a8a088", 4],
  ["#b23a30", "#2c5a96", "#3a7a5a", 3],
  ["#a8b4c0", "#bcc6ce", 2],
  ["#3a3a48", "#504a5a", 2],
]);

export const meta = {
  slug: "mumbai-monsoon-street", name: "Mumbai Monsoon Street", category: "india",
  note: "Monsoon rain pours on a Mumbai street as black and yellow taxis splash past, people hurry under umbrellas and a local train crosses the bridge.",
  tags: ["mumbai", "monsoon", "rain", "taxi", "train", "india", "halftone", "city"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const DECK = 44, CURB = 66;
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  const sky = new Uint8Array(W * H), road = new Uint8Array(W * H);
  // 1. heavy monsoon sky
  for (let y = 0; y < CURB; y++) for (let x = 0; x < W; x++) { put(x, y, ramp([[0, "#4a5664"], [0.5, "#727e8a"], [1, "#98a0a6"]], y / 50)); sky[y * W + x] = 1; }
  // far towers in the rain haze
  const R = rng(8);
  for (let x = 40; x < 160;) { const w = 8 + Math.floor(R() * 10), top = 14 + Math.floor(R() * 16); rect(x, top, x + w, CURB, hex(R() > 0.5 ? "#86909a" : "#7e8892")); for (let y = top + 2; y < CURB - 4; y += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) put(xx, y, hex("#727e8a")); x += w + 1 + Math.floor(R() * 4); }
  for (let y = CURB - 6; y < CURB; y++) for (let x = 46; x < 146; x++) put(x, y, mix(hex("#727e8a"), hex("#5e6a78"), (y - CURB + 6) / 6));
  // 2. old balconied buildings on both sides, ochre and grey
  const LIT = [];
  const building = (x0, x1, top, col) => {
    for (let y = top; y < CURB; y++) for (let x = x0; x < x1; x++) { put(x, y, mix(hex(col), hex("#4c5560"), noise2(x / 5, y / 5, 3) * 0.35 + (y - top) / 160)); sky[y * W + x] = 0; }
    rect(x0 - 1, top - 1, x1 + 1, top + 1, hex("#3a424c"));
    for (let y = top + 4; y < CURB - 10; y += 8) {
      rect(x0, y + 4, x1, y + 5, hex("#2a3038")); // balcony slab
      for (let x = x0 + 1; x < x1 - 1; x += 2) put(x, y + 3, hex("#3a424c")); // railing
      for (let x = x0 + 2; x < x1 - 3; x += 7) { const lit = R() < 0.4; rect(x, y, x + 3, y + 3, hex(lit ? "#c88a3a" : "#222a32")); if (lit) LIT.push([x + 1, y + 1]); }
    }
  };
  building(0, 22, 6, "#a89470"); building(22, 46, 16, "#8a7c62"); building(146, 170, 12, "#8a7c62"); building(170, 192, 4, "#a89470");
  // shopfronts at street level with awnings
  for (const [x0, x1, col] of [[2, 20, "#b23a30"], [24, 44, "#2c5a96"], [148, 168, "#3a7a5a"], [172, 190, "#b23a30"]]) {
    for (let x = x0; x < x1; x++) { put(x, CURB - 11, hex(col)); put(x, CURB - 10, hex(col)); if (x % 3 === 0) put(x, CURB - 9, hex(col)); }
    rect(x0 + 1, CURB - 8, x1 - 1, CURB - 1, hex("#e8a848")); rect(x0 + 3, CURB - 6, x1 - 3, CURB - 1, hex("#c88a3a"));
  }
  // 3. the railway bridge: a deck on a truss girder, on stone piers
  for (let x = 46; x < 146; x++) {
    rect(x, DECK, x + 1, DECK + 3, hex("#222a32"));
    put(x, DECK + 8, hex("#222a32"));
    const k = (x - 46) % 12; put(x, DECK + 3 + Math.round((k < 6 ? k : 12 - k) * 5 / 6), hex("#3a424c"));
    if (k === 0) for (let y = DECK + 3; y < DECK + 9; y++) put(x, y, hex("#3a424c"));
  }
  for (const px of [46, 94, 142]) rect(px - 2, DECK + 9, px + 3, CURB, hex("#4c5560"));
  for (let x = 46; x < 146; x += 3) put(x, DECK - 1, hex("#3a424c")); // parapet posts
  // 4. pavement and wet road
  for (let y = CURB; y < H; y++) for (let x = 0; x < W; x++) {
    if (y < CURB + 4) { put(x, y, hex(y === CURB ? "#98a0a6" : "#86909a")); continue; }
    const v = (y - CURB - 4) / (H - CURB - 4);
    put(x, y, mix(mix(hex("#727e8a"), hex("#5e6a78"), v), hex("#86909a"), noise2(x / 9, y / 2, 5) * 0.4));
    road[y * W + x] = 1;
  }
  // buildings and arches reflected in the wet road, dim and streaky
  for (let x = 0; x < W; x++) for (let y = CURB + 4; y < CURB + 24; y++) { const sy = 2 * (CURB + 4) - y; const c = C.get(x, sy); if (noise2(x / 1.5, y * 0.8, 9) > 0.45) add(x, y, c, 0.25 * (1 - (y - CURB - 4) / 20)); }
  // lane markings
  for (let x = 0; x < W; x += 14) rect(x, 86, x + 7, 87, hex("#98a0a6"));
  // the street lamp
  const LX = 120, LY = 50;
  rect(LX, LY, LX + 1, CURB + 1, hex("#181e24")); for (let k = 0; k < 5; k++) put(LX - k, LY - 1, hex("#181e24"));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#0e1216"), INK2 = hex("#181e24");
  const taxi = (x, y, s, dir, t) => {
    // a small boxy taxi: black lower body, yellow cabin and roof, dark windows, headlights
    const L = Math.round(26 * s), bh = Math.round(5 * s), th = Math.round(6 * s);
    for (let i = 0; i < L; i++) {
      const u = i / L, f = dir > 0 ? u : 1 - u;
      for (let k = 0; k < bh; k++) put(x + i, y - k - 2, k === bh - 1 ? hex("#c8a018") : INK2);
      if (f > 0.16 && f < 0.74) for (let k = 0; k < th; k++) {
        const pane = Math.floor((f - 0.16) / 0.58 * 3), edge = ((f - 0.16) / 0.58 * 3) % 1;
        const win = k > 0 && k < th - 1 && edge > 0.14 && edge < 0.92;
        put(x + i, y - bh - 2 - k, win ? hex(pane === 1 ? "#3a424c" : "#2a3038") : hex("#e8bc24"));
      }
    }
    // roof sign
    rect(x + Math.round(L * 0.4), y - bh - th - 3, x + Math.round(L * 0.5), y - bh - th - 1, hex("#e8bc24"));
    for (const wf of [0.2, 0.78]) { const wx = x + Math.round(wf * L); for (let dx = -2; dx <= 2; dx++) for (let dy = 0; dy < 3; dy++) if (Math.abs(dx) + dy < 4) put(wx + dx, y - 1 + dy - 1, INK); put(wx, y - 1, hex("#727e8a")); }
    const hx = dir > 0 ? x + L : x - 1;
    put(hx, y - 4, hex("#ffc868")); put(hx, y - 3, hex("#e8a848"));
    for (let k = 1; k < 9; k++) add(hx + dir * k, y - 3, hex("#e8a848"), 0.3 * (1 - k / 9)); // headlight beam in the rain
    for (let k = 1; k < 8; k++) if (k % 2) add(hx, y + k, hex("#c88a3a"), 0.45 * (1 - k / 8)); // reflection
    for (let i = 2; i < L - 2; i += 2) add(x + i, y + 2, INK, 0.4);
    // spray from the wheels
    for (const wf of [0.2, 0.78]) for (let k = 0; k < 6; k++) { const a = (t * 7 + k * 0.37 + wf) % 1; add(x + wf * L - dir * (a * 7), y - a * 4 * (1 - a) * 3, hex("#bcc6ce"), 0.5 * (1 - a)); }
  };
  const UMB = ["#0e1216", "#b23a30", "#0e1216", "#2c5a96", "#0e1216", "#3a7a5a"].map(hex);
  const walkers = Array.from({ length: 7 }, (_, i) => ({ sp: (i % 2 ? -1 : 1) * (2 + (i % 3) * 0.6), ph: i * 37, col: UMB[i % UMB.length], y: CURB + 2 + (i % 3) }));
  const RR = rng(41);
  const drops = Array.from({ length: 520 }, () => ({ x: RR() * (W + 40), y: RR() * H, sp: 60 + RR() * 30, near: RR() }));

  return (t) => {
    out.set(base);
    // heavy cloud drifting
    for (let y = 0; y < 30; y++) for (let x = 0; x < W; x++) { if (!sky[y * W + x]) continue; const n = fbm(x / 28 - t * 0.15, y / 9, 3, 2); if (n > 0.5) add(x, y, hex("#4a5664"), (n - 0.5) * 1.6 * (1 - y / 30)); }
    // the local train crossing the bridge, maroon and cream cars with lit windows
    const trainX = ((t * 16 + 230) % 520) - 200;
    for (let c = 0; c < 5; c++) {
      const cx = trainX + c * 31;
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(cx + i); if (x < 46 || x >= 146) continue;
        for (let k = 0; k < 9; k++) {
          const y = DECK - 1 - k;
          let col = k < 3 ? "#6a2228" : k < 7 ? "#c8bca0" : "#a8a088";
          if (k >= 3 && k <= 5 && i % 5 > 0 && i % 5 < 4 && i > 1 && i < 28) col = "#e8a848";
          if ((i === 7 || i === 22) && k < 7) col = "#222a32"; // doors, open, people inside
          put(x, y, hex(col));
        }
      }
    }
    // the street lamp: the one warm light in the rain
    for (let yy = -14; yy <= 14; yy++) for (let xx = -16; xx <= 16; xx++) { const d = Math.hypot(xx, yy * 1.2); if (d < 16) add(LX - 4 + xx, LY + yy, hex("#e8a848"), (1 - d / 16) * 0.35); }
    put(LX - 4, LY, hex("#fffaf0")); put(LX - 5, LY, hex("#fff0c8")); put(LX - 3, LY, hex("#fff0c8")); put(LX - 4, LY + 1, hex("#ffc868"));
    for (let y = CURB + 5; y < H; y++) { const w = 1 + (y - CURB) / 12; if ((y + Math.floor(t * 6)) % 3 === 0) continue; for (let x = -w; x <= w; x++) add(LX - 4 + x + Math.sin(y * 0.8 + t * 3) * 1.2, y, hex("#e8a848"), 0.5 * (1 - (y - CURB) / 45) * (1 - Math.abs(x) / (w + 1))); }
    // taxis: far lane to the right, near lane to the left
    for (let k = 0; k < 2; k++) taxi(((t * 13 + k * 120) % (W + 60)) - 40, 80, 0.8, 1, t);
    for (let k = 0; k < 2; k++) taxi(W + 20 - ((t * 19 + k * 135) % (W + 80)), 100, 1.2, -1, t);
    // people under umbrellas on the pavement
    for (const w of walkers) {
      const span = W + 30, x = w.sp > 0 ? ((t * w.sp + w.ph) % span) - 15 : span - 15 - ((t * -w.sp + w.ph) % span);
      const step = Math.sin(t * 5 + w.ph), xi = Math.round(x);
      figure(put, xi, w.y, 13, INK, step);
      for (let dy = -4; dy <= 0; dy++) for (let dx = -6; dx <= 6; dx++) if (dx * dx / 36 + dy * dy / 16 <= 1) put(xi + dx, w.y - 13 + dy, dy === 0 && dx % 2 ? INK : w.col);
      for (let k = 0; k < 2; k++) put(xi, w.y - 13 + 1 + k, INK);
    }
    // the rain: slanted streaks, near ones longer and brighter, splashing on the road
    for (const d of drops) {
      const y = (d.y + t * d.sp) % (H + 8) - 4, x = (d.x - (y + 4) * 0.25) % (W + 40) - 10;
      const len = d.near > 0.7 ? 4 : 2, a = d.near > 0.7 ? 0.55 : 0.35;
      for (let k = 0; k < len; k++) add(x - k * 0.25, y - k, hex("#bcc6ce"), a);
      if (y > CURB + 6 && d.near > 0.85) { add(x - 1, y + 1, hex("#a8b4c0"), 0.4); add(x + 1, y + 1, hex("#a8b4c0"), 0.4); }
    }
    return enc(out);
  };
}
