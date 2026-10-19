/* orbital-gravity: three equal stars chasing each other along a figure-eight orbit over their gravity well contours. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("field", gradient(["#05060e", "#0a0e22", "#121a3a", "#1c2a56", "#2a3e74"], 8));
add("line", gradient(["#1e2a52", "#3a5294", "#6a8ad0"], 3));
add("b0", gradient(["#5a1a0a", "#c8501a", "#ffa040", "#fff0c0"], 6));
add("b1", gradient(["#0a2a5a", "#1a6ad0", "#5ab8ff", "#e0f6ff"], 6));
add("b2", gradient(["#3a0a4a", "#9a2ab0", "#e070ff", "#ffe0ff"], 6));
add("ui", ["#5a6478", "#a8b0c0"]);

export const meta = {
  slug: "orbital-gravity",
  name: "Three Body Orbit",
  category: "motion-lab",
  note: "Three equal stars chase each other around the famous figure-eight solution of the three-body problem, integrated live over glowing gravity contours.",
  tags: ["gravity", "orbit", "three-body", "simulation", "physics", "hero"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const PER = 6.32591398, DT = 1 / 600, SPEED = 0.75, TR = 520;
const X0 = [[0.97000436, -0.24308753], [-0.97000436, 0.24308753], [0, 0]];
const V3 = [-0.93240737, -0.86473146];
const V0 = [[-V3[0] / 2, -V3[1] / 2], [-V3[0] / 2, -V3[1] / 2], V3];

function acc(p) {
  const a = [[0, 0], [0, 0], [0, 0]];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
    const r2 = dx * dx + dy * dy, inv = 1 / (r2 * Math.sqrt(r2));
    a[i][0] += dx * inv; a[i][1] += dy * inv; a[j][0] -= dx * inv; a[j][1] -= dy * inv;
  }
  return a;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2, S = 36;
  // integrate one full period once with velocity Verlet and keep every step; the orbit is periodic
  const NS = Math.ceil(PER / DT);
  const tab = new Float32Array(NS * 6);
  {
    const p = X0.map((q) => q.slice()), v = V0.map((q) => q.slice());
    let a = acc(p);
    for (let n = 0; n < NS; n++) {
      for (let i = 0; i < 3; i++) { tab[n * 6 + i * 2] = p[i][0]; tab[n * 6 + i * 2 + 1] = p[i][1]; }
      for (let i = 0; i < 3; i++) { v[i][0] += a[i][0] * DT / 2; v[i][1] += a[i][1] * DT / 2; p[i][0] += v[i][0] * DT; p[i][1] += v[i][1] * DT; }
      a = acc(p);
      for (let i = 0; i < 3; i++) { v[i][0] += a[i][0] * DT / 2; v[i][1] += a[i][1] * DT / 2; }
    }
  }
  const at = (n, i) => { const k = ((n % NS) + NS) % NS; return [tab[k * 6 + i * 2], tab[k * 6 + i * 2 + 1]]; };
  const scr = (x, y) => [cx + x * S, cy - y * S * 0.5 * 1.4];
  return (t) => {
    const lt = (t * SPEED) % PER;
    const n = Math.floor(lt / DT);
    const p = [0, 1, 2].map((i) => at(n, i));
    g.clear();
    // gravitational potential, shaded with contour lines
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wx = (x + 0.5 - cx) / S, wy = -(y + 0.5 - cy) / (S * 0.7);
      let phi = 0;
      for (let i = 0; i < 3; i++) phi += 1 / Math.sqrt((wx - p[i][0]) ** 2 + (wy - p[i][1]) ** 2 + 0.004);
      const lv = Math.log(phi);
      const c = (lv * 4) % 1;
      const v = clamp((lv - 0.6) * 0.38);
      if (c < 0.12 && v > 0.1) g.set(x, y, "·", K("line", Math.min(2, Math.floor(v * 3))));
      else g.set(x, y, v > 0.62 ? "▓" : v > 0.3 ? "▒" : "░", K("field", Math.min(7, Math.floor(v * 8))));
    }
    // trails
    for (let i = 0; i < 3; i++) {
      for (let s = TR - 1; s >= 1; s--) {
        const f = s / TR;
        if (f > 0.55) continue;
        const [x, y] = scr(...at(n - s * 4, i));
        g.set(x, y, f < 0.08 ? "█" : f < 0.2 ? "▓" : f < 0.38 ? "▒" : "░", K("b" + i, Math.max(0, 4 - Math.floor(f * 9))));
      }
    }
    // the bodies
    for (let i = 0; i < 3; i++) {
      const [x, y] = scr(p[i][0], p[i][1]);
      const X = Math.round(x), Y = Math.round(y);
      g.text(X - 2, Y, "▐███▌", K("b" + i, 4));
      g.text(X - 1, Y - 1, "▄█▄", K("b" + i, 3));
      g.text(X - 1, Y + 1, "▀█▀", K("b" + i, 3));
      g.set(X, Y, "█", K("b" + i, 5));
    }
    g.text(2, rows - 1, `figure-eight · T = ${PER.toFixed(3)} · t = ${lt.toFixed(2)}`, K("ui", 0));
    return g.frame();
  };
}
