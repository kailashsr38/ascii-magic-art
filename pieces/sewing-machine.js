/* sewing-machine: a vintage black and gold sewing machine stitching a seam into gingham fabric. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#6a8a7e", "#7a9a8c", "#8aaa9a", "#9ab8a8"], 6));
const TABLE = add(gradient(["#3a200e", "#5a3418", "#7a4a24", "#9a6232"], 6));
const BODY = add(gradient(["#0c0c10", "#1a1a20", "#2a2a34", "#424250", "#7a7a8e"], 6));
const GOLD = add(["#8a6a1a", "#d4a838", "#ffe08a"]);
const STEEL = add(gradient(["#4a4e58", "#8a909c", "#c8ced8", "#f4f8ff"], 5));
const FAB = add(["#e84a5a", "#f4a0a8", "#fff0f0", "#b42a3a"]);
const THREAD = add(["#3a8aff", "#8ac4ff"]);
const LAMP = add(["#fff4c4", "#ffd88a"]);

export const meta = {
  slug: "sewing-machine",
  name: "Vintage Sewing Machine",
  category: "things",
  note: "A black and gold vintage sewing machine whirs away, needle bobbing and handwheel turning as gingham fabric feeds through and a blue seam appears.",
  tags: ["sewing", "machine", "vintage", "craft", "workshop", "loader"],
  cols: 84, rows: 30, fps: 30,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NX = 22;
  return (t) => {
    g.clear();
    const spm = 6;                         // stitches per second
    const ph = t * spm;
    const feed = Math.floor(ph); // fabric advances one cell per stitch
    const nd = Math.max(0, Math.cos(ph * TAU)) ** 0.6; // needle depth 0..1
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < 22) { const n = fbm(x * 0.06, y * 0.12, 3, 2); g.set(x, y, n > 0.55 ? "▓" : "█", KEYS[WALL + Math.min(5, Math.floor(n * 5 + y / 12))]); }
      else { const n = noise2(x * 0.08, y * 1.5, 4); g.set(x, y, Math.sin(x * 0.3 + n * 4) > 0.7 ? "▓" : "█", KEYS[TABLE + Math.min(5, 1 + Math.floor(n * 4) + (y === 22 ? 2 : 0))]); }
    }
    // lamp glow from the head
    for (let y = 17; y < 22; y++) for (let x = 12; x < 34; x++) if (Math.hypot((x - NX) / 2, y - 20) < 5 && g.get(x, y) === "█") g.co[x + y * cols] = KEYS[WALL + 5];
    // fabric under the needle, sliding left
    for (let y = 20; y < 25; y++) for (let x = 0; x < 64; x++) {
      const wx = x + feed;
      const check = (Math.floor(wx / 3) + Math.floor(y / 1)) % 2;
      const k = y === 20 ? 3 : check ? 0 : (Math.floor(wx / 3) % 2 ? 1 : 2);
      g.set(x, y, y === 20 ? "▄" : "█", KEYS[FAB + k]);
    }
    for (let x = 0; x < NX; x++) if ((x + feed) % 2 === 0) g.set(x, 22, "─", KEYS[THREAD]);
    for (let x = NX + 1; x < 64; x++) if ((x + feed) % 4 === 0) g.set(x, 22, "·", KEYS[FAB + 3]);
    // bed plate
    for (let x = 8; x < 74; x++) { g.set(x, 25, "█", KEYS[BODY + 2]); g.set(x, 26, "▀", KEYS[BODY + 1]); }
    g.text(18, 25, "▄▄▄▄▄▄▄▄", KEYS[STEEL + 2]);
    // pillar and arm
    for (let y = 8; y < 25; y++) for (let x = 56; x < 66; x++) g.set(x, y, "█", KEYS[BODY + (x === 56 ? 3 : x > 63 ? 0 : 1)]);
    for (let y = 5; y < 12; y++) for (let x = 16; x < 66; x++) {
      const r = y === 5 || y === 11;
      g.set(x, y, r ? (y === 5 ? "▄" : "▀") : "█", KEYS[BODY + (y === 6 ? 4 : y < 8 ? 3 : 1)]);
    }
    // gold decals
    for (let x = 30; x < 52; x += 2) g.set(x, 8, (x / 2) % 2 ? "◆" : "·", KEYS[GOLD + (x % 4 ? 1 : 0)]);
    g.text(32, 9, "S T I T C H", KEYS[GOLD + 2]);
    for (let y = 13; y < 23; y += 2) g.set(60, y, "◆", KEYS[GOLD]);
    // head
    for (let y = 5; y < 18; y++) for (let x = 15; x < 28; x++) {
      const round = (y === 5 && (x === 15 || x === 27)) || (y === 17 && (x === 15 || x === 27));
      if (round) continue;
      g.set(x, y, "█", KEYS[BODY + (x === 15 ? 3 : x > 25 ? 0 : 2)]);
    }
    g.text(16, 7, "◆◆◆◆◆◆◆◆◆◆◆", KEYS[GOLD]);
    g.set(25, 14, "●", KEYS[STEEL + 2]);
    g.text(14, 15, "▐█", KEYS[LAMP]);
    // needle bar, needle and presser foot
    const ny = 16 + nd * 4;
    for (let y = 17; y <= ny; y++) g.set(NX, y, y > ny - 2 ? "│" : "█", KEYS[STEEL + (y > ny - 2 ? 4 : 3)]);
    g.text(NX - 2, 19, "▄▄▄", KEYS[STEEL + 2]);
    g.set(NX + 2, 18, "│", KEYS[STEEL]);
    // spool, thread path and tension disc
    g.text(38, 2, "▄███▄", KEYS[THREAD]); g.text(38, 3, "▀███▀", KEYS[THREAD + 1]);
    g.set(40, 4, "│", KEYS[STEEL + 2]);
    g.line(41, 3, 27, 7, "─", KEYS[THREAD + 1]);
    g.set(27, 7, "●", KEYS[STEEL + 3]);
    g.line(27, 7, NX + 1, 12 - nd * 2, "·", KEYS[THREAD]);
    g.line(NX + 1, 12 - nd * 2, NX + 1, ny, "│", KEYS[THREAD]);
    // handwheel turning
    const wx = 72, wy = 10, wr = 8;
    for (let y = wy - 5; y <= wy + 5; y++) for (let x = wx - 9; x <= wx + 9; x++) {
      const d = Math.hypot(x + 0.5 - wx, (y + 0.5 - wy) * 2);
      if (d > wr + 0.5) continue;
      const a = Math.atan2((y + 0.5 - wy) * 2, x + 0.5 - wx) + ph * TAU;
      const rim = d > wr - 1.5;
      const spoke = !rim && Math.cos(a * 3) > 0.85 && d > 1.5;
      if (rim) g.set(x, y, "█", KEYS[STEEL + (Math.cos(a) > 0 ? 2 : 1)]);
      else if (spoke) g.set(x, y, "█", KEYS[STEEL + 1]);
      else if (d < 1.5) g.set(x, y, "●", KEYS[STEEL + 3]);
      else g.set(x, y, "▒", KEYS[BODY + 2]);
    }
    // stitch counter on the bed
    g.text(8, 28, "SPEED ■■■■□", KEYS[GOLD + 1]);
    g.text(24, 28, "STITCHES " + String(Math.floor(ph) % 100000).padStart(5, "0"), KEYS[GOLD + 1]);
    return g.frame();
  };
}
