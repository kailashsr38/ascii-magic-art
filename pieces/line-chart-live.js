/* line-chart-live: a live line chart scrolling left, with axes, gridlines and a value tag. */
import { Grid, palette, fbm, noise2 } from "../lib/kit.js";

export const meta = {
  slug: "line-chart-live",
  name: "Live Line Chart",
  category: "live-data",
  note: "A request latency line chart scrolling left in real time, with gridlines, axes and a live value tag.",
  tags: ["chart", "live", "dashboard", "monitoring", "terminal"],
  cols: 76, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#1f3b5c", "#30363d", "#7ee787", "#ffa657", "#0d2440", "#ff7b72", "#2f6aa8", "#a5d6ff"]),
};

const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 7, X1 = cols - 11, Y0 = 3, Y1 = rows - 4;     // plot area cells
  const W = X1 - X0 + 1, H = Y1 - Y0 + 1;
  const dots = new Uint8Array(W * H);
  const LO = 20, HI = 140;
  const sample = (s) => 62 + 55 * (fbm(s * 0.045, 0.5, 4, 9) - 0.5) * 2 + 6 * Math.sin(s * 0.13) + (noise2(s * 0.5, 3, 4) - 0.5) * 4
    + (fbm(s * 0.013, 7, 2, 2) > 0.62 ? 30 : 0);
  return (t) => {
    g.clear();
    dots.fill(0);
    const speed = 6, s0 = t * speed;
    // header
    g.text(1, 0, "p95 latency", "0");
    g.text(13, 0, "api-gateway  eu-west-1", "1");
    const cur = sample(Math.floor(s0) + W * 2 - 1);
    g.text(cols - 20, 0, "● live", "5");
    g.text(cols - 12, 0, cur.toFixed(1).padStart(6) + " ms", "0");
    g.hline(0, cols - 1, 1, "─", "4");
    // gridlines and y labels
    for (let k = 0; k <= 4; k++) {
      const v = LO + (k / 4) * (HI - LO);
      const y = Y1 - Math.round((k / 4) * (H - 1));
      for (let x = X0; x <= X1; x += 2) g.set(x, y, "┄", "4");
      g.text(0, y, String(Math.round(v)).padStart(4), "1");
      g.set(X0 - 2, y, "┤", "1");
    }
    g.vline(X0 - 2, Y0, Y1, "│", "1");
    g.set(X0 - 2, Y1 + 1, "└", "1");
    g.hline(X0 - 1, X1 + 1, Y1 + 1, "─", "1");
    // x labels scroll with time
    const secs = Math.floor(s0 / 2);
    const tickEvery = 10;
    for (let d = 0; d < W * 2 + tickEvery * 2; d++) {
      const sec = secs + d;
      if (sec % tickEvery) continue;
      const x = X0 + Math.round((sec * 2 - s0) / 2);
      if (x < X0 || x > X1 - 6) continue;
      g.set(x, Y1 + 1, "┴", "1");
      const ts = 14 * 3600 + 2 * 60 + sec;
      const hh = Math.floor(ts / 3600) % 24, mm = Math.floor(ts / 60) % 60, ss = ts % 60;
      g.text(x - 3, Y1 + 2, `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`, "1");
    }
    // line into braille dots, with fill below
    const toDy = (v) => Math.round((1 - (v - LO) / (HI - LO)) * (H * 4 - 1));
    let prev = toDy(sample(s0 + Math.floor(0)));
    const top = new Int16Array(W);
    top.fill(H * 4);
    for (let dx = 0; dx < W * 2; dx++) {
      const v = sample(Math.floor(s0) + dx);
      let dy = Math.max(0, Math.min(H * 4 - 1, toDy(v)));
      const a = Math.min(prev, dy), b = Math.max(prev, dy);
      for (let yy = a; yy <= b; yy++) {
        const cx = dx >> 1, cy = yy >> 2;
        dots[cx + cy * W] |= BITS[yy & 3][dx & 1];
      }
      const cx = dx >> 1;
      top[cx] = Math.min(top[cx], dy);
      prev = dy;
    }
    for (let cx = 0; cx < W; cx++) {
      const tc = top[cx] >> 2;
      for (let cy = tc + 1; cy < H; cy++) {
        const d = (cy - tc) / H;
        g.set(X0 + cx, Y0 + cy, d < 0.12 ? "▓" : d < 0.4 ? "▒" : "░", d < 0.12 ? "9" : d < 0.4 ? "3" : "7");
      }
    }
    for (let i = 0; i < W * H; i++) if (dots[i]) g.set(X0 + (i % W), Y0 + Math.floor(i / W), String.fromCharCode(0x2800 + dots[i]), "a");
    // SLO line and live tag
    const sloY = Y0 + (toDy(120) >> 2);
    for (let x = X0; x <= X1; x += 3) g.set(x, sloY, "╌", "8");
    g.text(X1 + 2, sloY, "slo 120", "8");
    const ty = Y0 + (Math.max(0, Math.min(H * 4 - 1, toDy(cur))) >> 2);
    g.text(X1 + 1, ty, "◄" + cur.toFixed(0).padStart(4), cur > 120 ? "8" : "6");
    // footer stats
    g.text(1, rows - 1, "min", "1"); g.text(5, rows - 1, "31.4", "0");
    g.text(12, rows - 1, "avg", "1"); g.text(16, rows - 1, (60 + 6 * Math.sin(t * 0.3)).toFixed(1), "0");
    g.text(23, rows - 1, "max", "1"); g.text(27, rows - 1, "138.2", "0");
    g.text(36, rows - 1, "req/s", "1"); g.text(42, rows - 1, String(1840 + Math.round(120 * Math.sin(t * 0.7))), "0");
    return g.frame();
  };
}
