/* maintenance-mode: a be-right-back page with a turning gear, a rocking wrench and live progress. */
import { Grid, palette, gradient } from "../lib/kit.js";

const GEAR = gradient(["#7a3e0c", "#d9822b", "#ffa657", "#ffd8a8"], 8); // 0-7
const STEEL = gradient(["#484f58", "#8b949e", "#c9d1d9", "#ffffff"], 6); // 8-d
const pal = palette([...GEAR, ...STEEL, "#e6edf3", "#8b949e", "#484f58", "#7ee787", "#79c0ff", "#30363d", "#f2cc60"]);
// e text, f muted, g dim, h green, i blue, j darker, k yellow

export const meta = {
  slug: "maintenance-mode",
  name: "Maintenance Mode",
  category: "screens",
  note: "A be right back page with a turning gear, a rocking wrench and a live list of upgrade steps.",
  tags: ["maintenance", "page", "website", "status", "loader"],
  cols: 92, rows: 26, fps: 24,
  palette: pal,
};

const SHADE = "░▒▓█";
const STAGES = ["Backup snapshots", "Drain traffic", "Migrate schema", "Warm caches", "Restore traffic"];
const PERIOD = 15;
const SPIN = "┤┘┴└├┌┬┐";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const GX = 17, GY = 13;
  const mask = new Uint8Array(W * H);
  return (t) => {
    g.clear();
    // backdrop hazard stripes top and bottom
    for (let x = 0; x < W; x++) {
      const s = Math.floor((x + t * 6) / 3) % 2 === 0;
      g.set(x, 0, s ? "▀" : " ", "k"); g.set(x, H - 1, s ? "▄" : " ", "k");
    }
    const rot = t * 0.9;
    // wrench mask first, so the gear can leave a dark gap around it. It pivots on its jaw.
    const ang = 1.68 + Math.sin(t * 2.2) * 0.12;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const PX = 39, PY = 5;
    mask.fill(0);
    for (let y = 1; y < H - 1; y++) for (let x = 28; x < 48; x++) {
      const dx = (x - PX) * 0.5, dy = y - PY;
      const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      let e = -1;
      if (u > 1.8 && u < 13.5 && Math.abs(v) < 1.0) e = Math.abs(v);
      const hr = Math.hypot(u, v);
      if (hr < 3.0 && !(u < 0.4 && Math.abs(v) < 1.2)) e = hr / 3.0;
      const tr = Math.hypot(u - 14.6, v);
      if (tr < 2.0 && tr > 0.9) e = tr / 2.0;
      if (e < 0) continue;
      const k = Math.max(0, Math.min(5, Math.round(4.6 - e * 2.6 + (v < 0 ? 0.8 : -0.8))));
      mask[x + y * W] = 1 + k;
    }
    // gear: ten teeth, a spoked hub, lit from the top left
    for (let y = GY - 9; y <= GY + 9; y++) for (let x = GX - 18; x <= GX + 18; x++) {
      if (x < 0 || y < 1 || y >= H - 1) continue;
      let near = false;
      for (let oy = -1; oy <= 1 && !near; oy++) for (let ox = -1; ox <= 1; ox++) if (mask[x + ox + (y + oy) * W]) { near = true; break; }
      if (near) continue;
      const dx = (x - GX) * 0.5, dy = y - GY;
      const rr = Math.hypot(dx, dy);
      if (rr > 8.4) continue;
      const a = Math.atan2(dy, dx) - rot;
      const tooth = Math.cos(a * 8) > 0.1 ? 8.2 : 6.5;
      if (rr > tooth || rr < 2.0) continue;
      const lit = (-dx * 0.6 - dy * 0.8) / (rr + 0.01);
      const k = Math.max(0, Math.min(7, Math.floor((0.55 + 0.4 * lit - (rr < 2.8 ? 0.15 : 0)) * 8)));
      g.set(x, y, rr > 4.1 && rr < 4.9 ? "▓" : "█", String(rr > 4.1 && rr < 4.9 ? Math.max(0, k - 3) : k));
    }
    for (let y = 1; y < H - 1; y++) for (let x = 28; x < 48; x++) {
      const m = mask[x + y * W];
      if (m) g.set(x, y, m > 4 ? "█" : m > 2 ? "▓" : "▒", "89abcd"[m - 1]);
    }
    // copy on the right
    const X = 50;
    g.text(X, 3, "B E   R I G H T   B A C K", "e");
    g.text(X, 5, "Scheduled maintenance in progress.", "f");
    g.text(X, 6, "We are upgrading the database cluster.", "f");
    g.text(X, 7, "Expected back at ", "f"); g.text(X + 17, 7, "02:30 UTC", "k");
    const lt = t % PERIOD, p = Math.min(1, lt / (PERIOD - 2));
    const stage = Math.min(4, Math.floor(p * 5));
    STAGES.forEach((s, i) => {
      const y = 10 + i;
      const done = i < stage || p >= 1, cur = i === stage && p < 1;
      g.text(X, y, done ? "✓" : cur ? SPIN[Math.floor(t * 10) % 8] : "·", done ? "h" : cur ? "i" : "g");
      g.text(X + 2, y, s, done ? "f" : cur ? "e" : "g");
      if (cur) g.text(X + 2 + s.length + 1, y, `(${i + 1}/5)`, "i");
    });
    const bw = 36, n = Math.round(p * bw);
    g.text(X, 17, "█".repeat(n), p >= 1 ? "h" : "i"); g.text(X + n, 17, "░".repeat(bw - n), "j");
    g.text(X + bw + 1, 17, String(Math.round(p * 100)).padStart(3) + "%", "e");
    g.text(X, 19, p >= 1 ? "All systems back online ✓" : `elapsed 00:${String(Math.floor(lt * 4)).padStart(2, "0")}  ·  eta 00:${String(Math.max(0, Math.round((PERIOD - 2 - lt) * 4))).padStart(2, "0")}`, p >= 1 ? "h" : "f");
    g.box(X, 21, 26, 3, "round", "g");
    g.text(X + 2, 22, "status.example.dev  →", "i");
    return g.frame();
  };
}
