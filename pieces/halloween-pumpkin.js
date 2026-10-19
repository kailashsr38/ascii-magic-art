/* halloween-pumpkin: a carved pumpkin glowing on a hill under a big moon, bats flapping across the sky. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#0a0414", "#1e0a33", "#3a1250", "#6a1f5a", "#a8344a", "#e0602a"], 12); // 0..11
const PUMP = gradient(["#3a1004", "#6e2206", "#a83a08", "#e05a0a", "#ff8a1e", "#ffb050"], 8); // 12..19
const GLOW = gradient(["#ffb000", "#ffd23a", "#ffe98a", "#fffbe0"], 4);                     // 20..23
const MOON = gradient(["#c8b88a", "#efe2b0", "#fff8dc"], 3);                                // 24..26
const NAMED = ["#08030c", "#160a1c", "#2a1630", "#2f5a1a", "#4a7a24", "#000000", "#3a2a3a", "#5a4a5a"];
// 27 silhouette, 28 hill, 29 hill lit, 30 stem dark, 31 stem, 32 bat, 33 stone, 34 stone lit
const pal = palette([...SKY, ...PUMP, ...GLOW, ...MOON, ...NAMED]);

export const meta = {
  slug: "halloween-pumpkin",
  name: "Jack O Lantern",
  category: "occasions",
  note: "A carved pumpkin flickers on a hill beneath a huge moon while bats flap across a purple night sky.",
  tags: ["halloween", "pumpkin", "spooky", "autumn", "bats", "hero"],
  cols: 90, rows: 36, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const mx = 68, my = 9, MR = 7.5;
  const cx = 45, cy = 26, RX = 19, RY = 8;
  const r = rng(13);
  const bats = Array.from({ length: 7 }, (_, i) => ({ sp: 6 + r() * 6, y: 3 + r() * 12, ph: r() * 100, amp: 1 + r() * 2, f: 5 + r() * 4, dir: i % 3 === 0 ? -1 : 1 }));
  const hill = (x) => 22 + 2.5 * Math.sin(x * 0.06 + 0.5) + 1.2 * Math.sin(x * 0.17);
  const inEye = (x, y, ex, ey) => { const dy = y - ey; return dy >= -2 && dy <= 1 && Math.abs(x - ex) <= (dy + 2) * 1.3 + 0.5; };
  const carved = (x, y) => {
    if (inEye(x, y, cx - 8, cy - 3) || inEye(x, y, cx + 8, cy - 3)) return true;
    const ny = y - (cy); if (ny >= -1 && ny <= 0 && Math.abs(x - cx) <= (ny + 1) * 1.2 + 0.5) return true;
    const u = (x - cx) / 13;
    if (Math.abs(u) > 1) return false;
    const yt = cy + 3 - 2.2 * u * u, yb = cy + 5.6 - 1.4 * u * u;
    if (y < yt - 0.5 || y > yb) return false;
    if ((Math.abs(x - cx - 5) <= 1 || Math.abs(x - cx + 5) <= 1) && y < yt + 0.6) return false; // top teeth
    if (Math.abs(x - cx) <= 1 && y > yb - 1.2) return false;                                     // bottom tooth
    return true;
  };
  return (t) => {
    g.clear();
    const fl = 0.78 + 0.22 * Math.sin(t * 12) * Math.sin(t * 7.7 + 1);
    // sky with moon glow
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dm = Math.hypot((x - mx) / 2, y - my);
      const n = fbm(x * 0.04 + t * 0.05, y * 0.12, 3);
      const v = clamp(0.22 + y / rows * 0.5 + (n - 0.5) * 0.4 + Math.exp(-dm / 7) * 0.35);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(11, Math.floor(v * 12))]);
    }
    // moon
    for (let y = 0; y < 20; y++) for (let x = mx - 18; x < mx + 18; x++) {
      const d = Math.hypot((x - mx) / MR, (y - my) / (MR * 0.5));
      if (d < 1) {
        const cr = fbm(x * 0.3, y * 0.6, 2) > 0.6;
        g.set(x, y, cr ? "▓" : "█", KEYS[24 + (cr ? 0 : d < 0.6 ? 2 : 1)]);
      }
    }
    // a bare tree on the left
    g.line(9, 22, 10, 9, "█", KEYS[27]); g.line(10, 22, 11, 10, "▌", KEYS[27]);
    g.line(10, 14, 3, 9, "▄", KEYS[27]); g.line(10, 12, 17, 7, "▀", KEYS[27]); g.line(10, 17, 18, 13, "▄", KEYS[27]);
    g.line(4, 9, 2, 6, "╲", KEYS[27]); g.line(16, 8, 19, 5, "╱", KEYS[27]); g.line(13, 10, 14, 6, "│", KEYS[27]);
    // hills, lit by the lantern
    for (let x = 0; x < cols; x++) for (let y = Math.floor(hill(x)); y < rows; y++) {
      const lit = Math.exp(-Math.hypot((x - cx) / 2.2, y - cy) / 6) * fl;
      const n = fbm(x * 0.2, y * 0.4, 2);
      const v = clamp(0.2 + (n - 0.5) * 0.5 + lit);
      g.set(x, y, y === Math.floor(hill(x)) ? (x % 3 ? "▄" : "▲") : SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[v > 0.55 ? 29 : 28]);
    }
    // tombstones
    for (const [tx, w] of [[72, 5], [80, 4], [20, 4]]) {
      const ty = Math.floor(hill(tx)) - 3;
      g.text(tx, ty, "▄" + "█".repeat(w - 2) + "▄", KEYS[33]);
      for (let j = 1; j < 4; j++) g.text(tx, ty + j, "█".repeat(w), KEYS[j === 1 ? 34 : 33]);
      g.set(tx + Math.floor(w / 2), ty + 1, "┼", KEYS[27]);
    }
    // pumpkin glow on the ground
    for (let y = cy - RY - 3; y < rows; y++) for (let x = cx - RX - 8; x <= cx + RX + 8; x++) {
      const d = Math.hypot((x - cx) / RX, (y - cy) / RY);
      if (d > 1 && d < 1.35 && y > cy) g.set(x, y, "▒", KEYS[d < 1.15 ? 14 : 13]);
    }
    // the pumpkin: ribbed sphere shading
    for (let y = cy - RY; y <= cy + RY; y++) for (let x = cx - RX; x <= cx + RX; x++) {
      const u = (x - cx) / RX, w = (y - cy) / RY;
      const d = Math.hypot(u, w * (1 - 0.1 * Math.cos(u * 3)));
      if (d >= 1) continue;
      if (carved(x, y)) {
        const inner = clamp(0.35 + 0.65 * fl - Math.abs(u) * 0.25 + (fbm(x * 0.5, y + t * 3, 2) - 0.5) * 0.4);
        g.set(x, y, "█", KEYS[20 + Math.min(3, Math.max(1, Math.floor(inner * 4)))]);
        continue;
      }
      const rib = Math.abs(Math.cos(Math.asin(clamp(u, -0.999, 0.999)) * 3.5));
      const nz = Math.sqrt(1 - d * d);
      const edge = carved(x - 1, y) || carved(x + 1, y) || carved(x, y - 1) || carved(x, y + 1);
      if (edge) { g.set(x, y, "▓", KEYS[13]); continue; }
      const v = clamp(nz * 0.7 + rib * 0.25 - u * 0.15 - w * 0.12);
      g.set(x, y, rib < 0.25 ? "▓" : "█", KEYS[12 + Math.min(6, Math.floor(v * 7.5))]);
    }
    // stem
    g.text(cx - 1, cy - RY - 1, "▄█▄", KEYS[31]); g.text(cx, cy - RY - 2, "█▄", KEYS[30]); g.set(cx + 2, cy - RY - 3, "▄", KEYS[31]);
    g.set(cx - 1, cy - RY - 2, "▄", KEYS[30]);
    // bats
    for (const b of bats) {
      const span = cols + 20;
      let x = ((t * b.sp * b.dir + b.ph) % span + span) % span - 10;
      const y = b.y + Math.sin(t * 1.5 + b.ph) * b.amp;
      const up = Math.sin(t * b.f + b.ph) > 0;
      if (up) { g.block(x, y, "▄     ▄", KEYS[32]); g.block(x + 1, y + 1, "▀▄█▄▀", KEYS[32]); }
      else { g.block(x + 2, y, "▄█▄", KEYS[32]); g.block(x, y + 1, "▄▀▀ ▀▀▄", KEYS[32]); }
    }
    return g.frame();
  };
}
