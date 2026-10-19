/* neon-city-rain: a night street of neon signs in the rain, colours smeared across the wet ground. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#07061a", "#1a0f36", "#3b1748", "#5c2050"], 8));
const BACK = grp(gradient(["#121634", "#232a52"], 3));
const FRONT = grp(gradient(["#0a0b1c", "#181a32", "#262844"], 3));
const WIN = grp(["#5a4a28", "#ffcf6e", "#9fe8ff"]);
const NEON = [
  grp(["#4a1a46", "#c23aa8", "#ff6fe0", "#ffd6f6"]),
  grp(["#0f3a48", "#1fb6d0", "#55f4ff", "#d8fdff"]),
  grp(["#4a2a10", "#d07a20", "#ffad45", "#ffe6c0"]),
  grp(["#163e1c", "#38b84a", "#7dff8a", "#e0ffe2"]),
  grp(["#4a1018", "#c8283c", "#ff5a6e", "#ffd2d8"]),
];
const STREET = grp(gradient(["#06070f", "#0e1122", "#1a1e36", "#2a3050"], 6));
const RAIN = grp(["#5d6a94", "#a9b8e0"]);
const CURB = grp(["#3a3f5c", "#6a7092"]);

export const meta = {
  slug: "neon-city-rain",
  name: "Neon City Rain",
  category: "landscapes",
  note: "Neon signs buzz over a rain-soaked night street, their colours smeared across the wet ground.",
  tags: ["city", "neon", "rain", "night", "cyberpunk", "wallpaper"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(P),
};

const H = 23;
const hash = (a, b) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(23);
  // static city: kind 0 sky, 1 back block, 2 front block, 3 window, 4 neon
  const kind = new Int8Array(cols * H), sub = new Int16Array(cols * H), chs = new Array(cols * H).fill(" ");
  for (let x = 0; x < cols;) {
    const w = 5 + Math.floor(r() * 9), top = 2 + Math.floor(r() * 8);
    for (let i = x; i < Math.min(cols, x + w); i++) for (let y = top; y < H; y++) {
      kind[i + y * cols] = 1;
      if ((i - x) % 3 === 1 && y % 2 === 0 && y > top) { kind[i + y * cols] = 3; sub[i + y * cols] = 100 + Math.floor(r() * 1000); }
    }
    x += w;
  }
  for (let x = 0; x < cols;) {
    const w = 8 + Math.floor(r() * 12), top = 6 + Math.floor(r() * 9);
    if (r() < 0.25) { x += 3; continue; }
    for (let i = x; i < Math.min(cols, x + w); i++) for (let y = top; y < H; y++) {
      kind[i + y * cols] = 2;
      if ((i - x) % 3 !== 0 && y % 3 !== 0 && y > top && i - x > 0 && i - x < w - 1) { kind[i + y * cols] = 3; sub[i + y * cols] = Math.floor(r() * 1000); }
    }
    x += w;
  }
  const signs = [
    { x: 4, y: 7, s: "BAR", v: true, c: 0 },
    { x: 14, y: 14, s: "NOODLES", v: false, c: 1 },
    { x: 33, y: 9, s: "HOTEL", v: true, c: 2 },
    { x: 44, y: 16, s: "OPEN 24H", v: false, c: 4 },
    { x: 60, y: 6, s: "KARAOKE", v: true, c: 3 },
    { x: 70, y: 12, s: "CAFE", v: false, c: 0 },
    { x: 88, y: 8, s: "RAMEN", v: true, c: 1 },
    { x: 78, y: 18, s: "PARKING", v: false, c: 2 },
  ];
  const signCells = signs.map((sg, id) => {
    const cells = [];
    const w = sg.v ? 3 : sg.s.length + 4, h = sg.v ? sg.s.length + 2 : 3;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const edgeX = i === 0 || i === w - 1, edgeY = j === 0 || j === h - 1;
      let ch = " ";
      if (edgeX && edgeY) ch = ["╭", "╮", "╰", "╯"][(i ? 1 : 0) + (j ? 2 : 0)];
      else if (edgeY) ch = "─"; else if (edgeX) ch = "│";
      else ch = sg.v ? sg.s[j - 1] : (sg.s[i - 2] || " ");
      cells.push([sg.x + i, sg.y + j, ch, edgeX || edgeY]);
    }
    return { id, cells, x0: sg.x, y0: sg.y, w, h };
  });
  const drops = Array.from({ length: 170 }, () => [r() * cols, r() * rows, 22 + r() * 14, r() < 0.3 ? 1 : 0]);
  const splash = Array.from({ length: 40 }, () => [Math.floor(r() * cols), H + 1 + Math.floor(r() * (rows - H - 1)), r()]);
  const litK = new Array(cols * H), litC = new Array(cols * H);
  const signMask = new Uint8Array(cols * rows);
  for (const sc of signCells) for (const [x, y] of sc.cells) if (x >= 0 && x < cols && y >= 0 && y < rows) signMask[x + y * cols] = 1;
  const onSign = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y); return xi >= 0 && xi < cols && yi >= 0 && yi < rows && signMask[xi + yi * cols]; };

  return (t) => {
    g.clear();
    const tick = Math.floor(t * 6);
    // upper city
    for (let y = 0; y < H; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols, k = kind[i];
      litK[i] = null;
      if (k === 0) {
        const v = clamp(y / H + (fbm(x * 0.04 + t * 0.05, y * 0.2, 3, 2) - 0.5) * 0.5);
        g.set(x, y, v > 0.55 ? "▒" : "░", SKY(v));
      } else if (k === 1) g.set(x, y, "▓", BACK((x * 7 + y) % 5 === 0 ? 1 : 0));
      else if (k === 2) g.set(x, y, "█", FRONT(0));
      else {
        const s = sub[i], on = hash(s, Math.floor(t * 0.4 + s * 0.01)) > 0.45;
        const c = on ? (s % 4 === 0 ? 2 : 1) : 0;
        g.set(x, y, on ? "█" : "▪", WIN(c / 2 + 0.01));
        if (on) { litK[i] = WIN(c / 2 + 0.01); litC[i] = "░"; }
      }
    }
    // neon signs with glow and the odd flicker
    for (const sc of signCells) {
      const sg = signs[sc.id];
      const flick = hash(sc.id + 7, tick) < 0.06 ? 0 : 1;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + sc.id);
      const col = NEON[sg.c];
      for (let j = -2; j < sc.h + 2; j++) for (let i = -3; i < sc.w + 3; i++) {
        const x = sc.x0 + i, y = sc.y0 + j;
        if (x < 0 || x >= cols || y < 0 || y >= H) continue;
        if (flick && (i < 0 || j < 0 || i >= sc.w || j >= sc.h)) { g.set(x, y, "▒", col(0)); litK[x + y * cols] = col(0); litC[x + y * cols] = "░"; }
      }
      for (const [x, y, ch, edge] of sc.cells) {
        if (x >= cols || y >= H) continue;
        const key = flick ? col(edge ? 0.5 + pulse * 0.25 : 0.99) : col(0);
        g.set(x, y, ch === " " ? "█" : ch, ch === " " ? col(0) : key);
        if (ch === " ") continue;
        litK[x + y * cols] = flick ? col(0.6) : col(0); litC[x + y * cols] = "▒";
      }
    }
    // curb
    for (let x = 0; x < cols; x++) g.set(x, H, x % 6 === 0 ? "┴" : "─", CURB(1));
    // wet street mirrors the lights above
    for (let y = H + 1; y < rows; y++) {
      const d = (y - H) / (rows - H);
      for (let x = 0; x < cols; x++) {
        const wob = Math.round(Math.sin(y * 1.9 + t * 4 + x * 0.15) * (0.5 + d * 1.5));
        const sy = 2 * H - y + Math.floor(d * 2), sx = x + wob;
        const n = noise2(x * 0.15, y * 0.9 + t * 2, 4);
        let key = null;
        if (sy >= 0 && sy < H && sx >= 0 && sx < cols) key = litK[sx + sy * cols];
        if (key && n > 0.25) g.set(x, y, n > 0.6 ? litC[sx + sy * cols] === "▒" ? "▓" : "▒" : "░", key);
        else {
          const v = clamp(0.2 + d * 0.5 + (n - 0.5) * 0.6);
          g.set(x, y, v > 0.5 ? "▓" : "▒", STREET(v));
        }
      }
    }
    // rain
    for (const [x0, y0, sp, b] of drops) {
      const y = ((y0 + t * sp) % (rows + 4)) - 2;
      const x = ((x0 + y * 0.35) % cols + cols) % cols;
      if (onSign(x, y)) continue;
      g.set(x, y, "/", RAIN(b));
      if (b && !onSign(x - 0.35, y - 1)) g.set(x - 0.35, y - 1, "/", RAIN(0));
    }
    for (const [x, y, p] of splash) {
      const f = (t * 1.3 + p) % 1;
      if (f < 0.25) g.set(x, y, f < 0.12 ? "°" : "·", RAIN(1));
    }
    return g.frame();
  };
}
