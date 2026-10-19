/* marching-snare-drum: a parade drummer marching in step, sticks beating a paradiddle on a roped drum as the street rolls past. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#3a8ad8", "#6aaee8", "#9ad0f4", "#c8e8fa"], 4));
const BLDG = add(["#d8b890", "#c89a70", "#a87a58", "#e8d0b0", "#5a7a9a"]);
const ROAD = add(gradient(["#3a3638", "#5a5456", "#7a7274", "#9a9294"], 4));
const DRUM = add(["#c8202e", "#8a1420", "#ff4a50", "#f4f0e6", "#d8d2c4", "#e8b830", "#a87a10", "#fff0a0"]);
const UNI = add(["#1a2a6a", "#2a3e9a", "#f4f4f0", "#e8b830", "#0e1640", "#d8342e", "#ffffff"]);
const SKIN = add(["#e6a27c", "#c8805a"]);
const FLAG = add(["#ff4a4a", "#ffd23a", "#3aa8ff", "#5ad87a", "#ff8ad8"]);
const WOOD = add(["#8a5420", "#5a3410", "#fff4e0"]);

export const meta = {
  slug: "marching-snare-drum",
  name: "Marching Snare Drum",
  category: "music",
  note: "A parade drummer marches in step under bunting, sticks beating a paradiddle on a roped drum with ripples on the head while the street rolls past.",
  tags: ["drum", "parade", "marching band", "percussion", "rhythm", "hero"],
  cols: 84, rows: 34, fps: 30,
  palette: palette(P),
};

const BPM = 112, STK = "LRLLRLRR";
const DCX = 42, DTY = 18, DRX = 15, DRY = 2.6, DBY = 26;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hitTimes = (side, t) => {
    // returns [since last hit, until next hit] for this stick, in sixteenths
    const s16 = (t * BPM) / 60 * 4;
    const i = Math.floor(s16);
    let back = 0, fwd = 1;
    for (let k = 0; k < 8; k++) if (STK[(((i - k) % 8) + 8) % 8] === side) { back = s16 - (i - k); break; }
    for (let k = 1; k <= 8; k++) if (STK[(((i + k) % 8) + 8) % 8] === side) { fwd = i + k - s16; break; }
    return [back, fwd];
  };
  return (t) => {
    const beat = (t * BPM) / 60;
    const scroll = t * 9;
    // sky, buildings and bunting
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < 24) {
        const wx = x + scroll * 0.4;
        const bi = Math.floor(wx / 14), bh = 6 + ((bi * 7) % 5) * 2;
        if (y > 24 - bh - 6) {
          const win = (Math.floor(wx) % 14) % 4 === 2 && y % 3 === 1 && y < 22;
          g.set(x, y, win ? "▪" : "█", KEYS[BLDG + (win ? 4 : bi % 4)]);
        } else g.set(x, y, "█", KEYS[SKY + Math.min(3, Math.floor((y / 18) * 4))]);
      } else {
        const v = clamp(0.5 + (fbm((x + scroll) * 0.15, y * 0.5, 2) - 0.5) * 0.6);
        const stone = ((Math.floor(x + scroll) % 4) === 0) || y % 2 === 0;
        g.set(x, y, stone ? "▄" : "█", KEYS[ROAD + Math.min(3, Math.floor(v * 4)) - (stone ? 1 : 0) + (stone && v < 0.25 ? 1 : 0)]);
      }
    }
    for (let x = 0; x < cols; x++) {
      const y = 2 + Math.round(Math.sin(((x + scroll * 0.4) / 28) * Math.PI) ** 2 * 3);
      g.set(x, y, "─", KEYS[UNI + 2]);
      if (Math.floor(x + scroll * 0.4) % 4 === 0) { const c = KEYS[FLAG + (Math.floor((x + scroll * 0.4) / 4) % 5)]; g.set(x, y + 1, "▼", c); g.set(x - 1, y + 1, "█", c); g.set(x + 1, y + 1, "█", c); }
    }
    // legs marching in step
    const step = Math.sin(beat * Math.PI);
    for (const [lx, sgn] of [[37, 1], [46, -1]]) {
      const lift = Math.max(0, step * sgn) * 3;
      for (let y = DBY; y <= 31 - Math.round(lift); y++) for (let k = 0; k < 4; k++) g.set(lx + k, y, "█", KEYS[UNI + (k === 3 ? 4 : 0)]);
      g.set(lx + 1, DBY, "█", KEYS[UNI + 5]);
      const fy = 32 - Math.round(lift);
      g.text(lx - 1, fy, "▄████", KEYS[UNI + 4]);
      g.text(lx - 1, fy + 1, "▀▀▀▀▀", KEYS[UNI + 4]);
    }
    // torso and head
    for (let y = 9; y < DTY; y++) for (let x = 31; x <= 53; x++) {
      const edge = x === 31 || x === 53;
      g.set(x, y, "█", KEYS[UNI + (edge ? 0 : 1)]);
    }
    for (let k = 0; k < 9; k++) { g.set(33 + k * 2, 9 + k, "█", KEYS[UNI + 2]); g.set(51 - k * 2, 9 + k, "█", KEYS[UNI + 2]); }
    for (let y = 10; y < DTY; y += 2) g.set(42, y, "●", KEYS[UNI + 3]);
    g.text(30, 9, "▄▄▄", KEYS[UNI + 3]); g.text(52, 9, "▄▄▄", KEYS[UNI + 3]);
    for (let y = 5; y <= 8; y++) for (let x = 38; x <= 46; x++) g.set(x, y, "█", KEYS[SKIN + (x > 44 ? 1 : 0)]);
    g.set(40, 6, "●", KEYS[UNI + 4]); g.set(44, 6, "●", KEYS[UNI + 4]);
    g.text(41, 8, "▄▄▄", KEYS[DRUM + 1]);
    // tall hat with plume
    for (let y = 0; y <= 4; y++) for (let x = 37; x <= 47; x++) g.set(x, y, "█", KEYS[UNI + (y === 4 ? 3 : 4)]);
    g.text(37, 4, "▀▀▀▀▀▀▀▀▀▀▀", KEYS[UNI + 3]); g.set(42, 2, "◆", KEYS[UNI + 3]);
    const pl = Math.sin(beat * Math.PI) * 0.8;
    for (let y = 0; y < 3; y++) g.set(48 + Math.round(pl * (3 - y) * 0.5), y, "█", KEYS[UNI + 6]);
    // drum shell with zigzag ropes
    for (let y = Math.floor(DTY - DRY); y <= DBY + 2; y++) for (let x = DCX - DRX - 1; x <= DCX + DRX + 1; x++) {
      const u = (x - DCX) / DRX;
      if (Math.abs(u) > 1) continue;
      const curve = Math.sqrt(1 - u * u) * DRY;
      const top = DTY + curve, bot = DBY + curve;
      if (y < DTY - curve) continue;
      if (y <= top - 0.01 && y >= DTY - curve) {
        g.set(x, y, "█", KEYS[DRUM + 3]);
        continue;
      }
      if (y > bot + 0.8) continue;
      const lit = clamp(0.6 - u * 0.4);
      let co = KEYS[DRUM + (lit > 0.6 ? 2 : lit > 0.35 ? 0 : 1)], ch = "█";
      if (y - top < 1.2 || bot - y < 1) co = KEYS[DRUM + (u < 0 ? 7 : 5)];
      const span = (DBY - DTY);
      const ph = ((x + 40) % 10) / 10, yy = (y - top) / span;
      if (yy > 0.12 && yy < 0.88 && Math.abs((ph < 0.5 ? ph * 2 : 2 - ph * 2) - (yy - 0.12) / 0.76) < 0.14) { ch = "█"; co = KEYS[DRUM + 4]; }
      g.set(x, y, ch, co);
    }
    // drumhead rim
    for (let a = 0; a < TAU; a += 0.04) g.set(DCX + Math.cos(a) * DRX, DTY + Math.sin(a) * DRY, "█", KEYS[DRUM + 5]);
    // ripples
    for (const [side, hx] of [["L", 37], ["R", 47]]) {
      const [since] = hitTimes(side, t);
      if (since < 2) {
        const r = since * 3.5;
        for (let a = 0; a < TAU; a += 0.08) {
          const x = hx + Math.cos(a) * r * 1.6, y = DTY + Math.sin(a) * r * 0.35;
          if (Math.hypot((x - DCX) / DRX, (y - DTY) / DRY) < 0.92) g.set(x, y, "░", KEYS[DRUM + 4]);
        }
      }
    }
    // sticks and gloved hands
    for (const [side, sx, hx] of [["L", 30, 37], ["R", 54, 47]]) {
      const [since, until] = hitTimes(side, t);
      const lift = clamp(Math.min(since, until) * 0.8);
      const tipY = DTY - lift * 7, tipX = hx + (side === "L" ? -1 : 1) * lift * 2;
      const handX = sx, handY = 15 - lift * 2;
      g.line(handX, handY, tipX, tipY, "█", KEYS[WOOD]); g.line(handX, handY - 1, tipX, tipY - 1, "▄", KEYS[WOOD + 1]);
      g.set(tipX, tipY, "●", KEYS[WOOD + 2]);
      g.text(Math.round(handX) - 1, Math.round(handY), "███", KEYS[UNI + 6]);
      g.text(Math.round(handX) - 1, Math.round(handY) + 1, "▀▀▀", KEYS[UNI + 2]);
      if (since < 0.6) { g.set(tipX - 2, tipY - 1, "\\", KEYS[DRUM + 7]); g.set(tipX + 2, tipY - 1, "/", KEYS[DRUM + 7]); }
    }
    return g.frame();
  };
}
