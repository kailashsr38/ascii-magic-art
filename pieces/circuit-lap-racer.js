/* circuit-lap-racer: four cars racing laps around a top-down circuit with a live standings board. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const GRASS = add(gradient(["#1a4a1e", "#24622a", "#2e7a32", "#3c923e"], 6));
const TREE = add(["#0e2e12", "#1a4a1a", "#2a6a26"]);
const ROAD = add(["#2c2e34", "#383b42", "#46494f", "#5a5d64"]);
const KERB = add(["#e83a3a", "#f4f4f4"]);
const LINE = add(["#ffffff", "#101010", "#e8d44a"]);
const CARS = add(["#ff4a4a", "#4aa8ff", "#ffd23a", "#7af07a"]);
const CARD = add(["#9a1a1a", "#1a5aa8", "#a8841a", "#2a9a3a"]);
const STAND = add(["#5a5f6a", "#8a8f9a", "#c8ccd4", "#e85a5a", "#5a8ae8", "#f4d04a"]);
const UI = add(["#0d1117", "#30363d", "#e6edf3", "#8b949e", "#ffa657"]);
const DUST = add(["#8a8070", "#b4aa98"]);

export const meta = {
  slug: "circuit-lap-racer",
  name: "Circuit Lap Racer",
  category: "arcade",
  note: "Four cars race lap after lap around a top-down circuit, braking into the corners and trading places while the standings update.",
  tags: ["racing", "cars", "game", "top-down", "retro", "dashboard"],
  cols: 86, rows: 32, fps: 24,
  palette: palette(P),
};

const N = 720, TW = 62;
const DRIVERS = ["ROSSO", "BLUE", "GIALLO", "VERDE"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 31, cy = 16.5;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const r = 1 + 0.18 * Math.cos(2 * a) + 0.12 * Math.sin(3 * a + 0.6);
    const x = cx + Math.cos(a) * 25 * r;
    const y = cy + Math.sin(a) * 12.2 * r + Math.sin(2 * a) * 1.5;
    pts.push([x, y]);
  }
  {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (const p of pts) { p[0] = 5 + ((p[0] - x0) / (x1 - x0)) * (TW - 11); p[1] = 3 + ((p[1] - y0) / (y1 - y0)) * (rows - 6.5); }
  }
  // arc length + curvature for braking
  const segLen = [], curv = [];
  let total = 0;
  for (let i = 0; i < N; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % N];
    const l = Math.hypot(x1 - x0, (y1 - y0) * 2); segLen.push(l); total += l;
  }
  for (let i = 0; i < N; i++) {
    const a = pts[(i + N - 6) % N], b = pts[i], c = pts[(i + 6) % N];
    const h1 = Math.atan2((b[1] - a[1]) * 2, b[0] - a[0]), h2 = Math.atan2((c[1] - b[1]) * 2, c[0] - b[0]);
    let d = h2 - h1; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    curv.push(Math.abs(d));
  }
  // time to travel each segment at a curvature-limited speed: gives a lap time table
  const tcum = [0];
  for (let i = 0; i < N; i++) {
    let c = 0; for (let k = -10; k <= 10; k++) c = Math.max(c, curv[(i + k + N) % N] * (1 - Math.abs(k) / 14));
    tcum.push(tcum[i] + segLen[i] / (1 - Math.min(0.55, c * 2.2)));
  }
  const lapT = tcum[N];
  const uAt = (tt) => { // lap fraction for a "time on track" value
    const f = ((tt % lapT) + lapT) % lapT;
    let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tcum[m] <= f) lo = m; else hi = m; }
    return lo + (f - tcum[lo]) / (tcum[lo + 1] - tcum[lo]);
  };
  // static field
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < TW; x++) {
    let best = 1e9, bi = 0;
    for (let i = 0; i < N; i += 2) { const d = Math.hypot(x + 0.5 - pts[i][0], (y + 0.5 - pts[i][1]) * 2); if (d < best) { best = d; bi = i; } }
    let ch, co;
    if (best < 4.6) {
      const n = noise2(x * 0.7, y * 1.3, 2);
      ch = n > 0.55 ? "▓" : "▒"; co = KEYS[ROAD + 1 + Math.floor(n * 2.9)];
      if (bi < 6 || bi > N - 6) { ch = (x + y) % 2 ? "▀" : "▄"; co = KEYS[LINE + ((x + y) % 2)]; }
      else if (best < 0.7 && Math.floor(bi / 14) % 2 === 0) { ch = "·"; co = KEYS[LINE + 2]; }
    } else if (best < 6) {
      ch = "█"; co = KEYS[KERB + (Math.floor(bi / 10) % 2)];
    } else {
      const n = fbm(x * 0.12, y * 0.25, 3, 7);
      const tree = n > 0.62 && best > 8;
      const stripe = Math.floor((x + y * 0.3) / 4) % 2;
      ch = tree ? (n > 0.72 ? "█" : "▓") : stripe ? "▒" : "▓";
      co = tree ? KEYS[TREE + (n > 0.72 ? 2 : 1)] : KEYS[GRASS + 1 + stripe + Math.floor(n * 3)];
    }
    bg.push([ch, co]);
  }
  // grandstand by the start straight (top right of the infield bottom?)
  const sx = Math.round(cx) - 6, sy = Math.round(cy) - 2;
  const cars = [
    { base: 1.0, amp: 0.035, ph: 0.0, lane: -1.6 },
    { base: 1.012, amp: 0.05, ph: 1.7, lane: 1.6 },
    { base: 0.992, amp: 0.045, ph: 3.1, lane: -0.5 },
    { base: 1.006, amp: 0.06, ph: 4.4, lane: 0.6 },
  ];
  const speed = 24, RP = 240; // pace differences swing back and forth so gaps never run away
  return (t) => {
    for (let y = 0; y < rows; y++) for (let x = 0; x < TW; x++) { const [c, k] = bg[y * TW + x]; g.set(x, y, c, k); }
    for (let y = 0; y < rows; y++) for (let x = TW; x < cols; x++) g.set(x, y, " ", KEYS[UI]);
    // grandstand with a crowd doing a slow wave
    for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
      const x = sx + i, y = sy + j;
      if (x >= TW - 1) continue;
      const up = Math.sin(i * 0.6 - t * 3 + j * 0.3) > 0.7;
      g.set(x, y, j === 3 ? "▀" : up ? "●" : "•", j === 3 ? KEYS[STAND + 1] : KEYS[STAND + 3 + ((i * 7 + j * 3) % 3)]);
    }
    const state = cars.map((c, i) => {
      const tt = t * speed + (c.base - 1) * speed * (RP / TAU) * Math.sin((TAU * t) / RP) * 4 + Math.sin(t * 0.21 + c.ph) * 10 * c.amp * speed + i * -9;
      const u = uAt(tt);
      const lap = Math.floor(tt / lapT);
      return { i, u, lap, tt };
    });
    // draw dust then cars
    for (const s of state) {
      const c = cars[s.i];
      const iu = Math.floor(s.u) % N;
      const [x0, y0] = pts[iu], [x1, y1] = pts[(iu + 4) % N];
      let hx = x1 - x0, hy = (y1 - y0) * 2; const hl = Math.hypot(hx, hy) || 1; hx /= hl; hy /= hl;
      const lane = c.lane + Math.sin(t * 0.5 + c.ph) * 0.8;
      const px = x0 - hy * lane, py = y0 + (hx * lane) / 2;
      if (curv[iu] > 0.14) for (let k = 2; k <= 4; k++) g.set(px - hx * k * 1.2, py - (hy * k * 1.2) / 2, k < 4 ? "░" : "·", KEYS[DUST + (k < 3 ? 1 : 0)]);
      for (let k = -1.5; k <= 1.5; k += 0.5) for (let w = -0.9; w <= 0.9; w += 0.9) {
        const x = px + hx * k - hy * w, y = py + (hy * k + hx * w) / 2;
        g.set(x, y, k >= 1.5 ? "█" : k <= -1.5 ? "▓" : w === 0 ? "█" : "▓", KEYS[(k <= -1 || w !== 0 ? CARD : CARS) + s.i]);
      }
      g.set(px + hx * 2.2, py + hy * 1.1, Math.abs(hy) > 1.2 * Math.abs(hx) ? (hy > 0 ? "▼" : "▲") : hx > 0 ? "►" : "◄", KEYS[CARS + s.i]);
    }
    // standings
    const order = state.slice().sort((a, b) => b.tt - a.tt);
    const lead = order[0];
    g.box(TW + 1, 0, cols - TW - 2, rows, "round", KEYS[UI + 1]);
    g.text(TW + 3, 1, "GRAND PRIX", KEYS[UI + 4]);
    g.text(TW + 3, 2, "LAP " + String(1 + (lead.lap % 20)).padStart(2, " ") + " / 20", KEYS[UI + 2]);
    g.hline(TW + 2, cols - 3, 3, "─", KEYS[UI + 1]);
    g.text(TW + 3, 4, "POS DRIVER   GAP", KEYS[UI + 3]);
    order.forEach((s, p) => {
      const y = 6 + p * 2;
      g.text(TW + 3, y, " " + (p + 1), KEYS[UI + 2]);
      g.text(TW + 6, y, "██", KEYS[CARS + s.i]);
      g.text(TW + 9, y, DRIVERS[s.i].padEnd(7, " "), KEYS[UI + 2]);
      const gap = p === 0 ? "LEAD" : "+" + ((lead.tt - s.tt) / speed).toFixed(1);
      g.text(cols - 3 - gap.length, y, gap, p === 0 ? KEYS[LINE + 2] : KEYS[UI + 3]);
    });
    g.hline(TW + 2, cols - 3, 14, "─", KEYS[UI + 1]);
    g.text(TW + 3, 15, "FASTEST LAP", KEYS[UI + 3]);
    g.text(TW + 3, 16, "1:" + String(12 + Math.floor((lapT / speed) % 40)).padStart(2, "0") + "." + String(Math.floor(lapT * 7) % 1000).padStart(3, "0"), KEYS[UI + 2]);
    g.text(TW + 3, 18, "SPEED  KM/H", KEYS[UI + 3]);
    state.forEach((s, i) => {
      const iu = Math.floor(s.u) % N;
      const v = Math.round(290 - curv[iu] * 600 + Math.sin(t + i) * 4);
      const bar = Math.round(clamp((v - 120) / 180) * 10);
      g.text(TW + 3, 19 + i, "█".repeat(bar).padEnd(10, "░"), KEYS[CARS + i]);
      g.text(TW + 14, 19 + i, String(v).padStart(3, " "), KEYS[UI + 2]);
    });
    g.hline(TW + 2, cols - 3, 24, "─", KEYS[UI + 1]);
    g.text(TW + 3, 25, "TRACK  DRY", KEYS[UI + 3]);
    g.text(TW + 3, 26, "AIR    24°C", KEYS[UI + 3]);
    g.text(TW + 3, 28, "FLAG", KEYS[UI + 3]);
    g.text(TW + 8, 28, "▀▄▀▄▀▄", KEYS[LINE]);
    g.text(TW + 8, 29, "▄▀▄▀▄▀", KEYS[LINE]);
    return g.frame();
  };
}
