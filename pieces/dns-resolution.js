/* dns-resolution: a recursive resolver walking root, TLD and authoritative servers, then answering the next lookup from cache. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "dns-resolution",
  name: "DNS Lookup Path",
  category: "explainers",
  note: "A DNS lookup where the resolver asks the root, then the TLD, then the authoritative server, caches each referral and answers the repeat query in two milliseconds.",
  tags: ["dns", "networking", "resolver", "cache", "diagram", "docs"],
  cols: 100, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

function cellsOf(pts) {
  const out = [pts[0].slice()];
  for (let i = 1; i < pts.length; i++) {
    let [x, y] = out[out.length - 1];
    const [tx, ty] = pts[i];
    while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
  }
  return out;
}
const dirOf = (a, b) => (b[0] > a[0] ? "R" : b[0] < a[0] ? "L" : b[1] > a[1] ? "D" : "U");
const CORNER = { RD: "┐", RU: "┘", LD: "┌", LU: "└", DR: "└", DL: "┘", UR: "┌", UL: "┐" };
function routeChars(cells) {
  return cells.map((c, k) => {
    const a = cells[Math.max(0, k - 1)], b = cells[Math.min(cells.length - 1, k + 1)];
    const din = k ? dirOf(a, c) : dirOf(c, b), dout = k < cells.length - 1 ? dirOf(c, b) : din;
    return din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout];
  });
}
const HEAVY = { "─": "━", "│": "┃", "┐": "┓", "┘": "┛", "┌": "┏", "└": "┗" };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // nodes: x, y, w, h, title, sub, colour
  const N = {
    host: [1, 9, 18, 5, "laptop", "stub resolver", "3"],
    res: [30, 9, 22, 5, "resolver", "recursive, cache", "9"],
    root: [74, 1, 24, 5, "root server", "zone .", "7"],
    tld: [74, 9, 24, 5, "TLD server", "zone .org", "7"],
    auth: [74, 17, 24, 5, "authoritative", "ns1.example.org", "5"],
  };
  const R = {
    host: cellsOf([[19, 11], [29, 11]]),
    root: cellsOf([[52, 11], [63, 11], [63, 3], [73, 3]]),
    tld: cellsOf([[52, 11], [73, 11]]),
    auth: cellsOf([[52, 11], [63, 11], [63, 19], [73, 19]]),
  };
  const RC = {}; for (const k in R) RC[k] = routeChars(R[k]);
  // route, reverse?, tag, colour, cache entry added on arrival
  const Q1 = [
    ["host", false, "A? www.example.org", "3", null],
    ["root", false, "A? www.example.org", "3", null],
    ["root", true, "ask .org servers", "5", [".org", "NS", 172800]],
    ["tld", false, "A? www.example.org", "3", null],
    ["tld", true, "ask ns1.example.org", "5", ["example.org", "NS", 86400]],
    ["auth", false, "A? www.example.org", "3", null],
    ["auth", true, "A 203.0.113.42", "4", ["www.example.org", "A", 300]],
    ["host", true, "A 203.0.113.42", "4", null],
  ];
  const Q2 = [["host", false, "A? www.example.org", "3", null], ["host", true, "A 203.0.113.42", "4", null]];
  const S1 = 1.25, S2 = 1.0;
  const T1 = Q1.length * S1, GAP = 2.2, T2 = Q2.length * S2;
  const LOOP = T1 + GAP + T2 + 3.2;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const inQ2 = lt >= T1 + GAP;
    const steps = inQ2 ? Q2 : Q1, S = inQ2 ? S2 : S1;
    const qt = inQ2 ? lt - T1 - GAP : lt;
    const finished = qt >= steps.length * S;
    const cur = Math.min(steps.length - 1, Math.floor(qt / S));
    const p = finished ? 1 : clamp((qt - cur * S) / (S * 0.75));
    const between = !inQ2 && lt >= T1;
    // static routes
    for (const k in R) R[k].forEach(([x, y], i) => {
      const prev = g.get(x, y);
      const ch = prev === "─" && RC[k][i] === "│" ? "┼" : RC[k][i];
      g.set(x, y, prev === "─" && (ch === "┘" || ch === "┐") ? "┤" : ch, "b");
    });
    g.set(63, 11, "┼", "b");
    // active hop
    const busy = new Set();
    if (!finished && !between) {
      const [rk, rev, tag, co] = steps[cur];
      const cells = rev ? R[rk].slice().reverse() : R[rk];
      const chars = RC[rk];
      const n = Math.round(p * (cells.length - 1));
      for (let i = 0; i <= n; i++) {
        const idx = rev ? cells.length - 1 - i : i;
        const [x, y] = cells[i];
        g.set(x, y, HEAVY[chars[idx]] || chars[idx], co);
      }
      const [hx, hy] = cells[n];
      g.set(hx, hy, "●", "8");
      const L = tag.length;
      if (hx >= 52) g.text(clamp(hx - (L >> 1), 53, 73 - L), hy === 11 ? 10 : hy - 1, tag, co);
      else g.text(clamp(hx - (L >> 1), 1, cols - L), 7, tag, co);
      busy.add(rk === "host" ? "host" : rk).add("res");
    }
    // cache contents at this time
    const cache = [];
    if (!inQ2) {
      Q1.forEach((s, i) => { if (s[4] && (i < cur || (i === cur && p >= 1) || between)) cache.push([s[4], i * S1 + S1 * 0.75]); });
    } else Q1.forEach((s, i) => { if (s[4]) cache.push([s[4], i * S1 + S1 * 0.75]); });
    // nodes
    for (const k in N) {
      const [x, y, w, h, title, sub, co] = N[k];
      const on = busy.has(k);
      g.box(x, y, w, h, on ? "heavy" : "round", on ? co : "b");
      g.text(x + 2, y + 1, title, on ? "8" : "0");
      g.text(x + 2, y + 2, sub, "1");
    }
    // resolver status line
    let rs = "idle", rc = "1";
    if (!inQ2 && !between && cur >= 1 && !finished) { rs = "miss, recursing"; rc = "5"; }
    if (inQ2 && !finished) { rs = cur === 1 || p > 0.6 ? "cache hit ✓" : "checking cache"; rc = "4"; }
    if (!inQ2 && cur === 0 && !between) { rs = "checking cache"; rc = "a"; }
    g.text(32, 12, rs, rc);
    // host line
    const answered = between || (!inQ2 && cur === 7 && p >= 1) || (inQ2 && finished) || (inQ2 && qt < 0.01);
    g.text(3, 12, answered ? "203.0.113.42" : "resolving..", answered ? "4" : "a");
    // cache table
    g.box(30, 17, 33, 9, "round", "b");
    g.text(32, 17, " resolver cache ", "0");
    g.text(32, 18, "name", "1"); g.text(48, 18, "type", "1"); g.text(53, 18, "ttl", "1");
    cache.forEach(([[name, type, ttl], at], i) => {
      const left = Math.max(0, Math.floor(ttl - (lt - at)));
      const fresh = lt - at < 0.8;
      g.text(32, 19 + i, name, fresh ? "8" : "0");
      g.text(48, 19 + i, type, type === "A" ? "4" : "7");
      g.text(51, 19 + i, String(left) + "s", "1");
      if (fresh) g.text(59, 19 + i, "new", "a");
      else if (inQ2 && type === "A" && cur >= 0 && !finished) g.text(59, 19 + i, "hit", "4");
    });
    if (!cache.length) g.text(32, 20, "empty", "b");
    // dig style panel on the laptop side
    g.box(1, 17, 27, 9, "round", "b");
    g.text(3, 17, " $ dig www.example.org ", "0");
    const q1ms = 84, q2ms = 2;
    if (between || (inQ2 && qt < 0.01) || (inQ2 && finished) || (!inQ2 && cur === 7 && p >= 1)) {
      const ms = inQ2 && finished ? q2ms : q1ms;
      g.text(3, 19, "status: NOERROR", "4");
      g.text(3, 20, "www  300  A", "0");
      g.text(3, 21, "203.0.113.42", "4");
      g.text(3, 23, "query time: " + ms + " msec", ms < 10 ? "4" : "a");
    } else {
      g.text(3, 19, "waiting for answer", "1");
      if (Math.floor(t * 3) % 2) g.text(22, 19, "█", "1");
    }
    // header
    g.text(1, 0, inQ2 ? "query 2  same name, cached" : "query 1  cold cache", "0");
    g.text(1, rows - 1, "hops", "1");
    const hops = inQ2 ? "laptop → resolver → laptop" : "laptop → resolver → root → TLD → authoritative → resolver → laptop";
    g.text(6, rows - 1, hops, "b");
    return g.frame();
  };
}
