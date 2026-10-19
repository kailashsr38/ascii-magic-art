/* easter-eggs: five painted eggs wobbling in spring grass under a soft blue sky. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#4aa8e0", "#7ec4ee", "#b0dcf6", "#dcf0fc"], 6);          // 0..5
const CLOUD = ["#e8f4fc", "#ffffff", "#c8dcec"];                                // 6..8
const HILL = gradient(["#4a9a4a", "#6ab85a", "#8ad06a"], 3);                    // 9..11
const GRASS = gradient(["#1a4a1a", "#2a6a24", "#3a8a2e", "#58aa3a", "#7cc84a", "#a8e070"], 6); // 12..17
const FLOW = ["#ffe24a", "#ff8ac8", "#ffffff"];                                 // 18..20
const EGG = [];
for (const h of ["#ff3a7a", "#ffc400", "#2a9cff", "#7a4aff", "#22c25a", "#ff7a1a"]) EGG.push(...gradient(["#2a1a2a", h, "#ffffff"], 5).slice(1, 4)); // 21..38
const pal = palette([...SKY, ...CLOUD, ...HILL, ...GRASS, ...FLOW, ...EGG]);

export const meta = {
  slug: "easter-eggs",
  name: "Easter Eggs",
  category: "occasions",
  note: "Five painted eggs with dots, zigzags and stripes wobble in turn in spring grass beneath drifting clouds.",
  tags: ["easter", "spring", "eggs", "pastel", "holiday", "cute"],
  cols: 80, rows: 30, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const ek = (hue, lv) => KEYS[21 + hue * 3 + Math.max(0, Math.min(2, lv))];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(4);
  const HZ = 15;
  const eggs = [[11, 0, 2, 4], [26, 2, 5, 1], [40, 3, 0, 2], [54, 4, 1, 3], [68, 5, 3, 0]].map(([x, a, b, c], i) => ({ x, by: 25 + (i % 2), cols3: [a, b, c], ph: i * 1.25, A: 6, B: 10.5 }));
  const flowers = Array.from({ length: 26 }, () => [Math.floor(r() * cols), 19 + Math.floor(r() * 11), Math.floor(r() * 3), r() * 6]);
  return (t) => {
    g.clear();
    // sky and clouds
    for (let y = 0; y < HZ + 3; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / (HZ + 3));
      const c = fbm(x * 0.06 - t * 0.15, y * 0.22, 4);
      if (c > 0.56) g.set(x, y, c > 0.64 ? "█" : "▓", KEYS[c > 0.62 ? 7 : c > 0.59 ? 6 : 8]);
      else g.set(x, y, v > 0.5 ? "█" : "▓", KEYS[Math.min(5, Math.floor(v * 6))]);
    }
    // rolling hills
    for (let x = 0; x < cols; x++) {
      const h = Math.round(HZ + 1.8 * Math.sin(x * 0.09 + 1) + 1.2 * Math.sin(x * 0.21));
      for (let y = h; y < 20; y++) g.set(x, y, y === h ? "▄" : "█", KEYS[9 + Math.min(2, Math.floor((y - h) / 2))]);
    }
    // grass, with blades swaying
    for (let y = 19; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.15, y * 0.4, 2);
      const sway = Math.sin(t * 2 + x * 0.3 - y * 0.2);
      const v = clamp(0.35 + (y - 19) * 0.04 + (n - 0.5) * 0.7);
      const blade = (x * 7 + y * 3) % 5 === 0;
      g.set(x, y, blade ? (sway > 0.35 ? "╱" : sway < -0.35 ? "╲" : "│") : SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[12 + Math.min(5, Math.floor(v * 6) + (blade ? 1 : 0))]);
    }
    for (const [x, y, c, ph] of flowers) g.set(x, y, Math.sin(t + ph) > 0.8 ? "*" : "●", KEYS[18 + c]);
    // eggs
    for (const e of eggs) {
      const env = Math.max(0, Math.sin(t * 0.9 + e.ph)) ** 4;
      const th = env * 0.32 * Math.sin(t * 9 + e.ph);
      const cs = Math.cos(th), sn = Math.sin(th);
      // shadow
      for (let x = e.x - 8; x <= e.x + 8; x++) g.set(x, e.by + 1, "▀", KEYS[12]);
      for (let y = e.by - 12; y <= e.by; y++) for (let x = e.x - 9; x <= e.x + 9; x++) {
        const px = x - e.x, py = (y - e.by + 0.5) * 2;
        const qx = px * cs + py * sn, qy = -px * sn + py * cs;
        const u = qx / e.A, w = (qy + e.B) / e.B;
        if (w < -1 || w > 1) continue;
        const half = Math.sqrt(1 - w * w) * (1 + 0.16 * w);
        if (Math.abs(u) > half) continue;
        const uu = u / Math.max(0.01, half);
        const lit = clamp(0.42 - uu * 0.4 - w * 0.12 + Math.sqrt(Math.max(0, 1 - uu * uu)) * 0.3);
        let lv = Math.floor(lit * 2.99), hue = e.cols3[0], ch = "█";
        // painted bands, measured along the egg's own axis
        if (w < -0.55) { if ((Math.round(qx) + Math.round(qy)) % 4 === 0) { hue = e.cols3[1]; ch = "●"; lv = 2; } }
        else if (w < -0.2) { const z = Math.abs(((qx + 40) % 4) - 2) - 1; if (Math.abs((w + 0.37) * 10 - z) < 0.8) { hue = e.cols3[2]; } }
        else if (w < 0.12) { hue = e.cols3[1]; }
        else if (w < 0.45) { const z = Math.abs(((qx + 40) % 4) - 2) - 1; if (Math.abs((w - 0.28) * 10 + z) < 0.8) { hue = e.cols3[2]; } }
        else if ((Math.round(qx / 2) + Math.round(qy / 2)) % 2 === 0) hue = e.cols3[2];
        g.set(x, y, Math.abs(uu) > 0.92 ? "▓" : ch, ek(hue, lv));
      }
    }
    return g.frame();
  };
}
