/* network-traffic: download and upload graphs scrolling left with live rates and totals. */
import { Grid, palette, fbm, noise2 } from "../lib/kit.js";

export const meta = {
  slug: "network-traffic",
  name: "Network Traffic",
  category: "live-data",
  note: "Download and upload graphs scrolling left on an interface monitor, with live rates, peaks and running totals.",
  tags: ["network", "bandwidth", "monitor", "terminal", "dashboard"],
  cols: 80, rows: 23, fps: 15,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#1f6feb", "#0d2d5e", "#d2a8ff", "#8957e5", "#3b2266", "#7ee787"]),
};

const EIGHTH = " ▁▂▃▄▅▆▇█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols - 12;
  const down = (s) => Math.max(0, Math.pow(fbm(s * 0.05, 1, 4, 3), 1.5) * 2.4 - 0.25 + (noise2(s * 0.7, 2, 9) - 0.5) * 0.12 + (fbm(s * 0.011, 5, 2, 4) > 0.6 ? 0.45 : 0));
  const up = (s) => Math.max(0, Math.pow(fbm(s * 0.07, 8, 3, 6), 1.5) * 1.2 + 0.04 + (noise2(s * 0.9, 7, 2) - 0.5) * 0.1);
  const graph = (y0, h, fn, s0, scale, cTop, cMid, cLow) => {
    for (let i = 0; i < W; i++) {
      const v = Math.min(1, fn(s0 + i) / scale) * h;
      const full = Math.floor(v), part = Math.floor((v - full) * 8);
      for (let k = 0; k < full; k++) g.set(i, y0 + h - 1 - k, "█", k >= full - 1 ? cTop : k > h * 0.4 ? cMid : cLow);
      if (part && full < h) g.set(i, y0 + h - 1 - full, EIGHTH[part], cTop);
    }
    for (let k = 0; k <= 2; k++) {
      const y = y0 + Math.round((k / 2) * (h - 1));
      for (let x = 0; x < W; x += 2) if (g.get(x, y) === " ") g.set(x, y, "·", "2");
      g.set(W, y, "┤", "1");
      g.text(W + 2, y, (scale * 100 * (1 - k / 2)).toFixed(0).padStart(3) + " Mb", "1");
    }
    g.vline(W, y0, y0 + h - 1, "│", "1");
  };
  return (t) => {
    g.clear();
    const s0 = Math.floor(t * 8);
    const dNow = down(s0 + W - 1) * 100, uNow = up(s0 + W - 1) * 100;
    g.text(0, 0, "eth0", "0");
    g.text(5, 0, "192.168.1.24", "1");
    g.text(cols - 26, 0, "interval 0.5s   ", "1");
    g.text(cols - 10, 0, "● capture", "9");
    g.hline(0, cols - 1, 1, "─", "2");
    // download
    g.text(0, 2, "↓ download", "3");
    g.text(13, 2, dNow.toFixed(1).padStart(6) + " Mbit/s", "0");
    graph(3, 8, down, s0, 1.2, "3", "4", "5");
    // upload
    g.text(0, 12, "↑ upload", "6");
    g.text(13, 12, uNow.toFixed(1).padStart(6) + " Mbit/s", "0");
    graph(13, 6, up, s0, 0.8, "6", "7", "8");
    g.hline(0, cols - 1, 20, "─", "2");
    const totD = 18.42 + t * 0.006, totU = 2.11 + t * 0.0011;
    g.text(0, 21, "total", "1"); g.text(7, 21, "↓ " + totD.toFixed(2) + " GB", "3"); g.text(20, 21, "↑ " + totU.toFixed(2) + " GB", "6");
    g.text(36, 21, "peak", "1"); g.text(42, 21, "↓ 141.6", "3"); g.text(51, 21, "↑ 38.2", "6");
    g.text(62, 21, "pkts", "1"); g.text(67, 21, String(8000 + Math.round(dNow * 70)).padStart(6) + "/s", "0");
    const conns = 37 + Math.round(fbm(t * 0.4, 3, 2, 5) * 30);
    g.text(0, 22, "conns", "1"); g.text(7, 22, String(conns), "0");
    g.text(12, 22, "dns 4 ms", "1");
    g.text(23, 22, "drops 0", "1");
    g.text(33, 22, "retrans 0.02%", "1");
    return g.frame();
  };
}
