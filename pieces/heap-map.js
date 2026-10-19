/* heap-map: a memory allocator heap map where blocks are allocated and freed, fragmenting until compaction. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "heap-map",
  name: "Heap Allocator Map",
  category: "screens",
  note: "A memory allocator page map where blocks are allocated and freed, fragmentation builds up and a compaction pass packs it tight.",
  tags: ["memory", "allocator", "heap", "developer", "dashboard", "terminal"],
  cols: 84, rows: 28, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd", "#ff9bce"]),
};

const MW = 48, MH = 20, CELLS = MW * MH;
const KINDS = [["buffer", "3"], ["string", "2"], ["node", "6"], ["vec", "4"], ["map", "a"], ["image", "b"]];
const RUN = 10, COMPACT = 2.2, PERIOD = RUN + COMPACT + 1.5;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  // precompute a deterministic event list: [time, op, id, size]
  const r = rng(21);
  const ev = [];
  const live = [];
  let id = 1;
  for (let tt = 0; tt < RUN; tt += 0.07) {
    if (live.length > 6 && r() < (tt < 5 ? 0.3 : 0.47)) {
      const k = Math.floor(r() * live.length);
      ev.push([tt, "free", live[k]]); live.splice(k, 1);
    } else {
      const size = Math.floor(3 + Math.pow(r(), 1.7) * 56);
      ev.push([tt, "alloc", id, size, Math.floor(r() * KINDS.length)]); live.push(id++);
    }
  }
  const mem = new Int16Array(CELLS);
  const kindOf = new Map(), sizeOf = new Map(), addrOf = new Map();
  function simulate(lt) {
    mem.fill(0); kindOf.clear(); sizeOf.clear(); addrOf.clear();
    const log = [];
    let fails = 0;
    for (const e of ev) {
      if (e[0] > lt) break;
      if (e[1] === "alloc") {
        const [, , i, size, kind] = e;
        // first fit
        let run = 0, at = -1;
        for (let c = 0; c < CELLS; c++) { run = mem[c] ? 0 : run + 1; if (run === size) { at = c - size + 1; break; } }
        if (at < 0) { fails++; log.push(["alloc", i, size, -1]); continue; }
        for (let c = at; c < at + size; c++) mem[c] = i;
        kindOf.set(i, kind); sizeOf.set(i, size); addrOf.set(i, at);
        log.push(["alloc", i, size, at]);
      } else {
        const i = e[2];
        if (!addrOf.has(i)) continue;
        const at = addrOf.get(i), size = sizeOf.get(i);
        for (let c = at; c < at + size; c++) mem[c] = 0;
        log.push(["free", i, size, at]);
        addrOf.delete(i);
      }
    }
    return [log, fails];
  }
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const [log, fails] = simulate(Math.min(lt, RUN));
    // compaction: slide used cells left progressively
    let cm = mem;
    const cp = Math.max(0, Math.min(1, (lt - RUN) / COMPACT));
    if (cp > 0) {
      const used = []; for (let c = 0; c < CELLS; c++) if (mem[c]) used.push(c);
      cm = new Int16Array(CELLS);
      const moved = Math.floor(cp * used.length);
      for (let k = 0; k < used.length; k++) cm[k < moved ? k : used[k]] = mem[used[k]];
    }
    if (lt > RUN + COMPACT + 0.9) cm = new Int16Array(CELLS);
    g.box(0, 0, MW + 4, MH + 3, "round", "7");
    g.text(2, 0, " heap · arena 0 · 4 KiB pages ", "1");
    g.text(2, 1, "0x7f3a00000000", "7");
    for (let c = 0; c < CELLS; c++) {
      const x = 2 + (c % MW), y = 2 + Math.floor(c / MW);
      const v = cm[c];
      if (!v) { g.set(x, y, "·", "8"); continue; }
      const k = KINDS[kindOf.get(v) ?? 0];
      const edge = c + 1 < CELLS && cm[c + 1] !== v;
      g.set(x, y, edge ? "▌" : "█", k[1]);
    }
    // stats
    let used = 0, largest = 0, run = 0, holes = 0;
    for (let c = 0; c < CELLS; c++) {
      if (cm[c]) { used++; if (run) holes++; run = 0; } else { run++; if (run > largest) largest = run; }
    }
    const free = CELLS - used;
    const frag = free ? 1 - largest / free : 0;
    const SX = MW + 6;
    g.text(SX, 1, "ARENA STATS", "0");
    const row = (y, k, v, c = "0") => { g.text(SX, y, k, "1"); g.text(SX + 13, y, v, c); };
    row(3, "pages", String(CELLS));
    row(4, "used", `${used} (${Math.round((used / CELLS) * 100)}%)`, "3");
    row(5, "free", String(free), "2");
    row(6, "largest run", String(largest), "2");
    row(7, "free holes", String(holes), holes > 20 ? "4" : "0");
    row(8, "fragment", `${Math.round(frag * 100)}%`, frag > 0.6 ? "5" : frag > 0.35 ? "9" : "2");
    const bw = 20, n = Math.round(frag * bw);
    g.text(SX, 9, "█".repeat(n), frag > 0.6 ? "5" : "9"); g.text(SX + n, 9, "░".repeat(bw - n), "8");
    row(10, "failed", String(fails), fails ? "5" : "1");
    KINDS.forEach(([name, c], i) => { g.text(SX + (i % 2) * 12, 12 + Math.floor(i / 2), "█", c); g.text(SX + 2 + (i % 2) * 12, 12 + Math.floor(i / 2), name, "1"); });
    g.text(SX, 16, "CALLS", "0");
    const tail = cp > 0 ? [["gc", 0, 0, 0]] : log.slice(-6);
    tail.forEach((l, i) => {
      const y = 17 + i;
      if (l[0] === "gc") { g.text(SX, y, `compact ${Math.round(cp * 100)}%`, "9"); g.text(SX, y + 1, "moving live blocks left", "1"); return; }
      const [op, idd, size, at] = l;
      if (op === "alloc") {
        g.text(SX, y, "malloc", at < 0 ? "5" : "2");
        g.text(SX + 7, y, `(${size * 4}K)`.padEnd(8), "0");
        g.text(SX + 16, y, at < 0 ? "ENOMEM" : "#" + idd, at < 0 ? "5" : "1");
      } else {
        g.text(SX, y, "free  ", "4"); g.text(SX + 7, y, `(#${idd})`.padEnd(8), "0"); g.text(SX + 16, y, "+" + size * 4 + "K", "1");
      }
    });
    g.text(2, H - 4, "· free page   █ live block   ▌ block end   first-fit policy", "7");
    g.text(2, H - 2, `t=${(Math.min(lt, RUN) * 1000).toFixed(0).padStart(5)}ms  live objects ${addrOf.size}`, "1");
    return g.frame();
  };
}
