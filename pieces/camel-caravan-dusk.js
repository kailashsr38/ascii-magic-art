/* camel-caravan-dusk: a camel caravan walking a dune crest at dusk, hand-built.
 * A static scene (dusk sky, two hazy far dune ranges, the crest dune, the rippled
 * foreground dune and its scrub) is painted once; each frame adds the low sun, thin
 * drifting cloud, the caravan walking the crest and the dust it kicks up. */
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
function buildPalette(anchors) {
  const pal = [];
  for (const a of anchors) {
    const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
    for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); pal.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
  }
  return pal;
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
// The painted picture: rgb plus a layer id per cell (0 = sky, larger = nearer).
function makeCanvas() {
  const rgb = new Float32Array(W * H * 3), layer = new Uint8Array(W * H);
  const put = (x, y, c, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; layer[i] = L; };
  const blend = (x, y, c, a, L) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = lerp(rgb[i * 3], c[0], a); rgb[i * 3 + 1] = lerp(rgb[i * 3 + 1], c[1], a); rgb[i * 3 + 2] = lerp(rgb[i * 3 + 2], c[2], a); if (L !== undefined) layer[i] = L; };
  return { rgb, layer, put, blend };
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

const ANCHORS = [
  ["#5a3a80", "#7a3e84", "#a24a80", "#c8587a", "#e46e68", "#f48a5a", "#ffa858", "#ffc468", "#ffd88a", 14],
  ["#fff6d8", "#ffe6a8", "#ffd480", 3],
  ["#ffb878", "#f09a70", "#e88070", "#d07882", "#c06a7a", 6],
  ["#9a5674", "#7e4868", "#5e3660", "#3a2248", 5],
  ["#f0a060", "#c87058", 2],
  ["#f2a868", "#e08a56", "#c87050", "#a85a4c", "#86484a", "#643a48", 8],
  ["#140c1c", "#20142a", "#30203a", 3],
  ["#f6c090", "#e8a478", 2],
  ["#ffc8a0", "#d88890", 2],
];
const PAL = buildPalette(ANCHORS);

export const meta = {
  slug: "camel-caravan-dusk", name: "Camel Caravan Dusk", category: "landscapes",
  note: "A caravan of camels walks a desert dune crest against a low dusk sun, kicking up trails of dust.",
  tags: ["desert", "camels", "dunes", "dusk", "sunset", "caravan", "halftone", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 0, FAR = 1, MAIN = 2, FORE = 3;
// a camel facing left, without legs; legs are drawn per frame
const CAMEL = [
  ".###",
  "#####",
  "######",
  "##..##..........###",
  "....##........#######",
  ".....##......#########",
  "......##...############",
  ".......###############.##",
  "........###############..#",
  "........###############",
  ".........#############",
  "..........###########",
];

export default function create() {
  const { rgb, layer, put } = makeCanvas();
  const SUN = [124, 61], SUNR = 11;
  const crest = (x) => 77 - 4 * Math.sin(x / 38 + 0.4) - 1.5 * Math.sin(x / 15 + 1);
  // 1. sky
  for (let y = 0; y < 80; y++) for (let x = 0; x < W; x++) {
    let c = ramp([[0, "#5a3a80"], [0.18, "#7a3e84"], [0.36, "#a24a80"], [0.52, "#c8587a"], [0.66, "#e46e68"], [0.78, "#f48a5a"], [0.9, "#ffa858"], [1, "#ffc468"]], y / 68);
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.5);
    c = mix(c, hex("#ffd88a"), clamp(1 - d / 52) * 0.55);
    put(x, y, c, SKY);
  }
  // 2. far dunes, two hazy ranges with soft crests
  const f1 = (x) => 66 + 2 * Math.sin(x / 23 + 2) + Math.sin(x / 9) * 0.6;
  const f2 = (x) => 70.5 + 2 * Math.sin(x / 29 + 5) + 0.8 * Math.sin(x / 11 + 1);
  for (let x = 0; x < W; x++) {
    for (let y = Math.floor(f1(x)); y < H; y++) put(x, y, mix(hex("#ffb878"), hex("#f09a70"), clamp((y - f1(x)) / 5)), FAR);
    for (let y = Math.floor(f2(x)); y < H; y++) {
      const side = Math.cos(x / 29 + 5) > 0 ? 0 : 0.5; // slope away from the sun is darker
      put(x, y, mix(mix(hex("#e88070"), hex("#d07882"), clamp((y - f2(x)) / 5)), hex("#c06a7a"), side), FAR);
    }
  }
  // 3. the crest dune the caravan walks: backlit, a bright rim on the crest
  for (let x = 0; x < W; x++) {
    const cy = crest(x);
    for (let y = Math.floor(cy); y < H; y++) {
      const k = (y - cy) / 18;
      let c = ramp([[0, "#9a5674"], [0.4, "#7e4868"], [1, "#5e3660"]], k);
      if (y - cy < 1) c = hex("#f0a060"); else if (y - cy < 2) c = hex("#c87058");
      put(x, y, c, MAIN);
    }
  }
  // 4. the foreground dune: a sharp crest from the lower left, rippled lit face
  const fg = (x) => 86 + x * 0.13 + 3 * Math.sin(x / 30) + (x > 120 ? (x - 120) * 0.05 : 0);
  for (let x = 0; x < W; x++) for (let y = Math.floor(fg(x)); y < H; y++) {
    const d = y - fg(x), rip = Math.sin((y - x * 0.32) * 0.95 + Math.sin(x / 9) * 1.2);
    let c = ramp([[0, "#f2a868"], [0.25, "#e08a56"], [0.6, "#c87050"], [1, "#a85a4c"]], d / 22 + (x / W) * 0.25);
    if (rip > 0.55) c = mix(c, hex("#86484a"), 0.55);
    if (d < 1) c = hex("#ffd480");
    put(x, y, c, FORE);
  }
  // dry scrub on the foreground dune
  const scrub = [[22, 0], [64, 1], [150, 2], [176, 3]];
  for (const [sx, k] of scrub) {
    const by = fg(sx) + 4 + k;
    for (let j = 0; j < 9; j++) {
      const a = -Math.PI / 2 + (j - 4) * 0.28, len = 4 + ((j * 7 + k) % 4);
      for (let l = 0; l < len; l++) put(sx + Math.cos(a) * l, by + Math.sin(a) * l, hex("#30203a"), FORE);
    }
  }

  const F = makeFrame(rgb, layer, PAL);
  const { add } = F;
  const INK = hex("#140c1c"), DUST = hex("#ffc8a0");
  const N = 6, R = W + 60, SPEED = 2.6;
  const pos = (t, i) => ((((-t * SPEED + (i * R) / N) % R) + R) % R) - 30; // left edge x of the camel
  const leaders = new Set([0, 3]);

  const drawCamel = (x0, t, i) => {
    const ph = t * 3.1 + i * 1.7, bob = Math.round(Math.max(0, Math.sin(ph * 2)) * 0.8);
    const feet = Math.round(crest(x0 + 15)), top = feet - 20 - bob;
    for (let r = 0; r < CAMEL.length; r++) for (let c = 0; c < CAMEL[r].length; c++) if (CAMEL[r][c] === "#") add(x0 + c, top + r, INK, 1, MAIN);
    // four legs, front pair and back pair in counter step
    const legs = [[10, 0], [12, Math.PI], [19, Math.PI * 0.5], [21, Math.PI * 1.5]];
    for (const [lx, o] of legs) {
      const sw = Math.sin(ph + o) * 3, lift = Math.max(0, Math.cos(ph + o)) * 1.5;
      const hx = x0 + lx, hy = top + 11, fx = hx + sw, fy = Math.round(crest(fx)) - lift;
      const kx = hx + sw * 0.4 + 0.6, ky = (hy + fy) / 2;
      for (let s = 0; s <= 1; s += 0.15) { add(lerp(hx, kx, s), lerp(hy, ky, s), INK, 1, MAIN); add(lerp(hx, kx, s) + 1, lerp(hy, ky, s), INK, 1, MAIN); add(lerp(kx, fx, s), lerp(ky, fy, s), INK, 1, MAIN); }
    }
    return [x0 + 1, top + 2];
  };
  const drawWalker = (x0, t, i, head) => {
    const ph = t * 4.4 + i, feet = Math.round(crest(x0 + 1)), top = feet - 14;
    add(x0, top, INK, 1, MAIN); add(x0 + 1, top, INK, 1, MAIN); add(x0, top + 1, INK, 1, MAIN); add(x0 + 1, top + 1, INK, 1, MAIN);
    add(x0 - 1, top + 1, INK, 1, MAIN); add(x0 + 2, top, INK, 1, MAIN); // head cloth
    for (let y = top + 2; y < top + 9; y++) { add(x0, y, INK, 1, MAIN); add(x0 + 1, y, INK, 1, MAIN); add(x0 + 2, y, INK, y > top + 3 ? 1 : 0, MAIN); }
    const s = Math.sin(ph) * 2;
    for (let j = 0; j < 6; j++) { add(x0 + (s * j) / 6, top + 9 + j, INK, 1, MAIN); add(x0 + 1 - (s * j) / 6, top + 9 + j, INK, 1, MAIN); }
    // lead rope back to the camel's head
    const hx = x0 + 2, hy = top + 4, [cx, cy] = head;
    for (let k = 0; k <= 1; k += 0.08) add(lerp(hx, cx, k), lerp(hy, cy, k) + Math.sin(k * Math.PI) * 2, INK, 0.8, MAIN);
  };

  return (t) => {
    F.begin();
    // the sun, half behind the far dunes
    for (let y = SUN[1] - SUNR; y <= SUN[1] + SUNR; y++) for (let x = SUN[0] - SUNR; x <= SUN[0] + SUNR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]);
      if (d < SUNR) add(x, y, d < SUNR - 2 ? hex("#fff6d8") : hex("#ffe6a8"), 1, SKY);
    }
    // thin cloud streaks drifting left
    const streaks = [[0.2, 0.3, 16, 0.5], [0.7, 0.22, 26, 0.35], [0.45, 0.18, 40, 0.6], [0.9, 0.25, 48, 0.45]];
    for (const [u, len, v, sp] of streaks) {
      const L = len * W, cx = ((((u * W - t * sp * 1.6) % (W + L)) + W + L) % (W + L)) - L / 2;
      for (let x = Math.max(0, Math.floor(cx - L / 2)); x < Math.min(W, cx + L / 2); x++) {
        const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.09 + v) * 1.2;
        add(x, Math.round(v + wob), v > 36 ? hex("#ffc8a0") : hex("#d88890"), clamp(along * 2) * 0.7, SKY);
        if (along > 0.4) add(x, Math.round(v + wob + 1), hex("#d88890"), (along - 0.4) * 0.8, SKY);
      }
    }
    // dust kicked up behind each camel, hanging low on the dune face and drifting off
    for (let i = 0; i < N; i++) for (let j = 0; j < 14; j++) {
      const a = (t * 0.45 + j / 14 + i * 0.13) % 1, te = t - a * 2.2, x0 = pos(te, i);
      if (x0 < -50 || x0 > W + 10) continue;
      const px = x0 + 12 + (j % 2) * 9 + a * 22, py = crest(px) + 4 - a * 3 + (j % 3) - 1;
      const al = (1 - a) * 0.7, rx = 2 + a * 4, ry = 1 + a * 1.5;
      for (let yy = Math.floor(py - ry); yy <= py + ry; yy++) for (let xx = Math.floor(px - rx); xx <= px + rx; xx++) {
        const d = Math.hypot((xx - px) / rx, (yy - py) / ry);
        if (d < 1) add(xx, yy, DUST, al * (1 - d * d), MAIN);
      }
    }
    // the caravan, walking left along the crest
    for (let i = 0; i < N; i++) {
      const x0 = pos(t, i);
      if (x0 < -30 || x0 > W + 12) continue;
      const head = drawCamel(Math.round(x0), t, i);
      if (leaders.has(i)) drawWalker(Math.round(x0 - 10), t, i, head);
    }
    return F.finish();
  };
}
