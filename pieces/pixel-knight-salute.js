/* pixel-knight-salute: a small armoured knight in front of a castle wall raises its sword in a proud salute, plume bobbing. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#1a2a5a", "#2a4280", "#3e5c9e", "#5a7cba", "#86a4d4"], 6));
const STONE = add(gradient(["#2a2a36", "#3a3a48", "#4c4c5c", "#606072", "#767688"], 6));
const MORTAR = add(["#18181e"]);
const GRASS = add(["#1e4a1e", "#2a6a26", "#3a8a30"]);
const STEEL = add(gradient(["#3a4252", "#5a6474", "#7e8898", "#a4aebe", "#cad2de", "#eef2f8"], 12));
const DARK = add(["#0a0c12", "#1a1e28"]);
const GLOW = add(["#6ae0ff", "#d0f8ff"]);
const PLUME = add(["#a01a2a", "#d0283a", "#ff4a5a"]);
const TABARD = add(["#1a3a8a", "#2a52b0", "#3a6ad0"]);
const GOLD = add(["#b8861a", "#e8b030", "#ffe07a"]);
const BANNER = add(["#a01a2a", "#d0283a", "#ffe07a"]);
const LEATHER = add(["#3a2412", "#5a3a1e"]);

export const meta = {
  slug: "pixel-knight-salute",
  name: "Saluting Pixel Knight",
  category: "mascots",
  note: "A small armoured knight stands before a castle wall with its shield, then raises its sword in a proud salute while its red plume bobs and banners wave.",
  tags: ["knight", "mascot", "pixel", "game", "fantasy", "404"],
  cols: 56, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const steel = (u, v) => KEYS[STEEL + Math.min(11, Math.max(0, Math.floor(clamp(0.7 - u * 0.35 - v * 0.2) * 12)))];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 27) { bg.push([noise2(x * 0.6, y, 2) > 0.6 ? "▓" : "█", KEYS[GRASS + (y === 27 ? 2 : 1)]]); continue; }
    const crenel = y < 8 && (y < 5 || Math.floor(x / 5) % 2 === 1);
    if (y < 5 || (y < 8 && Math.floor(x / 5) % 2 === 0)) { bg.push(["█", KEYS[SKY + Math.min(5, Math.floor(y / 1.6))]]); continue; }
    const row = Math.floor((y - 5) / 2), off = row % 2 ? 3 : 0;
    const mortar = (y - 5) % 2 === 1 || (x + off) % 6 === 0;
    const v = clamp(0.45 + (noise2(Math.floor((x + off) / 6), row, 3) - 0.5) * 0.5 + (fbm(x * 0.2, y * 0.3, 2, 1) - 0.5) * 0.3 - (y > 20 ? 0.1 : 0));
    bg.push(mortar ? ["▒", KEYS[MORTAR]] : [crenel ? "█" : "█", KEYS[STONE + Math.min(5, Math.floor(v * 6))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // banners hanging on the wall, rippling
    for (const bx of [5, 47]) for (let y = 9; y < 20; y++) {
      const sw = Math.round(Math.sin(t * 2.5 - y * 0.5 + bx) * 0.6 * ((y - 9) / 10));
      for (let k = 0; k < 5; k++) {
        const tail = y >= 18 && (k === 2 || (y === 19 && k !== 0 && k !== 4));
        if (y === 19 && k === 2) continue;
        if (y === 19 && (k === 1 || k === 3)) continue;
        g.set(bx + k + sw, y, "█", KEYS[BANNER + (tail ? 0 : k === 0 ? 0 : 1)]);
      }
      if (y === 12) g.set(bx + 2 + sw, y, "♥", KEYS[BANNER + 2]);
    }
    const p = t % 7;
    const sal = p < 2 ? 0 : p < 2.6 ? smooth((p - 2) / 0.6) : p < 5 ? 1 : p < 5.6 ? 1 - smooth((p - 5) / 0.6) : 0;
    const cx = 28, bob = Math.round(Math.sin(t * 2) * 0.4);
    // shadow
    ell(g, cx, 27.4, 12, 0.8, (x, y) => g.set(x, y, "▀", KEYS[GRASS]));
    // legs
    for (const lx of [cx - 4, cx + 1]) {
      for (let y = 22; y < 26; y++) g.text(lx, y, "███", KEYS[STEEL + 4 + (lx > cx ? 2 : 0) - (y % 2)]);
      g.text(lx - (lx < cx ? 1 : 0), 26, "▄███▄".slice(0, 4), KEYS[STEEL + 3]);
    }
    // torso and tabard
    const ty = 14 + bob;
    for (let y = ty; y <= 22; y++) for (let x = cx - 6; x <= cx + 6; x++) {
      const u = (x - cx) / 6, v = (y - ty) / 8;
      g.set(x, y, "█", steel(u, v));
    }
    for (let y = ty + 1; y <= 23; y++) for (let x = cx - 3; x <= cx + 3; x++) g.set(x, y, "█", KEYS[TABARD + (x < cx ? 2 : x === cx ? 1 : 0)]);
    g.text(cx - 1, ty + 2, "▄█▄", KEYS[GOLD + 1]); g.text(cx - 2, ty + 3, "▀▀█▀▀", KEYS[GOLD + 1]); g.set(cx, ty + 4, "█", KEYS[GOLD + 1]);
    for (let x = cx - 6; x <= cx + 6; x++) g.set(x, 20, "▄", KEYS[LEATHER + 1]);
    g.set(cx, 20, "■", KEYS[GOLD + 2]);
    // pauldrons
    ell(g, cx - 7, ty + 1, 3, 1.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[STEEL + (dy < 0 ? 9 : 6)]));
    ell(g, cx + 7, ty + 1, 3, 1.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[STEEL + (dy < 0 ? 7 : 4)]));
    // shield on the left arm
    for (let y = ty; y <= ty + 9; y++) {
      const v = (y - ty) / 9;
      const hw = v < 0.55 ? 5 : 5 * Math.sqrt(Math.max(0, 1 - ((v - 0.55) / 0.45) ** 2));
      for (let x = Math.floor(cx - 11 - hw); x <= cx - 11 + hw; x++) {
        const edge = Math.abs(x + 0.5 - (cx - 11)) > hw - 1 || y === ty;
        g.set(x, y, "█", edge ? KEYS[GOLD + (x < cx - 11 ? 2 : 0)] : KEYS[TABARD + (x < cx - 11 ? 2 : 1)]);
      }
    }
    g.text(cx - 13, ty + 3, "▄▀▄", KEYS[GOLD + 2]); g.text(cx - 14, ty + 4, "▀   ▀", KEYS[GOLD + 2]); g.set(cx - 12, ty + 5, "█", KEYS[GOLD + 1]);
    // helmet
    const hy = 5 + bob;
    for (let y = hy; y <= hy + 8; y++) for (let x = cx - 6; x <= cx + 6; x++) {
      const u = (x - cx) / 6, v = (y - hy) / 8;
      if (y === hy && Math.abs(u) > 0.6) continue;
      g.set(x, y, "█", steel(u, v));
    }
    // visor slit with glowing eyes
    for (let x = cx - 5; x <= cx + 5; x++) g.set(x, hy + 4, "█", KEYS[DARK]);
    for (let y = hy + 5; y <= hy + 7; y++) for (let x = cx - 1; x <= cx + 1; x += 2) g.set(x, y, "▪", KEYS[DARK + 1]);
    const blink = Math.abs((t % 3.8) - 1.4) < 0.1;
    if (!blink) for (const ex of [cx - 3, cx + 2]) g.text(ex, hy + 4, sal > 0.6 ? "▀▀" : "██", KEYS[GLOW + (sal > 0.6 ? 1 : 0)]);
    g.vline(cx, hy, hy + 3, "▐", KEYS[STEEL + 11]);
    // plume
    for (let k = 6; k >= 0; k--) {
      const sw = Math.sin(t * 3 - k * 0.6) * (k / 6) * 1.2;
      const x = cx - k * 1.6 + sw, y = hy - 1.5 - Math.sin((k / 6) * Math.PI * 0.9) * 2.5 + k * 0.5;
      ell(g, x, y, 2.2, 1.3, (xx, yy, dx, dy) => g.set(xx, yy, "█", KEYS[PLUME + (dy < 0 ? 2 : 1) - (k % 2)]));
    }
    // sword arm and sword
    const sh = [cx + 7, ty + 2];
    const hand = [cx + 9 - sal * 0.5, 21 + (ty + 3 - 21) * sal];
    g.line(sh[0], sh[1], hand[0], hand[1], "█", KEYS[STEEL + 5]);
    g.line(sh[0] + 1, sh[1], hand[0] + 1, hand[1], "█", KEYS[STEEL + 3]);
    const ang = (1 - sal) * 2.6 + sal * 0; // radians from straight up, clockwise
    const bl = 12 + sal * 8;
    const ux = Math.sin(ang), uy = -Math.cos(ang);
    // crossguard
    for (let k = -2; k <= 2; k++) g.set(hand[0] - uy * k + ux * 1.2, hand[1] + ux * k * 0.5 + uy * 0.6, "█", KEYS[GOLD + 1]);
    for (let s = 1.5; s <= bl; s += 0.5) {
      const x = hand[0] + ux * s, y = hand[1] + uy * s * 0.5;
      g.set(x - 1, y, "▐", KEYS[DARK]);
      g.set(x, y, s > bl - 1 ? (sal > 0.5 ? "▲" : "█") : "█", KEYS[STEEL + (s > bl - 3 ? 11 : 9)]);
      if (s < bl - 1) g.set(x + 1, y, "▌", KEYS[STEEL + 6]);
    }
    g.set(hand[0] - ux * 1.2, hand[1] - uy * 0.6, "●", KEYS[GOLD + 2]);
    ell(g, hand[0], hand[1], 1.4, 0.9, (x, y) => g.set(x, y, "█", KEYS[STEEL + 6]));
    return g.frame();
  };
}
