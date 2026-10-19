/* chess-replay: a short classic attacking game replayed move by move, ending in mate. */
import { Grid, palette, KEYS } from "../lib/kit.js";

const UI = ["#e8cfa2", "#a8764a", "#ffffff", "#000000", "#e6edf3", "#8b949e", "#f2c94c", "#7fb069", "#0f1115", "#2d333b", "#ff7b72", "#e0c060", "#a07a2a"];

export const meta = {
  slug: "chess-replay",
  name: "Chess Replay",
  category: "arcade",
  note: "A short classic attacking game replayed move by move on a wooden board, ending in a queen sacrifice and mate.",
  tags: ["chess", "board game", "game", "replay", "strategy"],
  cols: 86, rows: 28, fps: 12,
  palette: palette(UI),
};

// 3x3 piece sprites
const SPR = {
  k: [" ┼ ", "▐█▌", "▀▀▀"],
  q: ["╲▲╱", "▐█▌", "▀▀▀"],
  r: ["▙▄▟", "▐█▌", "▀▀▀"],
  b: [" ◆ ", " █ ", "▀▀▀"],
  n: [" ▟▙", "▐█▘", "▀▀▀"],
  p: ["   ", " ● ", " ▀ "],
};
// moves as from-to squares, castling as two moves played together
const GAME = [
  ["e2e4", "e4"], ["e7e5", "e5"], ["g1f3", "Nf3"], ["d7d6", "d6"], ["d2d4", "d4"], ["c8g4", "Bg4"],
  ["d4e5", "dxe5"], ["g4f3", "Bxf3"], ["d1f3", "Qxf3"], ["d6e5", "dxe5"], ["f1c4", "Bc4"], ["g8f6", "Nf6"],
  ["f3b3", "Qb3"], ["d8e7", "Qe7"], ["b1c3", "Nc3"], ["c7c6", "c6"], ["c1g5", "Bg5"], ["b7b5", "b5"],
  ["c3b5", "Nxb5"], ["c6b5", "cxb5"], ["c4b5", "Bxb5+"], ["b8d7", "Nbd7"], ["e1c1 a1d1", "O-O-O"], ["a8d8", "Rd8"],
  ["d1d7", "Rxd7"], ["d8d7", "Rxd7"], ["h1d1", "Rd1"], ["e7e6", "Qe6"], ["b5d7", "Bxd7+"], ["f6d7", "Nxd7"],
  ["b3b8", "Qb8+"], ["d7b8", "Nxb8"], ["d1d8", "Rd8#"],
];
const START = ["rnbqkbnr", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "RNBQKBNR"];
const sq = (s) => [s.charCodeAt(0) - 97, 8 - Number(s[1])];
const MOVE_T = 1.3, SLIDE = 0.45, HOLD = 5;

function boardAfter(n) {
  const b = START.map((r) => r.split(""));
  for (let i = 0; i < n; i++) for (const m of GAME[i][0].split(" ")) {
    const [fx, fy] = sq(m.slice(0, 2)), [tx, ty] = sq(m.slice(2, 4));
    b[ty][tx] = b[fy][fx]; b[fy][fx] = ".";
  }
  return b;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SW = 7, SH = 3, ox = 3, oy = 1;
  const boards = Array.from({ length: GAME.length + 1 }, (_, i) => boardAfter(i));
  const total = GAME.length * MOVE_T + HOLD;
  const drawPiece = (px, py, p) => {
    const white = p === p.toUpperCase();
    const s = SPR[p.toLowerCase()];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (s[r][c] !== " ") g.set(px + 2 + c, py + r, s[r][c], white ? "2" : "3");
  };
  return (t) => {
    g.clear();
    const lt = t % total;
    const idx = Math.min(GAME.length, Math.floor(lt / MOVE_T));
    const into = lt - idx * MOVE_T;
    const sliding = idx < GAME.length && into < SLIDE;
    // during a slide, show the board before the move with the moving pieces in flight
    const shown = sliding ? boards[idx] : boards[Math.min(GAME.length, idx + 1)];
    const lastIdx = sliding ? idx : Math.min(GAME.length, idx + 1) - 1;
    const last = lastIdx >= 0 ? GAME[lastIdx][0].split(" ")[0] : null;
        g.box(ox - 2, oy - 1, SW * 8 + 4, SH * 8 + 2, "heavy", "c");
    const hl = new Set();
    if (last) { hl.add(last.slice(0, 2)); hl.add(last.slice(2, 4)); }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const light = (x + y) % 2 === 0;
      const name = String.fromCharCode(97 + x) + (8 - y);
      const on = hl.has(name);
      g.fill(ox + x * SW, oy + y * SH, SW, SH, on ? "▒" : "▓", on ? (light ? "6" : "b") : light ? "0" : "1");
      const p = shown[y][x];
      if (p !== ".") {
        let skip = false;
        if (sliding) for (const m of GAME[idx][0].split(" ")) if (m.slice(0, 2) === name) skip = true;
        if (!skip) drawPiece(ox + x * SW, oy + y * SH, p);
      }
    }
    if (sliding) {
      const f = into / SLIDE, e = f * f * (3 - 2 * f);
      for (const m of GAME[idx][0].split(" ")) {
        const [fx, fy] = sq(m.slice(0, 2)), [tx, ty] = sq(m.slice(2, 4));
        const p = boards[idx][fy][fx];
        drawPiece(Math.round(ox + (fx + (tx - fx) * e) * SW), Math.round(oy + (fy + (ty - fy) * e) * SH), p);
      }
    }
    for (let i = 0; i < 8; i++) {
      g.set(ox - 3 + 0, oy + i * SH + 1, String(8 - i), "5");
      g.set(ox + i * SW + 3, oy + SH * 8 + 1, String.fromCharCode(97 + i), "5");
    }
    // move list
    const lx = ox + SW * 8 + 4;
    g.text(lx, 1, "WHITE vs BLACK", "4");
    g.text(lx, 2, "Opera, 1858", "5");
    g.hline(lx, cols - 2, 3, "─", "9");
    const played = sliding ? idx + 1 : Math.min(GAME.length, idx + 1);
    const fullMoves = Math.ceil(GAME.length / 2);
    const curMove = Math.floor((played - 1) / 2);
    const first = Math.max(0, Math.min(fullMoves - 18, curMove - 12));
    for (let m = first; m < Math.min(fullMoves, first + 18); m++) {
      const y = 4 + (m - first);
      g.text(lx, y, String(m + 1).padStart(2) + ".", "5");
      for (let s = 0; s < 2; s++) {
        const k = m * 2 + s;
        if (k >= GAME.length || k >= played) continue;
        g.text(lx + 4 + s * 8, y, GAME[k][1], k === played - 1 ? "6" : "4");
      }
    }
    if (idx >= GAME.length) {
      const msg = " CHECKMATE ";
      g.box(lx - 1, rows - 5, 16, 3, "double", "a");
      g.text(lx + 1, rows - 4, msg, "a");
    } else g.text(lx, rows - 4, (played % 2 ? "Black" : "White") + " to move", "5");
    return g.frame();
  };
}
