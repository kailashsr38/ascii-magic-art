/* paris-rooftops-dusk: the iron lattice tower over Paris zinc rooftops at dusk, hand-built.
 * A static scene (dusk sky, the tower with its lattice, arch and platforms, a far row of roofs,
 * the near mansard roofs with dormers, chimney stacks and lit windows) is painted once; each
 * frame adds the low sun, drifting cloud, chimney smoke and pigeons crossing. */
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
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  const get = (x, y) => { x = clamp(Math.round(x), 0, W - 1); y = clamp(Math.round(y), 0, H - 1); const i = (y * W + x) * 3; return [rgb[i], rgb[i + 1], rgb[i + 2]]; };
  return { rgb, layer, put, blend, get };
}
// Per frame: a working copy, a depth-aware blend, and the conversion to text.
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
  const add = (x, y, c, a, upTo = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = y * W + x;
    if (layer[i] > upTo) return;
    if (a >= 1) { out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2]; return; }
    out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
  };
  const rect = (x0, y0, x1, y1, c, upTo) => { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) add(x, y, c, 1, upTo); };
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
  return { out, add, rect, begin, finish };
}


const ANCHORS = [
  ["#2c3a7a", "#38408a", "#4a4a94", "#6a5590", "#8e6090", "#b06a8a", "#d27a7a", "#e88a70", "#f6a46c", "#fbc078", 16],
  ["#fff4d8", "#ffe2a8", 2],
  ["#140f20", "#1e1830", "#2a2240", 3],
  ["#3a2c50", "#5a3a5a", "#6e4458", 3],
  ["#3c3058", "#4a3a6a", "#5a4878", "#6c5684", 4],
  ["#3a3856", "#504e70", "#6c6a8c", "#8a86a6", 4],
  ["#221a2a", "#2e2234", "#3a2c3c", "#4a3846", 4],
  ["#3a2830", "#a85a40", "#c8704a", 3],
  ["#f0b468", "#d89058", "#a86848", 3],
  ["#8a7a98", "#a898b0", 2],
  ["#c87a8a", "#e8a090", 2],
];
const PAL = buildPal(ANCHORS);

export const meta = {
  slug: "paris-rooftops-dusk", name: "Paris Rooftops Dusk", category: "cities",
  note: "The iron lattice tower rises over Paris zinc rooftops at dusk, with chimney smoke drifting, pigeons crossing and the sun going down behind the roofs.",
  tags: ["paris", "france", "dusk", "rooftops", "tower", "chimneys", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, TOWER = 1, FAR = 2, NEAR = 3;

export default function create() {
  const { rgb, layer, put, get } = makeCanvas();
  const SUN = [40, 73], SR = 6;
  // 1. dusk sky: deep blue above, rose and amber toward the roofs, warm around the sun
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#2c3a7a"], [0.14, "#38408a"], [0.3, "#4a4a94"], [0.45, "#6a5590"], [0.56, "#8e6090"], [0.66, "#b06a8a"], [0.75, "#d27a7a"], [0.83, "#e88a70"], [0.9, "#f6a46c"], [1, "#fbc078"]], y / 86);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.3);
    c = mix(c, hex("#fbc078"), clamp(1 - d / 46) * 0.5);
    put(x, y, c, SKY);
  }
  // 2. the tower: curved profile, open arch between the legs, platforms, lattice holes
  const CX = 130, TOP = 9, BASE = 88;
  const hw = (y) => 1.2 + 29 * Math.pow(clamp((y - TOP) / (BASE - TOP)), 2.6);
  const P1 = 64, P2 = 43;
  const archR = hw(BASE) - 9;
  const DARK = hex("#140f20"), DARK2 = hex("#1e1830");
  for (let y = TOP; y < BASE; y++) {
    const w = hw(y);
    for (let x = Math.floor(CX - w); x <= Math.ceil(CX + w); x++) {
      const dx = Math.abs(x - CX);
      if (dx > w) continue;
      if (y > P1 + 2) {
        const legw = 4 + (y - P1) * 0.28, inner = w - legw;
        const archY = P1 + 4 + 15 * (1 - Math.sqrt(Math.max(0, 1 - (dx / archR) ** 2)));
        if (dx < inner && y > archY) continue; // open arch
      }
      const edge = dx > w - 1.3;
      const brace = ((y + Math.round(dx)) % 5 === 0) || ((y - Math.round(dx) + 500) % 5 === 0) || y % 9 === 0;
      if (w < 3.2 || edge || brace) put(x, y, edge || w < 2 ? DARK : DARK2, TOWER);
      else put(x, y, mix(get(x, y), DARK, 0.5), TOWER);
    }
  }
  // platforms
  for (const [py, ext, th] of [[P1, 3, 3], [P2, 2, 2]]) {
    const w = hw(py + th) + ext;
    for (let y = py; y < py + th; y++) for (let x = Math.floor(CX - w); x <= CX + w; x++) put(x, y, y === py ? DARK2 : DARK, TOWER);
    for (let x = Math.floor(CX - w); x <= CX + w; x += 2) put(x, py - 1, DARK, TOWER);
  }
  // top cabin and mast
  for (let y = TOP - 1; y < TOP + 3; y++) for (let x = CX - 2; x <= CX + 2; x++) put(x, y, DARK, TOWER);
  for (let y = TOP - 8; y < TOP - 1; y++) put(CX, y, DARK, TOWER);
  // 3. far roofs: a hazy row of mansards and chimneys
  for (let x = 0; x < W;) {
    const bw = 10 + Math.floor(hash(x, 3) * 16), top = 80 + Math.floor(hash(x, 4) * 5) + (x > 96 && x < 166 ? 3 : 0);
    for (let xx = x; xx < x + bw && xx < W; xx++) {
      const inset = Math.min(xx - x, x + bw - 1 - xx), rt = top + Math.max(0, 3 - inset);
      for (let y = rt; y < H; y++) put(xx, y, y < top + 4 ? hex("#4a3a6a") : hex("#3c3058"), FAR);
    }
    if (hash(x, 5) < 0.7) { const cx = x + 3 + Math.floor(hash(x, 6) * (bw - 6)); for (let y = top - 4; y < top + 1; y++) for (let k = 0; k < 3; k++) put(cx + k, y, hex("#3c3058"), FAR); }
    for (let yy = top + 6; yy < 100; yy += 3) for (let xx = x + 2; xx < x + bw - 2; xx += 3) if (hash(xx, yy) < 0.3) put(xx, yy, hex("#c8704a"), FAR);
    x += bw;
  }
  // 4. near roofs: zinc mansards with dormers, chimney stacks and a facade of windows below
  const blocks = [[-2, 54, 80, 90], [54, 90, 86, 95], [90, 112, 91, 99], [112, 160, 96, 103], [160, 194, 84, 93]];
  const stacks = [];
  for (const [x0, x1, top, base] of blocks) {
    const slope = base - top;
    for (let y = top; y < H; y++) for (let x = x0; x < x1; x++) {
      if (y < base) {
        const k = (y - top) / slope, l = x0 + (1 - k) * 4, r = x1 - (1 - k) * 4;
        if (x < l || x > r) continue;
        const lit = 1 - k, seam = (x - x0) % 4 === 0;
        put(x, y, seam ? hex("#3a3856") : mix(hex("#504e70"), hex("#8a86a6"), clamp(lit * 0.9)), NEAR);
      } else {
        const fy = y - base;
        let c = fy === 0 ? hex("#4a3846") : fy === 1 ? hex("#221a2a") : hex("#2e2234");
        if (fy > 2 && (fy - 3) % 6 < 3 && (x - x0) % 6 >= 2 && (x - x0) % 6 < 4) c = hash(x >> 1, fy) < 0.45 ? hex("#d89058") : hex("#221a2a");
        if (fy > 2 && (fy - 3) % 6 === 3) c = hex("#3a2c3c"); // balcony rail
        put(x, y, c, NEAR);
      }
    }
    // roof ridge line
    for (let x = x0 + 4; x < x1 - 4; x++) put(x, top, hex("#8a86a6"), NEAR);
    // dormers
    for (let dx = x0 + 7; dx < x1 - 8; dx += 11) {
      const dy = top + Math.floor(slope * 0.35);
      for (let y = dy; y < dy + 5; y++) for (let x = dx; x < dx + 5; x++) put(x, y, hex("#4a3846"), NEAR);
      for (let x = dx - 1; x < dx + 6; x++) put(x, dy - 1, hex("#3a3856"), NEAR);
      put(dx + 2, dy - 2, hex("#3a3856"), NEAR);
      const lit = hash(dx, top) < 0.65;
      for (let y = dy + 1; y < dy + 4; y++) for (let x = dx + 1; x < dx + 4; x++) put(x, y, lit ? (x === dx + 2 ? hex("#a86848") : hex("#f0b468")) : hex("#221a2a"), NEAR);
    }
    // chimney stacks with rows of pots
    for (let cx = x0 + 3 + Math.floor(hash(x0 + 9, 1) * 6); cx < x1 - 6; cx += 17 + Math.floor(hash(cx, 2) * 8)) {
      const ch = 6 + Math.floor(hash(cx, 3) * 5), cw = 6;
      for (let y = top - ch; y < top + 3; y++) for (let x = cx; x < cx + cw; x++) put(x, y, x === cx + cw - 1 ? hex("#221a2a") : hex("#3a2830"), NEAR);
      for (let x = cx; x < cx + cw; x += 2) { put(x, top - ch - 1, hex("#a85a40"), NEAR); put(x, top - ch - 2, hex("#c8704a"), NEAR); }
      stacks.push([cx + 1 + Math.floor(hash(cx, 9) * 4), top - ch - 3]);
    }
  }

  const F = makeFrame(rgb, layer, PAL), { add } = F;
  const SMOKE = hex("#8a7a98"), SMOKE2 = hex("#a898b0"), BIRD = hex("#140f20");
  const clouds = [[0.15, 0.3, 30, 1.4, "#c87a8a", 0.5], [0.6, 0.38, 22, 1.2, "#e8a090", 0.35], [0.9, 0.22, 52, 1.6, "#c87a8a", 0.6], [0.4, 0.2, 14, 1, "#8e6090", 0.4]];
  const birds = Array.from({ length: 9 }, (_, i) => ({ dx: (i % 5) * 6 + hash(i, 1) * 3, dy: Math.floor(i / 3) * 3 + hash(i, 2) * 2, ph: i * 1.3 }));

  return (t) => {
    F.begin();
    // low sun, partly behind the far roofs
    for (let y = SUN[1] - SR; y <= SUN[1] + SR; y++) for (let x = SUN[0] - SR; x <= SUN[0] + SR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SR) add(x, y, d < SR - 1.3 ? hex("#fff4d8") : hex("#ffe2a8"), 1, SKY);
    }
    // thin cloud streaks drifting right
    for (const [u, len, cy, th, col, sp] of clouds) {
      const L = len * W, cx = ((((u * W + t * sp) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3, C = hex(col);
      for (let y = Math.floor(cy - th * 3); y <= cy + th * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.1 + cy) * th;
        const a = clamp(along * 2.5) * clamp(1 - Math.abs(y - cy - wob) / (th * 1.5 * (0.4 + along)));
        if (a > 0.05) add(x, y, C, a * 0.7, SKY);
      }
    }
    // chimney smoke: puffs rising and leaning right with the breeze
    stacks.forEach(([sx, sy], k) => {
      for (let p = 0; p < 9; p++) {
        const age = ((t * 0.35 + p / 9 + k * 0.37) % 1), r = 1 + age * 3.2;
        const px = sx + age * age * 26 + Math.sin(age * 6 + k) * 1.5, py = sy - age * 16;
        const a = (1 - age) * 0.85;
        for (let y = Math.floor(py - r); y <= py + r; y++) for (let x = Math.floor(px - r); x <= px + r; x++) {
          const d = Math.hypot(x - px, y - py) / r;
          if (d < 1) add(x, y, d < 0.5 ? SMOKE2 : SMOKE, a * (1 - d * 0.6), TOWER);
        }
      }
    });
    // pigeons: a small flock crossing every 20 s, flapping
    const bt = (t % 20) / 20, fx = lerp(-40, W + 10, bt), fy = 28 + Math.sin(bt * 5) * 5;
    for (const b of birds) {
      const x = Math.round(fx + b.dx), y = Math.round(fy + b.dy + Math.sin(t * 1.7 + b.ph)), up = Math.sin(t * 10 + b.ph) > 0;
      add(x, y, BIRD, 1, TOWER);
      add(x - 1, y + (up ? -1 : 0), BIRD, 1, TOWER); add(x + 1, y + (up ? -1 : 0), BIRD, 1, TOWER);
    }
    return F.finish();
  };
}
