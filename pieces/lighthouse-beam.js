/* lighthouse-beam: close up on a lighthouse lamp room, the great lens turning and throwing beams into the night. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const SKY = gradient(["#050914", "#0b1630", "#14244a", "#1e3462"], 8);    // 0-7
const BEAM = gradient(["#2a3a5a", "#6a7a7a", "#c8c08a", "#fff0b0", "#fffbe8"], 8); // 8-f
const LENS = gradient(["#3a3010", "#8a6a20", "#e0b040", "#ffe48a", "#ffffff"], 10); // g-p
const pal = palette([
  ...SKY, ...BEAM, ...LENS,
  "#a8202a", "#5a1016", "#e04048",   // q roof red, r roof dark, s roof light
  "#1a1e24", "#3a424e", "#8a96a6",   // t iron dark, u iron, v iron light
  "#e8e4da", "#a8a49a", "#dfe8ff",   // w tower white, x tower shade, y star
]);

export const meta = {
  slug: "lighthouse-beam",
  name: "Lighthouse Lamp Room",
  category: "things",
  note: "A close view of a lighthouse lamp room at night, the faceted lens turning and sweeping its beams across the sky.",
  tags: ["lighthouse", "night", "sea", "wallpaper", "hero"],
  cols: 96, rows: 40, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 47.5, top = 11, bot = 29, RC = 15, RL = 9.5;
  const r = rng(3);
  const stars = Array.from({ length: 50 }, () => [Math.floor(r() * cols), Math.floor(r() * 30), r() * 6]);
  return (t) => {
    const rot = t * 0.9;
    const panels = [0, 1, 2, 3].map((k) => rot + (k * TAU) / 4);
    const front = Math.max(...panels.map((a) => Math.max(0, Math.cos(a)) ** 8));
    // sky with a glow that swells when a panel faces us
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const gl = Math.exp(-Math.hypot((x - cx) / 2, y - 20) / (10 + front * 10)) * (0.4 + front * 0.6);
      const v = clamp(0.2 + y / 60 + fbm(x * 0.05 + t * 0.03, y * 0.15, 3) * 0.35 + gl * 0.6);
      g.set(x, y, v > 0.6 ? "▓" : v > 0.35 ? "▒" : "░", KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 1.4 + ph) > 0.3) g.set(sx, sy, "·", "y");
    // beams from panels that face sideways
    for (const a of panels) {
      const side = Math.sin(a), toward = Math.cos(a);
      const k = Math.abs(side) ** 1.5 * (toward > 0 ? 1 : 0.55);
      if (k < 0.05) continue;
      const dir = side > 0 ? 1 : -1;
      for (let x = 0; x < cols; x++) {
        const dist = (x - cx) * dir - RC;
        if (dist < 0) continue;
        const w = 1.6 + dist * 0.09;
        for (let y = Math.max(0, Math.floor(20 - w * 2)); y <= Math.min(rows - 1, Math.ceil(20 + w * 2)); y++) {
          const b = Math.exp(-(((y - 20) / w) ** 2)) * k * (1 - dist / 70);
          if (b > 0.12) g.set(x, y, b > 0.6 ? "█" : b > 0.35 ? "▓" : "▒", KEYS[8 + Math.min(7, Math.floor(b * 8 + 1))]);
        }
      }
    }
    // tower below the gallery
    for (let y = 33; y < rows; y++) {
      const half = 13 + (y - 33) * 0.8;
      for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
        const u = (x - cx) / half;
        g.set(x, y, "█", Math.abs(u) > 0.6 ? "x" : "w");
      }
    }
    // lamp room interior and the lens
    for (let y = top; y <= bot; y++) for (let x = Math.floor(cx - RC); x <= Math.ceil(cx + RC); x++) {
      const u = (x - cx) / RC;
      if (Math.abs(u) > 1) continue;
      let ch = "▒", co = KEYS[3];
      const ul = (x - cx) / RL;
      if (Math.abs(ul) <= 1 && y >= top + 2 && y <= bot - 2) {
        const phi = Math.asin(ul);
        let best = 0;
        for (const a of panels) {
          let da = phi - a; da = ((da % TAU) + TAU + Math.PI) % TAU - Math.PI;
          const bull = Math.max(0, Math.cos(da * 2)) ** 2;
          const ring = Math.cos(Math.hypot(da * 9, (y - 20) * 0.9) * 2.2) > 0.2 ? 1 : 0.55;
          best = Math.max(best, bull * ring);
        }
        const prism = (y - top) % 2 === 0 ? 0.85 : 1;
        const v = clamp((0.25 + best * 0.75 + front * 0.2) * prism - Math.abs(ul) * 0.15);
        ch = "█"; co = KEYS[16 + Math.min(9, Math.floor(v * 10))];
      } else {
        const v = clamp(0.3 + front * 0.4 - Math.abs(u) * 0.2);
        ch = "▒"; co = KEYS[8 + Math.min(4, Math.floor(v * 5))];
      }
      g.set(x, y, ch, co);
    }
    // glazing bars: vertical mullions and two diagonal astragals
    for (let m = 0; m < 12; m++) {
      const ph = (m / 12) * TAU;
      if (Math.cos(ph) < 0) continue;
      const x = Math.round(cx + Math.sin(ph) * RC);
      for (let y = top; y <= bot; y++) g.set(x, y, "█", "u");
    }
    for (let x = Math.floor(cx - RC); x <= Math.ceil(cx + RC); x++) { g.set(x, top + 6, "─", "v"); g.set(x, top + 12, "─", "v"); }
    // roof: a red dome with a vent ball
    for (let y = 3; y < top; y++) {
      const s = (y - 3) / (top - 3);
      const half = 3 + Math.sqrt(s) * (RC + 2);
      for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
        const u = (x - cx) / half;
        g.set(x, y, y === top - 1 ? "▀" : "█", u < -0.3 ? "s" : u > 0.4 ? "r" : "q");
      }
    }
    g.text(Math.round(cx) - 1, 1, "▄█▄", "t"); g.set(Math.round(cx), 2, "█", "u"); g.set(Math.round(cx), 0, "│", "u");
    // gallery deck and railing
    for (let x = Math.floor(cx - 22); x <= Math.ceil(cx + 22); x++) {
      g.set(x, bot + 1, "█", "t");
      g.set(x, bot + 2, "─", "v");
      g.set(x, bot + 4, "▀", "u");
      if (x % 3 === 0) { g.set(x, bot + 2, "┼", "v"); g.set(x, bot + 3, "│", "v"); }
    }
    return g.frame();
  };
}
