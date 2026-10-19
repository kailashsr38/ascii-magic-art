/* pixel-paint-program: an early black and white paint program drawing a house with shape tools, pattern fills and a spray can. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "pixel-paint-program",
  name: "Monochrome Paint Program",
  category: "retro",
  note: "An early black and white paint program where the cursor drags out a house with the rectangle, line and oval tools, floods it with patterns and sprays grass before clearing the page.",
  tags: ["retro", "paint", "drawing", "pixel art", "app", "hero"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(["#f2f2ee", "#a8a8a4", "#6a6a68", "#3a3a3a", "#1e1e1e", "#ffffff"]),
};

const PW = 82, PH = 50, PERIOD = 20;
const TOOLS = ["□", "○", "/", "~", "A", ":", "▼", "▒", "◇", "◆", "·", "×"];
const PAT = [(x, y) => true, (x, y) => (x + y) % 2 === 0, (x, y) => x % 2 === 0 && y % 2 === 0, (x, y) => (x + y) % 4 === 0,
  (x, y) => y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 4) % 8 === 0, (x, y) => (x - y + 64) % 3 === 0, (x, y) => x % 3 === 0, (x, y) => y % 3 === 0, () => false];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const bm = new Uint8Array(PW * PH); // 1 = ink
  const R = rng(9);
  const spray = Array.from({ length: 420 }, (_, i) => { const k = i / 420; return [Math.round(2 + k * 76 + (R() - 0.5) * 6), Math.round(PH - 2 - R() * R() * 7)]; });
  const ink = (x, y) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < PW && y < PH) bm[x + y * PW] = 1; };
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) ink(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n); };
  const rect = (x0, y0, x1, y1) => { line(x0, y0, x1, y0); line(x1, y0, x1, y1); line(x1, y1, x0, y1); line(x0, y1, x0, y0); };
  const oval = (cx, cy, r) => { for (let i = 0; i < 80; i++) { const a = (i / 80) * Math.PI * 2; ink(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
  const fill = (sx, sy, pat, k) => {
    // flood the paper region from a seed, reveal by distance, painting the pattern
    const dist = new Int16Array(PW * PH).fill(-1);
    const q = [sx + sy * PW]; dist[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % PW, y = (i / PW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= PW || ny >= PH) continue;
        const j = nx + ny * PW;
        if (bm[j] || dist[j] >= 0) continue;
        dist[j] = dist[i] + 1; q.push(j);
      }
    }
    const maxD = dist[q[q.length - 1]] || 1;
    for (const i of q) if (dist[i] <= k * maxD && PAT[pat](i % PW, (i / PW) | 0)) bm[i] = 2;
  };
  // ops: [start, end, tool, draw(k) , cursor(k)]
  const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const OPS = [
    [0.4, 2.0, 0, (k) => { const p = lerp2([10, 20], [40, 46], k); rect(10, 20, p[0], p[1]); }, (k) => lerp2([10, 20], [40, 46], k)],
    [2.4, 3.2, 2, (k) => { const p = lerp2([10, 20], [25, 7], k); line(10, 20, p[0], p[1]); }, (k) => lerp2([10, 20], [25, 7], k)],
    [3.3, 4.1, 2, (k) => { line(10, 20, 25, 7); const p = lerp2([25, 7], [40, 20], k); line(25, 7, p[0], p[1]); }, (k) => lerp2([25, 7], [40, 20], k)],
    [4.4, 5.6, 1, (k) => oval(64, 12, 1 + k * 7), (k) => [64 + (1 + k * 7) * 0.7, 12 + (1 + k * 7) * 0.7]],
    [5.9, 6.9, 0, (k) => { const p = lerp2([22, 32], [29, 46], k); rect(22, 32, p[0], p[1]); }, (k) => lerp2([22, 32], [29, 46], k)],
    [7.2, 8.6, 6, (k) => fill(14, 25, 4, k), () => [14, 25]],
    [8.9, 10.2, 6, (k) => fill(25, 15, 5, k), () => [25, 15]],
    [10.4, 11.4, 6, (k) => fill(64, 12, 1, k), () => [64, 12]],
    [11.7, 14.0, 5, (k) => { const n = Math.floor(k * spray.length); for (let i = 0; i < n; i++) ink(spray[i][0], spray[i][1]); }, (k) => [2 + k * 76, PH - 5]],
    [14.2, 15.6, 3, (k) => { const pts = [[50, 26], [53, 29], [56, 26], [59, 29], [62, 26]]; const n = k * 4; for (let i = 0; i < Math.floor(n); i++) line(...pts[i], ...pts[i + 1]); if (n < 4) { const i = Math.floor(n); const p = lerp2(pts[i], pts[i + 1], n - i); line(...pts[i], p[0], p[1]); } },
      (k) => { const pts = [[50, 26], [53, 29], [56, 26], [59, 29], [62, 26]]; const n = Math.min(3.999, k * 4), i = Math.floor(n); return lerp2(pts[i], pts[i + 1], n - i); }],
  ];
  const CLEAR = 18.2;
  const CX0 = 12, CY0 = 3;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    bm.fill(0);
    let tool = 0, cur = [5, 5];
    for (const [a, b, tl, draw, cursor] of OPS) {
      if (lt < a) break;
      const k = Math.min(1, (lt - a) / (b - a));
      draw(k); tool = tl; cur = cursor(k);
    }
    // wipe: Edit, Clear
    let wipeRow = PH;
    if (lt > CLEAR) wipeRow = Math.floor(((lt - CLEAR) / 1.2) * PH);
    if (lt > CLEAR) for (let y = 0; y < Math.min(PH, wipeRow); y++) for (let x = 0; x < PW; x++) bm[x + y * PW] = 0;
    // desktop
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, (x + y) % 2 ? "▒" : "░", "3");
    // menu bar
    g.fill(0, 0, W, 1, " ");
    g.text(1, 0, "File  Edit  Goodies  Font  FontSize  Style", "0");
    if (lt > CLEAR - 0.8 && lt < CLEAR + 0.4) g.text(7, 0, "Edit", "5");
    g.text(W - 10, 0, "PAINT", "1");
    g.fill(0, 1, W, 1, "▀", "2");
    // canvas window
    const WX = CX0 - 1, WY = CY0 - 1, WW = PW + 2, WH = PH / 2 + 2;
    g.fill(WX, WY, WW, WH, " ");
    g.box(WX, WY, WW, WH, "light", "0");
    g.text(WX + 1, WY, "≡".repeat(WW - 2), "1");
    g.text(WX + Math.floor(WW / 2) - 6, WY, " untitled ", "0");
    for (let cy = 0; cy < PH / 2; cy++) for (let cx = 0; cx < PW; cx++) {
      const a = bm[cx + cy * 2 * PW] === 0, b = bm[cx + (cy * 2 + 1) * PW] === 0;
      g.set(CX0 + cx, CY0 + cy, a && b ? "█" : a ? "▀" : b ? "▄" : " ", "0");
    }
    // cursor
    const cxc = CX0 + Math.round(cur[0]), cyc = CY0 + Math.round(cur[1] / 2);
    if (lt < CLEAR - 1) g.set(cxc, cyc, tool === 6 ? "▼" : tool === 5 ? ":" : "+", "3");
    else g.set(9, 0, "↖", "5");
    // tool palette
    g.fill(0, 2, 10, 20, " ");
    TOOLS.forEach((tg, i) => {
      const x = 1 + (i % 2) * 4, y = 3 + Math.floor(i / 2) * 3;
      const on = i === tool && lt < CLEAR - 1;
      g.text(x, y, on ? "▛▀▜" : "┌─┐", on ? "5" : "2");
      g.text(x, y + 1, (on ? "▌" : "│") + tg + (on ? "▐" : "│"), on ? "5" : "1");
      g.text(x, y + 2, on ? "▙▄▟" : "└─┘", on ? "5" : "2");
    });
    // line widths and patterns
    g.text(1, 22, "─── ━━━", "1");
    const PY = H - 3;
    g.fill(0, PY, W, 3, " ");
    g.text(1, PY, "▓▓▓", "0"); g.text(1, PY + 1, "▓▓▓", "0");
    for (let i = 0; i < PAT.length + 7; i++) {
      const p = i % PAT.length;
      for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 6; xx++) {
        const on = PAT[p](xx, yy * 2), on2 = PAT[p](xx, yy * 2 + 1);
        g.set(7 + i * 5 + xx, PY + yy, !on && !on2 ? "█" : !on ? "▀" : !on2 ? "▄" : " ", "0");
      }
      g.set(7 + i * 5 + 4, PY, " "); g.set(7 + i * 5 + 4, PY + 1, " ");
    }
    return g.frame();
  };
}
