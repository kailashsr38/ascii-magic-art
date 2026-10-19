/* group-chat-transcript: a three-person group chat planning a hike, with avatars, names, reactions, read receipts and a scrolling feed. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "group-chat-transcript",
  name: "Group Chat Transcript",
  category: "lettering",
  note: "A three-person group chat plans a weekend hike, bubbles stacking up with avatars, names, reactions and read receipts while the feed scrolls.",
  tags: ["chat", "messages", "group", "conversation", "ui", "text"],
  cols: 64, rows: 30, fps: 24,
  // 0 text, 1 muted, 2 frame, 3 ana, 4 bo, 5 you bubble, 6 heart, 7 dim, 8 cyan, 9 you text
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#ffa657", "#d2a8ff", "#388bfd", "#ff7b72", "#484f58", "#7ee7d0", "#cfe4ff"]),
};

// who: a = Ana, b = Bo, y = you
const MSGS = [
  ["a", "who is still up for the ridge trail on saturday?"],
  ["b", "me! as long as we are not starting at 5 am again"],
  ["y", "6:30 at the north car park. there is coffee at the top, I checked"],
  ["a", "coffee at the top is a lie but I respect it", "♥ 2"],
  ["b", "bringing the good sandwiches. someone else does snacks"],
  ["y", "on it. also the forecast says sun until 3"],
  ["a", "then we are back by 2 and nobody gets rained on", "✓ 3"],
  ["b", "famous last words", "♥ 1"],
];
const NAMES = { a: ["Ana", "3", "A"], b: ["Bo", "4", "B"], y: ["You", "5", "Y"] };

function wrap(s, w) {
  const out = []; let l = "";
  for (const wd of s.split(" ")) { if (l && (l + " " + wd).length > w) { out.push(l); l = wd; } else l = l ? l + " " + wd : wd; }
  if (l) out.push(l);
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const BW = 34;
  // each message: when it lands, how tall it is
  let tt = 0.6;
  const items = MSGS.map(([who, text, react], i) => {
    const lines = wrap(text, BW - 4);
    const typing = 0.9 + text.length * 0.025;
    const o = { who, lines, react, typeAt: tt, at: tt + typing, h: lines.length + 2 + (who === "y" ? 0 : 1) + (react ? 1 : 0) + 1, i };
    tt = o.at + 0.7;
    return o;
  });
  const total = tt + 3.5;
  const TOP = 4, BOT = rows - 4;
  const drawMsg = (m, y, lt) => {
    const [name, co, ini] = NAMES[m.who];
    const w = Math.max(...m.lines.map((l) => l.length)) + 4;
    const mine = m.who === "y";
    const x = mine ? cols - 3 - w : 7;
    let yy = y;
    if (!mine) {
      g.text(x + 1, yy, name, co);
      const tm = `9:${String(12 + m.i * 2).padStart(2, "0")}`;
      g.text(x + 2 + name.length, yy, tm, "7");
      yy++;
      // avatar
      g.text(2, yy, "(", "2"); g.text(3, yy, ini, co); g.text(4, yy, ")", "2");
    }
    g.box(x, yy, w, m.lines.length + 2, "round", mine ? "5" : "2");
    m.lines.forEach((l, k) => g.text(x + 2, yy + 1 + k, l, mine ? "9" : "0"));
    yy += m.lines.length + 2;
    if (m.react && lt > m.at + 0.8) g.text(mine ? x + w - 1 - m.react.length : x + 2, yy, m.react, m.react[0] === "♥" ? "6" : "8");
  };
  return (t) => {
    g.clear();
    const lt = ((t % total) + total) % total;
    // visible messages, newest at the bottom
    const shown = items.filter((m) => lt >= m.at);
    let y = BOT + 1;
    const typingNow = items.find((m) => lt >= m.typeAt && lt < m.at);
    if (typingNow) y -= 2;
    // smooth push: the newest message slides up into place over a moment
    const newest = shown[shown.length - 1];
    const slide = newest ? Math.max(0, 1 - (lt - newest.at) / 0.25) : 0;
    y += Math.round(slide * (newest ? newest.h : 0));
    for (let k = shown.length - 1; k >= 0; k--) {
      const m = shown[k];
      y -= m.h;
      if (y + m.h < TOP) break;
      drawMsg(m, y, lt);
    }
    // the day divider rides at the top of the transcript
    const dy = y - 2;
    if (dy >= TOP - 1) { const s = " Today "; g.hline(10, cols - 11, dy, "─", "7"); g.text(Math.floor((cols - s.length) / 2), dy, s, "1"); }
    // clip the feed: clear header rows and everything under the feed, then draw the chrome on top
    for (const yy of [0, 1, 2, 3, rows - 3, rows - 2, rows - 1]) for (let x = 0; x < cols; x++) g.set(x, yy, " ");
    for (let yy = 0; yy < rows; yy++) { g.set(0, yy, " "); g.set(cols - 1, yy, " "); }
    // header
    g.box(0, 0, cols, rows, "light", "2");
    g.text(2, 1, "# weekend-hike", "0");
    g.text(17, 1, "·  3 members", "1");
    g.text(cols - 10, 1, "● ● ●", "7");
    g.set(cols - 10, 1, "●", "3"); g.set(cols - 8, 1, "●", "4"); g.set(cols - 6, 1, "●", "5");
    g.hline(1, cols - 2, 2, "─", "2");
    if (typingNow) {
      const [name, co] = NAMES[typingNow.who];
      const dots = ["·  ", "·· ", "···"][Math.floor(lt * 4) % 3];
      if (typingNow.who === "y") g.text(cols - 21, BOT, "you are typing " + dots, "1");
      else { g.text(2, BOT, name, co); g.text(3 + name.length, BOT, "is typing " + dots, "1"); }
    }
    // read receipt under the last message
    if (newest && newest.who === "y" && lt > newest.at + 1.2) g.text(cols - 15, BOT, "✓✓ seen by 2", "8");
    // composer
    g.hline(1, cols - 2, rows - 3, "─", "2");
    for (let x = 1; x < cols - 1; x++) g.set(x, rows - 2, " ");
    const draft = typingNow && typingNow.who === "y" ? MSGS[typingNow.i][1].slice(0, Math.floor((lt - typingNow.typeAt) * 40)) : "";
    const shownDraft = draft.length > cols - 12 ? draft.slice(draft.length - (cols - 12)) : draft;
    g.text(2, rows - 2, ">", "5");
    g.text(4, rows - 2, shownDraft || "Message #weekend-hike", shownDraft ? "0" : "7");
    if (shownDraft) g.set(4 + shownDraft.length, rows - 2, "▌", "5");
    g.text(cols - 5, rows - 2, "→", shownDraft ? "5" : "7");
    return g.frame();
  };
}
