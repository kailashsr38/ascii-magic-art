/* split-flap-board: an airport departures board whose tiles flap through the alphabet to new flights. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "split-flap-board",
  name: "Split Flap Board",
  category: "lettering",
  note: "An airport departures board where every tile flaps through the alphabet to show the next flights.",
  tags: ["departures", "airport", "text", "dashboard", "hero"],
  cols: 66, rows: 19, fps: 24,
  palette: palette(["#f2e8cf", "#8b949e", "#3a4048", "#7ee787", "#ffa657", "#ff7b72", "#ffd166", "#5c6570", "#79c0ff"]),
};

const ALPHA = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:";
const DESTS = ["LISBON", "TOKYO", "NAIROBI", "OSLO", "LIMA", "SEOUL", "DENVER", "CAIRO", "PERTH", "QUEBEC", "HAVANA", "DUBLIN", "MANILA", "ZURICH", "ACCRA", "HANOI", "BOGOTA"];
const GROUPS = [["DESTINATION", 9], ["TIME", 5], ["GATE", 3], ["STATUS", 8]];
const ROWS = 6, EPOCH = 6;
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function flight(n, row) {
  const m = (((7 * 60 + n * 25) % 1440) + 1440) % 1440;
  const time = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const gate = "ABCD"[Math.floor(hash(n, 3) * 4)] + String(1 + Math.floor(hash(n, 5) * 28)).padStart(2, "0");
  const h = hash(n, 9);
  const status = row === 0 ? "BOARDING" : row === 1 && h < 0.5 ? "BOARDING" : h < 0.18 ? "DELAYED" : h < 0.24 ? "GATE CHG" : "ON TIME";
  return [DESTS[(((n * 7) % DESTS.length) + DESTS.length) % DESTS.length].padEnd(9), time, gate, status.padEnd(8)];
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  // x of each group start
  const gx = [];
  let x = 2;
  for (const [, n] of GROUPS) { gx.push(x); x += 1 + n * 2 + 2; }
  const BY = 4;
  return (t) => {
    g.clear();
    const e = Math.floor(t / EPOCH), dt = t - e * EPOCH;
    // title bar
    g.text(2, 0, "→ DEPARTURES", "6");
    const clock = 9 * 60 + 40 + Math.floor(t / 2);
    const ck = String(Math.floor(clock / 60) % 24).padStart(2, "0") + ":" + String(clock % 60).padStart(2, "0");
    g.text(meta.cols - 2 - 12, 0, "LOCAL  " + ck, "1");
    g.hline(2, meta.cols - 3, 1, "─", "2");
    GROUPS.forEach(([label], k) => g.text(gx[k], 3, label, "1"));
    for (let k = 0; k < GROUPS.length; k++) {
      const n = GROUPS[k][1], x0 = gx[k];
      for (let r = 0; r <= ROWS; r++) {
        const y = BY + r * 2;
        const L = r === 0 ? "┌" : r === ROWS ? "└" : "├", M = r === 0 ? "┬" : r === ROWS ? "┴" : "┼", R = r === 0 ? "┐" : r === ROWS ? "┘" : "┤";
        for (let i = 0; i < n; i++) { g.set(x0 + i * 2, y, i === 0 ? L : M, "2"); g.set(x0 + i * 2 + 1, y, "─", "2"); }
        g.set(x0 + n * 2, y, R, "2");
        if (r < ROWS) for (let i = 0; i <= n; i++) g.set(x0 + i * 2, y + 1, "│", "2");
      }
    }
    for (let r = 0; r < ROWS; r++) {
      const now = flight(e + r, r), was = flight(e - 1 + r, r);
      const statusCo = now[3].startsWith("DELAYED") ? "5" : now[3].startsWith("BOARD") ? "4" : now[3].startsWith("GATE") ? "8" : "3";
      for (let k = 0; k < GROUPS.length; k++) {
        const n = GROUPS[k][1];
        for (let i = 0; i < n; i++) {
          const to = Math.max(0, ALPHA.indexOf(now[k][i])), from = Math.max(0, ALPHA.indexOf(was[k][i]));
          const dist = (to - from + ALPHA.length) % ALPHA.length;
          const delay = 0.15 + (gx[k] + i * 2) * 0.012 + r * 0.09;
          const steps = Math.max(0, Math.floor((dt - delay) * 22));
          const s = Math.min(dist, steps);
          const c = ALPHA[(from + s) % ALPHA.length];
          const flipping = s < dist && steps > 0;
          g.set(gx[k] + i * 2 + 1, BY + r * 2 + 1, c, flipping ? "7" : k === 3 ? statusCo : "0");
          if (flipping) g.set(gx[k] + i * 2 + 1, BY + r * 2 + 2, "━", "1");
        }
      }
    }
    // footer ticker
    const msg = "   PLEASE KEEP YOUR BAGS WITH YOU AT ALL TIMES   ·   GATES CLOSE 15 MINUTES BEFORE DEPARTURE   ·";
    const off = Math.floor(t * 8);
    for (let i = 0; i < meta.cols - 4; i++) g.set(2 + i, BY + ROWS * 2 + 2, msg[(i + off) % msg.length], "1");
    return g.frame();
  };
}
