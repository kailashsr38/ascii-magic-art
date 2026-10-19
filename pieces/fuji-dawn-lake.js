/* fuji-dawn-lake: a snow capped volcano at dawn over a still lake, hand-built.
 * A static scene (dawn sky, the mountain and its snow, far hills, the pine point,
 * the lake with its mirrored reflection) is painted once; each frame adds the sun,
 * drifting mist, cranes flying, a boat poling across, moving ripple lines and reeds. */
import { fbm, noise2, clamp, lerp, KEYS } from "../lib/kit.js";

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
function buildPalette(anchors) {
  const pal = [];
  for (const a of anchors) {
    const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
    for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); pal.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
  }
  return pal;
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
// The painted picture: rgb plus a layer id per cell (0 = sky, larger = nearer).
function makeCanvas() {
  const rgb = new Float32Array(W * H * 3), layer = new Uint8Array(W * H);
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  return { rgb, layer, put, blend };
}
// Per frame: a working copy, a depth-aware blend, and the conversion to text.
function makeFrame(rgb, layer, PAL) {
  const out = new Float32Array(W * H * 3), cache = new Map();
  const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = cache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    cache.set(k, best);
    return best;
  };
  // add: blend colour c by a at x,y, only where the painted layer is at or behind `upTo`
  const add = (x, y, c, a, upTo = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (layer[i] > upTo) return;
    out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
  };
  const begin = () => out.set(rgb);
  const finish = () => {
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
  return { out, add, begin, finish };
}

const ANCHORS = [
  ["#3c4a86", "#4f5a9a", "#5e5c9e", "#8a74b0", "#b884b4", "#e59bb0", "#ffbf96", "#ffdca0", 13],
  ["#fff8e0", "#ffeab0", 2],
  ["#7a6aa0", "#5c5490", "#4a4678", 4],
  ["#3e4280", "#4b4f8a", "#565a98", "#6b64a0", "#8a76ae", "#9a86b8", 7],
  ["#c7c3e6", "#e6dcf0", "#fff2ea", 4],
  ["#1f2348", "#2b2f5c", "#3c3f72", "#5a5288", "#8a6c98", "#c48aa0", "#e8a890", 10],
  ["#ffd48a", "#f0b080", 2],
  ["#110f22", "#1c1a33", "#2a2440", 3],
  ["#1e2a3a", "#2c3a48", 2],
  ["#f0c0c8", "#d8b0c8", 2],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "fuji-dawn-lake", name: "Fuji Dawn Lake", category: "landscapes",
  note: "A snow capped volcano glows pink at dawn over a mirror lake, with cranes flying past and a small boat poling across.",
  tags: ["mountain", "japan", "dawn", "lake", "reflection", "cranes", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, HILL = 1, MTN = 2, LAKE = 3, POINT = 4, FORE = 5;
const HOR = 66;

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  const SUN = [150, 50], SUNR = 7;
  const sky = (x, y) => {
    let c = ramp([[0, "#4f5a9a"], [0.3, "#6a64a6"], [0.52, "#8a74b0"], [0.68, "#b884b4"], [0.82, "#e59bb0"], [0.93, "#ffbf96"], [1, "#ffdca0"]], y / HOR);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.4);
    return mix(c, hex("#ffdca0"), clamp(1 - d / 48) * 0.6);
  };
  // 1. sky
  for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) put(x, y, sky(x, y), SKY);
  // 2. far hills either side of the mountain, hazy lavender
  const farTop = (x) => 57 + 3 * Math.sin(x / 13 + 1) + 2.5 * fbm(x / 18, 2, 3, 4);
  const nearTop = (x) => 62 + 2 * Math.sin(x / 9 + 3) + 2 * fbm(x / 10, 5, 3, 8);
  for (let x = 0; x < W; x++) {
    for (let y = Math.floor(farTop(x)); y < HOR; y++) put(x, y, mix(hex("#7a6aa0"), hex("#5c5490"), clamp((y - farTop(x)) / 8)), HILL);
  }
  // 3. the mountain: concave slopes, a notched crater rim, snow fingers
  const CX = 88, PEAK = 16;
  const top = (x) => {
    const d = Math.abs(x - CX);
    if (d < 6) return PEAK + (d < 2 ? 1 : 0);
    const s = clamp((d - 6) / 82);
    return PEAK + (HOR - PEAK) * (1 - Math.pow(1 - s, 1.75)) + (x < CX ? 0.6 : 0);
  };
  const snowLine = (x) => 31 + 6 * fbm(x / 2.2, 9, 3, 21) + 4 * Math.sin(x * 0.9) * Math.sin(x * 0.23) + Math.abs(x - CX) * 0.05;
  for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.floor(top(x))); y < HOR; y++) {
    const lit = clamp((x - CX + 8) / 50), sl = snowLine(x);
    if (y < sl) {
      const n = noise2(x / 1.5, y / 3, 5);
      const ridge = Math.sin((x - CX) * 0.55 + y * 0.05) > 0.55 && x < CX + 30 ? 0.25 : 0;
      put(x, y, mix(mix(hex("#c7c3e6"), hex("#fff2ea"), clamp(lit * 1.3 - ridge + (n - 0.5) * 0.3)), hex("#e6dcf0"), 0.15), MTN);
    } else {
      const k = clamp((y - sl) / 26), n = fbm(x / 4, y / 4, 3, 13);
      let c = mix(hex("#565a98"), hex("#8a76ae"), clamp(lit * 0.9 + (n - 0.5) * 0.4));
      c = mix(c, hex("#857ab4"), clamp(k * 0.5) * (1 - lit * 0.5)); // haze near the foot
      put(x, y, c, MTN);
    }
  }
  // nearer low hills over the mountain foot
  for (let x = 0; x < W; x++) for (let y = Math.floor(nearTop(x)); y < HOR; y++) put(x, y, mix(hex("#4a4678"), hex("#3e4280"), clamp((y - nearTop(x)) / 4)), HILL);
  // 4. lake: the scene mirrored, darker with depth, plus a broken sun path
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const sy = Math.max(0, Math.round(HOR - 1 - (y - HOR) * 1.5)), i = (sy * W + x) * 3, k = (y - HOR) / (H - HOR);
    let c = [rgb[i], rgb[i + 1], rgb[i + 2]];
    c = mix(c, hex("#2b2f5c"), 0.12 + 0.3 * k);
    const sd = Math.abs(x - SUN[0]) / (3 + k * 10), band = noise2(x / 6, y * 0.8, 3);
    if (sd < 1 && band > 0.45) c = mix(c, hex("#ffd48a"), (1 - sd) * 0.75);
    put(x, y, c, LAKE);
  }
  // 5. the pine point on the left shore
  const pointTop = (x) => 64 - 3 * clamp(1 - x / 60) + 0.5 * noise2(x / 3, 1);
  for (let x = 0; x < 62; x++) for (let y = Math.floor(pointTop(x)); y < 69 - x / 30; y++) put(x, y, hex("#1c1a33"), POINT);
  const pines = [[4, 22], [10, 26], [16, 19], [23, 24], [29, 15], [35, 18], [41, 12], [47, 9], [53, 7]];
  for (const [px, h] of pines) {
    const base = pointTop(px);
    for (let j = 0; j < h; j++) {
      const y = Math.round(base - j), w = Math.max(0, Math.round((h - j) * 0.28 + (j % 3 === 0 ? 1 : 0)));
      for (let x = px - w; x <= px + w; x++) put(x, y, (x > px + w - 1 && w > 1) ? hex("#2c3a48") : hex("#1e2a3a"), POINT);
    }
  }
  // its reflection
  for (let x = 0; x < 62; x++) for (let y = HOR; y < H; y++) {
    const sy = Math.round(HOR - 1 - (y - HOR) * 1.5) + 2;
    if (sy >= 0 && layer[sy * W + x] === POINT) { const i = (y * W + x) * 3; const c = mix([rgb[i], rgb[i + 1], rgb[i + 2]], hex("#110f22"), 0.75); put(x, y, c, LAKE); }
  }
  // 6. near shore at the bottom
  const shore = (x) => 101 + 2 * Math.sin(x / 17) + 1.5 * fbm(x / 6, 7, 3, 2) - clamp((x - 150) / 40) * 6;
  for (let x = 0; x < W; x++) for (let y = Math.floor(shore(x)); y < H; y++) put(x, y, fbm(x / 3, y / 3, 2, 31) > 0.55 ? hex("#2a2440") : hex("#110f22"), FORE);

  const F = makeFrame(rgb, layer, PAL);
  const { add } = F;
  const reeds = Array.from({ length: 20 }, (_, i) => ({ x: 150 + i * 2.1 + Math.sin(i * 7.1) * 1.5, h: 5 + ((i * 37) % 9) + clamp((i - 6) / 14) * 6, ph: i * 0.61 }));
  const ripples = Array.from({ length: 30 }, (_, i) => ({ u: ((i * 73) % 97) / 97, ph: ((i * 41) % 53) / 53 }));
  const cranes = [[0, 0], [11, 4], [21, -2]];
  const DARK = hex("#2a2440"), INK = hex("#110f22");

  return (t) => {
    F.begin();
    // sun rising behind the hills on the right
    for (let y = SUN[1] - SUNR - 1; y <= SUN[1] + SUNR; y++) for (let x = SUN[0] - SUNR - 1; x <= SUN[0] + SUNR + 1; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SUNR) add(x, y, d < SUNR - 1.5 ? hex("#fff8e0") : hex("#ffeab0"), 1, SKY);
    }
    // mist drifting along the mountain foot
    for (let y = 50; y < HOR; y++) for (let x = 0; x < W; x++) {
      const n = fbm(x / 26 - t * 0.05, y / 3.5, 3, 7);
      const a = clamp((n - 0.45) * 2.4) * 0.55 * Math.sin(((y - 50) / 16) * Math.PI);
      if (a > 0.03) add(x, y, hex("#f0c0c8"), a, MTN);
    }
    // cranes: three birds crossing left to right, long necks out, slow wingbeats
    const ct = ((t + 8) % 34) / 34, cx0 = lerp(W + 30, -30, ct), cy0 = 9 + Math.sin(ct * 5) * 2;
    cranes.forEach(([ox, oy], k) => {
      const x = Math.round(cx0 + ox), y = Math.round(cy0 + oy + Math.sin(t * 0.9 + k) * 0.8), f = Math.sin(t * 3.2 + k * 1.3);
      const WH = hex("#fff2ea");
      for (let j = -2; j <= 3; j++) add(x + j, y, WH, 1);        // body
      for (let j = 3; j <= 6; j++) add(x - j, y - (j > 5 ? 1 : 0), WH, 1); // neck and head
      add(x - 7, y - 1, hex("#ffd48a"), 1);
      add(x + 4, y + 1, DARK, 1); add(x + 5, y + 1, DARK, 0.8); // trailing legs
      const tip = Math.round(-5 * f);
      for (let j = 0; j <= 4; j++) add(x + j * 0.5, y + Math.round((tip * j) / 4), j > 2 ? DARK : WH, 1);
      add(x - 1, y + Math.round(tip / 3), WH, 1);
    });
    // ripple lines moving toward the shore, longer as they come near
    for (const r of ripples) {
      const p = (r.ph + t * 0.035) % 1, y = Math.round(HOR + 2 + (H - HOR - 6) * Math.pow(p, 1.5));
      const len = 3 + 22 * p, x0 = r.u * (W + 30) - 15 + Math.sin(t * 0.2 + r.u * 9) * 4;
      const nearSun = Math.abs(x0 - SUN[0]) < 14 + p * 10;
      const lc = nearSun ? hex("#ffd48a") : hex("#8a6c98");
      for (let x = Math.round(x0 - len / 2); x < x0 + len / 2; x++) { add(x, y, lc, 0.6, LAKE); add(x, y + 1, hex("#1f2348"), 0.45, LAKE); }
    }
    // a small boat poling across, with its reflection and wake
    const bx = Math.round(lerp(-24, W + 24, ((t + 30) % 70) / 70)), by = 86;
    for (let j = 1; j < 14; j++) { add(bx - 12 - j * 1.6, by + 1 + Math.floor(j / 3), hex("#8a6c98"), 0.7 - j * 0.04, LAKE); add(bx - 12 - j * 1.6, by - 0 - Math.floor(j / 4), hex("#8a6c98"), 0.5 - j * 0.03, LAKE); }
    for (let x = -11; x <= 11; x++) { add(bx + x, by, INK, 1); if (Math.abs(x) < 10) add(bx + x, by + 1, INK, 1); if (Math.abs(x) < 8) add(bx + x, by + 2, INK, 1); add(bx + x, by + 4, INK, 0.45, LAKE); }
    add(bx - 12, by - 1, INK, 1); add(bx + 12, by - 1, INK, 1); add(bx - 13, by - 2, INK, 1);
    for (let x = -6; x <= -1; x++) for (let y = 1; y <= 3; y++) add(bx + x, by - y, INK, 1); // cabin
    for (let j = 1; j <= 7; j++) { add(bx + 3, by - j, INK, 1); if (j < 5) add(bx + 4, by - j, INK, 1); } // boatman
    for (let x = 1; x <= 6; x++) add(bx + x, by - 8, INK, 1); add(bx + 3, by - 9, INK, 1); add(bx + 4, by - 9, INK, 1); // hat
    const lean = Math.sin(t * 0.8) * 2;
    for (let j = 0; j < 16; j++) add(bx + 5 + lean * (j / 12) - j * 0.35, by - 4 + j, INK, 0.9); // pole
    for (let j = 1; j <= 6; j++) add(bx + 2, by + 3 + j, INK, 0.35, LAKE);
    // reeds on the right shore swaying in the breeze
    for (const r of reeds) {
      const base = shore(r.x) + 1, sway = Math.sin(t * 1.1 + r.ph) * 1.6 + Math.sin(t * 0.37 + r.x * 0.1) * 1.2;
      for (let j = 0; j < r.h; j++) { const k = j / r.h; add(r.x + sway * k * k, base - j, k > 0.8 ? DARK : INK, 1); }
    }
    return F.finish();
  };
}
