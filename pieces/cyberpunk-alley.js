/* cyberpunk-alley: a rainy night alley in one-point perspective, neon signs glowing over wet ground. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const WALL = grp(gradient(["#140f2a", "#2c2352", "#4c3f80", "#7a6cb0", "#a898d8"], 9));
const SKY = grp(gradient(["#1a1240", "#3e2878", "#7a4ab0"], 4));
const END = grp(gradient(["#8a3a8a", "#e05a9a", "#ff9ab0", "#ffd6b8", "#fff4e8"], 7));
const FLOOR = grp(gradient(["#0c0c20", "#1c1a3a", "#302c5c", "#4a4480"], 5));
const WIN = grp(["#ffb050", "#ffe2a0"]);
const PINK = grp(gradient(["#4a1040", "#b0207a", "#ff3aa0", "#ffb0dc"], 6));
const CYAN = grp(gradient(["#0a3048", "#1a8ab0", "#3ae6ff", "#c0faff"], 6));
const AMBER = grp(gradient(["#4a2a08", "#b06a10", "#ffb020", "#ffe8a0"], 6));
const GREEN = grp(gradient(["#0a3a1a", "#18a050", "#4aff8a", "#c8ffd8"], 6));
const RAIN = grp(["#7a8ac0", "#cad8ff"]);
const STEAM = grp(gradient(["#5a5a80", "#a8a8c8", "#e8e8f8"], 4));
const DARK = grp(["#06050e", "#1a1830"]);

// colours that glow and so show up in the wet ground
const EMIT = new Map();   // glowing key -> the dimmer key its reflection uses
for (const f of [WIN, END]) for (let v = 0; v <= 1; v += 0.02) EMIT.set(f(v), f(v * 0.55));
for (const f of [PINK, CYAN, AMBER, GREEN]) for (let v = 0.34; v <= 1; v += 0.02) EMIT.set(f(v), f(v * 0.8));

export const meta = {
  slug: "cyberpunk-alley",
  name: "Neon Alley",
  category: "landscapes",
  note: "A rainy night alley runs toward a glowing street, its neon signs buzzing and pooling in the wet ground.",
  tags: ["cyberpunk", "neon", "city", "rain", "night", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(P),
};

// 3x5 block letters for the big signs
const F = {
  R: "███│█ █│██ │█ █│█ █", A: "███│█ █│███│█ █│█ █", M: "█   █│██ ██│█ █ █│█   █│█   █",
  E: "███│█  │██ │█  │███", N: "█  █│██ █│█ ██│█  █│█  █", B: "██ │█ █│███│█ █│███",
  H: "█ █│█ █│███│█ █│█ █", O: "███│█ █│█ █│█ █│███", T: "███│ █ │ █ │ █ │ █ ",
  L: "█  │█  │█  │█  │███", "2": "███│  █│███│█  │███", "4": "█ █│█ █│███│  █│  █",
};
const hash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const VX = 50, VY = 14, FX = 22, FY = 11;       // vanishing point and focal lengths
const HW = 3.2, CAM = 1.5, TOP = 4.5, ZEND = 9;   // alley half width, eye height, roof, far end

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  // static raycast: what each cell sees
  const kind = new Uint8Array(N), hz = new Float32Array(N), hy = new Float32Array(N), side = new Int8Array(N);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = x + y * cols;
    const dx = (x + 0.5 - VX) / FX, dy = -(y + 0.5 - VY) / FY;
    const tw = dx !== 0 ? HW / Math.abs(dx) : 1e9, tf = dy < 0 ? CAM / -dy : 1e9;
    const t = Math.min(tw, tf, ZEND);
    const Y = dy * t;
    hz[i] = t; hy[i] = Y; side[i] = dx < 0 ? -1 : 1;
    if (t === tf) kind[i] = 1;                    // floor
    else if (Y > TOP) kind[i] = 4;                // sky
    else if (t === tw) kind[i] = 2;               // wall
    else kind[i] = 3;                             // lit far street
  }
  // mirror rays: which screen cell each floor cell reflects
  const src = new Int16Array(N).fill(-1);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = x + y * cols;
    if (kind[i] !== 1) continue;
    const dx = (x + 0.5 - VX) / FX;
    const tm = Math.min(dx !== 0 ? HW / Math.abs(dx) : 1e9, ZEND);
    const sy = Math.floor(2 * VY - y - 0.5 + (2 * CAM * FY) / tm);
    src[i] = sy >= 0 && sy < rows && kind[x + sy * cols] !== 1 ? sy : -1;
  }
  const floorTop = (x) => Math.ceil(VY + (CAM * Math.abs(x + 0.5 - VX) / FX) * FY / HW);

  // signs: screen boxes, colour ramp, text, big font or plain
  const signs = [
    { x: 1, y: 3, w: 26, h: 9, col: PINK, text: "RAMEN", big: true },
    { x: 81, y: 4, w: 15, h: 9, col: CYAN, text: "BAR", big: true, flick: true },
    { x: 30, y: 4, w: 5, h: 9, col: AMBER, text: "HOTEL", vert: true },
    { x: 62, y: 7, w: 7, h: 3, col: GREEN, text: "24H" },
    { x: 36, y: 10, w: 6, h: 3, col: PINK, text: "OPEN" },
  ];
  for (const s of signs) { s.cx = s.x + s.w / 2; s.cy = s.y + s.h / 2; s.ft = floorTop(s.cx) + 1; }

  const mask = new Uint8Array(N + cols * 4);
  for (const s of signs) for (let yy = s.y; yy < s.y + s.h; yy++) for (let xx = s.x; xx < s.x + s.w; xx++) mask[xx + yy * cols] = 1;
  const r = rng(77);
  const drops = Array.from({ length: 120 }, () => ({ x: r() * (cols + 12), y: r() * rows, sp: 22 + r() * 14, near: r() < 0.3 }));
  const puddle = new Float32Array(N);
  for (let i = 0; i < N; i++) puddle[i] = fbm((i % cols) * 0.06, Math.floor(i / cols) * 0.35, 3, 9);

  return (t) => {
    g.clear();
    // flicker for the BAR sign: mostly on, with a stuttering burst every few seconds
    const ph = (t / 4.4) % 1;
    const barOn = ph > 0.72 && ph < 0.86 ? hash(Math.floor(t * 14), 3) > 0.55 : hash(Math.floor(t * 9), 5) > 0.04;
    signs[1].on = barOn;
    for (const s of signs) if (!s.flick) s.on = true;

    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols, k = kind[i], z = hz[i], Y = hy[i];
      // light spill from signs
      let spill = 0, sc = null;
      for (const s of signs) {
        if (!s.on) continue;
        const ddx = Math.max(0, Math.abs(x - s.cx) - s.w / 2) * 0.5, ddy = Math.max(0, Math.abs(y - s.cy) - s.h / 2);
        const v = Math.exp(-(ddx + ddy) / 2.2);
        if (v > spill) { spill = v; sc = s.col; }
      }
      if (k === 4) {
        const v = clamp(0.35 + (y / VY) * 0.5 + (fbm(x * 0.1 + t * 0.05, y * 0.3, 2, 4) - 0.5) * 0.4);
        g.set(x, y, v > 0.6 ? "▓" : "▒", SKY(v));
      } else if (k === 3) {
        // the bright cross street at the end, with a lone figure walking
        const d = Math.abs(x + 0.5 - VX) / 9;
        if (y < VY - 2) {
          // the building across the street, with small lit windows
          const w = (x % 3 === 1) && (y % 2 === 0) && hash(x, y) > 0.35;
          g.set(x, y, w ? "▪" : "▓", w ? WIN(1) : WALL(0.62 + (y - (VY - 6)) * 0.06));
        } else {
          const v = clamp(1 - d * 0.45 - (VY - y) * 0.08 + (fbm(x * 0.3, y * 0.5 + t * 0.3, 2, 2) - 0.5) * 0.2);
          g.set(x, y, y === VY + 1 ? "▀" : v > 0.6 ? "█" : "▓", END(v));
        }
      } else if (k === 2) {
        const zr = z, s = side[i];
        const endLit = Math.exp(-(ZEND - zr) / 2.2);
        let v = 0.5 + endLit * 0.3 - (zr < 2.5 ? (2.5 - zr) * 0.12 : 0);
        let ch = "▓";
        // storefronts at street level, windows above, storey ledges between
        const col = Math.floor(zr / 1.6), zf = zr % 1.6;
        const Yf = (Y + CAM) % 2;
        const store = zr > 2.4 && Y < -0.1 && Y > -1.2 && zf > 0.25 && zf < 1.35;
        const win = zr > 2.2 && Y > 0.7 && zf > 0.55 && zf < 1.1 && Yf > 0.75 && Yf < 1.5;
        if (Math.abs(Y + CAM) < 0.05 * zr || Math.abs(Y - TOP) < 0.06 * zr) { g.set(x, y, "▄", WALL(0.95)); continue; }
        if (store) {
          const on = hash(col, s + 7) > 0.3;
          g.set(x, y, on ? "█" : "▓", on ? WIN(hash(col, s) > 0.5 ? 1 : 0) : WALL(0.1));
          continue;
        }
        if (win) {
          const lit = hash(col * 13 + Math.floor((Y + CAM) / 2), s + 3) > 0.45;
          if (lit) { g.set(x, y, "█", WIN(hash(col, Math.floor(Y)) > 0.5 ? 1 : 0)); continue; }
          v -= 0.3; ch = "█";
        } else if (Yf < 0.12 * Math.max(1, zr * 0.5)) { v += 0.25; ch = "▀"; }
        else if (zf < 0.06 * zr) { v -= 0.18; ch = "▌"; }
        if (spill > 0.45) g.set(x, y, ch, sc(0.1 + (spill - 0.45) * 0.9));
        else g.set(x, y, ch, WALL(v));
      }
    }

    // converging lines: wall base, storey ledges and roofline on both sides
    for (const sd of [-1, 1]) {
      for (const [Yl, c] of [[-CAM, 0.98], [0.5, 0.7], [2.5, 0.7], [TOP, 0.98]]) {
        const x0 = sd < 0 ? 0 : VX + 8, x1 = sd < 0 ? VX - 8 : cols - 1;
        for (let x = x0; x <= x1; x++) {
          const zz = HW * FX / Math.abs(x + 0.5 - VX);
          if (zz > ZEND) continue;
          const yy = Math.round(VY - (Yl / zz) * FY);
          if (yy < 0 || yy >= rows) continue;
          const kk = kind[x + yy * cols];
          if (kk === 2 || Yl === -CAM || Yl === TOP) g.set(x, yy, Yl === TOP ? "▀" : "▄", WALL(c));
        }
      }
    }

    // a figure crossing the lit street at the end
    const fx = Math.round(VX - 7 + ((t * 1.6) % 16));
    if (fx > VX - 7 && fx < VX + 7) {
      g.set(fx, VY - 3, "●", DARK(0)); g.set(fx, VY - 2, "█", DARK(0)); g.set(fx, VY - 1, "█", DARK(0));
      g.set(fx + ((Math.floor(t * 4) % 2) ? 0 : -1), VY, "▌", DARK(0)); g.set(fx + ((Math.floor(t * 4) % 2) ? 1 : 0), VY, "▐", DARK(0));
    }

    // sagging cables across the alley
    for (let c = 0; c < 2; c++) {
      const yy = 1 + c * 3;
      for (let x = 22 + c * 6; x <= 78 - c * 6; x++) {
        const u = (x - 50) / (28 - c * 6);
        g.set(x, Math.round(yy + (1 - u * u) * 2.2), "─", DARK(1));
      }
    }

    // signs
    for (const s of signs) {
      const on = s.on;
      const frame = s.col(on ? 0.75 : 0.2), fill = s.col(0), lit = s.col(on ? 0.98 : 0.25);
      g.fill(s.x, s.y, s.w, s.h, " ", fill);
      for (let yy = s.y; yy < s.y + s.h; yy++) for (let xx = s.x; xx < s.x + s.w; xx++) g.set(xx, yy, "▒", fill);
      g.box(s.x, s.y, s.w, s.h, "double", frame);
      if (s.big) {
        let cx = s.x + 2;
        for (const c of s.text) {
          const rws = F[c].split("│");
          rws.forEach((row, rr) => { for (let j = 0; j < row.length; j++) if (row[j] !== " ") g.set(cx + j, s.y + 2 + rr, "█", lit); });
          cx += rws[0].length + 1;
        }
      } else if (s.vert) {
        for (let j = 0; j < s.text.length; j++) { g.set(s.x + 1, s.y + 2 + j, "█", s.col(0.6)); g.set(s.x + 2, s.y + 2 + j, s.text[j], lit); g.set(s.x + 3, s.y + 2 + j, "█", s.col(0.6)); }
        g.set(s.x + 2, s.y + 1, "═", frame); g.set(s.x + 2, s.y + 7, "═", frame);
      } else {
        g.text(s.x + Math.floor((s.w - s.text.length) / 2), s.y + 1, s.text, lit);
      }
      // bracket to the wall
      const wx = s.x < VX ? s.x - 1 : s.x + s.w;
      g.set(wx, s.y + 1, "═", DARK(1));
    }

    // wet ground: every floor cell mirrors what stands above it, rippled by the rain
    for (let y = VY; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      if (kind[i] !== 1) continue;
      const pd = puddle[i] > 0.5;
      const rip = Math.round(Math.sin(y * 2.1 + t * 5 + x * 0.15) * (pd ? 1 : 1.6));
      const sy = src[i], sx = clamp(x + rip, 0, cols - 1);
      if (sy < 0) { g.set(x, y, "▒", FLOOR(0.3)); continue; }
      const j = sx + sy * cols;
      const c = g.co[j], c0 = g.ch[j];
      const near = (y - VY) / (rows - VY);
      if (EMIT.has(c) && c0 !== "░" && c0 !== "▒" && c0 !== "/") {
        const solid = c0 === "█" || c0 === "▓";
        g.set(x, y, pd ? (solid ? "▓" : "▒") : (solid ? "▒" : "░"), EMIT.get(c));
      } else {
        const line = !pd && Math.floor(hz[i] * 2.2) % 2 === 0;
        g.set(x, y, pd ? "▓" : line ? "▒" : "▓", FLOOR(clamp(0.15 + near * 0.3 + (pd ? 0.15 : 0))));
      }
    }

    // steam rising from a grate on the right
    const gx = 70, gy = 29;
    for (let y = 12; y < gy; y++) {
      const up = gy - y;
      const cx = gx + up * 0.35 + Math.sin(t * 0.9 + up * 0.25) * 1.5;
      const wdt = 1.5 + up * 0.45;
      for (let x = Math.floor(cx - wdt * 2); x <= cx + wdt * 2; x++) {
        const d = Math.abs(x - cx) / (wdt * 2);
        if (d > 1) continue;
        const n = fbm(x * 0.18, y * 0.35 + t * 1.2, 3, 21);
        const v = (1 - d) * (n + 0.4) * clamp(1.5 - up / 15);
        if (v > 0.3 && !mask[x + y * cols]) g.set(x, y, v > 0.6 ? "▓" : v > 0.45 ? "▒" : "░", STEAM(v));
      }
    }
    g.text(gx - 3, gy, "▄▀▄▀▄▀▄", DARK(1));

    // rain, with splashes on the ground
    for (const d of drops) {
      const y = (d.y + t * d.sp) % (rows + 3) - 2;
      const x = Math.round((d.x - y * 0.25) % (cols + 12)) - 4;
      const yi = Math.floor(y);
      if (!mask[x + yi * cols]) g.set(x, yi, "/", RAIN(d.near ? 1 : 0));
      if (d.near && !mask[x + 1 + (yi - 1) * cols]) g.set(x + 1, yi - 1, "/", RAIN(0));
    }
    for (let j = 0; j < 14; j++) {
      const cyc = Math.floor(t * 6 + j * 0.37);
      const sx = Math.floor(hash(cyc, j) * cols), sy = 20 + Math.floor(hash(cyc, j + 50) * (rows - 20));
      if (kind[sx + sy * cols] === 1) g.set(sx, sy, hash(cyc, j + 9) > 0.5 ? "o" : "°", RAIN(1));
    }
    return g.frame();
  };
}
