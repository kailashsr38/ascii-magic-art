/* cluster-rollout: a rolling deployment replacing old pods with new ones until the rollout succeeds. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "cluster-rollout",
  name: "Rolling Deployment",
  category: "screens",
  note: "A cluster rolling update where new pods start, pass readiness and replace old ones while a status line counts up to a successful rollout.",
  tags: ["rollout", "devops", "deploy", "terminal", "cluster", "dashboard"],
  cols: 92, rows: 26, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const REPLICAS = 6;
const OLD = ["7d9f8c6b5-2xkqp", "7d9f8c6b5-8hjzw", "7d9f8c6b5-c4lmn", "7d9f8c6b5-f9rtv", "7d9f8c6b5-k2pqs", "7d9f8c6b5-x7dbe"];
const NEW = ["5c8e1a4f2-bq7rn", "5c8e1a4f2-dk3vw", "5c8e1a4f2-h6zpl", "5c8e1a4f2-m2xcf", "5c8e1a4f2-s9tgj", "5c8e1a4f2-w4nyk"];
const STEP = 1.5, PERIOD = 1.5 + REPLICAS * STEP + 4.5;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " cluster: prod-eu-1 · namespace: shop ", "1");
    g.text(2, 1, "$ ", "2"); g.text(4, 1, "clusterctl set image deploy/checkout app=checkout:3.8.0 && clusterctl rollout status", "0");
    const pods = [];
    let ready = 0, updated = 0;
    for (let i = 0; i < REPLICAS; i++) {
      const s = 1.5 + i * STEP; // new pod i created
      const k = lt - s;
      if (k >= 0) {
        updated++;
        const st = k < 0.5 ? ["Pending", "9", "0/1"] : k < 1.1 ? ["ContainerCreating", "3", "0/1"] : k < 1.4 ? ["Running", "a", "0/1"] : ["Running", "2", "1/1"];
        if (st[2] === "1/1") ready++;
        pods.push([NEW[i], st[0], st[1], st[2], k, true]);
      }
      const ok = lt - (s + 1.4);
      if (ok < 0) pods.push([OLD[i], "Running", "1", "1/1", lt + 3600 * 5, false]);
      else if (ok < 0.9) pods.push([OLD[i], "Terminating", "5", "1/1", lt + 3600 * 5, false]);
    }
    pods.sort((a, b) => (a[5] === b[5] ? 0 : a[5] ? -1 : 1));
    const Y0 = 3;
    g.text(2, Y0, "NAME".padEnd(32) + "READY".padEnd(8) + "STATUS".padEnd(20) + "RESTARTS".padEnd(10) + "AGE", "1");
    pods.slice(0, 12).forEach(([name, st, c, rd, age, isNew], i) => {
      const y = Y0 + 1 + i;
      g.text(2, y, "checkout-", isNew ? "0" : "7"); g.text(11, y, name, isNew ? "0" : "7");
      g.text(34, y, rd, rd === "1/1" ? "2" : "9");
      g.text(42, y, st, c);
      g.text(62, y, "0", "7");
      const a = Math.floor(age);
      g.text(72, y, a >= 3600 ? "5h12m" : a + "s", "1");
      if (st === "ContainerCreating" || st === "Pending") g.set(40, y, "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(lt * 12) % 10], "3");
    });
    // replica blocks
    const BY = H - 8;
    g.hline(1, W - 2, BY - 1, "─", "8");
    g.text(2, BY, "replicas", "1");
    for (let i = 0; i < REPLICAS; i++) {
      const s = 1.5 + i * STEP, k = lt - s;
      const x = 12 + i * 8;
      const c = k < 0 ? "7" : k < 1.4 ? "9" : "2";
      g.text(x, BY, k < 0 ? "▓▓▓▓▓▓" : k < 1.4 ? "▒▒▒▒▒▒" : "██████", c);
      g.text(x, BY + 1, k < 0 ? " v3.7 " : " v3.8 ", c);
    }
    g.text(62, BY, "surge 1 · unavailable 0", "7");
    // status line
    const done = ready >= REPLICAS && lt > 1.5 + REPLICAS * STEP + 1.0;
    const sy = H - 4;
    if (lt < 1.5) g.text(2, sy, "deployment.apps/checkout image updated", "0");
    else if (!done) {
      const msg = updated < REPLICAS
        ? `Waiting for rollout of "checkout" to finish: ${ready} of ${REPLICAS} updated replicas are available...`
        : `Waiting for rollout of "checkout" to finish: ${OLD.length - Math.min(OLD.length, ready)} old replicas are pending termination...`;
      g.text(2, sy, msg.slice(0, W - 4), "9");
    } else {
      g.text(2, sy, "deployment \"checkout\" successfully rolled out", "2");
      g.text(2, sy + 1, "✓ 6/6 ready · revision 42 · 0 restarts · took " + (REPLICAS * STEP + 1).toFixed(1) + "s", "1");
    }
    const p = clamp(ready / REPLICAS), bw = 30, n = Math.round(p * bw);
    g.text(2, H - 2, "█".repeat(n), "2"); g.text(2 + n, H - 2, "░".repeat(bw - n), "8"); g.text(34, H - 2, `${ready}/${REPLICAS} available`, "1");
    return g.frame();
  };
}
