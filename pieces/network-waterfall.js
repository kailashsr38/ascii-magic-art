/* network-waterfall: a browser network panel filling a waterfall of request timings as a page loads. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "network-waterfall",
  name: "Request Waterfall",
  category: "screens",
  note: "A browser network panel where requests appear as a page loads, each with queue, connect, wait and download segments on a waterfall.",
  tags: ["network", "performance", "devtools", "developer", "web", "dashboard"],
  cols: 104, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

// name, type, status, size kB, start ms, [queue, dns, connect, wait, download]
const REQ = [
  ["shop.example.dev", "document", 200, 14.2, 0, [2, 18, 34, 96, 22]],
  ["main.4f2a1c.css", "stylesheet", 200, 38.6, 190, [4, 0, 0, 41, 30]],
  ["app.9b31e7.js", "script", 200, 212.4, 192, [5, 0, 0, 44, 120]],
  ["vendor.c08d2f.js", "script", 200, 318.0, 194, [8, 0, 0, 52, 168]],
  ["inter-var.woff2", "font", 200, 96.1, 240, [30, 0, 0, 38, 44]],
  ["hero-1600.avif", "image", 200, 142.7, 260, [12, 22, 40, 61, 96]],
  ["logo.svg", "image", 304, 0.2, 262, [14, 0, 0, 33, 2]],
  ["api/session", "fetch", 200, 1.1, 520, [2, 0, 0, 88, 4]],
  ["api/products?limit=24", "fetch", 200, 18.4, 524, [3, 0, 0, 142, 18]],
  ["thumb-0811.avif", "image", 200, 22.0, 690, [6, 0, 0, 40, 26]],
  ["thumb-0812.avif", "image", 200, 19.7, 692, [8, 0, 0, 44, 24]],
  ["thumb-0813.avif", "image", 200, 24.3, 694, [10, 0, 0, 46, 30]],
  ["analytics/collect", "ping", 204, 0.0, 820, [4, 16, 28, 34, 0]],
  ["api/cart", "fetch", 401, 0.3, 860, [2, 0, 0, 61, 2]],
  ["sw.js", "script", 200, 6.8, 1040, [3, 0, 0, 29, 8]],
];
const SEGC = ["7", "a", "4", "2", "3"];
const DCL = 760, LOAD = 1180, SPAN = 1400;
const PERIOD = 9;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const WX = 64, WW = W - WX - 2;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const now = Math.min(SPAN, Math.max(0, (lt - 0.5) / 5) * SPAN); // ms of page time
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Network ", "0");
    g.text(12, 0, " ● Preserve log  □ Disable cache ", "1");
    const tabs = ["All", "Fetch/XHR", "Doc", "CSS", "JS", "Font", "Img", "Media", "WS"];
    let x = 2;
    tabs.forEach((n, i) => { g.text(x, 1, n, i === 0 ? "3" : "1"); x += n.length + 2; });
    g.text(2, 2, "Name".padEnd(23) + "Status".padEnd(10) + "Type".padEnd(11) + "Size".padStart(9) + "Time".padStart(8), "0");
    g.text(WX, 2, "Waterfall", "0");
    // time ticks
    for (let ms = 0; ms < SPAN; ms += 400) {
      const tx = WX + Math.round((ms / SPAN) * WW);
      g.text(Math.min(W - 6, tx), 3, ms === 0 ? "0" : ms + "", "7");
    }
    g.hline(1, W - 2, 4, "─", "8");
    let count = 0, bytes = 0, finish = 0;
    REQ.forEach(([name, type, status, kb, start, segs], i) => {
      if (now < start) return;
      const y = 5 + count;
      count++;
      const dur = segs.reduce((a, b) => a + b, 0);
      const done = now >= start + dur;
      if (done) { bytes += kb; finish = Math.max(finish, start + dur); }
      g.text(2, y, name.slice(0, 22), status >= 400 ? "5" : "0");
      g.text(25, y, done ? String(status) : "(pending)", status >= 400 ? "5" : status === 304 ? "1" : done ? "2" : "9");
      g.text(35, y, type.slice(0, 10), "1");
      g.text(46, y, done ? (kb < 1 ? (kb * 1000).toFixed(0) + " B" : kb.toFixed(1) + " kB").padStart(9) : "".padStart(9), "1");
      g.text(56, y, done ? (dur + "ms").padStart(7) : "", dur > 200 ? "4" : "1");
      // bar
      let ms = start;
      segs.forEach((s, k) => {
        if (!s) return;
        const a = ms, b = Math.min(now, ms + s);
        if (b > a) {
          const x0 = WX + Math.floor((a / SPAN) * WW), x1 = WX + Math.max(Math.floor((a / SPAN) * WW), Math.ceil((b / SPAN) * WW) - 1);
          for (let xx = x0; xx <= x1; xx++) g.set(xx, y, k === 0 ? "▫" : "█", SEGC[k]);
        }
        ms += s;
      });
    });
    // DCL and load lines
    const lineAt = (ms, c, lab, ly, left = false) => {
      if (now < ms) return;
      const lx = WX + Math.round((ms / SPAN) * WW);
      for (let y = 5; y < H - 4; y++) if (g.get(lx, y) === " ") g.set(lx, y, "│", c);
      // label right of its line, or left of it when it would not fit (never across another line)
      g.text(!left && lx + 1 + lab.length <= W - 2 ? lx + 1 : lx - lab.length, ly, lab, c);
    };
    lineAt(DCL, "3", "DOMContentLoaded", H - 5, true);
    lineAt(LOAD, "5", "Load", H - 6);
    // now cursor
    if (now < SPAN) { const cx = WX + Math.round((now / SPAN) * WW); g.set(cx, 3, "▼", "9"); }
    g.hline(1, W - 2, H - 4, "─", "8");
    g.text(2, H - 3, `${count} requests  |  ${bytes.toFixed(0)} kB transferred  |  Finish: ${(finish / 1000).toFixed(2)} s`, "0");
    if (now >= DCL) g.text(2, H - 2, `DOMContentLoaded: ${DCL} ms`, "3");
    if (now >= LOAD) g.text(30, H - 2, `Load: ${(LOAD / 1000).toFixed(2)} s`, "5");
    const leg = [["queue", "7", "▫"], ["dns", "a", "█"], ["connect", "4", "█"], ["waiting", "2", "█"], ["download", "3", "█"]];
    let lx = W - 52;
    leg.forEach(([n, c, ch]) => { g.set(lx, H - 2, ch, c); g.text(lx + 2, H - 2, n, "1"); lx += n.length + 4; });
    return g.frame();
  };
}
