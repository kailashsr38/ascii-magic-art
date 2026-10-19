/* green-word-processor: a green screen word processor where a letter is typed with word wrap, corrections, a marked block and a save. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "green-word-processor",
  name: "Green Screen Word Processor",
  category: "retro",
  note: "A green phosphor word processor where a letter is typed and wraps at the margin, typos are backspaced, a paragraph is marked as a block and the file is saved.",
  tags: ["retro", "word processor", "typing", "green screen", "terminal", "writing"],
  cols: 80, rows: 25, fps: 24,
  palette: palette(["#7dff7a", "#3fd44a", "#1f8a2c", "#10461a", "#c8ffc4", "#0a2a10"]),
};

const PRE = "Dear Margaret,\n\nThank you for the lovely visit last weekend. The garden looked wonderful, and I am still thinking about those tomatoes.\n\n";
const TYPE = "I have finally bought a home computer. It sits on the desk by the windo{e}w and hums quietly while I type this letter. The word processor lets me fix mistakes before anything reaches paper, which feels like a small mira{lc}cle.\n\nNext month I will print the club newsletter on it. Wish me luck with the prin{y}ter.\n\nWarm regards,\nHelen";
const WRAP = 62, LM = 9;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // keystrokes: characters and backspaces
  const keys = [];
  for (let i = 0; i < TYPE.length; i++) {
    if (TYPE[i] === "{") { const j = TYPE.indexOf("}", i); const bad = TYPE.slice(i + 1, j); for (const c of bad) keys.push(c); for (const _ of bad) keys.push("\b"); i = j; }
    else keys.push(TYPE[i]);
  }
  const times = [];
  let tt = 0.8;
  for (const k of keys) { times.push(tt); tt += k === "\b" ? 0.16 : ".,".includes(k) ? 0.22 : k === "\n" ? 0.3 : 0.05; }
  const TYPED_END = tt;
  const MARK = TYPED_END + 0.8, SAVE = MARK + 2.6, PERIOD = SAVE + 2.8;
  const wrap = (s) => {
    const out = [];
    for (const para of s.split("\n")) {
      let line = "", start = true;
      for (const w of para.split(" ")) {
        if (!start && line.length + 1 + w.length > WRAP) { out.push(line); line = w; }
        else { line = start ? w : line + " " + w; }
        start = false;
      }
      out.push(line);
    }
    return out;
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    let n = 0;
    while (n < keys.length && times[n] <= lt) n++;
    let body = "";
    for (let i = 0; i < n; i++) body = keys[i] === "\b" ? body.slice(0, -1) : body + keys[i];
    const doc = PRE + body;
    const lines = wrap(doc);
    const curLine = lines.length - 1, curCol = lines[curLine].length;
    // which wrapped lines belong to the marked paragraph (the one about the computer)
    const marked = lt >= MARK;
    const VIEW = 20, top = Math.max(0, lines.length - VIEW);
    let para = 0;
    lines.forEach((l, i) => {
      if (i > 0 && lines[i - 1] === "" && l !== "") para++;
      if (i < top) return;
      const y = 2 + i - top;
      const inBlock = marked && para === 2 && l !== "";
      g.text(LM, y, l, inBlock ? "4" : "1");
      if (inBlock) for (let x = LM + l.length; x < LM + WRAP; x++) g.set(x, y, "░", "3");
      g.set(LM - 2, y, l === "" ? " " : "·", "3");
    });
    if (marked) {
      const first = lines.findIndex((l) => l.startsWith("I have finally"));
      const last = lines.findIndex((l) => l.includes("small miracle."));
      if (first >= top) g.text(LM - 4, 2 + first - top, "<B>", "0");
      if (last >= top) g.text(LM + lines[last].length + 1, 2 + last - top, "<K>", "0");
    }
    // cursor
    const typing = lt < TYPED_END + 0.4;
    if (Math.floor(lt * 3) % 2 === 0 || (typing && lt - times[Math.max(0, n - 1)] < 0.3)) g.set(LM + curCol, 2 + curLine - top, "█", "0");
    // status line, ruler
    g.fill(0, 0, W, 1, "▀", "3");
    const status = ` LETTER.TXT   PAGE 1   LINE ${String(curLine + 1).padStart(2)}   COL ${String(curCol + 1).padStart(2)}`;
    g.text(0, 0, status, "0");
    g.text(W - 10, 0, " INSERT ", "0");
    let ruler = "L";
    for (let i = 1; i < WRAP; i++) ruler += i % 8 === 0 ? "!" : "-";
    g.text(LM - 1, 1, ruler + "R", "2");
    // menu and message line
    g.text(0, H - 2, "^K Block  ^Y Delete  ^B Reform  ^P Print  ^S Save  ^Q Quit", "2");
    let msg = "", mc = "1";
    if (lt < 0.8) msg = "Editing LETTER.TXT, 1 page";
    else if (marked && lt < SAVE) msg = "Block marked: 4 lines, 268 characters";
    else if (lt >= SAVE) { const k = Math.min(1, (lt - SAVE) / 1.6); msg = k < 1 ? "Saving LETTER.TXT " + "▪".repeat(Math.floor(k * 12)) : "Saved LETTER.TXT  2,086 bytes"; mc = k < 1 ? "1" : "0"; }
    g.text(0, H - 1, msg, mc);
    // screen bezel tint: faint edges
    for (let y = 0; y < H; y++) { if (g.get(0, y) === " ") g.set(0, y, "▏", "5"); }
    return g.frame();
  };
}
