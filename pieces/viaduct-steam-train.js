/* viaduct-steam-train: an old steam train crossing a tall stone viaduct in the mountains, hand-built.
 * A static scene (afternoon sky and low sun, two mountain ranges, the arched
 * viaduct, valley forest and foreground pines) is painted once; each frame adds
 * the train rolling across, steam puffs drifting back from its chimney and mist
 * moving through the valley. */
import { fbm, noise2, clamp, lerp, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const ANCHORS = [
  ["#3e6c9a", "#5a88b0", "#7fa3c0", "#b8b4a8", "#e0b890", 8],
  ["#f0c890", "#fff1c8", "#fffbea", 3],
  ["#8490b6", "#7480a8", "#66729c", 4],
  ["#6f8f8a", "#587a76", "#446563", "#34514f", 5],
  ["#0f1a17", "#16241f", "#4a6a54", "#5e8066", 5],
  ["#ecc89c", "#d8b086", "#c0976e", 4],
  ["#9c7656", "#7e5e45", "#5f4636", 4],
  ["#15131a", "#2a2630", "#6e2622", "#9a3e2e", 4],
  ["#f0c878", 1],
  ["#e0dcd4", "#c8c6c4", "#aeb0b6", 4],
  ["#d6dde0", "#c2ccd2", 2],
];
const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
}
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

export const meta = {
  slug: "viaduct-steam-train", name: "Viaduct Steam Train", category: "landscapes",
  note: "An old steam train crosses a tall arched stone viaduct between the mountains, puffing steam as mist drifts through the valley.",
  tags: ["train", "steam", "viaduct", "mountains", "railway", "halftone", "hero", "wallpaper"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
const LEVELS = "▁▂▃▄▅▆▇█";
const SKY = 1, FAR = 2, MID = 3, VALLEY = 4, BRIDGE = 5, FORE = 6;

const C = Object.fromEntries(Object.entries({
  sun: "#fffbea", sun2: "#fff1c8", glow: "#f0c890", lit: "#ecc89c", lit2: "#d8b086", lit3: "#c0976e", sh: "#9c7656", sh2: "#7e5e45", sh3: "#5f4636",
  pine: "#0f1a17", pine2: "#16241f", fo: "#4a6a54", fo2: "#5e8066", body: "#15131a", body2: "#2a2630", red: "#6e2622", red2: "#9a3e2e", win: "#f0c878",
  steam: "#e0dcd4", steam2: "#c8c6c4", steam3: "#aeb0b6", mist: "#d6dde0",
}).map(([k, v]) => [k, hex(v)]));

const SPEED = 12, LOOP = W + 140, DECK = 57;
const headX = (t) => (((t * SPEED + 120) % LOOP) + LOOP) % LOOP;

export default function create() {
  const rgb = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; mask[i] = m; };
  const SUN = [34, 30], SR = 7;

  // 1. sky: cool blue above, warm near the horizon, glowing round the low sun
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / 62;
    let c = v < 0.5 ? mix(hex("#3e6c9a"), hex("#7fa3c0"), v / 0.5) : mix(hex("#7fa3c0"), hex("#e0b890"), clamp((v - 0.5) / 0.5));
    const d = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.1);
    c = mix(c, C.glow, clamp(1 - (d - SR) / 30) ** 1.5 * 0.55);
    put(x, y, d < SR ? (d < SR - 1.5 ? C.sun : C.sun2) : c, SKY);
  }
  // 2. far range, pale and hazy
  for (let x = 0; x < W; x++) {
    const top = 40 - 9 * fbm(x / 30, 2, 4, 3) - 6 * Math.max(0, Math.sin(x / 26 + 1)) + 4;
    for (let y = Math.floor(top); y < H; y++) put(x, y, mix(hex("#8490b6"), hex("#66729c"), clamp((y - top) / 16)), FAR);
  }
  // 3. mid range, green-blue, with a big shoulder on the right
  for (let x = 0; x < W; x++) {
    const top = 58 - 10 * fbm(x / 22, 5, 4, 9) - 12 * clamp((x - 110) / 70) * (1 - clamp((x - 175) / 30)) + 2;
    for (let y = Math.floor(top); y < H; y++) {
      const ridge = fbm(x / 7, y / 5, 3, 21) > 0.58 ? 0.25 : 0;
      put(x, y, mix(mix(hex("#6f8f8a"), hex("#34514f"), clamp((y - top) / 20)), hex("#4a6a54"), ridge), MID);
    }
  }
  // 4. valley forest far below the deck
  for (let x = 0; x < W; x++) {
    const top = 82 + 3 * noise2(x / 3, 1, 4) + 2 * Math.sin(x / 9);
    for (let y = Math.floor(top); y < H; y++) put(x, y, (x + y * 3) % 7 === 0 ? C.fo2 : C.fo, VALLEY);
  }
  // 5. the viaduct: deck, parapet and tall piers with round arches
  const PERIOD = 21, PIER = 6, OFF = 3, CROWN = 64, R = (PERIOD - PIER) / 2;
  for (let y = DECK; y < H; y++) for (let x = 0; x < W; x++) {
    let inArch = false;
    if (y > CROWN) {
      const p = (((x - OFF) % PERIOD) + PERIOD) % PERIOD;
      if (p >= PIER) {
        const cx = PIER + R - 0.5, spring = CROWN + R;
        inArch = y >= spring || Math.hypot(p - cx, (y - spring) * 1.0) < R;
      }
    }
    if (inArch) continue;
    let c;
    if (y === DECK) c = C.lit;
    else if (y < CROWN - 2) c = y === DECK + 4 ? C.sh : C.lit2;
    else {
      const p = (((x - OFF) % PERIOD) + PERIOD) % PERIOD;
      const face = p < PIER ? p / PIER : 0.4;
      c = face > 0.7 ? C.sh : mix(C.lit, C.lit3, clamp((y - CROWN) / 60));
      if ((y - CROWN) % 5 === 0) c = mix(c, C.sh3, 0.4);
    }
    put(x, y, mix(c, C.sh, (noise2(x / 2, y / 2, 7) - 0.5) * 0.25), BRIDGE);
  }
  // 6. foreground pines: a jagged row along the bottom and two big trees framing the sides
  const pine = (cx, base, h, w) => {
    for (let y = Math.floor(base - h); y < H; y++) {
      const v = (y - (base - h)) / h;
      const tier = (v * 7) % 1;
      const ww = w * Math.min(1, v) * (0.55 + 0.45 * tier);
      for (let x = Math.floor(cx - ww); x <= cx + ww; x++) put(x, y, x < cx - ww * 0.5 ? C.pine2 : C.pine, FORE);
    }
  };
  const R2 = [3, 9, 15, 22, 30, 37, 158, 165, 171, 178, 185, 190];
  for (let x = 0; x < W; x++) { const top = 101 + 2 * noise2(x / 2.5, 3, 12) + Math.abs(Math.sin(x * 0.9)) * 1.5; for (let y = Math.floor(top); y < H; y++) put(x, y, C.pine, FORE); }
  R2.forEach((cx, i) => pine(cx, 104 - (i % 3) * 2, 12 + ((i * 7) % 9), 4 + (i % 3)));
  pine(8, 104, 52, 15); pine(184, 106, 46, 13);

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

  return (t) => {
    out.set(rgb); adj.fill(0);
    const add = (x, y, c, a, lv) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (mask[i] === FORE) return;
      out[i * 3] = lerp(out[i * 3], c[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], c[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], c[2], a);
      if (lv) adj[i] = lv;
    };
    const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) add(x, y, c, 1); };
    // mist drifting through the valley, behind the viaduct
    for (let y = 60; y < 90; y++) {
      const band = 1 - Math.abs(y - 74) / 16;
      for (let x = 0; x < W; x++) {
        const i = y * W + x, m = mask[i];
        if (m !== MID && m !== VALLEY) continue;
        const n = fbm(x / 26 - t * 0.09, y / 5, 3, 31);
        const a = clamp((n - 0.5) * 2.4) * band * 0.6;
        if (a > 0.03) { out[i * 3] = lerp(out[i * 3], C.mist[0], a); out[i * 3 + 1] = lerp(out[i * 3 + 1], C.mist[1], a); out[i * 3 + 2] = lerp(out[i * 3 + 2], C.mist[2], a); }
      }
    }
    // the train: locomotive in front, tender, four carriages
    const hx = headX(t), Y = DECK - 1;
    const wheels = (x0, x1, r) => { for (let x = x0 + 2; x <= x1 - 2; x += r) { add(x, Y, C.body, 1); add(x + 1, Y, ((x + Math.floor(t * 8)) & 1) ? C.red2 : C.body2, 1); } };
    // carriages
    for (let k = 0; k < 4; k++) {
      const x1 = hx - 36 - k * 20, x0 = x1 - 18;
      rect(x0, Y - 9, x1, Y - 1, C.red);
      rect(x0 + 1, Y - 10, x1 - 1, Y - 10, C.body2);
      rect(x0, Y - 3, x1, Y - 3, C.body2);
      for (let wx = x0 + 2; wx < x1 - 2; wx += 4) rect(wx, Y - 7, wx + 1, Y - 5, C.win);
      wheels(x0, x1, 5);
      rect(x1 + 1, Y - 4, x1 + 1, Y - 3, C.body);
    }
    // tender
    rect(hx - 34, Y - 7, hx - 24, Y - 1, C.body2); rect(hx - 34, Y - 8, hx - 24, Y - 8, C.body);
    wheels(hx - 34, hx - 24, 4);
    // locomotive: cab, boiler, smokebox, chimney, dome, cowcatcher
    rect(hx - 23, Y - 12, hx - 16, Y - 1, C.body); rect(hx - 24, Y - 13, hx - 15, Y - 13, C.body2);
    rect(hx - 22, Y - 10, hx - 19, Y - 8, C.win);
    rect(hx - 16, Y - 8, hx - 2, Y - 2, C.body); rect(hx - 16, Y - 6, hx - 2, Y - 6, C.red2);
    rect(hx - 2, Y - 8, hx, Y - 1, C.body2);
    rect(hx - 6, Y - 13, hx - 4, Y - 9, C.body); rect(hx - 7, Y - 14, hx - 3, Y - 14, C.body);
    rect(hx - 12, Y - 10, hx - 10, Y - 9, C.body2);
    for (let j = 0; j < 3; j++) rect(hx + 1 + j, Y - 2 + j, hx + 1 + j, Y - 2 + j, C.body);
    for (let x = hx - 15; x <= hx - 3; x += 4) { add(x, Y, C.body, 1); add(x + 1, Y, C.body, 1); add(x + 2, Y - 1, C.red2, 1); }
    wheels(hx - 23, hx - 16, 4);
    // steam: puffs leave the chimney every 0.3 s, rise, swell, drift back and thin out
    const EVERY = 0.3, LIFE = 6.5;
    for (let n = Math.floor((t - LIFE) / EVERY); n <= t / EVERY; n++) {
      const te = n * EVERY, a = t - te;
      if (a < 0 || a > LIFE) continue;
      const cxp = headX(te) - 5 - a * 3.2, cyp = Y - 15 - a * 4.2 + a * a * 0.28, r = 1.6 + a * 1.25;
      const fade = (1 - a / LIFE) * (a < 0.3 ? a / 0.3 : 1);
      const col = a < 1.5 ? C.steam : a < 3.5 ? C.steam2 : C.steam3;
      for (let y = Math.floor(cyp - r); y <= cyp + r; y++) for (let x = Math.floor(cxp - r * 1.3); x <= cxp + r * 1.3; x++) {
        const d = Math.hypot((x - cxp) / 1.3, y - cyp);
        const al = clamp((r - d) / 1.6) * fade * 0.85;
        if (al > 0.04) add(x, y, col, al, al > 0.5 ? 1 : 0);
      }
    }

    const text = [], color = [];
    for (let y = 0; y < H; y++) {
      let tr = "", cr = "";
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, r = out[i], g = out[i + 1], b = out[i + 2];
        const k = nearest(r, g, b), Yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const lv = Yl > 0.86 ? 7 : clamp(Math.round(5 + (Yl - LUM[k]) * 12) + adj[y * W + x], 2, 6);
        tr += LEVELS[lv]; cr += KEYS[k];
      }
      text.push(tr); color.push(cr);
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
}
