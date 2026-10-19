/* boombox-speaker-pump: a chrome boombox against a brick wall, speaker cones pumping to the beat as sound rings spread out. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BRICK = add(gradient(["#2a0e0a", "#4a1a12", "#6a2618", "#8a3420"], 4));
const MORT = add(["#1a1614", "#2a2420"]);
const CHR = add(gradient(["#3a3e48", "#6a707e", "#a8b0bc", "#dde3ea"], 5));
const DARK = add(gradient(["#08080a", "#141418", "#22222a", "#34343e"], 4));
const CONE = add(gradient(["#14141a", "#24242e", "#3a3a48", "#5a5a6c", "#8a8aa0"], 6));
const LED = add(gradient(["#3aff8a", "#c8f03a", "#ffb03a", "#ff3a5a"], 8));
const WAVE = add(["#ff5ad8", "#c85aff", "#5a8aff", "#3ad8ff"]);
const UI = add(["#e6edf3", "#ff3a3a", "#ffd84a", "#f4f4f0", "#6a6a6a", "#5aff7a"]);

export const meta = {
  slug: "boombox-speaker-pump",
  name: "Boombox Speaker Pump",
  category: "music",
  note: "A chrome boombox sits against a brick wall, its two speaker cones pumping on every kick while sound rings spread out and the tape reels turn.",
  tags: ["boombox", "speakers", "retro", "hip hop", "bass", "hero"],
  cols: 104, rows: 34, fps: 30,
  palette: palette(P),
};

const SP = [[25, 20], [79, 20]], RX = 12.5, RY = 6.6;
const BPM = 92;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const wall = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const row = Math.floor(y / 2), off = row % 2 ? 4 : 0;
    const mort = y % 2 === 1 || (x + off) % 8 === 0;
    const v = clamp(0.4 + (fbm(x * 0.15, y * 0.3, 3, 2) - 0.5) * 0.8 + (noise2(Math.floor((x + off) / 8), row, 9) - 0.5) * 0.4);
    if (y >= 31) wall.push(["▓", KEYS[DARK + 2 + (x % 3 === 0 ? 1 : 0)]]);
    else wall.push(mort ? ["▄", KEYS[MORT + (y % 2)]] : [v > 0.6 ? "▓" : "█", KEYS[BRICK + Math.min(3, Math.floor(v * 4))]]);
  }
  return (t) => {
    for (let i = 0; i < wall.length; i++) { g.ch[i] = wall[i][0]; g.co[i] = wall[i][1]; }
    const beat = (t * BPM) / 60, ph = beat % 1;
    const kick = Math.exp(-ph * 6);
    // sound rings
    for (let k = 0; k < 5; k++) {
      const age = ((beat + k / 5) % 1);
      const rr = 14 + ((beat + k / 5) % 1) * 30;
      SP.forEach(([cx, cy], side) => {
        for (let a = -1.1; a <= 1.1; a += 0.03) {
          const x = side ? cx + Math.cos(a) * rr : cx - Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr * 0.5;
          if ((side && x > 96) || (!side && x < 8) || y < 2) g.set(x, y, age < 0.4 ? "█" : age < 0.7 ? "▓" : "▒", KEYS[WAVE + (k % 4)]);
        }
      });
    }
    // floor shadow
    g.fill(9, 31, 86, 1, "▀", KEYS[DARK]);
    // handle
    for (let x = 20; x <= 84; x++) { g.set(x, 3, "▄", KEYS[CHR + 3]); g.set(x, 4, "▀", KEYS[CHR + 1]); }
    for (const hx of [20, 21, 83, 84]) for (let y = 4; y <= 8; y++) g.set(hx, y, "█", KEYS[CHR + (hx % 2 ? 2 : 1)]);
    // antenna
    g.line(88, 8, 101, 0, "/", KEYS[CHR + 4]);
    g.set(101, 0, "●", KEYS[CHR + 4]);
    // body
    for (let y = 8; y <= 30; y++) for (let x = 8; x <= 96; x++) {
      const edge = y === 8 || y === 30 || x === 8 || x === 96;
      const v = clamp(0.75 - (y - 8) * 0.02 + (fbm(x * 0.05, y * 0.5, 2, 7) - 0.5) * 0.3);
      g.set(x, y, edge ? "█" : "▓", KEYS[CHR + Math.min(4, Math.floor(v * 5)) - (edge ? 1 : 0)]);
    }
    // top buttons
    for (let i = 0; i < 6; i++) {
      const x = 38 + i * 5, down = i === 1;
      g.text(x, down ? 8 : 7, "▄▄▄▄", down ? KEYS[UI + 1] : KEYS[DARK + 3]);
    }
    // speakers
    const s = 1 + kick * 0.1;
    SP.forEach(([cx, cy]) => {
      for (let y = Math.floor(cy - RY - 2); y <= cy + RY + 2; y++) for (let x = Math.floor(cx - RX - 3); x <= cx + RX + 3; x++) {
        const d = Math.hypot((x - cx) / RX, (y - cy) / RY);
        if (d > 1.18) continue;
        if (d > 1.0) { g.set(x, y, (x + y) % 2 ? "·" : "▪", KEYS[CHR + 1]); continue; }
        const dd = d / s;
        let ch = "█", co;
        if (d > 0.88) co = KEYS[DARK + 1];
        else if (dd < 0.22) { co = KEYS[CONE + 4 + (kick > 0.5 ? 1 : 0) - (dd > 0.18 ? 2 : 0)]; }
        else {
          const ang = Math.atan2(y - cy, (x - cx) / 2);
          const lit = Math.cos(ang + 2.2) * 0.3;
          const v = clamp(0.25 + lit + (1 - dd) * 0.35 * kick + (Math.sin(dd * 22) > 0.6 ? 0.12 : 0));
          ch = v > 0.5 ? "▓" : "█";
          co = KEYS[CONE + Math.min(5, Math.floor(v * 6))];
        }
        g.set(x, y, ch, co);
      }
    });
    // centre panel: dial, eq, tape
    g.fill(42, 10, 21, 18, "█", KEYS[DARK]);
    g.box(41, 9, 23, 20, "light", KEYS[CHR + 4]);
    const tune = 43 + Math.round(9 + 4 * Math.sin(t * 0.1));
    g.text(43, 10, "FM 88 96 104 MW", KEYS[CHR + 2]);
    g.set(tune, 11, "▼", KEYS[UI + 1]);
    for (let b = 0; b < 10; b++) {
      const v = clamp(0.25 + kick * (1 - b / 10) * 0.7 + noise2(b * 0.6, t * 3) * 0.45);
      for (let q = 0; q < 5; q++) g.set(43 + b * 2, 16 - q, "▄", q < v * 5 ? KEYS[LED + Math.min(7, q * 2)] : KEYS[DARK + 2]);
    }
    for (let y = 18; y <= 25; y++) for (let x = 44; x <= 60; x++) g.set(x, y, "▒", KEYS[DARK + 2]);
    g.text(45, 18, "AUTO REVERSE", KEYS[CHR + 1]);
    for (const [rx, sp] of [[48, 1], [56, 1.05]]) {
      const a = t * TAU * 0.7 * sp;
      for (let y = 20; y <= 24; y++) for (let x = rx - 3; x <= rx + 3; x++) {
        const d = Math.hypot((x - rx) / 2, y - 22);
        if (d > 1.8) continue;
        const aa = Math.atan2(y - 22, (x - rx) / 2) - a;
        g.set(x, y, d < 0.6 ? "●" : Math.cos(aa * 3) > 0.2 ? "█" : "▒", d < 0.6 ? KEYS[UI + 3] : KEYS[UI + 4]);
      }
    }
    g.text(43, 27, "STEREO  ●", KEYS[CHR + 2]);
    g.set(51, 27, "●", ph < 0.3 ? KEYS[UI + 5] : KEYS[DARK + 3]);
    // knobs and labels on the lower rail
    g.text(12, 29, "VOLUME", KEYS[DARK + 1]); g.text(19, 29, "(/)", KEYS[DARK + 1]);
    g.text(77, 29, "BASS", KEYS[DARK + 1]); g.text(82, 29, "(\\)", KEYS[DARK + 1]);
    g.text(12, 10, "SUPER BASS", KEYS[DARK + 1]); g.text(80, 10, "2 WAY", KEYS[DARK + 1]);
    return g.frame();
  };
}
