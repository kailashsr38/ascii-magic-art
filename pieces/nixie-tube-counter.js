/* nixie-tube-counter: six glowing nixie tubes on a wooden base counting the time, with a cathode cycling sweep. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "nixie-tube-counter",
  name: "Nixie Tube Clock",
  category: "lettering",
  note: "Six glass nixie tubes with glowing orange wire digits count the seconds, rolling through every cathode every ten seconds.",
  tags: ["nixie", "clock", "retro", "hero", "dashboard", "digits"],
  cols: 100, rows: 23, fps: 30,
  palette: palette(["#fff1d6", "#ffab4a", "#ff7a1a", "#7a3410", "#3a1a0a", "#3a3f46", "#5c6570", "#8b949e", "#26201c", "#6b4a2b", "#8a6238", "#4a3220", "#c9d1d9", "#2a1810"]),
};

/* nixie cathode shapes, 5 wide by 9 tall, drawn fresh for this piece */
const DIG = [
  ".###.|#...#|#...#|#...#|#...#|#...#|#...#|#...#|.###.", "..#..|.##..|..#..|..#..|..#..|..#..|..#..|..#..|..#..",
  ".###.|#...#|....#|....#|...#.|..#..|.#...|#....|#####", "#####|...#.|..#..|.###.|....#|....#|....#|#...#|.###.",
  "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.|...#.|...#.", "#####|#....|#....|####.|....#|....#|....#|#...#|.###.",
  "...#.|..#..|.#...|#....|####.|#...#|#...#|#...#|.###.", "#####|....#|...#.|...#.|..#..|..#..|.#...|.#...|.#...",
  ".###.|#...#|#...#|.###.|#...#|#...#|#...#|#...#|.###.", ".###.|#...#|#...#|#...#|.####|....#|...#.|..#..|.#...",
].map((d) => d.split("|"));
const BOX = { 3: "│", 1: "│", 2: "│", 12: "─", 4: "─", 8: "─", 10: "╭", 6: "╮", 9: "╰", 5: "╯", 11: "├", 7: "┤", 14: "┬", 13: "┴", 15: "┼", 0: "•" };

function digitCells(d) {
  const P = DIG[d], on = (i, j) => i >= 0 && j >= 0 && i < 5 && j < 9 && P[j][i] === "#";
  const out = [];
  for (let j = 0; j < 9; j++) for (let i = 0; i < 5; i++) {
    if (!on(i, j)) continue;
    let b = 0;
    if (on(i, j - 1) || (on(i - 1, j - 1) && !on(i - 1, j)) || (on(i + 1, j - 1) && !on(i + 1, j))) b |= 1;
    if (on(i, j + 1) || (on(i - 1, j + 1) && !on(i - 1, j)) || (on(i + 1, j + 1) && !on(i + 1, j))) b |= 2;
    if (on(i - 1, j)) b |= 4;
    if (on(i + 1, j)) b |= 8;
    out.push([i * 2, j, BOX[b] || "│"]);
    if (on(i + 1, j)) out.push([i * 2 + 1, j, "─"]);
  }
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cells = DIG.map((_, d) => digitCells(d));
  const ghost = new Set();
  for (const d of [8, 0, 2, 5]) for (const [x, y] of cells[d]) ghost.add(x + "," + y);
  const TW = 13, GAP = 2, COLON = 4;
  const xs = [];
  let x = Math.floor((cols - (6 * TW + 4 * GAP + 2 * COLON)) / 2);
  for (let k = 0; k < 6; k++) { xs.push(x); x += TW + (k % 2 === 1 && k < 5 ? COLON + GAP : GAP); }
  const TY = 2;
  const tube = (x0) => {
    g.text(x0 + 3, TY - 1, "╭─────╮", "6");
    g.text(x0 + 1, TY, "╭─╯", "6"); g.text(x0 + TW - 4, TY, "╰─╮", "6");
    for (let y = TY + 1; y < TY + 14; y++) { g.set(x0 + 1, y, "│", "6"); g.set(x0 + TW - 2, y, "│", "6"); }
    // anode mesh
    for (let y = TY + 1; y < TY + 13; y++) for (let i = x0 + 2; i < x0 + TW - 2; i++) if ((i + y * 2) % 4 === 0) g.set(i, y, "·", "5");
    g.text(x0, TY + 14, "╞" + "═".repeat(TW - 2) + "╡", "7");
    g.text(x0 + 3, TY + 15, "│ │ │", "6");
  };
  return (t) => {
    g.clear();
    const clock = 12 * 3600 + 34 * 60 + 52 + Math.floor(t);
    const hh = Math.floor(clock / 3600) % 24, mm = Math.floor(clock / 60) % 60, ss = clock % 60;
    const digs = [Math.floor(hh / 10), hh % 10, Math.floor(mm / 10), mm % 10, Math.floor(ss / 10), ss % 10];
    const frac = t - Math.floor(t);
    const sweep = ss % 10 === 0 && frac < 0.85;
    for (let k = 0; k < 6; k++) {
      const x0 = xs[k];
      tube(x0);
      const ox = x0 + 2, oy = TY + 3;
            let d = digs[k];
      if (sweep) d = (d + 1 + Math.floor(frac * 26) + k) % 10;
      // glow halo then the lit wire
      for (const [cx, cy] of cells[d]) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const gx = ox + cx + dx, gy = oy + cy + dy;
        if (g.get(gx, gy) === "·" || g.get(gx, gy) === " ") g.set(gx, gy, "░", "3");
      }
      for (const [cx, cy, ch] of cells[d]) g.set(ox + cx, oy + cy, ch, cy === 0 || ch === "─" ? "0" : "1");
      // colons between pairs
      if (k === 1 || k === 3) {
        const cx = x0 + TW + Math.floor(COLON / 2) + 1, lit = frac < 0.5;
        g.set(cx, TY + 6, "●", lit ? "1" : "3"); g.set(cx, TY + 10, "●", lit ? "1" : "3");
      }
    }
    // wooden base
    for (let x = 2; x < cols - 2; x++) { g.set(x, TY + 17, "▄", "a"); g.set(x, TY + 18, (x % 9) ? "█" : "▓", "9"); g.set(x, TY + 19, "▀", "b"); }
    g.text(4, TY + 18, "●", "1");
    return g.frame();
  };
}
