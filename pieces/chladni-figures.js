/* chladni-figures: sand on a vibrating plate bouncing off the moving parts and gathering on the still nodal lines. */
import { Grid, palette, gradient, KEYS, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#06070c", "#0c0e18", "#121624"], 3));
add("plate", gradient(["#141a26", "#1c2434", "#263044", "#303c54"], 4));
add("edge", ["#4a5468", "#8a96ac"]);
add("sand", gradient(["#6a5a3a", "#a8925e", "#d8c08a", "#f2e2b4", "#fff8e4"], 8));
add("ui", ["#5a6478", "#c8d0e0", "#7ee787"]);

export const meta = {
  slug: "chladni-figures",
  name: "Chladni Figures",
  category: "motion-lab",
  note: "Sand on a vibrating metal plate jumps off the moving regions and settles on the still nodal lines, redrawing a new figure each time the frequency changes.",
  tags: ["chladni", "resonance", "sound", "cymatics", "physics", "hero"],
  cols: 84, rows: 36, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const MODES = [[1, 2], [1, 3], [2, 3], [1, 4], [2, 5], [3, 4], [1, 5], [3, 5]];
const HOLD = 6, NG = 2600;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const PW = 64, PH = 32, PX = 2, PY = 2;              // plate in cells (square, corrected for tall cells)
  const r = rng(7);
  const f = (n, m, x, y) => Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
  // for each mode: scattered start, then gradient descent on f^2 to the nodal lines
  const start = [], target = [];
  for (const [n, m] of MODES) {
    const sx = new Float32Array(NG), sy = new Float32Array(NG), tx = new Float32Array(NG), ty = new Float32Array(NG);
    for (let i = 0; i < NG; i++) {
      let x = r() * 2 - 1, y = r() * 2 - 1;
      sx[i] = x; sy[i] = y;
      for (let k = 0; k < 40; k++) {
        const v = f(n, m, x, y), e = 1e-3;
        const gx = (f(n, m, x + e, y) - v) / e, gy = (f(n, m, x, y + e) - v) / e;
        const gg = gx * gx + gy * gy + 1e-6;
        let dx = (v * gx) / gg, dy = (v * gy) / gg;
        const l = Math.hypot(dx, dy);
        if (l > 0.05) { dx *= 0.05 / l; dy *= 0.05 / l; }
        x -= dx * 0.8; y -= dy * 0.8;
        x = clamp(x, -1, 1); y = clamp(y, -1, 1);
      }
      tx[i] = x + (r() - 0.5) * 0.012; ty[i] = y + (r() - 0.5) * 0.012;
    }
    start.push([sx, sy]); target.push([tx, ty]);
  }
  const cnt = new Uint8Array(cols * rows);
  const ease = (u) => 1 - Math.pow(1 - u, 3);
  return (t) => {
    g.clear();
    const k = Math.floor(t / HOLD) % MODES.length, prev = (k + MODES.length - 1) % MODES.length;
    const p = (t % HOLD) / HOLD;
    const [n, m] = MODES[k];
    // plate, darker where it vibrates hardest
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const inP = x >= PX && x < PX + PW && y >= PY && y < PY + PH;
      if (!inP) { g.set(x, y, "░", K("bg", (x + y) % 3 === 0 ? 1 : 0)); continue; }
      const u = ((x + 0.5 - PX) / PW) * 2 - 1, v = ((y + 0.5 - PY) / PH) * 2 - 1;
      const amp = Math.abs(f(n, m, u, v)) / 2;
      const shimmer = p < 0.75 ? Math.abs(Math.sin(t * 40 + u * 3)) * amp * 0.6 : 0;
      g.set(x, y, "░", K("plate", Math.min(3, Math.floor(1 + (amp * 0.5 + shimmer) * 3))));
    }
    g.box(PX - 1, PY - 1, PW + 2, PH + 2, "heavy", K("edge", 1));
    // grains: hop from the old figure into a scatter, then settle on the new nodal lines
    cnt.fill(0);
    const [ox, oy] = target[prev], [sx, sy] = start[k], [tx, ty] = target[k];
    const jit = p < 0.15 ? 0.06 : 0.03 * (1 - clamp((p - 0.15) / 0.55));
    for (let i = 0; i < NG; i++) {
      let x, y;
      if (p < 0.15) { const u = ease(p / 0.15); x = ox[i] + (sx[i] - ox[i]) * u; y = oy[i] + (sy[i] - oy[i]) * u; }
      else { const u = ease(clamp((p - 0.15) / 0.55)); x = sx[i] + (tx[i] - sx[i]) * u; y = sy[i] + (ty[i] - sy[i]) * u; }
      x += Math.sin(t * 31 + i * 1.7) * jit; y += Math.cos(t * 27 + i * 2.3) * jit;
      const cx = Math.floor(PX + ((x + 1) / 2) * PW), cy = Math.floor(PY + ((y + 1) / 2) * PH);
      if (cx < PX || cy < PY || cx >= PX + PW || cy >= PY + PH) continue;
      const j = cx + cy * cols;
      if (cnt[j] < 255) cnt[j]++;
    }
    for (let i = 0; i < cols * rows; i++) {
      const c = cnt[i];
      if (!c) continue;
      g.ch[i] = c > 3 ? "█" : c > 1 ? "▓" : "▒";
      g.co[i] = K("sand", Math.min(7, 2 + c));
    }
    // a little readout panel
    const hz = Math.round(110 * (n * n + m * m) / 8);
    const x0 = PX + PW + 3;
    g.text(x0, 3, "MODE", K("ui", 0));
    g.text(x0, 4, `${n},${m}`.padEnd(8), K("ui", 1));
    g.text(x0, 7, "FREQ", K("ui", 0));
    g.text(x0, 8, `${hz} Hz`.padEnd(8), K("ui", 1));
    g.text(x0, 11, "AMP", K("ui", 0));
    const bars = Math.round((p < 0.75 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9)) : 0.15) * 10);
    for (let b = 0; b < 10; b++) g.set(x0 + b, 12, b < bars ? "█" : "░", K("ui", b < bars ? 2 : 0));
    for (let s = 0; s < MODES.length; s++) g.set(x0 + s * 1, 15, s === k ? "●" : "○", K("ui", s === k ? 1 : 0));
    // a sine trace of the drive signal
    for (let x = 0; x < 12; x++) {
      const y = 19 + Math.round(Math.sin(x * (n + m) * 0.25 + t * 12) * (p < 0.75 ? 2 : 0.5));
      g.set(x0 + x, y, "•", K("ui", 2));
    }
    return g.frame();
  };
}
