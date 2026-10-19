/* consistent-hash-ring: keys on a hash ring owned by the next node clockwise, with nodes joining and leaving. */
import { Grid, palette, clamp, rng, TAU } from "../lib/kit.js";

export const meta = {
  slug: "consistent-hash-ring",
  name: "Consistent Hash Ring",
  category: "explainers",
  note: "A consistent hashing ring where each key belongs to the next node clockwise, and when a node joins or fails only the keys in its arc move, shown as they change owner.",
  tags: ["hashing", "distributed", "sharding", "diagram", "algorithm", "docs"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const NODES = [["A", 0.06, "3"], ["B", 0.31, "4"], ["C", 0.55, "7"], ["D", 0.8, "a"], ["E", 0.43, "9"]];
// sets of live nodes per phase, and the event that leads into it
const PHASES = [
  [[0, 1, 2, 3], "4 nodes, ring balanced"],
  [[0, 1, 2, 3, 4], "E joins between B and C"],
  [[0, 2, 3, 4], "B fails, keys go to E"],
  [[0, 1, 2, 3, 4], "B recovers its arc"],
  [[0, 1, 2, 3], "E removed, back to C"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CX = 30, CY = 16, R = 26;
  const r = rng(11);
  const KEYS = [];
  const names = ["user:41", "cart:9", "img:220", "sess:7a", "user:88", "order:5", "feed:3", "user:12", "sess:c4", "cart:61", "img:17", "order:90", "tag:ml", "user:3", "feed:44", "sess:0e", "order:31", "img:908", "cart:2", "user:57", "tag:io", "feed:9", "sess:91", "order:66"];
  for (let i = 0; i < names.length; i++) KEYS.push({ name: names[i], h: (i + 0.15 + r() * 0.7) / names.length });
  const PH = 5, LOOP = PHASES.length * PH;
  const owner = (h, live) => {
    let best = -1, bd = 2;
    for (const n of live) { let d = NODES[n][1] - h; if (d < 0) d += 1; if (d < bd) { bd = d; best = n; } }
    return best;
  };
  const owners = PHASES.map(([live]) => KEYS.map((k) => owner(k.h, live)));
  const pos = (h, rr = R) => {
    const a = h * TAU - Math.PI / 2;
    return [CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.5];
  };
  // precompute ring cells
  const ring = [];
  for (let i = 0; i < 260; i++) { const h = i / 260; const [x, y] = pos(h); ring.push([Math.round(x), Math.round(y), h]); }
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const ph = Math.floor(lt / PH), pt = lt - ph * PH;
    const prev = (ph + PHASES.length - 1) % PHASES.length;
    const live = PHASES[ph][0], wasLive = PHASES[prev][0];
    const mig = clamp((pt - 0.6) / 1.6);
    // ring coloured by owner of each arc
    for (const [x, y, h] of ring) {
      const o = owner(h, live);
      g.set(x, y, "•", NODES[o][2]);
    }
    // keys
    const counts = {};
    KEYS.forEach((k, i) => {
      const o0 = owners[prev][i], o1 = owners[ph][i];
      const moving = o0 !== o1;
      const stagger = i / KEYS.length * 0.5;
      const switched = !moving || mig > stagger + 0.3;
      const o = switched ? o1 : o0;
      counts[o] = (counts[o] || 0) + 1;
      const [x, y] = pos(k.h, R - 3);
      const fresh = moving && pt < 3.5;
      g.set(x, y, fresh ? "◆" : "●", fresh && !switched ? "6" : NODES[o][2]);
      if (fresh && switched && pt < 3.5) {
        // draw a short arrow along the ring towards its new owner
        const [ax, ay] = pos(k.h + 0.02, R - 3);
        g.set(ax, ay, "→", NODES[o1][2]);
      }
    });
    // nodes
    NODES.forEach(([name, h, co], n) => {
      const on = live.includes(n), was = wasLive.includes(n);
      if (!on && !was) return;
      const [x, y] = pos(h, R);
      const [lx, ly] = pos(h, R + 4);
      const x0 = Math.round(x) - 1, y0 = Math.round(y);
      if (on) {
        const joining = !was && pt < 2;
        g.text(x0, y0, joining && Math.floor(pt * 4) % 2 ? "[ ]" : "[" + name + "]", co);
      } else {
        if (pt < 3) g.text(x0, y0, "[✗]", "6");
      }
      g.text(Math.max(0, Math.min(56, Math.round(lx) - 3)), Math.round(ly), on ? "node " + name : "down", on ? "0" : "6");
    });
    // centre label
    g.text(CX - 6, CY - 1, "hash(key) mod", "1");
    g.text(CX - 3, CY, "2^32", "0");
    g.text(CX - 6, CY + 1, "clockwise →", "b");
    // right panel
    const PX = 64;
    g.box(PX, 1, 31, 17, "round", "b");
    g.text(PX + 2, 1, " keys per node ", "0");
    NODES.forEach(([name, , co], n) => {
      const y = 3 + n * 2;
      const on = live.includes(n);
      const c = counts[n] || 0;
      g.text(PX + 2, y, name, on ? co : "b");
      const W = 18;
      for (let k = 0; k < W; k++) g.set(PX + 4 + k, y, k < Math.min(W, c * 1.6) ? "█" : "░", k < Math.min(W, c * 1.6) ? co : "2");
      g.text(PX + 24, y, on ? String(c).padStart(2) : "--", on ? "0" : "b");
    });
    const moved = KEYS.filter((k, i) => owners[prev][i] !== owners[ph][i]).length;
    g.text(PX + 2, 14, "moved this step", "1");
    g.text(PX + 18, 14, moved + " of " + KEYS.length, moved ? "a" : "4");
    g.text(PX + 2, 15, "naive mod N would", "1");
    g.text(PX + 2, 16, "move about " + (ph === 0 ? 0 : Math.round(KEYS.length * 0.75)) + " keys", "b");
    // event log
    g.box(PX, 19, 31, 11, "round", "b");
    g.text(PX + 2, 19, " events ", "0");
    for (let i = 0; i <= 4; i++) {
      const k = ph - 4 + i;
      if (k < 0 && t < LOOP) continue;
      const idx = ((k % PHASES.length) + PHASES.length) % PHASES.length;
      const msg = PHASES[idx][1];
      const y = 20 + i * 2;
      g.text(PX + 2, y, (i === 4 ? "▶ " : "  ") + msg.slice(0, 27), i === 4 ? "8" : "1");
    }
    g.text(1, 0, "consistent hashing", "0");
    g.text(1, rows - 1, "◆ key changing owner   only the arc next to the change moves", "1");
    return g.frame();
  };
}
