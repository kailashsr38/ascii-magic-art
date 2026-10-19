/* cliff-lighthouse-night: a lighthouse on a sea cliff under the stars, hand-built.
 * A static scene (night sky and stars, the far headland, the sea, the cliff, the tower
 * and the keeper's cottage) is painted once; each frame adds drifting cloud, a ship
 * passing on the horizon, ripple lines, surf at the cliff foot and the turning beam. */
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
  ["#0c1430", "#16224a", "#22325e", "#2e4272", "#3c5484", "#4a6898", "#5a7aa8", "#7a96c0", 13],
  ["#fffbe8", "#fff0b8", "#ffe08a", "#f8c868", 4],
  ["#c8d4f0", "#e8eeff", 2],
  ["#0a0e1a", "#141a2a", "#1e2638", "#2a3448", "#3a4660", 6],
  ["#16242a", "#22343a", 2],
  ["#6a7898", "#8a98b8", "#aab6d0", "#c8d2e6", 5],
  ["#5a2232", "#7a3040", 2],
  ["#0a1428", "#0e1a36", "#14244a", "#1a2c52", "#24396a", 6],
  ["#3a5488", "#5a72a4", "#8aa0c8", 3],
  ["#a8b8d8", "#d0dcf0", 2],
  ["#ffb860", "#e89048", 2],
  ["#1c2a50", "#2a3a66", "#3a4c7a", 3],
  ["#8a8a7a", "#b8b090", "#e0d4a0", 3],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "cliff-lighthouse-night", name: "Cliff Lighthouse Night", category: "landscapes",
  note: "A lighthouse on a sea cliff turns its beam across a starry night while a ship passes on the horizon and clouds drift by.",
  tags: ["lighthouse", "night", "stars", "sea", "ship", "coast", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, FAR = 1, SEA = 2, CLIFF = 3, TOWER = 4;
const HOR = 70, LX = 150, LY = 16;

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  // 1. night sky, lighter toward the horizon, with fixed stars
  for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
    const c = ramp([[0, "#16224a"], [0.3, "#22325e"], [0.55, "#2e4272"], [0.75, "#3c5484"], [0.9, "#5a7aa8"], [1, "#7a96c0"]], y / HOR);
    put(x, y, c, SKY);
  }
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(r() * W), y = Math.floor(Math.pow(r(), 1.4) * (HOR - 14)), big = r() > 0.85;
    put(x, y, big ? hex("#e8eeff") : hex("#c8d4f0"), SKY);
    if (big) { put(x + 1, y, hex("#8aa0c8"), SKY); put(x - 1, y, hex("#8aa0c8"), SKY); put(x, y - 1, hex("#8aa0c8"), SKY); put(x, y + 1, hex("#8aa0c8"), SKY); }
  }
  // 2. far headland on the left
  const far = (x) => HOR - 7 * clamp(1 - x / 70) - 2 * fbm(x / 8, 2, 3, 3) * clamp(1 - x / 80);
  for (let x = 0; x < 80; x++) for (let y = Math.floor(far(x)); y < HOR; y++) put(x, y, hex("#2a3a66"), FAR);
  // 3. sea
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y - HOR) / (H - HOR);
    put(x, y, ramp([[0, "#5a7aa8"], [0.15, "#3c5484"], [0.5, "#2e4272"], [1, "#22325e"]], k), SEA);
  }
  // 4. the cliff: a ragged face falling to the sea, grassy top
  const topY = (x) => 52 - (x - 104) * 0.02 + 1.5 * fbm(x / 6, 1, 3, 17);
  const faceX = (y) => 104 - (y - 52) * 0.35 + 5 * (fbm(y / 4, 3, 3, 19) - 0.5) - (y > 84 ? (y - 84) * 1.2 : 0);
  for (let y = 46; y < H; y++) for (let x = 60; x < W; x++) {
    if (y < topY(x) || x < faceX(y)) continue;
    const strata = Math.sin(y * 0.9 + x * 0.15 + fbm(x / 8, y / 8, 2, 5) * 4), n = fbm(x / 5, y / 5, 3, 23);
    let c = n > 0.6 ? hex("#141a2a") : strata > 0.7 ? hex("#141a2a") : hex("#0a0e1a");
    if (y < topY(x) + 2) c = hex("#16242a");
    if (x < faceX(y) + 1) c = hex("#1e2638"); // a faint rim of sky light on the edge
    put(x, y, c, CLIFF);
  }
  // 5. the tower: tapered, two dark bands, gallery, lantern room and dome
  for (let y = LY + 6; y <= 54; y++) {
    const hw = 3.2 + (y - LY - 6) * 0.075, band = (y > 30 && y < 34) || (y > 42 && y < 46);
    for (let x = Math.round(LX - hw); x <= Math.round(LX + hw); x++) {
      const lit = clamp(0.75 - (x - LX + hw) / (2 * hw) * 0.6);
      put(x, y, band ? mix(hex("#5a2232"), hex("#7a3040"), lit) : mix(hex("#6a7898"), hex("#aab6d0"), lit), TOWER);
    }
  }
  for (let x = LX - 6; x <= LX + 6; x++) { put(x, LY + 5, hex("#0a0e1a"), TOWER); put(x, LY + 4, (x - LX) % 2 ? hex("#0a0e1a") : hex("#1e2638"), TOWER); }
  for (let y = LY - 3; y <= LY + 3; y++) for (let x = LX - 4; x <= LX + 4; x++) put(x, y, Math.abs(x - LX) === 4 || Math.abs(x - LX) === 2 ? hex("#141a2a") : hex("#fff0b8"), TOWER);
  for (let y = LY - 7; y <= LY - 4; y++) { const hw = (y - (LY - 8)) * 1.3; for (let x = Math.round(LX - hw); x <= Math.round(LX + hw); x++) put(x, y, hex("#0a0e1a"), TOWER); }
  put(LX, LY - 8, hex("#0a0e1a"), TOWER); put(LX, LY - 9, hex("#0a0e1a"), TOWER);
  // keeper's cottage
  for (let y = 46; y <= 54; y++) for (let x = 162; x <= 184; x++) put(x, y, mix(hex("#6a7898"), hex("#8a98b8"), x < 170 ? 0.6 : 0.2), TOWER);
  for (let y = 40; y <= 45; y++) for (let x = 160 + (y - 40); x <= 186 - (y - 40) * 0.2; x++) put(x, y, hex("#0a0e1a"), TOWER);
  for (let y = 36; y <= 41; y++) { put(180, y, hex("#141a2a"), TOWER); put(181, y, hex("#141a2a"), TOWER); }
  const windows = [[166, 48], [176, 48]];

  const F = makeFrame(rgb, layer, PAL);
  const { add, out } = F;
  const clouds = [[0.15, 0.35, 12, 3, 0.9], [0.6, 0.42, 22, 2.5, 0.6], [0.9, 0.3, 6, 2, 1.2], [0.35, 0.28, 34, 2, 0.8], [0.8, 0.5, 44, 3, 0.5]];
  const ripples = Array.from({ length: 26 }, (_, i) => ({ u: ((i * 61) % 89) / 89, ph: ((i * 29) % 41) / 41 }));
  const CL = hex("#2a3a66"), CL2 = hex("#3a4c7a"), INK = hex("#0a0e1a"), WARM = hex("#ffb860"), BEAM = hex("#fff0b8");

  return (t) => {
    F.begin();
    // clouds drifting right, soft-edged banks
    for (const [u, len, v, th, sp] of clouds) {
      const L = len * W, cx = ((((u * W + t * sp * 1.5) % (W + L)) + W + L) % (W + L)) - L / 2;
      for (let y = Math.floor(v - th * 3); y <= v + th * 3; y++) for (let x = Math.max(0, Math.floor(cx - L / 2)); x < Math.min(W, cx + L / 2); x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), n = noise2(x / 7, y / 3 + v, 4);
        const a = clamp(along * 2.5) * clamp(1.2 - Math.abs(y - v - (n - 0.5) * 3) / (th * (0.6 + along)));
        if (a > 0.05) add(x, y, y < v ? CL2 : CL, a * 0.9, SKY);
      }
    }
    // a ship crossing the horizon, lit portholes and a mast light, passing behind the cliff
    const sx = Math.round(lerp(-40, 120, ((t + 26) % 64) / 64)), sy = HOR - 1;
    for (let x = -13; x <= 13; x++) { add(sx + x, sy, INK, 1, SEA); if (Math.abs(x) < 12) add(sx + x, sy - 1, INK, 1, SEA); }
    for (let x = -4; x <= 6; x++) for (let y = 2; y <= 4; y++) add(sx + x, sy - y, INK, 1, SEA);
    for (let y = 5; y <= 9; y++) add(sx + 3, sy - y, INK, 1, SEA);
    for (let y = 2; y <= 8; y++) add(sx - 9, sy - y, INK, 1, SEA);
    add(sx + 4, sy - 7, INK, 1, SEA); add(sx + 2, sy - 6, INK, 1, SEA);
    for (const px of [-8, -5, -2, 1, 4, 7, 10]) add(sx + px, sy - 1, WARM, 0.9, SEA);
    add(sx - 9, sy - 9, hex("#ffe08a"), 1, SEA);
    // ripple lines drifting toward the shore
    for (const rp of ripples) {
      const p = (rp.ph + t * 0.03) % 1, y = Math.round(HOR + 2 + (H - HOR - 3) * Math.pow(p, 1.4));
      const len = 3 + 16 * p, x0 = rp.u * (W + 20) - 10;
      for (let x = Math.round(x0 - len / 2); x < x0 + len / 2; x++) { add(x, y, hex("#8aa0c8"), 0.55, SEA); add(x, y + 1, hex("#1a2c52"), 0.5, SEA); }
    }
    // surf breaking along the cliff foot
    for (let y = HOR + 6; y < H; y++) {
      let fx = -1;
      for (let x = 60; x < W; x++) if (layer[y * W + x] === CLIFF) { fx = x; break; }
      if (fx < 0) continue;
      const p = (t * 0.6 + y * 0.07) % 1, reach = Math.round(2 + p * 8);
      for (let x = fx - reach; x < fx; x++) add(x, y, hex("#a8b8d8"), (1 - p) * 0.75 * (x === fx - reach ? 1 : 0.5), SEA);
    }
    // lit cottage windows, a gentle lamp flicker
    windows.forEach(([x, y], i) => {
      const f = 0.85 + 0.15 * Math.sin(t * 5.3 + i * 2) * Math.sin(t * 1.7 + i);
      for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 3; xx++) add(xx, yy, mix(hex("#e89048"), hex("#ffb860"), f), 1);
    });
    // the beam: a cone that swings round, long when side-on, short and flaring when facing us
    const th = t * 0.8, cs = Math.cos(th), sn = Math.sin(th), dir = cs >= 0 ? 1 : -1, L = 8 + 150 * Math.abs(cs);
    for (let dx = 4; dx < L; dx++) {
      const x = LX + dir * dx, hh = 1.5 + dx * 0.19, k = Math.pow(1 - dx / L, 0.6) * (0.45 + 0.35 * Math.abs(cs));
      if (x < 0 || x >= W) break;
      for (let y = Math.floor(LY - hh); y <= Math.ceil(LY + hh); y++) {
        const e = 1 - Math.abs(y - LY) / hh;
        if (e > 0) { const i = y * W + Math.round(x); if (layer[i] !== TOWER) add(x, y, BEAM, k * Math.min(1, e * 1.6)); }
      }
    }
    // flare round the lamp, biggest when the light faces us
    const fr = 3 + 7 * clamp(sn), fa = 0.3 + 0.55 * clamp(sn);
    for (let y = LY - 12; y <= LY + 12; y++) for (let x = LX - 14; x <= LX + 14; x++) {
      const d = Math.hypot(x - LX, y - LY);
      if (d < fr + 4) add(x, y, BEAM, clamp(1 - d / (fr + 4)) * fa);
    }
    for (let y = LY - 2; y <= LY + 2; y++) for (let x = LX - 2; x <= LX + 2; x++) add(x, y, hex("#fffbe8"), 1);
    return F.finish();
  };
}
