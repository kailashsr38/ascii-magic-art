/* orbit-window-earth: the Earth seen from a space station window, hand-built picture scene. */
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

const TAU = Math.PI * 2;
const PAL = buildPal([
  ["#04060c", "#0a1020", "#102040", 3],
  ["#163a78", "#1e5aa8", "#3a7ac8", "#5a96d8", 6],
  ["#2e4a2c", "#4a7040", "#6a8a50", "#a08a60", "#c0a878", 6],
  ["#5a6270", "#8a96a8", "#b0bccc", "#d0d8e0", 6],
  ["#4a8ae8", "#7ab4ff", "#a8d0ff", 3],
  ["#fffaf0", "#ffe4b0", "#ffb070", 3],
  ["#1c1e24", "#2a2d36", "#3a3e4a", "#4e5361", "#646a7a", "#7c8292", 8],
  ["#e0a040", "#ff7a3a", "#40c070", 3],
  ["#8090b8", "#c8ccd4", 2],
]);

export const meta = {
  slug: "orbit-window-earth", name: "Orbit Window Earth", category: "landscapes",
  note: "Looking out of a space station window at the curve of the Earth, with cloud bands turning slowly, a satellite drifting past and the sun rising on the limb.",
  tags: ["space", "earth", "orbit", "station", "sunrise", "halftone", "hero", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C;
  const WX = 96, WY = 54, WR = 49;
  const inWin = (x, y) => { const dx = Math.abs(x - WX), dy = Math.abs(y - WY); return dx <= WR && dy <= WR && dx + dy <= WR * 1.4; };
  const EX = 150, EY = 156, ER = 120;
  const L = (() => { const v = [-0.68, -0.66, -0.3]; const l = Math.hypot(...v); return v.map((c) => c / l); })();
  const SUN = [EX - ER * 0.72 - 3, EY - ER * 0.7 - 3];
  // 1. the station interior: panels, seams, rivets, a handrail
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x % 32, py = y % 27, n = noise2(x / 9, y / 9, 3) * 0.08;
    let c = mix(hex("#4e5361"), hex("#5c6272"), clamp(0.5 + n + (x < WX ? 0.15 : -0.1) - y / 400));
    if (px === 0 || py === 0) c = hex("#2a2d36");
    if ((px === 3 || px === 28) && (py === 3 || py === 23)) c = hex("#4e5361");
    put(x, y, c);
  }
  for (let x = 0; x < W; x++) for (let y = 98; y < 102; y++) put(x, y, y === 98 ? hex("#646a7a") : y === 101 ? hex("#1c1e24") : hex("#4e5361"));
  // 2. the window frame: a heavy dark octagon ring with bolts
  const fr = (x, y, r) => { const dx = Math.abs(x - WX), dy = Math.abs(y - WY); return dx <= r && dy <= r && dx + dy <= r * 1.4; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (fr(x, y, WR + 6) && !fr(x, y, WR)) put(x, y, fr(x, y, WR + 2) ? hex("#1c1e24") : hex("#3a3e4a"));
  }
  for (let a = 0; a < 16; a++) { const ang = a / 16 * TAU, r = WR + 4.2; const bx = WX + Math.cos(ang) * r * 0.86, by = WY + Math.sin(ang) * r * 0.86; if (fr(bx, by, WR + 6) && !fr(bx, by, WR + 2)) put(bx, by, hex("#7c8292")); }
  // 3. what is outside: space, stars, and per-pixel sphere geometry for the Earth
  const win = [], sph = [];
  const S = rng(9);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inWin(x, y)) continue;
    const i = y * W + x;
    put(x, y, hex("#04060c")); win.push(i);
    const nx = (x - EX) / ER, ny = (y - EY) / ER, r2 = nx * nx + ny * ny;
    if (r2 < 1) {
      const nz = Math.sqrt(1 - r2);
      const lam = nx * L[0] + ny * L[1] + nz * L[2];
      // tilt the globe a little so the bands run diagonally
      const ty = ny * 0.94 + nz * 0.34, tz = -ny * 0.34 + nz * 0.94;
      sph.push([i, Math.atan2(nx, tz), Math.asin(clamp(-ty, -1, 1)), lam, Math.sqrt(r2)]);
    } else if (r2 < 1.035) put(x, y, mix(hex("#4a8ae8"), hex("#a8d0ff"), clamp(1 - (Math.sqrt(r2) - 1) / 0.017) * clamp(1 - Math.hypot(x - SUN[0], y - SUN[1]) / 110) * 1.4));
    else if (S() < 0.012) put(x, y, hex("#5a6270"));
  }
  // 4. equirectangular textures: land and cloud bands, sampled from 3D points so nothing seams
  const TW = 512, TH = 256, land = new Float32Array(TW * TH), cloud = new Float32Array(TW * TH);
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
    const lon = (i / TW) * TAU, lat = (j / TH - 0.5) * Math.PI, cx = Math.cos(lat) * Math.cos(lon), cy = Math.sin(lat), cz = Math.cos(lat) * Math.sin(lon);
    land[j * TW + i] = fbm(cx * 2.2 + 5, cz * 2.2 + cy * 1.3, 5, 3) * 0.6 + fbm(cy * 2.4 + 9, cx * 1.6 - cz, 4, 7) * 0.4;
    const band = Math.sin(lat * 9 + fbm(cx * 2, cz * 2, 3, 11) * 4);
    cloud[j * TW + i] = clamp(fbm(cx * 4 + cy * 2, cz * 4 - cy, 4, 13) * 1.2 - 0.25 + band * 0.18);
  }
  const OCEAN = [hex("#163a78"), hex("#1e5aa8"), hex("#3a7ac8")], GREEN = hex("#4a7040"), DGREEN = hex("#2e4a2c"), SAND = hex("#c0a878"), BROWN = hex("#a08a60");
  const CLOUD = hex("#d0d8e0"), NIGHT = hex("#0a1020"), CITY = hex("#e0a040");

  // the sun on the limb: a small bright core with short rays, the scene's one bright point
  const sunPix = [];
  for (let y = SUN[1] - 12; y <= SUN[1] + 12; y++) for (let x = SUN[0] - 12; x <= SUN[0] + 12; x++) {
    if (!inWin(x, y)) continue;
    const dx = x - SUN[0], dy = y - SUN[1], d = Math.hypot(dx, dy);
    const ray = (Math.abs(dx) < 0.8 || Math.abs(dy) < 0.8 || Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.8) ? clamp(1 - d / 12) : 0;
    const a = d < 3 ? 1 : Math.max(clamp(1 - (d - 3) / 6) * 0.8, ray * 0.9);
    if (a > 0.05) sunPix.push([x, y, d < 2.2 ? hex("#fffaf0") : d < 4 ? hex("#ffe4b0") : hex("#ffb070"), a]);
  }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const BODY = hex("#c8ccd4"), PANEL = hex("#8090b8"), GOLD = hex("#e0a040"), DARKP = hex("#3a3e4a");

  return (t) => {
    out.set(base);
    // the Earth turning: land drifts slowly, clouds a little faster
    const rl = t * 0.012, rc = t * 0.02;
    for (const [i, lon, lat, lam, rr] of sph) {
      const v = Math.floor((lat / Math.PI + 0.5) * (TH - 1)) * TW;
      const ul = Math.floor((((lon + rl) / TAU) % 1 + 1) % 1 * TW) % TW, uc = Math.floor((((lon + rc) / TAU) % 1 + 1) % 1 * TW) % TW;
      const h = land[v + ul], cl = cloud[v + uc];
      let c;
      if (h > 0.56) c = h > 0.66 ? SAND : h > 0.62 ? BROWN : h > 0.59 ? GREEN : DGREEN;
      else c = OCEAN[h > 0.5 ? 2 : h > 0.42 ? 1 : 0];
      if (cl > 0.38) c = mix(c, CLOUD, clamp((cl - 0.38) * 3.5));
      const lit = clamp(lam * 1.6 + 0.1);
      const k = i * 3;
      if (lit <= 0.02) {
        if (h > 0.6 && cl < 0.5 && (ul * 7 + v) % 13 === 0) { out[k] = CITY[0]; out[k + 1] = CITY[1]; out[k + 2] = CITY[2]; }
        else { out[k] = NIGHT[0]; out[k + 1] = NIGHT[1]; out[k + 2] = NIGHT[2]; }
        continue;
      }
      // warm light along the terminator, the day side full colour
      const warm = clamp(1 - lit * 3) * 0.5;
      const f = 0.25 + 0.75 * lit, edge = rr > 0.985 ? 0.6 : 1;
      out[k] = lerp(NIGHT[0], c[0] * f + 120 * warm, lit * edge + (1 - edge) * 0.3);
      out[k + 1] = lerp(NIGHT[1], c[1] * f + 60 * warm, lit * edge + (1 - edge) * 0.3);
      out[k + 2] = lerp(NIGHT[2], c[2] * f, lit * edge + (1 - edge) * 0.3);
    }
    for (const [x, y, c, a] of sunPix) C.add(x, y, c, a);
    // a satellite drifting across the dark sky above the limb
    const sx = ((t * 3.2 + 30) % (W + 60)) - 30, sy = 30 + (sx - 96) * 0.12;
    const P = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (inWin(x, y)) put(x, y, c); };
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) P(sx + dx, sy + dy, dx === 1 && dy === 1 ? GOLD : BODY);
    for (let k = 2; k < 12; k++) for (let dy = -2; dy <= 2; dy++) { P(sx - k, sy + dy, k === 2 ? DARKP : PANEL); P(sx + k, sy + dy, k === 2 ? DARKP : PANEL); }
    P(sx, sy - 2, BODY); P(sx, sy - 3, BODY);
    return enc(out);
  };
}
