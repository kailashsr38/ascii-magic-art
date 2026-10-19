/* flame-graph: a CPU profiler flame graph that settles as samples accumulate, with a cursor inspecting frames. */
import { Grid, palette, rng, clamp } from "../lib/kit.js";

export const meta = {
  slug: "flame-graph",
  name: "Profiler Flame Graph",
  category: "screens",
  note: "A CPU profiler flame graph whose stacks grow and settle as samples come in while a cursor inspects the hottest frames.",
  tags: ["profiler", "performance", "flamegraph", "developer", "dashboard", "terminal"],
  cols: 100, rows: 26, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff",
    "#b62324", "#d1462b", "#e2662f", "#ec8a3a", "#f2a649", "#f5c35c", "#f8dc76"]),
};

// tree: [name, selfWeight, children]
const N = (n, w, k = []) => [n, w, k];
const TREE = N("all", 0, [
  N("main", 1, [
    N("http::serve", 2, [
      N("router::dispatch", 1, [
        N("handlers::search", 2, [
          N("index::query", 4, [N("tokenize", 6), N("bm25::score", 14, [N("f64::ln", 5)]), N("heap::push", 4)]),
          N("json::encode", 9, [N("fmt::write", 4)]),
        ]),
        N("handlers::orders", 2, [N("db::query", 3, [N("pool::acquire", 3), N("pg::wire::read", 8)]), N("serde::de", 6)]),
      ]),
      N("tls::read", 3, [N("aes_gcm::open", 7)]),
    ]),
    N("gc::collect", 3, [N("mark", 6), N("sweep", 4)]),
  ]),
  N("tokio::worker", 1, [N("epoll_wait", 7), N("park", 2)]),
]);

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  // flatten with noise seeds
  const nodes = [];
  const r = rng(9);
  (function walk(n, d, parent) {
    const o = { name: n[0], self: n[1], kids: [], d, parent, seed: r() };
    nodes.push(o);
    if (parent) parent.kids.push(o);
    n[2].forEach((k) => walk(k, d + 1, o));
    return o;
  })(TREE, 0, null);
  const root = nodes[0];
  const total = (o) => (o.tot = o.self + o.kids.reduce((a, k) => a + total(k), 0));
  total(root);
  const PERIOD = 14;
  const GW = W - 4, BASE = H - 7;
  const HOT = ["bm25::score", "pg::wire::read", "aes_gcm::open", "json::encode", "mark"];
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const prog = clamp(lt / 6);
    const samples = Math.floor(48213 * (1 - Math.pow(1 - prog, 2)));
    // weights: noisy early, converging; deeper frames appear as samples grow
    const wOf = (o) => {
      const noise = (1 - prog) * 0.8 * Math.sin(lt * 3 + o.seed * 40);
      return Math.max(0.01, o.tot * (1 + noise));
    };
    const maxD = 1 + Math.floor(prog * 7);
    const layout = [];
    (function place(o, x, w) {
      if (o.d > maxD) return;
      layout.push([o, x, w]);
      const sum = o.kids.reduce((a, k) => a + wOf(k), 0) + o.self;
      let cx = x;
      for (const k of o.kids) { const kw = (wOf(k) / sum) * w; place(k, cx, kw); cx += kw; }
    })(root, 0, GW);
    g.text(2, 0, "cpu profile · search-api pid 4182 · 99 Hz", "0");
    g.text(W - 22, 0, `samples ${samples.toLocaleString("en-US").padStart(7)}`, "5");
    g.hline(0, W - 1, 1, "─", "3");
    // cursor walks hot frames once settled
    const hi = lt > 6.5 ? HOT[Math.floor((lt - 6.5) / 1.5) % HOT.length] : null;
    let hiInfo = null;
    for (const [o, x, w] of layout) {
      const y = BASE - o.d * 2;
      const x0 = 2 + Math.round(x), x1 = 2 + Math.round(x + w) - 1;
      if (x1 - x0 < 0 || y < 2) continue;
      const heat = clamp(o.self / Math.max(1, o.tot) + o.seed * 0.35);
      const c = "6789abc"[Math.min(6, Math.floor(heat * 7))];
      const isHi = hi && o.name === hi;
      for (let xx = x0; xx <= x1; xx++) {
        g.set(xx, y, xx === x1 && x1 > x0 ? "▌" : "█", isHi ? "0" : c);
        g.set(xx, y - 1, xx === x1 && x1 > x0 ? " " : "▄", isHi ? "0" : c);
      }
      if (x1 - x0 >= 4) {
        const lab = o.name.slice(0, x1 - x0 - 1);
        g.text(x0 + 1, y, lab, isHi ? "5" : "0");
      }
      if (isHi) hiInfo = [o, x0, y];
    }
    g.hline(0, W - 1, H - 6, "─", "3");
    if (hiInfo) {
      const [o, x0, y] = hiInfo;
      g.set(x0, y - 2, "▼", "0");
      const pct = (o.tot / root.tot) * 100;
      g.text(2, H - 5, "▶ " + o.name, "0");
      g.text(26, H - 5, `${pct.toFixed(1)}% of samples`, "c");
      g.text(46, H - 5, `self ${((o.self / root.tot) * 100).toFixed(1)}%`, "a");
      let p = o.parent, path = [];
      while (p && p.parent) { path.unshift(p.name); p = p.parent; }
      g.text(2, H - 4, path.join(" → ").slice(0, W - 4), "1");
    } else {
      g.text(2, H - 5, prog < 1 ? "recording" + ".".repeat(1 + Math.floor(lt * 3) % 3) : "profile complete", prog < 1 ? "4" : "4");
      const bw = 40, n = Math.round(prog * bw);
      g.text(2, H - 4, "█".repeat(n), "4"); g.text(2 + n, H - 4, "░".repeat(bw - n), "3");
    }
    g.text(2, H - 2, "click a frame to zoom · / search · r reset · s sort by self", "2");
    return g.frame();
  };
}
