/* langtons-ant: four of Langton's ants on one wrapping board, chaos giving way to diagonal highways. */
import { Grid, palette } from "../lib/kit.js";

const pal = palette([
  "#14142a",                                  // 0 board dot
  "#ff5a6a", "#ffc23f", "#3fe0a0", "#5aa0ff", // 1-4 trails per ant
  "#ffffff",                                  // 5 ant
]);

export const meta = {
  slug: "langtons-ant",
  name: "Langton's Ant",
  category: "algorithms",
  note: "Four of Langton's ants share one wrapping board, each painting its own colour until order emerges from the chaos.",
  tags: ["cellular", "automaton", "emergence", "terminal", "wallpaper"],
  cols: 96, rows: 36, fps: 24,
  palette: pal,
};

const RATE = 520;      // steps per second, per ant
const EPOCH = 40;      // seconds before the board is wiped and the ants start over
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2;
  const board = new Uint8Array(W * H);
  const START = [[24, 18, 0], [72, 18, 1], [24, 54, 3], [72, 54, 2]];
  let ants, epoch = -1, steps = 0;
  const reset = () => { board.fill(0); ants = START.map(([x, y, d], i) => ({ x, y, d, c: i + 1 })); steps = 0; };
  return (t) => {
    const e = Math.floor(t / EPOCH);
    const target = Math.floor((t - e * EPOCH) * RATE);
    if (e !== epoch || target < steps) { epoch = e; reset(); }
    while (steps < target) {
      for (const a of ants) {
        const i = a.x + a.y * W;
        if (board[i] === 0) { a.d = (a.d + 1) & 3; board[i] = a.c; }
        else { a.d = (a.d + 3) & 3; board[i] = 0; }
        a.x = (a.x + DX[a.d] + W) % W; a.y = (a.y + DY[a.d] + H) % H;
      }
      steps++;
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = board[x + y * 2 * W], b = board[x + (y * 2 + 1) * W];
      if (a && b) g.set(x, y, "█", String(a));
      else if (a) g.set(x, y, "▀", String(a));
      else if (b) g.set(x, y, "▄", String(b));
      else g.set(x, y, (x + y) % 2 ? "·" : " ", "0");
    }
    for (const a of ants) g.set(a.x, a.y >> 1, "●", "5");
    return g.frame();
  };
}
