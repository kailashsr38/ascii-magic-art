/* petra-rose-treasury: a columned temple front carved in rose cliffs, seen from a canyon, hand-built picture scene. Static: sky slit, cliff, carved front, sand, canyon walls. Per frame: a camel and rider crossing, dust from its feet. */
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
  ["#f2cfa8", "#e6b892", 2],
  ["#f2b892", "#e6a080", "#d6886c", "#c0725c", "#a85c50", "#8e4a46", 10],
  ["#76383c", "#5e2c32", "#46202a", "#30161e", "#1e0e14", 6],
  ["#f0bc94", "#e0a47e", "#c88a68", "#a87056", "#86584a", 6],
  ["#4a2a1c", "#30180f", "#1c0e08", 3],
  ["#3a5684", "#c8a070", "#d8c8b0", 3],
  ["#e4bc9c", "#ecc8a8", 2],
  ["#fff2dc", "#ffe4bc", 2],
  ["#b07870", "#cc9488", 2],
]);

export const meta = {
  slug: "petra-rose-treasury", name: "Rose Cliff Treasury", category: "cities",
  note: "A columned temple front carved into rose red cliffs, seen from the end of a dark canyon, with a camel and rider plodding across the sand and dust lifting from its feet.",
  tags: ["petra", "jordan", "desert", "camel", "landmark", "ruins", "travel", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, CLIFF = 1, FACE = 2, SAND = 3, WALL = 5;
const CX = 96, FLOOR = 88;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const stone = (v, n) => ramp([[0, "#f2b892"], [0.25, "#e6a080"], [0.5, "#d6886c"], [0.75, "#c0725c"], [1, "#a85c50"]], v + (n - 0.5) * 0.35);
  // 1. a slit of pale sky, then the rose cliff that holds the carving
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, mix(hex("#f2cfa8"), hex("#e6b892"), y / 20), SKY);
  for (let x = 0; x < W; x++) {
    const top = 3 + 4 * fbm(x / 10, 1, 3, 3) + Math.abs(x - CX) * 0.02;
    for (let y = Math.floor(top); y < FLOOR; y++) {
      const n = fbm(x / 7, y / 14, 4, 5), streak = noise2(x / 1.5, y / 30, 8);
      const v = 0.25 + (y / FLOOR) * 0.45 + (streak - 0.5) * 0.5;
      put(x, y, stone(v, n), CLIFF);
    }
  }
  // 2. the carved front: lower colonnade, pediment, upper pavilions and the round kiosk
  const F = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) put(x, y, typeof c === "function" ? c(x, y) : c, FACE); };
  const lit = (x, y, k = 0) => stone(0.12 + k + (y / FLOOR) * 0.3, noise2(x / 3, y / 5, 2));
  const shade = (x, y) => mix(hex("#a85c50"), hex("#8e4a46"), noise2(x / 3, y / 3, 4));
  const deep = hex("#30161e");
  // recessed facade field
  F(54, 12, 139, FLOOR, (x, y) => mix(lit(x, y, 0.25), hex("#8e4a46"), 0.35));
  // lower storey: steps, six columns, door
  F(52, 84, 141, FLOOR, (x, y) => (y % 2 ? lit(x, y, 0.05) : lit(x, y, 0.3)));
  F(58, 60, 135, 84, shade);
  F(90, 64, 103, 84, deep);
  F(91, 63, 102, 64, hex("#86584a"));
  const COLS = [61, 73, 85, 108, 120, 132];
  for (const cx of COLS) {
    F(cx - 2, 60, cx + 3, 84, (x, y) => lit(x, y, x === cx - 2 ? 0.25 : x === cx + 2 ? 0.35 : 0));
    F(cx - 3, 57, cx + 4, 60, (x, y) => lit(x, y, -0.05));
    F(cx - 3, 83, cx + 4, 84, (x, y) => lit(x, y, 0.2));
  }
  // entablature and frieze
  F(55, 51, 138, 57, (x, y) => (y === 51 || y === 56 ? lit(x, y, -0.08) : y === 53 && x % 5 === 0 ? hex("#8e4a46") : lit(x, y, 0.05)));
  // pediment over the middle four columns
  for (let y = 40; y < 51; y++) {
    const hw = (y - 40) * 2.8 + 3;
    for (let x = Math.floor(CX - hw); x <= CX + hw; x++) {
      const edge = Math.abs(Math.abs(x - CX) - hw) < 2.2 || y === 50;
      put(x, y, edge ? lit(x, y, -0.12) : mix(lit(x, y, 0.3), hex("#5e2c32"), 0.6), FACE);
    }
  }
  // upper storey base
  F(52, 38, 141, 41, (x, y) => lit(x, y, y === 38 ? -0.1 : 0.15));
  // side pavilions, each with two columns and a half pediment rising toward the centre
  for (const s of [-1, 1]) {
    const xo = s < 0 ? 55 : 113, xi = s < 0 ? 80 : 138;
    F(xo, 21, xi, 38, shade);
    for (const c of [xo + 3, xi - 4]) F(c - 2, 22, c + 2, 38, (x, y) => lit(x, y, x === c - 2 ? 0.25 : 0.05));
    F(xo - 1, 18, xi + 1, 21, (x, y) => lit(x, y, -0.05));
    for (let y = 9; y < 18; y++) {
      const reach = (y - 9) / 9;
      for (let x = xo - 1; x <= xi + 1; x++) {
        const u = s < 0 ? (x - (xo - 1)) / (xi - xo + 2) : 1 - (x - (xo - 1)) / (xi - xo + 2);
        if (u > reach) continue;
        put(x, y, Math.abs(u - reach) < 0.08 ? lit(x, y, -0.1) : mix(lit(x, y, 0.25), hex("#76383c"), 0.3), FACE);
      }
    }
  }
  // the round kiosk: a drum of columns under a cone, with an urn on top
  for (let y = 18; y < 38; y++) for (let x = 84; x < 109; x++) {
    const u = (x - 84) / 24, round = Math.sin(u * Math.PI);
    let c = mix(hex("#86584a"), lit(x, y, -0.05), round);
    if ((x - 85) % 6 < 2) c = mix(c, hex("#5e2c32"), 0.55);
    put(x, y, c, FACE);
  }
  F(80, 3, 113, 16, (x, y) => mix(hex("#76383c"), hex("#5e2c32"), (y - 3) / 13));
  F(83, 16, 110, 18, (x, y) => lit(x, y, -0.1));
  for (let y = 7; y < 16; y++) {
    const hw = (y - 6) * 1.35;
    for (let x = Math.floor(CX - hw); x <= CX + hw; x++) put(x, y, lit(x, y, -0.1 + (x - CX) / hw * 0.3), FACE);
  }
  F(84, 21, 109, 22, deep);
  // dark gaps between kiosk and pavilions
  F(80, 18, 84, 38, hex("#46202a")); F(109, 18, 113, 38, hex("#46202a"));
  // 3. the sand floor of the plaza
  for (let y = FLOOR; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - FLOOR) / (H - FLOOR), n = fbm(x / 12, y / 3, 3, 9);
    put(x, y, ramp([[0, "#c88a68"], [0.3, "#e0a47e"], [0.7, "#f0bc94"], [1, "#e0a47e"]], v + (n - 0.5) * 0.4), SAND);
  }
  for (let x = 50; x < 143; x++) blend(x, FLOOR, hex("#86584a"), 0.6);
  // 4. the canyon walls in front, dark, framing the view
  const edge = (y, s) => (s < 0 ? 30 + (1 - y / H) * 26 : 162 - (1 - y / H) * 24) + (fbm(y / 9, s + 5, 3, 13) - 0.5) * 16;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const eL = edge(y, -1), eR = edge(y, 1);
    if (x < eL || x > eR) {
      const dIn = x < eL ? eL - x : x - eR, n = fbm(x / 6, y / 9, 3, 21);
      const c = dIn < 2 ? hex("#d6886c") : mix(hex("#c0725c"), hex("#8e4a46"), clamp(dIn / 34 + (n - 0.5) * 0.9 + (noise2(x / 1.5, y / 12, 4) - 0.5) * 0.5));
      put(x, y, c, WALL);
    }
  }
  // the morning sun: one bright beam point on the urn atop the kiosk
  for (let y = 2; y < 8; y++) for (let x = CX - 3; x <= CX + 3; x++) {
    const d = Math.hypot((x - CX) / 2.2, (y - 4.6) / 2.6);
    if (d < 1) put(x, y, d < 0.6 ? hex("#fff2dc") : hex("#ffe4bc"), FACE);
  }

  const Fr = makeFrame(rgb, layer, PAL);
  const CAMEL = hex("#2a140c"), CAMEL2 = hex("#3a2014"), ROBE = hex("#3a5684"), SCARF = hex("#d8c8b0"), DUST = hex("#ecc8a8");
  const P = 44, BX = (t) => lerp(-50, W + 20, (((t + 16) % P) + P) % P / P);
  const ell = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) Fr.add(x, y, typeof c === "function" ? c(y) : c); };
  const thick = (x0, y0, x1, y1, w, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); for (let k = 0; k < w; k++) Fr.add(x + k - (w - 1) / 2, y, c); } };
  const BASE = 107;
  const foot = (t, leg) => { const ph = t * 2.6 + leg * Math.PI; return BX(t) + [6, 9, 20, 23][leg] + Math.sin(ph) * 2.2; };

  return (t) => {
    Fr.begin();
    const x = BX(t), y = BASE, bob = Math.abs(Math.sin(t * 2.6)) * 0.8;
    // dust puffs from the feet: spawned every 0.3 s, rising, growing, fading
    const now = Math.floor(t / 0.3);
    for (let k = 0; k < 9; k++) {
      const ts = (now - k) * 0.3, a = t - ts;
      if (ts < 0 || a < 0) continue;
      const fx = foot(ts, k % 4) - a * 3.5, fy = y - a * 2.2, r = 1.2 + a * 1.6, al = 0.55 * (1 - a / 2.7);
      if ((((ts + 16) % P) + P) % P / P > 0.98) continue;
      for (let yy = Math.floor(fy - r); yy <= fy + r * 0.6; yy++) for (let xx = Math.floor(fx - r * 1.5); xx <= fx + r * 1.5; xx++) {
        const q = ((xx - fx) / (r * 1.5)) ** 2 + ((yy - fy) / r) ** 2;
        if (q < 1) Fr.add(xx, yy, DUST, al * (1 - q), WALL - 1);
      }
    }
    // soft shadow on the sand, cast toward the viewer
    for (let yy = y; yy < y + 4; yy++) for (let xx = Math.floor(x - 2); xx < x + 34; xx++) {
      const q = ((xx - x - 15) / 18) ** 2 + ((yy - y - 1.5) / 2.5) ** 2;
      if (q < 1) Fr.add(xx, yy, hex("#7a4a3a"), 0.25 + 0.45 * (1 - q), SAND);
    }
    // legs, two pairs swinging opposite
    [[6, 0], [9, 1], [20, 1], [23, 0]].forEach(([lx, s], i) => {
      const sw = Math.sin(t * 2.6 + s * Math.PI) * 2.2, hipx = x + lx, kx = hipx + sw * 0.4, fx = hipx + sw;
      thick(hipx, y - 12 - bob, kx + (i > 1 ? 0.6 : -0.6), y - 6, 2, i % 3 ? CAMEL2 : CAMEL);
      thick(kx + (i > 1 ? 0.6 : -0.6), y - 6, fx, y, 1.6, i % 3 ? CAMEL2 : CAMEL);
      Fr.add(fx + 1, y, CAMEL);
    });
    // body, hump, neck and head
    const coat = (yy) => mix(hex("#5a3424"), hex("#22100a"), clamp((yy - (y - 24 - bob)) / 12));
    ell(x + 14, y - 15 - bob, 11, 4.6, coat);
    ell(x + 13, y - 19.5 - bob, 6, 4, coat);
    thick(x + 3, y - 17 - bob, x + 1, y - 10 - bob, 1, CAMEL);
    const nod = Math.sin(t * 2.6) * 0.6;
    for (let k = 0; k <= 10; k++) { const u = k / 10; ell(x + 24 + u * 6, y - 15 - bob - Math.sin(u * 2.2) * 8 + nod * u, 1.8 - u * 0.4, 1.8, coat); }
    ell(x + 32, y - 22.5 - bob + nod, 3.4, 1.6, coat);
    // rider in a blue robe and pale headscarf, swaying with the stride
    const sway = Math.sin(t * 2.6) * 0.5, rx = x + 13 + sway;
    for (let yy = y - 31 - bob; yy < y - 22 - bob; yy++) for (let xx = rx - 2; xx <= rx + 2; xx++) Fr.add(xx, yy, ROBE);
    thick(rx + 1, y - 23 - bob, rx + 4, y - 17 - bob, 2, ROBE);
    ell(rx, y - 33 - bob, 2, 2, SCARF);
    thick(rx - 1, y - 32 - bob, rx - 4, y - 28 - bob, 1, SCARF);
    return Fr.finish();
  };
}
