/* paddy-buffalo-sunrise: rice paddies with a farmer and water buffalo at sunrise, hand-built picture scene. */
import { fbm, noise2, clamp, lerp, rng, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ramp = (stops, t) => {
  t = clamp(t);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(hex(stops[i - 1][1]), hex(stops[i][1]), (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  return hex(stops[stops.length - 1][1]);
};
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
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
        const i = (y * W + x) * 3, r = out[i], g = out[i + 1], b = out[i + 2];
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
  const put = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2]; };
  const add = (x, y, c, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = (y * W + x) * 3; rgb[i] += (c[0] - rgb[i]) * a; rgb[i + 1] += (c[1] - rgb[i + 1]) * a; rgb[i + 2] += (c[2] - rgb[i + 2]) * a; };
  const get = (x, y) => { x = clamp(x | 0, 0, W - 1); y = clamp(y | 0, 0, H - 1); const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  return { rgb, put, add, get };
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };

const PAL = buildPal([
  ["#8ea4d0", "#a8b4d8", "#c8b8d0", "#e8b8b0", "#f8c8a0", "#ffd8a8", 10],
  ["#fff6dc", "#ffe8b8", 2],
  ["#b0a4c4", "#9890b4", "#8288a8", 3],
  ["#5a6880", "#6e7c92", 2],
  ["#1c2224", "#2a3436", "#3a4844", 3],
  ["#3c5a2c", "#56783a", "#78964c", "#9ab460", 6],
  ["#7894b8", "#98a8cc", "#d0b4b8", "#f0c4a0", "#ffd4a4", 8],
  ["#f2eee6", "#c8c4bc", 2],
]);

export const meta = {
  slug: "paddy-buffalo-sunrise", name: "Paddy Buffalo Sunrise", category: "landscapes",
  note: "Flooded rice paddies mirror a soft sunrise as a farmer leads a water buffalo along the dikes and egrets fly low over the fields.",
  tags: ["rice", "paddy", "sunrise", "farm", "asia", "halftone", "nature", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C;
  const HZ = 54, SUN = [124, 30], SUNR = 8.5;
  const kind = new Uint8Array(W * H); // 1 sky, 2 water
  const skyAt = (y) => ramp([[0, "#8ea4d0"], [0.3, "#a8b4d8"], [0.55, "#c8b8d0"], [0.75, "#e8b8b0"], [0.9, "#f8c8a0"], [1, "#ffd8a8"]], y / HZ);
  // 1. sky with the sun's warm halo
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = skyAt(y);
    c = mix(c, hex("#ffd8a8"), clamp(1 - Math.hypot(x - SUN[0], y - SUN[1]) / 22) * 0.45);
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SUNR) c = d < SUNR - 1.5 ? hex("#fff6dc") : hex("#ffe8b8");
    put(x, y, c); kind[y * W + x] = 1;
  }
  // 2. far misty hills, then a nearer darker ridge
  const h1 = (x) => 38 + 7 * fbm(x / 30, 2, 3, 4) - 6 * Math.max(0, 1 - Math.abs(x - 40) / 34);
  const h2 = (x) => 45 + 5 * fbm(x / 18, 5, 3, 8) - 4 * Math.max(0, 1 - Math.abs(x - 168) / 26);
  for (let x = 0; x < W; x++) {
    for (let y = Math.floor(h1(x)); y < HZ; y++) { put(x, y, mix(hex("#b0a4c4"), hex("#9890b4"), clamp((y - h1(x)) / 10))); kind[y * W + x] = 0; }
    for (let y = Math.floor(h2(x)); y < HZ; y++) put(x, y, mix(hex("#8288a8"), hex("#6e7c92"), clamp((y - h2(x)) / 8)));
  }
  // 3. the village tree line: bushes and palms along the horizon
  for (let x = 0; x < W; x++) { const top = HZ - 2 - 3 * fbm(x / 4, 1, 3, 12); for (let y = Math.floor(top); y < HZ + 1; y++) put(x, y, hex("#2a3436")); }
  const palm = (bx, h, lean) => {
    let x = bx, y = HZ;
    for (let k = 0; k < h; k++) { x += lean * (k / h) * 0.6; y -= 1; put(x, y, hex("#1c2224")); }
    for (let f = 0; f < 7; f++) {
      const a = -Math.PI / 2 + (f - 3) * 0.5;
      for (let r = 1; r < 7; r++) put(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 0.5 + r * r * 0.12, hex("#1c2224"));
    }
  };
  for (const [bx, h, l] of [[14, 20, 1], [22, 15, -1], [62, 18, 1.2], [92, 22, -0.6], [150, 19, 1], [158, 14, -1.2], [178, 21, 0.4]]) palm(bx, h, l);
  // 4. the paddies: terraced fields of sky-coloured water between curving dikes
  const dikes = [56, 60, 65, 71, 79, 89, 102].map((b, k) => ({ b, amp: 0.6 + k * 0.5, f: 40 + k * 9, ph: k * 1.7, th: 0.7 + k * 0.45 }));
  const dy = (d, x) => d.b + Math.sin(x / d.f + d.ph) * d.amp + Math.sin(x / (d.f * 0.37) + d.ph * 2) * d.amp * 0.3;
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
    // field index: which dike is just above this pixel
    let k = -1; for (let i = 0; i < dikes.length; i++) if (y >= dy(dikes[i], x)) k = i;
    const v = (y - HZ) / (H - HZ);
    // reflection of the sky: far fields show the bright horizon, near ones the higher sky
    let c = ramp([[0, "#ffd4a4"], [0.25, "#f0c4a0"], [0.5, "#d0b4b8"], [0.8, "#98a8cc"], [1, "#7894b8"]], v * 1.1);
    if (Math.abs(x - SUN[0]) < 4 - v * 2 && noise2(x / 2, y * 1.6, 3) > 0.35 && v < 0.7) c = mix(c, hex("#fff6dc"), 0.8 - v);
    put(x, y, c); kind[y * W + x] = 2;
    // rice seedlings in rows in every other field
    if (k >= 0 && k % 2 === 1 && k < dikes.length - 1) {
      const top = dy(dikes[k], x), bot = dy(dikes[k + 1], x), u = (y - top) / (bot - top);
      const rowStep = 1 / (2 + k);
      if (u > 0.12 && (u % rowStep) < rowStep * 0.45 && (x + Math.floor(u / rowStep)) % 3 === 0) { put(x, y, k > 3 ? hex("#78964c") : hex("#56783a")); kind[y * W + x] = 0; }
    }
  }
  // the dikes on top: grass with a darker edge
  for (const d of dikes) for (let x = 0; x < W; x++) {
    const y0 = dy(d, x);
    for (let y = Math.floor(y0 - d.th); y <= y0; y++) { put(x, y, y < y0 - d.th * 0.5 ? hex("#9ab460") : hex("#56783a")); kind[y * W + x] = 0; }
    put(x, Math.floor(y0) + 1, hex("#3c5a2c"));
  }
  // a little path dike running toward us, to give depth
  for (let y = 60; y < H; y++) { const x0 = 40 - (y - 60) * 0.55, w = 0.5 + (y - 60) * 0.05; for (let x = Math.floor(x0 - w); x <= x0 + w; x++) { put(x, y, x < x0 ? hex("#78964c") : hex("#56783a")); kind[y * W + x] = 0; } }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const INK = hex("#1c2224"), INK2 = hex("#2a3436"), REF = hex("#5a6880"), EGRET = hex("#f2eee6"), EGRET2 = hex("#c8c4bc");
  const WALK = dikes[4];
  // a figure painter that can draw upright on the dike or flipped as a reflection in the field below
  const draw = (x0, y0, flip, col, t) => {
    const P = (x, y) => { const yy = flip ? y0 + (y0 - y) + 2 : y; const xi = Math.floor(x), yi = Math.floor(yy); if (yi < 0 || yi >= H || xi < 0 || xi >= W) return; if (flip && kind[yi * W + xi] !== 2) return; put(xi, yi, col); };
    const step = Math.sin(t * 3);
    // buffalo, walking right ahead of the farmer
    const bx = x0 + 16, by = y0;
    for (let x = -9; x <= 9; x++) { const hump = x < -3 ? 1 : 0; for (let y = 0; y < 6 + hump - Math.abs(x) * 0.08; y++) P(bx + x, by - 4 - y); }
    for (let x = 9; x < 14; x++) for (let y = 0; y < 4; y++) if (!(x > 12 && y > 2)) P(bx + x, by - 6 - y + Math.floor((x - 9) / 3));
    for (let k = 0; k < 4; k++) { P(bx + 10 - k, by - 11 - (k > 1 ? 1 : 0)); P(bx + 12 + k * 0.5, by - 11 - k * 0.6); }
    for (const [lx, ph] of [[-7, 0], [-4, Math.PI], [5, Math.PI], [8, 0]]) { const sw = Math.sin(t * 3 + ph) * 1.2; for (let y = 0; y < 4; y++) P(bx + lx + sw * (y / 4), by - y); }
    for (let y = 0; y < 5; y++) P(bx - 10 - y * 0.2, by - 8 + y);
    // farmer: conical hat, body, walking legs, a rope to the buffalo
    const fx = x0, fy = y0;
    for (let y = 0; y < 3; y++) for (let x = -3 + y; x <= 3 - y; x++) P(fx + x, fy - 13 - (2 - y));
    for (let y = 0; y < 7; y++) { P(fx, fy - 12 + y); P(fx + 1, fy - 12 + y); }
    P(fx + 2, fy - 9); P(fx + 3, fy - 8);
    for (let y = 0; y < 5; y++) { P(fx + step * (y / 5) * 1.5, fy - 5 + y); P(fx + 1 - step * (y / 5) * 1.5, fy - 5 + y); }
    for (let x = 4; x < 7; x++) P(fx + x, fy - 8 + (x - 4) * 0.3);
  };

  return (t) => {
    out.set(base);
    // farmer and buffalo walk slowly along the fourth dike, with their reflection below
    const span = W + 80, x = ((t * 2.4 + 60) % span) - 40, y = Math.round(dy(WALK, x)) - 1;
    draw(x, y, true, REF, t);
    draw(x, y, false, INK, t);
    // egrets: a small line of white birds flying slowly, wings beating
    for (let i = 0; i < 4; i++) {
      const ex = W + 20 - ((t * 5 + i * 9) % (W + 60)), ey = 40 + i * 2 + Math.sin(t * 0.6 + i) * 1.5, up = Math.sin(t * 4 + i * 1.3);
      const xi = Math.round(ex), yi = Math.round(ey), wy = up > 0 ? -2 : 1;
      put(xi, yi, EGRET); put(xi + 1, yi, EGRET); put(xi - 1, yi, EGRET); put(xi - 2, yi - 1, EGRET2);
      for (let w = 1; w < 4; w++) { put(xi - w + 1, yi + Math.round(wy * w / 3) - (w > 1 ? 0 : 0), EGRET); put(xi + w - 1, yi + Math.round(wy * w / 3), EGRET2); }
    }
    return enc(out);
  };
}
