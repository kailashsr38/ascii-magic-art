/* angkor-lotus-sunrise: lotus bud temple towers at sunrise over a lotus pond, hand-built picture scene. Static: sky, temple, palms, bank, pond reflection, lotus. Per frame: ripples, monks walking, birds. */
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
  ["#3c3c6c", "#6a5a8a", "#a8768c", "#d8927e", "#f0b07a", "#f8c888", 12],
  ["#fff4d8", "#ffe2a4", 2],
  ["#161018", "#241a28", "#342838", 3],
  ["#4a3a52", "#5e4a62", 2],
  ["#8a6a80", "#5a4a66", 2],
  ["#2a4434", "#405e44", "#5a7c50", "#7a9a62", 5],
  ["#c86a88", "#e890a8", "#f4b4c4", 3],
  ["#b85a1c", "#e07a28", "#f09a3a", 3],
  ["#8a6a70", "#a8847c", 2],
]);

export const meta = {
  slug: "angkor-lotus-sunrise", name: "Lotus Pond Temple Dawn", category: "cities",
  note: "Five lotus bud temple towers stand dark against the sunrise over a still pond of lotus leaves, as robed monks walk the bank and birds cross the sky.",
  tags: ["angkor", "cambodia", "temple", "sunrise", "lotus", "monks", "landmark", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, TEMPLE = 1, BANK = 2, WATER = 3, LOTUS = 4;
const CX = 96, GROUND = 63, SHORE = 69;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const SUN = [112, 33], SUNR = 5;
  // 1. dawn sky: violet overhead to gold at the horizon, glow round the rising sun
  const skyAt = (x, y) => {
    let c = ramp([[0, "#3c3c6c"], [0.3, "#6a5a8a"], [0.55, "#a8768c"], [0.75, "#d8927e"], [0.9, "#f0b07a"], [1, "#f8c888"]], y / GROUND);
    return mix(c, hex("#f8c888"), clamp(1 - Math.hypot(x - SUN[0], (y - SUN[1]) * 1.4) / 46) * 0.7);
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, skyAt(x, y), SKY);
  for (let y = 14; y < 50; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 34, y / 3, 3, 6);
    if (n > 0.57) blend(x, y, hex("#d8927e"), clamp((n - 0.57) * 4) * 0.55);
  }
  // 2. the temple: a long gallery and five towers shaped like lotus buds
  const S1 = hex("#161018"), S2 = hex("#241a28");
  const tower = (tx, top, base, wb) => {
    for (let y = Math.floor(top); y < base; y++) {
      const f = (base - y) / (base - top), tier = (f * 9) % 1;
      const w = wb * Math.pow(1 - Math.pow(f, 1.5), 0.5) * (0.86 + 0.14 * (1 - tier)) + 0.6;
      for (let x = Math.floor(tx - w); x <= tx + w; x++) put(x, y, tier < 0.18 && Math.abs(x - tx) < w - 1 ? S2 : S1, TEMPLE);
    }
    put(tx, top - 1, S1, TEMPLE); put(tx, top - 2, S1, TEMPLE);
  };
  tower(CX - 50, 34, 56, 7); tower(CX + 50, 34, 56, 7);
  for (let y = 48; y < GROUND; y++) {
    const w = y < 51 ? 52 : y < 54 ? 60 : 70;
    for (let x = CX - w; x <= CX + w; x++) put(x, y, (y === 51 || y === 54) ? S2 : S1, TEMPLE);
  }
  for (let x = CX - 70; x <= CX + 70; x += 4) for (let y = 55; y < 60; y++) put(x, y, S2, TEMPLE);
  tower(CX - 28, 24, 50, 9); tower(CX + 28, 24, 50, 9);
  tower(CX, 9, 48, 12);
  for (let y = 40; y < 48; y++) for (let x = CX - 16; x <= CX + 16; x++) put(x, y, S1, TEMPLE);
  // sugar palms either side
  const palm = (px, top, base) => {
    for (let y = top; y < base; y++) put(px + Math.round((y - top) * 0.04), y, S1, TEMPLE);
    for (let a = 0; a < 14; a++) {
      const ang = (a / 14) * Math.PI * 2, r = 5 + (a % 3);
      for (let k = 0; k < r; k++) put(px + Math.cos(ang) * k * 1.1, top + Math.sin(ang) * k * 0.6 + (Math.cos(ang) ** 2) * k * 0.35, S1, TEMPLE);
    }
  };
  [[16, 34, GROUND], [28, 40, GROUND], [168, 36, GROUND], [182, 30, GROUND], [8, 42, GROUND]].forEach(([a, b, c]) => palm(a, b, c));
  // tree line along the far shore
  for (let x = 0; x < W; x++) {
    const top = 56 + 3 * fbm(x / 5, 2, 3, 14);
    for (let y = Math.floor(top); y < GROUND; y++) if (layer[y * W + x] === SKY) put(x, y, mix(hex("#342838"), hex("#241a28"), (y - top) / 6), TEMPLE);
  }
  // 3. the earth bank where the monks walk
  for (let y = GROUND; y < SHORE; y++) for (let x = 0; x < W; x++) put(x, y, mix(hex("#a8847c"), hex("#8a6a70"), (y - GROUND) / 6 + (noise2(x / 4, y, 3) - 0.5) * 0.3), BANK);
  // 4. the pond: mirrored sky and temple, darker
  const sky0 = rgb.slice();
  for (let y = SHORE; y < H; y++) for (let x = 0; x < W; x++) {
    const sy = 2 * GROUND - y - 2 + 6, v = (y - SHORE) / (H - SHORE);
    let c = sy >= 0 ? (() => { const i = (sy * W + x) * 3; return [sky0[i], sky0[i + 1], sky0[i + 2]]; })() : hex("#5a4a66");
    c = mix(c, hex("#5a4a66"), 0.28 + v * 0.3);
    put(x, y, c, WATER);
  }
  // 5. lotus leaves and flowers in the foreground
  const R = (a, b) => hash(a, b);
  for (let i = 0; i < 70; i++) {
    const v = Math.pow(R(i, 1), 0.7), cy = lerp(76, 108, v), cx = R(i, 2) * (W + 20) - 10, rx = lerp(3, 13, v), ry = rx * 0.35;
    if (Math.abs(cx - CX) < 30 && cy < 92) continue;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (q > 1) continue;
      const vein = Math.abs(Math.atan2(y - cy, (x - cx) * 0.35) * 3 % 1) < 0.12;
      put(x, y, vein ? hex("#2a4434") : mix(hex("#7a9a62"), hex("#405e44"), clamp(q * 0.8 + (y - cy) / ry * 0.3 + 0.2)), LOTUS);
    }
  }
  for (let i = 0; i < 12; i++) {
    const v = R(i, 7), bx = Math.round(R(i, 8) * W), by = Math.round(lerp(80, 104, v)), h = Math.round(lerp(5, 14, v)), r = lerp(1.5, 3.5, v);
    if (Math.abs(bx - CX) < 26 && by < 92) continue;
    for (let y = by - h; y < by; y++) put(bx, y, hex("#2a4434"), LOTUS);
    for (let y = Math.floor(by - h - r * 2.2); y <= by - h; y++) {
      const k = (by - h - y) / (r * 2.2), w = r * Math.sin(Math.min(1, k * 1.15) * Math.PI) * (1 - k * 0.3);
      for (let x = Math.floor(bx - w); x <= bx + w; x++) put(x, y, x < bx ? hex("#e890a8") : x > bx ? hex("#c86a88") : hex("#f4b4c4"), LOTUS);
    }
  }
  // the sun, the one bright point, and its path on the water
  for (let y = SUN[1] - 7; y <= SUN[1] + 7; y++) for (let x = SUN[0] - 7; x <= SUN[0] + 7; x++) {
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SUNR && layer[y * W + x] === SKY) put(x, y, d < SUNR - 1.3 ? hex("#fff4d8") : hex("#ffe2a4"));
  }
  for (let y = SHORE; y < 96; y++) {
    const hw = 2 + (y - SHORE) * 0.18;
    for (let x = Math.floor(SUN[0] - hw); x <= SUN[0] + hw; x++) if (layer[y * W + x] === WATER) blend(x, y, hex("#f0b07a"), 0.55 * (1 - Math.abs(x - SUN[0]) / (hw + 1)) * (1 - (y - SHORE) / 30));
  }

  const F = makeFrame(rgb, layer, PAL);
  const ripples = Array.from({ length: 60 }, (_, i) => [hash(i, 21), hash(i, 22), hash(i, 23)]);
  const RIPD = hex("#4a3a58"), RIPL = hex("#c88a84"), BIRD = hex("#241a28");
  const SKIN = hex("#6a4030");
  return (t) => {
    F.begin();
    // wind ripples drifting slowly across open water
    for (const [a, b, c] of ripples) {
      const v = b * b, y = Math.floor(SHORE + 1 + v * (H - SHORE - 2)), L = 3 + v * 10;
      const x0 = ((a * W + t * (0.8 + v * 2.5)) % W + W) % W;
      for (let k = 0; k < L; k++) F.add((x0 + k) % W, y, c > 0.45 ? RIPD : RIPL, 0.5 * Math.sin((k / L) * Math.PI), WATER);
    }
    // monks in saffron robes walking the bank in single file
    const P = 60, lead = lerp(-30, W + 60, (((t + 18) % P) + P) % P / P);
    for (let m = 0; m < 4; m++) {
      const mx = lead - m * 9, step = Math.sin(t * 5 + m * 1.7), by = GROUND + 4;
      for (let y = by - 9; y <= by; y++) {
        const k = (y - (by - 9)) / 9, hw = 1.2 + k * 1.3;
        for (let x = Math.floor(mx - hw); x <= mx + hw; x++) F.add(x, y, mix(hex("#f09a3a"), hex("#b85a1c"), clamp(k * 0.7 + (x - mx + hw) / (hw * 4))), 1, BANK);
      }
      F.add(mx - 1 + step * 0.6, by + 1, SKIN, 1, BANK); F.add(mx + 1 - step * 0.6, by + 1, SKIN, 1, BANK);
      F.add(mx, by - 10, SKIN, 1, BANK); F.add(mx + 1, by - 10, SKIN, 1, BANK); F.add(mx, by - 11, SKIN, 1, BANK);
      // a parasol over the first monk
      if (m === 0) for (let x = Math.floor(mx - 3); x <= mx + 3; x++) F.add(x, by - 12 - (Math.abs(x - mx) < 2 ? 1 : 0), hex("#b85a1c"), 1);
    }
    // birds crossing in a loose V, wings beating
    const bp = 26, bt = (((t + 6) % bp) + bp) % bp / bp, fx = lerp(-30, W + 30, bt), fy = 22 + Math.sin(bt * 5) * 3;
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? 1 : -1, rank = Math.ceil(i / 2), x = fx - rank * 4, y = fy + side * rank * 2.2;
      const up = Math.sin(t * 8 + i) > 0;
      F.add(x, y, BIRD, 1, SKY); F.add(x - 1, y + (up ? -1 : 0), BIRD, 0.85, SKY); F.add(x + 1, y + (up ? -1 : 0), BIRD, 0.85, SKY);
      F.add(x - 2, y + (up ? -1 : 1), BIRD, 0.5, SKY); F.add(x + 2, y + (up ? -1 : 1), BIRD, 0.5, SKY);
    }
    return F.finish();
  };
}
