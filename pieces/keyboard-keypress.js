/* keyboard-keypress: a full keyboard layout with keys depressing in time as a sentence is typed above it. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "keyboard-keypress",
  name: "Keyboard Keypress",
  category: "screens",
  note: "A keyboard where each key sinks and lights as a sentence is typed into the text field above it, shift and space included.",
  tags: ["keyboard", "typing", "keys", "input", "hero", "app"],
  cols: 98, rows: 25, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const ROWS = [
  [["`", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["Bksp", 2]],
  [["Tab", 1.5], ["Q", 1], ["W", 1], ["E", 1], ["R", 1], ["T", 1], ["Y", 1], ["U", 1], ["I", 1], ["O", 1], ["P", 1], ["[", 1], ["]", 1], ["\\", 1.5]],
  [["Caps", 1.75], ["A", 1], ["S", 1], ["D", 1], ["F", 1], ["G", 1], ["H", 1], ["J", 1], ["K", 1], ["L", 1], [";", 1], ["'", 1], ["Enter", 2.25]],
  [["Shift", 2.25], ["Z", 1], ["X", 1], ["C", 1], ["V", 1], ["B", 1], ["N", 1], ["M", 1], [",", 1], [".", 1], ["/", 1], ["Shift", 2.75]],
  [["Ctrl", 1.5], ["Alt", 1.25], ["", 7.75], ["Alt", 1.25], ["Fn", 1.25], ["Ctrl", 1.5]],
];
const LINES = ["Ship it on Friday, 4pm.", "Quick brown foxes jump at 9."];
const KT = 0.17;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const U = 6; // cells per key unit
  const keys = []; // {label, x, y, w}
  ROWS.forEach((r, ry) => {
    let x = 3;
    r.forEach(([l, w]) => { const cw = Math.round(w * U); keys.push({ l, x, y: 8 + ry * 3, w: cw - 1 }); x += cw; });
  });
  const find = (c) => {
    if (c === " ") return keys.find((k) => k.l === "");
    if (c === "\n") return keys.find((k) => k.l === "Enter");
    return keys.find((k) => k.l === c.toUpperCase());
  };
  const lShift = keys.find((k) => k.l === "Shift");
  const seqs = LINES.map((s) => s + "\n");
  const segLen = seqs.map((s) => s.length * KT + 1.6);
  const PERIOD = segLen[0] + segLen[1];
  return (t) => {
    g.clear();
    let lt = t % PERIOD, si = 0;
    if (lt >= segLen[0]) { lt -= segLen[0]; si = 1; }
    const s = seqs[si];
    const n = Math.min(s.length, Math.floor(lt / KT));
    const curCh = n < s.length && lt - n * KT < 0.12 ? s[n] : null;
    const down = new Set();
    if (curCh) {
      const k = find(curCh); if (k) down.add(k);
      if (/[A-Z,]/.test(curCh) && curCh !== ",") down.add(lShift);
    }
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Keyboard ", "0");
    g.text(W - 18, 0, " WPM " + (62 + si * 7) + " · 98% ", "1");
    g.box(3, 2, W - 6, 4, "round", "3");
    const typed = s.slice(0, n).replace("\n", "");
    const prev = si === 1 ? LINES[0] : "";
    if (prev) g.text(5, 3, prev, "1");
    g.text(5, prev ? 4 : 3, typed, "0");
    if (Math.floor(t * 3) % 2 === 0 && n < s.length) g.set(5 + typed.length, prev ? 4 : 3, "▏", "3");
    for (const k of keys) {
      const on = down.has(k);
      const y = k.y + (on ? 0 : 0);
      g.box(k.x, y, k.w, 3, on ? "heavy" : "round", on ? "3" : "8");
      if (on) g.fill(k.x + 1, y + 1, k.w - 2, 1, "▒", "8");
      const lab = k.l;
      const lx = k.l.length > 1 ? k.x + 1 : k.x + Math.floor((k.w - lab.length) / 2);
      g.text(lx, y + 1, lab, on ? "0" : k.l.length > 1 ? "7" : "1");
    }
    // home row nubs
    ["F", "J"].forEach((c) => { const k = keys.find((q) => q.l === c); g.set(k.x + 2, k.y + 2, "─", "1"); });
    return g.frame();
  };
}
