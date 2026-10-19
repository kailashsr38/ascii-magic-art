/* lava-lamp: warm wax blobs rising, merging and sinking inside a glowing lamp. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const ROOM = gradient(["#0b0612", "#1c0f2a", "#341a45", "#4f2558"], 6);   // 0-5
const LIQ = gradient(["#2a0a4a", "#4c1478", "#7a24a0", "#a63cba"], 6);    // 6-b
const WAX = gradient(["#c2280f", "#ff5a1a", "#ff9a2e", "#ffd25a", "#fff1b0"], 8); // c-j
const METAL = gradient(["#2a2d36", "#5c6270", "#a6adbb", "#eef2f8"], 8);  // k-r
const pal = palette([...ROOM, ...LIQ, ...WAX, ...METAL]);

export const meta = {
  slug: "lava-lamp",
  name: "Lava Lamp",
  category: "things",
  note: "A glowing lamp where blobs of warm wax rise, merge, split and sink through violet liquid.",
  tags: ["retro", "lamp", "groovy", "wallpaper", "hero"],
  cols: 48, rows: 40, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2 - 0.5, gTop = 7, gBot = 31;
  const hw = (y) => { const s = clamp((y - gTop) / (gBot - gTop)); return 3.6 + 7.2 * Math.pow(s, 0.8) * (1 - 0.35 * s ** 4); };
  const blobs = [
    { r: 4.2, per: 17, ph: 0.0, sx: 2.0 },
    { r: 3.4, per: 13, ph: 0.35, sx: 3.0 },
    { r: 3.8, per: 21, ph: 0.6, sx: 2.5 },
    { r: 2.8, per: 11, ph: 0.8, sx: 1.5 },
    { r: 3.5, per: 19, ph: 0.15, sx: 3.5 },
    { r: 2.6, per: 9, ph: 0.5, sx: 2.0 },
    { r: 3.0, per: 15, ph: 0.92, sx: 2.5 },
  ];
  return (t) => {
    const pos = blobs.map((b, i) => {
      const k = (t / b.per + b.ph) % 1;
      // rise slowly, hang near the top, sink back: a smooth periodic path
      const yv = 0.5 - 0.5 * Math.cos(k * TAU);
      const y = gBot - 2 - yv * (gBot - gTop - 6);
      const x = cx + Math.sin(k * TAU * 2 + i) * b.sx * (0.4 + yv);
      return [x, y * 2, b.r * (1 - 0.15 * yv)];
    });
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let ch, co;
      const dl = Math.hypot((x - cx) / 2.2, y - (gTop + gBot) / 2);
      const rv = clamp(Math.exp(-dl / 11) * 0.8 + fbm(x * 0.1, y * 0.2, 2) * 0.15);
      ch = rv > 0.5 ? "▒" : "░"; co = KEYS[Math.min(5, Math.floor(rv * 6))];
      if (y >= gTop && y <= gBot) {
        const w = hw(y), dx = x - cx;
        if (Math.abs(dx) <= w) {
          // metaball field in square space, plus a resting pool at the bottom
          let f = 0;
          for (const [bx, by, r] of pos) { const ddx = x - bx, ddy = y * 2 - by; f += (r * r) / (ddx * ddx + ddy * ddy + 0.01); }
          f += 9 / (((gBot + 1.5 - y) * 2) ** 2 + 0.5) * (1 + 0.3 * Math.sin(x * 0.5 + t));
          if (f > 1) {
            const edge = clamp((f - 1) * 0.9);
            const lit = clamp(0.35 + edge * 0.5 - dx / w * 0.25);
            ch = "█"; co = KEYS[12 + Math.min(7, Math.floor(lit * 8))];
          } else {
            const halo = clamp(f * 0.9);
            const v = clamp(0.25 + halo * 0.6 - Math.abs(dx) / w * 0.2);
            ch = halo > 0.55 ? "▓" : "▒"; co = KEYS[6 + Math.min(5, Math.floor(v * 6))];
            if (halo > 0.75) co = "c";
          }
          if (Math.abs(dx + w * 0.6) < 0.5 && f < 1) { ch = "▒"; co = "q"; }
        } else if (Math.abs(dx) <= w + 1) { ch = "█"; co = dx < 0 ? "o" : "m"; }
      } else if (y < gTop && y >= 1) {
        const w = 2.2 + (y - 1) * 0.3;
        const dx = x - cx;
        if (Math.abs(dx) <= w) { const l = clamp(0.7 - dx / w * 0.4 - (gTop - y) * 0.04); ch = "█"; co = KEYS[20 + Math.floor(l * 7)]; }
      } else if (y > gBot && y < rows - 1) {
        const s = (y - gBot) / (rows - 2 - gBot);
        const w = 6 + s * 7 - (s < 0.25 ? (0.25 - s) * 6 : 0);
        const dx = x - cx;
        if (Math.abs(dx) <= w) { const l = clamp(0.75 - dx / w * 0.45 - s * 0.2); ch = "█"; co = KEYS[20 + Math.floor(l * 7)]; }
      } else if (y === rows - 1) { ch = "▀"; co = "l"; if (Math.abs(x - cx) > 14) { ch = "░"; co = "1"; } }
      g.set(x, y, ch, co);
    }
    return g.frame();
  };
}
