/* uptime-monitor: a status page with services, daily uptime bars and the odd incident. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "uptime-monitor",
  name: "Status Page",
  category: "live-data",
  note: "A service status page with daily uptime bars sliding along and the occasional incident turning a service amber or red.",
  tags: ["status", "uptime", "monitoring", "dashboard", "devops"],
  cols: 84, rows: 25, fps: 10,
  palette: palette(["#e6edf3", "#8b949e", "#3fb950", "#d29922", "#f85149", "#30363d", "#238636", "#9e6a03", "#da3633", "#79c0ff"]),
};

const SERVICES = ["API", "Web app", "Dashboard", "Database", "Auth", "Search", "Webhooks", "CDN", "Mail delivery"];
const DAYS = 56;
const HIST = 600;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(3);
  // per service, per day status: 0 ok, 1 degraded, 2 outage
  const hist = SERVICES.map(() => {
    const a = new Uint8Array(HIST);
    for (let d = 0; d < HIST; d++) { const q = r(); a[d] = q < 0.012 ? 2 : q < 0.035 ? 1 : 0; }
    return a;
  });
  const BX = 18;
  return (t) => {
    g.clear();
    const dayLen = 1.6;
    const day = Math.floor(t / dayLen) % (HIST - DAYS);
    const phase = (t % dayLen) / dayLen;
    // header with overall status from today's column
    let worst = 0;
    const today = SERVICES.map((_, s) => hist[s][day + DAYS - 1]);
    for (const v of today) worst = Math.max(worst, v);
    const live = phase > 0.15;   // today's status reveals a moment after the day starts
    const head = !live || worst === 0 ? ["●", "All systems operational", "2"] : worst === 1 ? ["▲", "Degraded performance", "3"] : ["▲", "Partial outage", "4"];
    g.box(0, 0, cols, 3, "round", head[2] === "2" ? "6" : head[2] === "3" ? "7" : "8");
    g.text(2, 1, head[0], head[2]);
    g.text(4, 1, head[1], "0");
    g.text(cols - 21, 1, "updated " + (Math.floor(t * 3) % 60) + "s ago", "1");
    g.text(2, 4, "Service", "1");
    g.text(BX, 4, DAYS + " days ago", "1");
    g.text(BX + DAYS - 5, 4, "today", "1");
    g.text(cols - 9, 4, "uptime", "1");
    SERVICES.forEach((name, s) => {
      const row = 6 + s;
      let bad = 0;
      for (let i = 0; i < DAYS; i++) {
        let v = hist[s][day + i];
        if (i === DAYS - 1 && !live) v = 0;
        bad += v === 2 ? 1 : v === 1 ? 0.3 : 0;
        g.set(BX + i, row + s, "▌", v === 2 ? "4" : v === 1 ? "3" : "2");
      }
      const st = live ? today[s] : 0;
      g.text(2, row + s, (st === 2 ? "✗ " : st === 1 ? "▲ " : "✓ ") + name, st === 2 ? "4" : st === 1 ? "3" : "0");
      const up = 100 - (bad / DAYS) * 2.1;
      g.text(cols - 9, row + s, up.toFixed(2) + "%", up > 99.5 ? "2" : up > 98.8 ? "3" : "4");
    });
    const ly = rows - 1;
    g.text(BX, ly, "▌", "2"); g.text(BX + 2, ly, "operational", "1");
    g.text(BX + 15, ly, "▌", "3"); g.text(BX + 17, ly, "degraded", "1");
    g.text(BX + 27, ly, "▌", "4"); g.text(BX + 29, ly, "outage", "1");
    return g.frame();
  };
}
