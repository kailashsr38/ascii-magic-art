/* crate-pusher: a warehouse worker solving box-pushing puzzles one shove at a time. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(["#6a2a1a", "#9a3e24", "#c45a34", "#3a160c"]);
const FLOOR = add(["#2e2a3a", "#3a3548", "#48425a"]);
const GOAL = add(["#ff5a7a", "#ffb0c0"]);
const CRATE = add(["#7a4a1a", "#b47a34", "#e8b060", "#3a2208"]);
const DONE = add(["#2a8a4a", "#5ad07a", "#b4ffc8"]);
const MAN = add(["#3a8aff", "#ffd0a0", "#ffd23a", "#20242c"]);
const BG = add(gradient(["#0a0a10", "#14121c"], 3));
const UI = add(["#e6edf3", "#8b949e", "#ffd166", "#7ee787", "#30363d"]);

export const meta = {
  slug: "crate-pusher",
  name: "Crate Pusher Puzzle",
  category: "arcade",
  note: "A tiny warehouse worker solves box-pushing puzzles on its own, shoving every crate onto a marked spot before moving to the next level.",
  tags: ["puzzle", "boxes", "game", "retro", "warehouse", "loader"],
  cols: 60, rows: 22, fps: 16,
  palette: palette(P),
};

const LEVELS = [
  ["########", "#      #", "# $ #. #", "# @$ . #", "#  ##  #", "########"],
  [" #######", " #  .  #", "##$##$ #", "#  @   #", "# $  . #", "#.  ####", "#####   "],
  ["#######", "#. .  #", "# $#$ #", "#  @  #", "# $#  #", "#.    #", "#######"],
  ["########", "#   #  #", "# $    #", "#.#@#$.#", "#   $  #", "#  .#  #", "########"],
];
const SOL = ["RRluurrrdddlUlluulDldRRR", "dLrrrruuullllDDlDRRRurUruL", "lUdrrruullLddDurrUruLddddlL", "uLrddRRUruLLLullDRurDDDrrdrU"];
const D = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] };
const STEP = 0.24, PAUSE = 2.4, INTRO = 1.0;
const DUR = SOL.map((s) => INTRO + s.length * STEP + PAUSE);
const TOTAL = DUR.reduce((a, b) => a + b, 0);

function parse(L) {
  const walls = new Set(), goals = new Set(), boxes = []; let p;
  L.forEach((r, y) => [...r].forEach((c, x) => {
    const k = x + "," + y;
    if (c === "#") walls.add(k); if (c === ".") goals.add(k); if (c === "$") boxes.push([x, y]); if (c === "@") p = [x, y];
  }));
  return { walls, goals, boxes, p };
}
const PARSED = LEVELS.map(parse);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  return (t) => {
    let tt = ((t % TOTAL) + TOTAL) % TOTAL, li = 0;
    while (tt >= DUR[li]) { tt -= DUR[li]; li++; }
    const L = LEVELS[li], lv = PARSED[li], sol = SOL[li];
    const mv = Math.max(0, (tt - INTRO) / STEP);
    const n = Math.min(sol.length, Math.floor(mv));
    const frac = n < sol.length ? mv - n : 0;
    let [px, py] = lv.p; const boxes = lv.boxes.map((b) => b.slice());
    let pushes = 0, face = "r";
    for (let i = 0; i < n; i++) {
      const c = sol[i], [dx, dy] = D[c.toLowerCase()]; face = c.toLowerCase();
      px += dx; py += dy;
      if (c !== c.toLowerCase()) { const b = boxes.find(([x, y]) => x === px && y === py); b[0] += dx; b[1] += dy; pushes++; }
    }
    // in-between motion for the current step
    let ax = 0, ay = 0, movingBox = null;
    if (n < sol.length && tt > INTRO) {
      const c = sol[n], [dx, dy] = D[c.toLowerCase()]; face = c.toLowerCase();
      const e = Math.min(1, frac * 1.6);
      ax = dx * e; ay = dy * e;
      if (c !== c.toLowerCase()) movingBox = boxes.find(([x, y]) => x === px + dx && y === py + dy);
    }
    const solved = n >= sol.length;
    const W = Math.max(...L.map((r) => r.length)), H = L.length;
    const ox = Math.floor((38 - W * 4) / 2), oy = Math.floor((rows - H * 2) / 2) + 1;
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x * 3 + y * 5) % 7 ? "░" : "▒", KEYS[BG + ((x >> 2) + y) % 2]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = x + "," + y, sx = ox + x * 4, sy = oy + y * 2;
      const c = L[y][x] || " ";
      if (lv.walls.has(k)) {
        g.text(sx, sy, y % 2 ? "▀█▀█" : "█▀█▀", KEYS[WALL + 1]);
        g.text(sx, sy + 1, y % 2 ? "▄▀▄▀" : "▀▄▀▄", KEYS[WALL + ((x + y) % 2 ? 0 : 2)]);
      } else if (c !== " " || (x > 0 && x < W - 1 && L[y].slice(0, x).includes("#") && L[y].slice(x).includes("#"))) {
        g.text(sx, sy, "▒▒▒▒", KEYS[FLOOR + ((x + y) % 2)]);
        g.text(sx, sy + 1, "▒▒▒▒", KEYS[FLOOR + ((x + y) % 2)]);
        if (lv.goals.has(k)) { g.text(sx, sy, " ◆◆ ", KEYS[GOAL]); g.text(sx, sy + 1, " ◆◆ ", KEYS[GOAL]); g.text(sx + 1, sy, "▄▄", KEYS[GOAL]); g.text(sx + 1, sy + 1, "▀▀", KEYS[GOAL]); }
      }
    }
    let onGoal = 0;
    for (const b of boxes) {
      let bx = b[0], by = b[1];
      if (b === movingBox) { bx += ax; by += ay; }
      const good = b !== movingBox && lv.goals.has(b[0] + "," + b[1]);
      if (good) onGoal++;
      const sx = Math.round(ox + bx * 4), sy = Math.round(oy + by * 2);
      const base = good ? DONE : CRATE;
      g.text(sx, sy, "▛▀▀▜", KEYS[base + 1]); g.text(sx + 1, sy, good ? "▀▀" : "╳╳", KEYS[base + 2]);
      g.text(sx, sy + 1, "▙▄▄▟", KEYS[base]); g.text(sx + 1, sy + 1, good ? "✓✓" : "▒▒", KEYS[base + (good ? 2 : 1)]);
    }
    {
      const sx = Math.round(ox + (px + ax) * 4), sy = Math.round(oy + (py + ay) * 2);
      const step = Math.floor(mv * 2) % 2;
      g.text(sx + 1, sy, "▄▄", KEYS[MAN + 2]);
      g.set(sx + (face === "l" ? 1 : 2), sy, "●", KEYS[MAN + 1]);
      g.text(sx, sy + 1, face === "l" ? "◄██▌" : face === "r" ? "▐██►" : "▐██▌", KEYS[MAN]);
      if (!solved) g.set(sx + 1 + step, sy + 1, "▓", KEYS[MAN]);
    }
    // panel
    const px0 = 39;
    g.box(px0, 1, cols - px0 - 1, rows - 2, "round", KEYS[UI + 4]);
    for (let y = 2; y < rows - 2; y++) g.text(px0 + 1, y, " ".repeat(cols - px0 - 3), KEYS[UI]);
    g.text(px0 + 2, 2, "WAREHOUSE", KEYS[UI + 2]);
    g.text(px0 + 2, 4, "LEVEL  " + (li + 1) + "/" + LEVELS.length, KEYS[UI]);
    g.text(px0 + 2, 6, "MOVES  " + String(n).padStart(3, " "), KEYS[UI + 1]);
    g.text(px0 + 2, 7, "PUSHES " + String(pushes).padStart(3, " "), KEYS[UI + 1]);
    g.text(px0 + 2, 9, "CRATES", KEYS[UI + 1]);
    g.text(px0 + 2, 10, boxes.map((b, i) => (i < onGoal ? "■" : "□")).join(" "), KEYS[onGoal === boxes.length ? UI + 3 : UI + 2]);
    g.text(px0 + 2, 12, "REPLAY", KEYS[UI + 1]);
    const seq = sol.slice(Math.max(0, n - 7), n + 9);
    const arrows = { l: "←", r: "→", u: "↑", d: "↓" };
    [...seq].forEach((c, i) => {
      const idx = Math.max(0, n - 7) + i;
      g.set(px0 + 2 + i, 13, arrows[c.toLowerCase()], KEYS[idx === n ? UI + 2 : idx < n ? UI + 1 : c !== c.toLowerCase() ? UI + 3 : UI]);
    });
    if (solved) {
      const on = Math.floor(tt * 4) % 2 === 0;
      g.box(px0 + 1, 15, cols - px0 - 3, 3, "double", KEYS[on ? UI + 3 : DONE + 1]);
      g.text(px0 + 4, 16, "SOLVED!", KEYS[UI + 3]);
    } else g.text(px0 + 2, 16, tt < INTRO ? "READY..." : "thinking", KEYS[UI + 1]);
    return g.frame();
  };
}
