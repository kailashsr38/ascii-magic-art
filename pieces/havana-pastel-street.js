/* havana-pastel-street: pastel colonial facades with old cars cruising past, hand-built picture scene. Static: sky, facades, balconies, arcade, road. Per frame: laundry swaying and cars driving on two lanes. */
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
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; if (L !== undefined) layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  return { rgb, layer, put, blend };
}
// Per frame: a working copy, a layer-aware blend, and the conversion to text.
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
  const add = (x, y, c, a = 1, upTo = 255) => {
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

const PAL = buildPal([
  ["#4a7ab4", "#6a98c8", "#94b8d8", "#b8d0e0", 8],
  ["#fff6e0", "#ffe8b8", 2],
  ["#c8848c", "#e0a0a8", 2], ["#5aa8a0", "#7cc4bc", 2], ["#d0b066", "#e8cc80", 2],
  ["#88b886", "#a8d4a0", 2], ["#9a8cc0", "#b8a8d8", 2], ["#d89a72", "#f0b890", 2],
  ["#c8bca8", "#a89e8e", 2],
  ["#1c1c22", "#2c2c34", "#3e3a40", 3],
  ["#2e6a5a", "#6a4430", 2],
  ["#5e5e66", "#76767c", "#8e8e94", 3],
  ["#a8a094", "#c4baa8", 2],
  ["#4ac0cc", "#f27a68", "#f0a0b4", "#f0cc50", "#98d8b0", 5],
  ["#7a98b0", 1],
  ["#d4ccbc", "#4a6aa8", "#c84a3c", 3],
]);

export const meta = {
  slug: "havana-pastel-street", name: "Havana Pastel Cruisers", category: "cities",
  note: "Old rounded cars cruise past a row of pastel colonial facades with arcades and iron balconies, while laundry sways on the lines in the afternoon breeze.",
  tags: ["havana", "cuba", "street", "vintage-cars", "pastel", "travel", "city", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, FACADE = 1, WALK = 2, ROAD = 3;
const WALK_Y = 74, ROAD_Y = 80;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const SUN = [176, 9], SUNR = 4.5;
  // 1. afternoon sky
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#4a7ab4"], [0.5, "#6a98c8"], [0.85, "#94b8d8"], [1, "#b8d0e0"]], y / 32);
    c = mix(c, hex("#b8d0e0"), clamp(1 - Math.hypot(x - SUN[0], y - SUN[1]) / 26) * 0.7);
    put(x, y, c, SKY);
  }
  // 2. the row of facades: arcade below, two floors of shuttered windows and iron balconies above
  const B = [[0, 31, 20, ["#c8848c", "#e0a0a8"], 0], [31, 66, 13, ["#5aa8a0", "#7cc4bc"], 1], [66, 99, 23, ["#d0b066", "#e8cc80"], 0],
    [99, 128, 16, ["#9a8cc0", "#b8a8d8"], 1], [128, 162, 21, ["#88b886", "#a8d4a0"], 0], [162, 192, 15, ["#d89a72", "#f0b890"], 1]];
  const TRIM = hex("#c8bca8"), TRIM2 = hex("#a89e8e"), DARK = hex("#2c2c34"), DARK2 = hex("#1c1c22");
  const balconies = [];
  for (const [x0, x1, top, [c0, c1], sh] of B) {
    const w = x1 - x0, nWin = Math.max(2, Math.round(w / 15)), shut = hex(sh ? "#6a4430" : "#2e6a5a");
    for (let y = top; y < WALK_Y; y++) for (let x = x0; x < x1; x++) {
      const n = fbm(x / 4, y / 4, 3, x0), stain = fbm(x / 9, y / 14, 2, x0 + 3);
      let c = mix(hex(c0), hex(c1), clamp(0.75 - n * 0.6 + (y - top) / 200));
      if (stain > 0.62) c = mix(c, hex("#a89e8e"), 0.35);
      if (y < top + 3) c = y === top + 2 ? TRIM2 : TRIM;                       // cornice
      if (y === 40 || y === 56) c = TRIM;                                      // floor bands
      if (x === x0) c = mix(c, DARK, 0.5);                                     // seam between houses
      put(x, y, c, FACADE);
    }
    // parapet balusters on the taller roofs
    if (top < 18) for (let x = x0 + 1; x < x1 - 1; x++) { put(x, top - 1, TRIM, FACADE); if (x % 3 === 0) { put(x, top - 2, TRIM, FACADE); put(x, top - 3, TRIM, FACADE); } }
    for (let x = x0 + 1; x < x1 - 1; x++) put(x, top - 4, top < 18 ? TRIM2 : hex("#6a98c8"), top < 18 ? FACADE : SKY);
    // windows on two floors
    for (const [fy0, fy1] of [[top + 6, 39], [43, 55]]) {
      if (fy1 - fy0 < 6) continue;
      for (let k = 0; k < nWin; k++) {
        const cx = Math.round(x0 + (k + 0.5) * (w / nWin)), ww = 2;
        for (let y = fy0; y < fy1 - 1; y++) for (let x = Math.round(cx - ww); x <= cx + ww; x++) {
          const arch = y - fy0 < 2 && Math.abs(x - cx) > ww - (y - fy0) * 1.2;
          if (arch) continue;
          put(x, y, y === fy0 && Math.abs(x - cx) < 1 ? TRIM2 : DARK, FACADE);
        }
        for (let y = fy0 + 1; y < fy1 - 1; y++) { put(cx - ww - 1, y, shut, FACADE); put(cx + ww + 1, y, shut, FACADE); }
        // iron balcony: slab and railing
        const by = fy1 - 1;
        for (let x = Math.round(cx - ww - 2); x <= cx + ww + 2; x++) {
          put(x, by, TRIM, FACADE);
          put(x, by - 3, DARK2, FACADE);
          if (x % 2 === 0) { put(x, by - 1, DARK2, FACADE); put(x, by - 2, DARK2, FACADE); }
        }
        balconies.push([cx, by - 3, w / nWin, sh]);
      }
    }
    // ground floor arcade
    const nArch = Math.max(2, Math.round(w / 10));
    for (let k = 0; k < nArch; k++) {
      const ax0 = x0 + k * (w / nArch) + 2, ax1 = x0 + (k + 1) * (w / nArch) - 1, acx = (ax0 + ax1) / 2, r = (ax1 - ax0) / 2;
      for (let y = 59; y < WALK_Y; y++) for (let x = Math.ceil(ax0); x < ax1; x++) {
        const dy = 59 + r * 0.8 - y;
        if (dy > 0 && ((x - acx) / r) ** 2 + (dy / (r * 0.8)) ** 2 > 1) continue;
        put(x, y, y > 66 && (x + y) % 7 === 0 ? hex("#3e3a40") : DARK2, FACADE);
      }
    }
  }
  // 3. sidewalk and road
  for (let y = WALK_Y; y < H; y++) for (let x = 0; x < W; x++) {
    let c, L = WALK;
    if (y < ROAD_Y - 1) c = mix(hex("#c4baa8"), hex("#a8a094"), (y - WALK_Y) / 5 + (x % 9 === 0 ? 0.4 : 0));
    else if (y === ROAD_Y - 1) c = hex("#76767c");
    else { L = ROAD; c = mix(hex("#8e8e94"), hex("#76767c"), (y - ROAD_Y) / 28 + (noise2(x / 3, y / 2, 5) - 0.5) * 0.4); if (y === 94 && Math.floor(x / 8) % 2 === 0) c = hex("#c4baa8"); }
    put(x, y, c, L);
  }
  // shade cast by the facades onto the walk
  for (let y = WALK_Y; y < WALK_Y + 3; y++) for (let x = 0; x < W; x++) blend(x, y, hex("#76767c"), 0.4);
  // the sun: the one bright point
  for (let y = SUN[1] - 6; y <= SUN[1] + 6; y++) for (let x = SUN[0] - 6; x <= SUN[0] + 6; x++) {
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SUNR && layer[y * W + x] === SKY) put(x, y, d < SUNR - 1.2 ? hex("#fff6e0") : hex("#ffe8b8"));
  }

  const F = makeFrame(rgb, layer, PAL);
  const LIN = ["#d4ccbc", "#4a6aa8", "#c84a3c", "#e8c040", "#d4ccbc", "#e890a8"].map(hex);
  // laundry lines strung under some balconies
  const lines = balconies.filter((_, i) => hash(i, 4) > 0.55).map(([cx, y, span], i) => ({ x0: cx - span * 0.45, x1: cx + span * 0.45, y: y + 5, n: 3 + (i % 2), i }));
  const ROPE = hex("#3e3a40"), TYRE = hex("#1c1c22"), RIM = hex("#c8bca8"), GLASS = hex("#7a98b0");
  const CARS = [
    { lane: 0, len: 34, col: "#4ac0cc", roof: "#c8bca8", speed: 16, ph: 0.1, fin: 1 },
    { lane: 0, len: 32, col: "#f0a0b4", roof: "#f0a0b4", speed: 16, ph: 0.62, fin: 0 },
    { lane: 1, len: 42, col: "#f27a68", roof: "#c8bca8", speed: 22, ph: 0.3, fin: 1 },
    { lane: 1, len: 40, col: "#f0cc50", roof: "#f0cc50", speed: 22, ph: 0.78, fin: 0 },
    { lane: 1, len: 38, col: "#98d8b0", roof: "#98d8b0", speed: 22, ph: 0.05, fin: 1 },
  ];
  const car = (x0, base, len, col, roof, fin, dir) => {
    const h = len * 0.34, c0 = hex(col), cr = hex(roof);
    // soft shadow
    for (let x = Math.floor(x0 - 2); x < x0 + len + 2; x++) F.add(x, base + 1, hex("#1c1c22"), 0.45, ROAD);
    for (let i = 0; i <= len; i++) {
      const u = i / len, x = Math.round(x0 + (dir > 0 ? i : len - i));
      // body profile: rounded nose and tail, fender humps, optional fins at the back
      const nose = Math.min(1, Math.min(u, 1 - u) * 7);
      let top = base - h * 0.5 * Math.sqrt(nose) - (Math.abs(u - 0.82) < 0.1 || Math.abs(u - 0.2) < 0.1 ? 0.8 : 0);
      if (fin && u < 0.1) top -= 1.5 * (1 - u * 10) + 0.5;
      for (let y = Math.floor(top); y < base - 1; y++) F.add(x, y, mix(c0, hex("#3e3a40"), clamp((y - top) / (h * 0.6)) * 0.18));
      F.add(x, base - 1, u < 0.04 || u > 0.96 ? RIM : hex("#3e3a40"));
      if (Math.abs(base - h * 0.32 - 0) && u > 0.03 && u < 0.97) F.add(x, Math.round(base - h * 0.28), RIM, 0.7);
      // cabin
      if (u > 0.3 && u < 0.72) {
        const cu = (u - 0.3) / 0.42, slope = Math.min(1, Math.min(cu, 1 - cu) * 5);
        const ct = base - h * 0.5 - h * 0.5 * slope;
        for (let y = Math.floor(ct); y < base - h * 0.5; y++) {
          const glass = y > ct + 0.6 && cu > 0.08 && cu < 0.92 && Math.abs(cu - 0.5) > 0.04;
          F.add(x, y, glass ? GLASS : cr);
        }
      }
    }
    // wheels with white walls
    for (const wu of [0.2, 0.8]) {
      const wx = x0 + (dir > 0 ? wu : 1 - wu) * len, wy = base - 1, r = h * 0.27;
      for (let y = Math.floor(wy - r); y <= wy + r; y++) for (let x = Math.floor(wx - r); x <= wx + r; x++) {
        const d = Math.hypot(x - wx, y - wy) / r;
        if (d <= 1) F.add(x, y, d < 0.3 ? RIM : d > 0.55 && d < 0.75 ? hex("#a89e8e") : TYRE);
      }
    }
    // headlamp
    F.add(dir > 0 ? x0 + len : x0, base - h * 0.32, hex("#ffe8b8"), 0.8);
  };
  return (t) => {
    F.begin();
    for (const L of lines) {
      for (let x = Math.floor(L.x0); x <= L.x1; x++) { const u = (x - L.x0) / (L.x1 - L.x0); F.add(x, L.y + Math.sin(u * Math.PI) * 1.5, ROPE); }
      for (let k = 0; k < L.n; k++) {
        const u = (k + 0.6) / (L.n + 0.2), x = lerp(L.x0, L.x1, u), y = L.y + Math.sin(u * Math.PI) * 1.5;
        const w = 2 + (k + L.i) % 2, h = 3 + ((k + L.i) % 3), col = LIN[(k + L.i * 2) % LIN.length];
        const sway = Math.sin(t * 1.7 + k * 1.1 + L.i * 0.7) * 1.4;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) F.add(x + i + sway * (j / h), y + 1 + j, mix(col, hex("#3e3a40"), j / (h * 3)));
      }
    }
    // cars on two lanes, far lane to the right, near lane to the left
    for (const c of CARS) {
      const span = W + c.len + 60, p = ((c.ph * span + t * c.speed) % span + span) % span;
      if (c.lane === 0) car(p - c.len - 30, 91, c.len, c.col, c.roof, c.fin, 1);
      else car(W + 30 - p, 105, c.len, c.col, c.roof, c.fin, -1);
    }
    return F.finish();
  };
}
