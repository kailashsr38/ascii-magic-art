/* parliament-seats: a hemicycle seat chart filling in as election results come in, with a running tally against the majority line. */
import { Grid, palette, rng, clamp } from "../lib/kit.js";

export const meta = {
  slug: "parliament-seats",
  name: "Election Seat Chart",
  category: "live-data",
  note: "A half circle of 201 parliament seats filling in as results are declared, coloured by party, with a running tally and the majority line at 101.",
  tags: ["election", "parliament", "seats", "chart", "results", "data"],
  cols: 90, rows: 26, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#ff7b72", "#79c0ff", "#7ee787", "#f2cc60", "#d2a8ff", "#30363d", "#484f58"]),
};

const PARTY = [["Red Union", 72, "2"], ["Blue Coalition", 64, "3"], ["Green Alliance", 31, "4"], ["Liberal Centre", 22, "5"], ["Independents", 12, "6"]];
const TOTAL = 201, MAJ = 101;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 30, cy = 21;
  // seat positions on concentric arcs, left to right by angle
  const seats = [];
  const NR = 8;
  const radii = Array.from({ length: NR }, (_, i) => 11 + i * 2.6);
  const lens = radii.map((r) => r);
  const sum = lens.reduce((a, b) => a + b, 0);
  let left = TOTAL;
  radii.forEach((r, i) => {
    const n = i === NR - 1 ? left : Math.round((TOTAL * lens[i]) / sum);
    left -= n;
    for (let k = 0; k < n; k++) {
      const a = Math.PI - (k + 0.5) / n * Math.PI;
      seats.push({ x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r * 0.5, a });
    }
  });
  seats.sort((p, q) => q.a - p.a);
  // party of each seat: blocks left to right, as on a real chart
  const owner = [];
  PARTY.forEach(([, n], p) => { for (let i = 0; i < n; i++) owner.push(p); });
  // order in which seats are declared: random but fixed
  const r = rng(7);
  const order = seats.map((_, i) => i).sort(() => 0);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const when = new Array(TOTAL);
  order.forEach((s, i) => (when[s] = i));
  const PER = 16, FILL = 12;
  return (t) => {
    g.clear();
    const ph = t % PER;
    const declared = Math.min(TOTAL, Math.floor((ph / FILL) * TOTAL));
    const tally = PARTY.map(() => 0);
    seats.forEach((s, i) => {
      const d = when[i] < declared;
      if (d) tally[owner[i]]++;
      g.set(Math.round(s.x), Math.round(s.y), d ? "●" : "○", d ? PARTY[owner[i]][2] : "7");
    });
    // majority marker straight up the middle
    for (let y = 1; y < cy - 4; y++) if (g.get(cx, y) === " ") g.set(cx, y, "┊", "8");
    g.text(cx - 6, 0, "majority " + MAJ, "1");
    g.text(1, rows - 2, "Seats declared " + declared + " / " + TOTAL, "0");
    const pct = Math.round((declared / TOTAL) * 40);
    for (let q = 0; q < 40; q++) g.set(1 + q, rows - 1, q < pct ? "█" : "░", q < pct ? "0" : "7");
    // tally table
    const L = 64;
    g.text(L, 2, "Party", "1"); g.text(L + 19, 2, "Seats", "1");
    g.hline(L, cols - 1, 3, "─", "7");
    const lead = tally.indexOf(Math.max(...tally));
    PARTY.forEach(([name, , co], p) => {
      const y = 5 + p * 3;
      g.text(L, y, "●", co); g.text(L + 2, y, name, p === lead && declared > 20 ? "0" : "1");
      g.text(L + 20, y, String(tally[p]).padStart(3), "0");
      const w = Math.round((tally[p] / MAJ) * 23);
      for (let q = 0; q < 24; q++) g.set(L + q, y + 1, q < w ? "▀" : q === 23 ? "┊" : " ", q < w ? co : "8");
    });
    if (tally[lead] >= MAJ) g.text(L, 21, PARTY[lead][0] + " wins", PARTY[lead][2]);
    else if (declared === TOTAL) g.text(L, 21, "Hung parliament", "5");
    else g.text(L, 21, "Counting...", "1");
    return g.frame();
  };
}
