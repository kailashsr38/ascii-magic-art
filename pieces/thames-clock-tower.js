/* thames-clock-tower: London's gothic clock tower and riverside parliament at dusk, hand-built.
 * A static scene (dusk sky, the floodlit clock tower with its lit face and spire, the long gothic
 * front with pinnacles and the great square tower, the green bridge with its arches and lamps,
 * the river with the golden reflection) is painted once; each frame adds drifting cloud, a red
 * double-decker bus crossing the bridge, a tour boat and a small launch, and birds. */
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
  ["#3a4a9a", "#5a64ae", "#8070b4", "#a880b0", "#d08ea0", "#eca490", "#f6c090", 14],
  ["#fff4d0", "#e8d8a8", 2],
  ["#f0c47a", "#d8a868", "#b88a58", "#94704a", "#6a5040", "#4a3832", 6],
  ["#3a6e5a", "#5a9078", "#78ae94", 3],
  ["#2e3a74", "#3a4682", "#4a5290", "#605e9c", "#7a6aa4", 5],
  ["#ff4a3a", "#b82a26", "#2a1a1a", 3],
  ["#c0b8c0", "#9890a8", 2],
  ["#c890a8", "#e8a8a0", 2],
  ["#141428", 1],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "thames-clock-tower", name: "Thames Clock Tower", category: "cities",
  note: "London's floodlit clock tower and gothic riverside front glow at dusk, as a red double-decker bus crosses the bridge and boats pass on the river below.",
  tags: ["london", "england", "dusk", "clock-tower", "bus", "river", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, BLD = 1, WATER = 2, BRIDGE = 3;
const HZ = 79;
const deckY = (x) => 99 - (x + 2) * 20 / 72;

export default function create() {
  const { rgb, layer, put, get, blend } = makeCanvas();
  const S = ["#f0c47a", "#d8a868", "#b88a58", "#94704a", "#6a5040", "#4a3832"].map(hex);
  // 1. dusk sky
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) put(x, y, ramp([[0, "#3a4a9a"], [0.25, "#5a64ae"], [0.45, "#8070b4"], [0.62, "#a880b0"], [0.78, "#d08ea0"], [0.9, "#eca490"], [1, "#f6c090"]], y / HZ), SKY);
  const box = (x0, y0, x1, y1, f) => { for (let y = Math.round(y0); y <= y1; y++) for (let x = Math.round(x0); x <= x1; x++) put(x, y, f(x, y), BLD); };
  // floodlit gothic stone: vertical ribs, darker on the right of each bay
  const stone = (x0, x1) => (x, y) => { const r = (x - x0) % 4; return r === 0 ? S[0] : r === 3 ? S[3] : (y % 6 === 0 ? S[3] : S[1]); };
  // 2. the long riverside front, pinnacles along the roof
  const FR = 54;
  box(64, FR, W, HZ, (x, y) => { const r = (x - 64) % 5; let c = r === 0 ? S[0] : r === 4 ? S[3] : S[1]; if ((y - FR) % 7 > 2 && (y - FR) % 7 < 5 && r > 0 && r < 4) c = S[4]; return c; });
  for (let x = 64; x < W; x += 5) for (let j = 1; j <= 4; j++) put(x, FR - j, j === 4 ? S[2] : S[0], BLD);
  for (let x = 66; x < W; x += 2) put(x, FR - 1, S[2], BLD);
  // central lantern spire
  for (let y = 36; y < FR; y++) { const w = Math.max(0, Math.round((y - 36) / 6)); for (let x = 120 - w; x <= 120 + w; x++) put(x, y, x === 120 ? S[0] : S[2], BLD); }
  // the great square tower on the right
  const VX0 = 168, VX1 = 186, VT = 18;
  box(VX0, VT, VX1, HZ, stone(VX0, VX1));
  for (let y = VT + 6; y < HZ - 4; y += 9) for (let x = VX0 + 2; x < VX1 - 1; x += 4) { put(x, y, S[5], BLD); put(x, y + 1, S[5], BLD); put(x + 1, y, S[5], BLD); put(x + 1, y + 1, S[5], BLD); }
  for (const cx of [VX0, VX0 + 6, VX1 - 6, VX1]) for (let j = 1; j <= 6; j++) { put(cx, VT - j, S[0], BLD); if (j < 3) put(cx + 1, VT - j, S[2], BLD); }
  for (let x = VX0; x <= VX1; x += 2) put(x, VT - 1, S[1], BLD);
  // 3. the clock tower
  const CX = 50, CW = 7;
  box(CX - CW, 34, CX + CW, HZ, (x, y) => { const r = (x - CX + CW) % 4; let c = r === 0 ? S[0] : r === 3 ? S[3] : S[1]; if (x > CX + CW - 2) c = S[3]; if (y % 8 === 0) c = S[2]; return c; });
  // clock stage, a little wider, with the lit face
  box(CX - CW - 1, 20, CX + CW + 1, 34, (x, y) => (x === CX - CW - 1 ? S[0] : x >= CX + CW ? S[3] : S[2]));
  const FX = CX, FY = 27, FRAD = 5.6;
  for (let y = FY - 7; y <= FY + 7; y++) for (let x = FX - 7; x <= FX + 7; x++) {
    const d = Math.hypot(x - FX, y - FY);
    if (d < FRAD) put(x, y, d > FRAD - 1.2 ? hex("#e8d8a8") : hex("#fff4d0"), BLD);
    else if (d < FRAD + 1) put(x, y, S[4], BLD);
  }
  for (let j = 0; j <= 4; j++) put(FX, FY - j, S[5], BLD); // minute hand
  for (let j = 0; j <= 3; j++) put(FX + j, FY + Math.round(j * 0.4), S[5], BLD); // hour hand
  // belfry with open arches, then the tall pointed roof with corner pinnacles
  box(CX - CW, 12, CX + CW, 19, (x, y) => (((x - CX + CW) % 4 === 2 || (x - CX + CW) % 4 === 1) && y > 13 && y < 19 ? S[4] : S[0]));
  for (let x = CX - CW - 1; x <= CX + CW + 1; x++) { put(x, 11, S[2], BLD); put(x, 19, S[3], BLD); }
  for (let y = 0; y < 11; y++) { const w = Math.round((y / 11) * (CW - 1)); for (let x = CX - w; x <= CX + w; x++) put(x, y, x < CX ? S[1] : S[3], BLD); }
  for (const px of [CX - CW, CX + CW]) for (let j = 0; j < 5; j++) put(px, 10 - j, S[1], BLD);
  // 4. the river: the golden front mirrored, darkened and broken
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HZ) / (H - HZ);
    let c = ramp([[0, "#7a6aa4"], [0.2, "#605e9c"], [0.5, "#4a5290"], [0.8, "#3a4682"], [1, "#2e3a74"]], v);
    const sy = HZ - 1 - Math.round((y - HZ) * 1.3);
    if (sy > 0 && layer[sy * W + x] === BLD && noise2(x / 4, y * 0.9, 3) > 0.32 + v * 0.3) c = mix(c, mix(get(x, sy), hex("#2e3a74"), 0.25), 0.75 - v * 0.4);
    put(x, y, c, WATER);
  }
  // embankment wall along the far bank
  for (let x = 0; x < W; x++) { put(x, HZ, hex("#4a3832"), BLD); put(x, HZ + 1, hex("#141428"), BLD); }
  // 5. the bridge: deck, parapet lamps, arches standing in the water
  const lamps = [];
  for (let x = -2; x < 70; x++) {
    const y0 = deckY(x), sc = 1.5 - x / 90;
    for (let y = Math.round(y0); y < y0 + 3 * sc + 1; y++) put(x, y, y === Math.round(y0) ? hex("#78ae94") : hex("#5a9078"), BRIDGE);
    const span = 17 * sc, pos = (x + 4) % 17, arch = Math.abs(pos - 8.5) / 8.5;
    const bot = y0 + 3 * sc + 1 + (1 - Math.sqrt(Math.max(0, 1 - arch * arch))) * 6 * sc;
    for (let y = Math.round(y0 + 3 * sc + 1); y < Math.min(H, bot + (arch > 0.85 ? 30 : 0)); y++) put(x, y, arch > 0.85 ? hex("#3a6e5a") : hex("#5a9078"), BRIDGE);
    if ((x + 4) % 9 === 0) lamps.push([x, Math.round(y0), sc]);
  }
  for (const [x, y, sc] of lamps) {
    const h = Math.round(5 * sc + 1);
    for (let j = 1; j <= h; j++) put(x, y - j, hex("#3a6e5a"), BRIDGE);
    put(x, y - h - 1, hex("#f0c47a"), BRIDGE); put(x - 1, y - h, hex("#d8a868"), BRIDGE); put(x + 1, y - h, hex("#d8a868"), BRIDGE);
  }

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const RED = hex("#ff4a3a"), RED2 = hex("#b82a26"), TYRE = hex("#2a1a1a"), WIN = hex("#e8d8a8"), BOAT = hex("#c0b8c0"), BOAT2 = hex("#9890a8"), INK = hex("#141428"), WAKE = hex("#9890a8");
  const clouds = [[0.2, 0.3, 10, 1.3, "#c890a8", 0.5], [0.65, 0.25, 28, 1.1, "#e8a8a0", 0.4], [0.95, 0.35, 42, 1.4, "#c890a8", 0.55]];
  // the bus, near and big at the left, smaller toward the tower
  const bus = (bx) => {
    const sc = 1.4 - bx / 100, y0 = deckY(bx) - 1, L = Math.round(15 * sc), Hh = Math.round(9 * sc);
    for (let x = 0; x < L; x++) for (let y = 0; y < Hh; y++) {
      const X = bx + x, Y = Math.round(y0 - y);
      let c = RED;
      if (y === 0) c = TYRE;
      else if ((y === Math.round(Hh * 0.35) || y === Math.round(Hh * 0.75)) && x > 0 && x < L - 1) c = x % 2 ? WIN : RED2;
      else if (y === Hh - 1) c = RED2;
      add(X, Y, c, 1, BRIDGE);
    }
    add(bx + 2, y0 + 1, TYRE, 1); add(bx + L - 3, y0 + 1, TYRE, 1);
  };

  return (t) => {
    F.begin();
    for (const [u, len, cy, th, col, sp] of clouds) {
      const L = len * W, cx = ((((u * W + t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3, C = hex(col);
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.1 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, C, a * 0.7, SKY);
      }
    }
    // a red double-decker crossing the bridge toward the tower, every 16 s
    const bp = (t % 16) / 16, bx = Math.round(lerp(-26, 60, bp));
    bus(bx);
    // tour boat heading downstream, a small launch heading up
    const tx = Math.round(W + 10 - ((t * 2.6 + 40) % (W + 60))), ty = 94;
    for (let k = 1; k < 24; k++) { const sp = Math.floor(k / 6); add(tx + 26 + k, ty + 1 + sp, WAKE, 0.7 - k / 36, WATER); }
    for (let x = 0; x < 28; x++) { add(tx + x, ty, INK, 1, WATER); if (x > 1 && x < 27) add(tx + x, ty - 1, BOAT2, 1, WATER); }
    for (let x = 4; x < 24; x++) { add(tx + x, ty - 2, x % 2 ? WIN : BOAT, 1, WATER); add(tx + x, ty - 3, BOAT, 1, WATER); }
    for (let x = 6; x < 20; x++) add(tx + x, ty - 4, BOAT2, 1, WATER);
    const lx = Math.round(((t * 4 + 100) % (W + 40)) - 20), ly = 104;
    for (let k = 1; k < 18; k++) add(lx - k, ly + Math.floor(k / 5), WAKE, 0.6 - k / 30, WATER);
    for (let x = 0; x < 10; x++) { add(lx + x, ly, INK, 1, WATER); if (x < 9) add(lx + x, ly - 1, RED2, 1, WATER); }
    for (let x = 2; x < 6; x++) add(lx + x, ly - 2, BOAT, 1, WATER);
    // birds crossing the sky
    const gt = (t % 20) / 20, gx = lerp(W + 10, -30, gt), gy = 30 + Math.sin(gt * 6) * 5;
    for (let k = 0; k < 5; k++) {
      const x = Math.round(gx + k * 6), y = Math.round(gy + (k % 3) * 2 + Math.sin(t + k)), up = Math.sin(t * 8 + k) > 0;
      add(x, y, INK, 1, SKY); add(x - 1, y + (up ? -1 : 0), INK, 1, SKY); add(x + 1, y + (up ? -1 : 0), INK, 1, SKY);
    }
    return F.finish();
  };
}
