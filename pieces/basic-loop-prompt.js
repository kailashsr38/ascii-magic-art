/* basic-loop-prompt: a 1980s home computer BASIC screen where a short loop is typed, listed and run. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "basic-loop-prompt",
  name: "Home Computer BASIC",
  category: "retro",
  note: "An 8-bit home computer screen inside its thick border, where a short BASIC loop is typed at the READY prompt and run as a scrolling sine wave of stars.",
  tags: ["retro", "basic", "8-bit", "programming", "terminal", "hero"],
  cols: 72, rows: 28, fps: 20,
  palette: palette(["#a5a5ff", "#4242e7", "#3232b8", "#6c6cff", "#ffffff", "#ffee88", "#7ee7ff", "#ff9ad5", "#2e2aa6"]),
};

const PROG = [
  "10 REM STAR WAVE",
  "20 FOR I=0 TO 999",
  "30 X=INT(22+19*SIN(I/4))",
  "40 PRINT TAB(X);\"*  *\"",
  "50 NEXT I",
];
const PERIOD = 24;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const BX = 6, BY = 3, IW = W - 12, IH = H - 6;
  const RATE = 0.075;
  // timeline of typed lines
  const events = [];
  let tt = 1.2;
  const typed = (s) => { events.push({ s, t0: tt, t1: tt + s.length * RATE }); tt += s.length * RATE + 0.35; };
  PROG.forEach(typed);
  typed("LIST");
  const LIST_T = tt;
  tt += 0.9;
  typed("RUN");
  const RUN_T = tt;
  const BREAK_T = 19.5;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // border: chunky blocks with soft banding
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const inner = x >= BX && x < BX + IW && y >= BY && y < BY + IH;
      if (inner) { g.set(x, y, "█", "8"); continue; }
      const edge = x === BX - 1 || x === BX + IW || y === BY - 1 || y === BY + IH;
      g.set(x, y, edge ? "▓" : "█", edge ? "3" : (x + y) % 9 === 0 ? "3" : "0");
    }
    // build screen lines
    const lines = [];
    lines.push(["    **** HOME BASIC V2 ****", "6"]);
    lines.push([" 64K RAM SYSTEM  38911 BASIC BYTES FREE", "0"]);
    lines.push(["", "0"]);
    lines.push(["READY.", "4"]);
    let cursorLine = -1, cursorCol = 0;
    for (const e of events) {
      if (lt < e.t0) break;
      const n = Math.min(e.s.length, Math.floor((lt - e.t0) / RATE));
      lines.push([e.s.slice(0, n), "4"]);
      cursorLine = lines.length - 1; cursorCol = n;
      if (lt < e.t1 + 0.2) break;
      cursorLine = -1;
      if (e.s === "LIST") {
        PROG.forEach((p) => lines.push([p, "0"]));
        lines.push(["READY.", "4"]);
      }
    }
    let running = false;
    if (lt >= RUN_T + 0.3) {
      running = lt < BREAK_T;
      const n = Math.floor((Math.min(lt, BREAK_T) - RUN_T - 0.3) * 14);
      for (let i = 0; i <= n; i++) {
        const x = Math.floor(22 + 19 * Math.sin(i / 4));
        lines.push([" ".repeat(x) + "*  *", i % 3 === 0 ? "5" : i % 3 === 1 ? "7" : "6"]);
      }
      if (lt >= BREAK_T) {
        lines.push(["", "0"]);
        lines.push(["BREAK IN 40", "4"]);
        lines.push(["READY.", "4"]);
      }
    }
    if (cursorLine < 0 && !running) { lines.push(["", "4"]); cursorLine = lines.length - 1; cursorCol = 0; }
    const start = Math.max(0, lines.length - IH);
    for (let i = start; i < lines.length; i++) {
      const [s, c] = lines[i];
      g.block(BX + 1, BY + i - start, s.slice(0, IW - 2), c);
    }
    if (cursorLine >= start && Math.floor(lt * 2.5) % 2 === 0) g.set(BX + 1 + Math.min(cursorCol, IW - 3), BY + cursorLine - start, "█", "0");
    // status in the bottom border, like a cartridge label
    g.text(BX, H - 2, running ? " RUNNING " : " READY ", running ? "5" : "2");
    return g.frame();
  };
}
