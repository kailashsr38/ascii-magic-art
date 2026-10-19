/* snow-globe: a glass globe with a tiny lit cottage and a fir tree, snow swirling around inside. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, TAU } from "../lib/kit.js";

const ROOM = gradient(["#0c0614", "#1e0f26", "#33182e", "#4a2434"], 6);          // 0..5
const GSKY = gradient(["#0b1f4a", "#1d3f7a", "#3a67a8", "#7aa2d4"], 8);           // 6..13
const SNOW = gradient(["#8aa0c4", "#c6d6ec", "#eef4ff", "#ffffff"], 5);           // 14..18
const WOOD = gradient(["#2a130a", "#4f2612", "#7a3e1c", "#a65a2a", "#d08a4a"], 6); // 19..24
const NAMED = ["#e6c35a", "#fff1a8", "#a8302a", "#d8463a", "#6a3a22", "#e8d8b8", "#ffd45a", "#ffb02a",
  "#1c5a2a", "#2f8a3e", "#cfe4ff", "#ffffff", "#8a8a9a", "#5a3a2a"];
// 25 gold, 26 pale gold, 27 roof dark, 28 roof, 29 wall dark, 30 wall, 31 window, 32 window warm,
// 33 fir dark, 34 fir, 35 glass, 36 glint, 37 smoke, 38 door
const pal = palette([...ROOM, ...GSKY, ...SNOW, ...WOOD, ...NAMED]);

export const meta = {
  slug: "snow-globe",
  name: "Snow Globe",
  category: "occasions",
  note: "A glass snow globe on a wooden base, holding a tiny lit cottage and a fir tree while snow swirls around them.",
  tags: ["snow", "winter", "christmas", "globe", "holiday", "cozy"],
  cols: 72, rows: 38, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 36, cy = 16, RX = 24, RY = 13;
  const r = rng(9);
  const flakes = Array.from({ length: 150 }, () => [Math.sqrt(r()) * 0.95, r() * TAU, 0.3 + r() * 0.9, r() * TAU, r()]);
  const HOUSE = [
    "      ▄▄█▄      ",
    "     ▄█████▄    ",
    "   ▄█████████▄  ",
    " ▄█████████████▄",
    "  ▓▓▓▓▓▓▓▓▓▓▓▓  ",
    "  ▓WW▓▓▓▓▓▓WW▓  ",
    "  ▓WW▓▓DD▓▓WW▓  ",
    "  ▓▓▓▓▓DD▓▓▓▓▓  ",
  ];
  return (t) => {
    g.clear();
    // the room: dark warm gradient with soft bokeh
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.08 + t * 0.02, y * 0.15, 3);
      const v = clamp(0.25 + (n - 0.5) * 0.9 + (y > 33 ? 0.3 : 0));
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(5, Math.floor(v * 6))]);
    }
    // the globe interior
    const groundY = (x) => cy + 5 + 1.6 * Math.sin(x * 0.17 + 1) + 0.8 * Math.sin(x * 0.41);
    for (let y = cy - RY; y <= cy + RY; y++) for (let x = cx - RX; x <= cx + RX; x++) {
      const d = Math.hypot((x - cx) / RX, (y - cy) / RY);
      if (d >= 1) continue;
      if (y >= groundY(x)) {
        const n = fbm(x * 0.2, y * 0.5, 2);
        const v = clamp(0.55 + (n - 0.5) * 0.7 - (x - cx) / RX * 0.2);
        g.set(x, y, v > 0.5 ? "█" : "▓", KEYS[14 + Math.min(4, Math.floor(v * 5))]);
      } else {
        const v = clamp((y - (cy - RY)) / (2 * RY) * 0.9 + (fbm(x * 0.1, y * 0.2, 2) - 0.5) * 0.3);
        g.set(x, y, SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[6 + Math.min(7, Math.floor(v * 8))]);
      }
    }
    // cottage
    const hx = cx - 15, hy = cy - 1;
    HOUSE.forEach((line, j) => {
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === " ") continue;
        let co = KEYS[28], ch = c;
        if (j === 0 && i === 9) { co = KEYS[38]; ch = "█"; }        // chimney
        else if (j < 4) co = KEYS[(i + j) % 5 ? 28 : 27];
        if (j === 3 || (j === 2 && i % 3 === 0)) { co = KEYS[17]; ch = j === 3 ? "▀" : "▄"; }  // snow on the roof edge
        if (j >= 4) { co = KEYS[i < 4 ? 29 : 30]; ch = c === "▓" ? "█" : c; }
        if (c === "W") { ch = "█"; co = KEYS[(Math.sin(t * 3 + i) > 0.6) ? 31 : 32]; }
        if (c === "D") { ch = "█"; co = KEYS[38]; }
        g.set(hx + i, hy + j, ch, co);
      }
    });
    g.set(hx + 7, hy + 7, "▀", KEYS[17]);
    // chimney smoke
    for (let k = 0; k < 5; k++) {
      const a = (t * 0.8 + k * 0.2) % 1;
      const sx = hx + 9 + Math.round(Math.sin(a * 6 + t) * 1 + a * 4), sy = hy - 1 - Math.round(a * 6);
      if (Math.hypot((sx - cx) / RX, (sy - cy) / RY) < 0.95) g.set(sx, sy, a < 0.5 ? "▒" : "░", KEYS[37]);
    }
    // fir tree
    const tx = cx + 10, tTop = cy - 6;
    for (let j = 0; j < 11; j++) {
      const w = Math.floor(j * 0.55 + (j % 3) * 0.5);
      for (let i = -w; i <= w; i++) g.set(tx + i, tTop + j, (j % 3 === 2 && Math.abs(i) === w) ? "▀" : "█", KEYS[(j % 3 === 2 && Math.abs(i) === w) ? 16 : i < 0 ? 34 : 33]);
    }
    g.set(tx, tTop - 1, "▲", KEYS[34]); g.set(tx, tTop + 11, "█", KEYS[19]);
    // swirling snow
    for (const [rho, th0, w, ph, s] of flakes) {
      const th = th0 + t * w * (s < 0.5 ? 1 : -0.6);
      const rr = rho * (0.85 + 0.15 * Math.sin(t * 0.7 + ph));
      const x = cx + Math.cos(th) * rr * RX, y = cy + Math.sin(th) * rr * RY * 0.95 + Math.sin(t * 1.3 + ph) * 0.8;
      if (Math.hypot((x - cx) / RX, (y - cy) / RY) >= 0.96 || y >= groundY(Math.floor(x)) - 0.5) continue;
      g.set(x, y, s > 0.8 ? "*" : s > 0.45 ? "•" : "·", KEYS[s > 0.45 ? 36 : 35]);
    }
    // glass rim and highlight
    for (let y = cy - RY - 1; y <= cy + RY; y++) for (let x = cx - RX - 1; x <= cx + RX + 1; x++) {
      const d = Math.hypot((x - cx) / RX, (y - cy) / RY);
      const a = Math.atan2((y - cy) / RY, (x - cx) / RX);
      if (d >= 0.96 && d < 1.06) g.set(x, y, d < 1 ? "▒" : "░", KEYS[35]);
      else if (d > 0.72 && d < 0.84 && a > -2.6 && a < -1.9) g.set(x, y, "░", KEYS[36]);
    }
    // wooden base with a gold band
    for (let y = cy + RY - 1; y < 36; y++) {
      const j = y - (cy + RY - 1);
      const w = 17 + j * 1.3;
      for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) {
        if (j < 1 && Math.hypot((x - cx) / RX, (y - cy) / RY) < 0.98) continue;
        const u = (x - cx) / w;
        const grain = fbm(x * 0.2, y * 1.5, 2);
        const v = clamp(0.6 - u * 0.35 + (grain - 0.5) * 0.4);
        if (j === 2) g.set(x, y, "▄", KEYS[Math.abs(Math.round((x - cx) - ((t * 14) % 60 - 30))) < 3 ? 26 : 25]);
        else if (j === 3) g.set(x, y, "▀", KEYS[25]);
        else g.set(x, y, SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[19 + Math.min(5, Math.floor(v * 6))]);
      }
    }
    return g.frame();
  };
}
