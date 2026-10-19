/* neon-jukebox: an arched diner jukebox with bubbling neon tubes, a spinning record and a pulsing speaker. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const ROOM = add(gradient(["#140a20", "#221236", "#341a4e", "#4a2466"], 6));
const FLOOR = add(["#1a1020", "#2a1830", "#3a2240", "#ffffff"]);
const WOOD = add(gradient(["#3a1608", "#5a2a12", "#7e401e", "#a4582a"], 6));
const CHROME = add(gradient(["#3a3e48", "#6a707e", "#a8b0bc", "#e8eef4"], 6));
const NEON = add(["#ff3a8a", "#ff9a3a", "#ffe04a", "#3af0c0", "#3aa8ff"]);
const NEOND = add(["#8a1a4a", "#8a4a1a", "#8a7a1a", "#1a7a62", "#1a5a8a"]);
const BUB = add(["#ffffff", "#fff4d0"]);
const GLASS = add(gradient(["#1a0a24", "#2e1440", "#4a2060"], 4));
const DISC = add(["#0a0a0e", "#24242c", "#3a3a46", "#e84a4a", "#ffd23a"]);
const LIT = add(["#ffd23a", "#ff6a3a", "#5a4a2a", "#e6edf3"]);
const GRILL = add(["#2a1018", "#5a2a2a", "#ff6a5a", "#ffb07a"]);

export const meta = {
  slug: "neon-jukebox",
  name: "Neon Jukebox",
  category: "things",
  note: "An arched diner jukebox glows in a dark room, bubbles rising through its neon tubes while a record spins behind the glass and the speaker pulses.",
  tags: ["jukebox", "retro", "music", "diner", "neon", "hero"],
  cols: 64, rows: 36, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 32, AY = 15, R = 24;
  const halfW = (y) => (y < AY ? Math.sqrt(Math.max(0, R * R - ((AY - y) * 2) ** 2)) : R);
  // the neon tube path: an arch then two straight legs, parameter 0..1
  const tube = (u) => {
    const legs = 13, arcLen = Math.PI * 21, tot = legs * 2 + arcLen;
    let d = u * tot;
    if (d < legs) return [cx - 21, 29 - d];
    d -= legs;
    if (d < arcLen) { const a = Math.PI - d / 21; return [cx + Math.cos(a) * 21, AY - (Math.sin(a) * 21) / 2]; }
    d -= arcLen;
    return [cx + 21, AY + d];
  };
  return (t) => {
    g.clear();
    const beat = Math.max(0, Math.sin(t * TAU * 1.9)) ** 3;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y >= 32) { const refl = Math.abs(x - cx) < 20 && (x + y) % 2 === 0; g.set(x, y, refl ? "▒" : "█", KEYS[FLOOR + (refl ? 2 : y === 32 ? 1 : 0)]); continue; }
      const d = Math.hypot((x - cx) / 2, y - 16);
      const v = clamp(0.8 - d / 22 + (fbm(x * 0.1, y * 0.2, 2, 3) - 0.5) * 0.2);
      g.set(x, y, v > 0.5 ? "▓" : "▒", KEYS[ROOM + Math.min(5, Math.floor(v * 6))]);
    }
    // cabinet
    for (let y = 2; y < 32; y++) {
      const w = halfW(y);
      for (let x = Math.ceil(cx - w); x <= Math.floor(cx + w); x++) {
        const dx = Math.abs(x - cx), edge = w - dx;
        let ch = "█", co = KEYS[WOOD + Math.min(5, Math.floor(clamp(0.7 - (x - cx) / w * 0.3 - y / 80) * 6))];
        if (edge < 1.2) { co = KEYS[CHROME + 2]; }
        if (y >= 29) co = KEYS[CHROME + (y === 29 ? 4 : 1 + ((x + y) % 2))];
        g.set(x, y, ch, co);
      }
    }
    // neon tube with rising bubbles
    for (let i = 0; i <= 400; i++) {
      const u = i / 400, [x, y] = tube(u);
      const ci = Math.min(4, Math.floor(u * 5));
      g.set(x, y, "█", KEYS[NEON + ci]);
      g.set(x + (x < cx ? -1 : x > cx ? 1 : 0), y, "▓", KEYS[NEOND + ci]);
    }
    for (let k = 0; k < 14; k++) {
      const side = k % 2;
      const u0 = ((t * 0.07 + k / 14) % 0.5);
      const u = side ? 1 - u0 : u0;
      const [x, y] = tube(u);
      g.set(x, y, k % 3 ? "●" : "○", KEYS[BUB + (k % 2)]);
    }
    // glass window with the record
    for (let y = 4; y < 16; y++) {
      const w = Math.min(halfW(y) - 6, 15);
      for (let x = Math.ceil(cx - w); x <= cx + w; x++) g.set(x, y, "█", KEYS[GLASS + Math.min(3, Math.floor((y - 4) / 3.5))]);
    }
    const rx = cx, ry = 11.5, rot = t * 3.5;
    for (let y = 8; y <= 15; y++) for (let x = cx - 13; x <= cx + 13; x++) {
      const dx = (x + 0.5 - rx) / 12, dy = (y + 0.5 - ry) / 3.4, d = Math.hypot(dx, dy);
      if (d > 1) continue;
      const a = Math.atan2(dy, dx * 0.9) - rot;
      let co = KEYS[DISC + (Math.floor(d * 9) % 2 ? 1 : 0)];
      if (d > 0.55 && Math.cos(a) > 0.92) co = KEYS[DISC + 2];
      if (d < 0.3) co = KEYS[DISC + (Math.cos(a * 1) > 0.3 ? 4 : 3)];
      g.set(x, y, "█", co);
    }
    g.set(rx, ry, "●", KEYS[CHROME + 5]);
    // stacked records waiting and the tone arm
    for (let k = 0; k < 4; k++) g.text(cx - 14 + k, 6 + k * 0.5, "▄▄", KEYS[DISC + 2]);
    g.line(cx + 14, 6, cx + 6, ry - 0.5, "█", KEYS[CHROME + 3]);
    g.set(cx + 14, 6, "●", KEYS[CHROME + 5]);
    // selector panel
    g.hline(cx - 18, cx + 18, 17, "▀", KEYS[CHROME + 4]);
    const sel = Math.floor(t / 3) % 10;
    for (let i = 0; i < 10; i++) {
      const x = cx - 17 + i * 3.6;
      g.text(x, 18, "▐█▌", KEYS[i === sel ? LIT : LIT + 2]);
      g.text(x, 19, String.fromCharCode(65 + (i % 5)) + (1 + Math.floor(i / 5)), KEYS[LIT + 3]);
    }
    g.text(cx - 9, 20, " NOW PLAYING " + String.fromCharCode(65 + (sel % 5)) + (1 + Math.floor(sel / 5)) + " ", KEYS[LIT]);
    // speaker grille pulses with the beat
    for (let y = 21; y < 29; y++) for (let x = cx - 16; x <= cx + 16; x++) {
      const slat = (x - cx + 16) % 3 === 0;
      const d = Math.hypot((x - cx) / 2, y - 25);
      const v = clamp(0.5 + beat * 0.5 - d / 16);
      g.set(x, y, slat ? "█" : "▒", slat ? KEYS[CHROME + 2] : KEYS[GRILL + Math.min(3, Math.floor(v * 4) + (d < 3 ? 1 : 0))]);
    }
    g.text(cx - 2, 25, "◆◆◆◆◆", KEYS[CHROME + 4]);
    // sound waves to the sides
    for (let k = 0; k < 3; k++) {
      const r = ((t * 1.9 + k / 3) % 1) * 8;
      for (const sd of [-1, 1]) for (let j = -2; j <= 2; j++) g.set(cx + sd * (R + 2 + r), 24 + j * (1 + r * 0.1), "│", KEYS[NEON + (k + 2) % 5]);
    }
    return g.frame();
  };
}
