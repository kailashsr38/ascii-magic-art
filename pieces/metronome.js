/* metronome: a wooden pyramid metronome, its weighted arm swinging and ticking on the beat. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const ROOM = gradient(["#0d0f14", "#1a1e28", "#262c3a"], 5);            // 0-4
const WOOD = gradient(["#2e140a", "#5a2a12", "#8a461e", "#b8682e", "#e09a55"], 10); // 5-e
const pal = palette([...ROOM, ...WOOD, "#f2e6c8", "#d8c8a0", "#c8ccd4", "#7a808c", "#ffd84a", "#ff7a5a", "#3a2a1a"]);
// f cream face, g face shade, h chrome, i chrome dark, j tick, k tock, l slot

export const meta = {
  slug: "metronome",
  name: "Metronome",
  category: "things",
  note: "A wooden pyramid metronome, its weighted arm swinging side to side and ticking on every beat.",
  tags: ["music", "tempo", "rhythm", "loader", "hero"],
  cols: 52, rows: 36, fps: 30,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 26, topY = 3, botY = 32, pivY = 28;
  const half = (y) => 3 + ((y - topY) / (botY - topY)) * 15;
  return (t) => {
    // room
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(fbm(x * 0.08, y * 0.16, 3) * 0.7 + Math.exp(-Math.hypot((x - cx) / 30, (y - 14) / 14)) * 0.4);
      g.set(x, y, y > botY ? "▓" : v > 0.55 ? "▒" : "░", y > botY ? "1" : KEYS[Math.min(4, Math.floor(v * 5))]);
    }
    // pyramid body with lit left face and darker right face
    for (let y = topY; y <= botY; y++) {
      const h = half(y);
      for (let x = Math.floor(cx - h); x <= Math.ceil(cx + h); x++) {
        const u = (x - cx) / h;
        if (Math.abs(u) > 1) continue;
        const grain = fbm(x * 0.3, y * 0.06, 2);
        const l = clamp((u < 0 ? 0.7 : 0.35) - Math.abs(u) * 0.15 + (grain - 0.5) * 0.3 + (Math.abs(u) > 0.93 ? -0.2 : 0));
        g.set(x, y, "█", KEYS[5 + Math.min(9, Math.floor(l * 10))]);
      }
    }
    // front panel: cream scale with tempo marks, and the slot for the arm
    for (let y = 7; y <= 25; y++) {
      const h = half(y) * 0.42;
      for (let x = Math.floor(cx - h); x <= Math.ceil(cx + h); x++) g.set(x, y, Math.abs(x - cx) <= 0 ? "█" : "█", Math.abs(x - cx) < 1 ? "l" : (x < cx ? "f" : "g"));
      if (y % 2 === 1) { g.set(Math.floor(cx - h) + 1, y, "-", "e"); g.set(Math.ceil(cx + h) - 1, y, "-", "e"); }
    }
    g.text(cx - 6, 9, "60", "7"); g.text(cx + 5, 13, "96", "7"); g.text(cx - 7, 18, "120", "7"); g.text(cx + 4, 22, "160", "7");
    // base plinth
    for (let x = cx - 20; x <= cx + 20; x++) { g.set(x, botY + 1, "█", "6"); g.set(x, botY + 2, "▀", "5"); }
    // the arm: one beat per second, a pendulum swing
    const th = 0.42 * Math.sin(Math.PI * t);
    const s = Math.sin(th), c = Math.cos(th);
    for (let r = -2; r <= 46; r += 0.3) {
      const x = cx + s * r, y = pivY - c * r * 0.5;
      g.set(Math.round(x), Math.round(y), "█", "h");
    }
    // sliding weight
    for (let r = 26; r <= 33; r += 0.3) for (let w = -3.2; w <= 3.2; w += 0.5) {
      const x = cx + s * r + c * w, y = pivY - c * r * 0.5 + s * w * 0.5;
      g.set(Math.round(x), Math.round(y), "█", w < 0 ? "j" : "e");
    }
    g.set(cx, pivY, "●", "h");
    // tick and tock flashes at each end of the swing
    const beat = Math.floor(t + 0.5);
    const ph = ((t - 0.5) % 1 + 1) % 1;
    if (ph < 0.22) {
      const word = beat % 2 ? "TOCK" : "TICK";
      const xx = beat % 2 ? cx + 13 : cx - 17;
      g.text(xx, 4, word, beat % 2 ? "k" : "j");
      g.text(xx - 1, 3, "\\  /", "j"); g.text(xx - 1, 5, "/  \\", "j");
    }
    return g.frame();
  };
}
