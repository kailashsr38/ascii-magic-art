/* kyoto-pagoda-dusk: an old lantern-lit street climbing to a five storey pagoda at dusk, hand-built picture scene. Static: sky, hills, pagoda, wooden houses, lanterns, wet paving. Per frame: people under umbrellas and light rain. */
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
  ["#2a3462", "#3e4c82", "#6a6aa0", "#b07c98", "#e0967e", "#eeb07e", 12],
  ["#5a5a8a", "#3e4270", 3],
  ["#3a4058", "#545a6a", 2],
  ["#fff4dc", "#f0dfbe", 2],
  ["#0b0d16", "#141828", "#1e2438", "#2a3046", 4],
  ["#3c2822", "#5a3c2c", "#7a5238", "#8e6040", 4],
  ["#84562e", "#b07438", "#d2964c", "#e8b464", 5],
  ["#5e1a1c", "#8a2626", "#b63a30", "#d8583a", "#ec8448", 5],
  ["#2a3040", "#3c4254", "#5a6078", "#8a88a8", 5],
  ["#d04a3a", "#4a70b0", "#d8c8a4", "#9a5aa8", 4],
  ["#48383e", "#684842", 2],
  ["#8a92aa", 1],
]);

export const meta = {
  slug: "kyoto-pagoda-dusk", name: "Pagoda Lantern Lane", category: "cities",
  note: "A sloping old street of wooden houses and red lanterns leads up to a five storey pagoda at dusk, with people under umbrellas walking through light rain.",
  tags: ["kyoto", "pagoda", "japan", "street", "dusk", "lanterns", "rain", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, HILL = 1, PAGODA = 2, HOUSE = 3, STREET = 4;
const VX = 100, VY = 66, LF = 84, RF = 76;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const MOON = [152, 15], MOONR = 4.2;
  // 1. dusk sky, deep blue overhead to a warm band low behind the pagoda
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#2a3462"], [0.3, "#3e4c82"], [0.55, "#6a6aa0"], [0.75, "#b07c98"], [0.9, "#e0967e"], [1, "#eeb07e"]], y / 58);
    c = mix(c, hex("#6a6aa0"), clamp(1 - Math.hypot(x - MOON[0], y - MOON[1]) / 18) * 0.5);
    put(x, y, c, SKY);
  }
  // soft cloud bands across the low sky (static)
  for (let y = 30; y < 58; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 30, y / 3.5, 3, 4);
    if (n > 0.56) blend(x, y, hex("#b07c98"), clamp((n - 0.56) * 4) * 0.45);
  }
  // 2. the eastern hills behind, two dark ridges
  for (let x = 0; x < W; x++) {
    const r1 = 52 + 3 * Math.sin(x / 26 + 1) + 3 * fbm(x / 14, 1, 3, 9), r2 = 57 + 2 * Math.sin(x / 17 + 3) + 2 * fbm(x / 9, 2, 3, 11);
    for (let y = Math.floor(r1); y < H; y++) put(x, y, mix(hex("#6a6aa0"), hex("#5a5a8a"), clamp((y - r1) / 8)), HILL);
    for (let y = Math.floor(r2); y < H; y++) {
      const tree = fbm(x / 3, y / 3, 2, 21) > 0.55;
      put(x, y, tree ? hex("#3e4270") : hex("#5a5a8a"), HILL);
    }
  }
  // 3. the five storey pagoda: stacked bodies and wide upturned roofs, a spire with rings
  const PX = 104, BASE = 59, TIER = 9;
  const PAG = hex("#0b0d16"), PAG2 = hex("#141828"), RIM = hex("#48383e");
  for (let i = 0; i < 5; i++) {
    const yb = BASE - i * TIER, bw = 9 - i * 1.1, rw = 25 - i * 2.8, eave = yb - 7;
    for (let y = yb - 8; y <= yb; y++) for (let x = Math.round(PX - bw); x <= PX + bw; x++) {
      const post = Math.abs(x - PX) % 4 < 1 || Math.abs(Math.abs(x - PX) - bw) < 1;
      put(x, y, post ? PAG : PAG2, PAGODA);
    }
    for (let x = Math.round(PX - rw); x <= PX + rw; x++) {
      const u = Math.abs(x - PX) / rw, top = eave - 0.6 - 2.2 * Math.pow(Math.max(0, 1 - u * 1.3), 1.2) - 1.8 * u ** 5, bot = eave + 1.4 - 2.6 * u ** 4;
      for (let y = Math.floor(top); y <= bot; y++) put(x, y, y > bot - 1 ? RIM : PAG, PAGODA);
    }
  }
  const topY = BASE - 4 * TIER - 11;
  for (let y = topY - 15; y <= topY + 1; y++) {
    put(PX, y, PAG, PAGODA);
    const k = topY - y;
    if (k > 1 && k < 12 && k % 2 === 0) { put(PX - 1, y, PAG, PAGODA); put(PX + 1, y, PAG, PAGODA); }
  }
  put(PX, topY - 16, PAG, PAGODA);
  for (let x = PX - 2; x <= PX + 2; x++) put(x, topY + 1, PAG, PAGODA);
  // 4. the street, wet stone paving climbing to the far houses
  const edgeL = (y) => lerp(VX - 12, -40, (y - VY) / (H - VY)), edgeR = (y) => lerp(VX + 12, W + 40, (y - VY) / (H - VY));
  for (let y = VY; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - VY) / (H - VY);
    let c = ramp([[0, "#8a88a8"], [0.3, "#5a6078"], [1, "#545a6a"]], v);
    const row = Math.floor(Math.log(1 + v * 9) * 9), col = Math.floor((x - VX) / (2 + v * 10) + row * 0.5);
    if (Math.abs(Math.log(1 + v * 9) * 9 - row - 0.5) > 0.42) c = mix(c, hex("#3c4254"), 0.6);
    else if (hash(row, col) > 0.6) c = mix(c, hex("#3c4254"), 0.4);
    c = mix(c, hex("#c88676"), clamp(0.35 - v) * 0.7 * clamp(1 - Math.abs(x - VX) / 40));
    put(x, y, c, STREET);
  }
  // 5. wooden machiya houses down both sides, with lattice fronts and lit shops
  const lanterns = [];
  const houses = (side, F, B) => {
    for (const [a0, a1, lit] of B) for (let s = a0; s < a1; s++) {
      const x = side ? W - 1 - s : s, f = s / F, d = 1 - f;
      const yt = lerp(30, 58, f), yb = lerp(118, VY + 1, f), u = (s - a0) / (a1 - a0);
      for (let y = Math.max(0, Math.floor(yt)); y < Math.min(H, yb); y++) {
        const v = (y - yt) / (yb - yt), n = noise2(x / 2, y / 2, side + 3) * 0.3;
        let c = mix(hex("#5a3c2c"), hex("#7a5238"), clamp(0.4 + n));
        if (v < 0.03) c = hex("#545a6a");                                                    // roof ridge catching the sky
        else if (v < 0.12) c = mix(hex("#3a4058"), hex("#2a3046"), (v / 0.12) + n);           // tiled roof
        else if (v > 0.36 && v < 0.375) c = hex("#545a6a");
        else if (v >= 0.375 && v < 0.43) c = hex("#3a4058");                                 // middle eave
        else if (v > 0.43 && v < 0.46) c = hex("#281a18");
        else if (v >= 0.13 && v < 0.33) {                                                    // upper floor, small slit windows
          const fu = (u * 3) % 1;
          c = fu > 0.25 && fu < 0.75 && v > 0.17 && v < 0.29 ? (lit > 1 ? hex("#b07438") : hex("#3c2822")) : (Math.floor(u * 9) % 2 ? hex("#8e6040") : c);
        } else if (v >= 0.46) {                                                              // ground floor lattice
          const slat = (x + (side ? 1 : 0)) % 2 === 0;
          const inside = lit ? mix(hex("#b07438"), hex("#d2964c"), clamp(0.6 - Math.abs(u - 0.5))) : hex("#281a18");
          c = v > 0.94 ? hex("#281a18") : slat ? hex("#281a18") : inside;
          if (lit && v > 0.48 && v < 0.6 && u > 0.3 && u < 0.7) c = hex("#5e1a1c");           // noren curtain
        }
        if (Math.abs(u) < 0.5 / (a1 - a0) + 0.001) c = hex("#141828");                          // party wall
        put(x, y, c, HOUSE);
      }
    }
    for (const [a0, a1] of B) {
      const s = (a0 + a1) / 2, f = s / F, yt = lerp(30, 58, f), yb = lerp(118, VY + 1, f);
      lanterns.push([side ? W - 1 - s : s, lerp(yt, yb, 0.47), lerp(6, 1.2, f)]);
    }
  };
  houses(0, LF, [[0, 20, 1], [20, 36, 2], [36, 50, 1], [50, 61, 0], [61, 70, 2], [70, 77, 1], [77, 84, 0]]);
  houses(1, RF, [[0, 18, 2], [18, 34, 1], [34, 46, 0], [46, 56, 1], [56, 64, 2], [64, 70, 1], [70, 76, 1]]);
  // far end: low dark houses closing the street under the pagoda
  for (let x = LF; x < W - RF; x++) for (let y = 58; y <= VY; y++) {
    const c = y < 60 ? hex("#3a4058") : y > 62 && (x % 3) ? hex("#b07438") : hex("#5a3c2c");
    put(x, y, c, HOUSE);
  }
  // red paper lanterns, glow on the facade and a reflection in the wet stone
  for (const [lx, ly, r] of lanterns) {
    for (let y = Math.floor(ly - r * 3); y <= ly + r * 3; y++) for (let x = Math.floor(lx - r * 3); x <= lx + r * 3; x++) {
      const d = Math.hypot((x - lx) / r, (y - ly) / (r * 1.2));
      if (layer[y * W + x] === HOUSE && d > 1) blend(x, y, hex("#d2964c"), clamp(1 - d / 3) * 0.35);
    }
    for (let y = Math.floor(ly - r * 1.3); y <= ly + r * 1.3; y++) for (let x = Math.floor(lx - r); x <= lx + r; x++) {
      const d = Math.hypot((x - lx) / r, (y - ly) / (r * 1.3));
      if (d <= 1) put(x, y, Math.abs(y - ly) > r * 1.05 ? hex("#281a18") : d < 0.45 ? hex("#ec8448") : d < 0.8 ? hex("#d8583a") : hex("#b63a30"), HOUSE);
    }
  }
  for (const [lx, , r] of lanterns) {
    const sx = lx + (lx < VX ? 1 : -1) * r * 3;
    for (let y = VY + 1; y < H; y++) {
      const ey = y, el = edgeL(ey), er = edgeR(ey);
      const x = lerp(sx, VX, 0.15 * (1 - (y - VY) / (H - VY)));
      if (x < el + 1 || x > er - 1) continue;
      for (let k = -1; k <= 1; k++) if (layer[y * W + Math.round(x + k)] === STREET) blend(x + k, y, hex("#b63a30"), 0.25 * (r / 6));
    }
  }
  // the moon: the one bright point
  for (let y = MOON[1] - 6; y <= MOON[1] + 6; y++) for (let x = MOON[0] - 6; x <= MOON[0] + 6; x++) {
    const d = Math.hypot(x - MOON[0], y - MOON[1]);
    if (layer[y * W + x] === SKY && d < MOONR) put(x, y, d < MOONR - 1.2 ? hex("#fff4dc") : hex("#f0dfbe"));
  }

  const F = makeFrame(rgb, layer, PAL);
  // walkers: distance Z runs linearly in time, screen scale is 1/Z
  const UMB = ["#d04a3a", "#4a70b0", "#d8c8a4", "#9a5aa8", "#d04a3a", "#d8c8a4", "#4a70b0", "#9a5aa8", "#d8c8a4"].map(hex);
  const walkers = Array.from({ length: 9 }, (_, i) => ({ ox: (hash(i, 3) - 0.5) * 0.9, dir: i % 2 ? 1 : -1, ph: hash(i, 7), sp: 0.42 + hash(i, 9) * 0.2, c: UMB[i] }));
  const DARK = hex("#0b0d16"), KIM = hex("#1e2438"), RAIN = hex("#8a92aa");
  const ZN = 0.6, ZF = 7; // near the camera walkers veer off the sides
  const drops = Array.from({ length: 150 }, (_, i) => [hash(i, 11), hash(i, 12), 0.7 + hash(i, 13) * 0.6]);

  return (t) => {
    F.begin();
    const order = walkers.map((w) => {
      const span = ZF - ZN, p = ((w.ph * span + t * w.sp) % span + span) % span;
      const Z = w.dir > 0 ? ZF - p : ZN + p; // dir>0 walks toward us
      return [Z, w];
    }).sort((a, b) => b[0] - a[0]);
    for (const [Z, w] of order) {
      const d = 1 / Z, oxe = w.ox + Math.sign(w.ox || 1) * Math.max(0, d - 0.9) * 1.3, fy = VY + 42 * d, cx = VX + oxe * 80 * d, h = 34 * d;
      if (d < 0.07) continue;
      const step = Math.sin(t * 6 * w.sp + w.ph * 9);
      // legs
      for (let y = Math.floor(fy - h * 0.28); y <= fy; y++) {
        const k = (y - (fy - h * 0.28)) / (h * 0.28);
        F.add(cx - h * 0.06 - step * k * h * 0.05, y, DARK); F.add(cx + h * 0.06 + step * k * h * 0.05, y, DARK);
        if (h > 14) { F.add(cx - h * 0.06 - step * k * h * 0.05 + 1, y, DARK); F.add(cx + h * 0.06 + step * k * h * 0.05 - 1, y, DARK); }
      }
      // body, a long coat widening to the hem
      for (let y = Math.floor(fy - h * 0.82); y < fy - h * 0.26; y++) {
        const k = (y - (fy - h * 0.82)) / (h * 0.56), hw = h * (0.1 + 0.06 * k);
        for (let x = Math.floor(cx - hw); x <= cx + hw; x++) F.add(x, y, KIM);
      }
      for (let y = Math.floor(fy - h * 0.94); y < fy - h * 0.82; y++) for (let x = Math.floor(cx - h * 0.06); x <= cx + h * 0.06; x++) F.add(x, y, DARK);
      // umbrella dome over the head, with a dark rim
      const ux = cx + Math.sin(t * 1.2 + w.ph * 5) * h * 0.02, uy = fy - h * 0.9, uw = h * 0.3, uh = h * 0.22;
      for (let y = Math.floor(uy - uh); y <= uy + 0.5; y++) for (let x = Math.floor(ux - uw); x <= ux + uw; x++) {
        const q = ((x - ux) / uw) ** 2 + ((y - uy) / uh) ** 2;
        if (q <= 1 && y <= uy) F.add(x, y, y > uy - 1 ? DARK : w.c);
      }
      for (let y = Math.floor(uy); y < uy + h * 0.12; y++) F.add(ux, y, DARK);
    }
    // light rain, falling at a slant
    for (const [a, b, s] of drops) {
      const x0 = a * (W + 30), y0 = ((b * H + t * 70 * s) % (H + 6)) - 4, x = x0 - (y0 / H) * 18 - ((t * 12 * s) % 0);
      for (let k = 0; k < 3; k++) F.add(x - k * 0.3, y0 - k, RAIN, 0.35);
    }
    return F.finish();
  };
}
