/* pod-autoscaler: a container cluster scaling pods up under a traffic spike and back down, with nodes filling. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "pod-autoscaler",
  name: "Pod Autoscaler",
  category: "screens",
  note: "A container cluster view where a traffic spike pushes CPU up, new pods spin up across the nodes, then scale back down as load eases.",
  tags: ["containers", "cluster", "devops", "autoscaling", "dashboard", "infra"],
  cols: 96, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const PERIOD = 24, MIN = 4, MAX = 14;
const NODES = ["node-a1", "node-b2", "node-c3"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const load = (t) => {
    const lt = ((t % PERIOD) + PERIOD) % PERIOD;
    const spike = Math.exp(-((lt - 9) ** 2) / 18);
    return 120 + spike * 1900 + 60 * Math.sin(t * 1.7);
  };
  // desired replicas with lag (evaluated every second)
  const desired = (t) => Math.max(MIN, Math.min(MAX, Math.ceil(load(t - 2) / 160)));
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const want = desired(Math.floor(t));
    const have = desired(Math.floor(t) - 2);
    const rps = load(t);
    const cpu = Math.min(99, (rps / Math.max(have, 1)) / 2.2);
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " deploy/checkout-api · ns prod ", "0");
    const st = want > have ? "▲ scaling up" : want < have ? "▼ scaling down" : "● steady";
    g.text(W - 20, 0, " " + st + " ", want > have ? "4" : want < have ? "3" : "2");
    // stats
    const stats = [["Replicas", `${have} / ${want}`, "0"], ["Requests/s", Math.round(rps).toLocaleString("en-US"), rps > 1000 ? "4" : "0"], ["Avg CPU", cpu.toFixed(0) + "%", cpu > 70 ? "5" : cpu > 50 ? "4" : "2"], ["Target CPU", "60%", "1"], ["Min / Max", MIN + " / " + MAX, "1"]];
    stats.forEach(([k, v, c], i) => { g.text(3 + i * 18, 2, k, "1"); g.text(3 + i * 18, 3, v, c); });
    // nodes with pod slots
    const ny = 5;
    const total = Math.max(have, want);
    NODES.forEach((n, ni) => {
      const x = 2 + ni * 31;
      g.box(x, ny, 30, 10, "round", "8");
      g.text(x + 2, ny, " " + n + " ", "1");
      const podsHere = [];
      for (let p = ni; p < total; p += 3) podsHere.push(p);
      podsHere.forEach((p, k) => {
        const px = x + 2 + (k % 3) * 9, py = ny + 1 + Math.floor(k / 3) * 3;
        if (py + 2 >= ny + 10) return;
        const starting = p >= have;
        const ending = p >= want && p < have;
        const c = starting ? "4" : ending ? "7" : "2";
        g.box(px, py, 8, 3, starting ? "light" : "round", c);
        const label = starting ? "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(t * 10 + p) % 10] + " new" : ending ? "stop" : "pod" + (p + 1);
        g.text(px + 1, py + 1, label.slice(0, 5), c === "2" ? "0" : c);
      });
      const used = Math.min(1, (podsHere.filter((p) => p < have).length * 0.18) + 0.1);
      g.text(x + 2, ny + 9, "cpu", "7");
      for (let k = 0; k < 20; k++) g.set(x + 6 + k, ny + 9, k < used * 20 ? "■" : "·", k < used * 20 ? (used > 0.8 ? "5" : "3") : "8");
    });
    // chart
    const cy = 16, ch = 7, cw = W - 16;
    g.text(3, cy, "requests/s", "1"); g.text(W - 14, cy, "replicas", "6");
    for (let k = 0; k < cw; k++) {
      const tt = t - (cw - k) * 0.12;
      const v = load(tt) / 2100;
      const h = Math.round(v * ch * 2);
      for (let r = 0; r < h; r++) g.set(3 + k, cy + ch - Math.floor(r / 2), r % 2 ? "█" : "▄", v > 0.6 ? "4" : "3");
      const rep = desired(Math.floor(tt) - 2) / MAX;
      g.set(3 + k, cy + ch - Math.round(rep * ch), "─", "6");
    }
    g.hline(3, 2 + cw, cy + ch + 1, "─", "8");
    // event log
    const ev = want > have ? `Scaled up from ${have} to ${want} replicas, cpu ${cpu.toFixed(0)}% above target` : want < have ? `Scaled down to ${want} replicas, load easing` : `Holding at ${have} replicas`;
    g.text(3, H - 2, "events:", "7"); g.text(11, H - 2, ev, "1");
    return g.frame();
  };
}
