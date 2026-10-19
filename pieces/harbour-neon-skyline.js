/* harbour-neon-skyline: a neon city skyline over a night harbour, hand-built picture scene. */
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
// a float RGB canvas with put (opaque) and add (blend) helpers
function canvas() {
  const rgb = new Float32Array(W * H * 3);
  const put = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2]; };
  const add = (x, y, c, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = (y * W + x) * 3; rgb[i] += (c[0] - rgb[i]) * a; rgb[i + 1] += (c[1] - rgb[i + 1]) * a; rgb[i + 2] += (c[2] - rgb[i + 2]) * a; };
  const get = (x, y) => { x = clamp(x | 0, 0, W - 1); y = clamp(y | 0, 0, H - 1); const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  return { rgb, put, add, get };
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };

const PAL = buildPal([
  ["#1c2060", "#2c2e7c", "#5038a0", "#8a48b0", "#d060a8", "#ff8c96", "#ffb09a", "#ffd4a8", 15],
  ["#8a60b0", "#a476c0", "#c090cc", 3],
  ["#06070f", "#0c0e1e", "#14172e", "#1e2140", 4],
  ["#f0bc68", "#e09a50", "#c87e46", "#7a4a3a", 4],
  ["#ff3fa4", "#ff9ad4", "#3fe6ff", "#b0f6ff", 4],
  ["#fffbea", "#fff0c4", "#e6d2b8", "#a87a9a", 4],
  ["#04060f", "#090d26", "#111843", "#1c2258", 5],
  ["#5a2a68", "#8a3f74", "#c6a7a0", 3],
  ["#262840", "#3a3c5a", "#ff3a3a", "#ff8a6a", "#fff4dc", 5],
  ["#e8e8f2", "#9aa0c0", 2],
]);

export const meta = {
  slug: "harbour-neon-skyline", name: "Neon Harbour Ferry", category: "landscapes",
  note: "A neon city skyline over a night harbour under a full moon, with office windows switching on and off, a ferry crossing and cars streaming over the bridge.",
  tags: ["city", "night", "harbour", "skyline", "neon", "ferry", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C, R = rng(7);
  const HZ = 74, MOON = [50, 24], MR = 8;
  const isSky = new Uint8Array(W * H);
  // 1. sky: deep navy to a magenta city glow at the horizon, moon halo
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#1c2060"], [0.25, "#2c2e7c"], [0.45, "#5038a0"], [0.6, "#8a48b0"], [0.74, "#d060a8"], [0.86, "#ff8c96"], [0.95, "#ffb09a"], [1, "#ffd4a8"]], y / HZ);
    const d = Math.hypot(x - MOON[0], y - MOON[1]);
    c = mix(c, hex("#a87a9a"), clamp(1 - (d - MR) / 26) * 0.5);
    if (d < MR) c = d < MR - 1.5 ? hex("#fffbea") : hex("#fff0c4");
    put(x, y, c); isSky[y * W + x] = 1;
  }
  // moon craters, faint
  for (const [dx, dy, r] of []) for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.hypot(x, y) < r) put(MOON[0] + dx + x, MOON[1] + dy + y, hex("#e6d2b8"));
  // 2. far skyline: hazy violet blocks
  for (let x = 0; x < W;) {
    const w = 3 + Math.floor(R() * 7), h = 4 + Math.floor(R() * 9 * (0.6 + 0.6 * Math.sin(x / 30)));
    for (let xx = x; xx < x + w && xx < W; xx++) for (let y = HZ - h; y < HZ; y++) { put(xx, y, mix(hex("#c090cc"), hex("#a476c0"), (y - (HZ - h)) / h)); isSky[y * W + xx] = 0; }
    x += w + (R() < 0.3 ? 1 : 0);
  }
  // 3. mid skyline: dark towers with window grids and neon
  const windows = [];
  const towers = [];
  let x = -2;
  while (x < 128) {
    const w = 6 + Math.floor(R() * 9);
    let h = 14 + Math.floor(R() * 26);
    if (x > 78 && x < 92) h = 58; // the tall one
    towers.push([x, w, h]);
    x += w + 1;
  }
  for (const [x0, w, h] of towers) {
    const top = HZ - h;
    for (let xx = x0; xx < x0 + w; xx++) for (let y = top; y < HZ; y++) put(xx, y, xx === x0 ? hex("#1e2140") : hex("#0c0e1e"));
    if (h === 58) { // stepped crown and spire
      for (let y = top - 6; y < top; y++) for (let xx = x0 + 2 + Math.floor((top - y) / 3); xx < x0 + w - 2 - Math.floor((top - y) / 3); xx++) put(xx, y, hex("#0c0e1e"));
      for (let y = top - 16; y < top - 6; y++) put(x0 + (w >> 1), y, hex("#14172e"));
    }
    for (let y = top + 2; y < HZ - 2; y += 3) for (let xx = x0 + 1; xx < x0 + w - 1; xx += 2) windows.push([xx, y, windows.length]);
  }
  // neon signs: pink and cyan bars on three towers
  const neon = [[towers[3], "#ff3fa4"], [towers[7], "#3fe6ff"], [towers[11], "#ff3fa4"], [towers[14], "#3fe6ff"]].filter((n) => n[0]);
  for (const [[x0, w, h], col] of neon) {
    const y0 = HZ - h + 3;
    for (let xx = x0 + 1; xx < x0 + w - 1; xx++) for (let k = 0; k < 3; k++) put(xx, y0 + k, hex(col));
  }
  // 4. the bridge on the right: deck rising toward the viewer, two towers, cables
  const deckY = (x) => lerp(70, 61, (x - 118) / 74);
  for (let bx = 118; bx < W; bx++) {
    const y = Math.round(deckY(bx));
    for (let yy = y; yy < y + 3; yy++) put(bx, yy, yy === y ? hex("#3a3c5a") : hex("#262840"));
    for (let yy = y + 3; yy < HZ + 1; yy++) if (bx % 22 === 0 || bx % 22 === 1) put(bx, yy, hex("#262840"));
  }
  const btow = [140, 176];
  for (const tx of btow) {
    const dy = Math.round(deckY(tx)), top = dy - (tx > 160 ? 34 : 26);
    for (let y = top; y < HZ; y++) for (let xx = tx - 2; xx <= tx + 1; xx++) put(xx, y, hex("#262840"));
  }
  const cable = (xa, ya, xb, yb, sag) => { for (let s = 0; s <= 1; s += 0.004) put(lerp(xa, xb, s), lerp(ya, yb, s) + sag * 4 * s * (1 - s), hex("#3a3c5a")); };
  const tt = btow.map((tx) => [tx, Math.round(deckY(tx)) - (tx > 160 ? 34 : 26)]);
  cable(tt[0][0], tt[0][1], tt[1][0], tt[1][1], 22);
  for (let sx = tt[0][0] + 4; sx < tt[1][0] - 2; sx += 4) { const s = (sx - tt[0][0]) / (tt[1][0] - tt[0][0]), cy = lerp(tt[0][1], tt[1][1], s) + 22 * 4 * s * (1 - s); for (let y = Math.round(cy); y < deckY(sx); y++) put(sx, y, hex("#262840")); }
  for (const [tx, ty] of tt) for (let xx = tx - 2; xx <= tx + 2; xx++) { put(xx, ty + 4, hex("#262840")); put(xx, ty + 12, hex("#262840")); }
  cable(118, deckY(118), tt[0][0], tt[0][1], 3);
  cable(tt[1][0], tt[1][1], W + 10, deckY(W) - 30, 8);
  for (let lx = 122; lx < W; lx += 9) put(lx, Math.round(deckY(lx)) - 1, hex("#f0bc68"));
  // 5. harbour water with mirrored, broken reflections
  for (let y = HZ; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const v = (y - HZ) / (H - HZ);
    let c = ramp([[0, "#ffb09a"], [0.12, "#ff8c96"], [0.35, "#d060a8"], [0.7, "#5038a0"], [1, "#2c2e7c"]], v);
    const band = fbm(xx / 26, y * 0.9, 3, 4);
    const src = C.get(xx, 2 * HZ - y - 1), Ls = (src[0] + src[1] + src[2]) / 765;
    const a = clamp((band - 0.35) * 2.5) * (0.8 - v * 0.4);
    c = mix(c, mix(src, hex("#06070f"), 0.3), a * 1.2);
    if (Math.abs(xx - MOON[0]) < 6 - v * 3 && noise2(xx / 3, y * 1.3, 8) > 0.38) c = mix(c, hex("#ffd4a8"), 0.9 - v * 0.5);
    put(xx, y, c);
  }
  // shoreline quay
  for (let xx = 0; xx < 124; xx++) put(xx, HZ, hex("#06070f"));

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const WIN = [hex("#f0bc68"), hex("#e09a50"), hex("#c87e46")], OFF = hex("#14172e");
  const HULL = hex("#06070f"), WHITE = hex("#e8e8f2"), GREY = hex("#9aa0c0"), LAMP = hex("#f0bc68"), RED = hex("#ff3a3a"), HEAD = hex("#fff4dc"), DARK = hex("#090d26"), WAKE = hex("#ffc49a");
  const cars = Array.from({ length: 9 }, (_, i) => ({ ph: hash(i, 3), sp: 0.05 + hash(i, 9) * 0.03, dir: i % 2 }));

  return (t) => {
    out.set(base);
    // windows switch on and off on their own slow clocks
    for (const [wx, wy, i] of windows) {
      const per = 4 + (i % 7) * 1.7, k = Math.floor(t / per + hash(i, 1) * 9);
      const on = hash(i, k) < 0.42;
      put(wx, wy, on ? WIN[i % 3] : OFF);
    }
    // slow ripple lines drifting across the water
    for (let r = 0; r < 14; r++) {
      const y = HZ + 3 + Math.floor(hash(r, 5) * 30), len = 6 + hash(r, 6) * 14;
      const x0 = ((hash(r, 7) * W - t * (2 + hash(r, 8) * 3)) % (W + 30) + W + 30) % (W + 30) - 15;
      for (let xx = 0; xx < len; xx++) C.add(x0 + xx, y, DARK, 0.6);
    }
    // ferry crossing left to right, with a wake
    const fx = ((t * 4 + 70) % (W + 70)) - 35, fy = 84;
    for (let k = 1; k < 34; k++) { const sx = fx - k, spread = Math.floor(k / 6); C.add(sx, fy + 1 + spread, WAKE, 0.7 - k / 50); C.add(sx, fy + 1 - Math.min(spread, 1), WAKE, 0.4 - k / 90); }
    for (let xx = 0; xx < 26; xx++) for (let yy = 0; yy < 3; yy++) if (xx > yy && xx < 25 - (yy === 2 ? 1 : 0)) put(fx + xx, fy - yy + 1, HULL);
    for (let xx = 4; xx < 21; xx++) { put(fx + xx, fy - 2, WHITE); put(fx + xx, fy - 3, xx % 2 ? LAMP : WHITE); }
    for (let xx = 7; xx < 18; xx++) { put(fx + xx, fy - 4, GREY); put(fx + xx, fy - 5, xx % 2 ? LAMP : WHITE); }
    for (let yy = 6; yy < 9; yy++) { put(fx + 12, fy - yy, RED); put(fx + 13, fy - yy, HULL); }
    // cars on the bridge as moving lights
    for (const c of cars) {
      const u = (c.ph + t * c.sp) % 1, bx = c.dir ? lerp(W + 4, 118, u) : lerp(118, W + 4, u);
      const by = Math.round(deckY(bx)) - 1;
      if (bx < 119 || bx >= W) continue;
      if (c.dir) { put(bx, by + 1, HEAD); put(bx + 1, by + 1, LAMP); } else { put(bx, by + 2, RED); put(bx - 1, by + 2, RED); }
    }
    return enc(out);
  };
}
