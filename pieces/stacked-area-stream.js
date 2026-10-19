/* stacked-area-stream: a stacked area chart of traffic by region scrolling left as new samples stream in. */
import { Grid, palette, noise2, clamp } from "../lib/kit.js";

export const meta = {
  slug: "stacked-area-stream",
  name: "Stacked Area Stream",
  category: "live-data",
  note: "A stacked area chart of requests per second from four regions, new samples streaming in on the right while the history slides away to the left.",
  tags: ["area", "chart", "stream", "dashboard", "monitoring", "data"],
  cols: 84, rows: 26, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#30363d", "#484f58", "#1f4a7a", "#2a5a34", "#7a4a1e", "#4a3a72"]),
};

const REG = [["us-east", "2", "8"], ["eu-west", "3", "9"], ["ap-south", "4", "a"], ["sa-east", "5", "b"]];
const PART = " ▁▂▃▄▅▆▇█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 7, X1 = cols - 2, Y0 = 3, Y1 = rows - 3, H = Y1 - Y0;
  const sample = (i, k) => {
    const base = [1.0, 0.75, 0.55, 0.3][k];
    const day = 0.75 + 0.25 * Math.sin(i * 0.05 + k * 1.3);
    const spike = Math.max(0, noise2(i * 0.3, k * 9, 5) - 0.72) * 3;
    return base * day * (0.8 + 0.4 * noise2(i * 0.12, k * 5.1, 2)) + spike * base;
  };
  return (t) => {
    g.clear();
    const head = Math.floor(t * 8);
    const n = X1 - X0;
    const cols4 = [];
    let mx = 0;
    for (let c = 0; c <= n; c++) {
      const i = head - n + c;
      const v = REG.map((_, k) => sample(i, k));
      cols4.push(v);
      mx = Math.max(mx, v[0] + v[1] + v[2] + v[3]);
    }
    const top = 4.2;
    const scale = H / top;
    // gridlines and axis
    for (let q = 0; q <= 4; q++) {
      const y = Y1 - Math.round((q / 4) * H);
      for (let x = X0; x <= X1; x += 2) g.set(x, y, "·", "6");
      g.text(0, y, String(Math.round(q * top * 250)).padStart(5) + " ", "1");
    }
    for (let c = 0; c <= n; c++) {
      const x = X0 + c;
      const bounds = [];
      let acc = 0;
      for (let k = 0; k < 4; k++) { acc += cols4[c][k]; bounds.push(acc * scale); }
      const tot = bounds[3];
      for (let y = Y1; y >= Y0 - 1; y--) {
        const lo = Y1 - y, mid = lo + 0.5;
        if (mid < tot) {
          let k = 0;
          while (k < 3 && mid > bounds[k]) k++;
          g.set(x, y, "█", REG[k][1]);
        } else {
          const cover = tot - lo;
          if (cover > 0.06) g.set(x, y, PART[Math.max(1, Math.round(cover * 8))], REG[3][1]);
          break;
        }
      }
    }
    // latest point marker and readout
    const last = cols4[n];
    const total = last.reduce((a, b) => a + b, 0);
    g.vline(X1, Y0, Y1, "│", "7");
    g.hline(X0, X1, Y1 + 1, "─", "7");
    for (let k = 0; k < 6; k++) {
      const x = X1 - k * 15;
      const secs = k * 15 / 8;
      if (x > X0) g.text(x - 3, Y1 + 2, k === 0 ? "now" : ("-" + secs.toFixed(0) + "s").padStart(4), "1");
    }
    g.text(1, 0, "Requests per second by region", "0");
    g.text(cols - 16, 0, "total " + String(Math.round(total * 250)).padStart(5), "0");
    let lx = 1;
    REG.forEach(([name, c], k) => {
      g.text(lx, 1, "■", c); g.text(lx + 2, 1, name, "1");
      const v = String(Math.round(last[k] * 250));
      g.text(lx + 3 + name.length, 1, v, "0");
      lx += name.length + v.length + 6;
    });
    return g.frame();
  };
}
