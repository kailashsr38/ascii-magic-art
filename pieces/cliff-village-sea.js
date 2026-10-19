/* cliff-village-sea: a whitewashed cliff village over a blue sea, hand-built picture scene. */
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
  ["#6aa6e2", "#7ab2e6", "#8cbeea", "#9cc8ee", "#a8d0f0", 8],
  ["#1e58a8", "#2c6cc0", "#3c84d4", "#5aa0e4", "#80bcee", 9],
  ["#7e9cbc", "#9ab4cc", 2],
  ["#dadad4", "#cfd2d6", "#bcc2cc", "#a2acbc", "#8a96aa", 6],
  ["#2058c0", "#3a78d8", "#6a9ae6", 3],
  ["#4a2e26", "#6a4436", "#8a5a46", "#b07458", "#d8987c", 6],
  ["#d84a8a", "#f07ab0", 2],
  ["#3a3230", "#5a4e48", "#c8b8a0", 3],
  ["#30343c", "#585e6a", 2],
  ["#d8e6f2", "#e0ecf6", 2],
]);

export const meta = {
  slug: "cliff-village-sea", name: "Whitewashed Cliff Village", category: "landscapes",
  note: "A whitewashed village with blue domes spills down a volcanic cliff above a deep blue sea, with a windmill turning, boats crossing and gulls overhead.",
  tags: ["village", "sea", "island", "summer", "windmill", "halftone", "travel", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C, R = rng(21);
  const HZ = 42;
  const top = (x) => lerp(66, 24, clamp((x - 92) / 100)) + (noise2(x / 7, 1, 3) - 0.5) * 4;
  const kind = new Uint8Array(W * H); // 1 sky, 2 sea
  // 1. sky: pale at the horizon, deeper blue overhead
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) { put(x, y, ramp([[0, "#6aa6e2"], [0.5, "#8cbeea"], [1, "#a8d0f0"]], y / HZ)); kind[y * W + x] = 1; }
  // 2. a far island on the horizon, hazy
  for (let x = 6; x < 70; x++) {
    const h = Math.max(0, 7 * Math.sin(((x - 6) / 64) * Math.PI) + (noise2(x / 6, 2, 1) - 0.5) * 3);
    for (let y = Math.floor(HZ - h); y < HZ; y++) { put(x, y, y < HZ - h + 1.5 ? hex("#9ab4cc") : hex("#7e9cbc")); kind[y * W + x] = 0; }
  }
  // 3. sea: light near the horizon, deep toward us
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) { put(x, y, ramp([[0, "#80bcee"], [0.25, "#5aa0e4"], [0.6, "#3c84d4"], [1, "#1e58a8"]], (y - HZ) / (H - HZ))); kind[y * W + x] = 2; }
  // 4. the cliff: dark volcanic rock in bands
  for (let x = 70; x < W; x++) for (let y = Math.floor(top(Math.max(x, 92))); y < H; y++) {
    const d = y - top(x), n = fbm(x / 9, y / 4, 3, 7);
    const band = Math.sin(y * 0.55 + n * 5) > 0.3;
    let c = ramp([[0, "#e8a888"], [0.25, "#d08c6e"], [0.6, "#b07458"], [1, "#8a5a46"]], clamp(d / 110 + (n - 0.5) * 0.5));
    if (band && d > 10) c = mix(c, hex("#6a4436"), 0.45);
    if (x < 99 - (y - 62) * 0.45 + (noise2(y / 4, 9, 2) - 0.5) * 4) continue; // the cliff foot slopes into the sea
    put(x, y, c); kind[y * W + x] = 0;
  }
  // 5. the village: white cubes stacked down the cliff, back to front
  const houses = [];
  for (let x = 98; x < W + 4;) {
    const w = 6 + Math.floor(R() * 7);
    const layers = 2 + Math.floor(R() * 3);
    for (let l = 0; l < layers; l++) houses.push({ x: x + Math.floor(R() * 3), w, h: 5 + Math.floor(R() * 4), base: top(x + w / 2) + 3 + l * 7 + R() * 3, dome: R() < 0.13, pink: R() < 0.25 });
    x += w - 1;
  }
  houses.sort((a, b) => a.base - b.base);
  for (const hs of houses) {
    if (hs.base > top(hs.x) + 34) continue;
    const y0 = Math.round(hs.base - hs.h), x0 = hs.x, side = 2;
    for (let y = y0; y < hs.base; y++) for (let x = x0; x < x0 + hs.w; x++) {
      const c = x >= x0 + hs.w - side ? hex("#a2acbc") : y === y0 ? hex("#cfd2d6") : hex("#dadad4");
      put(x, y, c); kind[y * W + x] = 0;
    }
    // door and window, deep blue
    const dx = x0 + 1 + Math.floor((hs.w - 4) * 0.5);
    for (let y = hs.base - 3; y < hs.base; y++) put(dx, y, hex("#2058c0"));
    if (hs.w > 7) { put(dx + 3, y0 + 2, hex("#3a78d8")); put(dx - 3, y0 + 2, hex("#3a78d8")); }
    if (hs.pink) for (let k = 0; k < 6; k++) put(x0 + k % 3, hs.base - 1 - Math.floor(k / 3), hex(k % 2 ? "#d84a8a" : "#f07ab0"));
    if (hs.dome) {
      const cx = x0 + hs.w / 2 - 1, r = Math.min(5, hs.w / 2);
      for (let y = Math.floor(y0 - r); y < y0; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x - cx, (y - y0 + 0.5) * 1.05);
        if (d < r) { put(x, y, x < cx - r * 0.3 && y < y0 - r * 0.5 ? hex("#6a9ae6") : hex("#3a78d8")); kind[y * W + x] = 0; }
      }
      put(Math.round(cx), Math.floor(y0 - r - 1), hex("#cfd2d6"));
    }
  }
  // the big church dome, the village's centre
  const CH = { x: 140, base: top(140) + 12, w: 16, h: 10 };
  for (let y = CH.base - CH.h; y < CH.base; y++) for (let x = CH.x; x < CH.x + CH.w; x++) put(x, y, x > CH.x + CH.w - 4 ? hex("#a2acbc") : hex("#dadad4"));
  for (let y = Math.floor(CH.base - CH.h - 9); y < CH.base - CH.h; y++) for (let x = CH.x - 1; x <= CH.x + CH.w; x++) {
    const cx = CH.x + CH.w / 2 - 0.5, d = Math.hypot(x - cx, (y - (CH.base - CH.h)) * 1.0);
    if (d < 8.5) put(x, y, x < cx - 2 && y < CH.base - CH.h - 4 ? hex("#6a9ae6") : hex("#3c84d4"));
  }
  for (let y = CH.base - 6; y < CH.base; y++) for (let x = CH.x + 5; x < CH.x + 8; x++) put(x, y, hex("#2058c0"));
  // 6. the windmill's tower on the clifftop, right
  const MILL = [176, Math.round(top(176)) - 1];
  for (let y = MILL[1] - 15; y < MILL[1] + 2; y++) { const half = 4 + (y - (MILL[1] - 15)) * 0.12; for (let x = Math.round(MILL[0] - half); x <= MILL[0] + half; x++) { put(x, y, x > MILL[0] + half - 2.5 ? hex("#a2acbc") : hex("#dadad4")); kind[y * W + x] = 0; } }
  for (let y = MILL[1] - 21; y < MILL[1] - 15; y++) { const half = (y - (MILL[1] - 22)) * 0.8; for (let x = Math.round(MILL[0] - half); x <= MILL[0] + half; x++) put(x, y, hex("#5a4e48")); }
  for (let y = MILL[1] - 4; y < MILL[1] + 1; y++) put(MILL[0] - 1, y, hex("#2058c0"));
  const HUB = [MILL[0] - 5, MILL[1] - 17];
  // 7. a stone wall on the lower path, foreground of the village
  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const GULL = hex("#30343c"), SAIL = hex("#dadad4"), HULL = hex("#cfd2d6"), WAKE = hex("#8cbeea"), SPAR = hex("#3a3230"), SAILC = hex("#c8b8a0"), FOAM = hex("#80bcee"), CLOUD = hex("#e0ecf6");
  const gulls = [[0, 16, 0], [6, 19, 1.3], [11, 14, 2.2], [-8, 22, 0.6]];
  const waves = Array.from({ length: 40 }, (_, i) => [hash(i, 1) * W, HZ + 4 + hash(i, 2) * (H - HZ - 6), 3 + hash(i, 3) * 6]);

  return (t) => {
    out.set(base);
    // clouds drifting slowly right across the sky
    for (const [u, v, L, sp] of [[0.1, 10, 40, 0.8], [0.55, 6, 30, 0.6], [0.85, 16, 26, 1.0]]) {
      const cx = ((u * W + t * sp) % (W + 60)) - 30;
      for (let y = v - 3; y <= v + 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        if (x < 0 || x >= W || kind[y * W + x] !== 1) continue;
        const a = clamp(1 - Math.abs(x - cx) / (L / 2)) * clamp(1 - Math.abs(y - v + Math.sin(x * 0.3) * 0.8) / 3);
        C.add(x, y, CLOUD, a * 0.85);
      }
    }
    // wave crests rolling slowly across the sea
    for (const [wx, wy, L] of waves) {
      const x0 = ((wx + t * 1.5) % (W + 10)) - 5, near = (wy - HZ) / (H - HZ);
      for (let k = 0; k < L * (0.6 + near); k++) { const x = Math.floor(x0 + k), y = Math.floor(wy); if (x >= 0 && x < W && kind[y * W + x] === 2) C.add(x, y, FOAM, 0.6); }
    }
    // a sailboat heading right, a motorboat heading left with a long wake
    const sx = ((t * 2.2 + 20) % (W + 40)) - 20, sy = 62;
    for (let k = 1; k < 18; k++) { const x = Math.floor(sx - k); if (x >= 0 && kind[sy * W + x] === 2) C.add(x, sy + 1, WAKE, 0.6 - k / 34); }
    for (let x = 0; x < 9; x++) if (kind[(sy) * W + Math.floor(sx + x)] === 2) { put(sx + x, sy, HULL); if (x > 0 && x < 8) put(sx + x, sy + 1, SPAR); }
    for (let y = 1; y < 11; y++) { put(sx + 4, sy - y, SPAR); for (let x = 5; x < 5 + (11 - y) * 0.45; x++) put(sx + x, sy - y, SAIL); for (let x = 3; x > 3 - (11 - y) * 0.25; x--) put(sx + x, sy - y, SAIL); }
    const mx = W - ((t * 7 + 110) % (W + 120)) + 20, my = 86;
    for (let k = 2; k < 60; k++) { const x = Math.floor(mx + k), sp = Math.floor(k / 14); if (x >= 0 && x < W && kind[my * W + x] === 2) { C.add(x, my + sp, WAKE, 0.85 - k / 75); C.add(x, my - sp, WAKE, 0.6 - k / 90); } }
    for (let x = 0; x < 12; x++) for (let y = 0; y < 2; y++) if (x > y) { const px = Math.floor(mx + x); if (px >= 0 && px < W && kind[(my - y) * W + px] === 2) put(px, my - y, y ? HULL : SAIL); }
    for (let x = 5; x < 9; x++) put(mx + x, my - 2, SAILC);
    // windmill sails turning
    const a0 = t * 0.9;
    for (let s = 0; s < 4; s++) {
      const a = a0 + s * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
      for (let r = 1; r < 13; r++) {
        put(HUB[0] + ca * r, HUB[1] + sa * r, SPAR);
        if (r > 3) for (let w = 1; w < 4; w++) put(HUB[0] + ca * r - sa * w, HUB[1] + sa * r + ca * w, w === 3 ? SPAR : SAILC);
      }
    }
    put(HUB[0], HUB[1], SPAR);
    // gulls gliding across, flapping
    const gx = ((t * 6) % (W + 80)) - 40;
    for (const [dx, gy, ph] of gulls) {
      const x = Math.round(gx + dx), y = Math.round(gy + Math.sin(t * 0.7 + ph) * 2), up = Math.sin(t * 7 + ph * 3) > 0;
      put(x, y, GULL); put(x - 1, y - (up ? 1 : 0), GULL); put(x + 1, y - (up ? 1 : 0), GULL); put(x - 2, y - (up ? 2 : 0), GULL); put(x + 2, y - (up ? 2 : 0), GULL);
    }
    return enc(out);
  };
}
