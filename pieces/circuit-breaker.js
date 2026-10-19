/* circuit-breaker: closed, open and half-open states driven by a live call log against a failing downstream. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "circuit-breaker",
  name: "Circuit Breaker States",
  category: "explainers",
  note: "A circuit breaker that counts failures from a struggling downstream service, trips open to fail fast, waits out a cooldown, sends a trial call while half open and closes again once the service recovers.",
  tags: ["resilience", "circuit-breaker", "microservices", "diagram", "state-machine", "backend"],
  cols: 100, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const THRESH = 4, COOL = 4;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LOOP = 24, CALL = 0.5;
  const sick = (tt) => tt > 4.5 && tt < 14.2;
  // simulate
  const calls = [];
  const trans = []; // [time, from, to, reason]
  let st = "closed", fails = 0, openedAt = 0;
  for (let i = 0, tc = 0.25; tc < LOOP - 0.3; i++, tc += CALL) {
    if (st === "open" && tc - openedAt >= COOL) { trans.push([openedAt + COOL, "open", "half", "cooldown over"]); st = "half"; }
    const c = { t: tc, id: 9100 + i, state: st };
    if (st === "open") { c.res = "skip"; c.ms = 0; }
    else {
      const bad = sick(tc);
      c.res = bad ? "fail" : "ok";
      c.ms = bad ? 2000 : 60 + ((i * 37) % 70);
      if (st === "half") {
        if (bad) { trans.push([tc + 0.2, "half", "open", "trial failed"]); st = "open"; openedAt = tc + 0.2; }
        else { trans.push([tc + 0.2, "half", "closed", "trial ok"]); st = "closed"; fails = 0; }
      } else if (bad) {
        fails++;
        if (fails >= THRESH) { trans.push([tc + 0.2, "closed", "open", "4 failures"]); st = "open"; openedAt = tc + 0.2; fails = 0; }
      } else fails = 0;
    }
    c.fails = fails;
    calls.push(c);
  }
  const stateAt = (lt) => { let s = "closed", last = null; for (const tr of trans) if (tr[0] <= lt) { s = tr[2]; last = tr; } return [s, last]; };
  // state boxes
  const B = { closed: [2, 3, 20, "CLOSED", "4"], open: [36, 3, 20, "OPEN", "6"], half: [19, 14, 20, "HALF-OPEN", "a"] };
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const [st, lastTr] = stateAt(lt);
    const flash = lastTr && lt - lastTr[0] < 1.0 ? lastTr : null;
    // edges
    const edge = (key, cells, label, lx, ly) => {
      const on = flash && flash[1] + ">" + flash[2] === key;
      const co = on ? "8" : "b";
      g.text(lx, ly, label, on ? "a" : "1");
      return [co, on];
    };
    // closed -> open (top)
    let [co] = edge("closed>open", null, "4 failures", 24, 4);
    g.hline(22, 35, 5, "─", co); g.set(35, 5, "▶", co);
    // open -> half (right side, down then left)
    [co] = edge("open>half", null, "after " + COOL + "s", 51, 12);
    g.vline(50, 8, 15, "│", co); g.hline(40, 49, 16, "─", co); g.set(50, 16, "┘", co); g.set(39, 16, "◀", co);
    // half -> open (inner)
    [co] = edge("half>open", null, "trial fails", 35, 12);
    g.vline(33, 11, 13, "│", co); g.set(33, 10, "┌", co); g.hline(34, 41, 10, "─", co); g.set(42, 10, "┘", co); g.set(42, 9, "│", co); g.set(42, 8, "▲", co);
    // half -> closed (left)
    [co] = edge("half>closed", null, "trial ok", 12, 12);
    g.vline(10, 9, 15, "│", co); g.set(10, 8, "▲", co); g.hline(11, 18, 16, "─", co); g.set(10, 16, "└", co);
    // boxes
    for (const k in B) {
      const [x, y, w, name, c] = B[k];
      const on = st === k;
      g.box(x, y, w, 5, on ? "heavy" : "round", on ? c : "b");
      g.text(x + 2, y + 1, (on ? "● " : "○ ") + name, on ? c : "1");
      const sub = k === "closed" ? ["calls pass", "count failures"] : k === "open" ? ["fail fast", "spare downstream"] : ["one probe call", "then decide"];
      g.text(x + 2, y + 2, sub[0], on ? "0" : "b");
      g.text(x + 2, y + 3, sub[1], on ? "1" : "b");
      if (k === "half") g.set(33, 14, "┴", on ? c : "b");
    }
    // live counters
    const curCalls = calls.filter((c) => c.t <= lt);
    const lastC = curCalls[curCalls.length - 1];
    const f = lastC ? lastC.fails : 0;
    g.text(2, 21, "failures", "1");
    for (let k = 0; k < THRESH; k++) g.set(12 + k * 2, 21, k < f ? "■" : "□", k < f ? "6" : "b");
    g.text(21, 21, f + "/" + THRESH, f ? "5" : "1");
    g.text(2, 22, "cooldown", "1");
    if (st === "open" && lastTr) {
      const c = clamp((lt - lastTr[0]) / COOL), W = 12, n = Math.round(c * W);
      for (let k = 0; k < W; k++) g.set(12 + k, 22, k < n ? "█" : "░", k < n ? "6" : "2");
      g.text(25, 22, (COOL - (lt - lastTr[0])).toFixed(1) + "s", "6");
    } else g.text(12, 22, "--", "b");
    // downstream health
    const ill = sick(lt);
    g.text(2, 24, "payments-svc", "0");
    g.text(15, 24, ill ? "● degraded, timeouts" : "● healthy", ill ? "6" : "4");
    // call log
    const LX = 60;
    g.box(LX, 1, cols - LX, 24, "round", "b");
    g.text(LX + 2, 1, " calls to payments-svc ", "0");
    const show = curCalls.slice(-20);
    show.forEach((c, i) => {
      const y = 3 + i;
      const fresh = lt - c.t < 0.3;
      g.text(LX + 2, y, "#" + c.id, fresh ? "8" : "b");
      g.text(LX + 8, y, "/charge", "1");
      if (c.res === "ok") { g.text(LX + 16, y, "✓ 200", "4"); g.text(LX + 24, y, c.ms + "ms", "1"); }
      else if (c.res === "fail") { g.text(LX + 16, y, "✗ 504", "6"); g.text(LX + 24, y, "2000ms", "6"); }
      else { g.text(LX + 16, y, "✗ open", "5"); g.text(LX + 24, y, "0ms", "5"); }
      if (c.state === "half") g.text(LX + 32, y, "trial", "a");
    });
    g.text(1, 0, "circuit breaker", "0");
    g.text(18, 0, "threshold " + THRESH + " failures, cooldown " + COOL + "s", "1");
    return g.frame();
  };
}
