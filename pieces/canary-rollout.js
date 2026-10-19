/* canary-rollout: traffic shifts to a canary in steps while metrics gates decide, one release promoted and the next rolled back. */
import { Grid, palette, clamp, fbm } from "../lib/kit.js";

export const meta = {
  slug: "canary-rollout",
  name: "Canary Rollout Gates",
  category: "explainers",
  note: "A canary release that moves traffic from 1 to 100 percent in steps while error rate and latency are compared against the stable build, promoting one release and automatically rolling back the next when its errors spike.",
  tags: ["deploy", "canary", "devops", "release", "diagram", "dashboard"],
  cols: 100, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const STEPS = [1, 5, 25, 50, 100];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SD = 2.6, CYC = STEPS.length * SD + 4;
  // per cycle state at local time
  const stateAt = (ct, bad) => {
    if (!bad) {
      const k = Math.min(STEPS.length - 1, Math.floor(ct / SD));
      return { pct: STEPS[k], k, done: ct >= STEPS.length * SD - SD + 1.2, rolled: false };
    }
    // bad release: fails at 25 percent
    const failAt = 2 * SD + 1.4;
    if (ct < failAt) { const k = Math.floor(ct / SD); return { pct: STEPS[k], k, done: false, rolled: false }; }
    return { pct: ct < failAt + 0.6 ? 25 : 0, k: 2, done: false, rolled: true, failAt };
  };
  const errS = (tt) => 0.15 + fbm(tt * 0.8, 1, 2, 3) * 0.2;
  const errC = (tt, bad, ct) => (bad && ct > 2 * SD + 0.2 ? 0.3 + clamp((ct - 2 * SD - 0.2) / 1.2) * 2.6 : 0.12) + fbm(tt * 0.8, 9, 2, 4) * 0.22;
  const latS = (tt) => 180 + fbm(tt * 0.6, 3, 2, 5) * 40;
  const latC = (tt, bad, ct) => 170 + fbm(tt * 0.6, 7, 2, 6) * 40 + (bad && ct > 2 * SD + 0.2 ? clamp((ct - 2 * SD - 0.2) / 1.2) * 150 : 0);
  return (t) => {
    g.clear();
    const n = Math.floor(t / CYC), ct = t - n * CYC;
    const bad = n % 2 === 1;
    const sm = 6 + Math.ceil(n / 2);
    const stable = "v4." + sm + "." + (n >= 3 ? 1 : 0), ver = "v4." + (sm + 1) + "." + (n % 2 === 0 && n > 0 ? 1 : 0);
    const s = stateAt(ct, bad);
    // header
    g.text(1, 0, "canary " + ver, "5");
    g.text(16, 0, "vs stable " + stable, "3");
    const status = s.rolled ? ["✗ rolled back automatically", "6"] : s.done ? ["✓ promoted to stable", "4"] : ["● analysing step " + (s.k + 1) + " of " + STEPS.length, "a"];
    g.text(cols - 1 - status[0].length, 0, status[0], status[1]);
    // traffic split bar
    const BW = 96, cw = Math.round((s.pct / 100) * BW);
    g.text(1, 2, "traffic split", "1");
    for (let x = 0; x < BW; x++) g.set(2 + x, 3, "█", x >= BW - cw ? (s.rolled && ct < s.failAt + 0.6 ? "6" : "5") : "3");
    g.text(2, 4, "stable " + (100 - s.pct) + "%", "3");
    const cl = "canary " + s.pct + "%";
    g.text(98 - cl.length, 4, cl, "5");
    // request dots streaming into the split
    for (let i = 0; i < 24; i++) {
      const f = (t * 0.35 + i / 24) % 1;
      const h = (Math.sin(i * 91.7 + Math.floor(t * 0.35 + i / 24) * 13.1) * 43758.5) % 1;
      const toCanary = Math.abs(h) < s.pct / 100;
      g.set(2 + Math.floor(f * 96), 5, "•", toCanary ? "5" : "b");
    }
    // step ladder
    let x = 2;
    STEPS.forEach((p, i) => {
      const passed = s.done || (!s.rolled && i < s.k) || (s.rolled && i < 2);
      const cur = !s.done && !s.rolled && i === s.k;
      const failed = s.rolled && i === 2;
      const lab = (failed ? "✗ " : passed ? "✓ " : cur ? "▶ " : "· ") + p + "%";
      g.text(x, 7, lab, failed ? "6" : passed ? "4" : cur ? "a" : "b");
      x += lab.length + 1;
      if (i < STEPS.length - 1) {
        const W = 8;
        const fill = cur ? clamp((ct - i * SD) / SD) : passed ? 1 : 0;
        for (let k = 0; k < W; k++) g.set(x + k, 7, k < fill * W ? "━" : "─", k < fill * W ? "4" : "2");
        x += W + 1;
      }
    });
    // charts
    const chart = (cx, title, fs, fc, max, unit, lim) => {
      const W = 46, H = 9, Y = 10;
      g.box(cx, Y, W, H + 3, "round", "b");
      g.text(cx + 2, Y, " " + title + " ", "0");
      const ly = Y + 1 + Math.round((1 - lim / max) * (H - 1));
      for (let c = 1; c < W - 1; c += 2) g.set(cx + c, ly, "╌", "6");
      g.text(cx + W - 10, ly, "limit", "6");
      for (let c = 0; c < W - 2; c++) {
        const tt = t - (W - 3 - c) * 0.12;
        const ctt = ct - (W - 3 - c) * 0.12;
        const ys = Y + 1 + Math.round((1 - clamp(fs(tt) / max)) * (H - 1));
        g.set(cx + 1 + c, ys, "•", "3");
        if (ctt >= 0 && !(s.rolled && ctt > s.failAt + 0.6)) {
          const yc = Y + 1 + Math.round((1 - clamp(fc(tt, bad, ctt) / max)) * (H - 1));
          g.set(cx + 1 + c, yc, "●", "5");
        }
      }
      const vs = fs(t), vc = fc(t, bad, ct);
      g.text(cx + 2, Y + H + 1, "stable " + vs.toFixed(unit === "%" ? 2 : 0) + unit, "3");
      if (!(s.rolled && ct > s.failAt + 0.6)) g.text(cx + 22, Y + H + 1, "canary " + vc.toFixed(unit === "%" ? 2 : 0) + unit, vc > lim ? "6" : "5");
      else g.text(cx + 22, Y + H + 1, "canary stopped", "6");
    };
    chart(1, "error rate", errS, errC, 3, "%", 1);
    chart(52, "p99 latency", latS, latC, 400, "ms", 300);
    // gates
    const gy = 23;
    g.text(1, gy, "gates", "1");
    const e = errC(t, bad, ct), l = latC(t, bad, ct);
    const gates = [["error rate < 1%", e < 1], ["p99 < 300ms", l < 300], ["no crash loops", true], ["saturation < 80%", true]];
    gates.forEach(([name, ok], i) => {
      const gx = 8 + i * 23;
      const live = !s.rolled || ct < s.failAt + 0.6;
      g.text(gx, gy, ok ? "✓" : "✗", ok ? "4" : "6");
      g.text(gx + 2, gy, name, live ? (ok ? "0" : "6") : "b");
    });
    const msg = s.rolled ? "canary " + ver + " failed its gates at 25%, all traffic back on " + stable
      : s.done ? ver + " now serves 100% and becomes the new stable build"
      : "holding at " + s.pct + "% for analysis before the next step";
    g.text(1, gy + 2, msg, s.rolled ? "6" : s.done ? "4" : "1");
    return g.frame();
  };
}
