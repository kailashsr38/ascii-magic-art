/* golden-shrine-pool: a gilded shrine on a sacred pool at night, pilgrims crossing the causeway, hand-built.
 * A static scene (night sky, the white marble arcades and gateway round the pool,
 * the causeway with its lamps, the floodlit golden shrine and dome, the near marble
 * walkway) is painted once; each frame adds the reflection broken by moving ripple
 * lines, pilgrims walking the causeway and the walkway, and a few drifting clouds. */
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
  ["#0e1430", "#18204a", "#24305e", "#34406e", 5],
  ["#d0c8c4", "#aaa4a8", "#84808c", "#5a5868", 5],
  ["#e8a040", "#ffc860", 2],
  ["#6a4410", "#8a5a10", "#b07818", "#d8a030", "#f0c048", 6],
  ["#fff0c8", "#fffaf0", 2],
  ["#060a1a", "#0c1430", "#142048", "#1e2c5a", 4],
  ["#5a4420", "#7a5a20", "#a07828", 3],
  ["#06080e", "#10121c", 2],
  ["#e07a28", "#3a6ac8", "#c83a5a", 3],
]);

export const meta = {
  slug: "golden-shrine-pool", name: "Golden Shrine Pool", category: "india",
  note: "A floodlit golden shrine glows on its sacred pool at night as pilgrims cross the marble causeway and ripples run through its reflection.",
  tags: ["shrine", "golden", "night", "pool", "reflection", "india", "halftone", "landmark"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const WL = 70, WALK = 98;
export default function create() {
  const C = canvas(), { put, add, rect, get } = C;
  // 1. night sky, lifted near the horizon by the lights
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) put(x, y, ramp([[0, "#0e1430"], [0.6, "#18204a"], [1, "#34406e"]], y / 60));
  const SR = rng(3);
  for (let k = 0; k < 40; k++) put(SR() * W, SR() * 30, hex("#5a5868"));
  // 2. the marble arcade around the far side of the pool
  const ARC = 52;
  for (let y = ARC; y < WL; y++) for (let x = 0; x < W; x++) put(x, y, mix(hex("#aaa4a8"), hex("#84808c"), (y - ARC) / 18 + noise2(x / 4, y / 3, 2) * 0.15));
  rect(0, ARC, W, ARC + 2, hex("#d0c8c4"));
  for (let x = 3; x < W; x += 7) { rect(x, ARC + 5, x + 4, WL - 3, hex("#5a4420")); rect(x + 1, ARC + 4, x + 3, ARC + 5, hex("#5a4420")); rect(x, ARC + 9, x + 4, WL - 3, hex("#e8a040")); }
  for (let x = 2; x < W; x += 3) put(x, ARC - 1, hex("#aaa4a8"));
  for (let k = 0; k < 9; k++) { const cx = 10 + k * 22; for (let y = -3; y <= 0; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y * 1.6 < 10) put(cx + x, ARC - 2 + y, hex("#d0c8c4")); put(cx, ARC - 6, hex("#d8a030")); }
  rect(0, WL - 3, W, WL, hex("#d0c8c4"));
  // the gateway building at the start of the causeway, with its gilded dome
  for (let y = 30; y < WL; y++) for (let x = 18; x < 52; x++) put(x, y, mix(hex("#d0c8c4"), hex("#84808c"), (x - 18) / 40 + (y - 30) / 120));
  for (let r = 0; r < 3; r++) for (let x = 22; x < 50; x += 7) { rect(x, 35 + r * 10, x + 4, 41 + r * 10, hex("#5a4420")); rect(x + 1, 38 + r * 10, x + 3, 41 + r * 10, hex("#e8a040")); }
  rect(16, 29, 54, 31, hex("#d0c8c4"));
  for (let y = 0; y < 9; y++) { const w = Math.round(Math.sin(((y + 1) / 10) * Math.PI) * 8); rect(35 - w, 28 - y, 36 + w, 29 - y, hex(y > 5 ? "#d8a030" : "#b07818")); }
  rect(35, 16, 36, 20, hex("#d8a030"));
  // 3. the causeway with lamp posts
  for (let x = 52; x < 104; x++) { rect(x, WL - 2, x + 1, WL + 2, hex(x % 2 ? "#d0c8c4" : "#aaa4a8")); put(x, WL - 3, hex("#84808c")); }
  for (let x = 56; x < 104; x += 8) { rect(x, WL - 8, x + 1, WL - 2, hex("#5a4420")); put(x, WL - 9, hex("#ffc860")); }
  // 4. the shrine: gilded lower storey with arches, upper storey, dome and corner kiosks
  const GX = 128;
  rect(100, WL - 4, 157, WL + 2, hex("#d0c8c4"));
  for (let y = 46; y < WL - 4; y++) for (let x = 104; x < 153; x++) { const u = (x - 104) / 49; put(x, y, mix(hex("#f0c048"), hex("#b07818"), clamp(Math.abs(u - 0.4) * 1.4 + noise2(x / 2, y / 2, 8) * 0.25))); }
  for (let k = 0; k < 6; k++) { const ax = 107 + k * 8; rect(ax, 54, ax + 4, WL - 4, hex("#6a4410")); rect(ax + 1, 53, ax + 3, 54, hex("#6a4410")); rect(ax + 1, 58, ax + 3, WL - 4, hex("#e8a040")); }
  rect(102, 45, 155, 47, hex("#d8a030")); for (let x = 103; x < 155; x += 2) put(x, 44, hex("#b07818"));
  for (let y = 34; y < 45; y++) for (let x = 112; x < 145; x++) put(x, y, mix(hex("#d8a030"), hex("#8a5a10"), clamp(Math.abs(x - 124) / 26 + noise2(x / 2, y / 2, 4) * 0.2)));
  for (let k = 0; k < 4; k++) { const ax = 115 + k * 8; rect(ax, 37, ax + 3, 44, hex("#6a4410")); }
  rect(110, 33, 147, 35, hex("#f0c048"));
  for (let y = 0; y < 15; y++) { const v = y / 14, w = Math.round(10 * Math.sin(Math.PI * (0.15 + v * 0.75)) * (v < 0.25 ? 0.7 + v * 1.2 : 1)); for (let x = -w; x <= w; x++) put(GX + x, 33 - (14 - y) + 0, mix(hex("#f0c048"), hex("#8a5a10"), clamp((x + 4) / 16 + (x % 3 === 0 ? 0.15 : 0)))); }
  for (const [kx, ky] of [[106, 44], [150, 44], [114, 33], [142, 33]]) { for (let y = -3; y <= 0; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y * 1.4 < 7) put(kx + x, ky + y, hex(x < 1 ? "#f0c048" : "#b07818")); put(kx, ky - 4, hex("#d8a030")); }
  // floodlight wash on the shrine front
  for (let y = 20; y < WL; y++) for (let x = 96; x < 160; x++) add(x, y, hex("#ffc860"), clamp(1 - Math.hypot(x - GX, (y - 50) * 1.3) / 40) * 0.12);
  // 5. the pool: base water colour; the reflection is built per frame from the scene above
  for (let y = WL + 2; y < WALK; y++) for (let x = 0; x < W; x++) put(x, y, mix(hex("#142048"), hex("#060a1a"), (y - WL) / (WALK - WL)));
  // 6. the near marble walkway
  for (let y = WALK; y < H; y++) for (let x = 0; x < W; x++) put(x, y, y === WALK ? hex("#d0c8c4") : mix(hex("#aaa4a8"), hex("#84808c"), (y - WALK) / 10 + ((x + (y - WALK) * 3) % 16 < 1 ? 0.3 : 0)));
  for (let x = 0; x < W; x += 3) put(x, WALK - 1, hex("#84808c"));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const WATER0 = hex("#142048"), WATER1 = hex("#060a1a"), INK = hex("#06080e");
  const COLS = ["#e07a28", "#3a6ac8", "#d0c8c4", "#c83a5a", "#e07a28"].map(hex);
  const far = Array.from({ length: 6 }, (_, i) => ({ sp: (i % 2 ? -1 : 1) * (1.4 + (i % 3) * 0.3), ph: i * 9 }));
  const near = Array.from({ length: 5 }, (_, i) => ({ sp: (i % 2 ? -1 : 1) * (2.6 + (i % 3) * 0.5), ph: i * 47, col: COLS[i], h: 16 + (i % 3), skirt: i % 2 === 0 }));
  return (t) => {
    out.set(base);
    // pilgrims on the causeway, small and dark against the lit marble
    for (const f of far) {
      const u = (((t * f.sp + f.ph) % 52) + 52) % 52, x = 52 + u;
      const y = WL - 2, xi = Math.round(x), step = Math.sin(t * 4 + f.ph) > 0;
      rect(xi, y - 7, xi + 2, y - 2, hex("#d0c8c4")); put(xi, y - 8, hex("#e07a28")); put(xi + 1, y - 8, hex("#e07a28")); put(xi + (step ? 0 : 1), y - 1, INK); put(xi + (step ? 1 : 0), y - 1, INK);
    }
    // the reflection: the scene mirrored in the pool, darkened, broken by ripple lines moving toward us
    for (let y = WL + 2; y < WALK; y++) {
      const k = (y - WL) / (WALK - WL), sy = 2 * WL - y + 1;
      const ripple = Math.sin((1 / (k + 0.08)) * 9 - t * 3);
      const dx = Math.round(Math.sin(y * 1.3 - t * 2.2) * (0.5 + k * 1.5));
      const water = mix(WATER0, WATER1, k);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, si = (sy * W + clamp(x + dx, 0, W - 1)) * 3;
        const r = out[si], g = out[si + 1], b = out[si + 2];
        let a = 0.9 - k * 0.3;
        if (ripple > 0.75) a *= 0.25; // a dark ripple band
        out[i] = lerp(water[0], r * 0.9, a); out[i + 1] = lerp(water[1], g * 0.85, a); out[i + 2] = lerp(water[2], b * 0.85, a);
      }
    }
    // pilgrims walking the near walkway, with their reflections
    for (const p of near) {
      const span = W + 30, x = p.sp > 0 ? ((t * p.sp + p.ph) % span) - 15 : span - 15 - ((t * -p.sp + p.ph) % span);
      const xi = Math.round(x), f = figure(put, xi, WALK + 6, p.h, hex("#d0c8c4"), Math.sin(t * 4 + p.ph), { skirt: p.skirt });
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(xi + dx, f.head[1] + dy, hex("#7a5a20"));
      for (let dy = -2; dy <= -1; dy++) for (let dx = -2; dx <= 2; dx++) put(xi + dx, f.head[1] + dy, p.col); // turban or head scarf
      if (p.skirt) rect(xi - 2, f.shoulder[1], xi + 3, f.hip[1] + 2, p.col);
    }
    // the finial on the dome: the one bright point
    put(GX, 17, hex("#fffaf0")); put(GX, 18, hex("#fff0c8")); put(GX, 19, hex("#f0c048")); put(GX - 1, 19, hex("#d8a030")); put(GX + 1, 19, hex("#d8a030"));
    for (let yy = -6; yy <= 6; yy++) for (let xx = -8; xx <= 8; xx++) { const d = Math.hypot(xx, yy * 1.3); if (d < 8 && d > 1.5) add(GX + xx, 18 + yy, hex("#e8a040"), (1 - d / 8) * 0.25); }
    // thin clouds drifting across the top of the sky
    for (let y = 2; y < 26; y++) for (let x = 0; x < W; x++) { const n = fbm(x / 26 - t * 0.1, y / 5, 3, 6); if (n > 0.58) add(x, y, hex("#24305e"), (n - 0.58) * 2.2); }
    return enc(out);
  };
}
