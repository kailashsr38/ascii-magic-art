/* machu-picchu-cloud: stone ruins and green terraces under a sugarloaf peak as morning cloud drifts through, hand-built picture scene. */
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
// a float RGB canvas with a cell-kind mask: put (opaque), add (blend)
function canvas() {
  const rgb = new Float32Array(W * H * 3), kind = new Uint8Array(W * H);
  const put = (x, y, c, k) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; if (k !== undefined) kind[i] = k; };
  const add = (x, y, c, a) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = (y * W + x) * 3; rgb[i] += (c[0] - rgb[i]) * a; rgb[i + 1] += (c[1] - rgb[i + 1]) * a; rgb[i + 2] += (c[2] - rgb[i + 2]) * a; };
  const rect = (x0, y0, x1, y1, c, k) => { for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) put(x, y, c, k); };
  return { rgb, kind, put, add, rect };
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };
const tri = (v) => { const f = v - Math.floor(v); return f < 0.5 ? f * 2 : 2 - f * 2; };

const PAL = buildPal([
  ["#7f9fbe", "#9cb4c8", "#b8c6cc", "#ccd2cc", 6],
  ["#fff4d8", "#ffe4a8", 2],
  ["#8ea4a8", "#6f8a90", "#557078", 4],
  ["#3e6634", "#548044", "#6e9a50", "#8ab460", 6],
  ["#22381e", "#2e4a28", 2],
  ["#8a8a7a", "#a8a490", 2],
  ["#cac2aa", "#aaa28c", "#8a8272", "#625c50", "#3c3830", 6],
  ["#9cc468", "#b2d47a", 2],
  ["#7a5a34", "#a8844c", 2],
  ["#b4bcbe", "#c8ced0", "#d0d4d6", 3],
  ["#d8ccb4", "#a07850", "#3a2c22", 3],
]);

export const meta = {
  slug: "machu-picchu-cloud", name: "Machu Picchu Morning Cloud", category: "cities",
  note: "Stone ruins and stepped green terraces sit beneath a steep sugarloaf peak as morning cloud drifts up the valley and llamas graze along the terraces.",
  tags: ["ruins", "mountains", "terraces", "llama", "cloud", "halftone", "travel", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, FAR = 2, MTN = 3, VAL = 4, RUIN = 5, FORE = 6;

export default function create() {
  const C = canvas(), { put, rect, kind } = C, R = rng(11);
  const SX = 30, SY = 20;
  // 1. sky, pale toward the valley, a low morning sun behind the left ridge
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#7f9fbe"], [0.55, "#b8c6cc"], [1, "#ccd2cc"]], y / 58);
    const d = Math.hypot(x - SX, y - SY);
    c = mix(c, hex("#ffe4a8"), clamp(1 - d / 24) ** 2 * 0.45);
    if (d < 3.6) c = d < 2.4 ? hex("#fff4d8") : hex("#ffe4a8");
    put(x, y, c, SKY);
  }
  // 2. far ranges, blue with haze
  const ridge = (base, amp, f, s, c0, c1) => {
    for (let x = 0; x < W; x++) {
      const top = base - amp * fbm(x / f, s, 4, s);
      for (let y = Math.floor(top); y < H; y++) put(x, y, mix(hex(c0), hex(c1), clamp((y - top) / 14)), FAR);
    }
  };
  ridge(50, 18, 26, 3, "#8ea4a8", "#6f8a90");
  ridge(58, 12, 18, 7, "#6f8a90", "#557078");
  // a range rising on the right behind the peak
  for (let x = 120; x < W; x++) {
    const top = lerp(58, 26, clamp((x - 140) / 52)) + (fbm(x / 9, 2, 3, 5) - 0.5) * 8;
    for (let y = Math.floor(top); y < H; y++) put(x, y, mix(hex("#6f8a90"), hex("#548044"), clamp((y - top) / 30) * 0.7), FAR);
  }
  // 3. the sugarloaf peak: steep, green, rock showing through, lit from the left
  const peak = (cx, top, wl, wr, base, dark) => {
    for (let x = Math.floor(cx - wl); x < cx + wr; x++) {
      const dx = x - cx, s = dx < 0 ? wl : wr;
      const ty = top + (base - top) * Math.pow(Math.abs(dx) / s, 1.6) + (noise2(x / 3, 3, 5) - 0.5) * 3;
      for (let y = Math.max(0, Math.floor(ty)); y < base + 10; y++) {
        const n = fbm(x / 5, y / 5, 3, 11);
        const lit = clamp(0.55 - dx / (s * 1.4));
        let c = mix(hex("#2e4a28"), hex("#8ab460"), clamp(lit * 0.8 + (n - 0.5) * 0.7 - dark + 0.2));
        if (n > 0.62 && y < ty + 28) c = mix(c, hex("#8a8a7a"), 0.65);
        if (noise2(x / 1.4, y / 10, 8) > 0.78 && y < ty + 20) c = mix(c, hex("#a8a490"), 0.45 * lit);
        put(x, y, c, MTN);
      }
    }
  };
  peak(140, 9, 36, 46, 66, 0);
  peak(104, 44, 16, 18, 66, 0.25);
  // the mountain the ruins sit beneath, filling the left
  for (let x = 0; x < 88; x++) {
    const top = 22 + x * 0.6 + (fbm(x / 8, 1, 3, 4) - 0.5) * 7;
    for (let y = Math.floor(top); y < H; y++) {
      const n = fbm(x / 6, y / 6, 3, 21);
      let c = mix(hex("#3e6634"), hex("#8ab460"), clamp(0.55 + (n - 0.5) * 0.9 - (y - top) / 70));
      if (n > 0.64) c = mix(c, hex("#8a8a7a"), 0.5);
      put(x, y, c, MTN);
    }
  }
  // 4. the saddle where the ruins stand: a grassy plateau
  const plat = [[28, 74], [54, 62], [100, 60], [130, 61], [162, 63], [186, 69], [192, 72], [192, 84], [28, 84]];
  for (let y = 56; y < 85; y++) for (let x = 20; x < W; x++) if (inPoly(x + 0.5, y + 0.5, plat)) {
    const n = noise2(x / 3, y / 2, 13);
    put(x, y, mix(hex("#6e9a50"), hex("#9cc468"), clamp(0.5 + (n - 0.5) * 0.8)), RUIN);
  }
  // roofless stone houses with gable ends, a few with thatch
  const house = (x0, w, h, base) => {
    const y0 = base - h, thatch = R() < 0.22;
    for (let y = y0; y < base; y++) for (let x = x0; x < x0 + w; x++) {
      const row = y - y0, brick = ((x + (row % 2) * 2) % 4 === 0) || row % 2 === 1 && y === base - 1;
      let c = x === x0 + w - 1 ? hex("#8a8272") : hex("#cac2aa");
      if (brick) c = mix(c, hex("#8a8272"), 0.5);
      if (!thatch && row < 2 && x > x0 && x < x0 + w - 1) c = row === 0 ? hex("#625c50") : hex("#3c3830");
      put(x, y, c, RUIN);
    }
    // gables
    for (let k = 1; k <= 3; k++) { put(x0 + k - 1, y0 - k, hex("#aaa28c"), RUIN); put(x0 + w - k, y0 - k, hex("#8a8272"), RUIN); }
    if (thatch) for (let k = 0; k < 4; k++) for (let x = x0 - 1 + k; x <= x0 + w - k; x++) put(x, y0 - k, k === 0 ? hex("#7a5a34") : hex("#a8844c"), RUIN);
    // trapezoid niches
    for (let x = x0 + 2; x < x0 + w - 2; x += 4) if (h > 4) { put(x, base - 3, hex("#3c3830"), RUIN); put(x, base - 2, hex("#3c3830"), RUIN); }
  };
  const row = (xa, xb, base) => { for (let x = xa; x < xb;) { const w = 8 + Math.floor(R() * 6); if (x + w > xb) break; house(x, w, 6 + Math.floor(R() * 3), base + Math.floor(R() * 2)); x += w + 1 + Math.floor(R() * 3); } };
  row(56, 102, 62); row(128, 188, 65); row(62, 108, 69); row(124, 180, 73);
  // terrace walls inside the site
  for (const [xa, xb, y] of [[100, 128, 66], [96, 130, 72]]) for (let x = xa; x < xb; x++) { put(x, y, hex("#aaa28c"), RUIN); put(x, y + 1, hex("#625c50"), RUIN); }
  // 5. foreground terraces curving round the hill, and the drop into the valley on the right
  const xr = (y) => 96 + (y - 72) * 1.7;
  const tg = (x, y) => y + 0.0016 * (x - 20) ** 2;
  const TS = 2.5, TP = 0.8;
  for (let y = 56; y < H; y++) for (let x = 0; x < W; x++) {
    const g = tg(x, y);
    if (x < xr(y)) {
      if (g < 74) continue;
      const ph = Math.pow(g - 74, TP) / TS, f = ph - Math.floor(ph), k = Math.floor(ph);
      let c;
      if (f > 0.68) { // stone wall face
        const bx = Math.floor((x + (k % 2) * 3) / 4), mortar = (x + (k % 2) * 3) % 4 === 0;
        c = mix(hex("#aaa28c"), hex("#8a8272"), hash(bx, k) * 0.7);
        if (mortar) c = hex("#625c50");
        if (f > 0.93) c = hex("#3c3830");
      } else {
        c = mix(hex("#6e9a50"), hex("#b2d47a"), clamp(f / 0.68 * 0.8 + (noise2(x / 2, y, 17) - 0.5) * 0.3));
      }
      if (x > xr(y) - 2) c = mix(c, hex("#2e4a28"), 0.6);
      put(x, y, c, FORE);
    } else if (y >= 70) {
      const n = fbm(x / 4, y / 4, 3, 31);
      put(x, y, mix(hex("#2e4a28"), hex("#6e9a50"), clamp(n * 1.2 - 0.2 - (y - 70) / 140)), VAL);
    }
  }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const MIST = hex("#c8ced0"), MIST2 = hex("#d0d4d6"), MIST3 = hex("#b4bcbe");
  const L1 = hex("#d8ccb4"), L2 = hex("#a07850"), LD = hex("#3a2c22"), LS = hex("#cac2aa");
  // a terrace's grass line for a llama to walk along
  const footY = (k, x) => { const s = Math.pow((k + 0.55) * TS, 1 / TP); return 74 + s - 0.0016 * (x - 20) ** 2; };
  const llamas = [
    { k: 1, a: 10, b: 70, sp: 0.022, ph: 0.1, c: L1, p: L2 },
    { k: 3, a: 6, b: 92, sp: 0.016, ph: 0.6, c: L2, p: L2 },
    { k: 5, a: 30, b: 110, sp: 0.013, ph: 0.35, c: L1, p: L1 },
  ];
  const llama = (x, y, dir, c, patch, step) => {
    const X = (dx) => x + dir * dx;
    // legs
    const o = step ? 1 : 0;
    for (let j = 1; j <= 3; j++) { put(X(0 + (j === 3 ? o : 0)), y - j, LD); put(X(5 + (j === 3 ? 1 - o : 0)), y - j, LD); put(X(1), y - j, j === 3 ? LD : c); put(X(4), y - j, c); }
    // body
    for (let dy = 4; dy <= 6; dy++) for (let dx = -1; dx <= 6; dx++) put(X(dx), y - dy, dy === 6 ? mix(c, LS, 0.3) : dx > 2 && dx < 5 && dy === 5 ? patch : c);
    put(X(-2), y - 6, c); put(X(-2), y - 5, c);
    // neck and head
    for (let dy = 7; dy <= 10; dy++) { put(X(6), y - dy, c); put(X(7), y - dy, c); }
    put(X(8), y - 10, c); put(X(9), y - 10, c); put(X(8), y - 9, c); put(X(9), y - 9, LD);
    put(X(6), y - 11, LD); put(X(7), y - 11, c);
  };

  return (t) => {
    out.set(base);
    // a long cloud bank drifting across the face of the peak
    for (let y = 26; y < 60; y++) {
      const env = clamp(1 - Math.abs(y - 44) / 16);
      for (let x = 0; x < W; x++) {
        const i = y * W + x, m = kind[i];
        if (m !== MTN && m !== FAR) continue;
        const n = fbm(x / 30 - t * 0.06, y / 6, 3, 41);
        C.add(x, y, MIST, clamp((n - 0.4) * 2.6) * env * 0.8);
      }
    }
    // cloud filling the valley and rising past the ruins
    for (let y = 58; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, m = kind[i];
      if (m !== VAL && m !== MTN && m !== FAR) continue;
      const n = fbm(x / 24 - t * 0.09, y / 7 + t * 0.012, 3, 9);
      const a = clamp((n - 0.32) * 2.6) * (m === VAL ? 0.95 : 0.7);
      C.add(x, y, n > 0.58 ? MIST2 : MIST3, a);
    }
    // a thin tongue of cloud slipping over the ruins, left to right
    const cx = ((t * 3.2) % 340) - 80;
    for (let y = 54; y < 80; y++) for (let x = Math.max(0, Math.floor(cx - 50)); x < Math.min(W, cx + 50); x++) {
      if (kind[y * W + x] !== RUIN) continue;
      const env = clamp(1 - Math.abs(x - cx) / 50) * clamp(1 - Math.abs(y - 64) / 12);
      const n = fbm(x / 14 - t * 0.05, y / 4, 2, 77);
      C.add(x, y, MIST, clamp((n - 0.4) * 2) * env * 0.7);
    }
    // llamas wandering along the terraces
    for (const L of llamas) {
      const v = t * L.sp + L.ph, u = tri(v), dir = (v - Math.floor(v)) < 0.5 ? 1 : -1;
      const x = Math.round(lerp(L.a, L.b, u)), y = Math.round(footY(L.k, x + 4));
      llama(x, y, dir, L.c, L.p, Math.floor(t * 3 + L.k) & 1);
    }
    return enc(out);
  };
}
