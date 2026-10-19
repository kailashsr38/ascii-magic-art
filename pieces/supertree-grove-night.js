/* supertree-grove-night: a grove of tall lit steel supertrees with a skywalk, a city skyline behind and people strolling below, hand-built picture scene. */
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
// a float RGB canvas with a cell-kind mask: put (opaque), add (blend)
function canvas() {
  const rgb = new Float32Array(W * H * 3), kind = new Uint8Array(W * H);
  const put = (x, y, c, k) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; if (k !== undefined) kind[i] = k; };
  const add = (x, y, c, a) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = (y * W + x) * 3; rgb[i] += (c[0] - rgb[i]) * a; rgb[i + 1] += (c[1] - rgb[i + 1]) * a; rgb[i + 2] += (c[2] - rgb[i + 2]) * a; };
  const rect = (x0, y0, x1, y1, c, k) => { for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) put(x, y, c, k); };
  return { rgb, kind, put, add, rect };
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };
const tri = (v) => { const f = v - Math.floor(v); return f < 0.5 ? f * 2 : 2 - f * 2; };

const PAL = buildPal([
  ["#44549a", "#5262aa", "#6468b4", "#7c70bc", "#9a80c4", 8],
  ["#fbf6e4", "#e8e0c8", 2],
  ["#1e2650", "#2a3466", "#4a5890", 3],
  ["#e8c070", "#c89a50", 2],
  ["#0c0e1c", "#161a30", "#22283e", 3],
  ["#f070b8", "#d04a98", "#a03078", 3],
  ["#c090f0", "#9a68d8", "#7448b0", 3],
  ["#70e0e8", "#40b0c8", "#2c84a0", 3],
  ["#f8a860", "#d07838", 2],
  ["#2a4a48", "#3e6a5a", 2],
  ["#8a7468", "#b49478", 2],
  ["#6a6c98", "#8a88b0", 2],
]);

export const meta = {
  slug: "supertree-grove-night", name: "Supertree Grove Night", category: "cities",
  note: "Tall steel supertrees glow magenta, violet and teal at night beside a city skyline, while people stroll the garden path and cross the high skywalk.",
  tags: ["city", "night", "garden", "skyline", "people", "halftone", "neon", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, CITY = 2, TREE = 3, GROUND = 4;
const TREES = [
  [14, 46, 10, ["#70e0e8", "#40b0c8", "#2c84a0"]],
  [40, 30, 14, ["#c090f0", "#9a68d8", "#7448b0"]],
  [76, 12, 21, ["#f070b8", "#d04a98", "#a03078"]],
  [122, 22, 17, ["#70e0e8", "#40b0c8", "#2c84a0"]],
  [154, 38, 12, ["#c090f0", "#9a68d8", "#7448b0"]],
  [178, 26, 15, ["#f8a860", "#d07838", "#a03078"]],
];
const GY = 92; // where the trunks meet the garden

export default function create() {
  const C = canvas(), { put, rect, kind, rgb } = C;
  const MX = 26, MY = 13;
  // 1. night sky: deep blue, a violet glow from the city near the horizon, the moon
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#44549a"], [0.45, "#5262aa"], [0.7, "#6468b4"], [0.88, "#7c70bc"], [1, "#9a80c4"]], y / 76);
    const d = Math.hypot(x - MX, y - MY);
    c = mix(c, hex("#8a88b0"), clamp(1 - d / 20) ** 2 * 0.5);
    if (d < 4.3) c = d < 3.2 ? hex("#fbf6e4") : hex("#e8e0c8");
    put(x, y, c, SKY);
  }
  // thin clouds lit from below by the city
  for (const [cy, x0, x1] of [[34, 0, 70], [42, 90, 192], [28, 120, 180]]) for (let x = x0; x < x1; x++) {
    const a = Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 0.4 * (0.6 + noise2(x / 6, cy, 2) * 0.6);
    C.add(x, cy, hex("#8a88b0"), a); C.add(x, cy + 1, hex("#7c70bc"), a * 0.6);
  }
  // 2. skyline: towers with steady lit windows, and three towers joined by a long sky deck
  const tower = (x0, x1, top, lit) => {
    for (let y = top; y < GY + 4; y++) for (let x = x0; x <= x1; x++) {
      let c = x > x1 - 2 ? hex("#1e2650") : hex("#2a3466");
      if (y > top + 1 && (y - top) % 3 === 1 && (x - x0) % 2 === 1 && x < x1 - 1 && hash(x * 7 + x0, y) < lit) c = hash(x, y * 3) < 0.7 ? hex("#c89a50") : hex("#e8c070");
      put(x, y, c, CITY);
    }
  };
  for (let x = 0, k = 0; x < W; k++) { const w = 7 + Math.floor(hash(k, 1) * 9), top = 48 + Math.floor(hash(k, 2) * 22); tower(x, x + w, top, 0.35); x += w + 1 + Math.floor(hash(k, 3) * 4); }
  for (const [x0, top] of [[132, 34], [146, 32], [160, 30]]) tower(x0, x0 + 8, top, 0.5);
  for (let x = 128; x < 176; x++) { put(x, 28 + (x < 140 ? 1 : 0), hex("#3c4878"), CITY); put(x, 29 + (x < 140 ? 1 : 0), hex("#1c2448"), CITY); }
  rect(166, 26, 175, 27, hex("#3c4878"), CITY);
  tower(98, 108, 40, 0.4); tower(20, 28, 44, 0.4);
  // 3. the supertrees: a tapering trunk wrapped in vines, a funnel canopy of lit lattice
  for (const [cx, top, R, cols] of TREES) {
    const [L0, L1, L2] = cols.map(hex), cb = top + R * 1.1; // canopy base
    for (let y = Math.floor(cb); y < GY + 2; y++) {
      const hw = lerp(1.2, 3.2, (y - cb) / (GY - cb));
      for (let x = Math.round(cx - hw); x <= cx + hw; x++) {
        let c = L2;
        if (((x - cx) * 2 + y) % 5 === 0 || ((cx - x) * 2 + y) % 5 === 0) c = L1;
        if (x > cx + hw - 1) c = mix(c, L1, 0.5);
        put(x, y, c, TREE);
      }
    }
    for (let y = top; y < cb; y++) {
      const v = (y - top) / (cb - top), hw = lerp(R, 1.5, Math.pow(v, 0.75));
      for (let x = Math.round(cx - hw); x <= cx + hw; x++) {
        const a = Math.atan2(y - cb, x - cx), rr = Math.hypot(x - cx, y - cb);
        let c = mix(L2, L1, 0.6);
        const spoke = Math.abs(((a * 7) / Math.PI) % 1) < 0.18, ring = Math.abs((rr / 3.2) % 1) < 0.25;
        if (spoke || ring) c = v < 0.25 ? L0 : L1;
        if (y <= top + 1) c = L0;
        put(x, y, c, TREE);
      }
    }
  }
  // the skywalk slung between the big tree and its neighbour
  const SW = (x) => 54 + 3 * Math.sin(((x - 76) / (122 - 76)) * Math.PI);
  for (let x = 76; x <= 122; x++) { const y = Math.round(SW(x)); put(x, y, hex("#8a88b0"), TREE); put(x, y + 1, hex("#2a3460"), TREE); if (x % 3 === 0) put(x, y - 1, hex("#6a6c98"), TREE); put(x, y - 2, hex("#6a6c98"), TREE); }
  // 4. the garden: dark foliage, a lit path, lamps
  for (let y = GY - 2; y < H; y++) for (let x = 0; x < W; x++) {
    const top = GY - 2 + Math.round((noise2(x / 5, 1, 4) - 0.5) * 6);
    if (y < top) continue;
    let c;
    if (y >= 94 && y < 107) c = mix(hex("#8a7468"), hex("#b49478"), clamp(0.5 + (noise2(x / 3, y, 5) - 0.5)));
    else { const n = fbm(x / 4, y / 4, 3, 8); c = mix(hex("#2a4a48"), hex("#3e6a5a"), clamp(n * 1.3 - 0.35)); }
    put(x, y, c, GROUND);
  }
  for (let lx = 10; lx < W; lx += 34) { for (let y = 90; y < 98; y++) put(lx, y, hex("#0c0e1c"), GROUND); put(lx, 89, hex("#e8c070"), GROUND); put(lx - 1, 89, hex("#c89a50"), GROUND); put(lx + 1, 89, hex("#c89a50"), GROUND); }

  const base = rgb.slice(), out = rgb, enc = encoder(PAL);
  const PPL = hex("#0c0e1c"), PPL2 = hex("#22283e"), PLANE = hex("#e8c070");
  const walkers = Array.from({ length: 9 }, (_, i) => ({ sp: (2 + hash(i, 4) * 2.2) * (i % 2 ? -1 : 1), ph: hash(i, 9) * 300, y: 103 + (i % 3), h: 10 + (i % 3) }));
  const sky = Array.from({ length: 5 }, (_, i) => ({ sp: (1 + hash(i, 6)) * (i % 2 ? -1 : 1), ph: hash(i, 7) * 100 }));

  return (t) => {
    out.set(base);
    // people strolling the path
    for (const w of walkers) {
      const span = W + 20, p = (((t * w.sp + w.ph) % span) + span) % span, x = Math.round(p - 10), step = Math.floor(t * 4 + w.ph) & 1;
      for (let k = 0; k < w.h - 3; k++) { put(x, w.y - 3 - k, PPL); put(x + 1, w.y - 3 - k, k < w.h - 6 ? PPL : PPL2); }
      put(x, w.y - w.h, PPL); put(x + 1, w.y - w.h, PPL);
      put(x - (step ? 1 : 0), w.y - 1, PPL); put(x - (step ? 1 : 0), w.y - 2, PPL); put(x + 1 + (step ? 1 : 0), w.y - 1, PPL); put(x + 1 + (step ? 0 : 1), w.y - 2, PPL);
    }
    // tiny figures crossing the skywalk
    for (const s of sky) {
      const span = 44, p = (((t * s.sp + s.ph) % span) + span) % span, x = 78 + Math.round(p), y = Math.round(SW(x));
      put(x, y - 1, PPL); put(x, y - 2, PPL); put(x, y - 3, PPL);
    }
    // a plane crossing high up, its light steady
    const px = ((t * 5) % (W + 40)) - 20;
    put(px, 8 + px * 0.04, PLANE); put(px - 1, 8 + px * 0.04, hex("#6a6c98")); put(px - 2, 8 + px * 0.04, hex("#6a6c98"));
    // a slow cloud drifting over the moon
    const cx = ((t * 1.6 + 40) % (W + 80)) - 40;
    for (let y = 8; y < 22; y++) for (let x = Math.max(0, Math.floor(cx - 22)); x < Math.min(W, cx + 22); x++) {
      if (kind[y * W + x] !== SKY) continue;
      const a = clamp(1 - Math.abs(x - cx) / 22) * clamp(1 - Math.abs(y - 15 - Math.sin(x / 5)) / 4) * fbm(x / 6, y / 3, 2, 3);
      C.add(x, y, hex("#8a88b0"), a * 0.9);
    }
    return enc(out);
  };
}
