/* river-lantern-festival: sky lanterns rising over a river at night from a crowded arched bridge, hand-built.
 * A static scene (night sky, far town with lit windows and a pagoda, the river,
 * the humpback bridge and its reflection) is painted once; each frame adds paper
 * lanterns rising and drifting, their reflections, people on the bridge, two
 * walkers crossing and small lanterns floating down the river. */
import { fbm, noise2, clamp, lerp, rng, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const ANCHORS = [
  ["#1c2258", "#2c3470", "#463c7c", "#62487e", "#7e5880", 8],
  ["#a8607a", "#c87870", 2],
  ["#0a0a18", "#141428", "#20203a", 3],
  ["#1a2650", "#24325e", "#30406e", "#3e4e7c", 4],
  ["#c04a20", "#e07030", "#f89a40", "#ffc060", "#ffe4a0", "#fff6dc", 7],
  ["#7a4448", "#a85a44", 2],
  ["#4a3a78", "#5c4a8a", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "river-lantern-festival", name: "River Lantern Festival", category: "landscapes",
  note: "Paper lanterns rise slowly into the night from a crowded arched bridge, glowing over the river and the lit town beyond.",
  tags: ["lanterns", "festival", "night", "river", "bridge", "halftone", "hero", "celebration"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";
const SKY = 1, TOWN = 2, WATER = 3, BRIDGE = 4;

const C = Object.fromEntries(Object.entries({
  s0: "#1c2258", s1: "#2c3470", s2: "#463c7c", s3: "#62487e", s4: "#7e5880", warm: "#a8607a", warm2: "#c87870",
  ink: "#0a0a18", ink2: "#141428", ink3: "#20203a", w0: "#1a2650", w1: "#24325e", w2: "#30406e", w3: "#3e4e7c",
  l0: "#c04a20", l1: "#e07030", l2: "#f89a40", l3: "#ffc060", l4: "#ffe4a0", l5: "#fff6dc", r0: "#7a4448", r1: "#a85a44", town: "#4a3a78", town2: "#5c4a8a",
}).map(([k, v]) => [k, hex(v)]));

const HOR = 60;
const deckY = (x) => 66 - 22 * Math.sin(Math.PI * clamp((x - 14) / 164));

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };

  // 1. night sky, warmed toward the horizon by the town and the lanterns
  for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
    const v = y / HOR;
    const c = v < 0.5 ? mix(C.s0, C.s2, v / 0.5) : mix(C.s2, C.s4, (v - 0.5) / 0.5);
    put(x, y, mix(c, C.warm, clamp(1 - Math.hypot(x - 96, (y - 46) * 1.6) / 70) * 0.35), SKY);
  }
  // 2. far town: rooftops, a pagoda, lit windows
  const R = rng(9), windows = [];
  for (let x = 0; x < W;) {
    const w = 6 + Math.floor(R() * 10), h = 3 + Math.floor(R() * 6);
    for (let y = HOR - h; y < HOR; y++) for (let xx = x; xx < x + w; xx++) put(xx, y, C.town, TOWN);
    for (let xx = x - 1; xx <= x + w; xx++) put(xx, HOR - h - 1, C.town2, TOWN);
    for (let k = 0; k < 3; k++) if (R() > 0.4) { const wx = x + 1 + Math.floor(R() * (w - 2)), wy = HOR - h + 1 + Math.floor(R() * (h - 2)); put(wx, wy, C.l3, TOWN); windows.push([wx, wy]); }
    x += w + Math.floor(R() * 3);
  }
  for (let y = HOR - 5; y < HOR; y++) for (let x = 0; x < W; x++) put(x, y, C.town, TOWN);
  // pagoda on the left bank, five tiers with upturned eaves
  const PX = 34;
  for (let k = 0; k < 5; k++) {
    const base = HOR - 6 - k * 6, hw = 9 - k * 1.5;
    for (let y = base - 3; y < base; y++) for (let x = Math.floor(PX - hw + 2); x <= PX + hw - 2; x++) put(x, y, C.town, TOWN);
    for (let x = Math.floor(PX - hw - 1); x <= PX + hw + 1; x++) put(x, base, C.town2, TOWN);
    put(PX - hw - 2, base - 1, C.town2, TOWN); put(PX + hw + 2, base - 1, C.town2, TOWN);
    put(PX, base - 2, C.l3, TOWN);
  }
  for (let y = HOR - 6 - 4 * 6 - 9; y < HOR - 6 - 4 * 6 - 3; y++) put(PX, y, C.town2, TOWN);
  for (let y = HOR - 6; y < HOR; y++) for (let x = PX - 8; x <= PX + 8; x++) put(x, y, C.town, TOWN);
  // 3. river with reflected town lights as short vertical streaks
  for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y - HOR) / (H - HOR);
    put(x, y, mix(C.w2, C.w0, v), WATER);
  }
  for (const [wx, wy] of windows) for (let y = HOR + (HOR - wy); y < HOR + (HOR - wy) + 6; y++) if (noise2(wx, y / 2, 4) > 0.35) put(wx, y, C.r1, WATER);
  // 4. the humpback bridge, its arch opening and its reflection
  const archY = (x) => 70 - 18 * Math.sqrt(Math.max(0, 1 - ((x - 96) / 52) ** 2));
  for (let x = 6; x < 186; x++) {
    const top = deckY(x);
    for (let y = Math.floor(top); y < H; y++) {
      if (Math.abs(x - 96) < 52 && y >= archY(x)) break;
      if (y > 74) break;
      put(x, y, y < top + 1.5 ? C.ink3 : C.ink, BRIDGE);
    }
    for (let y = Math.floor(top) - 2; y < top; y++) put(x, y, C.ink, BRIDGE);
  }
  for (let x = 44; x <= 148; x++) {
    const ay = archY(x), ry = 2 * 70 - ay;
    for (let y = 71; y <= Math.min(H - 1, ry); y++) if (mask[y * W + x] === WATER) put(x, y, mix(C.w0, C.ink, 0.4), WATER);
    for (let y = 71; y <= 74; y++) put(x, y, mix(C.w0, C.ink, 0.4), WATER);
  }
  for (let x = 6; x < 186; x++) for (let y = 74; y < 82 - Math.abs(x - 96) * 0.0; y++) if (Math.abs(x - 96) >= 52) put(x, y, mix(C.w0, C.ink, 0.4), WATER);
  // the crowd standing along the deck
  const people = [];
  const PR = rng(31);
  for (let x = 20; x < 176; x += 5 + Math.floor(PR() * 5)) people.push([x, 5 + Math.floor(PR() * 3), PR() > 0.6]);
  for (const [x, h, holds] of people) {
    const top = Math.round(deckY(x)) - 1;
    for (let y = top - h; y <= top; y++) { put(x, y, C.ink, BRIDGE); put(x + 1, y, C.ink, BRIDGE); }
    put(x, top - h - 1, C.ink, BRIDGE); put(x + 1, top - h - 1, C.ink, BRIDGE);
    if (holds) { put(x + 2, top - h + 1, C.ink, BRIDGE); put(x + 3, top - h - 1, C.l2, BRIDGE); put(x + 3, top - h - 2, C.l3, BRIDGE); }
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
  const LR = rng(77);
  const lanterns = Array.from({ length: 26 }, (_, i) => ({ x0: 30 + LR() * 132, P: 24 + LR() * 14, ph: LR() * 40, size: 2.2 + LR() * 2.2, drift: 8 + LR() * 14, sway: LR() * 6 }));
  lanterns.push({ x0: 98, P: 30, ph: 21, size: 5.5, drift: 6, sway: 1, hero: true });
  const floats = Array.from({ length: 8 }, () => ({ y: HOR + 16 + LR() * 30, ph: LR() * 400, sp: 1.2 + LR() * 1.5 }));

  return (t) => {
    out.set(rgb); adj.fill(0);
    const add = (x, y, c, a, only, lv) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (only && mask[i] !== only) return;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
      if (lv) adj[i] = lv;
    };
    // ripple lines drifting toward the viewer
    for (let y = HOR + 1; y < H; y++) {
      const s = Math.sin((30 / (y - HOR + 3) - t * 0.4) * 6.28);
      if (s < 0.85) continue;
      for (let x = 0; x < W; x++) if (noise2(x / 7 + y * 3, 1, 8) > 0.5) add(x, y, C.w3, 0.5, WATER, 1);
    }
    // two walkers crossing the bridge in opposite directions
    for (const [sp, off, dir] of [[2.4, 0, 1], [1.8, 70, -1]]) {
      const u = ((t * sp + off) % 170) / 170, x = Math.round(dir > 0 ? lerp(10, 180, u) : lerp(180, 10, u)), top = Math.round(deckY(x)) - 1;
      const step = Math.sin(t * 6 + off) > 0;
      for (let y = top - 6; y <= top - 1; y++) { add(x, y, C.ink, 1); add(x + 1, y, C.ink, 1); }
      add(x + (step ? -1 : 0), top, C.ink, 1); add(x + (step ? 2 : 1), top, C.ink, 1);
      add(x, top - 7, C.ink, 1); add(x + 1, top - 7, C.ink, 1);
    }
    // small lanterns floating down the river
    for (const f of floats) {
      const x = ((t * f.sp + f.ph) % (W + 20)) - 10, sc = 1 + (f.y - HOR) / 30;
      add(x, f.y, C.l3, 1, WATER); if (sc > 1.6) add(x + 1, f.y, C.l2, 1, WATER);
      add(x, f.y + 1, C.r1, 0.6, WATER);
    }
    // sky lanterns rising, drifting with the wind, shrinking as they climb
    for (const L of lanterns) {
      const a = ((t + L.ph) % L.P) / L.P;
      const startY = deckY(L.x0) - 9;
      const y = startY - a * (startY + 16), x = L.x0 + a * L.drift + Math.sin(a * 6 + L.ph) * L.sway;
      const s = L.size * (1 - a * 0.62), fade = clamp(a * 25) * clamp((1 - a) * 6);
      if (fade <= 0) continue;
      const w = Math.max(1, Math.round(s)), h = Math.max(1, Math.round(s * 1.3));
      // soft halo
      const hr = s * 2.4;
      for (let yy = Math.floor(y - hr); yy <= y + hr; yy++) for (let xx = Math.floor(x - hr); xx <= x + hr; xx++) {
        const d = Math.hypot(xx - x, yy - y);
        if (d < hr) add(xx, yy, C.warm2, (1 - d / hr) * 0.45 * fade, SKY);
      }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const xx = Math.round(x - w / 2 + i), yy = Math.round(y - h / 2 + j);
        const v = j / Math.max(1, h - 1), edge = (i === 0 || i === w - 1) && w > 2;
        const col = L.hero ? (edge ? C.l3 : v > 0.55 ? C.l5 : C.l4) : edge ? C.l0 : v > 0.6 ? C.l3 : C.l2;
        add(xx, yy, col, fade, 0, 1);
      }
      // reflection in the river for lanterns still low over the water
      const ry = HOR + (HOR - y) * 0.8;
      if (ry < H - 1) for (let k = 0; k < Math.max(2, s * 2); k++) add(x, ry + k, C.r1, fade * 0.6 * (1 - k / (s * 2 + 2)), WATER);
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
