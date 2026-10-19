/* empty-broken-link-cloud: a drifting cloud above a chain link that has snapped in two, with chips falling from the break. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#cfe3ff", "#a5c8f5", "#6f9ed8", "#3f6fae"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-d cloud light to dark

export const meta = {
  slug: "empty-broken-link-cloud",
  name: "Broken Link Cloud",
  category: "empty-states",
  note: "A cloud drifts above a chain link that has snapped in two, the halves swinging apart as chips fall from the break.",
  tags: ["empty-state", "offline", "cloud", "error", "network"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const PUFFS = [[-6, 5.6, 4.6], [0, 4.6, 5.6], [6.5, 5.8, 4.2], [-2, 6, 6]];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    // cloud drifting a little left and right
    const cx = 28 + Math.sin(t * 0.45) * 2.5;
    for (let y = 1; y <= 8; y++) for (let x = Math.floor(cx - 14); x <= cx + 14; x++) {
      let inside = false;
      for (const [ox, oy, r] of PUFFS) if (Math.hypot((x - cx - ox) / r, (y - oy) * 2 / r) < 1) { inside = true; break; }
      if (!inside || y > 8) continue;
      const k = clamp((y - 2) / 6.5);
      S(x, y, y === 8 ? "▀" : "█", "abcd"[Math.min(3, Math.floor(k * 4))]);
    }
    // the snapped link: halves swing apart and back
    const gap = 3 + Math.round((0.5 + 0.5 * Math.sin(t * 1.3)) * 3);
    const LY = 10, lx = 28 - Math.floor(gap / 2) - 2 - 7, rx = 28 + Math.ceil(gap / 2) + 2;
    const tilt = Math.round(Math.sin(t * 1.3) * 0.6);
    // dashed tether from the cloud down to the break
    for (let y = 9; y < LY + 1; y++) S(28, y, "┆", "2");
    // chips falling from the break
    for (let k = 0; k < 3; k++) {
      const a = (t * 0.8 + k / 3) % 1;
      S(28 + (k - 1) * 1, LY + 1 + a * 3.5, a < 0.5 ? "▪" : "·", a < 0.5 ? "6" : "2");
    }
    g.box(lx, LY, 7, 3, "round", "5"); g.text(lx + 7, LY + 1, "──", "5");
    g.set(lx + 9, LY + 1 + tilt, "╱", "6");
    g.set(rx - 3, LY + 1 - tilt, "╱", "6");
    g.text(rx - 2, LY + 1, "──", "5"); g.box(rx, LY, 7, 3, "round", "5");
    mid(14, "Can't reach the server", "0");
    mid(15, "The link to the cloud was interrupted.", "1");
    mid(17, "Try again  ·  Status page", "5");
    return g.frame();
  };
}
