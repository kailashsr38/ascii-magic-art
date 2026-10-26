/* contributors-wall: little pixel avatars fill a wall one by one, each a different face, with a thank-you. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "contributors-wall",
  name: "Contributors Wall",
  category: "occasions",
  note: "Tiny pixel avatars pop onto a wall one by one, every face different, until the contributor count lands and a thank-you appears.",
  tags: ["contributors", "open-source", "thank-you", "readme", "community", "avatars", "github", "team"],
  cols: 90, rows: 28, fps: 20,
  loop: 12,
  palette: palette([
    "#0d1117", "#e6edf3", "#8b949e", "#30363d",
    "#f2c9a0", "#d9a27a", "#a8704a", "#6e4630",          // skin 4-7
    "#2b1d14", "#7a4a2a", "#e0b04a", "#b24a2a", "#9aa0a6", // hair 8-c
    "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#ff7b72", "#f778ba", "#ffd75e", // backgrounds d-j
  ]),
};

const LOOP = 12, COLS = 9, ROWS = 3, AW = 8, AH = 6;

export default function create() {
  const g = new Grid(meta.cols, meta.rows), W = meta.cols;
  const r = rng(42);
  // one avatar per slot: background, skin, hair style and colour, glasses
  const people = Array.from({ length: COLS * ROWS }, () => ({
    bg: "dfghij"[Math.floor(r() * 7)] || "d", skin: "4567"[Math.floor(r() * 4)], hair: "89abc"[Math.floor(r() * 5)],
    style: Math.floor(r() * 4), glasses: r() < 0.3, smile: r() < 0.7,
  }));
  const order = people.map((_, i) => i).sort((a, b) => ((a * 7919) % 31) - ((b * 7919) % 31));
  const X0 = Math.round((W - COLS * (AW + 1) + 1) / 2), Y0 = 2;

  const avatar = (x, y, p, s) => {
    // s: 0..1 pop-in scale (shown as growing from the centre)
    const sh = Math.max(1, Math.round(AH * s)), sw = Math.max(1, Math.round(AW * s));
    const ox = x + Math.floor((AW - sw) / 2), oy = y + Math.floor((AH - sh) / 2);
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) g.set(ox + i, oy + j, "█", p.bg);
    if (s < 0.95) return;
    // face, rows 1..5 of the 6, cols 2..5 of 8
    for (let j = 2; j < 6; j++) for (let i = 2; i < 6; i++) g.set(x + i, y + j, "█", p.skin);
    // hair
    const hair = [[1, 2, 6], [2, 1, 2], [2, 6, 7]];
    if (p.style === 0) hair.push([2, 2, 6]);
    if (p.style === 1) hair.push([3, 1, 2], [3, 6, 7], [4, 1, 2], [4, 6, 7]);
    if (p.style === 2) hair.push([0, 3, 5]);
    for (const [row, a, b] of hair) for (let i = a; i < b; i++) g.set(x + i, y + row, row === 1 || row === 0 ? "▄" : "█", p.hair);
    if (p.style === 3) for (let i = 2; i < 6; i++) g.set(x + i, y + 1, "▀", p.hair);
    // eyes, glasses, mouth
    g.set(x + 3, y + 3, p.glasses ? "o" : "▪", "0"); g.set(x + 4, y + 3, p.glasses ? "o" : "▪", "0");
    if (p.glasses) g.set(x + 2, y + 3, "-", "0"), g.set(x + 5, y + 3, "-", "0");
    g.set(x + 3, y + 5, p.smile ? "▀" : "▄", "7"); g.set(x + 4, y + 5, p.smile ? "▀" : "▄", "7");
  };

  return (t) => {
    g.clear();
    // opens on the full wall, then clears and fills again
    const ph = (((t + 7) % LOOP) + LOOP) % LOOP;
    const per = 0.22, start = 0.5;
    order.forEach((idx, k) => {
      const a = ph - (start + k * per);
      if (a <= 0) return;
      const s = Math.min(1, a / 0.25);
      const col = idx % COLS, row = Math.floor(idx / COLS);
      avatar(X0 + col * (AW + 1), Y0 + row * (AH + 1), people[idx], s);
    });
    const shown = order.filter((_, k) => ph > start + k * per).length;
    const line = `${shown} contributors`;
    g.text(Math.round((W - line.length) / 2), Y0 + ROWS * (AH + 1) + 1, line, "1");
    if (shown === order.length) {
      const msg = "thank you for building this with us";
      g.text(Math.round((W - msg.length) / 2), Y0 + ROWS * (AH + 1) + 3, msg, "j");
    }
    return g.frame();
  };
}
