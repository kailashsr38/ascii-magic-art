/* page-500: a server error page with a smoking rack, blinking fault lights and a retry countdown. */
import { Grid, palette, gradient, fbm, rng } from "../lib/kit.js";

const FIRE = gradient(["#8b1d1d", "#ff7b72", "#ffa657", "#f2cc60"], 8); // 0-7
const SMOKE = gradient(["#1c2128", "#30363d", "#57606a", "#8b949e", "#b1bac4"], 6); // 8-d
const pal = palette([...FIRE, ...SMOKE, "#e6edf3", "#8b949e", "#484f58", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72"]);
// e text, f muted, g dim, h green, i blue, j orange, k red

export const meta = {
  slug: "page-500",
  name: "Server Error 500",
  category: "screens",
  note: "A 500 error page with a smoking server rack, blinking fault lights and a retry countdown.",
  tags: ["500", "error", "page", "server", "website", "status"],
  cols: 86, rows: 28, fps: 20,
  palette: pal,
};

const GL = {
  "5": ["#######", "##     ", "###### ", "     ##", "###### "],
  "0": [" ##### ", "##   ##", "##   ##", "##   ##", " ##### "],
};
const SM = " .:░▒▓";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const RX = 4, RY = 11, RW = 26, RH = 16;
  const r = rng(500);
  const leds = Array.from({ length: 6 * 4 }, () => [r() * 6.28, r()]);
  return (t) => {
    g.clear();
    // smoke plume above the rack
    for (let y = 0; y < RY; y++) for (let x = 0; x < 40; x++) {
      const h = (RY - y) / RY; // 0 at rack top, 1 at top of frame
      const cx = RX + RW / 2 + Math.sin(y * 0.5 - t * 1.3) * 2 + h * 6;
      const spread = 3 + h * 12;
      const dx = Math.abs(x - cx) / spread;
      if (dx > 1.2) continue;
      const n = fbm(x * 0.18, y * 0.35 + t * 1.6, 3, 7);
      const v = n * (1.25 - dx) * (1 - h * 0.45) - 0.18;
      if (v <= 0.02) continue;
      const k = Math.min(5, Math.floor(v * 9));
      g.set(x, y, SM[k], "89abcd"[Math.min(5, Math.floor(v * 8))]);
    }
    // flicker of flame at the rack top
    for (let x = RX + 4; x < RX + RW - 4; x++) {
      const v = fbm(x * 0.5, t * 4, 2, 3);
      if (v > 0.45) g.set(x, RY - 1, v > 0.62 ? "▲" : "^", String(Math.min(7, Math.floor((v - 0.4) * 22))));
    }
    // rack
    g.box(RX, RY, RW, RH, "heavy", "g");
    for (let u = 0; u < 6; u++) {
      const y = RY + 1 + u * 2 + Math.floor(u / 6);
      g.box(RX + 1, y, RW - 2, 2, "light", "g");
      g.text(RX + 3, y, "▒▒▒▒▒▒▒▒", "9");
      g.text(RX + 3, y + 1, "srv-0" + (u + 1), "f");
      for (let l = 0; l < 4; l++) {
        const [ph, b] = leds[u * 4 + l];
        const bad = u === 2 || u === 3 || (u === 4 && l < 2);
        const on = Math.sin(t * (bad ? 9 : 3 + b * 4) + ph) > (bad ? -0.2 : 0.3);
        g.set(RX + 14 + l * 2, y + 1, on ? "●" : "○", bad ? (on ? "k" : "g") : on ? "h" : "g");
      }
    }
    g.text(RX + 2, RY + RH - 2, "rack eu-2 / row 14", "g");
    // sparks
    for (let i = 0; i < 5; i++) {
      const p = (t * 1.3 + i * 0.37) % 1;
      const x = RX + 10 + Math.round(Math.sin(i * 7.3) * 8 * p), y = RY - 1 - Math.round(p * 6 - p * p * 4);
      if (p < 0.8 && g.get(x, y) === " ") g.set(x, y, p < 0.3 ? "*" : "·", p < 0.3 ? "6" : "4");
    }
    // big 500
    const ox = 36, oy = 3;
    for (let d = 0; d < 3; d++) {
      const gl = GL["500"[d]];
      const jit = Math.sin(t * 23 + d) > 0.93 ? 1 : 0;
      for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
        if (gl[row][col] !== "#") continue;
        for (let s = 0; s < 4; s++) {
          const x = ox + d * 16 + col * 2 + (s & 1) + jit, y = oy + row * 2 + (s >> 1);
          g.set(x, y, "█", String(Math.min(7, Math.max(0, Math.floor(1 + (y - oy) * 0.6 + Math.sin(t * 3 + x * 0.2))))));
        }
      }
    }
    g.text(36, 14, "Internal Server Error", "e");
    g.text(36, 15, "Something broke on our side. We are on it.", "f");
    const cd = 5 - Math.floor(t % 6);
    g.text(36, 17, "upstream  ", "f"); g.text(46, 17, "db-primary timed out after 30s", "k");
    g.text(36, 18, "incident  ", "f"); g.text(46, 18, "INC-2047 opened 4m ago", "j");
    g.text(36, 19, "request   ", "f"); g.text(46, 19, "req_8f2c41a9e7", "g");
    g.text(36, 21, "● api", "j"); g.text(43, 21, "degraded", "f");
    g.text(56, 21, "● database", "k"); g.text(68, 21, "down", "f");
    g.text(36, 22, "● cdn", "h"); g.text(43, 22, "operational", "f");
    g.text(56, 22, "● auth", "h"); g.text(68, 22, "operational", "f");
    g.box(36, 24, 24, 3, cd === 0 ? "heavy" : "round", cd === 0 ? "i" : "g");
    g.text(38, 25, cd === 0 ? "Retrying now..." : `Retrying in ${cd}s`, cd === 0 ? "i" : "e");
    g.box(62, 24, 18, 3, "round", "g");
    g.text(64, 25, "Status page →", "f");
    return g.frame();
  };
}
