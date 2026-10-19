/* quote-of-the-day: a card that rotates original quotes, sliding the old one up and out as the next arrives. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "quote-of-the-day",
  name: "Quote Of The Day",
  category: "lettering",
  note: "A card rotates through original quotes, each sliding up and out as the next one rises into place, with page dots and a timer bar.",
  tags: ["quote", "inspiration", "widget", "readme", "card", "text"],
  cols: 68, rows: 17, fps: 24,
  // 0 quote, 1 muted, 2 frame, 3 accent marks, 4 source, 5 timer, 6 dim
  palette: palette(["#f0f3f6", "#8b949e", "#30363d", "#d2a8ff", "#ffa657", "#7ee787", "#484f58"]),
};

const QUOTES = [
  ["The shortest way through a hard week is one small finished thing at a time.", "from a sticky note on a fridge"],
  ["Leave the campsite, the codebase and the conversation a little better than you found them.", "a trail guide's habit"],
  ["Most doors you are waiting at are not locked. They are just heavy.", "overheard at a bus stop"],
  ["Rest is not the opposite of work. It is the part where the work sinks in.", "written on a cafe chalkboard"],
  ["Nobody remembers the draft. Everybody remembers that you shipped.", "margin note, page 41"],
];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const PER = 6.5, SLIDE = 0.7;

function wrap(s, w) {
  const out = []; let l = "";
  for (const wd of s.split(" ")) { if (l && (l + " " + wd).length > w) { out.push(l); l = wd; } else l = l ? l + " " + wd : wd; }
  if (l) out.push(l);
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = 46, IX = 13;
  const blocks = QUOTES.map(([q, src]) => ({ lines: wrap(q, W), src: "· " + src }));
  const TOP = 4, BOT = rows - 5;               // content window
  const drawQuote = (b, dy) => {
    const h = b.lines.length + 2;
    const y0 = Math.floor((TOP + BOT - h) / 2) + 1 + dy;
    b.lines.forEach((l, i) => { const y = y0 + i; if (y >= TOP && y <= BOT) g.text(IX, y, l, "0"); });
    const sy = y0 + b.lines.length + 1;
    if (sy >= TOP && sy <= BOT) g.text(IX, sy, b.src, "4");
    // opening mark beside the first line
    if (y0 >= TOP && y0 + 1 <= BOT) { g.text(5, y0, "▄▖▄▖", "3"); g.text(5, y0 + 1, "▐▘▐▘", "3"); }
  };
  return (t) => {
    g.clear();
    const cyc = PER * QUOTES.length;
    const lt = ((t % cyc) + cyc) % cyc;
    const qi = Math.floor(lt / PER), st = lt - qi * PER;
    g.box(0, 0, cols, rows, "round", "2");
    g.text(3, 1, "QUOTE OF THE DAY", "3");
    const day = `${DAYS[qi]}  ·  no. ${String(212 + qi)}`;
    g.text(cols - 3 - day.length, 1, day, "1");
    g.hline(1, cols - 2, 2, "─", "2");
    // slide: previous quote moves up and out while this one rises in
    const span = BOT - TOP + 2;
    if (st < SLIDE) {
      const e = st / SLIDE, k = e * e * (3 - 2 * e);
      drawQuote(blocks[(qi + QUOTES.length - 1) % QUOTES.length], -Math.round(k * span));
      drawQuote(blocks[qi], Math.round((1 - k) * span));
    } else drawQuote(blocks[qi], 0);
    g.hline(1, cols - 2, rows - 4, "─", "2");
    // page dots and the timer to the next quote
    const dots = QUOTES.map((_, i) => (i === qi ? "●" : "○")).join(" ");
    g.text(3, rows - 2, dots, "3");
    const bw = 24, k = Math.round((st / PER) * bw);
    const bx = cols - 3 - bw;
    g.text(bx - 6, rows - 2, "next", "1");
    g.text(bx, rows - 2, "━".repeat(k), "5");
    g.text(bx + k, rows - 2, "─".repeat(bw - k), "6");
    return g.frame();
  };
}
