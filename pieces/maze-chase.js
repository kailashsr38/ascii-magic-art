/* maze-chase: a dot-eater clearing a maze while four ghosts hunt it down. */
import { Grid, palette, KEYS, rng } from "../lib/kit.js";

const UI = ["#05060f", "#2440d8", "#5a78ff", "#ffcfa8", "#ffe14a", "#ff4b4b", "#ff9ad8", "#4fe8f0", "#ffb04a", "#3050ff", "#ffffff", "#e6edf3", "#8b949e"];

export const meta = {
  slug: "maze-chase",
  name: "Maze Chase",
  category: "arcade",
  note: "A dot-eater clears a maze on its own while four ghosts hunt it, with power pellets that turn the tables.",
  tags: ["maze", "arcade", "game", "retro", "ghosts"],
  cols: 42, rows: 23, fps: 20,
  palette: palette(UI),
};

const MAP = [
  "#####################",
  "#.........#.........#",
  "#o##.####.#.####.##o#",
  "#...................#",
  "#.##.#.#######.#.##.#",
  "#....#....#....#....#",
  "####.####.#.####.####",
  "####.#.........#.####",
  "####.#.###-###.#.####",
  "    ...#GGGGG#...    ",
  "####.#.#######.#.####",
  "####.#.........#.####",
  "####.#.#######.#.####",
  "#.........#.........#",
  "#.##.####.#.####.##.#",
  "#o.#...... ......#.o#",
  "##.#.#.#######.#.#.##",
  "#....#....#....#....#",
  "#.#######.#.#######.#",
  "#...................#",
  "#####################",
];
const MW = 21, MH = MAP.length;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const wall = (x, y) => { if (y < 0 || y >= MH) return true; if (x < 0 || x >= MW) return y !== 9; const c = MAP[y][x]; return c === "#" || c === "G" || c === "-"; };
const wrap = (x) => (x + MW) % MW;
const GCOL = ["5", "6", "7", "8"];
const SCATTER = [[19, 0], [1, 0], [19, 20], [1, 20]];

function makeSim(rate, roundSteps, init, step) {
  let st = null, round = -1, k = 0;
  return (t) => {
    const s = Math.max(0, Math.floor(t * rate));
    const r = Math.floor(s / roundSteps), want = s % roundSteps;
    if (r !== round || want < k) { st = init(r); round = r; k = 0; }
    while (k < want) { step(st); k++; }
    return st;
  };
}

function bfs(sx, sy, block) {
  const d = new Int16Array(MW * MH).fill(-1);
  const q = [sx + sy * MW]; d[q[0]] = 0;
  for (let i = 0; i < q.length; i++) {
    const c = q[i], x = c % MW, y = (c / MW) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = wrap(x + dx), ny = y + dy;
      if (wall(x + dx, ny) && !(ny === 9 && (x + dx < 0 || x + dx >= MW))) continue;
      if (wall(nx, ny)) continue;
      const j = nx + ny * MW;
      if (d[j] >= 0 || (block && block[j])) continue;
      d[j] = d[c] + 1; q.push(j);
    }
  }
  return d;
}

function resetPositions(st) {
  st.p = { x: 10, y: 15, d: 2 };
  st.g = [0, 1, 2, 3].map((i) => ({ x: 8 + i + (i > 1 ? 1 : 0), y: 9, d: 3, home: true, release: st.tick + 10 + i * 30, eyes: false }));
  st.fright = 0;
}
function newLevel(st) {
  st.dots = new Uint8Array(MW * MH);
  st.left = 0;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = MAP[y][x];
    if (c === ".") { st.dots[x + y * MW] = 1; st.left++; }
    if (c === "o") { st.dots[x + y * MW] = 2; st.left++; }
  }
  resetPositions(st);
}
function newGame(st) { st.score = 0; st.lives = 3; st.level = 1; st.over = 0; st.dying = 0; st.clear = 0; newLevel(st); }

function eat(st) {
  const i = st.p.x + st.p.y * MW;
  if (st.dots[i]) {
    st.score += st.dots[i] === 2 ? 50 : 10;
    if (st.dots[i] === 2) { st.fright = 70; st.chain = 200; for (const g of st.g) if (!g.home && !g.eyes) { g.d = (g.d + 2) % 4; g.scared = true; } }
    st.dots[i] = 0; st.left--;
    st.best = Math.max(st.best, st.score);
    if (!st.left) st.clear = 1;
  }
}

function collide(st) {
  for (const g of st.g) {
    if (g.home || g.eyes || g.x !== st.p.x || g.y !== st.p.y) continue;
    if (g.scared && st.fright > 0) { g.eyes = true; g.scared = false; st.score += st.chain; st.chain = Math.min(1600, st.chain * 2); st.best = Math.max(st.best, st.score); }
    else { st.dying = 1; return; }
  }
}

function moveGhost(st, g, i) {
  if (g.home) { if (st.tick >= g.release) { g.home = false; g.x = 10; g.y = 7; g.d = 2; } return; }
  let tx, ty;
  if (g.eyes) {
    if (g.x === 10 && g.y === 7) { g.eyes = false; return; }
    tx = 10; ty = 7;
  } else if (Math.floor(st.tick / 100) % 4 === 0) [tx, ty] = SCATTER[i];
  else if (i === 0) { tx = st.p.x; ty = st.p.y; }
  else if (i === 1) { tx = st.p.x + DIRS[st.p.d][0] * 4; ty = st.p.y + DIRS[st.p.d][1] * 4; }
  else if (i === 2) { tx = 2 * st.p.x - st.g[0].x; ty = 2 * st.p.y - st.g[0].y; }
  else { const dd = Math.hypot(g.x - st.p.x, g.y - st.p.y); [tx, ty] = dd > 7 ? [st.p.x, st.p.y] : SCATTER[3]; }
  let best = -1, bestS = Infinity;
  const opts = [];
  for (let d = 0; d < 4; d++) {
    if (d === (g.d + 2) % 4) continue;
    const nx = wrap(g.x + DIRS[d][0]), ny = g.y + DIRS[d][1];
    if (wall(nx, ny)) continue;
    opts.push(d);
    const s = (nx - tx) ** 2 + (ny - ty) ** 2;
    if (s < bestS) { bestS = s; best = d; }
  }
  if (!opts.length) best = (g.d + 2) % 4;
  else if (g.scared && st.fright > 0) best = opts[Math.floor(st.r() * opts.length)];
  g.d = best;
  g.x = wrap(g.x + DIRS[best][0]); g.y += DIRS[best][1];
}

function movePlayer(st) {
  const danger = new Uint8Array(MW * MH);
  for (const g of st.g) {
    if (g.home || g.eyes || (g.scared && st.fright > 8)) continue;
    const d = bfs(g.x, g.y);
    for (let i = 0; i < d.length; i++) if (d[i] >= 0 && d[i] <= 3) danger[i] = 1;
  }
  danger[st.p.x + st.p.y * MW] = 0;
  const dist = bfs(st.p.x, st.p.y, danger);
  // pick a goal: a frightened ghost close by, else the nearest dot
  let goal = -1, gd = 1e9;
  if (st.fright > 15) for (const g of st.g) {
    if (g.home || g.eyes || !g.scared) continue;
    const j = g.x + g.y * MW;
    if (dist[j] >= 0 && dist[j] < 9 && dist[j] < gd) { gd = dist[j]; goal = j; }
  }
  if (goal < 0) for (let j = 0; j < dist.length; j++) if (st.dots[j] && dist[j] >= 0 && dist[j] + (st.dots[j] === 2 && st.fright ? 6 : 0) < gd) { gd = dist[j]; goal = j; }
  let dir = -1;
  if (goal >= 0 && gd > 0) {
    // walk back from the goal to find the first step
    let c = goal;
    while (dist[c] > 1) {
      const x = c % MW, y = (c / MW) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = wrap(x + dx), ny = y + dy;
        if (ny < 0 || ny >= MH) continue;
        const j = nx + ny * MW;
        if (dist[j] === dist[c] - 1) { c = j; break; }
      }
    }
    const cx = c % MW, cy = (c / MW) | 0;
    dir = DIRS.findIndex(([dx, dy]) => wrap(st.p.x + dx) === cx && st.p.y + dy === cy);
  }
  if (dir < 0) {
    // nowhere safe: run to the neighbour furthest from the ghosts
    let bs = -1;
    for (let d = 0; d < 4; d++) {
      const nx = wrap(st.p.x + DIRS[d][0]), ny = st.p.y + DIRS[d][1];
      if (wall(nx, ny)) continue;
      let m = 99;
      for (const g of st.g) if (!g.home && !g.eyes) m = Math.min(m, Math.abs(g.x - nx) + Math.abs(g.y - ny));
      if (m > bs) { bs = m; dir = d; }
    }
  }
  if (dir < 0) return;
  st.p.d = dir;
  st.p.x = wrap(st.p.x + DIRS[dir][0]); st.p.y += DIRS[dir][1];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // which wall tiles touch open space, and how they join, for the box drawing
  const art = (x, y) => x >= 0 && x < MW && y >= 0 && y < MH && (MAP[y][x] === "#" || MAP[y][x] === "-");
  const edge = (x, y) => {
    if (!art(x, y)) return false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= MW || ny < 0 || ny >= MH) continue;
      if (!art(nx, ny)) return true;
    }
    return false;
  };
  const JOIN = { "": "■", E: "═", W: "═", EW: "═", N: "║", S: "║", NS: "║", ES: "╔", SW: "╗", EN: "╚", NW: "╝", ESW: "╦", ENW: "╩", ENS: "╠", NSW: "╣", ENSW: "╬" };
  const wallArt = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!edge(x, y)) { wallArt.push(null); continue; }
    let k = "";
    if (edge(x + 1, y)) k += "E";
    if (edge(x, y - 1)) k += "N";
    if (edge(x, y + 1)) k += "S";
    if (edge(x - 1, y)) k += "W";
    const key = k.split("").sort((a, b) => "ENSW".indexOf(a) - "ENSW".indexOf(b)).join("");
    wallArt.push([MAP[y][x] === "-" ? "─" : JOIN[key] || "╬", k.includes("E") ? (MAP[y][x] === "-" || MAP[y][x + 1] === "-" ? "─" : "═") : " "]);
  }
  const sim = makeSim(9, 9 * 180, (round) => {
    const st = { r: rng(400 + round * 17), best: 0, tick: 0 };
    newGame(st); return st;
  }, (st) => {
    st.tick++;
    if (st.over) { if (++st.over > 40) newGame(st); return; }
    if (st.clear) { if (++st.clear > 24) { st.clear = 0; st.level++; newLevel(st); } return; }
    if (st.dying) {
      if (++st.dying > 20) { st.dying = 0; st.lives--; if (st.lives <= 0) st.over = 1; else resetPositions(st); }
      return;
    }
    movePlayer(st); eat(st); collide(st);
    if (st.dying || st.clear) return;
    st.g.forEach((gh, i) => {
      const slow = gh.eyes ? false : gh.scared && st.fright > 0 ? st.tick % 2 === 0 : st.tick % 8 === 0;
      if (!slow) moveGhost(st, gh, i);
      if (gh.eyes && !gh.home) moveGhost(st, gh, i);
    });
    collide(st);
    if (st.fright > 0 && --st.fright === 0) for (const gh of st.g) gh.scared = false;
  });
  return (t) => {
    const st = sim(t);
    g.clear();
    g.text(0, 0, "SCORE " + String(st.score).padStart(5, "0"), "b");
    g.text(16, 0, "HI " + String(st.best).padStart(5, "0"), "c");
    g.text(cols - 6, 0, "LV " + String(st.level).padStart(2, "0"), "c");
    const oy = 1;
    const flashWalls = st.clear && Math.floor(st.clear / 3) % 2;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const w = wallArt[x + y * MW];
      if (w) { g.set(x * 2, oy + y, w[0], flashWalls ? "a" : MAP[y][x] === "-" ? "6" : "1"); g.set(x * 2 + 1, oy + y, w[1], flashWalls ? "a" : "1"); continue; }
      const d = st.dots[x + y * MW];
      if (d === 1) g.set(x * 2, oy + y, "·", "3");
      if (d === 2 && Math.floor(t * 4) % 2) g.set(x * 2, oy + y, "●", "3");
    }
    const frightBlink = st.fright > 0 && st.fright < 20 && Math.floor(t * 8) % 2;
    st.g.forEach((gh, i) => {
      const ch = gh.eyes ? "°" : "◆";
      const co = gh.eyes ? "a" : gh.scared && st.fright > 0 && !gh.home ? (frightBlink ? "a" : "9") : GCOL[i];
      g.set(gh.x * 2, oy + gh.y, ch, co);
      if (!gh.eyes) g.set(gh.x * 2 + 1, oy + gh.y, gh.home ? " " : "▖", co);
    });
    const P = ["▶", "▼", "◀", "▲"];
    if (!st.dying || Math.floor(st.dying / 2) % 2 === 0) {
      const open = Math.floor(t * 8) % 2;
      g.set(st.p.x * 2, oy + st.p.y, st.dying ? "·" : open ? P[st.p.d] : "●", "4");
    }
    g.text(0, rows - 1, "LIVES", "c");
    for (let i = 0; i < st.lives; i++) g.set(7 + i * 2, rows - 1, "●", "4");
    if (st.over) g.text(cols / 2 - 5, oy + 11, "GAME  OVER", "5");
    else if (st.tick < 18 || (st.clear && st.clear > 10)) g.text(cols / 2 - 3, oy + 11, st.clear ? "CLEAR!" : "READY!", "4");
    return g.frame();
  };
}
