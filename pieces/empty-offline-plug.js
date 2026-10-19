/* empty-offline-plug: an unplugged cable dangles beside its socket, sparking now and then, while a retry timer counts down. */
import { Grid, palette } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#6e7681", "#c9d1d9", "#21262d"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a steel, b light steel, c deep

export const meta = {
  slug: "empty-offline-plug",
  name: "Unplugged Offline Cable",
  category: "empty-states",
  note: "An unplugged cable sways beside its wall socket and throws the odd spark while a retry timer counts down.",
  tags: ["empty-state", "offline", "network", "error", "app"],
  cols: 60, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const PLUG = ["▄███▄", "█████══", "█████", "█████══", "▀███▀"];
const SOCK = ["▄██████", "▄▄█████", "███████", "▄▄█████", "▀██████"];
const RETRY = 6;
const hash = (n) => { let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const CY = 6, SX = 37;
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    // plug sways on its cable
    const px = 20 + Math.round(Math.sin(t * 1.1) * 1.4), py = CY + Math.round(Math.sin(t * 1.7 + 0.5) * 0.8);
    // cable from the left edge with a sag down to the plug
    let prev = null;
    for (let x = 1; x < px; x++) {
      const u = (x - 1) / (px - 1);
      const y = Math.round(CY + 1 + (py - CY - 1) * u + Math.sin(u * Math.PI) * 2.5);
      if (prev !== null && prev !== y) for (let k = Math.min(prev, y); k <= Math.max(prev, y); k++) S(x - (y > prev ? 1 : 0), k, "█", "a");
      S(x, y, "█", "a");
      prev = y;
    }
    PLUG.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") S(px + i, py - 2 + r, row[i], row[i] === "═" ? "b" : "7"); });
    // wall socket and its cable to the right edge
    SOCK.forEach((row, r) => { for (let i = 0; i < row.length; i++) S(SX + i, CY - 2 + r, row[i], (r === 1 || r === 3) && i < 2 ? "c" : "a"); });
    for (let x = SX + 7; x < W - 1; x++) S(x, CY, "█", "2");
    for (let y = CY - 3; y <= CY + 3; y++) S(SX + 7, y, "▐", "2");
    // sparks in the gap, a few short bursts per second
    const tick = Math.floor(t * 7), on = hash(tick) < 0.4;
    if (on) {
      const gx0 = px + 8, gx1 = SX - 1;
      for (let k = 0; k < 4; k++) {
        const h = hash(tick * 13 + k);
        const x = gx0 + Math.floor(h * Math.max(1, gx1 - gx0 + 1)), y = CY - 1 + Math.floor(hash(tick * 7 + k * 3) * 3);
        S(x, y, "*'·+"[k], k % 2 ? "9" : "6");
      }
    }
    // copy, with a retry countdown in a fixed slot
    const left = RETRY - (t % RETRY);
    mid(12, "You're offline", "0");
    mid(13, "Check your connection. We'll keep trying.", "1");
    const msg = left > 1 ? `Retrying in ${String(Math.ceil(left - 1)).padStart(1)}s` : "Retrying now...";
    mid(14, msg.padEnd(15), left > 1 ? "2" : "6");
    const label = "Retry now", bw = label.length + 4, bx = Math.floor((W - bw) / 2);
    g.box(bx, 16, bw, 3, "round", "5"); g.text(bx + 2, 17, label, "5");
    return g.frame();
  };
}
