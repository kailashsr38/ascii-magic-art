/* sheet-music-playhead: a grand staff of sheet music scrolling under a fixed playhead that lights each note as it sounds. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const PAPER = add(gradient(["#0e1018", "#141724", "#1b1f30", "#23283c"], 4));
const INK = add(["#f4ecd8", "#6a7088", "#7a7a8e", "#ff5a4a", "#5aa8ff", "#c8b890", "#ffb03a"]);

export const meta = {
  slug: "sheet-music-playhead",
  name: "Sheet Music Playhead",
  category: "music",
  note: "A grand staff of sheet music scrolls past a fixed playhead, each note lighting up red as it sounds while the bars and bass line roll by.",
  tags: ["sheet music", "notation", "score", "piano", "readme", "hero"],
  cols: 100, rows: 30, fps: 30,
  palette: palette(P),
};

const TOP = 5, BOT = 18; // treble top line row, bass top line row
const PH = 36, CPB = 6, X0 = 16, BPM = 88;
const LET = "CDEFGAB";
const dia = (n) => parseInt(n.slice(1), 10) * 7 + LET.indexOf(n[0]);
const yOf = (n, bass) => (bass ? BOT + 8 - (dia(n) - dia("G2")) : TOP + 8 - (dia(n) - dia("E4")));

const MEL = [
  ["E5", 1], ["D5", 0.5], ["C5", 0.5], ["B4", 1], ["C5", 1],
  ["A4", 2], ["E4", 1], ["A4", 1],
  ["B4", 0.5], ["C5", 0.5], ["D5", 1], ["E5", 1], ["G5", 1],
  ["F5", 2], ["E5", 2],
  ["D5", 1], ["F5", 0.5], ["E5", 0.5], ["D5", 1], ["C5", 1],
  ["B4", 1], ["G4", 1], ["C5", 2],
  ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 0.5], ["E5", 1], ["C5", 1],
  ["A4", 4],
];
const BAS = [["A2", 2], ["E3", 2], ["F2", 2], ["C3", 2], ["G2", 2], ["D3", 2], ["C3", 2], ["E3", 2],
  ["D3", 2], ["A2", 2], ["E2", 2], ["G2", 2], ["F2", 2], ["G2", 2], ["A2", 4]];
const LOOP = 32;

const TREBLE = [" ▄▄ ", " █ █", "  █▀", " ▄█ ", "█ █▄", "█ █ █", "▀▀█▀", "  █ ", " ▀▀ "];
const BASSC = ["▄▀▀▄ ", "   █•", "  ▄▀•", "▄▀   "];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const paper = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.6 + (fbm(x * 0.08, y * 0.2, 3, 2) - 0.5) * 0.6 - (x < 2 || x > cols - 3 ? 0.4 : 0));
    paper.push(KEYS[PAPER + Math.min(3, Math.floor(v * 4))]);
  }
  const ev = (list, bass) => { let b = 0; return list.map(([n, d]) => { const e = { n, d, b, bass }; b += d; return e; }); };
  const NOTES = [...ev(MEL, false), ...ev(BAS, true)];
  return (t) => {
    for (let i = 0; i < paper.length; i++) { g.ch[i] = "░"; g.co[i] = paper[i]; }
    const now = (t * BPM) / 60;
    // staff lines
    for (const top of [TOP, BOT]) for (let l = 0; l < 5; l++) g.hline(X0 - 14, cols - 3, top + l * 2, "─", KEYS[INK + 1]);
    // bar lines
    for (let k = -1; k < 6; k++) {
      const bb = Math.floor(now / 4) * 4 + k * 4;
      const x = Math.round(PH + (bb - now) * CPB) - 2;
      if (x < X0 || x > cols - 3) continue;
      g.vline(x, TOP, BOT + 8, "│", KEYS[INK + 1]);
      const barNo = ((Math.floor(bb / 4) % (LOOP / 4)) + LOOP / 4) % (LOOP / 4) + 1;
      g.text(x + 1, TOP - 2, String(barNo), KEYS[INK + 2]);
    }
    // notes
    for (const e of NOTES) for (let k = -1; k <= 2; k++) {
      const b = e.b + (Math.floor(now / LOOP) + k) * LOOP;
      const x = Math.round(PH + (b - now) * CPB);
      if (x < X0 || x > cols - 4) continue;
      const y = yOf(e.n, e.bass);
      const on = now >= b && now < b + e.d;
      const past = now >= b + e.d;
      const co = on ? KEYS[INK + 3] : past ? KEYS[INK + 2] : KEYS[INK];
      const top = e.bass ? BOT : TOP;
      // ledger lines
      for (let ly = top - 2; ly >= y; ly -= 2) g.text(x - 1, ly, "───", co);
      for (let ly = top + 10; ly <= y; ly += 2) g.text(x - 1, ly, "───", co);
      const open = e.d >= 2;
      g.set(x, y, open ? "○" : "●", co);
      if (e.d < 4) {
        const up = y > top + 4;
        if (up) for (let s = 1; s <= 4; s++) g.set(x + 1, y - s, "│", co);
        else for (let s = 1; s <= 4; s++) g.set(x - 1, y + s, "│", co);
        if (e.d === 0.5) { if (up) g.set(x + 2, y - 4, "╲", co); else g.set(x, y + 4, "╱", co); }
      }
      if (on) { g.set(x - 1, y, "(", KEYS[INK + 6]); if (g.get(x + 1, y) === "░" || g.get(x + 1, y) === "─") g.set(x + 1, y, ")", KEYS[INK + 6]); }
    }
    // fixed clef panel covers the scrolled notes on the left
    for (let y = 0; y < rows; y++) for (let x = 0; x < X0; x++) { g.set(x, y, "░", paper[x + y * cols]); }
    for (const top of [TOP, BOT]) for (let l = 0; l < 5; l++) g.hline(2, X0 - 1, top + l * 2, "─", KEYS[INK + 1]);
    g.vline(2, TOP, BOT + 8, "│", KEYS[INK]);
    g.set(1, TOP, "╭", KEYS[INK]); g.vline(1, TOP + 1, BOT + 7, "│", KEYS[INK]); g.set(1, BOT + 8, "╰", KEYS[INK]);
    TREBLE.forEach((r, i) => g.text(4, TOP - 1 + i, r.slice(0, 5), KEYS[INK]));
    BASSC.forEach((r, i) => g.text(4, BOT + i, r, KEYS[INK]));
    for (const top of [TOP, BOT]) { g.text(11, top + 2, "4", KEYS[INK]); g.text(11, top + 6, "4", KEYS[INK]); }
    // playhead
    for (let y = TOP - 1; y <= BOT + 9; y++) {
      const c = g.get(PH, y);
      if (c === "░" || c === "─") g.set(PH, y, "┃", KEYS[INK + 4]);
    }
    g.set(PH, TOP - 2, "▼", KEYS[INK + 4]);
    // header and footer
    g.text(X0 + 4, 1, "Study No. 3 in A minor", KEYS[INK]);
    g.text(cols - 22, 1, `Andante  ${BPM} bpm`, KEYS[INK + 1]);
    const lb = ((now % LOOP) + LOOP) % LOOP;
    g.text(X0 + 4, rows - 1, `bar ${String(Math.floor(lb / 4) + 1).padStart(2)} of 8   beat ${Math.floor(lb % 4) + 1}`, KEYS[INK + 1]);
    return g.frame();
  };
}
