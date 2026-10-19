/* fluid-smoke: a thin plume of smoke rising from an incense stick, curling into turbulent eddies as it climbs. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#06060c", "#0c0c18", "#141426", "#1c1a34", "#26203e"], 8));
add("smoke", gradient(["#2a2a3e", "#4a4a64", "#72708e", "#9e9ab6", "#c8c4dc", "#ece8f6"], 14));
add("glow", gradient(["#4a1a0a", "#c8501a", "#ffa040", "#fff0c0"], 4));
add("stick", ["#3a2414", "#6a4224"]);
add("dish", gradient(["#2a2a34", "#4a4a58", "#7a7a8a"], 3));

export const meta = {
  slug: "fluid-smoke",
  name: "Rising Smoke",
  category: "motion-lab",
  note: "A thin ribbon of smoke rises from a glowing incense tip, stays smooth for a moment, then breaks into curling turbulent eddies.",
  tags: ["smoke", "fluid", "turbulence", "calm", "wallpaper", "loader"],
  cols: 72, rows: 40, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SX = cols / 2 + 6, SY = rows - 9;   // the glowing tip
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.2 + 0.55 * Math.exp(-Math.hypot((x - SX) / 2, y - SY) / 18) + (fbm(x * 0.05, y * 0.08, 2, 3) - 0.5) * 0.2);
      g.set(x, y, v > 0.55 ? "▒" : "░", K("bg", Math.min(7, Math.floor(v * 8))));
    }
    for (let y = 0; y < SY; y++) {
      const h = (SY - y) / SY;                        // 0 at the tip, 1 at the top
      const rise = h * 9 - t * 1.6;                    // texture moves upward over time
      const turb = clamp((h - 0.12) * 1.6);            // laminar near the tip, turbulent above
      // the plume centre sways, more with height
      const sway = (fbm(rise * 0.35, t * 0.15, 3, 1) - 0.5) * 26 * turb + Math.sin(h * 5 - t * 0.9) * 3 * turb;
      const width = 0.7 + h * 9 * (0.4 + turb);
      for (let x = 0; x < cols; x++) {
        let dx = x + 0.5 - (SX + sway);
        // curl: displace sideways by a rotating noise field to make eddies
        const curl = (noise2(x * 0.12, rise * 0.9, 7) - 0.5) * 10 * turb;
        dx += curl;
        const core = Math.exp(-((dx / width) ** 2));
        if (core < 0.04) continue;
        const wisps = fbm(x * 0.15 + Math.sin(rise) * 0.3, rise * 1.2, 4, 2);
        const d = core * (0.45 + 0.9 * wisps) * (1 - h * 0.55) * (1 - turb * 0.25 * (1 - wisps));
        if (d < 0.12) continue;
        const v = clamp(d);
        g.set(x, y, SH[Math.min(4, 1 + Math.floor(v * 4))], K("smoke", Math.min(13, Math.floor(v * 15))));
      }
    }
    // incense stick, glowing tip, ash dish
    for (let k = 0; k < 7; k++) g.set(SX - k * 1.4, SY + 1 + k * 0.55, k ? "╱" : "▪", K("stick", k % 2));
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.3);
    g.set(SX, SY, "●", K("glow", pulse > 0.7 ? 3 : 2));
    g.set(SX - 1, SY, "░", K("glow", 1)); g.set(SX + 1, SY, "░", K("glow", 1));
    g.set(SX, SY - 1, "░", K("glow", 0));
    const dy = rows - 4;
    for (let x = SX - 22; x <= SX - 2; x++) g.set(x, dy, "▄", K("dish", 2));
    for (let x = SX - 21; x <= SX - 3; x++) g.set(x, dy + 1, "▀", K("dish", 1));
    for (let x = 0; x < cols; x++) for (let y = dy + 2; y < rows; y++) g.set(x, y, "▓", K("bg", y === dy + 2 ? 4 : 2));
    return g.frame();
  };
}
