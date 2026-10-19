/* fairy-chimney-balloons: hot air balloons over a valley of capped rock chimneys at dawn, hand-built picture scene. Static: sky, sun, tablelands, valley, chimneys. Per frame: balloons drifting at different depths. */
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
  ["#5a6aa4", "#8a86b4", "#c8a0b4", "#eab49c", "#f6c896", 10],
  ["#fff2d6", "#ffe0a8", 2],
  ["#9a8aa8", "#b49cac", 2],
  ["#f0c8a4", "#dcae90", "#c89a82", "#b08474", "#96706a", 8],
  ["#3a2a30", "#5a444a", "#6e565a", 3],
  ["#5a5a48", "#7a7658", 2],
  ["#f05a48", "#c83c34", "#f8cc48", "#d8a030", "#6aa8e8", "#4a88cc", "#f89a48", "#68b868", "#d8d0c0", 9],
]);

export const meta = {
  slug: "fairy-chimney-balloons", name: "Fairy Chimney Balloons", category: "cities",
  note: "Dozens of hot air balloons drift over a valley of capped rock chimneys and carved cave homes as the sun comes up behind the far tablelands.",
  tags: ["cappadocia", "balloons", "valley", "sunrise", "rock", "travel", "landmark", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, MESA = 1, VALLEY = 2, MID = 3, FRONT = 4;

export default function create() {
  const { rgb, layer, put, blend } = makeCanvas();
  const SUN = [42, 40], SUNR = 5.5;
  const tuff = (v) => ramp([[0, "#f0c8a4"], [0.25, "#dcae90"], [0.5, "#c89a82"], [0.75, "#b08474"], [1, "#96706a"]], v);
  // 1. dawn sky, warmest low on the left where the sun comes up
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#5a6aa4"], [0.35, "#8a86b4"], [0.65, "#c8a0b4"], [0.88, "#eab49c"], [1, "#f6c896"]], y / 50);
    c = mix(c, hex("#f6c896"), clamp(1 - Math.hypot(x - SUN[0], (y - SUN[1]) * 1.5) / 60) * 0.65);
    put(x, y, c, SKY);
  }
  // 2. far tablelands, flat topped and hazy
  for (let x = 0; x < W; x++) {
    const top = 48 + (x > 70 && x < 120 ? -3 : 0) + (x > 150 ? -2 : 0) + (noise2(x / 3, 1, 2) - 0.5) * 0.8 + Math.max(0, 6 - Math.abs(x - 70)) * 0.25 + Math.max(0, 6 - Math.abs(x - 120)) * 0.25;
    for (let y = Math.floor(top); y < H; y++) put(x, y, mix(hex("#b49cac"), hex("#9a8aa8"), clamp((y - top) / 6)), MESA);
  }
  // the sun, half risen over the tableland: the one bright point
  for (let y = SUN[1] - 7; y <= SUN[1] + 7; y++) for (let x = SUN[0] - 7; x <= SUN[0] + 7; x++) {
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SUNR && layer[y * W + x] === SKY) put(x, y, d < SUNR - 1.3 ? hex("#fff2d6") : hex("#ffe0a8"));
  }
  // 3. the valley: rolling eroded ridges, lit from the left
  const ridges = [[54, 4, 7, 0.15, 0.7], [60, 5, 11, 0.3, 0.5], [67, 4, 19, 0.45, 0.32]];
  for (const [base, amp, seed, dark, haze] of ridges) for (let x = 0; x < W; x++) {
    const top = base - amp * fbm(x / 18, seed, 3, seed) * 2 + Math.sin(x / 9 + seed) * 1.2;
    for (let y = Math.floor(top); y < H; y++) {
      const slope = fbm(x / 6, y / 4, 3, seed + 1);
      put(x, y, mix(tuff(dark * 0.6 + (y - top) / 60 + (slope - 0.5) * 0.35), hex(y - top < 2 ? "#b49cac" : "#9a8aa8"), haze), VALLEY);
    }
  }
  // 4. fairy chimneys: tall cones with dark basalt caps, some carved with doors and windows
  const chim = (cx, base, h, w, L, seed) => {
    const top = base - h, neck = top + h * 0.12;
    for (let y = Math.floor(top + 2); y < base; y++) {
      const f = (y - top) / h, hw = w * (0.13 + 0.87 * Math.pow(f, 0.75)) + (f > 0.88 ? (f - 0.88) * w * 2.5 : 0);
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const u = (x - cx) / hw, n = noise2(x / 1.5, y / 5, seed);
        let c = tuff(0.0 + (u + 1) * 0.45 + (n - 0.5) * 0.15);
        if (L === MID) c = mix(c, hex("#b49cac"), 0.18);
        if (u > 0.82) c = hex("#96706a");
        if ((y + Math.floor(n * 3)) % 7 === 0) c = mix(c, hex("#9a7268"), 0.3); // bands in the tuff
        put(x, y, c, L);
      }
    }
    // cap
    const cw = w * 0.2 + 1.2, ch = Math.max(1.3, h * 0.045);
    for (let y = Math.floor(top - ch); y <= top + ch + 1; y++) for (let x = Math.floor(cx - cw); x <= cx + cw; x++) {
      const q = ((x - cx) / cw) ** 2 + ((y - top) / ch) ** 2;
      if (q <= 1) put(x, y, x < cx - cw * 0.3 ? hex("#6e565a") : hex("#5a444a"), L);
    }
    // carved openings
    const R = (k) => hash(seed, k);
    if (h > 18) for (let k = 0; k < 2 + Math.floor(h / 12); k++) {
      const oy = Math.round(lerp(top + h * 0.35, base - 4, R(k))), f = (oy - top) / h, hw = w * (0.13 + 0.87 * Math.pow(f, 0.75));
      const ox = Math.round(cx + (R(k + 9) - 0.5) * hw * 1.2), ow = 1 + (h > 30 ? 1 : 0), oh = 2 + (k === 0 ? 2 : 0);
      for (let y = oy - oh; y <= oy; y++) for (let x = ox; x < ox + ow; x++) put(x, y, hex("#3a2a30"), L);
    }
  };
  const MIDS = [[20, 74, 16, 8], [34, 76, 22, 10], [47, 74, 13, 7], [118, 75, 18, 9], [131, 77, 24, 11], [145, 74, 14, 7], [92, 72, 10, 6], [78, 75, 15, 8], [104, 73, 12, 6], [172, 76, 19, 9], [60, 73, 11, 6]];
  MIDS.forEach(([cx, b, h, w], i) => chim(cx, b, h, w, MID, 30 + i));
  // foreground slope
  for (let x = 0; x < W; x++) {
    const top = 84 - 6 * Math.sin(x / 30 + 0.5) - 3 * fbm(x / 10, 5, 3, 41);
    for (let y = Math.floor(top); y < H; y++) {
      const n = fbm(x / 4, y / 4, 3, 43);
      put(x, y, n > 0.56 ? hex(n > 0.66 ? "#5a5a48" : "#7a7658") : mix(tuff(0.55 + (n - 0.5) * 0.4), hex("#b49cac"), 0.2), FRONT);
    }
  }
  const FRONTS = [[14, 108, 46, 17], [40, 104, 30, 13], [168, 109, 52, 18], [189, 104, 34, 12], [144, 104, 26, 11]];
  FRONTS.forEach(([cx, b, h, w], i) => chim(cx, b, h, w, FRONT, 60 + i));

  const F = makeFrame(rgb, layer, PAL);
  const COLS = [["#f05a48", "#f8cc48"], ["#f8cc48", "#d8a030"], ["#6aa8e8", "#f8cc48"], ["#f89a48", "#c83c34"], ["#68b868", "#f8cc48"], ["#d8d0c0", "#f05a48"], ["#f8cc48", "#f05a48"], ["#6aa8e8", "#d8d0c0"]].map(([a, b]) => [hex(a), hex(b)]);
  const BASKET = hex("#3a2a30");
  const balloons = Array.from({ length: 22 }, (_, i) => {
    const d = Math.pow(hash(i, 1), 1.6); // 0 far .. 1 near
    return { d, r: lerp(1.6, 9.5, d), y0: lerp(16, 6, d) + hash(i, 2) * lerp(36, 40, d), x0: hash(i, 3), sp: lerp(0.8, 2.6, d), col: COLS[i % COLS.length], ph: hash(i, 4) * 6.28, stripe: i % 3 };
  }).sort((a, b) => a.d - b.d);
  return (t) => {
    F.begin();
    for (const b of balloons) {
      const span = W + 40, cx = ((b.x0 * span + t * b.sp) % span + span) % span - 20, cy = b.y0 + Math.sin(t * 0.15 + b.ph) * 2.5 - (t * 0) ;
      const up = b.d < 0.3 ? MESA : b.d < 0.6 ? VALLEY : 255, r = b.r, ry = r * 1.18;
      for (let y = Math.floor(cy - ry); y <= cy + ry * 1.25; y++) {
        const v = (y - cy) / ry, hw = v < 0.55 ? r * Math.sqrt(Math.max(0, 1 - v * v)) : r * Math.sqrt(1 - 0.3) * (1 - (v - 0.55) / 0.7) * 1.05;
        if (hw <= 0) continue;
        for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
          const u = (x - cx) / Math.max(hw, 0.5), g = Math.floor((Math.asin(clamp(u, -1, 1)) / Math.PI + 0.5) * 6);
          let c = b.stripe === 0 ? (g % 2 ? b.col[1] : b.col[0]) : b.stripe === 1 && Math.abs(v + 0.1) < 0.18 ? b.col[1] : b.col[0];
          c = mix(c, hex("#96706a"), clamp(u * 0.4 + 0.05) * 0.45);                  // shade away from the sun
          c = mix(c, hex("#c8a0b4"), (1 - b.d) * 0.35);                              // haze on far ones
          F.add(x, y, c, 1, up);
        }
      }
      // ropes and basket
      const by = cy + ry * 1.25 + Math.max(1, r * 0.35), bw = Math.max(1, r * 0.22);
      if (r > 3) for (let y = Math.floor(cy + ry * 1.2); y < by; y++) { F.add(cx - bw, y, BASKET, 0.7, up); F.add(cx + bw, y, BASKET, 0.7, up); }
      for (let y = Math.floor(by); y < by + Math.max(1, r * 0.25); y++) for (let x = Math.floor(cx - bw); x <= cx + bw; x++) F.add(x, y, mix(BASKET, hex("#78585a"), (1 - b.d) * 0.5), 1, up);
    }
    return F.finish();
  };
}
