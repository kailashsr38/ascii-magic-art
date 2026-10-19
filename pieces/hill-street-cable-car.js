/* hill-street-cable-car: a cable car climbing a steep street of painted houses with a red suspension bridge over the bay beyond, hand-built picture scene. */
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
  ["#6a9cd0", "#8ab4dc", "#b4cce0", "#d4dcdc", 7],
  ["#fff6dc", "#ffe4a8", 2],
  ["#3a6a98", "#5a8ab4", "#7aa4c4", 3],
  ["#8a9a8a", "#a8ae94", 2],
  ["#c8482c", "#a03a24", "#e06a48", 3],
  ["#e8d8a8", "#b8d4c0", "#e8b8b8", "#a8c0dc", "#d8d4cc", 5],
  ["#b4a888", "#90a498", "#b89498", "#8498b4", "#aaa49c", 5],
  ["#3a3a44", "#5a5a64", "#2a2a30", 3],
  ["#a8a4a8", "#8a8890", "#c4c0bc", 3],
  ["#e05a44", "#e8d8b0", "#a83a2c", "#c8a050", 4],
  ["#d8dce0", "#c4cad0", 2],
]);

export const meta = {
  slug: "hill-street-cable-car", name: "Hill Street Cable Car", category: "cities",
  note: "A cable car clanks up a steep street lined with painted houses while fog rolls under a red suspension bridge across the bay below.",
  tags: ["city", "cable-car", "street", "bridge", "bay", "fog", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, FAR = 2, BAY = 3, BRIDGE = 4, HOUSE = 5, STREET = 6;
const HZ = 44, FAR_Y = 60, LX = 84, RX = 108; // bay line, far end of the street, inner house edges

export default function create() {
  const C = canvas(), { put, rect, kind, rgb } = C;
  const SX = 168, SY = 12;
  // 1. sky and the far hills across the bay
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#6a9cd0"], [0.5, "#8ab4dc"], [0.85, "#b4cce0"], [1, "#d4dcdc"]], y / HZ);
    const d = Math.hypot(x - SX, y - SY);
    c = mix(c, hex("#ffe4a8"), clamp(1 - d / 16) ** 2 * 0.45);
    if (d < 3.6) c = d < 2.5 ? hex("#fff6dc") : hex("#ffe4a8");
    put(x, y, c, SKY);
  }
  for (let x = 0; x < W; x++) { const top = 36 - 6 * fbm(x / 26, 1, 3, 2) - 3 * Math.sin(x / 30); for (let y = Math.floor(top); y < HZ; y++) put(x, y, mix(hex("#a8ae94"), hex("#8a9a8a"), (y - top) / 8), FAR); }
  // 2. the bay
  for (let y = HZ; y < FAR_Y + 4; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#7aa4c4"], [0.6, "#5a8ab4"], [1, "#4a7aa8"]], (y - HZ) / 18);
    if (noise2(x / 8, y * 1.2, 5) > 0.7) c = mix(c, hex("#7aa4c4"), 0.4);
    put(x, y, c, BAY);
  }
  // 3. the red suspension bridge: two towers, the main cable, hangers and the deck
  const T1 = 80, T2 = 114, TT = 20, DECK = 41;
  const cable = (x) => { if (x < T1) return lerp(DECK - 1, TT + 1, (x - 40) / (T1 - 40)); if (x > T2) return lerp(TT + 1, DECK - 1, (x - T2) / (152 - T2)); const u = (x - T1) / (T2 - T1); return TT + 1 + (DECK - 3 - TT) * 4 * u * (1 - u); };
  for (let x = 40; x <= 152; x++) {
    const cy = Math.round(cable(x));
    put(x, cy, hex("#c8482c"), BRIDGE);
    if (x % 3 === 0) for (let y = cy + 1; y < DECK; y++) put(x, y, hex("#e06a48"), BRIDGE);
    put(x, DECK, hex("#a03a24"), BRIDGE); put(x, DECK + 1, hex("#c8482c"), BRIDGE);
  }
  for (const tx of [T1, T2]) for (let y = TT; y < HZ + 4; y++) {
    for (const lx of [tx - 2, tx + 2]) { put(lx, y, hex("#c8482c"), BRIDGE); put(lx + 1, y, hex("#a03a24"), BRIDGE); }
    if ((y - TT) % 6 === 0 || y === TT) for (let x = tx - 2; x <= tx + 3; x++) put(x, y, hex("#e06a48"), BRIDGE);
  }
  // 4. the houses, stepping down the hill on both sides of the street
  const FAC = ["#e8d8a8", "#b8d4c0", "#e8b8b8", "#a8c0dc", "#d8d4cc"], SH = ["#b4a888", "#90a498", "#b89498", "#8498b4", "#aaa49c"];
  const edgesL = [-6, 20, 40, 54, 64, 72, 78, LX], edgesR = [RX, 114, 120, 128, 138, 152, 172, 198];
  const baseL = (x) => lerp(104, FAR_Y, (x + 6) / (LX + 6)), baseR = (x) => lerp(FAR_Y, 104, (x - RX) / (198 - RX));
  const side = (edges, baseF, topAt, inner) => {
    for (let k = 0; k < edges.length - 1; k++) {
      const x0 = edges[k], x1 = edges[k + 1], w = x1 - x0, fi = (k + (inner ? 0 : 2)) % 5;
      const top = Math.round(topAt(inner ? x0 : x1)); // flat cornice, stepping toward the bay
      const fc = hex(FAC[fi]), sc = hex(SH[fi]);
      for (let x = x0; x < x1; x++) {
        const b = Math.round(baseF(x)), u = (x - x0) / w;
        for (let y = top; y < b; y++) {
          const v = (y - top) / Math.max(1, b - top);
          let c = fc;
          if (y < top + Math.max(1, w * 0.08)) c = hex("#d8d4cc"); // cornice
          // bay windows: two columns of tall windows per house, floors scaled by width
          const floors = 3, fv = (v * floors) % 1, inBay = (u > 0.18 && u < 0.42) || (u > 0.58 && u < 0.82);
          if (inBay && fv > 0.25 && fv < 0.72 && v < 0.88) c = (x + y) % 7 === 0 ? hex("#5a5a64") : hex("#3a3a44");
          if (u < 0.06 || u > 0.94) c = sc;
          if (v > 0.9 && u > 0.4 && u < 0.6) c = hex("#2a2a30"); // door
          put(x, y, c, HOUSE);
        }
      }
    }
  };
  side(edgesL, baseL, (x) => lerp(14, 48, (x + 6) / (LX + 6)), true);
  side(edgesR, baseR, (x) => lerp(48, 14, (x - RX) / (198 - RX)), false);
  // 5. the street: tilted down toward the bay, sidewalks, rails converging
  const roadL = (y) => lerp(LX + 2, 40, (y - FAR_Y) / (H - FAR_Y)), roadR = (y) => lerp(RX - 2, 152, (y - FAR_Y) / (H - FAR_Y));
  for (let y = FAR_Y; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (kind[i] === HOUSE && y < (x < 96 ? baseL(x) : baseR(x))) continue;
    const l = roadL(y), r = roadR(y), v = (y - FAR_Y) / (H - FAR_Y);
    let c;
    if (x < l || x > r) c = hex("#c4c0bc"); // sidewalk
    else {
      c = mix(hex("#c4c0bc"), hex("#a8a4a8"), v * 0.7);
      if ((Math.floor((y - FAR_Y) ** 1.25) % 6) === 0) c = mix(c, hex("#8a8890"), 0.6); // cross ties of the cable line
      const u = (x - l) / (r - l);
      for (const rail of [0.2, 0.32, 0.68, 0.8]) if (Math.abs(u - rail) * (r - l) < 0.6) c = hex("#5a5a64");
      for (const slot of [0.26, 0.74]) if (Math.abs(u - slot) * (r - l) < 0.5) c = hex("#3a3a44");
    }
    if (Math.abs(x - l) < 0.7 || Math.abs(x - r) < 0.7) c = hex("#8a8890");
    put(x, y, c, STREET);
  }

  const base = rgb.slice(), out = rgb, enc = encoder(PAL);
  const RED = hex("#e05a44"), CREAM = hex("#e8d8b0"), MAROON = hex("#a83a2c"), GOLD = hex("#c8a050"), WIN = hex("#3a3a44"), DK = hex("#2a2a30");
  const FOG = hex("#d8dce0"), FOG2 = hex("#c4cad0");
  const fr = (x0, y0, x1, y1, c) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) put(x, y, c); };
  // a cable car on the street: its bottom centre at (cx, by), scaled by s
  const car = (cx, by, s, t, facing) => {
    const w = 30 * s, h = 24 * s, x0 = cx - w / 2, x1 = cx + w / 2, y0 = by - h;
    fr(x0 + s, y0 - 2 * s, x1 - s, y0, MAROON); // roof
    fr(x0, y0 + 1, x1, by - 11 * s, CREAM); // upper body
    fr(x0, by - 11 * s, x1, by - 2 * s, RED); // lower panel
    fr(x0, by - 4 * s, x1, by - 3.2 * s, GOLD);
    // windows with riders, open running boards
    const nw = 4;
    for (let k = 0; k < nw; k++) {
      const wx0 = x0 + 2.5 * s + k * ((w - 4 * s) / nw), wx1 = wx0 + (w - 4 * s) / nw - 3 * s;
      fr(wx0, y0 + 4 * s, wx1, by - 13 * s, WIN);
      const hx = (wx0 + wx1) / 2;
      if (s > 0.35 && (k + facing) % 3 !== 0) fr(hx - s, by - 16 * s, hx + s, by - 13 * s, hex("#c8a050"));
    }
    fr(x0 + 2 * s, y0 + 1 + s, x1 - 2 * s, y0 + 1 + 1.6 * s, GOLD); // destination board
    fr(x0 - s, by - 2 * s, x1 + s, by - s, DK); // running board
    if (s > 0.3) { fr(x0 + 3 * s, by - s, x0 + 6 * s, by, DK); fr(x1 - 6 * s, by - s, x1 - 3 * s, by, DK); }
    // a rider hanging off the side
    if (s > 0.4) fr(x1 + 0.5 * s, by - 14 * s, x1 + 2 * s, by - 3 * s, DK);
  };
  const gulls = [[0, 10, 0], [7, 13, 1.3], [-6, 15, 2.1]];

  return (t) => {
    out.set(base);
    // fog rolling in under the bridge and over the far hills
    for (let y = 24; y < FAR_Y + 2; y++) {
      const env = clamp(1 - Math.abs(y - 42) / 14);
      for (let x = 0; x < W; x++) {
        const k = kind[y * W + x];
        if (k !== SKY && k !== FAR && k !== BAY && k !== BRIDGE) continue;
        const n = fbm(x / 24 - t * 0.1, y / 4, 3, 17);
        C.add(x, y, n > 0.58 ? FOG : FOG2, clamp((n - 0.4) * 2.6) * env * 0.85);
      }
    }
    // one car heading down, away from us, on the left track; one climbing toward us on the right
    const P = 20, pa = ((t + 10) % P) / P, pb = (t % P) / P;
    const along = (p, rail) => { const y = lerp(FAR_Y + 1, H + 22, p ** 1.6); const v = (y - FAR_Y) / (H - FAR_Y); const l = lerp(LX + 2, 40, v), r = lerp(RX - 2, 152, v); return [lerp(l, r, rail), y, 0.1 + v * 0.62]; };
    { const [x, y, s] = along(1 - pa, 0.26); car(x, y, s, t, 0); }
    { const [x, y, s] = along(pb, 0.74); car(x, y, s, t, 1); }
    // gulls over the bay
    const gx = ((t * 5) % (W + 60)) - 30;
    for (const [dx, gy, ph] of gulls) {
      const x = Math.round(gx + dx), y = Math.round(gy + Math.sin(t * 0.8 + ph) * 2), up = Math.sin(t * 7 + ph * 3) > 0;
      put(x, y, hex("#5a5a64")); put(x - 1, y - (up ? 1 : 0), hex("#5a5a64")); put(x + 1, y - (up ? 1 : 0), hex("#5a5a64"));
    }
    return enc(out);
  };
}
