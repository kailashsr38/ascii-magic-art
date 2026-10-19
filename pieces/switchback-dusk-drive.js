/* switchback-dusk-drive: cars on a switchback mountain road at dusk, hand-built picture scene. */
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
  ["#1c2258", "#2c2c70", "#4a3a88", "#7a4a90", "#b05a88", "#e07a70", "#f8a060", "#ffc478", 14],
  ["#4a3c78", "#5e4a8a", "#7a5e9a", 3],
  ["#221c40", "#2c2450", "#382e60", 3],
  ["#544874", "#706294", "#a89098", 3],
  ["#0c0a16", "#141022", 2],
  ["#fff6dc", "#ffe0a0", "#ffb860", "#ff3a30", "#a02a30", 5],
  ["#c8c8e8", "#e8e8f8", 2],
]);

export const meta = {
  slug: "switchback-dusk-drive", name: "Switchback Dusk Drive", category: "landscapes",
  note: "Cars wind down a switchback mountain road at dusk, headlights sweeping the bends under an orange afterglow while the first stars come out.",
  tags: ["mountains", "road", "dusk", "cars", "stars", "halftone", "travel", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C;
  const kind = new Uint8Array(W * H);
  // 1. dusk sky: deep blue overhead to an orange glow on the horizon
  const GLOW = [70, 46];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#1c2258"], [0.25, "#2c2c70"], [0.45, "#4a3a88"], [0.62, "#7a4a90"], [0.75, "#b05a88"], [0.86, "#e07a70"], [0.95, "#f8a060"], [1, "#ffc478"]], y / 50);
    c = mix(c, hex("#ffc478"), clamp(1 - Math.hypot((x - GLOW[0]) / 2.2, y - GLOW[1]) / 30) * 0.6);
    put(x, y, c); kind[y * W + x] = 1;
  }
  // 2. far range: jagged violet peaks, lit rim
  const far = (x) => 40 + 9 * fbm(x / 26, 1, 4, 3) - 10 * Math.max(0, 1 - Math.abs(x - 150) / 30) - 6 * Math.max(0, 1 - Math.abs(x - 24) / 22) + Math.abs(((x * 0.13) % 2) - 1) * 2;
  for (let x = 0; x < W; x++) for (let y = Math.floor(far(x)); y < H; y++) { put(x, y, y - far(x) < 1.5 ? hex("#7a5e9a") : mix(hex("#5e4a8a"), hex("#4a3c78"), clamp((y - far(x)) / 14))); kind[y * W + x] = 2; }
  // 3. the near mountain the road climbs: big dark slope from right to left
  const near = (x) => 50 + (x < 120 ? (120 - x) * 0.05 : (x - 120) * 0.22) + 3 * fbm(x / 12, 4, 3, 5);
  for (let x = 0; x < W; x++) for (let y = Math.floor(near(x)); y < H; y++) {
    const n = fbm(x / 8, y / 6, 3, 9);
    put(x, y, n > 0.6 ? hex("#382e60") : n > 0.42 ? hex("#2c2450") : hex("#221c40")); kind[y * W + x] = 3;
  }
  // 4. the switchback road: a polyline, wider as it comes toward us
  const R = [[124, 52], [92, 55], [138, 59], [78, 64], [150, 71], [60, 80], [168, 92], [40, 108], [-10, 118]];
  const path = [];
  for (let i = 1; i < R.length; i++) {
    const [ax, ay] = R[i - 1], [bx, by] = R[i], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
    for (let j = 0; j < n; j++) {
      const s = j / n, cx = lerp(ax, bx, s), cy = lerp(ay, by, s);
      path.push([cx, cy]);
    }
  }
  // round the hairpins a little by smoothing
  for (let pass = 0; pass < 6; pass++) for (let i = 1; i < path.length - 1; i++) { path[i][0] = (path[i - 1][0] + path[i][0] * 2 + path[i + 1][0]) / 4; path[i][1] = (path[i - 1][1] + path[i][1] * 2 + path[i + 1][1]) / 4; }
  for (const [px, py] of path) {
    const w = 0.6 + (py - 50) / 22;
    for (let dy = -w * 0.6; dy <= w * 0.6; dy += 0.5) for (let dx = -w; dx <= w; dx += 0.5) {
      const x = Math.floor(px + dx), y = Math.floor(py + dy);
      if (x >= 0 && y >= 0 && x < W && y < H && kind[y * W + x] === 3) put(x, y, Math.abs(dy) > w * 0.45 ? hex("#544874") : hex("#706294"));
    }
  }
  // 5. foreground pines, dark against the slope
  const pine = (cx, by, h, w) => { for (let y = by - h; y < by; y++) { const k = (y - (by - h)) / h, half = w * k * (0.5 + 0.5 * ((k * 7) % 1)); for (let x = Math.floor(cx - half); x <= cx + half; x++) put(x, y, hex("#0c0a16")); } for (let y = by; y < H; y++) put(cx, y, hex("#0c0a16")); };
  for (const [cx, by, h, w] of [[8, 110, 72, 11], [22, 112, 46, 8], [184, 110, 80, 12], [170, 112, 52, 8], [158, 112, 30, 5], [34, 112, 26, 5]]) pine(cx, by, h, w);
  // stars: each comes out at its own moment as the dusk deepens
  const S = rng(4), stars = [];
  for (let i = 0; i < 60; i++) { const x = Math.floor(S() * W), y = Math.floor(S() * 30); if (kind[y * W + x] === 1) stars.push([x, y, 2 + S() * 20, S() < 0.2]); }
  // arc-length table for the cars
  const len = [0];
  for (let i = 1; i < path.length; i++) len.push(len[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = len[len.length - 1];
  const at = (s) => { s = clamp(s, 0, total - 0.01); let lo = 0, hi = len.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] <= s) lo = m; else hi = m; } return [path[lo], path[Math.min(path.length - 1, lo + 3)]]; };

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const HEAD = hex("#fff6dc"), BEAM = hex("#ffe0a0"), AMB = hex("#ffb860"), RED = hex("#ff3a30"), RED2 = hex("#a02a30"), STAR = hex("#e8e8f8"), STAR2 = hex("#c8c8e8");
  const CYCLE = 30;
  const cars = [[0, 1], [0.37, 1], [0.7, -1], [0.15, -1]];

  return (t) => {
    out.set(base);
    // stars come out one by one, then the cycle starts again with a slow fade
    const ct = t % CYCLE, fadeAll = clamp((CYCLE - ct) / 3);
    for (const [x, y, t0, big] of stars) {
      const a = clamp((ct - t0) / 2) * fadeAll;
      if (a <= 0) continue;
      C.add(x, y, big ? STAR : STAR2, a);
      if (big) { C.add(x + 1, y, STAR2, a * 0.6); C.add(x, y + 1, STAR2, a * 0.6); }
    }
    // cars: downhill ones show headlights leading, uphill ones show tail lights
    for (const [ph, dir] of cars) {
      const u = (ph + t / 40) % 1, s = (dir > 0 ? u : 1 - u) * total;
      const [p, q] = at(s);
      const fx = (q[0] - p[0]) * dir, fy = (q[1] - p[1]) * dir, fl = Math.hypot(fx, fy) || 1, nx = fx / fl, ny = fy / fl;
      const scale = 0.6 + (p[1] - 50) / 30;
      const x = p[0], y = p[1] - 0.5;
      if (dir > 0) {
        // headlights: a beam fanning out ahead of the car
        for (let r = 1; r < 6 + scale * 6; r++) for (let w = -r * 0.35; w <= r * 0.35; w += 0.5) {
          const bx = Math.floor(x + nx * r - ny * w), by = Math.floor(y + ny * r + nx * w);
          if (by >= 0 && by < H && bx >= 0 && bx < W && kind[by * W + bx] === 3) C.add(bx, by, BEAM, 0.55 * (1 - r / (7 + scale * 6)));
        }
        put(x, y, HEAD); put(x + nx, y + ny, HEAD); if (scale > 1.4) put(x - ny, y + nx, HEAD);
        put(x - nx * 2, y - ny * 2, RED2);
      } else {
        put(x, y, RED); put(x - ny, y + nx, RED); put(x + nx * 2, y + ny * 2, AMB);
        for (let k = 1; k < 5; k++) C.add(Math.floor(x - nx * k), Math.floor(y - ny * k), RED2, 0.5 - k * 0.1);
      }
    }
    return enc(out);
  };
}
