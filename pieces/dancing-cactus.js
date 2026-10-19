/* dancing-cactus: a potted cactus with a pink flower sways its hips and swings its arms to a beat at desert sunset. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#2a1240", "#5a1e52", "#9a3456", "#d85a4a", "#f49a4a", "#fcd27a"], 12));
const SUN = add(["#ffd86a", "#fff2b0"]);
const DUNE = add(gradient(["#5a2a2a", "#7a3a2e", "#9a5034", "#b8683e"], 4));
const POT = add(gradient(["#6a2a14", "#9a4020", "#c45a2e", "#e47a44", "#f49a64"], 6));
const SOIL = add(["#2a1a10", "#3e2818"]);
const CACT = add(gradient(["#0e3a1a", "#185a24", "#24782c", "#38983a", "#5ab84a", "#94dc6a"], 10));
const RIB = add(["#0e3a1a", "#145020"]);
const SPINE = add(["#f4f0c8"]);
const FLOW = add(["#d83a7a", "#ff6aa4", "#ffb0d0", "#ffd84a"]);
const FACE = add(["#0a1a0a", "#ffffff", "#ff8aa8"]);

export const meta = {
  slug: "dancing-cactus",
  name: "Dancing Pot Cactus",
  category: "mascots",
  note: "A potted cactus with a pink flower on its head sways its hips and swings its arms to a beat against a desert sunset.",
  tags: ["cactus", "mascot", "dance", "plant", "desert", "404"],
  cols: 56, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const d1 = 21 + Math.sin(x * 0.12) * 1.5, d2 = 24 + Math.sin(x * 0.09 + 2) * 1.2;
    if (y >= d2) { bg.push([y - d2 < 1 ? "▄" : "█", KEYS[DUNE + (y - d2 < 1 ? 3 : 2)]]); continue; }
    if (y >= d1) { bg.push([y - d1 < 1 ? "▄" : "█", KEYS[DUNE + (y - d1 < 1 ? 1 : 0)]]); continue; }
    const sd = Math.hypot((x - 44) / 2, y - 16);
    if (sd < 4.5) { bg.push(["█", KEYS[SUN + (sd < 3 ? 1 : 0)]]); continue; }
    const v = clamp(y / 21 + (fbm(x * 0.05, y * 0.2, 3, 2) - 0.5) * 0.15 + Math.exp(-sd / 8) * 0.25);
    bg.push(["█", KEYS[SKY + Math.min(11, Math.floor(v * 12))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const beat = t * Math.PI * 1.5; // 0.75 Hz sway
    const sway = Math.sin(beat);
    const bounce = Math.abs(Math.cos(beat)) * 0.8;
    const cx = 24, baseY = 21, topY = 4 + bounce;
    const off = (y) => { const f = clamp((baseY - y) / (baseY - topY)); return sway * 3.2 * f * f; };
    // pot
    for (let y = 21; y < 29; y++) {
      const hw = y < 23 ? 10 : 9 - (y - 23) * 0.4;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const dx = (x + 0.5 - cx) / hw;
        const rim = y < 23;
        const lit = clamp(0.7 - dx * 0.4 + (rim ? 0.15 : 0) - (y - 21) * 0.03);
        g.set(x, y, rim && y === 21 ? "▄" : "█", KEYS[POT + Math.min(5, Math.floor(lit * 6))]);
      }
    }
    for (let x = cx - 8; x <= cx + 8; x++) g.set(x, 21, "▀", KEYS[SOIL + (x % 3 ? 0 : 1)]);
    g.text(cx - 4, 25, "▀▄▀▄▀▄▀▄▀", KEYS[POT + 1]);
    // arms behind the trunk edge: left and right swing opposite
    const arm = (side, phase) => {
      const ay = 13 + phase * 2.5;
      const sx = cx + off(ay) + side * 5;
      const len = 4;
      for (let k = 0; k <= len; k++) for (let w = -1; w <= 1; w++) g.set(sx + side * k, ay + w, "█", KEYS[CACT + 4 + (w < 0 ? 2 : w > 0 ? -2 : 0)]);
      const ux = sx + side * len, upTop = ay - 5 - phase * 1.5;
      for (let y = Math.floor(upTop); y <= ay + 1; y++) for (let w = -1; w <= 1; w++) {
        const x = ux + w + side * (ay - y) * 0.15 * phase;
        g.set(x, y, y === Math.floor(upTop) ? "▄" : "█", KEYS[CACT + 5 + w * 2]);
      }
      g.set(ux + side * 2, ay - 2, side < 0 ? "-" : "-", KEYS[SPINE]);
    };
    arm(-1, (sway + 1) / 2);
    arm(1, (1 - sway) / 2);
    // trunk
    for (let y = Math.floor(topY); y <= baseY; y++) {
      const o = off(y), u = (y - topY) / (baseY - topY);
      const hw = y < topY + 2 ? 5.5 * Math.sqrt(clamp((y + 1 - topY) / 2.5)) : 6.5;
      for (let x = Math.floor(cx + o - hw); x <= cx + o + hw; x++) {
        const dx = (x + 0.5 - cx - o) / hw;
        if (Math.abs(dx) > 1) continue;
        const rib = Math.abs(Math.sin((dx * 1.4) * Math.PI)) < 0.22 && Math.abs(dx) > 0.2;
        const lit = clamp(0.75 - dx * 0.45 - u * 0.2);
        g.set(x, y, rib ? "▓" : "█", rib ? KEYS[RIB + (lit > 0.5 ? 1 : 0)] : KEYS[CACT + Math.min(9, Math.floor(lit * 10))]);
      }
      if (y % 3 === 1 && y > topY + 2) { g.set(cx + o - hw - 1, y, "-", KEYS[SPINE]); g.set(cx + o + hw + 1, y, "-", KEYS[SPINE]); }
    }
    // face
    const fo = off(10);
    const happy = sway > 0.55 || sway < -0.55;
    for (const ex of [cx + fo - 2.8, cx + fo + 2.8]) {
      if (happy) g.text(Math.round(ex - 1), 9, "▄▀▄", KEYS[FACE]);
      else { g.text(Math.round(ex - 1), 9, "▄█▄", KEYS[FACE]); g.text(Math.round(ex - 1), 10, "▀█▀", KEYS[FACE]); g.set(Math.round(ex - 1), 9, "▄", KEYS[FACE + 1]); }
    }
    g.text(Math.round(cx + fo - 5.5), 11, "▄▄", KEYS[FACE + 2]); g.text(Math.round(cx + fo + 4.5), 11, "▄▄", KEYS[FACE + 2]);
    g.text(Math.round(cx + fo - 1.5), 12, "▀▄▄▀", KEYS[FACE]);
    // flower
    const fx = cx + off(topY), fy = topY - 1;
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]]) g.text(Math.round(fx + dx - 1), Math.round(fy + dy), "▄█", KEYS[FLOW + (dy < 0 ? 1 : 0)]);
    g.set(Math.round(fx), Math.round(fy), "●", KEYS[FLOW + 3]);
    // dance lines and a little bounce of sand
    const s = sway > 0 ? 1 : -1;
    if (Math.abs(sway) > 0.7) { g.text(cx + s * 13, 8, s > 0 ? ")" : "(", KEYS[SPINE]); g.text(cx + s * 15, 7, s > 0 ? ")" : "(", KEYS[SPINE]); }
    return g.frame();
  };
}
