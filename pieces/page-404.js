/* page-404: a not-found page with a big glowing 404 and a lost satellite drifting through stars. */
import { Grid, palette, gradient, rng } from "../lib/kit.js";

const GLOW = gradient(["#6e40c9", "#a371f7", "#79c0ff", "#56d4dd"], 10); // 0-9
const pal = palette([...GLOW, "#e6edf3", "#8b949e", "#484f58", "#30363d", "#ffa657", "#7ee787", "#f2cc60", "#1f2937"]);
// a text, b muted, c dim, d darker, e orange, f green, g yellow, h shadow

export const meta = {
  slug: "page-404",
  name: "Lost In Space 404",
  category: "screens",
  note: "A not found page with a big glowing 404 and a lost satellite drifting through twinkling stars.",
  tags: ["404", "error", "page", "space", "website", "hero"],
  cols: 84, rows: 28, fps: 20,
  palette: pal,
};

const GL = {
  "4": ["##   ##", "##   ##", "#######", "     ##", "     ##"],
  "0": [" ##### ", "##   ##", "##   ##", "##   ##", " ##### "],
};
const SAT = [
  ["▓▓▓▓▓ ┌───┐ ▓▓▓▓▓", "═════╡ ■ ╞═════", "      └─┬─┘      ", "        │        ", "        ◆        "],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const r = rng(404);
  const stars = Array.from({ length: 150 }, () => [Math.floor(r() * W), Math.floor(r() * H), r() * 6.28, r()]);
  return (t) => {
    g.clear();
    for (const [x, y, ph, b] of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      const ch = b > 0.9 ? "+" : tw > 0.7 ? "•" : tw > 0.3 ? "·" : ".";
      g.set((x + Math.floor(t * (0.5 + b))) % W, y, ch, tw > 0.75 ? "b" : b > 0.5 ? "c" : "d");
    }
    // big 404, scaled 2x horizontally and 2x vertically
    const digits = "404", ox = 13, oy = 3;
    for (let d = 0; d < 3; d++) {
      const gl = GL[digits[d]];
      const bob = Math.round(Math.sin(t * 1.4 + d * 0.9) * 0.6);
      for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
        if (gl[row][col] !== "#") continue;
        for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
          const x = ox + d * 20 + col * 2 + sx, y = oy + row * 2 + sy + bob;
          g.set(x + 1, y + 1, "░", "h");
          const k = Math.floor(((x - ox) / 56 * 7 + Math.sin(t * 2 - x * 0.15) * 1.5 + 1.5)) ;
          g.set(x, y, "█", String(Math.max(0, Math.min(9, k))));
        }
      }
    }
    // satellite drifting on a slow loop, panels flashing
    const sx = Math.round(56 + Math.sin(t * 0.35) * 8), sy = Math.round(15 + Math.sin(t * 0.7) * 1.5);
    const art = SAT[0];
    art.forEach((line, i) => { for (let k = 0; k < line.length; k++) if (line[k] !== " ") g.set(sx + k, sy + i, line[k], line[k] === "▓" ? "3" : line[k] === "■" ? (Math.floor(t * 3) % 2 ? "e" : "c") : "a"); });
    const ping = (t * 1.2) % 3;
    for (let k = 0; k < 3; k++) if (ping > k) g.set(sx + 18 + k * 2, sy + 1, ")", ping - k < 1 ? "a" : "c");
    g.text(sx + 25, sy + 1, "?", Math.floor(t * 2) % 2 ? "g" : "c");
    // copy
    g.text(6, 18, "ERROR 404 · PAGE NOT FOUND", "6");
    g.text(6, 20, "This page drifted out of orbit.", "a");
    g.text(6, 21, "The link may be broken, or the page was moved.", "b");
    const hov = Math.floor(t / 2) % 2 === 0;
    g.box(6, 23, 22, 3, hov ? "heavy" : "round", hov ? "7" : "c");
    g.text(8, 24, "← Back to home", hov ? "a" : "b");
    g.box(30, 23, 18, 3, "round", "c");
    g.text(32, 24, "Report a link", "b");
    g.text(W - 26, H - 2, "signal lost · retrying", "c");
    g.text(W - 3, H - 2, ".".repeat(1 + Math.floor(t * 2) % 3).padEnd(2).slice(0, 2), "c");
    return g.frame();
  };
}
