/* departures-hall-board: a full airport departures board whose gates, statuses and rows update as the clock runs. */
import { Grid, palette, bigText } from "../lib/kit.js";

export const meta = {
  slug: "departures-hall-board",
  name: "Departures Hall Board",
  category: "lettering",
  note: "A full airport departures board with times, flights, destinations, gates and statuses that flip as boarding opens, gates close and flights leave the list.",
  tags: ["airport", "departures", "board", "travel", "dashboard", "text"],
  cols: 100, rows: 28, fps: 20,
  // 0 amber text, 1 muted, 2 frame, 3 green, 4 blue, 5 orange, 6 red, 7 dim, 8 white, 9 churn
  palette: palette(["#ffc145", "#8b8577", "#3a3528", "#7ee787", "#79c0ff", "#ffa657", "#ff6b5e", "#5a5446", "#f4ecd8", "#b88a2c"]),
};

const DEST = ["LISBON", "OSLO", "REYKJAVIK", "NAIROBI", "SINGAPORE", "MONTREAL", "ATHENS", "KRAKOW", "BOGOTA", "SEOUL",
  "MARRAKESH", "AUCKLAND", "DUBLIN", "VALENCIA", "HELSINKI", "CAPE TOWN", "TALLINN", "SANTIAGO", "HANOI", "BERGEN", "PORTO", "QUITO"];
const AIR = ["QX", "NL", "VR", "TA", "MH", "SK", "OB", "PZ"];
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function flight(i) {
  const sched = 14 * 60 + i * 4 + Math.floor(hash(i, 1) * 3);
  const delay = hash(i, 2) < 0.16 ? 15 + Math.floor(hash(i, 3) * 6) * 5 : 0;
  return {
    sched, act: sched + delay, delay,
    code: AIR[Math.floor(hash(i, 4) * AIR.length)] + " " + String(100 + Math.floor(hash(i, 5) * 899)),
    dest: DEST[Math.floor(hash(i, 6) * DEST.length)],
    gate: "ABCD"[Math.floor(hash(i, 7) * 4)] + String(1 + Math.floor(hash(i, 8) * 38)),
    desk: String(10 + Math.floor(hash(i, 9) * 60)).padStart(2, "0") + "-" + String(12 + Math.floor(hash(i, 9) * 60)).padStart(2, "0"),
  };
}

// status at board minute `now`, plus when it began
function status(f, now) {
  const d = f.act - now;
  if (d <= 0) return ["DEPARTED", "1", f.act];
  if (d <= 2) return ["GATE CLOSED", "6", f.act - 2];
  if (d <= 8) return ["FINAL CALL", "5", f.act - 8];
  if (d <= 20) return ["BOARDING", "4", f.act - 20];
  if (d <= 34) return ["GO TO GATE", "3", f.act - 34];
  if (f.delay) return ["DELAYED", "6", -1e9];
  return ["ON TIME", "3", -1e9];
}
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;
const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const RATE = 0.9;          // board minutes per second
  const N = 16;              // rows of flights
  const C = { time: 3, flight: 10, dest: 20, gate: 40, desk: 48, status: 58, rem: 74 };
  const field = (x, y, s, w, co, age, seed) => {
    // a cell that recently changed churns before settling, left to right
    for (let i = 0; i < w; i++) {
      const c = s[i] || " ";
      if (age < 0.6 && age * 1.6 * w < i + 1 + w * 0.2) {
        g.set(x + i, y, c === " " ? " " : POOL[Math.floor(hash(seed * 31 + i, Math.floor(age * 30)) * POOL.length)], "9");
      } else g.set(x + i, y, c, co);
    }
  };
  return (t) => {
    g.clear();
    const now = 14 * 60 + 2 + t * RATE;
    // header
    g.box(0, 0, cols, rows, "double", "2");
    g.text(3, 2, "D E P A R T U R E S", "0");
    g.text(3, 3, "↗  terminal 2  ·  all gates", "1");
    bigText(g, cols - 23, 1, hhmm(now), "8");
    g.text(cols - 34, 3, "LOCAL TIME", "1");
    g.hline(1, cols - 2, 6, "═", "2");
    g.set(0, 6, "╠", "2"); g.set(cols - 1, 6, "╣", "2");
    const hy = 7;
    [["TIME", C.time], ["FLIGHT", C.flight], ["DESTINATION", C.dest], ["GATE", C.gate], ["CHECK-IN", C.desk], ["STATUS", C.status], ["REMARKS", C.rem]].forEach(([s, x]) => g.text(x, hy, s, "1"));
    g.hline(1, cols - 2, hy + 1, "─", "2");
    // first flight still on the board: departed less than 4 minutes ago
    let i0 = 0;
    while (flight(i0).act < now - 4 && i0 < 100000) i0++;
    // delayed flights may linger; collect the next N that are still listed
    const list = [];
    for (let i = Math.max(0, i0 - 12); list.length < N; i++) { const f = flight(i); if (f.act >= now - 4) list.push([i, f]); }
    list.forEach(([id, f], k) => {
      const y = hy + 2 + k;
      const [st, co, since] = status(f, now);
      const age = (now - since) / RATE;      // seconds since the status changed
      const dim = st === "DEPARTED";
      g.text(C.time, y, hhmm(f.sched), dim ? "7" : "0");
      g.text(C.flight, y, f.code, dim ? "7" : "8");
      g.text(C.dest, y, f.dest, dim ? "7" : "0");
      const gateOpen = f.act - now <= 55;
      field(C.gate, y, gateOpen ? f.gate : "--", 4, dim ? "7" : "8", (now - (f.act - 55)) / RATE, id * 7 + 1);
      g.text(C.desk, y, f.act - now > 45 ? f.desk : "closed", dim || f.act - now <= 45 ? "7" : "1");
      field(C.status, y, st, 12, co, age, id * 7 + 2);
      if (st === "FINAL CALL" || st === "BOARDING") g.set(C.status - 2, y, "►", co);
      const rem = f.delay && st !== "DEPARTED" ? "EXP " + hhmm(f.act) : st === "DEPARTED" ? "AT " + hhmm(f.act) : st === "FINAL CALL" ? "GATE " + f.gate : "";
      g.text(C.rem, y, rem, f.delay && st !== "DEPARTED" ? "6" : "1");
    });
    // footer
    const fy = rows - 2;
    g.hline(1, cols - 2, fy - 1, "─", "2");
    const msg = "PLEASE KEEP YOUR BELONGINGS WITH YOU AT ALL TIMES  ·  BOARDING CLOSES 10 MINUTES BEFORE DEPARTURE  ·  ";
    const off = Math.floor(t * 8);
    for (let x = 3; x < cols - 3; x++) g.set(x, fy, msg[(x + off) % msg.length], "1");
    return g.frame();
  };
}
