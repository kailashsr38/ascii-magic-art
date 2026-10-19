/* number-tile-merge: a sliding number puzzle that plays itself, doubling tiles toward 2048. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const TILE = ["#3a3440", "#eee4da", "#ede0c8", "#f2b179", "#f59563", "#f67c5f", "#f65e3b", "#edcf72", "#edcc61", "#edc850", "#edc53f", "#edc22e", "#3c3a32"];
const UI = ["#1a1620", "#2a2430", "#bbada0", "#776e65", "#f9f6f2", "#e6edf3", "#8b949e", "#ffd166", "#7ee787", "#ff7b72"];
const BG = gradient(["#0e0c12", "#1a1620"], 3);

export const meta = {
  slug: "number-tile-merge",
  name: "Number Tile Merge",
  category: "arcade",
  note: "A four by four sliding number puzzle that plays itself, merging matching tiles into ever larger powers of two.",
  tags: ["puzzle", "numbers", "game", "merge", "casual", "loader"],
  cols: 72, rows: 22, fps: 20,
  palette: palette([...TILE, ...UI, ...BG]),
};

const U = (i) => KEYS[13 + i], B = (i) => KEYS[23 + i];
const TW = 10, TH = 3, GX = 11, GY = 4, OX = 3, OY = 2;
const DIRS = ["←", "↑", "→", "↓"];

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
// slide: returns {b, moves:[[from,to,val]], merged:Set, gain}
function slide(b, d) {
  const nb = new Array(16).fill(0), moves = [], merged = new Set();
  let gain = 0;
  for (let line = 0; line < 4; line++) {
    const idx = [];
    for (let k = 0; k < 4; k++) {
      const [x, y] = d === 0 ? [k, line] : d === 2 ? [3 - k, line] : d === 1 ? [line, k] : [line, 3 - k];
      idx.push(y * 4 + x);
    }
    let w = 0, lastFree = false;
    for (let k = 0; k < 4; k++) {
      const v = b[idx[k]]; if (!v) continue;
      if (w > 0 && nb[idx[w - 1]] === v && !lastFree) { nb[idx[w - 1]] = v + 1; merged.add(idx[w - 1]); gain += 1 << (v + 1); moves.push([idx[k], idx[w - 1], v]); lastFree = true; }
      else { nb[idx[w]] = v; moves.push([idx[k], idx[w], v]); w++; lastFree = false; }
    }
  }
  const changed = nb.some((v, i) => v !== b[i]);
  return { b: nb, moves, merged, gain, changed };
}
function score(b) {
  let empty = 0, mono = 0, mx = 0;
  for (let i = 0; i < 16; i++) { if (!b[i]) empty++; mx = Math.max(mx, b[i]); }
  for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) { const a = b[y * 4 + x], c = b[y * 4 + x + 1]; mono -= Math.abs(a - c); if (a >= c) mono += 1; }
  for (let x = 0; x < 4; x++) for (let y = 0; y < 3; y++) { const a = b[y * 4 + x], c = b[(y + 1) * 4 + x]; mono -= Math.abs(a - c); if (a >= c) mono += 1; }
  const corner = b[0] === mx ? mx * 4 : 0;
  return empty * 12 + mono * 1.5 + corner;
}
function spawn(st) {
  const free = []; for (let i = 0; i < 16; i++) if (!st.b[i]) free.push(i);
  if (!free.length) return -1;
  const i = free[Math.floor(st.r() * free.length)]; st.b[i] = st.r() < 0.9 ? 1 : 2; return i;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const newGame = (st) => { st.b = new Array(16).fill(0); st.score = 0; st.moves = 0; spawn(st); spawn(st); st.phase = "think"; st.tm = 0; st.anim = null; st.born = -1; st.over = 0; };
  const sim = makeSim(20, 20 * 150, (round) => { const st = { r: rng(77 + round * 5), best: 0, games: 1 }; newGame(st); return st; }, (st) => {
    st.tm++;
    if (st.over) { if (++st.over > 60) { st.games++; newGame(st); } return; }
    if (st.phase === "think" && st.tm >= 3) {
      let best = null;
      for (let d = 0; d < 4; d++) {
        const r = slide(st.b, d); if (!r.changed) continue;
        let s = 0, n = 0;
        for (let i = 0; i < 16; i++) if (!r.b[i]) {
          r.b[i] = 1; let bb = -1e9;
          for (let d2 = 0; d2 < 4; d2++) { const r2 = slide(r.b, d2); if (r2.changed) bb = Math.max(bb, score(r2.b) + r2.gain * 0.05); }
          r.b[i] = 0; s += bb === -1e9 ? -500 : bb; n++;
        }
        s = (n ? s / n : score(r.b)) + r.gain * 0.05;
        if (d === 2 || d === 3) s -= 6; // prefer keeping big tiles in the top left
        if (!best || s > best.s) best = { s, d, r };
      }
      if (!best) { st.over = 1; return; }
      st.anim = { from: st.b.slice(), ...best.r, d: best.d }; st.lastDir = best.d;
      st.phase = "slide"; st.tm = 0;
    } else if (st.phase === "slide" && st.tm >= 4) {
      st.b = st.anim.b; st.score += st.anim.gain; st.best = Math.max(st.best, st.score); st.moves++;
      st.born = spawn(st); st.phase = "pop"; st.tm = 0;
    } else if (st.phase === "pop" && st.tm >= 3) { st.phase = "think"; st.tm = 0; }
  });
  const drawTile = (x, y, v, grow) => {
    const co = KEYS[Math.min(12, v)];
    const w = grow ? TW - 2 : TW, h = TH, xo = grow ? 1 : 0;
    g.text(x + xo, y, "▄".repeat(w), co);
    g.text(x + xo, y + 1, "█".repeat(w), co);
    g.text(x + xo, y + 2, "▀".repeat(w), co);
    if (v) {
      const s = String(1 << v);
      const sx = x + Math.floor((TW - s.length - 2) / 2);
      g.text(sx, y + 1, " " + s + " ", v <= 2 ? U(3) : U(4));
    }
  };
  return (t) => {
    const st = sim(t);
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y * 3) % 5 ? "░" : "▒", B((x >> 3) % 2 + (y > rows / 2 ? 1 : 0)));
    // board
    for (let y = OY - 1; y < OY + GY * 4; y++) for (let x = OX - 1; x < OX + GX * 4; x++) g.set(x, y, "█", U(1));
    for (let i = 0; i < 16; i++) { const x = OX + (i % 4) * GX, y = OY + Math.floor(i / 4) * GY; drawTile(x, y, 0); }
    const pos = (i) => [OX + (i % 4) * GX, OY + Math.floor(i / 4) * GY];
    if (st.phase === "slide" && st.anim) {
      const u = Math.min(1, st.tm / 4);
      for (const [f, to, v] of st.anim.moves) {
        const [x0, y0] = pos(f), [x1, y1] = pos(to);
        drawTile(Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * u), v);
      }
    } else {
      for (let i = 0; i < 16; i++) if (st.b[i]) {
        const [x, y] = pos(i);
        const grow = st.phase === "pop" && i === st.born && st.tm < 2;
        drawTile(x, y, st.b[i], grow);
        if (st.phase === "pop" && st.anim && st.anim.merged.has(i) && st.tm < 3) { g.set(x - 1, y + 1, "◄", U(7)); g.set(x + TW, y + 1, "►", U(7)); }
      }
    }
    // panel
    const px = OX + GX * 4 + 2;
    g.box(px, 1, cols - px - 1, rows - 2, "round", U(3));
    for (let y = 2; y < rows - 2; y++) g.text(px + 1, y, " ".repeat(cols - px - 3), U(0));
    g.text(px + 2, 2, "MERGE THE TILES", U(7));
    g.text(px + 2, 4, "SCORE", U(6)); g.text(px + 9, 4, String(st.score).padStart(7, " "), U(5));
    g.text(px + 2, 5, "BEST", U(6)); g.text(px + 9, 5, String(st.best).padStart(7, " "), U(5));
    g.text(px + 2, 6, "MOVES", U(6)); g.text(px + 9, 6, String(st.moves).padStart(7, " "), U(5));
    const mx = Math.max(...st.b);
    g.text(px + 2, 8, "LARGEST", U(6));
    g.text(px + 2, 9, "█".repeat(Math.min(15, mx)).padEnd(15, "░"), KEYS[Math.min(12, mx)]);
    g.text(px + 2, 10, String(1 << mx).padStart(15, " "), U(5));
    g.text(px + 2, 12, "NEXT MOVE", U(6));
    DIRS.forEach((a, i) => g.text(px + 3 + i * 4, 13, a, i === st.lastDir ? U(7) : U(3)));
    g.text(px + 2, 15, "GAME " + st.games, U(6));
    if (st.over) { g.box(OX + 8, OY + 6, 28, 3, "double", U(9)); g.text(OX + 9, OY + 7, "   NO MOVES LEFT  ".padEnd(26, " "), U(9)); }
    return g.frame();
  };
}
