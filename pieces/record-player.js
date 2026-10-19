/* record-player: a turntable seen from above, the vinyl spinning under the tonearm while notes drift up. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const WOOD = gradient(["#3a1e0c", "#6a3a18", "#9a5a28", "#c58440"], 8);     // 0-7
const VINYL = gradient(["#08080a", "#1a1a20", "#33333d", "#5a5a68", "#9a9aae"], 8); // 8-f
const pal = palette([
  ...WOOD, ...VINYL,
  "#d8342e", "#ff6a4a", "#f2e6c8",   // g h i  label red, label light, label cream
  "#c8ccd4", "#7a808c", "#3a3e48",   // j k l  chrome light, chrome mid, chrome dark
  "#7dffb0", "#ff7ad9", "#ffd84a", "#6ad4ff", // m n o p  notes
  "#5aff6a",                          // q power led
]);

export const meta = {
  slug: "record-player",
  name: "Record Player",
  category: "things",
  note: "A wooden turntable seen from above, the record spinning under the tonearm while music notes drift up.",
  tags: ["music", "vinyl", "retro", "turntable", "hero"],
  cols: 84, rows: 36, fps: 24,
  palette: pal,
};

const NOTE = ["  █▄", "  █ ", "███ ", "▀▀  "];
const NOTE2 = [" ▄▄▄▄", " █  █", "██ ██", "▀▀ ▀▀"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 31, cy = 18, R = 27;
  const px = 68, py = 7; // tonearm pivot
  const base = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const edge = x < 2 || x > cols - 3 || y < 1 || y > rows - 2;
    const grain = fbm(x * 0.04, y * 0.9, 3) + Math.sin(x * 0.2 + fbm(x * 0.1, y * 0.3) * 6) * 0.08;
    const v = clamp(grain * 0.8 + 0.2 - (edge ? 0.35 : 0) - (y / rows) * 0.15);
    base.push([edge ? "█" : v > 0.5 ? "▓" : "▒", KEYS[Math.min(7, Math.floor(v * 8))]]);
  }
  return (t) => {
    for (let i = 0; i < base.length; i++) { g.ch[i] = base[i][0]; g.co[i] = base[i][1]; }
    const rot = t * TAU * (33.3 / 60);
    // platter rim and record
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = (x - cx) / R, dy = (y - cy) / (R * 0.5);
      const d = Math.hypot(dx, dy);
      if (d > 1.06) continue;
      if (d > 1.0) { g.set(x, y, "█", d > 1.03 ? "l" : "k"); continue; }
      const a = Math.atan2(dy, dx);
      if (d < 0.3) {
        const la = (((a - rot) % TAU) + TAU) % TAU;
        let co = "g";
        if (la < 0.9) co = "i";
        else if (Math.abs(d - 0.2) < 0.03) co = "h";
        g.set(x, y, "█", co);
        continue;
      }
      // grooves, with track gaps, a fixed sheen and a little turning texture
      const gap = [0.46, 0.62, 0.78, 0.9].some((r) => Math.abs(d - r) < 0.012);
      const sheen = Math.pow(Math.max(0, Math.cos(a * 2 - 0.9)), 6) * (0.4 + d * 0.5);
      const tex = noise2(Math.cos(a - rot) * d * 8 + 5, Math.sin(a - rot) * d * 8 + 5, 4);
      const v = clamp(0.12 + sheen * 0.75 + (tex - 0.5) * 0.18 + (Math.sin(d * 140) > 0.6 ? 0.08 : 0) + (gap ? 0.3 : 0));
      g.set(x, y, v > 0.5 ? "▓" : v > 0.25 ? "▒" : "█", KEYS[8 + Math.min(7, Math.floor(v * 8))]);
    }
    g.set(cx, cy, "●", "j");
    // tonearm: pivot, counterweight, arm and headshell, slowly tracking inward
    const k = (t % 60) / 60;
    const sr = 0.85 - k * 0.35;
    const sa = -0.35 + k * 0.25;
    const sx = cx + Math.cos(sa) * sr * R, sy = cy + Math.sin(sa) * sr * R * 0.5;
    const ang = Math.atan2((sy - py) * 2, sx - px);
    const cwx = px - Math.cos(ang) * 6, cwy = py - Math.sin(ang) * 3;
    for (let y = py - 2; y <= py + 2; y++) for (let x = px - 4; x <= px + 4; x++)
      if (Math.hypot((x - px) / 4, (y - py) / 2) <= 1) g.set(x, y, "█", Math.hypot((x - px) / 4, (y - py) / 2) < 0.5 ? "j" : "l");
    g.line(px, py, cwx, cwy, "█", "k");
    g.set(Math.round(cwx), Math.round(cwy), "█", "j"); g.set(Math.round(cwx) - 1, Math.round(cwy), "█", "j");
    g.line(px, py, sx, sy, "▓", "j");
    g.set(Math.round(sx), Math.round(sy), "█", "k"); g.set(Math.round(sx) + 1, Math.round(sy), "█", "k");
    g.set(Math.round(sx), Math.round(sy) + 1, "▀", "j");
    // controls
    g.text(66, 30, "33", "i"); g.text(71, 30, "45", "k");
    g.set(66, 31, "▀", "q"); g.set(67, 31, "▀", "q");
    g.set(78, 30, "●", Math.sin(t * 3) > -0.6 ? "q" : "l");
    for (let y = 26; y <= 28; y++) for (let x = 74; x <= 80; x++) if (Math.hypot((x - 77) / 3, (y - 27) / 1.4) <= 1) g.set(x, y, "█", x < 77 ? "j" : "k");
    // notes drifting up and fading
    for (let n = 0; n < 6; n++) {
      const per = 4.5, ph = (t / per + n / 6) % 1;
      const nx = Math.round(48 + n * 3.5 + Math.sin(ph * TAU + n) * 3);
      const ny = Math.round(30 - ph * 30);
      const spr = n % 2 ? NOTE2 : NOTE;
      const c = "mnop"[n % 4];
      if (ph < 0.92) spr.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") g.set(nx + i, ny + j, row[i], c); });
    }
    return g.frame();
  };
}
