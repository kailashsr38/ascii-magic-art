/* compiler-output: a build compiling crates, printing a warning with a code snippet, then finishing. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "compiler-output",
  name: "Compiler Warnings",
  category: "screens",
  note: "A compiler build log that compiles dependencies, prints an unused variable warning with a pointed snippet and finishes green.",
  tags: ["compiler", "build", "terminal", "developer", "cli", "rust"],
  cols: 86, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const DEPS = [
  ["libc", "0.2.158"], ["cfg-if", "1.0.0"], ["memchr", "2.7.4"], ["itoa", "1.0.11"], ["serde", "1.0.210"],
  ["bytes", "1.7.2"], ["log", "0.4.22"], ["smallvec", "1.13.2"], ["regex-syntax", "0.8.4"], ["mio", "1.0.2"],
  ["serde_json", "1.0.128"], ["regex", "1.10.6"], ["tokio", "1.40.0"], ["hyper", "1.4.1"], ["tracing", "0.1.40"],
];
// each output line: [text segments], appears at time
function script() {
  const L = [];
  let tt = 0.6;
  for (const [n, v] of DEPS) { L.push([tt, [["   Compiling ", "2"], [n + " v" + v, "0"]]]); tt += 0.28; }
  L.push([tt, [["   Compiling ", "2"], ["edge-proxy v0.3.0 (/home/dev/edge-proxy)", "0"]]]); tt += 0.9;
  const warn = [
    [["warning", "9"], [": unused variable: `retries`", "0"]],
    [["  --> ", "3"], ["src/upstream.rs:42:9", "1"]],
    [["   |", "3"]],
    [["42 ", "3"], ["|", "3"], ["     let retries = cfg.max_retries;", "0"]],
    [["   |", "3"], ["         ^^^^^^^ ", "9"], ["help: if this is intentional, prefix it: `_retries`", "9"]],
    [["   |", "3"]],
    [["   = ", "3"], ["note", "0"], [": `#[warn(unused_variables)]` on by default", "1"]],
    [[""]],
    [["warning", "9"], [": field `created_at` is never read", "0"]],
    [["  --> ", "3"], ["src/cache.rs:17:5", "1"]],
    [["17 ", "3"], ["|", "3"], ["     created_at: Instant,", "0"]],
    [["   |", "3"], ["     ^^^^^^^^^^", "9"]],
    [[""]],
  ];
  for (const w of warn) { L.push([tt, w]); tt += 0.08; }
  tt += 0.5;
  L.push([tt, [["warning", "9"], [": `edge-proxy` (bin \"edge-proxy\") generated 2 warnings", "0"]]]); tt += 1.2;
  L.push([tt, [["    Finished ", "2"], ["`release` profile [optimized] target(s) in 18.42s", "0"]]]); tt += 0.5;
  L.push([tt, [["     Running ", "2"], ["`target/release/edge-proxy --port 8443`", "0"]]]); tt += 0.4;
  L.push([tt, [["2026-10-18T09:41:07Z ", "7"], [" INFO ", "2"], ["listening on 0.0.0.0:8443, 8 workers", "0"]]]);
  return [L, tt + 3];
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const [L, PERIOD] = script();
  const VIS = H - 5;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " dev@buildbox: ~/edge-proxy ", "1");
    g.text(2, 1, "$ ", "2");
    const cmd = "build --release && run";
    g.text(4, 1, cmd.slice(0, Math.floor(lt / 0.025)), "0");
    const shown = L.filter((l) => l[0] <= lt);
    const start = Math.max(0, shown.length - VIS);
    shown.slice(start).forEach(([, segs], i) => {
      let x = 2;
      for (const [s, c] of segs) { g.text(x, 2 + i, s, c); x += s.length; }
    });
    // progress bar while compiling
    const compiled = shown.filter((l) => l[1][0][0] === "   Compiling ").length;
    const total = DEPS.length + 1;
    const fin = shown.some((l) => l[1][0][0] === "    Finished ");
    if (!fin) {
      const bw = 34, n = Math.round((compiled / total) * bw);
      g.text(2, H - 2, "    Building ", "3");
      g.text(15, H - 2, "[" + "=".repeat(Math.max(0, n - 1)) + (n < bw ? ">" : "=") + " ".repeat(bw - n) + "]", "3");
      g.text(52, H - 2, `${compiled}/${total}: ` + (compiled < total ? (DEPS[compiled] || ["edge-proxy"])[0] : "edge-proxy(bin)"), "0");
    } else if (Math.floor(lt * 3) % 2 === 0) g.set(2, Math.min(H - 2, 2 + shown.length - start), "█", "0");
    return g.frame();
  };
}
