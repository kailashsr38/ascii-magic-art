/* calculator-app: a calculator with keys pressing in turn while a running sum builds on the display. */
import { Grid, palette, bigText } from "../lib/kit.js";

export const meta = {
  slug: "calculator-app",
  name: "Calculator Keypad",
  category: "screens",
  note: "A calculator where keys light up as they are pressed, the display builds an expression and the result rolls in on equals.",
  tags: ["calculator", "keypad", "math", "app", "widget"],
  cols: 48, rows: 31, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const KEYS = [["AC", "±", "%", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "-"], ["1", "2", "3", "+"], ["0", ".", "DEL", "="]];
const SEQS = [
  ["1", "2", "4", "8", "+", "3", "7", "6", "×", "2", "="],
  ["AC", "9", "6", "0", "÷", "1", "2", "-", "4", ".", "5", "="],
  ["AC", "2", "5", "%", "×", "8", "0", "0", "="],
];
const KT = 0.42;

function evalSeq(keys) {
  // left to right evaluation with immediate execution like a pocket calculator
  let acc = null, op = null, cur = "", hist = "";
  const apply = (a, o, b) => o === "+" ? a + b : o === "-" ? a - b : o === "×" ? a * b : o === "÷" ? a / b : b;
  for (const k of keys) {
    if (k === "AC") { acc = null; op = null; cur = ""; hist = ""; continue; }
    if (/[0-9.]/.test(k)) { cur += k; hist += k; continue; }
    if (k === "%") { cur = String(parseFloat(cur) / 100); hist += "%"; continue; }
    const v = parseFloat(cur || "0");
    acc = acc === null ? v : apply(acc, op, v);
    if (k === "=") { cur = String(Math.round(acc * 1e6) / 1e6); acc = null; op = null; return { shown: cur, hist, done: true }; }
    op = k; cur = ""; hist += " " + k + " ";
  }
  return { shown: cur || (acc !== null ? String(acc) : "0"), hist, done: false };
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const segLen = SEQS.map((s) => s.length * KT + 2.2);
  const PERIOD = segLen.reduce((a, b) => a + b, 0);
  const pos = {};
  KEYS.forEach((r, ry) => r.forEach((k, rx) => (pos[k] = [rx, ry])));
  return (t) => {
    g.clear();
    let lt = t % PERIOD, si = 0;
    while (lt >= segLen[si]) { lt -= segLen[si]; si++; }
    const seq = SEQS[si];
    const n = Math.min(seq.length, Math.floor(lt / KT) + 1);
    const pressed = lt - (n - 1) * KT < 0.18 ? seq[n - 1] : null;
    const st = evalSeq(seq.slice(0, n));
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Calculator ", "0");
    // display
    g.box(2, 1, W - 4, 8, "round", "8");
    const hist = st.hist.length > W - 8 ? st.hist.slice(-(W - 8)) : st.hist;
    g.text(W - 4 - hist.length, 2, hist, "1");
    const shown = st.shown.slice(0, 10);
    const roll = st.done && lt - (n - 1) * KT < 0.3;
    const bw = shown.length * 4 - 1;
    bigText(g, W - 4 - bw, 3, shown, st.done ? (roll ? "9" : "2") : "0");
    // keys
    KEYS.forEach((row, ry) => row.forEach((k, rx) => {
      const x = 2 + rx * 11, y = 10 + ry * 4;
      const isOp = rx === 3, isFn = ry === 0 && rx < 3;
      const down = pressed === k;
      const col = down ? "0" : isOp ? "4" : isFn ? "1" : "7";
      g.box(x, y, 10, 4, down ? "heavy" : "round", col);
      if (down) g.fill(x + 1, y + 1, 8, 2, "░", isOp ? "4" : "3");
      const label = k;
      g.text(x + 5 - Math.ceil(label.length / 2), y + 1 + (down ? 1 : 0), label, down ? "0" : isOp ? "4" : isFn ? "6" : "0");
    }));
    return g.frame();
  };
}
