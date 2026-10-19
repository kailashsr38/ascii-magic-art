/* great-wall-sunset: the Great Wall winding over layered ridges at sunset, hand-built.
 * A static scene (sky, five ridge layers, the wall and its towers, the gate tower,
 * the walkway) is painted once; each frame adds drifting cloud, mist between the
 * ridges, the sun's glow, lit windows and birds. */
import { fbm, noise2, clamp, lerp, smooth, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ramp = (stops, t) => {
  t = clamp(t);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(hex(stops[i - 1][1]), hex(stops[i][1]), (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  return hex(stops[stops.length - 1][1]);
};

// Palette: hand-picked anchors from the reference, filled in with steps between.
const ANCHORS = [
  ["#f4a466", "#f6923f", "#f47a45", "#ee6a52", "#e8786e", 6],
  ["#fff6cc", "#ffe39a", "#ffc46a", 4],
  ["#e9735a", "#d65e55", "#ffd7a0", 3],
  ["#d88a90", "#b56f8f", "#8e6091", "#6b5593", 6],
  ["#575592", "#46467f", "#3a3c6c", "#2e325a", 6],
  ["#262c4b", "#1f2541", "#1a1f37", "#141a2d", 5],
  ["#2b3a48", "#22303d", 2],
  ["#ffbe7c", "#f3a26a", "#e2895a", "#c9714f", "#a85d50", 6],
  ["#8a5662", "#6e4a5d", "#574058", 3],
  ["#7a6f8e", "#6a6082", "#5a5274", "#4a4565", 4],
  ["#2a1d28", "#ffd27a", "#ffe9b0", 3],
  ["#c98aa0", "#e0a0a8", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "great-wall-sunset", name: "Great Wall Sunset", category: "landscapes",
  note: "The Great Wall winds over layered blue ridges as the sun sets, with drifting cloud, rising mist and birds.",
  tags: ["sunset", "great-wall", "mountains", "china", "landmark", "halftone", "birds", "mist"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: {"tone": {"gamma": 0.62, "floor": 0.03, "sat": 0.82}},
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";

function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// Sky ids for the mask, so cloud and birds only cover sky.
const SKY = 1, RIDGE = 2, HILL = 3, WALL = 4, TOWER = 5, FORE = 6;

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H), depth = new Float32Array(W * H);
  const put = (x, y, c, m) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };
  const SUN = [0.835 * W, 0.42 * H], SUNR = 9.5;

  // 1. sky with the sun's warm glow
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / H;
    let c = ramp([[0, "#f4a466"], [0.18, "#f6943f"], [0.36, "#f47e44"], [0.48, "#ef6d50"], [0.6, "#e8786e"]], v / 0.6);
    const d = Math.hypot(x - SUN[0], y - SUN[1]);
    c = mix(c, hex("#ffc46a"), clamp(1 - d / 40) * 0.55);
    put(x, y, c, SKY);
  }
  // 2. ridges, far to near: each gets lighter (hazier) at its crest
  const ridges = [
    { base: 0.43, amp: 0.07, f: 3.2, s: 11, top: "#d88a90", bot: "#b56f8f" },
    { base: 0.48, amp: 0.08, f: 2.6, s: 23, top: "#b56f8f", bot: "#8e6091" },
    { base: 0.53, amp: 0.09, f: 2.2, s: 37, top: "#8e6091", bot: "#575592" },
    { base: 0.58, amp: 0.08, f: 2.9, s: 51, top: "#575592", bot: "#3a3c6c" },
    { base: 0.64, amp: 0.06, f: 3.5, s: 67, top: "#3a3c6c", bot: "#262c4b" },
  ];
  const crest = ridges.map((r) => Float32Array.from({ length: W }, (_, x) => (r.base - r.amp * (fbm((x / W) * r.f, r.s, 4, r.s) * 1.6 + Math.sin((x / W) * 9 + r.s) * 0.25)) * H));
  ridges.forEach((r, k) => {
    for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.floor(crest[k][x])); y < H; y++) {
      const t = clamp((y - crest[k][x]) / 18);
      put(x, y, mix(hex(r.top), hex(r.bot), t), RIDGE);
      depth[y * W + x] = k;
    }
  });
  // 3. the near hill the wall runs along: dark foliage with texture, right of the gate
  const hillTop = (x) => (0.6 + 0.05 * Math.sin((x / W) * 7.5 + 0.6) + 0.02 * noise2(x / 9, 3)) * H;
  for (let x = Math.floor(0.3 * W); x < W; x++) for (let y = Math.floor(hillTop(x)); y < H; y++) {
    const n = fbm(x / 6, y / 6, 3, 5), t = clamp((y - hillTop(x)) / 30);
    put(x, y, mix(mix(hex("#262c4b"), hex("#141a2d"), t), hex("#2b3a48"), n > 0.55 ? 0.6 : 0), HILL);
  }
  // 4. the wall winding along the crests, with watchtowers
  const PATH = [[0.36, 0.665], [0.44, 0.672], [0.52, 0.64], [0.6, 0.6], [0.655, 0.572], [0.7, 0.62], [0.76, 0.655], [0.84, 0.655], [0.9, 0.62], [0.965, 0.6], [1.02, 0.6]].map(([u, v]) => [u * W, v * H]);
  const pathPts = [];
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1], [bx, by] = PATH[i], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
    for (let j = 0; j < n; j++) pathPts.push([lerp(ax, bx, j / n), lerp(ay, by, j / n)]);
  }
  pathPts.forEach(([px, py], i) => {
    const x = Math.round(px), y = Math.round(py);
    put(x, y, hex("#f3a26a"), WALL); put(x, y + 1, hex("#c9714f"), WALL); put(x, y + 2, hex("#8a5662"), WALL);
    if (i % 4 === 0) put(x, y - 1, hex("#e2895a"), WALL); // battlements
  });
  const towers = [[0.6, 0.6, 3, 4], [0.655, 0.572, 3, 4], [0.84, 0.655, 2, 3], [0.965, 0.6, 2, 3]];
  for (const [u, v, w, h] of towers) {
    const cx = Math.round(u * W), by = Math.round(v * H);
    for (let y = by - h; y <= by + 1; y++) for (let x = cx - w; x <= cx + w; x++) put(x, y, x > cx ? hex("#ffbe7c") : hex("#c9714f"), TOWER);
    for (let x = cx - w; x <= cx + w; x += 2) put(x, by - h - 1, hex("#e2895a"), TOWER);
    put(cx, by - 1, hex("#2a1d28"), TOWER);
  }
  // 5. the gate tower on the left
  const T = { x0: 0.18 * W, x1: 0.37 * W, y0: 0.52 * H, y1: 0.7 * H };
  for (let y = Math.floor(T.y0); y < T.y1; y++) for (let x = Math.floor(T.x0); x < T.x1; x++) {
    const lit = (x - T.x0) / (T.x1 - T.x0), n = noise2(x / 2.5, y / 2.5, 9) * 0.12;
    put(x, y, mix(hex("#a85d50"), hex("#ffbe7c"), clamp(lit * 1.15 - 0.1 + n)), TOWER);
  }
  for (let x = Math.floor(T.x0); x < T.x1; x += 3) { put(x, Math.floor(T.y0) - 1, hex("#e2895a"), TOWER); put(x + 1, Math.floor(T.y0) - 1, hex("#e2895a"), TOWER); }
  // pavilion and its swept roof
  const P0 = 0.235 * W, P1 = 0.33 * W;
  for (let y = Math.floor(0.47 * H); y < T.y0 - 1; y++) for (let x = Math.floor(P0); x < P1; x++) put(x, y, mix(hex("#c9714f"), hex("#ffbe7c"), (x - P0) / (P1 - P0)), TOWER);
  const roof = [[P0 - 5, 0.475 * H], [P1 + 5, 0.475 * H], [P1 - 2, 0.435 * H], [(P0 + P1) / 2, 0.42 * H], [P0 + 2, 0.435 * H]];
  for (let y = Math.floor(0.41 * H); y < 0.48 * H; y++) for (let x = Math.floor(P0 - 6); x < P1 + 6; x++) if (inPoly(x + 0.5, y + 0.5, roof)) put(x, y, (y - 0.42 * H) / (0.055 * H) > 0.75 ? hex("#574058") : hex("#2a1d28"), TOWER);
  // door
  for (let y = Math.floor(0.6 * H); y < T.y1; y++) for (let x = Math.floor(0.235 * W); x < 0.258 * W; x++) if (!(y < 0.615 * H && (x < 0.239 * W || x > 0.254 * W))) put(x, y, hex("#141a2d"), TOWER);
  const windows = [[0.295, 0.6], [0.315, 0.6], [0.335, 0.6], [0.265, 0.495], [0.3, 0.495]].map(([u, v]) => [Math.round(u * W), Math.round(v * H)]);
  // 6. foreground: walkway between two parapets, running out of the bottom left
  const leftPar = [[0, 0.79 * H], [0.2 * W, 0.66 * H], [0.21 * W, 0.71 * H], [0, 0.93 * H]];
  const walk = [[0, 0.93 * H], [0.21 * W, 0.71 * H], [0.24 * W, 0.71 * H], [0.33 * W, H], [0, H]];
  const rightPar = [[0.24 * W, 0.68 * H], [0.28 * W, 0.68 * H], [0.5 * W, H], [0.33 * W, H], [0.24 * W, 0.73 * H]];
  for (let y = Math.floor(0.6 * H); y < H; y++) for (let x = 0; x < 0.52 * W; x++) {
    const px = x + 0.5, py = y + 0.5, near = clamp((y - 0.66 * H) / (0.34 * H));
    if (inPoly(px, py, walk)) put(x, y, mix(hex("#7a6f8e"), hex("#4a4565"), clamp(near * 0.7 + (noise2(x / 3, y / 3, 4) - 0.5) * 0.15)), FORE);
    else if (inPoly(px, py, leftPar) || inPoly(px, py, rightPar)) {
      const face = inPoly(px, py, rightPar) ? (x - 0.24 * W) / (0.26 * W) : 0.6;
      put(x, y, mix(hex("#c9714f"), hex("#ffbe7c"), clamp(face * 0.8 + 0.1)), FORE);
    }
  }
  // merlons: blocks on top of both parapets, lit tops and shaded sides
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    const lx = Math.round(lerp(1, 0.19 * W, t)), ly = Math.round(lerp(0.79 * H, 0.66 * H, t)), ls = Math.round(lerp(5, 2, t));
    for (let y = ly - ls; y < ly; y++) for (let x = lx; x < lx + ls; x++) put(x, y, y === ly - ls ? hex("#ffbe7c") : hex("#e2895a"), FORE);
    const rx = Math.round(lerp(0.26 * W, 0.47 * W, t)), ry = Math.round(lerp(0.68 * H, 0.98 * H, t)), rs = Math.round(lerp(2, 8, t));
    for (let y = ry - rs; y < ry; y++) for (let x = rx; x < rx + rs * 1.6; x++) put(x, y, y < ry - rs + Math.max(1, rs / 3) ? hex("#ffbe7c") : hex("#a85d50"), FORE);
  }
  // 7. foliage on the hillside in front of the far wall
  for (let y = Math.floor(0.62 * H); y < H; y++) for (let x = Math.floor(0.37 * W); x < W; x++) {
    const i = y * W + x;
    if (mask[i] === FORE || mask[i] === TOWER) continue;
    const n = fbm(x / 5, y / 5, 4, 77);
    if (y > hillTop(x) + 2 && n > 0.52) put(x, y, n > 0.62 ? hex("#2b3a48") : hex("#1f2541"), HILL);
  }

  // per-frame
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
  const birds = Array.from({ length: 7 }, (_, i) => ({ dx: (i % 4) * 5 + (i > 3 ? 2 : 0), dy: Math.floor(i / 2) * 2 + (i % 2), ph: i * 0.7 }));

  return (t) => {
    out.set(rgb);
    const add = (x, y, c, a, only) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (only && mask[i] !== only) return;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
    };
    // sun: disk with a breathing glow, a thin cloud across its lower half
    const glow = 1; // steady: no breathing brightness
    for (let y = Math.floor(SUN[1] - 22); y < SUN[1] + 22; y++) for (let x = Math.floor(SUN[0] - 30); x < SUN[0] + 30; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SUNR) add(x, y, d < SUNR - 2 ? hex("#fff6cc") : hex("#ffe39a"), 1, SKY);
      else add(x, y, hex("#ffc46a"), clamp(1 - (d - SUNR) / 20) * 0.45 * glow, SKY);
    }
    // clouds: long thin streaks drifting left, wrapping
    const clouds = [[0.2, 0.42, 0.21, 2.2, "#e9735a", 0.6], [0.78, 0.5, 0.11, 1.1, "#d65e55", 0.7], [0.82, 0.28, 0.17, 1.3, "#ffd7a0", 0.8], [0.4, 0.3, 0.26, 1, "#e9735a", 0.5], [0.95, 0.22, 0.45, 0.9, "#d65e55", 0.9], [0.1, 0.25, 0.3, 0.8, "#ffd7a0", 0.6]];
    for (const [u, len, v, thick, col, speed] of clouds) {
      const cx = ((((u * W - t * speed * 1.6) % (W * 1.5)) + W * 1.5) % (W * 1.5)) - W * 0.25, cy = v * H, L = len * W;
      for (let y = Math.floor(cy - thick * 3); y <= cy + thick * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.11 + v * 40) * thick;
        const a = clamp(along * 2) * clamp(1 - Math.abs(y - cy - wob) / (thick * 1.6 * (0.4 + along)));
        if (a > 0.05) add(x, y, hex(col), a * 0.9, SKY);
      }
    }
    // mist rising between the far ridges
    for (let k = 1; k < 4; k++) for (let x = 0; x < W; x++) {
      const y0 = Math.floor(crest[k][x]);
      for (let y = y0 - 2; y < y0 + 6; y++) {
        const n = fbm(x / 22 - t * 0.12 * k, y / 4 + k * 7, 3, k);
        const a = clamp((n - 0.48) * 2.2) * 0.45 * (1 - Math.abs(y - y0 - 1) / 6);
        if (a > 0.02 && mask[y * W + x] === RIDGE) add(x, y, hex("#e0a0a8"), a);
      }
    }
    // lantern windows flicker
    windows.forEach(([x, y], i) => {
      const f = 0.55 + 0.45 * Math.sin(t * (3 + i) + i * 2.1) * Math.sin(t * 1.3 + i);
      for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 2; xx++) add(xx, yy, mix(hex("#2a1d28"), hex("#ffd27a"), clamp(0.55 + f * 0.45)), 1);
    });
    // birds: a small flock crossing the sky every 18 s, flapping
    const bt = (t % 18) / 18, fx = lerp(W + 10, -40, bt), fy = 0.2 * H + Math.sin(bt * 6) * 4;
    for (const b of birds) {
      const x = Math.round(fx + b.dx), y = Math.round(fy + b.dy + Math.sin(t * 2 + b.ph)), up = Math.sin(t * 9 + b.ph) > 0;
      add(x, y, hex("#2a1d28"), 1, SKY);
      add(x - 1, y + (up ? -1 : 0), hex("#2a1d28"), 1, SKY); add(x + 1, y + (up ? -1 : 0), hex("#2a1d28"), 1, SKY);
    }

    // to text: palette key + level (brightness against the palette colour)
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
