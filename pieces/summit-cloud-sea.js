/* summit-cloud-sea: a snowy peak standing above a sea of cloud at sunrise, with a rope of climbers on a ridge, hand-built.
 * A static scene (dawn sky, rising sun, far peaks, the great peak with lit and
 * shadowed faces, the near snow ridge) is painted once; each frame adds the cloud
 * sea drifting below and the climbers walking the ridge into the cloud. */
import { fbm, noise2, clamp, lerp, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const ANCHORS = [
  ["#3a5a9e", "#5470b0", "#8a88c4", "#d098b0", "#f4b098", "#ffd490", 10],
  ["#ffe8b0", "#fff6d8", "#fffdf0", 3],
  ["#e8a490", "#f0b8a0", "#f6c8b0", "#f8d2bc", 5],
  ["#3a4880", "#52609a", "#6c7ab0", "#8a94c4", 5],
  ["#1a1a30", "#2a2840", 2],
  ["#6a6aa0", "#8a86b8", "#a8a0cc", "#c8b4d4", "#e8c4c4", "#f8d4bc", 8],
  ["#0e0c1a", "#c03030", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "summit-cloud-sea", name: "Summit Above Clouds", category: "landscapes",
  note: "A snowy peak glows pink above a drifting sea of cloud at sunrise while a roped line of climbers walks the ridge below.",
  tags: ["mountain", "sunrise", "snow", "clouds", "climbers", "halftone", "hero", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";
const SKY = 1, FAR = 2, PEAK = 3, FORE = 4;

const C = Object.fromEntries(Object.entries({
  sun: "#fffdf0", sun2: "#fff6d8", glow: "#ffd08c", lit: "#f8d2bc", lit2: "#f0b8a0", lit3: "#e8a490", sh: "#8a94c4", sh2: "#6c7ab0", sh3: "#52609a", sh4: "#3a4880",
  rock: "#1a1a30", rock2: "#2a2840", c0: "#6a6aa0", c1: "#8a86b8", c2: "#a8a0cc", c3: "#c8b4d4", c4: "#e8c4c4", c5: "#f8d4bc", ink: "#0e0c1a", red: "#c03030",
}).map(([k, v]) => [k, hex(v)]));

const CLOUD_TOP = 64, TEXW = W * 3, TEXH = H - CLOUD_TOP + 4;

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };
  const SUN = [156, 60], SR = 8;

  // 1. dawn sky: deep blue overhead, rose then gold toward the horizon
  const stops = [[0, "#3a5a9e"], [0.3, "#5470b0"], [0.55, "#8a88c4"], [0.75, "#d098b0"], [0.9, "#f4b098"], [1, "#ffd490"]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = clamp(y / 66);
    let k = 1; while (k < stops.length - 1 && v > stops[k][0]) k++;
    let c = mix(hex(stops[k - 1][1]), hex(stops[k][1]), (v - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]));
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.4);
    c = mix(c, C.glow, clamp(1 - (d - SR) / 46) ** 1.6 * 0.75);
    put(x, y, d < SR ? (d < SR - 1.5 ? C.sun : C.sun2) : c, SKY);
  }
  // 2. far peaks poking through the cloud on the horizon
  for (const [px, ph, pw] of [[18, 50, 16], [40, 55, 12], [176, 54, 14], [120, 57, 10]]) {
    for (let y = ph; y < CLOUD_TOP + 4; y++) {
      const hw = (y - ph) * pw / 12;
      for (let x = Math.floor(px - hw); x <= px + hw; x++) put(x, y, x > px ? C.c4 : C.c1, FAR);
    }
  }
  // 3. the great peak: summit high left of centre, lit face right, shadow face left
  const S = [70, 12];
  const leftEdge = (y) => S[0] - (y - S[1]) * 1.1 - 6 * fbm(y / 6, 1, 3, 3) - Math.max(0, y - 40) * 0.5;
  const rightEdge = (y) => S[0] + (y - S[1]) * 1.0 + 5 * fbm(y / 5, 2, 3, 4) + Math.max(0, y - 40) * 0.3;
  const ridge = (y) => S[0] - (y - S[1]) * 0.25 + 3 * Math.sin(y / 7) + 2 * noise2(y / 3, 5, 6);
  for (let y = S[1]; y < H; y++) for (let x = Math.floor(leftEdge(y)); x <= rightEdge(y); x++) {
    if (x < 0 || x >= W) continue;
    let c;
    if (x > ridge(y)) {
      const u = (x - ridge(y)) / Math.max(1, rightEdge(y) - ridge(y));
      c = u < 0.5 ? mix(C.lit, C.lit2, u * 2) : mix(C.lit2, C.lit3, (u - 0.5) * 2);
      const gully = fbm(x / 4 + y / 9, y / 3, 3, 11);
      if (gully > 0.68) c = C.sh;
      else if (gully > 0.63) c = C.lit3;
    } else {
      const u = (ridge(y) - x) / Math.max(1, ridge(y) - leftEdge(y));
      c = mix(C.sh, C.sh3, u);
      const rk = fbm(x / 3 - y / 6, y / 4, 3, 13);
      if (rk > 0.66) c = C.rock2; else if (rk > 0.6) c = C.sh4;
    }
    put(x, y, c, PEAK);
  }
  // 4. the near snow ridge in the lower right, its crest rising then dropping into the cloud
  const crest = (x) => (x > 132 ? lerp(74, 98, (x - 132) / 60) : lerp(92, 74, (x - 96) / 36)) + 1.2 * noise2(x / 4, 9, 2);
  const FX = (x) => x;
  for (let x = 92; x < W; x++) {
    const top = crest(x);
    for (let y = Math.floor(top); y < H; y++) {
      const depth = y - top, n = noise2(x / 5, y / 3, 17);
      let c = depth < 2 ? C.lit : depth < 4 ? C.lit2 : mix(C.sh, C.sh3, clamp(depth / 26 + (n - 0.5) * 0.3));
      if (n > 0.86 && depth > 6) c = C.sh3;
      put(FX(x), y, c, FORE);
    }
  }
  // the climbers' path along the crest
  const path = [];
  for (let x = W + 8; x >= 92; x -= 0.5) path.push([x, crest(Math.min(W - 1, x))]);
  const plen = path.length;

  // cloud texture, wide and seamlessly wrapping, scrolled each frame
  const tex = new Float32Array(TEXW * TEXH);
  const f = (x, y) => fbm(x / 26, y / 13, 3, 71) * 0.82 + fbm(x / 8, y / 6, 2, 73) * 0.18;
  for (let y = 0; y < TEXH; y++) for (let x = 0; x < TEXW; x++) tex[y * TEXW + x] = ((TEXW - x) * f(x, y) + x * f(x - TEXW, y)) / TEXW;

  const out = new Float32Array(W * H * 3), adj = new Int8Array(W * H), keyCache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = keyCache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    keyCache.set(k, best);
    return best;
  };
  const CL = [C.c0, C.c1, C.c2, C.c3, C.c4, C.c5];

  return (t) => {
    out.set(rgb); adj.fill(0);
    const add = (x, y, c, a, lv) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
      if (lv) adj[i] = lv;
    };
    // roped climbers walking the crest from the right, over the top and down into the cloud
    const P = 48, u = (t % P) / P;
    for (let k = 0; k < 5; k++) {
      const s = Math.floor((u * 1.3 - k * 0.036) * plen);
      if (s < 0 || s >= plen) continue;
      const [x, y] = path[s], bob = Math.sin(t * 4 + k * 1.3) > 0 ? 0 : 1;
      const cx = Math.round(x), by = Math.round(y) - 1;
      const jacket = k % 2 === 0 ? C.red : C.ink;
      add(cx, by, C.ink, 1, -1); add(cx + 1 + bob, by, C.ink, 1, -1); add(cx, by - 1, C.ink, 1, -1); add(cx + 1, by - 1, C.ink, 1, -1);
      for (let j = 2; j <= 5; j++) { add(cx, by - j, jacket, 1, -1); add(cx + 1, by - j, jacket, 1, -1); }
      for (let j = 3; j <= 5; j++) add(cx + 2, by - j, C.ink, 1, -1);
      for (let j = 6; j <= 7; j++) { add(cx, by - j, C.ink, 1, -1); add(cx + 1, by - j, C.ink, 1, -1); }
      add(cx - 1, by - 3 - bob, C.ink, 1, -1); add(cx - 2, by - 2 - bob, C.ink, 1, -1);
      if (k < 4) { const s2 = Math.floor((u * 1.3 - (k + 1) * 0.036) * plen); if (s2 >= 0 && s2 < plen) { const [x2, y2] = path[s2]; for (let q = 1; q < 4; q++) add(lerp(cx + 2, x2, q / 4), lerp(by - 3, y2 - 4, q / 4) + 0.5, C.ink, 0.7); } }
    }
    // the cloud sea, drifting left; lit pink-gold where it billows up, lavender in the hollows
    const off = Math.floor(t * 2.2);
    for (let y = CLOUD_TOP - 6; y < H; y++) {
      const ty = y - CLOUD_TOP + 4, row = Math.max(0, Math.min(TEXH - 1, ty)) * TEXW;
      const thr = 0.6 - (y - (CLOUD_TOP - 6)) * 0.016;
      for (let x = 0; x < W; x++) {
        const i = y * W + x, m = mask[i];
        if (m === FORE && x > 112) continue;
        const tx = (x + off) % TEXW, d = tex[row + tx];
        const dUp = tex[Math.max(0, ty - 2) * TEXW + tx];
        const a = clamp((d - thr) * 9);
        if (a <= 0) continue;
        const light = clamp(0.62 + (d - dUp) * 9 - (y - CLOUD_TOP) / 110 + clamp(1 - Math.abs(x - SUN[0]) / 60) * 0.25);
        const c = CL[Math.min(5, 2 + Math.floor(light * 4))];
        const fa = m === FORE ? a * clamp((112 - x) / 14) : a;
        out[i * 3] = lerp(out[i * 3], c[0], fa); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], fa); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], fa);
      }
    }

    const text = [], color = [];
    for (let y = 0; y < H; y++) {
      let tr = "", cr = "";
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, r = out[i], g = out[i + 1], b = out[i + 2];
        const k = nearest(r, g, b), Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const lv = Y > 0.86 ? 7 : clamp(Math.round(5 + (Y - LUM[k]) * 12) + adj[y * W + x], 2, 6);
        tr += LEVELS[lv]; cr += KEYS[k];
      }
      text.push(tr); color.push(cr);
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
}
