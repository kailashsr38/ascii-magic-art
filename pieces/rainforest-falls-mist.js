/* rainforest-falls-mist: a rainforest waterfall with mist and ferns, hand-built picture scene. */
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
  ["#a0b87c", "#b4c88e", "#c4d49c", 5],
  ["#5a8462", "#6c9470", "#80a47c", 3],
  ["#1e2a20", "#2a3a2a", "#34482e", 4],
  ["#5a8040", "#74a04c", "#8cb85a", 4],
  ["#bcdcd8", "#a8d0cc", "#88b8b4", "#6a9c98", 7],
  ["#30706a", "#4a9890", "#58a49c", 4],
  ["#2c5a2c", "#4a8238", "#68a844", "#8cc454", "#a8d860", 8],
  ["#2a1e16", "#4a3626", 2],
  ["#d84a2a", "#f0c040", 2],
]);

export const meta = {
  slug: "rainforest-falls-mist", name: "Rainforest Falls Mist", category: "landscapes",
  note: "A tall waterfall pours down a mossy cliff into a jungle pool, with mist rolling off the water, ferns swaying in front and birds crossing the canopy light.",
  tags: ["waterfall", "rainforest", "jungle", "nature", "mist", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C;
  const LIP = 20, POOL = 84, FX0 = 84, FX1 = 104;
  const fallL = (y) => FX0 - (y - LIP) * 0.1, fallR = (y) => FX1 + (y - LIP) * 0.1;
  const kind = new Uint8Array(W * H); // 1 sky, 2 fall, 3 pool
  // 1. canopy light: pale sky glowing through, softly
  for (let y = 0; y < 40; y++) for (let x = 0; x < W; x++) { put(x, y, ramp([[0, "#c4d49c"], [0.5, "#b4c88e"], [1, "#a0b87c"]], y / 40)); kind[y * W + x] = 1; }
  // 2. far jungle: hazy layered tree crowns
  const crown = (x, base, amp, s) => base - amp * fbm(x / 10, s, 3, s) - Math.abs(Math.sin(x / (7 + s % 5) + s)) * amp * 0.5;
  for (let x = 0; x < W; x++) {
    const c1 = crown(x, 30, 14, 3), c2 = crown(x, 40, 12, 8);
    for (let y = Math.floor(c1); y < H; y++) { put(x, y, mix(hex("#80a47c"), hex("#6c9470"), clamp((y - c1) / 20))); kind[y * W + x] = 0; }
    for (let y = Math.floor(c2); y < H; y++) put(x, y, mix(hex("#6c9470"), hex("#5a8462"), clamp((y - c2) / 20)));
  }
  // 3. the cliff: dark mossy rock, a wide amphitheatre around the falls
  const cliffTop = (x) => LIP - 2 + Math.pow(Math.abs(x - 94) / 60, 2) * 22 + (noise2(x / 5, 4, 2) - 0.5) * 4;
  for (let x = 20; x < 172; x++) for (let y = Math.floor(cliffTop(x)); y < POOL + 2; y++) {
    if (Math.abs(x - 94) > 62 + (y - 30) * 0.4) continue;
    const n = fbm(x / 6, y / 5, 4, 11), m = fbm(x / 9, y / 9, 3, 21);
    let c = ramp([[0, "#16201a"], [0.4, "#1e2a20"], [0.7, "#2a3a2a"], [1, "#34482e"]], n);
    if (m > 0.55) c = ramp([[0, "#5a8040"], [0.5, "#74a04c"], [1, "#8cb85a"]], (m - 0.55) * 4);
    if (y - cliffTop(x) < 2 && m > 0.4) c = hex("#8cb85a");
    put(x, y, c); kind[y * W + x] = 0;
  }
  // 4. the pool
  for (let y = POOL; y < H; y++) for (let x = 0; x < W; x++) { put(x, y, ramp([[0, "#4a9890"], [0.5, "#58a49c"], [1, "#4a9890"]], (y - POOL) / (H - POOL))); kind[y * W + x] = 3; }
  // 5. side jungle: big leafy masses and trunks framing the falls
  const sideEdge = (y, side) => side ? 160 - 18 * fbm(y / 8, 1, 3, 5) + (y < 40 ? (40 - y) * 0.6 : 0) : 30 + 18 * fbm(y / 8, 2, 3, 6) - (y < 40 ? (40 - y) * 0.6 : 0);
  for (let y = 0; y < POOL + 4; y++) for (let x = 0; x < W; x++) {
    const left = x < sideEdge(y, 0), right = x > sideEdge(y, 1);
    if (!left && !right) continue;
    const n = fbm(x / 5, y / 5, 4, left ? 31 : 41);
    put(x, y, ramp([[0, "#2c5a2c"], [0.35, "#4a8238"], [0.6, "#68a844"], [0.8, "#8cc454"], [1, "#a8d860"]], n * 1.15 - 0.05)); kind[y * W + x] = 0;
  }
  for (const [tx, w] of [[12, 4], [176, 5], [40, 2]]) for (let y = 0; y < POOL + 6; y++) for (let x = tx; x < tx + w; x++) put(x, y, x === tx ? hex("#4a3626") : hex("#2a1e16"));
  // 6. foreground: dark boulders at the pool edge
  for (const [bx, by, rx, ry] of [[20, 104, 30, 12], [178, 102, 28, 14], [140, 108, 22, 8]]) for (let y = by - ry; y < H; y++) for (let x = bx - rx; x < bx + rx; x++) {
    if (((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2 < 1) { const n = fbm(x / 4, y / 4, 3, 9); put(x, y, n > 0.58 ? hex("#8cb85a") : n > 0.45 ? hex("#74a04c") : hex("#5a8040")); kind[y * W + x] = 0; }
  }
  for (let y = LIP; y < POOL + 1; y++) for (let x = Math.floor(fallL(y)); x <= fallR(y); x++) kind[y * W + x] = 2;
  // 7. the canopy overhead: leaves hanging into the light
  for (let y = 0; y < 16; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 7, y / 3.5, 4, 61), edge = 0.42 + y * 0.028 + (1 - Math.abs(x - 96) / 96) * 0.1;
    if (n > edge) put(x, y, n > edge + 0.08 ? hex("#4a8238") : hex("#2c5a2c"));
  }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const WHITE = hex("#bcdcd8"), PALE = hex("#a8d0cc"), WSH = hex("#88b8b4"), WDK = hex("#6a9c98"), MIST = hex("#a8d0cc"), RING = hex("#6a9c98");
  const FERN = hex("#1e2a20"), FERN2 = hex("#2a3a2a"), FERNDK = hex("#1e2a20"), BIRD = hex("#1e2a20"), RED = hex("#d84a2a"), YEL = hex("#f0c040");
  const ferns = [[2, 112, -1.35, 44, 0], [6, 112, -0.95, 52, 1], [12, 112, -0.6, 50, 2], [20, 112, -0.3, 40, 3], [190, 112, -1.8, 44, 4], [186, 112, -2.2, 52, 5], [180, 112, -2.55, 48, 6], [172, 112, -2.85, 38, 7]];

  return (t) => {
    out.set(base);
    // falling water: vertical streaks that scroll downward, faster near the bottom
    for (let y = LIP; y < POOL + 1; y++) {
      const xl = Math.floor(fallL(y)), xr = Math.floor(fallR(y)), fall = (y - LIP) / (POOL - LIP);
      for (let x = xl; x <= xr; x++) {
        const edge = Math.min(x - xl, xr - x);
        const n = noise2(x * 0.6, y * 0.16 - t * (2.6 + fall * 1.5), 5) * 0.65 + noise2(x * 0.3, y * 0.07 - t * 1.8, 6) * 0.35;
        let c = n > 0.62 ? WHITE : n > 0.45 ? PALE : n > 0.3 ? WSH : WDK;
        if (edge < 1 && n < 0.5) c = WDK;
        put(x, y, c);
      }
      if (y === LIP) for (let x = xl - 1; x <= xr + 1; x++) put(x, y, WHITE);
    }
    // ripples spreading out from the plunge
    for (let k = 0; k < 4; k++) {
      const r = ((t * 5 + k * 11) % 44) + 12, a = 0.8 * (1 - r / 56);
      for (let s = 0; s < 120; s++) {
        const ang = Math.PI * (s / 119), x = 94 + Math.cos(ang) * r, y = POOL + 1 + Math.sin(ang) * r * 0.25;
        const xi = Math.floor(x), yi = Math.floor(y);
        if (yi < H && kind[yi * W + xi] === 3) C.add(xi, yi, RING, a);
      }
    }
    // mist rolling off the base of the falls
    for (let y = POOL - 20; y < POOL + 12; y++) for (let x = 40; x < 150; x++) {
      const d = Math.hypot((x - 94) / 54, (y - POOL + 2) / 16);
      if (d > 1) continue;
      const n = fbm(x / 14 - t * 0.25, y / 6 + t * 0.15, 3, 3);
      const a = clamp((n - 0.3) * 2.6) * (1 - d * d) * 0.9;
      if (a > 0.03) C.add(x, y, MIST, a);
    }
    // birds crossing the canopy light
    const bx = ((t * 9) % (W + 60)) - 30;
    for (const [dx, by, ph, col] of [[0, 9, 0, RED], [9, 13, 1.7, YEL], [-10, 15, 0.8, RED]]) {
      const x = Math.round(bx + dx), y = Math.round(by + Math.sin(t * 1.4 + ph) * 1.5), up = Math.sin(t * 10 + ph) > 0;
      put(x, y, col); put(x + 1, y, col); put(x - 1, y - (up ? 1 : -1), BIRD); put(x + 2, y - (up ? 1 : -1), BIRD); put(x - 2, y - (up ? 2 : 0), BIRD); put(x + 3, y - (up ? 2 : 0), BIRD);
    }
    // ferns in the foreground, each frond swaying on its own beat
    for (const [fx, fy, ang0, len, ph] of ferns) {
      const sway = Math.sin(t * 1.1 + ph * 1.3) * 0.12;
      let x = fx, y = fy, a = ang0 + sway;
      for (let s = 0; s < len; s++) {
        const bend = (s / len) * (s / len) * 1.3 * (Math.cos(ang0) < 0 ? -1 : 1);
        const aa = a + bend + Math.sin(t * 1.1 + ph * 1.3 + s * 0.08) * 0.05 * s / len * 4;
        x += Math.cos(aa); y += Math.sin(aa);
        put(x, y, FERNDK);
        if (s % 3) continue;
        const leaf = Math.round((1 - s / len) * 5 + 1), nx = -Math.sin(aa), ny = Math.cos(aa);
        for (let k = 1; k <= leaf; k++) {
          const fx2 = Math.cos(aa) * k * 0.6, fy2 = Math.sin(aa) * k * 0.6;
          put(x + nx * k + fx2, y + ny * k + fy2, k > leaf - 2 ? FERN2 : FERN);
          put(x - nx * k + fx2, y - ny * k + fy2, k > leaf - 2 ? FERN2 : FERN);
        }
      }
    }
    return enc(out);
  };
}
