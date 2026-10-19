/* desert-needle-skyline: a needle supertall over a desert city at night, hand-built picture scene. Static: sky, moon, towers, needle, highway, dunes. Per frame: windows switching and cars on the highway. */
import { fbm, noise2, clamp, lerp, rng, KEYS } from "../lib/kit.js";

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
  ["#0c1230", "#18204a", "#2c2e62", "#4a3e72", "#7a5078", "#a8687a", 12],
  ["#fff6e4", "#f0e6d0", 2],
  ["#10142a", "#1a2040", "#262e56", "#343e6c", 4],
  ["#4a5a8c", "#6a7aa8", "#8a9ac0", 3],
  ["#f0c070", "#d89a50", "#a0c0e8", "#7090c0", 4],
  ["#2a2a3a", "#3a3848", 2],
  ["#f0a040", "#c07830", 2],
  ["#e8d4a0", "#e04030", "#a02820", 3],
  ["#2a2030", "#3e3040", "#5a4450", "#7a5a5e", 4],
]);

export const meta = {
  slug: "desert-needle-skyline", name: "Desert Needle Skyline", category: "cities",
  note: "A needle thin supertall tower rises over a glittering desert city at night, with lit windows changing, cars streaming along the highway and a full moon above the dunes.",
  tags: ["skyline", "night", "desert", "skyscraper", "city", "traffic", "moon", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, TOWER = 1, ROAD = 2, SAND = 3;
const BASE = 76, ROADY = 80;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const MOON = [36, 17], MOONR = 4.5;
  // 1. night sky with the city's glow low on the horizon
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#0c1230"], [0.3, "#18204a"], [0.48, "#2c2e62"], [0.64, "#4a3e72"], [0.8, "#7a5078"], [1, "#a8687a"]], y / BASE);
    c = mix(c, hex("#2c2e62"), clamp(1 - Math.hypot(x - MOON[0], y - MOON[1]) / 22) * 0.6);
    put(x, y, c, SKY);
  }
  for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i, 1) * W), y = Math.floor(hash(i, 2) * 34); if (Math.hypot(x - MOON[0], y - MOON[1]) > 9) put(x, y, hex("#4a5a8c")); }
  for (let y = MOON[1] - 6; y <= MOON[1] + 6; y++) for (let x = MOON[0] - 6; x <= MOON[0] + 6; x++) {
    const d = Math.hypot(x - MOON[0], y - MOON[1]);
    if (d < MOONR) put(x, y, d < MOONR - 1.2 ? hex("#fff6e4") : hex("#f0e6d0"));
  }
  // 2. towers: a band of ordinary towers, then the needle in the middle
  const winCells = [];
  const tower = (x0, w, top, kind, seed) => {
    for (let y = Math.floor(top); y < BASE; y++) {
      let a = x0, b = x0 + w;
      if (kind === 1 && y < top + w) { const k = (y - top) / w; a = x0 + (1 - k) * w * 0.5; b = x0 + w - (1 - k) * w * 0.5; }         // pointed crown
      if (kind === 2 && y < top + w * 1.4) { const k = (y - top) / (w * 1.4); b = x0 + w * Math.sqrt(k); }                            // sail shaped
      for (let x = Math.floor(a); x < b; x++) {
        const u = (x - x0) / w;
        let c = mix(hex("#262e56"), hex("#10142a"), u);
        if (x === Math.floor(a)) c = hex("#4a5a8c");
        const wy = (y - Math.floor(top)) % 3 === 1, wx = (x - x0) % 2 === 1;
        if (wy && wx && y > top + 2) { winCells.push([x, y, hash(x * 31 + y, seed)]); c = hex("#1a2040"); }
        put(x, y, c, TOWER);
      }
    }
    if (kind === 0) for (let y = top - 4; y < top; y++) put(x0 + Math.floor(w / 2), y, hex("#262e56"), TOWER);
  };
  const R = rng(7);
  const BAND = [];
  for (let x = -4; x < W; ) { const w = 6 + Math.floor(R() * 9); BAND.push([x, w]); x += w + Math.floor(R() * 3); }
  // back row, shorter and hazier
  BAND.forEach(([x, w], i) => { const top = BASE - 10 - R() * 18; tower(x + 3, w, top, 0, 100 + i); for (let y = Math.floor(top); y < BASE; y++) for (let xx = x + 3; xx < x + 3 + w; xx++) if (layer[y * W + xx] === TOWER) blend(xx, y, hex("#2c2e62"), 0.3); });
  // front row with crowns, a sail tower on the right
  BAND.forEach(([x, w], i) => { if (i % 2) return; const top = BASE - 14 - R() * 30; tower(x, w, top, i % 3 === 0 ? 1 : 0, 200 + i); });
  tower(164, 14, 30, 2, 300);
  tower(18, 10, 34, 1, 301);
  // the needle: setbacks stepping in round a central core, then a long spire
  const NX = 104;
  const steps = [[76, 13], [64, 11], [54, 9], [45, 7.5], [37, 6], [30, 4.6], [24, 3.4], [19, 2.4]];
  for (let k = 0; k < steps.length; k++) {
    const [yb, hw] = steps[k], yt = k + 1 < steps.length ? steps[k + 1][0] : 14, off = k % 2 ? 1 : -1;
    for (let y = yt; y < yb; y++) {
      const t2 = (y - yt) / (yb - yt), wing = hw * (0.75 + 0.25 * t2);
      for (let x = Math.floor(NX - wing + off); x <= NX + wing + off; x++) {
        const u = (x - (NX - wing + off)) / (2 * wing);
        let c = u < 0.35 ? mix(hex("#6a7aa8"), hex("#4a5a8c"), u / 0.35) : mix(hex("#343e6c"), hex("#1a2040"), (u - 0.35) / 0.65);
        if (Math.abs(x - NX) < 1 && y % 2) c = hex("#8a9ac0");
        if ((y - yt) % 2 === 1 && Math.abs(x - NX) > 1 && x % 2) winCells.push([x, y, hash(x * 13 + y, 77)]);
        put(x, y, c, TOWER);
      }
    }
  }
  for (let y = 0; y < 14; y++) { put(NX, y, y < 3 ? hex("#6a7aa8") : hex("#4a5a8c"), TOWER); if (y > 8) { put(NX - 1, y, hex("#343e6c"), TOWER); put(NX + 1, y, hex("#262e56"), TOWER); } }
  // 3. the elevated highway and its lamps
  for (let y = BASE; y < ROADY + 4; y++) for (let x = 0; x < W; x++) {
    const c = y < ROADY - 1 ? hex("#3a3848") : y === ROADY - 1 ? hex("#5a4450") : y < ROADY + 2 ? hex("#2a2a3a") : hex("#3a3848");
    put(x, y, c, ROAD);
  }
  for (let x = 6; x < W; x += 24) {
    for (let y = BASE - 6; y < BASE; y++) put(x, y, hex("#3a3848"), ROAD);
    put(x + 1, BASE - 6, hex("#f0a040"), ROAD); put(x + 2, BASE - 6, hex("#c07830"), ROAD);
    for (let y = BASE - 5; y < ROADY + 4; y++) for (let xx = x - 3; xx < x + 6; xx++) blend(xx, y, hex("#c07830"), 0.18 * (1 - Math.abs(xx - x - 1) / 5));
  }
  // 4. dunes in front, faintly lit by the city
  for (let x = 0; x < W; x++) {
    const d1 = ROADY + 8 + 5 * Math.sin(x / 23 + 1) + 2 * fbm(x / 9, 1, 3, 3), d2 = ROADY + 16 + 6 * Math.sin(x / 31 + 4) + 2 * fbm(x / 7, 2, 3, 4);
    for (let y = ROADY + 4; y < H; y++) {
      let c;
      if (y < d1) c = mix(hex("#3e3040"), hex("#2a2030"), (y - ROADY - 4) / 8);
      else if (y < d2) c = mix(hex("#7a5a5e"), hex("#3e3040"), clamp((y - d1) / 7));
      else c = mix(hex("#5a4450"), hex("#2a2030"), clamp((y - d2) / 14));
      put(x, y, c, SAND);
    }
  }
  // city glow on the dunes' crests and reflection of the needle's light on the sand
  for (let y = ROADY + 4; y < H; y++) for (let x = NX - 20; x < NX + 20; x++) blend(x, y, hex("#7a5a5e"), 0.12 * (1 - Math.abs(x - NX) / 20));

  const F = makeFrame(rgb, layer, PAL);
  const WARM = hex("#f0c070"), WARM2 = hex("#d89a50"), COOL = hex("#a0c0e8"), COOL2 = hex("#7090c0");
  const HEAD = hex("#e8d4a0"), TAIL = hex("#e04030"), BODY = hex("#10142a");
  const cars = Array.from({ length: 16 }, (_, i) => ({ lane: i % 2, ph: hash(i, 51), sp: 20 + hash(i, 52) * 10, len: 4 + Math.floor(hash(i, 53) * 3) }));
  return (t) => {
    F.begin();
    // windows: each lit or dark, switching now and then
    for (const [x, y, h] of winCells) {
      const slot = Math.floor(t / 7 + h * 13), on = hash(Math.floor(h * 1e6), slot) < 0.55;
      if (!on) continue;
      const c = h < 0.55 ? (h < 0.3 ? WARM : WARM2) : (h < 0.8 ? COOL2 : COOL);
      F.add(x, y, c, 0.55 + h * 0.4);
    }
    // traffic: upper lane heading left (tail lights toward us on the right), lower lane heading right
    for (const c of cars) {
      const span = W + 30, p = ((c.ph * span + t * c.sp) % span + span) % span;
      const x = c.lane ? p - 15 : W + 15 - p, y = c.lane ? ROADY + 1 : ROADY - 2;
      for (let k = 0; k < c.len; k++) { F.add(x + k, y, BODY, 0.9); F.add(x + k, y - 1, BODY, 0.6); }
      const front = c.lane ? x + c.len : x - 1, back = c.lane ? x - 1 : x + c.len;
      F.add(front, y, HEAD, 1); F.add(front + (c.lane ? 1 : -1), y, HEAD, 0.5); F.add(front + (c.lane ? 2 : -2), y, HEAD, 0.25);
      F.add(back, y, TAIL, 1);
    }
    return F.finish();
  };
}
