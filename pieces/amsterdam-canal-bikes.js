/* amsterdam-canal-bikes: gabled canal houses at golden hour with bicycles on the quay and a boat on the canal, hand-built picture scene. */
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
  ["#7aa4cc", "#9cbcd8", "#c4cccc", "#e2c8a4", 6],
  ["#fff4d6", "#ffdc9a", 2],
  ["#7e3a2c", "#a8503c", "#c46a4c", 3],
  ["#5e3a2c", "#7a4e3a", 2],
  ["#b8884a", "#d4aa68", 2],
  ["#c4b496", "#ddd0b2", 2],
  ["#4a5868", "#6a7a8a", "#8a98a6", 3],
  ["#3a5444", "#567460", 2],
  ["#d6d2c6", "#b4b0a4", 2],
  ["#1c2028", "#2c3440", "#46505c", 3],
  ["#e8b060", "#c48a48", 2],
  ["#8a8478", "#ada596", "#c8c0ae", 3],
  ["#30586e", "#44708a", "#5e8aa4", "#7ea4b8", 4],
  ["#3a6a30", "#5a8a40", "#7aa650", 3],
  ["#b83a30", "#e0b040", "#3a6ab0", 3],
  ["#a4c4d4", 1],
]);

export const meta = {
  slug: "amsterdam-canal-bikes", name: "Amsterdam Canal Bicycles", category: "cities",
  note: "A row of tall gabled canal houses glows at golden hour while cyclists ride along the quay and a glass-roofed boat glides down the canal.",
  tags: ["canal", "bicycles", "houses", "city", "boat", "halftone", "travel", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, HOUSE = 2, QUAY = 3, WATER = 4, TREE = 5;
const BASE = 64, WTOP = 82;

export default function create() {
  const C = canvas(), { put, rect, kind } = C;
  const SX = 172, SY = 13;
  // 1. sky: blue overhead, warm toward the low sun
  for (let y = 0; y < BASE; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#7aa4cc"], [0.6, "#9cbcd8"], [1, "#e2c8a4"]], y / 40);
    const d = Math.hypot(x - SX, y - SY);
    c = mix(c, hex("#e2c8a4"), clamp(1 - d / 40) ** 2 * 0.6);
    c = mix(c, hex("#ffdc9a"), clamp(1 - d / 14) ** 2 * 0.5);
    if (d < 3.8) c = d < 2.6 ? hex("#fff4d6") : hex("#ffdc9a");
    put(x, y, c, SKY);
  }
  // 2. the houses: tall and narrow, each with its own gable and colour
  const FAC = [["#a8503c", "#7e3a2c"], ["#d4aa68", "#b8884a"], ["#5e3a2c", "#5e3a2c"], ["#ddd0b2", "#c4b496"], ["#6a7a8a", "#4a5868"], ["#c46a4c", "#a8503c"], ["#567460", "#3a5444"], ["#7a4e3a", "#5e3a2c"]];
  const houses = [
    [0, 17, 30, "step"], [17, 19, 24, "neck"], [36, 16, 34, "bell"], [52, 21, 27, "step"], [73, 15, 22, "spout"], [88, 20, 30, "neck"],
    [108, 18, 26, "bell"], [126, 22, 33, "step"], [148, 15, 38, "spout"], [163, 19, 31, "neck"], [182, 14, 26, "step"],
  ];
  const WHITE = hex("#d6d2c6"), WHITE2 = hex("#b4b0a4"), GLASS = hex("#2c3440"), LIT = hex("#e8b060");
  houses.forEach(([x0, w, top, type], hi) => {
    const [fc, sc] = FAC[hi % FAC.length], face = hex(fc), side = hex(sc);
    const cx = x0 + w / 2;
    // gable outline: width of the facade at each row above `top`
    const gw = (y) => {
      const up = top - y; // rows above the cornice line
      if (up < 0) return w / 2;
      if (type === "step") { const step = Math.floor(up / 3); return w / 2 - step * (w / 8) - 0.5; }
      if (type === "neck") return up < 3 ? w / 2 - up * 1.6 : w / 4.5;
      if (type === "bell") return (w / 2) * Math.sqrt(clamp(1 - (up / 11) ** 2)) * (up < 2 ? 1 : 0.9);
      return Math.max(1.5, w / 2 - up * 1.1); // spout
    };
    const gh = type === "step" ? 12 : type === "neck" ? 11 : type === "bell" ? 10 : 7;
    for (let y = top - gh; y < BASE; y++) {
      const half = gw(y);
      if (half <= 0.5) continue;
      for (let x = Math.ceil(cx - half); x < cx + half; x++) {
        if (x < 0 || x >= W) continue;
        let c = x > cx + half - 2 ? side : face;
        if (fc === "#a8503c" || fc === "#c46a4c" || fc === "#7a4e3a") if ((y + (x >> 1)) % 3 === 0 && (x * 7 + y) % 5 === 0) c = mix(c, side, 0.6);
        put(x, y, c, HOUSE);
      }
      // white trim along gable edges and cornice
      if (y < top) { put(Math.ceil(cx - half), y, WHITE2, HOUSE); put(Math.ceil(cx + half) - 1, y, WHITE2, HOUSE); }
    }
    for (let x = x0; x < x0 + w; x++) put(x, top, WHITE, HOUSE);
    // hoist beam and a small top window in the gable
    put(Math.floor(cx), top - gh + 1, hex("#1c2028"), HOUSE);
    rect(cx - 1, top - 5, cx, top - 3, WHITE); put(Math.floor(cx) - 1 + 0, top - 4, GLASS); put(Math.floor(cx), top - 4, GLASS);
    // windows: rows of tall white-framed sashes
    const cols = w >= 19 ? 4 : w >= 16 ? 3 : 2, gap = w / cols;
    for (let fy = top + 3; fy < BASE - 9; fy += 7) for (let k = 0; k < cols; k++) {
      const wx = Math.round(x0 + gap * k + gap / 2 - 1.5);
      rect(wx, fy, wx + 2, fy + 4, WHITE);
      const lit = hash(hi * 13 + k, fy) < 0.22;
      put(wx + 1, fy + 1, lit ? LIT : GLASS); put(wx + 1, fy + 3, lit ? hex("#c48a48") : GLASS);
      put(wx, fy + 2, WHITE2); put(wx + 2, fy + 2, WHITE2);
    }
    // ground floor: door with steps, big windows
    const dx = Math.round(x0 + (hi % 2 ? w - 6 : 2));
    rect(dx, BASE - 8, dx + 3, BASE - 1, hex("#1c2028"));
    rect(dx, BASE - 9, dx + 3, BASE - 9, WHITE);
    rect(dx - 1, BASE - 1, dx + 4, BASE - 1, hex("#ada596"));
    for (let k = 0; k < 2; k++) { const wx = hi % 2 ? x0 + 2 + k * 5 : x0 + w - 11 + k * 5; rect(wx, BASE - 7, wx + 3, BASE - 3, WHITE); rect(wx + 1, BASE - 6, wx + 2, BASE - 4, hash(hi, k) < 0.3 ? LIT : GLASS); }
  });
  // 3. quay: cobbles, then the canal wall with a railing
  for (let y = BASE; y < WTOP; y++) for (let x = 0; x < W; x++) {
    let c = mix(hex("#ada596"), hex("#c8c0ae"), (y - BASE) / (WTOP - BASE));
    if ((x + (y % 2) * 2) % 4 === 0) c = mix(c, hex("#8a8478"), 0.5);
    if (y >= WTOP - 2) c = y === WTOP - 1 ? hex("#5e3a2c") : hex("#7a4e3a");
    put(x, y, c, QUAY);
  }
  // parked bicycles leaning along the railing
  const parked = [];
  for (const cx of [20, 150]) for (let k = 0; k < 4; k++) parked.push(cx + k * 4);
  // 4. elm trees along the quay, in front of the houses
  const trees = [[30, 30], [104, 26], [150, 32]];
  for (const [tx, r] of trees) {
    for (let y = 40; y < BASE + 2; y++) { put(tx, y, hex("#3a2c26"), TREE); put(tx + 1, y, hex("#5e3a2c"), TREE); }
  }
  // 5. water: the houses mirrored, darker and bluer, broken into ripple bands
  const sky = C.rgb.slice();
  for (let y = WTOP; y < H; y++) for (let x = 0; x < W; x++) {
    const near = (y - WTOP) / (H - WTOP);
    const sy = clamp(2 * WTOP - y - 2 + Math.round((noise2(x / 6, y / 1.5, 3) - 0.5) * 2), 0, WTOP - 1);
    const i = (Math.floor(sy) * W + x) * 3;
    let c = [sky[i], sky[i + 1], sky[i + 2]];
    c = mix(mix(c, hex("#7ea4b8"), 0.45), hex("#5e8aa4"), 0.15 + near * 0.3);
    if (noise2(x / 9, y * 0.9, 21) > 0.68) c = mix(c, hex("#7ea4b8"), 0.35);
    put(x, y, c, WATER);
  }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const DARK = hex("#1c2028"), DARK2 = hex("#2c3440"), LEAF = [hex("#3a6a30"), hex("#5a8a40"), hex("#7aa650")];
  const COATS = [hex("#b83a30"), hex("#e0b040"), hex("#3a6ab0"), hex("#567460")];
  const wheel = (cx, cy, rot) => {
    for (let a = 0; a < 12; a++) { const an = (a / 12) * Math.PI * 2; put(Math.round(cx + Math.cos(an) * 2.6), Math.round(cy + Math.sin(an) * 2.6), DARK); }
    put(Math.round(cx + Math.cos(rot) * 1.3), Math.round(cy + Math.sin(rot) * 1.3), DARK2);
  };
  const bike = (x, y, dir, coat, t, ph, rider) => {
    // y = ground line; wheels centred 3 up; frame between
    const X = (d) => x + dir * d, rot = (t * 6 * dir) + ph;
    wheel(X(0), y - 3, rot); wheel(X(9), y - 3, rot);
    for (let d = 1; d < 9; d++) put(X(d), y - 4 - (d > 3 && d < 7 ? 1 : 0), DARK);
    put(X(3), y - 6, DARK); put(X(8), y - 6, DARK); put(X(8), y - 7, DARK); put(X(9), y - 7, DARK);
    if (!rider) return;
    // rider: legs pedalling, coat, head
    const p = Math.sin(t * 6 + ph);
    put(X(4 + Math.round(p)), y - 4, DARK2); put(X(4), y - 5 + (p > 0 ? 0 : 1), DARK2); put(X(3), y - 7, DARK2); put(X(4), y - 6, DARK2);
    for (let k = 0; k < 6; k++) { put(X(3 + (k > 3 ? 1 : 0)), y - 8 - k, coat); put(X(4 + (k > 3 ? 1 : 0)), y - 8 - k, coat); }
    for (let k = 0; k < 3; k++) put(X(5 + k), y - 11 + (k >> 1), coat);
    put(X(4), y - 14, hex("#c4b496")); put(X(5), y - 14, hex("#c4b496")); put(X(4), y - 15, DARK); put(X(5), y - 15, DARK);
    put(X(4), y - 13, hex("#c4b496"));
  };
  const riders = [
    { sp: 7, ph: 0, dir: 1, y: 79, c: 0 }, { sp: 5.5, ph: 90, dir: -1, y: 77, c: 1 }, { sp: 8.5, ph: 160, dir: 1, y: 80, c: 2 }, { sp: 6, ph: 40, dir: -1, y: 78, c: 3 },
  ];

  return (t) => {
    out.set(base);
    // the boat: a long glass-roofed canal boat gliding left, with its wake
    const BL = 50, bx = W + 20 - ((t * 4.5 + 110) % (W + BL + 40)), by = 98;
    for (let k = 0; k < 70; k++) {
      const x = Math.floor(bx + BL + k), spread = Math.floor(k / 12);
      if (x < 0 || x >= W) continue;
      C.add(x, by + 1 + spread, hex("#a4c4d4"), 0.7 - k / 100);
      C.add(x, by - 4 - spread, hex("#a4c4d4"), 0.5 - k / 140);
    }
    for (let x = 0; x < BL; x++) {
      const px = bx + x, taper = x < 6 ? 6 - x : 0;
      for (let y = by - 2 + Math.floor(taper / 3); y <= by + 1; y++) put(px, y, y === by - 2 ? hex("#d6d2c6") : hex("#2c3440"));
      if (x > 4 && x < BL - 3) {
        put(px, by - 3, hex("#46505c"));
        put(px, by - 4, (x % 4) === 0 ? hex("#46505c") : hex("#8a98a6"));
        put(px, by - 5, (x % 4) === 0 ? hex("#46505c") : hex("#a4c4d4"));
        if (x > 6 && x < BL - 5) put(px, by - 6, hex("#6a7a8a"));
      }
    }
    // parked bikes on the quay edge
    for (const px of parked) bike(px, 81, 1, null, 0, px, false);
    // cyclists riding both ways along the quay
    for (const r of riders) {
      const span = W + 40, p = ((t * r.sp + r.ph) % span + span) % span;
      const x = r.dir > 0 ? p - 20 : W + 20 - p;
      bike(Math.round(x), r.y, r.dir, COATS[r.c], t, r.ph, true);
    }
    // elm crowns over the quay, leaves moving in the breeze
    for (const [tx, r] of trees) for (let y = 24; y < 52; y++) for (let x = tx - r / 2 - 6; x < tx + r / 2 + 6; x++) {
      const sway = Math.sin(t * 0.8 + tx) * 1.2 * (52 - y) / 28;
      const dx = (x - tx - sway) / (r / 2 + 2), dy = (y - 38) / 13;
      const n = fbm(x / 4 + tx, y / 4, 3, 5);
      if (dx * dx + dy * dy < 0.75 + (n - 0.5) * 1.1) put(x, y, LEAF[n > 0.6 ? 2 : n > 0.45 ? 1 : 0]);
    }
    return enc(out);
  };
}
