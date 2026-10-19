/* autumn-pagoda-maples: a five tier pagoda among red maples in autumn, hand-built.
 * A static scene (evening sky, far hills, maples, the pagoda, an arched bridge over a
 * pond and its reflection) is painted once; each frame adds the sun, ripple lines on
 * the pond, glowing lanterns, a swaying maple branch and maple leaves falling. */
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
  ["#b07a8a", "#cc8a80", "#e49a78", "#f4ac70", "#ffc078", "#ffd490", "#ffe2a8", 12],
  ["#fffaea", "#fff0c8", 2],
  ["#7a5470", "#5a4060", "#3a2a44", 3],
  ["#1e0e12", "#2a1418", "#3e1a1c", "#5a2420", "#8a3a28", 5],
  ["#ffb050", "#ff8a3a", "#f06a2a", "#d84a24", "#b8341e", "#8a2418", "#5e1a16", 9],
  ["#ffd070", "#f0a838", 2],
  ["#ffa060", "#ff7a40", "#e05a34", "#b04028", 4],
  ["#6a4a5a", "#584056", "#46344a", "#34283c", "#261e2e", 6],
  ["#c09088", "#e0b090", 2],
  ["#2a2026", "#3a2a2a", 2],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "autumn-pagoda-maples", name: "Autumn Pagoda Maples", category: "landscapes",
  note: "A five tier pagoda stands among red maples on an autumn evening, with lanterns on an arched bridge and maple leaves drifting down.",
  tags: ["autumn", "pagoda", "japan", "maple", "leaves", "bridge", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, HILL = 1, MID = 2, POND = 3, BRIDGE = 4, FORE = 5;
const WL = 86, PX = 130;
const REDS = ["#ffb050", "#ff8a3a", "#f06a2a", "#d84a24", "#b8341e", "#8a2418", "#5e1a16"];

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  const SUN = [60, 50], SUNR = 7;
  // 1. sky: dusty rose overhead to gold low down
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#b07a8a"], [0.25, "#cc8a80"], [0.45, "#e49a78"], [0.62, "#f4ac70"], [0.78, "#ffc078"], [1, "#ffd490"]], y / 62);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    c = mix(c, hex("#ffe2a8"), clamp(1 - d / 46) * 0.45);
    put(x, y, c, SKY);
  }
  // 2. far hills
  const far = (x) => 56 + 4 * Math.sin(x / 31 + 2) + 3 * fbm(x / 14, 3, 3, 4);
  for (let x = 0; x < W; x++) for (let y = Math.floor(far(x)); y < WL; y++) put(x, y, mix(hex("#7a5470"), hex("#3a2a44"), clamp((y - far(x)) / 10)), HILL);
  // 3. maple canopies: noisy blobs lit from the upper left
  const canopy = (cx, cy, rx, ry, seed, L, dark = 0) => {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, n = fbm(x / 3.5, y / 3.5, 3, seed);
      const d = Math.hypot(dx, dy) + (n - 0.5) * 0.7;
      if (d > 1) continue;
      const light = clamp(0.55 - dx * 0.35 - dy * 0.4 + (n - 0.5) * 0.9 - dark);
      put(x, y, hex(REDS[Math.round((1 - light) * (REDS.length - 1))]), L);
    }
  };
  // trees behind the pagoda
  canopy(100, 60, 14, 9, 3, MID, 0.15); canopy(166, 58, 16, 10, 5, MID, 0.15); canopy(186, 64, 12, 9, 7, MID, 0.2);
  // 4. the pagoda: five tiers with upswept eaves, a spire with rings
  const eaves = [68, 56, 45, 35, 26], rws = [23, 20, 17, 14.5, 12], bws = [11, 9.5, 8, 6.8, 5.6];
  const windows = [];
  for (let i = 0; i < 5; i++) {
    const yE = eaves[i], rw = rws[i], bw = bws[i];
    const bodyBot = i === 0 ? 80 : eaves[i - 1] - 5;
    for (let y = yE; y <= bodyBot; y++) for (let x = Math.round(PX - bw); x <= Math.round(PX + bw); x++) {
      const rail = (y - yE) % 4 === 3;
      put(x, y, rail ? hex("#3e1a1c") : x < PX - bw + 2 ? hex("#5a2420") : hex("#2a1418"), MID);
    }
    windows.push([PX - 2, yE + 3, Math.max(2, Math.round(bw * 0.5))]);
    for (let x = Math.round(PX - rw); x <= Math.round(PX + rw); x++) {
      const u = Math.abs(x - PX) / rw, top = yE - 5 + 4.2 * Math.pow(u, 0.85) - 2 * Math.pow(u, 6), bot = yE + 1 - 2.5 * Math.pow(u, 5);
      for (let y = Math.round(top); y <= Math.round(bot); y++) put(x, y, y === Math.round(top) && x < PX ? hex("#8a3a28") : hex("#1e0e12"), MID);
    }
  }
  for (let y = 6; y <= 21; y++) put(PX, y, hex("#1e0e12"), MID);
  for (const y of [9, 11, 13, 15, 17]) { put(PX - 1, y, hex("#1e0e12"), MID); put(PX + 1, y, hex("#1e0e12"), MID); }
  put(PX, 5, hex("#3e1a1c"), MID);
  // trees in front of the pagoda base and the bank hill
  const bank = (x) => 76 + 3 * Math.sin(x / 19) + 2 * fbm(x / 7, 9, 3, 2);
  for (let x = 70; x < W; x++) for (let y = Math.floor(bank(x)); y < WL; y++) put(x, y, fbm(x / 3, y / 3, 2, 8) > 0.55 ? hex("#3a2a2a") : hex("#2a2026"), MID);
  canopy(106, 76, 13, 7, 11, MID); canopy(156, 74, 15, 8, 13, MID); canopy(182, 78, 13, 8, 17, MID); canopy(84, 80, 10, 6, 19, MID, 0.1);
  // 5. the arched bridge, vermilion, with rail posts
  const B0 = 22, B1 = 98, deck = (x) => WL - 1 - 11 * Math.sin((Math.PI * (x - B0)) / (B1 - B0));
  for (let x = B0; x <= B1; x++) {
    const d = deck(x);
    put(x, d - 1, hex("#ffa060"), BRIDGE); put(x, d, hex("#ff7a40"), BRIDGE); put(x, d + 1, hex("#e05a34"), BRIDGE); put(x, d + 2, hex("#5a2420"), BRIDGE);
    put(x, d - 6, hex("#ff7a40"), BRIDGE);
    if ((x - B0) % 6 === 0) for (let y = d - 6; y < d - 1; y++) put(x, y, hex("#e05a34"), BRIDGE);
  }
  for (const bx of [B0, B1]) for (let y = WL - 6; y < WL; y++) { put(bx, y, hex("#e05a34"), BRIDGE); put(bx + (bx === B0 ? 1 : -1), y, hex("#b04028"), BRIDGE); }
  const lanterns = [B0 + 12, B0 + 38, B0 + 64].map((x) => [x, Math.round(deck(x)) - 7]);
  // 6. pond: the scene above mirrored and darkened
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
    const sy = Math.max(0, Math.round(WL - 1 - (y - WL) * 1.1)), i = (sy * W + x) * 3, k = (y - WL) / (H - WL);
    put(x, y, mix(mix([rgb[i], rgb[i + 1], rgb[i + 2]], hex("#c09088"), 0.22), hex("#46344a"), 0.1 + 0.3 * k), POND);
  }
  // 7. foreground banks
  const bankL = [[0, 84], [14, 88], [24, 96], [30, H], [0, H]], bankR = [[W, 88], [178, 92], [168, 100], [162, H], [W, H]];
  for (let y = 80; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(x + 0.5, y + 0.5, bankL) || inPoly(x + 0.5, y + 0.5, bankR)) put(x, y, fbm(x / 3, y / 3, 2, 41) > 0.55 ? hex("#3a2a2a") : hex("#261e2e"), FORE);

  // a maple branch reaching in from the top left, drawn per frame so it can sway
  const branch = [];
  const twig = (x0, y0, x1, y1) => { for (let k = 0; k <= 1; k += 0.03) branch.push([lerp(x0, x1, k), lerp(y0, y1, k), "#2a1418", 1]); };
  twig(-2, 4, 30, 12); twig(14, 8, 26, 20); twig(30, 12, 46, 9); twig(24, 11, 38, 22);
  const clumps = [[8, 9, 7, 4], [26, 18, 8, 5], [40, 10, 8, 4], [36, 22, 6, 4], [18, 3, 8, 3], [48, 6, 5, 3]];
  clumps.forEach(([cx, cy, rx, ry], k) => {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const n = fbm(x / 2.2, y / 2.2, 2, 50 + k), d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (n - 0.5) * 0.9;
      if (d < 1 && n > 0.36) branch.push([x, y, n > 0.62 ? "#d84a24" : n > 0.5 ? "#b8341e" : "#8a2418", 0]);
    }
  });

  const F = makeFrame(rgb, layer, PAL);
  const { add } = F;
  const leaves = Array.from({ length: 46 }, (_, i) => ({ x: ((i * 97) % 211) - 10, ph: ((i * 37) % 101) / 101, v: 0.035 + ((i * 13) % 7) * 0.006, a: 3 + (i % 5), f: 0.7 + (i % 4) * 0.25, c: REDS[i % 5] }));
  const ripples = Array.from({ length: 18 }, (_, i) => ({ u: ((i * 59) % 83) / 83, ph: ((i * 31) % 47) / 47 }));

  return (t) => {
    F.begin();
    // sun sinking behind the far hills
    for (let y = SUN[1] - SUNR; y <= SUN[1] + SUNR; y++) for (let x = SUN[0] - SUNR; x <= SUN[0] + SUNR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SUNR) add(x, y, d < SUNR - 1.5 ? hex("#fffaea") : hex("#fff0c8"), 1, SKY);
    }
    // ripple lines on the pond
    for (const r of ripples) {
      const p = (r.ph + t * 0.04) % 1, y = Math.round(WL + 2 + (H - WL - 3) * p), len = 4 + 14 * p, x0 = r.u * (W + 20) - 10;
      for (let x = Math.round(x0 - len / 2); x < x0 + len / 2; x++) { add(x, y, hex("#e0b090"), 0.5, POND); add(x, y + 1, hex("#261e2e"), 0.4, POND); }
    }
    // lantern windows in the pagoda and paper lanterns on the bridge, a soft flicker
    windows.forEach(([x, y, w], i) => {
      const f = 0.8 + 0.2 * Math.sin(t * 4.1 + i * 1.9) * Math.sin(t * 1.3 + i);
      for (let xx = x - w + 2; xx <= x + w; xx++) add(xx, y, mix(hex("#f0a838"), hex("#ffd070"), f), 0.95);
    });
    lanterns.forEach(([x, y], i) => {
      const f = 0.82 + 0.18 * Math.sin(t * 3.7 + i * 2.3);
      add(x, y - 1, hex("#2a1418"), 1);
      for (let yy = y; yy < y + 3; yy++) for (let xx = x - 1; xx <= x + 1; xx++) add(xx, yy, mix(hex("#f0a838"), hex("#ffd070"), f), 1);
      for (let yy = WL + (WL - y) - 2; yy < WL + (WL - y) + 1; yy++) add(x, yy, hex("#f0a838"), 0.5, POND);
    });
    // the branch sways, more at its tips
    const sw = Math.sin(t * 0.9) * 1.4 + Math.sin(t * 2.3) * 0.4;
    for (const [x, y, c] of branch) { const k = clamp(x / 50); add(x + sw * k, y + sw * k * 0.4, hex(c), 1); }
    // maple leaves falling, fluttering side to side
    for (const l of leaves) {
      const p = (l.ph + t * l.v) % 1, y = -4 + p * (H + 8), x = l.x + Math.sin(t * l.f + l.ph * 9) * l.a + p * 16;
      const flip = Math.sin(t * l.f * 2.4 + l.ph * 7);
      add(x, y, hex(l.c), 1);
      if (flip > 0.2) add(x + 1, y, hex(l.c), 1); else if (flip < -0.2) add(x, y + 1, hex(l.c), 1);
    }
    return F.finish();
  };
}
