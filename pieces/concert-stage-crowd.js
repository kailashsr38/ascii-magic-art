/* concert-stage-crowd: a band on a lit stage, moving head beams sweeping through haze over a jumping crowd. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const HAZE = add(gradient(["#05040a", "#0c0a18", "#161228", "#221a3a"], 4));
const BEAM = add([
  "#3a1a5a", "#7a3ab8", "#c88aff", // violet
  "#0e3a5a", "#2a8ad8", "#9ad8ff", // blue
  "#5a1a2a", "#d83a6a", "#ffa0c0", // pink
  "#4a3a0e", "#d8a02a", "#fff0a0", // amber
]);
const MET = add(["#3a3e48", "#6a707e", "#a8b0bc"]);
const SIL = add(["#000000", "#0c0814", "#1c1430"]);
const GLOW = add(gradient(["#2a1848", "#4e2a78", "#8a3a9a", "#d05aa8"], 4));
const STG = add(gradient(["#140e18", "#241a2a", "#3a2a40"], 3));
const LED = add(["#ff3a6a", "#ffb03a", "#3ad8ff", "#7aff6a", "#c85aff"]);
const UI = add(["#ffffff", "#e6edf3", "#ffd84a"]);

export const meta = {
  slug: "concert-stage-crowd",
  name: "Concert Stage Crowd",
  category: "music",
  note: "A band plays on a hazy stage as moving head beams sweep and change colour, the screen behind pulses and the crowd jumps with hands in the air.",
  tags: ["concert", "stage", "crowd", "live music", "lights", "hero"],
  cols: 110, rows: 36, fps: 30,
  palette: palette(P),
};

const FIX = [14, 30, 46, 64, 80, 96];
const BPM = 128;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(11);
  const crowd = [];
  for (let row = 0; row < 3; row++) for (let x = -2 + row * 3; x < cols + 4; x += 7 + Math.floor(R() * 4)) {
    crowd.push({ x: x + R() * 2, row, ph: R(), hands: R() < 0.35 ? 2 : R() < 0.5 ? 1 : 0, phone: R() < 0.08, h: R() });
  }
  crowd.sort((a, b) => a.row - b.row);
  const fig = (cx, base, h, arms, rim, bob) => {
    const top = base - h + bob;
    for (let y = top; y < top + 2; y++) for (let x = cx - 1; x <= cx + 1; x++) g.set(x, y, "█", KEYS[SIL]);
    g.set(cx - 1, top, "▄", KEYS[SIL]); g.set(cx + 1, top, "▄", KEYS[SIL]);
    g.set(cx, top, "▄", rim);
    for (let y = top + 2; y < base - Math.floor(h * 0.4); y++) for (let x = cx - 2; x <= cx + 2; x++) g.set(x, y, "█", KEYS[SIL]);
    for (let y = base - Math.floor(h * 0.4); y <= base; y++) { g.set(cx - 1, y, "█", KEYS[SIL]); g.set(cx + 1, y, "█", KEYS[SIL]); }
    for (const [ax, ay] of arms) g.line(cx + Math.sign(ax) * 2, top + 3, cx + ax, top + ay, "█", KEYS[SIL]);
    g.set(cx - 2, top + 2, "▄", rim); g.set(cx + 2, top + 2, "▄", rim);
  };
  return (t) => {
    const beat = (t * BPM) / 60, ph = beat % 1, bar = Math.floor(beat / 4);
    const kick = Math.exp(-ph * 5);
    // haze
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.25 + (fbm(x * 0.05 + t * 0.15, y * 0.12, 3, 4) - 0.5) * 0.7 + (y > 8 && y < 24 ? 0.12 : 0));
      g.set(x, y, v > 0.45 ? "▒" : "░", KEYS[HAZE + Math.min(3, Math.floor(v * 4))]);
    }
    // LED screen
    g.fill(26, 4, 59, 17, "█", KEYS[SIL]);
    for (let y = 5; y <= 19; y++) for (let x = 27; x <= 83; x++) {
      const b = Math.floor((x - 27) / 3);
      const lv = clamp(0.3 + kick * (1 - Math.abs(b - 9) / 10) * 0.6 + noise2(b * 0.7, t * 3) * 0.4);
      const on = 19 - y < lv * 15 && (x - 27) % 3 !== 2;
      const gl = clamp(0.9 - Math.abs(x - 55) / 40 - (19 - y) * 0.03 + kick * 0.15);
      g.set(x, y, on ? "▄" : "▒", on ? KEYS[LED + (bar + b) % 5] : KEYS[GLOW + Math.min(3, Math.floor(gl * 4))]);
    }
    // beams
    const pal = (bar % 4) * 3;
    FIX.forEach((fx, i) => {
      const ang = Math.sin(t * 0.9 + i * 1.3) * 0.55 + (i < 3 ? 0.15 : -0.15);
      const dx = Math.sin(ang), dy = Math.cos(ang);
      const col = BEAM + ((pal + (i % 2) * 3) % 12);
      for (let y = 3; y < rows; y++) for (let x = Math.max(0, fx - 30); x < Math.min(cols, fx + 30); x++) {
        const vx = (x - fx) * 0.5, vy = y - 2;
        const along = vx * dx + vy * dy;
        if (along <= 0) continue;
        const perp = Math.abs(vx * dy - vy * dx);
        const w = 0.6 + along * 0.13;
        if (perp > w) continue;
        const k = (1 - perp / w) * (1 - along / 50);
        if (k < 0.08) continue;
        const cur = g.get(x, y);
        if (y <= 20 && x >= 26 && x <= 84) continue;
        g.set(x, y, k > 0.55 ? "▓" : k > 0.3 ? "▒" : "░", KEYS[col + (k > 0.55 ? 2 : k > 0.25 ? 1 : 0)]);
      }
    });
    // truss and fixtures
    for (let x = 0; x < cols; x++) { g.set(x, 0, "═", KEYS[MET + 1]); g.set(x, 1, x % 2 ? "╱" : "╲", KEYS[MET]); g.set(x, 2, "═", KEYS[MET + 1]); }
    FIX.forEach((fx) => { g.text(fx - 1, 2, "▄█▄", KEYS[MET + 2]); g.set(fx, 3, "▼", KEYS[UI]); });
    // speaker stacks
    for (const sx of [1, 99]) for (let y = 8; y <= 23; y++) for (let x = sx; x < sx + 10; x++) {
      const cell = (y - 8) % 4, edge = cell === 3 || x === sx || x === sx + 9;
      const cone = !edge && Math.hypot((x - sx - 4.5) / 2, cell - 1.2) < 1.3;
      g.set(x, y, edge ? "▀" : cone ? (kick > 0.5 && y > 15 ? "●" : "○") : "█", edge ? KEYS[MET] : KEYS[SIL + (cone ? 2 : 1)]);
    }
    // stage
    for (let y = 22; y <= 24; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === 22 ? "▀" : "█", KEYS[STG + (y === 22 ? 2 : 24 - y)]);
    // drum riser and kit
    g.fill(46, 19, 18, 3, "█", KEYS[STG + 1]);
    const rim = KEYS[BEAM + pal + 2];
    fig(55, 18, 7, [[-5, 1 + (ph < 0.5 ? -2 : 1)], [5, 1 + (ph >= 0.5 ? -2 : 1)]], rim, 0);
    for (let x = 50; x <= 60; x++) g.set(x, 17, x % 5 === 0 ? "█" : "▄", KEYS[MET + (kick > 0.6 ? 2 : 1)]);
    g.text(48, 15, "▄▄", KEYS[MET + 2]); g.text(61, 14, "▄▄▄", KEYS[MET + 2]);
    // singer, guitar, bass
    const bob = ph < 0.5 ? 0 : 1;
    fig(55, 21, 12, [[-3, 1], [2, -2]], rim, bob);
    g.vline(57, 11, 21, "│", KEYS[MET + 1]); g.set(57, 10, "●", KEYS[MET + 2]);
    fig(36, 21, 12, [[4, 4 + (Math.floor(beat * 2) % 2)], [-3, 4]], rim, (Math.floor(beat) % 2));
    g.line(32, 18, 40, 15, "█", KEYS[LED]);
    fig(75, 21, 12, [[-4, 4 + (Math.floor(beat * 2 + 1) % 2)], [3, 4]], rim, ((Math.floor(beat) + 1) % 2));
    g.line(70, 15, 79, 18, "█", KEYS[LED + 2]);
    // wash of light over the crowd
    for (let y = 25; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.75 - (y - 25) * 0.03 + (fbm(x * 0.08 + t * 0.2, y * 0.3, 2, 8) - 0.5) * 0.5 + kick * 0.1);
      g.set(x, y, v > 0.55 ? "▓" : "▒", KEYS[GLOW + Math.min(3, Math.floor(v * 4))]);
    }
    // crowd silhouettes, back row first
    crowd.forEach((p) => {
      const jump = Math.max(0, Math.sin((beat + p.ph * 0.35) * Math.PI * 2)) > 0.6 ? 1 : 0;
      const top = 26 + p.row * 3 - jump + (p.h > 0.6 ? 1 : 0);
      const x = Math.round(p.x);
      const body = KEYS[SIL + (p.row === 0 ? 2 : p.row === 1 ? 1 : 0)];
      g.set(x - 1, top, "▄", body); g.set(x, top, "█", body); g.set(x + 1, top, "▄", body);
      g.text(x - 1, top + 1, "███", body);
      g.set(x - 3, top + 2, "▄", body); g.set(x + 3, top + 2, "▄", body);
      for (let y = top + 2; y < rows; y++) for (let k = -3; k <= 3; k++) if (y > top + 2 || Math.abs(k) < 3) g.set(x + k, y, "█", body);
      if (p.hands) {
        const up = jump ? 1 : 0;
        g.line(x - 3, top + 2, x - 4, top - 2 - up, "█", body);
        if (p.hands === 2) g.line(x + 3, top + 2, x + 4, top - 2 - up, "█", body);
        if (p.phone) g.set(x + 4, top - 3 - up, "■", KEYS[UI]);
      }
    });
    return g.frame();
  };
}
