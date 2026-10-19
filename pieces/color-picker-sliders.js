/* color-picker-sliders: a colour picker with a hue strip, saturation field and sliders whose swatch and codes update live. */
import { Grid, palette, hsl } from "../lib/kit.js";

const HUES = 24;
const hueCols = Array.from({ length: HUES }, (_, i) => hsl((i / HUES) * 360, 80, 58));
const UI = ["#e6edf3", "#8b949e", "#484f58", "#30363d", "#79c0ff"];

export const meta = {
  slug: "color-picker-sliders",
  name: "Color Picker Sliders",
  category: "screens",
  note: "A colour picker where the hue strip, the shade field and the RGB sliders move together and the swatch and hex code follow.",
  tags: ["color", "picker", "design", "sliders", "app", "tool"],
  cols: 72, rows: 22, fps: 24,
  palette: palette([...UI, ...hueCols]),
};
// keys: 0-4 ui, then 24 hue colours for the strip, field and swatch

const KEY = (i) => "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[i];
const PERIOD = 16;
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // hue drifts in eased stops, saturation/lightness wander
    const stops = [0.58, 0.95, 0.12, 0.33, 0.58];
    const seg = lt / (PERIOD / 4), si = Math.floor(seg), k = seg - si;
    const e = k < 0.3 ? 0 : k > 0.75 ? 1 : (k - 0.3) / 0.45;
    const ee = e * e * (3 - 2 * e);
    let hu = stops[si] + (stops[si + 1] - stops[si]) * ee;
    hu = ((hu % 1) + 1) % 1;
    const sat = 0.55 + 0.35 * Math.sin(t * 0.7);
    const lig = 0.5 + 0.15 * Math.sin(t * 0.9 + 1);
    const hex = hsl(hu * 360, sat * 100, lig * 100);
    const [r, gg, b] = hex2rgb(hex);
    const hk = KEY(5 + Math.round(hu * HUES) % HUES);
    g.box(0, 0, W, H, "round", "2");
    g.text(2, 0, " Fill colour ", "0");
    // SV field: shade glyphs with the hue colour
    const fx = 3, fy = 2, fw = 36, fh = 12;
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const s = x / (fw - 1), br = 1 - y / (fh - 1);
      const ch = br > 0.8 ? "█" : br > 0.6 ? "▓" : br > 0.4 ? "▒" : br > 0.2 ? "░" : "·";
      const c = br < 0.25 ? "3" : s < 0.15 ? (br > 0.55 ? "0" : "1") : s < 0.3 ? "1" : hk;
      g.set(fx + x, fy + y, s < 0.3 && s >= 0.15 && br > 0.55 ? "▒" : ch, c);
    }
    const px = fx + Math.round(sat * (fw - 1)), py = fy + Math.round((1 - (lig - 0.3) / 0.4) * (fh - 1));
    g.set(px - 1, py, "(", "0"); g.set(px, py, "○", "0"); g.set(px + 1, py, ")", "0");
    // hue strip
    const hy = fy + fh + 1;
    for (let x = 0; x < fw; x++) g.set(fx + x, hy, "█", KEY(5 + Math.floor((x / fw) * HUES)));
    const hx = fx + Math.round(hu * (fw - 1));
    g.set(hx, hy - 1, "▼", "0"); g.set(hx, hy + 1, "▲", "0");
    // right panel
    const rx = 43;
    g.text(rx, 2, "Preview", "1");
    for (let y = 0; y < 4; y++) g.text(rx, 3 + y, "██████████████", hk);
    g.text(rx + 15, 3, "▓▓▓▓", hk); g.text(rx + 15, 4, "▒▒▒▒", hk); g.text(rx + 15, 5, "░░░░", hk);
    g.text(rx, 8, "HEX", "1"); g.box(rx + 5, 7, 12, 3, "round", "4"); g.text(rx + 7, 8, hex.toUpperCase(), "0");
    const rows = [["R", r], ["G", gg], ["B", b], ["A", 255]];
    rows.forEach(([n, v], i) => {
      const y = 11 + i * 2, sw = 16, kx = Math.round((v / 255) * (sw - 1));
      g.text(rx, y, n, "1");
      for (let x = 0; x < sw; x++) g.set(rx + 2 + x, y, x === kx ? "●" : x < kx ? "━" : "─", x === kx ? "0" : x < kx ? hk : "3");
      g.text(rx + 20, y, String(v).padStart(3), "0");
    });
    g.text(3, H - 3, "Recent", "1");
    [0.0, 0.12, 0.33, 0.55, 0.72, 0.88].forEach((h, i) => g.text(10 + i * 4, H - 3, "██", KEY(5 + Math.floor(h * HUES))));
    g.text(rx, H - 3, `hsl(${Math.round(hu * 360)}, ${Math.round(sat * 100)}%, ${Math.round(lig * 100)}%)`, "1");
    return g.frame();
  };
}
