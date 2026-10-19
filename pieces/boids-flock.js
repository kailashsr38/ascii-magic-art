/* boids-flock: a top-down boids flock steering by separation, alignment and cohesion, scattering from a hunting hawk. */
import { Grid, palette, gradient, KEYS, rng, fbm, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("ground", gradient(["#08140e", "#0c1c12", "#102416", "#142c1a", "#18321e"], 5));
add("bird", ["#d8e8ff", "#ffffff", "#a8c8ff"]);
add("trail", gradient(["#2a5a6a", "#4a90a8", "#8ad0e8"], 3));
add("hawk", ["#ff5a3a", "#ffb04a"]);
add("htrail", ["#5a2a1a", "#8a3a1e"]);

export const meta = {
  slug: "boids-flock",
  name: "Boids Over Meadow",
  category: "algorithms",
  note: "A top-down boids flock steers by separation, alignment and cohesion, splitting and regrouping whenever a hunting hawk dives through.",
  tags: ["boids", "flocking", "emergence", "simulation", "birds", "wallpaper"],
  cols: 96, rows: 34, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const NB = 110, DT = 1 / 30, PER = 60, TR = 7;
const ARW = ["→", "↗", "↑", "↖", "←", "↙", "↓", "↘"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2;
  const px = new Float32Array(NB), py = new Float32Array(NB), vx = new Float32Array(NB), vy = new Float32Array(NB);
  const tx = new Float32Array(NB * TR), ty = new Float32Array(NB * TR);
  const hx = new Float32Array(TR * 2), hy = new Float32Array(TR * 2);
  let H0 = [0, 0, 0, 0], n = 0, cyc = -1;
  const ground = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = fbm(x * 0.06, y * 0.13, 4, 2);
    ground.push([v > 0.62 ? "▒" : v > 0.48 ? "░" : (x * 3 + y * 5) % 4 ? "·" : "\"", K("ground", Math.min(4, Math.floor(v * 6)))]);
  }
  const wrap = (d, L) => (d > L / 2 ? d - L : d < -L / 2 ? d + L : d);
  const reset = (c) => {
    const r = rng(c * 37 + 3);
    for (let i = 0; i < NB; i++) {
      px[i] = r() * W; py[i] = r() * H;
      const a = r() * TAU; vx[i] = Math.cos(a) * 8; vy[i] = Math.sin(a) * 8;
      for (let k = 0; k < TR; k++) { tx[i * TR + k] = px[i]; ty[i * TR + k] = py[i]; }
    }
    H0 = [W * 0.1, H * 0.5, 6, 0]; n = 0;
    for (let k = 0; k < TR * 2; k++) { hx[k] = H0[0]; hy[k] = H0[1]; }
  };
  const step = () => {
    const [hpx, hpy] = H0;
    let mx = 0, my = 0;
    for (let i = 0; i < NB; i++) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, c = 0;
      for (let j = 0; j < NB; j++) {
        if (j === i) continue;
        const dx = wrap(px[j] - px[i], W), dy = wrap(py[j] - py[i], H);
        const d2 = dx * dx + dy * dy;
        if (d2 > 110) continue;
        c++; ax += vx[j]; ay += vy[j]; cx += dx; cy += dy;
        if (d2 < 6.5) { sx -= dx / (d2 + 0.1); sy -= dy / (d2 + 0.1); }
      }
      let fx = 0, fy = 0;
      if (c) { fx += (ax / c - vx[i]) * 1.1 + (cx / c) * 1.4; fy += (ay / c - vy[i]) * 1.1 + (cy / c) * 1.4; }
      fx += sx * 14; fy += sy * 14;
      const dx = wrap(px[i] - hpx, W), dy = wrap(py[i] - hpy, H), d2 = dx * dx + dy * dy;
      if (d2 < 200) { fx += (dx / Math.sqrt(d2 + 1)) * 60; fy += (dy / Math.sqrt(d2 + 1)) * 60; }
      vx[i] += fx * DT; vy[i] += fy * DT;
      const s = Math.hypot(vx[i], vy[i]), cl = clamp(s, 7, 16);
      vx[i] *= cl / (s || 1); vy[i] *= cl / (s || 1);
      px[i] = (px[i] + vx[i] * DT + W) % W; py[i] = (py[i] + vy[i] * DT + H) % H;
      mx += px[i]; my += py[i];
    }
    // the hawk drifts after the nearest bird, then breaks off and circles
    const k = (n / 30) % 12;
    let best = 1e9, bx = 0, by = 0;
    for (let i = 0; i < NB; i += 3) {
      const dx = wrap(px[i] - hpx, W), dy = wrap(py[i] - hpy, H), d = dx * dx + dy * dy;
      if (d < best) { best = d; bx = dx; by = dy; }
    }
    const hunt = k < 7;
    let [x, y, hvx, hvy] = H0;
    if (hunt) { const l = Math.hypot(bx, by) || 1; hvx += (bx / l) * 40 * DT; hvy += (by / l) * 40 * DT; }
    else { hvx += -hvy * 0.6 * DT; hvy += hvx * 0.6 * DT; }
    const s = Math.hypot(hvx, hvy), cl = clamp(s, 6, hunt ? 18 : 10);
    hvx *= cl / (s || 1); hvy *= cl / (s || 1);
    H0 = [(x + hvx * DT + W) % W, (y + hvy * DT + H) % H, hvx, hvy];
    n++;
    if (n % 3 === 0) {
      const slot = (n / 3) % TR;
      for (let i = 0; i < NB; i++) { tx[i * TR + slot] = px[i]; ty[i * TR + slot] = py[i]; }
      const hs = (n / 3) % (TR * 2);
      hx[hs] = H0[0]; hy[hs] = H0[1];
    }
  };
  return (t) => {
    const c = Math.floor(t / PER), want = Math.floor((t - c * PER) / DT);
    if (c !== cyc || want < n) { cyc = c; reset(c); }
    while (n < want) step();
    for (let i = 0; i < cols * rows; i++) { g.ch[i] = ground[i][0]; g.co[i] = ground[i][1]; }
    // trails, older first
    const head = Math.floor(n / 3);
    for (let a = TR - 1; a >= 1; a--) {
      const slot = (((head - a) % TR) + TR) % TR, lv = a < 3 ? 2 : a < 5 ? 1 : 0;
      for (let i = 0; i < NB; i++) g.set(tx[i * TR + slot], ty[i * TR + slot] / 2, lv === 2 ? "•" : "·", K("trail", lv));
      const hs = (((head - a) % (TR * 2)) + TR * 2) % (TR * 2);
      g.set(hx[hs], hy[hs] / 2, "•", K("htrail", a < 4 ? 1 : 0));
    }
    for (let i = 0; i < NB; i++) {
      const a = Math.atan2(-vy[i], vx[i]);
      const d = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
      g.set(px[i], py[i] / 2, ARW[d], K("bird", i % 7 === 0 ? 2 : i % 3 ? 0 : 1));
    }
    const [x, y] = H0;
    g.set(x, y / 2, "◆", K("hawk", 0));
    g.set(x - 1, y / 2, "◄", K("hawk", 1)); g.set(x + 1, y / 2, "►", K("hawk", 1));
    return g.frame();
  };
}
