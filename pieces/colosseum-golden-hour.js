/* colosseum-golden-hour: the great stone amphitheatre glowing at golden hour with scooters passing and birds overhead, hand-built picture scene. */
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
  ["#6a9ac8", "#8ab0cc", "#c8c0a8", "#e8c088", "#f4a860", 8],
  ["#fff4d0", "#ffd890", 2],
  ["#f0c888", "#e0b078", "#c89460", "#b07c50", 5],
  ["#8a5a40", "#6a4030", "#4a2c22", "#2e1c18", 4],
  ["#a07858", "#c49a70", 2],
  ["#2a3424", "#3e4a30", "#56603c", 3],
  ["#6a625c", "#a89a8a", "#c4b4a0", 3],
  ["#d84a3a", "#e8d4a8", "#3a6ab0", "#e0b040", "#40a080", 5],
  ["#1e1c22", "#3a3640", 2],
]);

export const meta = {
  slug: "colosseum-golden-hour", name: "Colosseum Golden Hour", category: "cities",
  note: "The great arched amphitheatre glows gold in the low evening sun as scooters buzz past on the road and a flock of birds wheels overhead.",
  tags: ["colosseum", "rome", "landmark", "sunset", "scooters", "halftone", "travel", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, WALL = 2, TREE = 3, ROAD = 4;
const CX = 104, GROUND = 84;

export default function create() {
  const C = canvas(), { put, rect, kind, rgb } = C;
  const SX = 15, SY = 62;
  // 1. sky: blue above, gold and amber toward the low sun on the left
  for (let y = 0; y < GROUND; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#6a9ac8"], [0.35, "#8ab0cc"], [0.6, "#c8c0a8"], [0.82, "#e8c088"], [1, "#f4a860"]], y / 78);
    const d = Math.hypot(x - SX, y - SY);
    c = mix(c, hex("#f4a860"), clamp(1 - d / 60) ** 2 * 0.55);
    c = mix(c, hex("#ffd890"), clamp(1 - d / 16) ** 2 * 0.6);
    if (d < 4.3) c = d < 3 ? hex("#fff4d0") : hex("#ffd890");
    put(x, y, c, SKY);
  }
  for (const [cy, x0, x1] of [[18, 30, 110], [26, 120, 186], [12, 140, 190]]) for (let x = x0; x < x1; x++) {
    const a = Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 0.5;
    C.add(x, cy, hex("#e8c088"), a); C.add(x, cy + 1, hex("#c8c0a8"), a * 0.7);
  }
  // distant trees and roofs along the horizon
  for (let x = 0; x < W; x++) { const top = 74 + Math.round((noise2(x / 4, 3, 2) - 0.5) * 6); for (let y = top; y < GROUND; y++) put(x, y, mix(hex("#56603c"), hex("#a07858"), 0.35), TREE); }
  // 2. the amphitheatre: an inner ring seen through the broken side, then the outer wall
  const STOREYS = [[70, GROUND], [56, 70], [42, 56], [28, 42]]; // [top, bottom], ground floor first
  const wall = (Rx, nA, topAt, lit0, lit1, sh) => {
    const dA = Math.PI / 2 / nA;
    for (let x = Math.floor(CX - Rx); x <= CX + Rx; x++) {
      const s = (x + 0.5 - CX) / Rx; if (Math.abs(s) >= 1) continue;
      const th = Math.asin(s), cs = Math.cos(th), sag = Math.round(3 * s * s);
      const f = (((th / dA) % 1) + 1) % 1, pier = f < 0.32, q = (f - 0.32) / 0.68, hw = 0.34 * dA * Rx * cs;
      const light = clamp(0.75 - s * 0.6), top = topAt(x);
      for (let y = Math.floor(top); y < GROUND + sag; y++) {
        const yy = y - sag;
        let c = mix(hex(lit1), hex(lit0), light);
        if (pier && f > 0.24) c = mix(c, hex(sh), 0.35); // shaded side of each pier
        let st = 0; while (st < 3 && yy < STOREYS[st][0]) st++;
        const [sT, sB] = STOREYS[st];
        if (yy === sT || yy === sT + 1) c = mix(hex(lit0), hex("#fff4d0"), 0.1 * light); // cornice
        if (yy === sT + 1) c = mix(c, hex(sh), 0.3);
        if (!pier && st < 3 && hw > 0.6) {
          const spring = sT + 3 + Math.max(1.5, hw), archTop = spring - Math.max(1.5, hw) * Math.sqrt(clamp(1 - (2 * q - 1) ** 2));
          if (yy > archTop && yy < sB - (st === 0 ? 0 : 1)) c = yy > sB - 4 && st > 0 ? hex("#6a4030") : mix(hex("#4a2c22"), hex("#8a5a40"), clamp(light * 0.6 + (yy > spring + 4 ? 0.2 : 0)));
        }
        if (st === 3 && !pier && q > 0.3 && q < 0.7 && yy > sT + 5 && yy < sT + 9 && Math.floor(th / dA) % 2 === 0) c = hex("#6a4030");
        put(x, y, c, WALL);
      }
    }
  };
  const jag = (x) => (noise2(x / 2.2, 7, 4) - 0.5) * 5;
  const outerTop = (x) => { const k = clamp((x - 118) / 14); return lerp(28, 50, k) + (k > 0 && k < 1 ? jag(x) * 1.5 : k >= 1 ? jag(x) * 0.6 : 0); };
  const innerTop = (x) => 32 + jag(x) * 0.8 + clamp((x - 160) / 10) * 12;
  wall(64, 9, innerTop, "#e0b078", "#c49a70", "#6a4030");
  wall(76, 10, outerTop, "#f0c888", "#c89460", "#6a4030");
  // the left end where the wall was cut and buttressed
  for (let y = 28; y < GROUND + 3; y++) for (let x = Math.floor(CX - 76); x < CX - 72; x++) put(x, y, mix(hex("#b07c50"), hex("#c89460"), (x - CX + 76) / 4), WALL);
  // 3. umbrella pines framing both sides
  const pine = (cx, cy, rx, ry, trunkX) => {
    for (let y = cy - ry; y < cy + ry; y++) for (let x = cx - rx; x < cx + rx; x++) {
      const n = fbm(x / 4, y / 3, 3, cx), dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy * 1.4 < 0.9 + (n - 0.5) * 0.7 && y < cy + ry * 0.5) put(x, y, n > 0.58 ? hex("#3e4a30") : hex("#2a3424"), TREE);
    }
    for (let y = cy; y < GROUND + 4; y++) { const tx = Math.round(lerp(trunkX, cx, (GROUND + 4 - y) / (GROUND + 4 - cy))); put(tx, y, hex("#2e1c18"), TREE); put(tx + 1, y, hex("#2e1c18"), TREE); }
  };
  pine(-2, 40, 14, 8, 2); pine(186, 52, 18, 8, 182);
  // 4. road and kerb
  for (let y = GROUND; y < H; y++) for (let x = 0; x < W; x++) {
    let c;
    if (y < GROUND + 4) c = mix(hex("#a89a8a"), hex("#c49a70"), 0.3 + (noise2(x / 3, y, 6) - 0.5) * 0.4);
    else if (y === GROUND + 4) c = hex("#6a625c");
    else c = mix(hex("#c4b4a0"), hex("#a89a8a"), (y - GROUND) / 24);
    if (y === 99 && x % 10 < 5) c = hex("#c49a70");
    put(x, y, c, ROAD);
  }

  const base = rgb.slice(), out = rgb, enc = encoder(PAL);
  const DK = hex("#1e1c22"), DK2 = hex("#3a3640"), BIRD = hex("#2e1c18");
  const COLS = [hex("#d84a3a"), hex("#e8d4a8"), hex("#3a6ab0"), hex("#e0b040"), hex("#40a080")];
  const scooter = (x0, y0, dir, col, coat, t) => {
    const X = (d) => d, S = 2;
    const put = (dx, dy, c) => { const px = x0 + dir * dx * S, py = y0 + (dy - y0) * S; for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) C.put(px + a, py + b, c); };
    const x = 0, y = y0;
    // wheels
    for (const wx of [0, 9]) { put(X(wx), y, DK); put(X(wx + 1), y, DK); put(X(wx), y - 1, DK2); put(X(wx + 1), y - 1, DK2); put(X(wx - 1), y - 1, DK); put(X(wx + 2), y - 1, DK); }
    // body: rounded rear cowl, floorboard, front shield and handlebar column
    for (let d = -1; d <= 4; d++) { put(X(d), y - 2, col); put(X(d), y - 3, col); }
    for (let d = 0; d <= 3; d++) put(X(d), y - 4, col);
    for (let d = 5; d <= 8; d++) put(X(d), y - 2, DK2);
    for (let k = 2; k <= 7; k++) put(X(9 - (k > 5 ? 1 : 0)), y - k, col);
    put(X(8), y - 8, DK); put(X(7), y - 8, DK); put(X(10), y - 6, hex("#fff4d0"));
    // rider
    for (let k = 0; k < 5; k++) { put(X(2), y - 5 - k, coat); put(X(3), y - 5 - k, coat); }
    put(X(4), y - 8, coat); put(X(5), y - 8, coat); put(X(6), y - 8, coat);
    put(X(4), y - 4, DK); put(X(5), y - 3, DK); put(X(6), y - 3, DK);
    put(X(2), y - 10, DK); put(X(3), y - 10, DK); put(X(2), y - 11, DK); put(X(3), y - 11, DK);
  };
  const rides = [
    { sp: 16, ph: 0, dir: 1, y: 99, c: 0, k: 2 }, { sp: 12, ph: 120, dir: -1, y: 105, c: 3, k: 1 },
    { sp: 19, ph: 150, dir: 1, y: 99, c: 4, k: 0 }, { sp: 14, ph: 230, dir: -1, y: 105, c: 2, k: 2 },
  ];

  return (t) => {
    out.set(base);
    for (const r of rides) {
      const span = W + 60, p = ((t * r.sp + r.ph) % span + span) % span, x = r.dir > 0 ? p - 30 : W + 30 - p;
      scooter(Math.round(x), r.y, r.dir, COLS[r.c], r.k === 0 ? DK2 : COLS[(r.c + 2) % 5], t);
    }
    // a flock of birds wheeling over the arena, drifting across
    const bt = (t % 30) / 30, fx = lerp(-40, W + 40, bt);
    for (let b = 0; b < 14; b++) {
      const a = t * 0.6 + b * 0.45, x = Math.round(fx + Math.cos(a) * (8 + (b % 4) * 3) + (b % 5) * 2), y = Math.round(16 + Math.sin(a * 1.3) * 5 + (b % 3) * 2);
      const up = Math.sin(t * 9 + b * 2.1) > 0;
      put(x, y, BIRD); put(x - 1, y - (up ? 1 : 0), BIRD); put(x + 1, y - (up ? 1 : 0), BIRD);
    }
    return enc(out);
  };
}
