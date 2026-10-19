/* analog-clock: a wall clock with a brass bezel, its hands sweeping in real proportion. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const WALL = gradient(["#141b26", "#22303f", "#2f4152"], 6);        // 0-5
const FACE = gradient(["#0f1d3a", "#1d3566", "#2e4f8c"], 6);        // 6-b
const BRASS = gradient(["#6b4a17", "#b8862f", "#f3d27a", "#fff1c2"], 8); // c-j
const pal = palette([...WALL, ...FACE, ...BRASS, "#f4efe1", "#ff5a4f", "#9fb4d8"]); // k cream, l red, m tick

export const meta = {
  slug: "analog-clock",
  name: "Analog Wall Clock",
  category: "things",
  note: "A brass wall clock on a dark wall, hour, minute and second hands sweeping in proportion.",
  tags: ["clock", "time", "hero", "wallpaper", "loader"],
  cols: 64, rows: 32, fps: 24,
  palette: pal,
};

function dirChar(dx, dy) {
  let a = Math.atan2(-dy * 2, dx);
  a = ((a % Math.PI) + Math.PI) % Math.PI;
  if (a < Math.PI / 8 || a > (7 * Math.PI) / 8) return "-";
  if (a < (3 * Math.PI) / 8) return "/";
  if (a < (5 * Math.PI) / 8) return "|";
  return "\\";
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2 - 0.5, cy = rows / 2 - 0.5, R = 29;
  // static background and dial, computed once
  const baseCh = [], baseCo = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const dx = (x - cx) / R, dy = (y - cy) / (R * 0.5);
    const d = Math.hypot(dx, dy);
    let ch, co;
    if (d > 1.06) {
      const n = fbm(x * 0.12, y * 0.25, 3);
      const shadow = d < 1.2 && dx + dy > 0 ? 0.35 : 0;
      const v = clamp(n * 0.9 + 0.1 - shadow);
      ch = v > 0.55 ? "▒" : "░"; co = KEYS[Math.min(5, Math.floor(v * 6))];
    } else if (d > 0.92) {
      const light = clamp(0.55 - (dx + dy) * 0.35 + (1 - Math.abs(d - 0.99) / 0.07) * 0.3);
      ch = "█"; co = KEYS[12 + Math.min(7, Math.floor(light * 8))];
    } else {
      const v = clamp(0.75 - (dx + dy) * 0.25 - d * 0.35);
      ch = v > 0.5 ? "▒" : "░"; co = KEYS[6 + Math.min(5, Math.floor(v * 6))];
    }
    baseCh.push(ch); baseCo.push(co);
  }
  const putBase = () => { for (let i = 0; i < baseCh.length; i++) { g.ch[i] = baseCh[i]; g.co[i] = baseCo[i]; } };
  const at = (a, r) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r * 0.5];
  const hand = (a, len, tail, ch, co, thick) => {
    for (let s = -tail; s <= len; s += 0.25) {
      const [x, y] = at(a, s);
      g.set(Math.round(x), Math.round(y), ch || dirChar(Math.sin(a), -Math.cos(a) * 0.5), co);
      if (thick && s > 0 && s < len - 1) {
        const px = Math.cos(a) * 0.6, py = Math.sin(a) * 0.3;
        g.set(Math.round(x + px), Math.round(y + py), ch, co);
        g.set(Math.round(x - px), Math.round(y - py), ch, co);
      }
    }
  };
  return (t) => {
    putBase();
    // minute ticks and hour marks
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * TAU;
      if (m % 5) { const [x, y] = at(a, R * 0.86); g.set(Math.round(x), Math.round(y), "·", "m"); }
      else { const [x, y] = at(a, R * 0.86); g.set(Math.round(x), Math.round(y), "█", "j"); }
    }
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * TAU;
      const [x, y] = at(a, R * 0.7);
      const s = String(h);
      g.text(Math.round(x - (s.length - 1) / 2), Math.round(y), s, "k");
    }
    const secs = 10 * 3600 + 9 * 60 + 30 + t * 20;
    const as = ((secs % 60) / 60) * TAU;
    const am = ((secs % 3600) / 3600) * TAU;
    const ah = ((secs % 43200) / 43200) * TAU;
    hand(ah, R * 0.45, 0, "█", "h", true);
    hand(am, R * 0.74, 0, "█", "k", false);
    hand(as, R * 0.82, R * 0.16, null, "l", false);
    g.set(Math.round(cx), Math.round(cy), "●", "j");
    return g.frame();
  };
}
