/* empty-cloud-saved: an arrow rises into a cloud, a tick is cut into it and a last saved timer starts counting. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#d8ecff", "#b4d6fb", "#8cbcf2", "#5f97d9", "#0d1117", "#2ea043"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-d cloud light to dark, e cutout, f deep green

export const meta = {
  slug: "empty-cloud-saved",
  name: "Saved To Cloud Tick",
  category: "empty-states",
  note: "An arrow rises into a soft cloud, a tick is cut into the cloud and a last saved timer starts counting.",
  tags: ["empty-state", "saved", "cloud", "sync", "success"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const PUFFS = [[-8, 6.8, 5.4], [-1, 5.2, 7.2], [7.5, 6.6, 5.6], [-3, 7.6, 8], [3, 7.6, 8]];
const ARROW = ["   █   ", "  ███  ", " █████ ", "███████", "  ███  ", "  ███  ", "  ███  "];
const CHECK = [[-4, 0], [-1.5, 2], [4.5, -2]];
const PERIOD = 8, IN = 1.0, TICK = 1.5;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const CX = 28;
  const segLen = [Math.hypot(2.5, 4), Math.hypot(6, 8)];
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const saved = lt >= TICK && lt < PERIOD - 0.4;
    // arrow rising into the cloud (drawn first, the cloud hides it)
    if (lt < IN + 0.1) {
      const top = 13 - (clamp(lt / IN) ** 0.7) * 9;
      ARROW.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") { const y = Math.round(top + r); if (y < 13) S(CX - 3 + i, y, row[i], "5"); } });
    }
    // cloud
    for (let y = 1; y <= 10; y++) for (let x = CX - 16; x <= CX + 16; x++) {
      let inside = false;
      for (const [ox, oy, r] of PUFFS) if (Math.hypot((x - CX - ox) / r, (y - oy) * 2 / r) < 1) { inside = true; break; }
      if (!inside) continue;
      const k = clamp((y - 1.5) / 8.5);
      S(x, y, y === 10 ? "▀" : "█", "abcd"[Math.min(3, Math.floor(k * 4))]);
    }
    // tick cut into the cloud
    if (lt >= IN) {
      let rem = clamp((lt - IN) / 0.45) * (segLen[0] + segLen[1]);
      if (lt > PERIOD - 0.4) rem = 0;
      for (let s = 0; s < 2 && rem > 0; s++) {
        const [ax, ay] = CHECK[s], [bx, by] = CHECK[s + 1];
        const f = Math.min(1, rem / segLen[s]); rem -= segLen[s];
        for (let i = 0; i <= 20 * f; i++) {
          const u = i / 20, x = CX + ax + (bx - ax) * u, y = 6.5 + ay + (by - ay) * u;
          S(x, y, "█", "e"); S(x + 1, y, "█", "e");
        }
      }
    }
    const secs = Math.floor(lt - TICK);
    mid(13, saved ? "All changes saved" : "Saving...", saved ? "0" : "1");
    const when = !saved ? "syncing 3 changes" : secs < 2 ? "Last saved just now" : `Last saved ${secs}s ago`;
    mid(14, when.padEnd(19), "1");
    mid(16, saved ? "✓ Synced to all your devices" : "· Do not close this tab", saved ? "4" : "2");
    return g.frame();
  };
}
