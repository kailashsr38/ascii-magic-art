/* treemap-shuffle: a disk usage treemap whose boxes grow, shrink and rearrange as folders fill up. */
import { Grid, palette, clamp, smooth } from "../lib/kit.js";

export const meta = {
  slug: "treemap-shuffle",
  name: "Disk Usage Treemap",
  category: "live-data",
  note: "A treemap of disk usage by folder, the boxes growing, shrinking and trading places as caches fill and logs rotate.",
  tags: ["treemap", "disk", "chart", "dashboard", "data", "terminal"],
  cols: 84, rows: 28, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#ff7b72", "#56d4dd", "#f2cc60", "#f778ba", "#30363d", "#17375a", "#1c4a28", "#5a3818", "#40306e", "#5a2020", "#13474a", "#4e3f12", "#58183e"]),
};

const ITEMS = [
  ["node_modules", "2", "b"], [".cache", "3", "c"], ["media", "4", "d"], ["logs", "5", "e"], ["build", "6", "f"],
  ["data", "7", "g"], ["backups", "8", "h"], ["src", "9", "i"], ["docs", "2", "b"], [".git", "3", "c"],
];
// sizes in GB for a few snapshots; the chart blends between them
const SNAP = [
  [18, 12, 9, 6, 5, 7, 4, 1.2, 0.8, 2.1],
  [18, 4, 9.5, 11, 3, 7.5, 4, 1.3, 0.8, 2.2],
  [12, 8, 10, 2, 7, 9, 6, 1.3, 0.9, 2.2],
  [21, 13, 10, 5, 2, 9.5, 6, 1.4, 0.9, 2.3],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 0, Y0 = 2, W = cols, H = rows - 3;
  // ordered split: keeps neighbours together so boxes slide rather than jump
  function layout(ids, v, x, y, w, h, out) {
    if (ids.length === 1) { out.push([ids[0], x, y, w, h]); return; }
    const tot = ids.reduce((a, i) => a + v[i], 0);
    let acc = 0, k = 0;
    while (k < ids.length - 1 && acc + v[ids[k]] <= tot / 2) acc += v[ids[k++]];
    if (k === 0) { acc = v[ids[0]]; k = 1; }
    const f = acc / tot;
    if (w > h * 2) {
      const w1 = w * f;
      layout(ids.slice(0, k), v, x, y, w1, h, out); layout(ids.slice(k), v, x + w1, y, w - w1, h, out);
    } else {
      const h1 = h * f;
      layout(ids.slice(0, k), v, x, y, w, h1, out); layout(ids.slice(k), v, x, y + h1, w, h - h1, out);
    }
  }
  const STEP = 3.2;
  return (t) => {
    g.clear();
    const k = Math.floor(t / STEP), f = smooth(clamp(((t % STEP) - 1.6) / 1.4));
    const A = SNAP[k % 4], B = SNAP[(k + 1) % 4];
    const v = A.map((a, i) => a + (B[i] - a) * f);
    const tot = v.reduce((a, b) => a + b, 0);
    const order = v.map((_, i) => i);
    const out = [];
    layout(order, v, X0, Y0, W, H, out);
    for (const [i, x, y, w, h] of out) {
      const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w) - 1, y1 = Math.round(y + h) - 1;
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (bw < 2 || bh < 2) continue;
      g.fill(x0 + 1, y0 + 1, bw - 2, bh - 2, "░", ITEMS[i][2]);
      g.box(x0, y0, bw, bh, "light", ITEMS[i][1]);
      const name = ITEMS[i][0], gb = v[i].toFixed(1) + " GB", pc = Math.round((v[i] / tot) * 100) + "%";
      if (bh >= 3 && bw > 4) g.text(x0 + 2, y0 + 1, name.length > bw - 4 ? (bw > 6 ? name.slice(0, bw - 6) + ".." : name.slice(0, bw - 4)) : name, "0");
      if (bh >= 4 && bw > gb.length + 3) g.text(x0 + 2, y0 + 2, gb, ITEMS[i][1]);
      if (bh >= 5 && bw > 6) g.text(x0 + 2, y0 + 3, pc, "1");
      // a mini fill bar for big boxes
      if (bh >= 7 && bw > 12) {
        const bar = Math.round((bw - 4) * Math.min(1, v[i] / 22));
        for (let q = 0; q < bw - 4; q++) g.set(x0 + 2 + q, y1 - 1, q < bar ? "━" : "─", q < bar ? ITEMS[i][1] : "a");
      }
    }
    g.text(0, 0, "Disk usage  /srv/app", "0");
    const used = tot.toFixed(1) + " GB of 120 GB";
    g.text(cols - used.length, 0, used, "1");
    const pct = Math.round((tot / 120) * 30);
    for (let q = 0; q < 30; q++) g.set(24 + q, 0, q < pct ? "█" : "░", q < pct ? (tot > 80 ? "4" : "3") : "a");
    return g.frame();
  };
}
