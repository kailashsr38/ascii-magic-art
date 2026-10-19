/* benchmark-table: a benchmark runner filling a results table with timings and changes against a baseline. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "benchmark-table",
  name: "Benchmark Results",
  category: "screens",
  note: "A benchmark runner that measures each case with a live iteration counter and fills a table of timings compared to the last baseline.",
  tags: ["benchmark", "performance", "terminal", "developer", "table", "cli"],
  cols: 92, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

// name, ns/iter, delta vs baseline (fraction)
const CASES = [
  ["json/parse/small", 1204, -0.031], ["json/parse/large", 482113, -0.124], ["json/stringify/nested", 8320, 0.012],
  ["router/match/static", 41, -0.004], ["router/match/params", 188, 0.067], ["router/match/wildcard", 302, 0.142],
  ["hash/sha256/1kb", 2210, 0.002], ["hash/xxh3/1kb", 96, -0.018], ["compress/lz4/64kb", 18440, -0.211],
  ["compress/zstd/64kb", 61207, 0.008], ["regex/email/1k", 39880, 0.044], ["alloc/vec/push-1m", 912004, -0.063],
];
const fmt = (ns) => ns >= 1e6 ? (ns / 1e6).toFixed(2) + " ms" : ns >= 1e3 ? (ns / 1e3).toFixed(2) + " µs".replace("µ", "u") : ns + " ns";
const STEP = 0.75;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const r = rng(5);
  const pm = CASES.map(() => 0.5 + r() * 3);
  const PERIOD = 1 + CASES.length * STEP + 4.5;
  const maxLog = Math.log10(1e6);
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " bench · core-lib · baseline main@4e1c9a ", "1");
    g.text(2, 1, "Benchmark".padEnd(26), "0"); g.text(28, 1, "time/iter".padStart(11), "0"); g.text(41, 1, "±", "0");
    g.text(49, 1, "change", "0"); g.text(61, 1, "relative (log)", "0");
    g.hline(1, W - 2, 2, "─", "8");
    let regress = 0, improve = 0;
    CASES.forEach(([name, ns, d], i) => {
      const y = 3 + i;
      const at = 1 + i * STEP;
      const [grp, ...rest] = name.split("/");
      g.text(2, y, grp + "/", "7"); g.text(3 + grp.length, y, rest.join("/"), lt >= at ? "0" : "7");
      if (lt < at) { g.text(28, y, "·".repeat(11), "8"); return; }
      const k = lt - at;
      if (k < STEP) {
        const sp = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(lt * 14) % 10];
        g.set(1, y, sp, "3");
        const it = Math.floor((k / STEP) * 1e7 / Math.max(1, Math.log10(ns) * 3));
        g.text(28, y, ("iter " + it.toLocaleString("en-US")).padStart(15), "3");
        const bw = 18, n = Math.round((k / STEP) * bw);
        g.text(49, y, "█".repeat(n) + "░".repeat(bw - n), "3");
        return;
      }
      g.text(28, y, fmt(ns).padStart(11), "0");
      g.text(41, y, ("±" + pm[i].toFixed(1) + "%").padStart(6), "1");
      const sig = Math.abs(d) >= 0.05;
      const ch = (d > 0 ? "+" : "") + (d * 100).toFixed(1) + "%";
      const c = !sig ? "1" : d > 0 ? "5" : "2";
      if (sig) d > 0 ? regress++ : improve++;
      g.text(49, y, ch.padStart(7), c);
      g.text(57, y, sig ? (d > 0 ? "▲" : "▼") : "·", c);
      const bw = W - 64, n = Math.max(1, Math.round((Math.log10(ns) / maxLog) * bw));
      g.text(61, y, "■".repeat(n), sig ? c : "3");
    });
    const done = lt >= 1 + CASES.length * STEP;
    const yS = 4 + CASES.length;
    g.hline(1, W - 2, yS, "─", "8");
    if (done) {
      g.text(2, yS + 1, `${CASES.length} benchmarks · `, "0");
      g.text(19, yS + 1, `${improve} improved`, "2"); g.text(31, yS + 1, "· ", "1");
      g.text(33, yS + 1, `${regress} regressed`, "5"); g.text(45, yS + 1, `· ${CASES.length - improve - regress} within noise (5%)`, "1");
      g.text(2, yS + 3, "warning:", "9"); g.text(11, yS + 3, "router/match/wildcard regressed 14.2%, over the 10% budget", "0");
      g.text(2, yS + 4, "saved results to target/bench/2026-10-18T09-41.json", "7");
    } else {
      const n = Math.min(CASES.length, Math.floor((lt - 1) / STEP) + 1);
      g.text(2, yS + 1, `running ${Math.max(0, n)}/${CASES.length}  warmup 3s · measure 5s · 100 samples`, "1");
    }
    return g.frame();
  };
}
