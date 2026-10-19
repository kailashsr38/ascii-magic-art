/* wireframe-maze-crawl: an early 3D maze game in line drawing, walking the corridors by the right-hand rule with a map beside it. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "wireframe-maze-crawl",
  name: "Line Drawn Maze Crawl",
  category: "retro",
  note: "An early first-person maze game drawn in amber lines, gliding down corridors and turning at junctions by the right-hand rule while a map tracks each step.",
  tags: ["retro", "maze", "3d", "game", "first person", "wallpaper"],
  cols: 98, rows: 30, fps: 24,
  palette: palette(["#ffd27a", "#ffb03a", "#c07a1c", "#7a4c10", "#4a2e0a", "#2e1c06", "#1c1104", "#e6edf3", "#8b949e", "#484f58", "#7ee787", "#120b02"]),
};

const N = 6, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], ARROW = "▲▶▼◀", DIRN = "NESW";

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // carve a perfect maze
  const R = rng(23);
  const wall = Array.from({ length: N * N }, () => [true, true, true, true]);
  const seen = new Array(N * N).fill(false);
  const stack = [0]; seen[0] = true;
  while (stack.length) {
    const c = stack[stack.length - 1], cx = c % N, cy = Math.floor(c / N);
    const opts = [0, 1, 2, 3].filter((d) => { const nx = cx + DX[d], ny = cy + DY[d]; return nx >= 0 && ny >= 0 && nx < N && ny < N && !seen[nx + ny * N]; });
    if (!opts.length) { stack.pop(); continue; }
    const d = opts[Math.floor(R() * opts.length)];
    const nc = cx + DX[d] + (cy + DY[d]) * N;
    wall[c][d] = false; wall[nc][(d + 2) % 4] = false; seen[nc] = true; stack.push(nc);
  }
  // right-hand walk, as a list of states with the action that follows
  const start = { c: 0, d: 1 };
  const acts = [];
  let s = { ...start };
  for (let i = 0; i < 600; i++) {
    const rd = (s.d + 1) % 4;
    let a;
    if (!wall[s.c][rd] && acts.length && acts[acts.length - 1].a !== "R") a = "R";
    else if (!wall[s.c][s.d]) a = "F";
    else a = "L";
    acts.push({ c: s.c, d: s.d, a });
    if (a === "R") s = { c: s.c, d: rd };
    else if (a === "L") s = { c: s.c, d: (s.d + 3) % 4 };
    else s = { c: s.c + DX[s.d] + DY[s.d] * N, d: s.d };
    if (s.c === start.c && s.d === start.d && i > 4) break;
  }
  const STEP = 0.5, PERIOD = acts.length * STEP;
  const VX = 1, VY = 1, VW = 62, VH = 28, CX = VX + VW / 2, CY = VY + VH / 2;
  const hw = (z) => 30 / Math.max(0.12, z + 0.9);
  const hh = (z) => hw(z) * 0.47;
  const put = (x, y, ch, co) => { if (x >= VX && x < VX + VW && y >= VY && y < VY + VH) g.set(x, y, ch, co); };
  const shadeFor = (z) => (z < 1 ? "2" : z < 2 ? "3" : z < 3.5 ? "4" : "5");
  // side wall between depths z0 and z1 on side s (-1 left, +1 right)
  const side = (z0, z1, sgn) => {
    const xa = CX + sgn * hw(z0), xb = CX + sgn * hw(z1);
    const lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    for (let x = Math.ceil(lo); x < hi; x++) {
      const k = (x + 0.5 - xa) / (xb - xa);
      const z = z0 + (z1 - z0) * k;
      const h = hh(z);
      const top = Math.round(CY - h), bot = Math.round(CY + h - 1);
      const sh = shadeFor(z);
      for (let y = top + 1; y < bot; y++) put(x, y, (x + y) % 3 === 0 ? "▒" : "░", sh);
      const slope = sgn < 0 ? "\\" : "/";
      put(x, top, slope, "1"); put(x, bot, sgn < 0 ? "/" : "\\", "1");
    }
    for (const xe of [xa, xb]) { const h = hh(xe === xa ? z0 : z1); for (let y = Math.round(CY - h); y <= Math.round(CY + h - 1); y++) put(Math.round(xe), y, "│", "0"); }
  };
  // flat wall facing us at depth z, spanning from x0 to x1
  const face = (z, x0, x1) => {
    const h = hh(z), top = Math.round(CY - h), bot = Math.round(CY + h - 1);
    const sh = shadeFor(z);
    for (let x = Math.round(x0); x <= Math.round(x1); x++) for (let y = top; y <= bot; y++) {
      const edge = y === top || y === bot, vert = x === Math.round(x0) || x === Math.round(x1);
      put(x, y, edge ? "─" : vert ? "│" : (x + y * 2) % 5 === 0 ? "▒" : "░", edge || vert ? "1" : sh);
    }
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const ai = Math.floor(lt / STEP), f = (lt % STEP) / STEP;
    const A = acts[ai];
    let c = A.c, d = A.d, off = 0;
    if (A.a === "F") off = f * f * (3 - 2 * f);
    else if (f > 0.5) d = A.a === "R" ? (d + 1) % 4 : (d + 3) % 4;
    // floor and ceiling
    for (let y = VY; y < VY + VH; y++) for (let x = VX; x < VX + VW; x++) {
      if (y > CY) { const k = (y - CY) / (VH / 2); g.set(x, y, k > 0.6 ? "▁" : (x + y) % 2 ? "." : " ", k > 0.5 ? "4" : "5"); }
      else g.set(x, y, " ", "b");
    }
    // walk the corridor away from the viewer
    let cc = c;
    for (let i = 0; i < 7; i++) {
      const z0 = i - off, z1 = i + 1 - off;
      const cxx = cc % N, cyy = Math.floor(cc / N);
      for (const sgn of [-1, 1]) {
        const sd = (d + (sgn < 0 ? 3 : 1)) % 4;
        if (wall[cc][sd]) side(z0, z1, sgn);
        else {
          const xa = CX + sgn * hw(z0), xb = CX + sgn * hw(z1);
          face(z1, Math.min(xa, xb), Math.max(xa, xb));
        }
      }
      if (wall[cc][d]) { face(z1, CX - hw(z1), CX + hw(z1)); break; }
      const nx = cxx + DX[d], ny = cyy + DY[d];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
      cc = nx + ny * N;
    }
    g.box(0, 0, VW + 2, VH + 2, "double", "2");
    g.text(3, 0, " DUNGEON LEVEL 1 ", "0");
    // the map
    const MX = 68, MY = 2;
    g.text(MX, 0, "MAP", "0");
    const visited = new Set();
    for (let i = 0; i <= ai; i++) visited.add(acts[i].c);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = x + y * N, px = MX + x * 4, py = MY + y * 2;
      g.text(px, py, "+", "3");
      g.text(px + 1, py, wall[k][0] ? "---" : "   ", "2");
      g.text(px, py + 1, wall[k][3] ? "|" : " ", "2");
      if (visited.has(k)) g.text(px + 1, py + 1, " · ", "3");
    }
    for (let x = 0; x < N; x++) g.text(MX + x * 4, MY + N * 2, "+---", "3");
    g.set(MX + N * 4, MY + N * 2, "+", "3");
    for (let y = 0; y < N; y++) { g.set(MX + N * 4, MY + y * 2, "+", "3"); g.set(MX + N * 4, MY + y * 2 + 1, "|", "2"); }
    g.set(MX + (c % N) * 4 + 2, MY + Math.floor(c / N) * 2 + 1, ARROW[d], "0");
    g.text(MX, MY + N * 2 + 2, "FACING " + DIRN[d], "7");
    g.text(MX, MY + N * 2 + 3, "STEPS  " + String(acts.slice(0, ai).filter((a) => a.a === "F").length).padStart(3, "0"), "8");
    g.text(MX, MY + N * 2 + 5, A.a === "F" ? "> FORWARD" : A.a === "R" ? "> TURN RIGHT" : "> TURN LEFT", "a");
    g.text(MX, MY + N * 2 + 7, "TORCH ", "8");
    g.text(MX + 6, MY + N * 2 + 7, "██████████".slice(0, 10 - Math.floor((lt / PERIOD) * 6)), "1");
    return g.frame();
  };
}
