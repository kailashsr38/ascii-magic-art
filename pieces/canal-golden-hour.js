/* canal-golden-hour: a canal between painted houses at golden hour, hand-built picture scene. */
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
  ["#d88a50", "#e8a460", "#f2bc72", "#f8cc84", 6],
  ["#fff4d0", "#ffe2a0", 2],
  ["#7a4232", "#965438", "#b06a46", "#c8845a", 6],
  ["#b86e60", "#d08a74", "#e0a488", 3],
  ["#c88850", "#dca060", "#e8b878", "#f0c88c", 5],
  ["#2a1814", "#3e2620", 2],
  ["#3c5a44", "#58785a", 2],
  ["#4e6264", "#627672", "#7a8a7a", "#968e70", "#b49462", "#d0a464", 9],
  ["#140c0a", "#d4ccbc", "#c84a3c", "#4a6aa8", "#e8d080", 5],
  ["#b07858", "#d09870", 2],
]);

export const meta = {
  slug: "canal-golden-hour", name: "Golden Canal Gondola", category: "landscapes",
  note: "A narrow canal between old painted houses at golden hour, with a gondola gliding across, laundry swaying on the lines and ripples moving on the water.",
  tags: ["canal", "city", "sunset", "golden-hour", "boat", "halftone", "travel", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

export default function create() {
  const C = canvas(), { put } = C;
  const VX = 96, HZ = 58, FAR = 76, SUN = [96, 46], SUNR = 5.5;
  // wall geometry: d = depth 0 (far) .. 1 (near edge of frame)
  const dL = (x) => 1 - x / FAR, dR = (x) => 1 - (W - x) / FAR;
  const waterAt = (d) => lerp(HZ + 2, 100, d);
  const kind = new Uint8Array(W * H); // 1 sky, 2 water, 3 wall
  // buildings along each wall: [x0, x1, roof drop, colour pair]
  const LB = [[0, 20, 0, ["#965438", "#b06a46"]], [20, 38, 10, ["#b86e60", "#d08a74"]], [38, 52, 4, ["#b06a46", "#c8845a"]], [52, 62, 9, ["#965438", "#b86e60"]], [62, 70, 5, ["#b06a46", "#c8845a"]], [70, 76, 8, ["#b86e60", "#d08a74"]]];
  const RB = [[0, 18, 6, ["#dca060", "#f0c88c"]], [18, 36, 0, ["#c88850", "#e8b878"]], [36, 50, 10, ["#d89a80", "#f0c88c"]], [50, 60, 4, ["#dca060", "#e8b878"]], [60, 68, 8, ["#c88850", "#dca060"]], [68, 76, 5, ["#d89a80", "#e8b878"]]];
  // 1. sky: warm gold, brightest around the low sun
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#d88a50"], [0.5, "#e8a460"], [0.85, "#f2bc72"], [1, "#f8cc84"]], y / HZ);
    c = mix(c, hex("#f8cc84"), clamp(1 - Math.hypot(x - SUN[0], y - SUN[1]) / 24) * 0.8);
    put(x, y, c); kind[y * W + x] = 1;
  }
  // 2. the walls: each building a facade in perspective with rows of windows
  const wall = (side, B) => {
    for (const [a0, a1, drop, [dark, lite]] of B) for (let s = a0; s < a1; s++) {
      const x = side ? W - 1 - s : s, d = 1 - s / FAR, yw = waterAt(d), yt = lerp(-30, 24, s / FAR) + drop * (0.3 + d);
      const u = (s - a0) / (a1 - a0);
      for (let y = Math.max(0, Math.floor(yt)); y < Math.min(H, yw); y++) {
        const v = (y - yt) / (yw - yt), n = noise2(x / 3, y / 3, side + 5) * 0.25;
        let c = mix(hex(dark), hex(lite), clamp((side ? 0.65 : 0.25) + n - v * 0.3));
        const cols = Math.max(2, Math.round((a1 - a0) / 5)), fu = (u * cols) % 1, fv = (v * 7) % 1;
        if (v > 0.06 && v < 0.82 && fu > 0.3 && fu < 0.7 && fv > 0.3 && fv < 0.8) c = hex("#2a1814");
        else if (v > 0.06 && v < 0.82 && (fu > 0.2 && fu <= 0.3 || fu >= 0.7 && fu < 0.8) && fv > 0.3 && fv < 0.8) c = hex(side ? "#58785a" : "#3c5a44");
        if (v > 0.86 && fu > 0.25 && fu < 0.75) c = hex("#3e2620");
        if (v > 0.95) c = hex("#4e6264");
        if (y < yt + 1.2) c = hex(side ? "#b06a46" : "#7a4232");
        put(x, y, c); kind[y * W + x] = 3;
      }
    }
  };
  wall(0, LB); wall(1, RB);
  // 3. the far end: low houses on either side of an opening onto the lagoon
  for (let x = FAR; x < W - FAR; x++) {
    const open = Math.abs(x - VX) < 9;
    const top = open ? HZ : HZ - 10 - (Math.abs(x - VX) > 14 ? 4 : 0) - ((x * 7) % 5 === 0 ? 2 : 0);
    for (let y = Math.floor(top); y < HZ + 2; y++) { put(x, y, mix(hex("#b07858"), hex("#d09870"), x > VX ? 0.8 : 0.2)); kind[y * W + x] = 3; }
    if (!open && x % 4 === 0) for (let y = Math.floor(top) + 3; y < HZ - 1; y += 3) put(x, y, hex("#7a4232"));
  }
  // 4. a stone bridge across the middle distance
  const BD = 0.32, byW = waterAt(BD);
  const bx0 = Math.round(FAR * (1 - BD)) - 2, bx1 = W - bx0, bTop = byW - 12;
  for (let x = bx0; x < bx1; x++) {
    const u = (x - bx0) / (bx1 - bx0), arch = byW - Math.sqrt(Math.max(0, 1 - ((u - 0.5) / 0.36) ** 2)) * 8;
    for (let y = Math.floor(bTop - Math.sin(u * Math.PI) * 2); y < byW; y++) {
      if (y > arch && Math.abs(u - 0.5) < 0.36) continue;
      put(x, y, y < bTop - Math.sin(u * Math.PI) * 2 + 1.5 ? hex("#f0c88c") : mix(hex("#b8744c"), hex("#dca060"), u)); kind[y * W + x] = 3;
    }
  }
  // 5. water: warm sky in the middle, reflected walls along the sides
  const wl = new Float32Array(W);
  for (let x = 0; x < W; x++) wl[x] = x < FAR ? waterAt(dL(x)) : x > W - FAR ? waterAt(dR(x)) : HZ + 2;
  const sky0 = C.rgb.slice();
  for (let x = 0; x < W; x++) for (let y = Math.floor(wl[x]); y < H; y++) {
    if (kind[y * W + x] === 3 && y < byW) continue;
    const v = clamp((y - HZ) / (H - HZ));
    let c = ramp([[0, "#d0a464"], [0.3, "#b49462"], [0.7, "#7a8a7a"], [1, "#627672"]], v + Math.abs(x - VX) / 250);
    const sy = Math.floor(2 * wl[x] - y), si = (clamp(sy, 0, H - 1) * W + x) * 3;
    if (sy >= 0) c = mix(c, [sky0[si], sky0[si + 1], sky0[si + 2]], 0.45 * (1 - v * 0.6));
    if (Math.abs(x - VX) < 5 - v * 3 && y < HZ + 30) c = mix(c, hex("#ffe2a0"), (1 - v * 2) * 0.9);
    put(x, y, c); kind[y * W + x] = 2;
  }
  // the sun: the one bright point, low over the lagoon
  for (let y = SUN[1] - 7; y < SUN[1] + 7; y++) for (let x = SUN[0] - 7; x < SUN[0] + 7; x++) {
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    if (d < SUNR && kind[y * W + x] === 1) put(x, y, d < SUNR - 1.5 ? hex("#fff4d0") : hex("#ffe2a0"));
  }

  const base = C.rgb.slice(), out = C.rgb, enc = encoder(PAL);
  const BLACK = hex("#140c0a"), LIN = [hex("#d4ccbc"), hex("#c84a3c"), hex("#4a6aa8"), hex("#e8d080"), hex("#d4ccbc")];
  const RIP_D = hex("#3a4a50"), RIP_L = hex("#d0a464"), ROPE = hex("#3e2620");
  const lines = [0.5, 0.3].map((d, li) => {
    const xa = Math.round(FAR * (1 - d)), xb = W - xa, ya = lerp(-30, 24, 1 - d) + 18 + d * 16;
    return { d, xa, xb, ya, sag: 6 * d + 2, n: Math.round(6 + d * 6), li };
  });
  const ripples = Array.from({ length: 46 }, (_, i) => [hash(i, 1), hash(i, 2), hash(i, 3)]);

  return (t) => {
    out.set(base);
    // ripples: short lines drifting across the canal, bigger near us
    for (const [a, b, c] of ripples) {
      const v = b * b, y = Math.floor(HZ + 4 + v * (H - HZ - 5)), L = 2 + v * 9;
      const span = W, x0 = ((a * span + t * (1 + v * 3) * (c > 0.5 ? 1 : -1)) % span + span) % span;
      for (let k = 0; k < L; k++) { const x = Math.floor(x0 + k) % W; if (kind[y * W + x] === 2) C.add(x, y, c > 0.35 ? RIP_D : RIP_L, 0.7); }
    }
    // laundry lines across the canal, clothes swaying in the breeze
    for (const L of lines) {
      for (let x = L.xa; x <= L.xb; x++) { const u = (x - L.xa) / (L.xb - L.xa); put(x, L.ya + Math.sin(u * Math.PI) * L.sag, ROPE); }
      for (let k = 0; k < L.n; k++) {
        const u = (k + 0.7) / (L.n + 0.4), x = lerp(L.xa, L.xb, u), y = L.ya + Math.sin(u * Math.PI) * L.sag;
        const w = Math.round(2 + L.d * 3 + hash(k, L.li) * 2), h = Math.round(2 + L.d * 5 + hash(k, L.li + 5) * 2), col = LIN[(k + L.li * 2) % LIN.length];
        const sway = Math.sin(t * 1.6 + k * 0.9 + L.li) * (0.6 + L.d);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i + sway * (j / h), y + 1 + j, col);
      }
    }
    // the gondola: crosses the canal near us, from behind the left houses to behind the right
    const P = 34, ph = (t % P) / P, gx = lerp(-70, W + 70, ph), d = 0.8, gy = waterAt(d) + 6;
    const xl = FAR * (1 - d) + 2, xr = W - xl;
    const vis = (x) => x >= xl && x <= xr;
    const L2 = 30;
    for (let i = -L2; i <= L2; i++) {
      const x = Math.round(gx + i), e = Math.abs(i) / L2;
      if (!vis(x)) continue;
      const lift = Math.pow(e, 4) * 7, th = Math.max(1, 3 * (1 - e * e));
      for (let j = 0; j < th; j++) put(x, gy - lift - j, BLACK);
      if (i > L2 - 3) for (let j = 0; j < 4; j++) put(x, gy - lift - j, BLACK); // prow
    }
    for (let k = 1; k < 30; k++) { const x = Math.round(gx - L2 - k); if (vis(x)) C.add(x, gy + 1, RIP_L, 0.6 - k / 60); }
    // gondolier standing at the stern with a long oar
    const sx = Math.round(gx - L2 * 0.62), sy = gy - 3, bob = Math.sin(t * 1.3) > 0 ? 0 : 1;
    if (vis(sx)) {
      for (let y = sy - 14; y < sy; y++) for (let x = sx - 1; x <= sx + 1; x++) if (y > sy - 12 || x === sx) put(x, y + bob * 0, BLACK);
      for (let x = sx - 3; x <= sx + 3; x++) put(x, sy - 15, BLACK);
      for (let x = sx - 2; x <= sx + 2; x++) put(x, sy - 16, BLACK);
      const oa = Math.sin(t * 1.3) * 0.25 + 0.5;
      for (let r = 0; r < 20; r++) { const ox = sx + 2 + Math.sin(oa) * r * 0.6, oy = sy - 9 + r; if (vis(ox)) put(ox, oy, BLACK); }
    }
    return enc(out);
  };
}
