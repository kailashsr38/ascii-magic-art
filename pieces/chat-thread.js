/* chat-thread: a chat conversation with bubbles, a typing indicator and a composer. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "chat-thread",
  name: "Chat Thread",
  category: "screens",
  note: "A chat conversation where bubbles appear after a typing indicator and replies are typed in the composer.",
  tags: ["chat", "messages", "app", "conversation", "support"],
  cols: 60, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#1f6feb", "#a5d6ff"]),
};

const MSGS = [
  [0, "hey, are you around? the deploy is stuck on migrations"],
  [1, "yep, looking now"],
  [1, "a lock on the users table, the nightly analytics job is still running"],
  [0, "ah, that again. can you stop it?"],
  [1, "done. migrations are moving"],
  [0, "nice, staging is green ✓"],
  [0, "shipping to prod in 5"],
  [1, "sounds good, I'll watch the dashboards"],
];
const BW = 30;
function wrap(s, w) {
  const out = []; let line = "";
  for (const word of s.split(" ")) {
    if ((line + " " + word).trim().length > w) { out.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) out.push(line);
  return out;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const ev = []; let tt = -4.2;
  for (const [who, text] of MSGS) {
    const lines = wrap(text, BW - 4);
    if (who === 0) { ev.push({ who, lines, text, type0: tt, at: tt + 1.3 }); tt += 1.3 + 0.9; }
    else { ev.push({ who, lines, text, type0: tt, at: tt + 0.35 + text.length * 0.035 }); tt += 0.35 + text.length * 0.035 + 0.9; }
  }
  const PERIOD = tt + 2.2;
  const TOP = 3, BOT = H - 5;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 1, "●", "2"); g.text(4, 1, "Maya Chen", "0"); g.text(14, 1, "· online", "1");
    g.text(W - 13, 1, "#deploys", "6");
    g.hline(1, W - 2, 2, "─", "8");
    // build visible bubbles bottom-up
    const items = [];
    let typing = null, composing = null;
    for (const e of ev) {
      if (e.at <= lt) items.push({ who: e.who, lines: e.lines, fresh: lt - e.at < 0.25 });
      else if (lt >= e.type0) { if (e.who === 0) typing = true; else composing = e; break; }
      else break;
    }
    if (typing) items.push({ who: 0, dots: true });
    let y = BOT;
    for (let i = items.length - 1; i >= 0 && y > TOP; i--) {
      const it = items[i];
      const lines = it.dots ? ["   "] : it.lines;
      const w = it.dots ? 9 : Math.max(...lines.map((l) => l.length)) + 4;
      const h = lines.length + 2;
      const top = y - h + 1;
      if (top < TOP) break; // only whole bubbles: older ones have scrolled away
      const x = it.who === 0 ? 2 : W - 2 - w;
      const bc = it.who === 0 ? "7" : "9";
      for (let r = 0; r < h; r++) {
        const yy = top + r;
        if (yy <= TOP - 1) continue;
        if (r === 0 || r === h - 1) {
          for (let k = 0; k < w; k++) g.set(x + k, yy, k === 0 ? (r ? "╰" : "╭") : k === w - 1 ? (r ? "╯" : "╮") : "─", bc);
        } else {
          g.set(x, yy, "│", bc); g.set(x + w - 1, yy, "│", bc);
          if (it.dots) {
            for (let d = 0; d < 3; d++) { const ph = Math.sin(lt * 8 - d * 0.9); g.set(x + 2 + d * 2, yy, ph > 0.3 ? "●" : ph > -0.4 ? "•" : "·", ph > 0.3 ? "0" : "1"); }
          } else g.text(x + 2, yy, lines[r - 1], it.who === 0 ? "0" : "a");
        }
      }
      y = top - 1;
    }
    const lastMe = items.length && items[items.length - 1].who === 1 && !items[items.length - 1].dots;
    if (lastMe) g.text(W - 12, BOT + 1, "Seen ✓✓", "3");
    // composer
    g.box(1, H - 4, W - 2, 3, composing ? "heavy" : "round", composing ? "3" : "7");
    if (composing) {
      const n = Math.max(0, Math.min(composing.text.length, Math.floor((lt - composing.type0 - 0.2) / 0.035)));
      const s = composing.text.slice(0, n);
      const vis = s.slice(Math.max(0, s.length - (W - 14)));
      g.text(3, H - 3, vis, "0");
      if (Math.floor(lt * 3) % 2 === 0) g.set(3 + vis.length, H - 3, "█", "3");
      g.text(W - 9, H - 3, "Send →", "3");
    } else {
      g.text(3, H - 3, "Message Maya...", "7");
      g.text(W - 9, H - 3, "Send →", "7");
    }
    return g.frame();
  };
}
