/* colonising-tree: a tree grown by the space colonisation algorithm, branches reaching for clouds of attractor points. */
import { Grid, palette, gradient, KEYS, rng, fbm, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bark", gradient(["#3a2418", "#5a3a24", "#7a5034", "#9a6a44", "#c08a5a"], 5));
add("twig", ["#8a7a5a", "#b0a070"]);
add("leaf", gradient(["#1a5a2a", "#2a8a3a", "#5ac04a", "#a8e870", "#e8ffb0"], 5));
add("attr", ["#2a3a44", "#4a6070"]);
add("sky", gradient(["#070b14", "#0c1422", "#132034", "#1a2c44"], 4));
add("soil", ["#1a120c", "#2a1c12", "#3a2a1a", "#4a6a2a"]);

export const meta = {
  slug: "colonising-tree",
  name: "Space Colonisation Tree",
  category: "algorithms",
  note: "A tree grows by the space colonisation algorithm, each branch reaching toward a cloud of attractor points that vanish as they are claimed, then bursts into leaf.",
  tags: ["tree", "growth", "algorithm", "branching", "nature", "hero"],
  cols: 90, rows: 36, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const P = 17, GROW = 11, NA = 520, INF = 15, KILL = 2.6, STEP = 1.5;
const DIRS = ["─", "╱", "│", "╲"];

function grow(cols, rows, seed) {
  const r = rng(seed);
  const W = cols, H = rows * 2;
  const ax = [], ay = [];
  while (ax.length < NA) {
    const x = r() * W, y = r() * H * 0.72;
    const ex = (x - W / 2) / (W * 0.44), ey = (y - H * 0.36) / (H * 0.31);
    const e = ex * ex + ey * ey;
    if (e < 1 && fbm(x * 0.06, y * 0.06, 2, seed) > 0.3 + e * 0.15) { ax.push(x); ay.push(y); }
  }
  const nx = [W / 2], ny = [H - 3], par = [-1], born = [0];
  const best = new Float32Array(NA).fill(1e9), bi = new Int32Array(NA).fill(-1), kill = new Int32Array(NA).fill(-1);
  const alive = () => kill.some((k) => k < 0);
  let it = 0, seen = 0;
  while (it < 260 && alive()) {
    it++;
    // update each attractor's closest node with the nodes added since last pass
    for (let a = 0; a < NA; a++) {
      if (kill[a] >= 0) continue;
      for (let n = seen; n < nx.length; n++) {
        const d = Math.hypot(ax[a] - nx[n], ay[a] - ny[n]);
        if (d < best[a]) { best[a] = d; bi[a] = n; }
      }
      if (best[a] < KILL) kill[a] = it;
    }
    seen = nx.length;
    const sx = new Map();
    for (let a = 0; a < NA; a++) {
      if (kill[a] >= 0 || best[a] > INF) continue;
      const n = bi[a], d = best[a];
      const v = sx.get(n) || [0, 0];
      v[0] += (ax[a] - nx[n]) / d; v[1] += (ay[a] - ny[n]) / d; sx.set(n, v);
    }
    if (!sx.size) {
      const n = nx.length - 1;
      nx.push(nx[n] + (r() - 0.5) * 0.3); ny.push(ny[n] - STEP); par.push(n); born.push(it);
      continue;
    }
    for (const [n, [dx, dy]] of sx) {
      const l = Math.hypot(dx, dy - 0.15) || 1;
      nx.push(nx[n] + (dx / l) * STEP); ny.push(ny[n] + ((dy - 0.15) / l) * STEP); par.push(n); born.push(it);
    }
  }
  // pipe model thickness: count tips below each node
  const N = nx.length, tips = new Float32Array(N), kids = new Int32Array(N);
  for (let i = 1; i < N; i++) kids[par[i]]++;
  for (let i = N - 1; i >= 0; i--) { if (!kids[i]) tips[i] += 1; if (par[i] >= 0) tips[par[i]] += tips[i]; }
  return { ax, ay, kill, nx, ny, par, born, tips, kids, iters: it };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const T = grow(cols, rows, 11);
  const maxTip = T.tips[0];
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= rows - 2) bg.push([y === rows - 2 ? "▄" : "▓", K("soil", y === rows - 2 ? 3 : (x & 1) + 1)]);
    else bg.push([(x * 5 + y * 3) % 7 ? "░" : "·", K("sky", Math.min(3, Math.floor((y / rows) * 4)))]);
  }
  return (t) => {
    const p = t % P;
    const it = p < GROW ? (p / GROW) * T.iters : p < P - 1.6 ? T.iters + 1 : T.iters * (1 - (p - (P - 1.6)) / 1.6);
    const leafT = clamp((p - GROW + 1.5) / 2.5) * (p < P - 1.6 ? 1 : 1 - (p - (P - 1.6)) / 1.6);
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    for (let a = 0; a < T.ax.length; a++) {
      if (T.kill[a] >= 0 && T.kill[a] <= it) continue;
      g.set(T.ax[a], T.ay[a] / 2, "·", K("attr", (a & 3) === 0 ? 1 : 0));
    }
    const N = T.nx.length;
    for (let i = 1; i < N; i++) {
      if (T.born[i] > it) continue;
      const q = T.par[i];
      const x0 = T.nx[q], y0 = T.ny[q] / 2, x1 = T.nx[i], y1 = T.ny[i] / 2;
      const w = Math.sqrt(T.tips[i] / maxTip) * 4.6;
      const lv = Math.min(4, Math.floor(w * 1.1));
      if (w > 0.9) {
        const ch = w > 2.2 ? "█" : "▓";
        for (let o = -w / 2; o <= w / 2; o += 0.5) g.line(x0 + o, y0, x1 + o, y1, ch, K("bark", lv));
      } else {
        const a = Math.atan2(-(y1 - y0) * 2, x1 - x0);
        g.line(x0, y0, x1, y1, DIRS[((Math.round(a / (Math.PI / 4)) % 4) + 4) % 4], K("twig", w > 0.5 ? 0 : 1));
      }
    }
    // leaves on the tips once growth settles, plus a bright growing tip while it climbs
    for (let i = 1; i < N; i++) {
      if (T.born[i] > it) continue;
      if (it - T.born[i] < 2 && p < GROW) { g.set(T.nx[i], T.ny[i] / 2, "●", K("leaf", 4)); continue; }
      if (leafT > 0 && T.tips[i] <= 4 && ((i * 2654435761) >>> 24) / 256 < leafT) {
        const k = ((i * 40503) >>> 8) & 3;
        g.set(T.nx[i] + (k & 1), T.ny[i] / 2, k ? "●" : "•", K("leaf", 1 + (k % 3)));
        if (T.kids[i] === 0) g.set(T.nx[i] - 1, T.ny[i] / 2, "•", K("leaf", 0));
      }
    }
    return g.frame();
  };
}
