/* pubsub-fanout: one event published to a topic is copied to four subscribers, each consuming at its own pace. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "pubsub-fanout",
  name: "Pub Sub Fan Out",
  category: "explainers",
  note: "A publish and subscribe diagram where each order event lands on a topic and fans out to four subscriber queues, one of them slow enough to build a backlog that it later works through.",
  tags: ["pubsub", "events", "messaging", "diagram", "backend", "docs"],
  cols: 100, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

// name, process seconds, colour, row
const SUBS = [["email-sender", 0.7, "3", 1], ["billing", 1.0, "4", 7], ["analytics", 2.2, "5", 13], ["search-index", 1.2, "7", 19]];
const EVT = ["order.created", "order.paid", "order.created", "order.shipped", "order.created", "order.paid", "order.refunded", "order.created", "order.paid", "order.shipped", "order.created", "order.paid"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LOOP = 30, PUB = 1.6, FLY = 0.7;
  const events = EVT.map((name, i) => ({ id: 1040 + i, name, tp: 0.5 + i * PUB }));
  // per subscriber FIFO timelines
  const sched = SUBS.map(([, dur]) => {
    let free = 0;
    return events.map((e) => {
      const arrive = e.tp + 0.5 + FLY;
      const start = Math.max(arrive, free);
      free = start + dur;
      return { arrive, start, end: free };
    });
  });
  const BUSX = 62;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    // publisher
    const pubOn = events.some((e) => lt >= e.tp - 0.3 && lt < e.tp);
    g.box(1, 9, 18, 6, pubOn ? "heavy" : "round", "9");
    g.text(3, 10, "order-service", "0");
    g.text(3, 11, "publisher", "1");
    const lastPub = events.filter((e) => e.tp <= lt).pop();
    g.text(3, 12, lastPub ? "sent #" + lastPub.id : "starting", "1");
    g.hline(19, 25, 12, "─", "b");
    // topic
    g.box(26, 7, 26, 11, "heavy", "a");
    g.text(28, 7, " topic ", "a");
    g.text(28, 8, "orders", "0");
    g.text(28, 9, "retention 7d · 3 parts", "b");
    g.hline(28, 49, 10, "─", "2");
    const log = events.filter((e) => e.tp + 0.5 <= lt).slice(-6);
    log.forEach((e, i) => {
      const y = 11 + i;
      const fresh = lt - (e.tp + 0.5) < 0.5;
      g.text(28, y, String(e.id), fresh ? "8" : "1");
      g.text(33, y, e.name, fresh ? "a" : "0");
      g.text(48, y, "+" + (e.id - 1040), "b");
    });
    // fan out tree
    g.hline(52, BUSX, 12, "─", "b");
    g.vline(BUSX, SUBS[0][3] + 2, SUBS[3][3] + 2, "│", "b");
    SUBS.forEach(([, , , y]) => g.hline(BUSX + 1, 74, y + 2, "─", "b"));
    g.set(BUSX, SUBS[0][3] + 2, "┌", "b"); g.set(BUSX, SUBS[3][3] + 2, "└", "b");
    g.set(BUSX, SUBS[1][3] + 2, "├", "b"); g.set(BUSX, SUBS[2][3] + 2, "├", "b");
    g.set(BUSX, 12, "┤", "b");
    // packets: publisher -> topic
    for (const e of events) {
      if (lt >= e.tp && lt < e.tp + 0.5) {
        const x = Math.round(19 + ((lt - e.tp) / 0.5) * 6);
        g.set(x, 12, "●", "9");
      }
      // topic -> subscribers (copies)
      const t0 = e.tp + 0.5;
      if (lt >= t0 && lt < t0 + FLY) {
        const f = (lt - t0) / FLY;
        SUBS.forEach(([, , co, y]) => {
          // path: 52..BUSX at row 12, then vertical to y+2, then to 74
          const ty = y + 2;
          const L1 = BUSX - 52, L2 = Math.abs(ty - 12), L3 = 74 - BUSX;
          let d = f * (L1 + L2 + L3), x, yy;
          if (d < L1) { x = 52 + d; yy = 12; } else if (d < L1 + L2) { x = BUSX; yy = 12 + Math.sign(ty - 12) * (d - L1); } else { x = BUSX + (d - L1 - L2); yy = ty; }
          g.set(Math.round(x), Math.round(yy), "●", co);
        });
      }
    }
    // subscribers
    let maxLag = 0;
    SUBS.forEach(([name, dur, co, y], s) => {
      const S = sched[s];
      const working = S.findIndex((q) => q.start <= lt && q.end > lt);
      const waiting = S.filter((q) => q.arrive <= lt && q.start > lt).length;
      const acked = S.filter((q) => q.end <= lt).length;
      maxLag = Math.max(maxLag, waiting);
      g.box(75, y, 24, 5, working >= 0 ? "heavy" : "round", working >= 0 ? co : "b");
      g.text(77, y, " " + name + " ", co);
      // inbox slots
      g.text(77, y + 1, "inbox", "1");
      for (let k = 0; k < 8; k++) g.set(83 + k * 2, y + 1, k < waiting ? "■" : "·", k < waiting ? (waiting > 3 ? "6" : co) : "2");
      if (working >= 0) {
        const q = S[working], f = clamp((lt - q.start) / dur);
        g.text(77, y + 2, "#" + events[working].id, "0");
        const W = 13, n = Math.round(f * W);
        for (let k = 0; k < W; k++) g.set(83 + k, y + 2, k < n ? "█" : "░", k < n ? co : "2");
      } else g.text(77, y + 2, "idle", "1");
      g.text(77, y + 3, "acked " + acked, "1");
      g.text(88, y + 3, "lag " + waiting, waiting > 3 ? "6" : waiting ? "a" : "4");
    });
    // header and footer
    g.text(1, 0, "event bus", "0");
    g.text(12, 0, "4 subscriptions, at-least-once", "1");
    g.text(1, rows - 2, "each subscriber gets its own copy and its own offset", "b");
    g.text(1, rows - 1, "slow consumers fall behind without blocking the others", "b");
    g.text(1, 20, "max lag", "1");
    g.text(9, 20, String(maxLag).padEnd(3), maxLag > 3 ? "6" : "4");
    return g.frame();
  };
}
