/* infra-plan-diff: an infrastructure-as-code plan showing create, update and destroy diffs, then applying them. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "infra-plan-diff",
  name: "Infra Plan and Apply",
  category: "screens",
  note: "An infrastructure-as-code plan that lists resources to add, change and destroy in coloured diffs, then applies them with elapsed timers.",
  tags: ["iac", "devops", "infrastructure", "terminal", "diff", "cloud"],
  cols: 90, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const G = "2", Y = "9", R = "5", M = "1", T = "0";
const PLAN = [
  [["Infra will perform the following actions:", T]],
  [[""]],
  [["  # cache_cluster.sessions", T], [" will be created", G]],
  [["  + ", G], ["resource \"cache_cluster\" \"sessions\" {", T]],
  [["      + ", G], ["engine        = ", M], ["\"kv-7.2\"", G]],
  [["      + ", G], ["node_type     = ", M], ["\"medium.2x\"", G]],
  [["      + ", G], ["nodes         = ", M], ["3", G]],
  [["      + ", G], ["id            = ", M], ["(known after apply)", M]],
  [["    }", T]],
  [[""]],
  [["  # instance_group.api", T], [" will be updated in-place", Y]],
  [["  ~ ", Y], ["resource \"instance_group\" \"api\" {", T]],
  [["      ~ ", Y], ["desired_size  = ", M], ["4", R], [" -> ", M], ["6", G]],
  [["      ~ ", Y], ["image         = ", M], ["\"api-2.3.9\"", R], [" -> ", M], ["\"api-2.4.1\"", G]],
  [["        ", T], ["# (11 unchanged attributes hidden)", M]],
  [["    }", T]],
  [[""]],
  [["  # dns_record.legacy", T], [" will be destroyed", R]],
  [["  - ", R], ["resource \"dns_record\" \"legacy\" {", T]],
  [["      - ", R], ["name          = ", M], ["\"old-api.internal\"", R]],
  [["      - ", R], ["ttl           = ", M], ["300", R]],
  [["    }", T]],
  [[""]],
  [["Plan: ", T], ["1 to add", G], [", ", T], ["1 to change", Y], [", ", T], ["1 to destroy", R], [".", T]],
];
const APPLY = [
  [0.0, [["dns_record.legacy: ", T], ["Destroying...", R], [" [id=z4k2:old-api]", M]]],
  [0.9, [["dns_record.legacy: ", T], ["Destruction complete after 1s", R]]],
  [1.0, [["cache_cluster.sessions: ", T], ["Creating...", G]]],
  [1.2, [["instance_group.api: ", T], ["Modifying...", Y], [" [id=ig-0a71]", M]]],
  [2.4, "elapsed"],
  [3.9, [["instance_group.api: ", T], ["Modifications complete after 3s", Y]]],
  [4.6, [["cache_cluster.sessions: ", T], ["Creation complete after 4s", G], [" [id=cc-9f2e]", M]]],
  [5.2, [[""]]],
  [5.3, [["Apply complete! Resources: ", G], ["1 added, 1 changed, 1 destroyed.", G]]],
];
const PLAN_T = 0.8, PLAN_STEP = 0.11, ASK = PLAN_T + PLAN.length * PLAN_STEP + 0.6, APPLY_T = ASK + 1.4, PERIOD = APPLY_T + 9;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const VIS = H - 2;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const lines = [[["$ ", "2"], ["infra apply", T]]];
    const n = Math.min(PLAN.length, Math.max(0, Math.floor((lt - PLAN_T) / PLAN_STEP)));
    lines.push(...PLAN.slice(0, n));
    if (lt >= ASK) {
      lines.push([[""]]);
      const yes = "yes".slice(0, Math.max(0, Math.floor((lt - ASK - 0.6) / 0.15)));
      lines.push([["Do you want to perform these actions? ", T], ["Enter a value: ", M], [yes, Y]]);
      lines.push([[""]]);
    }
    if (lt >= APPLY_T) {
      const k = lt - APPLY_T;
      for (const [at, segs] of APPLY) {
        if (k < at) break;
        if (segs === "elapsed") {
          const e = Math.min(Math.floor(k - 1.0) + 1, 3);
          lines.push([["cache_cluster.sessions: ", T], [`Still creating... [${e}0s elapsed]`, M]]);
        } else lines.push(segs);
      }
    }
    const start = Math.max(0, lines.length - VIS);
    lines.slice(start).forEach((segs, i) => {
      let x = 1;
      for (const [s, c] of segs) { g.text(x, i, s, c); x += s.length; }
    });
    // cursor
    const lastY = lines.length - start - 1;
    if (Math.floor(lt * 2.5) % 2 === 0) {
      const L = lines[lines.length - 1];
      g.set(1 + L.reduce((a, s) => a + s[0].length, 0), lastY, "█", T);
    }
    // footer summary chips
    g.hline(0, W - 1, H - 2, "─", "8");
    const p = lt >= APPLY_T + 5.3 ? "applied" : lt >= APPLY_T ? "applying" : lt >= ASK ? "awaiting approval" : "planning";
    g.text(1, H - 1, "workspace: prod  ·  state: remote  ·  ", M);
    g.text(39, H - 1, p, p === "applied" ? G : p === "applying" ? Y : "3");
    g.text(W - 26, H - 1, "+1", G); g.text(W - 23, H - 1, "~1", Y); g.text(W - 20, H - 1, "-1", R); g.text(W - 16, H - 1, "lock: held", "6");
    return g.frame();
  };
}
