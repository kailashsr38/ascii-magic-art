/* ghat-evening-aarti: priests swing brass lamps in slow arcs at the evening aarti on the river ghats, hand-built.
 * A static scene (dusk sky, temple spires and ghat houses, the stone steps, umbrellas,
 * the seated crowd, the river) is painted once; each frame adds the priests' lamps
 * circling with their smoke, the lamp reflections, drifting boats and floating diyas. */
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
  ["#1a1c48", "#2c2a5e", "#4a3470", "#7a3e6e", "#b0505e", "#d8704e", "#e89050", 10],
  ["#0c0a14", "#16121e", "#2a2034", "#3e2e48", "#5a4058", "#7a5060", 8],
  ["#4a3238", "#6a4440", "#8a5a44", "#a8704c", "#c08858", 6],
  ["#c85a1c", "#e8802a", "#f8a440", "#ffc868", 5],
  ["#fff0c8", "#fffaf0", 2],
  ["#24245a", "#363672", "#4c4a8c", "#6a5ea4", 5],
  ["#5a3040", "#904a34", "#c06a30", 3],
  ["#a8401a", "#d8601e", 2],
  ["#5a5466", "#7e7482", 2],
]);

export const meta = {
  slug: "ghat-evening-aarti", name: "Ghat Evening Aarti", category: "india",
  note: "Priests swing brass lamps in slow circles on the river steps at dusk while boats of onlookers drift and leaf lamps float downstream.",
  tags: ["varanasi", "aarti", "river", "lamps", "dusk", "india", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const WL = 76; // waterline
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  const water = new Uint8Array(W * H);
  // 1. dusk sky
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#2c2a5e"], [0.25, "#4a3470"], [0.45, "#4a3470"], [0.62, "#7a3e6e"], [0.8, "#b0505e"], [1, "#d8704e"]], y / 52);
    c = mix(c, hex("#e89050"), clamp(1 - Math.hypot(x - 120, (y - 50) * 1.8) / 60) * 0.35);
    put(x, y, c);
  }
  // 2. ghat houses and temple spires, a dark wall of silhouettes with a few lit windows
  const R = rng(5), roof = new Float32Array(W);
  for (let x = 0; x < W;) {
    const w = 10 + Math.floor(R() * 16), top = 26 + Math.floor(R() * 18);
    for (let xx = x; xx < x + w && xx < W; xx++) roof[xx] = top;
    x += w;
  }
  const spire = (cx, peak, hw, base) => { for (let y = peak; y < base; y++) { const f = (y - peak) / (base - peak), w = hw * Math.pow(f, 0.6); for (let x = Math.floor(cx - w); x <= cx + w; x++) if (x >= 0 && x < W) roof[x] = Math.min(roof[x], y); } };
  spire(40, 6, 11, 34); spire(28, 18, 6, 34); spire(54, 18, 6, 34); spire(152, 12, 9, 36); spire(166, 22, 5, 36);
  for (let x = 0; x < W; x++) {
    for (let y = Math.floor(roof[x]); y < 56; y++) {
      const n = noise2(x / 3, y / 3, 7) * 0.3, f = (y - roof[x]) / 34, warm = clamp((y - 36) / 20) * clamp(1 - Math.abs(x - 96) / 110);
      put(x, y, mix(mix(hex(y - roof[x] < 1 ? "#7a5060" : "#2a2034"), hex("#5a4058"), clamp(f * 0.8 + n)), hex("#8a5a44"), warm * 0.6));
    }
  }
  // finials, little domed pavilions on the roofs, flags
  for (const [cx, py] of [[40, 6], [152, 12]]) { put(cx, py - 1, hex("#a8704c")); put(cx, py - 2, hex("#a8704c")); for (let k = 0; k < 4; k++) put(cx + 1 + k, py - 3 + (k > 1 ? 1 : 0), hex("#d8601e")); }
  for (const cx of [78, 100, 124, 182]) { const by = roof[cx]; for (let y = 0; y < 5; y++) for (let x = -4; x <= 4; x++) if (x * x + (y - 4) * (y - 4) * 2.5 < 18) put(cx + x, by - 5 + y, hex("#16121e")); }
  // windows: arched slits, a few lit warm
  for (let x = 4; x < W - 4; x += 5) for (let y = 34; y < 52; y += 6) {
    if (y < roof[x] + 3 || R() < 0.35) continue;
    const lit = R() < 0.5;
    for (let j = 0; j < 3; j++) put(x, y + j, lit ? hex(j ? "#e8802a" : "#c85a1c") : hex("#0c0a14"));
  }
  // 3. the steps, lit warm toward the middle where the aarti is
  for (let y = 54; y < WL; y++) for (let x = 0; x < W; x++) {
    const band = (y - 54) % 3, glow = clamp(1 - Math.abs(x - 96) / 90) * 0.7;
    const base = band === 0 ? "#8a5a44" : band === 1 ? "#5a4058" : "#3e2e48";
    put(x, y, mix(mix(hex(base), hex("#c08858"), glow * (band === 0 ? 0.5 : 0.2)), hex("#2a2034"), noise2(x / 4, y, 3) * 0.3));
  }
  // bamboo umbrellas leaning over the steps
  for (const [cx, cy, r] of [[14, 52, 11], [34, 55, 9], [168, 53, 10], [186, 56, 8]]) {
    for (let y = -r; y <= 0; y++) for (let x = -r * 1.6; x <= r * 1.6; x++) if ((x / 1.6) ** 2 + y * y < r * r && y > -r * 0.55) put(cx + x, cy + y, hex(y > -2 ? "#30243a" : "#16121e"));
    for (let y = 0; y < 14; y++) put(cx, cy + y, hex("#16121e"));
  }
  // the seated crowd on the lower steps: a row of heads and shoulders
  for (let x = 2; x < W; x += 3) {
    if (Math.abs(x - 96) < 52) continue;
    const by = 70 + (x % 2), hh = 3 + (hash(x, 3) > 0.5 ? 1 : 0);
    rect(x - 1, by - hh, x + 2, by + 1, hex("#16121e"));
    put(x, by - hh - 1, hex("#16121e")); put(x + 1, by - hh - 1, hex("#16121e"));
  }
  // the five wooden platforms the priests stand on
  const PRIESTS = [60, 78, 96, 114, 132];
  for (const px of PRIESTS) { rect(px - 7, 65, px + 8, 68, hex("#30243a")); rect(px - 7, 65, px + 8, 66, hex("#8a5a44")); for (const lx of [px - 6, px + 6]) rect(lx, 68, lx + 1, 72, hex("#16121e")); }
  // priests: dark silhouettes with saffron dhotis catching the lamplight
  const sh = [];
  for (const px of PRIESTS) {
    const s = figure(put, px, 65, 19, hex("#0c0a14"));
    rect(px - 2, 57, px + 3, 65, hex("#a8401a")); rect(px - 2, 57, px + 3, 58, hex("#d8601e"));
    sh.push(s.shoulder);
  }
  // 4. the river
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - WL) / (H - WL);
    put(x, y, mix(mix(hex("#6a5ea4"), hex("#2a2a66"), Math.pow(v, 0.8)), hex("#904a34"), clamp(1 - Math.abs(x - 100) / 70) * 0.3 * (1 - v)));
    water[y * W + x] = 1;
  }
  // the steps reflected, dark and broken
  for (let y = WL; y < WL + 10; y++) for (let x = 0; x < W; x++) if (noise2(x / 6, y * 1.3, 4) > 0.45) add(x, y, hex("#2a2034"), 0.55 * (1 - (y - WL) / 10));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#0c0a14"), RIM = hex("#8a5a44");
  const LR = rng(21);
  const diyas = Array.from({ length: 14 }, () => ({ y: WL + 4 + LR() * 28, ph: LR() * 400, sp: 1.4 + LR() * 1.6 }));
  const boat = (x0, y0, len, seated, t, ph) => {
    const bob = Math.round(Math.sin(t * 0.9 + ph) * 0.6);
    const y = y0 + bob;
    for (let x = 0; x < len; x++) {
      const u = x / (len - 1), rise = Math.round(Math.pow(Math.abs(u - 0.5) * 2, 3) * 3);
      for (let k = -rise; k < 4; k++) put(x0 + x, y + k, k === -rise || k === 1 ? RIM : INK);
    }
    for (let i = 0; i < seated; i++) { const sx = x0 + 6 + i * ((len - 12) / Math.max(1, seated - 1)); rect(sx - 1, y - 4, sx + 2, y, INK); put(sx, y - 5, INK); put(sx + 1, y - 5, INK); }
    // its dark reflection
    for (let x = 2; x < len - 2; x++) for (let k = 4; k < 8; k++) if ((x + k) % 3) add(x0 + x, y + k, INK, 0.45);
  };

  return (t) => {
    out.set(base);
    // lamps: every priest swings his lamp in the same slow vertical circle
    const lamps = [];
    PRIESTS.forEach((px, i) => {
      const [sx, sy] = sh[i], a = t * 1.5;
      for (let k = 7; k >= 1; k--) { // smoke trailing the lamp's path
        const b = a - k * 0.16, lx = sx + Math.sin(b) * 6, ly = sy - 3 - Math.cos(b) * 6 - k * 0.5;
        add(lx, ly, hex("#7e7482"), 0.32 * (1 - k / 8)); add(lx + 1, ly, hex("#5a5466"), 0.25 * (1 - k / 8));
      }
      const lx = sx + Math.sin(a) * 6, ly = sy - 3 - Math.cos(a) * 6;
      lamps.push([lx, ly]);
      // arm from the shoulder to the lamp's handle
      const steps = 8; for (let s = 0; s <= steps; s++) put(lerp(sx, lx, s / steps), lerp(sy, ly + 2, s / steps), INK);
      // glow
      for (let yy = -9; yy <= 9; yy++) for (let xx = -11; xx <= 11; xx++) { const d = Math.hypot(xx, yy * 1.2); if (d < 11) add(lx + xx, ly + yy, hex("#e8802a"), (1 - d / 11) * 0.33); }
      // the tiered lamp: a cone of small flames
      for (let r = 0; r < 4; r++) for (let c = -r; c <= r; c++) put(lx + c, ly - 2 + r, hex(r === 0 ? "#ffc868" : r < 3 ? "#f8a440" : "#c85a1c"));
      if (i === 2) { put(lx, ly - 2, hex("#fffaf0")); put(lx, ly - 1, hex("#fff0c8")); put(lx - 1, ly - 1, hex("#ffc868")); put(lx + 1, ly - 1, hex("#ffc868")); }
      put(lx, ly + 2, hex("#8a5a44"));
    });
    // lamp reflections: broken streaks below each lamp, ripples drifting toward us
    for (const [lx] of lamps) for (let y = WL + 1; y < H - 4; y++) {
      const k = (y - WL) / (H - WL), wob = Math.sin(y * 0.9 - t * 2.2) * 1.2 * (0.5 + k);
      if (Math.sin(y * 1.7 - t * 3) < -0.2) continue;
      add(lx + wob, y, hex("#d8601e"), 0.65 * (1 - k)); add(lx + wob + 1, y, hex("#c06a30"), 0.4 * (1 - k));
    }
    // floating leaf diyas carried downstream
    for (const d of diyas) {
      const x = ((t * d.sp + d.ph) % (W + 20)) - 10, sc = (d.y - WL) / 32;
      put(x, d.y, hex(sc > 0.6 ? "#ffc868" : "#f8a440")); if (sc > 0.5) put(x + 1, d.y, hex("#e8802a"));
      put(x - 1, d.y + 1, hex("#30243a")); put(x, d.y + 1, hex("#30243a")); put(x + 1, d.y + 1, hex("#30243a"));
      add(x, d.y + 2, hex("#c06a30"), 0.5); add(x, d.y + 3, hex("#904a34"), 0.3);
      for (let yy = -2; yy <= 2; yy++) for (let xx = -3; xx <= 3; xx++) add(x + xx, d.y + yy, hex("#904a34"), 0.12 * (1 - Math.hypot(xx, yy) / 4));
    }
    // boats of onlookers, one rowing slowly across, two moored and bobbing
    boat(((t * 2.2 + 110) % (W + 90)) - 70, 87, 44, 5, t, 0);
    boat(4, 98, 54, 6, t, 1.7);
    boat(140, 96, 50, 5, t, 3.1);
    return enc(out);
  };
}
