/* cdn-cache: an edge cache serving hits locally and fetching misses from origin, with TTLs running down. */
import { Grid, palette, clamp, rng } from "../lib/kit.js";

export const meta = {
  slug: "cdn-cache",
  name: "Edge Cache Hit Miss",
  category: "explainers",
  note: "A CDN edge node where requests from three regions hit the cache and return fast, or miss and travel on to the origin, while every cached path counts down its TTL and expires.",
  tags: ["cdn", "cache", "edge", "diagram", "performance", "dashboard"],
  cols: 100, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const PATHS = [
  ["/index.html", 7], ["/app.js", 16], ["/styles.css", 16], ["/img/hero.jpg", 22], ["/api/feed", 3], ["/fonts/ui.woff2", 30],
];
const WEIGHT = [5, 4, 3, 3, 4, 1];
const CLIENTS = [["Lisbon", 4], ["Warsaw", 11], ["Nairobi", 18]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LOOP = 26;
  // deterministic request schedule and simulation of the cache
  const r = rng(42);
  const wsum = WEIGHT.reduce((a, b) => a + b, 0);
  const reqs = [];
  for (let ts = 0.3; ts < LOOP - 2.2; ts += 0.55 + r() * 0.5) {
    let v = r() * wsum, p = 0;
    while (v > WEIGHT[p]) v -= WEIGHT[p++];
    reqs.push({ ts, c: Math.floor(r() * 3), p });
  }
  const exp = PATHS.map(() => -1), fill = PATHS.map(() => -1), hits = PATHS.map(() => 0);
  const timeline = []; // [time, path, kind] cache events
  for (const q of reqs) {
    q.te = q.ts + 0.45;
    if (exp[q.p] > q.te) { q.hit = true; q.tr = q.te + 0.35; hits[q.p]++; q.hitN = hits[q.p]; }
    else {
      q.hit = false; q.to = q.te + 0.15; q.tb = q.to + 0.6; q.back = q.tb + 0.6;
      q.tr = q.back + 0.4;
      exp[q.p] = q.back + PATHS[q.p][1]; fill[q.p] = q.back;
      timeline.push([q.back, q.p, PATHS[q.p][1]]);
    }
  }
  const pathFill = (lt, p) => { let last = null; for (const e of timeline) if (e[1] === p && e[0] <= lt) last = e; return last; };
  const EX = 28, EW = 46, OX = 84;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    // header
    g.text(1, 0, "edge cache  fra-1", "0");
    // origin
    g.box(OX, 9, 15, 6, "round", "7");
    g.text(OX + 2, 10, "origin", "0");
    g.text(OX + 2, 11, "app servers", "1");
    // links
    CLIENTS.forEach(([name, y], i) => {
      g.box(1, y - 1, 15, 4, "round", "3");
      g.text(3, y, name, "0");
      g.hline(16, EX - 1, y + 1, "─", "b");
    });
    g.hline(EX + EW, OX - 1, 11, "─", "b");
    g.hline(EX + EW, OX - 1, 13, "╌", "b");
    // in-flight packets
    let busyOrigin = false;
    const last = [null, null, null];
    let H = 0, M = 0;
    for (const q of reqs) {
      if (q.ts > lt) break;
      if (q.tr <= lt) { last[q.c] = q; if (q.hit) H++; else M++; continue; }
      const y = CLIENTS[q.c][1] + 1;
      const len = EX - 1 - 16;
      if (lt < q.te) {
        const k = Math.round(((lt - q.ts) / 0.45) * len);
        g.set(16 + k, y, "▶", "3");
        if (k > 0) g.set(15 + k, y, "━", "3");
      } else if (q.hit || lt >= q.back) {
        const t0 = q.hit ? q.te : q.back;
        const k = Math.round((1 - clamp((lt - t0) / (q.tr - t0))) * len);
        g.set(16 + k, y, "◀", q.hit ? "4" : "5");
        g.set(17 + k, y, "━", q.hit ? "4" : "5");
      }
      if (!q.hit && lt >= q.to && lt < q.back) {
        busyOrigin = true;
        const olen = OX - 1 - (EX + EW);
        if (lt < q.tb) {
          const k = Math.round(((lt - q.to) / (q.tb - q.to)) * olen);
          g.set(EX + EW + k, 11, "▶", "5");
          g.text(EX + EW + 2, 10, "fetch", "5"); g.text(OX + 2, 12, PATHS[q.p][0].length > 11 ? PATHS[q.p][0].slice(0, 9) + ".." : PATHS[q.p][0], "5");
        } else {
          const k = Math.round((1 - (lt - q.tb) / (q.back - q.tb)) * olen);
          g.set(EX + EW + k, 13, "◀", "7");
          g.text(EX + EW + 1, 14, "200 fill", "7"); g.text(OX + 2, 12, PATHS[q.p][0].length > 11 ? PATHS[q.p][0].slice(0, 9) + ".." : PATHS[q.p][0], "7");
        }
      }
    }
    if (busyOrigin) g.box(OX, 9, 15, 6, "heavy", "7");
    else g.text(OX + 2, 12, "eu-west", "1");
    g.text(OX + 2, 13, busyOrigin ? "● serving" : "○ idle", busyOrigin ? "5" : "1");
    // client last result
    CLIENTS.forEach(([, y], i) => {
      const q = last[i];
      if (!q) { g.text(3, y + 1, "--", "b"); return; }
      const ms = q.hit ? 9 + ((q.ts * 37) | 0) % 14 : 160 + ((q.ts * 53) | 0) % 90;
      g.text(3, y + 1, (q.hit ? "HIT  " : "MISS ") + ms + "ms", q.hit ? "4" : "5");
    });
    // edge box and table
    g.box(EX, 1, EW, 22, "heavy", "9");
    g.text(EX + 2, 1, " edge node ", "9");
    g.text(EX + 2, 3, "path", "1"); g.text(EX + 20, 3, "state", "1"); g.text(EX + 28, 3, "ttl", "1"); g.text(EX + 40, 3, "hits", "1");
    g.hline(EX + 2, EX + EW - 3, 4, "─", "2");
    PATHS.forEach(([path, ttl], i) => {
      const y = 5 + i * 2;
      const f = pathFill(lt, i);
      let hitsNow = 0, flash = null;
      for (const q of reqs) {
        if (q.p !== i || q.te > lt) continue;
        if (q.hit) hitsNow++;
        if (lt - q.te < 0.5) flash = q.hit ? "4" : "5";
      }
      const left = f ? f[2] - (lt - f[0]) : -1;
      const fresh = left > 0;
      g.text(EX + 2, y, path, flash ? "8" : fresh ? "0" : "1");
      const st = fresh ? "fresh" : f ? "stale" : "empty";
      g.text(EX + 20, y, st, fresh ? "4" : f ? "6" : "b");
      const W = 10, n = fresh ? Math.ceil((left / ttl) * W) : 0;
      for (let k = 0; k < W; k++) g.set(EX + 28 + k, y, k < n ? "█" : "░", k < n ? (left < 2 ? "a" : "9") : "2");
      g.text(EX + 40, y, String(hitsNow).padStart(3), "0");
      if (flash) g.set(EX + 1, y, "►", flash);
    });
    // stats
    const total = H + M;
    const ratio = total ? Math.round((H / total) * 100) : 0;
    g.hline(EX + 2, EX + EW - 3, 17, "─", "2");
    g.text(EX + 2, 18, "hit ratio", "1");
    const W = 24, n = Math.round((ratio / 100) * W);
    for (let k = 0; k < W; k++) g.set(EX + 12 + k, 18, k < n ? "█" : "░", k < n ? "4" : "2");
    g.text(EX + 38, 18, ratio + "%", "0");
    g.text(EX + 2, 20, "requests " + total, "1");
    g.text(EX + 17, 20, "hits " + H, "4");
    g.text(EX + 27, 20, "origin fetches " + M, "5");
    // legend
    g.text(1, rows - 2, "▶ request", "3"); g.text(13, rows - 2, "◀ hit", "4"); g.text(21, rows - 2, "◀ miss via origin", "5");
    g.text(1, rows - 1, "cache-control: public, max-age per path   stale entries refetch on next request", "b");
    return g.frame();
  };
}
