/* desert-fort-camels: a camel train passing below a sandstone hill fort in the desert at sunset, hand-built.
 * A static scene (sunset sky, the low sun, the rocky hill, the fort's curtain walls,
 * round bastions, palace and domed pavilions, the town at its foot and the dunes) is
 * painted once; each frame adds drifting haze, birds, the camel train walking the
 * dune with its riders and long shadows, and blowing sand. */
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
  ["#4a3a6a", "#8a4a6a", "#d0644a", "#f08a40", "#f8b060", 10],
  ["#ffd080", "#fff0c8", "#fffaf0", 3],
  ["#f0b468", "#e8a860", "#d08a48", "#b07038", 4],
  ["#8a5040", "#6a3a38", "#4e2c34", 3],
  ["#7a4a3a", "#5a3632", "#3e2630", 3],
  ["#e8a060", "#d08850", "#b06a40", "#8a5038", 4],
  ["#1a1018", "#2a1a20", 2],
  ["#c83a2a", "#e0c8a8", 2],
  ["#6a7aa8", "#8a8ab0", 2],
]);

export const meta = {
  slug: "desert-fort-camels", name: "Thar Fort Caravan", category: "india",
  note: "A camel train plods across the dunes below a golden sandstone hill fort with round bastions and domed pavilions as the desert sun sets.",
  tags: ["rajasthan", "fort", "camels", "desert", "sunset", "india", "halftone", "landmark"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SUN = [34, 58], SR = 7;
const crest = (x) => 91 + 2.5 * Math.sin(x / 26) + 1.2 * Math.sin(x / 9 + 1);
export default function create() {
  const C = canvas(), { put, add, rect } = C;
  const sky = new Uint8Array(W * H);
  // 1. sunset sky and the low sun
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#4a3a6a"], [0.3, "#8a4a6a"], [0.6, "#d0644a"], [0.82, "#f08a40"], [1, "#f8b060"]], y / 72);
    c = mix(c, hex("#f8b060"), clamp(1 - Math.hypot(x - SUN[0], (y - SUN[1]) * 1.4) / 40) * 0.55);
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SR) c = hex(d < SR - 1.5 ? "#fff0c8" : "#ffd080");
    put(x, y, c); sky[y * W + x] = 1;
  }
  put(SUN[0], SUN[1] - 1, hex("#fffaf0")); put(SUN[0] + 1, SUN[1] - 1, hex("#fffaf0"));
  // far flat ridge on the horizon
  for (let x = 0; x < W; x++) for (let y = Math.floor(78 + 2 * fbm(x / 20, 1, 3, 2)); y < H; y++) { put(x, y, mix(hex("#d0644a"), hex("#b07038"), (y - 78) / 10)); sky[y * W + x] = 0; }
  // 2. the rocky hill the fort stands on, lit from the left
  const hillTop = (x) => x < 64 ? 99 : x < 98 ? lerp(84, 58, (x - 64) / 34) + 2 * Math.sin(x / 3) * 0.5 : 58 + 1.5 * Math.sin(x / 7);
  for (let x = 60; x < W; x++) for (let y = Math.floor(hillTop(x)); y < H; y++) {
    const n = fbm(x / 6, y / 4, 3, 7), strata = Math.sin(y * 0.9 + n * 4) > 0.6;
    const lit = clamp(1 - (y - hillTop(x)) / 30) * (x < 100 ? 1 : 0.75) + 0.15;
    put(x, y, mix(hex(strata ? "#3e2630" : "#5a3632"), hex("#b07038"), lit * 0.65 * (0.6 + n * 0.6)));
    sky[y * W + x] = 0;
  }
  // 3. the curtain wall with crenellations and round bastions
  const WT = 46;
  for (let x = 96; x < W; x++) {
    const top = WT + Math.round(Math.sin(x / 13) * 1.2);
    for (let y = top; y < hillTop(x) + 1; y++) put(x, y, mix(hex("#f0b468"), hex("#d08a48"), (y - top) / 14 + noise2(x / 2, y / 2, 3) * 0.2));
    if (x % 4 < 2) put(x, top - 1, hex("#d08a48"));
  }
  // the zig-zag outer wall climbing up to the gate
  for (let x = 66; x < 98; x++) { const y0 = Math.round(hillTop(x)) - 6; for (let y = y0; y < y0 + 6; y++) put(x, y, mix(hex("#e8a860"), hex("#b07038"), (y - y0) / 6)); if (x % 4 < 2) put(x, y0 - 1, hex("#e8a860")); }
  const bastion = (cx, top, r, h) => {
    for (let y = top; y < top + h; y++) for (let x = cx - r; x <= cx + r; x++) {
      const u = (x - cx) / r, light = clamp(0.85 - u * 0.7 - (y - top) / (h * 2.2));
      put(x, y, light > 0.6 ? hex("#f0b468") : mix(hex("#6a3a38"), hex("#e8a860"), light));
    }
    for (let x = cx - r; x <= cx + r; x += 2) put(x, top - 1, hex("#e8a860"));
    put(cx - 2, top + 3, hex("#2a1a20")); put(cx + 1, top + 3, hex("#2a1a20"));
  };
  for (const [cx, r] of [[100, 5], [124, 6], [150, 6], [176, 5]]) bastion(cx, WT - 3, r, Math.round(hillTop(cx) - WT + 5));
  bastion(80, 70, 4, 10);
  // 4. the palace inside: stepped blocks, rows of windows, domed pavilions
  const blocks = [[108, 132, 32], [128, 160, 24], [156, 178, 34], [168, 192, 38]];
  for (const [x0, x1, top] of blocks) {
    for (let y = top; y < WT; y++) for (let x = x0; x < x1; x++) { const u = (x - x0) / (x1 - x0); put(x, y, mix(hex("#f0b468"), hex("#b07038"), clamp(u * 0.7 + noise2(x / 3, y / 3, 5) * 0.2))); sky[y * W + x] = 0; }
    rect(x0 - 1, top, x1 + 1, top + 1, hex("#8a5040"));
    for (let y = top + 3; y < WT - 2; y += 5) for (let x = x0 + 2; x < x1 - 2; x += 4) { rect(x, y, x + 2, y + 3, hex("#4e2c34")); put(x, y, hex("#6a3a38")); }
    rect(x0, top + 9, x1, top + 10, hex("#d08a48")); // balcony line
  }
  const dome = (cx, by, r) => {
    for (let y = -r; y <= 0; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.5) put(cx + x, by + y, x < 0 ? hex("#f0b468") : hex("#b07038"));
    put(cx, by - r - 1, hex("#d08a48")); put(cx, by - r - 2, hex("#d08a48"));
    for (const px of [cx - r, cx + r]) rect(px, by, px + 1, by + 4, hex("#8a5040"));
    rect(cx - r - 1, by, cx + r + 2, by + 1, hex("#d08a48"));
  };
  dome(120, 29, 4); dome(144, 21, 5); dome(166, 31, 3); dome(182, 35, 4); dome(112, 29, 2);
  // 5. the blue-and-sand town at the foot of the hill
  const R = rng(12);
  for (let x = 92; x < W;) { const w = 4 + Math.floor(R() * 6), h = 4 + Math.floor(R() * 5), b = 82; const c = R() < 0.4 ? "#6a7aa8" : R() < 0.5 ? "#8a8ab0" : "#d08a48"; rect(x, b - h, x + w, b + 2, hex(c)); if (R() < 0.6) put(x + 1, b - h + 2, hex("#2a1a20")); x += w + (R() < 0.3 ? 1 : 0); }
  // 6. the dunes in front, rippled, the crest catching the light
  for (let x = 0; x < W; x++) for (let y = Math.floor(crest(x)); y < H; y++) {
    const d = y - crest(x), rip = Math.sin(x * 0.5 + y * 1.6 + noise2(x / 9, y / 5, 4) * 4) > 0.55;
    const lit = 0.45 + clamp(1 - d / 16) * 0.45;
    put(x, y, mix(hex(rip ? "#b06a40" : "#d08850"), hex("#e8a060"), lit));
    sky[y * W + x] = 0;
  }
  for (let x = 0; x < W; x++) for (let y = 98; y < H; y++) if (y > 98 + 4 * Math.sin(x / 30 + 2)) put(x, y, mix(hex("#d08850"), hex("#8a5038"), noise2(x / 5, y / 2, 9) * 0.6));
  // scrub bushes
  for (const [bx, by] of [[14, 102], [70, 100], [182, 104]]) for (let k = 0; k < 9; k++) put(bx + Math.round(Math.cos(k) * (k % 4)), by - (k % 3), hex("#3e2630"));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#1a1018"), SH = hex("#8a5038");
  const camel = (x, y, t, ph, rider) => {
    const step = t * 4 + ph, P = (dx, dy, c = INK) => put(x + dx, y + dy, c);
    // legs: four long legs swinging in pairs
    for (const [lx, o] of [[-6, 0], [-4, Math.PI], [5, Math.PI], [7, 0]]) {
      const sw = Math.sin(step + o) * 2;
      for (let k = 0; k < 9; k++) P(Math.round(lx + sw * (k / 9) * (k > 4 ? 1 : 0.4)), -k);
    }
    // body and hump
    for (let dx = -8; dx <= 8; dx++) { const hump = Math.max(0, 4 - Math.abs(dx + 1) * 0.6); for (let dy = 0; dy < 5 + hump; dy++) P(dx, -9 - dy); }
    // neck curving forward and up to the head, bobbing as it walks
    const bob = Math.round(Math.sin(step * 2) * 0.6);
    for (let k = 0; k < 7; k++) { P(9 + Math.round(k * 0.8), -11 - Math.round(k * 0.9) + bob); P(9 + Math.round(k * 0.8), -12 - Math.round(k * 0.9) + bob); }
    for (let dx = 0; dx < 5; dx++) { P(14 + dx, -18 + bob); P(14 + dx, -19 + bob); }
    P(-9, -12); P(-10, -11); P(-10, -10); // tail
    if (rider) { // rider on the hump, red or white turban
      for (let dy = 0; dy < 6; dy++) { P(-1, -18 - dy); P(0, -18 - dy); }
      P(1, -20); P(2, -19); P(-2, -15); P(-2, -14);
      for (let dx = -1; dx <= 1; dx++) P(dx, -24, hex(rider)); P(0, -25, hex(rider));
    }
    // long shadow thrown to the right across the sand
    for (let k = 0; k < 26; k++) for (let w = -2; w <= 2; w++) add(x + k + 2, y + 1 + Math.round(k * 0.12) + (w > 0 ? 1 : 0), SH, 0.35 * (1 - k / 26));
  };
  return (t) => {
    out.set(base);
    // thin haze bands drifting across the low sky
    for (let y = 48; y < 70; y++) for (let x = 0; x < W; x++) { if (!sky[y * W + x]) continue; const n = fbm(x / 30 - t * 0.08, y / 2.5, 3, 4); if (n > 0.55) add(x, y, hex("#d0644a"), (n - 0.55) * 1.6); }
    // birds flying home past the fort
    for (let i = 0; i < 5; i++) {
      const bx = ((t * 6 + i * 7) % (W + 40)) - 20, by = 18 + i * 2 + Math.sin(t * 0.7 + i) * 2, up = Math.sin(t * 9 + i * 1.7) > 0;
      put(bx, by, INK); put(bx - 1, by - (up ? 1 : 0), INK); put(bx + 1, by - (up ? 1 : 0), INK);
    }
    // the caravan walking along the dune crest
    const span = W + 130;
    for (let i = 0; i < 5; i++) {
      const x = ((t * 4 + i * 26) % span) - 60, y = Math.round(crest(x)) + 1;
      camel(Math.round(x), y, t, i * 1.3, i === 4 ? null : i % 2 ? "#e0c8a8" : "#c83a2a");
      if (i > 0) { const px = Math.round(x + 18), py = Math.round(crest(x + 18)) - 18; for (let k = 0; k < 8; k++) put(px + k, py + Math.round(Math.sin(k / 7 * Math.PI) * 2), INK); } // lead rope
    }
    // sand blowing off the crest
    for (let i = 0; i < 40; i++) { const a = ((t * 0.6 + i / 40) % 1), x = ((i * 47) % W) + a * 30, y = crest(x) - 1 - a * 3; add(x, y, hex("#e8a060"), 0.5 * (1 - a)); }
    return enc(out);
  };
}
