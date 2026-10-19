/* balloon-valley-sunrise: hot air balloons over layered valleys at sunrise, hand-built.
 * A static scene (sunrise sky, four hill ranges from hazy far to dark near, tree
 * texture) is painted once; each frame adds the sun, mist drifting in the valleys and
 * balloons drifting and bobbing at different depths, one rising from behind a hill. */
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
  ["#5a80b8", "#7896c4", "#98a8cc", "#b8b2c8", "#d8b4b0", "#eebaa0", "#f6c896", 12],
  ["#fffaea", "#fff0c0", "#ffe090", 3],
  ["#b0b4d0", "#9ca4c4", "#8a94b8", 3],
  ["#98a4c0", "#8492b2", "#6e7ea0", "#5a6c8e", 4],
  ["#7a9a90", "#64847c", "#4e6e68", "#3a5854", "#2a4642", 5],
  ["#3e5a50", "#22342e", "#4e6c5c", "#5e7c66", 4],
  ["#f6e6e0", "#e8dce4", 2],
  ["#ff8a70", "#e0503c", "#a83030", 3],
  ["#ffe080", "#f0b830", "#b88020", 3],
  ["#70d0c8", "#30a0a0", "#1e6a70", 3],
  ["#fff6e8", "#d8ccc0", 2],
  ["#c890e0", "#8a58b0", "#5a3a80", 3],
  ["#3a2418", 1],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "balloon-valley-sunrise", name: "Balloon Valley Sunrise", category: "landscapes",
  note: "Hot air balloons drift and rise over layered valleys at sunrise while mist rolls through the low ground.",
  tags: ["balloons", "sunrise", "valley", "mist", "hills", "travel", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, FAR = 1, MID = 2, NEAR = 3, FORE = 4;
const COLS = {
  red: ["#ff8a70", "#e0503c", "#a83030"], yel: ["#ffe080", "#f0b830", "#b88020"], teal: ["#70d0c8", "#30a0a0", "#1e6a70"],
  white: ["#fff6e8", "#d8ccc0", "#a89c98"], purp: ["#c890e0", "#8a58b0", "#5a3a80"],
};

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  const SUN = [44, 38], SUNR = 8;
  // 1. sky: soft blue overhead to warm gold at the horizon, glow on the sun side
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#5a80b8"], [0.22, "#7896c4"], [0.42, "#98a8cc"], [0.6, "#b8b2c8"], [0.76, "#d8b4b0"], [0.9, "#eebaa0"], [1, "#f6c896"]], y / 54);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    c = mix(c, hex("#ffd890"), clamp(1 - d / 44) * 0.3);
    put(x, y, c, SKY);
  }
  // 2. ranges far to near, each darker and less hazy, lit from the left
  const ranges = [
    { L: FAR, base: 50, amp: 6, f: 26, s: 3, cols: ["#b0b4d0", "#9ca4c4", "#8a94b8"] },
    { L: MID, base: 60, amp: 6, f: 20, s: 7, cols: ["#98a4c0", "#8492b2", "#6e7ea0"] },
    { L: NEAR, base: 72, amp: 7, f: 16, s: 11, cols: ["#7a9a90", "#64847c", "#4e6e68"] },
  ];
  const crests = ranges.map((r) => Float32Array.from({ length: W }, (_, x) => r.base - r.amp * (fbm(x / r.f, r.s, 4, r.s) * 1.8 - 0.4) - 2 * Math.sin(x / (r.f * 1.7) + r.s)));
  ranges.forEach((r, k) => {
    for (let x = 0; x < W; x++) {
      const slope = crests[k][Math.min(W - 1, x + 1)] - crests[k][Math.max(0, x - 1)]; // >0: faces the sun on the left
      for (let y = Math.max(0, Math.floor(crests[k][x])); y < H; y++) {
        const d = (y - crests[k][x]) / 14, lit = clamp(0.5 + slope * 0.5);
        let c = mix(hex(r.cols[1]), hex(r.cols[0]), lit * (1 - clamp(d)));
        c = mix(c, hex(r.cols[2]), clamp(d) * 0.7);
        if (k === 2 && fbm(x / 2.5, y / 2.5, 2, 5) > 0.62) c = mix(c, hex("#2a4642"), 0.7); // tree texture
        put(x, y, c, r.L);
      }
    }
  });
  // 3. the dark foreground ridge with rounded trees
  const fore = (x) => 98 - 10 * clamp(1 - x / 60) + 4 * Math.sin(x / 21 + 1) + 2 * fbm(x / 7, 3, 3, 17) - clamp((x - 150) / 42) * 12;
  for (let x = 0; x < W; x++) for (let y = Math.floor(fore(x)); y < H; y++) put(x, y, fbm(x / 3, y / 3, 3, 29) > 0.55 ? hex("#4e6c5c") : hex("#3e5a50"), FORE);
  const trees = [[6, 6], [14, 8], [24, 5], [33, 7], [160, 6], [170, 9], [181, 7], [189, 6], [118, 4], [126, 5]];
  for (const [tx, r] of trees) {
    const by = fore(tx);
    for (let y = Math.floor(by - r * 2.2); y < by + 2; y++) for (let x = tx - r; x <= tx + r; x++) {
      const d = Math.hypot((x - tx) / r, (y - (by - r * 1.2)) / (r * 1.1));
      if (d < 1 + (noise2(x / 1.5, y / 1.5, 3) - 0.5) * 0.4) put(x, y, x < tx - r * 0.3 && y < by - r * 1.4 ? hex("#5e7c66") : hex("#22342e"), FORE);
    }
  }

  const F = makeFrame(rgb, layer, PAL);
  const { add } = F;
  // balloons: x, y, radius, depth (layer it floats in front of), colours, drift speed
  const balloons = [
    { x: 178, y: 20, r: 2.6, d: 1, c: ["teal", "white"], v: 0.35 },
    { x: 22, y: 34, r: 3.2, d: 1, c: ["purp", "yel"], v: 0.3 },
    { x: 96, y: 44, r: 4, d: 1, c: ["red", "white"], v: 0.4 },
    { x: 150, y: 50, r: 5, d: 2, c: ["yel", "red"], v: 0.5 },
    { x: 66, y: 28, r: 7, d: 2, c: ["teal", "white"], v: 0.55 },
    { x: 132, y: 30, r: 11, d: 3, c: ["red", "yel"], v: 0.7 },
    { rise: true, x: 104, r: 6, d: 2, c: ["purp", "white"], v: 0.2 },
  ];
  const sky = (x, y) => { const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  const drawBalloon = (cx, cy, r, b) => {
    const haze = (3 - b.d) * 0.16, up = b.d, rr = r * 1.35;
    for (let y = Math.floor(cy - r - 1); y <= cy + rr + 1; y++) {
      const dy = y - cy;
      const hw = dy <= 0 ? Math.sqrt(Math.max(0, r * r - dy * dy)) : r * (1 - Math.pow(dy / rr, 1.6) * 0.72);
      if (dy > rr || hw <= 0) continue;
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const u = clamp((x - cx) / (hw + 0.5), -1, 1);
        const cov = clamp(hw + 0.5 - Math.abs(x - cx));
        if (cov <= 0) continue;
        const gore = Math.floor((Math.asin(u) / Math.PI + 0.5) * 6);
        const set = COLS[b.c[gore % 2]];
        const light = clamp(0.62 - u * 0.5 - (dy / r) * 0.25);
        let col = light > 0.55 ? mix(hex(set[1]), hex(set[0]), (light - 0.55) / 0.45) : mix(hex(set[2]), hex(set[1]), light / 0.55);
        if (x >= 0 && x < W && y >= 0 && y < H) col = mix(col, sky(x, y), haze);
        add(x, y, col, cov, up);
      }
    }
    // ropes and basket
    const by = cy + rr + Math.max(1, r * 0.35), bw = Math.max(1, r * 0.22);
    if (r > 3) for (let k = 0; k <= 1; k += 0.25) { add(lerp(cx - 0.28 * r, cx - bw, k), lerp(cy + rr, by, k), hex("#3a2418"), 0.8, up); add(lerp(cx + 0.28 * r, cx + bw, k), lerp(cy + rr, by, k), hex("#3a2418"), 0.8, up); }
    for (let y = Math.round(by); y <= by + Math.max(1, r * 0.25); y++) for (let x = Math.round(cx - bw); x <= Math.round(cx + bw); x++) add(x, y, hex("#3a2418"), 1, up);
  };

  return (t) => {
    F.begin();
    // the sun clearing the far range
    for (let y = SUN[1] - SUNR; y <= SUN[1] + SUNR; y++) for (let x = SUN[0] - SUNR; x <= SUN[0] + SUNR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SUNR) add(x, y, d < SUNR - 1.5 ? hex("#fffaea") : hex("#fff0c0"), 1, SKY);
    }
    // mist pooled in each valley, drifting slowly
    for (let k = 0; k < 3; k++) {
      const top = [48, 58, 70][k], bot = [60, 72, 90][k];
      for (let y = top; y < bot; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (layer[i] !== k + 1) continue;
        const depthIn = y - crests[k][x];
        if (depthIn < 2) continue;
        const n = fbm(x / 24 + t * (0.03 + k * 0.012), y / 4 + k * 5, 3, k * 7);
        const a = clamp((n - 0.32) * 2.4) * clamp(depthIn / 8) * (0.7 + k * 0.08);
        if (a > 0.03) add(x, y, k === 0 ? hex("#f6e6e0") : hex("#e8dce4"), a);
      }
    }
    // balloons: slow drift to the right, gentle bob, one rising out of the valley
    for (const b of balloons) {
      let cx, cy;
      if (b.rise) { const p = (t * 0.022 + 0.35) % 1; cx = b.x + p * 30; cy = lerp(92, -14, p); }
      else { cx = ((b.x + t * b.v + 20) % (W + 40)) - 20; cy = b.y + Math.sin(t * 0.35 + b.x) * 1.6; }
      drawBalloon(cx, cy, b.r, b);
    }
    return F.finish();
  };
}
