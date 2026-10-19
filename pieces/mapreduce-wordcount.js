/* mapreduce-wordcount: input splits mapped to word pairs, shuffled by key to reducers and summed into counts. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "mapreduce-wordcount",
  name: "MapReduce Word Count",
  category: "explainers",
  note: "A MapReduce word count where three input splits are mapped to word and one pairs, shuffled across the network so each key lands on one reducer, then summed into the final counts.",
  tags: ["mapreduce", "big-data", "distributed", "diagram", "algorithm", "docs"],
  cols: 110, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const LINES = ["the cat sat on the mat", "the dog sat by a cat", "a dog and a cat ran"];
const R_OF = (w) => (w[0] < "m" ? 0 : 1);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const pairs = [];
  LINES.forEach((l, m) => l.split(" ").forEach((w, k) => pairs.push({ w, m, k, r: R_OF(w) })));
  const words = [...new Set(pairs.map((p) => p.w))].sort();
  const RKEYS = [words.filter((w) => R_OF(w) === 0), words.filter((w) => R_OF(w) === 1)];
  const count = (w) => pairs.filter((p) => p.w === w).length;
  // layout
  const IX = 1, MX = 30, RX = 70, OX = 94;
  const MY = [3, 11, 19], RY = [3, 15];
  // timing
  const T_SPLIT = 1.5, T_MAP = 4.5, T_SH = 9.5, T_RED = 12, T_OUT = 13.5, LOOP = 18;
  // order pairs for shuffle so they fly in a nice stagger
  pairs.forEach((p, i) => { p.fly0 = T_MAP + 0.2 + (i / pairs.length) * (T_SH - T_MAP - 1.4); });
  const colOf = (w) => ["3", "4", "5", "7", "9", "a"][words.indexOf(w) % 6];
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const phase = lt < T_SPLIT ? 0 : lt < T_MAP ? 1 : lt < T_SH ? 2 : lt < T_OUT ? 3 : 4;
    const PH = ["split", "map", "shuffle", "reduce", "output"];
    // header with phase pipeline
    let x = 1;
    PH.forEach((n, i) => {
      const on = i === phase, done = i < phase;
      g.text(x, 0, (done ? "✓ " : on ? "▶ " : "· ") + n, on ? "a" : done ? "4" : "b");
      x += n.length + 3;
      if (i < 4) { g.text(x, 0, "──", "2"); x += 3; }
    });
    g.text(cols - 32, 0, "job wordcount  3 maps 2 reduces", "b");
    // column titles
    g.text(IX, 2, "input splits", "1"); g.text(MX, 2, "map tasks", "1"); g.text(RX, 2, "reduce tasks", "1"); g.text(OX, 2, "output", "1");
    // inputs and maps
    let emitted = 0;
    LINES.forEach((l, m) => {
      const y = MY[m] + 1;
      g.box(IX, y, 25, 3, "round", phase === 0 ? "3" : "b");
      g.text(IX + 2, y + 1, l, "0");
      g.text(IX + 26, y + 1, "→", phase >= 1 ? "3" : "2");
      // map box
      const mine = pairs.filter((p) => p.m === m);
      const active = phase === 1;
      g.box(MX, y - 1, 32, 6, active ? "heavy" : "round", active ? "9" : "b");
      g.text(MX + 2, y - 1, " map-" + (m + 1) + " ", active ? "9" : "1");
      mine.forEach((p, k) => {
        const emitAt = T_SPLIT + (k / mine.length) * (T_MAP - T_SPLIT - 0.4) + m * 0.15;
        if (lt < emitAt) return;
        emitted++;
        const sent = lt >= p.fly0;
        const px = MX + 2 + (k % 3) * 10, py = y + Math.floor(k / 3);
        g.text(px, py, "(" + p.w + ",1)", sent ? "2" : lt - emitAt < 0.3 ? "8" : colOf(p.w));
      });
    });
    // shuffle bus
    const BUS = 66, bc = phase === 2 ? "1" : "b";
    MY.forEach((m) => g.hline(MX + 32, BUS - 1, m + 3, "─", bc));
    g.vline(BUS, MY[0] + 3, MY[2] + 3, "│", bc);
    RY.forEach((r) => g.hline(BUS + 1, RX - 1, r + 4, "─", bc));
    g.set(BUS, MY[0] + 3, "┐", bc); g.set(BUS, MY[1] + 3, "┤", bc); g.set(BUS, MY[2] + 3, "┘", bc);
    RY.forEach((r) => g.set(BUS, r + 4, "├", bc));
    g.text(BUS - 3, MY[2] + 5, "shuffle", phase === 2 ? "a" : "b");
    // flying pairs
    for (const p of pairs) {
      const f = (lt - p.fly0) / 0.9;
      if (f < 0 || f >= 1) continue;
      const y0 = MY[p.m] + 3, y1 = RY[p.r] + 4;
      const L1 = BUS - (MX + 32), L2 = Math.abs(y1 - y0), L3 = RX - 1 - BUS;
      const d = f * (L1 + L2 + L3);
      let xx, yy;
      if (d < L1) { xx = MX + 32 + d; yy = y0; } else if (d < L1 + L2) { xx = BUS; yy = y0 + Math.sign(y1 - y0) * (d - L1); } else { xx = BUS + (d - L1 - L2); yy = y1; }
      g.set(Math.round(xx), Math.round(yy), "●", colOf(p.w));
    }
    // reducers
    RKEYS.forEach((keys, r) => {
      const y = RY[r];
      const active = phase === 2 || phase === 3;
      g.box(RX, y, 22, 10, active ? "heavy" : "round", active ? "7" : "b");
      g.text(RX + 2, y, " reduce-" + (r + 1) + " ", active ? "7" : "1");
      g.text(RX + 13, y, r === 0 ? " a-l " : " m-z ", "b");
      keys.forEach((w, k) => {
        const got = pairs.filter((p) => p.w === w && lt >= p.fly0 + 0.9).length;
        if (!got) return;
        const yy = y + 1 + k;
        g.text(RX + 2, yy, w, colOf(w));
        const sumAt = T_SH + 0.4 + k * 0.35 + r * 0.2;
        if (lt >= sumAt) g.text(RX + 8, yy, "= " + count(w), "8");
        else g.text(RX + 8, yy, "1".repeat(got).split("").join(" ").slice(0, 12), "1");
      });
    });
    // output
    g.box(OX, 3, 15, 12, phase === 4 ? "heavy" : "round", phase === 4 ? "4" : "b");
    g.text(OX + 2, 3, " part-0000 ", phase === 4 ? "4" : "1");
    words.forEach((w, i) => {
      const at = T_OUT + i * 0.25;
      if (lt < at) return;
      g.text(OX + 2, 4 + i, w, colOf(w));
      g.text(OX + 10, 4 + i, String(count(w)).padStart(2), "0");
    });
    // footer
    const sent = pairs.filter((p) => lt >= p.fly0 + 0.9).length;
    g.text(1, rows - 2, "pairs emitted " + emitted, "1");
    g.text(22, rows - 2, "shuffled " + sent + "/" + pairs.length, phase === 2 ? "a" : "1");
    g.text(42, rows - 2, "partition = first letter < m ? reduce-1 : reduce-2", "b");
    return g.frame();
  };
}
