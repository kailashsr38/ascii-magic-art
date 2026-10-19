/* giza-pyramids-sunset: the three pyramids of Giza at sunset with a camel caravan, hand-built.
 * A static scene (sunset sky, the desert floor, three pyramids with a sunlit and a shaded face,
 * stone courses and the capped middle pyramid, foreground dunes) is painted once; each frame adds
 * the sun, drifting cloud, a camel caravan with riders walking the dune crest, and birds. */
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
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };
const LEVELS = "▁▂▃▄▅▆▇█";
// The painted picture: rgb plus a layer id per cell (0 = sky, larger = nearer).
function makeCanvas() {
  const rgb = new Float32Array(W * H * 3), layer = new Uint8Array(W * H);
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  const get = (x, y) => { x = clamp(Math.round(x), 0, W - 1); y = clamp(Math.round(y), 0, H - 1); const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  return { rgb, layer, put, blend, get };
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
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = y * W + x;
    if (layer[i] > upTo) return;
    if (a >= 1) { out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2]; return; }
    out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
  };
  const rect = (x0, y0, x1, y1, c, upTo) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) add(x, y, c, 1, upTo); };
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
  return { out, add, rect, begin, finish };
}


const ANCHORS = [
  ["#7a68b4", "#9a70ae", "#c07c9c", "#c86a6a", "#f09060", "#fbb868", "#fcd488", 14],
  ["#fff6d8", "#ffe8a8", 2],
  ["#a86a50", "#c8845a", "#e0a068", "#f0bc80", "#f4d0a0", 6],
  ["#5e3450", "#6e3e58", "#804a60", "#94586a", 4],
  ["#c88a68", "#a87060", 2],
  ["#f0b478", "#d89464", "#b47656", "#8a5448", "#6a4040", 6],
  ["#1c1020", "#2a1828", 2],
  ["#e89080", "#c87080", 2],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "giza-pyramids-sunset", name: "Giza Pyramids Sunset", category: "cities",
  note: "The three pyramids of Giza glow on their sunlit faces as the sun sets, while a camel caravan with riders walks along the dunes in front.",
  tags: ["cairo", "egypt", "pyramids", "sunset", "camels", "desert", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, PYR = 1, SAND = 2;
const HZ = 80;
const crest = (x) => 92 + 2.5 * Math.sin(x / 23 + 0.7) + 1.2 * Math.sin(x / 9);

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  const SUN = [26, 60], SR = 8;
  // 1. sunset sky, warm and low
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#7a68b4"], [0.2, "#9a70ae"], [0.4, "#c07c9c"], [0.6, "#c86a6a"], [0.76, "#f09060"], [0.9, "#fbb868"], [1, "#fcd488"]], y / HZ);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    c = mix(c, hex("#fcd488"), clamp(1 - d / 56) * 0.55);
    put(x, y, c, SKY);
  }
  // 2. the desert floor behind the pyramids
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) put(x, y, mix(hex("#c88a68"), hex("#a87060"), clamp((y - HZ) / 14)), SAND);
  // 3. pyramids, far to near: [left corner, apex, front corner, right corner]
  const pyr = (L, A, C, R, cap) => {
    const x0 = Math.floor(Math.min(L[0], C[0])), x1 = Math.ceil(Math.max(R[0], C[0]));
    for (let y = Math.floor(A[1]); y <= Math.max(L[1], C[1], R[1]); y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5, k = (py - A[1]) / (C[1] - A[1]);
      const course = y % 2 === 0 ? 0.1 : 0;
      if (inPoly(px, py, [L, A, C])) {
        // sunlit face, brighter toward the sun side and the top
        const lit = clamp(0.75 - (px - L[0]) / (C[0] - L[0]) * 0.35 - k * 0.15 - course);
        let c = mix(hex("#a86a50"), hex("#f0bc80"), lit);
        if (cap && k < cap) c = mix(hex("#f0bc80"), hex("#f4d0a0"), 0.6);
        put(x, y, c, PYR);
      } else if (inPoly(px, py, [C, A, R])) {
        const sh = clamp(0.55 - k * 0.3 - course + (px - C[0]) / (R[0] - C[0]) * 0.15);
        let c = mix(hex("#5e3450"), hex("#94586a"), sh);
        if (cap && k < cap) c = hex("#94586a");
        put(x, y, c, PYR);
      }
    }
    // the front edge catches a little light
    for (let s = 0; s <= 1; s += 0.01) put(lerp(A[0], C[0], s), lerp(A[1], C[1], s), hex("#e0a068"), PYR);
  };
  pyr([148, 81], [172, 54], [178, 84], [196, 80], 0);
  pyr([90, 80], [130, 26], [140, 86], [180, 79], 0.16);
  pyr([14, 82], [66, 20], [80, 88], [124, 81], 0);
  // 4. foreground dunes: a lit crest the caravan walks on, and a nearer dune
  for (let x = 0; x < W; x++) {
    const c1 = crest(x), c2 = 101 + 3 * Math.sin(x / 31 + 2) + 1.5 * Math.sin(x / 13);
    for (let y = Math.floor(c1); y < H; y++) {
      const k = (y - c1) / 10, rip = Math.sin(x * 0.5 + y * 1.7) > 0.7 ? 0.12 : 0;
      put(x, y, mix(hex("#f0b478"), hex("#b47656"), clamp(k * 0.8 + rip)), SAND);
    }
    for (let y = Math.floor(c2); y < H; y++) {
      const k = (y - c2) / 8, side = Math.cos(x / 31 + 2) > 0 ? 0.25 : 0;
      put(x, y, mix(hex("#d89464"), hex("#6a4040"), clamp(k * 0.6 + side)), SAND);
    }
  }

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const INK = hex("#1c1020"), INK2 = hex("#2a1828");
  const clouds = [[0.3, 0.3, 14, 1.3, "#e89080", 0.5], [0.75, 0.24, 30, 1.1, "#c87080", 0.4], [0.05, 0.35, 44, 1.4, "#e89080", 0.6]];
  // a camel walking right, feet at (x, y); phase drives the legs
  const camel = (x, y, ph, rider) => {
    const P = (dx, dy, c = INK) => add(x + dx, y + dy, c, 1);
    for (let dx = -6; dx <= 5; dx++) for (let dy = -10; dy <= -6; dy++) {
      const e = ((dx + 0.5) / 6) ** 2 + ((dy + 8) / 2.6) ** 2;
      if (e < 1) P(dx, dy);
    }
    for (let dx = -3; dx <= 1; dx++) P(dx, -11); for (let dx = -2; dx <= 0; dx++) P(dx, -12); // hump
    for (let j = 0; j < 6; j++) { P(5 + Math.round(j * 0.5), -8 - j); P(6 + Math.round(j * 0.5), -8 - j); } // neck
    P(9, -14); P(10, -14); P(11, -13); P(9, -15); // head
    P(-7, -8); P(-7, -7); P(-8, -6); // tail
    const legs = [[-4, 0], [-3, Math.PI], [3, Math.PI], [4, 0]];
    for (const [lx, o] of legs) {
      const sw = Math.sin(ph + o) * 1.6;
      for (let j = 0; j < 6; j++) { const k = j / 5; P(Math.round(lx + sw * k), -6 + j, j > 3 ? INK2 : INK); }
    }
    if (rider) {
      for (let j = 0; j < 3; j++) P(-1, -13 - j); P(0, -14); P(-1, -17); P(-2, -17); P(0, -17); P(-1, -18);
      P(0, -12, INK2); P(1, -11, INK2);
    }
  };
  const walker = (x, y, ph) => {
    const P = (dx, dy) => add(x + dx, y + dy, INK, 1);
    const s = Math.sin(ph) * 1.2;
    P(Math.round(-s * 0.6), -1); P(Math.round(s * 0.6), -1); P(Math.round(-s), 0); P(Math.round(s), 0);
    for (let j = 2; j <= 5; j++) P(0, -j); P(0, -6); P(0, -7); P(-1, -7); P(1, -7); P(0, -8);
    P(1, -4); P(2, -4); // arm with the lead rope
  };

  return (t) => {
    F.begin();
    for (let y = SUN[1] - SR; y <= SUN[1] + SR; y++) for (let x = SUN[0] - SR; x <= SUN[0] + SR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SR) add(x, y, d < SR - 1.4 ? hex("#fff6d8") : hex("#ffe8a8"), 1, SKY);
    }
    for (const [u, len, cy, th, col, sp] of clouds) {
      const L = len * W, cx = ((((u * W + t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3, C = hex(col);
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.1 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, C, a * 0.75, SKY);
      }
    }
    // the caravan: a guide on foot leading four camels along the crest
    const lead = ((t * 3.2 + 90) % (W + 120)) - 20;
    const gx = Math.round(lead);
    walker(gx, Math.round(crest(gx)) + 1, t * 6);
    for (let k = 0; k < 4; k++) {
      const cx = Math.round(lead - 12 - k * 22), cy = Math.round(crest(cx)) + 1;
      camel(cx, cy, t * 3.4 + k * 1.1, k !== 1);
      // rope to the one in front
      const tx = k === 0 ? gx + 2 : Math.round(lead - 12 - (k - 1) * 22) - 7;
      for (let j = 1; j < 8; j++) { const xx = cx + 10 + j * ((tx - cx - 10) / 8); add(Math.round(xx), Math.round(crest(xx)) - 13 + j * 0.9 + Math.sin(j / 8 * Math.PI) * 2, INK2, 0.9); }
    }
    // birds heading home across the sky
    const bt = (t % 22) / 22, bx = lerp(W + 10, -30, bt), by = 30 + Math.sin(bt * 6) * 4;
    for (let k = 0; k < 5; k++) {
      const x = Math.round(bx + k * 6 + (k % 2) * 2), y = Math.round(by + (k % 3) * 2 + Math.sin(t + k)), up = Math.sin(t * 8 + k) > 0;
      add(x, y, INK, 1); add(x - 1, y + (up ? -1 : 0), INK, 1); add(x + 1, y + (up ? -1 : 0), INK, 1);
    }
    return F.finish();
  };
}
