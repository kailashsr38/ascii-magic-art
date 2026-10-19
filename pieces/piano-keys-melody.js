/* piano-keys-melody: three octaves of piano keys pressing down to a melody, coloured notes rising from each key. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const ROOM = add(gradient(["#120e1e", "#1e1632", "#2c2048", "#3c2a5e", "#523a78"], 5));
const WOOD = add(gradient(["#1a0a06", "#3a1a0e", "#5e2c16", "#8a4422", "#b8662e"], 6));
const IVORY = add(["#f4efe2", "#d8d2c2", "#9a958a", "#5a5650"]);
const EBONY = add(["#101012", "#26262c", "#4a4a54"]);
const HUE = add(["#ff5a5a", "#ff8a3a", "#ffc23a", "#e6f03a", "#8aff5a", "#3aff9a", "#3ae6e6", "#3aa8ff", "#5a6aff", "#9a5aff", "#e05aff", "#ff5aa8"]);
const HUED = add(["#8a2a2a", "#8a4a1a", "#8a6a1a", "#7a801a", "#4a8a2a", "#1a8a5a", "#1a7a7a", "#1a5a8a", "#2a3a8a", "#5a2a8a", "#7a2a8a", "#8a2a5a"]);

export const meta = {
  slug: "piano-keys-melody",
  name: "Piano Keys Melody",
  category: "music",
  note: "Three octaves of piano keys press down to a gentle melody over a rolling left hand, each note lifting off its key in colour.",
  tags: ["piano", "keyboard", "melody", "keys", "hero", "wallpaper"],
  cols: 96, rows: 30, fps: 30,
  palette: palette(P),
};

const LOW = 48, NW = 22, KX = 4, KY = 14, KH = 14, BH = 8;
const WSTEP = [0, 2, 4, 5, 7, 9, 11];
const BLK = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 }; // black key pitch class -> white index it sits right of
const BPM = 92;

function score() {
  const ev = [];
  const melody = [
    [76, 1], [74, 0.5], [72, 0.5], [74, 1], [76, 1], [79, 1.5], [77, 0.5], [76, 1], [72, 1],
    [74, 1], [72, 0.5], [71, 0.5], [72, 1], [74, 1], [76, 2], [0, 1], [67, 1],
    [69, 1], [72, 1], [76, 1], [74, 0.5], [72, 0.5], [77, 1.5], [76, 0.5], [74, 1], [72, 1],
    [71, 1], [72, 0.5], [74, 0.5], [76, 1], [74, 1], [72, 3], [0, 1],
  ];
  let b = 0;
  for (const [p, d] of melody) { if (p) ev.push([b, d * 0.92, p, 1]); b += d; }
  const prog = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]];
  for (let bar = 0; bar < 8; bar++) {
    const c = prog[bar % 4];
    const arp = [0, 1, 2, 3, 2, 1, 2, 1];
    for (let k = 0; k < 8; k++) ev.push([bar * 4 + k * 0.5, 0.5, c[arp[k]] + (c[arp[k]] < LOW ? 12 : 0), 0]);
  }
  return { ev, len: 32 };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const { ev, len } = score();
  const R = rng(3);
  const sway = ev.map(() => R() * 6.28);
  const room = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.25 + (fbm(x * 0.05, y * 0.12, 3, 4) - 0.5) * 0.5 + Math.exp(-Math.hypot((x - 48) / 40, (y - 12) / 10)) * 0.5);
    room.push(KEYS[ROOM + Math.min(4, Math.floor(v * 5))]);
  }
  const whiteIdx = (p) => { const o = Math.floor((p - LOW) / 12), pc = (p - LOW) % 12; return o * 7 + WSTEP.indexOf(pc); };
  return (t) => {
    for (let i = 0; i < room.length; i++) { g.ch[i] = "░"; g.co[i] = room[i]; }
    const beat = (t * BPM) / 60, lb = beat % len;
    const down = new Map();
    // rising notes and pressed set
    for (let i = 0; i < ev.length; i++) {
      const [st, d, p] = ev[i];
      for (const off of [0, -len]) {
        const age = lb - (st + off);
        if (age >= 0 && age < d) down.set(p, ev[i][3]);
        const sec = (age * 60) / BPM;
        if (age >= 0 && sec < 4.5) {
          const pc = p % 12, blk = pc in BLK;
          const o = Math.floor((p - LOW) / 12);
          const x = blk ? KX + (o * 7 + BLK[pc]) * 4 + 3 : KX + whiteIdx(p) * 4 + 1;
          const y = KY - 3 - sec * 3;
          const xx = x + Math.sin(sec * 2 + sway[i]) * 1.2;
          const co = sec < 1.6 ? KEYS[HUE + pc] : KEYS[HUED + pc];
          const wdt = blk ? 2 : 3, x0 = blk ? x - 1 : x - 1;
          for (let yy = Math.max(0, Math.ceil(y + 2)); yy < KY - 2; yy++) {
            const f = (yy - y) / (KY - y);
            for (let q = 0; q < wdt; q++) g.set(x0 + q, yy, f < 0.25 ? "▒" : f < 0.6 ? "▓" : "█", sec < 1.2 ? KEYS[HUED + pc] : KEYS[HUED + pc]);
          }
          if (y >= 0) {
            if (ev[i][3] === 1) { g.set(xx, y, "█", co); g.set(xx + 1, y, "▀", co); g.set(xx - 1, y + 1, "▀", co); g.set(xx, y + 1, "▀", co); g.set(xx + 1, y - 1, "▄", co); g.set(xx + 1, y - 2, "▌", co); }
            else g.set(xx, y, "●", co);
          }
        }
      }
    }
    // case
    g.fill(0, KY - 2, cols, 2, "█", KEYS[WOOD + 2]);
    g.hline(0, cols - 1, KY - 2, "▀", KEYS[WOOD + 4]);
    g.fill(0, KY - 1, cols, 1, "▄", KEYS[WOOD]);
    g.fill(0, KY, KX, KH, "█", KEYS[WOOD + 1]);
    g.fill(KX + NW * 4, KY, cols - KX - NW * 4, KH, "█", KEYS[WOOD + 1]);
    g.fill(0, rows - 2, cols, 2, "█", KEYS[WOOD + 1]);
    g.hline(0, cols - 1, rows - 2, "▀", KEYS[WOOD + 3]);
    // white keys
    for (let w = 0; w < NW; w++) {
      const o = Math.floor(w / 7), p = LOW + o * 12 + WSTEP[w % 7];
      const on = down.has(p), x = KX + w * 4;
      for (let y = 0; y < KH; y++) {
        const yy = KY + y;
        let co = y > KH - 3 ? KEYS[IVORY + 1] : KEYS[IVORY];
        if (on) co = y === 0 ? KEYS[IVORY + 3] : y < KH - 3 ? KEYS[HUE + (p % 12)] : KEYS[HUED + (p % 12)];
        for (let k = 0; k < 3; k++) g.set(x + k, yy, "█", co);
        g.set(x + 3, yy, "▏", KEYS[IVORY + 2]);
        g.set(x + 3, yy, "█", KEYS[IVORY + 3]);
      }
      if (on) for (let k = 0; k < 3; k++) g.set(x + k, KY + KH - 1, "▀", KEYS[HUED + (p % 12)]);
    }
    // black keys
    for (let o = 0; o < 3; o++) for (const pc of [1, 3, 6, 8, 10]) {
      const p = LOW + o * 12 + pc, x = KX + (o * 7 + BLK[pc]) * 4 + 2, on = down.has(p);
      for (let y = 0; y < BH; y++) for (let k = 0; k < 3; k++) {
        let co = KEYS[EBONY + (k === 0 && y < BH - 1 ? 1 : 0)];
        if (y === BH - 1) co = KEYS[EBONY + 2];
        if (on) co = y === BH - 1 ? KEYS[HUED + pc] : KEYS[HUE + pc];
        g.set(x + k, KY + y + (on ? 1 : 0), y === BH - 1 && !on ? "▀" : "█", co);
      }
      if (on) for (let k = 0; k < 3; k++) g.set(x + k, KY, "█", KEYS[EBONY]);
    }
    // keyslip label
    g.text(KX, rows - 1, " LARGO  ·  PIANO 1 ", KEYS[WOOD + 4]);
    return g.frame();
  };
}
