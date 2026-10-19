/* lru-cache: a five-slot least recently used cache, hits jump to the front, new keys push in and the tail is evicted. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "lru-cache",
  name: "LRU Cache Eviction",
  category: "explainers",
  note: "A least recently used cache of five entries drawn as a linked list, where every hit lifts its node to the front, every new key slides in at the head and the oldest entry falls off the tail when the cache is full.",
  tags: ["cache", "lru", "data-structure", "algorithm", "diagram", "computer-science"],
  cols: 100, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const CAP = 5;
const OPS = [
  ["put", "A", 17], ["put", "B", 42], ["put", "C", 8], ["get", "A"], ["put", "D", 23], ["put", "E", 91], ["get", "B"],
  ["put", "F", 5], ["get", "C"], ["get", "A"], ["put", "G", 64], ["get", "E"], ["put", "H", 30], ["get", "F"], ["get", "D"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // simulate
  const states = [{ order: [], vals: {}, hits: 0, miss: 0 }];
  const info = [];
  for (const [op, k, v] of OPS) {
    const s = states[states.length - 1];
    const order = s.order.slice(), vals = { ...s.vals };
    let hits = s.hits, miss = s.miss, kind, evicted = null;
    if (op === "get") {
      const i = order.indexOf(k);
      if (i >= 0) { order.splice(i, 1); order.unshift(k); hits++; kind = "hit"; }
      else { miss++; kind = "miss"; }
    } else {
      const i = order.indexOf(k);
      if (i >= 0) order.splice(i, 1);
      order.unshift(k); vals[k] = v; kind = "insert";
      if (order.length > CAP) { evicted = order.pop(); delete vals[evicted]; kind = "evict"; }
    }
    states.push({ order, vals, hits, miss, evictedVal: evicted ? s.vals[evicted] : null });
    info.push({ op, k, v, kind, evicted });
  }
  const STEP = 1.7, LOOP = OPS.length * STEP + 2;
  const SX = (i) => 6 + i * 18, NY = 10, NW = 13;
  const node = (x, y, k, val, co, hl) => {
    x = Math.round(x); y = Math.round(y);
    for (let yy = y; yy < y + 4; yy++) for (let xx = x; xx < x + NW; xx++) g.set(xx, yy, " ");
    g.box(x, y, NW, 4, hl ? "heavy" : "round", co);
    g.text(x + 2, y + 1, "key " + k, hl ? "8" : "0");
    g.text(x + 2, y + 2, "val " + val, "1");
  };
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const oi = Math.min(OPS.length - 1, Math.floor(lt / STEP));
    const ending = lt >= OPS.length * STEP;
    const before = states[oi], after = states[oi + 1], I = info[oi];
    const p = ending ? 1 : clamp((lt - oi * STEP - 0.35) / 0.9);
    const e = p * p * (3 - 2 * p);
    // op tape
    g.text(1, 0, "lru cache", "0");
    g.text(12, 0, "capacity " + CAP, "1");
    let x = 1;
    for (let j = Math.max(0, oi - 3); j < OPS.length && x < cols - 12; j++) {
      const [op, k, v] = OPS[j];
      const s = op === "get" ? "get(" + k + ")" : "put(" + k + "," + v + ")";
      const cur = j === oi && !ending;
      g.text(x, 2, s, cur ? "a" : j < oi || ending ? "1" : "b");
      if (cur) g.hline(x, x + s.length - 1, 3, "─", "a");
      x += s.length + 3;
    }
    // result banner
    const RES = { hit: ["hit, move to front", "4"], miss: ["miss, not cached", "6"], insert: ["insert at head", "3"], evict: ["insert at head, evict " + I.evicted + " from tail", "5"] };
    const [rm, rc] = RES[I.kind];
    // list frame labels
    g.text(1, NY + 1, "head", "3");
    g.text(1, NY + 2, "MRU", "b");
    g.text(SX(CAP) - 1, NY + 1, "tail", "7");
    g.text(SX(CAP) - 1, NY + 2, "LRU", "b");
    // links between slots
    for (let i = 0; i < CAP - 1; i++) {
      const have = Math.max(before.order.length, after.order.length);
      if (i + 1 < have) g.text(SX(i) + NW, NY + 1, "──→", "b"), g.text(SX(i) + NW, NY + 2, "←──", "b");
    }
    // nodes
    const keys = new Set([...before.order, ...after.order, ...(I.evicted ? [I.evicted] : [])]);
    const draws = [];
    for (const k of keys) {
      const i0 = before.order.indexOf(k), i1 = after.order.indexOf(k);
      let px, py, co = "9", hl = false;
      const val = after.vals[k] !== undefined ? after.vals[k] : before.vals[k];
      if (i0 < 0 && i1 >= 0) { // new key drops in from above
        px = SX(0); py = NY - 6 + 6 * e; co = "3"; hl = e < 1;
      } else if (i1 < 0) { // evicted
        px = SX(CAP - 1) + 18 * Math.min(1, e * 1.5); py = NY + Math.max(0, e * 1.5 - 1) * 14; co = "6"; hl = true;
        if (py > rows) continue;
      } else {
        px = SX(i0) + (SX(i1) - SX(i0)) * e; py = NY;
        if (I.kind === "hit" && k === I.k && !ending) { py = NY - Math.sin(Math.PI * e) * 5; co = "4"; hl = true; }
      }
      if (ending) { co = "9"; hl = false; }
      draws.push([px, py, k, val, co, hl]);
    }
    // moving nodes are drawn last so an overlap always shows one whole box on top
    draws.sort((a, b) => a[5] - b[5]).forEach((d) => node(...d));
    // miss probe
    if (!ending && I.kind === "miss") {
      const f = clamp((lt - oi * STEP) / 1.2);
      const k = Math.round(f * (SX(CAP - 1) + NW - SX(0)));
      g.text(SX(0) + k, NY - 2, "?" , "6");
    }
    if (!ending && lt - oi * STEP > 0.25) g.text(1, 18, (I.op === "get" ? "get " : "put ") + I.k + ": " + rm, rc);
    // hash map row
    g.text(1, 16, "map", "1");
    const cur = p > 0.5 ? after : before;
    "ABCDEFGH".split("").forEach((k, i) => {
      const inn = cur.order.includes(k);
      const xx = 6 + i * 11;
      g.text(xx, 16, k, inn ? "0" : "2");
      g.text(xx + 2, 16, inn ? "→ node" : "· none", inn ? "9" : "2");
    });
    // stats
    const st = cur;
    const total = st.hits + st.miss;
    g.hline(0, cols - 1, 19, "─", "2");
    g.text(1, 20, "hits " + st.hits, "4");
    g.text(11, 20, "misses " + st.miss, "6");
    g.text(24, 20, "hit rate " + (total ? Math.round((st.hits / total) * 100) : 0) + "%", "0");
    g.text(41, 20, "size " + st.order.length + "/" + CAP, "1");
    g.text(1, 22, "get and put are O(1): a hash map finds the node, a doubly linked list keeps recency order", "b");
    return g.frame();
  };
}
