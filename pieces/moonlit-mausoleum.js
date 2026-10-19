/* moonlit-mausoleum: a domed white marble mausoleum under a full moon, with a long reflecting pool, hand-built.
 * A static scene (night sky, moon, tree lines, the mausoleum with its dome and
 * four minarets, cypress rows, the pool and its mirrored image) is painted once;
 * each frame adds ripple lines rolling down the pool, drifting cloud and birds. */
import { fbm, noise2, clamp, lerp, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const ANCHORS = [
  ["#0a1024", "#1a2850", "#22346a", "#2e4680", "#3e5a94", "#5a78b0", 8],
  ["#6a88b8", "#8ea6c8", "#b0c2dc", 4],
  ["#dfe6f2", "#f4f6fb", "#fffdf2", 3],
  ["#b7c3d8", "#c9d3e4", "#dbe3ef", "#e9eef6", 6],
  ["#6d7c99", "#7f8eab", "#94a2bd", "#a5b2ca", 5],
  ["#1e2740", "#2b3756", "#3c4a6b", 3],
  ["#03050a", "#0a0f1c", "#24344e", "#2e4260", "#3a5070", 5],
  ["#6a7898", "#8492b0", 2],
  ["#1e3058", "#2a3e70", "#34497c", "#3e5688", 5],
  ["#56657f", "#6f7f9a", "#8c9bb4", 4],
  ["#4a6098", "#5e74a8", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "moonlit-mausoleum", name: "Moonlit Mausoleum", category: "landscapes",
  note: "A white marble mausoleum with a great dome and four minarets glows under a full moon, mirrored in a long rippling pool.",
  tags: ["moon", "night", "mausoleum", "landmark", "india", "reflection", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";
const SKY = 1, TREE = 2, BUILD = 3, GROUND = 4, POOL = 5;

const C = Object.fromEntries(Object.entries({
  lit: "#e9eef6", lit2: "#dbe3ef", mid: "#c9d3e4", soft: "#b7c3d8", sh: "#94a2bd", sh2: "#7f8eab", sh3: "#6d7c99",
  arch: "#1e2740", arch2: "#2b3756", arch3: "#3c4a6b", black: "#03050a", tree: "#03050a", tree2: "#0a0f1c", lawn: "#0a0f1c", lawn2: "#24344e",
  path: "#6a7898", path2: "#a5b2ca", water: "#2a3e70", water2: "#34497c", moon: "#fffdf2", moon2: "#f4f6fb", halo: "#8ea6c8", cloud: "#4a6098", cloud2: "#5e74a8", bird: "#0a1024",
}).map(([k, v]) => [k, hex(v)]));

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };
  const MOON = [150, 19], MR = 8.5, CX = 96, BASE = 62;

  // 1. sky: deep navy at the top, lifting toward the horizon, with the moon's halo
  for (let y = 0; y < BASE; y++) for (let x = 0; x < W; x++) {
    const v = y / BASE;
    let c = v < 0.5 ? mix(hex("#1a2850"), hex("#2e4680"), v / 0.5) : mix(hex("#2e4680"), hex("#5a78b0"), (v - 0.5) / 0.5);
    const d = Math.hypot(x - MOON[0], y - MOON[1]);
    c = mix(c, C.halo, clamp(1 - (d - MR) / 30) ** 2 * 0.55);
    put(x, y, d < MR ? (d < MR - 1.5 ? C.moon : C.moon2) : c, SKY);
  }
  // 2. distant tree lines either side
  for (let x = 0; x < W; x++) {
    const top = 50 + 3 * fbm(x / 7, 1, 3, 4) + (Math.abs(x - CX) < 50 ? 6 : 0);
    for (let y = Math.floor(top); y < BASE; y++) put(x, y, y < top + 2 ? C.tree2 : C.tree, TREE);
  }
  // 3. the mausoleum
  const shade = (x, x0, x1) => clamp((x - x0) / (x1 - x0));
  const marble = (u, n = 0) => { const v = clamp(u + n); return v < 0.5 ? mix(C.sh3, C.soft, v / 0.5) : mix(C.soft, C.lit, (v - 0.5) / 0.5); };
  // plinth
  for (let y = 56; y < BASE; y++) for (let x = 50; x <= 142; x++) put(x, y, y === 56 ? C.lit2 : mix(C.sh2, C.mid, 0.3 + 0.5 * shade(x, 50, 142)), BUILD);
  // main body with chamfered corner bays
  for (let y = 33; y < 56; y++) for (let x = 66; x <= 126; x++) {
    const corner = x < 75 || x > 117;
    const u = corner ? (x < 75 ? 0.45 : 0.9) : 0.55 + 0.3 * shade(x, 75, 117);
    put(x, y, marble(u, (noise2(x / 3, y / 3, 2) - 0.5) * 0.06), BUILD);
  }
  for (let x = 66; x <= 126; x += 3) put(x, 32, C.lit2, BUILD);
  // pointed arch shape helper
  const arch = (x0, x1, y0, y1, col, rim) => {
    const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2, ah = hw * 1.1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dy = y - y0;
      if (dy < ah) { const k = 1 - dy / ah; if (Math.abs(x - cx) > hw * Math.sqrt(1 - k * k) * 1.02 - 0.2) continue; }
      put(x, y, col, BUILD);
    }
    if (rim) for (let y = y0 + Math.round(ah); y <= y1; y++) { put(x0 - 1, y, rim, BUILD); put(x1 + 1, y, rim, BUILD); }
  };
  // great central iwan
  for (let y = 34; y < 56; y++) for (let x = 84; x <= 108; x++) put(x, y, marble(0.68 + 0.25 * shade(x, 84, 108)), BUILD);
  arch(87, 105, 37, 55, C.arch2, null);
  arch(91, 101, 45, 55, C.arch, null);
  // side niches, two storeys
  for (const [x0, x1] of [[68, 73], [77, 82], [110, 115], [119, 124]]) { arch(x0, x1, 37, 44, C.arch3, null); arch(x0, x1, 47, 55, C.arch2, null); }
  // drum and the onion dome
  for (let y = 27; y < 33; y++) for (let x = 82; x <= 110; x++) put(x, y, marble(0.45 + 0.45 * shade(x, 82, 110)), BUILD);
  const R = 16, DB = 27, DH = 23;
  for (let y = DB - DH; y <= DB; y++) {
    const v = (DB - y) / DH;
    let w = v < 0.35 ? R * (0.84 + 0.16 * Math.sin((v / 0.35) * Math.PI / 2)) : R * Math.sqrt(Math.max(0, 1 - ((v - 0.35) / 0.65) ** 2));
    if (v > 0.8) w *= 1 - (v - 0.8) * 1.6;
    for (let x = Math.floor(CX - w); x <= CX + w; x++) {
      const u = (x - (CX - w)) / (2 * w + 0.001);
      const lit = 0.42 + 0.5 * u - 0.12 * (1 - Math.sin(Math.PI * u)) + 0.08 * v;
      put(x, y, marble(lit), BUILD);
    }
  }
  for (let y = 0; y < DB - DH; y++) put(CX, y, C.mid, BUILD);
  put(CX - 1, 2, C.sh, BUILD); put(CX + 1, 2, C.lit2, BUILD);
  // corner cupolas on the roof
  const cupola = (cx, base, r, h) => {
    for (let y = base; y < base + 3; y++) { put(cx - r + 1, y, C.sh, BUILD); put(cx + r - 1, y, C.lit2, BUILD); }
    for (let y = base - h; y < base; y++) {
      const v = (base - y) / h, w = r * Math.sqrt(Math.max(0, 1 - v * v)) * (v > 0.7 ? 1 - (v - 0.7) * 1.5 : 1);
      for (let x = Math.floor(cx - w); x <= cx + w; x++) put(x, y, marble(0.3 + 0.7 * (x - cx + w) / (2 * w + 0.01)), BUILD);
    }
    put(cx, base - h - 1, C.mid, BUILD);
  };
  cupola(73, 30, 4, 6); cupola(119, 30, 4, 6);
  // four minarets (two pairs, front pair taller and further out)
  const minaret = (cx, top, bottom, w) => {
    for (let y = top; y < bottom; y++) {
      const ww = w - (bottom - y) / (bottom - top) * 0 + (y - top) / (bottom - top) * 0.6;
      for (let x = Math.floor(cx - ww); x <= cx + ww; x++) put(x, y, x < cx ? C.sh : x === Math.floor(cx) ? C.mid : C.lit2, BUILD);
    }
    for (const f of [0.28, 0.55, 0.8]) {
      const y = Math.round(lerp(top, bottom, f));
      for (let x = Math.floor(cx - w - 1.5); x <= cx + w + 1.5; x++) { put(x, y, C.lit, BUILD); put(x, y + 1, C.sh3, BUILD); }
    }
    cupola(Math.round(cx), top, Math.round(w + 1.5), 4);
  };
  minaret(58.5, 20, 56, 1.6); minaret(133.5, 20, 56, 1.6);
  // 4. the terrace and gardens in front, with the pool narrowing into the distance
  const hw = (y) => lerp(9, 42, (y - 64) / (H - 64));
  for (let y = BASE; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.abs(x + 0.5 - CX), h = y >= 64 ? hw(y) : -1;
    if (y < 64) put(x, y, y === BASE ? C.path2 : C.path, GROUND);
    else if (d < h) put(x, y, C.water, POOL);
    else if (d < h + 1.5 + (y - 64) * 0.08) put(x, y, C.path2, GROUND);
    else if (d < h + 3 + (y - 64) * 0.18) put(x, y, C.path, GROUND);
    else put(x, y, mix(C.lawn, C.lawn2, clamp(fbm(x / 6, y / 4, 3, 8) * 1.6 - 0.75) * 0.6), GROUND);
  }
  const CYP = hex("#3a5070");
  // cypress rows flanking the pool, tall dark cones growing toward the viewer
  for (let k = 1; k < 6; k++) {
    const y = 62 + k * k * 0.8 + k * 2, h = 3 + (y - 62) * 0.62, w = h * 0.22;
    for (const side of [-1, 1]) {
      const cx = CX + side * (hw(Math.max(64, y)) + 8 + (y - 64) * 0.4);
      for (let yy = Math.floor(y - h); yy <= y; yy++) {
        const v = (y - yy) / h, ww = w * Math.sin(Math.PI * Math.min(1, (1 - v) * 0.9 + 0.1)) * (v > 0.85 ? (1 - v) / 0.15 : 1);
        for (let x = Math.floor(cx - ww); x <= cx + ww; x++) put(x, yy, x > cx ? CYP : C.black, TREE);
      }
    }
  }
  // 5. the mirrored image in the pool
  const refl = new Float32Array(W * H * 3);
  for (let y = 64; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (mask[i] !== POOL) continue;
    const sy = 2 * BASE - 1 - y + 6;
    let c = mix(C.water, C.water2, (y - 64) / (H - 64));
    if (sy >= 0) {
      const j = sy * W + x;
      if (mask[j] === BUILD) c = mix([rgb[j * 3], rgb[j * 3 + 1], rgb[j * 3 + 2]], C.water, 0.3);
      else if (mask[j] === TREE) c = C.tree;
      else if (mask[j] === SKY) c = mix([rgb[j * 3], rgb[j * 3 + 1], rgb[j * 3 + 2]], C.water, 0.4);
    }
    refl[i * 3] = c[0]; refl[i * 3 + 1] = c[1]; refl[i * 3 + 2] = c[2];
    put(x, y, c, POOL);
  }

  const adj = new Int8Array(W * H);
  const out = new Float32Array(W * H * 3), keyCache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = keyCache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    keyCache.set(k, best);
    return best;
  };
  const birds = [[0, 0, 0], [6, 2, 1.1], [11, -1, 2.3], [17, 3, 0.6], [23, 1, 1.7]];

  return (t) => {
    out.set(rgb); adj.fill(0);
    const add = (x, y, c, a, only) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (only && mask[i] !== only) return;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
    };
    // ripple lines rolling down the pool toward the viewer, bending the mirrored image
    for (let y = 64; y < H; y++) {
      const ph = 70 / (y - 58) - t * 0.9;
      const s = Math.sin(ph * 6.28);
      const dx = Math.round(s * (0.4 + (y - 64) * 0.035));
      const dark = s > 0.8 ? 0.45 : 0;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (mask[i] !== POOL) continue;
        let sx = x + dx; if (mask[y * W + sx] !== POOL) sx = x;
        const j = (y * W + sx) * 3;
        if (dark) adj[i] = -2;
        out[i * 3] = lerp(refl[j], C.water[0], dark); out[i * 3 + 1] = lerp(refl[j + 1], C.water[1], dark); out[i * 3 + 2] = lerp(refl[j + 2], C.water[2], dark);
      }
    }
    // thin cloud drifting across the sky, passing over the moon
    const clouds = [[0.1, 50, 14, 1.4, C.cloud2, 0.9], [0.6, 70, 34, 1.1, C.cloud, 0.6], [0.35, 40, 8, 0.9, C.cloud, 0.5]];
    for (const [u, L, cy, th, col, sp] of clouds) {
      const cx = ((((u * W + t * sp * 1.4) % (W + L * 2)) + W + L * 2) % (W + L * 2)) - L;
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.13 + cy) * th;
        const a = clamp(along * 2) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, col, a * 0.75, SKY);
      }
    }
    // a few birds crossing in front of the moon every 20 s
    const bt = (t % 20) / 20, fx = lerp(-30, W + 10, bt), fy = 24 - bt * 10;
    for (const [dx, dy, ph] of birds) {
      const x = Math.round(fx + dx), y = Math.round(fy + dy + Math.sin(t * 1.6 + ph) * 0.8), up = Math.sin(t * 8 + ph) > 0;
      add(x, y, C.bird, 1, SKY); add(x - 1, y + (up ? -1 : 0), C.bird, 1, SKY); add(x + 1, y + (up ? -1 : 0), C.bird, 1, SKY);
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
