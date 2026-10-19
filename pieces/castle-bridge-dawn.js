/* castle-bridge-dawn: an old stone bridge lined with statues, a gothic gate tower and a hilltop castle at dawn, hand-built picture scene. */
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
  ["#6a78a8", "#8a88b4", "#a888a8", "#d89aa0", "#f0b090", "#f8c890", 9],
  ["#fff2d0", "#ffd890", 2],
  ["#dcc6d0", "#c4aec4", "#a898b8", "#8a80a4", "#6e6890", 6],
  ["#1e1828", "#2c2438", "#3c3248", "#54465c", "#6e5a6a", "#8a6e74", 7],
  ["#b07870", "#d89a80", 2],
  ["#6a6890", "#8a7ea0", "#b08ea8", "#d0a0a0", "#e8b894", 5],
  ["#c8b4bc", "#d8c0c0", 2],
  ["#6a8a84", "#88a49c", 2],
]);

export const meta = {
  slug: "castle-bridge-dawn", name: "Castle Bridge Dawn", category: "cities",
  note: "An old stone bridge lined with statues crosses a misty river at dawn, with a gothic gate tower at one end and a hilltop castle against a pink sky.",
  tags: ["bridge", "castle", "river", "dawn", "statues", "halftone", "travel", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, CASTLE = 2, BANK = 3, WATER = 4, BRIDGE = 5, TOWER = 6;
const WL = 60; // far waterline

export default function create() {
  const C = canvas(), { put, rect, kind, rgb } = C, R = rng(5);
  const SX = 176, SY = 41;
  // 1. dawn sky: blue-violet above, pink, then gold at the horizon round the sun
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#6a78a8"], [0.3, "#8a88b4"], [0.55, "#a888a8"], [0.75, "#d89aa0"], [0.92, "#f0b090"], [1, "#f8c890"]], y / WL);
    const d = Math.hypot(x - SX, y - SY);
    c = mix(c, hex("#f8c890"), clamp(1 - d / 34) ** 2 * 0.6);
    if (d < 4.2) c = d < 3 ? hex("#fff2d0") : hex("#ffd890");
    put(x, y, c, SKY);
  }
  // thin cloud bars lit from below
  for (const [cy, x0, x1] of [[16, 20, 90], [22, 60, 150], [30, 110, 186], [12, 120, 176]]) for (let x = x0; x < x1; x++) {
    const a = Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 0.6;
    C.add(x, cy + Math.round(Math.sin(x / 9) * 0.6), hex("#d89aa0"), a); C.add(x, cy + 1, hex("#d89a80"), a * 0.6);
  }
  // 2. the castle hill on the right with palace and cathedral, hazy in the dawn light
  const hill = (x) => 50 - 6 * clamp((x - 70) / 40) + (noise2(x / 8, 2, 3) - 0.5) * 2;
  for (let x = 50; x < W; x++) for (let y = Math.floor(hill(x)); y < WL; y++) put(x, y, mix(hex("#a898b8"), hex("#8a80a4"), (y - hill(x)) / 12), CASTLE);
  // palace: a long block with rows of windows and a roof
  for (let y = 36; y < 46; y++) for (let x = 86; x < 160; x++) {
    let c = y < 38 ? hex("#8a80a4") : hex("#c4aec4");
    if (y >= 39 && (x % 3 === 0) && (y === 40 || y === 43)) c = hex("#6e6890");
    if (x > 150) c = mix(c, hex("#d89a80"), 0.35); // sunward end
    put(x, y, c, CASTLE);
  }
  // cathedral nave, two needle spires and a big tower with a green cap
  rect(112, 28, 146, 37, hex("#a898b8"), CASTLE);
  for (let y = 28; y < 37; y += 3) for (let x = 114; x < 146; x += 4) put(x, y + 1, hex("#6e6890"));
  const spire = (cx, top, base, w) => { for (let y = top; y < base; y++) { const hw = ((y - top) / (base - top)) * w; for (let x = Math.round(cx - hw); x <= cx + hw; x++) put(x, y, x > cx ? hex("#c4aec4") : hex("#8a80a4"), CASTLE); } };
  rect(117, 18, 123, 28, hex("#a898b8"), CASTLE); rect(126, 18, 132, 28, hex("#a898b8"), CASTLE);
  spire(120, 4, 18, 3.5); spire(129, 4, 18, 3.5);
  for (const sx of [117, 123, 126, 132]) spire(sx, 13, 19, 0.8);
  rect(136, 14, 145, 30, hex("#a898b8"), CASTLE); rect(141, 14, 145, 30, hex("#c4aec4"), CASTLE);
  for (let y = 7; y < 14; y++) { const hw = 5 * Math.sqrt(clamp(1 - ((14 - y) / 7) ** 2)); for (let x = Math.round(140.5 - hw); x <= 140.5 + hw; x++) put(x, y, x > 141 ? hex("#88a49c") : hex("#6a8a84"), CASTLE); }
  put(140, 6, hex("#8a80a4")); put(141, 6, hex("#8a80a4")); put(140, 5, hex("#8a80a4"));
  for (let y = 17; y < 28; y += 4) { put(138, y, hex("#6e6890")); put(138, y + 1, hex("#6e6890")); put(142, y, hex("#6e6890")); put(142, y + 1, hex("#6e6890")); }
  // 3. the far bank on the left: a jumble of roofs and small towers
  for (let x = 0; x < 110; x++) {
    const h = 6 + Math.floor(hash(Math.floor(x / 6), 1) * 6), top = WL - h - (hash(Math.floor(x / 6), 2) < 0.12 ? 7 : 0);
    for (let y = top; y < WL; y++) {
      if (kind[y * W + x] === CASTLE) continue;
      const roof = y < top + 3;
      put(x, y, roof ? hex("#8a80a4") : (x % 3 === 0 && y % 3 === 1 ? hex("#6e6890") : hex("#c4aec4")), BANK);
    }
  }
  // 4. water behind the bridge: the sky and bank mirrored, darker
  const sky = rgb.slice();
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
    const sy = clamp(2 * WL - y - 1 + Math.round((noise2(x / 7, y / 1.4, 9) - 0.5) * 2), 0, WL - 1), i = (sy * W + x) * 3;
    put(x, y, mix([sky[i], sky[i + 1], sky[i + 2]], hex("#6a6890"), 0.28), WATER);
  }
  // 5. the bridge in perspective: big near the tower on the left, smaller to the right
  const sc = (x) => lerp(1.25, 0.62, x / W), deck = (x) => lerp(66, 58, x / W);
  const u = new Float32Array(W + 1);
  for (let x = 1; x <= W; x++) u[x] = u[x - 1] + 1 / (24 * sc(x));
  const foot = (x) => deck(x) + 17 * sc(x);
  const statues = [];
  for (let x = 30; x < W; x++) {
    const s = sc(x), d = Math.round(deck(x)), f = foot(x), fr = (u[x] + 0.5) % 1;
    const pier = fr < 0.22, q = (fr - 0.22) / 0.78;
    const spring = d + 8 * s, r = 10 * s;
    const archTop = spring - r * 0.8 * Math.sqrt(clamp(1 - (2 * q - 1) ** 2));
    for (let y = d; y < f; y++) {
      if (!pier && y > archTop && y < f) continue;
      let c;
      if (y === d) c = hex("#8a6e74");
      else if (y < d + 2.5 * s) c = hex("#54465c");
      else if (y < d + 3 * s + 1) c = hex("#3c3248");
      else c = pier && fr > 0.16 ? hex("#6e5a6a") : hex("#54465c");
      if (!pier && Math.abs(y - archTop) < 1) c = hex("#6e5a6a");
      put(x, y, c, BRIDGE);
    }
    if (Math.abs(fr - 0.11) < 0.5 / (24 * s)) statues.push([x, d, s]);
  }
  // statues on the parapet above each pier
  statues.forEach(([x, d, s], k) => {
    const h = Math.round(11 * s), w = Math.max(1, Math.round(1.6 * s)), DK = hex("#1e1828"), DK2 = hex("#2c2438");
    for (let y = d - Math.round(2 * s); y < d; y++) for (let dx = -w - 1; dx <= w + 1; dx++) put(x + dx, y, DK2, BRIDGE);
    for (let y = d - h; y < d - 2 * s; y++) { const t = (y - (d - h)) / h, hw = t < 0.18 ? w * 0.6 : w * (0.8 + t * 0.6); for (let dx = -Math.round(hw); dx <= Math.round(hw); dx++) put(x + dx, y, DK, BRIDGE); }
    if (k % 3 === 0) for (let j = 0; j < 4 * s; j++) put(x + w + 1 + Math.floor(j / 2), d - h + 2 + j, DK, BRIDGE); // raised arm
    if (k % 3 === 1) { for (let y = d - h - 3; y < d - h + 2; y++) put(x, y, DK, BRIDGE); put(x - 1, d - h - 2, DK); put(x + 1, d - h - 2, DK); } // a cross
  });
  // 6. the gothic gate tower on the left
  const TX0 = 4, TX1 = 34, TT = 26;
  for (let y = TT; y < foot(TX1) + 1; y++) for (let x = TX0; x <= TX1; x++) {
    let c = x > TX1 - 6 ? hex("#6e5a6a") : hex("#3c3248");
    if (x > TX1 - 3) c = hex("#8a6e74");
    if ((y - TT) % 9 === 0) c = hex("#2c2438");
    put(x, y, c, TOWER);
  }
  // gate arch, windows
  for (let y = 70; y < 86; y++) for (let x = 13; x < 26; x++) if (y > 74 || Math.hypot(x - 19, y - 75) < 6.4) put(x, y, hex("#1e1828"), TOWER);
  for (const [wx, wy] of [[12, 34], [24, 34], [12, 50], [24, 50]]) rect(wx, wy, wx + 2, wy + 6, hex("#1e1828"), TOWER);
  // steep roof with corner turrets
  for (let y = 4; y < TT; y++) { const hw = ((y - 4) / (TT - 4)) * 15; for (let x = Math.round(19 - hw); x <= 19 + hw; x++) put(x, y, x > 19 + hw - 3 ? hex("#54465c") : hex("#2c2438"), TOWER); }
  for (const cx of [5, 33]) for (let y = 14; y < TT + 2; y++) { const hw = Math.min(2, (y - 14) / 4); for (let x = Math.round(cx - hw); x <= cx + hw; x++) put(x, y, hex("#2c2438"), TOWER); }
  for (let y = 0; y < 4; y++) put(19, y, hex("#2c2438"), TOWER);
  // 7. water in front of the bridge: the bridge mirrored about its feet
  const now = rgb.slice();
  for (let x = 0; x < W; x++) {
    const f = Math.ceil(x <= TX1 ? foot(TX1) : foot(x));
    for (let y = f; y < H; y++) {
      const sy = clamp(2 * f - y - 1 + Math.round((noise2(x / 6, y / 1.3, 4) - 0.5) * 2), 0, H - 1), i = (sy * W + x) * 3;
      let c = mix([now[i], now[i + 1], now[i + 2]], hex("#6a6890"), 0.3 + (y - f) / 120);
      put(x, y, c, WATER);
    }
  }
  // the sun's path on the water, steady
  for (let y = WL; y < H; y++) for (let x = SX - 8; x <= SX + 8; x++) {
    const i = y * W + x; if (kind[i] !== WATER) continue;
    const a = clamp(1 - Math.abs(x - SX) / (3 + (y - WL) * 0.12)) * (noise2(x / 2, y / 0.8, 6) > 0.4 ? 0.55 : 0.15);
    C.add(x, y, hex("#e8b894"), a);
  }

  const base = rgb.slice(), out = rgb, enc = encoder(PAL);
  const MIST = hex("#d8c0c0"), MIST2 = hex("#c8b4bc"), DK = hex("#1e1828"), BIRD = hex("#3c3248");
  const walkers = Array.from({ length: 7 }, (_, i) => ({ sp: (1.3 + hash(i, 4) * 1.2) * (i % 2 ? -1 : 1), ph: hash(i, 9) * 400 }));

  return (t) => {
    out.set(base);
    // people crossing the bridge: heads and shoulders above the parapet
    for (const w of walkers) {
      const span = W - 40, p = (((t * w.sp + w.ph) % span) + span) % span, x = Math.round(38 + p);
      const s = sc(x), d = Math.round(deck(x)), h = Math.round(5 * s);
      const bob = Math.floor(t * 3 + w.ph) & 1;
      for (let y = d - h - bob; y < d; y++) { put(x, y, DK); if (y > d - h + 1) put(x + 1, y, DK); }
      put(x, d - h - 1 - bob, DK);
    }
    // mist drifting low over the river
    for (let y = WL - 3; y < H; y++) {
      const env = clamp(1 - Math.abs(y - 80) / 22);
      for (let x = 0; x < W; x++) {
        const k = kind[y * W + x];
        if (k !== WATER && k !== BANK) continue;
        const n = fbm(x / 28 - t * 0.07, y / 4, 3, 13);
        C.add(x, y, n > 0.6 ? MIST : MIST2, clamp((n - 0.42) * 2.4) * env * 0.65);
      }
    }
    // a flock of birds crossing the sky
    const bt = (t % 24) / 24, fx = lerp(-30, W + 20, bt), fy = 22 + Math.sin(bt * 5) * 3;
    for (let b = 0; b < 6; b++) {
      const x = Math.round(fx - (b % 3) * 6 - (b > 2 ? 3 : 0)), y = Math.round(fy + Math.floor(b / 3) * 3 + (b % 3) * 1.5 + Math.sin(t + b));
      const up = Math.sin(t * 8 + b * 1.7) > 0;
      put(x, y, BIRD); put(x - 1, y - (up ? 1 : 0), BIRD); put(x + 1, y - (up ? 1 : 0), BIRD);
    }
    return enc(out);
  };
}
