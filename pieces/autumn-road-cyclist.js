/* autumn-road-cyclist: a lone cyclist riding a forest road through autumn trees, hand-built.
 * A static scene (hazy low sun, far and near tree rows, still light rays, leaf
 * litter, the road and two big foreground trunks) is painted once; each frame
 * adds the cyclist pedalling across and leaves falling and drifting. */
import { fbm, noise2, clamp, lerp, rng, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const ANCHORS = [
  ["#f8c880", "#fde0a0", "#fff2cc", "#fffae8", 5],
  ["#d89464", "#b06a4c", "#7e4234", 4],
  ["#b86a50", "#a05a48", "#8a4c40", 3],
  ["#c8401e", "#e2622a", "#f08834", "#f6ac40", "#fcd060", 9],
  ["#5a3020", "#3e2018", "#2a1410", "#1a0c08", 4],
  ["#7a3e20", "#a4562a", "#c87434", 4],
  ["#7e6656", "#a48468", "#d0b088", "#ecd0a4", 5],
  ["#120806", "#8a1e18", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "autumn-road-cyclist", name: "Autumn Road Cyclist", category: "landscapes",
  note: "A lone cyclist pedals along a forest road under orange and red autumn trees while leaves drift down through the low sunlight.",
  tags: ["autumn", "fall", "cyclist", "bicycle", "forest", "leaves", "halftone", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";
const BG = 1, FAR = 2, MID = 3, GROUND = 4, ROAD = 5, FORE = 6;

const C = Object.fromEntries(Object.entries({
  sun: "#fffae8", sun2: "#fff2cc", l1: "#fde0a0", l2: "#f8c880", haze: "#d89464", haze2: "#b06a4c", haze3: "#7e4234",
  far: "#b86a50", far2: "#a05a48", far3: "#8a4c40", f1: "#c8401e", f2: "#e2622a", f3: "#f08834", f4: "#f6ac40", f5: "#fcd060",
  tr: "#5a3020", tr2: "#3e2018", tr3: "#2a1410", tr4: "#1a0c08", g1: "#7a3e20", g2: "#a4562a", g3: "#c87434",
  rd: "#7e6656", rd2: "#a48468", rd3: "#d0b088", rd4: "#ecd0a4", ink: "#120806", scarf: "#8a1e18",
}).map(([k, v]) => [k, hex(v)]));

const ROAD0 = 84, ROAD1 = 95;

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };
  const SUN = [124, 64];
  // still light rays fanning out from the low sun through the trunks
  const ray = (x, y) => {
    const a = Math.atan2(y - SUN[1], x - SUN[0]);
    const band = Math.max(0, Math.sin(a * 11 + 1.3)) ** 2;
    return band * clamp(1 - Math.hypot(x - SUN[0], y - SUN[1]) / 120);
  };
  // 1. golden backlight, brightest low behind the trees
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.4);
    let c = d < 5 ? C.sun : d < 12 ? mix(C.sun2, C.l1, (d - 5) / 7) : d < 40 ? mix(C.l1, C.l2, (d - 12) / 28) : mix(C.l2, C.haze2, clamp((d - 40) / 70));
    c = mix(c, C.l1, ray(x, y) * 0.3);
    put(x, y, c, BG);
  }
  // 2. far tree row: hazy trunks
  const R = rng(17);
  for (let k = 0; k < 18; k++) {
    const x0 = Math.floor(R() * W), w = 1 + Math.floor(R() * 2);
    if (Math.abs(x0 - SUN[0]) < 6) continue;
    for (let y = 20; y < 78; y++) for (let x = x0; x < x0 + w; x++) put(x, y, mix(C.haze, C.haze2, 0.5), FAR);
  }
  // 3. near trunks, dark and straight, flaring at the roots
  const trunks = [[22, 5], [48, 3], [70, 4], [100, 3], [146, 4], [170, 5]];
  for (const [tx, tw] of trunks) for (let y = 0; y < ROAD0; y++) {
    const ww = tw + (y > 74 ? (y - 74) * 0.5 : 0);
    for (let x = Math.floor(tx - ww / 2); x <= tx + ww / 2; x++) put(x, y, x > tx + tw * 0.2 ? C.tr2 : C.tr3, MID);
  }
  // 4. the canopy: big flat masses of red, orange and gold hanging over the top
  for (let y = 0; y < 50; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 14, y / 9, 4, 7);
    const edge = 0.3 + (y / 50) * 0.4 + clamp(1 - Math.abs(x - SUN[0]) / 40) * (y / 50) * 0.12;
    if (n < edge) continue;
    const v = (n - edge) * 5 + (noise2(x / 18, y / 12, 3) - 0.5) * 0.8;
    const c = v > 1.1 ? C.f2 : v > 0.6 ? C.f3 : v > 0.25 ? C.f4 : C.f5;
    put(x, y, (x * 7 + y * 3) % 23 === 0 ? C.f5 : c, MID);
  }
  // 5. ground: leaf bank above the road, the pale sunlit road, leaf bank below
  for (let y = 74; y < H; y++) for (let x = 0; x < W; x++) {
    const n = noise2(x / 3, y / 2, 13), lit = ray(x, y);
    if (y >= ROAD0 && y <= ROAD1) {
      let c = y === ROAD0 ? C.rd2 : y === ROAD1 ? C.rd : mix(C.rd3, C.rd4, clamp(0.4 + lit * 1.5 - (y - ROAD0) / 30));
      if (n > 0.88) c = C.f3;
      put(x, y, c, ROAD);
    } else {
      const top = 77 + 2 * noise2(x / 6, 0, 4);
      if (y < top) continue;
      const below = y > ROAD1;
      put(x, y, below ? (n > 0.55 ? C.f3 : n > 0.3 ? C.f2 : C.g3) : (n > 0.5 ? C.f4 : C.g3), GROUND);
    }
  }
  // foreground leaf bank across the bottom
  for (let x = 0; x < W; x++) {
    const top = 102 + 3 * fbm(x / 7, 2, 3, 19);
    for (let y = Math.floor(top); y < H; y++) { const n = noise2(x / 2, y / 2, 23); put(x, y, n > 0.55 ? C.f2 : n > 0.3 ? C.f1 : C.g2, FORE); }
  }
  const out = new Float32Array(W * H * 3), adj = new Int8Array(W * H), keyCache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = keyCache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    keyCache.set(k, best);
    return best;
  };
  const LR = rng(5);
  const leaves = Array.from({ length: 46 }, () => ({ x: LR() * W, sp: 4 + LR() * 6, ph: LR() * 100, sw: 3 + LR() * 6, col: [C.f1, C.f2, C.f3, C.f4, C.f5][Math.floor(LR() * 5)], big: LR() > 0.7 }));

  return (t) => {
    out.set(rgb); adj.fill(0);
    const add = (x, y, c, a, lv) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
      if (lv) adj[i] = lv;
    };
    const behind = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === FORE; };
    const seg = (x0, y0, x1, y1, c, th = 0) => {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.5) + 1;
      for (let i = 0; i <= n; i++) {
        const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n);
        if (!behind(x, y)) add(x, y, c, 1, -1);
        if (th && !behind(x + 1, y)) add(x + 1, y, c, 1, -1);
      }
    };
    // the cyclist, side view, riding left to right every 16 s
    const P = 16, u = (t % P) / P, cx = lerp(-30, W + 30, u), gy = ROAD1 - 3;
    const r = 5.2, rearX = cx - 9, frontX = cx + 9, wy = gy - r;
    for (const wx of [rearX, frontX]) {
      for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; const x = wx + Math.cos(a) * r, y = wy + Math.sin(a) * r; if (!behind(x, y)) add(x, y, C.ink, 1, -1); }
      const spin = -t * 9 + wx * 0;
      for (let k = 0; k < 3; k++) { const a = spin + (k * Math.PI) / 3; seg(wx - Math.cos(a) * r, wy - Math.sin(a) * r, wx + Math.cos(a) * r, wy + Math.sin(a) * r, C.ink); }
    }
    const crank = [cx - 1, wy], seat = [cx - 4, wy - 9], bar = [cx + 6, wy - 10];
    seg(rearX, wy, crank[0], crank[1], C.ink); seg(rearX, wy, seat[0], seat[1], C.ink); seg(seat[0], seat[1], crank[0], crank[1], C.ink, 1);
    seg(seat[0], seat[1] + 1, bar[0] - 1, bar[1] + 2, C.ink); seg(crank[0], crank[1], bar[0] - 1, bar[1] + 2, C.ink, 1); seg(bar[0], bar[1], frontX, wy, C.ink, 1);
    seg(bar[0], bar[1], bar[0] + 2, bar[1] - 1, C.ink);
    // rider: hips at the saddle, back leaning forward, head, arm to the bars, legs on the pedals
    const hip = [seat[0], seat[1] - 2], sh = [cx + 2, wy - 18], head = [cx + 4, wy - 21];
    seg(hip[0], hip[1], sh[0], sh[1], C.ink, 1); seg(hip[0] - 1, hip[1], sh[0] - 1, sh[1], C.ink);
    for (let yy = -2; yy <= 1; yy++) for (let xx = -1; xx <= 2; xx++) if (xx * xx + yy * yy < 4 && !behind(head[0] + xx, head[1] + yy)) add(head[0] + xx, head[1] + yy, C.ink, 1, -1);
    seg(sh[0] - 1, sh[1] + 1, cx - 3, sh[1] + 3, C.scarf); seg(sh[0] - 1, sh[1] + 2, cx - 4 - Math.sin(t * 5), sh[1] + 4, C.scarf);
    seg(sh[0], sh[1] + 1, bar[0] + 1, bar[1] - 1, C.ink);
    const ca = t * 5.5;
    for (const s of [0, Math.PI]) {
      const pd = [crank[0] + Math.cos(ca + s) * 3, crank[1] + Math.sin(ca + s) * 3];
      const mid = [lerp(hip[0], pd[0], 0.5) + 3, lerp(hip[1], pd[1], 0.5) - 1];
      seg(hip[0], hip[1], mid[0], mid[1], C.ink, 1); seg(mid[0], mid[1], pd[0], pd[1], C.ink);
      seg(pd[0] - 1, pd[1], pd[0] + 1, pd[1], C.ink);
    }
    // a short shadow on the road under the bike
    for (let x = Math.floor(rearX - 4); x < frontX + 6; x++) if (!behind(x, gy + 1)) add(x, gy + 1, C.rd, 0.7);
    // falling leaves, swaying and tumbling as they drop
    for (const L of leaves) {
      const fall = (t * L.sp + L.ph * 7) % (H + 10) - 5;
      const x = (((L.x + Math.sin(t * 0.9 + L.ph) * L.sw - t * 2.5) % W) + W) % W, y = fall;
      const flip = Math.sin(t * 3 + L.ph) > 0;
      add(x, y, L.col, 1, 1);
      if (L.big) { add(x + (flip ? 1 : 0), y + (flip ? 0 : 1), L.col, 1, 1); add(x + 1, y + 1, L.col, 0.8); }
      else add(x + (flip ? 1 : 0), y + (flip ? 0 : 1), L.col, 0.8);
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
