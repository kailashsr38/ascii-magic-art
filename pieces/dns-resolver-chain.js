/* dns-resolver-chain: a DNS lookup hopping from the client through resolver, root, TLD and authoritative servers. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "dns-resolver-chain",
  name: "DNS Resolver Chain",
  category: "screens",
  note: "A DNS lookup diagram where a query packet hops from the client to the resolver, root, TLD and authoritative servers and the answer returns.",
  tags: ["dns", "network", "diagram", "terminal", "developer", "education"],
  cols: 96, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const NODES = [
  ["laptop", "stub client", 3, 11],
  ["resolver", "10.0.0.1", 23, 11],
  ["root", "a.root-servers", 50, 2],
  ["TLD .dev", "ns1.tld-dev", 74, 7],
  ["authoritative", "ns.example.dev", 74, 16],
];
const BW = 18, BH = 4;
// hops: [from, to, label, answer?]
const HOPS = [
  [0, 1, "A? shop.example.dev", 0],
  [1, 2, "A? shop.example.dev", 0],
  [2, 1, "refer: .dev NS", 1],
  [1, 3, "A? shop.example.dev", 0],
  [3, 1, "refer: example.dev NS", 1],
  [1, 4, "A? shop.example.dev", 0],
  [4, 1, "A 203.0.113.42 ttl 300", 1],
  [1, 0, "A 203.0.113.42", 1],
];
const HOP = 1.1, PERIOD = 0.6 + HOPS.length * HOP + 3.2;
const MS = [1, 18, 18, 22, 22, 31, 31, 1];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const center = (i) => [NODES[i][2] + BW / 2, NODES[i][3] + BH / 2];
  const edge = (a, b) => {
    // connect box edges horizontally/vertically
    const [ax, ay] = center(a), [bx, by] = center(b);
    const sx = bx > ax ? NODES[a][2] + BW : NODES[a][2] - 1, ex = bx > ax ? NODES[b][2] - 1 : NODES[b][2] + BW;
    return [sx, ay, ex, by];
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const hi = Math.floor((lt - 0.6) / HOP), hk = ((lt - 0.6) % HOP) / HOP;
    const cur = hi >= 0 && hi < HOPS.length ? HOPS[hi] : null;
    // links (static)
    [[0, 1], [1, 2], [1, 3], [1, 4]].forEach(([a, b]) => {
      const [x0, y0, x1, y1] = edge(a, b);
      const active = cur && ((cur[0] === a && cur[1] === b) || (cur[0] === b && cur[1] === a));
      g.line(x0, y0, x1, y1, active ? "•" : "·", active ? "3" : "7");
    });
    // boxes
    NODES.forEach(([name, sub, x, y], i) => {
      const lit = cur && (cur[0] === i || cur[1] === i);
      const done = hi >= HOPS.length;
      const c = lit ? (cur[3] ? "2" : "9") : done && (i === 0 || i === 1) ? "2" : "7";
      g.box(x, y, BW, BH, "round", c);
      g.text(x + 2, y + 1, name, lit ? "0" : "3");
      g.text(x + 2, y + 2, sub, "1");
    });
    // packet
    if (cur) {
      const [x0, y0, x1, y1] = cur[0] < cur[1] || cur[1] !== 0 && cur[0] > cur[1] ? edge(cur[0], cur[1]) : edge(cur[0], cur[1]);
      const e = Math.min(1, hk * 1.25);
      const px = x0 + (x1 - x0) * e, py = y0 + (y1 - y0) * e;
      // trail
      for (let k = 1; k <= 4; k++) {
        const ee = Math.max(0, e - k * 0.05);
        g.set(Math.round(x0 + (x1 - x0) * ee), Math.round(y0 + (y1 - y0) * ee), k < 2 ? "•" : "·", cur[3] ? "2" : "9");
      }
      g.set(Math.round(px), Math.round(py), "●", cur[3] ? "2" : "9");
      const lab = `${NODES[cur[0]][0]} → ${NODES[cur[1]][0]}: ${cur[2]}`;
      g.text(2, 18, "▶ " + lab, cur[3] ? "2" : "9");
    }
    g.text(2, 1, "query", "1"); g.text(8, 1, "shop.example.dev", "0"); g.text(25, 1, "type A · class IN", "1");
    g.text(2, 2, "recursion desired · edns 1232", "7");
    // cache badge
    if (hi >= 6 || hi < 0) g.text(24, 16, hi < 0 ? "cache: empty" : "cache: stored 300s", hi < 0 ? "7" : "a");
    // log
    const LY = 21;
    g.hline(0, W - 1, LY - 1, "─", "8");
    g.text(1, LY, "$ dig shop.example.dev +trace", "0");
    const shown = HOPS.slice(0, Math.max(0, Math.min(HOPS.length, hi + (hk > 0.8 ? 1 : 0))));
    const tail = shown.slice(-4);
    tail.forEach((h, i) => {
      const y = LY + 1 + i;
      g.text(1, y, `${NODES[h[0]][0]} → ${NODES[h[1]][0]}`.padEnd(30), "1");
      g.text(32, y, h[2], h[3] ? "2" : "9");
      g.text(60, y, `${MS[HOPS.indexOf(h)]} ms`, "7");
    });
    if (hi >= HOPS.length) {
      g.text(1, H - 1, ";; ANSWER  shop.example.dev.  300  IN  A  203.0.113.42", "2");
      g.text(W - 26, H - 1, "Query time: 143 msec", "1");
    }
    return g.frame();
  };
}
